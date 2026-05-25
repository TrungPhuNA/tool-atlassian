# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Jira Reporting Tool — an internal tool for tracking work progress, managing Jira tasks, and generating reports from Jira Cloud data. Built for Interspace VN.

## Commands

### Backend (`api/`)
```bash
npm run dev      # Start with nodemon (auto-reload)
npm start        # Production start
```

### Frontend (`frontend/`)
```bash
npm run dev      # Vite dev server (port 5176, strict)
npm run build    # Production build
npm run lint     # ESLint
```

### Deploy
```bash
bash deploy.sh   # Pulls latest, builds frontend, restarts PM2
```
PM2 config in `ecosystem.config.js` — app name `jira-insight-api`, port 5006.

## Architecture

### Backend: Route → Controller → Service → Repository → Model

```
api/
├── routes/          # Endpoint definitions, middleware attachment
├── controllers/     # Receives req, calls service, returns res (NO business logic)
├── services/        # Business logic (NO req/res knowledge)
├── repositories/    # Sequelize DB queries (NO business logic)
├── models/          # Table definitions with Sequelize
├── middlewares/      # authMiddleware (JWT), adminMiddleware (role check)
├── config/          # DB config, validators
└── migrations/      # Sequelize migrations
```

**API routes:**
- `/api/v1/auth` — Login, register
- `/api/v1/admin/jira` — Jira config CRUD (admin)
- `/api/v1/tasks` — Task list, detail, filter options, notify, export
- `/api/v1/admin/sync` — Trigger sync, sync history (admin)
- `/api/v1/admin/users` — User management (admin)

**Auth:** JWT Bearer token. `authMiddleware` verifies token and attaches `req.user`. `adminMiddleware` checks `req.user.role === 'admin'`.

### Frontend: React 19 + Vite + TailwindCSS 4

```
frontend/src/
├── api/client.js       # Axios instance with base URL and JWT interceptor
├── components/         # Reusable UI (Toast, ExportExcelModal, etc.)
├── pages/
│   ├── LandingPage.jsx # Public landing
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── tasks/TaskListView.jsx  # Main task view (users + admins)
│   └── admin/                  # Admin-only pages
└── App.jsx             # Router setup with ProtectedRoute + MainLayout
```

**Auth flow:** Token and user stored in `localStorage`. Axios interceptor attaches `Authorization: Bearer <token>`. On 401, clears storage and redirects to `/login`.

**State:** Zustand for global state, TanStack React Query for server cache.

**API URL:** Configured via `VITE_API_URL` env var, defaults to `http://localhost:5006/api/v1`.

### Database Models (MySQL via Sequelize)

- **JiraIssue** — Synced Jira issues. Self-referential: `parent_id` links subtasks to parent tasks. Stores full `jira_data` JSON payload.
- **JiraConfig** — Single-row config for Jira domain, email, and API token.
- **SyncJob** — Tracks sync runs with status (`pending/running/completed/failed/stopped`) and progress counts.
- **User** — Auth users with `admin`/`user` roles. Passwords bcrypt-hashed via model hooks.
- **Employee** — Internal staff mapping (display name → Jira account ID).

**Sequelize conventions:** `underscored: true`, timestamps as `created_at`/`updated_at`. DB sync only runs when `DB_SYNC=true` in `.env`.

### Key Services

- **JiraService** — Jira Cloud REST API client (Basic auth). Fetches boards via `/rest/agile/1.0/board`, issues via board issue endpoint. JQL: `created >= "2026-01-01"`.
- **SyncService** — Orchestrates background sync: creates SyncJob, iterates boards, upserts issues, handles parent/child relationships and stop/cancel.
- **GoogleSheetService** — Creates/updates Google Sheets via Service Account key file (`gg-sheet.json`). Tab naming: `ai-YYYY-MM-DD`.
- **NotificationService** — Sends Google Chat webhook messages for task notifications.

### Filters on Task List

The `JiraIssueRepository.getAll()` supports: assignee (IN), status (IN or NOT_IN via `status_exclude`), sprint (IN), task hierarchy (`parent`/`subtask`), data quality flags (missing description/story points/due date), due date range, and text search (issue key, summary, assignee name).

## UI Conventions

- **Language:** All UI text in Vietnamese.
- **No native dialogs:** Never use `alert()` or `confirm()`. Use Toast component for notifications.
- **Skeleton loading:** Every data area must have a skeleton matching the real layout. No bare "Đang tải..." text.
- **Form validation:** Required fields marked with red `(*)`. Error messages below inputs in red, Vietnamese text. Focus first error field on submit.
- **Tailwind:** Use utility classes, not inline styles. Design tokens defined in docs for colors, typography scale, spacing, and radius.
- **Styling:** Prettier with 4-space indent, single quotes, 120 char print width.
