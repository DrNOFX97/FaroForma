# FaroForma Project Documentation

## Project Overview
FaroForma is a platform for managing training courses, administrative support, and academic tutoring. The project consists of a high-performance frontend built with React and a serverless backend using Firebase Functions.

### Main Technologies
- **Frontend:** React 19, TypeScript, Vite, Framer Motion (animations), Lucide React (icons).
- **Backend:** Firebase Functions (2nd Gen / Cloud Run), Express.js.
- **Database:** Google Sheets (for registrations) and Cloud Firestore (for site configuration and agenda).
- **Authentication:** Firebase Auth (Google Sign-in) restricted to authorized administrators.
- **Integrations:** Google Sheets API, Nodemailer (Gmail SMTP), jsPDF & html2canvas (PDF generation).

## Architecture
The system follows a modern decoupled architecture:
1.  **Client:** A Single Page Application (SPA) with multi-language support (PT/EN UK). It interacts with the backend via a `/api` proxy.
2.  **Backoffice:** A protected route (`/admin`) for authorized emails (`faroforma@gmail.com`, `custodio.guerreiro@gmail.com`). Features include:
    - Real-time management of registrations.
    - Site metadata configuration (Firestore).
    - Classroom occupancy agenda (Sala 1) with PDF export and Print preview.
3.  **Functions:** A single Node.js 22 function (`api`) handling registrations, contacts, sheets sync, and automated emails.

## Building and Running

### Development
```bash
# Install dependencies
npm install
cd functions && npm install && cd ..

# Run local development server
npm run dev
```

### Deployment
```bash
# Build and Deploy everything
npm run build && cd functions && npm run build && cd .. && firebase deploy --project faroformapt
```

## Configuration & Environment
- **Frontend:** `.env` with `VITE_FIREBASE_*` variables.
- **Backend Secrets (Secret Manager):**
    - `GOOGLE_SERVICE_ACCOUNT_JSON`: Service account key (must be clean JSON).
    - `SPREADSHEET_ID`: Current Sheet ID: `1lU-ubt273ZRlnGsI6g3WQMFEPKul15TqRrSnRJJ8LDo`.
    - `GMAIL_USER`: `faroforma@gmail.com`.
    - `GMAIL_APP_PASSWORD`: 16-char App Password.

## Development Conventions
- **Multi-language:** Use `useLanguage` hook and `t()` helper. All data files in `src/data/` support `{ pt, en }` objects.
- **Image Carousel:** 7-second interval with smooth crossfade (opacity-based) in Tutoring and About sections.
- **Section Order:** 1. Hero, 2. About, 3. Courses, 4. Services, 5. Tutoring, 6. Contact.
- **Agenda:** Weekdays (Morning/Afternoon/Night), Saturday (Full day). Uses Firestore collection `agenda/sala1`.
- **Security:** `isAdmin` middleware verifies ID tokens against the authorized admin list.
