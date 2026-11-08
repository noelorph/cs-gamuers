# Role authentication UI reference

Date: 2026-11-07 · Status: reference implemented in application source; final acceptance remains in progress.

This reference completes the visual-design prerequisite for [the role authentication plan](../../superpowers/plans/2026-11-06-role-authentication.md). It specifies the screens and states for Tasks 1–4 and the UI checks for Task 5. Tasks 1–4 now have implementation evidence in the plan; Task 5 records final verification and remaining acceptance blockers. The design artifact alone does not prove application behavior.

[PRD](../../../PRD.md) sections 3–4 and 17 govern behavior. [TRD](../../../TRD.md) section 6 governs limits and verification. [ARCHITECTURE](../../../ARCHITECTURE.md) governs enforcement. [DESIGN_SYSTEM](../../../DESIGN_SYSTEM.md) version 1.0.0 supplies the visual tokens and shared interactions. The plan's explicitly approved separate Administrator entry supersedes the older shared-login description; it does not change authentication or permissions.

Use the [visual reference](reference.html) for composition, hierarchy, spacing, and representative copy. The state tables below specify behavior that a picture cannot establish. All identities in the reference are synthetic. The reference's navigation between examples, scenario controls, and fixture banner are documentation tools, excluded from the product.

## 1. Design scope and decisions

Use a quiet, single-column account experience: wordmark, clear heading, short explanation, visible labels, one primary next step. Approved reviewers use the existing workspace shell. The applicant's restricted status page has a simple wordmark/sign-out header and no learning or staff navigation.

| Decision | Implementation direction |
|---|---|
| Appearance | Approved light theme, white surfaces, neutral page background, indigo actions, no illustrations or gradients |
| Type and icons | Existing locally hosted Inter; outlined Lucide where an icon adds meaning. Text labels carry status meaning. No new font or logo asset |
| Account forms | Outer form/card maximum 480px; single-column inputs at every width; no role dropdown on sign-in |
| Role selection | Separate Student and Faculty signup links/pages. Never offer Administrator or Program Head signup |
| Administrator entry | Same shared sign-in controls; heading and explanatory copy identify the Administrator portal |
| Application review | List followed by detail at narrow widths; list/detail columns only when each remains readable. Explicit review choices and final confirmation |
| Scope exclusions | No password-reset UI or dead “Forgot password?” link, social login, age, upload, notification inbox, role switcher, new invitation-management page, or dashboard redesign |

The brief and style are grounded in the existing sign-in, email-confirmation, status, AppShell, and shared UI source. Product Design's context workflow preserves that established visual target. UI UX Pro Max's focused validation, accessible-authentication, and shadcn guidance informs labels, error placement, password visibility, and focus. Dataset suggestions for OAuth, passkeys, another form library, or a new palette are not adopted: the approved account flow and installed validators already define those choices. These are design decisions, not findings from user research.

## 2. Routes, roles, and screen inventory

| ID / reference | Route or location | Who / purpose | Plan |
|---|---|---|---|
| A00 Entry links | Existing `/` page | Add “Sign in”, “Apply as a Student”, “Apply as Faculty”, and a secondary “Administrator sign in” link; preserve the rest of the page | 3 |
| [A01 Sign in](reference.html#sign-in) | `/auth/sign-in` | Student, Faculty, Program Head; no role selection | 1 |
| [A02 Administrator sign in](reference.html#admin-sign-in) | `/admin/sign-in` | Administrator only; link back to standard sign-in | 1 |
| [A03 Student application](reference.html#student-signup) | `/auth/sign-up/student` | Public Student application | 2, 3 |
| [A04 Faculty application](reference.html#faculty-signup) | `/auth/sign-up/faculty` | Public Faculty application | 2, 3 |
| [A05 Check email](reference.html#verify-email) | `/auth/verify-email` | Request/resend verification; no account-state disclosure | 2, 3 |
| [A06 Confirm / complete](reference.html#confirm-email) | Existing `/auth/email` | Explicit confirmation; verified and unavailable variants; preserve invitation completion | 3 |
| [A07 Application status](reference.html#pending) | `/auth/status` | Own Pending, Needs correction, Rejected, or newly Approved application | 4 |
| [A08 Edit application](reference.html#correction) | Inline in `/auth/status` | Own Pending/Needs correction identity; same application | 4 |
| [A09 Administrator review](reference.html#review) | `/admin/applications` | Authorized Student and Faculty application review, reopening | 4 |
| [A10 Faculty review](reference.html#faculty-review) | `/faculty/applications` | Authorized Student review only; no Faculty data or reopening | 4 |
| [A11 Decision confirmation](reference.html#review) | Dialog in A09/A10 | Confirm approval/correction/rejection; Administrator reopening | 4 |

A01 routes approved, active accounts to `/student`, `/faculty`, or `/program-head`; A02 routes to `/admin`. Pending/Needs correction/Rejected applicants go to A07 only after an accepted password sign-in. Invitation/email-proof sessions alone never reach these destinations. Sign-out uses the existing POST operation and returns Administrators to A02, everyone else to A01.

A09/A10 need no new detail route. Use an allowlisted `application` query value for the selected record and a `status` filter; Administrator review also has a `role` filter. Only opaque record IDs belong in these URLs. Permission checks apply to every selection. Never put applicant names, email addresses, reasons, or credentials in URL parameters.

## 3. Layout and component contract

All values select the existing design-system tokens. The reference stylesheet is a documentation snapshot, not a second application theme.

| Element | Rule |
|---|---|
| Public header | Wordmark at the left; secondary return/sign-in link at the right. Allow wrapping at 320px. No workspace drawer |
| Public main | Top-aligned with 32px above the card on phones, 48px on desktop; natural document scrolling; no fixed-height centering that clips long forms |
| Card | White, 1px subtle border, 8px radius, no resting shadow; 16px inner padding below 768px, 24px from 768px |
| Gutters | 16px below 768px; 24px above. A 320px viewport leaves 288px outer width and 254px inside a bordered, padded card |
| Headings / text | Page title 24px/1.25 at weight 600; section title 20px; body and inputs 16px/1.5; help/labels at least 14px. Use rem values |
| Field rhythm | 8px between label/input/help; 16px between field groups; 24px before actions or a separate section |
| Inputs and buttons | At least 44px high, 8px radius; input border uses control token. Actions wrap; account primary actions fill available width |
| Focus | 3px indigo ring with a 2px white gap; never remove focus outlines on error summaries or dialogs |
| Status | Text label plus semantic surface/text pair: Pending and Needs correction warning, Approved success, Rejected error; “Email verified” is separate from approval |
| Applicant status | Max 720px outer width; editable form remains max 480px. Long identity values and reasons wrap without truncation |
| Reviewer shell | Existing stationary 256px desktop sidebar at 1024px; header aligned with brand using 24px top inset; main max 1200px. Below 1024px use the existing modal menu drawer |
| Review content | Two columns only at 1280px+ (320px list, flexible detail with minimum zero); otherwise list then detail. No page-wide horizontal scroll or fixed-height inner list |
| Confirmation | Existing Dialog, max 480px, 16px viewport margin, 24px padding, 12px radius; vertical overflow remains reachable |
| Motion | Existing 100ms feedback, 200ms dialog entry/150ms exit; reduced motion removes nonessential movement |

Reuse Button, Card, Input, Textarea, Badge, Dialog, Sheet/Sidebar and the existing form-state patterns. A native labeled select is sufficient for queue filters. This account-review form uses full-size radio choices; the design system's compact **content-publication** selector exception does not apply here.

## 4. Sign-in (A01–A02)

Order: heading, audience sentence, Email, Password with Show/Hide control, persistent feedback, primary submit, relevant entry links. Standard copy: “Sign in” / “For Students, Faculty, and Program Heads.” Administrator copy: “Administrator sign in” / “Use your invited Administrator account.” Both say “Use your CS-GAMUERS password.”

| Field | Semantics / validation |
|---|---|
| Email (required) | `type=email`, `autocomplete=username`, no capitalization/spellcheck; 254-character bound. Accept all roles' registered email types here; the Student-domain rule belongs to Student signup/correction |
| Password (required) | `type=password`, `autocomplete=current-password`; allow paste/managers; do not apply new-password strength rules at sign-in or trim the value |
| Show password | Named 44px button, `type=button`, controlled input reference and pressed state; label changes to “Hide password”; preserve selection and keyboard focus |

| State | Visible outcome / next action |
|---|---|
| Submitting | “Signing in…”; prevent repeat submission, keep email visible |
| Empty/invalid fields | Specific inline errors; focus first invalid field or linked summary for multiple errors |
| Incorrect credentials | “Email or password is incorrect. Try again.” No account existence, role, or status detail |
| Valid credentials, wrong portal | Standard: “Use Administrator sign in for this account.” Admin: “Use the Student, Faculty, and Program Head sign-in page for this account.” Provide the allowlisted destination. Do not transfer the password or accept the attempted session; preserve unrelated sessions |
| Throttled | “Too many sign-in attempts. Try again later.” Show a retry time only when supplied by the server; no invented 15-minute countdown from page load |
| Service unavailable | “Sign-in is unavailable right now. Try again.” Retain email, clear submitted password |
| Email unverified | After safe credential/proof checks, explain verification and link to A05. Do not show an approved workspace |
| Deactivated | After credential validation: “This account is deactivated. Contact an Administrator about reactivation. Your saved records are retained.” No authenticated shell or self-reactivation action |
| Expired/revoked session | Appropriate portal with “Your session ended. Sign in again.” Never render stale protected content after Back/refresh |
| Valid session, wrong role URL | Refuse the requested content; send to the user's authorized home/status. Do not reveal the requested record or offer a role switch |

Standard sign-in offers Student/Faculty application links and a secondary Administrator link. The Admin form has only the return link to standard sign-in, with no application CTA. Password recovery is separately scoped; do not advertise a nonworking route.

## 5. Registration fields (A03–A04)

Both forms have a fixed page heading and role-specific explanatory text. Switching the application type is an ordinary link to the other form, never an authorization control. Mark required labels explicitly and optional employee number as optional. Do not add password confirmation, age, terms checkboxes, or identity uploads.

| Field / order | Student | Faculty | Help, bounds and errors |
|---|---|---|---|
| 1. Full name | Required | Required | `autocomplete=name`; 200 code points. Student help: “Use your name as it appears on the enrollment list.” Error: “Enter your full name.” / “Use 200 characters or fewer.” |
| 2. Student number | Required | Omit | Text input, maximum 50 code points, no numeric conversion or numeric-only pattern. “Enter your complete student number, including any leading zeros.” |
| 2. Email / 3. School email | School email required | Reachable email required | `type=email`, `autocomplete=email`, max 254. Student: “Use your existing @caloocan.sti.edu.ph address.” Faculty: “A personal email address is allowed.” Reject exact-domain mismatch inline without inventing an address |
| 3. Employee number | Omit | Optional | Text input, maximum 50 code points. “Leave blank if you do not have it available.” Absence must not prevent registration |
| 4. Password | Required | Required | `autocomplete=new-password`; show/hide and paste enabled. “Use at least 12 characters. Spaces and passphrases are welcome.” Secondary help: “Maximum 72 UTF-8 bytes; some characters use more than one byte.” |

Password validation counts Unicode code points for the minimum and UTF-8 bytes for the maximum. Error: “Use at least 12 characters.” or “This password exceeds 72 UTF-8 bytes. Use a shorter passphrase.” Do not trim, truncate, require character classes, or mislabel the byte cap as 72 characters. Do not let HTML UTF-16 `maxlength` silently enforce the code-point fields incorrectly; reuse the existing validator at the client/server boundaries.

Below the fields: “You will verify your email, then wait for application approval.” Primary action: **Submit application**; pending: **Submitting application…**. Footer: **Already applied? Sign in**. Student review copy names Faculty or an Administrator; Faculty copy names an Administrator and explains the in-person employee-ID check without requesting an upload.

| Result | UI behavior |
|---|---|
| Field validation fails | Preserve non-secret values. Link a focused summary to each invalid field; retain inline messages. Never return a password in server form state |
| Accepted | A05. Say the request was received and mail queued only when enqueue is confirmed. Account creation/proof never means approved |
| Identifier unavailable | “We could not use these details. Check them, sign in if you already applied, or ask an Administrator for help.” Do not reveal whose number/email is reserved or whether that account is pending, rejected, or deactivated |
| Request throttled | Persistent retry guidance with only server-known timing; retain non-secret values |
| Known creation/mail failure | Explain the affected step; offer retry through the same protected attempt. Do not send the person to apply again as a new account |
| Outcome unknown | “We are checking your application request.” Resolve the existing attempt before permitting another creation. On unresolved failure: “We could not confirm the result. Try again to check this request.” No automatic password retry or local password persistence |

## 6. Email verification and existing invitations (A05–A06)

A05 heading: **Check your email**. Generic body: “If this address is eligible for verification, a link will be queued. Open the latest email on the demonstration network.” Show an address only when supplied in this browser by the user or held in an authorized operation; never resolve an address from an unauthenticated lookup or URL. A05 also works when opened directly: provide a labeled Email field for requesting a link.

| State | Copy and actions |
|---|---|
| Queued with a bound signup operation | “Verification email queued. Delivery may take a moment.” Explain the 30-minute lifetime from issuance, not from opening/receipt. No “Delivered” claim without delivery evidence |
| Resend ready | **Request a new link**. Generic acknowledgment: “If this address can be verified, a new link will be queued.” |
| Cooldown | Respect server retry-after: at least 60 seconds between issued messages; max 5 per rolling hour. Button unavailable with an associated reason. Announce availability once, not every countdown second |
| Service failure | “We could not request a verification email. Try again.” No private provider details or account existence disclosure |
| Open link (GET) | **Confirm your email**, explanation, **Confirm email** button. GET and link previews consume nothing; only explicit POST consumes proof |
| Confirmation pending | “Confirming email…”; duplicate activation prevented |
| Verified Student/Faculty | “Email verified. Your application still needs approval.” Primary **Sign in to view application** → A01, then A07. No direct learning/staff session |
| Invalid/used/expired/superseded link | “This link is no longer available. It may have expired or been replaced.” Verification purpose → **Request a new link** (A05). Invitation purpose → ask the inviting Administrator/operator for a new invitation. Unknown purpose → neutral guidance to request verification or contact the inviter; never infer a privileged role |
| Interrupted confirmation | “We could not confirm the result. Try again to check this link.” Resume the protected operation; do not invent success or reissue without applying limits |

Token pages use only local assets and never display, log, store in browser storage, or send the proof to third-party resources. Remove consumed challenge material from the address bar through the existing protected protocol. This is an implementation requirement, not something the fixture proves.

Preserve existing invitation acceptance in the shared A06 component: after explicit proof, show **Accept your invitation**, read-only intended email and invited role when safely available, required Full name and New password, and optional Employee number under ACC-10. Submit **Accept invitation**, show success only after completion, then ordinary password sign-in through A01 for Program Heads or A02 for Administrators. No role chooser, auto-login, or new invitation-management screen. The existing form currently lacks the optional employee-number field and role-specific completion destination; preserve the contract or record this implementation gap explicitly rather than silently narrowing ACC-10. Expired/unfinished setup retains the original proof expiry and requires a fresh authorized invitation when necessary.

## 7. Applicant status and correction (A07–A08)

Header: wordmark and **Sign out**. Main: **Your application**, contextual role label, status banner, short explanation, identity summary, applicable decision reason and time, permitted action. Application status and “Email verified” are separate labels. No estimated approval time, renewal notice, or notification count.

| State | Content / actions |
|---|---|
| Pending | **Pending review**. “Your email is verified. A reviewer will check your application against school records.” Read-only name, number when applicable, current email; **Edit application** and **Refresh status**. No learning/staff navigation |
| Needs correction | **Needs correction**. Display the complete reason, then **Edit application**. Editing remains on the same application. **Save changes** keeps this state; **Resubmit for review** explicitly returns it to Pending after validation/proof |
| Rejected | **Application rejected** with complete reason. “If you believe this is an error, contact an Administrator. Only an Administrator can reopen this application.” **Refresh status** and sign-out only; no edit, resubmit, delete, or second signup CTA |
| Reopened | **Pending review** with “An Administrator reopened this application for review.” Show the recorded reopening reason; no approval claim |
| Approved and active | **Application approved**. **Continue to your account** resolves the saved role destination through current session checks; no unnecessary learning-profile gate |
| Deactivated / revoked while open | End access. Appropriate sign-in/blocked outcome from section 4; never keep this page usable merely to show a reason |
| Load failure | “We could not load your application. Try again.” Do not default to Pending or show another account's details |

A08 field order matches signup, omitting Password and fixing Role as read-only. Approved identity changes go through Administrator verification, not this form. A Pending applicant may save permitted corrections while remaining Pending; a reviewer holding the previous version must reload. A Needs correction applicant can save changes without submitting, then explicitly resubmit. Preserve edits on failure and warn before deliberately abandoning unsaved edits.

Replacement email is a separate verified change: show current verified email, proposed replacement, and **Verify replacement email**. Keep the current canonical identity until proof and the protected change commit. Show **Replacement email awaiting verification**; resubmission/approval of that proposed identity is blocked while proof is incomplete. Reuse the explicit email-confirmation layout. Expiry or failed application of the change preserves a recoverable operation; never mark the new address verified optimistically. Follow the existing session-revocation/sign-in requirements after identity change.

Student-number errors are corrected as text. If a number is reserved/disputed, explain “An Administrator must verify this student number before it can be reassigned.” Do not disclose another account, free a reserved number, or offer self-service reassignment. Changing role or approval is never part of correction.

Save/resubmit outcomes: “Changes saved.” / “Application resubmitted for review.” For a stale version, preserve typed non-secret values, show **Application updated elsewhere**, and offer **Reload current application** after warning that unsaved edits will be discarded. Do not merge identity silently. A failed network request is **Checking the result…** until the saved state is known; retries retain the same decision/request identity where applicable.

## 8. Application review (A09–A11)

Administrator navigation adds **Applications** beside existing **Home**. Faculty navigation adds **Student applications** after existing **Course drafts**. Preserve the existing order of other implemented destinations. Do not expose future administration, reports, or learning links merely to fill the sidebar. Program Heads have no application-review destination.

Queue heading: **Applications** (Administrator) or **Student applications** (Faculty). Supporting text states who may be reviewed. Filters have visible labels: **Status** (Pending review by default, Needs correction, Rejected, Approved) and Administrator-only **Applicant role** (All, Student, Faculty). A filtered empty result says **No applications match these filters** and offers **Reset filters**; an empty default queue says **No applications are waiting for review**.

Rows show name, role where relevant, submission date and textual status, with an explicitly named **Review [name]** link. Avoid email/student-number disclosure in the queue where details suffice. At 320px rows stack; do not squeeze an identity table into the page. Selecting a row loads only authorized details and brings the detail heading into view/focus on narrow screens. Show an empty detail prompt until a record is selected. No bulk approval or auto-selection that could invite an accidental decision.

Detail order: applicant name and status; identity definition list; email-verification state; applicable latest reason/time; verification checklist; review choices; conditional reason; primary **Review decision**. Returning to the queue preserves filters and logical focus. A small application-decision history may show the relevant state changes/reasons only; it is not an administrative-history dashboard or a grant to private learning records.

| Applicant | Required information and external check |
|---|---|
| Student | Full name, complete student number, verified school email. Explicit acknowledgment: “I compared the name and student number with the enrollment list.” |
| Faculty (Administrator only) | Full name, verified reachable email, optional employee number (“Not provided” when blank). Acknowledge school-record authorization, in-person school-issued employee ID, and ownership of the verified application email separately |

These acknowledgments record the reviewer's assertion; they do not claim the app imported records or verified an ID automatically. Require applicable checks for approval, not for requesting correction or rejection. Verification incomplete, self-review, wrong role, unapproved/revoked reviewer, or stale version prevents a decision server-side even if a control was previously visible.

Use a fieldset **Decision** with unselected radio choices **Approve application**, **Request correction**, **Reject application**. Selecting a choice never commits. Correction/rejection reveals **Reason (required)**, helper “Explain what needs correcting or why the application cannot be approved”, 2,000-code-point limit, and a character count. Keep typed reason while switching modes but exclude it from approval submission. Validate before opening the final dialog.

| Dialog | Content and confirm action |
|---|---|
| Approval | “Approve [name]'s [role] application?” Identify email and role; “An active account will receive [Student/Faculty] access.” **Approve application**; default focus on **Cancel** |
| Correction | “Request corrections from [name]?” Repeat the complete reason; “The applicant can correct this application and resubmit.” **Send correction request** |
| Rejection | “Reject [name]'s application?” Repeat reason; “The applicant cannot resubmit unless an Administrator reopens it.” Danger action **Reject application**; initial focus on **Cancel** |
| Reopening (Admin only) | Existing Rejected detail: **Reopen application** reveals a reason form and acknowledgment that the error was verified. Final dialog repeats the reason: “Return this application to Pending review. This does not approve or reactivate the account.” **Reopen for review** |

Use Dialog focus containment, inert background, Escape/cancel with focus return, and no overlay-click confirmation. Long names/reasons wrap and scroll inside the dialog. Do not require a 44px-tall radio glyph; make its entire labeled row the 44px+ hit target. During a mutation keep the named action visible as **Saving decision…**, prevent repeats, and show uncertainty before offering a retry.

| Outcome | Persistent UI |
|---|---|
| Saved | Display the saved status, decision time and relevant reason; remove stale decision controls; refresh the queue and preserve a sensible focus target |
| Email queued | Separate supporting label: **Decision email queued**. Never show “Email sent” based only on queue insertion |
| Email failed | Administrator-only delivery metadata: “Decision saved. Email delivery failed.” The committed decision remains visible. Retry delivery through the existing worker/support operation independently; no repeat-approval CTA or new mail-management dashboard |
| Stale review | **Application updated. Reload it before deciding.** Keep the typed reason in memory for deliberate reuse, disable decision confirmation until current data is reviewed; never silently retry against a new version |
| Outcome uncertain | **Checking the saved decision…** Resolve the same decision ID before retry. Keep edits and do not report success based only on sending the request |
| Authorization lost | Close the detail/dialog and remove protected data; route invalid sessions to the correct sign-in page. Do not keep a usable stale form |
| Query/service failure | Persistent **Applications could not be loaded** with **Try again**; no fake empty queue or raw database error |

Faculty never receive Faculty applications, reopening controls, Administrator delivery metadata, unrelated learning records, or private chat. Direct URL/API denial is required independently of this layout.

## 9. Implementation mapping and acceptance

| Plan task | Reuse / change | UI evidence required after implementation |
|---|---|---|
| 1 | Move shared SignInForm as planned; parameterize portal actions/copy; update paths, AppShell/sign-out destinations | Four roles × two portals; invalid credentials stay generic; wrong-portal attempt accepts no session; existing unrelated sessions survive; direct URLs, Back, expiry and sign-out |
| 2 | Existing account validator, admission, reservation/proof services and safe result contracts | Field/byte boundaries; duplicates and uncertain requests resolve one account; no password in URL/log/storage/returned state |
| 3 | A01–A06, entry links, shared Card/Input/Button and existing email protocol | Student/Faculty signup, queued/resend/failure, explicit confirmation, 30-minute boundary/supersession, existing invitation completion; no role access from proof |
| 4 | Restricted status composition, applicant form, ApplicationReview, existing shell and Dialog | Every application state; Pending edits; correction/save/resubmit and replacement proof; reviewer role limits; reopen reason; stale version, duplicate decision, lost response and email failure |
| 5 | Existing unit/integration/e2e locations and plan evidence | Desktop, 320px, intermediate breakpoint, long names/2,000-character reasons, 200% text and zoom/reflow; keyboard/error/dialog/drawer flows; console and failed-request inspection |

Add meaningful browser cases to `tests/e2e/auth.spec.ts`, `registration.spec.ts`, and `applications.spec.ts` in their owning tasks. Follow the plan's existing unit/integration file map; do not treat this static reference as an authentication test. Shared-flow changes require `npm run test:e2e`. Follow TRD 6.5 for Chromium, Firefox, WebKit, the latest-two-stable target matrix, and physical Android Chrome/iPhone Safari rehearsal. Record actual engines/devices and blockers.

Accessibility acceptance includes unique page titles, one page h1, skip link, label/help/error associations, logical Tab order, visible focus, no color-only states, non-secret value retention, password managers/paste, long-content wrapping, and focused error summaries. Announce asynchronous results once. Do not move focus on every blur or countdown tick. User-entered values and reviewer reasons render as escaped text.

The design resolves layout and interaction choices for this plan. Application verification, provider behavior, device compatibility, and owner acceptance of the implemented screens still require their own evidence. The reference does not authorize implementation, provider changes, deployment, or a commit.
