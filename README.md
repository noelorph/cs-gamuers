# CS-GAMUERS

Supplemental learning application. Read [AGENTS.md](AGENTS.md) for agent guidance, [PRD.md](PRD.md) for product behavior, [TRD.md](TRD.md) for technical requirements/limits, and [ARCHITECTURE.md](ARCHITECTURE.md) for the selected implementation design.

The architecture targets seven users on phones/computers sharing a local network, with the owner's MacBook hosting Next.js over local HTTPS and hosted Supabase, Groq Free, and Gmail providing external services. This design is documented, not implemented. The owner approved the written architecture on 2026-11-02; the documentation commit was separately authorized that day; no public deployment is planned.

## Local setup

Use Node.js **24.22.1** (`.nvmrc`) and npm **11.19.1**. With nvm installed:

```sh
nvm install
nvm use
npm ci
npx playwright install chromium
npm run dev
```

Open http://localhost:3000. This is the existing development page, not the future multi-device HTTPS demonstration. Current tooling checks need no Supabase credentials. Provisioning, authentication, migrations, Caddy certificates, ClamAV, and provider setup remain future implementation work described in the architecture. Keep credentials out of Git. Production deployment is not configured.

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

Vitest currently checks the existing home component. Integration tests will use `tests/integration/` with the isolation rules in the architecture. Playwright currently checks the home title/heading in Chromium; port 3000 must be free, and an unrelated server is never reused. These smoke checks do not prove PRD acceptance, Supabase permissions, or provider integration. TRD section 6 defines the target browser matrix; broader coverage and actual-phone rehearsal remain future work.

Tailwind uses the existing Turbopack loader. Theme and utilities are imported without Preflight so installation does not reset the existing page's browser-default styling.

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
