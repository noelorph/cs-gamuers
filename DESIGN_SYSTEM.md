# CS-GAMUERS design system

Version: 1.0.0 · Approved: 2026-11-02

Status: approved by the product owner after review of the representative previews and requested refinements. This is the shared design baseline. Initial Chromium preview checks passed; complete product screen coverage and application verification remain future work.

This document defines visual foundations and reusable interaction rules for the browser-based supplemental learning application. [PRD.md](PRD.md) governs behavior and permissions; [TRD.md](TRD.md) governs technology and technical guarantees; [ARCHITECTURE.md](ARCHITECTURE.md) governs implementation structure. A design example never grants a permission or changes a product rule.

The [direction proposal](docs/superpowers/specs/2026-11-02-cs-gamuers-design-direction-design.md) records the agreed direction. The [documentation plan](docs/superpowers/plans/2026-11-02-cs-gamuers-design-system-plan.md) records completion and evidence. [Representative screen previews and evidence](docs/design/README.md) live in `docs/design/`. This approval covers the design system, not application implementation, dependency installation, commits, or deployment.

## 1. Principles and scope

- **Content first.** Prioritize lessons, questions, feedback, and decisions. AI supports learning; it does not dominate navigation or visual identity.
- **Clear responsibility.** Each account has one role. Show its permitted work, current ownership, and applicable reasons. Hidden controls do not replace server authorization.
- **Accessible interaction.** Target WCAG 2.2 AA, with keyboard access, readable contrast, visible focus, and meaning beyond color. Conformance requires implementation testing.
- **Honest feedback.** Distinguish pending, confirmed, failed, and uncertain outcomes. Never claim a save, submission, or completion before confirmation.
- **Continuity.** Preserve entered data and retained learning records; explain revisions, archiving, and roadmap replacement without implying lost progress.
- **Restraint.** Use a neutral foundation, indigo actions, one UI font, and purposeful motion. No ornamental gradients, dashboard illustrations, or entrance choreography.

Initial scope is a light theme with Inter, system monospace for code, and one outlined Lucide icon family. No bottom tab bar or dark theme is specified. Font integration remains later implementation work. No custom logo is defined; use the CS-GAMUERS wordmark until an approved asset exists.

### Component foundation

The owner selected shadcn/ui and authorized its installation on 2026-11-02. Use locally owned shadcn components in `src/components/ui/`, the Radix-based `new-york` registry foundation, Tailwind CSS, and Lucide React. The registry style is an implementation starting point; this document's colors, control sizes, radii, focus behavior, and interaction requirements override its defaults.

Keep shadcn configuration in `components.json`, the shared `cn` utility in `src/lib/utils.ts`, and global styles/token mappings in `src/styles/globals.css`, as required by the architecture. Use shadcn/ui for standard buttons, forms, selectors, dialogs, menus, tables, tabs, and feedback primitives; compose domain-specific screens from those shared components rather than recreating equivalent controls. The installed starter set is Button, Card, Input, Textarea, Badge, and Dialog. Add other components as features need them; do not install the whole catalog or a second component system. Review generated code and dependency changes before accepting additions. Preserve the existing no-Preflight decision with component-scoped base styling rather than a global reset. Component primitives do not establish accessibility conformance without testing their actual use.

## 2. Token contract

The following YAML block is the only token definition in this document. Names describe purpose; components reference these tokens rather than copying raw values. References use `{group.name}`. Exact layout algorithms and content-dependent dimensions need not become tokens merely to avoid every literal.

This is a project-specific YAML/Markdown contract inspired by DESIGN.md, not a claim of compatibility with an external parser or schema. Implementation should map it to shared CSS variables/Tailwind theme values without maintaining a competing palette. Page specifications may select tokens, not silently redefine them.

```yaml
colors:
  surface-page: "#F9FAFB"
  surface: "#FFFFFF"
  surface-muted: "#F3F4F6"
  text-primary: "#111827"
  text-secondary: "#4B5563"
  border-subtle: "#E5E7EB"
  border-control: "#6B7280"
  action-primary: "#4F46E5"
  action-hover: "#4338CA"
  action-pressed: "#3730A3"
  action-foreground: "#FFFFFF"
  selected-surface: "#EEF2FF"
  selected-text: "#4338CA"
  focus-ring: "#4F46E5"
  focus-gap: "#FFFFFF"
  success-text: "#047857"
  success-surface: "#ECFDF5"
  warning-text: "#92400E"
  warning-surface: "#FFFBEB"
  error-text: "#B91C1C"
  error-surface: "#FEF2F2"
  info-text: "#1D4ED8"
  info-surface: "#EFF6FF"
  danger-action: "{colors.error-text}"
  danger-hover: "#991B1B"
  danger-pressed: "#7F1D1D"
  danger-foreground: "{colors.action-foreground}"
  disabled-surface: "{colors.surface-muted}"
  disabled-text: "{colors.text-secondary}"
  scrim: "rgba(0, 0, 0, 0.5)"
typography:
  family-ui: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  family-code: "ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', monospace"
  metadata: "0.75rem"
  supporting: "0.875rem"
  body: "1rem"
  title-card: "1.125rem"
  title-section: "1.25rem"
  title-page: "1.5rem"
  title-feature: "1.875rem"
  weight-normal: 400
  weight-medium: 500
  weight-semibold: 600
  weight-bold: 700
  leading-heading: 1.25
  leading-body: 1.5
  leading-reading: 1.625
spacing:
  none: "0px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  3xl: "48px"
  4xl: "64px"
layout:
  sidebar: "256px"
  content-max: "1200px"
  form-max: "480px"
  authoring-max: "960px"
  reading-max: "70ch"
  card-preferred-min: "280px"
  drawer-max: "320px"
  dialog-max: "480px"
  toast-max: "360px"
  gutter-small: "{spacing.lg}"
  gutter-medium: "{spacing.xl}"
  gutter-large: "{spacing.2xl}"
breakpoints:
  medium: "768px"
  desktop: "1024px"
  wide: "1280px"
borders:
  default: "1px"
  emphasis: "2px"
  focus: "3px"
  focus-offset: "2px"
radii:
  small: "4px"
  control: "8px"
  overlay: "12px"
  pill: "9999px"
sizes:
  control-min: "44px"
  icon-inline: "16px"
  icon-control: "20px"
  icon-navigation: "24px"
  icon-stroke: "2px"
  progress-height: "6px"
shadows:
  overlay: "0 4px 16px rgba(0, 0, 0, 0.12)"
layers:
  base: 0
  sticky: 10
  overlay: 20
  dialog: 30
  toast: 40
motion:
  feedback: "100ms"
  overlay-enter: "200ms"
  overlay-exit: "150ms"
  easing: "cubic-bezier(0.4, 0, 0.2, 1)"
```

### Color use

Use primary text for headings/body and secondary text for supporting content, including placeholders. Both must remain readable on their actual surface. Use `border-subtle` only for decorative grouping, not as the sole visual boundary of an input. Inputs use `border-control`.

Primary and danger actions use their paired foreground. Status badges use their matching status text/surface pair, a label, and an optional redundant icon. Neutral status uses secondary text on the muted surface. Do not use success/error colors to imply an assessment pass/fail result.

Focus uses a solid ring and contrasting gap so it remains distinguishable beside filled actions. Check the composed ring against every surrounding surface, including selected rows and overlays. Scrims and shadows are not substitutes for legibility or focus checks.

### Typography, spacing, and icons

Body text and inputs use 1rem; supporting text, helper text, and important notices use 0.875rem or larger. Reserve metadata size for nonessential timestamps and captions. Rem units respect user font preferences; do not force a fixed root font size. Use heading weights to express hierarchy without all-uppercase table headers or decorative tracking.

Use normal line height for UI and reading line height for lessons. Keep long prose near the reading maximum, allow headings to wrap naturally, and let URLs/IDs wrap without splitting ordinary words indiscriminately. Use tabular figures for changing counts. Code blocks may scroll within a named region; surrounding prose must reflow.

Use consistent spacing to group related fields and separate sections. Cards default to large padding on small screens and extra-large padding where room permits. Overlays use extra-large padding. Keep layouts flexible under text enlargement.

Use outlined Lucide icons with the token stroke width. Decorative icons beside equivalent text are hidden from assistive technology. Icon controls have accessible names and expose expanded/pressed/selected state where applicable. No emoji as structural icons. A small glyph can sit inside a full-sized target.

## 3. Layout and navigation

The main landmark follows a skip link and contains one page heading, optional breadcrumb, supporting description, and the primary action where relevant. Use semantic links for destinations and buttons for actions. Secondary navigation must not duplicate the entire primary menu.

On desktop, keep the sidebar stationary while the main content scrolls independently within the available viewport height. The sidebar brand and account area remain visible; only its navigation region scrolls when space is limited, with keyboard access to that region. Align the page heading's top edge with the sidebar brand using the same top inset; do not insert a repeated role label above the heading or vertically center the page. On mobile, retain ordinary document scrolling and the menu drawer.

Fit ordinary task content within the available viewport where practical, using compact spacing rather than shrinking text or controls. Start with 24px desktop insets, 24px after the page header, and 16px after notices. Main content scrolls only when its natural height exceeds the viewport; long content, enlarged text, and small windows must remain fully reachable. Do not clip, scale down, or hide essential content to force a one-screen layout.

| Width | Shell and spacing | Content behavior |
|---|---|---|
| Below medium | Top bar, mobile menu drawer, small gutters | Single-column forms; grids grow only when their actual container fits |
| Medium to desktop | Same drawer, medium gutters | Room for paired cards where available; no fixed column count |
| Desktop and wider | Sidebar with reserved width, large gutters | Main area uses remaining width up to content maximum |

The drawer is modal: labeled trigger, expanded state, inert background, focus containment, Escape to close, and focus return. Use the same destination order as desktop. Show role and account actions consistently; do not expose a role switcher.

Card grids fit as many preferred-width cards as available space allows, shrinking to a single full-width card below the preferred minimum. For example, a 1024px viewport with a 256px sidebar and 64px of main gutters leaves 704px: two 280px cards and a 24px gap fit; three do not. A 320px viewport with small gutters leaves 288px. Never add fixed card padding outside its allocated border-box width.

Keep simple account forms within `form-max`; authoring uses `authoring-max` with stacked field groups. Labels and reading order remain clear when contextual previews sit alongside a form. No mandatory multi-column input layout.

Course reading and its outline may sit side by side when space permits. Stack the outline below the reading content when that pairing constrains the lesson; the desktop navigation breakpoint does not require a two-column lesson layout.

Tables may scroll horizontally in their own labeled, keyboard-operable region when meaningful two-dimensional structure requires it. Show a scroll cue when overflowing. Do not make the entire page scroll horizontally. Sticky headers/actions must reserve space and never hide focused elements or errors.

### Role destinations

These are required access points, not a final route map. A destination may be grouped under another section if it remains clearly discoverable.

| Role | Destinations and boundaries |
|---|---|
| Student | Dashboard including earned badges; Browse courses; My learning; Suggestions; Roadmap; AI chat; learning profile and optional skills assessment |
| Faculty | Dashboard; student applications; owned courses; owned career paths; shared assessment only if owner; student results inside currently owned courses |
| Program Head | Dashboard/review queue; content overview and ownership transfers; aggregate reports; no individual student drill-down |
| Administrator | Dashboard; student/faculty applications; invitations; account support; administrative history; no learning-results or content-authoring access |

All roles have applicable account and sign-out actions. Account status gates the shell: pending applicants see their application/status experience, not an approved-role dashboard. Account support does not expose private chat or individual learning results.

## 4. Reusable components

### Actions

| Variant | Appearance | Use |
|---|---|---|
| Primary | Primary action/foreground, hover and pressed tokens | Main next step within a task |
| Secondary | Surface, primary text, control border; muted hover | Cancel, save draft, supporting action |
| Ghost/link | Transparent, primary-action text; muted hover where appropriate | Navigation and low-emphasis actions; inline links underlined |
| Danger | Danger action/foreground, danger hover and pressed tokens | Confirm destructive action |

Controls use the minimum control height and sufficient horizontal padding, except for the explicitly approved compact review selector below. Prevent repeat activation while work is pending; retain an action-specific label such as “Submitting quiz…” and reserve space to avoid layout shifts. Do not replace the whole control with an unnamed spinner. Preserve a sensible focus position during the transition.

Use native disabled semantics where appropriate. If an unavailable action needs to remain focusable for explanation, use `aria-disabled`, enforce nonactivation, and associate the reason. No blanket opacity reduction. Do not hide prerequisite explanations solely in hover tooltips.

Confirm consequential actions with the affected item and the actual consequence. Cancellation is always safe. A confirmation does not replace password confirmation, required reasons, ownership transfer, or other product safeguards.

### Forms and validation

- Visible labels, explicit “(required)” where required, and persistent help for constraints. Use fieldsets/legends for related choices.
- Connect errors and help to the input; expose invalid state. After failed submission, focus a linked error summary for multiple errors, or the invalid field for a single error. Do not move focus on every blur.
- Preserve entered data on validation failure. Never silently truncate text. Use TRD limits and distinguish character from byte limits where relevant.
- Student number is text: “Enter your complete student number, including any leading zeros.” Do not invent a prefix, length, or numeric-only rule.
- Allow password managers and paste. Describe the selected password constraints without adding character-class requirements. Recovery acknowledgment remains generic whether an account exists or not.
- Incomplete authoring drafts can save; submitting for review validates all required content. A missing field must not make “Save draft” behave like “Submit for review.”
- PDFs show selected filename, upload/checking state, accepted result, or specific rejection. State the 10 MB limit; do not claim scanning proves a file harmless. Link/resource errors remain by their field.

### Cards, chips, and badges

Cards use surface, subtle border, control radius, and no resting shadow. Course cards expose title, topic, difficulty, brief description, and a clear destination/action. Started courses show required-quiz progress. Career cards show relevant skills/course information; recommendation cards include a relevance explanation. Badge cards show course name and original completion date.

Do not make a card with nested controls one large button. Avoid hover elevation on static information. Allow meaningful titles and status labels to wrap; if a description is shortened, the linked detail view exposes its full text. Chips wrap before labels are squeezed. Any “+n” disclosure must work by keyboard and pointer.

| Meaning | Treatment | Example icon |
|---|---|---|
| Approved, completed, passed | Success pair with exact contextual label | CircleCheck |
| Pending, in progress | Warning pair | Clock |
| Needs correction / changes requested | Warning pair plus accessible reason | TriangleAlert |
| Rejected or unsuccessful attempt | Error pair; distinguish attempt from quiz state | CircleX |
| Deactivated | Neutral label with access explanation | Ban |
| Not started | Neutral | Circle |
| Draft / archived | Neutral, distinct labels | FilePen / Archive |
| Published | Success, distinct from review state | Globe |

### Dialogs, menus, and feedback

Dialogs have a visible title, accessible name, focus containment, inert background, and explicit cancel/close. Set initial focus according to content; destructive confirmation normally starts on the safe action. Escape cancels and returns focus to the opener or a logical successor. Destructive confirmations do not close on incidental overlay clicks. Small-screen dialogs fit within the viewport and scroll internally when necessary; short confirmations do not automatically become full-screen.

Use appropriate menu, disclosure, select, and tab semantics; they are not interchangeable. Arrow-key behavior follows the selected widget pattern. Ordinary navigation links remain ordinary links.

Routine feedback is inline or politely announced. Reserve assertive announcements for urgent errors requiring immediate attention. Do not simultaneously announce every field error and an error summary. Announce changing counts as contextual phrases rather than isolated numbers.

Toasts supplement persistent state. Noncritical toasts may dismiss after five seconds; pause dismissal during hover/focus. Errors requiring action remain available until resolved/dismissed and also appear near the affected task. Toasts fit narrow screens, have labeled dismissal, and never steal focus. Essential outcomes such as quiz results remain on the page after a toast disappears.

### Tables and progress

Tables have captions or accessible names, associated headers, readable secondary header text, and clearly labeled row actions. Sort controls are buttons with direction conveyed through `aria-sort` on the header. Add selection treatment only to workflows that actually require selection; no speculative bulk operations.

Progress has a visible count and accessible name/value text, such as “3 of 5 required quizzes passed.” Use primary-action fill and a muted track; neither color nor bar length is the only source of information. Whole percentages round down and are capped at 99 while incomplete; show 100 only at actual completion. Optional quizzes and opening lessons do not increase course completion. Roadmap courses have equal progress weight. Loading progress is not learning progress.

## 5. Product-specific patterns

### Accounts and role safeguards

Represent email verification, Pending, Needs correction, Approved, Rejected, and deactivated access distinctly. Needs correction shows the reason and permits correction/resubmission of the same application. Rejected applications explain the outcome; only an Administrator can reopen them. Email verification alone never implies manual approval.

Expired/used verification, invitation, and recovery links need a clear recovery path that respects their purpose and resend limits. Recovery does not reactivate an account. Public registration offers Student and Faculty only. Approved identity corrections go through verified account support rather than ordinary profile editing.

Staff role change/deactivation screens explain ownership-transfer and last-Administrator safeguards. Student self-deactivation includes password confirmation and explains retained records and Administrator-mediated reactivation. Do not offer permanent account deletion or Student/staff conversion.

### Learning and quiz attempts

Course details show outcomes, owner, lesson outline, and completion requirements. Prerequisites are guidance, not locks. “Start course” resumes existing participation if already started. Archived content remains in My learning for entitled learners with an explanation of continued access to their retained revision.

Quiz questions use a legend and four radio choices with full-row labels. Question navigation does not enforce a new learning-order restriction. If one question is shown at a time, move focus to its heading after explicit navigation and expose unanswered questions before submission. Course quizzes are untimed, require every answer, and support unlimited retakes.

| Attempt state | Required feedback/action |
|---|---|
| Local change awaiting save | “Saving…”; do not show Saved for older data |
| Save confirmed | “Answers saved” for the latest confirmed changes |
| Save failed/connection unavailable | Persistent explanation; retain available entered answers and offer retry; do not promise offline persistence |
| Submission pending | Prevent duplicate activation and show “Submitting quiz…” |
| Submission outcome uncertain | “Checking submission…”; retrieve confirmed outcome before offering retry |
| Submission confirmed | Read-only result, score, correct answers, and faculty explanations |
| Retake | New attempt; preserve previous result and existing Passed/completed status |

Persistent quiz status is only Not started, In progress, or Passed. A below-threshold attempt does not become a “Failed” quiz. Show exact result context (correct count, total, threshold); display rounding must not imply passage. Completion badges occur once per student/course.

The separate optional skills assessment has 15 questions, an additional “I don't know yet” choice, and topic feedback without pass/fail or mastery claims. Skipping it does not block learning or profile-based suggestions. Its latest completed attempt informs suggestions; an unfinished retake does not replace that result.

Place quiz navigation and result actions below their content card, left-aligned together with a 16px gap and 24px of separation from the card. Allow wrapping on narrow screens. Align the result-status banner with the result card's width; separate score, feedback, and explanatory notes with consistent spacing.

### Authoring, review, and retirement

Display review state, publication state, and revision identity separately. For example, “Published revision 2” may coexist with “Revision 3 awaiting review.” Do not represent these as a single lifecycle badge.

Faculty can save incomplete drafts, submit complete content, and read review reasons. Program Heads can approve publication, request changes, reject, transfer ownership, and approve retirement within PRD permissions. Changes/rejections require a reason. An outdated review screen must prevent approval of changed content and direct the reviewer to the current submission.

Place a review-action selector at the right of the Published/Submitted indicator row, wrapping when needed. Its four modes are Review submission, Request changes, Approve publication, and Reject submission. Update the card's explanation and action for the selected mode. Changes/rejection reveal a required reason; approval hides that field and exposes the approval action. Preserve typed reasons when switching modes, but exclude hidden reasons from approval submission. Selecting a mode does not commit a decision or bypass the stale-submission check.

The selector uses a native select with a decorative chevron, pill radius, supporting-size text, and compact padding matching the indicators. Keep its “Review action” label accessible but visually hidden. Its 29px default height is an owner-approved exception to the preferred 44px control height; maintain at least a 24px target and allow growth with enlarged text. Preserve the visible focus indicator and keyboard behavior.

Explain that new publication leaves existing learners on their started revision. Retirement removes new discovery/start access while retaining existing learning access. Only unpublished drafts can be deleted. Career paths and the shared assessment follow their applicable PRD ownership/review rules.

### Suggestions and roadmaps

Profile completion gates personalized suggestions and roadmap requests, not ordinary browsing, studying, or general AI explanations. Show the missing prerequisite and a clear route to complete it. Optional assessment remains optional.

Suggestions explain relevance and do not start courses or activate a roadmap. A roadmap proposal has a clear preview and Accept action. Replacement names the existing active roadmap and explains that learning records/badges remain saved. No profile/content change silently replaces it.

Keep unavailable unstarted roadmap courses visible with an explanation and replacement path. Started archived courses remain usable. If the catalog cannot support the goal, explain that limitation rather than presenting a complete plan. Duration appears only when all unfinished courses have estimates and weekly hours are present; describe it as approximate, excluding completed courses and counting full estimates for unfinished courses.

### AI conversations and allowance

Keep this exact reminder near the input, readable and nondismissible:

> Your messages are sent to the AI. Do not include personal information, such as your name, student number, email, or passwords.

Show remaining allowance and “Resets at 12:00 AM Philippine time.” The 20 successful requests are shared across chat, suggestions, and roadmap requests, not separate allowances. Failed requests do not consume allowance; reading saved results does not either. Update counts from confirmed outcomes rather than optimistic decrements.

Differentiate request pending, daily allowance exhausted, provider unavailable/capacity exhausted, and input/context errors. Preserve the composed message on failure. Disable new generation when necessary, with an explanation and catalog/retry route; keep saved conversations and roadmaps readable. Do not promise 20 provider responses or enable multiple simultaneous generations for one student.

Responses remain selectable, readable content with clear author labels. Streaming is not required by this design; if later selected, avoid announcing individual tokens and announce meaningful completion without moving focus. AI cannot silently start courses, accept roadmaps, or perform privileged actions.

Provide conversation selection, new conversation, and explicit deletion. Explain expiry after 90 days since the last message and that deletion preserves accepted roadmaps/learning records and does not refund allowance. Deleted/expired content must not appear as a recoverable saved conversation.

### Reports and notices

Reports identify course, revision, date range, and the calculation context: dates select course starts; completion reflects current state. A zero denominator is “No data,” not 0% completion.

For participation groups below five, show participation count but suppress completion breakdowns and quiz statistics. Independently suppress each quiz's statistics below five contributing students, even in a larger group. Explain suppression in text; do not encode hidden values in charts, tooltips, accessible labels, or drill-downs. Deactivated students remain in historical aggregates; assessments stay separate from course-quiz results.

The three-Student demonstration should legitimately show privacy suppression. Use separate synthetic test data for larger-group checks, per TRD. Program Heads never receive individual student drill-downs.

When a decision succeeds but email fails, show the committed decision and a separate permitted delivery-failure notice. Retrying delivery does not retry the decision. There is no separate notification inbox.

## 6. Content and empty states

Use plain, respectful language. Say what happened and what the user can do. Match the PRD's concepts: course, lesson, learning resource, career path, skills assessment, quiz, badge, archive, and deactivate. “Suggestions” is the student-facing label for recommendations; “Roadmap” abbreviates personal roadmap. Never imply academic credit, career suitability, or a certificate.

| Situation | Message direction | Action |
|---|---|---|
| No filter matches | “No courses match your filters.” | Clear filters |
| Empty published catalog | “No courses are available yet. Check back later.” | No invented action |
| Incomplete profile | Explain which information is needed for suggestions | Complete learning profile |
| Complete profile but insufficient catalog | Explain limited suitable content; do not blame profile completion | Browse available courses |
| No accepted roadmap | “You haven't accepted a roadmap yet.” | Preview/request subject to prerequisites |
| Empty review queue | “No submissions are waiting for review.” | No invented action |
| AI unavailable | Explain why new responses are unavailable; existing learning remains usable | Browse courses or retry later |
| Save failure | “Your latest answers haven't saved. Check your connection and try again.” | Retry saving |

Do not surface raw provider/database errors. Never require a student number to begin with zero. Do not change generic recovery copy to disclose account existence. Critical constraints and reasons must be persistent, not placeholder-only or toast-only.

## 7. Accessibility and verification

Target WCAG 2.2 AA. Normal text needs at least 4.5:1; large text needs 3:1 (24 CSS px regular or approximately 18.67 CSS px bold). Necessary control boundaries and meaningful graphics need 3:1 against adjacent colors. Decorative borders are exempt from serving that role. Focus must remain clearly visible and unobscured.

Use 44px targets for standalone controls as a project usability preference. WCAG 2.2 AA SC 2.5.8 specifies 24×24 CSS px with exceptions; inline prose links and other exceptions need appropriate treatment rather than mislabeling 44px as the AA minimum.

Use semantic landmarks, sequential headings, a skip link, labeled controls, and visible keyboard focus. Password managers/paste must work. Any reordering interaction requires button/keyboard alternatives to dragging. Reduced-motion mode removes nonessential movement and retains explicit status text; correctness never depends on an animation-end event.

| Check | Acceptance evidence |
|---|---|
| Tokens | YAML parses; references resolve; required text/surface and control pairs meet contrast thresholds |
| Responsive | Core flows fit 320 CSS px; intermediate widths include sidebar/gutter effects; long text and zoom reflow without lost actions |
| Keyboard | Navigation, drawer/dialog, forms, quizzes, tables, and error recovery operable with visible, unobscured focus |
| Screen reader | Useful names, states, reading order, error association, and restrained status announcements |
| Product states | Permission/ownership boundaries, retained revisions, uncertain submissions, unavailable AI, and report suppression match PRD |
| Device/browser | TRD browser matrix, actual Android/iPhone rehearsal, and Firefox/WebKit checks as features arrive |

Documentation checks do not establish rendered contrast for transparency, font legibility, keyboard behavior, screen-reader compatibility, or usability. Those remain implementation evidence. Review at 200% text enlargement and 400% browser zoom/reflow, including fixed navigation and overlays.

## 8. Requirement traceability

| Requirement IDs | Design enforcement |
|---|---|
| PERM-01–05; ACC-06–12; ACC-20 | Role destinations, application gates, review/ownership limits, no self-approval or role switcher |
| ACC-01–05; ACC-13–19; P-08 | Text student numbers, account/recovery states, generic acknowledgment, identity support and deactivation safeguards |
| PROFILE-01–02; REC-01–03 | Profile prerequisites, shared topic vocabulary, contextual suggestions and honest empty states |
| ASSESS-01–05 | Optional assessment, unknown-answer option, topic feedback, no pass/fail |
| CONTENT-01–08; PATH-01–03 | Draft/review/revision separation, required reasons, retained versions, retirement and ownership |
| DISC-01–04 | Search/filter affordances, course details, start/resume, archived My learning access |
| QUIZ-01–08 | Choice structure, complete submission, exact passage context, autosave, uncertain outcomes, persistent Passed state |
| PROGRESS-01–03; REWARD-01–02; P-04 | Count-based progress, incomplete cap, one course badge, dashboard visibility |
| ROAD-01–08; P-05 | Preview/accept/replace, unavailable courses, conditional approximate duration |
| AI-01–07 | Privacy reminder, allowance/reset, prerequisites, unavailable generation, saved content and retention |
| REPORT-01–03; P-07 | Aggregate-only reporting, contribution thresholds, no-data distinction and restricted history |
| NOTICE-01–02; P-01 | In-context status, separate delivery failure, delivery-only retry |
| P-02–03; P-06 | Field errors, safe resource feedback, preserved drafts, stale review prevention, accessibility |
| TRD §6.2, §6.4–6.5 | Input bounds, progress rounding, 320px/browser scope and verification |

## 9. References and remaining work

The repository's ui-ux-pro-max skill supplies supporting design guidance; the approved direction and PRD/TRD take precedence over generic dataset recommendations.

- [Google DESIGN.md](https://github.com/google-labs-code/design.md): inspiration for token definitions with written rationale; this document uses its own schema.
- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/): accessibility target and criteria.
- [W3C text contrast guidance](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum): thresholds and large-text definition.
- [W3C target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum): minimum target criterion and exceptions.
- [WAI modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/): focus, keyboard interaction, and dismissal.

Representative screens and initial Chromium checks are recorded in [the design review](docs/design/README.md). The owner approved this shared design system after the preview refinements. The nine previews are examples, not the complete application screen inventory. Remaining screens, exact navigation grouping, font/icon integration, screen-reader checks, and real-device/browser verification must be addressed in later scoped work. These local previews do not establish application behavior or full accessibility conformance. Dark mode, a custom logo, bottom navigation, and additional font families require a later explicit design decision.
