# Local demonstration readiness

Task 1 configuration is implemented; provider and physical-device proof is pending.
No authentication or course-draft feature is implemented by this task.

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
| Controlled school inboxes | Two Student school-domain addresses supplied; third pending; inbox control/receipt unverified |
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
provider redirect mutation was used. The existing home page is the only HTTP
content tested; authentication remains unimplemented. Current Wi-Fi phone trust,
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
Browser/device, participant SMTP delivery, sign-in and application integration
tests remain pending; no test
skip is evidence that an unavailable provider prerequisite passed. Tasks 2–7
remain blocked on their documented prerequisites.
