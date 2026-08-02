"use client";

import { useEffect, useMemo, useState } from "react";

type Step = "timeline" | "tasks" | "insights";
type ActivityKind = "focus" | "digital" | "movement" | "routine" | "rest";
type Theme = "light" | "dark";

type Activity = {
  id: number;
  title: string;
  start: string;
  end: string;
  kind: ActivityKind;
};

type Task = {
  id: number;
  title: string;
  importance: number;
  difficulty: number;
  completion: number;
};

type Source = {
  id: number;
  title: string;
  label: string;
  summary: string;
  url: string;
};

const sampleActivities: Activity[] = [
  { id: 1, title: "Morning scroll", start: "07:00", end: "07:40", kind: "digital" },
  { id: 2, title: "Breakfast + shower", start: "07:40", end: "08:25", kind: "routine" },
  { id: 3, title: "Chemistry review", start: "08:25", end: "09:00", kind: "focus" },
  { id: 4, title: "Messages + email", start: "09:00", end: "09:20", kind: "digital" },
  { id: 5, title: "Chemistry project", start: "09:20", end: "10:30", kind: "focus" },
  { id: 6, title: "Run outside", start: "10:30", end: "11:00", kind: "movement" },
  { id: 7, title: "Lunch", start: "11:15", end: "11:50", kind: "rest" },
  { id: 8, title: "History essay", start: "12:00", end: "12:55", kind: "focus" },
];

const sampleTasks: Task[] = [
  { id: 1, title: "Finish chemistry project", importance: 5, difficulty: 4, completion: 70 },
  { id: 2, title: "Draft history essay", importance: 4, difficulty: 3, completion: 60 },
  { id: 3, title: "Reply to club messages", importance: 2, difficulty: 1, completion: 100 },
];

const evidenceSources: Source[] = [
  {
    id: 1,
    label: "Systematic review",
    title: "Reducing the cost of interruptions",
    summary: "Interruption interventions can improve accuracy and shorten the time it takes to resume a primary task.",
    url: "https://pubmed.ncbi.nlm.nih.gov/34273814/",
  },
  {
    id: 2,
    label: "Meta-analysis",
    title: "If–then plans and goal attainment",
    summary: "Specific implementation plans can help turn intentions into action, with effects that vary by context.",
    url: "https://pubmed.ncbi.nlm.nih.gov/34054628/",
  },
  {
    id: 3,
    label: "Experimental study",
    title: "Task switching and mixing costs",
    summary: "Switching between task types carries a measurable cognitive cost, even after practice.",
    url: "https://pubmed.ncbi.nlm.nih.gov/21360303/",
  },
];

const kindLabels: Record<ActivityKind, string> = {
  focus: "Focus",
  digital: "Digital",
  movement: "Movement",
  routine: "Routine",
  rest: "Rest",
};

function minutes(value: string) {
  const parts = value.split(":").map(Number);
  return parts[0] * 60 + parts[1];
}

function duration(start: string, end: string) {
  return Math.max(0, minutes(end) - minutes(start));
}

function timeFromMinutes(value: number) {
  const hour = Math.floor(value / 60);
  const minute = value % 60;
  return String(hour).padStart(2, "0") + ":" + String(minute).padStart(2, "0");
}

function friendlyTime(value: string) {
  const parts = value.split(":").map(Number);
  const dayOffset = Math.floor(parts[0] / 24);
  const hour = parts[0] % 24;
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 || 12;
  return display + ":" + String(parts[1]).padStart(2, "0") + " " + suffix + (dayOffset ? " +" + dayOffset : "");
}

export default function Home() {
  const [step, setStep] = useState<Step>("timeline");
  const [day, setDay] = useState("2026-08-01");
  const [activities, setActivities] = useState<Activity[]>(sampleActivities);
  const [tasks, setTasks] = useState<Task[]>(sampleTasks);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [enabledSources, setEnabledSources] = useState([1, 2, 3]);
  const [quickNote, setQuickNote] = useState("");
  const [quickCaptureLoading, setQuickCaptureLoading] = useState(false);
  const [quickCaptureError, setQuickCaptureError] = useState<string | null>(null);
  const [activityTitle, setActivityTitle] = useState("");
  const [activityStart, setActivityStart] = useState("13:30");
  const [activityEnd, setActivityEnd] = useState("14:00");
  const [activityKind, setActivityKind] = useState<ActivityKind>("focus");
  const [taskTitle, setTaskTitle] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);
  const [moveModeId, setMoveModeId] = useState<number | null>(null);
  const [moveNotice, setMoveNotice] = useState<string | null>(null);
  const [editingActivityId, setEditingActivityId] = useState<number | null>(null);
  const [editActivityTitle, setEditActivityTitle] = useState("");
  const [editActivityDuration, setEditActivityDuration] = useState(30);

  useEffect(() => {
    let parsed: { activities?: Activity[]; tasks?: Task[]; day?: string; theme?: Theme } | null = null;
    try {
      const saved = window.localStorage.getItem("resequence-mvp");
      if (saved) parsed = JSON.parse(saved);
    } catch {
      // Keep the polished demo state if local data is unavailable.
    }
    queueMicrotask(() => {
      if (Array.isArray(parsed?.activities)) setActivities(parsed.activities);
      if (Array.isArray(parsed?.tasks)) setTasks(parsed.tasks);
      if (typeof parsed?.day === "string") setDay(parsed.day);
      if (parsed?.theme === "light" || parsed?.theme === "dark") {
        setTheme(parsed.theme);
      } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setTheme("dark");
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem("resequence-mvp", JSON.stringify({ activities, tasks, day, theme }));
  }, [activities, tasks, day, theme, hydrated]);

  const sortedActivities = useMemo(
    () => [...activities].sort((a, b) => a.start.localeCompare(b.start)),
    [activities],
  );

  const weightedTaskScore = useMemo(() => {
    const total = tasks.reduce((sum, task) => sum + task.importance * task.difficulty, 0);
    if (!total) return 0;
    const done = tasks.reduce(
      (sum, task) => sum + task.importance * task.difficulty * (task.completion / 100),
      0,
    );
    return Math.round((done / total) * 100);
  }, [tasks]);

  const contextSwitches = useMemo(() => {
    return sortedActivities.reduce((count, activity, index) => {
      if (!index) return count;
      return count + (activity.kind !== sortedActivities[index - 1].kind ? 1 : 0);
    }, 0);
  }, [sortedActivities]);

  const focusMinutes = sortedActivities
    .filter((activity) => activity.kind === "focus")
    .reduce((sum, activity) => sum + duration(activity.start, activity.end), 0);

  const dayScore = Math.max(
    0,
    Math.min(100, Math.round(weightedTaskScore * 0.8 + Math.max(30, 100 - contextSwitches * 8) * 0.2)),
  );

  const hardestTask = [...tasks].sort(
    (a, b) => b.importance * b.difficulty - a.importance * a.difficulty,
  )[0];

  const secondTask = [...tasks].sort(
    (a, b) => b.importance * b.difficulty - a.importance * a.difficulty,
  )[1];

  const tomorrow = [
    { time: "7:00", title: "Morning routine", note: "Keep the start calm and realistic", kind: "routine" },
    { time: "7:45", title: hardestTask?.title || "Highest-impact task", note: "Protected focus · notifications off", kind: "focus" },
    { time: "9:00", title: "Messages + phone", note: "Digital tasks grouped into one window", kind: "digital" },
    { time: "9:30", title: "Movement break", note: "A clear transition before the next block", kind: "movement" },
    { time: "10:15", title: secondTask?.title || "Second priority task", note: "50-minute focus block", kind: "focus" },
  ];

  function addActivity(event: React.FormEvent) {
    event.preventDefault();
    if (!activityTitle.trim() || minutes(activityEnd) <= minutes(activityStart)) return;
    setActivities((current) => [
      ...current,
      {
        id: Date.now(),
        title: activityTitle.trim(),
        start: activityStart,
        end: activityEnd,
        kind: activityKind,
      },
    ]);
    setActivityTitle("");
  }

  async function mapQuickNote() {
    const note = quickNote.trim();
    if (!note || quickCaptureLoading) return;

    setQuickCaptureLoading(true);
    setQuickCaptureError(null);
    try {
      const response = await fetch("/api/quick-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const result = (await response.json()) as {
        activity?: Omit<Activity, "id">;
        usedAI?: boolean;
        error?: string;
      };
      if (!response.ok || !result.activity) {
        throw new Error(result.error || "Quick capture could not read that note.");
      }

      const captured = result.activity;
      const capturedStart = minutes(captured.start);
      const capturedEnd = minutes(captured.end);
      const conflict = sortedActivities.find(
        (activity) => capturedStart < minutes(activity.end) && capturedEnd > minutes(activity.start),
      );

      let shiftAmount = 0;
      if (conflict) {
        const threshold = minutes(conflict.start);
        shiftAmount = capturedEnd - threshold;
        setActivities((current) => [
          ...current.map((activity) => {
            if (minutes(activity.start) < threshold) return activity;
            return {
              ...activity,
              start: timeFromMinutes(minutes(activity.start) + shiftAmount),
              end: timeFromMinutes(minutes(activity.end) + shiftAmount),
            };
          }),
          { ...captured, id: Date.now() },
        ]);
      } else {
        setActivities((current) => [...current, { ...captured, id: Date.now() }]);
      }

      setQuickNote("");
      setMoveNotice(
        `${captured.title} was added at ${friendlyTime(captured.start)}.` +
          (conflict
            ? ` ${conflict.title} and later activities shifted ${shiftAmount} minutes.`
            : " It fit into an open time slot."),
      );
    } catch (error) {
      setQuickCaptureError(error instanceof Error ? error.message : "Quick capture could not read that note.");
    } finally {
      setQuickCaptureLoading(false);
    }
  }

  function addTask(event: React.FormEvent) {
    event.preventDefault();
    if (!taskTitle.trim()) return;
    setTasks((current) => [
      ...current,
      { id: Date.now(), title: taskTitle.trim(), importance: 3, difficulty: 3, completion: 0 },
    ]);
    setTaskTitle("");
  }

  function updateTask(id: number, field: keyof Omit<Task, "id" | "title">, value: number) {
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, [field]: value } : task)));
  }

  function moveActivityToSlot(activityId: number, targetId: number) {
    const source = activities.find((item) => item.id === activityId);
    const target = activities.find((item) => item.id === targetId);
    if (!source || !target || source.id === target.id) return;

    const sourceDuration = duration(source.start, source.end);
    const targetStart = minutes(target.start);

    setActivities((current) => current.map((activity) => {
      if (activity.id === source.id) {
        return {
          ...activity,
          start: timeFromMinutes(targetStart),
          end: timeFromMinutes(targetStart + sourceDuration),
        };
      }

      if (minutes(activity.start) >= targetStart) {
        return {
          ...activity,
          start: timeFromMinutes(minutes(activity.start) + sourceDuration),
          end: timeFromMinutes(minutes(activity.end) + sourceDuration),
        };
      }

      return activity;
    }));

    setMoveNotice(
      source.title + " now starts at " + friendlyTime(target.start) + ". " +
      target.title + " and later activities shifted " + sourceDuration + " minutes.",
    );
    setMoveModeId(null);
  }

  function handleActivityDrop(event: React.DragEvent, target: Activity) {
    event.preventDefault();
    const id = draggedId ?? Number(event.dataTransfer.getData("text/plain"));
    if (Number.isFinite(id) && id !== target.id) moveActivityToSlot(id, target.id);
    setDraggedId(null);
    setDropTargetId(null);
  }

  function openActivityEditor(activity: Activity) {
    setEditingActivityId(activity.id);
    setEditActivityTitle(activity.title);
    setEditActivityDuration(duration(activity.start, activity.end));
    setMoveModeId(null);
  }

  function saveActivityEdits(event: React.FormEvent) {
    event.preventDefault();
    const activity = activities.find((item) => item.id === editingActivityId);
    const newDuration = Math.round(Number(editActivityDuration));
    if (!activity || !editActivityTitle.trim() || newDuration < 5 || newDuration > 720) return;

    const oldDuration = duration(activity.start, activity.end);
    const oldEnd = minutes(activity.end);
    const difference = newDuration - oldDuration;

    setActivities((current) => current.map((item) => {
      if (item.id === activity.id) {
        return {
          ...item,
          title: editActivityTitle.trim(),
          end: timeFromMinutes(minutes(item.start) + newDuration),
        };
      }

      if (difference !== 0 && minutes(item.start) >= oldEnd) {
        return {
          ...item,
          start: timeFromMinutes(minutes(item.start) + difference),
          end: timeFromMinutes(minutes(item.end) + difference),
        };
      }

      return item;
    }));

    const timingNote = difference === 0
      ? "Its timing stayed the same."
      : "Later activities shifted " + Math.abs(difference) + " minutes " + (difference > 0 ? "forward." : "earlier.");
    setMoveNotice(editActivityTitle.trim() + " is now " + newDuration + " minutes. " + timingNote);
    setEditingActivityId(null);
  }

  function resetDemo() {
    setActivities(sampleActivities);
    setTasks(sampleTasks);
    setDay("2026-08-01");
    setStep("timeline");
    setAccepted(false);
  }

  const steps: { id: Step; number: string; label: string }[] = [
    { id: "timeline", number: "01", label: "Map your day" },
    { id: "tasks", number: "02", label: "Weigh your tasks" },
    { id: "insights", number: "03", label: "Resequence" },
  ];

  return (
    <main className="app-shell" data-theme={theme}>
      <header className="topbar">
        <button className="brand" onClick={() => setStep("timeline")} aria-label="Resequence home">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>RESEQUENCE</span>
        </button>
        <div className="topbar-actions">
          <span className="save-state"><span /> Saved on this device</span>
          <button className="quiet-button" onClick={() => setSourcesOpen(true)}>
            Evidence library <b>{enabledSources.length}</b>
          </button>
          <button
            className="theme-toggle"
            onClick={() => setTheme((current) => current === "light" ? "dark" : "light")}
            aria-label={"Switch to " + (theme === "light" ? "dark" : "light") + " mode"}
            aria-pressed={theme === "dark"}
          >
            <span aria-hidden="true">{theme === "light" ? "☾" : "☀"}</span>
            <b>{theme === "light" ? "Dark" : "Light"}</b>
          </button>
          <button className="avatar" aria-label="Demo profile">AR</button>
        </div>
      </header>

      <nav className="stepper" aria-label="Setup progress">
        {steps.map((item, index) => {
          const currentIndex = steps.findIndex((entry) => entry.id === step);
          const state = index === currentIndex ? "active" : index < currentIndex ? "complete" : "";
          return (
            <button key={item.id} className={state} onClick={() => setStep(item.id)}>
              <span>{state === "complete" ? "✓" : item.number}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {step === "timeline" && (
        <section className="page-grid">
          <div className="main-column">
            <div className="eyebrow">Step 1 of 3 · Reconstruct</div>
            <div className="page-heading">
              <div>
                <h1>What shaped<br />your day?</h1>
                <p>Build an honest timeline. Breaks and distractions belong here too—context makes the advice useful.</p>
              </div>
              <label className="date-field">
                <span>Day</span>
                <input type="date" value={day} onChange={(event) => setDay(event.target.value)} />
              </label>
            </div>

            <div className="timeline-panel">
              <div className="section-header">
                <div>
                  <span className="section-kicker">Your timeline</span>
                  <h2>{sortedActivities.length} activities · {focusMinutes} focus minutes</h2>
                </div>
                <button className="text-button" onClick={() => setActivities([])}>Clear day</button>
              </div>

              <div className="timeline-list">
                {sortedActivities.length === 0 && (
                  <div className="empty-state">
                    <span>07:00</span>
                    <h3>Your day starts here.</h3>
                    <p>Add an activity with the form beside the timeline.</p>
                  </div>
                )}
                {sortedActivities.map((activity) => (
                  <article
                    className={
                      "timeline-item" +
                      (dropTargetId === activity.id ? " drop-target" : "") +
                      (draggedId === activity.id ? " dragging" : "") +
                      (moveModeId !== null && moveModeId !== activity.id ? " move-destination" : "") +
                      (moveModeId === activity.id ? " move-source" : "")
                    }
                    key={activity.id}
                    style={{ minHeight: String(Math.max(76, duration(activity.start, activity.end) * 1.15)) + "px" }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                      if (draggedId !== activity.id) setDropTargetId(activity.id);
                    }}
                    onDragLeave={() => setDropTargetId((current) => current === activity.id ? null : current)}
                    onDrop={(event) => handleActivityDrop(event, activity)}
                    onClick={() => {
                      if (moveModeId !== null && moveModeId !== activity.id) {
                        moveActivityToSlot(moveModeId, activity.id);
                      }
                    }}
                  >
                    <time>{friendlyTime(activity.start)}<small>{duration(activity.start, activity.end)} min</small></time>
                    <div className="timeline-dot" />
                    <div
                      className={"activity-card kind-" + activity.kind}
                      draggable
                      onDragStart={(event) => {
                        setDraggedId(activity.id);
                        setMoveModeId(null);
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", String(activity.id));
                      }}
                      onDragEnd={() => {
                        setDraggedId(null);
                        setDropTargetId(null);
                      }}
                    >
                      <div>
                        <span className="activity-kind">{kindLabels[activity.kind]}</span>
                        <h3>{activity.title}</h3>
                        <p>{friendlyTime(activity.start)}–{friendlyTime(activity.end)}</p>
                      </div>
                      <div className="activity-actions">
                        <button
                          className="edit-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openActivityEditor(activity);
                          }}
                          aria-label={"Edit " + activity.title}
                          title="Edit name and duration"
                        ><span aria-hidden="true">✎</span><b>Edit</b></button>
                        <button
                          className="drag-handle"
                          onClick={(event) => {
                            event.stopPropagation();
                            setMoveModeId(activity.id);
                            setMoveNotice("Choose the activity that " + activity.title + " should replace.");
                          }}
                          aria-label={"Move " + activity.title + " before another activity"}
                          aria-pressed={moveModeId === activity.id}
                          title="Drag to move or click, then choose a destination"
                        ><span aria-hidden="true">⠿</span><b>Move</b></button>
                        <button
                          className="remove-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setActivities((current) => current.filter((item) => item.id !== activity.id));
                            if (moveModeId === activity.id) setMoveModeId(null);
                          }}
                          aria-label={"Remove " + activity.title}
                        >×</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <aside className="side-column">
            <div className="quick-entry">
              <span className="section-kicker">Quick capture</span>
              <h2>Describe what happened.</h2>
              <textarea
                value={quickNote}
                onChange={(event) => {
                  setQuickNote(event.target.value);
                  if (quickCaptureError) setQuickCaptureError(null);
                }}
                placeholder="Example: At 3:15 PM I went for a 45 minute run outside."
                aria-label="Describe an activity"
                maxLength={500}
              />
              <button
                className="secondary-button"
                onClick={mapQuickNote}
                disabled={!quickNote.trim() || quickCaptureLoading}
              >
                {quickCaptureLoading ? "Understanding activity…" : "Clean up & add"} <span>→</span>
              </button>
              {quickCaptureError ? (
                <p className="quick-capture-error" role="alert">{quickCaptureError}</p>
              ) : (
                <p className="helper-text">Include a time. AI keeps only the activity name and places it correctly.</p>
              )}
            </div>

            <form className="add-form" onSubmit={addActivity}>
              <span className="section-kicker">Add an activity</span>
              <label>
                <span>What did you do?</span>
                <input
                  value={activityTitle}
                  onChange={(event) => setActivityTitle(event.target.value)}
                  placeholder="e.g. Algebra homework"
                />
              </label>
              <div className="form-row">
                <label><span>Started</span><input type="time" value={activityStart} onChange={(event) => setActivityStart(event.target.value)} /></label>
                <label><span>Ended</span><input type="time" value={activityEnd} onChange={(event) => setActivityEnd(event.target.value)} /></label>
              </div>
              <label>
                <span>Category</span>
                <select value={activityKind} onChange={(event) => setActivityKind(event.target.value as ActivityKind)}>
                  {Object.entries(kindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <button className="primary-button" type="submit">Add to my day <span>+</span></button>
            </form>

            <div className="privacy-note">
              <span className="privacy-icon">⌁</span>
              <div><strong>Your day stays yours.</strong><p>This MVP stores entries only in your browser.</p></div>
            </div>
          </aside>

          <div className="sticky-action">
            <div><strong>Timeline ready?</strong><span>You can come back and edit it.</span></div>
            <button className="primary-button" onClick={() => setStep("tasks")}>
              Next: weigh your tasks <span>→</span>
            </button>
          </div>
        </section>
      )}

      {step === "tasks" && (
        <section className="tasks-page">
          <div className="eyebrow">Step 2 of 3 · Define success</div>
          <div className="page-heading compact">
            <div>
              <h1>Not every task<br />counts the same.</h1>
              <p>Tell Resequence what mattered and how demanding it felt. The score stays transparent and under your control.</p>
            </div>
            <div className="score-preview">
              <span>Weighted completion</span>
              <strong>{weightedTaskScore}<small>%</small></strong>
              <p>Importance × difficulty × completion</p>
            </div>
          </div>

          <div className="tasks-layout">
            <div className="task-list">
              <div className="task-labels"><span>Task</span><span>Importance</span><span>Difficulty</span><span>Done</span></div>
              {tasks.map((task) => (
                <article className="task-row" key={task.id}>
                  <div className="task-title-cell">
                    <span className="task-check">{task.completion === 100 ? "✓" : task.completion + "%"}</span>
                    <div><h3>{task.title}</h3><p>{task.importance * task.difficulty} weighted points</p></div>
                  </div>
                  <label className="range-field">
                    <span className="mobile-label">Importance</span>
                    <input type="range" min="1" max="5" value={task.importance} onChange={(event) => updateTask(task.id, "importance", Number(event.target.value))} />
                    <b>{task.importance}/5</b>
                  </label>
                  <label className="range-field">
                    <span className="mobile-label">Difficulty</span>
                    <input type="range" min="1" max="5" value={task.difficulty} onChange={(event) => updateTask(task.id, "difficulty", Number(event.target.value))} />
                    <b>{task.difficulty}/5</b>
                  </label>
                  <label className="range-field completion-field">
                    <span className="mobile-label">Completion</span>
                    <input type="range" min="0" max="100" step="10" value={task.completion} onChange={(event) => updateTask(task.id, "completion", Number(event.target.value))} />
                    <b>{task.completion}%</b>
                  </label>
                  <button className="remove-button" onClick={() => setTasks((current) => current.filter((item) => item.id !== task.id))} aria-label={"Remove " + task.title}>×</button>
                </article>
              ))}

              <form className="new-task" onSubmit={addTask}>
                <span>+</span>
                <input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Add another task..." aria-label="New task title" />
                <button type="submit">Add task</button>
              </form>
            </div>

            <aside className="formula-card">
              <span className="section-kicker">How scoring works</span>
              <h2>No mystery number.</h2>
              <div className="formula">
                <span>Importance</span><b>×</b><span>Difficulty</span><b>×</b><span>Completion</span>
              </div>
              <p>We use your priorities to calculate progress. The AI explains patterns; it never silently changes the math.</p>
              <div className="formula-example"><span>Example</span><strong>5 × 4 × 70% = 14 points</strong></div>
            </aside>
          </div>

          <div className="sticky-action">
            <button className="back-button" onClick={() => setStep("timeline")}>← Back to timeline</button>
            <div className="action-spacer" />
            <div className="analysis-ready"><span className="pulse" /> <b>{enabledSources.length} sources ready</b></div>
            <button className="primary-button" onClick={() => setStep("insights")} disabled={!tasks.length}>
              Analyze & resequence <span>→</span>
            </button>
          </div>
        </section>
      )}

      {step === "insights" && (
        <section className="insights-page">
          <div className="results-hero">
            <div>
              <div className="eyebrow light">Step 3 of 3 · Your daily debrief</div>
              <h1>Good progress.<br /><em>One useful shift.</em></h1>
              <p>You moved your important work forward. Your biggest opportunity is protecting the start of your hardest focus block.</p>
            </div>
            <div className="score-orbit">
              <span>Day signal</span>
              <strong>{dayScore}</strong>
              <small>out of 100</small>
              <i style={{ transform: "rotate(" + String(dayScore * 3.6) + "deg)" }} />
            </div>
            <div className="hero-metrics">
              <div><strong>{focusMinutes}</strong><span>focus minutes</span></div>
              <div><strong>{contextSwitches}</strong><span>context shifts</span></div>
              <div><strong>{weightedTaskScore}%</strong><span>weighted progress</span></div>
            </div>
          </div>

          <div className="insight-grid">
            <article className="insight-card worked">
              <div className="insight-number">01</div>
              <span className="insight-label">What worked</span>
              <h2>You returned to meaningful work.</h2>
              <p>Despite a fragmented morning, you completed {weightedTaskScore}% of your weighted task value and logged {focusMinutes} minutes of focused activity.</p>
              <div className="observation"><span>Observed in your day</span><b>Progress after interruption</b></div>
            </article>
            <article className="insight-card friction">
              <div className="insight-number">02</div>
              <span className="insight-label">Likely friction</span>
              <h2>Your hardest task started after a switch.</h2>
              <p>{hardestTask?.title || "Your top task"} was surrounded by short digital activity. Research suggests interruptions can create a resumption cost, but this is a hypothesis—not a diagnosis.</p>
              {enabledSources.includes(1) && <a href={evidenceSources[0].url} target="_blank" rel="noreferrer">Systematic review · Medium confidence ↗</a>}
            </article>
            <article className="insight-card experiment">
              <div className="insight-number">03</div>
              <span className="insight-label">Tomorrow&apos;s experiment</span>
              <h2>Protect one clean start.</h2>
              <p>If it is 7:45 AM, begin your highest-impact task before opening messages. Try it once, then rate your focus—not your willpower.</p>
              {enabledSources.includes(2) && <a href={evidenceSources[1].url} target="_blank" rel="noreferrer">Implementation intentions · Research-backed ↗</a>}
            </article>
          </div>

          <section className="tomorrow-section">
            <div className="tomorrow-copy">
              <div className="eyebrow">A better sequence</div>
              <h2>Tomorrow, redesigned.</h2>
              <p>Only two changes: protect the first focus block and group digital tasks together. Your routine and movement still fit.</p>
              <div className="change-list">
                <div><span>1</span><p><b>Move the hardest task earlier</b>Use fresh attention on what matters most.</p></div>
                <div><span>2</span><p><b>Batch digital activity</b>Create fewer boundaries to cross.</p></div>
              </div>
              <button className={accepted ? "accepted-button" : "primary-button"} onClick={() => setAccepted(true)}>
                {accepted ? "✓ Plan accepted" : "Use this sequence tomorrow"}
              </button>
              <button className="text-button restart" onClick={resetDemo}>Start a new day</button>
            </div>
            <div className="tomorrow-timeline">
              <div className="tomorrow-header"><span>Sunday · Aug 2</span><b>Suggested plan</b></div>
              {tomorrow.map((item, index) => (
                <div className="tomorrow-item" key={item.time + item.title}>
                  <time>{item.time}</time>
                  <span className={"tomorrow-dot kind-" + item.kind}>{String(index + 1).padStart(2, "0")}</span>
                  <div><h3>{item.title}</h3><p>{item.note}</p></div>
                </div>
              ))}
              <div className="plan-footnote">Built from your priorities · <button onClick={() => setSourcesOpen(true)}>{enabledSources.length} sources active</button></div>
            </div>
          </section>

          <div className="disclaimer">
            <b>Resequence is a coach, not a judge.</b>
            <p>Insights describe patterns and evidence-informed hypotheses. They do not prove what caused your productivity or replace medical advice.</p>
          </div>
        </section>
      )}

      {sourcesOpen && (
        <div className="source-backdrop" role="presentation" onMouseDown={() => setSourcesOpen(false)}>
          <aside className="source-drawer" role="dialog" aria-modal="true" aria-labelledby="source-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="drawer-close" onClick={() => setSourcesOpen(false)} aria-label="Close evidence library">×</button>
            <div className="eyebrow">Default library</div>
            <h2 id="source-title">Advice with receipts.</h2>
            <p>Choose which research Resequence can use. Personal observations are always labeled separately.</p>
            <div className="source-list">
              {evidenceSources.map((source) => {
                const enabled = enabledSources.includes(source.id);
                return (
                  <article key={source.id} className={enabled ? "enabled" : ""}>
                    <div className="source-topline"><span>{source.label}</span><button onClick={() => setEnabledSources((current) => enabled ? current.filter((id) => id !== source.id) : [...current, source.id])} aria-pressed={enabled}>{enabled ? "On" : "Off"}</button></div>
                    <h3>{source.title}</h3>
                    <p>{source.summary}</p>
                    <a href={source.url} target="_blank" rel="noreferrer">View source ↗</a>
                  </article>
                );
              })}
            </div>
            <button className="primary-button full" onClick={() => setSourcesOpen(false)}>Save evidence settings</button>
          </aside>
        </div>
      )}

      {editingActivityId !== null && (
        <div className="edit-modal-backdrop" role="presentation" onMouseDown={() => setEditingActivityId(null)}>
          <form
            className="edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={saveActivityEdits}
          >
            <button className="drawer-close" type="button" onClick={() => setEditingActivityId(null)} aria-label="Close activity editor">×</button>
            <div className="edit-icon" aria-hidden="true">✎</div>
            <div className="eyebrow">Edit activity</div>
            <h2 id="edit-modal-title">Change the details.</h2>
            <label className="edit-name-field">
              <span>Activity name</span>
              <input
                value={editActivityTitle}
                onChange={(event) => setEditActivityTitle(event.target.value)}
                maxLength={80}
                autoFocus
              />
            </label>
            <label className="duration-field">
              <span>Duration in minutes</span>
              <div>
                <input
                  type="number"
                  min="5"
                  max="720"
                  step="5"
                  value={editActivityDuration}
                  onChange={(event) => setEditActivityDuration(Number(event.target.value))}
                />
              </div>
            </label>
            <div className="duration-presets" aria-label="Common activity durations">
              {[15, 30, 45, 60, 90].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={editActivityDuration === value ? "active" : ""}
                  onClick={() => setEditActivityDuration(value)}
                >{value}m</button>
              ))}
            </div>
            <p className="edit-note">Changing the duration shifts every later activity by the difference, keeping the rest of your day in sequence.</p>
            <div className="modal-actions">
              <button className="back-button" type="button" onClick={() => setEditingActivityId(null)}>Cancel</button>
              <button
                className="primary-button"
                type="submit"
                disabled={!editActivityTitle.trim() || editActivityDuration < 5 || editActivityDuration > 720}
              >Save changes <span>→</span></button>
            </div>
          </form>
        </div>
      )}

      {moveNotice && (
        <div
          className={"move-toast" + (moveModeId !== null ? " choosing" : "")}
          role="status"
          aria-live="polite"
          onAnimationEnd={(event) => {
            if (event.currentTarget === event.target && moveModeId === null) setMoveNotice(null);
          }}
        >
          <span className="move-toast-icon" aria-hidden="true">{moveModeId !== null ? "↕" : "✓"}</span>
          <p>{moveNotice}</p>
          <button
            onClick={() => {
              setMoveNotice(null);
              setMoveModeId(null);
            }}
            aria-label={moveModeId !== null ? "Cancel moving activity" : "Dismiss message"}
          >×</button>
        </div>
      )}
    </main>
  );
}
