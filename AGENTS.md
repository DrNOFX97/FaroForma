# Repository Guidelines

## Project Structure & Module Organization
- Root-level configs (`package.json`, `tsconfig.*`, `vite.config.ts`, `eslint.config.js`) live beside `index.html` and provide the build/linting contracts.
- `src/` carries the React + TypeScript source — entry logic in `src/main.tsx`, shared styling in `src/index.css`, and reusable UI under `src/components/` (e.g., `Hero.tsx`, `Navbar.tsx`, `Contact.tsx`).
- `public/` stores static assets (images, favicon) copied verbatim into the build, while `dist/` is the Vite output that should remain ignored in commits.
- When adding modules, mirror the BEM-style CSS conventions (`hero__`, `contact__`, etc.) and keep business logic in hooks/helpers to keep components declarative.

## Build, Test, and Development Commands
- `npm install` — bootstrap dependencies from `package-lock.json`. Run this after changing the lockfile or switching branches.
- `npm run dev` — starts the Vite dev server with Fast Refresh; use this for iterative frontend work (the sandbox may block the port, so run locally when possible).
- `npm run build` — runs `tsc -b` for type safety, then produces the production bundle in `dist/`.
- `npm run lint` — enforces the `eslint.config.js` rules (React + TypeScript) before committing; fix any reported issues and rerun the command.
- `npm run preview` — serves the production build so designers or QA can validate the final UI.

## Coding Style & Naming Conventions
- Use PascalCase for React components (`About.tsx`, `Footer.tsx`), camelCase for hooks/utilities, and descriptive filenames for assets.
- Stick to 2-space indentation, semicolons, single quotes, and concise JSX fragments, mirroring the existing code style.
- CSS class names follow BEM-like patterns (e.g., `hero__stat-value`, `btn--primary`) defined in `src/index.css`; keep these names consistent and semantic.
- ESLint (via `eslint.config.js`) is the formatting authority; run `npm run lint` before merging and resolve all violations.

## Testing Guidelines
- Automated tests are not yet present; if you add suites, place them under `src/__tests__/` and target either Vitest or Jest.
- Name specs `<Component>.test.tsx` to align with tooling defaults and keep test files adjacent to the code they verify.
- Document any new test commands in this guide so future contributors know how to run them.

## Commit & Pull Request Guidelines
- Adopt a conventional-commit style (e.g., `feat: add contact form animation`, `fix: update CTA copy`). Keep each commit focused on a single behavior or bug.
- Mention the purpose, impacted areas, and any lint/test status in each commit; call out known workarounds or skipped steps if necessary.
- PRs should include a short summary, linked issue/Ticket IDs when available, testing steps (`npm run dev`, `npm run build`, `npm run lint`), and UI screenshots when visual changes are involved.

## Configuration & Branding Notes
- The repo now lives in `…/FaroForma/` and uses the brand across metadata (`index.html`, component copy, `package.json` name). Keep the FaroForma name and assets aligned whenever you update text or metadata.
- Avoid adding global polyfills unless required; document any new dependency in `package.json` because the project targets modern browsers out of the box.
