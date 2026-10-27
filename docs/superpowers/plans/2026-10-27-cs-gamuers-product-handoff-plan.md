# CS-GAMUERS product documentation handoff plan

Status: diagram set and handoff plan approved by the product owner after rereview on 2026-10-27. The PRD is approved. Application implementation is not authorized.

Goal: deliver a consistent PRD and a readable, editable diagram set that future developers and agents can use without reconstructing the requirements discussion.

Spec: [PRD.md](../../../PRD.md), indexed by [the product specification entry](../specs/2026-10-27-cs-gamuers-product-requirements-design.md).

This plan applies the writing-plans workflow to the authorized documentation deliverables. It does not authorize application implementation. Architecture, technology choices, code interfaces, and visual design stay in their separate documents. A file-level application implementation plan requires those later decisions.

## Global constraints

- No application code changes, dependencies, deployments, or school-system integration.
- The PRD is the source of truth. Keep its role names, requirement IDs, states, numeric limits, and exclusions.
- Store use-case diagrams, system sequence diagrams, and flowcharts separately under `docs/diagrams/`.
- Show CS-GAMUERS as one system in sequence diagrams. Do not introduce databases, services, providers, or implementation components.
- Model the four fixed roles. Any generic actor label means the existing role stated in that diagram, not a new application role.
- Preserve existing course/assessment revisions, Student acceptance of roadmaps, privacy limits, and failure behavior.
- External AI roadmaps remain deferred. There is no automatic paid fallback or emergency Administrator recovery.
- Use plain language in diagram labels and accompanying documentation.

## Files and responsibilities

| Path | Purpose |
|---|---|
| `PRD.md` | Approved product behavior and acceptance scenarios |
| `docs/superpowers/specs/2026-10-27-cs-gamuers-product-requirements-design.md` | Link to the canonical PRD |
| `docs/diagrams/README.md` | Diagram inventory, notation, reading order, and rendering instructions |
| `docs/diagrams/use-cases/*.puml` and `*.svg` | Role goals inside the product boundary |
| `docs/diagrams/system-sequences/*.puml` and `*.svg` | Actor requests, system responses, and alternative outcomes |
| `docs/diagrams/flowcharts/*.puml` and `*.svg` | Decisions, state changes, and completion paths |
| `docs/diagrams/traceability.md` | Requirement-to-diagram links and acceptance-scenario references |
| This plan | Documentation tasks, verification evidence, and product handoff order |

## Review focus

1. A new course revision or archive must not reset a Student's existing completion requirements or records.
2. Repeated starts, quiz submissions, AI retries, and badge issuance must not create duplicate outcomes.
3. Account and content actions must stay within role and ownership permissions, including transfer-before-deactivation and the last-Administrator restriction.
4. Missing profiles, unavailable catalog items, AI limits, and failed email must have explicit outcomes that preserve core learning and existing records.
5. Diagnostic scores, course passage, aggregate reports, and private chat must remain distinct; AI must not receive identity through automatic context.

## Task 1: Record PRD approval

- [x] Mark `PRD.md` and its specification entry approved, including section 17.
- [x] Preserve the approved behavior while changing status and document links.
- [x] Verify links after the diagram index and plan exist.

Deliverable: approved PRD with no stale requests for approval of decisions already accepted.

## Task 2: Author the diagram set

- [x] Create role-based use-case diagrams with clear system boundaries.
- [x] Create system sequence diagrams for application review, staff invitations/access, recovery, content review/transfer/retirement, course learning, assessment attempts, recommendations, roadmaps, chat/history, and reports.
- [x] Create flowcharts for account approval, recovery, content publication, course completion, diagnostic assessment, roadmap completion, AI requests, and staff access changes.
- [x] Give every diagram a stable ID, PRD requirement references, and a short explanation of its scope.
- [x] Create the reading index and requirement traceability table.

Deliverable: editable source diagrams covering the approved product, including important failure paths.

## Task 3: Original rendering and verification (historical)

- [x] Render all sources locally to SVG and check for syntax errors.
- [x] Inspect rendered diagrams for readable labels, complete branches, and crossings or clipping that hide meaning.
- [x] Check every PRD requirement and approved operating-rule ID has a traceability entry, and every referenced diagram/source/render exists.
- [x] Check diagrams against all five review-focus cases and the PRD acceptance scenarios.
- [x] Confirm that no application source, package manifest, or lockfile changed for this work.

Deliverable: rendered previews and a recorded validation result. Rendering tools are documentation tools, not an application stack decision.

## Task 4: Hand over for final agreement

- [x] Link the approved PRD, diagram index, and this plan to the product owner.
- [x] Remind the owner that external AI roadmaps remain deferred.
- [x] Obtain final agreement on the diagram set and handoff plan (product-owner approval after rereview, 2026-10-27).

Deliverable: agreed product documentation. Do not treat review of these documents as permission to implement the application.

## Product work packages for later implementation

This order explains dependencies without choosing a stack or architecture. The later technical plan must assign exact code files, interfaces, commands, and tests after the technical documents are agreed.

| Work package | Inputs needed | Behavior delivered | Acceptance checks |
|---|---|---|---|
| 1. Identity and permissions | School-designated initial Administrator; account rules | Registration, verification, role-scoped access, invitations, recovery, deactivation, reopening, and administrative history | AC-01 through AC-06, AC-28, AC-31; P-01, ACC and PERM requirements |
| 2. Faculty content and review | Approved Faculty and Program Heads | Course, career-path, and shared-assessment authoring; review; published revisions; ownership transfer; archive | AC-09 through AC-13, AC-29, AC-31; P-01, CONTENT, PATH, ASSESS requirements |
| 3. Learning and completion | Published courses and approved Students | Discovery, course starts, saved quiz attempts, exact scoring, progress, badges | AC-14 through AC-17, AC-34; P-04, DISC, QUIZ, PROGRESS, REWARD requirements |
| 4. Personalization | Learning profile, diagnostic results where available, published catalog, retained progress | Course/career suggestions, proposed roadmap, acceptance/replacement, archive handling, optional time estimates | AC-07, AC-08, AC-18 through AC-21, AC-34; P-04, PROFILE, REC, ROAD requirements |
| 5. AI assistance | Agreed provider/hosting decisions in technical documents; earlier learning flows | Chat, shared daily allowance, privacy reminder, limited context, saved history, safe unavailability | AC-22 through AC-25, AC-30; AI requirements |
| 6. Oversight and notifications | Account, review, and learning events | Aggregate reports, small-group protections, status emails, delivery failure handling | AC-26, AC-27, AC-31; REPORT, NOTICE, DATA, P-01 through P-08 |

Permission checks, validation, accessibility, retention, and relevant notifications apply within each work package. They are not deferred until the final package. Course learning must work without AI.

## Validation record

Historical validation recorded on 2026-10-27 before the corrections below. These checks are retained as evidence of that pass, not proof of complete behavioral coverage; fresh validation for the five findings is recorded separately below:

- All 30 sources rendered successfully with PlantUML 1.2026.9: 6 use-case diagrams, 16 system sequence diagrams, and 8 flowcharts.
- Inspected all rendered diagrams. Widened sequence-message labels to avoid excessive wrapping; no clipping obscures the reviewed flows.
- Parsed all 30 SVG files successfully. Every source has a matching preview.
- Checked traceability for all 94 requirement and operating-rule IDs and 38 unique acceptance scenarios. All 624 local Markdown links resolved.
- Reviewed revision preservation, duplicate outcomes, permissions, failure paths, and privacy against the PRD.
- `git diff --check` passed. Changes are confined to product documentation; no application source, package manifest, or lockfile changed.

Application tests were not run because this work changes documentation only. Product-owner agreement on the diagrams and this plan was subsequently received after rereview on 2026-10-27.

## Task 5: Correct verified diagram inconsistencies

- [x] Verify the five findings against current sources and the approved PRD.
- [x] Correct ACC-15 ordering while preserving ACC-13 ordering and account state.
- [x] Resolve accessible successful AI retries before new-generation gates; preserve explicit roadmap acceptance.
- [x] Complete shared P-01 delivery-failure behavior and representative account/content notes.
- [x] Demonstrate P-04 course and roadmap display boundaries separately from exact quiz scoring.
- [x] Correct AI-07 expiry to at least 90 days since the last message.
- [x] Synchronize gallery descriptions, requirement lists, traceability, and work-package references.
- [x] Regenerate affected previews with the available local renderer; parse and inspect them.
- [x] Walk the requested scenarios; check Markdown links, mappings, source/preview pairing, and final diff.

PRD approval remains unchanged. The product owner separately approved the corrected diagram set and handoff plan after rereview on 2026-10-27.


### Fresh correction validation — 2026-10-27

Scope: FC-01, FC-02, FC-03, FC-04, FC-06, FC-07; SS-01, SS-04, SS-07, SS-11, SS-12, SS-13, SS-14, SS-15; their galleries, shared rules, traceability, and this plan. Requirement indexing is not a claim that every clause is demonstrated in every linked diagram.

- Regenerated the 14 affected SVG previews successfully using the existing `/private/tmp/cs-gamuers-plantuml.jar`, PlantUML 1.2026.9, with Java headless mode and `-tsvg -failfast2`. No download or installation was needed. The initial non-headless version probe failed; the headless renderer completed successfully, including flowcharts without Graphviz.
- Parsed all 30 SVG previews and checked source/preview pairing. Checked changed SVG text coordinates and declared text lengths against their viewports. Visually inspected all 14 changed layouts using companion PNG renders made by the same local renderer in a temporary directory: readable labels, correct branch order, and no clipping obscuring meaning.
- Checked all source requirement comments against gallery lists and traceability rows, and verified every sequence retains exactly one CS-GAMUERS participant. All 628 local Markdown links in the diagram documents, PRD, specification entry, and this plan resolve.
- Inspected source and Markdown diffs against a pre-edit snapshot, including the previously untracked files. PRD and specification entry are unchanged from that snapshot; unrelated user changes remain intact. `git diff --check` and a snapshot-based whitespace check cover tracked and untracked documentation changes.

Manual documentation scenario walks (not application tests):

| Scenario | Result in corrected diagrams and shared rules |
|---|---|
| Assisted recovery; password setup abandoned | FC-02/SS-04 verify replacement email, replace address and notify old address, then end existing sessions and invalidate reset links before setup. Abandoning setup does not keep old access usable. Another Administrator handles Administrator recovery; approval, role, activation state, and records remain preserved. |
| Normal email password reset | FC-02 and unchanged SS-03 end sessions after successful reset. Single-use/30-minute rules and invalidation of older links remain; recovery does not reactivate or approve an account or lose records. |
| Request 20 succeeds but response is lost; retry then request 21 | FC-07 resolves accessible saved success before generation gates. Retry returns the outcome with usage still 20 and no generation; request 21 reaches the exhausted-allowance branch and is blocked. SS-12–SS-14 and FC-06 follow the same rule. |
| Failed request, AI outage, and replayed roadmap proposal | Failure consumes nothing and preserves records/current plan. Accessible saved outcomes remain readable during outage, subject to permission, privacy, deletion/expiry, and current catalog rules. FC-06/SS-13 converge saved/new proposals on preview and explicit acceptance; replay cannot activate a roadmap or start courses. |
| Approval or publication succeeds but email fails | SS-01/FC-01 and SS-07/FC-03 retain the decision and current state in permitted dashboards. Administrator account support sees delivery failure without private learning content. Repeated delivery attempts repeat only delivery, never approval/publication. The index applies this to other account/content decision notices. |
| Unfinished course or roadmap ratio would round to 100% | FC-04/SS-11 require every required quiz in the started revision to pass; FC-06/SS-13 require every included course complete. Any unfinished ratio stays below displayed 100%, even if ordinary rounding would produce 100%; actual completion permits 100%. No rounding precision or algorithm was selected. |
| Seven correct answers out of nine; 80% threshold | The separate exact-score rule remains. `7 × 100 < 9 × 80`, so the quiz fails; progress-display rounding cannot change passage. |
| Immediately before, exactly at, and after 90 days; early deletion | SS-15 allows own undeleted history immediately before 90 days. At 90 days and thereafter, history is unavailable and excluded from AI context. Early deletion has the same history/context exclusion. Accepted roadmaps, learning records, badges, and used allowance remain unchanged. No physical-storage deletion rule is introduced. |

No rendering blocker or new product-owner decision remains. The product owner subsequently approved the diagram set and handoff plan after rereview on 2026-10-27. Application tests and external-link availability checks were not run; this pass verifies the specified documentation corrections, not runtime behavior or exhaustive coverage of all PRD clauses.
