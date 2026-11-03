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
configured; the test secret key remains pending. The isolation guard passed with
that configuration and a read-only test Auth settings request returned HTTP 200
using the test publishable key. This is not sign-in or application integration
proof. Do not run bootstrap, global,
reset, or integration operations against the demo project. Never reset either shared
project; later fixtures must clean only their recorded test-owned IDs.

| Prerequisite | Measured state |
| --- | --- |
| Demo target eligibility | Empty hosted project inspected; eligible |
| Separate free test target | Created, healthy, distinct and empty; local URL/publishable/ref and read-only Auth settings check passed; secret/app integration pending |
| Gmail app-password eligibility | TLS connection and SMTP authentication passed; no mail sent or receipt proven |
| Controlled school inboxes | Two Student school-domain addresses supplied; third pending; inbox control/receipt unverified |
| LAN HTTPS origin | School group-member hotspot planned; final origin/reachability pending that network |
| Caddy | Portable v2.11.7 installed locally; loopback config adaptation passed; runtime validation pending |
| Phone certificate trust and Wi-Fi access | Unverified on intended iPhone and Android |
| Auth redirect allowlists | Unverified |

## Local configuration

Use `.env.example` as a variable-name checklist; populate an ignored local env
file. Local demo values have been migrated from the old browser-prefixed names
to `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`; the demo project reference is
also configured. Configuration deliberately does not fall back to browser-prefixed
names. The local-only preparation was performed separately from the tracked
configuration implementation. Keep secret keys, SMTP credentials, identities and fixture manifests
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
No message was sent; actual delivery and receipt remain unverified.

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

The current network is not the demonstration network. The owner plans a group
member's hotspot at school; the final origin, Wi-Fi reachability, phone trust and
redirect settings must be measured there. The current Mac address is not an
approved demonstration origin and has not been assigned to `APP_ORIGIN`.

Portable Caddy v2.11.7 is installed at `.playwright-cli/tools/caddy` (ignored),
using the official macOS Intel archive after SHA-256 verification against release
metadata. Version/help checks passed. `caddy adapt` passed with a temporary
loopback HTTPS origin, confirming an internal issuer and `127.0.0.1:3000`
upstream. Adaptation does not establish runtime validity. `--validate` was not
used because it provisions modules; no server was started, certificates generated,
trust stores changed, or listener/firewall settings configured. See the
[official CLI documentation](https://caddyserver.com/docs/command-line).

The root `Caddyfile` is a placeholder using the process environment's
`APP_ORIGIN`. Caddy does not automatically load Next.js `.env` files: supply the
approved value to its process separately. No LAN origin has been invented.
Once the final origin is approved and certificate provisioning is ready, use
`.playwright-cli/tools/caddy validate --config Caddyfile` before running it. Next must listen only on
loopback, for example `npm run dev -- --hostname 127.0.0.1`.

The implementation operator will configure Caddy and, with the holders,
install/trust its internal CA root certificate on each intended phone.
[Caddy's HTTPS documentation](https://caddyserver.com/docs/automatic-https)
explains that each client must trust the local CA. Verify the exact HTTPS origin
from iPhone Safari and Android Chrome over the intended Wi-Fi, and configure the provider's site/redirect allowlists to the
approved origin and implemented email flow. Check actual mail receipt and link
round trips before acceptance. Do not bypass TLS verification, use public
tunnels, enable payment, or treat desktop browser emulation as phone proof.
The final-network provisioning, trust and rehearsal steps remain unexecuted.

## Current checks

`npm test -- tests/unit/env.test.ts` covers configuration and test-target refusal
without loading local credentials or contacting providers. Run `npm test`,
`npm run typecheck`, `npm run lint`, and `npm run format:check` for local checks.
Browser/device, SMTP delivery, sign-in and application integration tests remain pending; no test
skip is evidence that an unavailable provider prerequisite passed. Tasks 2–7
remain blocked on their documented prerequisites.
