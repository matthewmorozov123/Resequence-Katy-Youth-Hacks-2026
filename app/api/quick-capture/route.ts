import OpenAI from "openai";
import { NextResponse } from "next/server";

type CapturedActivity = { title: string; start: string; end: string };
type ParsedCapture = {
  has_time: boolean;
  title: string;
  start: string;
  duration_minutes: number;
};

function clockMinutes(hourText: string, minuteText = "0", meridiem?: string) {
  let hour = Number(hourText);
  const minute = Number(minuteText);
  const suffix = meridiem?.toLowerCase();
  if (suffix === "pm" && hour < 12) hour += 12;
  if (suffix === "am" && hour === 12) hour = 0;
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

function timeFromMinutes(value: number) {
  const hour = Math.floor(value / 60);
  const minute = value % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function cleanTitle(note: string) {
  let title = note
    .replace(/(?:from\s+)?\b\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*(?:-|–|—|to|until)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/gi, " ")
    .replace(/\b(?:at|around|by|starting(?:\s+at)?|started(?:\s+at)?)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/gi, " ")
    .replace(/^\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi, " ")
    .replace(/\bfor\s+(?:half\s+an?|an?|one)\s+hours?\b/gi, " ")
    .replace(/\b(?:for\s+)?(?:a\s+)?\d+(?:\.\d+)?\s*(?:hours?|hrs?|minutes?|mins?)\b/gi, " ")
    .replace(/[,.!?;]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  title = title
    .replace(/^i\s+(?:was\s+)?/i, "")
    .replace(/^went\s+to\s+/i, "")
    .replace(/^went\s+(?:out\s+)?(?:for\s+)?(?:a\s+)?/i, "")
    .replace(/^(?:did|spent time|started|finished)\s+/i, "")
    .replace(/^worked\s+on\s+/i, "")
    .replace(/^my\s+/i, "")
    .replace(/^a\s+/i, "")
    .trim();

  if (!title) return "Activity";
  return title.charAt(0).toUpperCase() + title.slice(1);
}

function parseLocally(note: string): ParsedCapture {
  const range = note.match(/(?:from\s+)?\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|–|—|to|until)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  const single = note.match(/(?:\b(?:at|around|by|starting(?:\s+at)?|started(?:\s+at)?)\s+|^\s*)(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  const durationMatch = note.match(/\b(?:for\s+)?(?:a\s+)?(\d+(?:\.\d+)?)\s*(hours?|hrs?|minutes?|mins?)\b/i);
  const wordDuration = note.match(/\bfor\s+(half\s+an?|an?|one)\s+hours?\b/i);
  let start: number | null = null;
  let length = 30;

  if (range) {
    const sharedSuffix = range[6] || range[3];
    start = clockMinutes(range[1], range[2], range[3] || sharedSuffix);
    let finish = clockMinutes(range[4], range[5], range[6] || sharedSuffix);
    if (start !== null && finish !== null) {
      if (finish <= start) finish += 24 * 60;
      length = finish - start;
    }
  } else if (single) {
    start = clockMinutes(single[1], single[2], single[3]);
  }

  if (!range && durationMatch) {
    const amount = Number(durationMatch[1]);
    length = Math.round(amount * (/^h/i.test(durationMatch[2]) ? 60 : 1));
  } else if (!range && wordDuration) {
    length = /^half/i.test(wordDuration[1]) ? 30 : 60;
  }

  const title = cleanTitle(note);
  return {
    has_time: start !== null,
    title,
    start: start === null ? "" : timeFromMinutes(start),
    duration_minutes: Math.min(480, Math.max(5, length)),
  };
}

function normalizeCapture(parsed: ParsedCapture): CapturedActivity | null {
  if (!parsed.has_time || !/^\d{2}:\d{2}$/.test(parsed.start)) return null;
  const [hour, minute] = parsed.start.split(":").map(Number);
  const length = Math.round(Number(parsed.duration_minutes));
  if (hour > 23 || minute > 59 || length < 5 || length > 480) return null;
  const startMinutes = hour * 60 + minute;
  return {
    title: parsed.title.trim().slice(0, 80) || "Activity",
    start: parsed.start,
    end: timeFromMinutes(startMinutes + length),
  };
}

async function parseWithAI(note: string) {
  if (!process.env.OPENAI_API_KEY) return null;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 8_000, maxRetries: 0 });
  const response = await client.responses.create({
    model: "gpt-5.6-luna",
    store: false,
    reasoning: { effort: "none" },
    max_output_tokens: 250,
    input: [
      {
        role: "system",
        content:
          "Extract exactly one completed activity from a quick note. Only use a time explicitly written by the user. " +
          "Return a short, clean activity name containing only what they did—remove time, duration, filler, and commentary. " +
          "Use 24-hour HH:MM time. Infer a reasonable duration only when the user did not state one. " +
          "Do not judge its productivity or assign it to a category or task.",
      },
      { role: "user", content: note },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "activity_capture",
        strict: true,
        schema: {
          type: "object",
          properties: {
            has_time: { type: "boolean" },
            title: { type: "string" },
            start: { type: "string" },
            duration_minutes: { type: "integer", minimum: 5, maximum: 480 },
          },
          required: ["has_time", "title", "start", "duration_minutes"],
          additionalProperties: false,
        },
      },
    },
  });
  return JSON.parse(response.output_text) as ParsedCapture;
}

export async function POST(request: Request) {
  let note = "";
  try {
    const body = (await request.json()) as { note?: unknown };
    note = typeof body.note === "string" ? body.note.trim() : "";
  } catch {
    return NextResponse.json({ error: "Send a valid quick-capture note." }, { status: 400 });
  }
  if (!note || note.length > 500) {
    return NextResponse.json({ error: "Enter a note between 1 and 500 characters." }, { status: 400 });
  }

  let parsed: ParsedCapture | null = null;
  let usedAI = false;
  try {
    parsed = await parseWithAI(note);
    usedAI = parsed !== null;
  } catch {
    // A temporary AI error should not make quick capture unusable.
  }

  let activity = parsed ? normalizeCapture(parsed) : null;
  if (!activity) {
    usedAI = false;
    parsed = parseLocally(note);
    activity = normalizeCapture(parsed);
  }
  if (!activity) {
    return NextResponse.json(
      { error: "Include a start time and duration, like “at 3:15 PM for 45 minutes,” or a full range like “from 8:30 to 9:15.”" },
      { status: 422 },
    );
  }
  return NextResponse.json({ activity, usedAI });
}
