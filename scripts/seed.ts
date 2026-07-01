/**
 * Seed script — populates Firebase Auth + Firestore from the prototype's data
 * (see scripts/seedData.ts for the ported mock data).
 *
 * Local dev (default): targets the Firebase Emulator Suite. Run the emulators
 * first (`npm run emulators`), then `npm run seed` in another terminal.
 *
 * Handover (real project): set GOOGLE_APPLICATION_CREDENTIALS to a service-account
 * key JSON and SEED_PROJECT_ID to the real project id, then run `npm run seed`.
 *
 * Idempotent: deterministic document ids mean re-running updates rather than
 * duplicating. (The "announcements" feature was dropped, so it is not seeded.)
 */
import { cert, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'node:fs';
import { seedClients, seedLibrary, seedReports, seedReviewState } from './seedData';

const PROJECT_ID = process.env.SEED_PROJECT_ID ?? 'demo-elevate';
const useRealProject = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);

if (!useRealProject) {
  process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
}

initializeApp({
  projectId: PROJECT_ID,
  ...(useRealProject
    ? {
        credential: cert(
          JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS as string, 'utf8')),
        ),
      }
    : { credential: applicationDefault() }),
});

const auth = getAuth();
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

// ── Coaches ─────────────────────────────────────────────────────────────────
const COACHES = [
  {
    name: 'Madhan',
    email: 'madhan@elevatefitness.com',
    password: 'coach123',
    role: 'main' as const,
    photo: '/assets/images/madhan.jpg',
    phone: '+91 91234 56789',
    yearsExp: 6,
    specializations: ['Strength & Conditioning Specialist'],
    certifications: ['Certified Personal Trainer'],
    tagline: "I'll guide you. You focus.",
  },
  {
    name: 'Kiran',
    email: 'kiran@elevatefitness.com',
    password: 'coach123',
    role: 'junior' as const,
    phone: '+91 90000 11223',
    yearsExp: 3,
    specializations: ['Rehab & Mobility'],
    certifications: ['Certified Personal Trainer'],
    tagline: 'Small steps, steady wins.',
  },
  {
    name: 'Shakthi',
    email: 'shakthi@elevatefitness.com',
    password: 'coach123',
    role: 'junior' as const,
    phone: '+91 90000 44556',
    yearsExp: 3,
    specializations: ['General Fitness'],
    certifications: ['Certified Personal Trainer'],
    tagline: 'Show up. The rest follows.',
  },
];

async function upsertCoach(c: (typeof COACHES)[number]): Promise<string> {
  let uid: string;
  try {
    const existing = await auth.getUserByEmail(c.email);
    uid = existing.uid;
    await auth.updateUser(uid, { password: c.password, displayName: c.name });
  } catch {
    const created = await auth.createUser({
      email: c.email,
      password: c.password,
      displayName: c.name,
    });
    uid = created.uid;
  }
  await auth.setCustomUserClaims(uid, { role: c.role });
  const { password: _password, ...profile } = c;
  await db.collection('coaches').doc(uid).set({ id: uid, ...profile }, { merge: true });
  return uid;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
// Local YYYY-MM-DD (NOT toISOString, which is UTC — that shifts a local-midnight
// date back a day in timezones east of UTC, e.g. IST). The app builds schedule date
// keys from local parts too, so seeded session dates must match that convention.
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return iso(d);
}

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Parse a client's "Mon, Wed, Fri" schedule into training-day abbreviations. */
function trainingDays(daysStr: string): string[] {
  return daysStr && daysStr !== '—' ? daysStr.split(',').map((s) => s.trim()).filter(Boolean) : [];
}

/**
 * The archive programs for one training day, mirroring how the seed tags exercises
 * into per-day A/B slots — so a generated completed session matches the day's real plan.
 */
function programsForDay(c: (typeof seedClients)[number], day: string): { label: string; sets: number; exercises: string[] }[] {
  const days = trainingDays(c.days);
  const slots = days.flatMap((d) => [{ day: d, prog: 'A' as const }, { day: d, prog: 'B' as const }]);
  const chunk = slots.length ? Math.ceil(c.exercises.length / slots.length) : 0;
  const byProg: Record<'A' | 'B', string[]> = { A: [], B: [] };
  for (let i = 0; i < c.exercises.length; i++) {
    const slot = slots.length ? slots[Math.min(Math.floor(i / chunk), slots.length - 1)] : null;
    if (slot && slot.day === day) byProg[slot.prog].push(c.exercises[i].name);
  }
  const out: { label: string; sets: number; exercises: string[] }[] = [];
  if (byProg.A.length) out.push({ label: 'Program A', sets: 3, exercises: byProg.A });
  if (byProg.B.length) out.push({ label: 'Program B', sets: 3, exercises: byProg.B });
  return out;
}

/** This week's training days that fall strictly before today, as {iso, weekday}. */
function currentWeekPastTrainingDays(daysStr: string): { iso: string; wd: string }[] {
  const days = trainingDays(daysStr);
  const now = new Date();
  const dow = (now.getDay() + 6) % 7; // Mon=0 … Sun=6
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - dow);
  const out: { iso: string; wd: string }[] = [];
  for (let i = 0; i < dow; i++) {
    const wd = WEEK_DAYS[i];
    if (!days.includes(wd)) continue;
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    out.push({ iso: iso(d), wd });
  }
  return out;
}
function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── Firestore content ─────────────────────────────────────────────────────────
async function seedClientsData(nameToUid: Record<string, string>) {
  for (const c of seedClients) {
    const coachId = c.coachName ? (nameToUid[c.coachName] ?? null) : null;
    const ref = db.collection('clients').doc(c.id);

    await ref.set({
      id: c.id,
      name: c.name,
      age: c.age,
      phone: c.phone,
      email: c.email,
      category: c.category,
      ability: c.ability,
      status: c.status,
      coachId,
      joined: c.joined,
      start: c.start,
      programStartDate: c.programStartDate,
      sessions: c.sessions,
      days: c.days,
      time: c.time,
      goals: c.goals,
      medical: c.medical,
      activity: c.activity,
      injuries: c.injuries,
      assessmentDone: c.assessmentDone,
      scheduleDone: c.scheduleDone,
      scheduleSet: c.scheduleSet,
      measures: c.measures,
      program: c.program,
      review: seedReviewState[c.id],
    });

    // exercises (standing program — source of truth). Tag each into a per-day A/B
    // slot: build [{Mon,A},{Mon,B},{Wed,A},…] from the training days and spread the
    // exercise list contiguously across them. Clients with no training days (paused /
    // leads) stay untagged so the program UI falls back to a flat list.
    const days = (c.days && c.days !== '—' ? c.days : '').split(',').map((s) => s.trim()).filter(Boolean);
    const slots = days.flatMap((d) => [{ day: d, prog: 'A' as const }, { day: d, prog: 'B' as const }]);
    const chunk = slots.length ? Math.ceil(c.exercises.length / slots.length) : 0;
    for (let i = 0; i < c.exercises.length; i++) {
      const e = c.exercises[i];
      const slot = slots.length ? slots[Math.min(Math.floor(i / chunk), slots.length - 1)] : null;
      await ref.collection('exercises').doc(`e${i}`).set({
        name: e.name,
        group: e.group,
        target: e.target,
        order: i,
        ...(slot ? { day: slot.day, prog: slot.prog } : {}),
        logs: e.logs ?? {},
      });
    }

    // program history
    for (const h of c.programHistory) {
      await ref.collection('programHistory').doc(`h${h.id}`).set(h);
    }

    // payments (main-coach-only via rules; Admin bypasses)
    for (const p of c.payments) {
      await ref.collection('payments').doc(`p${p.id}`).set(p);
    }

    // billing summary
    await ref.collection('billing').doc('summary').set({
      sessionsRemaining: c.billing.sessionsRemaining,
      packageSize: c.billing.packageSize,
      lastSessionDate: c.billing.lastSessionDaysAgo == null ? null : isoDaysAgo(c.billing.lastSessionDaysAgo),
    });

    // completed-session history. Clear any prior docs first so re-seeds don't leave
    // stale dates behind, then regenerate deterministically.
    const existingLogs = await ref.collection('sessionLog').get();
    for (const d of existingLogs.docs) await d.ref.delete();

    // First, fill in this week's past training days so every past row in the Schedule
    // opens a real completed session (for testing the read-only view). Written before
    // the hand-authored logs so those take precedence on any clash.
    if (c.scheduleSet) {
      for (const { iso: date, wd } of currentWeekPastTrainingDays(c.days)) {
        const programs = programsForDay(c, wd);
        if (!programs.length) continue;
        const total = programs.reduce((n, p) => n + p.sets, 0);
        await ref.collection('sessionLog').doc(date).set({
          date,
          when: c.time || '5:30 PM',
          early: false,
          roundsCompleted: total,
          totalRounds: total,
          programs,
        });
      }
    }

    for (const log of c.sessionLog) {
      const date = isoDaysAgo(log.daysAgo);
      await ref.collection('sessionLog').doc(date).set({
        date,
        when: log.when,
        early: log.early,
        roundsCompleted: log.roundsCompleted,
        totalRounds: log.totalRounds,
        programs: log.programs,
      });
    }
  }
}

async function seedLibraryData() {
  for (const ex of seedLibrary) {
    await db.collection('library').doc(slug(ex.name)).set(ex);
  }
}

async function seedReportsData() {
  for (const r of seedReports) {
    await db.collection('reports').doc(`${r.clientId}-w${r.week}`).set(r);
  }
}

async function main() {
  console.log(`Seeding project "${PROJECT_ID}" ${useRealProject ? '(REAL)' : '(emulator)'}…`);

  const nameToUid: Record<string, string> = {};
  for (const c of COACHES) {
    const uid = await upsertCoach(c);
    nameToUid[c.name] = uid;
    console.log(`  ✓ ${c.role === 'main' ? 'main ' : 'junior'} coach ${c.name} → ${uid}`);
  }

  await seedClientsData(nameToUid);
  console.log(`  ✓ ${seedClients.length} clients (+ exercises, history, payments, billing, session log)`);
  await seedLibraryData();
  console.log(`  ✓ ${seedLibrary.length} library exercises`);
  await seedReportsData();
  console.log(`  ✓ ${seedReports.length} reports`);

  console.log('\nCoach logins (password for all in dev): coach123');
  console.log('Done.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
