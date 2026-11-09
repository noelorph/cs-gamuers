# CS-GAMUERS

Supplemental learning application. Read [AGENTS.md](AGENTS.md) for agent guidance, [PRD.md](PRD.md) for product behavior, [TRD.md](TRD.md) for technical requirements/limits, and [ARCHITECTURE.md](ARCHITECTURE.md) for the selected implementation design.

The architecture targets seven users on phones/computers sharing a local network, with the owner's MacBook hosting Next.js over local HTTPS and hosted Supabase, Groq Free, and Gmail providing external services. Authentication/application review, Faculty course drafts, and local HTTPS are implemented; full product and demonstration acceptance remain open. The owner approved the written architecture on 2026-11-02; the documentation commit was separately authorized that day; no public deployment is planned.

## Local setup

Use Node.js **24.22.1** (`.nvmrc`) and npm **11.19.1**. With nvm installed:

```sh
nvm install
nvm use
npm ci
npx playwright install chromium firefox webkit
npm run dev
```

Open http://localhost:3000 for public development screens. Protected flows require the configured hosted services and trusted local HTTPS; see [demonstration readiness](docs/demo/README.md) and the [implementation handoff](docs/implementation-status/2026-11-07-role-authentication.md) for recorded results and remaining acceptance. Keep credentials out of Git. Public deployment is not configured.

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
| `npm run browser -- <command>` | Interactive Playwright CLI for browser exploration and debugging |
| `npm run test:e2e` | Build, then run Chromium/Firefox/WebKit tests against a managed local server |

`npm test -- tests/unit` runs unit/component tests without hosted credentials. Full `npm test` also runs guarded hosted integration tests: use the isolated TEST project and verify the actual mail hook before supplying its command-local attestation, as described in [fixture setup](tests/integration/helpers/README.md). Default `npm run test:e2e` checks public screens in all three configured engines; hosted authentication cases require explicit TEST/HTTPS configuration and otherwise report skips. Port 3000 must be free; an unrelated server is never reused.

CI runs formatting, lint, TypeScript, unit/component tests and the default public browser checks for `main`, `feat/role-authentication`, and pull requests targeting `main`. It does not provision hosted TEST credentials or establish full authentication acceptance. The hosted integration and trusted-HTTPS authentication browser gates remain separate; see the implementation handoff. No test attestation grants approval or changes provider settings.

Tailwind uses the installed PostCSS plugin for webpack production builds and the existing loader for Turbopack development. Theme and utilities are imported without Preflight.

### Interactive browser workflow

Playwright CLI is included in the existing pinned Playwright development dependency; no global install or additional package is needed. Start `npm run dev`, then use another terminal:

```sh
npm run browser -- open http://127.0.0.1:3000 --headed
npm run browser -- snapshot
npm run browser -- resize 320 800
npm run browser -- screenshot --filename=.playwright-cli/home-mobile.png
npm run browser -- console error
npm run browser -- close
```

The CLI also supports clicks, form input, network inspection, and traces. Interactive exploration complements the saved tests run by `npm run test:e2e`; it does not establish PRD acceptance or backend permissions. Use synthetic accounts and save storage state, screenshots, and traces under ignored `.playwright-cli/`, especially when they contain private data.

The official agent skill is committed in `.agents/skills/playwright-cli/`. It was generated from the installed Playwright **1.64.1** package using `npm run browser -- install --skills=agents`; repeat that command to initialize a fresh workspace or intentionally refresh the skill after a Playwright upgrade, and review generated changes. See [Playwright's installation documentation](https://playwright.dev/agent-cli/installation).

## Agent skills

The official `supabase` and `supabase-postgres-best-practices` skills are stored in `.agents/skills/`; their source paths and hashes are tracked in `skills-lock.json`. The Supabase plugin is managed separately. Skills CLI **1.7.4** installed the project copies with:

```sh
npx --yes skills@1.7.4 add supabase/agent-skills --skill supabase supabase-postgres-best-practices -a codex -y
npx --yes skills@1.7.4 list -a codex --json
```

The add command resolves upstream content at execution time; review any resulting skill and lockfile changes. Committed skill files provide the repository's reviewed snapshot. See [AGENTS.md](AGENTS.md) for when to apply each skill.

### Shared UI

Use **shadcn/ui** for standard interface components and **Lucide React** for icons. The installed starter set is Button, Card, Input, Textarea, Badge, and Dialog in `src/components/ui/`. Import these shared components instead of recreating controls in pages.

Add other important primitives (Select, Dropdown Menu, Alert Dialog, Table, Tabs, Checkbox, Radio Group, and Tooltip) when the relevant feature needs them:

```sh
npm_config_save_exact=true npx --no-install shadcn add <component>
```

Review generated code against `DESIGN_SYSTEM.md`, especially control sizes, contrast, focus, and disabled states. Configuration lives in `components.json`; theme mappings live in `src/styles/globals.css`. Tailwind Preflight remains omitted. Use named `lucide-react` imports; label icon-only controls and hide decorative icons from assistive technology. Inter font loading is not installed yet.
