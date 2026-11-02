# Design review: representative screens

Status: reviewed by the owner; the shared design system was approved as version 1.0.0 on 2026-11-02 after the requested refinements. These are representative design artifacts, not complete screen coverage, application routes, or implemented product features.

Open [the learning preview](learning.html) in a browser, then expand **Design preview · choose a screen** at the top to navigate between examples. Files work locally without a server, accounts, network calls, or installation. The mobile Menu opens a native modal drawer; radio choices and text fields can be exercised. Only preview links navigate. Gray application actions and sidebar destinations are intentionally illustrative; their disabled appearance does not redefine product permissions or availability.

All content is fictional. System-font fallback is used unless Inter is already installed; no font is downloaded. These standalone previews do not load Lucide; the application separately has Lucide React installed. These examples validate layout and states, not final Inter metrics or Lucide treatment.

The Program Head review preview includes a four-mode selector beside the Published/Submitted indicators: Review submission, Request changes, Approve publication, and Reject submission. Changes/rejection reveal a required reason; approval reveals its publication action without a reason field. Refresh the stale example first to enable simulated decisions. No decision persists or publishes content. A typed reason survives mode changes. Administrators do not receive these content-review permissions.

At the owner's request, this selector matches the indicators' compact pill size (29px at the default font size) with a visually hidden accessible label. This is a deliberate exception to the preferred 44px control height; it remains above the 24px minimum and grows with text enlargement.

## Screens and states

| Preview | Review focus | Requirement references |
|---|---|---|
| [Course learning](learning.html) | Archived but accessible revision, reading width, required-quiz count and outline | CONTENT-03, CONTENT-06–08; DISC-04; PROGRESS-01–02 |
| [Quiz: saved](quiz.html) | Clear question/choices, saved state, question navigation layout | QUIZ-01, QUIZ-05 |
| [Quiz: save failed](quiz-error.html) | Retained visible selection, persistent failure and retry affordance | QUIZ-05; P-03 |
| [Quiz: uncertain submission](quiz-uncertain.html) | Checking the outcome without inviting duplicate submission | QUIZ-06–07 |
| [Quiz: retake result](quiz-result.html) | Below-threshold latest result alongside persistent Passed state | QUIZ-04, QUIZ-08 |
| [Faculty authoring](authoring.html) | Existing publication plus incomplete revision, field error, resource error | CONTENT-02, CONTENT-05; P-02–03 |
| [Program Head review](review.html) | Required reason and stale-submission protection | CONTENT-04–05; P-03 |
| [Aggregate report](reports.html) | Start-date cohort, current completion, independent quiz suppression | REPORT-01–02; P-07 |
| [Small-group report](reports-small.html) | Three participants with no protected breakdowns/statistics | P-07 |

The learning and quiz-state examples are independent fixtures. The retake-result example assumes an earlier pass; it is not a simulated continuation of the in-progress course example. The result shows one illustrative feedback item, not a complete five-question review.

The Faculty example assumes ownership of the shared assessment. No administrative feature screens were added: this stage covers the agreed representative learning, quiz, authoring/review, and reporting families. The full role responsibility matrix remains in [DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md).

## Visual evidence

Screenshots of every preview at 320px and 1440px are in [screenshots/](screenshots/). Start with these comparisons:

Desktop captures show the viewport with independently scrollable main content; open the HTML to inspect content below the fold. Mobile captures show the full document.

| Screen | Desktop | Small phone |
|---|---|---|
| Learning | [1440px](screenshots/learning-1440.png) | [320px](screenshots/learning-320.png) |
| Save failure | [1440px](screenshots/quiz-error-1440.png) | [320px](screenshots/quiz-error-320.png) |
| Authoring | [1440px](screenshots/authoring-1440.png) | [320px](screenshots/authoring-320.png) |
| Review | [1440px](screenshots/review-1440.png) | [320px](screenshots/review-320.png) |
| Reports | [1440px](screenshots/reports-1440.png) | [320px](screenshots/reports-320.png) |

## Findings

- The 1024px sidebar transition works without page overflow. The learning outline stacks below the lesson at constrained widths rather than squeezing the reading column. Keep this content-driven behavior when implementing the shell.
- Owner-requested refinement: desktop sidebar stays stationary while main content scrolls. Page headings align with the sidebar brand; the repeated workspace eyebrow and extra top margin are removed. At short window heights only the sidebar navigation scrolls, keeping brand/account information in place.
- Viewport-fit refinement: reduce desktop insets and excess gaps, compact the preview chooser, and remove the repeated design disclaimer at each page bottom (the top preview notice remains). Ordinary screens should fit without scrolling when their content allows; long forms/lessons and enlarged text retain natural overflow. Text sizes and 44px control minimums are preserved.
- Report columns need local horizontal scrolling at 320px. A visible instruction and focusable, named table region preserve the table structure without widening the page. A stacked report layout can be revisited if owner review finds this too cumbersome.
- Persistent notices make the failure and revision states legible, but add height on phones. They contain essential information; do not hide them in tooltips or transient toasts to shorten the page.
- Quiz passage and attempt result must remain separate. The retake example deliberately pairs a 60% attempt with a prior Passed state.
- Small-group reports need an intentional explanation, not empty metric cards or hidden underlying values. The small-group HTML contains no completion or score fixtures.
- Font and icon fidelity remain unfinished. The readable system-font rendering does not establish that all layouts work identically with Inter loaded.

## Verification performed

Used the repository **ui-ux-pro-max** skill, including focused searches for `keyboard focus modal` and `badge chip label wraps`. Applied its guidance on visible/unobscured focus, contextual status labels, labeled controls, and narrow-layout review. The skill's preference for single-line compact labels is subordinate to the agreed requirement to retain full meaning under enlargement; essential status labels remain available if wrapping is necessary.

Run the existing installed browser tooling from the repository root:

```sh
node docs/design/check-preview.mjs
```

The check saves screenshots and asserts:

- Nine previews at 320, 768, 1024, and 1440px: no page-wide horizontal overflow.
- At desktop widths, all nine page headings align with the sidebar brand, which stays stationary when main content scrolls. A 1024×480 window exercises independently scrolling navigation and visible account information.
- Fit checks cover saved quiz, retake result, uncertain submission, and small-group report at 1366×768. Long lessons and forms may still need scrolling even on desktop; a short-window check confirms longer content retains natural overflow.
- Each screen has one main heading and labels for all input/select/textarea controls.
- At 320px, doubled root text size still produces no page-wide horizontal overflow.
- The mobile drawer opens, prevents background control focus, closes with Escape, and restores focus/expanded state.
- Radio selection works, and the save-retry preview link opens the saved-state fixture.
- Review modes show the appropriate fields/action at 320px and 1440px, retain entered reasons, require reasons for changes/rejection, and block decisions until the stale example is refreshed.
- The small-group fixture excludes protected example statistics; uncertain submission offers no resubmit; a retake result preserves the Passed label.
- No page JavaScript errors during those checks.

These assertions passed in installed Chromium on 2026-11-02. Reduced-motion preference was enabled for the later interaction/reflow checks; this preview contains no animated transitions. Desktop/mobile screenshots were inspected for hierarchy, spacing, error visibility, and table containment. Native dialog Tab behavior can reach browser chrome; the check tests inert background focus rather than asserting that `document.activeElement` can never temporarily be the body.

Not verified: screen-reader output, real touch devices, other browser engines, 400% browser zoom, actual Inter loading, icon rendering, runtime save/grade/retry behavior, permissions, or database privacy enforcement. Fixture checks are not security tests. No backend or provider was called. No application lint/build/integration suite was needed because `src/`, dependencies, and configuration were unchanged.

## Asset maintenance and approval

`tokens.css` is a generated review snapshot of the canonical YAML in `DESIGN_SYSTEM.md`. It is not a second token authority or the future application stylesheet. If canonical tokens change, regenerate the snapshot, rerun this check, and replace its screenshots. `preview.css` and `preview.js` serve these artifacts only; do not copy their simplified controls into the application as finished components.

The owner approved the design system after reviewing these examples and refining the shell, viewport spacing, quiz actions, and review selector. Remaining product screens and final navigation grouping will apply this baseline in later scoped design work. Application implementation and runtime verification are separate stages.
