# Role authentication implementation and acceptance

**Current checkpoint: 2026-11-08 corrective verification; full acceptance remains open.** Tasks 1–4 and Task 5 source are committed and reviewed. Whole-branch review found three issues; the current corrective worktree addresses them with focused tests. The owner requested solo Sol work for the remaining steps, so no further subagent review will be dispatched. Historical pause and resumed results remain below.

The [implementation plan](../superpowers/plans/2026-11-06-role-authentication.md) remains the checklist. [PRD](../../PRD.md), [TRD](../../TRD.md), [ARCHITECTURE](../../ARCHITECTURE.md) and the [authentication UI reference](../design/authentication/role-authentication.md) remain authoritative. No recorded blocker waives a requirement.

## Whole-branch review correction (2026-11-08)

The whole-branch review found two Important issues and one Minor issue: an unverified applicant could receive a decision that stranded email proof; identity inputs accepted edits while Save was pending and then discarded them; and a valid session on the wrong review route went to the requested role's login. A forward migration on isolated TEST requires current-email proof for new decisions while retaining Administrator reopening for legacy recovery. The Pending queue hides unverified applications; direct detail explains the requirement and withholds decisions. Correction inputs lock during Save. Wrong-role sessions return to their own approved home or restricted status.

The correction has focused evidence on current source: **27/27** real application integration tests, **15/15** component tests, **8/8** review-flow browser tests at 1280 and 320 CSS pixels, and **16/16** role-route browser tests across Chromium and Firefox. The desktop and 320-pixel screenshots were inspected; no horizontal overflow was observed. Typecheck, lint, formatting and production build passed. The final full `npm test` run with the TEST mail-hook attestation passed **343 tests with two opt-in skips** (41 files passed, one skipped, 296.45 seconds). The hosted migration version `20261108035007` was also confirmed present by read-only inspection.

Failed runs remain part of the record. An earlier full attempt after the correction had **340 passes, two native-invitation failures and two opt-in skips**; both failures passed an unchanged focused rerun. Two nearby provider `429` responses were observed, without proof of exact attribution. A later `npm test` invocation lacked the process-only mail-hook attestation: one guard failure and one blocked suite left **314 passes and 30 skips**. The next attested run passed **342**, with one existing hosted faculty-boundary case timing out after five seconds; the case passed unchanged in a 2.9-second focused rerun and in the final full run. No timeout, provider quota, or application source was changed to obtain that result. The earlier 104-pass full browser attempt below predates this correction. The current three-engine full browser check, actual inbox/device/stable-browser matrix and DEMO rollout remain open.

A broader current-source application browser run passed all **16 Chromium** cases and the first **7 Firefox** cases, then stopped at the stale-reviewer case because Firefox reported an uncaught `TypeError: Error in input stream` from `/faculty`. The case's visible assertions reached their expected outcome; its page-error audit correctly failed. Eight later Firefox cases did not run. An unchanged focused retry failed earlier while reserving a synthetic TEST fixture; the fixture RPC returned no error code. A read-only check found 53 recent localhost authentication admissions, below the limit of 100. A second unchanged focused retry then **passed 1/1** with the page-error audit enabled. The input-stream cause and fixture retry failure remain unproven. Earlier focused correction cases passed in both engines; this broader attempt is not a full browser pass. Test fixtures and the local HTTPS proxy were cleaned after the attempt.

A read-only DEMO migration inventory on November 8 showed only the 23 earlier account/course migrations through `course_draft_request_size_boundary`. None of the 15 role-authentication application migrations in the plan's TEST mapping is recorded there. No DEMO migration, fixture harness, account, or provider setting was changed during this work.

## Resumed verification (2026-11-08)

This section records the earlier resumed checkpoint before whole-branch review and correction. Its pending-review statements describe that checkpoint; the current status is above.

The owner resumed after the November 7 pause. On unchanged application/test source, the exact full command used trusted local HTTPS, isolated TEST, one worker and all three configured projects:

```sh
npm run test:e2e -- --config=.playwright-cli/role-auth-acceptance.config.ts --workers=1 --max-failures=1
```

Actual result: **104 passed (52 Chromium and 52 Firefox), four native-mail opt-in skips, one WebKit setup failure and 53 not run**, 7.8 minutes, from 162 discovered tests. The pinned macOS 14.5 WebKit build failed in `browserContext.newPage` with `Protocol error (Page.overrideSetting): Unknown setting: PushAPIEnabled` before application navigation. No WebKit application behavior was established.

After the approved old-run cleanup, the fresh full unit/integration run on the settled source **passed 330 tests with two opt-in skips and zero failures** (40 files passed, one skipped; 344.42 seconds). It includes the previously blocked bootstrap and native recovery denial cases. The earlier 326/2/2 result remains historical evidence below.

The Chromium/Firefox passes include role login and denied routes, revoked/deactivated Admin sign-out, invitations, correction/review, saved-decision hydration reload, mobile menu/action reflow and focus, interrupted-request recovery and existing Faculty drafts. Actual versions are bundled Chromium156.0.8078.4 and Firefox157.0 (the bundle is Nightly). They do not establish TRD6.5's latest-two-stable vendor or physical-device matrix. Four skipped native browser cases are not passes; the earlier real Student/Faculty browser flows and explicit gateway/hook probes remain separate evidence.

Final source static checks previously passed: typecheck, lint with zero warnings/errors, formatting, whitespace and changed-document links. The resumed command built the unchanged source successfully. Task 5 ran no additional hosted/browser probe during this documentation pass. The November 7 full unit/integration result remains326passed/twofailed/twoskipped as a historical result, with its bootstrap and unproven native recovery failure retained alongside focused diagnostic evidence.

Owner-authorized exact older-run recovery completed at2026-11-08 03:28:20UTC; postconditions completed03:28:48UTC. Owned records/native sessions were removed, all18unrelated-table count/digest pairs matched, the protected TEST marker remained intact, and the journal was removed. The subsequent full unit/integration run passed, including bootstrap. Current work still needed: independent Task5/whole-branch review, working WebKit coverage, required stable browsers and physical devices, actual inbox/holder flows, and DEMO/final-network readiness. Task5 performed no hosted calls while the cleanup writer was active. The preserve-until-authorized record below remains historical.

The detailed resumed log is `.playwright-cli/role-auth-resumed-full-e2e.log`. Root owns resumed-run runtime/fixture cleanup and has already completed the single Next.js feedback pass; no feedback resubmission is required.

## Historical pause checkpoint (2026-11-07)

The owner paused at approximately15:07Asia/Manila (07:07UTC). No Task5 commit or independent review had completed then. The following implementation/evidence and environment sections preserve that checkpoint; their uncommitted/pause wording does not override the resumed result above.

## Finished implementation and review

| Task | Finished work | Evidence and review |
| --- | --- | --- |
| 1 — Separate Administrator sign-in | Separate `/admin/sign-in`; standard portal for Student, Faculty and Program Head; staged native session accepted only after canonical role/state checks; wrong-portal attempts preserve unrelated sessions. | Commit `21e63de`. Meaningful unit/browser failures preceded implementation; focused units **29 passed**. Chromium/Firefox run: **41 passed, one initial Chromium timeout**; the unchanged focused rerun passed. Independent review approved the core change, carrying a minor revoked/deactivated Admin sign-out return issue to Task 5. That follow-up is implemented and tested but not yet independently reviewed. |
| 2 — Public registration service | Capability-bound Student/Faculty registration, immutable retry reservation, unconfirmed native creation, uniqueness retention, uncertain-response recovery, generic unbound resend and authentication admission. | Commits `3291ebc`, `5477a40`. Focused registration checks **26 passed**, one native-hook opt-in skipped at that stage. Independent review found an account-eligibility disclosure through resend errors; the fix passed **15 focused checks** and scoped re-review. Actual native-hook evidence was obtained separately in Tasks 3 and 5. |
| 3 — Signup and email screens | Role-specific signup, field validation, non-secret input retention, check-email/resend guidance, inert link opening, explicit proof confirmation, invitation details and correct sign-in destinations. | Commit `930ea93`. Focused UI checks **17 passed**; Chromium/Firefox checks **26 passed, four opt-in skips**. Separate actual native Student and Faculty browser flows passed at 04:13–04:14 UTC on Chromium 156.0.8078.4. Independent review approved, carrying a minor verification/approval wording correction to Task 5. |
| 4 — Review and correction | Authorized review queues; versioned/idempotent decisions; correction/resubmission/reopening; retained identifier claims; verified email replacement; atomic decision/history/mail; failure-safe retries; preserved unsaved drafts and navigation warning. | Commits `ce2331c`, `27e70a0`. Production browser checks **18 passed** across Chromium/Firefox, plus two focused Firefox passes without diagnostic waits. A review finding about discarded drafts was fixed: **four unit and four browser checks passed**, followed by clean scoped re-review. A mail ordering regression found during the full suite was fixed by an explicit migration and its focused check passed. |

The Task 4 full unit/integration run originally recorded **315 passed, two failed, two skipped**. One failure was the older bootstrap conflict; the other was the mail ordering regression described above. That history is retained rather than presented as an all-green run.

## Task 5 implementation record

These changes were present uncommitted at the pause and are included in this Task5 snapshot:

- An exact allowlisted `admin` sign-out return hint handles an Administrator whose canonical session is already revoked/deactivated. A current canonical actor still overrides the hint; the hint grants no authorization. Both Admin shell callers and unit/browser regressions were updated.
- Verification wording now states that application approval is still needed after email verification.
- Legacy course and invitation browser checks use the actual mobile navigation and completed visible navigation states. No timeout increase, fixed sleep or `networkidle` workaround was added.
- Signup feedback focuses after React commits it. Meaningful frame-withheld unit failure preceded the fix; pending state, password clearing and typing focus remain covered.
- Shared sign-in/card/button/sidebar styles fix 320-pixel overflow at 200% text size. The mobile sheet restores focus to its opener and shows a visible focus indicator after pointer or keyboard opening and Escape.
- Applicant/reviewer decision timestamps and submitted dates use explicit `en-PH` and `Asia/Manila` formatting with a visible GMT+8 label. Actual server/browser locale divergence caused a recoverable hydration error; the fix preserves stored timestamps and original ISO `datetime` values.
- Lint excludes ignored private Playwright scratch files. The tracked design-reference callback has a narrow explained annotation; application lint rules remain enabled.
- Architecture, specification, design handoff, demonstration and plan documents were aligned with implemented behavior and remaining verification gaps. Historical milestone evidence was retained.
- Native-hook test state was corrected from an obsolete expected label to the existing canonical `pending` state. A native recovery test gained safe provider code/status context without weakening its assertions.

At the pause, neither a Task5 commit nor independent/whole-branch review had happened. This snapshot records the implementation; independent reviews remain pending. The implementer's self-review and test evidence do not replace them.

## Verification evidence at the pause

| Check | Actual result | Scope and limits |
| --- | --- | --- |
| Final static checks | `npm run typecheck`, `npm run lint`, `npm run format:check` **passed** after the timestamp fix; lint **zero errors/warnings**. Final whitespace and changed-document relative-link checks passed. | Logs `/tmp/task5-final-hydration-{typecheck,lint,format}.log`. No new test run was started to prepare this pause record. |
| Production build | **Passed**, 20 routes, including the build at the start of the interrupted final E2E command. | Final source includes the timestamp and shared-control fixes. |
| Latest full unit/integration run | **326 passed, two failed, two opt-in skips**, 40 files, 292.34 seconds. | One failure is the preserved bootstrap conflict. Native recovery `verifyOtp` failed before its role-denial assertion; its focused diagnostic rerun passed **1/1**. A nearby native verification rate-limit response is consistent with the failure, but its exact cause was not established. The later UI/date fixes have focused evidence, not a new full-unit result. |
| Signup focus | **40 focused units passed**; **14 browser checks passed** across Chromium and Firefox. | Labels, validation, long input, 1280/320-pixel layouts, aborted submission/resend recovery, password clearing and focus. |
| Mobile menu and action reflow | **Two final focused browser cases passed**, 29.9 seconds, Chromium and Firefox. | Pointer and keyboard opening, Escape, restored visible focus, settled menu/control bounds and brand reflow at 320 pixels/200% text. This run preceded only the subsequent timestamp fix. |
| Timestamp hydration | Actual applicant/reviewer SSR-to-hydration tests first **failed twice**, then **six hydration/status checks passed**. | Explicit locale/timezone removes the ambient-format mismatch; no hydration-warning suppression. |
| Actual timestamp browser check | **Passed** on live Chrome 157.0.8103.38. | One real synthetic Admin login, saved decision reload and observed hydration; original ISO value retained, visible GMT+8; 1440 × 900 and 320 × 900/200% text fit. Zero page errors, console errors, failed requests or final console warnings. Browser locale was `en-GB`; Node locale was `en-US`; both used Asia/Manila. |
| Actual public-page CLI inspection | **24 layout combinations passed** on Chrome 157.0.8103.38. | Six public routes at 1440, 768, 320 and 320/200% text; long fields, validation, keyboard/password reveal/focus. Zero page errors, console errors or failed requests. Later shared-control changes received their own checks. |
| Private CLI inspection | Passed draft Back/Forward retention, long name/number/reason, dialog containment, Cancel/Escape/focus return and final menu geometry. | Chrome; normal 320-pixel menu width 288, enlarged-text width 256. An initial recoverable date hydration error was retained, fixed and separately rechecked as above. |
| Actual native gateway probe | **Passed** separately from the default skipped test. | 57 gateway denials and two invalid keyless verification requests; supported private identity access succeeded. Credentials remained private. |
| Actual native resend/hook probe | **Passed** separately from the default skipped test. | Real native resend plus configured hook queued an unconfirmed account's 1,800-second proof. No generated-proof substitution or outbound worker. This does not prove inbox delivery. |
| Actual native Student/Faculty browser signup | Both **passed** during Task 3. | Real registration/native hook/proof confirmation/password sign-in to Pending; Chromium 156.0.8078.4, desktop. Generated-proof transport in repeatable tests is separate evidence. |
| Real-clock session expiry | **Passed in the measured Student/Chrome scope.** | Original native JWTs were left untouched for their full 3,600-second lifetime. After actual expiry, the valid session renewed and retained approved Student access; the natively revoked session reached session-ended sign-in and lost protected access. Zero console errors/failed requests. Other roles/engines/devices and natural refresh-token lifetime were not established. |

### Final full E2E command was interrupted by the owner

The final fresh command was:

```sh
npm run test:e2e -- --config=.playwright-cli/role-auth-acceptance.config.ts --workers=1 --max-failures=1
```

It ran through the ignored TEST wrapper with trusted local HTTPS, all three configured projects and **162 discovered tests**. The configured authentication limits were preserved; earlier submissions were allowed to age out naturally.

On the pause request, Playwright received a graceful interrupt. Final runner result: **48 passed, one interrupted, 113 did not run**, 2.9 minutes, exit code **130**. All 48 passes were Chromium. The interrupted case was the Administrator invitation flow. Its interrupted marker is **not an observed application regression**. Firefox and WebKit had not started in this final run.

Those 48 passes include application review/correction, the new saved-decision hydration reload, mobile menu reflow/focus, both login portals, wrong-role/session behavior, Faculty course-draft flows, public email/signup checks and the Program Head invitation. The entire matrix is still unfinished. Earlier scoped Firefox passes do not establish final full Firefox coverage, and no WebKit pass is claimed.

Earlier partial full-suite attempts found stale navigation assertions and signup focus behavior that were subsequently corrected. Their logs and focused reruns remain available; do not combine them into a fictional single clean final run.

## Unfinished tasks and blockers (updated 2026-11-08)

| Remaining work | Why it is unfinished | What is needed when work resumes |
| --- | --- | --- |
| Complete the required browser matrix | Resumed run passed104 Chromium/Firefox cases; WebKit failed before navigation and53 cases were not run. | Obtain working supported WebKit coverage and the required stable-vendor/device scope. Preserve quotas and exact fixture ownership. |
| WebKit execution | The resumed full run failed at blank page creation with the pinned driver/engine `PushAPIEnabled` protocol error, before application navigation. | A functioning supported WebKit environment or an explicitly recorded continuing blocker. Do not patch pinned browser internals or disable TLS to manufacture a pass. |
| Bootstrap integration test | The historical full-suite singleton conflict remains recorded. Approved exact-run recovery completed November 8 with unrelated records unchanged; root's fresh full-suite result is pending here. | Record that measured result and a fresh covering bootstrap check; keep the guard intact and do not infer global-reset authority. |
| Native recovery full-run failure | Focused rerun passed, but the original failure's exact cause is unproven. | Retain the failed full result and safe diagnostic context. Assess again only as required by remaining verification; do not weaken the assertion or increase native quotas. |
| Real inbox receipt | No real outbound mail worker was started for this feature's acceptance. Native hook queues are not receipt. | Actual school and personal inbox access, delivery and holder completion evidence. Availability was asked about and remains unresolved. |
| Required stable-browser matrix | Bundled Chromium/Firefox and available installed browsers do not cover TRD 6.5's latest two stable Chrome, Edge, Firefox and Safari releases. | Record exact available stable versions and real outcomes. Recheck dated release targets if acceptance resumes after new releases. |
| Actual Android/iPhone checks | No required physical-device flow/trust evidence. Desktop emulation is insufficient. | Actual Android Chrome and iPhone Safari, shared-network reachability and certificate trust. |
| Task 5 independent review | This source/documentation snapshot is prepared for review; no independent Task5 verdict is recorded yet. | Review the range from `27e70a0` through the Task5 commit, including fixes, tests and evidence. Keep missing acceptance explicit. |
| Whole-branch review | Not started. | Review from `a8767e8` through the completed implementation, including deferred findings and security/concurrency boundaries. |
| Final acceptance/checklists | The required evidence and reviews above are incomplete. | Update plan checkboxes only to match measured completion. Do not declare the user's original done condition met yet. |
| DEMO rollout and rehearsal | This extension's migrations were applied only to isolated TEST. | Separate explicit target selection and rollout verification before demonstrating the new source against DEMO. Never install TEST fixture harnesses there. Final-network/real-holder rehearsal remains separate evidence. |

The preserved older run has seven ownership/reservation rows, six application/native accounts, ten courses and ten revisions (one submitted), plus one retained TEST dependency. Removing it is meaningful deletion, not clearing an empty test marker. The exact run identifier and recovery procedure are in the local environment report; no cleanup authorization was inferred.

## Environment and cleanup state at the historical pause

- The exact isolated TEST target was checked before hosted work. Fourteen application migrations were applied there; [the plan's migration table](../superpowers/plans/2026-11-06-role-authentication.md#test-migration-record) maps local files to connector-assigned hosted versions. TEST fixture harness changes are separate. DEMO was not reset, migrated or otherwise changed by this extension.
- Browser verification used the existing trusted local CA, Caddy HTTPS on port 3443 and a TEST app on port 3100. Process-only TEST markers were used; ordinary local DEMO configuration was preserved.
- Playwright runner session 82831 exited 130 after the requested interrupt. Its managed app shut down. Caddy session 81339 then exited successfully. Read-only process inspection found no remaining task wrapper/test processes. The unrelated application on port 3000 was preserved.
- All Task 5 CLI sessions and its temporary reference server were closed. Its three-account visual batch and two-account timestamp batch were cleaned. The real-expiry accounts, credential snapshots and journal were also cleaned.
- After interruption, no fixture journals or the Task 5 credential files remained. Fresh read-only TEST inspection at approximately 07:07 UTC found **seven preserved older-run ownership rows, zero other fixture ownership rows and zero other fixture accounts**. No unknown run was deleted.
- Private logs/screenshots remain ignored. CA files and the reversible Turbopack cache quarantine are preserved. Do not run `git clean -fdx`, delete the CA, reset TEST, or discard the uncommitted Task 5 files.
- No public deployment, push or merge occurred. No new dependency, paid service, native quota change or real outbound mail worker was introduced.

## DEMO migration and LAN HTTPS update — 2026-11-08

DEMO migration history had 22 older entries and lacked the registration
functions. Applied all 15 tracked role-authentication migrations in source
order, from `20261107032601_public_registration.sql` through
`20261108034903_require_verified_application_review.sql`. The hosted history
now has 37 entries; the new versions run from `20261108144537` through
`20261108144632` in the same order. Readback found the registration,
verification, and review functions and the private verification table.
Seven existing accounts and seven Auth users were present before and after.
No holder account was reset or recreated.

The current Wi-Fi address and ignored `APP_ORIGIN` are both
`192.168.100.125` / `https://192.168.100.125`. The one-command production
launcher uses Next on loopback port 3100 and Caddy on 443. Next's default
Turbopack build failed here while creating its CSS worker port; the supported
webpack build passed. A CA-verified HTTPS GET of Student sign-up returned 200.
Chromium loaded the page, showed required-field errors on empty submit, and
had no browser console errors. At 320 CSS pixels, document width was 320.
No real registration was submitted.

Hosted DEMO Site URL and exact email redirect still need the new origin. The
Supabase CLI cannot pull configuration without an access token, and the
connected Supabase tool has no Auth configuration update action. Do not treat
email confirmation as verified on this address until hosted readback passes.

## Evidence locations

This document and the tracked plan preserve the measured conclusions. Detailed local artifacts supplement them; they are ignored or temporary and are not portable acceptance records by themselves. Do not commit credentials, proof-bearing logs, storage snapshots or private screenshots.

| Evidence | Location |
| --- | --- |
| Per-task reports, reviews, review packages, constraints and execution ledger | `.superpowers/sdd/2026-11-06-role-authentication/` |
| Task 5 current report and pause checkpoint | `.superpowers/sdd/2026-11-06-role-authentication/task-5-report.md` |
| Provider/environment/older-run audit | `.superpowers/sdd/2026-11-06-role-authentication/environment-report.md` |
| Approved older-run cleanup and unchanged unrelated-record baseline | `.superpowers/sdd/2026-11-06-role-authentication/old-run-cleanup-report.md` |
| Resumed full E2E output | `.playwright-cli/role-auth-resumed-full-e2e.log` |
| Actual natural-expiry evidence and cleanup | `.superpowers/sdd/2026-11-06-role-authentication/expiry-report.md` |
| Interrupted final full E2E output | `.playwright-cli/role-auth-final-full-e2e.log` |
| Final timestamp production build | `.playwright-cli/role-auth-hydration-build.log` |
| Final focused menu browser result | `.playwright-cli/task5-outline-focus-green.log` |
| Public layout CLI result | `.playwright-cli/task5-public-final-check.log` |
| Full unit/integration result | `.playwright-cli/task5-full-tests.log` |
| Actual native probes | `.playwright-cli/task5-native-gate.log`, `.playwright-cli/task5-native-hook-green.log` |
| Final static and hydration unit results | `/tmp/task5-final-hydration-{typecheck,lint,format}.log`, `/tmp/task5-hydration-{red,green}.log` |
| Repeatable assertions | [E2E tests](../../tests/e2e/), [integration tests](../../tests/integration/), [unit tests](../../tests/unit/) |

## Remaining execution sequence after resumption

1. Read this handoff, `AGENTS.md`, the current plan and the matching local SDD ledger. Inspect `git status` before editing. Keep Tasks 1–4 completed; do not reimplement or redispatch them.
2. Review the Task5 snapshot from `27e70a0`, including `tests/unit/application-hydration.test.tsx`. The last completed static checks passed; avoid redundant full-suite runs unless new changes or unresolved concerns require them.
3. Root manages any further isolated TEST/trusted-HTTPS runtime work. Keep hosted writers exclusive and preserve authentication capacity and native limits.
4. Preserve the completed resumed full-run result and resolve the documented WebKit/environment/holder-dependent gates. Record exact engine/version/viewport/device scope, failures, skips and interruptions honestly.
5. Independently review Task5 and the whole implementation branch, address findings with focused verification, then align final evidence/checklists. Keep the branch and local SDD workspace while acceptance is unfinished.
6. Close verification processes and clean only owned fixture runs. The original completion condition is reached only when the entire plan is accepted; this pause record does not declare completion.

## Next.js feedback closure

The repository-required reporting pass evaluated three retained framework observations. Three anonymized review drafts were prepared and each review form was opened once in the default browser. No report was submitted; the user owns the forms. The application date-format hydration bug was not reported as a framework issue. The candidate queue is cleared, so a resumed session must not reopen these drafts.

- [Build cache](https://nextjs.org/agent-feedback#report=eyJzY2hlbWFWZXJzaW9uIjo1LCJ0cmlnZ2VyUmVhc29uIjoibm9uLW9idmlvdXMtd29ya2Fyb3VuZCIsInRpdGxlIjoiUHJvZHVjdGlvbiBjYWNoZSByZXRhaW5lZCBhIENTUyB3b3JrZXIgcGVybWlzc2lvbiBlcnJvciBhZnRlciBwZXJtaXNzaW9ucyBjaGFuZ2VkIiwic2V0dXAiOnsibW9kZSI6InByb2R1Y3Rpb24tYnVpbGQiLCJidW5kbGVyIjoidHVyYm9wYWNrIiwicmVsZXZhbnRGZWF0dXJlcyI6WyJQZXJzaXN0ZW50IGNhY2hlIiwiQ1NTIHByb2Nlc3NpbmciXX0sInN0ZXBzIjpbIlJ1biBhIHByb2R1Y3Rpb24gYnVpbGQgaW4gYSByZXN0cmljdGVkIGVudmlyb25tZW50IHVudGlsIGEgQ1NTIHdvcmtlciByZXBvcnRzIGEgbG9jYWwtc29ja2V0IHBlcm1pc3Npb24gZXJyb3IuIiwiUmVydW4gdW5jaGFuZ2VkIHNvdXJjZSB3aXRoIHN1ZmZpY2llbnQgcHJvY2VzcyBwZXJtaXNzaW9ucyBhbmQgY29uZmlybSB0aGF0IE5vZGUgY2FuIG9wZW4gYSBsb2NhbCBzb2NrZXQuIiwiTW92ZSBhc2lkZSBvbmx5IHRoZSBnZW5lcmF0ZWQgcHJvZHVjdGlvbiBUdXJib3BhY2sgY2FjaGUgYW5kIHJlcnVuIHRoZSB1bmNoYW5nZWQgYnVpbGQuIl0sIm9ic2VydmVkIjpbIlRoZSBjb3JyZWN0ZWQtcGVybWlzc2lvbiBidWlsZCBzdGlsbCByZXR1cm5lZCB0aGUgZWFybGllciBlcnJvciBkZXNwaXRlIHRoZSBzdWNjZXNzZnVsIHNvY2tldCBwcm9iZS4iLCJNb3ZpbmcgYXNpZGUgdGhlIHByb2R1Y3Rpb24gY2FjaGUgYWxsb3dlZCB0aGUgdW5jaGFuZ2VkIGJ1aWxkIGFuZCBzdWJzZXF1ZW50IGJ1aWxkcyB0byBwYXNzLiJdLCJleHBlY3RlZCI6IkEgbmV3IGJ1aWxkIHdpdGggc3VmZmljaWVudCBwZXJtaXNzaW9ucyBzaG91bGQgcmV0cnkgdGhlIHdvcmtlciwgb3IgZXhwbGFpbiB3aHkgYSBwcmlvciBmYWlsdXJlIGlzIHJldXNlZC4iLCJmcmVxdWVuY3kiOiJyZXByb2R1Y2VkIiwib3V0Y29tZSI6IndvcmtlZC1hcm91bmQiLCJuZXh0VmVyc2lvbiI6IjE2LjQuMiIsImFnZW50IjoiQ29kZXgifQ)
- [Development styles](https://nextjs.org/agent-feedback#report=eyJzY2hlbWFWZXJzaW9uIjo1LCJ0cmlnZ2VyUmVhc29uIjoidW5leHBlY3RlZC1iZWhhdmlvciIsInRpdGxlIjoiRGV2ZWxvcG1lbnQgc3R5bGVzaGVldCBvbWl0dGVkIGEgbmV3IHZhbGlkIHRva2VuIHVudGlsIHRoZSBzZXJ2ZXIgcmVzdGFydGVkIiwic2V0dXAiOnsibW9kZSI6ImRldmVsb3BtZW50IiwiYnVuZGxlciI6InR1cmJvcGFjayIsInJlbGV2YW50RmVhdHVyZXMiOlsiQ1NTIHVwZGF0ZXMiXX0sInN0ZXBzIjpbIkFkZCBhIHZhbGlkIHN0eWxlIHRva2VuIGFuZCByZWZlcmVuY2UgaXRzIGNsYXNzIHdoaWxlIHRoZSBkZXZlbG9wbWVudCBzZXJ2ZXIgaXMgcnVubmluZywgdGhlbiByZWxvYWQuIiwiQ29tcGFyZSBkZXZlbG9wbWVudCBDU1Mgd2l0aCBhIHByb2R1Y3Rpb24gYnVpbGQsIHRoZW4gcmVzdGFydCBkZXZlbG9wbWVudCB3aXRob3V0IGNoYW5naW5nIHNvdXJjZS4iXSwib2JzZXJ2ZWQiOlsiRGV2ZWxvcG1lbnQgQ1NTIG9taXR0ZWQgdGhlIG5ldyB0b2tlbi9jbGFzcyBhZnRlciBlZGl0aW5nIGFuZCByZWxvYWRpbmc7IHByb2R1Y3Rpb24gQ1NTIGNvbnRhaW5lZCBpdC4iLCJSZXN0YXJ0aW5nIGRldmVsb3BtZW50IHJlc3RvcmVkIHRoZSBleHBlY3RlZCBjb21wdXRlZCBzdHlsZS4gVGhlIGNhdXNlIHdhcyBub3QgZXN0YWJsaXNoZWQuIl0sImV4cGVjdGVkIjoiVGhlIHZhbGlkIHN0eWxlIGVkaXQgc2hvdWxkIHJlYWNoIHRoZSBkZXZlbG9wbWVudCBzdHlsZXNoZWV0IGFuZCBjb21wdXRlZCBzdHlsZSBhZnRlciB0aGUgZXhwZWN0ZWQgdXBkYXRlLiIsImZyZXF1ZW5jeSI6Im9uY2UiLCJvdXRjb21lIjoid29ya2VkLWFyb3VuZCIsIm5leHRWZXJzaW9uIjoiMTYuNC4yIiwiYWdlbnQiOiJDb2RleCJ9)
- [Firefox stream error](https://nextjs.org/agent-feedback#report=eyJzY2hlbWFWZXJzaW9uIjo1LCJ0cmlnZ2VyUmVhc29uIjoibWlzbGVhZGluZy1lcnJvciIsInRpdGxlIjoiRmlyZWZveCBkZXZlbG9wbWVudCBuYXZpZ2F0aW9uIHJlcG9ydGVkIGEgc3RyZWFtIFR5cGVFcnJvciB3aXRob3V0IGEgdXNlZnVsIHN0YWNrIiwic2V0dXAiOnsibW9kZSI6ImRldmVsb3BtZW50IiwiYnVuZGxlciI6InR1cmJvcGFjayIsInJlbGV2YW50RmVhdHVyZXMiOlsiU2VydmVyIEFjdGlvbnMiLCJDbGllbnQgbmF2aWdhdGlvbiJdfSwic3RlcHMiOlsiVXNlIEZpcmVmb3ggd2l0aCBwYWdlLWVycm9yIGF1ZGl0aW5nIHRvIGV4ZXJjaXNlIGF1dGhlbnRpY2F0aW9uLXJlbGF0ZWQgU2VydmVyIEFjdGlvbnMgYW5kIG5hdmlnYXRpb24gaW4gZGV2ZWxvcG1lbnQuIiwiQ2hlY2sgdmlzaWJsZSBvdXRjb21lcyBhbmQgY29tcGFyZSB0aGUgYWZmZWN0ZWQgZmxvdyBpbiBwcm9kdWN0aW9uLCBpbmNsdWRpbmcgYSBjaGVjayB3aXRob3V0IGRpYWdub3N0aWMgd2FpdHMuIl0sIm9ic2VydmVkIjpbIkRldmVsb3BtZW50IHJlcGVhdGVkbHkgZW1pdHRlZCBhbiB1bmNhdWdodCBzdHJlYW0gVHlwZUVycm9yIHdpdGhvdXQgYSB1c2VmdWwgc3RhY2sgd2hpbGUgdmlzaWJsZSBhY3Rpb25zIGNvbXBsZXRlZC4iLCJMYXRlciBwcm9kdWN0aW9uIGNoZWNrcyBwYXNzZWQuIFRpbWluZyBhbmQgdGVzdCByZXZpc2lvbnMgZGlmZmVyZWQsIHNvIGEgZnJhbWV3b3JrLW9ubHkgY2F1c2Ugd2FzIG5vdCBlc3RhYmxpc2hlZC4iXSwiZXhwZWN0ZWQiOiJDb21wbGV0ZWQgZmxvd3Mgc2hvdWxkIG5vdCBlbWl0IGFuIHVuY2F1Z2h0IHN0cmVhbSBlcnJvcjsgYW55IGVycm9yIHNob3VsZCBwcm92aWRlIGFjdGlvbmFibGUgZGlhZ25vc3RpYyBjb250ZXh0LiIsImZyZXF1ZW5jeSI6InJlcHJvZHVjZWQiLCJvdXRjb21lIjoid29ya2VkLWFyb3VuZCIsIm5leHRWZXJzaW9uIjoiMTYuNC4yIiwiYWdlbnQiOiJDb2RleCJ9)
