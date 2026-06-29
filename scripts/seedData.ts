// Seed data for the Firebase seed script.
// Ported verbatim from the vanilla-JS prototype (_prototype/js/app.js).
// Pure data + interfaces only — no Firestore code, imports, or logic.

export interface SeedExercise {
  name: string;
  group?: string;
  target: string;
  logs: Record<string, { w: number; r: number }>;
}

export interface SeedProgramHistory {
  id: number;
  name: string;
  no: number;
  startDate: string;
  endDate: string;
  weeks: number;
  perWeek: number;
  sessionsCompleted: number;
  exercises: { name: string; target: string }[];
  notes: string;
}

export interface SeedPayment {
  id: number;
  date: string;
  type: 'package' | 'assessment';
  packageSize: number | null;
  sessions: number | null;
  status: 'Paid' | 'Pending';
  notes: string;
}

export interface SeedSessionLog {
  daysAgo: number;
  when: string;
  early: boolean;
  roundsCompleted: number;
  totalRounds: number;
  programs: { label: string; sets: number; exercises: string[] }[];
}

export interface SeedProgram {
  no: number;
  name?: string;
  weeks: number;
  perWeek: number;
  done: number;
  startDate?: string;
}

export interface SeedClient {
  id: string;
  name: string;
  age: number;
  phone: string;
  email?: string;
  category: string;
  ability: string;
  status: 'Active' | 'Paused';
  coachName: 'Madhan' | 'Kiran' | 'Shakthi' | null;
  joined: string;
  start: string;
  programStartDate?: string;
  sessions: number;
  days: string;
  time: string;
  goals: string;
  medical: string;
  activity: string;
  injuries: string;
  assessmentDone: boolean;
  scheduleDone: boolean;
  scheduleSet: boolean;
  measures: Record<string, number[]>;
  program: SeedProgram | null;
  exercises: SeedExercise[];
  programHistory: SeedProgramHistory[];
  payments: SeedPayment[];
  billing: { sessionsRemaining: number; packageSize: number; lastSessionDaysAgo: number | null };
  sessionLog: SeedSessionLog[];
}

export const seedClients: SeedClient[] = [
  {
    id: 'c1',
    name: 'Arjun Mehta',
    age: 28,
    phone: '98765 43210',
    category: 'Sports specific',
    ability: 'Abled',
    status: 'Active',
    coachName: 'Madhan',
    joined: 'Aug 2022',
    start: '3 Feb 2025',
    programStartDate: '2026-05-16',
    sessions: 32,
    days: 'Mon, Wed, Fri',
    time: '5:30 PM',
    goals: 'Improve sprint power and lower-body strength for upcoming season.',
    medical: 'No major issues. Old ankle sprain (2022), fully recovered.',
    activity: 'High — trains 5×/week',
    injuries: 'None active',
    assessmentDone: true,
    scheduleDone: true,
    scheduleSet: true,
    measures: { Weight: [78, 77.5, 77, 76.5, 76, 75.5], Waist: [86, 85, 84, 83, 82.5, 82] },
    program: { no: 3, weeks: 6, perWeek: 3, done: 9, startDate: '2025-04-18' },
    exercises: [
      { name: 'Back squat', group: 'Quads', target: '4×6', logs: { '1': { w: 60, r: 6 }, '2': { w: 60, r: 6 }, '3': { w: 65, r: 6 }, '4': { w: 65, r: 6 }, '5': { w: 70, r: 6 }, '6': { w: 70, r: 6 } } },
      { name: 'Bench press', group: 'Chest', target: '4×6', logs: { '1': { w: 47.5, r: 6 }, '2': { w: 47.5, r: 6 }, '3': { w: 52.5, r: 6 }, '4': { w: 52.5, r: 6 }, '5': { w: 57.5, r: 6 }, '6': { w: 57.5, r: 6 } } },
      { name: 'Deadlift', group: 'Hamstrings', target: '3×5', logs: { '1': { w: 95, r: 5 }, '2': { w: 95, r: 5 }, '3': { w: 102.5, r: 5 }, '4': { w: 102.5, r: 5 }, '5': { w: 110, r: 5 }, '6': { w: 110, r: 5 } } },
      { name: 'Overhead press', group: 'Shoulders', target: '3×8', logs: { '1': { w: 32.5, r: 8 }, '2': { w: 32.5, r: 8 }, '3': { w: 37.5, r: 8 }, '4': { w: 37.5, r: 8 }, '5': { w: 42.5, r: 8 }, '6': { w: 42.5, r: 8 } } },
      { name: 'Bent-over row', group: 'Back', target: '4×8', logs: { '1': { w: 50, r: 8 }, '2': { w: 50, r: 8 }, '3': { w: 55, r: 8 }, '4': { w: 55, r: 8 }, '5': { w: 60, r: 8 }, '6': { w: 60, r: 8 } } },
      { name: 'Cable crunch', group: 'Core', target: '3×15', logs: { '1': { w: 20, r: 15 }, '2': { w: 20, r: 15 }, '3': { w: 25, r: 15 }, '4': { w: 25, r: 15 }, '5': { w: 30, r: 15 }, '6': { w: 30, r: 15 } } },
      { name: 'Hanging leg raise', group: 'Core', target: '3×12', logs: { '1': { w: 0, r: 10 }, '2': { w: 0, r: 10 }, '3': { w: 0, r: 12 }, '4': { w: 0, r: 12 }, '5': { w: 0, r: 12 }, '6': { w: 0, r: 15 } } },
      { name: 'Standing calf raise', group: 'Calves', target: '3×15', logs: { '1': { w: 40, r: 15 }, '2': { w: 40, r: 15 }, '3': { w: 50, r: 15 }, '4': { w: 50, r: 15 }, '5': { w: 60, r: 15 }, '6': { w: 60, r: 15 } } },
      { name: 'Face pull', group: 'Shoulders', target: '3×15', logs: { '1': { w: 15, r: 15 }, '2': { w: 15, r: 15 }, '3': { w: 20, r: 15 }, '4': { w: 20, r: 15 }, '5': { w: 25, r: 15 }, '6': { w: 25, r: 15 } } },
      { name: 'Romanian deadlift', group: 'Hamstrings', target: '3×8', logs: { '1': { w: 60, r: 8 }, '2': { w: 60, r: 8 }, '3': { w: 67.5, r: 8 }, '4': { w: 67.5, r: 8 }, '5': { w: 75, r: 8 }, '6': { w: 75, r: 8 } } },
      { name: 'Front squat', group: 'Quads', target: '4×6', logs: { '1': { w: 50, r: 6 }, '2': { w: 50, r: 6 }, '3': { w: 57.5, r: 6 }, '4': { w: 57.5, r: 6 }, '5': { w: 65, r: 6 }, '6': { w: 65, r: 6 } } },
      { name: 'Pull-up', group: 'Back', target: '3×8', logs: { '1': { w: 0, r: 6 }, '2': { w: 0, r: 6 }, '3': { w: 0, r: 7 }, '4': { w: 0, r: 7 }, '5': { w: 0, r: 8 }, '6': { w: 0, r: 9 } } },
      { name: 'Incline bench press', group: 'Chest', target: '3×8', logs: { '1': { w: 40, r: 8 }, '2': { w: 40, r: 8 }, '3': { w: 45, r: 8 }, '4': { w: 45, r: 8 }, '5': { w: 50, r: 8 }, '6': { w: 50, r: 8 } } },
      { name: 'Bulgarian split squat', group: 'Quads', target: '3×10', logs: { '1': { w: 12, r: 10 }, '2': { w: 12, r: 10 }, '3': { w: 16, r: 10 }, '4': { w: 16, r: 10 }, '5': { w: 20, r: 10 }, '6': { w: 20, r: 10 } } },
      { name: 'Hip thrust', group: 'Glutes', target: '3×10', logs: { '1': { w: 60, r: 10 }, '2': { w: 60, r: 10 }, '3': { w: 75, r: 10 }, '4': { w: 75, r: 10 }, '5': { w: 90, r: 10 }, '6': { w: 90, r: 10 } } },
      { name: 'Lateral raise', group: 'Shoulders', target: '3×15', logs: { '1': { w: 6, r: 15 }, '2': { w: 6, r: 15 }, '3': { w: 8, r: 15 }, '4': { w: 8, r: 15 }, '5': { w: 12, r: 15 }, '6': { w: 12, r: 15 } } },
      { name: 'Leg press', group: 'Quads', target: '3×10', logs: { '1': { w: 120, r: 10 }, '2': { w: 120, r: 10 }, '3': { w: 140, r: 10 }, '4': { w: 140, r: 10 }, '5': { w: 160, r: 10 }, '6': { w: 160, r: 10 } } },
      { name: 'Russian twist', group: 'Core', target: '3×20', logs: { '1': { w: 5, r: 20 }, '2': { w: 5, r: 20 }, '3': { w: 8, r: 20 }, '4': { w: 8, r: 20 }, '5': { w: 12, r: 20 }, '6': { w: 12, r: 20 } } },
    ],
    programHistory: [
      { id: 1, name: 'Program #1', no: 1, startDate: '2025-01-06', endDate: '2025-02-03', weeks: 4, perWeek: 3, sessionsCompleted: 12, exercises: [{ name: 'Back squat', target: '3×8' }, { name: 'Bench press', target: '4×6' }, { name: 'Deadlift', target: '3×5' }, { name: 'Bent-over row', target: '3×10' }, { name: 'Plank', target: '3×40s' }], notes: 'Solid base built. Cleared to load heavier next block.' },
      { id: 2, name: 'Program #2', no: 2, startDate: '2025-02-10', endDate: '2025-04-15', weeks: 6, perWeek: 3, sessionsCompleted: 18, exercises: [{ name: 'Back squat', target: '5×5' }, { name: 'Power clean', target: '5×3' }, { name: 'Bench press', target: '5×5' }, { name: 'Romanian deadlift', target: '3×8' }, { name: 'Box jump', target: '4×5' }], notes: 'Big jump in sprint power. Carry the cleans into block 2.' },
    ],
    payments: [
      { id: 1, date: '2025-02-03', type: 'assessment', packageSize: null, sessions: null, status: 'Paid', notes: '' },
      { id: 2, date: '2025-02-10', type: 'package', packageSize: 12, sessions: 12, status: 'Paid', notes: '' },
      { id: 3, date: '2025-03-24', type: 'package', packageSize: 12, sessions: 12, status: 'Paid', notes: '' },
    ],
    billing: { sessionsRemaining: 4, packageSize: 12, lastSessionDaysAgo: 0 },
    sessionLog: [
      { daysAgo: 2, when: '5:35 PM', early: false, roundsCompleted: 6, totalRounds: 6, programs: [{ label: 'Program A', sets: 3, exercises: ['Back squat', 'Bench press'] }, { label: 'Program B', sets: 3, exercises: ['Romanian deadlift', 'Overhead press'] }] },
      { daysAgo: 5, when: '5:32 PM', early: true, roundsCompleted: 3, totalRounds: 6, programs: [{ label: 'Program A', sets: 3, exercises: ['Back squat', 'Bench press'] }, { label: 'Program B', sets: 3, exercises: ['Romanian deadlift', 'Overhead press'] }] },
    ],
  },
  {
    id: 'c2',
    name: 'Meera Nair',
    age: 45,
    phone: '98201 11223',
    category: 'Rehab',
    ability: 'Abled',
    status: 'Active',
    coachName: 'Kiran',
    joined: 'Feb 2024',
    start: '12 Mar 2025',
    programStartDate: '2026-06-09',
    sessions: 18,
    days: 'Tue, Thu',
    time: '8:30 AM',
    goals: 'Recover knee strength and mobility post-surgery.',
    medical: 'ACL reconstruction Jan 2025. Cleared for loaded rehab.',
    activity: 'Low — building back up',
    injuries: 'Right knee (recovering)',
    assessmentDone: true,
    scheduleDone: true,
    scheduleSet: true,
    measures: { Weight: [68, 67.8, 67.5, 67.2, 67], Waist: [80, 79.5, 79, 78.5, 78] },
    program: { no: 2, weeks: 4, perWeek: 3, done: 12, startDate: '2025-04-15' },
    exercises: [
      { name: 'Glute bridge', target: '3×12', logs: { '1': { w: 0, r: 12 }, '2': { w: 5, r: 12 }, '3': { w: 7.5, r: 12 }, '4': { w: 10, r: 12 } } },
      { name: 'Wall sit', target: '3×30s', logs: { '1': { w: 20, r: 1 }, '2': { w: 25, r: 1 }, '3': { w: 30, r: 1 }, '4': { w: 35, r: 1 } } },
      { name: 'Straight-leg raise', target: '3×15', logs: { '1': { w: 0, r: 15 }, '2': { w: 1, r: 15 }, '3': { w: 2, r: 15 }, '4': { w: 2.5, r: 15 } } },
      { name: 'Heel slide', target: '3×12', logs: { '1': { w: 0, r: 10 }, '2': { w: 0, r: 12 }, '3': { w: 0, r: 12 }, '4': { w: 0, r: 15 } } },
      { name: 'Seated cable row', target: '3×15', logs: { '1': { w: 5, r: 15 }, '2': { w: 7.5, r: 15 }, '3': { w: 10, r: 15 }, '4': { w: 10, r: 15 } } },
      { name: 'Band row', target: '3×15', logs: { '1': { w: 5, r: 15 }, '2': { w: 7.5, r: 15 }, '3': { w: 7.5, r: 15 }, '4': { w: 10, r: 15 } } },
    ],
    programHistory: [
      { id: 1, name: 'Program #1', no: 1, startDate: '2025-03-12', endDate: '2025-04-10', weeks: 4, perWeek: 2, sessionsCompleted: 8, exercises: [{ name: 'Glute bridge', target: '3×12' }, { name: 'Wall sit', target: '3×30s' }, { name: 'Straight-leg raise', target: '3×15' }, { name: 'Heel slide', target: '3×12' }], notes: 'Pain-free ROM restored. Progressed to light loading.' },
    ],
    payments: [
      { id: 1, date: '2025-03-12', type: 'assessment', packageSize: null, sessions: null, status: 'Paid', notes: '' },
      { id: 2, date: '2025-03-18', type: 'package', packageSize: 12, sessions: 12, status: 'Paid', notes: '' },
    ],
    billing: { sessionsRemaining: 0, packageSize: 12, lastSessionDaysAgo: 3 },
    sessionLog: [],
  },
  {
    id: 'c3',
    name: 'Kavya Singh',
    age: 34,
    phone: '99000 88776',
    category: 'General wellness',
    ability: 'Abled',
    status: 'Active',
    coachName: 'Madhan',
    joined: 'Apr 2025',
    start: '2 May 2025',
    programStartDate: '2026-06-15',
    sessions: 9,
    days: 'Mon, Thu',
    time: '10:00 AM',
    goals: 'General fitness, lose 4kg, build a sustainable routine.',
    medical: 'None reported.',
    activity: 'Moderate — new to training',
    injuries: 'None',
    assessmentDone: true,
    scheduleDone: true,
    scheduleSet: true,
    measures: { Weight: [72, 71.5, 71, 70.8, 70.5], Waist: [88, 87, 86.5, 86, 85] },
    program: { no: 2, weeks: 4, perWeek: 3, done: 12, startDate: '2025-05-30' },
    exercises: [
      { name: 'Goblet squat', target: '3×12', logs: { '1': { w: 8, r: 12 }, '2': { w: 10, r: 12 }, '3': { w: 12, r: 12 }, '4': { w: 12, r: 12 } } },
      { name: 'Treadmill walk (incline)', target: '20 min', logs: { '1': { w: 3, r: 1 }, '2': { w: 4, r: 1 }, '3': { w: 5, r: 1 }, '4': { w: 5, r: 1 } } },
    ],
    programHistory: [
      { id: 1, name: 'Program #1', no: 1, startDate: '2025-05-02', endDate: '2025-05-30', weeks: 4, perWeek: 2, sessionsCompleted: 8, exercises: [{ name: 'Goblet squat', target: '3×12' }, { name: 'Incline walk', target: '20 min' }, { name: 'Band row', target: '3×15' }, { name: 'Glute bridge', target: '3×12' }], notes: 'Great consistency. Ready to add a third session.' },
    ],
    payments: [
      { id: 1, date: '2025-05-02', type: 'assessment', packageSize: null, sessions: null, status: 'Paid', notes: '' },
      { id: 2, date: '2025-05-05', type: 'package', packageSize: 12, sessions: 12, status: 'Paid', notes: '' },
    ],
    billing: { sessionsRemaining: 0, packageSize: 12, lastSessionDaysAgo: 10 },
    sessionLog: [
      { daysAgo: 1, when: '7:05 AM', early: false, roundsCompleted: 6, totalRounds: 6, programs: [{ label: 'Program A', sets: 3, exercises: ['Goblet squat'] }, { label: 'Program B', sets: 3, exercises: ['Incline walk'] }] },
    ],
  },
  {
    id: 'c4',
    name: 'Dev Krishnan',
    age: 11,
    phone: '97411 22334',
    category: 'Special children',
    ability: 'Disabled',
    status: 'Active',
    coachName: 'Shakthi',
    joined: 'Oct 2023',
    start: '18 Apr 2025',
    programStartDate: '2026-06-22',
    sessions: 14,
    days: 'Wed, Sat',
    time: '4:00 PM',
    goals: 'Improve balance, coordination and confidence through play-based training.',
    medical: 'Mild cerebral palsy. Parent present each session.',
    activity: 'Light, supervised',
    injuries: 'None',
    assessmentDone: true,
    scheduleDone: true,
    scheduleSet: true,
    measures: { Balance: [10, 12, 15, 18, 20] },
    program: { no: 2, weeks: 4, perWeek: 3, done: 11, startDate: '2025-05-16' },
    exercises: [
      { name: 'Single-leg balance', target: '3×20s', logs: { '1': { w: 10, r: 1 }, '2': { w: 12, r: 1 }, '3': { w: 15, r: 1 }, '4': { w: 18, r: 1 } } },
      { name: 'Step-ups', target: '2×10', logs: { '1': { w: 0, r: 10 }, '2': { w: 0, r: 12 }, '3': { w: 0, r: 14 }, '4': { w: 0, r: 15 } } },
    ],
    programHistory: [
      { id: 1, name: 'Program #1', no: 1, startDate: '2025-04-18', endDate: '2025-05-16', weeks: 4, perWeek: 2, sessionsCompleted: 8, exercises: [{ name: 'Balance hold', target: '3×20s' }, { name: 'Step-ups', target: '2×10' }, { name: 'Cone weaving', target: '3 rounds' }, { name: 'Seated catch', target: '3×10' }], notes: 'Confidence up noticeably. Parent very pleased.' },
    ],
    payments: [
      { id: 1, date: '2025-04-18', type: 'assessment', packageSize: null, sessions: null, status: 'Paid', notes: '' },
      { id: 2, date: '2025-04-20', type: 'package', packageSize: 12, sessions: 12, status: 'Paid', notes: '' },
      { id: 3, date: '2025-05-19', type: 'package', packageSize: 12, sessions: 12, status: 'Paid', notes: '' },
    ],
    billing: { sessionsRemaining: 8, packageSize: 12, lastSessionDaysAgo: 1 },
    sessionLog: [],
  },
  {
    id: 'c5',
    name: 'Sara Pinto',
    age: 52,
    phone: '90011 55667',
    category: 'General wellness',
    ability: 'Abled',
    status: 'Paused',
    coachName: 'Kiran',
    joined: 'Jun 2021',
    start: '10 Jan 2025',
    sessions: 22,
    days: '—',
    time: '—',
    goals: 'Maintain fitness; paused for travel.',
    medical: 'Mild hypertension, managed.',
    activity: 'Paused',
    injuries: 'None',
    assessmentDone: true,
    scheduleDone: true,
    scheduleSet: true,
    measures: { Weight: [70, 69.5, 69] },
    program: { no: 2, weeks: 4, perWeek: 3, done: 0, startDate: '2025-03-05' },
    exercises: [
      { name: 'Burpee', target: '3×10', logs: { '1': { w: 0, r: 1 }, '2': { w: 0, r: 1 } } },
    ],
    programHistory: [
      { id: 1, name: 'Program #1', no: 1, startDate: '2025-01-10', endDate: '2025-03-01', weeks: 6, perWeek: 2, sessionsCompleted: 10, exercises: [{ name: 'Full body circuit', target: '3 rounds' }, { name: 'Goblet squat', target: '3×12' }, { name: 'Incline walk', target: '15 min' }], notes: 'Steady progress before the travel pause.' },
    ],
    payments: [
      { id: 1, date: '2025-01-10', type: 'assessment', packageSize: null, sessions: null, status: 'Paid', notes: '' },
      { id: 2, date: '2025-01-15', type: 'package', packageSize: 16, sessions: 16, status: 'Paid', notes: '' },
    ],
    billing: { sessionsRemaining: 2, packageSize: 16, lastSessionDaysAgo: 30 },
    sessionLog: [],
  },
  {
    id: 'c6',
    name: 'Nisha Reddy',
    age: 29,
    phone: '+91 99887 76655',
    category: 'General wellness',
    ability: 'Abled',
    status: 'Active',
    coachName: null,
    joined: 'May 2025',
    start: 'Today',
    sessions: 0,
    days: '',
    time: '',
    goals: 'Lose 5kg and build a sustainable, consistent gym routine.',
    medical: 'No known conditions. Occasional lower-back stiffness from desk work.',
    activity: 'Sedentary — desk job, new to structured training',
    injuries: 'None',
    assessmentDone: false,
    scheduleDone: false,
    scheduleSet: false,
    measures: {},
    program: null,
    exercises: [],
    programHistory: [],
    payments: [],
    billing: { sessionsRemaining: 0, packageSize: 12, lastSessionDaysAgo: null },
    sessionLog: [],
  },
];

export const seedLibrary: { name: string; group: string; category: string; target: string }[] = [
  // Lower body — Quads
  { name: 'Back squat', group: 'Quads', category: 'Lower body · Barbell', target: '3×8' },
  { name: 'Front squat', group: 'Quads', category: 'Lower body · Barbell · Quad-dominant', target: '3×8' },
  { name: 'Goblet squat', group: 'Quads', category: 'Lower body · Dumbbell · Beginner', target: '3×12' },
  { name: 'Bulgarian split squat', group: 'Quads', category: 'Lower body · Unilateral', target: '3×10 each leg' },
  { name: 'Walking lunges', group: 'Quads', category: 'Lower body · Dynamic', target: '3×12 each leg' },
  { name: 'Reverse lunge', group: 'Quads', category: 'Lower body · Knee-friendly', target: '3×10 each leg' },
  { name: 'Step-ups', group: 'Quads', category: 'Lower body · Functional', target: '3×10 each leg' },
  { name: 'Leg press', group: 'Quads', category: 'Lower body · Machine', target: '3×12' },
  { name: 'Wall sit', group: 'Quads', category: 'Lower body · Isometric · Rehab', target: '3×30s' },
  { name: 'Bodyweight squat', group: 'Quads', category: 'Lower body · Beginner · Warm-up', target: '3×15' },

  // Lower body — Hamstrings & glutes
  { name: 'Romanian deadlift', group: 'Hamstrings', category: 'Posterior chain · Hamstring-dominant', target: '3×10' },
  { name: 'Conventional deadlift', group: 'Hamstrings', category: 'Posterior chain · Heavy compound', target: '3×5' },
  { name: 'Sumo deadlift', group: 'Glutes', category: 'Posterior chain · Wide stance', target: '3×6' },
  { name: 'Single-leg deadlift', group: 'Hamstrings', category: 'Posterior chain · Balance + unilateral', target: '3×8 each leg' },
  { name: 'Hip thrust', group: 'Glutes', category: 'Glute primary', target: '3×12' },
  { name: 'Glute bridge', group: 'Glutes', category: 'Bodyweight · Rehab-friendly', target: '3×15' },
  { name: 'Cable pull-through', group: 'Glutes', category: 'Hip hinge pattern', target: '3×12' },
  { name: 'Good morning', group: 'Hamstrings', category: 'Posterior chain · Lower back', target: '3×10' },
  { name: 'Nordic curl', group: 'Hamstrings', category: 'Advanced hamstring isolation', target: '3×6' },
  { name: 'Kettlebell swing', group: 'Glutes', category: 'Power · Posterior chain', target: '3×15' },

  // Lower body — Calves
  { name: 'Standing calf raise', group: 'Calves', category: 'Lower body · Bodyweight or weighted', target: '3×15' },
  { name: 'Seated calf raise', group: 'Calves', category: 'Lower body · Soleus', target: '3×15' },
  { name: 'Single-leg calf raise', group: 'Calves', category: 'Lower body · Unilateral', target: '3×12 each leg' },
  { name: 'Box jump', group: 'Calves', category: 'Plyometric', target: '3×8' },

  // Chest
  { name: 'Bench press', group: 'Chest', category: 'Upper body · Barbell · Primary push', target: '4×6' },
  { name: 'Incline bench press', group: 'Chest', category: 'Upper body · Upper chest', target: '4×8' },
  { name: 'Dumbbell bench press', group: 'Chest', category: 'Upper body · More range of motion', target: '3×10' },
  { name: 'Incline dumbbell press', group: 'Chest', category: 'Upper body · Upper chest', target: '3×10' },
  { name: 'Push-up', group: 'Chest', category: 'Bodyweight · Staple', target: '3×12' },
  { name: 'Decline push-up', group: 'Chest', category: 'Bodyweight · Feet elevated', target: '3×10' },
  { name: 'Knee push-up', group: 'Chest', category: 'Bodyweight · Regression', target: '3×10' },
  { name: 'Dumbbell fly', group: 'Chest', category: 'Upper body · Isolation', target: '3×12' },
  { name: 'Cable crossover', group: 'Chest', category: 'Upper body · Cable machine', target: '3×12' },
  { name: 'Dip', group: 'Chest', category: 'Bodyweight · Chest + triceps', target: '3×8' },

  // Back
  { name: 'Pull-up', group: 'Back', category: 'Bodyweight · Overhand', target: '3×6' },
  { name: 'Chin-up', group: 'Back', category: 'Bodyweight · Underhand', target: '3×6' },
  { name: 'Lat pulldown', group: 'Back', category: 'Upper body · Machine', target: '4×10' },
  { name: 'Bent-over row', group: 'Back', category: 'Upper body · Barbell · Primary pull', target: '3×8' },
  { name: 'Dumbbell row', group: 'Back', category: 'Upper body · Single-arm', target: '3×10 each side' },
  { name: 'Seated cable row', group: 'Back', category: 'Upper body · Mid-back', target: '3×10' },
  { name: 'T-bar row', group: 'Back', category: 'Upper body · Thick back', target: '3×8' },
  { name: 'Inverted row', group: 'Back', category: 'Bodyweight', target: '3×10' },
  { name: 'Band pull-apart', group: 'Back', category: 'Posture · Shoulder health', target: '3×15' },
  { name: 'Face pull', group: 'Back', category: 'Rear delt · Upper back', target: '3×15' },

  // Shoulders
  { name: 'Overhead press', group: 'Shoulders', category: 'Upper body · Barbell · Standing', target: '4×8' },
  { name: 'Seated dumbbell press', group: 'Shoulders', category: 'Upper body · Stable', target: '3×10' },
  { name: 'Arnold press', group: 'Shoulders', category: 'Upper body · Rotational', target: '3×10' },
  { name: 'Lateral raise', group: 'Shoulders', category: 'Side delt · Isolation', target: '3×12' },
  { name: 'Front raise', group: 'Shoulders', category: 'Front delt · Isolation', target: '3×12' },
  { name: 'Rear delt fly', group: 'Shoulders', category: 'Rear delt · Isolation', target: '3×12' },
  { name: 'Upright row', group: 'Shoulders', category: 'Trap + side delt', target: '3×10' },
  { name: 'Push press', group: 'Shoulders', category: 'Power · Leg drive', target: '3×6' },
  { name: 'Pike push-up', group: 'Shoulders', category: 'Bodyweight · Shoulder press', target: '3×8' },

  // Biceps
  { name: 'Barbell curl', group: 'Biceps', category: 'Arms · Primary biceps', target: '3×10' },
  { name: 'Dumbbell curl', group: 'Biceps', category: 'Arms · Each arm independent', target: '3×10' },
  { name: 'Hammer curl', group: 'Biceps', category: 'Arms · Neutral grip · Brachialis', target: '3×10' },
  { name: 'Preacher curl', group: 'Biceps', category: 'Arms · Strict isolation', target: '3×8' },
  { name: 'Concentration curl', group: 'Biceps', category: 'Arms · Peak contraction', target: '3×10' },
  { name: 'Cable curl', group: 'Biceps', category: 'Arms · Constant tension', target: '3×12' },

  // Triceps
  { name: 'Close-grip bench press', group: 'Triceps', category: 'Arms · Compound triceps', target: '3×8' },
  { name: 'Tricep dip', group: 'Triceps', category: 'Bodyweight or weighted', target: '3×10' },
  { name: 'Overhead tricep extension', group: 'Triceps', category: 'Arms · Dumbbell · Long head', target: '3×10' },
  { name: 'Tricep pushdown', group: 'Triceps', category: 'Arms · Cable', target: '3×12' },
  { name: 'Skull crusher', group: 'Triceps', category: 'Arms · EZ bar', target: '3×10' },
  { name: 'Diamond push-up', group: 'Triceps', category: 'Bodyweight · Tricep focus', target: '3×10' },

  // Core
  { name: 'Plank', group: 'Core', category: 'Isometric · Staple', target: '3×40s' },
  { name: 'Side plank', group: 'Core', category: 'Obliques', target: '3×30s each side' },
  { name: 'Dead bug', group: 'Core', category: 'Core stability · Rehab-friendly', target: '3×10 each side' },
  { name: 'Bird dog', group: 'Core', category: 'Core + back stability', target: '3×10 each side' },
  { name: 'Hanging leg raise', group: 'Core', category: 'Lower abs', target: '3×10' },
  { name: 'Lying leg raise', group: 'Core', category: 'Bodyweight · Floor', target: '3×15' },
  { name: 'Russian twist', group: 'Core', category: 'Rotational', target: '3×20' },
  { name: 'Cable woodchop', group: 'Core', category: 'Rotational · Functional', target: '3×12 each side' },
  { name: 'Pallof press', group: 'Core', category: 'Anti-rotation', target: '3×12 each side' },
  { name: 'Hollow hold', group: 'Core', category: 'Gymnastics-style core', target: '3×30s' },
  { name: 'Ab wheel rollout', group: 'Core', category: 'Advanced core', target: '3×8' },

  // Cardio / conditioning
  { name: 'Treadmill walk (incline)', group: 'Cardio', category: 'Low-impact cardio', target: '20 min' },
  { name: 'Treadmill run', group: 'Cardio', category: 'Steady state', target: '20 min' },
  { name: 'Stationary bike', group: 'Cardio', category: 'Low-impact', target: '20 min' },
  { name: 'Rowing machine', group: 'Cardio', category: 'Full body', target: '15 min' },
  { name: 'Jump rope', group: 'Cardio', category: 'Conditioning', target: '3×60s' },
  { name: 'Battle ropes', group: 'Cardio', category: 'Power conditioning', target: '3×30s' },
  { name: 'Burpee', group: 'Cardio', category: 'Full body', target: '3×10' },
  { name: 'Mountain climber', group: 'Cardio', category: 'Core + cardio', target: '3×30s' },

  // Mobility & warm-up
  { name: 'Cat-cow', group: 'Mobility', category: 'Spine mobility', target: '2×10' },
  { name: "World's greatest stretch", group: 'Mobility', category: 'Full body warm-up', target: '2×5 each side' },
  { name: 'Hip 90/90', group: 'Mobility', category: 'Hip mobility', target: '2×8 each side' },
  { name: 'Couch stretch', group: 'Mobility', category: 'Quad · Hip flexor', target: '2×30s each side' },
  { name: 'Thoracic rotation', group: 'Mobility', category: 'Upper back mobility', target: '2×10 each side' },
  { name: 'Shoulder dislocates', group: 'Mobility', category: 'Band/PVC · Shoulder mobility', target: '2×15' },
  { name: 'Glute bridge (warm-up)', group: 'Mobility', category: 'Activation', target: '2×15' },

  // Rehab & special populations
  { name: 'Clamshells', group: 'Rehab', category: 'Hip stability', target: '3×15 each side' },
  { name: 'Banded monster walks', group: 'Rehab', category: 'Hip stability', target: '3×10 steps' },
  { name: 'Terminal knee extension', group: 'Rehab', category: 'Knee rehab', target: '3×15' },
  { name: 'Heel slides', group: 'Rehab', category: 'Post-surgery knee', target: '3×10' },
  { name: 'Quad set (isometric)', group: 'Rehab', category: 'Early-stage knee rehab', target: '3×10s' },
  { name: 'Banded shoulder external rotation', group: 'Rehab', category: 'Rotator cuff', target: '3×15' },
  { name: 'Wall slides', group: 'Rehab', category: 'Shoulder mobility', target: '3×10' },
  { name: 'Single-leg balance', group: 'Rehab', category: 'Proprioception', target: '3×30s each leg' },
  { name: 'Step-up to balance', group: 'Rehab', category: 'Functional balance', target: '3×8 each leg' },
  { name: 'Seated march', group: 'Rehab', category: 'Special children · Low mobility', target: '3×15 each leg' },
  { name: 'Standing balance eyes closed', group: 'Rehab', category: 'Advanced balance', target: '3×20s each leg' },
];

export const seedAnnouncements: { type: string; title: string; msg: string; to: string; when: string }[] = [
  { type: 'Holiday', title: 'Gym closed for Diwali', msg: 'We will be closed 20–22 Oct. Sessions resume 23 Oct. Happy Diwali! 🪔', to: 'All clients', when: '2 days ago' },
  { type: 'Event', title: 'Free posture workshop', msg: 'Join our posture & mobility workshop this Saturday 11 AM. Open to all.', to: 'All clients', when: '1 week ago' },
];

export const seedReports: { clientId: string; week: number; sent: boolean; when?: string }[] = [
  { clientId: 'c1', week: 4, sent: false },
  { clientId: 'c2', week: 4, sent: true, when: 'Yesterday' },
];

export const seedReviewState: Record<string, { due: boolean; ago: string }> = {
  c1: { due: false, ago: 'this week' },
  c2: { due: true, ago: '9 days ago' },
  c3: { due: true, ago: '8 days ago' },
  c4: { due: false, ago: 'this week' },
  c5: { due: false, ago: 'paused' },
};
