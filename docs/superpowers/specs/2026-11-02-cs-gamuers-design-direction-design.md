# CS-GAMUERS design direction proposal

Status: direction and subsequent design system approved by the product owner on 2026-11-02. The canonical design baseline is DESIGN_SYSTEM.md version 1.0.0.
Date: 2026-11-02
Scope: design documentation and representative screen designs; no application implementation.

[PRD](../../../PRD.md) governs behavior and permissions. [TRD](../../../TRD.md) governs technology and verification. This proposal records the rationale for the approved root `DESIGN_SYSTEM.md`; its original recommendations below are historical, not competing current rules.

## Direction

A calm, content-first learning workspace for college students and school staff. Use neutral surfaces, an indigo action color, readable typography, clear status labels, and restrained borders. Distinguish roles through their available work rather than separate visual themes. AI remains a supporting feature alongside courses, quizzes, and career guidance.

These are design recommendations based on the supplied reference and project requirements, not validated user-research findings.

## Agreed direction decisions

| Area | Recommendation | Reason and tradeoff |
|---|---|---|
| Visual character | Minimal, approachable, flat surfaces; shadows reserved for overlays | Keeps lesson content and staff tasks prominent; intentionally modest branding |
| Accent | Retain indigo, with `#4F46E5` for primary actions | Preserves the reference direction; white text has approximately 6.29:1 contrast |
| Theme | Light theme for the initial design scope | One complete, testable theme; dark mode requires a separately designed and verified palette |
| Typography | Inter with system fallback; system monospace for course code | One UI family; defer an additional downloadable code font unless examples demonstrate a need |
| Icons | One outlined family; Lucide proposed | Consistent with the reference; library adoption is a later implementation decision |
| Navigation | Desktop sidebar and a mobile menu drawer; no initial bottom tab bar | Keeps one navigation hierarchy across four roles; mobile destinations require opening the menu |
| Density | Comfortable reading/student views; moderately compact staff tables and authoring | Shared tokens with purposeful layout differences, not four separate systems |
| Accessibility | WCAG 2.2 AA target; project preference of 44px control targets | A target to verify, not a claim of conformance; inline links and dense controls need explicit treatment |
| Motion | Brief feedback and overlay transitions; reduced-motion alternatives | Communicates state without ornamental entrance choreography |

## Proposed foundations

The values below are candidates, not a complete token contract. Define each value once in the future design system and reference semantic roles from components.

| Role | Candidate |
|---|---|
| Page / content surface | `#F9FAFB` / `#FFFFFF` |
| Primary / secondary text | `#111827` / `#4B5563` |
| Primary action / foreground | `#4F46E5` / `#FFFFFF` |
| Primary hover / pressed | `#4338CA` / `#3730A3` |
| Focus indicator | `#4F46E5`, separated from the control by a contrasting offset |
| Decorative divider / control border | `#E5E7EB` / `#6B7280` |
| Success text / surface | `#047857` / `#ECFDF5` |
| Warning text / surface | `#92400E` / `#FFFBEB` |
| Error text / surface | `#B91C1C` / `#FEF2F2` |
| Information text / surface | `#1D4ED8` / `#EFF6FF` |

Use 16px body/input text and generally 14px supporting text. Reserve 12px for nonessential metadata. Start with a 4px spacing unit, 8px control/card radii, and 12px overlay radii. Keep prose around 60–75 characters per line. Compact account forms may use a 480px maximum; content authoring needs a wider workspace.

Grid columns follow available content width, including sidebar and gutters. Do not force three 280px cards into a 1024px viewport with a 256px sidebar. All core flows must work at 320 CSS px under TRD §6.5.

## Role and workflow coverage

Navigation labels and grouping remain provisional. Required destinations must remain discoverable even if nested under a broader section.

| Role | Work that must be represented |
|---|---|
| Student | Dashboard with badges; course discovery; My learning; optional skills assessment; learning profile; suggestions; roadmap; private AI conversations |
| Faculty | Student application review; owned courses and career paths; owned shared assessment; student results only for currently owned courses |
| Program Head | Content review and retirement; content/ownership overview and transfers; aggregate reports without individual learning records |
| Administrator | Student/faculty applications; invitations; account support and permitted role changes; administrative history |

All users need applicable account and sign-out actions. Pending, correction-requested, rejected, and deactivated access states need their own permitted experience. Hiding navigation is not authorization enforcement.

Preserve the following boundaries in screen examples:

- `QUIZ-05–08`: distinguish saving, saved, save failure, uncertain submission, and confirmed result. A failed attempt leaves the quiz In progress; prior passage remains Passed.
- `ASSESS-01–05`: optional assessment with topic feedback and no pass/fail outcome.
- `CONTENT-05–08`: an existing published revision can coexist with changes under review; archived courses remain accessible to entitled existing learners.
- `ROAD-02–08`: preview before acceptance/replacement; unavailable unstarted courses remain visible; estimates are conditional and approximate.
- `AI-02`, `AI-05–07`: visible privacy reminder, shared allowance/reset time, usable saved content during unavailability, and conversation deletion/expiry.
- `P-07`: report suppression applies to both small participation groups and quizzes with fewer than five contributing students. Three demonstration Students must not produce protected statistics.
- `ACC-01`, `P-03`, `P-06`: preserve student numbers as entered text, preserve invalid form data, and support keyboard use and meaningful errors/statuses.

## Representative designs to validate next

1. Student learning view: course content, retained revision, progress, and narrow-screen navigation.
2. Quiz view: answer selection, save failure, uncertain submission, result, and retained passage on retake.
3. Faculty authoring view with a related Program Head review view: incomplete draft, submission errors, review reason, and changed-submission protection.
4. Program Head report: ordinary aggregate layout and privacy-suppressed state, with readable filters on narrow screens.

These are review artifacts, not application features. Include 320px, intermediate, and desktop widths; check keyboard/focus intent, long content, contrast pairs, and reduced-motion intent. Actual browser, screen-reader, and device checks follow implementation.

## Documentation boundaries and acceptance

- Root `DESIGN_SYSTEM.md`: approved principles, semantic tokens, reusable component states, accessibility rules, and requirement-ID traceability.
- Feature design references: scoped role/workflow layouts applying the shared system; the current [role authentication reference](../../design/authentication/role-authentication.md) owns that plan's screens.
- Local plan: scope, open decisions, and verification progress.

Before accepting the design document, resolve the direction decisions above, check all selected foreground/background pairs, remove duplicated token definitions, and review critical states against the current PRD/TRD. Do not claim compatibility with an external design-file schema without validating its actual structure.

## Guidance used

Used the repository's `ui-ux-pro-max` skill and its focused accessibility guidance from the preceding review. Design-system searches for `education learning platform minimal accessible` and `LMS education` did not produce a verified whole-product match: results included marketing layouts, an AI-first style, and children's typography. Those generated systems were not adopted or persisted. This proposal uses project-specific judgment with applicable general guidance instead.

The owner first agreed to this direction, then approved [DESIGN_SYSTEM.md](../../../DESIGN_SYSTEM.md) after review and refinement of the representative previews. This proposal is historical rationale; the root design system contains the final shared rules, including the compact review-selector exception. The original previews were retired on 2026-11-07; historical verification is retained in [the documentation plan](../plans/2026-11-02-cs-gamuers-design-system-plan.md). User testing, final font/icon integration, and application accessibility verification remain future work.
