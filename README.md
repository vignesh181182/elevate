# Elevate Fitness

A mobile-first web app for gym coaches to manage clients — onboarding, scheduling,
attendance, programs, today's-session circuits, progress tracking, payments, and
progress photos.

Built as a **React + TypeScript single-page app** (Vite) on **Firebase**
(Authentication + Cloud Firestore). All backend wiring is driven by environment
variables, so the whole app moves to a new Firebase project at handover with **no
code changes** — fill in `.env`, seed, and deploy.

> The original static prototype (plain HTML/CSS/JS) is preserved under
> [`_prototype/`](_prototype/) for reference. Open `_prototype/index.html` directly
> in a browser to revisit it. It is **not** part of the build, lint, or deploy.

---

## Tech stack

| Concern        | Choice |
|----------------|--------|
| UI             | React 19 + TypeScript, [Vite](https://vitejs.dev/) |
| Routing        | React Router |
| Server state   | [TanStack Query](https://tanstack.com/query) (React Query) |
| Backend        | Firebase Auth + Cloud Firestore |
| Chrome icons   | [lucide-react](https://lucide.dev/) (content/emoji icons stay inline) |
| PDF (deferred) | html2pdf.js |
| Lint           | [oxlint](https://oxc.rs/) |

There is no component framework or CSS-in-JS — all styles live in a single
token-driven stylesheet, [`src/styles/globals.css`](src/styles/globals.css), reusing
the prototype's class names. Data-dependent styling is done with CSS custom
properties (e.g. `--c-bg`, `--pct`), never static inline `style` attributes.

---

## Project structure

```
src/
  main.tsx              App entry — mounts <App/> inside providers (Query, Auth, Toast, Router)
  App.tsx               Route map (see "Routes" below)
  firebase.ts           The ONE place Firebase is wired — all config from import.meta.env

  auth/AuthProvider.tsx Auth context — current coach + role; useAuth/useIsMainCoach
  routes/               One screen per file (Home, Clients, ClientDetail, ClientSession, …)
  components/           Reusable UI (cards, sheets, layout shells, Toast); charts/ for SVG charts
  hooks/useData.ts      All React Query hooks (queries + mutations) over the services
  services/             Firestore read/write functions, grouped by collection
  domain/               PURE logic + types — NO Firebase, NO React (unit-testable)
  lib/                  Small helpers (formatting, image compression, category/muscle colours)
  styles/globals.css    All styling (design tokens + components + utilities)

scripts/
  seed.ts               Idempotent seeder (Firebase Admin) — coaches, clients, library, reports
  seedData.ts           The ported mock data the seeder writes

firestore.rules         Security rules (access model below)
firebase.json           Firestore + Hosting + Emulator config
.env.example            Template for the Firebase config (copy to .env)
```

### Architecture in one paragraph

`domain/*` holds **pure** logic and the Firestore document types — no Firebase, no
React, so it's trivial to reason about and test. `services/*` are thin Firestore
read/write functions. `hooks/useData.ts` wraps those services in React Query
(caching, optimistic updates, invalidation). Components and routes only ever call
hooks — they never touch Firestore directly. This keeps the money-sensitive and
rules-sensitive logic in two small, auditable places (`services/` + `firestore.rules`).

### Routes

Tab routes (`/home`, `/clients`, `/schedule`, `/reports`, `/more`) render inside
`TabLayout` with the bottom nav. Detail/sub views are plain full-screen routes:
`/clients/new`, `/clients/:id`, `/clients/:id/schedule`, `/clients/:id/program`,
`/clients/:id/session`, `/clients/:id/library`, `/library`. Everything behind
`RequireAuth` redirects to `/login` when signed out.

---

## Access model (important)

Defined in [`firestore.rules`](firestore.rules) and enforced server-side:

- **Any signed-in coach** can read/write clients, programs, exercises, sessions,
  session progress, media, the exercise library, and reports.
- **Payments are head-coach-only.** Payment history and the billing summary are
  **readable only** when the coach's auth token carries the custom claim
  `role == 'main'`. Junior coaches never fetch payment/billing data (the relevant
  React Query hooks are disabled for them).
- **Juniors can still finish sessions**, which decrements the session balance. So
  `billing` allows **write** for any signed-in coach (done via an atomic
  `FieldValue.increment`, which needs no prior read) while **denying read**. A
  junior decrements the balance without ever being able to see it.
- The `role` custom claim (`main` | `junior`) is set per coach account by the seed
  script (`auth.setCustomUserClaims`).

**No monetary amounts are shown anywhere in the UI** — only session counts and
package sizes. Everything displayed is read from Firestore or derived by a
`domain/*` helper; nothing is hardcoded.

---

## Prerequisites

- **Node.js 20+** (developed on v24).
- **Java 11+** — required by the Firebase Emulator Suite only. On macOS:
  `brew install openjdk` then ensure it's on `PATH`
  (`export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"`).
- **Firebase CLI** — `npm install -g firebase-tools`.

```sh
npm install
```

---

## Local development (Firebase Emulator Suite)

No real Firebase project or billing is needed locally — everything runs against the
emulators. `.env` already ships with `VITE_USE_EMULATOR=true` and demo placeholder
config, so `src/firebase.ts` routes Auth + Firestore to `127.0.0.1`.

In separate terminals (or background the first):

```sh
# 1. Start the emulators (Auth + Firestore + Hosting UI). Needs Java on PATH.
npm run emulators

# 2. Seed coaches, clients, the exercise library and reports (idempotent — safe to re-run).
npm run seed

# 3. Run the app with hot reload.
npm run dev
```

Open the Vite URL it prints (e.g. http://localhost:5173). The emulator UI is at
http://127.0.0.1:4000.

### Demo logins (seeded)

Password for all coaches in dev: **`coach123`**

| Coach   | Email                         | Role   | Can see payments? |
|---------|-------------------------------|--------|-------------------|
| Madhan  | `madhan@elevatefitness.com`   | main   | ✅ yes            |
| Kiran   | `kiran@elevatefitness.com`    | junior | ❌ no             |
| Shakthi | `shakthi@elevatefitness.com`  | junior | ❌ no             |

The seed also creates 6 clients (with programs, exercises, history, payments,
billing, session logs) and a ~100-exercise shared library.

### Scripts

| Command            | What it does |
|--------------------|--------------|
| `npm run dev`      | Vite dev server (hot reload) |
| `npm run build`    | Type-check (`tsc -b`) + production build to `dist/` |
| `npm run lint`     | oxlint (`_prototype/` and `dist/` are excluded) |
| `npm run preview`  | Serve the built `dist/` locally |
| `npm run emulators`| Start Auth + Firestore + Hosting emulators |
| `npm run seed`     | Populate the target (emulator by default) — idempotent |

---

## Configuration

All Firebase config lives in **`.env`** (git-ignored). [`.env.example`](.env.example)
is the template:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# "true" → use the local Emulator Suite. Empty/false → use the real project above.
VITE_USE_EMULATOR=true
```

These values come from the Firebase console: **Project settings → General → Your apps
→ SDK setup and configuration**.

---

## Handover — going live on a real Firebase project

No code changes are required. The whole switch is config + seed + deploy.

1. **Create a Firebase project** at https://console.firebase.google.com.
   - Enable **Authentication → Email/Password**.
   - Create a **Cloud Firestore** database (production mode).

2. **Wire the web app config.** In the console, register a Web app and copy its SDK
   config into `.env`. Set `VITE_USE_EMULATOR` to empty/`false` so the app talks to
   the real project.

3. **Seed the real project** (one-time). The seeder uses the Firebase Admin SDK and
   needs a service-account key:
   - Console → **Project settings → Service accounts → Generate new private key**
     (downloads a JSON file). Keep it secret; never commit it.
   - Run:
     ```sh
     GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json \
     SEED_PROJECT_ID=your-real-project-id \
     npm run seed
     ```
   This creates the three coach accounts (with their `role` claims), the clients,
   and the exercise library. **Change the seeded passwords** afterwards, or edit the
   coach list in [`scripts/seed.ts`](scripts/seed.ts) before seeding.

4. **Point the Firebase CLI at the project and deploy.**
   ```sh
   firebase login
   firebase use your-real-project-id        # or edit .firebaserc
   npm run build                            # outputs to dist/
   firebase deploy                          # deploys Hosting + Firestore rules + indexes
   ```
   `firebase.json` serves `dist/` as a single-page app (all routes rewrite to
   `index.html`) and ships `firestore.rules` + `firestore.indexes.json`.

---

## Not yet built (deferred)

These were intentionally scoped out of the rewrite and can be added later:

- **Client assessment flow** (the onboarding "Flow B" measurement step).
- **Welcome / weekly-report PDFs** — generated on demand with html2pdf.js and shared
  via a `wa.me` link; never stored.

---

## Notes for developers

- **Never edit `main`** directly; the rewrite lives on its feature branch.
- Touching a Firestore mutation? Verify it **live against the emulator** before
  committing — sign in as both a main and a junior coach so the security rules are
  actually exercised (a junior can write billing but cannot read it).
- Keep new logic in the right layer: pure rules → `domain/`, Firestore I/O →
  `services/`, React glue → `hooks/`. Components call hooks, not Firestore.
