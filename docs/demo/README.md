# Local demonstration readiness

Task 1 configuration and the Task 2–4 account/proof/sign-in implementation are present.
Hosted configuration, trusted-browser completion and seven-holder readiness remain
pending as detailed below. Course-draft features are not implemented yet.

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
| Separate free test target | Created, healthy, distinct and empty; guarded read-only publishable/admin connectivity passed; app integration pending |
| Gmail sender delivery | TLS/authentication passed; Gmail accepted one sender-only diagnostic and owner confirmed receipt |
| Controlled school inboxes | All seven manifest emails supplied, including three valid Student school-domain addresses; inbox control/receipt unverified |
| LAN HTTPS origin | Current Wi-Fi selected; host HTTPS 200 and HTTP 308 measured; school hotspot remains pending |
| Caddy | Portable v2.11.7 runtime passed on current Wi-Fi; CA-verified host HTTPS check passed |
| Phone certificate trust and Wi-Fi access | Unverified on intended iPhone and Android |
| Auth redirect allowlists | Unverified |

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

Six of seven manifest email fields are supplied, including two Student school-
domain addresses; the third Student field is blank. Addresses are kept only in
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
The isolated native account/proof integration suite passes. Trusted-browser/device
completion and participant SMTP delivery remain pending; no test skip is evidence
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
3. Delete every publishable key and deactivate legacy API keys in TEST. These are manual configuration changes, **not performed by this implementation**. Preserve the private secret key. Record key IDs/status only and allow propagation.
4. Run the opt-in native gateway probe described in `tests/integration/helpers/README.md`; confirm password/refresh/PKCE and other key-protected endpoints reject absent/retired/JWT-as-key credentials at the gateway. Separately inspect unsupported providers, callback/authorize, alternate hosts/path variants and query/header forms. Native keyless verification remains provider-limited. Repeat the proof after propagation/restart and run ordinary-user negative RLS/session tests using the backend key. A script pass covers only its listed cases.
5. Only after those proofs, set `AUTH_PASSWORD_GATE_VERIFIED_PROJECT_REF` to the exact verified project. This variable is operator readiness, not independent proof. Without it application Auth submissions fail closed. Do not copy TEST readiness into demo.
6. Rehearse the actual HTTPS application with a trusted certificate; never disable TLS validation. Set `PLAYWRIGHT_BASE_URL` and exported `APP_ORIGIN` to that exact local HTTPS origin. Authenticated E2E additionally requires `E2E_AUTH_PROJECT_REF=ggiccvcrkydcimveyrfi`, verified private gateway, and the server actually configured for TEST. Fixture users are synthetic and removed by the harness. Default smoke checks retain their isolated HTTP production server.

The Task 4 database counters and source do not establish deployed gateway, SMTP/hook, trusted HTTPS, current Safari, or physical-device acceptance. Current Mac14 Playwright WebKit is a frozen build; use supported current Safari and real devices for the TRD gate. Keep native Auth limits enabled alongside the shared counters.

### Reviewed Task 4 checkpoint and native mail safety

Source checkpoints `754eadf` and `cfab3e8` passed independent review. The isolated suite passed 152 tests with one explicitly unverified native-gateway probe skipped; typecheck, lint and formatting passed. Development-server checks passed 18 provider-free Chromium/Firefox tests. Chromium sign-in layout/error checks covered desktop and 320 CSS pixels. This does not establish authenticated HTTPS, production E2E, WebKit/current Safari or physical-device coverage. Production build remains blocked by the native CSS-worker bind-permission failure; WebKit failed before page setup.

An earlier negative public-signup test could emit native confirmation mail before the deferred creation guard rolled back signup. It now fails before the provider call unless project-bound TEST hook readiness is verified; a passing Auth error alone is insufficient. After the owner saved the TEST hook, exactly one supported native resend created one private proof and one unclaimed pending mail item with a 1,800-second application expiry. All workers stayed stopped; exact-run cleanup removed the probe. Auth logs showed zero native sends for both that capture and the later full test suite. No participant message was sent. Actual native OTP expiry, delivery/inbox receipt and browser ownership completion remain separate checks.

A fresh TEST Auth settings read confirms Email enabled, confirmation required, and anonymous/Phone/OAuth/SAML/passkeys disabled. Native password validation rejected an 11-ASCII-character synthetic password and accepted 12 through supported admin creation; exact-run cleanup removed the fixture and Auth logs showed zero mail sends. Native expiry and saved URL settings still need their own evidence. The private password gateway remains disabled pending actual TEST key retirement and native gateway proof. Never copy TEST readiness to demo.
