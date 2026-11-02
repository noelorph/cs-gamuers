# shadcn/ui setup

Scope: owner-authorized documentation and installation of the component foundation. No product feature, backend, provisioning, deployment, or commit is included.

Canonical specification: [DESIGN_SYSTEM.md](../../../DESIGN_SYSTEM.md), [TRD.md](../../../TRD.md), and [ARCHITECTURE.md](../../../ARCHITECTURE.md).

- [x] Record shadcn/ui as the selected component foundation.
- [x] Install pinned dependencies and configure component aliases and shared styles.
- [x] Add a minimal starter set, adapting it to the approved light theme and existing no-Preflight setup.
- [x] Verify component behavior, formatting, lint, types, tests, and build/browser smoke checks.

Preserve the existing home screen and uncommitted design artifacts. Add components on demand after the starter setup; no bulk catalog installation. Evidence and exact installed versions will be recorded on completion.


Completion evidence:
- Installed shadcn CLI 4.23.0, Radix UI 1.8.1, Lucide React 1.66.0, class-variance-authority 0.7.1, cn 0.5.1, and tw-animate-css 1.4.0 with exact pins.
- Added Button, Card, Input, Textarea, Badge, and Dialog; mapped the approved light-theme tokens, control sizing, focus, and reduced-motion behavior. Global CSS moved to the architecture's src/styles path; Preflight remains omitted.
- Formatting, ESLint, TypeScript, three unit tests, and production build passed. Unit checks cover disabled buttons, link composition, dialog naming, Escape dismissal, and focus restoration.
- Chromium home smoke test passed using a temporary configuration on port 3107 because port 3000 was already occupied. Temporary configuration removed; existing server left alone.
- Runtime-only npm audit: zero advisories. Full install: 22 development-tooling advisories (2 low, 20 moderate); no forced upgrades/downgrades.
- Not checked: visual/accessibility conformance of future composed product screens. No Inter font installation, feature implementation, provisioning, deployment, or commit.

## Owner-approved alignment follow-up — 2026-11-02

Scope: correct current-status documentation and align existing UI primitives to the approved design contract. Preserve historical evidence, product rules, component exports, and the starter home page. No dependency installation, host-tool setup, provider changes, or commit is authorized by this follow-up.

- [x] Standardize desktop gutters on the owner's selected 24px in the canonical token, width example, and preview snapshot.
- [x] Update stale PRD/design/setup descriptions; distinguish the existing empty hosted Supabase project from unimplemented integration.
- [x] Align icon stroke/control sizes, action colors, badge typography/wrapping/status pairs, responsive card padding, and dialog layers/shadow/timing/viewport scrolling.
- [x] Recheck local links, token consistency, preview behavior, existing unit tests, formatting, lint, types, build, and browser smoke; inspect actual component styling in Chromium.

Callers checked: shared components currently have no product-route consumers. Dialog composes Button; unit tests exercise Button/Dialog. Existing exports and variants are retained; status badge variants supply the documented semantic colors. The public Badge default becomes neutral.

### Dependency investigation and deferred installations

The owner deferred Caddy until local HTTPS/account work and ClamAV until PDF/resource work. No installation occurred. The owner approved advisory investigation, with proposed package changes to be reviewed before installation.

Registry metadata and the current audit identify two underlying advisories propagated across 22 development-package entries:

- [minimatch glob-pattern denial of service](https://github.com/advisories/GHSA-g3hv-75wg-m249): patched in 11.0.1. Installed dependency chains use 3.1.5 and 10.2.6. Latest ESLint 10.14.0 still requests minimatch ^10.2.6; current import/React/accessibility plugins retain ^3.1.2 and do not declare ESLint 10 peer support. eslint-config-next 16.4.4 retains those plugin chains. A major ESLint upgrade alone does not resolve this advisory.
- [deepmerge prototype poisoning](https://github.com/advisories/GHSA-gcqx-w48m-w2h4): no published patched version. Installed shadcn 4.23.0 is still the registry's latest and depends on affected deepmerge ^4.3.1, directly and through its registry package.

Owner decision (2026-11-02): retain the current versions and recheck upstream compatible fixes before the next tooling update. No compatible complete remediation was identified in the inspected latest dependency chains. Do not force minimatch 11 across callers written for earlier APIs or accept npm's suggested old-major downgrades merely to reduce the count. The findings affect developer tooling, not the runtime dependency tree; this is not a claim that development-tool exposure is zero. No package manifest or lockfile was changed.

- [ ] Before the next tooling update, rerun the dependency audit and check upstream patches and peer compatibility; present concrete package changes for review before installation. This is a tracked follow-up, not scheduled background monitoring.

### Alignment verification

- All 94 canonical YAML tokens match the preview CSS snapshot and references resolve. All 722 local Markdown destinations resolve, all 94 product/operating requirements remain mapped, and all 30 diagram pairs exist with parseable SVGs.
- Existing preview assertions pass for nine pages at 320/768/1024/1440px, interaction states, and 200% text. Checks ran on temporary copies; the gutter correction preserves the existing 24px rendering, so tracked screenshots remain unchanged.
- Formatting, lint, TypeScript, three unit tests, a fresh production build, and the Chromium home smoke test pass. The first cached build reused old CSS; a clean build with permission for the CSS worker's local port produced the current rules. No framework configuration or dependency workaround was introduced.
- A temporary Chromium fixture rendered the actual shared components with fresh production CSS at 320/768/1440px. It verified semantic colors, 2px icon strokes/20px control icons, badge wrapping, responsive card padding, dialog layers/shadow/200ms entry, viewport bounds/internal scrolling, Escape/focus return, enlarged text, and reduced motion. This is scoped component evidence, not a full application accessibility audit.
- The rendered check caught offscreen initial focus in a long dialog. The close control now precedes the content in reading order, supplying visible initial focus by default; the existing unit test verifies it. Caller-provided Radix focus handling remains available.
- No package/lockfile, provider, product-route, or original DOCX changes. No installations or commits. Real devices, screen readers, complete product flows, and live provider integration remain unverified.

### Commit authorization — 2026-11-02

After reviewing the alignment and retaining the current dependency versions, the owner explicitly requested committing the changes. This supersedes the earlier no-commit scope for this completed alignment only; it does not authorize a remote push, installation, provisioning, or deployment.
