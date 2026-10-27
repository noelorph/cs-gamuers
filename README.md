# CS-GAMUERS

Supplemental learning application. See [PRD.md](PRD.md) for product behavior and [TRD.md](TRD.md) for the approved technical baseline.

## Local setup

Use Node.js **24.22.1** (`.nvmrc`) and npm **11.19.1**. With nvm installed:

```sh
nvm install
nvm use
npm ci
npx playwright install chromium
npm run dev
```

Open http://localhost:3000. The current page and tooling checks require no Supabase credentials. The backend will use a hosted Supabase development project; project provisioning, authentication integration, and database changes are separate work. Keep real credentials out of Git. Production deployment is not configured.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Local development server |
| `npm run build` | Production build, without deployment |
| `npm run start` | Serve a completed build |
| `npm run lint` | ESLint checks |
| `npm run format` | Format application source, tests, and root configuration |
| `npm run format:check` | Check that formatting without writing |
| `npm run typecheck` | Generate Next.js route types and run TypeScript checks |
| `npm test` | Vitest unit/integration tests, once |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:e2e` | Build, then run Chromium tests against a managed local server |

Vitest currently checks the existing home component. Integration tests will use `tests/integration/` when features and isolated test records exist. Playwright verifies the real home page title and heading; port 3000 must be free, and an unrelated server is never reused. These smoke checks do not prove PRD acceptance, Supabase permissions, or provider integration. The supported product-browser matrix remains open.

Tailwind uses the existing Turbopack loader. Theme and utilities are imported without Preflight so installation does not reset the existing page's browser-default styling.

## Agent skills

The official `supabase` and `supabase-postgres-best-practices` skills are stored in `.agents/skills/`; their source paths and hashes are tracked in `skills-lock.json`. The Supabase plugin is managed separately. Skills CLI **1.7.4** installed the project copies with:

```sh
npx --yes skills@1.7.4 add supabase/agent-skills --skill supabase supabase-postgres-best-practices -a codex -y
npx --yes skills@1.7.4 list -a codex --json
```

The add command resolves upstream content at execution time; review any resulting skill and lockfile changes. Committed skill files provide the repository's reviewed snapshot. See [AGENTS.md](AGENTS.md) for when to apply each skill.
