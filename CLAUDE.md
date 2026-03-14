# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Frontend dev server (localhost:5173)
npm run dev

# Type-check + build frontend to dist/
npm run build

# Build functions (TypeScript → functions/lib/)
cd functions && npm run build

# Full production build (frontend + functions)
npm run build && cd functions && npm run build && cd ..

# Lint
npm run lint

# Deploy to Firebase
firebase deploy --project faroformapt

# Deploy only functions
firebase deploy --only functions --project faroformapt

# Local emulators (run alongside npm run dev)
firebase emulators:start --only functions
```

No automated tests exist yet. If added, place them in `src/__tests__/` using Vitest.

## Architecture

**Two distinct modules:**

1. **Frontend** (`src/`) — React 19 + TypeScript SPA, built by Vite into `dist/`. Firebase Hosting serves `dist/` statically with an SPA fallback rewrite.

2. **Backend** (`functions/`) — TypeScript compiled to CommonJS (`functions/lib/`). A single Express app exported as a Firebase Cloud Function (`api`). Firebase Hosting rewrites `/api/**` to this function. The function runs on Cloud Run (2nd Gen, europe-west1).

**Dual data stores:**
- **Google Sheets** — permanent records for form submissions (Formadores, Alunos, Contactos tabs). Written via `googleapis` using a service account.
- **Firestore** — app state: courses catalogue, weekly agenda, dynamic site config (title/description/SEO). Read by the frontend through the `/api/*` endpoints and Firebase SDK directly.

**`firebase.json` routing:**
```
/api/**  →  Cloud Function "api"
**       →  dist/index.html (SPA fallback)
```

## Key Files

| File | Role |
|------|------|
| `functions/src/index.ts` | All API routes + Express app + CF export |
| `src/App.tsx` | Client-side routing (History API, no React Router) and theme management |
| `src/services/api.ts` | All frontend→backend calls; attaches Firebase ID token for admin routes |
| `src/config/firebase.ts` | Firebase SDK init (reads `VITE_*` env vars) |
| `src/pages/Admin.tsx` | Admin portal: Google Sign-In + 7-tab dashboard |
| `src/components/admin/` | Dashboard sub-components (AgendaView, CoursesView, ConfigView, etc.) |

## API Endpoints

**Public (no auth):**
- `POST /api/inscricao-formadores` → Sheets "Formadores" + confirmation email
- `POST /api/contact` → Sheets "Contactos" + admin notification email
- `POST /api/student` → Sheets "Alunos" + confirmation email
- `GET /api/courses` → Firestore `courses` collection

**Admin (Bearer token required — Firebase ID token):**
- `GET /api/admin/data` → All three Sheets tabs
- `POST /api/admin/update-formador` → Update row in Formadores sheet
- `GET|POST /api/admin/config` → Firestore `config.siteMeta`
- `GET|POST /api/admin/agenda` → Firestore `agenda.sala1`
- `GET|POST|DELETE /api/admin/courses` → Courses CRUD

All POST bodies are validated with Zod. Sheets failures return HTTP 503; email failures are logged and non-blocking.

## Environment Variables

**Frontend** (`.env`, `VITE_` prefix, bundled at build time):
```
VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID,
VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID,
VITE_FIREBASE_APP_ID, VITE_FIREBASE_MEASUREMENT_ID
```

**Backend** (Google Secret Manager, injected at runtime):
```
GOOGLE_SERVICE_ACCOUNT_JSON   # Full service account JSON as single line
SPREADSHEET_ID                # Google Sheet ID
GMAIL_USER                    # faroforma@gmail.com
GMAIL_APP_PASSWORD            # 16-char Gmail app password (no spaces)
```

## Module Conventions

- `src/` uses **ES modules** (`"type": "module"` in root `package.json`)
- `functions/` uses **CommonJS** (`"type": "commonjs"`) — required by Cloud Functions
- CSS follows BEM-like naming (`hero__stat-value`, `btn--primary`) in `src/styles/global.css`
- Static content lives in `src/data/*.ts` (hero, services, courses copy, nav links)
- The `archive/` directory contains the previous GCP Cloud Run server (`archive/server/`) — ignore it

## Admin Access Control

Admin routes use Firebase Authentication. The Admin page does Google Sign-In and the resulting ID token is sent as `Authorization: Bearer <token>` on all `/api/admin/*` calls. Allowed admin emails are hardcoded in `functions/src/index.ts`.
