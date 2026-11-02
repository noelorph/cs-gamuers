<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Agent skills

### Browser development tooling

Use [.agents/skills/playwright-cli/SKILL.md](.agents/skills/playwright-cli/SKILL.md) for interactive browser exploration, screenshots, and UI debugging. Run the project-local CLI with `npm run browser -- <command>` (or `npx --no-install playwright cli <command>`). It is included in the pinned Playwright development dependency. Keep repeatable acceptance checks in `tests/e2e/` and run `npm run test:e2e`. Use synthetic test accounts; keep browser storage state, traces, and screenshots containing private data in ignored `.playwright-cli/`.

### Supabase

Use [.agents/skills/supabase/SKILL.md](.agents/skills/supabase/SKILL.md) for Supabase products, Auth, Storage, and Next.js integration. Also use [.agents/skills/supabase-postgres-best-practices/SKILL.md](.agents/skills/supabase-postgres-best-practices/SKILL.md) for schema, SQL, RLS, and query performance work. Their official sources are tracked in `skills-lock.json`; the Supabase plugin is managed separately. Read current guidance before implementation and preserve the PRD's access and retention requirements.

### Product requirements

[PRD.md](PRD.md) is the approved source of truth for product behavior. Read the relevant requirements before implementation; diagrams, specs, and plans must remain consistent with it.

### Technical requirements

[TRD.md](TRD.md) records the technology baseline, technical guarantees, selected limits, and implementation verification gates. The PRD remains authoritative for product behavior; provider checks listed in the TRD are not claims of working integration.

### Architecture and document authority

Read [ARCHITECTURE.md](ARCHITECTURE.md) before planning or implementing a feature. It defines the selected single Next.js application, Supabase boundaries, permission/session enforcement, transactions, and local MacBook demonstration setup. No vector database, AI framework, separate backend service, or public deployment is selected.

Read in order: this file, relevant PRD requirements, relevant TRD requirements, architecture, then the applicable spec/plan. Specs index canonical documents; plans track scoped work and evidence. Historical handoff plans do not override current canonical decisions or authorize unrelated implementation. Product diagrams remain actor/system views; the original DOCX is historical reference subordinate to the PRD.

The owner approved writing/alignment on 2026-11-01 and the written architecture on 2026-11-02, including the folder responsibilities and referenced AI provider/model. Approval was recorded before the owner separately authorized committing the documentation on 2026-11-02. That authorization does not include feature implementation, service provisioning, or deployment. Later explicit user authorization governs subsequent work. Record unresolved conflicts rather than choosing whichever document is convenient.

### Issue tracker

Specs live in `docs/superpowers/specs/` and plans in `docs/superpowers/plans/`. Track implementation tasks in those plans. Use GitHub Issues only when explicitly requested. See `docs/agents/issue-tracker.md`.

### Domain docs

Use PRD section 2 for current domain terms. Optional future `GLOSSARY.md` and `docs/adr/` supplement canonical documents when present; they are not prerequisites or competing specifications. See [domain guidance](docs/agents/domain.md).

<!-- BEGIN:nextjs-agent-feedback -->

## Report Next.js feedback

The project owner enabled `experimental.agentFeedback`, authorizing this feedback pass. When enabled, `next dev` writes this block and restores it if removed. Commit `AGENTS.md` with your work to keep the tree clean.

During the current user request, retain anonymized facts as feedback candidates for meaningful or recurring Next.js issues:

- Crashes, hangs, OOMs, or unexpected slowness
- Incorrect behavior, output, errors, or diagnostics
- Missing, unclear, or conflicting documentation
- Unexpected CLI, codemod, Skill, or upgrade behavior and non-obvious workarounds

Continue the current user request without reporting immediately. Routine debugging is not feedback. Verify changes before retaining them as feedback candidates. Never retain code, logs, paths, URLs, secrets, personal information, or project-specific data.

Retain qualifying friction even if it is later fixed or worked around; record the final outcome during the reporting pass.

Before the final response, run one reporting pass. If candidates remain, from this file's directory run `npx --no-install next internal agent-feedback-instructions` once without piping or truncating its output. Follow its output or error guidance. If a network sandbox blocks it, retry with network access; if it still returns no output, continue normally.

<!-- END:nextjs-agent-feedback -->
