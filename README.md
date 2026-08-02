# Resequence

Resequence is an evidence-aware daily coach that helps people reconstruct their day, weigh the tasks that mattered, and design a better sequence for tomorrow.

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

Copy `.env.example` to `.env.local` and add an OpenAI API key to enable AI-cleaned Quick Capture names:

```bash
OPENAI_API_KEY=your_key_here
```

Keep this variable server-side; do not prefix it with `NEXT_PUBLIC_`. Quick Capture also has a local fallback, so the app remains usable while the key is unavailable.

## Production build

```bash
npm run build
npm start
```

The project is a standard Next.js app and can be imported directly into Vercel. Add `OPENAI_API_KEY` in the Vercel project's environment variables to enable AI-cleaned Quick Capture names. Timeline and task data still stay in the browser, so no database is required.

## MVP flow

1. Define that day's priorities, importance, and difficulty.
2. Map activities, choose their type, and optionally connect them to a priority; AI only cleans Quick Capture text and timing.
3. Report completion percentages or mark priorities finished.
4. Review transparent, evidence-aware observations and a resequenced plan for tomorrow.

The current productivity analysis is deterministic and uses a small curated evidence library. Quick Capture uses AI when configured, with a deterministic local fallback. A future version can add authenticated persistence without changing the scoring formula.
