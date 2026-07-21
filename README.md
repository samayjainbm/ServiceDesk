
<div align="center">

<img src="frontend/MyApp/src/assets/manit-logo.png" alt="MANIT ServiceDesk" width="120" />

# MANIT ServiceDesk

### Campus complaint & inventory management for MANIT Bhopal — one app, four roles, from "raise a complaint" to "materials reconciled."

A full‑stack, role‑based service desk for a college campus. Students raise complaints, admins assign workers, workers request materials from a tracked inventory, and every issued item is accounted for as **worker debt** until it's returned — all from a single React Native app talking to an Express + Prisma + MySQL API.

<br/>

[![License](https://img.shields.io/badge/license-ISC-blue.svg)](#-license)
[![Stars](https://img.shields.io/github/stars/samayjainbm/ServiceDesk?style=flat)](https://github.com/samayjainbm/ServiceDesk/stargazers)
[![Forks](https://img.shields.io/github/forks/samayjainbm/ServiceDesk?style=flat)](https://github.com/samayjainbm/ServiceDesk/network/members)
[![Issues](https://img.shields.io/github/issues/samayjainbm/ServiceDesk)](https://github.com/samayjainbm/ServiceDesk/issues)
[![Last Commit](https://img.shields.io/github/last-commit/samayjainbm/ServiceDesk)](https://github.com/samayjainbm/ServiceDesk/commits)

<!-- Tech badges -->
![React Native](https://img.shields.io/badge/React_Native-0.84-20232A?logo=react&logoColor=61DAFB)
![React](https://img.shields.io/badge/React-19-20232A?logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-≥22-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-db-4479A1?logo=mysql&logoColor=white)
![Vercel](https://img.shields.io/badge/Backend_on-Vercel-000000?logo=vercel&logoColor=white)

</div>

---

## 📱 Demo

> **Live API:** `https://service-desk-backend-sooty.vercel.app`  ·  **Android APK:** _add a build to [GitHub Releases](https://github.com/samayjainbm/ServiceDesk/releases)_

<!-- Drop real captures into docs/screenshots/ and they'll render here -->
| Splash | Home (role picker) | Login | Dashboard |
|:---:|:---:|:---:|:---:|
| <img src="docs/screenshots/splash.png" width="190"/> | <img src="docs/screenshots/home.png" width="190"/> | <img src="docs/screenshots/login.png" width="190"/> | <img src="docs/screenshots/dashboard.png" width="190"/> |
| Complaints list | Complaint detail | Assign worker | Inventory storage |
| <img src="docs/screenshots/complaints.png" width="190"/> | <img src="docs/screenshots/detail.png" width="190"/> | <img src="docs/screenshots/assign.png" width="190"/> | <img src="docs/screenshots/inventory.png" width="190"/> |

<details>
<summary><b>Example API response</b> — <code>GET /api/show_complaint_id</code> (user's complaints)</summary>

```json
{
  "success": true,
  "complaints": [
    { "complaint_id": 5240, "status": "ongoing" },
    { "complaint_id": 5241, "status": "booked" }
  ]
}
```
</details>

---

## 📑 Table of Contents

- [Why ServiceDesk?](#-why-servicedesk)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
  - [System overview](#system-overview)
  - [Data model](#data-model)
  - [Complaint lifecycle](#complaint-lifecycle)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [1 · Backend](#1--backend-express--prisma--mysql)
  - [2 · Frontend](#2--frontend-react-native)
- [Configuration](#-configuration)
- [Building the Android APK](#-building-the-android-apk)
- [API Reference](#-api-reference)
- [Roles & Permissions](#-roles--permissions)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgements](#-acknowledgements)

---

## 💡 Why ServiceDesk?

Campus maintenance is messy: a tube light is broken, someone tells someone, a worker shows up, grabs wire/tools from a store, fixes it… and nobody knows what was used or what's still out. **ServiceDesk turns that into an auditable workflow.**

- Complaints are tracked from **`booked` → assigned → `ongoing`/`delayed` → resolved**.
- Every material a worker takes is recorded as **worker debt** and must be **returned** or reconciled.
- Inventory stock, demand requests, and "inventory required" reports stay in sync with reality.

---

## ✨ Features

| | Feature | What it does | Why it matters |
|---|---|---|---|
| 👥 | **Four role-based portals** | Separate, purpose-built flows for **User**, **Worker**, **Inventory**, and **PA (Admin)**. | One codebase serves every stakeholder without role confusion. |
| 🔐 | **Multi-strategy auth** | JWT login for all roles, **math captcha** for users, and **Google Sign-In** for students. | Hardened against bots while staying one tap away for real users. |
| 🧾 | **Full complaint lifecycle** | `booked → assigned → ongoing → delayed → resolved`, with one-tap status toggling for inventory staff. | A complaint's state is always explicit and auditable. |
| 📦 | **Tracked inventory & stock** | Item catalog with live counts, bulk stock-in, and new-item creation. | Stock figures reflect what's physically on the shelf. |
| 🛠️ | **Material demand & approval** | Workers demand items per complaint; inventory **accepts** (issues stock) or **rejects** with a reason. | Materials leave the store only with an approval trail. |
| ⚖️ | **Worker debt accounting** | Issued items become per-worker debt; bulk **returns** settle it against max-debt limits. | No more "where did all the wire go?" |
| 🗂️ | **PA admin console** | Create / update / delete users & workers, manage credentials, reset passwords, view required inventory. | Day-to-day administration without touching the database. |
| 🎨 | **Custom MANIT design system** | Tokenized theme (MANIT blue + saffron), light/dark mode, and a hand-built UI kit with **zero new native deps**. | Premium, consistent UI that runs on the existing build — no native rebuild. |
| 🌐 | **Resilient API client** | Centralized fetch wrapper with safe JSON parsing, bearer-token injection, and toast-based feedback. | Network hiccups degrade gracefully instead of crashing screens. |

---

## 🧰 Tech Stack

<table>
<tr><th align="left">Layer</th><th align="left">Technologies</th></tr>
<tr>
  <td><b>Mobile app</b></td>
  <td>React Native <code>0.84</code> · React <code>19</code> · React Navigation 7 (native-stack) · AsyncStorage · Google Sign-In · React Native Reanimated-free <code>Animated</code> UI kit</td>
</tr>
<tr>
  <td><b>API</b></td>
  <td>Node.js (≥22) · Express <code>5</code> · JSON Web Tokens · bcrypt / bcryptjs · express-rate-limit · CORS · Google APIs (OAuth)</td>
</tr>
<tr>
  <td><b>Data</b></td>
  <td>Prisma ORM <code>6</code> · MySQL</td>
</tr>
<tr>
  <td><b>Tooling / Deploy</b></td>
  <td>Vercel (API hosting) · Gradle (Android) · ESLint · Prettier · Jest</td>
</tr>
</table>

---

## 🏗️ Architecture

### System overview

```mermaid
graph TD
    subgraph Clients["📱 React Native app (4 roles)"]
        U[User]
        W[Worker]
        I[Inventory]
        P[PA / Admin]
    end

    subgraph App["MyApp · src/"]
        SCR[Screens]
        UIKIT["UI kit + theme<br/>(components/ui, theme)"]
        API[api/client.js]
        SCR --> UIKIT
        SCR --> API
    end

    U --> SCR
    W --> SCR
    I --> SCR
    P --> SCR

    API -->|"HTTPS · Bearer JWT"| EXP["Express 5 REST API<br/>(backend/)"]
    G["Google OAuth"] -.idToken.-> EXP
    EXP --> PRISMA[Prisma ORM]
    PRISMA --> DB[("MySQL")]

    EXP -. deployed on .-> VERCEL["▲ Vercel"]
```

**Flow in one line:** a role taps a screen → `api/client.js` attaches the JWT and calls the Express API → Express runs business logic and reads/writes MySQL via Prisma → a normalized JSON response flows back and renders through the shared UI kit.

### Folder explanation

| Path | Responsibility |
|---|---|
| `backend/app.js`, `server.js` | Express app wiring and HTTP entrypoint. |
| `backend/user/`, `worker/`, `inventory/api/`, `pa/` | Route handlers grouped by role/domain. |
| `backend/google_auth/` | Google OAuth token verification → app JWT. |
| `backend/prisma/` | `schema.prisma`, migrations, and `seed.js`. |
| `backend/routes/` | Utility routes (DB check, seed runner). |
| `frontend/MyApp/src/screens/` | ~40 screens across the 4 roles. |
| `frontend/MyApp/src/components/ui/` | Reusable UI kit (Button, Card, Input, AppBar, Toast, …). |
| `frontend/MyApp/src/theme/` | Design tokens + light/dark `ThemeProvider`. |
| `frontend/MyApp/src/api/` · `hooks/` | Centralized API client and data-fetching hooks. |
| `frontend/MyApp/config.js` | App-level config (API base URL, token key, Google client ID). |

### Data model

```mermaid
erDiagram
    user_info        ||--o{ ongoing_complaints : raises
    worker_info      ||--o{ ongoing_complaints : assigned
    worker_info      ||--|| worker_credentials  : has
    worker_info      ||--|| alloted_task         : has
    worker_info      ||--o{ demanded_items       : demands
    worker_info      ||--o{ worker_debt          : owes
    ongoing_complaints ||--o{ complaint_items    : consumes
    ongoing_complaints ||--o{ demanded_items     : requests
    items            ||--o{ complaint_items      : used_in
    items            ||--o{ demanded_items       : requested_in
    items            ||--o{ worker_debt          : owed_as
    items            ||--o{ StockPurchased       : restocked
    items            ||--o{ DemandStock          : required

    ongoing_complaints {
        int complaint_id PK
        date start_date
        string status "booked | ongoing | delayed"
        int user_id FK
        int worker_id FK
    }
    items {
        int item_id PK
        string item_name
        int count
    }
    worker_debt {
        int worker_id FK
        int item_id FK
        int count
    }
```

### Complaint lifecycle

```mermaid
stateDiagram-v2
    [*] --> booked: User raises complaint
    booked --> ongoing: Inventory assigns a worker
    ongoing --> delayed: Inventory toggles status
    delayed --> ongoing: Inventory toggles back
    ongoing --> resolved: User submits used items
    resolved --> [*]

    note right of ongoing
        Worker demands materials →
        Inventory accepts (issues stock,
        records worker debt) or rejects
    end note
```

---

## 📂 Project Structure

```
ServiceDesk/
├── backend/                        # Express 5 + Prisma + MySQL API
│   ├── app.js  server.js           # Express app + entrypoint
│   ├── google_auth/                # Google OAuth → JWT
│   ├── user/  worker/  pa/         # Role-scoped route handlers
│   ├── inventory/                  # Inventory APIs + auth middleware
│   ├── prisma/
│   │   ├── schema.prisma           # Data model (10 models)
│   │   ├── migrations/
│   │   └── seed.js
│   ├── routes/                     # db-check, run_seed
│   └── vercel.json                 # Vercel deployment config
│
└── frontend/MyApp/                 # Bare React Native app
    ├── src/
    │   ├── screens/                # user / worker / inventory / pa
    │   ├── components/             # ui kit, brand (Crest), scaffolds
    │   ├── theme/                  # tokens + ThemeProvider (light/dark)
    │   ├── api/  hooks/  utils/    # client, useFetch/useAuth, status map
    │   ├── navigation/             # native-stack navigator
    │   └── assets/                 # manit-logo.png, category icons
    ├── android/                    # Gradle project (release signing)
    └── config.js                   # BASE_URL, TOKEN_KEY, GOOGLE_WEB_CLIENT_ID
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js ≥ 22** and npm
- **MySQL** database (local or hosted)
- **React Native (bare) toolchain** — JDK 17, Android SDK, an emulator or device
  (see the official [RN environment setup](https://reactnative.dev/docs/set-up-your-environment))

```bash
git clone https://github.com/samayjainbm/ServiceDesk.git
cd servicedesk
```

### 1 · Backend (Express + Prisma + MySQL)

```bash
cd backend
npm install

# Create your environment file (see Configuration below)
cp .env.example .env     # then edit values

# Generate the Prisma client and push the schema to your DB
npm run prisma:generate
npm run prisma:push

# (optional) seed sample data
npm run seed

# Run it
npm run dev              # nodemon (hot reload)  →  http://localhost:3000
# or
npm start                # node server.js
```

### 2 · Frontend (React Native)

```bash
cd frontend/MyApp
npm install

# Point the app at your API (see Configuration below)
#   edit config.js → BASE_URL

# Start Metro
npm start

# In another terminal — run on Android
npm run android
```

> The default `config.js` points at the hosted Vercel API, so the app runs against a live backend out of the box. Switch `BASE_URL` to `http://10.0.2.2:3000` (Android emulator) or your LAN IP to use your local server.

---

## ⚙️ Configuration

**Backend — `backend/.env`** (see [`backend/.env.example`](backend/.env.example))

| Variable | Description |
|---|---|
| `DATABASE_URL` | MySQL connection string used by Prisma (e.g. `mysql://user:pass@host:3306/servicedesk`). |
| `PORT` | API port (defaults to `3000`). |
| `NODE_ENV` | `development` / `production`. |
| `JWT_SECRET` | Secret used to sign/verify JSON Web Tokens. |
| `LOGIN_ID` / `LOGIN_PASSWORD` | **Inventory** role credentials (checked from env, not the DB). |
| `LOGIN_PA` / `LOGIN_PA_PASSWORD` | **PA / Admin** role credentials (checked from env, not the DB). |
| `GOOGLE_WEB_CLIENT_ID` | OAuth **web** client ID used to verify Google `idToken`s. |
| `SEED_SECRET` | Guards the seed route. |
| `GOOGLE_SHEET_WEBHOOK_URL` | _Optional_ — mirrors resolved complaints to a Google Sheet. |

> 🔑 **Note:** User & Worker accounts live in the database, but **Inventory and PA log in with credentials set in `.env`**. Keep `.env` out of version control (already covered by `.gitignore`).

**Frontend — `frontend/MyApp/config.js`**

```js
export const BASE_URL = "https://service-desk-backend-sooty.vercel.app";
export const TOKEN_KEY = "token";
export const GOOGLE_WEB_CLIENT_ID = "<your-web-client-id>.apps.googleusercontent.com";
```

---

## 📦 Building the Android APK

A signed **release** APK (standalone, no Metro needed):

```bash
cd frontend/MyApp/android

# Build arm64 only (fastest; runs on all modern phones)
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a       # macOS/Linux
.\gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a   # Windows

# Output:
# app/build/outputs/apk/release/app-release.apk
```

> Drop `-PreactNativeArchitectures=…` to build a universal APK (all ABIs, incl. x86_64 emulators).
> Release signing is configured in `android/app/build.gradle` via `MYAPP_UPLOAD_*` properties in `android/gradle.properties`.

---

## 🔌 API Reference

All protected routes expect an `Authorization: Bearer <token>` header. Base URL: `https://service-desk-backend-sooty.vercel.app`.

<details>
<summary><b>Auth</b></summary>

| Method | Endpoint | Purpose |
|---|---|---|
| `GET`  | `/api/login_user/captcha` | Fetch a math captcha challenge |
| `POST` | `/api/login_user` | User login (`id`, `password`, `captchaId`, `captchaAnswer`) |
| `POST` | `/api/auth/google-auth/user` | Google Sign-In (`idToken`) |
| `POST` | `/api/login_worker` | Worker login |
| `POST` | `/api/login_inventory` | Inventory login |
| `POST` | `/api/login_pa` | PA / admin login |
</details>

<details>
<summary><b>User</b></summary>

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/complaint_krdi` | Register a complaint |
| `GET`  | `/api/show_complaint_id` | List my complaints |
| `GET`  | `/api/show_complaint_detail/:id` | Complaint detail |
| `GET`  | `/api/complaints/used-items/:id` | Items available to resolve with |
| `POST` | `/api/resolved/:id` | Resolve complaint with used items |
</details>

<details>
<summary><b>Worker</b></summary>

| Method | Endpoint | Purpose |
|---|---|---|
| `GET`  | `/api/show_complaint` | My assigned complaints |
| `GET`  | `/api/complaint_detail/:id` | Complaint detail |
| `GET`  | `/api/worker/show_items` | Inventory item list |
| `POST` | `/api/material_req/:id` | Submit material demand for a complaint |
| `GET`  | `/api/worker/debt/:workerId` | My outstanding material debt |
</details>

<details>
<summary><b>Inventory</b></summary>

| Method | Endpoint | Purpose |
|---|---|---|
| `GET`   | `/api/booked_ids` · `/api/booked_details/:id` | Unassigned complaints + detail |
| `GET`   | `/api/show_worker_to_assign` | Workers available to assign |
| `PUT`   | `/api/assign_worker/:complaintId/confirm/:workerId` | Assign a worker |
| `GET`   | `/api/assigned_ids` · `/api/assigned_details/:id` | Assigned complaints + detail |
| `PATCH` | `/api/toggle_complaint_status/:id` | Toggle ongoing ⇄ delayed |
| `GET`   | `/api/demand_ids` · `/api/demand_details/:id` | Material demands + detail |
| `POST`  | `/api/materialGiven/:id` · `/api/reject_demand_request` | Accept / reject a demand |
| `GET`   | `/api/item_display` · `/api/debt?name_of_material=` | Stock list · per-item debt |
| `GET`   | `/api/get_item_names` | Item names (for stock-in) |
| `PUT`   | `/api/add_items` · `POST /api/inventory/add_new_item` | Bulk stock-in · new item |
| `GET`   | `/api/returned/worker-debt?worker_id=` | A worker's returnable debt |
| `PUT`   | `/api/returned/bulk?worker_id=` | Bulk return items |
| `PUT`   | `/api/demandstock` · `GET /api/get_demandstock` | Set / read demand stock |
</details>

<details>
<summary><b>PA / Admin</b></summary>

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` `POST` | `/api/pa/workers` | List / create workers |
| `GET` `PUT` `DELETE` | `/api/pa/workers/:id` | Read / update / delete worker |
| `POST` | `/api/pa/worker-credentials` · `PUT /api/pa/worker-credentials/:id` | Create / update worker login |
| `GET` `POST` | `/api/pa/users` | List / create users |
| `GET` `PUT` `DELETE` | `/api/pa/users/:id` | Read / update / delete user |
| `PUT` | `/api/pa/users/:id/password` | Reset a user's password |
</details>

---

## 👤 Roles & Permissions

| Role | Logs in with | Can do |
|---|---|---|
| **User** | ID + password + captcha, or Google | Register complaints, track status, resolve with used items |
| **Worker** | Worker ID + password | View assigned tasks, demand materials, view personal debt |
| **Inventory** | ID + password | Assign workers, manage stock, approve/reject demands, process returns |
| **PA (Admin)** | Numeric login ID + password | Full CRUD on users & workers, credentials, password resets, inventory-required reports |

---

## 🗺️ Roadmap

- [ ] Register & redesign the **PA Records** screen (currently linked but not routed)
- [ ] iOS build & screenshots
- [ ] Universal / multi-ABI release APK + custom launcher icon & native splash
- [ ] Automated tests (API + component) and CI
- [ ] Add a root `LICENSE` file
- [ ] Push notifications for complaint status changes

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repo and create a branch: `git checkout -b feat/your-feature`
2. Keep the backend contract stable — the app preserves exact endpoints, methods, and storage keys.
3. Run `npm run lint` in `frontend/MyApp` before committing.
4. Open a PR with a clear description and screenshots for UI changes.

---

## 📄 License

Released under the **ISC License** (as declared in `backend/package.json`).
A root `LICENSE` file is not yet present — adding one is recommended to make the license explicit for the whole monorepo.

---

## 🙏 Acknowledgements

- **Maulana Azad National Institute of Technology (MANIT), Bhopal** — branding & domain.
- Built with [React Native](https://reactnative.dev/), [Express](https://expressjs.com/), and [Prisma](https://www.prisma.io/).

<div align="center">
<sub>Education is our soul wealth · विद्या परं भूषणम्</sub>
</div>
