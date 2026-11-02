# CS-GAMUERS technical requirements

Status: baseline approved on 2026-10-27; tooling completed on 2026-10-28. The product owner approved the architecture design and revised defaults on 2026-11-01. The owner approved the written architecture and its referenced technical choices on 2026-11-02. The owner separately authorized committing the aligned documentation on 2026-11-02. Section 6 records selected defaults; section 7 distinguishes implementation checks from deferred production work. Product code, provisioning, and deployment are not authorized by this documentation task. See the [architecture handoff plan](docs/superpowers/plans/2026-11-01-cs-gamuers-architecture-handoff-plan.md); the [earlier tooling plan](docs/superpowers/plans/2026-10-27-cs-gamuers-technical-baseline-handoff-plan.md) is historical evidence.

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
| shadcn/ui | Locally owned shared UI components, styled with the approved design tokens | Selected and installation authorized by the product owner on 2026-11-02; Radix-based `new-york` registry foundation |
| Lucide React | Outlined UI icons | Implements the approved design-system icon family |
| ESLint and Prettier | Code checks and formatting | Selected by product owner |
| Vitest | Unit and integration tests | Selected by product owner |
| Playwright | Browser acceptance tests | Selected by product owner |
| npm | Package installation and scripts | Selected by product owner |

Installed tooling baseline (2026-10-28): Node.js `24.22.1`, npm `11.19.1`, Next.js `16.4.2`, React/React DOM `19.3.0`, TypeScript `5.9.3`, Tailwind CSS/loader `4.3.3`, ESLint `9.39.5`, Prettier `3.9.10`, Vitest `5.0.5`, Playwright `1.64.1`, Supabase JS `2.118.0`, and Supabase SSR `0.12.7`. `package.json` declares exact versions for new packages; `package-lock.json` records the full dependency tree. Node types use `24.19.2` to match the selected runtime and Vitest peer requirements. These versions describe this installation, not a policy to track latest releases. ESLint 9's npm deprecation notice is retained as a follow-up; the approved existing major was not upgraded incidentally.

Dependency policy: retain the npm lockfile, use `npm ci` for reproducible installs, and select compatible exact versions for newly added packages. Use `.nvmrc`, `packageManager`, and the package engine ranges for the selected Node.js/npm versions. Read the installed Next.js guides in `node_modules/next/dist/docs/` before implementation; do not infer APIs from older versions.

## 3. Development environment

- Next.js runs on the owner's MacBook and connects to hosted Supabase. Seven demonstration users (one Administrator, three Students, two Faculty, one Program Head) access it from separate devices on one local network with internet available. Caddy supplies local HTTPS; no public hosting or production deployment is selected.
- Keep environment secrets out of Git and browser bundles; document variable names with placeholders. Privileged Supabase and AI credentials remain server-side.
- Use synthetic development records, version-controlled migrations, and repeatable seed data. Integration tests must isolate their records and never reset a shared hosted database.
- The earlier tooling plan tracks completed local-tool installation. The architecture handoff defines future feature mechanisms only; it does not execute provisioning, database changes, product features, or production operations.
- Agent tooling: the approved plan also includes the official `supabase` and `supabase-postgres-best-practices` skills as repository-local instructions, tracked in `skills-lock.json`. These are development guidance, not runtime dependencies; the Supabase plugin is managed separately.

## 4. Required technical guarantees

These requirements follow the PRD; the implementation mechanisms remain subject to architecture design and verification.

| Area | Required guarantee | PRD references |
|---|---|---|
| Identity and access | Preserve unique emails/student numbers across account states; store student numbers as text. Enforce approval, active state, fixed role, and current ownership on protected operations. Limit role changes to transitions among Faculty, Program Head, and Administrator; prohibit Student/staff conversion in either direction. Preserve last-Administrator and ownership-transfer safeguards. | PERM-01–05; ACC-01–20; P-08 |
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

## 6. Selected technical defaults

The owner approved free-only services, Groq Free, a dedicated Gmail SMTP sender, minimum 12-character passwords, basic Markdown, 10 MB PDFs, 2,000-character chat messages, and 30-second generation timeouts. Final design approval replaced the earlier one-hour verification/invitation proposal with **30 minutes for all Auth email links**, and included Caddy/local certificate trust and ClamAV scanning. These choices supersede earlier conversation proposals.

The additional bounds and operational timings below are engineering defaults included in the written architecture approved on 2026-11-02. They are not measured performance or verified provider behavior. Preserve existing PRD numeric rules; reject excess input clearly rather than silently truncating user submissions.

### 6.1 Accounts and abuse controls

| Item | Selected value/behavior |
|---|---|
| Password | At least 12 Unicode code points, at most 72 UTF-8 bytes; allow spaces/passphrases, no mandatory character classes; never trim or silently truncate. Supabase stores hashes. Validate the provider byte limit during integration. |
| Auth email expiry | 1,800 seconds for signup verification, invitations, and password resets; a link is invalid at its expiry instant. Assisted replacement-email proof also lasts 30 minutes. |
| Resend | At least 60 seconds between issued messages for the same address/purpose; at most 5 in a rolling hour. Recovery acknowledgment stays generic. |
| Sign-in throttling | At most 10 failed attempts per normalized account identifier per rolling 15 minutes; temporary throttling, not permanent lockout. |
| Shared network limit | At most 100 authentication submissions per source IP per rolling 15 minutes, in addition to per-account limits; all seven users can share one IP. Trust forwarding headers only from the local proxy. |
| Provider limits | Retain native Auth limits; configure suitable free-plan limits during setup and verify direct Auth calls cannot bypass essential validation. App counters are database-backed, not process memory. |
| Initial Administrator | Controlled invitation bootstrap; no public endpoint, preset password, or automatic email verification. ARCHITECTURE section 4 defines safeguards and interruption handling. |
| Revocation/recovery | Database account/session guard and restricted recovery operations; mandatory tests of native tokens, direct API access, and Auth trigger behavior. ARCHITECTURE sections 4–5 own the mechanism. |

### 6.2 Input and resource limits

Character limits count Unicode code points, except email/URL and password byte limits where noted. Store validated content without loss. Required/optional fields and accepted values remain those in the PRD.

| Input | Bound |
|---|---|
| Name, course/path/lesson/quiz/resource title | 200 characters |
| Student/employee number | 50 characters; Student number remains text |
| Email / external URL | 254 / 2,048 characters; validate email shape/domain or HTTP/HTTPS URL respectively |
| Description, reason, quiz question, answer explanation, free-text roadmap goal | 2,000 characters each |
| Answer choice, outcome, skill | 500 characters each |
| Written lesson resource | 20,000 characters |
| Ordinary JSON/form request | 1 MiB serialized body; file uploads use a separate bounded route |
| PDF | 10 MB = 10,000,000 bytes per file; private immutable storage, successful parse and ClamAV scan required |
| PDF scan | 60-second deadline; reject encrypted/uninspectable PDFs, threat detection, errors, skipped scans, and scan-limit exceedance; signatures no older than 24 hours |
| Written formatting | Headings, paragraphs, lists, emphasis, links, inline/fenced code; no raw HTML, scripts, embedded frames, or arbitrary images |
| Links | HTTP/HTTPS with a hostname, no embedded credentials; no server-side preview fetching |

Additional collection limits should follow the request-size bound and PRD structural rules rather than arbitrary course-count caps. Choose a maintained PDF parser and Markdown renderer in the affected feature plan, pin versions, and test malicious/malformed input; do not implement ad hoc regex parsers. The application never claims antivirus scanning proves a PDF harmless.

### 6.3 AI and catalog selection

| Item | Default |
|---|---|
| Provider | Groq Free, no payment enrollment or paid fallback |
| Model | `openai/gpt-oss-20b`, selected from the documented free-model/strict-output support lists; verify account availability and learning-response quality before acceptance |
| Integration | Server HTTP call with native `fetch`; structured response validation; no model tools, agent framework, vector database, or automatic PDF ingestion |
| User chat message | Maximum 2,000 characters |
| Prompt/context budget | Maximum 6,000 UTF-8 bytes across prompt/context text, plus a bounded response schema; include at most the last four accessible conversation messages within that budget |
| Output | Maximum 1,024 completion tokens; incomplete/refused/schema-invalid output fails without charging |
| Context selection | Keep safety instructions/current request first, then required profile/goal context and compact eligible catalog, then optional history/lesson excerpts. Never truncate the current message; if mandatory content exceeds the budget, return a specific size/context error without charging. This is not catalog unavailability. |
| Candidate set | Model prompt shortlist: at most 10 courses and 5 career paths; final recommendations retain PRD maxima of 5 courses and 3 paths. The server preserves a selected career path's full eligible course list independently of this shortlist, using factual path-based explanations for remaining items. No ten-course product limit is introduced. |
| Chat prerequisites | Server-selected output types/context enforce profile prerequisites for recommendations/roadmaps inside chat too; ordinary explanations remain available without a complete profile. Reject unauthorized personalized payloads; profile-required outcomes consume no allowance. |
| Timing/concurrency | Abort provider call after 30 seconds; 45-second database reservation lease, capped at next Philippine midnight; one live generation per Student |
| Usage | 20 successful logical requests per Student per Philippine day; saved-success replay before new-generation gates; failed generation costs none |
| Ranking | Use goal match, interest overlap, experience/diagnostic adjustment, and a final stable-ID tie-breaker under ARCHITECTURE section 9. Exact matching, scoring, and adjustment precedence must be specified in the guidance feature spec before implementation. |

Groq imposes account-wide request/token limits independent of the application allowance. Twenty requests is a per-student ceiling, not a promise that free-provider capacity will always supply twenty responses. Do not silently change the model; record any required replacement in the technical documents after evaluating compatibility. Account-specific limits and provider data-handling settings must be checked at setup. [Groq rate limits](https://console.groq.com/docs/rate-limits), [structured outputs](https://console.groq.com/docs/structured-outputs), [data handling](https://console.groq.com/docs/your-data).

### 6.4 Email, maintenance, retention, and display

| Item | Default |
|---|---|
| Email | Dedicated project Gmail address; SMTP over TLS with an app password. A Supabase Postgres Send Email Hook queues opaque application links for the local mail worker; native recovery verifiers/session tokens never reach browsers. Configure the same sender for any native security notices outside the hook. Actual free-hook, account/app-password, and school-inbox delivery checks are required. |
| Maintenance | One local command processes due work every 60 seconds while running; restart performs a catch-up pass. Durable records live in PostgreSQL; no external queue service. |
| Application notice retry | Initial attempt then retries after 1, 5, 15, and 60 minutes; afterward mark failed for permitted support retry of delivery only. SMTP may duplicate a notice after uncertain delivery; never duplicate the decision. |
| Chat | Inaccessible immediately at deletion or at 90 days since last message; remove payloads on next maintenance pass. Mac downtime delays physical removal, not exclusion. |
| Other unaccepted AI outcomes | Standalone recommendations/proposals expire after 90 days from creation; chat-linked outcomes follow their conversation's earlier deletion/expiry. Accepted roadmaps and learning records are copied independently and do not expire. |
| Accounting metadata | Keep logical ID, input fingerprint, status/date and charge metadata without expired/deleted prompt/response payloads; no reuse of an expired success ID to regenerate content. |
| Logs/backups | No tokens, passwords, quiz answer keys, chat text, or full provider payloads in application logs/developer backups. Provider-managed retention is external; future restoration must reapply deletions/expiry before access. |
| Upload cleanup | Delete abandoned temporary/unreferenced upload objects after 24 hours; never delete resources referenced by retained content revisions. |
| Progress display | Whole percent rounded down while incomplete, capped at 99; 100 only at actual completion. Keep exact quiz passage separate. |

[Gmail app passwords](https://support.google.com/mail/answer/185833) require two-step verification and are unavailable for some accounts. Gmail's sending limits are not an uptime/delivery guarantee. No dedicated domain or paid mail plan is required by this design; if the selected account cannot send reliably, resolve the provider choice before acceptance rather than bypassing email verification.

### 6.5 Browser, test, and performance scope

- Target the latest two stable releases of Android Chrome, iPhone Safari, and desktop Chrome, Edge, Firefox, and Safari at implementation time. This is browser access, not a claim to support every historical phone. Core flows must work at 320 CSS pixels wide and with keyboard navigation.
- Keep Chromium smoke coverage; add Playwright Firefox/WebKit checks as features arrive. Actual Android/iPhone rehearsal is required because desktop emulation is insufficient.
- Use a separate free Supabase test project for integration/global-invariant tests where the account's free allocation permits it. Never reset the ordinary development project. Unique per-run IDs isolate ordinary tests; singleton/bootstrap tests run serially in that dedicated project. If a dedicated project is unavailable, stop global tests until an isolated free test environment is arranged; do not target shared records.
- Engineering rehearsal dataset: 20 published courses with up to 10 lessons and 10 questions per quiz, two revisions for revision tests, seven simultaneous demonstration users. Add at least five synthetic Students for aggregate tests separately from the three real Student demonstrators.
- Target non-AI reads/writes completing within 2 seconds at the 95th percentile over at least 100 operations during a seven-user rehearsal on the actual network. Exclude uploads, mail delivery, and AI from that latency target; they have explicit pending/failure indicators and timeouts. This is a validation target, not measured performance or a new product SLA.

## 7. Implementation gates and deferred work

The former section 6 design decisions now have defaults above and mechanisms in [ARCHITECTURE.md](ARCHITECTURE.md). Remaining checks are implementation evidence: real Gmail receipt, Groq access/quality, native Auth expiry/reissue and trigger compatibility, immediate revocation, local certificate trust, scanner readiness, isolated integration tests, mobile behavior, and measured latency. Do not mark these passed based on documentation or mocks.

The selected architecture must be revised explicitly if a provider cannot satisfy a PRD guarantee. Production hosting, deployment pipelines, and production backup/recovery remain deferred until deployment is planned. External AI roadmaps remain deferred under ROAD-09; this architecture approval does not enable them. Detailed visual design remains separate. No runtime dependency or host tool was installed by this documentation task.

### Shared UI installation evidence (2026-11-02)

The owner separately authorized the component setup: shadcn CLI `4.23.0` (development tooling), Radix UI `1.8.1`, Lucide React `1.66.0`, class-variance-authority `0.7.1`, cn `0.5.1`, and tw-animate-css `1.4.0`, all exactly pinned. Button, Card, Input, Textarea, Badge, and Dialog are locally owned source components. This setup does not implement product workflows or provision services.

The runtime-only npm audit reported zero advisories. The full installation reported 22 development-tooling advisories (2 low, 20 moderate), including shadcn tooling and the ESLint dependency chain. No forced dependency downgrades were applied. Real-screen accessibility and Inter font loading remain implementation work.
