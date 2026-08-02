"use client";

import { useEffect, useMemo, useState } from "react";

type Step = "priorities" | "timeline" | "outcomes" | "insights";
type ActivityKind = "focus" | "digital" | "movement" | "routine" | "rest";
type Theme = "light" | "dark";

type Activity = {
  id: number;
  title: string;
  start: string;
  end: string;
  kind: ActivityKind;
  taskId?: number | null;
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
  authors: string;
  year: number;
  label: string;
  population: string;
  confidence: "High" | "Moderate" | "Emerging";
  summary: string;
  url: string;
  challengeTags: string[];
  topics: string[];
  supportedClaims: string[];
  unsupportedClaims: string[];
  limitations: string;
  experiments: string[];
};

type DayData = {
  activities: Activity[];
  tasks: Task[];
  wakeTime?: string;
  sleepTime?: string;
};
type SavedMvp = {
  days?: Record<string, DayData>;
  activities?: Activity[];
  tasks?: Task[];
  day?: string;
  theme?: Theme;
  enabledSources?: number[];
};

type ProfileData = {
  name: string;
  focusArea: string;
  customChallenge: string;
  focusGoal: string;
};

const sampleActivities: Activity[] = [
  { id: 1, title: "Morning scroll", start: "07:00", end: "07:40", kind: "digital" },
  { id: 2, title: "Breakfast + shower", start: "07:40", end: "08:25", kind: "routine" },
  { id: 3, title: "Chemistry review", start: "08:25", end: "09:00", kind: "focus", taskId: 1 },
  { id: 4, title: "Messages + email", start: "09:00", end: "09:20", kind: "digital" },
  { id: 5, title: "Chemistry project", start: "09:20", end: "10:30", kind: "focus", taskId: 1 },
  { id: 6, title: "Run outside", start: "10:30", end: "11:00", kind: "movement" },
  { id: 7, title: "Lunch", start: "11:15", end: "11:50", kind: "rest" },
  { id: 8, title: "History essay", start: "12:00", end: "12:55", kind: "focus", taskId: 2 },
];

const sampleTasks: Task[] = [
  { id: 1, title: "Finish chemistry project", importance: 5, difficulty: 4, completion: 70 },
  { id: 2, title: "Draft history essay", importance: 4, difficulty: 3, completion: 60 },
  { id: 3, title: "Reply to club messages", importance: 2, difficulty: 1, completion: 100 },
];

const evidenceSources: Source[] = [
  {
    id: 1,
    title: "Reducing interruption costs",
    authors: "Guo et al.",
    year: 2021,
    label: "Systematic review + meta-analysis",
    population: "Laboratory task studies",
    confidence: "High",
    summary: "Interruption-management strategies improved primary-task accuracy and shortened the time needed to resume work across laboratory studies.",
    url: "https://pubmed.ncbi.nlm.nih.gov/34273814/",
    challengeTags: ["phone", "switching", "follow-through"],
    topics: ["Interruptions", "Focus recovery"],
    supportedClaims: [
      "Interruptions can create a measurable resumption cost.",
      "A deliberate resumption strategy may make returning to the primary task easier.",
    ],
    unsupportedClaims: [
      "Every interruption is harmful.",
      "A specific interruption caused a user to miss a task.",
    ],
    limitations: "The included experiments were conducted in laboratories, and effects varied by intervention and task type.",
    experiments: [
      "Before switching away, leave a one-sentence note describing the next action.",
      "Create one protected block with interruptions silenced.",
    ],
  },
  {
    id: 2,
    title: "If–then plans for young people",
    authors: "Breitwieser & Reinelt",
    year: 2026,
    label: "Systematic review + meta-analysis",
    population: "Children and young people",
    confidence: "High",
    summary: "Specific if–then plans produced a small-to-medium improvement in goal achievement across 42 youth studies.",
    url: "https://pubmed.ncbi.nlm.nih.gov/41784001/",
    challengeTags: ["starting", "overwhelm", "follow-through", "phone"],
    topics: ["Task initiation", "Follow-through"],
    supportedClaims: [
      "Linking a visible cue to a specific action can make follow-through more likely.",
      "The user should help create the plan rather than receive a vague intention.",
    ],
    unsupportedClaims: [
      "An if–then plan guarantees completion.",
      "One plan works equally well for every person and task.",
    ],
    limitations: "Effects varied considerably across studies, and the average participant was younger than many teen and adult users.",
    experiments: [
      "Write one plan in the form: If it is [time or cue], then I will [first concrete action].",
      "Choose a cue already present in the user's routine.",
    ],
  },
  {
    id: 3,
    title: "The cost of task switching",
    authors: "Monsell",
    year: 2003,
    label: "Research review",
    population: "Controlled cognitive-task studies",
    confidence: "Moderate",
    summary: "People are usually slower and more error-prone immediately after switching tasks; preparation reduces but does not remove the switch cost.",
    url: "https://pubmed.ncbi.nlm.nih.gov/12639695/",
    challengeTags: ["switching", "phone", "follow-through"],
    topics: ["Task switching", "Sequencing"],
    supportedClaims: [
      "Frequent changes between unlike tasks may add transition costs.",
      "Grouping similar activities can be tested as a way to reduce boundaries between tasks.",
    ],
    unsupportedClaims: [
      "All task switches are equally costly.",
      "Multitasking alone explains a user's productivity score.",
    ],
    limitations: "This is an older review of mostly simple laboratory tasks, which may not represent complex school or work activities.",
    experiments: [
      "Batch short digital activities into one planned window.",
      "Place a brief transition before changing to a very different task type.",
    ],
  },
  {
    id: 4,
    title: "Notifications interrupt attention",
    authors: "Stothart et al.",
    year: 2015,
    label: "Controlled experiment",
    population: "Young adults",
    confidence: "Moderate",
    summary: "Phone notifications disrupted performance on an attention-demanding task even when participants did not interact with the phone.",
    url: "https://pubmed.ncbi.nlm.nih.gov/26121498/",
    challengeTags: ["phone", "switching", "starting"],
    topics: ["Notifications", "Attention"],
    supportedClaims: [
      "A notification can consume attention without being opened.",
      "Muting nonessential notifications during one focus block is a reasonable experiment.",
    ],
    unsupportedClaims: [
      "Phone use is always unproductive.",
      "Everyone should avoid their phone during the first hour of the day.",
    ],
    limitations: "This was one controlled experiment, and notification effects can depend on the person, task, and context.",
    experiments: [
      "Mute nonessential notifications for one chosen focus block.",
      "Keep planned phone use while separating it from notification-driven checking.",
    ],
  },
  {
    id: 5,
    title: "Adding friction to screen time",
    authors: "Hoong",
    year: 2023,
    label: "Preregistered field experiment",
    population: "Smartphone users",
    confidence: "Moderate",
    summary: "Grayscale immediately reduced objectively measured screen time, while self-set limits produced a smaller, gradual reduction.",
    url: "https://pubmed.ncbi.nlm.nih.gov/36577008/",
    challengeTags: ["phone", "follow-through"],
    topics: ["Screen time", "Design friction"],
    supportedClaims: [
      "Small design barriers can reduce screen time for some users.",
      "A self-chosen time limit can be tested without labeling all phone use as bad.",
    ],
    unsupportedClaims: [
      "Lower screen time automatically improves grades or well-being.",
      "Grayscale is effective for every user.",
    ],
    limitations: "The study included 112 participants and found no immediate causal improvement in well-being or academic performance.",
    experiments: [
      "Try grayscale or move one high-use app off the home screen for one day.",
      "Set a visible end cue for a planned phone window and record what happens next.",
    ],
  },
  {
    id: 6,
    title: "Why procrastination happens",
    authors: "Steel",
    year: 2007,
    label: "Meta-analytic review",
    population: "General population studies",
    confidence: "High",
    summary: "Task aversiveness, delayed rewards, low self-efficacy, impulsiveness, and distractibility were consistent predictors of procrastination.",
    url: "https://pubmed.ncbi.nlm.nih.gov/17201571/",
    challengeTags: ["starting", "overwhelm", "follow-through"],
    topics: ["Procrastination", "Task initiation"],
    supportedClaims: [
      "An unpleasant, distant, or unclear task can be harder to begin.",
      "Making the first action smaller and more immediate is a reasonable experiment.",
    ],
    unsupportedClaims: [
      "Procrastination is laziness.",
      "A one-day timeline reveals a psychological diagnosis.",
    ],
    limitations: "Many relationships in the review are correlational and should not be treated as an individual diagnosis or proof of cause.",
    experiments: [
      "Reduce a difficult task to a concrete five-minute starting action.",
      "Place the first action next to a reliable cue already in the day.",
    ],
  },
  {
    id: 7,
    title: "What micro-breaks actually do",
    authors: "Albulescu et al.",
    year: 2022,
    label: "Systematic review + meta-analysis",
    population: "Work and laboratory samples",
    confidence: "High",
    summary: "Micro-breaks produced small improvements in vigor and fatigue, but did not reliably improve overall performance.",
    url: "https://pubmed.ncbi.nlm.nih.gov/36044424/",
    challengeTags: ["overwhelm", "starting", "follow-through", "other"],
    topics: ["Breaks", "Fatigue"],
    supportedClaims: [
      "A short break may help with fatigue or vigor.",
      "Break usefulness depends on the task, break length, and person.",
    ],
    unsupportedClaims: [
      "Breaks always increase output.",
      "There is one universally optimal focus-to-break ratio.",
    ],
    limitations: "The overall performance effect was not statistically significant, and longer breaks appeared more useful for performance than very short ones.",
    experiments: [
      "Try one intentional break and compare the following block with an unplanned break.",
      "Use a clear return cue so the break has a defined ending.",
    ],
  },
  {
    id: 8,
    title: "Exercise and adolescent cognition",
    authors: "Li et al.",
    year: 2017,
    label: "Systematic review",
    population: "Adolescents ages 13–18",
    confidence: "Emerging",
    summary: "Exercise showed promising effects on some cognitive and academic outcomes in adolescents, but the evidence base was small and inconsistent.",
    url: "https://pubmed.ncbi.nlm.nih.gov/28185806/",
    challengeTags: ["overwhelm", "starting", "other"],
    topics: ["Movement", "Adolescent cognition"],
    supportedClaims: [
      "Movement may be worth testing as a transition or recovery activity.",
      "The user should judge whether movement helped their next block.",
    ],
    unsupportedClaims: [
      "A run immediately restores focus.",
      "A specific exercise duration guarantees better school performance.",
    ],
    limitations: "The review found too few strong studies to prescribe a universal activity type, duration, or timing.",
    experiments: [
      "Try a brief movement transition, then rate the ease of starting the next task.",
      "Compare movement with another type of break rather than assuming it is better.",
    ],
  },
  {
    id: 9,
    title: "Teen sleep duration guidance",
    authors: "American Academy of Sleep Medicine",
    year: 2016,
    label: "Expert consensus recommendation",
    population: "Teenagers ages 13–18",
    confidence: "High",
    summary: "Teenagers should generally sleep 8–10 hours per 24 hours to support health and daytime alertness.",
    url: "https://aasm.org/advocacy/position-statements/teen-sleep-duration-health-advisory/",
    challengeTags: ["sleep", "starting", "overwhelm", "follow-through"],
    topics: ["Sleep", "Daytime alertness"],
    supportedClaims: [
      "A suggested plan for a teen should protect an 8–10 hour sleep opportunity.",
      "Regularly insufficient sleep can be associated with attention, behavior, and learning problems.",
    ],
    unsupportedClaims: [
      "Sleeping less makes a person more productive.",
      "Resequence can diagnose a sleep disorder.",
    ],
    limitations: "This is population-level health guidance, not a personalized productivity estimate or medical assessment.",
    experiments: [
      "Protect the user's chosen sleep window before adding optional tasks.",
      "Compare days only after the user has recorded several sleep windows.",
    ],
  },
  {
    id: 10,
    title: "Chronotype and adolescent performance",
    authors: "Vidueira et al.",
    year: 2023,
    label: "Scoping review",
    population: "Adolescents",
    confidence: "Moderate",
    summary: "Cognitive performance was often better at a person's preferred time of day, but results varied across people and outcomes.",
    url: "https://pubmed.ncbi.nlm.nih.gov/37781788/",
    challengeTags: ["starting", "sleep", "follow-through", "other"],
    topics: ["Time of day", "Chronotype"],
    supportedClaims: [
      "There is no universally best hour for difficult work.",
      "Repeated personal patterns should guide timing more than a generic morning rule.",
    ],
    unsupportedClaims: [
      "The hardest task should always happen first thing in the morning.",
      "One day of activity data reveals a person's chronotype.",
    ],
    limitations: "This was a scoping review with heterogeneous and often observational evidence, so timing advice should remain tentative.",
    experiments: [
      "Try the same kind of focus task in two realistic time windows and compare the result.",
      "Prefer time windows where the user has repeatedly completed demanding work.",
    ],
  },
];

const defaultSourceIds = evidenceSources.map((source) => source.id);

const kindLabels: Record<ActivityKind, string> = {
  focus: "Task work",
  digital: "Digital",
  movement: "Movement",
  routine: "Routine",
  rest: "Rest",
};

const productivityChallenges = [
  { value: "phone", label: "Spending too long on my phone" },
  { value: "starting", label: "Starting difficult tasks" },
  { value: "switching", label: "Switching activities too often" },
  { value: "overwhelm", label: "Procrastinating when I feel overwhelmed" },
  { value: "sleep", label: "Keeping a consistent sleep schedule" },
  { value: "follow-through", label: "Finishing what I planned" },
  { value: "other", label: "Something else" },
];

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

function awakeDuration(start: string, end: string) {
  const startMinutes = minutes(start);
  let endMinutes = minutes(end);
  if (endMinutes <= startMinutes) endMinutes += 24 * 60;
  return endMinutes - startMinutes;
}

function durationLabel(value: number) {
  const hours = Math.floor(value / 60);
  const remaining = value % 60;
  return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function todayDateValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const date = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
}

export default function Home() {
  const [step, setStep] = useState<Step>("priorities");
  const [day, setDay] = useState("");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [sleepTime, setSleepTime] = useState("23:00");
  const [activities, setActivities] = useState<Activity[]>(sampleActivities);
  const [tasks, setTasks] = useState<Task[]>(sampleTasks);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [enabledSources, setEnabledSources] = useState(defaultSourceIds);
  const [quickNote, setQuickNote] = useState("");
  const [quickCaptureLoading, setQuickCaptureLoading] = useState(false);
  const [quickCaptureError, setQuickCaptureError] = useState<string | null>(null);
  const [quickKind, setQuickKind] = useState<ActivityKind>("routine");
  const [quickTaskId, setQuickTaskId] = useState<number | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileFocusArea, setProfileFocusArea] = useState("");
  const [profileCustomChallenge, setProfileCustomChallenge] = useState("");
  const [profileFocusGoal, setProfileFocusGoal] = useState("");
  const [profileDraft, setProfileDraft] = useState("");
  const [profileFocusAreaDraft, setProfileFocusAreaDraft] = useState("");
  const [profileCustomChallengeDraft, setProfileCustomChallengeDraft] = useState("");
  const [profileFocusGoalDraft, setProfileFocusGoalDraft] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);
  const [moveModeId, setMoveModeId] = useState<number | null>(null);
  const [moveNotice, setMoveNotice] = useState<string | null>(null);
  const [editingActivityId, setEditingActivityId] = useState<number | null>(null);
  const [editActivityTitle, setEditActivityTitle] = useState("");
  const [editActivityDuration, setEditActivityDuration] = useState(30);
  const [editActivityTaskId, setEditActivityTaskId] = useState<number | null>(null);

  useEffect(() => {
    let parsed: SavedMvp | null = null;
    let savedProfile: ProfileData = { name: "", focusArea: "", customChallenge: "", focusGoal: "" };
    try {
      const saved = window.localStorage.getItem("resequence-mvp");
      if (saved) parsed = JSON.parse(saved);
      const storedProfile = window.localStorage.getItem("resequence-profile");
      if (storedProfile) {
        const profile = JSON.parse(storedProfile) as Partial<ProfileData>;
        savedProfile = {
          name: typeof profile.name === "string" ? profile.name.trim() : "",
          focusArea: typeof profile.focusArea === "string" ? profile.focusArea : "",
          customChallenge: typeof profile.customChallenge === "string" ? profile.customChallenge.trim() : "",
          focusGoal: typeof profile.focusGoal === "string" ? profile.focusGoal.trim() : "",
        };
      } else {
        savedProfile.name = window.localStorage.getItem("resequence-profile-name")?.trim() ?? "";
      }
    } catch {
      // Keep the polished demo state if local data is unavailable.
    }
    queueMicrotask(() => {
      const selectedDay = todayDateValue();
      const savedDay = parsed?.days?.[selectedDay];
      if (Array.isArray(savedDay?.activities)) setActivities(savedDay.activities);
      else if (!parsed?.days && parsed?.day === selectedDay && Array.isArray(parsed?.activities)) setActivities(parsed.activities);
      else setActivities([]);
      if (Array.isArray(savedDay?.tasks)) setTasks(savedDay.tasks);
      else if (!parsed?.days && parsed?.day === selectedDay && Array.isArray(parsed?.tasks)) setTasks(parsed.tasks);
      else setTasks([]);
      if (/^\d{2}:\d{2}$/.test(savedDay?.wakeTime ?? "")) setWakeTime(savedDay?.wakeTime ?? "07:00");
      if (/^\d{2}:\d{2}$/.test(savedDay?.sleepTime ?? "")) setSleepTime(savedDay?.sleepTime ?? "23:00");
      if (Array.isArray(parsed?.enabledSources)) {
        setEnabledSources(parsed.enabledSources.filter((id) => defaultSourceIds.includes(id)));
      } else {
        setEnabledSources(defaultSourceIds);
      }
      setProfileName(savedProfile.name);
      setProfileFocusArea(savedProfile.focusArea);
      setProfileCustomChallenge(savedProfile.customChallenge);
      setProfileFocusGoal(savedProfile.focusGoal);
      setProfileDraft(savedProfile.name);
      setProfileFocusAreaDraft(savedProfile.focusArea);
      setProfileCustomChallengeDraft(savedProfile.customChallenge);
      setProfileFocusGoalDraft(savedProfile.focusGoal);
      setProfileChecked(true);
      setDay(selectedDay);
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
    let days: Record<string, DayData> = {};
    try {
      const saved = window.localStorage.getItem("resequence-mvp");
      if (saved) days = (JSON.parse(saved) as SavedMvp).days ?? {};
    } catch {
      // Start a fresh per-day index if older local data is malformed.
    }
    window.localStorage.setItem(
      "resequence-mvp",
      JSON.stringify({ days: { ...days, [day]: { activities, tasks, wakeTime, sleepTime } }, day, theme, enabledSources }),
    );
  }, [activities, tasks, day, wakeTime, sleepTime, theme, enabledSources, hydrated]);

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

  const priorityMinutes = sortedActivities
    .filter((activity) => activity.taskId && tasks.some((task) => task.id === activity.taskId))
    .reduce((sum, activity) => sum + duration(activity.start, activity.end), 0);

  const awakeMinutes = awakeDuration(wakeTime, sleepTime);
  const displayedSleepTime = minutes(sleepTime) <= minutes(wakeTime)
    ? timeFromMinutes(minutes(sleepTime) + 24 * 60)
    : sleepTime;

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
        activity?: Pick<Activity, "title" | "start" | "end">;
        usedAI?: boolean;
        error?: string;
      };
      if (!response.ok || !result.activity) {
        throw new Error(result.error || "Quick capture could not read that note.");
      }

      const captured: Omit<Activity, "id"> = {
        ...result.activity,
        kind: quickKind,
        taskId: quickTaskId,
      };
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

  function loadDemoDay() {
    if (
      (tasks.length > 0 || activities.length > 0) &&
      !window.confirm("Replace this day's priorities and activities with the demo day?")
    ) return;

    setTasks(sampleTasks.map((task) => ({ ...task })));
    setActivities(sampleActivities.map((activity) => ({ ...activity })));
    setWakeTime("07:00");
    setSleepTime("23:00");
    setQuickTaskId(null);
    setAccepted(false);
    setMoveNotice("Demo priorities and activities were loaded for today.");
  }

  function removeTask(id: number) {
    setTasks((current) => current.filter((item) => item.id !== id));
    setActivities((current) => current.map((activity) =>
      activity.taskId === id ? { ...activity, taskId: null } : activity,
    ));
    if (quickTaskId === id) setQuickTaskId(null);
    if (editActivityTaskId === id) setEditActivityTaskId(null);
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
    setEditActivityTaskId(activity.taskId ?? null);
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
          taskId: editActivityTaskId,
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

  function changeDay(nextDay: string) {
    if (!nextDay || nextDay === day) return;
    let days: Record<string, DayData> = {};
    try {
      const saved = window.localStorage.getItem("resequence-mvp");
      if (saved) days = (JSON.parse(saved) as SavedMvp).days ?? {};
    } catch {
      // A new day can still begin if local history cannot be read.
    }
    days[day] = { activities, tasks, wakeTime, sleepTime };
    const next = days[nextDay] ?? { activities: [], tasks: [], wakeTime: "07:00", sleepTime: "23:00" };
    window.localStorage.setItem("resequence-mvp", JSON.stringify({ days, day: nextDay, theme, enabledSources }));
    setDay(nextDay);
    setActivities(next.activities);
    setTasks(next.tasks);
    setWakeTime(next.wakeTime ?? "07:00");
    setSleepTime(next.sleepTime ?? "23:00");
    setQuickTaskId(null);
    setAccepted(false);
  }

  function startNextDay() {
    const next = new Date(day + "T12:00:00");
    next.setDate(next.getDate() + 1);
    changeDay(next.toISOString().slice(0, 10));
    setStep("priorities");
  }

  function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    const name = profileDraft.trim().replace(/\s+/g, " ");
    const customChallenge = profileFocusAreaDraft === "other"
      ? profileCustomChallengeDraft.trim().replace(/\s+/g, " ")
      : "";
    const focusGoal = profileFocusGoalDraft.trim().replace(/\s+/g, " ");
    if (!name || !profileFocusAreaDraft || !focusGoal || (profileFocusAreaDraft === "other" && !customChallenge)) return;
    const profile = { name, focusArea: profileFocusAreaDraft, customChallenge, focusGoal };
    window.localStorage.setItem("resequence-profile", JSON.stringify(profile));
    window.localStorage.setItem("resequence-profile-name", name);
    setProfileName(name);
    setProfileFocusArea(profileFocusAreaDraft);
    setProfileCustomChallenge(customChallenge);
    setProfileFocusGoal(focusGoal);
    setProfileOpen(false);
  }

  const steps: { id: Step; number: string; label: string }[] = [
    { id: "priorities", number: "01", label: "Priorities" },
    { id: "timeline", number: "02", label: "Map your day" },
    { id: "outcomes", number: "03", label: "Outcomes" },
    { id: "insights", number: "04", label: "Resequence" },
  ];

  return (
    <main className="app-shell" data-theme={theme}>
      <header className="topbar">
        <button className="brand" onClick={() => setStep("priorities")} aria-label="Resequence home">
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
          <button
            className="avatar"
            aria-label={profileName ? profileName + "'s profile" : "Profile"}
            title={profileName || "Profile"}
            aria-expanded={profileOpen}
            onClick={() => {
              setProfileDraft(profileName);
              setProfileFocusAreaDraft(profileFocusArea);
              setProfileCustomChallengeDraft(profileCustomChallenge);
              setProfileFocusGoalDraft(profileFocusGoal);
              setProfileOpen((current) => !current);
            }}
          >{initials(profileName)}</button>
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

      {step === "priorities" && (
        <section className="tasks-page priorities-page">
          <div className="eyebrow">Step 1 of 4 · Choose what matters</div>
          <div className="page-heading compact">
            <div>
              <h1>Set today&apos;s<br />priorities.</h1>
              <p>Choose the tasks that would make this day meaningful. You decide their importance and difficulty—Resequence does not.</p>
            </div>
            <div className="day-settings" aria-label="Day boundaries">
              <label className="date-field">
                <span>Day</span>
                <input type="date" value={day} onChange={(event) => changeDay(event.target.value)} />
              </label>
              <label className="day-time-field">
                <span>Wake up</span>
                <input type="time" value={wakeTime} onChange={(event) => event.target.value && setWakeTime(event.target.value)} />
              </label>
              <label className="day-time-field">
                <span>Go to sleep</span>
                <input type="time" value={sleepTime} onChange={(event) => event.target.value && setSleepTime(event.target.value)} />
              </label>
            </div>
          </div>

          <div className="tasks-layout">
            <div className="task-list priority-task-list">
              <div className="task-labels"><span>Daily priority</span><span>Importance</span><span>Difficulty</span></div>
              {tasks.map((task, index) => (
                <article className="task-row" key={task.id}>
                  <div className="task-title-cell">
                    <span className="task-check">{String(index + 1).padStart(2, "0")}</span>
                    <div><h3>{task.title}</h3><p>{task.importance * task.difficulty} potential points</p></div>
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
                  <button className="remove-button" onClick={() => removeTask(task.id)} aria-label={"Remove " + task.title}>×</button>
                </article>
              ))}

              <form className="new-task" onSubmit={addTask}>
                <span>+</span>
                <input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Add a priority for this day..." aria-label="New task title" />
                <button type="submit">Add priority</button>
              </form>
            </div>

            <aside className="formula-card priority-card">
              <span className="section-kicker">You define success</span>
              <h2>AI does not choose what counts.</h2>
              <p>These priorities become the reference points for your day. Later, you can connect activities to them and report what you actually finished.</p>
              <div className="formula-example"><span>Today&apos;s plan</span><strong>{tasks.length} {tasks.length === 1 ? "priority" : "priorities"}</strong></div>
              <button className="demo-load-button" type="button" onClick={loadDemoDay}>
                Load demo day <span>→</span>
              </button>
              <small className="demo-load-note">Adds sample priorities and a complete activity timeline.</small>
            </aside>
          </div>

          <div className="sticky-action">
            <div><strong>Priorities ready?</strong><span>You can edit them again later.</span></div>
            <button className="primary-button" onClick={() => setStep("timeline")} disabled={!tasks.length}>
              Next: map your day <span>→</span>
            </button>
          </div>
        </section>
      )}

      {step === "timeline" && (
        <section className="page-grid">
          <div className="main-column">
            <div className="eyebrow">Step 2 of 4 · Reconstruct</div>
            <div className="page-heading">
              <div>
                <h1>What shaped<br />your day?</h1>
                <p>Build an honest timeline. Breaks and distractions belong here too—context makes the advice useful.</p>
              </div>
            </div>

            <div className="timeline-panel">
              <div className="section-header">
                <div>
                  <span className="section-kicker">Your timeline</span>
                  <h2>{sortedActivities.length} activities · {sortedActivities.filter((activity) => activity.taskId).length} linked to priorities</h2>
                </div>
                <button className="text-button" onClick={() => setActivities([])}>Clear day</button>
              </div>

              <div className="timeline-list">
                <div className="timeline-boundary wake-boundary">
                  <time>{friendlyTime(wakeTime)}</time>
                  <span className="boundary-dot" aria-hidden="true">↑</span>
                  <div><span>Day begins</span><strong>Wake up</strong></div>
                </div>
                {sortedActivities.length === 0 && (
                  <div className="empty-state">
                    <span>{friendlyTime(wakeTime)}</span>
                    <h3>Your day starts here.</h3>
                    <p>Add your first activity with Quick Capture.</p>
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
                        {activity.taskId && tasks.some((task) => task.id === activity.taskId) && (
                          <span className="activity-priority">↳ {tasks.find((task) => task.id === activity.taskId)?.title}</span>
                        )}
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
                <div className="timeline-boundary sleep-boundary">
                  <time>{friendlyTime(displayedSleepTime)}</time>
                  <span className="boundary-dot" aria-hidden="true">↓</span>
                  <div><span>Day ends</span><strong>Go to sleep</strong></div>
                </div>
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
              <div className="quick-options">
                <label>
                  <span>Activity type</span>
                  <select value={quickKind} onChange={(event) => setQuickKind(event.target.value as ActivityKind)}>
                    {Object.entries(kindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label>
                  <span>Supports</span>
                  <select value={quickTaskId ?? ""} onChange={(event) => setQuickTaskId(event.target.value ? Number(event.target.value) : null)}>
                    <option value="">No priority</option>
                    {tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
                  </select>
                </label>
              </div>
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
                <p className="helper-text">You choose the type and related priority. AI only cleans the name, time, and duration.</p>
              )}
            </div>

            <div className="privacy-note">
              <span className="privacy-icon">⌁</span>
              <div><strong>Your day stays yours.</strong><p>This MVP stores entries only in your browser.</p></div>
            </div>
          </aside>

          <div className="sticky-action">
            <button className="back-button" onClick={() => setStep("priorities")}>← Back to priorities</button>
            <div className="action-spacer" />
            <div><strong>Timeline ready?</strong><span>Next, report what you finished.</span></div>
            <button className="primary-button" onClick={() => setStep("outcomes")} disabled={!tasks.length}>
              Next: review outcomes <span>→</span>
            </button>
          </div>
        </section>
      )}

      {step === "outcomes" && (
        <section className="tasks-page outcomes-page">
          <div className="eyebrow">Step 3 of 4 · Report the outcome</div>
          <div className="page-heading compact">
            <div>
              <h1>What moved<br />forward?</h1>
              <p>Mark how much you completed. This is your report—not an AI judgment based on how your activities were labeled.</p>
            </div>
            <div className="score-preview">
              <span>Weighted completion</span>
              <strong>{weightedTaskScore}<small>%</small></strong>
              <p>Importance × difficulty × completion</p>
            </div>
          </div>

          <div className="tasks-layout">
            <div className="task-list outcome-task-list">
              <div className="task-labels"><span>Daily priority</span><span>Outcome</span></div>
              {tasks.map((task) => (
                <article className="task-row" key={task.id}>
                  <div className="task-title-cell">
                    <span className="task-check">{task.completion === 100 ? "✓" : task.completion + "%"}</span>
                    <div><h3>{task.title}</h3><p>Importance {task.importance}/5 · Difficulty {task.difficulty}/5</p></div>
                  </div>
                  <label className="range-field completion-field outcome-control">
                    <span className="mobile-label">Completion</span>
                    <input type="range" min="0" max="100" step="5" value={task.completion} onChange={(event) => updateTask(task.id, "completion", Number(event.target.value))} />
                    <b>{task.completion}%</b>
                  </label>
                  <button
                    className={task.completion === 100 ? "outcome-done active" : "outcome-done"}
                    onClick={() => updateTask(task.id, "completion", task.completion === 100 ? 0 : 100)}
                  >{task.completion === 100 ? "Completed" : "Mark done"}</button>
                </article>
              ))}
            </div>

            <aside className="formula-card">
              <span className="section-kicker">Your honest check-in</span>
              <h2>Progress is not all-or-nothing.</h2>
              <div className="formula">
                <span>Importance</span><b>×</b><span>Difficulty</span><b>×</b><span>Completion</span>
              </div>
              <p>Use the slider for partial progress or mark a priority complete. Resequence uses exactly the outcome you report.</p>
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
              <div className="eyebrow light">Step 4 of 4 · Your daily debrief</div>
              <h1>Good progress.<br /><em>One useful shift.</em></h1>
              <p>You moved your priorities forward. Your biggest opportunity is protecting the start of your hardest priority block.</p>
            </div>
            <div className="score-orbit">
              <span>Day signal</span>
              <strong>{dayScore}</strong>
              <small>out of 100</small>
              <i style={{ transform: "rotate(" + String(dayScore * 3.6) + "deg)" }} />
            </div>
            <div className="hero-metrics">
              <div><strong>{priorityMinutes}</strong><span>priority minutes</span></div>
              <div><strong>{contextSwitches}</strong><span>context shifts</span></div>
              <div><strong>{durationLabel(awakeMinutes)}</strong><span>awake window</span></div>
              <div><strong>{weightedTaskScore}%</strong><span>weighted progress</span></div>
            </div>
          </div>

          <div className="insight-grid">
            <article className="insight-card worked">
              <div className="insight-number">01</div>
              <span className="insight-label">What worked</span>
              <h2>You returned to meaningful work.</h2>
              <p>Despite a fragmented morning, you completed {weightedTaskScore}% of your weighted task value and logged {priorityMinutes} minutes connected to daily priorities.</p>
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
              <button className="text-button restart" onClick={startNextDay}>Start a new day</button>
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

      {profileChecked && (!profileName || !profileFocusArea || !profileFocusGoal || (profileFocusArea === "other" && !profileCustomChallenge)) && (
        <div className="edit-modal-backdrop profile-backdrop" role="presentation">
          <form
            className="profile-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-title"
            onSubmit={saveProfile}
          >
            <div className="profile-mark" aria-hidden="true">{initials(profileDraft)}</div>
            <div className="eyebrow">Welcome to Resequence</div>
            <h2 id="profile-title">What should we help you improve?</h2>
            <p>What you would like to change helps Resequence connect your day to the result you actually want.</p>
            <div className="profile-fields">
              <label>
                <span>Your name</span>
                <input
                  value={profileDraft}
                  onChange={(event) => setProfileDraft(event.target.value)}
                  placeholder="e.g. Bill Gates"
                  autoComplete="name"
                  maxLength={60}
                  autoFocus
                />
              </label>
              <label>
                <span>Main challenge</span>
                <select value={profileFocusAreaDraft} onChange={(event) => setProfileFocusAreaDraft(event.target.value)}>
                  <option value="">Choose one...</option>
                  {productivityChallenges.map((challenge) => (
                    <option key={challenge.value} value={challenge.value}>{challenge.label}</option>
                  ))}
                </select>
              </label>
              {profileFocusAreaDraft === "other" && (
                <label className="custom-challenge-field">
                  <span>What is your main challenge?</span>
                  <input
                    value={profileCustomChallengeDraft}
                    onChange={(event) => setProfileCustomChallengeDraft(event.target.value)}
                    placeholder="e.g. I lose momentum after taking a break."
                    maxLength={120}
                    required
                  />
                </label>
              )}
              <label>
                <span>What would you like to change?</span>
                <textarea
                  value={profileFocusGoalDraft}
                  onChange={(event) => setProfileFocusGoalDraft(event.target.value)}
                  placeholder="e.g. I want to put my phone down after 15 minutes and return to my main task."
                  maxLength={300}
                />
              </label>
            </div>
            <button
              className="primary-button"
              type="submit"
              disabled={!profileDraft.trim() || !profileFocusAreaDraft || !profileFocusGoalDraft.trim() || (profileFocusAreaDraft === "other" && !profileCustomChallengeDraft.trim())}
            >
              Save my focus <span>→</span>
            </button>
            <small>Saved only in this browser.</small>
          </form>
        </div>
      )}

      {profileOpen && profileName && (
        <div className="profile-popover-backdrop" role="presentation" onMouseDown={() => setProfileOpen(false)}>
          <form
            className="profile-popover"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-popover-title"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={saveProfile}
          >
            <button className="profile-popover-close" type="button" onClick={() => setProfileOpen(false)} aria-label="Close profile">×</button>
            <div className="profile-popover-heading">
              <div className="profile-mark" aria-hidden="true">{initials(profileDraft)}</div>
              <div><span>Your profile</span><h2 id="profile-popover-title">Personalize Resequence.</h2></div>
            </div>
            <div className="profile-fields compact">
              <label>
                <span>Your name</span>
                <input value={profileDraft} onChange={(event) => setProfileDraft(event.target.value)} maxLength={60} />
              </label>
              <label>
                <span>Main challenge</span>
                <select value={profileFocusAreaDraft} onChange={(event) => setProfileFocusAreaDraft(event.target.value)}>
                  {productivityChallenges.map((challenge) => (
                    <option key={challenge.value} value={challenge.value}>{challenge.label}</option>
                  ))}
                </select>
              </label>
              {profileFocusAreaDraft === "other" && (
                <label className="custom-challenge-field">
                  <span>What is your main challenge?</span>
                  <input
                    value={profileCustomChallengeDraft}
                    onChange={(event) => setProfileCustomChallengeDraft(event.target.value)}
                    placeholder="e.g. I lose momentum after taking a break."
                    maxLength={120}
                    required
                  />
                </label>
              )}
              <label>
                <span>What would you like to change?</span>
                <textarea
                  value={profileFocusGoalDraft}
                  onChange={(event) => setProfileFocusGoalDraft(event.target.value)}
                  placeholder="e.g. I want to put my phone down after 15 minutes and return to my main task."
                  maxLength={300}
                />
              </label>
            </div>
            <button
              className="primary-button"
              type="submit"
              disabled={!profileDraft.trim() || !profileFocusAreaDraft || !profileFocusGoalDraft.trim() || (profileFocusAreaDraft === "other" && !profileCustomChallengeDraft.trim())}
            >Save changes <span>→</span></button>
          </form>
        </div>
      )}

      {sourcesOpen && (
        <div className="source-backdrop" role="presentation" onMouseDown={() => setSourcesOpen(false)}>
          <aside className="source-drawer" role="dialog" aria-modal="true" aria-labelledby="source-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="drawer-close" onClick={() => setSourcesOpen(false)} aria-label="Close evidence library">×</button>
            <div className="eyebrow">Default library</div>
            <h2 id="source-title">Advice with receipts.</h2>
            <p>Choose which research Resequence can use. Every source includes the claims it supports, its limitations, and the advice it cannot justify.</p>
            <div className="source-library-summary">
              <div><strong>{evidenceSources.length}</strong><span>verified sources</span></div>
              <div><strong>{enabledSources.length}</strong><span>enabled</span></div>
              <button type="button" onClick={() => setEnabledSources(defaultSourceIds)}>Use all</button>
            </div>
            <div className="source-list">
              {evidenceSources.map((source) => {
                const enabled = enabledSources.includes(source.id);
                const relevant = source.challengeTags.includes(profileFocusArea);
                return (
                  <article key={source.id} className={[enabled ? "enabled" : "", relevant ? "relevant" : ""].filter(Boolean).join(" ")}>
                    <div className="source-topline">
                      <span>{source.label}</span>
                      <button type="button" onClick={() => setEnabledSources((current) => enabled ? current.filter((id) => id !== source.id) : [...current, source.id])} aria-pressed={enabled}>{enabled ? "On" : "Off"}</button>
                    </div>
                    <div className="source-heading">
                      <h3>{source.title}</h3>
                      {relevant && <span>Matches your challenge</span>}
                    </div>
                    <div className="source-meta">{source.authors} · {source.year} · {source.population} · {source.confidence} confidence</div>
                    <p>{source.summary}</p>
                    <div className="source-topics">
                      {source.topics.map((topic) => <span key={topic}>{topic}</span>)}
                    </div>
                    <details className="source-guardrails">
                      <summary>How Resequence may use this</summary>
                      <div>
                        <span>Supported</span>
                        <ul>{source.supportedClaims.map((claim) => <li key={claim}>{claim}</li>)}</ul>
                        <span>Not supported</span>
                        <ul>{source.unsupportedClaims.map((claim) => <li key={claim}>{claim}</li>)}</ul>
                        <span>Possible experiments</span>
                        <ul>{source.experiments.map((experiment) => <li key={experiment}>{experiment}</li>)}</ul>
                        <span>Limit</span>
                        <p>{source.limitations}</p>
                      </div>
                    </details>
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
            <label className="edit-priority-field">
              <span>Related priority</span>
              <select value={editActivityTaskId ?? ""} onChange={(event) => setEditActivityTaskId(event.target.value ? Number(event.target.value) : null)}>
                <option value="">Not connected</option>
                {tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
              </select>
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
