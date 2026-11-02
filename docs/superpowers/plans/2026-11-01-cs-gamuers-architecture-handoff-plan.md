# CS-GAMUERS Architecture Documentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Write the agreed architecture and align project documentation, leaving changes uncommitted for owner review.

**Architecture:** One Next.js application on the owner's MacBook, accessed through local HTTPS, with hosted Supabase, Groq Free, and a dedicated Gmail sender. This plan implements the documentation handoff only; it does not authorize product code, installations, provisioning, or deployment.

**Tech Stack:** Existing TRD baseline; proposed operational additions are Caddy and ClamAV. No vector database, AI framework, separate backend, or external queue service.

**Spec:** [Canonical architecture](../../../ARCHITECTURE.md), indexed by [the architecture specification](../specs/2026-11-01-cs-gamuers-architecture-design.md).

**Status:** Owner approved the architecture direction, defaults, and final design in conversation on 2026-11-01. Documentation writing and alignment are authorized. The owner approved the written architecture on 2026-11-02 and requested that approval be documented before any commit. The owner subsequently authorized the documentation commit on 2026-11-02; implementation remains outside scope.

## Global Constraints

- Preserve PRD behavior, requirement IDs, permissions, retention, and acceptance scenarios.
- Seven demonstration users: one Administrator, three Students, two Faculty, one Program Head. Separate devices, same local network, internet available, MacBook host, no public deployment.
- All selected services must remain free; no automatic paid fallback.
- Verification, invitation, and password-reset links expire after 30 minutes. This final approved choice supersedes the earlier one-hour proposal.
- Documentation only. Do not alter application source, dependencies, database state, credentials, or the original reference DOCX.
- Written-design approval and the subsequent explicit documentation-commit authorization were received on 2026-11-02; do not expand scope to product implementation.

## Review Focus

1. A stale session, direct Data API request, or former owner must not retain protected access.
2. Retries, concurrent writes, midnight rollover, and process interruption must not duplicate learning outcomes or AI charges.
3. Expired/deleted chat must not reappear through saved AI outcomes, logs, or restoration procedures.
4. Historical plans and the reference document must not override current canonical requirements or authorize new implementation.
5. Free-service selection and documented tests must not imply working integration, production readiness, or guaranteed availability.

## Task 1: Write the architecture

**Files:** Replace the notes in `ARCHITECTURE.md`; create `docs/superpowers/specs/2026-11-01-cs-gamuers-architecture-design.md`.

**Interfaces:** Consume the approved PRD, TRD, diagram shared rules, and conversation decisions. Produce component boundaries, data relationships, access rules, state transitions, failure handling, and feature-verification gates.

- [x] Write the smallest design covering the approved product and demonstration environment.
- [x] Distinguish selected implementation defaults from provider facts and runtime evidence.
- [x] Perform the brainstorming skill's fresh builder check; resolve material implementation questions in the documents.

## Task 2: Align documentation

**Files:** Modify `AGENTS.md`, `PRD.md`, `TRD.md`, `README.md`, `docs/agents/domain.md`, `docs/agents/issue-tracker.md`, both existing specification entries, both historical handoff plans, and `docs/diagrams/README.md` as needed. Inspect all Markdown and PlantUML sources under `docs/`.

**Interfaces:** Consume canonical architecture decisions; produce a consistent reading order and clear document authority without duplicating requirements.

- [x] Resolve applicable TRD open decisions and link mechanisms to the architecture.
- [x] Replace stale future-decision wording with canonical references; label old plan constraints as historical scope.
- [x] Preserve the original reference and product diagrams as product-level artifacts; regenerate SVGs only if a diagram source changes.
- [x] Ensure optional absent glossary/design/ADR files do not become required reads or broken links.

## Task 3: Verify and hand off

**Files:** Review all changed documentation; record results in this plan.

- [x] Check local Markdown links, required document sections, diagram source/preview pairing, and preserved PRD requirement/acceptance IDs.
- [x] Walk all five Review Focus cases against the final design and document the implementation tests that will prove them.
- [x] Run `git diff --check`, inspect the full diff and untracked files, and confirm no code/dependency changes or commits.
- [x] Deliver the canonical architecture and supporting links for owner review, with actual checks and untested integration limits.

## Validation record

Documentation completed on 2026-11-01, uncommitted for owner review. This record concerns documentation checks, not application acceptance.

- Checked 18 project Markdown documents and 680 local links: no missing destinations. Optional future design/glossary/ADR paths remain plain-text future locations, not broken required links.
- Preserved all 132 unique PRD requirement/acceptance IDs. Sections 2–16 and the report-calculation section are byte-for-byte unchanged; remaining PRD edits add approved demonstration context or update document pointers/status.
- Checked all 30 PlantUML sources have SVG previews and parsed all 30 SVGs. Diagram sources/previews and the historical reference DOCX are unchanged, so no regeneration or new visual-layout claim is made.
- Reviewed the historical reference's academic-administration scope against the PRD's superseding scope table; retained the source and clarified its authority instead of rewriting history.
- `git diff --check` and a separate whitespace check including new Markdown files passed. Changes are limited to 14 Markdown files: 12 modified and two new. No application/dependency/configuration files changed, no services were provisioned, and no commit was made.

Fresh builder review identified recovery-session bypass, chat prerequisite enforcement, and a roadmap shortlist that could truncate a valid path. Corrections use a free-plan Postgres email hook with opaque application links, server-selected chat output permissions, and a full server-built selected-path list independent of the model shortlist. A targeted follow-up resolved interrupted password-write fencing with a deferred operation check; the reviewer confirmed no further owner decision was required. Hosted Auth transaction/trigger compatibility, including native password maintenance, remains a mandatory implementation test, not a passed check.

| Review focus | Design walk and required runtime evidence |
|---|---|
| Revoked/direct/former-owner access | Account/session predicate in RLS/functions/files, current ownership, restricted proof sessions and deferred account-operation fence; future tests use stale credentials and direct APIs. |
| Retries/concurrency/midnight/crash | Unique constraints, participation locks, request generations/reservations and midnight deadline; future tests cover concurrent final quizzes, response loss and late AI/Auth writes. |
| Chat resurrection | Read/context/write exclusion at deletion/90 days, linked-payload removal, minimal accounting metadata and restoration gate; future tests delete during generation and check exact expiry. |
| Conflicting documentation | Root authority/read order, thin spec index, historical-plan notices, unchanged product diagrams/reference; checked local links and PRD preservation. |
| Free-provider and verification claims | TRD separates selected defaults, measured targets, provisioning checks, and deferred production work. No email/AI/device/security integration is reported tested. |

Application tests were not run for this documentation-only change. Actual network/certificate trust, Gmail/Groq availability, PDF scanning, Auth flows/RLS, device coverage, and performance must be verified during the corresponding feature implementation. External AI roadmaps remain deferred; no commit or product execution is authorized by this handoff.

## Documentation review corrections — 2026-11-02

The owner authorized the four review corrections after clarification: defer the exact ranking algorithm to the guidance feature spec; restrict role changes to Faculty, Program Head, and Administrator; align stale AI-selection wording; and show roadmap acceptance-time revalidation in diagrams. Conversion between Student and staff is excluded in both directions. These later decisions update the relevant PRD wording; the byte-for-byte preservation statement above describes only the 2026-11-01 handoff. No product implementation or commit is authorized.

- [x] Point PRD AI-selection wording to the selected TRD/architecture decisions, preserving free services and no paid fallback.
- [x] Require the guidance feature spec to define exact matching, scoring, adjustment precedence, and deterministic verification examples before implementation; retain catalog, context, and final stable-ID constraints.
- [x] Align ACC-11/12, P-08, AC-38, technical enforcement, and account diagrams/galleries with staff-only role transitions.
- [x] Add roadmap acceptance-time access/eligibility and stale-confirmation outcomes; preserve the current plan on rejection and harmless replay of an already active plan.
- [x] Regenerate and visually inspect all five affected diagram previews; check links, traceability, preserved IDs, and the scoped diff.
- [x] Complete a final documentation review and record fresh evidence, leaving all changes uncommitted.

Final review evidence: all 18 project Markdown documents have 680 resolving local links; all 30 PlantUML sources have parseable SVG previews. All 132 unique PRD requirement/acceptance IDs and 94 traceability rows are preserved, and every diagram requirement list agrees with its gallery and traceability mapping. Regenerated SS-05, SS-13, FC-06, FC-08, and UC-06 with PlantUML 1.2026.9 and visually inspected companion PNGs: branch order and labels remain readable, with no clipping obscuring the flows. The renderer was downloaded to a temporary directory; no application dependency changed.

Walked the final documents through selected-but-unverified AI integration, deferred ranking decisions, staff-only role changes with ownership/last-Administrator safeguards, and roadmap acceptance after archive or another replacement. Existing saved-success retrieval, same-active-plan replay, retained learning records, privacy, and explicit acceptance remain consistent. No further actionable documentation misalignment was found in this final review. The scoped snapshot diff contains only 17 documentation files, including five source/preview pairs; whitespace checks pass for tracked changes and the untracked handoff plan. Existing unrelated working-tree edits are preserved. No code, provider, or database work was performed, and no commit was made.

DESIGN_SYSTEM.md remains outside this review at the owner's request. Runtime/provider tests were not run; exact recommendation ranking is an explicit prerequisite for the future guidance feature spec, and provider compatibility remains subject to the existing implementation gates.

## Product-owner approval — 2026-11-02

The owner stated, "okay, I approve it now," after the overall architecture explanation and confirmation that the selected AI provider/model is Groq Free with `openai/gpt-oss-20b`. The owner then requested, "document my approval before commit."

This records approval of the written architecture, including `src/config/env.ts`, `src/config/paths.ts`, `src/styles/globals.css`, `src/app/not-found.tsx`, and the rule that `src/app/` handles routing/page composition while feature modules handle business operations. Referenced technical choices remain selected, not runtime-verified. Exact recommendation ranking still requires the guidance feature specification; deferred features remain deferred.

Approval does not expand scope to implementation, provisioning, deployment, or DESIGN_SYSTEM.md. No commit was made when recording this approval. Earlier review and validation entries remain historical evidence.

## Commit authorization — 2026-11-02

After approval was documented, the owner explicitly requested, "please commit now." This authorizes committing the approved architecture and aligned documentation, including the recorded diagram corrections. It does not authorize application implementation, provisioning, deployment, or a remote push. Earlier no-commit statements record the scope at their respective handoffs and are superseded for this documentation commit.
