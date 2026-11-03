# Local demonstration readiness

Task 1 configuration is implemented; provider and physical-device proof is pending.
No authentication or course-draft feature is implemented by this task.

## Project roles and evidence

Read-only inspection on 2026-11-03 found the existing hosted project healthy,
with zero Auth users, zero storage objects and zero application tables. Its local
configured URL matches that inspected project. It is eligible for the demo-only
role; it is not an integration-test target. No real school records were found.

The selected organization is on the free plan. Separate test-project provisioning
is pending owner confirmation of the quoted $0/month action. No separate test
connection or credentials have been verified. Do not run bootstrap, global, reset,
or integration operations against the demo project. Never reset either shared
project; later fixtures must clean only their recorded test-owned IDs.

| Prerequisite | Measured state |
| --- | --- |
| Demo target eligibility | Empty hosted project inspected; eligible |
| Separate free test target | Pending provisioning and connection proof |
| Gmail app-password eligibility | Pending owner/provider verification |
| Controlled school inboxes | Availability and real receipt unverified |
| LAN HTTPS origin | Exact approved origin pending |
| Caddy | Not installed or available on PATH during inspection |
| Phone certificate trust and Wi-Fi access | Unverified on intended iPhone and Android |
| Auth redirect allowlists | Unverified |

## Local configuration

Use `.env.example` as a variable-name checklist; populate an ignored local env
file. Existing local configuration uses `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; migrate those values locally to
`SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. Configuration deliberately does
not fall back to browser-prefixed names. No local environment file was changed
by this task. Keep secret keys, SMTP credentials, identities and fixture manifests
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

## Local HTTPS preparation

The root `Caddyfile` is a placeholder using the process environment's
`APP_ORIGIN`. Caddy does not automatically load Next.js `.env` files: supply the
approved value to its process separately. No LAN origin has been invented.
Once Caddy is installed and an origin approved, validate the configuration with
`caddy validate --config Caddyfile` before running it. Next must listen only on
loopback, for example `npm run dev -- --hostname 127.0.0.1`.

Use Caddy's internal CA and install/trust its root certificate on every intended
phone. Verify the exact HTTPS origin from iPhone Safari and Android Chrome over
the intended Wi-Fi, and configure the provider's site/redirect allowlists to the
approved origin and implemented email flow. Check actual mail receipt and link
round trips before acceptance. Do not bypass TLS verification, use public
tunnels, enable payment, or treat desktop browser emulation as phone proof.
These steps describe outstanding work; they have not been executed.

## Current checks

`npm test -- tests/unit/env.test.ts` covers configuration and test-target refusal
without loading local credentials or contacting providers. Run `npm test`,
`npm run typecheck`, `npm run lint`, and `npm run format:check` for local checks.
Browser/device, SMTP, hosted Auth and integration tests remain pending; no test
skip is evidence that an unavailable provider prerequisite passed. Tasks 2–7
remain blocked on their documented prerequisites.
