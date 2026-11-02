# CS-GAMUERS Technical Baseline and Tooling Implementation Plan

Historical completed tooling plan. Current technical defaults and implementation structure are in [TRD.md](../../../TRD.md) and [ARCHITECTURE.md](../../../ARCHITECTURE.md). The [2026-11-01 architecture handoff](2026-11-01-cs-gamuers-architecture-handoff-plan.md) supersedes this task's former open-decision status. Preserve execution evidence below; its implementation/commit instructions authorize no new work and do not override the owner's current no-commit instruction.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hand off the approved compact technical baseline, then install and verify its development tools.

**Architecture:** The TRD owns technical requirements; the PRD owns product behavior. Extend the existing Next.js project with the approved tools; detailed application architecture and visual design remain separate.

**Tech Stack:** Next.js, React, TypeScript, Supabase, Tailwind CSS, ESLint, Prettier, Vitest, Playwright, npm.

**Status:** Implementation plan approved by the product owner on 2026-10-27, with the requested addition of Supabase skills and their repository lockfile. Documentation handoff is complete; Task 3 implementation and checks completed on 2026-10-28, and a fresh read-only review found no issues.

**Spec:** [Technical baseline design](../specs/2026-10-27-cs-gamuers-technical-baseline-design.md), summarizing the approved [TRD.md](../../../TRD.md).

## Global Constraints

- Next.js runs locally against hosted Supabase development.
- Preserve the PRD's behavior, numeric rules, privacy, revisions, and failure guarantees. Open technical policy values must not silently override those rules.
- Keep detailed schemas and authentication/permission architecture in `ARCHITECTURE.md`, and visual design in `DESIGN_SYSTEM.md`. Do not add deployment, paid AI fallback, school integration, or deferred product features.
- Task 3 covers local dependency installation, tooling configuration, and repository-local Supabase skills with `skills-lock.json`. Hosted project provisioning, database migrations, authentication flows, AI/email providers, deployment, and product feature implementation remain outside this plan. Do not modify the managed Supabase plugin cache.

## Review Focus

1. Approval wording must not imply section 6 decisions are settled.
2. Hosted development must not imply production deployment or destructive shared-database tests.
3. Supabase selection must not imply default sessions satisfy immediate access revocation.
4. Retry, revision, and retention rules must preserve PRD learning records and privacy.
5. Testing expectations must not be reported as executed application tests.

## Task 1: Record the approved baseline

**Files:** Modify `TRD.md` and `docs/superpowers/specs/2026-10-27-cs-gamuers-technical-baseline-design.md`; retain the status-only correction in `PRD.md`. Create this plan.

**Interfaces:** Consume the approved PRD, TRD, and product diagram shared rules; produce linked documentation with unchanged product behavior.

- [x] Record the owner's 2026-10-27 baseline approval and update previously proposed baseline wording; retain every section 6 decision as open.
- [x] Link the TRD, specification, and this plan; preserve the recorded product-diagram approval correction.
- [x] Review all five focus cases against the final documents: open decisions stay open, development stays separate from deployment, revocation needs verification, PRD guarantees remain intact, and tests remain future requirements.

## Task 2: Verify the documentation handoff

**Files:** Read the three technical documents and `PRD.md`; update this plan's validation record only.

- [x] Check local Markdown links in those documents; all 13 local destinations exist.
- [x] Run `git diff --check` and inspect tracked/untracked changes; no whitespace errors, including a separate check of untracked documents, and only the four scoped Markdown documents changed.
- [x] Deliver links to the approved baseline and handoff plan; leave application implementation and open-decision work for a separately authorized task.

The checks above cover the completed documentation handoff only. They are historical documentation checks; fresh installation checks are recorded below.

## Task 3: Install and verify the approved development stack

**Files:** Modify `package.json`, `package-lock.json`, `.gitignore`, `eslint.config.mjs`, `src/app/layout.tsx`, `README.md`, and `TRD.md` (installed-version record). Create `.nvmrc`, `.prettierrc.json`, `.prettierignore`, `vitest.config.mts`, `playwright.config.ts`, `src/app/globals.css`, `tests/unit/home.test.tsx`, and `tests/e2e/home.spec.ts`. Preserve existing application behavior.

**Agent tooling files:** Add `.agents/skills/supabase/` and `.agents/skills/supabase-postgres-best-practices/`, including their referenced resources; update the existing root `skills-lock.json` and add a short usage note in `AGENTS.md` outside the generated Next.js block. Preserve all existing skills and lock entries.

**Interfaces:** Consume the existing `Home` component and `/` route, which display the `CS-GAMUERS` heading. Produce reproducible npm scripts and passing local smoke checks; these are tooling checks, not PRD acceptance or hosted-database integration tests.

- [x] Inspect current Node/npm versions, package engines/peer requirements, and the installed Next.js installation, Tailwind, Vitest, and Playwright guides. Select a compatible supported Node release and exact new-package versions; record Node in `.nvmrc`, compatible engines and the exact npm version in `package.json`, and versions in the TRD. Do not upgrade the existing framework stack incidentally.
- [x] Verify the Supabase plugin provides `supabase` (general Supabase/Auth/Storage/SSR guidance) and `supabase-postgres-best-practices` (schema, SQL, RLS, and performance guidance). Install repository-local copies of these two official skills from `supabase/agent-skills` using the Skills CLI, selecting Codex and project scope. Check the chosen CLI version's engines and `--help` first; use `skills add supabase/agent-skills --skill supabase supabase-postgres-best-practices -a codex` with that verified CLI version. Let the installer generate `skills-lock.json` entries; never invent source paths or hashes. The plugin remains separately managed and is not itself locked by this file.
- [x] Validate both installed `SKILL.md` names and referenced resources, confirm the CLI lists both project skills, and parse `skills-lock.json` to verify both new entries identify `supabase/agent-skills` with generated paths/hashes while all previous entries remain unchanged. Record the CLI version and install command in `README.md`; document when to use each skill in `AGENTS.md`. Do not add duplicate global installs, unrelated skills, or application dependencies for agent skills.
- [x] Run `npm ci` to restore the already declared Next.js, React, TypeScript, Tailwind CSS, and ESLint dependencies. Install `@supabase/supabase-js` and `@supabase/ssr` with `npm install --save-exact`; install `prettier`, `eslint-config-prettier`, `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/dom`, `@playwright/test`, and Node 24 type definitions with `npm install --save-dev --save-exact`, using the verified versions. Retain the npm lockfile. Supabase Auth, Database, and Storage are hosted services, not separate npm installations; do not scaffold clients or connect to a database yet.
- [x] Create `src/app/globals.css` with the Tailwind import and import it from the root layout, using the existing Tailwind/Turbopack setup. Preserve current layout and content; add no design system or UI redesign.
- [x] Configure Prettier with defaults and append `eslint-config-prettier/flat` to the existing ESLint configuration. Scope formatting scripts to application source, tests, and root configuration files; exclude generated files, reports, and documentation assets. Add `format`, `format:check`, and `typecheck` scripts; type checking runs `next typegen && tsc --noEmit`. Format only the scoped files, preserving behavior.
- [x] Configure Vitest with React, native Vite TypeScript path resolution, and jsdom. Include only `tests/unit/**/*.test.{ts,tsx}` and `tests/integration/**/*.test.{ts,tsx}` so Playwright files are excluded. Add `test` (`vitest run`) and `test:watch` (`vitest`). In `tests/unit/home.test.tsx`, render the real `Home` component and assert its level-one `CS-GAMUERS` heading exists. Database integration tests will be added with the features and isolation design; do not add empty passing placeholders.
- [x] Configure Playwright for `tests/e2e`, with Chromium as the initial tooling smoke browser, base URL `http://127.0.0.1:3000`, and a managed server running `npm run start -- --hostname 127.0.0.1` after a build. Do not reuse an unrelated running server. Add `test:e2e` (`npm run build && playwright test`), install Chromium with `npx playwright install chromium`, and ignore `playwright-report/` and `test-results/`. In `tests/e2e/home.spec.ts`, open `/` and assert title `CS-GAMUERS` and a visible level-one heading with that name. Chromium-only setup does not settle the product's supported-browser matrix.
- [x] Verify a fresh `npm ci`, `npm ls --depth=0`, `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm test`, and `npm run test:e2e`. Expected: dependencies resolve without invalid peers, checks/build pass, and both real smoke tests pass without Supabase credentials. Fix setup failures; do not disable checks to obtain a pass.
- [x] Document setup, browser installation, and commands in `README.md`; update the TRD's manifest observation and resolved tooling versions. Review `git diff --check` and the final diff, and report installed versions and actual check results. Keep review-focus items 1–5 intact; do not claim provider integration, revocation, or product acceptance has been tested.

Setup references: installed Next.js guides under `node_modules/next/dist/docs/01-app/02-guides/testing/`, [Supabase SSR packages](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Prettier installation](https://prettier.io/docs/install), and [Vitest setup](https://vitest.dev/guide/). Recheck compatibility at execution time; exact package versions are selected in the first step rather than guessed in this plan.

Skill sources: [official Supabase agent skills](https://github.com/supabase/agent-skills) and [Skills CLI](https://github.com/vercel-labs/skills). Repository skill copies and `skills-lock.json` travel together; plugin availability alone does not supply repository lock entries.

## Execution record — 2026-10-28

- Preserved the requested separate documentation commits: PRD `d339022`, remaining baseline/spec/plan `4583427`. Implementation uses branch `chore/technical-baseline-tooling`.
- Installed the approved packages with exact new versions; recorded Node `24.22.1` / npm `11.19.1`. Existing framework versions stayed unchanged; Node types and their `undici-types` dependency changed to match Node 24 and Vitest's peer requirement.
- Installed both official project skills with Skills CLI `1.7.4`. Verified discovery, resource links, generated source/path/hash entries, and preservation of all seven prior lock entries.
- Ruling: use Vite's native `resolve.tsconfigPaths` instead of the redundant plugin suggested by the installed Next.js guide. Removed the plugin after Vite's warning; the alias-based Home test passes.
- Ruling: import Tailwind theme/utilities without Preflight to preserve existing browser-default page styling. Keep the configured Turbopack loader.
- Verification passed: fresh `npm ci`, `npm ls --depth=0`, lint, formatting, type checking, Vitest (1 test), production build, and Chromium Playwright (1 test). No Supabase credentials or remote database operations were needed. Initial browser installation failed because it overlapped a clean install; sequential retry succeeded.
- npm reported zero vulnerabilities. Existing ESLint 9 emits an unsupported-version notice; upgrading its major is a separate compatibility decision. npm also reports unapproved install scripts for optional `fsevents` and `unrs-resolver`; no script policy was loosened, and all checks passed. Browser-run color-environment warnings did not affect results.
- No product feature, provider integration, RLS/session enforcement, or hosted database integration was implemented or tested. TRD feature decisions remained open at this tooling handoff; later selected defaults are recorded in the canonical TRD and architecture.
- The initial fresh-context review reported no findings, and local-link checks passed. A later full-branch review found one trailing space in `.agents/skills/supabase-postgres-best-practices/references/_contributing.md:30`. The upstream file is retained unchanged to preserve the installed skill snapshot; project-authored changes pass whitespace checks. Future reviews must check the full branch diff, including newly added files, and report this exception explicitly.
