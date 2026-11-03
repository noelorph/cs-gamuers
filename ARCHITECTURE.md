# CS-GAMUERS architecture

Status: design direction approved on 2026-11-01; the product owner approved the written architecture on 2026-11-02 after the folder-structure refinements and clarification of Groq Free with `openai/gpt-oss-20b`. **Approved; the owner separately authorized committing the documentation on 2026-11-02.** Product features, providers, and security controls have not been implemented or verified by this documentation task.

## 1. Purpose, authority, and scope

Build the supplemental-learning product in [PRD.md](PRD.md) with the baseline and limits in [TRD.md](TRD.md). The first delivery is a school demonstration: one Administrator, three Students, two Faculty, and one Program Head on separate phones/computers sharing a local network. The owner's MacBook hosts the application; internet is available. All services must remain free. Public deployment is outside scope.

Read `AGENTS.md`, relevant PRD rules, TRD guarantees/limits, this architecture, then the applicable feature spec/plan. PRD owns behavior; TRD owns technical requirements; this document owns structure and enforcement. Historical plans record their own work, not current implementation authority. Product diagrams remain actor/system views. The original DOCX is historical input subordinate to the PRD's explicit scope changes.

Preserve approval, privacy, revisions, and reliable outcomes even at seven users. Offline operation, public hosting, school-system integration, external AI roadmaps, emergency Administrator recovery, and permanent account deletion remain excluded/deferred. No native mobile app, vector database, AI framework, separate backend service, Redis, ORM, or external queue service is needed.

| Approach | Decision |
|---|---|
| One Next.js application with hosted Supabase | Selected: one application server/codebase; managed Auth, PostgreSQL, and private storage |
| Next.js plus an independently deployed backend | Rejected: another server/API boundary without a demonstrated need |
| Vector search and an agent framework | Explicitly omitted after owner discussion: current guidance needs catalog queries and bounded model calls, not semantic search across all PDFs or autonomous tools |

Table organization, retry timing, ranking tie-breakers, and test volumes are engineering defaults included in the approved written design, not new product requirements. Numeric defaults live in TRD section 6. Future feature plans choose exact filenames/signatures while preserving these boundaries.

## 2. Runtime and code organization

| Component | Responsibility |
|---|---|
| Browser | Responsive pages, forms, answer autosave and save/error indicators; calls Next.js on the same origin |
| Caddy on MacBook | Local HTTPS termination; proxies to Next.js on loopback |
| Next.js Node server | Rendering, authorization/validation, safe data responses, provider calls, authorized PDF streaming |
| Hosted Supabase Auth | Password hashing, email proof, tokens, native recovery/invitation primitives |
| Hosted Supabase PostgreSQL | Account/access state, content, learning, AI accounting, notifications and audit records |
| Hosted Supabase Storage | Private immutable PDF objects referenced by revisions |
| Groq Free | Bounded generation using permitted context; no tools or privileged credentials |
| Dedicated project Gmail SMTP | Auth mail and application notices; two-step verification and app-password eligibility required |
| MacBook maintenance command | Periodic notice retries, interrupted account-operation reconciliation, expired AI reservations and chat cleanup |
| ClamAV on MacBook | Scan candidate PDFs before they become usable resources |

Retain App Router. **`src/app/` defines routes and composes screens; it delegates business operations to feature modules.** Pages call feature functions for data and assemble UI; layouts provide shared page structure; loading, error, and not-found files handle route-level states. Client Components handle interaction. Route Handlers and route-local Server Actions remain thin entry points: validate request shape, invoke the appropriate feature operation, and return its result. Do not put business rules, direct database queries, or provider integrations in route files.

Server-only feature functions belong under `src/features/{accounts,content,learning,guidance,reports}/`; connection creation and shared access helpers under `src/lib/`. Server Actions handle ordinary forms; Route Handlers handle auth callbacks, autosave, AI, and file transfers. Both call the same feature functions, which enforce authorization and business validation before invoking database operations or providers. Database constraints and transaction functions remain authoritative for persisted invariants. Do not introduce HTTP endpoints just for Server Components to call themselves.

Keep shared configuration under `src/config/`:

| File | Responsibility |
|---|---|
| `src/config/env.ts` | Read and validate environment variables and export typed configuration so consumers do not hardcode environment-specific values or read `process.env` throughout the application. Keep this module server-only; never import it into Client Components or expose secrets. Validate configuration when its consuming service initializes so missing optional AI/email configuration does not disable core learning. |
| `src/config/paths.ts` | Export named relative page paths and small path builders for dynamic routes, used by navigation, links, and redirects instead of repeated route strings. Keep it safe for server and client imports, with no environment or secret dependencies. Paths must match `src/app/`; they do not create routes or grant access. |

Keep actual environment values in local/deployment environment configuration, not in `env.ts`. Use `APP_ORIGIN` from the server environment configuration with relative paths when constructing absolute email links. Redirect targets still require the allowlist checks below.

Future migrations/seeds belong under `supabase/`, operational commands under `scripts/`, and tests in the existing unit/integration/e2e directories. Add files when implementing their feature, not as empty scaffolding.

### Overall folder structure

This is the target layout, combining existing files with planned feature locations. It does not mean every directory already exists. Create each part only when its implementation needs it; individual pages and filenames are defined in the relevant feature plan.

```text
cs-gamuers/
├── src/
│   ├── app/                         # Routing, page composition, thin request entry points
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Landing page
│   │   ├── not-found.tsx           # Shared not-found page for unavailable routes/resources
│   │   ├── auth/                   # Sign-in, registration, verification, recovery
│   │   ├── student/                # Catalog, learning, assessment, roadmap, chat
│   │   ├── faculty/                # Applications, owned content, course results
│   │   ├── program-head/           # Content review, ownership, aggregate reports
│   │   ├── admin/                  # Account support, invitations, activity history
│   │   └── api/                    # Autosave, AI, and authorized file handlers
│   ├── components/                 # UI components shared across features
│   ├── config/
│   │   ├── env.ts                  # Validated server-only environment configuration
│   │   └── paths.ts                # Shared page paths and dynamic path builders
│   ├── features/                   # Server-only application operations by feature
│   │   ├── accounts/               # Applications, invitations, recovery, access changes
│   │   ├── content/                # Drafts, revisions, publication, resources
│   │   ├── learning/               # Participation, attempts, grading, progress, badges
│   │   ├── guidance/               # Catalog matching, AI requests, chat, roadmaps
│   │   └── reports/                # Authorized aggregate and activity queries
│   ├── lib/                        # Shared access checks and service connections
│   └── styles/
│       └── globals.css             # Global styles, shared design tokens, and Tailwind imports
├── public/                         # Public static assets only; no private lesson PDFs
├── supabase/
│   ├── migrations/                 # Versioned schema, policies, functions, hooks
│   └── seed.sql                    # Repeatable synthetic development data
├── scripts/                        # Administrator bootstrap and maintenance commands
├── tests/
│   ├── unit/                       # Deterministic rules and component tests
│   ├── integration/                # Real database permissions and transaction tests
│   └── e2e/                        # Playwright user flows
├── docs/
│   ├── agents/                     # Agent workflow and domain guidance
│   ├── diagrams/                   # Product diagrams, previews, traceability
│   ├── project-documents/          # Historical reference material
│   └── superpowers/
│       ├── specs/                  # Feature specs and canonical-document indexes
│       └── plans/                  # Scoped implementation tasks and evidence
├── .agents/skills/                 # Repository-local agent skills
├── .env.example                    # Variable names/placeholders only (planned)
├── .env.local                      # Local values/secrets; ignored by Git (when created)
├── Caddyfile                       # Local HTTPS proxy configuration (planned)
├── AGENTS.md                       # Agent instructions and document authority
├── PRD.md                          # Product behavior
├── TRD.md                          # Technical requirements and limits
├── ARCHITECTURE.md                 # Implementation structure and boundaries
├── DESIGN_SYSTEM.md                # Visual-design document
├── README.md                       # Setup and project entry point
├── package.json
├── package-lock.json
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── vitest.config.mts
└── playwright.config.ts
```

Keep page-specific UI beside its route; move components into `src/components/` only when shared. Route folders organize screens, not authorization: every protected operation still uses the access checks below. Feature modules contain application rules; `src/lib/` contains only genuinely shared helpers and connections. Database invariants remain in migrations. Generated output, installed dependencies, and optional future documentation folders are omitted from the tree.

Use `src/styles/globals.css` as the single global stylesheet imported by `src/app/layout.tsx`. It contains Tailwind imports, application-wide styles, and shared design tokens such as semantic colors, typography, spacing, and radii, following `DESIGN_SYSTEM.md`. Do not create a separate token stylesheet or duplicate these values across stylesheets. Component-specific styles stay with their component. The owner-authorized shadcn/ui setup moves the former `src/app/globals.css` here and updates the root-layout import. Preserve the existing decision to omit Tailwind Preflight unless separately changed.

The owner selected and authorized shadcn/ui setup on 2026-11-02. Shared source components live in `src/components/ui/`, with CLI configuration in `components.json` and the shared class-merging helper in `src/lib/utils.ts`. Use the Radix-based `new-york` registry foundation and adapt its source to the approved design system. UI primitives do not own authorization or business operations. This setup authorization does not enable the product features or provider provisioning described elsewhere in this document.

Normal database access uses a request-scoped Supabase server client carrying the user's session. No browser Supabase client or Realtime subscription is needed. Refresh cookies on the server with Secure, HttpOnly, SameSite=Lax settings; client interactions call Next.js rather than reading tokens. Verify this server-only pattern against the installed SSR package. Never share an authenticated client across requests/users.

Privileged credentials are limited to Auth administration, controlled storage operations, and maintenance. Their paths explicitly check authorization; service credentials bypass RLS and cannot become the general database client. Protected responses/files use `Cache-Control: private, no-store`; no cross-user cache. Validate mutation origins and allowlist redirect destinations.

## 3. Local HTTPS and provisioning

Use the existing build command and run the built Node server on `127.0.0.1`. Caddy serves a stable LAN HTTPS address with its local CA. Participating devices must trust its public root certificate; never copy its private key or bypass certificate warnings. Expose only the HTTPS listener through the Mac firewall, with no router port forwarding or public tunnel.

Set `APP_ORIGIN` and Supabase Site URL/redirect allowlist to the exact LAN HTTPS address. Email links must not use `localhost`; recipients open them on the demonstration network. Prefer a reserved LAN IP; address changes require matching certificate/redirect changes. Test Wi-Fi client isolation. Keep the Mac awake and the application, Caddy, and maintenance command running.

Supabase/Groq/Gmail remain external services even though the application is local. Supabase outage interrupts authenticated learning; AI outage alone must not. Email failure cannot roll back a saved decision.

Future environment examples contain placeholders for `APP_ORIGIN`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `GROQ_API_KEY`, `GROQ_MODEL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, and scanner settings. No privileged value uses `NEXT_PUBLIC_` or appears in source, logs, seeds, terminal output, or responses.

Provisioning verifies free plans, Gmail app-password eligibility, school-inbox receipt, Groq model access, and rehearsal capacity. No billing enrollment or paid fallback is authorized. Authentication mail uses the Postgres Send Email Hook described below and the local Gmail worker; ordinary Supabase SMTP is configured for any supported security notifications outside that hook. The default restricted sender is not a fallback.

## 4. Accounts, authentication, and recovery

### Account identity and onboarding

An application account references `auth.users.id` one-to-one and owns canonical identity, role, application status, activation state, and session-revocation cutoff. Auth metadata is never authorization. Student numbers are text with leading zeros preserved. Normalize email for case-insensitive uniqueness and enforce the exact Student domain. Uniqueness covers pending/rejected/deactivated accounts. Reserve invitation/replacement emails during operations; a completed replacement releases the previous current address while retaining audit history.

| Role | Creation and access |
|---|---|
| Student | Name, number, school email, password; email proof, then Pending; Faculty or Administrator reviews external enrollment evidence |
| Faculty | Name, reachable email, password, optional employee number; email proof, then Pending; Administrator performs PRD identity/authorization checks |
| Program Head | Administrator invitation bound to email/role; verified recipient supplies name/password and accepts |
| Administrator | Same invitation flow after initial bootstrap; no public privileged-role selection |

Create the pending application atomically with the Auth user through a narrow deferred Auth-user creation trigger that reads the final row at transaction commit. The supported Auth admin API writes protected metadata after its initial insert. Validate required identity fields there and in Next.js. For the authentication/course-drafts milestone, native public creation is closed: a controlled server operation validates the holder's password and identity, reserves the complete identity/email/role, and uses supported Auth creation with a protected `account_reservation_id` marker. Native invitation creation may instead match an exact private invitation reservation using provider-controlled invitation state and an initially empty password. Elevated creation always requires an invitation reservation. Synthetic reservations require protected demo/test configuration; email ownership proof remains mandatory for demonstration accounts. This stronger gate is necessary because native Auth's minimum-password setting counts UTF-8 bytes rather than the required Unicode code points. A future public registration flow may request Student/Faculty only and must use the same validated server boundary. User-editable metadata cannot select approval or override the reservation. Trigger failure rolls back creation; an uncertain creation retry resolves the existing reservation/account. Triggers have fixed search paths and no general client execute grants.

Bootstrap is an operator command, not a web endpoint. Under a database lock reserve one invitation only when no Administrator exists. Invite the school-designated email normally; no shared password or silent email verification. Interrupted/expired bootstrap resumes/reissues that invitation. Once accepted, additional Administrators use the ordinary invitation flow.

All roles share email/password sign-in. Pending/Needs correction/Rejected accounts have only PRD application access. Deactivated accounts have no authenticated application access. Email verification never grants manual approval. One Administrator cannot perform their own assisted recovery; normal email reset remains possible, and a second Administrator must be legitimately appointed for assisted recovery. No emergency backdoor.

### Immediate revocation and state changes

One database access predicate checks authenticated identity, existence of the JWT's session in `auth.sessions`, and session creation after the account's revocation cutoff. Ordinary application access additionally requires a password-authenticated session, using signed Auth authentication-method claims and its session identity, not a client-provided session type. Recovery/invitation/email-proof sessions cannot access learning or staff records. Apply approval/activation/role predicates for the operation. Application-status and recovery operations use narrower gates. The helper exposes a decision, not Auth table contents.

Deactivation/role change advances the cutoff in the same transaction as the decision. Reactivation advances it again and requires fresh sign-in. A refreshed token retains its old session identity and cannot bypass the cutoff. Password change advances it too. This terminates application access even before the native access token expires; native sign-out is supplemental.

Apply the predicate to RLS, transaction/report functions, and PDF access, not only Next.js. Sensitive writes lock actor/target account rows while checking and committing, so they commit before revocation or fail after it. AI/uploads recheck access before committing/returning their results. Previously displayed content/downloaded files cannot be recalled.

Serialize Administrator removal decisions with a transaction advisory lock, then lock accounts consistently. Role changes require both the current and destination roles to be Faculty, Program Head, or Administrator; reject conversion between Student and staff in either direction. Refuse self-removal or removal of the last approved active Administrator. Content creation/transfer and Faculty removal lock owner accounts so new ownership cannot race removal. Transfer all courses/paths/assessment before removing Faculty access. Commit required audit events and notice work with the decision.

### Verification and recovery

Set Supabase Email OTP Expiration to 1,800 seconds for verification, invitations, and resets. Use its free-plan **Postgres Send Email Hook** to enqueue Auth mail without an inbound HTTP callback to the Mac. Under the account lock the hook records the current operation/generation, native verifier, original expiry, and a cryptographically random 256-bit opaque application challenge. The email contains only that opaque application link, never a native OTP, verifier, or Auth session token. Only Auth may execute this hook; it enforces address/purpose throttles even for direct Auth email requests. The Gmail worker delivers due current links and discards superseded/expired messages without extending their validity.

The app stores the challenge hash for verification; delivery-only link material and native verifier/session credentials live in restricted private records, never public outbox metadata. Erase those secrets at consumption/expiry. GET displays confirmation; POST consumes the challenge, avoiding email-scanner consumption. Token pages contain no third-party resources or token logging. Invitation acceptance also checks intended recipient/state. Disable unused email magic-login, anonymous, phone, and OAuth application paths; unsupported hook purposes fail closed rather than emailing a raw native token.

Password reset returns the same acknowledgment for existing/nonexistent accounts. After validating the opaque challenge and current generation, Next.js redeems the native recovery token server-side. Keep any resulting recovery session exclusively in the restricted server operation, never in browser cookies/responses. The browser receives only an opaque reset-operation capability with the original expiry. Recheck it at password submission. New issuance supersedes older operations, including an already-open reset screen; a malicious caller has no native recovery bearer token with which to bypass this check. Normal application cookies are not exchanged for a recovery session.

Serialize reset issuance and password application through account-operation states (`pending`, `verified`, `applying`, `auth_applied`, `complete`, `failed`). Once a valid operation claims `applying`, new issuance returns a retryable outcome until it is resolved. After validating server-held native proof, use the Auth admin update API to send the new password and a unique `password_operation_id` in non-user-editable app metadata **in the same API update**. Preserve unrelated app metadata. The ID is only a correlation marker: the private verified operation, its generation, target and state authorize the write.

Fence that external write using a narrow **deferred constraint trigger** on Auth password changes. At transaction end, read the final Auth row (metadata may be written after the password), lock the account/operation, and require that exact operation ID, target account, password-setting purpose, and generation to remain current and applying. Otherwise raise an error and roll back the Auth transaction. On success advance the cutoff and mark `auth_applied` in that transaction. Direct native user password writes lack a fresh authorized marker and are rejected; invitation/assisted password setup uses the same authorized operation. Initial registration password creation is handled by the creation trigger. No application code stores plaintext passwords or implements hashing.

Native invitation redemption also creates a provider-generated temporary password. After validating the opaque invitation proof, stage the protected marker against a current verified `invitation_password` operation before redeeming the server-held native verifier. The same fence authorizes this temporary write; do not exempt unmarked invitation writes. Complete and clear that operation, then create a separate current verified operation for the holder's chosen password. Both operations retain the original proof expiry; any native invitation session stays server-side and cannot grant application access. The browser receives only the final setup capability. A Send Email Hook running before deferred account creation must lock the private reservation until the canonical account exists; its queue writes must roll back with invalid creation.

Native integration on 2026-11-04 established that `generateLink(type: 'invite')` returns `email_exists` once native invitation redemption has confirmed the address, even if the holder has not completed the separate application password step. For an interrupted or expired **still-pending protected invitation only**, the controlled operator may generate a native recovery verifier for that exact existing account/address. The private proof keeps canonical purpose `invitation` and separately records its server-selected native primitive. The hook still rejects general recovery requests. Redeem the recovery verifier exclusively on the server, verify the returned account/address, then create the verified holder-password operation with the original new challenge expiry and the same chosen-password fence. There is no native temporary-password write for this primitive. Reissuance replaces the generation and invalidates older capabilities; pending status, role, current reservation, and activation are checked again. A lost native recovery-redemption response is not treated as proven success; the operator can issue a fresh bounded invitation challenge. This narrow continuation is not public recovery or an emergency bypass.

If Next.js loses the Auth response, read the operation: `auth_applied` means the change committed, so finish cleanup. If it remains `applying`, maintenance can lock and cancel that exact operation; the trigger serializes against cancellation and rejects any later write carrying its now-cancelled ID, even after another operation starts. Never retry the password in the background; the user submits it again through a fresh operation. The application clears private proof/session credentials and cookies after completion and requires password sign-in, preserving approval/role/activation/records. Test the same-transaction Auth API metadata behavior, deferred-trigger ordering, deadlock retries, late writes, and cancellation against the hosted project before accepting accounts; a timer alone is not proof that an external write stopped. Include native unconfirmed-password clearing and hashing/encryption maintenance in those tests: any narrowly necessary exception must preserve identity and must not permit a caller-selected password without an authorized operation. Do not exempt all unmarked password updates to make integration tests pass.

Assisted recovery follows ACC-15: another authorized Administrator records the in-person check, reserves the replacement email, and sends a single-use 30-minute verification challenge. Store only its cryptographic hash in a private operation record. It proves only that replacement address. After proof, block normal access while applying the Auth email change and canonical identity update. Notify the old address, advance the session cutoff, and invalidate prior reset operations before offering password setup. Partial failure remains a recoverable blocked operation, never a route back to old access. The user chooses the password; existing approval/role/deactivation/learning state remains unchanged.

A narrow deferred Auth email-change trigger checks the final non-user-editable identity-operation marker against the private verified replacement operation, using the same cancellation fence as password writes. This prevents direct Auth API changes from bypassing approved-identity checks or the Student domain. Support pre-approval corrections through their own validated application operation. Test these Auth-schema integration points; otherwise do not modify managed Auth tables or build a parallel password system.

## 5. Authorization and database boundary

Use **RBAC plus resource/state predicates**, not a configurable permission engine. Database account rows are authoritative. A role alone never grants another user's records or another Faculty member's content.

| Data/operation | Access |
|---|---|
| Application identity | Applicant's permitted self-service; Faculty review of Student applications; Administrator support |
| Profile, diagnostic results, roadmap, conversation | Student owner only; assessment authors gain no individual-result access |
| Catalog metadata | Approved active Students; relevant staff content views |
| Drafts, revision resources, answer keys | Current Faculty owner and Program Head oversight; no Administrator content grant |
| Started revision resources | Owning Student participation even after archive; current owner/Program Head content access |
| Individual course results | Student owner and current Faculty course owner |
| Answer feedback | Student's submitted attempt; never unfinished-attempt keys or broad question projections |
| Aggregate reports | Program Head through restricted aggregate functions; no underlying individual-result grant |
| Administrative/delivery history | Administrator metadata only; no private learning payloads or credentials |

Enable RLS on exposed tables and relevant private tables. Deny anonymous application data. Restrict grants/columns, return safe projections, and store answer keys/account-operation secrets in a non-exposed `private` schema. Any read views use security-invoker semantics.

Normal reads use user-scoped queries and RLS. Invariant-bearing writes use transaction functions, not several client writes. Do not grant direct mutation of approval, ownership, published content, submitted results, completion, badges, usage, or audit history. When elevated functions are necessary, keep tightly scoped private security-definer implementations with fixed search paths, explicit actor checks, least-privilege ownership, and revoked default PUBLIC execution. Expose named invoker wrappers only as needed. Negative tests must use ordinary role sessions; privileged success does not prove RLS.

Managed Auth has a narrower ownership exception: two private read-only bridges retain the provider-capable `postgres` owner because hosted Auth does not grant its schema to the dedicated account guard role. The trigger-only bridge returns final identity fields, protected correlation markers, and password presence, never hashes. The session bridge independently validates the signed actor/session/password-method claims, session ownership, creation cutoff, email proof, and expiry, returning only a boolean. Only the `NOLOGIN`, `NOINHERIT`, non-`BYPASSRLS` account guard owner may execute these bridges; client roles have neither execution nor membership. The account guard owner owns only application account records/functions and cannot write managed Auth records. Auth schema RLS and client grants remain unchanged.

## 6. Logical records and invariants

Use relational tables, UUIDs, foreign keys, `timestamptz`, and indexes for foreign keys/policy predicates. JSON suits validated answer drafts and AI response structures, not replacement of relational identity. Do not create a generic entity/workflow framework.

| Record group | Relationships and constraints |
|---|---|
| Accounts/invitations/account operations | One account per Auth user; unique normalized current email and non-null student number; one fixed role; independent approval/activation; unique operation IDs and reserved identifiers |
| Learning profiles | One per Student; shared topics and PRD conditional fields |
| Courses/revisions | Stable course owner/archive state/current published pointer; unique course/revision number; approved content immutable |
| Lessons/resources/quizzes/questions | Revision-scoped; unique positions; one quiz per lesson; four distinct choices; private answer keys/explanations; publication validates required quizzes |
| Assessment/revisions | Singleton assessment and owner; immutable published 15-question form with PRD topic distribution |
| Career paths/revisions | Stable ownership; revision skills and ordered stable course references; publication checks available courses |
| Participations | Unique Student/course; revision belongs to course; completion is monotonic |
| Course/diagnostic attempts | Separate tables; partial unique indexes allow one unfinished attempt per Student/quiz and one unfinished diagnostic per Student across revisions; submitted results immutable |
| Quiz passes/badges | Unique participation/quiz pass and Student/course badge; original completion date/name retained |
| Roadmaps/items | Student-owned proposal/accepted history; unique courses/positions; partial unique index for one active accepted roadmap per Student |
| Conversations/messages | Student owner, last-message time, deletion marker, ordered messages; expiry predicate on access |
| AI requests/daily usage | Unique Student/logical request ID, kind/input fingerprint, generation/status/lease/result reference; daily-row locking for reservation/success |
| Outbox/audit | Unique decision/recipient/event notice key; delivery attempts separate; append-only limited audit metadata |

Foreign keys/composite keys and transaction validation prevent cross-revision attempts and cross-student links. Only unpublished drafts and unreferenced draft objects have ordinary deletion paths. Published revisions, attempts, accepted roadmaps, and learning records do not expire. Resource keys are immutable; no update overwrites a previously approved PDF.

## 7. Content and learning transactions

Mutable drafts have version counters. Submission validates the complete draft and freezes a snapshot. Reviews carry submission ID/version and expected state; reject stale decisions. Returned/rejected drafts may be edited and resubmitted as a new snapshot. Publication switches the current pointer under a stable-content lock and retains older revisions. Apply equivalent rules to career paths and assessment without forcing them into one generic table.

Archive and publication lock the stable course/path. A start first resolves existing participation, then locks the course and selects its eligible current revision. Start/archive/publication therefore have a defined ordering. Existing participation resumes its original revision. Ownership transfer changes current permissions, not revision authorship or learning records.

Create/resume attempts transactionally. Autosave includes the expected attempt version; reject stale updates from another device while preserving unsaved UI edits. Submission includes the final complete answer set and expected version, preventing an in-flight autosave from dropping the last answer.

Submission locks course participation first, then attempt. Validate ownership, revision, and answers; return the saved result for an already-submitted attempt. Grade inside the database function using private keys and exact integer comparison `100 * correct >= threshold * question_count`. Record the submitted result/pass, test every required revision quiz, and create completion/badge atomically. Serializing on participation prevents simultaneous final quizzes from both missing completion. Diagnostic grading instead stores topic scores with no course reward. Retakes create explicit new attempts; failed retakes cannot undo passage/completion.

After uncertain submission, look up that attempt; retry it rather than creating another. Select latest completed diagnostic by submission time and stable ID tie-breaker. Progress uses TRD rounding plus actual completion, never rounded values to decide completion.

Roadmap acceptance locks the Student account, checks proposal ownership/current eligibility and expected current roadmap ID, then replaces the active pointer atomically. Repeated acceptance of the same active plan is harmless; stale replacement confirmation needs a fresh preview. An archived unstarted course prevents new acceptance until a revised proposal is reviewed. Already accepted plans retain unavailable items and original progress semantics. No course starts as a side effect.

## 8. Files and text

Render only the TRD Markdown subset, with raw HTML disabled and ordinary text escaped. Links must be HTTP/HTTPS with hostname and no embedded credentials. Do not server-fetch URLs merely to preview/validate them. Model output never becomes executable markup.

Use a size-limited upload Route Handler rather than a default-size Server Action. Check Faculty ownership, declared type, PDF signature, size, successful parsing, and a bounded ClamAV scan with fresh signatures. Reject malformed/encrypted PDFs that cannot be inspected and all threat/error/skipped/limit-exceeded scans. Filename/MIME checks alone are insufficient; scanning does not guarantee harmlessness. Serve accepted PDFs as downloads with `nosniff`.

Use generated immutable keys in a private bucket. Only successful validation/scanning creates a usable resource. Compensate failed storage/DB linking by removing unreferenced objects; short-lived upload records let maintenance clean interrupted uploads without deleting revision resources. Never replace a submitted/published resource object.

Next.js authorizes every download against current session and resource entitlement, then streams without shared caching. Do not issue public or long-lived signed URLs that outlast revocation. Ordinary direct bucket listing/writes/downloads are denied; the authorized server path alone uses its privileged storage client. Revocation stops future requests, not already delivered bytes.

## 9. AI guidance and accounting

Use Groq through server `fetch`; no AI framework. Model, timeout, context/output limits, and rate limits live in TRD. Request structured output for suggestions/roadmaps and validate schema plus every catalog ID. No model tools, generated-code execution, or automatic URL following. Refused, malformed, or truncated output fails without charging.

### Catalog and context

Ordinary SQL selects published unarchived courses/paths. Ranking uses goal match, interest overlap, experience/difficulty, and latest diagnostic needs, with stable IDs as the final tie-breaker. Exact goal matching, scoring, and adjustment precedence remain deferred to the guidance feature spec, which must define deterministic ordering and verification examples before implementation. These inputs do not yet constitute an executable ranking algorithm. Chosen career paths supply their full approved suggested course order: the server builds that list independently of the model shortlist, preserving every eligible item. The model supplies bounded explanations; courses outside its prompt receive a factual server explanation based on the selected path. A path longer than the shortlist is not an unavailable catalog. Diagnostic topic mapping: programming fundamentals directly; problem-solving to data structures and algorithms; databases directly; computer systems/basic networking to computer systems and networking. Lower topic scores are recommendation signals, not access restrictions.

Exclude completed courses from next-course recommendations; allow relevant completed courses in roadmap candidates. Send a bounded candidate set for explanation/order. Empty or unsuitable catalogs produce an explicit explanation, not an invented complete plan. A selected path with archived courses the Student has not started must expose that gap rather than silently drop them and call the plan complete; already-started/completed archived courses retain their existing entitlement. Revalidate IDs before saving and when reading saved suggestions so archived records never become eligible for new starts.

Context contains only the Student's permitted profile, latest diagnostic summary, roadmap/progress, recent accessible conversation, selected written lesson excerpts, and already-released quiz feedback. No identity, other students, unreleased keys, or automatic PDF ingestion. Show which lesson/context is used and when it is limited. Send typed messages as written with the exact PRD privacy reminder. Course text and messages are untrusted instructions, unable to override server authorization or acceptance.

The server selects allowed output types from profile completeness, regardless of the caller's request-kind label. With an incomplete profile, ordinary concept explanations remain available; omit personalization context/catalog suggestions and require an explanation-or-profile-required response. With a complete profile, chat may return validated catalog suggestions or a roadmap proposal through the same validation/acceptance path as dedicated requests. Reject prohibited personalized output without charging. A server-detected profile-required outcome also consumes no allowance. Prompting alone is not the permission check; validate returned discriminated response types and reject recommendation/proposal payloads when not permitted.

Never truncate the current user message. If the valid message plus mandatory instructions/context cannot fit the input budget, show a specific request-too-large/context-too-large error and consume no allowance; offer a shorter message or narrower lesson context. This is a technical request limit, not evidence that the catalog cannot support the goal. Optional historical context can be omitted with a clear indicator.

### Request lifecycle

1. Receive a logical request UUID/kind. Resolve accessible saved success before profile/quota/provider gates. Verify its input fingerprint; reject reuse with different input. Deleted/expired results are unavailable, not permission to regenerate under the old ID.
2. For new generation, check prerequisites/catalog. Lock the Student daily-usage row and reserve capacity so successes plus live reservations cannot exceed 20. Allow one active generation per Student. Calculate boundaries in `Asia/Manila`.
3. Record pending generation/lease. Call Groq outside the transaction. The deadline is the earlier of the lease limit and next Philippine midnight; crossing-midnight work cannot commit to the old day.
4. Validate output and recheck session, conversation visibility, catalog eligibility, generation/lease/day. Save result/proposal and increment successful usage once in one transaction, releasing the reservation. Only then return success.
5. Failure/timeout releases without charging. A crash leaves an expiring lease reclaimed by requests or maintenance. Late responses cannot commit. Failed work may retry with a new generation of the same ID; successful work only replays its saved result. If commit succeeded but delivery failed, status lookup returns it.

Provider limits apply in addition to application allowance. A 429/outage returns unavailable, costs no allowance, and never triggers automatic paid fallback or an unbounded retry loop. One chat request producing a recommendation/proposal counts once. Saved outcomes still obey privacy/current catalog rules and never start courses or accept roadmaps.

## 10. Notifications, retention, and reports

Decisions insert outbox work atomically. A periodic command claims due rows with short locks, sends outside the transaction, and records status. Administrator support sees sanitized delivery metadata, not learning payloads. SMTP cannot guarantee exactly-once delivery if the process crashes after sending but before marking delivered: duplicate notices are possible, duplicate decisions are not. Use stable Message-IDs and current dashboard state.

Auth mail is queued by the Supabase Postgres email hook and delivered through Gmail; delivery failure never grants approval. Resend issues the appropriate current operation instead of replaying expired token emails. The same maintenance command reconciles interrupted Auth/application operations by operation ID and current state. Hook delivery success means durable enqueue, not confirmed inbox delivery; the UI accurately distinguishes them.

All conversation reads/context/writes require `deleted_at IS NULL` and `last_message_at > now() - interval '90 days'`. Exactly 90 days is inaccessible. Late responses cannot revive the conversation. Delete/expiry removes access to linked AI response payloads and chat-linked unaccepted proposals; accepted roadmaps survive as independent copies. Retain minimal accounting/idempotency metadata without prompt/response text. Standalone unaccepted outcomes follow TRD retention; learning/accepted roadmap history does not expire.

Physical cleanup runs at the next maintenance pass. A sleeping Mac delays cleanup, never access exclusion. Do not export chat/token payloads to logs or developer backups. Provider backup retention is outside application control; do not promise immediate provider erasure. Future restoration stays inaccessible until expiry and recorded deletions are reapplied. Production backup/recovery remains a pre-deployment task.

Program Head reports use role-checked aggregate database functions, PRD start-date cohorts/current completion calculations, and the five-student rule for every returned group/quiz. Include deactivated accounts in historical results. Never send suppressed underlying data to the browser. Faculty records use current course ownership. Administrator history never contains individual learning/assessment/chat data. These controls are not a claim of protection against every statistical inference across repeated reports.

Three Student demonstrators produce suppressed statistics. Use at least five clearly synthetic Students in isolated tests for visible aggregates and smaller groups for suppression; never lower the threshold for a demo.

## 11. Implementation order and verification gates

This order does not authorize implementation. Plan small working slices instead of generating the whole schema first.

| Slice | Evidence required before acceptance |
|---|---|
| Accounts/local HTTPS | Actual phone access and mail delivery; bootstrap/review/recovery; stale-token and direct Auth/Data API tests; last-Administrator/ownership safeguards |
| Content/resources | Stale-review rejection, immutable revisions, transfer/archive access, rejected unsafe PDFs, authorized private downloads |
| Learning/assessment | Concurrent final submissions, stale autosaves, exact grading, retained passes, unique badges, pinned revisions, diagnostic separation |
| Guidance/roadmaps | Real Groq smoke tests; ID validation; explicit acceptance; request-20 replay/request-21 refusal; midnight, crash, late response, deletion and outage tests |
| Reports/rehearsal | PRD aggregates/suppression, administrative privacy, seven-device performance and failure rehearsal |

Notifications, validation, security, and accessibility belong in every slice. Vitest covers deterministic rules and real database integration; Playwright maps flows/negative access to AC-01–38. RLS tests use actual role sessions. Allocate unique test users/content per run; clean only recorded test-owned IDs, never reset a shared database. Serialize singleton/bootstrap tests in a dedicated test project. Mock AI/mail for failure cases, then run separate real-provider smoke tests.

Browser emulation is not proof of phone compatibility: rehearse on real iPhone/Safari and Android/Chrome. Measure TRD performance targets on the host/network with the specified synthetic catalog. Documentation checks do not prove provider, throughput, revocation, scanning, or mobile behavior.

## 12. Remaining implementation checks and references

The architecture is defined; provisioning/proof remain work. Verify Gmail eligibility/delivery, Groq model access/quality, Supabase Auth trigger/API behavior, certificate trust, scanner/signature availability, test isolation, and performance before accepting affected slices. If an integration fails a required guarantee, report the conflict and revise the technical design; never silently weaken the PRD or enable payment.

Primary references checked during design; recheck before provider implementation:

- Installed Next.js `node_modules/next/dist/docs/01-app/02-guides/data-security.md`, `authentication.md`, and the installed deployment guide.
- [Supabase sessions](https://supabase.com/docs/guides/auth/sessions), [email expiry](https://supabase.com/docs/guides/auth/auth-email-passwordless), [Send Email Hook](https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook), [free hook availability](https://supabase.com/docs/guides/auth/auth-hooks), [SMTP](https://supabase.com/docs/guides/auth/auth-smtp), and [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security). The [Auth admin-update implementation](https://github.com/supabase/auth/blob/master/internal/api/admin.go) informed the transaction fence; this mutable source is supporting evidence, not a substitute for testing the hosted version.
- [Groq limits](https://console.groq.com/docs/rate-limits), [structured outputs](https://console.groq.com/docs/structured-outputs), and [data handling](https://console.groq.com/docs/your-data).
- [Google app passwords](https://support.google.com/mail/answer/185833), [Gmail limits](https://support.google.com/mail/answer/22839), [Caddy HTTPS](https://caddyserver.com/docs/automatic-https), and [ClamAV scanning](https://docs.clamav.net/manual/Usage/Scanning.html).

See the [specification entry](docs/superpowers/specs/2026-11-01-cs-gamuers-architecture-design.md) and [handoff plan](docs/superpowers/plans/2026-11-01-cs-gamuers-architecture-handoff-plan.md). Review of these documents does not authorize commits or product code.
