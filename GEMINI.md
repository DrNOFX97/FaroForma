# FaroForma Project Documentation

## Project Overview
FaroForma is a platform for managing training courses, administrative support, and academic tutoring. The project consists of a high-performance frontend built with React and a serverless backend using Firebase Functions.

### Main Technologies
- **Frontend:** React 19, TypeScript, Vite, Framer Motion (animations), Lucide React (icons).
- **Backend:** Firebase Functions (2nd Gen / Cloud Run), Express.js.
- **Database:** Google Sheets (for registrations) and Cloud Firestore (for site configuration and agenda).
- **Authentication:** Firebase Auth (Google Sign-in) restricted to administrator (`faroforma@gmail.com`).
- **Integrations:** Google Sheets API, Nodemailer (Gmail SMTP), jsPDF & html2canvas (PDF generation).

## Architecture
The system follows a modern decoupled architecture:
1.  **Client:** A Single Page Application (SPA) that handles routing and UI. It interacts with the backend via a `/api` proxy configured in `firebase.json`.
2.  **Backoffice:** A protected route (`/admin`) that allows real-time management of registrations, site metadata, and a classroom occupancy agenda.
3.  **Functions:** A single Node.js 22 function (`api`) that handles:
    - Trainer (`formadores`) and student (`alunos`) registrations.
    - Contact form submissions.
    - Data synchronization with Google Sheets.
    - Automatic email notifications via Gmail.
    - CRUD operations for the occupancy agenda in Firestore.

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
# Build the project
npm run build
cd functions && npm run build && cd ..

# Deploy to Firebase
firebase deploy --project faroformapt
```

## Configuration & Environment
- **Frontend Environment Variables:** Uses `.env` with `VITE_` prefix for Firebase configuration.
- **Backend Secrets:** Managed via Google Cloud Secret Manager. Required secrets:
    - `GOOGLE_SERVICE_ACCOUNT_JSON`: Clean JSON key for the service account.
    - `SPREADSHEET_ID`: ID of the main Google Sheet.
    - `GMAIL_USER`: `faroforma@gmail.com`.
    - `GMAIL_APP_PASSWORD`: 16-character App Password.

## Development Conventions
- **Routing:** SPA routing handled in `App.tsx`. Admin layout is separated from the public site.
- **Styling:** Vanilla CSS with variables defined in `global.css`.
- **Security:** Always use the `isAdmin` middleware for sensitive backend routes. Never commit raw API keys or secrets to the repository.
- **Data Integrity:** The Google Sheet is the primary source of truth for registrations. Firestore is used for dynamic application state (agenda and meta tags).
- **Automation:** Every new registration triggers dual email notifications (Registrant + Admin).
