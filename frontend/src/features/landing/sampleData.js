// ILLUSTRATIVE SAMPLE DATA ONLY.
// Every number on the landing page comes from this file. None of it is real
// user data, and the page labels it as sample data wherever it appears.

export const SUBJECT_COLORS = {
  Physics: "#426B57",
  Chemistry: "#547AA5",
  Biology: "#B7793E",
};

export const week = [
  { day: "Thu", minutes: 190 },
  { day: "Fri", minutes: 210 },
  { day: "Sat", minutes: 120 },
  { day: "Sun", minutes: 0 },
  { day: "Mon", minutes: 245 },
  { day: "Tue", minutes: 205 },
  { day: "Wed", minutes: 155 },
];

export const subjectTime = [
  { subject: "Physics", minutes: 450 },
  { subject: "Chemistry", minutes: 360 },
  { subject: "Biology", minutes: 315 },
];

// Estimates and recorded time are separate values (never combined).
export const plannedVsRecorded = [
  { subject: "Physics", estimate: 300, recorded: 270 },
  { subject: "Chemistry", estimate: 240, recorded: 285 },
  { subject: "Biology", estimate: 180, recorded: 150 },
];

export const taskStatusCounts = [
  { status: "Completed", count: 5 },
  { status: "In progress", count: 3 },
  { status: "To do", count: 4 },
];

// Four mock tests; percentages are marks obtained / maximum marks.
export const testTrend = [
  { label: "Mock 1", date: "4 Oct", percent: 57.2 },
  { label: "Mock 2", date: "11 Oct", percent: 62.2 },
  { label: "Mock 3", date: "18 Oct", percent: 64.7 },
  { label: "Mock 4", date: "25 Oct", percent: 65.4 },
];

// Mock 4: 471 / 720. Physics 97/180 + Chemistry 119/180 + Biology 255/360 = 471.
// 122 correct, 17 incorrect: 122 x 4 - 17 = 471. Attempted 139 of 180.
export const latestTest = {
  name: "Mock 4",
  date: "25 Oct",
  marks: 471,
  max: 720,
  percent: 65.4,
  subjects: [
    { subject: "Physics", marks: 97, max: 180 },
    { subject: "Chemistry", marks: 119, max: 180 },
    { subject: "Biology", marks: 255, max: 360 },
  ],
  correct: 122,
  incorrect: 17,
  attempted: 139,
  totalQuestions: 180,
  accuracy: 87.8,
  attemptRate: 77.2,
};

export const tasks = {
  physicsSet: {
    id: "t1",
    title: "Rotational motion: practice set",
    subject: "Physics",
    status: "In progress",
    priority: "High",
    estimate: "60 min",
    planned: "28 Oct",
    due: "30 Oct",
  },
  organic: {
    id: "t2",
    title: "Organic reactions: revision",
    subject: "Chemistry",
    status: "To do",
    priority: "Medium",
    estimate: "45 min",
    planned: "28 Oct",
  },
  ncert: {
    id: "t3",
    title: "NCERT Biology: chapter 5",
    subject: "Biology",
    status: "Completed",
    priority: "Medium",
    estimate: "45 min",
    planned: "28 Oct",
  },
  optics: {
    id: "t4",
    title: "Optics: ray diagrams",
    subject: "Physics",
    status: "To do",
    priority: "Low",
    estimate: "30 min",
    planned: "26 Oct",
    carried: true,
  },
  thermo: {
    id: "t5",
    title: "Thermodynamics: previous-year questions",
    subject: "Physics",
    status: "In progress",
    priority: "High",
    estimate: "75 min",
    planned: "24 Oct",
    due: "26 Oct",
    overdue: true,
  },
  genetics: {
    id: "t6",
    title: "Genetics: problem set",
    subject: "Biology",
    status: "To do",
    priority: "Medium",
    estimate: "60 min",
    planned: "30 Oct",
  },
  mole: {
    id: "t7",
    title: "Mole concept: numericals",
    subject: "Chemistry",
    status: "Completed",
    priority: "Medium",
    estimate: "40 min",
    planned: "25 Oct",
  },
};

export const plannerViews = [
  { id: "today", label: "Today", tasks: [tasks.physicsSet, tasks.organic, tasks.ncert] },
  { id: "upcoming", label: "Upcoming", tasks: [tasks.genetics] },
  { id: "carried", label: "Carried over", tasks: [tasks.optics, tasks.thermo] },
  { id: "completed", label: "Completed", tasks: [tasks.ncert, tasks.mole] },
  {
    id: "all",
    label: "All",
    tasks: [tasks.physicsSet, tasks.organic, tasks.ncert, tasks.optics, tasks.thermo, tasks.genetics, tasks.mole],
  },
];

export const sessions = [
  { subject: "Physics", activity: "Practice questions", duration: "1h 15m", when: "Today, 9:00 am", source: "Timer" },
  { subject: "Biology", activity: "Reading", duration: "35m", when: "Today, 2:30 pm", source: "Manual" },
  { subject: "Chemistry", activity: "Revision", duration: "1h 30m", when: "Tue, 7:00 pm", source: "Timer" },
];

// ---- Heatmap: deterministic, so the preview looks the same on every visit.
// Reference "today" is Wednesday 28 October 2026. The account starts 17 Aug.
const REFERENCE = new Date(2026, 9, 28);
const ACCOUNT_START = new Date(2026, 7, 17);
const DAY = 24 * 60 * 60 * 1000;
const TARGET_MINUTES = 240;

function pseudoRandom(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;

  return x - Math.floor(x);
}

function levelFor(minutes) {
  if (minutes >= 180) return 4;
  if (minutes >= 90) return 3;
  if (minutes >= 30) return 2;

  return 1;
}

export function buildHeatmap(weeks) {
  const reference = new Date(REFERENCE);
  const mondayOfReference = new Date(
    reference.getTime() - ((reference.getDay() + 6) % 7) * DAY
  );
  const start = new Date(mondayOfReference.getTime() - (weeks - 1) * 7 * DAY);

  return Array.from({ length: weeks * 7 }, (_, index) => {
    const date = new Date(start.getTime() + index * DAY);
    const base = { date, index };

    if (date > reference) return { ...base, state: "future" };
    if (date < ACCOUNT_START) return { ...base, state: "unavailable" };

    const random = pseudoRandom(index + 3);

    if (random < 0.26) return { ...base, state: "no-entry" };

    const minutes = [20, 45, 75, 110, 150, 200, 240][Math.floor(pseudoRandom(index + 91) * 7)];

    return {
      ...base,
      state: "recorded",
      minutes,
      level: levelFor(minutes),
      sessions: 1 + Math.floor(pseudoRandom(index + 17) * 3),
      goalReached: minutes >= TARGET_MINUTES,
    };
  });
}

export const HEATMAP_TARGET_MINUTES = TARGET_MINUTES;
