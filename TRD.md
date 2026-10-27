# CS-GAMUERS technical requirements

Status: baseline approved by the product owner on 2026-10-27, including the technical choices and safeguards below. Section 6 decisions remain open. This approval does not authorize application implementation or deployment. See the [documentation handoff plan](docs/superpowers/plans/2026-10-27-cs-gamuers-technical-baseline-handoff-plan.md).

## 1. Scope and document boundaries

[PRD.md](PRD.md) is authoritative for behavior, permissions, numeric product rules, and acceptance scenarios. This document records technology choices and the technical guarantees needed to deliver them; it does not repeat the product specification.

Detailed system boundaries, schemas, authentication flows, and permission enforcement belong in [ARCHITECTURE.md](ARCHITECTURE.md). Visual rules belong in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). Product diagrams remain actor/system views under [docs/diagrams/](docs/diagrams/README.md).

## 2. Technology baseline

| Technology | Responsibility | Decision |
|---|---|---|
| Next.js and React | Web application and interactive UI | Selected by product owner; retain existing App Router structure |
| TypeScript | Application types | Retain the existing project language |
| Supabase | Hosted development backend | PostgreSQL for records, Auth for identity, and Storage for lesson PDFs |
| Tailwind CSS | Styling | Selected by product owner |
| ESLint and Prettier | Code checks and formatting | Selected by product owner |
| Vitest | Unit and integration tests | Selected by product owner |
| Playwright | Browser acceptance tests | Selected by product owner |
| npm | Package installation and scripts | Selected by product owner |

Current manifest baseline: Next.js `16.4.2`, React/React DOM `19.3.0`, TypeScript `^5`, Tailwind CSS `^4`, and ESLint `^9`. Supabase client packages, Prettier, Vitest, and Playwright are selected but not yet declared in `package.json`. These are repository observations, not claims that these versions are latest or integration-tested.

Dependency policy: retain the npm lockfile, use `npm ci` for reproducible installs, and select compatible exact versions for newly added packages. Agree Node.js/npm versions during tooling setup. Read the installed Next.js guides in `node_modules/next/dist/docs/` before implementation; do not infer APIs from older versions.

## 3. Development environment

- Next.js runs locally and connects to a hosted Supabase development project. No production deployment or hosting provider is selected.
- Keep environment secrets out of Git and browser bundles; document variable names with placeholders. Privileged Supabase and AI credentials remain server-side.
- Use synthetic development records, version-controlled migrations, and repeatable seed data. Integration tests must isolate their records and never reset a shared hosted database.
- The linked plan includes a pending task to install and configure the approved local development tools. Project provisioning, database changes, product features, and production operations remain outside that task; adding the task does not execute it.
- Agent tooling: the approved plan also includes the official `supabase` and `supabase-postgres-best-practices` skills as repository-local instructions, tracked in `skills-lock.json`. These are development guidance, not runtime dependencies; the Supabase plugin is managed separately.

## 4. Required technical guarantees

These requirements follow the PRD; the implementation mechanisms remain subject to architecture design and verification.

| Area | Required guarantee | PRD references |
|---|---|---|
| Identity and access | Preserve unique emails/student numbers across account states; store student numbers as text. Enforce approval, active state, fixed role, and current ownership on protected operations. Preserve last-Administrator and ownership-transfer safeguards. | PERM-01–05; ACC-01–20; P-08 |
| Recovery and sessions | Reset links expire after 30 minutes, work once, and supersede earlier links. End sessions at the points required for reset, assisted recovery, role changes, and deactivation; stale credentials must not retain revoked access. | ACC-11, ACC-13–19 |
| Content and files | Keep approved revisions and their resources available to entitled existing learners. Reject outdated approvals and invalid submissions without losing drafts. Validate uploads and links at the server boundary. | CONTENT-01–08; PATH-01–03; ASSESS-05; P-02–03 |
| Learning writes | Concurrent/repeated starts and submissions cannot duplicate participation, grading, or badges. Permit at most one unfinished attempt per quiz/shared assessment; keep submitted attempts immutable. Grade on the server using exact PRD scoring. | DISC-03; QUIZ-01–08; REWARD-01 |
| Progress and roadmaps | Preserve prior passes/completions, one badge per student/course, and at most one active accepted roadmap. Replacement requires explicit acceptance. Display 100% only at actual completion. | PROGRESS-01–03; REWARD-01–02; ROAD-01–08; P-04–05 |
| AI | Validate suggestions against eligible catalog records; protect automatic context and keep AI unable to perform privileged actions. Enforce 20 successful logical requests per student per Philippine day, including concurrent requests; failed requests consume none. Retrieve accessible saved success before new-generation gates, without charging twice. | REC-01–04; AI-01–06; diagram shared saved-outcome rules |
| Privacy and retention | Enforce private chat ownership and exclude deleted/expired conversations from history and context at the 90-day boundary. Preserve learning records independently. Aggregate reports use PRD calculations and the five-student minimum for protected statistics. | AI-07; DATA-01; REPORT-01–03; P-07 |
| Notifications and history | Keep decisions committed when email fails; retry delivery without repeating decisions. Show permitted delivery failures and record required administrative events without private learning content. | NOTICE-01–02; REPORT-03; P-01 |
| Accessibility and validation | Support keyboard use, labels, clear field errors, and status meaning without color alone. Enforce PRD field rules server-side and preserve entered values after validation failures. | P-02–06 |

Supabase safeguards: enable row-level security on exposed tables with policies matching the actual permissions, and protect file access as well as database access. Do not trust user-editable metadata for authorization. Detailed policies belong in architecture. See [Supabase RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security).

Integration checks are mandatory: Supabase sessions use access tokens whose validity can outlast sign-out, so default sign-out behavior alone must not be assumed to satisfy immediate revocation. Verify the PRD flows, including old reset-link invalidation, before accepting the integration. See [Supabase sessions](https://supabase.com/docs/guides/auth/sessions).

## 5. Verification baseline

- Vitest unit tests: exact quiz scoring, irreversible passage, progress display boundaries, diagnostic scoring, time estimates, and report calculations.
- Vitest integration tests: real database permissions and constraints, revision preservation, simultaneous/retried writes, session revocation, AI allowance accounting, retention boundaries, and independent email retries. Mock external AI/email responses for repeatable failure cases; mocks do not prove provider integration.
- Playwright: role-specific registration/review/recovery, authoring/publication, course completion, roadmap acceptance, AI-unavailable learning, and keyboard/error flows. Map checks to PRD AC-01–38; verify negative access cases as well as happy paths.
- Tooling setup must provide npm commands for lint, formatting checks, type checking, unit/integration tests, browser tests, and build. Test credentials/data remain isolated from ordinary development use.

## 6. Decisions still open

The compact baseline deliberately does not invent these values. Resolve each in this TRD, with product-owner review where the PRD delegates policy, before implementing the affected feature.

| Decision | Needed before |
|---|---|
| Password-strength rules; verification and invitation expiry; resend/abuse limits | Account implementation; preserve the already approved 30-minute reset rule |
| PDF size limits and safety checks; supported text formatting; field/message length limits | Resource authoring and input handling |
| Initial school-designated Administrator bootstrap procedure; session/recovery enforcement design | Authentication architecture and account implementation |
| AI provider/model, execution environment, catalog ranking method, context limits, and timeouts | AI implementation; free-service preference, no automatic paid fallback, and core-learning independence remain fixed |
| Email provider/sender and development delivery setup for Auth and application notices | End-to-end account and notification testing; Supabase's default mail service has recipient restrictions—see [SMTP guidance](https://supabase.com/docs/guides/auth/auth-smtp) |
| Exact Node.js/npm and new package versions; supported browsers; test-data isolation procedure | Tooling setup |
| Physical chat cleanup and backup handling, separate from immediate history/context exclusion | Persistence design; do not introduce expiry of retained learning records |
| Measurable performance targets and expected data/concurrency volumes | Performance validation; the PRD has not set targets |

Production hosting, deployment pipelines, and production backup/recovery operations are deferred until deployment is planned. External AI roadmaps remain deferred under ROAD-09 and must be revisited at final product scope review. No extra ORM, vector database, queue service, or AI framework is selected by this baseline.
