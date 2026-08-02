# Resequence

Resequence is an evidence-aware daily coach that helps people reconstruct their day, weigh the tasks that mattered, and design a better sequence for tomorrow.

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Production build

```bash
npm run build
npm start
```

The project is a standard Next.js app and can be imported directly into Vercel. The current MVP stores timeline and task data in the browser, so it does not require a database or API keys.

## MVP flow

1. Map activities on a timeline.
2. Score tasks by importance, difficulty, and completion.
3. Review transparent metrics and evidence-aware observations.
4. Accept a resequenced plan for tomorrow.

The current analysis is deterministic and uses a small curated evidence library. A future version can add authenticated persistence and an AI explanation layer without changing the scoring formula.
