# Elevate Fitness

Mobile-first web app prototype for gym trainers to track clients' progress, schedules, and attendance, and to generate branded weekly PDF progress reports. Static site — no build step, no framework, opens directly in a browser.

## File structure

```
index.html           App shell — markup, font imports, html2pdf + Lucide CDNs, links to CSS/JS
css/styles.css        All styles (variables, components, layout)
js/app.js             All application logic — data, navigation, views, helpers
assets/images/        Brand assets (logo.jpg, madhan.jpg — the main trainer's photo)
assets/icons/         Source SVGs for the baseline-measurement icons (inlined into app.js with currentColor)
fittrack-full.html    Original single-file prototype (backup)
```

Chrome icons are rendered with [Lucide](https://lucide.dev/) (loaded from CDN); content/emoji icons are kept inline. `*.bak` files (`index.html.bak`, `css/styles.css.bak`, `js/app.js.bak`) are local backups and not part of the app.

## Typography

The app uses **Inter** (Google Fonts, weights 400/500/600/700/800) with a strict, token-driven type scale defined at the top of `css/styles.css`. **Type is small on purpose** — hierarchy comes from *weight and colour contrast*, not size. Body and metadata stay 12–14px and are usually grey (`--muted`); only names, card titles, and the single hero number per screen are white/large.

| Token          | Size | Weight | Used for                                          | Line height / tracking |
|----------------|------|--------|---------------------------------------------------|------------------------|
| `--text-hero`  | 40px | 800    | **One** hero number per screen max (key stat/balance) | 1.1 · −0.02em      |
| `--text-stat`  | 28px | 700    | Secondary big numbers (clock, detail stat row) — restrained, never the hero | 1 · −0.02em |
| `--text-xl`    | 22px | 700    | Page titles, client names                         | 1.15–1.25 · −0.01em    |
| `--text-lg`    | 15px | 600    | Card titles, names in lists                       | 1.3                    |
| `--text-md`    | 14px | 400–500| Body text, inputs, list rows (body default)       | 1.4                    |
| `--text-sm`    | 12px | 400–500| Labels, captions, timestamps, table cells (`--muted`) | 1.4                |
| `--text-xs`    | 11px | 500    | Tiny labels and tags                              | 1.4                    |

Weights are tokenised: `--weight-body` (400), `--weight-med` (500), `--weight-semi` (600), `--weight-bold` (700), `--weight-x` (800). The base size/weight/line-height (`--text-md` / `--weight-body` / 1.4) plus `font-variant-numeric:tabular-nums` are set on `body`, so most elements inherit and only deviations are declared.

The A4 **PDF documents** (report / welcome / assessment — `.rd-*`, `.rep-*`, `.rdoc`, welcome-letter `.wd-*`) keep their own purpose-built sizing and are intentionally **excluded** from the app size scale; they pick up Inter and the tokenised weights but not the size tokens. (Note: `.wd-name`/`.wd-total` are the app's *week-day* component, not the welcome doc, and do use the scale.)

The weekly PDF report is generated client-side with [html2pdf.js](https://github.com/eKoopmans/html2pdf.js) (loaded from CDN). Serve the app over HTTP (not `file://`) so the logo loads into the PDF canvas. The same `#rdoc`/`#rdocFrame` capture pipeline (`genPDF`, `downloadDocPDF`, `shareDocVia`) also renders the assessment and welcome documents.

## Colour & surfaces

The app is a **dark, premium fintech-style** theme — near-black background, **black + red**. Tokens are defined in the second `:root` block of `css/styles.css`; legacy semantic names (`--ink`, `--muted`, `--line`, `--card`, `--fill`…) are remapped onto these so the whole app flips from the tokens.

| Token            | Value                    | Role                                                      |
|------------------|--------------------------|-----------------------------------------------------------|
| `--bg`           | `#0A0A0A`                | Near-black app background                                 |
| `--surface` / `--card` | `#1A1A1A`          | Card surface — only *slightly* lighter than the bg        |
| `--surface-2` / `--card-2` | `#242424`      | Nested / secondary surface (one step lighter again)       |
| `--accent`       | `#E8112D`                | Bright red accent — used **sparingly** (see below)        |
| `--accent-soft`  | `rgba(232,17,45,0.12)`   | Faint red tint for backgrounds / selected chips           |
| `--accent-dark`  | `#B30E22`                | Pressed/hover state of accent buttons                     |
| `--text`         | `#FFFFFF`                | Primary text — names, card titles, hero numbers           |
| `--text-muted`   | `#8A8A8A`                | Secondary text — metadata, labels, timestamps (most text) |
| `--text-dim`     | `#5A5A5A`                | Tertiary — very low-emphasis text                         |
| `--border` / `--border-subtle` | `rgba(255,255,255,0.06)` | Barely-visible card separation              |

**Cards are separated by their subtle lightness lift on the bg, not by borders or heavy shadows.** The 6%-alpha hairline is intentionally near-invisible; only a very soft `--elev-shadow` (`0 2px 12px rgba(0,0,0,0.3)`) is used for lift where needed, and rarely. Semantic colours (green = done/paid, amber = due/warning, red = overdue, blue/purple = info) keep their meaning but appear only as **small** tinted pills, dots, and icon tiles — never as large fills.

### Accent used sparingly — the core rule

The whole effect depends on **red being rare**. The accent appears on **at most one major element per screen** — e.g. the active nav tab, *or* the active filter pill, *or* one hero card, *or* the primary CTA — not all of them. One hero element per screen may use the vibrant-red treatment (e.g. a client's "Today's session" card + its **Open session** CTA, or the bottom-sheet primary button). Everything else stays dark. When in doubt, make it dark, not red. Status indicators are the exception (they keep semantic colour) but only at small sizes.

## Corner radius

One consistent, generous rounding everywhere — core to the premium feel.

| Token            | Value   | Applied to                                  |
|------------------|---------|---------------------------------------------|
| `--r-card` / `--radius-card` | `22px` | All cards / list rows / sheets  |
| `--r-tile` / `--radius-inner` | `14px` | Nested tiles, buttons, inputs inside cards |
| `--radius-pill`  | `999px` | Toggle/segment pills, tags, the active-state pill |

## Avatars

Client/coach avatars are **small rounded squares, not circles** — they sit quietly beside the name. List avatars are **40px** (radius 12px); header avatars (client/session detail) are **48px** max. Initials avatars keep their per-category colour tint (set inline) on a dark base; only the shape is fixed in CSS (`.ava, .dava, .es-ava, .eh-ava, .pm-ava, .topbar-ava`). Chrome icon circles (icon buttons, activity dots) are **not** avatars and remain round. The PDF documents' avatars (`.rd-avatar`, `.wd-photo`) are excluded.

> The generated A4 **PDF documents** (`.rdoc` / `.wd-*` / `.rd-*`, scoped under `#rdoc`) keep their own light Elevate-Fitness brand styling and are intentionally **excluded** from this dark app theme.

The **welcome letter** (`welcomeDocHTML`, all `.wd-` scoped styling) is an Elevate-Fitness-branded A4 built entirely from live client + coach data, in order: **hero** (black, red-accent, logo + headline) → **user details** (avatar + contact + a per-client motivational quote chosen by `client.id`) → **two-column** Assessment Summary (Body Type / Fitness Level / Primary Goal / Focus Areas tiles) + Your Schedule (days / time / duration / start date) → **coach card** (photo or initials, bio, contact, tagline) → **footer banner** → **contact bar** → **social bar**. `assessDocHTML` carries the same black-hero / red-accent header + pink footer strip for visual coherence.

## State model

All state is in-memory; nothing persists across reloads.

### `S` — global navigation/UI state

| Key          | Purpose                                          |
|--------------|--------------------------------------------------|
| `tab`        | Active bottom-nav tab (`home`, `clients`, `schedule`, `reports`, `more`) |
| `view`       | Pushed screen name, or `null` when on a tab      |
| `clientId`   | Currently selected client ID                     |
| `ctab`       | **Legacy** — client detail is now a one-page layout (see below), so `ctab` is no longer the source of truth. Still written by `openClient` (`'overview'`) for back-compat; `setCtab` is a shim that scroll-spies/drills instead. |
| `subView`    | Which client-detail **drill-in** is stacked over the long page (`null` \| `'program'` \| `'sessions'` \| `'progress'` \| `'payment'` \| `'media'`). `progSub` (`'current'`/`'history'`) is the Program drill-in's inner tab; `clientScroll` remembers the long-page scroll position. |
| `histRange`, `histMeasure` | History tab — trend granularity (`month`/`year`) and selected measurement |
| `week`       | Selected program week (1–6)                      |
| `role`       | Active profile, switched via the home-header dropdown (`main`, `junior`, `client`) |
| `gridMode`   | Program view toggle (`cards` or `grid`)           |
| `reorder`    | Program tab is in drag-to-reorder mode            |
| `onCat`, `onAbility`, `onDays`, `onTime`, `onCoach`, `onMsg` | Shared draft state for the staged add flows |
| `attachTo`   | Client ID when adding exercises from library, else `null` |
| `attachMode` / `attachReturn` / `attachProgIdx` | Library attach context — `attachMode` (`'newProgram'` or `null`), `attachReturn` (`'session'` / `'program'` / `null`, where the picker came from), `attachProgIdx` (target session-program index). Together they drive `libraryParent()` (see *Back navigation*) |
| `picks`      | Library exercise indices selected for attachment  |
| `newProg` / `newEx` | Draft state for the **start-new-program** dialog and the **add-new-exercise** sheet (`renderNewProgramModal` / `renderAddExerciseModal`) |
| `effFrom`    | When attached exercises take effect (`now`, `next`, or a date string) |
| `libQ`       | Exercise-library search query (name + category substring match) |
| `libGroup`   | Selected muscle-group filter chip (`All` or one of the `LIB_GROUPS`) |
| `measure`    | Selected measurement key in progress charts       |
| `programDetailId` / `pdFrom` | Program-detail route — which program is shown (`'current'` or a history id) and where it was opened from (`'history'` vs the client Program tab), used by `parentOf()` for back |
| `sessionFrom` / `reportFrom` | Origin breadcrumbs for the two screens with two real entry points — a session (opened from a client vs the schedule) and a report (from a client vs the Reports tab); used by `parentOf()` so Back goes up to the right place |
| `assessSrc`  | Whether the assessment preview (`assessDoc`) is a `'draft'` (mid-onboarding) or saved on a `'client'` — also drives its back target |

### Module-level data stores

| Variable      | Shape                              | Purpose                                |
|---------------|------------------------------------|----------------------------------------|
| `clients`     | `[{id, name, exercises, ...}]`     | All client records (mock data)         |
| `coaches`     | `[{name, role, clients, photo?, phone, email, yearsExp, specializations[], certifications[], tagline}]` | Coach roster. Bio fields (`phone`/`email`/`yearsExp`/`specializations`/`certifications`/`tagline`) feed the welcome-letter coach card; Madhan has a `photo`, juniors fall back to an initials avatar |
| `announcements` | `[{type, title, msg, ...}]`     | Sent announcements                     |
| `library`     | `[{n, g, c, t}]`                 | Exercise library catalog — ~90 exercises grouped by **primary muscle group** (`g`). `n` = name, `g` = muscle group (Quads, Hamstrings, Glutes, Calves, Chest, Back, Shoulders, Biceps, Triceps, Core, Cardio, Mobility, Rehab), `c` = category description string (filtering also matches on this), `t` = default target. `LIB_GROUPS` is the chip order (`All` first, then the 13 groups alphabetically); `MUSCLE_COLORS` maps each group → `{c, b}` palette tokens for the small colored tag (`muscleColor(g)` falls back to neutral grey for unknown groups). |
| `reports`     | `[{clientId, week, sent, when}]`  | Report send status                     |
| `reviewState` | `{clientId: {due, ago}}`          | Weekly review tracking per client      |
| `sessDone`    | `{clientId: true \| 'closed'}`    | Session completion status for today (still drives Home's *Completed* badge) |
| `exDone`      | `{clientId: {exerciseName: bool}}`| Legacy flat-checklist checkmarks (superseded by `sessionProgress`) |
| `sessionProgress` | `{'clientId::YYYY-MM-DD': {programs, splitDone, currentProgramIdx, …}}` | Per-client, per-day **live** circuit state (today only) — see *Today's session view* below |
| `sessionExtras` | `{'clientId::YYYY-MM-DD': [{name, g, target, logs}]}` | **Session-only** exercise adds — exercises added *for today's session only*, never written to `c.exercises`, so they don't touch the standing program / this week / future days. Folded into `sessionExercises(c)` and looked up via `sessExMeta(c, name)` — see *Today's session view* below |
| `sessionExcludes` | `{'clientId::YYYY-MM-DD': [name]}` | **Session-only** removals — standing-program exercises the coach dropped from *today's* session. Filtered out of `sessionExercises(c)` but left in `c.exercises`, so the program is untouched. Re-adding the exercise un-excludes it |
| `sessionLog`  | `{clientId: [{date, when, early, roundsCompleted, totalRounds, programs}]}` | Permanent archive of **completed** sessions (newest first). Invalidation never erases it — see *Today's session view* below |
| `attStatus`   | `{clientId: 'present' \| 'absent' \| 'cancelled'}` | Client attendance status |
| `attTime`     | `{clientId: string}`              | Timestamp when attendance was marked   |
| `activityLog` | `[{type, msg, when, meta}]`       | In-memory activity feed (newest first) — `'PAYMENT'`/`'SESSION'`/`'PROGRAM'` events surfaced on Home (`logActivity`) |

### Seed data (demo scenarios)

All seeds are in `js/app.js` and chosen so every UI state has something to show:

- **6 clients** (`clients`, `nextId` starts at 7): **Arjun Mehta** (Sports specific, mid-program, paid), **Meera Nair** (Rehab, balance 0 → *due soon*), **Kavya Singh** (General wellness, balance 0 + 10 days → *overdue*), **Dev Krishnan** (Special children, paid), **Sara Pinto** (General wellness, **Paused**), and **Nisha Reddy** (id 6 — a brand-new lead added via Flow A only: `assessmentDone/scheduleDone/scheduleSet` all false, `coach:null`, no payments/program). The five pre-existing clients are back-filled to fully-active (`clients.forEach` defaults the lifecycle flags they predate).
- **3 coaches** (`coaches`): **Madhan** (Main trainer, has a photo, clients 1/3/4), **Suchitha** (Junior, clients 2/5), and **Arun** (Junior, **no clients** — an unassigned coach). Juniors fall back to an initials avatar.
- **Seed IIFEs:** `seedPayments()` (legacy program-cycle fields), `seedPackages()` (package balances / payment history / `lastSessionDate`), `seedProgramHistory()` (1–2 archived programs per existing client + names/dates the active program), and `seedSessions()` (today's circuit state: Arjun unstarted with a ready A/B circuit auto-built from his standing program, Meera mid-Program-A, Kavya fully complete — plus a few real `sessionLog` history records for Arjun & Kavya). Coach activity is **derived** from `sessionLog`, so there is no coach-attendance seed.
- The home-header **profile switcher** (`PROFILES`) toggles `S.role` between *Coach Madhan* (main), *Coach Suchitha* (junior — sees only Meera & Sara), and *Arjun Mehta* (client view).

## Adding a client — staged flow

Setting up a client happens in separately-triggered steps rather than one wizard, tracked by three boolean flags on each client (`assessmentDone`, `scheduleDone`, `scheduleSet`). After Flow A creates the lead, the pending-overview **Next steps** card walks the coach through three progressively-unlocked steps (assessment → schedule & coach → welcome note), showing *"X of 3 completed"*:

- **Flow A — Add client** (`vAddClient`, from the Clients **+** FAB → `openAddClient()`): name, age, phone, email, category/ability + the questionnaire. Creates the client with `assessmentDone:false`, `scheduleDone:false`, `scheduleSet:false`, `coach:null` and no `program`/`days`/`time`. Validation: name + phone. Lands on the new client's pending detail.
- **Flow B — Add assessment** (`vAddAssessment`, from the Next-steps step 1 → `openAddAssessment(id)`): an **assessment fee** (Pending/Paid) that **gates** the rest of the screen — baseline measurements, performance ratings, a **client-profile** chip card (Body Type / Fitness Level / Primary Goal — single-select; Focus Areas — multi-select), and notes stay locked until the fee is marked Paid. *Save draft* (`saveAssessmentDraft`) persists partial work with `assessmentDone` still false; *Mark complete* (`submitAddAssessment`, requires Paid) sets `assessmentDone:true`, `assessmentPaid`, and `c.assessment.{bodyType, fitnessLevel, primaryGoal, focusAreas[]}` — these populate the welcome letter's Assessment Summary tiles. Share preview: `vAssessDoc` / `previewAssessment`.
- **Flow C step 2 — Add schedule & coach** (`vAddSchedule`, Next-steps step 2 → `openAddSchedule(id)`, unlocked once the assessment is done): a **program fee** (Pending/Paid) that gates training days, time, coach, program length, **session duration** (45/60/75/90, → `c.sessionDuration`) and **program start date** (→ `c.programStartDate`). `submitAddSchedule` (requires Paid + days + time + coach + length) builds `c.program` (seeding `paidOn`/`paidDate`) and sets `scheduleDone:true` — *not* yet `scheduleSet`.
- **Flow C step 3 — Welcome note** (`vAddWelcome`, Next-steps step 3 → `openAddWelcome(id)`, unlocked once the schedule is saved): the first-assessment **summary** textarea + a **welcome message** picker (`MSGS`), with a read-only recap of days/time/program/coach. `submitAddWelcome` stores `c.welcomeMsg`/`c.assessment.summary`, sets `scheduleSet:true` (full activation), then opens the welcome doc (`vWelcomeDoc`).

**New client lifecycle fields** added by these flows: `c.assessment.{bodyType, fitnessLevel, primaryGoal, focusAreas[], summary}`, `c.welcomeMsg`, `c.sessionDuration`, `c.programStartDate`, and `c.program.paidDate` (the date a program payment was recorded, alongside the existing `paidOn`).

Only the two **basics** step bodies are extracted as reusable functions — `stepDetails()` and `stepQuestionnaire()`, composed by `vAddClient`. The assessment, schedule and welcome screens are each rendered inline in the `.as-card` style by `vAddAssessment` / `vAddSchedule` / `vAddWelcome` (assessment helpers: `asMeasure`, `asRatingRow`, `asProfileGroup`). The shared `onForm` draft + `S.on*` state are reset by each `open*` handler.

`clientStage(c)` returns `'Assessment pending'` / `'Schedule pending'` / `'Welcome note pending'` / `null`; `stageTagHTML(c)` renders it on client-list rows and the detail header (amber tag for *Assessment pending*, blue for the other two). While `!c.scheduleSet` the client detail shows only a **pending Overview** (basics + questionnaire + action cards) with no sub-tabs (this path is unchanged); once set up, the one-page detail (see *Client detail — one-page layout* below) renders. Clients with `!scheduleSet` are excluded from Home's *Today's sessions*, the *Schedule* tab, and *Reports* — they appear only in the Clients tab.

## Package-based session balance (payment model)

Clients buy **packages of N sessions** upfront. Each completed session consumes one (`sessionsRemaining--`); when the balance hits 0 a renewal is due (usually the same package size). This is the source of truth for the payment UI. The legacy program-cycle fields (`c.program.*`, `c.assessmentPaid`) are still seeded for backward compatibility but no longer drive payment state.

**Per-client fields** (seeded by `seedPackages()`):

| Field | Shape | Purpose |
|-------|-------|---------|
| `sessionsRemaining` | number | Live balance, decremented one per completed session |
| `packageSize` | number | Last package size purchased (pre-fills the next renewal; defaults 12) |
| `payments` | `[{id, date:'YYYY-MM-DD', type:'package'\|'assessment', packageSize:number\|null, sessions:number\|null, status:'Paid'\|'Pending', notes}]` | Full payment history |
| `lastSessionDate` | `'YYYY-MM-DD'`\|null | Set on session completion; drives the overdue computation |

**Constants:** `PACKAGE_SIZES = [12, 16, 24]`, `ASSESSMENT_FEE_LABEL`, `OVERDUE_DAYS_AFTER_BALANCE_ZERO = 7`.

**Status helpers:**

- `paymentStatus(c)` → `'Paid'` (balance > 0) / `'DueSoon'` (balance 0, within the grace window or no last-session date) / `'Overdue'` (balance 0 and > 7 days since the last session) / `'New'` (no payments yet).
- `daysOverdue(c)` → days past the 7-day grace window (0 unless `Overdue`).
- `projectedRenewalDate(c)` → estimated `'YYYY-MM-DD'` when the balance will run out, from remaining sessions ÷ weekly cadence (null when balance ≤ 0 or no schedule).
- `paymentDue(c)` is kept for back-compat and now returns `true` when `paymentStatus` is `DueSoon`/`Overdue`.
- `lifetimeSessions(c)` → total package sessions ever purchased (assessment fees add 0).

Surfaced for action in four places:

- **Home dashboard** — *Critical Alerts* surfaces *Payment Overdue* / *Membership Expiring* rows, and the *Quick Stats* / *Client Insights* cards show *Pending Payments* etc. Each is clickable and deep-links to the matching filtered Clients list via `goStat('Payment due' | 'Payment overdue' | 'Membership expiring')` (see *Home dashboard — every stat is a deep link*).
- **Clients list** — the *Payment due* filter shows `DueSoon`/`Overdue` clients; each row shows a status tag (amber *"💳 Payment due soon"* / red *"💳 Overdue · X days"*) plus a subtle *"X sessions left"* subtitle.
- **Client Overview** — a unified **Program & Payment** card (`programPaymentCard(c)`): headline *"X of Y sessions remaining"*, package size + cadence, last-paid date, projected renewal (when balance > 0), a status pill, and a *+ Record payment* button. New leads (no payments) instead show *"No package purchased yet"* + *+ Add first payment* (defaulting the dialog to an assessment fee).
- **Notifications** — `programEndedClients()` (now: active clients with `DueSoon`/`Overdue`) adds renewal rows that open the client's Payment tab; these also feed the top-bar bell badge.

**Payment drill-in** (`vClientPayment(clientId)` → wraps `paymentTabContent(c)`; reached via the Payment section's *View more* or `openClientSection('payment')`): three **summary stat cards** (Sessions purchased lifetime · Last payment date + description · Payment status pill), then a *Payment history* card — a *+ Add payment* header and a **table** (DATE · DESCRIPTION · TYPE chip · SESSIONS · STATUS pill · ACTION) with a chronological (newest-first) row per record, closing with *"Total: N payments · X sessions purchased lifetime"*. The ACTION column holds a compact **⋮ kebab** that opens the edit popup. The table scrolls horizontally on narrow screens and the cards stack at ≤640px. Empty state when no payments. **Money-free by design — no amounts/₹ anywhere** (the mockup's Amount column and "Total paid" are intentionally omitted).

**Add/Edit popup** (`openPaymentForm(id, paymentId?)` → `renderPaymentModal()`): a bottom-sheet **modal** (the `.modal-overlay`/`.modal-sheet` pattern, not a pushed page) mounted via `insertAdjacentHTML`. *+ Add payment* / *+ Record payment* / *+ Add first payment* and the row's ⋮ kebab all open it. Fields: Type segmented control (Package / Assessment fee), package-size chips (`PACKAGE_SIZES` + *Other* → number input, shown only for packages), Paid/Pending status, a *Date paid* picker (hidden when Pending), and optional notes; structural toggles re-render the sheet via `renderPaymentModal()` while text inputs sync on `oninput` (so they keep focus). **Add** stacks the package onto the existing balance (`sessionsRemaining += size`, `packageSize = size`). **Edit** replays history via `recomputeBalance(c, consumed)` — sessions already consumed (`lifetimeSessions − sessionsRemaining`, captured before the change) are preserved, so changing or deleting a record recomputes the balance safely rather than diffing. **Delete** (link inside the edit popup) confirms, removes the record, and recomputes. On submit/delete the popup closes (`closePaymentModal()`) and the page re-renders. Every add/edit/delete calls `logActivity('PAYMENT', …)`.

**Activity log:** `logActivity(type, msg, meta)` unshifts onto the in-memory `activityLog` (newest first); `'PAYMENT'` events (add/edit/delete), `'SESSION'` events (completion), and `'PROGRAM'` events (archive / start-new) render at the top of the Home *Activity* list (icon map in `activityRowsHTML`).

## Program archive (program history)

Each client builds up a history of past programs the same way `payments` records past payments. The **current/active program** continues to live at `c.program` + `c.exercises` (canonical — nothing reads `programHistory[0]` as if it were current); a program becomes a history entry only at a **program boundary**.

**Per-client field:**

| Field | Shape | Purpose |
|-------|-------|---------|
| `programHistory` | `[{id, name, no, startDate:'YYYY-MM-DD', endDate:'YYYY-MM-DD', weeks, perWeek, sessionsCompleted, exercises:[{name, target}], notes}]` | Archived past programs, oldest first. Seeded with 1–2 realistic blocks per existing client (`seedProgramHistory()`); Nisha (new lead) has none. |

The active `c.program` now also carries a `name` and `startDate` (added by the seed / by `startNewProgram`) alongside the existing `{no, weeks, perWeek, done, paid, fee, paidDate}`.

**Helpers** (global):

- `archiveCurrentProgram(c, opts)` — snapshots `c.program` + `c.exercises` into a new `programHistory` entry (`opts.endDate` defaults to today, `opts.notes`/`opts.name` optional). **Does not** clear `c.program`/`c.exercises` — that's the caller's job. Returns the archived record and logs a `'PROGRAM'` activity (`"Archived program …"` with a `detail` of sessions/weeks).
- `startNewProgram(c, {name, weeks, perWeek, exercises, startDate})` — archives the current program (if one exists), then installs the new one: increments `c.program.no`, resets `done` to 0, sets `paid:false`, and replaces `c.exercises`. Logs a `'PROGRAM'` activity (`"Started new program …"`).
- `nextProgramHistoryId(c)` / `programDisplayName(c)` — id allocator and current-program label helper.

**Program boundaries** (where history is created) are explicit *start-a-new-program* events only — currently the **Start new program** flow (`startNewProgramFlow(clientId)` → small dialog for name/weeks/cadence → the library attach flow in `S.attachMode==='newProgram'` with an empty pre-selection → `saveNewProgramExercises()` → `startNewProgram()` → client overview, toast *"New program started"*). **Mid-program exercise edits** via the Program tab's *Add from library* flow (`attachPicked`) just update `c.exercises` in place and do **not** create a history entry.

> **Note on payments:** the legacy program-cycle "Continue same program" / "Change program" branches described in earlier specs no longer exist — the payment flow is the package-based model (above), where recording a package *stacks* sessions onto the balance and is decoupled from program cycles. Package renewals therefore do **not** archive a program. Program archiving happens through `startNewProgram` (and any future flow that calls it), keeping program boundaries an explicit action rather than a side effect of payment.

**Views** (read-only): `vProgramHistory(clientId)` lists the **Current program** card (red-tinted, *"Current program"* label) above the archived programs newest-first — each card showing name + *Program #N*, date range, a `weeks · /week · X of Y sessions completed` stat row, a truncated horizontal exercise list, and a *View details* button. `vProgramDetail(clientId, programId)` shows one program's full exercise list with targets (read-only; `programId='current'` resolves to the live program). Empty states cover *no history yet but a current program runs* vs *no programs at all*. The reusable body is `programHistoryBody(c)`. The real entry point is the **History** tab of the client-detail Program drill-in (`vClientProgram`'s Current/History toggle renders `programHistoryBody`); the standalone `programHistory` / `programDetail` routes are reached from temporary **Test:** rows in **More** (Arjun's / Meera's / Nisha's-empty histories + *start new program for Arjun*).

## Coach activity (derived — no clock-in gate)

The separate **Coach attendance** clock-in/out screen and the action gate that used to block work until a coach clocked in have both been **removed**. There is no `coachAttendance` store, no `requireClockedIn`/`isClockedIn` gate, and no `coachAtt` view — **every screen is actionable without any clock-in step**.

Coach activity is now **derived from `sessionLog`** (the permanent record of completed sessions):

- `coachSessionsThisMonth(name)` / `coachActiveDaysThisMonth(name)` count this month's completed sessions and the distinct days a coach ran one.
- These feed the Home header's summary line — *"This month · N sessions · M days active"* (`eh-derived`).
- `currentCoach()` still resolves the logged-in coach's name from the role (`junior` → first junior trainer, otherwise the main trainer / `TRAINER`).

The `.locked` CSS class and `lk()` helper survive but are unused; nothing is visually locked.

## Today's session view — circuit (Programs A/B)

`vSession()` (the `session` VIEW, opened via `openSession(id)`) runs a **two-circuit (Program A / Program B) round-based workout**. Every state shares one header (`sessHeader(c, chip)`, `.sx-head2`): avatar left, the client name with *date · time · coach* stacked beside it, and the attendance pill + change-attendance **⋯** pinned to the top-right (`sessAttChip` builds the pill; the *before-present* state passes an empty chip). The attendance states are unchanged; the *present* state is what's new:

- **Before present** — a **slide-to-mark-present** control (`wireSlide`); *"Not present? More options"* links to `vAttMore` (Present / Absent / Cancelled). Marking present is **ungated** — completing the slide calls `setAttendance(id,'present')` and the circuit auto-starts (no clock-in step).
- **Closed** (absent / cancelled) — a closed-state panel with an **Undo**.
- **Present, <2 real exercises** — a *"Need at least 2 exercises in the Program tab first"* panel linking to the Program drill-in.
- **Present** — **marking present starts the session immediately** (no organise/split gate): `autoStartSession(id)` applies the default A/B split and drops straight into the running circuit. The organise/split screen is reached only on demand via **⋯ → Edit programs & rounds**.

### Session-progress state

Per-client, per-day progress lives in a module-level store **separate** from the legacy `sessDone`/`exDone`:

```js
let sessionProgress = {};   // keyed 'clientId::YYYY-MM-DD'  (sessKey(id))
```

Shape: `{ clientId, date, splitDone:false, started:false, currentProgramIdx:0, programs:[ {label:'Program A', exercises:[name], sets:3, progress:{}, weights:{name:kg}, reps:{name:n}}, {label:'Program B', …} ] }`. Each program also carries a **`weights`** map (per-exercise working load, kg) and a **`reps`** map (per-exercise rep count) — both keyed by exercise name and edited from the builder card (see below); absent entries fall back to `0` (weight) / the exercise's target reps. **`programs` is a variable-length list** — there are always at least 1 and up to 6 circuits (Program A–F). Each program is its own circuit: its `exercises` run in order, repeated for **its own** `sets` (round count), and only when a program is fully complete does the workout advance to the next. `progress` is keyed `'round:exerciseName'` → `true` (1-based rounds). `started` flips true the first time the session runs and never flips back — so reopening the organise screen via ⋯ → Edit never re-triggers the auto-start. `getSession(id)` reads it; `ensureSession(c)` lazily builds a fresh state via `buildSessionState(c)` (default split: first half of the real exercises → A, second half → B, 3 sets each). `sessionExercises(c)` is the real, today-relevant list (drops `future` adds + the *Tap to add exercise* placeholder, adds today's session-only extras, minus today's removals).

Program slots are labelled and coloured by index via `progLabel(i)` (A, B, C…), `progLetter(i)`, and `progColor(i)` (`PROG_COLORS` = `['a'..'f']` → blue/amber/purple/green/red/pink header classes). `relabelPrograms(st)` keeps labels in A,B,C order after any add/remove.

**Helpers** (all global): `roundComplete(prog, round)`, `programComplete(prog)`, `nextExerciseInRound(prog, round)` (the *Next* highlight), `currentRound(prog)` (lowest incomplete round), `advanceProgram(st)` (hop to the next non-empty, incomplete program), `sessionComplete(st)`. Empty programs count as complete so they never block (lets a one-program seed finish cleanly).

**All programs are always on screen** in every phase — split, workout, and complete each render every program as a **section** (a shared header helper `cwSecHead(p, colorCls, status, dots, active, done)` + per-program round dots via `cwDots`). The active program's header is a solid colour banner (per `progColor`); the others are grey headers labelled *Up next* / *Complete ✓*. So the coach can always read every circuit's exercise list.

### Program-builder card (`builderSection`)

Both the pre-start builder (`preStartBuilder`) and the ⋯ → Edit split screen render each program as a **`.pb-card`** — an orange program title with a **No. of Sets** stepper (`bumpSets`, the round count), then one row per exercise, then a footer of **＋ Add exercises** (`addExercisesToProgram`, scoped to this program) and **Remove**. Each exercise row (matching the Figma) shows the **name + muscle-group subtitle** and two pill steppers — **REPS** and **WEIGHTS** — plus an **✕** to drop it:

- **REPS** — `exRepCount(p, name, meta)` reads `p.reps[name]`, falling back to `repTarget(meta)` (parsed from the exercise's target, e.g. `3×10` → 10). `bumpReps(id, idx, name, ±1)` edits it (min 1).
- **WEIGHTS** — `exWeight(p, name)` reads `p.weights[name]` (default 0); `bumpWeight(id, idx, name, ±1)` steps it by 2.5 kg (min 0).

Both are **builder-level planning values** stored on the live session program; they are not yet surfaced in the running circuit or session history.

### PART 1 — Organise / split screen (`splitDone:false`, `splitScreen(c, st)`)

**Not a mandatory step** — marking present auto-starts the session, so this screen is only reached via **⋯ → Edit programs & rounds** (`editSplit` → `started:true`, `splitDone:false`). One section per program (A, B, C…), each listing its assigned exercises; every exercise card carries a segmented control with **one button per program** (`assignExercise(id, name, idx)` moves it into that program, re-sorting into canonical order) plus a **✕** (`dropSessionEx`) to drop it from today. Each program section has its **own 2 / 3 / 4 / 5 rounds selector** (`setProgramSets(id, idx, n)` — programs can run different round counts) and, when more than one program exists, a **✕ remove** button (`removeProgram(id, idx)` — its exercises move to a neighbouring program so nothing is lost; keeps ≥ 1 program). A **＋ Add another program** button (`addProgram(id)`, capped at 6) appends an empty circuit inheriting Program A's round count. The bottom button (`startCircuitSession`, labelled *Start session* on a fresh session or *Done — back to workout* when editing a running one) is disabled unless total exercises ≥ 2 with at least one non-empty program; on confirm it drops progress for any exercise that moved out of a program (kept exercises keep theirs), resumes at the first non-empty/incomplete program, sets `splitDone:true`/`started:true`, and logs `'SESSION'` *"Started session with X · N programs × T exercises"*.

### PART 2 — Circuit workout (`splitDone:true`, `circuitWorkout(c, st)`)

Both program sections show, each with its round-dots (filled = round done, ringed = current). The **active** program (`currentProgramIdx`) is the coloured-header section: its current-round exercises are tappable cards (name + target, *Next*-highlighted, green tick when done) and `toggleCircuitEx(id, name)` ticks one for the **current round** (soft order — tap any). The **other** program stays visible read-only — dimmed (`cw-dim`) when *Up next*, ticked when already *Complete*. When the round completes it **auto-advances** (next round's keys are empty, so cards reset) with a *"Round complete!"* toast; when a program completes the next becomes the active section with a transition toast; when the last program completes it calls `finishCircuitSession(id, false)`.

`finishCircuitSession(id, early)` fires the canonical completion side effects — `sessDone[id]=true`, `c.sessions++`, legacy program cycle advances, `sessionsRemaining--`, `lastSessionDate` stamped, `'SESSION'` activity logged (the *"Session completed … sessions left"* message is unchanged; `early` instead logs *"Ended session early with X (N of M rounds)"*), then the celebration. It also calls **`recordSessionHistory(id, early)`**, which archives the session into `sessionLog[id]` (rounds done/total via `sessionRoundCounts`, plus a snapshot of each program's label/sets/exercises). `sessCompleteView(c)` is the resting state for an already-finished day: it **keeps both program sections on screen** with every exercise ticked green (nothing is hidden), shows a *Session complete* summary, and links to *View session history*. It is fully **read-only — no reset and no new-session affordance**; a finished session stays finished (a page reload re-seeds for testing).

### Session history (`sessionLog`)

Completed/ended sessions are kept **permanently** in `sessionLog` (per client, newest first) — this is independent of today's live `sessionProgress`, so **resetting or invalidating a session never erases past records**. `recordSessionHistory` upserts by date, so redoing a session after a reset replaces today's record rather than duplicating it. The Sessions drill-in's `sessionHistoryBlock(c)` renders these real archived sessions (via `sessHistRow`) at the top — *"Circuit · Programs A ×3 · B ×3"*, rounds done/total, an *Ended early* badge when applicable — above the synthesised filler rows (which skip any date already covered by a real record). `seedSessions()` seeds a few real records (Kavya today, two past sessions for Arjun) so the tab isn't empty.

### Session-options menu (⋯) and invalidation

Every session screen carries a **⋯** menu (`openSessMenu`) — the before-present, split, and active-workout bars all show it. It's **phase-aware**: every phase offers **Add or remove exercises** (`buildSessionProgram` → the session-only library picker), and *during* an active workout (`splitDone`, not complete) it additionally offers **Edit split** (`editSplit` → `splitDone:false`, preserving progress for exercises that stay in the same program) and **End session early** (`endSessionEarly` → confirm → `finishCircuitSession(id, true)`). There is no manual reset. Switching attendance away from present (`changeAtt`) clears the day's live `sessionProgress`. Neither these nor invalidation touch `sessionLog` — a session already saved to history stays in history.

When `c.exercises` changes — library attach (`attachPicked`), `removeEx`, drag-reorder (`wireReorder`), or `startNewProgram` — `invalidateSession(id)` deletes today's live `sessionProgress` (not `sessionLog`) and toasts *"Session reset due to program change"*, so the split screen rebuilds on next open. The `seedSessions()` IIFE seeds Arjun (split screen), Meera (mid-Program-A resume), and Kavya (fully complete) for testing.

### Adding exercises to today's session only

A coach can **add or remove exercises just for today's session** without changing the standing program. The affordance is reachable two ways on every session page: the `sessAddBtn(id)` button and the **⋯ → Add or remove exercises** menu item (both before and during the workout), each calling `buildSessionProgram(id)` → the library picker in **session mode** (`S.attachReturn==='session'`). The split screen also has a per-exercise **✕** (`dropSessionEx`) for quick inline removal. Session mode drops the *This week / Next week* effective-date box (irrelevant — it's today-only) and shows a *"…won't change the standing program"* banner; in the picker, anything already in today's session shows a removable *✓ In session* (`removeFromSession`), everything else a *+ Add*.

On confirm, `attachPicked` detects session mode and calls **`addSessionExtras(c, items)`** instead of writing to `c.exercises`:
- Brand-new picks are stored in `sessionExtras['clientId::today']` (exercise objects with `name`/`g`/`target`/`logs`), **never** in `c.exercises` — so they never appear in the Program tab, this week's plan, the 6-week grid, reorder, or any future day. A pick that is a program exercise previously removed today simply gets **un-excluded** (pulled from `sessionExcludes`) rather than duplicated.
- `sessionExercises(c)` returns the standing program (non-future, non-placeholder) **concatenated with** today's extras, **minus** today's excludes, so the circuit builder and target lookups (`sessExMeta`) pick them up transparently.
- If a **live session already exists** (split being built or workout in progress), additions are merged in **without resetting progress** (appended to the active program mid-workout, or balanced to the shortest program while splitting) and removals (`dropSessionExercise`) pull the name out of every program and clear its progress keys. No `invalidateSession` call, so an in-progress circuit survives the edit.
- Removal routes by origin: a session-only add is spliced from `sessionExtras`; a standing-program exercise is added to `sessionExcludes` (program left intact). `removeFromSession(libIdx)` (picker) and `dropSessionEx(id, name)` (split-screen ✕) both go through `dropSessionExercise`.

`sessionExtras`/`sessionExcludes` are keyed by date so edits are scoped to today; `invalidateSession`/`changeAtt` clear `sessionProgress` but leave them intact, so the rebuilt circuit still reflects them.

## Client detail — one-page layout

A fully set-up client (`c.scheduleSet`) renders as **one long scrollable page** (`vClient`, wrapped in `.client-detail`) instead of six swapped tabs:

1. The unchanged **header** (back bar + `.dhead` avatar/name/tags/payment-standing card). In the long page the title bar is made non-sticky (`.client-detail .bar.solid{position:static}`) so the whole header scrolls away.
2. A **sticky anchor sub-tab bar** (`.subtabs.anchor-tabs`, `position:sticky;top:0;z-index:10`) — the same six buttons (Overview/Program/Sessions/Progress/Payment/Media), now anchor links. Tapping one calls `scrollToSection('sec-…')` → `scrollIntoView({behavior:'smooth',block:'start'})`. `wireScrollSpy()` (called from `render()` when `S.view==='client' && !S.subView`) runs an `IntersectionObserver` rooted on `#screen` that highlights the in-view section's button with the existing `.on` class; it disconnects + recreates each render so it never leaks.
3. Six stacked `<section id="sec-overview|program|sessions|progress|payment|media" class="ds-section">`. **Overview** renders `tabOverview()` in full (no collapse). The other five render a lightweight **preview** (`overviewSection`/`programSection`/`sessionsSection`/`progressSection`/`paymentSection`/`mediaSection`, each built from `dsSecHeader` + `dsViewMore`) with a **View more →** button.

**Drill-ins.** *View more* calls `openClientSection(section)` which stores the scroll position in `S.clientScroll`, sets `S.subView`, and re-renders. When `S.subView` is set, `vClient` returns the matching drill-in **in place of** the long page (these are not routed VIEWS — they render through the `client` view): `vClientProgram` (a *Current* / *History* toggle — Current is `tabProgram()` with every interaction intact; History is `programHistoryBody(c)` from the program-archive work), `vClientSessions` (`tabSessions()` + a synthesized `sessionHistoryBlock`), `vClientProgress` (`tabProgress()`), `vClientPayment` (`paymentTabContent(c)`), `vClientMedia` (`tabMedia()`). Each has a back button → `goBackToClient()`, which clears `S.subView`, re-renders the long page, and `scrollIntoView`s back to the originating section. The inner tab renderers (`tabProgram`/`tabSessions`/`tabProgress`/`tabMedia`/`paymentTabContent`) are reused verbatim — not rewritten.

Smooth-scroll is applied **only** to anchor taps (the explicit `behavior:'smooth'`), not globally via CSS, so per-render `scrollTop=0` resets and back-restores stay instant (no mobile jank). `openClient` resets `S.subView=null` so switching clients always lands on the long page; a deeper push (e.g. a history card's *View details* → `programDetail`) returns to the right drill-in because `parentOf()` resolves `programDetail` → the client's Program tab `{view:'client', subView:'program', progSub:…}` (see *Back navigation*).

## Progress section — athletic strength tracking

The Progress section is rebuilt for coaches assessing how athletic/sports clients are advancing. **Every number and chart is *derived* from data the app already has — per-exercise `logs` (`{week: {w, r}}`, weight in kg × reps) and `c.measures` (body measurements). No new captured metrics exist** (no power/sprint/jump data); strength is inferred from weight + reps via estimated 1RM.

### Derived-metric helpers (global)

| Helper | Returns |
|--------|---------|
| `estimated1RM(w, r)` | Epley estimate `w·(1 + r/30)`, rounded to 1 dp (0 when `w≤0`, so bodyweight reps don't fabricate a 1RM) |
| `exerciseProgression(c, exName)` | `[{week, weight, reps, e1rm}]` for every logged week of one current-program exercise, ascending |
| `exerciseGainPct(c, exName)` | % change in e1RM first→latest logged week; `null` with <2 points or a zero baseline |
| `muscleGroupProgress(c)` | `[{group, gainPct, sparkline:[e1rm…]}]`, one per muscle group the client trains, **sorted by `gainPct` desc** (nulls last); `gainPct` is the average per-exercise e1RM gain (`null` / "—" when a group has only one data point) |
| `detectPRs(c)` | `[{exName, g, week, weight, date}]`, **newest first** — each week whose weight beats all previous weeks for that exercise (the first logged week is the baseline, not a PR). `date` is `programStartDate + (week−1)·7d` via `prDate`, else `null` → "Week N" |
| `totalVolumeByWeek(c)` | `[{week, volume}]` — Σ(weight×reps) across all exercises logged that week (training load over time) |
| `strengthToBodyweight(c, exName)` | `[{week, ratio}]` (lift ÷ that week's `measures.Weight`) for the main compounds only (name matches squat/bench/deadlift/press/row); `null` when no bodyweight data |

Support helpers: `progressSummary(c)` (avg e1RM gain %, weekly-volume change %, PR count, session count), `hasProgressData(c)`, `progSummaryTiles`/`progMuscleGrid`/`progStrengthRows` (shared render fragments), and the inline-SVG chart builders `miniSparkline` (group/ratio sparklines), `progressionChart` (the exercise drill-down), plus the existing `lineChart` (measurements). All charts are dark-themed (accent-red primary line, `--text-dim` dashed secondary, `rgba(255,255,255,0.06)` grid), responsive via `viewBox`, tabular-nums, and **survive sparse data** — 2 points draw fine and a single point renders as a number, not a broken chart.

### Section layout (top → bottom)

`tabProgress(c)` (the `vClientProgress` drill-in) renders, in order:

1. **Summary stat tiles** — Est. 1RM gain · Total volume Δ · New PRs · Sessions (small secondary-stat treatment, accent when positive).
2. **Muscle-group progress** — a 2-col grid of mini-cards, one per trained group: `muscleColor(g)` tag + gain % + an e1RM sparkline, sorted by gain so lagging groups stand out (header hidden when the client has no `g`-tagged exercises).
3. **Exercise progression** — a muscle-group-sorted chip selector (defaults to the first compound lift) over a line chart: solid accent **estimated-1RM** line + dashed dim **actual-weight** line, W1…Wn axis, start/latest e1RM end-labels.
4. **PR timeline** — trophy rows (newest ~8) with exercise name, group tag, weight, and date/"Week N"; empty state *"No PRs logged yet — they'll appear as weights climb."*
5. **Body measurements** — the existing measurement selector + `lineChart`, now at the bottom, plus a **Strength-to-bodyweight** block (e.g. *Squat: 0.8× → 0.9× bodyweight*) shown only when `measures.Weight` exists.

**Entry point.** The live client detail is the single-scroll **`cprofile`** redesign (`vClient`). Its **Strength progress** block — rendered only when `hasProgressData(c)` — embeds the summary tiles + muscle-group mini-grid inline (via `progSummaryTiles` + `progMuscleGrid`), just above the static *Trends* cards, with a **View all** link → `openClientSection('progress')` → the full `vClientProgress` drill-in. New leads with no logged data (e.g. Nisha) simply omit the block. `S.progEx` holds the selected exercise (set by `setProgEx`). *(The older section-based layout's `progressSection(c)` preview helper still exists but is no longer the live path — the cprofile redesign superseded the `ds-section`/anchor-tabs layout.)*

> **Seed note:** **Arjun** now carries a real 6-week standing program (Back squat / Bench press / Deadlift / Overhead press / Bent-over row / Cable crunch) with progressive `{w, r}` logs, a `programStartDate`, and 6 bodyweight points in `measures.Weight` — so his charts show clear upward e1RM trends, ranked muscle-group movers, a believable PR count, and strength-to-bodyweight ratios. Opening his session now auto-builds an A/B circuit from those lifts (previously he was the blank "build from scratch" demo). **Meera** keeps her gentler weighted-rehab progression.

## Exercise library

The `library` (~90 exercises) is rendered by `vLibrary` in two modes — **browse** (More → Exercise library, `S.attachTo==null`) and **attach** (the picker opened by `openLibraryForClient` / `buildSessionProgram` / the new-program flow, `S.attachTo!=null`). Both share the same search + filter UI:

- **Search** — `<input>` with `oninput="searchLibrary(this.value)"` writes `S.libQ` and rebuilds only the `#libList` container + `#libCount` in place (so the field keeps focus while typing). Matches `n` **or** `c` as a case-insensitive substring.
- **Muscle-group filter chips** — a horizontal scrollable `.filters` row built from `LIB_GROUPS` (`All` first, then the 13 groups in **alphabetical order**). Tapping a chip calls `setLibGroup(g)` (full `render()`); `All` clears the group filter. Search and group filter **combine** (AND).
- **Filtering** is centralised in `libFiltered()` → `[{e, i}]`, preserving each entry's **original library index** `i` (so `togglePick(i)` / `removeFromProgram(i)` stay correct under filtering) and **sorted alphabetically by exercise name** for display. `libListHTML()` renders the rows or the empty state; `libCountText()` shows `"N exercises"` or `"N of M exercises"` when filtered.
- **Rows** (`libRowHTML(e, i)`) show the name (bold) + a small colored **muscle-group tag** (`.lib-mg`, colored via `muscleColor(e.g)`), the category description as subtitle, and the target — as a right-aligned `.lib-target` chip in browse mode, or appended to the subtitle next to the +Add/✓ toggle in attach mode.

**Adding a new exercise to the library** — `openAddExercise(name?)` opens a bottom-sheet (`renderAddExerciseModal`) with a name input, a **muscle-group dropdown** (`<select>`, alphabetical from `LIB_GROUPS`), and optional description + target. `addExercise({name, group, category, target})` validates (non-blank, no case-insensitive duplicate), defaults the group to the active filter chip and the target to `3×10`, and pushes a `{n, g, c, t}` entry. Two entry points: the browse-mode **+ Add new exercise** button, and — when a search yields nothing — an **+ Add "<query>" to library** action in the empty state that also works **inside the attach/session picker**, prefilled with the search text. Adding from an attach flow **auto-selects** the new exercise (pushes its index into `S.picks`) so it flows straight into the picker. (The `library` is in-memory, so added exercises last for the session only.)

When an exercise is attached to a client (`attachPicked`) or used to seed a new program (`saveNewProgramExercises`), the `g` field is **copied** onto the program entry alongside `name`/`target`/`logs`, so muscle group is preserved for future grouping/report features. `openLibraryForClient`, `buildSessionProgram`, the new-program opener, and the More-menu entry all reset `S.libQ=''` / `S.libGroup='All'` on entry.

## Navigation

Two route maps drive rendering:

- **TABS** — bottom-nav tabs: `home`, `clients`, `schedule`, `reports`, `more`
- **VIEWS** — pushed screens: `client`, `session`, `attMore`, `addClient` / `addAssessment` / `addSchedule` / `addWelcome` (the staged add-client flow screens), `report` (report compose), `reportDoc` (A4 PDF preview), `assessDoc` / `welcomeDoc` (A4 assessment / welcome previews), `announce`, `annNew`, `library`, `notifications`, `programHistory` / `programDetail` (the archived-program history list + single-program read-only detail) — (the payment add/edit, start-new-program, and add-exercise popups are `.modal-overlay` sheets, not routed views)

`render()` checks `authed` first (login screen wins), then `S.view` (pushed screen wins), then falls back to `S.tab`. The bottom tab bar and FAB are hidden when a view is active or when logged out. The layering is **tab → view → sub-view**: `S.tab` is the bottom-nav tab, `S.view` is an overlay screen on top of it, and `S.subView` is a client-detail drill-in on top of that.

### Back navigation — hierarchical, not history

Back is **hierarchical**: every screen has a fixed logical parent (tab → view → sub-view) and the `‹` button goes **up** to that parent — *not* to whatever screen happened to precede it. (The old browser-style `navStack`/`pushHistory` history model was removed.)

- `parentOf()` resolves the parent of the current `S.view` via a `switch` and returns a `{tab?, view?, subView?, progSub?}` target; `applyNav()` applies it; `goBack()` is just `applyNav(parentOf())`.
- Most views go up to their owning tab (e.g. `client` → Clients, `announce` → More) or owning view (e.g. `session` → the client, `annNew` → `announce`).
- The few screens with **two genuine entry points** record their origin so "up" lands correctly: `session` (`S.sessionFrom`, set by `openSession` — client vs the launching tab), `report` (`S.reportFrom`, set by `openReport`), `programDetail` (`S.pdFrom`, set by `openProgramDetail`), and `assessDoc` (reuses `S.assessSrc`).
- The library has its own `libraryBack()` / `libraryParent()` that reads the attach-flags (`attachMode`/`attachReturn`/`attachTo`) **before** clearing them, so the picker returns to wherever it was launched (session, client Program tab, or More).
- The client-detail **section drill-ins** use a separate `goBackToClient()` (clears `S.subView`, restores the long-page scroll), not `goBack()`.

`tab('clients')` resets the dashboard filter (`cFilter='All'`) so opening the tab directly always shows the full list, while `goStat()` (see below) sets the filter and renders the list directly.

The `.lock-banner` CSS rule survives but is unused — `render()` injects no cross-screen banner. The Home header instead shows the derived *"This month · N sessions · M days active"* line (see *Coach activity*).

### Home dashboard — every stat is a deep link

Every card on the Home tab (Critical Alerts rows, Quick Stats tiles, Client Insights cards, and the top stat row) is **clickable and drills into a screen showing the same number**. The guarantee comes from **one predicate per metric**, shared by both the displayed count and the destination filter:

- `CLIENT_FILTERS` maps a key → `{label, pred}`. `clientsMatching(key)` = `visibleClients().filter(pred)`, and `homeMetrics()` builds **every** count from `clientsMatching(...)` — so the dashboard number can never diverge from the list it links to.
- `goStat(key)` opens the Clients list filtered to exactly that set (resetting the coach/payment/state dropdowns + search so the visible count matches), and the list shows a **filter banner** — *"Memberships expiring · 1 client"* with a **Clear** button (`clearClientFilter()`). The same `cFilter` + `CLIENT_FILTERS[cFilter].pred` drives `applyChipFilter()`.
- Filter keys: `Active`, `Leads`, `Payment due`, `Membership expiring`, `Payment overdue`, `Missed`, `Assessment due`, `Paused`, `Review due` (+ category names reuse `cFilter` too). The two attendance cards (a percentage, not a list) link to the **Schedule** tab instead.

## Authentication

The app opens on a trainer login screen (`vLogin()`). `render()` shows it whenever the module-level `authed` flag is `false`, bypassing the tab/view router and hiding the bottom nav.

- `doLogin()` validates the email + password against the `TRAINER` constant and sets `authed = true`.
- `logout()` (wired to the **Log out** row in *More*) clears `authed` and returns to the login screen.

Demo credentials (the `TRAINER` constant, name *Coach Madhan*): `madhan@elevatefitness.com` / `coach123`. The login screen also has a **Use demo login** button (`fillDemoLogin()`) that fills both fields. State is in-memory, so every reload returns to the login screen.

All view functions are named `vSomething()` and return an HTML string. Click handlers are inline `onclick` attributes calling global functions — nothing is wrapped in a module or IIFE.

Key navigation functions:
- `tab(t)` — switch bottom tab (resets `cFilter` for `clients`)
- `navTo(view, id?)` — push a view
- `openClient(id)` / `openSession(id)` / `openReport(id)` / `openProgramDetail(...)` — shortcuts into detail/session/report/program-detail views (the latter three also record back-origin breadcrumbs)
- `goBack()` — go **up** to the current screen's logical parent (`parentOf()` + `applyNav()`); `goBackToClient()` for client-detail drill-ins; `libraryBack()` for the library picker
- `goStat(key)` — open the Clients list filtered to a Home stat's exact clients

## Running locally

Open `index.html` in a browser, or serve with any static server:

```sh
npx serve -l 8080
```
