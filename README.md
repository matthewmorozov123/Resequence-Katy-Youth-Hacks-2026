# ↪ Resequence

Learn from today. Improve tomorrow.

🔗 **Live app:** [resequence-katy-youth-hacks-2026.vercel.app](https://resequence-katy-youth-hacks-2026.vercel.app)

![Resequence preview](public/og.png)

Resequence is an evidence-aware daily reflection coach. It combines the priorities a user chooses, the activities they record, the progress they report, and the productivity challenge they want to change. The result is a transparent debrief with practical suggestions—not another generic routine or an AI-generated schedule that ignores real commitments.

Built for [Katy Youth Hacks 2026](https://katy-youth-hacks-2026.devpost.com/).

---

## Highlights

- 🎯 **User-defined productivity** — users choose their priorities and rate importance and difficulty; AI never decides what should count as meaningful work.
- 🧭 **Personalized first-time setup** — the user identifies a main productivity challenge and describes the change they want to make.
- ⚡ **Natural-language Quick Capture** — a sentence containing an activity, time, and duration becomes a clean timeline entry.
- ↕️ **Editable activity timeline** — rename activities, change durations, connect them to priorities, and swap their positions without changing unrelated activity times.
- 📊 **Honest outcome tracking** — completion percentages give partial progress credit instead of reducing the day to completed or incomplete.
- 📚 **User-controlled evidence library** — every source includes supported claims, unsupported claims, limitations, and testable experiments; each source can be enabled or disabled.
- 🧠 **Structured AI debrief** — explains what worked, identifies possible friction, proposes one experiment, and returns three flexible suggestions with evidence links.
- 🛡️ **Guarded recommendations** — the AI cannot cite disabled sources, invent tomorrow's commitments, diagnose the user, or claim that one day proves causation.
- 💾 **Browser-local history** — profiles, tasks, timelines, source preferences, and analyses persist on the device without an account or database.
- 🌙 **Demo-ready interface** — responsive layout, dark mode, wake and sleep boundaries, dated daily records, and a one-click sample day.

## The problem

Most productivity advice starts with a universal rule: avoid your phone in the morning, complete the hardest task first, or follow a fixed focus-to-break ratio. Those rules ignore context. A phone session may be intentional, a difficult task may fit better later in the day, and tomorrow may contain commitments the app cannot see.

At the same time, a simple to-do list records what was planned but rarely explains what actually happened between intention and completion. Resequence connects those two views while keeping the user's definition of success in control.

## How Resequence helps

- **Starts with the person.** The user's challenge and desired change guide the analysis.
- **Separates plans from behavior.** Priorities describe what mattered; the timeline records what happened.
- **Counts partial progress.** Outcomes are weighted by the importance and difficulty values selected by the user.
- **Uses AI as an interpreter.** Deterministic code calculates the metrics; AI explains patterns without replacing those facts.
- **Makes research inspectable.** Every cited source is visible, linked, limited, and controlled by the user.
- **Suggests instead of scheduling.** Tomorrow's guidance uses flexible event-based anchors and never writes over an unknown calendar.

---

## Product flow

### First-time setup

The user enters a name, selects a main productivity challenge, and explains what they want to change. The profile remains editable from the avatar menu.

### 1. Priorities

The user defines the tasks that would make the day meaningful and rates each task's importance and difficulty. A demo button can load a complete sample task list and activity timeline.

### 2. Map your day

Quick Capture extracts an activity name, start time, and duration from natural language. Timeline entries can be renamed, resized, connected to a priority, or swapped with another activity. Wake and sleep times establish the day's boundaries.

### 3. Outcomes

The user reports a completion percentage or marks a priority finished. Resequence calculates weighted progress from the user's own importance, difficulty, and completion values.

### 4. Resequence

Before analysis, the user can inspect the evidence library and decide which sources the AI may use. The final debrief contains:

- a short summary of the day;
- one observed strength;
- one possible source of friction;
- one small, measurable experiment; and
- three flexible suggestions for tomorrow, each with an event-based anchor, success measure, confidence level, and source links.

## Why this is not a thin AI wrapper

| Layer | Responsibility |
| --- | --- |
| User | Defines priorities, importance, difficulty, outcomes, personal challenge, and enabled sources |
| TypeScript | Calculates weighted task progress, priority-linked minutes, context switches, awake time, and the day score |
| Evidence library | Limits which claims and experiments may be connected to the user's day |
| OpenAI | Interprets the supplied facts and returns a validated structured debrief |
| Server validation | Filters citations to enabled source IDs, enforces the response shape, and rejects unusable AI output |
| Local fallback | Keeps Quick Capture and day analysis functional when the AI service or key is unavailable |

Changing the timeline, outcomes, profile target, or enabled sources invalidates the previous analysis. This prevents an old explanation from being displayed as if it still matched the current day.

## Evidence library

The MVP uses a curated library rather than unrestricted live web research. Each record stores what the evidence may support, what it cannot justify, important limitations, and small experiments that can reasonably be tested.

| Topic | Evidence |
| --- | --- |
| Interruptions and resumption | [Guo et al. (2021), systematic review and meta-analysis](https://pubmed.ncbi.nlm.nih.gov/34273814/) |
| If–then plans for young people | [Breitwieser & Reinelt (2026), systematic review and meta-analysis](https://pubmed.ncbi.nlm.nih.gov/41784001/) |
| Task-switching costs | [Monsell (2003), research review](https://pubmed.ncbi.nlm.nih.gov/12639695/) |
| Phone notifications and attention | [Stothart et al. (2015), controlled experiment](https://pubmed.ncbi.nlm.nih.gov/26121498/) |
| Adding friction to screen time | [Hoong (2023), preregistered field experiment](https://pubmed.ncbi.nlm.nih.gov/36577008/) |
| Procrastination and task initiation | [Steel (2007), meta-analytic review](https://pubmed.ncbi.nlm.nih.gov/17201571/) |
| Micro-breaks, fatigue, and performance | [Albulescu et al. (2022), systematic review and meta-analysis](https://pubmed.ncbi.nlm.nih.gov/36044424/) |
| Exercise and adolescent cognition | [Li et al. (2017), systematic review](https://pubmed.ncbi.nlm.nih.gov/28185806/) |
| Teen sleep duration | [American Academy of Sleep Medicine (2016), consensus recommendation](https://aasm.org/advocacy/position-statements/teen-sleep-duration-health-advisory/) |
| Chronotype and adolescent performance | [Vidueira et al. (2023), scoping review](https://pubmed.ncbi.nlm.nih.gov/37781788/) |

An enabled source is not treated as universal truth. Resequence still carries its population, confidence, and limitations into the prompt, and the interface labels advice as evidence-informed rather than proven for the individual user.

---

## Technology

| Layer | Choice |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, and custom responsive CSS |
| Daily analysis | OpenAI Responses API with `gpt-5.6-terra` and strict structured output |
| Quick Capture | OpenAI Responses API with `gpt-5.6-luna` and a deterministic parser fallback |
| Persistence | Browser `localStorage`; no account or database required for the MVP |
| Hosting | Vercel with a server-side environment variable |

## Run locally

Requirements: Node.js 22.13 or newer.

```bash
git clone https://github.com/matthewmorozov123/Resequence-Katy-Youth-Hacks-2026.git
cd Resequence-Katy-Youth-Hacks-2026
npm install
```

Copy `.env.example` to `.env.local`, then add an OpenAI API key:

```bash
OPENAI_API_KEY=your_key_here
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Never commit `.env`, `.env.local`, or a real API key.

The interface and deterministic fallbacks work without an API key. The key enables AI-cleaned Quick Capture names and personalized AI analysis.

## Deploy on Vercel

Import the repository into Vercel and add one server-side environment variable:

```bash
OPENAI_API_KEY=your_key_here
```

Do not prefix the key with `NEXT_PUBLIC_`; it must remain available only to server routes.

## Validation

```bash
npm run lint
npm run build
```

## Project structure

```text
app/
  api/analyze-day/route.ts    Evidence-constrained structured day analysis
  api/quick-capture/route.ts  Natural-language activity extraction and fallback
  globals.css                 Responsive light and dark themes
  icon.tsx                    Generated browser-tab icon
  layout.tsx                  Metadata and application shell
  page.tsx                    Four-step client experience and local persistence
public/
  og.png                      Social preview image
```

## Privacy and limitations

- Daily records and profile settings are stored in the browser, not in an application database.
- A Quick Capture note is sent to OpenAI only when Quick Capture is used.
- The current profile target, tasks, activities, time boundaries, calculated metrics, and enabled evidence are sent when the user requests AI analysis.
- One recorded day can reveal patterns worth testing, but it cannot establish why an outcome happened.
- Resequence is a reflection coach, not a medical, psychological, or educational diagnosis tool.
- Suggestions do not replace a calendar and should be fitted around commitments the app cannot see.
