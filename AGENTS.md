# Repository Guidelines

## Project Structure & Module Organization
The application code resides in `src/`; place reusable UI in `src/components/`, routed shells in `src/pages/`, shared state in `src/contexts/`, bespoke hooks in `src/hooks/`, helpers in `src/utils/`, and shared types in `src/types/`. Firebase wiring belongs in `src/lib/firebase.ts`. Global styles live in `src/index.css`, while Tailwind and PostCSS tokens are maintained through `tailwind.config.js` and `postcss.config.js`. Keep Firebase rules (`firestore.rules`, `storage.rules`) and deployment metadata (`firebase.json`) at the repo root; collocate any feature assets alongside their consumer.

## Build, Test, and Development Commands
Run `npm run dev` to launch the Vite dev server. `npm run build` performs type checking and emits the optimized bundle to `dist/`. Use `npm run preview` to smoke-test the built bundle, and run `npm run lint` to execute ESLint across all `ts`/`tsx` sources—resolve or explicitly justify any warning before merge.

## Coding Style & Naming Conventions
Author React components with 2-space indentation, single quotes, and explicit return types on exported helpers. Components follow PascalCase (for example, `ProviderFormPage`), hooks start with `use`, contexts end with `Provider` or `Context`, and utilities describe behaviour (`formatProvider.ts`). Import ordering flows framework → third-party → internal → styles, preferring the `@/` alias for modules under `src/`. Format with Prettier and rely on ESLint autofix to keep the codebase consistent.

## Testing Guidelines
Automated coverage is in progress; until then, follow the manual QA checklist in `README.md` for auth, catalog browsing, provider form, uploads, and admin master-data flows. When adding automated tests, use Vitest with React Testing Library, name specifications `*.test.tsx`, and mock Firebase via `vi.mock('@/lib/firebase')`. Aim for ≥80 % coverage on components and hooks and ≥90 % on utilities, noting any shortfall in the PR.

## Commit & Pull Request Guidelines
Write imperative, sentence-case commit summaries (for example, `Add provider upload validation`), keep commits scoped to a single concern, and reference issues as `#123` when applicable. Pull requests should outline user impact, include screenshots or GIFs for UI changes, and list manual or automated test evidence. Run both `npm run lint` and `npm run build` before requesting review.

## Security & Configuration Tips
Never commit `.env` values; load secrets through the GitHub Actions configuration described in `SETUP.md`. After modifying Firestore or Storage rules, validate via the Firebase Emulator and deploy with `firebase deploy --only firestore:rules,storage:rules`. Coordinate any admin allowlist updates with the operations team.
