# Repository Guidelines

## Project Structure & Module Organization
- `front/` — React + TypeScript (Vite). UI components in `components/`, API in `services/`, shared types in `types.ts`.
- `backend/` — Express + TypeScript, Prisma ORM. Code in `src/` (`config/`, `controllers/`, `middleware/`, `routes/`, `services/`, `utils/`). DB schema in `prisma/`.
- `docs/` — architecture, research, and plans. `output/` — generated artifacts.
- Root scripts: `test-gemini-api.sh`, `test-gemini-direct.sh` for quick API checks.

## Build, Test, and Development Commands
- Frontend
  - `cd front && npm install`
  - `npm run dev` — run Vite dev server.
  - `npm run build` — production build; `npm run preview` — serve build.
- Backend
  - `cd backend && npm install && cp .env.example .env`
  - Optional infra: `docker compose -f docker-compose.yml up -d` (MySQL + Redis).
  - DB: `npm run prisma:generate` then `npm run prisma:migrate`.
  - `npm run dev` — ts-node-dev server. `npm run build && npm start` — production.
- Quick checks: from repo root, run `./test-gemini-api.sh` or `./test-gemini-direct.sh` with required env vars.

## Coding Style & Naming Conventions
- TypeScript, 2-space indentation, single quotes, semicolons; prefer `async/await`.
- React components: PascalCase (`ChatInterface.tsx`), hooks/names: camelCase. Constants: UPPER_SNAKE_CASE.
- Backend logging via `config/logger` (avoid raw `console.log`). Keep route paths kebab-case under `/api/*`.
- Keep imports ordered: std libs → third-party → local.

## Testing Guidelines
- No formal unit test runner configured. If adding tests:
  - Backend: place in `backend/tests/**`, name `*.test.ts`.
  - Frontend: place in `front/test/**`, name `*.test.tsx` or `*.test.ts`.
  - Prefer lightweight, focused tests; document manual steps when applicable.

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`. Example: `feat(front): add PPT editor drag handles`.
- PRs: clear description, linked issues, verification steps, and screenshots/GIFs for UI changes. Update `README.md`, `docs/`, and `CHANGES.md` when behavior or APIs change.

## Security & Configuration Tips
- Do not commit secrets. Use `backend/.env` and `front/.env.local`; keep `backend/.env.example` updated.
- Key vars: `FRONTEND_URL`, `DATABASE_URL`, Redis host/port, OAuth/Stripe keys.
- Use `backend/docker-compose.yml` for local MySQL/Redis. Ensure `dist/` and `output/` remain untracked per `.gitignore`.

