import OpenAI from "openai";
import { NextResponse } from "next/server";

type ActivityKind = "focus" | "digital" | "movement" | "routine" | "rest";
type Confidence = "High" | "Moderate" | "Exploratory";

type TaskInput = {
  id: number;
  title: string;
  importance: number;
  difficulty: number;
  completion: number;
};

type ActivityInput = {
  id: number;
  title: string;
  start: string;
  end: string;
  kind: ActivityKind;
  taskId: number | null;
};

type AnalyzeInput = {
  date: string;
  profile: { challenge: string; desiredChange: string };
  tasks: TaskInput[];
  activities: ActivityInput[];
  wakeTime: string;
  sleepTime: string;
  enabledSourceIds: number[];
};

type AnalysisInsight = {
  title: string;
  explanation: string;
  sourceIds: number[];
  confidence: Confidence;
};

type TomorrowPlanItem = {
  time: string;
  title: string;
  note: string;
  kind: ActivityKind;
  durationMinutes: number;
  relatedTaskId: number | null;
};

type DayAnalysis = {
  headline: string;
  summary: string;
  worked: AnalysisInsight & { observation: string };
  friction: AnalysisInsight;
  experiment: AnalysisInsight & { ifThenPlan: string };
  changes: { title: string; reason: string }[];
  tomorrowIntro: string;
  tomorrowPlan: TomorrowPlanItem[];
  caveat: string;
};

type EvidenceForAnalysis = {
  id: number;
  title: string;
  evidenceType: string;
  summary: string;
  supportedClaims: string[];
  limitations: string;
};

const activityKinds: ActivityKind[] = ["focus", "digital", "movement", "routine", "rest"];

const analysisSources: EvidenceForAnalysis[] = [
  {
    id: 1,
    title: "Reducing interruption costs",
    evidenceType: "Systematic review and meta-analysis",
    summary: "Interruption-management strategies improved primary-task accuracy and shortened resumption time in laboratory studies.",
    supportedClaims: ["Interruptions can create a resumption cost.", "A deliberate resumption strategy may make returning easier."],
    limitations: "Laboratory evidence; effects varied by intervention and task type.",
  },
  {
    id: 2,
    title: "If-then plans for young people",
    evidenceType: "Systematic review and meta-analysis",
    summary: "Specific if-then plans produced a small-to-medium improvement in goal achievement across youth studies.",
    supportedClaims: ["A visible cue linked to a specific action can support follow-through.", "The user should help create the plan."],
    limitations: "Effects were heterogeneous and many participants were younger than teen users.",
  },
  {
    id: 3,
    title: "The cost of task switching",
    evidenceType: "Research review",
    summary: "People were usually slower and more error-prone immediately after switching tasks; preparation reduced but did not eliminate the cost.",
    supportedClaims: ["Frequent changes between unlike tasks may add transition costs.", "Grouping similar activities is a reasonable experiment."],
    limitations: "Older review of mostly simple laboratory tasks.",
  },
  {
    id: 4,
    title: "Notifications interrupt attention",
    evidenceType: "Controlled experiment",
    summary: "Phone notifications disrupted an attention-demanding task even when participants did not open the phone.",
    supportedClaims: ["Notifications can consume attention without being opened.", "Muting nonessential notifications for one focus block is a reasonable experiment."],
    limitations: "One experiment in young adults; effects depend on person, task, and context.",
  },
  {
    id: 5,
    title: "Adding friction to screen time",
    evidenceType: "Preregistered field experiment",
    summary: "Grayscale reduced measured screen time; self-set limits produced a smaller gradual reduction.",
    supportedClaims: ["Small design barriers can reduce screen time for some users.", "A self-chosen time limit can be tested without treating all phone use as bad."],
    limitations: "No immediate causal improvement in well-being or academic performance was found.",
  },
  {
    id: 6,
    title: "Why procrastination happens",
    evidenceType: "Meta-analytic review",
    summary: "Task aversiveness, delayed rewards, low self-efficacy, impulsiveness, and distractibility were consistent predictors of procrastination.",
    supportedClaims: ["An unpleasant, distant, or unclear task can be harder to begin.", "A smaller and more immediate first action is a reasonable experiment."],
    limitations: "Many relationships were correlational and are not an individual diagnosis.",
  },
  {
    id: 7,
    title: "What micro-breaks actually do",
    evidenceType: "Systematic review and meta-analysis",
    summary: "Micro-breaks produced small improvements in vigor and fatigue but did not reliably improve overall performance.",
    supportedClaims: ["A short break may help fatigue or vigor.", "Break usefulness depends on the task, break length, and person."],
    limitations: "The overall performance effect was not statistically significant.",
  },
  {
    id: 8,
    title: "Exercise and adolescent cognition",
    evidenceType: "Systematic review",
    summary: "Exercise showed promising effects on some adolescent cognitive and academic outcomes, but evidence was small and inconsistent.",
    supportedClaims: ["Movement may be tested as a transition or recovery activity.", "The user should judge whether movement helped the next block."],
    limitations: "Evidence was insufficient for a universal activity type, duration, or timing.",
  },
  {
    id: 9,
    title: "Teen sleep duration guidance",
    evidenceType: "Expert consensus recommendation",
    summary: "Teenagers should generally sleep eight to ten hours per day to support health and alertness.",
    supportedClaims: ["A teen plan should protect an eight-to-ten-hour sleep opportunity.", "Insufficient sleep can be associated with attention, behavior, and learning problems."],
    limitations: "Population-level guidance, not a personalized productivity estimate or medical assessment.",
  },
  {
    id: 10,
    title: "Chronotype and adolescent performance",
    evidenceType: "Scoping review",
    summary: "Adolescent cognitive performance was often better at a preferred time of day, but results varied.",
    supportedClaims: ["There is no universally best hour for difficult work.", "Repeated personal patterns should guide timing more than a generic morning rule."],
    limitations: "Heterogeneous and often observational evidence; timing advice should remain tentative.",
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function cleanText(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maximum) : "";
}

function clampInteger(value: unknown, minimum: number, maximum: number, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(maximum, Math.max(minimum, Math.round(number))) : fallback;
}

function clockMinutes(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) return null;
  const [hour, minute] = value.split(":").map(Number);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

function timeFromMinutes(value: number) {
  const safe = Math.max(0, Math.min(1439, Math.round(value)));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

function durationMinutes(start: string, end: string) {
  const startValue = clockMinutes(start);
  const endValue = clockMinutes(end);
  if (startValue === null || endValue === null) return 0;
  return Math.max(0, endValue - startValue);
}

function parseInput(body: unknown): AnalyzeInput | null {
  if (!isRecord(body) || !isRecord(body.profile)) return null;
  const rawTasks = Array.isArray(body.tasks) ? body.tasks.slice(0, 25) : [];
  const rawActivities = Array.isArray(body.activities) ? body.activities.slice(0, 80) : [];
  const tasks: TaskInput[] = rawTasks.flatMap((value) => {
    if (!isRecord(value)) return [];
    const title = cleanText(value.title, 100);
    const id = Number(value.id);
    if (!title || !Number.isSafeInteger(id)) return [];
    return [{
      id,
      title,
      importance: clampInteger(value.importance, 1, 5, 3),
      difficulty: clampInteger(value.difficulty, 1, 5, 3),
      completion: clampInteger(value.completion, 0, 100, 0),
    }];
  });
  if (!tasks.length) return null;

  const activities: ActivityInput[] = rawActivities.flatMap((value) => {
    if (!isRecord(value)) return [];
    const title = cleanText(value.title, 100);
    const start = cleanText(value.start, 5);
    const end = cleanText(value.end, 5);
    const kind = activityKinds.includes(value.kind as ActivityKind) ? value.kind as ActivityKind : null;
    const id = Number(value.id);
    if (!title || !kind || !Number.isSafeInteger(id) || clockMinutes(start) === null || clockMinutes(end) === null) return [];
    const rawTaskId = value.taskId;
    const taskId = Number.isSafeInteger(Number(rawTaskId)) && tasks.some((task) => task.id === Number(rawTaskId)) ? Number(rawTaskId) : null;
    return [{ id, title, start, end, kind, taskId }];
  }).sort((a, b) => a.start.localeCompare(b.start));

  const enabledSourceIds = (Array.isArray(body.enabledSourceIds) ? body.enabledSourceIds : [])
    .map(Number)
    .filter((id, index, ids) => Number.isInteger(id) && analysisSources.some((source) => source.id === id) && ids.indexOf(id) === index);
  const wakeTime = cleanText(body.wakeTime, 5);
  const sleepTime = cleanText(body.sleepTime, 5);
  return {
    date: /^\d{4}-\d{2}-\d{2}$/.test(String(body.date)) ? String(body.date) : "",
    profile: {
      challenge: cleanText(body.profile.challenge, 160) || "Building a more productive routine",
      desiredChange: cleanText(body.profile.desiredChange, 320) || "Make tomorrow easier to follow through on",
    },
    tasks,
    activities,
    wakeTime: clockMinutes(wakeTime) === null ? "07:00" : wakeTime,
    sleepTime: clockMinutes(sleepTime) === null ? "23:00" : sleepTime,
    enabledSourceIds,
  };
}

function calculateFacts(input: AnalyzeInput) {
  const totalWeight = input.tasks.reduce((sum, task) => sum + task.importance * task.difficulty, 0);
  const completedWeight = input.tasks.reduce((sum, task) => sum + task.importance * task.difficulty * task.completion / 100, 0);
  const weightedTaskScore = totalWeight ? Math.round(completedWeight / totalWeight * 100) : 0;
  const taskIds = new Set(input.tasks.map((task) => task.id));
  const priorityMinutes = input.activities
    .filter((activity) => activity.taskId !== null && taskIds.has(activity.taskId))
    .reduce((sum, activity) => sum + durationMinutes(activity.start, activity.end), 0);
  const contextSwitches = input.activities.reduce((count, activity, index) => {
    if (!index) return count;
    return count + (activity.kind !== input.activities[index - 1].kind ? 1 : 0);
  }, 0);
  const digitalMinutes = input.activities
    .filter((activity) => activity.kind === "digital")
    .reduce((sum, activity) => sum + durationMinutes(activity.start, activity.end), 0);
  const wake = clockMinutes(input.wakeTime) ?? 420;
  let sleep = clockMinutes(input.sleepTime) ?? 1380;
  if (sleep <= wake) sleep += 1440;
  const awakeMinutes = sleep - wake;
  const dayScore = Math.max(0, Math.min(100, Math.round(weightedTaskScore * .8 + Math.max(30, 100 - contextSwitches * 8) * .2)));
  return { weightedTaskScore, priorityMinutes, contextSwitches, digitalMinutes, awakeMinutes, dayScore };
}

function enabledEvidence(input: AnalyzeInput) {
  const enabled = new Set(input.enabledSourceIds);
  return analysisSources.filter((source) => enabled.has(source.id));
}

function availableSources(input: AnalyzeInput, preferred: number[]) {
  return preferred.filter((id) => input.enabledSourceIds.includes(id)).slice(0, 2);
}

function fallbackPlan(input: AnalyzeInput): TomorrowPlanItem[] {
  const unfinished = [...input.tasks]
    .filter((task) => task.completion < 100)
    .sort((a, b) => b.importance * b.difficulty - a.importance * a.difficulty);
  const wake = clockMinutes(input.wakeTime) ?? 420;
  const longestFocus = [...input.activities]
    .filter((activity) => activity.kind === "focus")
    .sort((a, b) => durationMinutes(b.start, b.end) - durationMinutes(a.start, a.end))[0];
  const observedFocus = longestFocus ? clockMinutes(longestFocus.start) : null;
  const focusStart = Math.max(wake + 60, observedFocus ?? wake + 60);
  const firstTask = unfinished[0];
  const secondTask = unfinished[1];
  const plan: TomorrowPlanItem[] = [
    {
      time: timeFromMinutes(wake),
      title: "Morning routine",
      note: "Keep the start realistic and leave room to wake up",
      kind: "routine",
      durationMinutes: 30,
      relatedTaskId: null,
    },
    {
      time: timeFromMinutes(focusStart),
      title: firstTask?.title || "Highest-impact priority",
      note: longestFocus ? "Placed near your longest observed focus window" : "A testable focus window—not a universal best time",
      kind: "focus",
      durationMinutes: 50,
      relatedTaskId: firstTask?.id ?? null,
    },
    {
      time: timeFromMinutes(focusStart + 50),
      title: "Intentional reset",
      note: "Take a short break with a clear return cue",
      kind: "rest",
      durationMinutes: 10,
      relatedTaskId: null,
    },
    {
      time: timeFromMinutes(focusStart + 60),
      title: "Messages + phone window",
      note: "Keep useful digital activity in a defined window",
      kind: "digital",
      durationMinutes: 20,
      relatedTaskId: null,
    },
    {
      time: timeFromMinutes(focusStart + 90),
      title: secondTask?.title || "Second priority block",
      note: "Begin with one concrete next action",
      kind: "focus",
      durationMinutes: 45,
      relatedTaskId: secondTask?.id ?? null,
    },
  ];
  return plan.filter((item) => (clockMinutes(item.time) ?? 1440) + item.durationMinutes < 1440);
}

function fallbackAnalysis(input: AnalyzeInput): DayAnalysis {
  const facts = calculateFacts(input);
  const unfinished = [...input.tasks]
    .filter((task) => task.completion < 100)
    .sort((a, b) => b.importance * b.difficulty - a.importance * a.difficulty);
  const topTask = unfinished[0] ?? [...input.tasks].sort((a, b) => b.importance * b.difficulty - a.importance * a.difficulty)[0];
  const phoneChallenge = /phone|screen|social|scroll/i.test(`${input.profile.challenge} ${input.profile.desiredChange}`);
  const switchingChallenge = /switch|interrupt|multitask/i.test(`${input.profile.challenge} ${input.profile.desiredChange}`);
  const startingChallenge = /start|procrast|overwhelm|finish|follow/i.test(`${input.profile.challenge} ${input.profile.desiredChange}`);
  const sleepChallenge = /sleep|wake|tired/i.test(`${input.profile.challenge} ${input.profile.desiredChange}`);
  const frictionSources = phoneChallenge
    ? availableSources(input, [4, 5, 1])
    : switchingChallenge || facts.contextSwitches >= 4
      ? availableSources(input, [3, 1])
      : startingChallenge
        ? availableSources(input, [6, 2])
        : availableSources(input, [1, 3]);
  const experimentSources = sleepChallenge
    ? availableSources(input, [9, 10])
    : phoneChallenge
      ? availableSources(input, [2, 4, 5])
      : availableSources(input, [2, 6, 7]);
  const completed = input.tasks.filter((task) => task.completion === 100).length;
  const observation = completed
    ? `${completed} ${completed === 1 ? "priority was" : "priorities were"} completed`
    : `${facts.weightedTaskScore}% of weighted priority value was completed`;

  return {
    headline: facts.weightedTaskScore >= 70 ? "Good progress. One useful shift." : "An honest day. One clearer next step.",
    summary: `You completed ${facts.weightedTaskScore}% of your weighted priority value and recorded ${facts.priorityMinutes} minutes connected to priorities. The next plan focuses on ${input.profile.desiredChange.toLowerCase()}.`,
    worked: {
      title: completed ? "You closed the loop on meaningful work." : "You recorded enough detail to improve the sequence.",
      explanation: completed
        ? `Your reported outcomes show concrete progress, including work connected to ${topTask?.title || "your priorities"}.`
        : "An incomplete task is still useful evidence. The timeline shows where work happened and where tomorrow can become easier to begin.",
      observation,
      sourceIds: [],
      confidence: "High",
    },
    friction: {
      title: phoneChallenge ? "The phone boundary may be too easy to cross." : facts.contextSwitches >= 4 ? "The day crossed several task boundaries." : "The first action may still be too vague.",
      explanation: phoneChallenge
        ? `You identified phone use as the behavior you want to change. Treat it as a design problem: preserve useful phone time while testing a clearer stopping cue before ${topTask?.title || "the next priority"}.`
        : facts.contextSwitches >= 4
          ? `Your timeline contained ${facts.contextSwitches} changes between activity types. That does not make those activities bad, but repeated transitions are a reasonable place to test a simpler order.`
          : `The highest-weight unfinished priority is ${topTask?.title || "your next task"}. A smaller visible starting action may make the gap between intending and beginning easier to cross.`,
      sourceIds: frictionSources,
      confidence: frictionSources.length ? "Moderate" : "Exploratory",
    },
    experiment: {
      title: sleepChallenge ? "Protect the sleep window first." : phoneChallenge ? "Give the phone window a visible ending." : "Make one clean start automatic.",
      explanation: sleepChallenge
        ? "Keep tomorrow's optional work inside the awake window and judge the sequence across several days rather than sacrificing sleep for one score."
        : phoneChallenge
          ? "Use the phone intentionally, then follow a timer with one predefined return action. The return action—not willpower—is the experiment."
          : "Choose one reliable cue and attach it to the smallest concrete action for the highest-impact unfinished priority.",
      ifThenPlan: sleepChallenge
        ? `If it is ${input.sleepTime}, then I will stop optional work and begin my sleep routine.`
        : phoneChallenge
          ? `If my planned phone timer ends, then I will put it down and open ${topTask?.title || "my next priority"}.`
          : `If my planned focus time begins, then I will spend five minutes on the first step of ${topTask?.title || "my highest-impact priority"}.`,
      sourceIds: experimentSources,
      confidence: experimentSources.length ? "Moderate" : "Exploratory",
    },
    changes: [
      { title: "Protect one clean start", reason: `Give ${topTask?.title || "the top priority"} a visible cue and a concrete first action.` },
      { title: "Use a defined transition", reason: phoneChallenge ? "End planned phone time with a specific return action." : "Leave a short note before switching so returning requires less reconstruction." },
    ],
    tomorrowIntro: "This sequence changes only a few boundaries. Keep what already fits, test one behavior, and adjust the timing after observing the result.",
    tomorrowPlan: fallbackPlan(input),
    caveat: "Insights describe observed patterns and evidence-informed hypotheses. They do not prove what caused productivity, diagnose a condition, or replace medical advice.",
  };
}

const responseSchema = {
  type: "object",
  properties: {
    headline: { type: "string" },
    summary: { type: "string" },
    worked: {
      type: "object",
      properties: {
        title: { type: "string" },
        explanation: { type: "string" },
        observation: { type: "string" },
        sourceIds: { type: "array", items: { type: "integer" }, maxItems: 3 },
        confidence: { type: "string", enum: ["High", "Moderate", "Exploratory"] },
      },
      required: ["title", "explanation", "observation", "sourceIds", "confidence"],
      additionalProperties: false,
    },
    friction: {
      type: "object",
      properties: {
        title: { type: "string" },
        explanation: { type: "string" },
        sourceIds: { type: "array", items: { type: "integer" }, maxItems: 3 },
        confidence: { type: "string", enum: ["High", "Moderate", "Exploratory"] },
      },
      required: ["title", "explanation", "sourceIds", "confidence"],
      additionalProperties: false,
    },
    experiment: {
      type: "object",
      properties: {
        title: { type: "string" },
        explanation: { type: "string" },
        ifThenPlan: { type: "string" },
        sourceIds: { type: "array", items: { type: "integer" }, maxItems: 3 },
        confidence: { type: "string", enum: ["High", "Moderate", "Exploratory"] },
      },
      required: ["title", "explanation", "ifThenPlan", "sourceIds", "confidence"],
      additionalProperties: false,
    },
    changes: {
      type: "array",
      minItems: 2,
      maxItems: 2,
      items: {
        type: "object",
        properties: { title: { type: "string" }, reason: { type: "string" } },
        required: ["title", "reason"],
        additionalProperties: false,
      },
    },
    tomorrowIntro: { type: "string" },
    tomorrowPlan: {
      type: "array",
      minItems: 4,
      maxItems: 7,
      items: {
        type: "object",
        properties: {
          time: { type: "string" },
          title: { type: "string" },
          note: { type: "string" },
          kind: { type: "string", enum: activityKinds },
          durationMinutes: { type: "integer", minimum: 10, maximum: 120 },
          relatedTaskId: { type: ["integer", "null"] },
        },
        required: ["time", "title", "note", "kind", "durationMinutes", "relatedTaskId"],
        additionalProperties: false,
      },
    },
    caveat: { type: "string" },
  },
  required: ["headline", "summary", "worked", "friction", "experiment", "changes", "tomorrowIntro", "tomorrowPlan", "caveat"],
  additionalProperties: false,
} as const;

function normalizedSourceIds(value: unknown, input: AnalyzeInput) {
  if (!Array.isArray(value)) return [];
  return value.map(Number).filter((id, index, ids) => input.enabledSourceIds.includes(id) && ids.indexOf(id) === index).slice(0, 3);
}

function normalizeInsight(value: unknown, input: AnalyzeInput): AnalysisInsight | null {
  if (!isRecord(value)) return null;
  const title = cleanText(value.title, 110);
  const explanation = cleanText(value.explanation, 650);
  const confidence = ["High", "Moderate", "Exploratory"].includes(String(value.confidence)) ? value.confidence as Confidence : "Exploratory";
  if (!title || !explanation) return null;
  return { title, explanation, confidence, sourceIds: normalizedSourceIds(value.sourceIds, input) };
}

function normalizeAnalysis(value: unknown, input: AnalyzeInput): DayAnalysis | null {
  if (!isRecord(value)) return null;
  const workedBase = normalizeInsight(value.worked, input);
  const friction = normalizeInsight(value.friction, input);
  const experimentBase = normalizeInsight(value.experiment, input);
  if (!workedBase || !friction || !experimentBase || !isRecord(value.worked) || !isRecord(value.experiment)) return null;
  const observation = cleanText(value.worked.observation, 180);
  const ifThenPlan = cleanText(value.experiment.ifThenPlan, 260);
  const changes = Array.isArray(value.changes) ? value.changes.slice(0, 2).flatMap((item) => {
    if (!isRecord(item)) return [];
    const title = cleanText(item.title, 90);
    const reason = cleanText(item.reason, 240);
    return title && reason ? [{ title, reason }] : [];
  }) : [];
  const validTaskIds = new Set(input.tasks.filter((task) => task.completion < 100).map((task) => task.id));
  let previousEnd = -1;
  const tomorrowPlan = (Array.isArray(value.tomorrowPlan) ? value.tomorrowPlan : [])
    .flatMap((item) => {
      if (!isRecord(item)) return [];
      const originalStart = clockMinutes(cleanText(item.time, 5));
      const title = cleanText(item.title, 100);
      const note = cleanText(item.note, 260);
      const kind = activityKinds.includes(item.kind as ActivityKind) ? item.kind as ActivityKind : null;
      const itemDuration = clampInteger(item.durationMinutes, 10, 120, 30);
      if (originalStart === null || !title || !note || !kind) return [];
      const start = Math.max(originalStart, previousEnd);
      if (start + itemDuration >= 1440) return [];
      previousEnd = start + itemDuration;
      const relatedTaskId = validTaskIds.has(Number(item.relatedTaskId)) ? Number(item.relatedTaskId) : null;
      return [{ time: timeFromMinutes(start), title, note, kind, durationMinutes: itemDuration, relatedTaskId }];
    })
    .slice(0, 7);
  if (!observation || !ifThenPlan || changes.length !== 2 || tomorrowPlan.length < 4) return null;
  const headline = cleanText(value.headline, 120);
  const summary = cleanText(value.summary, 520);
  const tomorrowIntro = cleanText(value.tomorrowIntro, 420);
  const caveat = cleanText(value.caveat, 420);
  if (!headline || !summary || !tomorrowIntro || !caveat) return null;
  return {
    headline,
    summary,
    worked: { ...workedBase, observation },
    friction,
    experiment: { ...experimentBase, ifThenPlan },
    changes,
    tomorrowIntro,
    tomorrowPlan,
    caveat,
  };
}

async function analyzeWithAI(input: AnalyzeInput) {
  if (!process.env.OPENAI_API_KEY) return null;
  const facts = calculateFacts(input);
  const evidence = enabledEvidence(input);
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 20_000, maxRetries: 1 });
  const response = await client.responses.create({
    model: "gpt-5.6-terra",
    store: false,
    reasoning: { effort: "low" },
    max_output_tokens: 2400,
    input: [
      {
        role: "system",
        content:
          "You are Resequence, an evidence-aware daily reflection coach. Analyze only the supplied day. " +
          "Separate observations from hypotheses. Never diagnose, shame, moralize, or call an activity inherently good or bad. " +
          "Only cite source IDs present in ENABLED_EVIDENCE, and only make claims listed in supportedClaims. Never invent a study, statistic, or citation. " +
          "Treat source limitations seriously. Do not claim causation from one day. Do not recommend cold showers or a universal no-phone first hour. " +
          "Do not assume difficult work belongs in the morning; use observed timing when possible and label timing suggestions as experiments. " +
          "Protect the user's stated sleep window. Recommend one small, measurable experiment linked to the user's challenge and desired change. " +
          "The tomorrow plan must contain 4-7 non-overlapping items in chronological order using 24-hour HH:MM times. " +
          "Use only unfinished task IDs for relatedTaskId, otherwise null. Keep the plan realistic and editable. " +
          "The day score and metrics are deterministic facts; interpret them but do not recalculate or contradict them.",
      },
      {
        role: "user",
        content: JSON.stringify({
          profile: input.profile,
          date: input.date,
          wakeTime: input.wakeTime,
          sleepTime: input.sleepTime,
          tasks: input.tasks,
          activities: input.activities,
          deterministicFacts: facts,
          enabledEvidence: evidence,
        }),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "resequence_day_analysis",
        strict: true,
        schema: responseSchema,
      },
    },
  });
  const parsed = JSON.parse(response.output_text) as unknown;
  return normalizeAnalysis(parsed, input);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a valid day to analyze." }, { status: 400 });
  }
  const input = parseInput(body);
  if (!input) {
    return NextResponse.json({ error: "Add at least one valid priority before analyzing the day." }, { status: 400 });
  }

  try {
    const analysis = await analyzeWithAI(input);
    if (analysis) return NextResponse.json({ analysis, usedAI: true });
  } catch {
    // Keep the hackathon demo useful during a temporary provider or network failure.
  }
  return NextResponse.json({ analysis: fallbackAnalysis(input), usedAI: false });
}
