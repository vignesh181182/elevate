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
| `picks`      | Library exercise indices selected for attachment  |
| `effFrom`    | When attached exercises take effect (`now`, `next`, or a date string) |
| `libQ`       | Exercise-library search query (name + category substring match) |
| `libGroup`   | Selected muscle-group filter chip (`All` or one of the `LIB_GROUPS`) |
| `measure`    | Selected measurement key in progress charts       |

### Module-level data stores

| Variable      | Shape                              | Purpose                                |
|---------------|------------------------------------|----------------------------------------|
| `clients`     | `[{id, name, exercises, ...}]`     | All client records (mock data)         |
| `coaches`     | `[{name, role, clients, photo?, phone, email, yearsExp, specializations[], certifications[], tagline}]` | Coach roster. Bio fields (`phone`/`email`/`yearsExp`/`specializations`/`certifications`/`tagline`) feed the welcome-letter coach card; Madhan has a `photo`, juniors fall back to an initials avatar |
| `announcements` | `[{type, title, msg, ...}]`     | Sent announcements                     |
| `library`     | `[{n, g, c, t}]`                 | Exercise library catalog — ~90 exercises grouped by **primary muscle group** (`g`). `n` = name, `g` = muscle group (Quads, Hamstrings, Glutes, Calves, Chest, Back, Shoulders, Biceps, Triceps, Core, Cardio, Mobility, Rehab), `c` = category description string (filtering also matches on this), `t` = default target. `LIB_GROUPS` is the fixed chip order (`All` + the 13 groups); `MUSCLE_COLORS` maps each group → `{c, b}` palette tokens for the small colored tag (`muscleColor(g)` falls back to neutral grey for unknown groups). |
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
| `coachAttendance` | `{'YYYY-MM-DD::coachName': {inTime, outTime, status, sessions}}` | Coach attendance, keyed by date + coach. `status` is `'present'` or `'absent'`; `inTime`/`outTime` are the first check-in / last check-out (for display); `sessions` is `[{in, out}]` supporting **multiple check-in/out cycles per day** (`out: null` while a session is open). Seeded with mock data for the last 7 days (legacy single-pair records without `sessions` still compute via a fallback) |

### Seed data (demo scenarios)

All seeds are in `js/app.js` and chosen so every UI state has something to show:

- **6 clients** (`clients`, `nextId` starts at 7): **Arjun Mehta** (Sports specific, mid-program, paid), **Meera Nair** (Rehab, balance 0 → *due soon*), **Kavya Singh** (General wellness, balance 0 + 10 days → *overdue*), **Dev Krishnan** (Special children, paid), **Sara Pinto** (General wellness, **Paused**), and **Nisha Reddy** (id 6 — a brand-new lead added via Flow A only: `assessmentDone/scheduleDone/scheduleSet` all false, `coach:null`, no payments/program). The five pre-existing clients are back-filled to fully-active (`clients.forEach` defaults the lifecycle flags they predate).
- **3 coaches** (`coaches`): **Madhan** (Main trainer, has a photo, clients 1/3/4), **Suchitha** (Junior, clients 2/5), and **Arun** (Junior, **no clients** — an unassigned coach). Juniors fall back to an initials avatar.
- **Seed IIFEs:** `seedPayments()` (legacy program-cycle fields), `seedPackages()` (package balances / payment history / `lastSessionDate`), `seedProgramHistory()` (1–2 archived programs per existing client + names/dates the active program), `seedCoachAttendance()` (last-7-days clock records with multi-block days, a couple of absent days, and today left open for the main trainer so the gate is live), and `seedSessions()` (today's circuit state: Arjun on the split screen, Meera mid-Program-A, Kavya fully complete — plus a few real `sessionLog` history records for Arjun & Kavya).
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

- **Home banner** — counts active clients with `DueSoon`/`Overdue`; text varies (*"1 client overdue, 2 due soon"* / *"2 clients due soon"* / *"1 client payment overdue"*) and deep-links to the Clients tab with `cFilter='Payment due'`.
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

## Coach attendance & the action gate

Coaches clock in/out from the **Coach attendance** screen (`vCoachAtt()`, reached from *More*). Until a coach has started their day, almost every action in the app is blocked.

Because a day can hold several check-in/out blocks, the screen is built around a reusable **session-blocks** renderer (`sessionRows()` — one `in → out · duration` line per block, with the open block pulsing) and a shared status (`coachStatus()` → *Working / Checked out / Absent / Not in*):

- **My week** — seven compact day pills; each shows the day letter, the day's total hours, and one dot per session block (hollow dot = open block). Tapping a pill selects that day.
- **Team breakdown** (main trainer) — one `team-card` per trainer (`teamCardForDay(co, dateKey)`) with a status badge + total hours in the header and every session block listed below. With no day selected it shows **Team today**; selecting a *previous* day in My week swaps it to **Team · <date>** — the same per-coach breakdown for that day — and hides Team today. *Mark absent* only appears for a not-checked-in junior **today**; tapping a card drills into that coach's week. (A junior sees only their own card, and only when they pick a day.)
- **Per-coach week** (drill-down) — a header with the week total and a vertical `week-day` list breaking every day into its session blocks.

**Helpers** (all global, in-memory):

- `todayKey()` → today as `YYYY-MM-DD`; `attKey(coach, date)` → the composite store key; `dateKey(d)` formats any `Date`.
- `getCoachToday(coach)` → today's record or `null`; `getCoachWeek(coach)` → the last 7 days' records (oldest first, `null` for missing days).
- `currentCoach()` → the logged-in coach's name. Wired to the role: `junior` resolves to the first junior trainer, otherwise the main trainer (Madhan / `TRAINER`).
- `nowTime()` → current time as `'h:mm AM/PM'` for stamping in/out; `hoursToday()` / `hoursWorked()` compute the live and final durations.
- `coachClockIn()` / `coachClockOut()` write the today record; `markCoachAbsent(name)` flags a junior absent with a 3-second undo toast (`toastUndo`).

**The gate:**

- `isClockedIn()` — non-side-effect check. Returns `true` if the current coach has clocked in today and not yet clocked out (and always `true` for the `client` role, so clients are never gated).
- `requireClockedIn()` — guard called via `if(!requireClockedIn())return;`. If not clocked in it shows a *"Start your attendance first"* toast and returns `false`.

The gate applies to **starting a client's session only**: `openSession` (opening the session screen) and the slide-to-mark-present completion in `wireSlide()` (checked at completion time so the slider still drags but bounces back if not clocked in). Every other screen — payments, reports, library, onboarding docs, announcements, pause/resume — is reachable and actionable without clocking in. (`lk()` remains available as a visual-lock class helper but is no longer applied anywhere.)

**Visual lock state:** the `.locked` CSS class (dim to 0.5 + a small 🔒 overlay) and its `lk()` class-suffix helper both still exist, but `lk()` is **no longer called anywhere** — no element is visually locked. The session screen handles the gate inline instead (`openSession` toasts before opening; `wireSlide` lets the slider drag but bounces back and toasts if not clocked in).

## Today's session view — circuit (Programs A/B)

`vSession()` (the `session` VIEW, opened via `openSession(id)`) runs a **two-circuit (Program A / Program B) round-based workout**. Every state shares one header (`sessHeader(c, chip)`, `.sx-head2`): avatar left, the client name with *date · time · coach* stacked beside it, and the attendance pill + change-attendance **⋯** pinned to the top-right (`sessAttChip` builds the pill; the *before-present* state passes an empty chip). The attendance states are unchanged; the *present* state is what's new:

- **Before present** — exercises are locked (🔒) under a **slide-to-mark-present** control (`wireSlide`); *"Not present? More options"* links to `vAttMore` (Present / Absent / Cancelled). The clock-in gate is still checked at slide-completion time and runs **before** the circuit.
- **Closed** (absent / cancelled) — a closed-state panel with an **Undo**.
- **Present, <2 real exercises** — a *"Need at least 2 exercises in the Program tab first"* panel linking to the Program drill-in.
- **Present** — **marking present starts the session immediately** (no organise/split gate): `autoStartSession(id)` applies the default A/B split and drops straight into the running circuit. The organise/split screen is reached only on demand via **⋯ → Edit programs & rounds**.

### Session-progress state

Per-client, per-day progress lives in a module-level store **separate** from the legacy `sessDone`/`exDone`:

```js
let sessionProgress = {};   // keyed 'clientId::YYYY-MM-DD'  (sessKey(id))
```

Shape: `{ clientId, date, splitDone:false, started:false, currentProgramIdx:0, programs:[ {label:'Program A', exercises:[name], sets:3, progress:{}}, {label:'Program B', exercises:[name], sets:3, progress:{}} ] }`. **`programs` is a variable-length list** — there are always at least 1 and up to 6 circuits (Program A–F). Each program is its own circuit: its `exercises` run in order, repeated for **its own** `sets` (round count), and only when a program is fully complete does the workout advance to the next. `progress` is keyed `'round:exerciseName'` → `true` (1-based rounds). `started` flips true the first time the session runs and never flips back — so reopening the organise screen via ⋯ → Edit never re-triggers the auto-start. `getSession(id)` reads it; `ensureSession(c)` lazily builds a fresh state via `buildSessionState(c)` (default split: first half of the real exercises → A, second half → B, 3 sets each). `sessionExercises(c)` is the real, today-relevant list (drops `future` adds + the *Tap to add exercise* placeholder, adds today's session-only extras, minus today's removals).

Program slots are labelled and coloured by index via `progLabel(i)` (A, B, C…), `progLetter(i)`, and `progColor(i)` (`PROG_COLORS` = `['a'..'f']` → blue/amber/purple/green/red/pink header classes). `relabelPrograms(st)` keeps labels in A,B,C order after any add/remove.

**Helpers** (all global): `roundComplete(prog, round)`, `programComplete(prog)`, `nextExerciseInRound(prog, round)` (the *Next* highlight), `currentRound(prog)` (lowest incomplete round), `advanceProgram(st)` (hop to the next non-empty, incomplete program), `sessionComplete(st)`. Empty programs count as complete so they never block (lets a one-program seed finish cleanly).

**All programs are always on screen** in every phase — split, workout, and complete each render every program as a **section** (a shared header helper `cwSecHead(p, colorCls, status, dots, active, done)` + per-program round dots via `cwDots`). The active program's header is a solid colour banner (per `progColor`); the others are grey headers labelled *Up next* / *Complete ✓*. So the coach can always read every circuit's exercise list.

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

Smooth-scroll is applied **only** to anchor taps (the explicit `behavior:'smooth'`), not globally via CSS, so per-render `scrollTop=0` resets and back-restores stay instant (no mobile jank). `openClient` resets `S.subView=null` so switching clients always lands on the long page; `navSnapshot`/`goBack` also carry `subView`/`progSub` so a deeper push (e.g. a history card's *View details* → `programDetail`) returns to the right drill-in.

## Exercise library

The `library` (~90 exercises) is rendered by `vLibrary` in two modes — **browse** (More → Exercise library, `S.attachTo==null`) and **attach** (the picker opened by `openLibraryForClient` / `buildSessionProgram` / the new-program flow, `S.attachTo!=null`). Both share the same search + filter UI:

- **Search** — `<input>` with `oninput="searchLibrary(this.value)"` writes `S.libQ` and rebuilds only the `#libList` container + `#libCount` in place (so the field keeps focus while typing). Matches `n` **or** `c` as a case-insensitive substring.
- **Muscle-group filter chips** — a horizontal scrollable `.filters` row built from `LIB_GROUPS` (fixed order: `All` + the 13 groups). Tapping a chip calls `setLibGroup(g)` (full `render()`); `All` clears the group filter. Search and group filter **combine** (AND).
- **Filtering** is centralised in `libFiltered()` → `[{e, i}]` preserving each entry's **original library index** `i` (so `togglePick(i)` / `removeFromProgram(i)` stay correct under filtering). `libListHTML()` renders the rows or the empty state (*"No exercises match your filter — try a different muscle group or clear search."*); `libCountText()` shows `"N exercises"` or `"N of M exercises"` when filtered.
- **Rows** (`libRowHTML(e, i)`) show the name (bold) + a small colored **muscle-group tag** (`.lib-mg`, colored via `muscleColor(e.g)`), the category description as subtitle, and the target — as a right-aligned `.lib-target` chip in browse mode, or appended to the subtitle next to the +Add/✓ toggle in attach mode.

When an exercise is attached to a client (`attachPicked`) or used to seed a new program (`saveNewProgramExercises`), the `g` field is **copied** onto the program entry alongside `name`/`target`/`logs`, so muscle group is preserved for future grouping/report features. `openLibraryForClient`, `buildSessionProgram`, the new-program opener, and the More-menu entry all reset `S.libQ=''` / `S.libGroup='All'` on entry.

## Navigation

Two route maps drive rendering:

- **TABS** — bottom-nav tabs: `home`, `clients`, `schedule`, `reports`, `more`
- **VIEWS** — pushed screens: `client`, `session`, `attMore`, `addClient` / `addAssessment` / `addSchedule` / `addWelcome` (the staged add-client flow screens), `report` (report compose), `reportDoc` (A4 PDF preview), `assessDoc` / `welcomeDoc` (A4 assessment / welcome previews), `announce`, `annNew`, `coachAtt`, `library`, `notifications`, `programHistory` / `programDetail` (the archived-program history list + single-program read-only detail) — (the payment add/edit and start-new-program popups are `.modal-overlay` sheets, not routed views)

`render()` checks `authed` first (login screen wins), then `S.view` (pushed screen wins), then falls back to `S.tab`. The bottom tab bar and FAB are hidden when a view is active or when logged out.

### Back navigation

A `navStack` history records where you were before each forward navigation, so every back (`‹`) button returns to the **actual previous page** rather than a hardcoded parent. `navTo()`, `openClient()`, and `openSession()` call `pushHistory()` (snapshotting `tab`/`view`/`clientId`/`ctab`/`subView`/`progSub`/`coachView`); back buttons call `goBack()`, which pops and restores that snapshot (falling back to Home on an empty stack). The stack is cleared on login/logout. The same screen reached from different places therefore returns to wherever you came from — e.g. Coach Attendance opened from the Home widget returns to Home, while the same screen opened from *More* returns to *More*. (Intra-screen steps — onboarding wizard steps, the client-detail section drill-ins (`goBackToClient`, not `goBack`), the per-coach week drill-down — still navigate within the screen.)

There is **no longer a persistent lock banner** — `render()` injects nothing across screens (the `.lock-banner` CSS rule survives but is unused). The only standing clock-in prompt is the Home **Attendance** widget (below); coaches reach the attendance screen from it or from *More* via `goCoachAtt()`, which navigates to `coachAtt` and resets the team-member drill-down state.

`vHome()` renders `homeCoachBlock()` → `attWidget()` at the top of the Home tab — a single **Attendance** card that lets the coach run their whole day without leaving Home, adapting to the clock state:

- **Not checked in** → grey ring, *"Not checked in"* badge, the line *"Start your day to track your working hours"*, and a primary **Check In** button (`coachClockIn()`).
- **Checked in** → green ring, *"Checked In"* badge, the check-in time, a live *Working for* counter, and a **secondary** **Check Out** button (`coachClockOut()`).
- **Checked out** → *"Checked Out"* badge, last check-out + *Total today* (with a session count once there's more than one), and a **Check In** button to start another session. A coach can check in and out **multiple times a day**; `coachClockIn()`/`coachClockOut()` push/close entries in the day's `sessions` array, `hoursToday`/`hoursWorked` sum every session (counting an open one up to now), and the gate (`isClockedIn()`) is open only while a session is in progress.

Every state also shows a *View attendance history* link (→ `coachAtt`). The live counter is driven by `wireCoachClock()`, which updates every `.live-hours` element on screen each minute (the widget and the `coachAtt` clock card share this class). This widget is the app's only clock-in prompt — there is no separate lock banner on other screens.

## Authentication

The app opens on a trainer login screen (`vLogin()`). `render()` shows it whenever the module-level `authed` flag is `false`, bypassing the tab/view router and hiding the bottom nav.

- `doLogin()` validates the email + password against the `TRAINER` constant and sets `authed = true`.
- `logout()` (wired to the **Log out** row in *More*) clears `authed` and returns to the login screen.

Demo credentials (the `TRAINER` constant, name *Coach Madhan*): `madhan@elevatefitness.com` / `coach123`. The login screen also has a **Use demo login** button (`fillDemoLogin()`) that fills both fields. State is in-memory, so every reload returns to the login screen.

All view functions are named `vSomething()` and return an HTML string. Click handlers are inline `onclick` attributes calling global functions — nothing is wrapped in a module or IIFE.

Key navigation functions:
- `tab(t)` — switch bottom tab
- `navTo(view, id?)` — push a view
- `openClient(id)` / `openSession(id)` — shortcuts into detail/session views

## Running locally

Open `index.html` in a browser, or serve with any static server:

```sh
npx serve -l 8080
```
