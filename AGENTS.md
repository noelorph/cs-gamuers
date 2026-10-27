<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Agent skills

### Supabase

Use [.agents/skills/supabase/SKILL.md](.agents/skills/supabase/SKILL.md) for Supabase products, Auth, Storage, and Next.js integration. Also use [.agents/skills/supabase-postgres-best-practices/SKILL.md](.agents/skills/supabase-postgres-best-practices/SKILL.md) for schema, SQL, RLS, and query performance work. Their official sources are tracked in `skills-lock.json`; the Supabase plugin is managed separately. Read current guidance before implementation and preserve the PRD's access and retention requirements.

### Product requirements

[PRD.md](PRD.md) is the approved source of truth for product behavior. Read the relevant requirements before implementation; diagrams, specs, and plans must remain consistent with it.

### Technical requirements

[TRD.md](TRD.md) records the approved technology baseline, technical guarantees, and verification requirements. Read the relevant requirements before implementation and resolve applicable open decisions before implementing affected features; the PRD remains authoritative for product behavior.

### Issue tracker

Specs live in `docs/superpowers/specs/` and plans in `docs/superpowers/plans/`. Track implementation tasks in those plans. Use GitHub Issues only when explicitly requested. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context layout: `GLOSSARY.md` at the repo root and ADRs in `docs/adr/`. See `docs/agents/domain.md`.
