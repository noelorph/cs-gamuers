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
