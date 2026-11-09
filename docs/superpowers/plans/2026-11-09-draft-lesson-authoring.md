# Draft lesson, resource, and quiz authoring implementation plan

Date: 2026-11-09. Status: planned; implementation has not started.

Source: [draft authoring spec](../specs/2026-11-09-draft-lesson-authoring-design.md). Authority: [PRD](../../../PRD.md) CONTENT-01–02, QUIZ-01–02; [TRD](../../../TRD.md) sections 6.2 and 6.5; [architecture](../../../ARCHITECTURE.md) sections 2 and 5–8.

This document was prepared without Superpowers skills or workflows. Its location follows the repository's local task-tracking convention. The current request authorizes planning only. The spec still records written-design approval as pending; this plan does not change that status or authorize implementation, database application, provisioning, deployment, or a commit. No canonical conflict was found in the scoped requirements; record any discovered during implementation here before resolving it.

## Outcome and boundaries

Extend the existing Faculty course draft editor so one explicit Save draft atomically persists course details, ordered lessons, written/external resources, and one optional quiz per lesson. Any degree of incomplete content remains saveable within safety and size limits. Existing ownership, revocation, conflict, recovery, and deletion guarantees remain intact.

Excluded: uploads, Markdown preview/rendering, submission/review/publication, learning/attempts/grading, progress/badges, ownership-transfer UI, resource/question reorder controls, generic frameworks, new dependencies, deployment, and GitHub Issues.

## Current implementation and change surface

The current draft contains details only. `courses.ts` calls user-scoped RPCs; `course_drafts` is a security-invoker view. Database writes lock the actor account, course, and revision, and check the expected version. The form already handles repeated activation, different-content create replay, uncertain results, unsaved navigation, and owner-scoped browser-heap recovery. Extend these paths rather than replacing them.

| Surface | Files to inspect/change |
|---|---|
| Contracts and validation | `src/features/content/types.ts`, `validation.ts` |
| Reads and operations | `src/features/content/courses.ts` |
| Thin entry points | `src/app/faculty/courses/actions.ts` |
| Editor and recovery | `draft-form.tsx`, `draft-recovery.ts`, `draft-feedback.ts`, `delete-draft-dialog.tsx` under that route |
| Route/list callers | `courses/page.tsx`, `courses/new/page.tsx`, `courses/[courseId]/page.tsx` |
| Persistence | New forward migration under `supabase/migrations/`; extend current draft functions/view as needed; regenerate `src/lib/supabase/database.types.ts` |
| Unit coverage | `tests/unit/course-draft-validation.test.ts`, `course-draft-operations.test.ts`, `draft-form.test.tsx`; add focused nested-editor tests if splitting components |
| Database and fixtures | `tests/integration/course-drafts.test.ts`, `tests/integration/helpers/course-draft-boundaries.sql`, `course-fixture-harness.sql`, affected cleanup helpers |
| Browser coverage | `tests/e2e/course-drafts.spec.ts` and affected shared navigation/authentication coverage |

Re-run the caller search before editing shared signatures, including mocks and fixtures. Preserve course-list details and deletion props; do not load nested answer keys into list responses just to satisfy a widened type.

## Selected implementation contracts

These are engineering choices for the implementation, subject to the spec's pending design approval.

- Keep `DraftDetails` unchanged. Add `DraftContent = { details: DraftDetails; lessons: DraftLesson[] }`; full `CourseDraft` adds `lessons`. Give listing its existing summary shape rather than fetching full content for every row.
- `DraftLesson`: `id`, `title`, `resources`, `quiz`. Resources are a discriminated union: written (`id`, `kind: 'written'`, `content`, `description`) or external (`id`, `kind: 'external'`, `title`, `url`, `description`). No resource-kind conversion in place.
- `DraftQuiz`: `id`, `title`, `required: boolean`, `passingPercentage: number | null`, `questions`. New quizzes default to required and 80%; clearing the percentage stores null.
- `DraftQuestion`: `id`, `text`, `choices` as a four-string tuple, `correctChoice: 0 | 1 | 2 | 3 | null`, `explanation`. Choice slots need no separate UUIDs. Resources/questions retain array insertion order.
- Generate new lesson/resource/quiz/question UUIDs with `crypto.randomUUID()` once on addition; retain them through edits, moves, retries, recovery, and saves. Derive positions from array order at the persistence boundary. Never accept client owner/revision/parent IDs as authority.
- Extend `saveDraft`, `createCourseDraft`, and `updateCourseDraft` to take whole `DraftContent`; retain ID and expected-version arguments and current `DraftResult` outcomes. Update all callers together. Use field paths such as `lessons.0.quiz.questions.1.choices.2`, plus a root `content` error for request-size failures.
- Keep raw numeric strings in editor/recovery state, keyed by stable quiz ID; convert blank to null at submission. Preserve invalid entered input on rejection. Equality compares the complete normalized submitted content with the confirmed returned content, including IDs and order.
- Use `public.course_lessons`, `public.lesson_resources`, `public.lesson_quizzes`, and `public.quiz_questions`, each revision scoped, with UUID primary keys. Use composite foreign keys to prevent cross-revision parenting, unique parent/position constraints, and one quiz per lesson. Include ordered positions for resources/questions without offering reorder controls.
- Store choices as a four-element text array with no null elements and a nullable checked correct-choice index. Keep answer indices and explanations in `private.quiz_question_keys`, keyed to the question and revision, with no client table grants; assemble them only for authorized owner/Program Head draft reads. No Student delivery API is introduced.
- Retain the details-only `course_drafts` listing view. Add an authorized `public.read_course_draft(course_id)` invoker wrapper backed by a narrowly scoped private function returning a consistent full snapshot. Preserve current owner-only application reads and canonical Program Head oversight at the database boundary; add no oversight UI.
- Extend existing create/update RPC names with a required lessons argument and remove obsolete overloads in the forward migration. Do not leave a details-only update path that can bypass whole-draft semantics. Preserve the existing details-only projection helper for listing or extend it with a separate full-content projection as needed.

## Tasks

### 1. Confirm prerequisites and lock validation behavior

- [ ] Before implementation, resolve the recorded written-design approval status under current user authorization; record any unresolved document conflicts here.
- [ ] Read repository Supabase and Postgres skills before SQL/integration work, browser guidance before UI verification, and relevant installed `node_modules/next/dist/docs/` guides before code changes. Check current Server Action payload limits and error behavior against this version.
- [ ] Extend types and add `validateDraftContent` alongside reusable details validation. Separate advisory completeness from mutation acceptance.
- [ ] Accept empty collections, blank text, null correct answer/percentage, duplicate choice text, and quizzes with zero questions. Reject malformed objects/arrays, duplicate identities, invalid UUIDs/enums, nonfinite/fractional/out-of-range percentages, invalid correct-choice slots, and any choice count other than four.
- [ ] Enforce Unicode code-point bounds: titles 200; descriptions/question text/explanations 2,000; choices 500; written bodies 20,000; URLs 2,048. Preserve supplied content without trimming/truncating stored text.
- [ ] Accept blank URLs; otherwise require HTTP/HTTPS, a hostname, and no credentials. Do not fetch previews. Validate again at the database boundary.
- [ ] Enforce the complete serialized ordinary request's 1 MiB ingress limit, including nested content and envelope. Keep the existing distinction between application serialization and PostgreSQL JSONB formatting; do not reintroduce rejection based solely on `octet_length(jsonb::text)`. Verify framework-level oversize failures retain input and produce useful feedback.
- [ ] Add focused validator tests for blank/partial drafts, malformed nesting, Unicode boundaries, exact request-size boundaries, unsafe URLs, sparse arrays, and duplicate IDs. No arbitrary collection-count limits.

Acceptance: complete and incomplete drafts have the same safety contract; advisory completeness cannot prevent Save draft.

### 2. Add relational persistence and secure atomic operations

Depends on task 1 contracts.

- [ ] Add a forward migration; leave historical migrations unchanged. Empty existing revisions naturally read as `lessons: []`, without changing their details/version.
- [ ] Add scoped foreign keys, indexes, structural checks, nullable incomplete fields, and RLS. Revoke direct mutations and default function execution; use the existing least-privilege owner and fixed-search-path private implementation/invoker-wrapper pattern.
- [ ] Authorize full reads for the current approved Faculty owner and canonical Program Head oversight; reject Administrator, Student, other Faculty, pending/deactivated accounts, and revoked sessions. Keep keys out of unrestricted queries, listing payloads, logs, and errors.
- [ ] Extend create/update to lock actor account, course, and revision in the established order, recheck current authorization/editability, and reject stale versions before changing content.
- [ ] Validate every supplied existing ID against its persisted revision and parent, reject cross-parent reuse and kind changes, and reject duplicate/global ID collisions. Derive all parent relationships from the authorized nesting.
- [ ] Apply inserts/updates/removals and ordering in one transaction; retain identities of surviving records. Use deferrable unique position constraints checked at transaction completion so swaps never fail on intermediate positions.
- [ ] Validate all nested data before mutation; ensure caught exceptions/result returns cannot commit earlier writes after a later failure. Increment the revision version once per successful update and return the complete confirmed snapshot.
- [ ] Keep create replay idempotent by course UUID: an already-created draft returns its actual persisted full snapshot without silently applying the retry payload. Different nested content must remain visibly unsaved in the editor.
- [ ] Extend eligible whole-course deletion to cascade nested draft rows/keys atomically. Preserve stale-version checks and refusal to delete published, retained, or otherwise ineligible records.
- [ ] Add integration assertions for legacy-draft compatibility, stable IDs, nested removals, reorder swaps, simultaneous saves, forced mid-write rollback, replay differences, and save/delete races. Regenerate database types from the migrated isolated target.

Acceptance: stale or invalid writes change nothing; successful writes change the entire draft once; real role-session tests prove both read and mutation boundaries.

### 3. Connect feature operations and recovery

Depends on tasks 1–2.

- [ ] Update `courses.ts` full reads, create/update calls, projections, and error handling; preserve user-scoped transport and `requireActor('faculty')`. Keep list queries lightweight and callers compatible.
- [ ] Update thin route actions and every caller/mock/fixture for the whole-draft payload. Retain mutation-origin checks and existing error codes.
- [ ] Extend recovery snapshots, dirty-state tracking, equality checks, and navigation/discard behavior to nested content, ordering, IDs, deletions, and raw numeric strings. Maintain owner scoping and current heap-only lifetime.
- [ ] Preserve repeated-activation locking, pending edit restrictions, and uncertain-result behavior. A read after a network failure cannot prove which save committed; do not invent success or automatically overwrite a newer version.
- [ ] Extend unit operation/form tests for nested-only differences, same/different create replay, unchanged version on rejection, uncertain results, validation fields, cross-owner recovery, explicit discard, and recoverable numeric input.

Acceptance: no save reports success for different content; every failure retains entered nested data and requires deliberate reconciliation where appropriate.

### 4. Build the nested editor using existing controls

Depends on task 3. Retain one form and one save action.

- [ ] Make course details and each lesson collapsible. Keep `draft-form.tsx` as save/recovery coordinator; put lesson editing in route-local `lesson-editor.tsx`, splitting resource/quiz components only if needed for readability.
- [ ] Reuse Button, Input, Textarea, Dialog and existing styling; use accessible native disclosure/selection/radio controls where sufficient. No new dependency is needed.
- [ ] Add lesson title/add/remove and Move up/down controls with boundary disabling. Summary text shows position, fallback title, resource count, quiz requirement, and advisory incompleteness without changing stored blanks.
- [ ] Add written Markdown-source and descriptive external-link resources with optional descriptions. Preserve identity and insertion order; kind changes require remove/add. Escape summary text; provide no file or preview controls.
- [ ] Add/remove one quiz per lesson; edit title, required/optional, nullable percentage, and questions. Every question has text, four labeled choices, one radio group plus clear-answer control, and explanation.
- [ ] Confirm removal when an entry contains entered content, including nested content; describe lesson cascading removal. Default generated IDs, empty choice slots, and quiz defaults alone do not count as entered content. Blank-entry removal needs no confirmation.
- [ ] Keep focus on a meaningful surviving heading/control after movement/removal; restore focus after cancelled dialogs. Distinguish disclosure controls from move/delete buttons.
- [ ] Connect field paths to labels, help/error text and invalid state. Expand a collapsed section containing a server error so the user can reach it. Retain unsaved/saving/saved/conflict/access/uncertain feedback and whole-course delete confirmation.
- [ ] Add component coverage for confirmations/cancellation, nested dirty-state recovery, quiz defaults/clear answer, four-slot structure, move boundaries, and keyboard/focus behavior.

Acceptance: a Faculty owner can author any incomplete nested draft using keyboard controls, save it once, and recover all content after a confirmed reload.

### 5. Verify through the database and running application

Depends on tasks 2–4; do not mark unexecuted checks passed.

- [ ] Extend synthetic fixtures and cleanup for nested records/keys. Use unique run IDs and the isolated TEST target; never reset the ordinary hosted database or provision a service as part of this plan.
- [ ] With real ordinary sessions, prove owner isolation, Program Head read-only oversight, rejected direct table/RPC mutations, cross-revision/parent ID tampering, pending/deactivated access rejection, and immediate session revocation. Privileged fixture setup is not permission evidence.
- [ ] Extend `tests/e2e/course-drafts.spec.ts`: create nested blank/partial content, edit/reorder/remove, cancel removal, save, refresh, sign out/in and reopen; assert persisted order/content and stale-tab rejection. Include invalid and oversized payload feedback, failed requests, uncertain create/save results, and explicit reload/discard.
- [ ] Use repository Playwright CLI against the running app: inspect desktop and 320 CSS pixel layout, long text/URLs, labels/radios, visible focus, dialogs, pending controls, console errors, and failed requests. Close servers/sessions started for verification.
- [ ] Run focused unit tests, isolated course integration tests using documented target setup, `npm run lint`, `npm run typecheck`, `npm run build`, and affected/shared `npm run test:e2e` coverage. Record skips and environment requirements rather than accepting skipped integration tests as success.
- [ ] Follow TRD browser gates: latest two stable target releases, Chromium plus Firefox/WebKit coverage, actual Android/iPhone rehearsal, and seven-user/100-operation p95 non-AI latency target under 2 seconds. Record actual engines/devices/data volumes and any unavailable coverage; this slice does not create publication or student workflows to manufacture a rehearsal dataset.
- [ ] Review the final diff for accidental answer-key/log exposure, obsolete RPC overloads, unrelated changes, and missing callers. Update this plan's checkboxes and evidence only for work actually completed.

Acceptance: blank and partial round trips, transactional rollback, current permissions, stale-save/delete interactions, and nested recovery are demonstrated. Unavailable hosted/browser/device/performance coverage remains explicitly open.

## Evidence and unresolved items

- Planning review only: inspected current draft contracts, operations, actions, editor, recovery, original draft migrations, request-size correction, callers, test locations, and canonical requirements.
- Implementation, migrations, generated types, automated tests, browser checks, device checks, and performance measurements: not performed by this documentation task.
- Written-design approval: pending in the source spec; current planning authorization does not resolve it.
- New canonical conflicts: none identified in this planning pass. Record future conflicts here with source references and the required owner decision.
