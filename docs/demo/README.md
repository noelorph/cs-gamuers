# Local demonstration readiness

Account/proof/sign-in and persistent Faculty course-draft implementations are present.
Local acceptance resumed on 2026-11-08 after the owner's November 7 pause; this milestone is not fully accepted. The [implementation handoff](../implementation-status/2026-11-07-role-authentication.md) preserves the pause and resumed evidence, unfinished checks and next steps. The owner
confirmed that intended phones and account holders are currently unavailable.
Real inbox receipt, holder-selected passwords, seven ready accounts, final-network
rehearsal and physical-device acceptance remain unverified.

The [role authentication plan](../superpowers/plans/2026-11-06-role-authentication.md)
records the current extension, verification evidence and open gates. The
[earlier implementation plan](../superpowers/plans/2026-11-03-authentication-and-course-drafts.md)
retains the original account/course-draft milestone evidence. Historical checkpoints below
are dated observations; the current-state corrections take precedence.

## Role authentication checkpoint (2026-11-07)

The authorized extension is implemented in source and isolated TEST. Students and
Faculty can apply through separate forms, verify email with an explicit confirmation,
and sign in to restricted application status. Approved Faculty review Students;
Administrators review Students and Faculty, request correction, reject, and reopen a
rejection after recording a verified error. Saving a correction and resubmitting it
are separate actions. Existing invitation and Faculty course-draft flows remain part
of acceptance.

Administrators use `/admin/sign-in` and reach `/admin`. Student, Faculty and Program
Head accounts use `/auth/sign-in`. Wrong-portal credentials do not establish the
attempted session or replace an unrelated session. Sign-out returns to the canonical
role's portal. A still-open Administrator page includes an allowlisted return-only
hint for sign-out after revocation/deactivation; it grants no role or page access.
Email verification precedes manual approval.

Decision timestamps display Philippine time with a visible GMT+8 offset. The locale
and timezone are explicit on the server and browser; a server-rendered decision
reload was checked without the earlier recoverable hydration text mismatch.

Previous student numbers remain reserved after self-correction. Only the scoped
Administrator correction can release a disputed claim after school-record verification
and a recorded reason; replacing a current number is atomic. Pre-approval email
replacement requires its own single-use 30-minute possession proof. The old email
remains canonical until the fenced Auth update commits; incomplete replacement
blocks approval/resubmission. Completion revokes old sessions and queues the old-address
notice. These are same-account operations, with retained history and no new role grant.

The role-authentication migrations and TEST-only fixture harness updates were applied
only to the exact isolated TEST target after checking target identity. Local migration
filenames and connector-assigned hosted versions differ; the plan records their
mapping. Task 5 adds no migration or provider setting. DEMO has not received this
extension's migrations or rollout verification. Review its existing migration history,
select DEMO explicitly, apply only the missing application migrations in order, and
verify real account/proof/role flows before demonstrating this source against DEMO.
Never install TEST fixture harnesses on DEMO, reset either project, or treat TEST
synthetic approvals as school-record evidence.

Task 3 recorded actual native Student and Faculty browser signup, configured-hook
capture, explicit email confirmation, and password sign-in to Pending status on
Chromium 156.0.8078.4 at 04:13–04:14 UTC. This proves queued native hook work, not
inbox receipt. Repeatable generated-proof transport is separate evidence. Native
provider quotas remain unchanged; their reset policy and capacity were not measured.
No real outbound mail worker was started for these checks.

A separate real-clock Student probe captured two native password sessions, closed
both browsers for their full 3,600-second lifetime, and restored the unchanged cookies
after actual expiry. The valid session refreshed and retained approved Student
access; the natively revoked session returned to sign-in with session-ended guidance.
The exact probe run and credential snapshots were cleaned. This does not establish
Administrator/other-role or other-engine expiry behavior.

The full unit/integration run recorded 326 passed, two failed and two opt-in skips.
One failure is the preserved bootstrap blocker; the other native recovery verification
failed in that run and passed its focused diagnostic rerun. A nearby native verification
rate-limit response is consistent with that failure, but the original test captured no
request ID/code for exact attribution. Both explicit native gateway and native-hook
probes passed separately. Preserve the failure history and native quotas.

The November 7 pause interrupted the earlier run after 48 Chromium passes. After
resumption on November 8, the exact full browser command ran on unchanged source:
104 passed (52 Chromium and 52 Firefox), four native-mail opt-ins skipped, one WebKit
setup failure and 53 not run, in 7.8 minutes. WebKit failed in `browserContext.newPage`
with `Page.overrideSetting: Unknown setting: PushAPIEnabled`, before app navigation.
Separate actual native probes remain distinct from the four skipped browser cases.
The failed full command does not establish complete three-engine acceptance. Open acceptance
includes real school/personal inbox receipt, the latest two stable desktop browser
versions, actual Android Chrome/iPhone Safari and final-network trust/rehearsal.
The bundled macOS 14.5 WebKit 2251 host remains blocked before application navigation.
The historical bootstrap conflict remains recorded. Owner-authorized exact older-run
recovery completed on November 8 at 03:28:20 UTC, with all 18 unrelated-table
count/digest pairs unchanged and the TEST marker intact. Root's fresh full
unit/integration result is pending in this snapshot. Missing coverage remains
unfinished acceptance work.

## Project roles and evidence

Read-only inspection on 2026-11-03 found the existing hosted project healthy,
with zero Auth users, zero storage objects and zero application tables. Its local
configured URL matches that inspected project. It is eligible for the demo-only
role; it is not an integration-test target. No real school records were found.

The selected organization is on the free plan. After the owner explicitly
approved the quoted $0/month action, a separate test project was created and
reported `ACTIVE_HEALTHY`. Its hosted target is distinct from demo. Read-only
inspection found zero Auth users, storage objects and application tables in the
test project. The local test URL, publishable key and project reference are now
configured, including the test secret key. The isolation guard passed before
read-only checks: test Auth settings returned HTTP 200 using the publishable key,
and `auth.admin.listUsers({ page: 1, perPage: 1 })` returned HTTP 200 with an empty
first page using the test secret key. No users were written or identities printed.
These checks establish key acceptance/connectivity, not sign-in or application
integration proof. Do not run bootstrap, global,
reset, or integration operations against the demo project. Never reset either shared
project; later fixtures must clean only their recorded test-owned IDs.

| Prerequisite | Measured state |
| --- | --- |
| Demo target eligibility | Empty hosted project inspected; eligible |
| Separate free test target | Distinct isolated TEST; real-token account/proof/draft integration exercised with exact-run cleanup |
| Gmail sender delivery | TLS/authentication passed; Gmail accepted one sender-only diagnostic and owner confirmed receipt |
| Controlled school inboxes | All seven manifest emails supplied, including three valid Student school-domain addresses; inbox control/receipt unverified |
| LAN HTTPS origin | Current Wi-Fi selected; host HTTPS 200 and HTTP 308 measured; school hotspot remains pending |
| Caddy | Portable v2.11.7 runtime passed on current Wi-Fi; CA-verified host HTTPS check passed |
| Phone certificate trust and Wi-Fi access | Unverified on intended iPhone and Android |
| Auth redirect allowlists | Host configuration must match the active origin; DEMO/final-network round trips unverified |

## Local configuration

Use `.env.example` as a variable-name checklist; populate an ignored local env
file. Local demo values have been migrated from the old browser-prefixed names
to `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`; the demo project reference is
also configured. Configuration deliberately does not fall back to browser-prefixed
names. The local-only preparation was performed separately from the tracked
configuration implementation. All required local demo/test service keys are
configured; `APP_ORIGIN` is now configured locally for the owner-selected current Wi-Fi;
its school-hotspot value will be reconfigured at school. Keep secret keys, SMTP credentials, identities and fixture manifests
out of tracked files and terminal output.

`getAppEnv`, `getAdminEnv` and `getMailEnv` validate only when called. Missing
SMTP or AI configuration does not prevent unrelated service configuration.
`APP_ORIGIN` must be an HTTPS origin without credentials, path, query or fragment.
No AI configuration or feature is introduced here.

Before any later integration fixture or privileged test operation, call
`assertIsolatedTestTarget()` before constructing clients. It requires demo and
test references and both hosted URLs, binds each hostname to its configured
reference, and refuses matching targets. It performs no provider requests and
cannot establish ownership or credential validity. Use only `TEST_SUPABASE_*`
credentials for test clients; a successful local guard is not provider proof.

## Email preparation

Choose one personal Gmail account as the demo sender. Enable 2-Step Verification,
then open [Google App Passwords](https://myaccount.google.com/apppasswords) and
create an app password named `CS-GAMUERS`. Google requires 2-Step Verification;
the option can be unavailable under some account/security policies. Check
[Google's app-password guidance](https://support.google.com/mail/answer/185833)
if it is missing. A local TLS connection and SMTP authentication check passed on 2026-11-04.
One plain diagnostic message was subsequently sent through TLS/465 to the
configured sender's own inbox. Gmail accepted it and the owner confirmed receipt.
It contained no credentials or application links and was not sent to participant
addresses. Participant inbox delivery/ownership and application email-link flows
remain unverified.

In ignored `.env.local`, set `SMTP_HOST=smtp.gmail.com` and `SMTP_PORT=465`.
Set `SMTP_USER` to that sender, `SMTP_FROM` to the same sender, and
`SMTP_PASSWORD` to the generated Gmail app password. Enter real values only
locally; do not share them in chat or commit them. This document contains no
sender address or credential.

All seven manifest email fields are supplied, including three Student school-
domain addresses; structure and uniqueness validation passed. Addresses are kept only in
the ignored local manifest. The three Student holders must control actual `@caloocan.sti.edu.ph` inboxes
and be able to open received links. The other four accounts need distinct,
reachable participant-controlled email addresses. Confirm inbox access without
requesting anyone's email-account password. Each holder will later choose their
own CS-GAMUERS sign-in password during account setup; that password is separate
from the single sender's Gmail app password used for SMTP.

## Local HTTPS preparation

Connect the Mac and intended phones to the same Wi-Fi or hotspot with
communication between devices allowed. On the Mac, find its Wi-Fi address in **System
Settings > Wi-Fi > Details > TCP/IP**. Prefer a stable router DHCP reservation so
the address does not change during rehearsal. A candidate origin such as
`https://192.168.1.50` is only a placeholder, not an approved or measured address;
use the actual Mac address when agreeing the origin.

The owner selected the existing Wi-Fi for HTTPS now, then the school group-member
hotspot on 2026-11-05 (Asia/Manila). Current-network host verification passed:
HTTPS returned 200 with the public root supplied through `curl --cacert`, the
home heading matched, and HTTP returned 308 to HTTPS. This does not prove
another device can connect or trusts the CA.

Portable Caddy v2.11.7 is at `.playwright-cli/tools/caddy` (ignored), verified
against the official release archive SHA-256. The ignored runtime configuration
`.playwright-cli/caddy/runtime.json` adapts the root Caddyfile with the official
`skip_install_trust` global option; generated JSON explicitly sets the local CA's
`install_trust` to false. No global/system trust changes or firewall changes were
made. See [Caddy global options](https://caddyserver.com/docs/caddyfile/options).

Keep the persistent ignored `.playwright-cli/caddy/data` and
`.playwright-cli/caddy/config` directories. Caddy uses them as `XDG_DATA_HOME`
and `XDG_CONFIG_HOME`; its private CA stays under
`.playwright-cli/caddy/data/caddy/pki/authorities/local`. Never delete/recreate
that CA when switching networks or distribute any private key. The public root
certificate alone is copied to ignored `docs/demo/caddy-root.local.crt` for
installation on intended phones. Preserve this same CA when the hotspot origin
changes: update the local origin/runtime configuration and redirect settings,
and let Caddy issue a new leaf certificate under the existing trusted CA.

Measured listeners were Next on `127.0.0.1:3000`, Caddy admin on
`127.0.0.1:2019`, and Caddy HTTP/HTTPS on ports 80/443. No public tunnel or
provider redirect mutation was used. That Task 1 check covered the home page;
Task 3 confirmation-page checks are recorded below. Current Wi-Fi phone trust,
phone reachability and browser rehearsal remain pending, as do all final hotspot
checks. Use [Caddy CLI guidance](https://caddyserver.com/docs/command-line) for
runtime commands; Next must stay loopback-only.

The implementation operator will configure Caddy and, with the holders,
install/trust its internal CA root certificate on each intended phone.
[Caddy's HTTPS documentation](https://caddyserver.com/docs/automatic-https)
explains that each client must trust the local CA. Verify the exact HTTPS origin
from iPhone Safari and Android Chrome over the intended Wi-Fi, and configure the provider's site/redirect allowlists to the
approved origin and implemented email flow. Check actual mail receipt and link
round trips before acceptance. Do not bypass TLS verification, use public
tunnels, enable payment, or treat desktop browser emulation as phone proof.
Phone trust and rehearsal on both current Wi-Fi and the final hotspot remain
unverified; runtime HTTPS on the host is measured only for the current Wi-Fi.

## Current checks

`npm test -- tests/unit/env.test.ts` covers configuration and test-target refusal
without loading local credentials or contacting providers. Run `npm test`,
`npm run typecheck`, `npm run lint`, and `npm run format:check` for local checks.
Earlier isolated native account/proof checks passed. The dated role-authentication
checkpoint and plan distinguish current native checks from default opt-in skips.
Full browser/device acceptance and participant SMTP delivery remain pending; no test skip is evidence
that an unavailable provider prerequisite passed. Each plan task retains its
documented acceptance gates.

## Controlled account preparation (Task 3)

The code is implemented; seven-holder readiness is **not** established. No participant invitations or demo database writes were made during Task 3. All seven manifest email slots are now filled and validate, including all three Student school-domain addresses. No demonstration account has been created by this validation. The final requirement remains one Administrator, three Students, two Faculty and one Program Head.

Before operating against a project, apply the application migrations in filename order and designate its protected `private.environment` marker through the reviewed operator provisioning process. Never install test harnesses on demo. Confirm that URL, credentials and project reference match. `--test` uses only the isolated `TEST_*` configuration after the URL/ref guard; use a separate synthetic manifest for tests.

Actual hosted settings must be saved in the **TEST project** first:

1. Authentication → Hooks → Send Email Hook: PostgreSQL function `public.send_auth_email(event jsonb)`. Its execute grant is Auth-only. The function's successful result means queued, not delivered.
2. Authentication → Email provider: enabled; email confirmation enabled; Email OTP Expiration **1800 seconds**; minimum password **12**. Application validation additionally enforces 12 Unicode code points and at most 72 UTF-8 bytes. Disable anonymous, phone and unused OAuth providers. Magic-link/general recovery hook purposes fail closed.
3. URL Configuration: Site URL is the exact current `APP_ORIGIN`; the redirect allowlist contains only that origin's `/auth/email` path. Preserve this alignment when changing networks. Local `config.toml` does not change hosted settings.
4. After these actual settings and a native hook request are verified, set `AUTH_MAIL_HOOK_VERIFIED_PROJECT_REF` locally to that exact project reference. This is an operator attestation, not configuration or independent proof. Recheck and change it explicitly before demo use.

Use an ignored manifest containing `{"accounts":[...]}` with exactly seven named entries: one `administrator`, three `student`, two `faculty`, one `program_head`. Each entry has `role`, `fullName`, `email`; Students also have textual `studentNumber`, Faculty may have `employeeNumber`. Never store a password. The third Student email alone may temporarily be empty. All filled Student emails must use the exact school domain.

```sh
node scripts/prepare-demo.mjs --help
npm run demo:prepare -- bootstrap --manifest docs/demo/accounts.local.json
npm run maintenance
npm run demo:prepare -- status --manifest docs/demo/accounts.local.json
npm run demo:prepare -- invite-head --manifest docs/demo/accounts.local.json
npm run demo:prepare -- applications --manifest docs/demo/accounts.local.json
npm run demo:prepare -- approve --manifest docs/demo/accounts.local.json
```

Coordinate each issuance with its holder and the demonstration network: links expire 30 minutes after issuance. Bootstrap reserves exactly one Administrator invitation; its holder verifies email and chooses a password. Subsequent commands require that approved Administrator's real password sign-in. The operator does not approve themselves. Student/Faculty holders enter passwords using the hidden local terminal prompt. Approval is explicitly labeled a synthetic fixture decision and does not claim school-record evidence. Rerunning a command resolves the reserved account and existing decision instead of creating another account/approval.

An ignored mode-0600 state file beside the manifest binds setup to the original project and identities before mutations. Do not delete it to bypass a mismatch. The only incremental identity change allowed is filling the originally blank third Student email; all previously supplied addresses/names/numbers stay fixed. Commands report counts and slot status without printing holder contacts or credentials. `status` counts approved, active, unblocked accounts with completed proof; a missing slot is never counted ready.

The maintenance command performs an immediate pass then repeats every 60 seconds; `--once` performs one pass. It claims at most ten records (database maximum twenty), sends through Nodemailer 10.3.1 outside transaction locks, and uses stable Message-IDs. Initial failure retries after 1, 5, 15 and 60 minutes, then remains failed. Delivery state is independent from the saved decision. SMTP acceptance does not prove inbox receipt. Run it only when the intended recipients are ready; synthetic test suites do not invoke SMTP.

Immediately before each send, the worker transactionally checks its live matching lease and the proof's pending state, generation, recipient and expiry, then renews the lease. Superseded or expired work waiting behind another send is skipped; already in-flight SMTP cannot be recalled. Operator `status` prints proof delivery and approval-notice delivery separately, including pending, failed and sent states. A discarded consumed proof does not hide a failed approval notice.

Native invitations use two fenced password operations. If the first native redemption completed but holder setup expired, native invite reissue returns `email_exists`; the operator uses a private recovery verifier only for that same pending invitation. The browser still receives only an invitation capability. General recovery UI and hook purposes remain unavailable. An uncertain native recovery-redemption result requires a fresh operator-issued invitation challenge; it is never assumed successful.

The confirmation page has no third-party resources. GET is inert; confirmation establishes an HttpOnly/Secure/SameSite=Strict opaque cookie in one response before the next POST consumes the proof. Repeating that POST in the same browser resumes a lost response; another capability cannot consume it again. Native proof/session credentials stay on the server. Completion requires a fresh password sign-in. Next request/action logging is restricted for these routes, and the Caddy default runtime logger removes `challenge` query parameters and referrers, including upstream-error logs. Preserve the filter when generating runtime configuration; see [Caddy runtime logging](https://caddyserver.com/docs/caddyfile/options#log) and [query filters](https://caddyserver.com/docs/caddyfile/directives/log#query).

Task 3 verification used real native synthetic Auth sessions and production RPCs in the isolated test project. Chromium 156 inspected confirmation/error states at 1280×900 and 320×740, keyboard focus, overflow, console and network results. Normal HTTPS browser navigation failed `ERR_CERT_AUTHORITY_INVALID`; no bypass was used, and full browser invitation/password completion remains unverified. No Firefox/WebKit, Android/iPhone or real holder receipt claim is made. The production E2E command stopped before Playwright at the existing Turbopack CSS-worker bind-permission failure. All verification servers/browser sessions were stopped. Root coordination still owns actual hosted hook settings, certificate trust, participant-mail timing and final seven-holder rehearsal.

### Task 4 private gateway activation (still a verification gate)

All server, operator and fixture clients now use private backend keys. Ordinary data requests carry an explicit verified user JWT; missing/expired/unverifiable identity is refused before a data request. Do not expose the Next port: bind it to `127.0.0.1`, keep Caddy as the LAN entry, and configure the same random `LOCAL_PROXY_SECRET` (at least 32 characters) in both processes. Caddy overwrites the trusted source-IP and proxy-authentication headers. Never accept browser-supplied forwarding headers directly.

Do these steps **only in isolated TEST first**, without resetting either project:

1. Confirm the actual Send Email Hook is enabled for `public.send_auth_email`, confirmation is ON, email proof expiry is 1800 seconds, minimum password length is 12, unsupported anonymous/phone/OAuth providers are OFF, and site/redirect allowlists contain only the approved application origin/email path. Establish actual native-hook capture with no default-provider mail before setting the project-bound hook-readiness attestation. The current full hosted suite must not run before this evidence.
2. In Project Settings → API Keys, inventory active publishable keys and legacy API-key status. Confirm every caller has migrated to a private secret key; keep retired values privately for negative tests. Do not print or commit keys.
3. Delete every publishable key and deactivate legacy API keys in TEST. These controlled TEST changes have been performed and verified; repeat only through an explicitly authorized provider operation when configuration changes. Preserve the private secret key. Record key IDs/status only and allow propagation.
4. Run the opt-in native gateway probe described in `tests/integration/helpers/README.md`; confirm password/refresh/PKCE and other key-protected endpoints reject absent/retired/JWT-as-key credentials at the gateway. Separately inspect unsupported providers, callback/authorize, alternate hosts/path variants and query/header forms. Native keyless verification remains provider-limited. Repeat the proof after propagation/restart and run ordinary-user negative RLS/session tests using the backend key. A script pass covers only its listed cases.
5. Only after those proofs, set `AUTH_PASSWORD_GATE_VERIFIED_PROJECT_REF` to the exact verified project. This variable is operator readiness, not independent proof. Without it application Auth submissions fail closed. Do not copy TEST readiness into demo.
6. Rehearse the actual HTTPS application with a trusted certificate; never disable TLS validation. Set `PLAYWRIGHT_BASE_URL` and exported `APP_ORIGIN` to that exact local HTTPS origin. Authenticated E2E additionally requires `E2E_AUTH_PROJECT_REF=$TEST_SUPABASE_PROJECT_REF`, verified private gateway, and the server actually configured for TEST. Fixture users are synthetic and removed by the harness. Default smoke checks retain their isolated HTTP production server.

The Task 4 database counters and source do not establish deployed gateway, SMTP/hook, trusted HTTPS, current Safari, or physical-device acceptance. Current Mac14 Playwright WebKit is a frozen build; use supported current Safari and real devices for the TRD gate. Keep native Auth limits enabled alongside the shared counters.

### Historical Task 4 checkpoint and current native mail safety

Source checkpoints `754eadf` and `cfab3e8` passed independent review. The isolated suite passed 152 tests with one explicitly unverified native-gateway probe skipped; typecheck, lint and formatting passed. Development-server checks passed 18 provider-free Chromium/Firefox tests. Chromium sign-in layout/error checks covered desktop and 320 CSS pixels. This does not establish authenticated HTTPS, production E2E, WebKit/current Safari or physical-device coverage. That tool-run production E2E attempt stopped at the native CSS-worker bind-permission failure; the owner later supplied a successful normal-Terminal production build, and the final required tool-run command also built successfully on `42c9ffb`. WebKit remains blocked before app interaction as recorded below.

An earlier negative public-signup test could emit native confirmation mail before the deferred creation guard rolled back signup. It now fails before the provider call unless project-bound TEST hook readiness is verified; a passing Auth error alone is insufficient. After the owner saved the TEST hook, exactly one supported native resend created one private proof and one unclaimed pending mail item with a 1,800-second application expiry. All workers stayed stopped; exact-run cleanup removed the probe. Auth logs showed zero native sends for both that capture and the later full test suite. No participant message was sent. A later timed native verification succeeded at approximately 1,790 seconds and rejected at 1,810 seconds, bracketing the selected 1,800-second expiry. Exact-instant expiry, delivery/inbox receipt and browser ownership completion remain separate checks.

A fresh TEST Auth settings read confirms Email enabled, confirmation required, and anonymous/Phone/OAuth/SAML/passkeys disabled. Native password validation rejected an 11-ASCII-character synthetic password and accepted 12 through supported admin creation; exact-run cleanup removed the fixture and Auth logs showed zero mail sends. The timed native expiry evidence above supersedes the earlier unverified status; final-network URL/link round trips still need their own evidence. TEST modern publishable keys have been retired and legacy keys disabled. The fresh opt-in native probe passed its 57 gateway negatives; a separate 15-request password/refresh/PKCE matrix returned recognized gateway denials. Private backend access and real-user session behavior survive. This supports command-local isolated TEST browser acceptance, not DEMO readiness or every possible alternate path/domain. Never copy TEST readiness to demo.


## Current local verification and rehearsal procedure

The source includes Faculty list/create/edit/delete, incomplete blank drafts,
ordered outcomes, version conflicts, retained failed-save input, safe destructive
confirmation and browser-history recovery. There is no Submit/Publish control,
lesson editor, learning/report workflow or public deployment.

The final required tool-run `npm run test:e2e` successfully built production source
`42c9ffb`: compilation, TypeScript and all 14 generated pages passed with Cache
Components and partial prefetching retained. This supersedes the historical
CSS-worker IPC/port-bind blocker and supplements the earlier owner-supplied normal
Terminal build. A build pass alone does not establish browser-suite success.
The exact production/development browser outcomes are recorded in the plan. WebKit currently fails before app interaction with
`Page.overrideSetting: Unknown setting: PushAPIEnabled`; no WebKit application
pass or current Safari/device coverage is established. Installed versions and TLS
validation remain unchanged.

The required production command's default browser phase exited 1: 19 passed,
24 explicitly guarded authenticated-case skips and 8 WebKit setup failures.
Eighteen passes were Chromium/Firefox smoke checks; one WebKit-labeled pass was
request-only and provides no WebKit browser coverage. No Chromium/Firefox smoke
failed. Skips do not prove authenticated acceptance; see the plan for the separate
trusted-HTTPS production TEST run.

The same production build then passed all 34 guarded authenticated Chromium/Firefox
cases (17 per engine), zero skips/failures, in 2.8 minutes. These cover four-role
sign-in/out, persistent draft CRUD, conflicts, failed saves/history retention,
actual Faculty B access denial, session revocation during save and committed blank
creation with a lost response followed by a safe stable retry. Task 6 source and
behavior are complete within this bounded coverage.

Production engines were Chromium 156.0.8078.4 and Firefox 157.0; actual CLI engines
were Chromium 156.0.8078.80 and Firefox 157.0. CLI screenshots were inspected at
1440×900, 1024×768 and 320×800, including long content, without observed overflow;
200% text enlargement and narrow dialog focus/Escape/return were checked. The
production suites use 1280×720 defaults and explicit 320×800 draft/sign-in checks.
Actual 400% zoom, latest-two-stable desktop matrix and intended physical devices
remain unverified. Bundled engines do not establish current Safari/device coverage.

Final production CLI validation at 320×800 retained the 201-character title,
focused its error and showed no overflow; console errors/failed requests were empty.
Private/no-store and ordinary/proof referrer policies were verified. Exact-run
cleanup returned all measured account/session/course/proof/mail/fixture counts to
zero; owned browser sessions and listeners were closed, private temporary state
removed and the persistent Caddy CA preserved. Matching Auth logs contained zero
mail sends. No participant mail, worker run or DEMO mutation occurred.

For a repeatable isolated TEST rehearsal:

1. Stop mail/maintenance workers. Verify the isolation guard, protected TEST marker,
   fixture harness and current private gateway before starting a TEST-configured
   loopback application. Keep readiness flags command-local and do not repoint
   demo operator commands or copy TEST attestations to DEMO.
2. Keep Caddy as the HTTPS LAN entry with the shared private proxy secret. Verify
   the actual configured origin with trusted certificates. Do not publish origin,
   credentials, fixture state or participant identities in evidence.
3. Export `APP_ORIGIN` and `PLAYWRIGHT_BASE_URL` to that same trusted origin and
   `E2E_AUTH_PROJECT_REF` to `$TEST_SUPABASE_PROJECT_REF`. Only after checking the
   corresponding evidence, set command-local hook/password gateway readiness to
   that exact TEST reference. The fixture helper refuses other or matching targets.
4. Run the required local checks and `npm run test:e2e`; record build and browser
   results separately. `npx --no-install playwright test` against the
   already-running HTTPS development server can establish development-browser
   coverage only. The guarded E2E suites create synthetic users, never send SMTP,
   and remove only their recorded run-owned records. Retain an interrupted cleanup
   journal and use the exact-run recovery procedure in the fixture README.
5. With actual holders/devices available, use the controlled preparation commands
   above, coordinate each 30-minute invitation with its recipient, verify receipt
   and chosen-password setup, then rehearse four-role sign-in/sign-out and Faculty
   CRUD/ownership denial over the intended LAN. Record actual browser versions,
   device trust, viewport/focus/error cases and seven-account readiness.
6. Rehearse seven simultaneous users and at least 100 non-AI core reads/writes;
   measure the TRD p95 two-second target, excluding mail. No such measurement has
   been completed. The full 20-published-course learning/report dataset remains
   later scope because this milestone has no publication/learning implementation.
7. Close verification browser sessions and servers; verify exact-run zero residue.
   Keep manifests, screenshots, storage state, journals and private CA material in
   their ignored locations. Never reset either hosted project.

Skipped/unavailable: real holder receipt/setup, Android Chrome/iPhone Safari,
latest-two-stable desktop/device matrix, final hotspot and seven-user performance.
Risk: local synthetic acceptance is not evidence that the demonstration is ready
for participants or that the full product is complete.


Final static checks passed: lint (zero warnings), formatting and typecheck.
The serial isolated hosted regression passed 31 files / 222 tests, with exactly
one mail-capable native signup case excluded (223 total), exit 0 in 155.32 seconds.
The opt-in native gateway probe was included. This is a filtered-suite result.

The final local verification pass did not rerun the mail-capable native public-signup
negative case. Automatic approval review rejected that command because it could
send verification mail to external recipients without recipient authorization.
The safer hosted run excludes exactly that case and leaves workers stopped; its
result cannot be described as an unqualified full-suite pass. Prior recorded
native-hook capture remains historical evidence, not newly measured mail delivery.

## DEMO provisioning checkpoint (2026-11-04)

The owner authorized DEMO setup and setup emails. Database provisioning is now
complete: a fresh empty-target check preceded ordered application of all 22
production migrations through `course_draft_request_size_boundary`. Remote history
contains the same ordered migration names, but provider-assigned versions differ
from local source timestamps. Do not blindly run CLI `db push`; reconcile history
before any future migration operation.

The protected environment singleton is initialized in `demo` mode for the verified
DEMO target. All 12 application tables have RLS enabled; no TEST harness tables
exist. The guard role has login, inheritance and RLS bypass disabled. Post-apply
counts remain zero for Auth users, application accounts and mail. Security advisors
reported nine INFO findings for intentionally policy-free private RLS tables and
no WARN/ERROR findings; see the [Supabase linter explanation](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

The modern private backend key passed Auth settings access, and
`assert_demo_project` passed. Email and confirmation are enabled; phone, anonymous
and other providers are disabled. Current Wi-Fi matches local APP_ORIGIN. SMTP TLS
and login passed without sending mail. Actual DEMO hook registration, 1,800-second
expiry, minimum password length 12, and hosted Site URL/redirect configuration
remain unverified. One publishable key remains active and legacy keys remain
enabled; no DEMO readiness attestation has been enabled.

Auth/mail setup is **not ready**. The browser host is unavailable and the CLI is
not authenticated; no access-token environment fallback is present. The owner can
log in from their Terminal using
`DO_NOT_TRACK=1 .playwright-cli/tools/supabase login`. Then verify the actual hosted
Auth settings and configure the hook and exact application origin. Retire the DEMO
publishable key and disable legacy API keys while preserving the private backend
key; establish DEMO gateway verification before enabling its readiness flag or
sending setup mail. Do not copy TEST attestations.

No Administrator bootstrap/account or participant email has been created/sent.
Administrator acceptance and holder-selected hidden passwords, all seven email
proofs and approvals remain required. No workers, servers or services were started
for this provisioning checkpoint; TEST was untouched. This supersedes historical
statements that no DEMO database mutation has occurred, without changing their
dated test evidence.

Final read-only comparison found all 51 production function-body hashes equal to
TEST, with zero mismatches, zero public TEST RPCs and zero anonymous application
RPC execute grants. Auth Admin can execute the email hook; anonymous and
authenticated roles cannot. `course_drafts` uses `security_invoker=true`.
The existing private backend credential was made available to the normal operator
in ignored mode-0600 local configuration; no credential was generated or printed.
The normal `demo:prepare status` command passed: 0/7 ready, all not prepared and
none queued. Its ignored local state file binds the manifest/project only; no
provider user or mail mutation occurred. Further provider changes await owner CLI
login and DEMO key retirement, preserving the private backend key.


### DEMO Auth and first invitation — 2026-11-04

Owner completed CLI login and API key retirement. Verified no active publishable
keys and legacy anon disabled; nine empty password/refresh/PKCE requests using
missing, malformed or retired publishable keys returned recognized 401 gateway
denials. Private backend settings access remains available. This bounded probe
does not establish every alternate gateway path or a DEMO user-JWT-as-key matrix.

Official CLI applied six reviewed declared Auth changes: exact local HTTPS Site
URL and email redirect, 1,800-second expiry, minimum password length 12, and enabled
PostgreSQL Send Email Hook at public.send_auth_email. Readback found zero declared
differences and preserved all eight unrelated remote settings.

To verify actual hook invocation before attestation, used the existing validated
manifest binding and production bootstrap reservation, then native Administrator
invitation with the reserved identity and exact redirect. No password was supplied.
Read-only counts confirmed one native user, one pending Administrator, one bound
reservation, one pending invitation proof with exactly 1,800-second lifetime, and
one pending invitation mail item. No generateLink/queue-generated reissue followed.
This is actual native-hook capture, distinct from generated-link operator queueing.
Only after these checks were local DEMO-bound hook/password readiness recorded.

The one-pass maintenance worker processed that single authorized invitation.
Readback shows one invitation in sent state, one attempt; provider acceptance is
not inbox receipt. Status remains 0/7 ready: Administrator pending with proof mail
sent; other six not prepared. Holder email verification and holder-selected password
are required before authenticated preparation of other roles. No holder password,
email confirmation or approval was fabricated; TEST was untouched.

Local production app and retained-CA HTTPS proxy remain running for this holder
handoff. HTTPS sign-in returned 200 with private/no-store behavior. No new browser
acceptance run or device trust/reachability verification was performed for this
operational configuration pass. Stop these two owned services after holder setup;
maintenance already exited. Preserve the CA. This checkpoint supersedes the prior
CLI/key/configuration blockers and no-invitation statements, not holder readiness.


Administrator holder checkpoint — 2026-11-04: after owner-reported email confirmation, normal DEMO status independently verified 1/7 accounts approved with completed proof. Administrator is approved; other six remain not prepared. No password was requested in chat or supplied by the agent. Subsequent preparation requires the real Administrator hidden Terminal password and, for Student/Faculty creation, each holder-selected hidden password.


### Hotspot origin update — 2026-11-04

Owner authorized the new-network setup and subsequent participant confirmation
emails. Detected the active default-route Wi-Fi interface and private IPv4.
Updated ignored APP_ORIGIN and the minimal DEMO hosted Site URL/exact email
redirect. CLI preview asserted exactly those two declared changes; push passed;
readback found zero declared differences and preserved unrelated remote settings.
Restarted the owned loopback production app and HTTPS proxy with retained CA.
The active persistent CA matches the previously distributed public certificate;
no trust/firewall changes or TEST mutations occurred.

Both HTTPS authentication pages returned 200 under explicit retained-CA validation;
email page retains no-referrer and private/no-store. Chromium verified the normal
invalid-credentials response, desktop width 1440 and email page width 320, no
horizontal overflow and zero browser errors. No real password/proof was used.
Physical-device hotspot reachability/trust remains holder verification, requested
from another device. App/proxy remain running for the authorized holder workflow.

Normal status still reports 2/7 ready (Administrator and student_2), with remaining
five not prepared and no proof mail queued for them. No new participant email was
sent by this network update. Remaining preparation needs real Administrator and
Student/Faculty holder passwords through hidden Terminal prompts, followed by
reviewed delivery; no identity, proof, password or approval was fabricated. Old
email URLs retain the old network address; coordinate fresh issuance on the new
network only when holders are ready. Exact address remains ignored local config.

Holder reported that the new HTTPS sign-in page opens on another hotspot device without a certificate warning. This establishes reported reachability/trust for that device only; remaining device matrix and confirmation delivery remain separate.


Faculty setup diagnostic — 2026-11-04: first attempt failed local password validation; subsequent valid holder entry created faculty_1 unconfirmed, then native resend was denied with over_email_send_rate_limit (429). Read-only state confirms one bound/consumed Faculty reservation, one unconfirmed native Faculty user with password present and no native confirmation issuance; faculty_2 remains unprepared. Auth logs contain two email-limit denials. Do not recreate faculty_1 or claim a retry changes its password. A password disclosed in conversation was not repeated, stored or used by the agent; holder-controlled rotation remains needed.

Official hosted Auth guidance supports raising the email rate limit with a Send Email Hook. A desired 20/hour local CLI preview returned zero declared differences: the installed CLI does not expose this field in hosted config diff. No limit push was performed; the trial local section was removed. Dashboard automation remains unavailable. Owner instructed to change only the DEMO email send limit to 20/hour; actual setting/readback and resumed delivery remain pending. Email confirmation, native hook, expiry, per-recipient throttles and account guards remain intact. Ignored Faculty helper now reports sanitized stage/slot/code and correct password rules; pure local checks pass, with no extra provider mutation.
