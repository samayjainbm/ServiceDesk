# MANIT ServiceDesk — Project Brief for Resume Writer

> **Purpose of this document:** Everything a resume writer needs to describe this project
> accurately, at any length (one line, three bullets, or a full project section).
> Everything below is verified against the actual source code, not aspirational.

---

## 1. The One-Liner

**MANIT ServiceDesk** — a full-stack, role-based campus complaint and inventory
management system for MANIT Bhopal (an Institute of National Importance, ~8,000 students).
A single React Native Android app serves four distinct user roles, backed by an
Express + Prisma + MySQL REST API deployed on Vercel.

## 2. The Problem It Solves (the "why" — useful for a strong opening line)

Campus maintenance at a large institute is untracked and unauditable. A tube light breaks,
a student tells someone, a worker eventually shows up, pulls wire and fittings from a store
room, fixes it — and **nobody knows what material was consumed, what's still out with which
worker, or whether the complaint was ever actually closed.**

ServiceDesk converts that informal chain into an **auditable workflow with material
accountability**. Every complaint has an explicit state. Every item that leaves the store
is recorded as **debt against a specific worker** until it is returned or reconciled against
the complaint it was consumed on. This "worker debt" ledger is the core idea of the project
and the thing that makes it more than a CRUD app.

## 3. Scale & Scope (concrete numbers — safe to quote)

| Metric | Value |
|---|---|
| Total application code | ~12,000 lines (5,554 backend / 6,435 frontend, excluding dependencies) |
| Backend REST endpoints | 40+ across 4 role domains |
| Database models | 10 Prisma models with enforced foreign keys, composite unique constraints, and indexes |
| Frontend screens | ~40 screens across 4 roles |
| Reusable UI components | 18-component in-house design system |
| Commits | 54 (51 authored by me — I was the primary author and architect; 3 commits from two teammates) |
| Development window | March 2026 – June 2026 |
| Deployment | Backend live on Vercel; signed Android release APK built via Gradle |

> **Honesty note for the writer:** This was a team project in name, but the git history
> shows 51 of 54 commits are mine, covering the entire backend, the entire frontend, the
> data model, and the deployment. It is fair to describe me as having "architected and
> built" it, or as the "primary developer." Please don't write "led a team of 3" — that
> would overstate it. "Built as the primary developer on a 3-person project" is accurate
> and still strong.

## 4. Tech Stack (exact versions)

**Mobile:** React Native 0.84 (bare workflow, not Expo) · React 19 · React Navigation 7
(native-stack) · AsyncStorage · Google Sign-In · react-native-svg · lucide-react-native ·
Gradle (signed release builds)

**API:** Node.js ≥22 · Express 5 · JSON Web Tokens · bcrypt/bcryptjs · express-rate-limit · CORS · googleapis (OAuth)

**Data:** Prisma ORM 6 · MySQL

**Tooling/Deploy:** Vercel (serverless API hosting) · ESLint · Prettier · Jest

> The **bare React Native** detail is worth keeping — it means I handled the native Android
> toolchain (JDK, Android SDK, Gradle, release signing, ABI-targeted builds), not just JS.

## 5. Architecture (one paragraph)

Four role-based clients (User, Worker, Inventory, PA/Admin) live in one React Native
codebase. Screens never call `fetch` directly — they go through a **centralized API client**
(`src/api/client.js`) that injects the JWT bearer token from AsyncStorage, safely parses
responses, and normalizes every failure into a typed `ApiError`. That hits an Express 5 REST
API whose routes are grouped by role domain (`user/`, `worker/`, `inventory/api/`, `pa/`),
each protected by `requireAuth` (JWT verification) and `requireRole` (role-based
authorization) middleware. Business logic reads and writes MySQL through Prisma. The API is
deployed serverlessly on Vercel.

## 6. The Engineering Decisions Worth Highlighting

These are the things that separate this from a tutorial project. Pick whichever fit the
target role.

### a) Transactional inventory with read/write separation
The material-issuance endpoint (`POST /api/materialGiven/:complaint_id`) is the most complex
piece of logic in the system. When inventory approves a worker's material demand, it must
atomically: decrement stock on N items, upsert per-worker debt rows, record consumption
against the complaint, flip the complaint to `ongoing`, and delete the now-satisfied demand
rows — **all or nothing.**

I deliberately structured it so that **all reads and all validation (including stock
sufficiency checks) happen outside the transaction, and only writes happen inside it**, with
explicit `maxWait: 10s` / `timeout: 15s` bounds. This keeps the transaction window as short
as possible, which matters on a serverless deployment with a connection-pooled hosted MySQL.
It also fails fast with a specific error (`Not enough stock for 'X'. Available=2, Required=5`)
before ever opening a transaction.

*This is the single best story in the project for a backend-leaning resume.*

### b) Worker debt ledger (the domain modeling win)
`worker_debt` is keyed on a **composite unique constraint `(worker_id, item_id)`** and
maintained via Prisma `upsert` with atomic `increment`/`decrement` — never read-modify-write.
Issuing material increments debt; bulk returns decrement it. The same pattern is used on
`complaint_items` (unique on `complaint_id, item_id`) and `demanded_items` (unique on
`worker_id, complaint_id, item_id`). The uniqueness constraints make double-issuance and
duplicate-row drift structurally impossible rather than defensively checked.

### c) Multi-strategy authentication
- **JWT** across all four roles, 7-day expiry, signed with an env secret.
- **bcrypt** password hashing for DB-backed accounts (User, Worker).
- **Server-side math captcha** on user login — I implemented it myself: a `crypto.randomBytes`-keyed
  challenge store with a **5-minute TTL, single-use invalidation (the captcha is deleted
  whether it passes or fails, preventing replay), and a background sweeper** clearing expired
  entries every 10 minutes.
- **express-rate-limit** on the login route (20 attempts / 10 min).
- **Google Sign-In** for students — the app sends an `idToken`, the backend verifies it via
  Google's OAuth libraries and mints its own app JWT. The schema supports this cleanly:
  `email`, `google_sub`, and `avatar` are nullable, and `user_address`/`password` were made
  optional specifically so Google-only accounts can exist without fake placeholder data.
- Inventory and PA credentials are env-based rather than DB-backed (a deliberate call for
  two fixed institutional accounts).

### d) In-house design system with zero new native dependencies
I built a tokenized theme layer (`src/theme/tokens.js`) as the single source of truth for
color, spacing, radius, typography, and elevation — MANIT royal blue (`#0B3D91`) + saffron
(`#F26522`) on a neutral gray ramp, with per-role accent colors and full light/dark mode via
a `ThemeProvider`. On top of it sits an 18-component UI kit (Button, Card, Input, AppBar,
Toast, Skeleton, EmptyState, MetricCard, SegmentedControl, FAB, Badge, Chip, Avatar…).

The hard constraint I set: **no new native dependencies**, so the entire redesign shipped on
the existing Android build without a native rebuild. Animation uses RN's built-in `Animated`
rather than pulling in Reanimated. No screen hardcodes a hex value.

### e) Backward-compatible refactor under a frozen contract
The UI overhaul was done with the backend contract **frozen** — identical endpoints, methods,
payloads, and AsyncStorage keys. The API client was extracted from a `fetch → res.text() →
safe JSON.parse → check res.ok/data.success` pattern that had been copy-pasted into every
screen, and centralized without changing a single request on the wire. This is a good
"refactoring discipline / working within constraints" signal.

### f) Complaint state machine
`booked → (inventory assigns worker) → ongoing ⇄ delayed → resolved`, enforced at the DB
level as a Prisma enum (`ComplaintStatus`), not as loose strings. Resolution requires a
worker to be assigned and reconciles the items actually used against what was issued.
Resolved complaints are optionally mirrored to a Google Sheet via an Apps Script webhook —
a pragmatic integration for non-technical admin staff who live in spreadsheets.

## 7. Feature Summary by Role

| Role | Auth | Capabilities |
|---|---|---|
| **User** (student) | ID + password + captcha, **or** Google Sign-In | Raise complaints, track status, resolve with used-item reconciliation |
| **Worker** | Worker ID + password | View assigned tasks, demand materials per complaint, view outstanding personal debt |
| **Inventory** | Env-based credentials | Assign workers to complaints, toggle ongoing/delayed, approve (issues stock + records debt) or reject demands with reason, bulk stock-in, create new items, process bulk returns, set required-stock levels |
| **PA / Admin** | Env-based credentials | Full CRUD on users and workers, manage worker credentials, reset passwords, view inventory-required reports |

## 8. Ready-to-Use Resume Bullets (adapt freely)

**Compact 3-bullet version:**
- Architected and built a role-based campus complaint & inventory management system (React Native 0.84 · Express 5 · Prisma · MySQL), serving 4 distinct user roles from one codebase across ~40 screens and 40+ REST endpoints; deployed serverlessly on Vercel with a signed Android release build.
- Designed a transactional material-accountability ledger tracking every item issued as per-worker debt: separated reads/validation from writes to minimize the transaction window, and used composite-unique `upsert` with atomic increments to make double-issuance and row drift structurally impossible.
- Implemented layered auth — JWT with role middleware, bcrypt hashing, Google OAuth token exchange, rate limiting, and a self-built single-use TTL captcha — and shipped a tokenized light/dark design system with an 18-component UI kit under a zero-new-native-dependency constraint.

**Single-line version:**
- Built MANIT ServiceDesk: a 4-role React Native + Express/Prisma/MySQL campus service-desk platform (~12k LOC, 40+ endpoints) featuring a transactional worker-debt inventory ledger and multi-strategy JWT/OAuth authentication.

## 9. Keywords for ATS

React Native · React 19 · Node.js · Express 5 · Prisma ORM · MySQL · REST API · JWT ·
OAuth 2.0 · Google Sign-In · bcrypt · RBAC · Database Transactions · Data Modeling ·
Schema Design · Design Systems · Mobile Development · Android · Gradle · Vercel ·
Serverless · Git · ESLint · Full-Stack Development

## 10. Things NOT to Claim (so the writer doesn't overreach)

- **No automated test coverage yet.** Jest is configured but no meaningful test suite exists. Don't claim "test-driven" or "high coverage."
- **No CI/CD pipeline.** Deployment is via Vercel's git integration; there's no test-gated pipeline. Don't claim "built CI/CD."
- **No iOS build.** Android only.
- **No production user numbers.** The app is built and deployed but I have no verified DAU/adoption metrics. Don't invent "used by 5,000 students" — the institute size (~8,000) is context for the problem, not a usage claim.
- **Not a solo project on paper.** See the note in §3 — "primary developer" is accurate; "led a team" is not.
- **Known open items:** PA Records screen is linked but not routed; universal multi-ABI APK and custom launcher icon pending; push notifications are roadmap, not shipped.

---

## 11. Reference Links

- Live API: `https://service-desk-backend-sooty.vercel.app`
- Institute: Maulana Azad National Institute of Technology, Bhopal (Estd. 1960)
