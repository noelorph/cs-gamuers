# Role authentication design reference

The UI reference for [the 2026-11-06 role authentication plan](../../superpowers/plans/2026-11-06-role-authentication.md) is ready to implement. It covers sign-in, Student/Faculty registration, email verification, application status/correction, and authorized application review. Application implementation remains separate.

Start with the [implementation specification](role-authentication.md), then open [the visual reference](reference.html). The reference has 22 screen/state specimens and a screen selector. Links and controls demonstrate selected transitions with fictional data; they do not authenticate, persist records, enforce backend permissions, or send email. Use fictional values only. The document defines all required states, including those represented only in its state tables.

The previous learning, quiz, authoring, and report artifacts were removed at the owner's request on 2026-11-07. Their historical approval does not apply to these new screen examples. [DESIGN_SYSTEM.md](../../../DESIGN_SYSTEM.md) remains the approved shared visual baseline.

## Review by flow

| Flow | Visual starting point | Specification |
|---|---|---|
| Standard / Administrator sign-in | [Standard](reference.html#sign-in) · [Administrator](reference.html#admin-sign-in) | Sections 2–4; portal routing and denied access |
| Student / Faculty application | [Student](reference.html#student-signup) · [Faculty](reference.html#faculty-signup) | Section 5; exact fields, limits, duplicate and uncertain requests |
| Verification / existing invitation | [Check email](reference.html#verify-email) · [Confirm](reference.html#confirm-email) · [Unavailable link](reference.html#link-unavailable) · [Invitation](reference.html#invitation) | Section 6; explicit proof, resend limits, purpose-specific recovery |
| Applicant status / correction | [Pending](reference.html#pending) · [Correction](reference.html#correction) · [Rejected](reference.html#rejected) · [Approved](reference.html#approved) | Section 7; same-account editing, replacement proof, resubmission |
| Reviewer decisions | [Administrator](reference.html#review) · [Faculty](reference.html#faculty-review) · [Faculty applicant](reference.html#faculty-application) | Section 8; visibility, external checks, reasons, confirmation |
| Conflicts / failures | [Stale review](reference.html#review-stale) · [Email failure](reference.html#review-saved) · [Feedback specimens](reference.html#states) | Sections 4–8; exact outcome and recovery behavior |

No new palette, component system, service, or application dependency is needed. The reference uses the project's existing Inter font. During implementation reuse the shared shadcn/Radix controls and global tokens; do not copy the fixture JavaScript into the application.

## Screenshots

These captures include the gray reference toolbar, which is excluded from the product. Phone captures show the full scrollable page; they are not a promise that long forms fit into one viewport.

| Composition | Capture |
|---|---|
| Standard sign-in | [1440px](reference-sign-in-1440.png) |
| Administrator sign-in | [1440px](reference-admin-sign-in-1440.png) |
| Student signup | [320px](reference-student-signup-320.png) |
| Faculty signup | [1440px](reference-faculty-signup-1440.png) |
| Needs correction / same application | [320px](reference-correction-320.png) |
| Administrator review / correction choice | [1440px](reference-review-1440.png) · [320px](reference-review-320.png) |

## Local viewing and checks

Open `reference.html` directly in a browser, or serve the repository locally so the existing font resolves consistently:

```sh
python3 -m http.server 4178 --bind 127.0.0.1
npm run browser -- -s=role-auth-design open http://127.0.0.1:4178/docs/design/authentication/reference.html
npm run browser -- -s=role-auth-design run-code --filename=docs/design/authentication/check-reference.js
npm run browser -- -s=role-auth-design console error
npm run browser -- -s=role-auth-design requests
npm run browser -- -s=role-auth-design close
```

Stop the temporary server after viewing. `check-reference.js` is an assert-based Playwright CLI check for the design artifact and refreshes the seven synthetic screenshots. Product acceptance tests still belong in `tests/e2e/` under the implementation plan.

## Verification record

Checked on 2026-11-07 with the project Playwright CLI and Chromium **157.0.8103.38**:

- All 22 specimens fit 320, 768, 1024, and 1440 CSS-pixel widths without page-wide horizontal overflow. Each has one visible page heading and labeled input/select/textarea controls.
- All 22 fit 320px with 200% root text size. A 200-character unbroken name and a 1,995-character decision reason remain reachable. The enlarged Administrator heading initially overflowed and was corrected before the final passing check.
- Keyboard password visibility, visible focus, fixture sign-in/verification navigation, correction saving, queue filtering/reset, and required school-record acknowledgments passed.
- Decision dialogs start on Cancel, prevent background focus, close with Escape, and return focus. Reasons survive choice changes. The mobile menu opens/closes and returns focus. Rejection retains its error status treatment; reopening confirms a return to Pending review. Faculty fixtures omit Administrator delivery metadata.
- The existing Inter font loaded. All seven final screenshots were inspected for spacing, hierarchy, wrapping, and complete actions.
- Twelve selected text/action/control color pairs passed their applicable contrast thresholds; the lowest checked normal-text pair was 5.21:1. Decorative borders were not treated as control boundaries.
- No page JavaScript errors, console errors, or failed requests were found in the final pass. Local documentation links and removed-artifact references were checked separately; `git diff --check` passed.

These checks concern the design artifact. Its forms use native required/email feedback; exact school-domain/password-byte validation, rate limits, proof expiry, session acceptance, persistence, and uncertain-request recovery are specified for implementation rather than simulated as a backend. The reviewer acknowledgments are fictional examples, not school verification evidence.

Not checked: the running Next.js application's flows, Firefox/WebKit, physical Android/iPhone, screen-reader output, 400% browser zoom, or backend/provider permissions and email delivery. Application lint/build/integration/e2e suites were not run because application source and configuration are unchanged. These limits do not waive the implementation plan's acceptance gates. The temporary browser session and reference server were closed after verification.

## Implementation handoff

The specification maps each screen to the plan's existing file/task boundaries. It resolves layouts, mobile behavior, exact field rules, state copy, permitted actions, dialog behavior and focus, and the required failure cases. Tasks 1–5 remain unchecked because no product implementation was performed.

The existing invitation form's optional employee-number and portal-destination gaps are called out in section 6. Backend approval/session enforcement, actual mail delivery, isolated integration tests, browser/device acceptance, and screen-reader checks must be verified during implementation.
