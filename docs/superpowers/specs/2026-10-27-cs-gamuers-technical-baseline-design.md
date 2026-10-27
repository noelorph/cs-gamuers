# CS-GAMUERS technical baseline design

Status: the canonical TRD baseline was approved by the product owner on 2026-10-27. This entry summarizes that approved baseline; unresolved decisions and application implementation are not approved by it.

## Intent and scope

Define a small [TRD.md](../../../TRD.md) connecting the approved [PRD.md](../../../PRD.md) to technology choices, technical guarantees, testing responsibilities, and explicitly open decisions. Baseline approval does not authorize product features or deployment; the later tooling execution authorization is recorded below.

Scope amendment: the product owner subsequently requested an installation task in the plan for the approved stack. Plan local dependencies, minimal tooling configuration, and smoke checks in the existing application. This request does not execute installation or authorize product features, hosted project provisioning, database changes, or deployment.

The product owner approved that implementation plan on 2026-10-27 and requested the two official Supabase skills (`supabase` and `supabase-postgres-best-practices`) with generated entries in the repository's `skills-lock.json`. Task 3 includes project-local installation and validation; the managed Supabase plugin remains separate. The product owner subsequently requested execution; Task 3 records the implementation and verification results.

## Approaches

- **Selected: compact technical baseline.** Record confirmed technologies and essential constraints; leave unresolved integration choices visible. Keeps the document short but requires feature-specific decisions before implementation.
- **Alternative: implementation-ready TRD.** Resolve providers, integration details, and all limits now. More immediately actionable, but requires further research and a longer document; not selected.

## Decisions and boundaries

- Use Next.js, React, Supabase, Tailwind CSS, ESLint, Prettier, Vitest, Playwright, and npm. Next.js runs locally against hosted Supabase development.
- The approved baseline retains TypeScript, uses Supabase Database/Auth/Storage, and requires reproducible dependencies and isolated development/test records.
- Preserve the PRD's behavior, numeric rules, privacy, revisions, and failure guarantees. Open technical policy values must not silently override those rules.
- Keep detailed schemas and authentication/permission architecture in `ARCHITECTURE.md`, and visual design in `DESIGN_SYSTEM.md`. Do not add deployment, paid AI fallback, school integration, or deferred product features.
- The original planning edit touched only `TRD.md`, this specification, and the handoff plan. The original handoff also corrected the stale PRD approval-status sentence. Installation files and checks are listed in Task 3 of the plan; execution is now authorized for that bounded task.

## Review and handoff

Approval establishes a baseline, not approval of unresolved values or application implementation. The [documentation handoff plan](../plans/2026-10-27-cs-gamuers-technical-baseline-handoff-plan.md) records the documentation tasks and checks. Resolve the TRD's open decisions before implementing their affected features.

Verification: compare documentation against PRD requirements and diagram shared rules, and check local links and whitespace. For tooling implementation, verify the approved file scope and run the checks listed in Task 3. Provider behavior and application acceptance tests require later feature implementation verification.
