# Draft lesson, resource, and quiz authoring

## Intent and authority

Extend owned Faculty course drafts into editable course content without introducing publication or learning workflows. Canonical references: [PRD](../../../PRD.md) CONTENT-01–02 and QUIZ-01, [TRD](../../../TRD.md) sections 6.2 and verification requirements, and [architecture](../../../ARCHITECTURE.md) sections 6–8. This builds on the existing course-details editor and its ownership, recovery, and version safeguards.

The owner selected whole-draft saving, allowed any amount of incomplete content, and approved the collapsible lesson mockup on 2026-11-09. Written-design approval is pending. No unresolved canonical document conflict was identified for this scope.

## Scope and success

Faculty can add, edit, reorder, and delete lessons in an owned unpublished draft; add, edit, and remove written resources and descriptive external links; and add, edit, or remove one required or optional quiz per lesson. Questions can be added, edited, and removed. Each question always has four choice slots, one nullable correct-choice selection, and an explanation. Saved content survives refresh and a new sign-in.

No uploads, submission, review, publication, student delivery, attempts, grading, progress, badges, ownership-transfer UI, or deployment. Do not build a generic content framework or overwrite a newer draft silently.

## Approaches

1. **Whole-draft saving — selected and recommended.** One Save draft action persists course details and all nested content atomically using one expected revision version. Extends existing recovery and conflict behavior with fewer save states.
2. **Per-lesson saving — not selected.** Smaller individual writes, but requires additional save states and conflict coordination with course-level ordering and deletions.

The selected approach is a user decision. The technical details below are proposed implementation choices, subject to written-design approval.

## Editor behavior

Retain the existing course route, course-detail fields, explicit saving, status feedback, and draft deletion. Put course details and individual lessons in collapsible sections on the same page. Each lesson contains its title, resources, and optional quiz. Summaries show position, a fallback title for blank titles, resource count, quiz requirement, and incomplete status. Fallback labels never replace stored blank values.

Use Move up and Move down buttons for lessons, disabled at the boundaries. Keep focus meaningful after moving or removing entries. Resources and questions retain insertion order; additional reorder controls for those collections are outside this milestone.

Written resources provide content and an optional supporting description. External resources provide a descriptive title, URL, and optional supporting description. Preserve the existing resource identity when editing; changing resource kind is done by removing and adding a resource. No file controls appear.

A lesson without a quiz offers Add quiz. A lesson with a quiz offers its title, Required/Optional setting, passing percentage, question editor, and Remove quiz. Four labeled choice fields and a single radio group select the correct answer; provide a way to clear that selection. Required/optional is an explicit setting; proposed default for a newly added quiz is Required. Passing percentage defaults to 80%, as required by PRD QUIZ-02, and may be cleared in an incomplete draft.

Deletion removes content from the local draft until Save draft commits it. Confirm removal of a lesson, resource, quiz, or question containing entered content; a lesson confirmation explains that its nested resources and quiz are included. Removing a blank entry requires no confirmation. Existing whole-course deletion remains confirmed and version checked. These are proposed builder choices to prevent accidental loss without adding undo history.

One Save draft action covers the entire editor. Show unsaved, saving, confirmed saved, validation, conflict, access, and uncertain-result states consistently with the existing editor. Incomplete indicators are advisory and never prevent saving. No Submit or Publish action appears.

## Incomplete drafts and validation

Any amount of unfinished content can persist: no lessons, blank titles, empty resource bodies or URLs, missing resource descriptions, no questions, blank choices, no correct answer, no explanation, and no passing percentage. Four choice slots are structural even when all are blank. Duplicate choice text may remain in an unfinished draft; distinct nonblank choices are a completeness requirement. A supplied correct answer must identify exactly one of the four slots.

Separate completeness from safety/type validation. Validate supplied types, IDs, enum values, nesting, numeric values, field limits, and total request size on server and database boundaries. Reject cross-course/revision IDs and duplicate identities; never use client-supplied ownership or parent relationships as authority. Supplied passing percentages follow PRD QUIZ-02 bounds; blank is null. Supplied nonblank URLs must be HTTP/HTTPS with hostname and no embedded credentials. Do not fetch URL previews.

Apply TRD bounds: titles 200 Unicode code points; descriptions, question text, and explanations 2,000; choices 500; written content 20,000; external URLs 2,048; serialized ordinary requests 1 MiB. No arbitrary lesson/question collection caps. Oversized or malformed input returns useful field errors and retains local input. “Any amount” means any degree of incompleteness within these technical bounds.

Author written content in a textarea as Markdown source. This milestone does not add a rendered preview; safe Markdown rendering belongs to the later reading/preview surface and must follow the canonical subset and maintained-renderer requirement. Render all authoring summaries as escaped text, never HTML.

## Persistence and access

Use revision-scoped relational lessons, resources, quizzes, and questions, consistent with the architecture. Preserve stable identities and positions, with at most one quiz per lesson. Keep answer keys and explanations protected from unauthorized reads; neither logging nor public payloads may expose them. Current Faculty owners can author; Program Head oversight follows the canonical read boundary; Administrators, Students, other Faculty, pending/deactivated accounts, and revoked sessions receive no authoring access.

Extend existing user-scoped server actions, validation, transactional database operations, and reads rather than introducing another backend. Saving locks and rechecks the current actor, course ownership, editable draft state, and expected revision version. Apply all inserts, updates, removals, and lesson reordering in one transaction and increment the version once. Any failure rolls back the entire save. Database constraints must allow incomplete content while enforcing structural integrity. Existing drafts migrate to empty lesson collections without losing their details or version guarantees.

Course details, nested content, and delete-course operations share the same revision version. An update from a stale tab fails without partial mutation, preserves entered content, and requires deliberate reconciliation/reload; no automatic merge or last-write-wins behavior. Retain current repeated-activation and uncertain-create handling. A create retry must never present previously persisted different content as if the current content saved successfully.

Extend unsaved-change detection, equality checks, and owner-scoped recovery to all nested content, including additions, removals, ordering, and blank numeric input. Retain existing recovery lifetime and discard semantics; no new persistent browser storage promise. Validation, conflict, and network errors keep entered data. Reload/discard must be deliberate. Do not report success until persistence is confirmed.

Deleting an eligible whole draft must also remove its nested draft content atomically; keep the existing prohibition on deleting published or retained content.

## Change surface and verification

Expected changes reach content types/validation/services, course actions and draft reads, the editor and recovery helpers, database migrations/functions/policies and generated database types, existing course deletion, synthetic fixtures, and affected unit/integration/browser tests. Keep course listing callers compatible. Review every current caller before changing shared contracts.

Verify blank and partially complete round trips, four-slot structure, invalid supplied values, Unicode/size bounds, URL safety, nested identity tampering, and atomic rollback. Prove owner isolation and rejected direct API mutations with real role sessions, including account revocation and stale whole-draft/course-delete interactions. Test simultaneous saves, reordering under unique positions, uncertain results, and recovery of nested edits.

Exercise create/edit/reorder/delete through the running application, persistence after refresh and sign-in, cancellation, pending states, error recovery, labels, keyboard/focus, desktop and 320 CSS pixel layout, long content, console errors, and failed requests. Run relevant unit/integration tests, lint, typecheck, build, and affected shared Playwright coverage. Follow TRD browser/device gates and explicitly record unavailable coverage. Use isolated synthetic data; never reset the ordinary hosted database.

## Remaining builder decisions

The implementation plan selects exact table and function names, payload contracts, migration compatibility, component boundaries, stable-ID creation, field-error paths, and test placement after reading current Next.js and Supabase guidance. It must preserve the behaviors above and use existing components and dependencies where sufficient. No service provisioning or deployment is authorized by this design.
