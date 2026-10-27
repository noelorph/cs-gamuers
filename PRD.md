# CS-GAMUERS product requirements

Status: working draft for requirements review. The requirements below consolidate the decisions approved in the project discussion. Open decisions and editorial proposals are identified separately; this document is not yet the final implementation handoff.

## 1. Purpose and scope

CS-GAMUERS helps currently enrolled Computer Science students at the school pursue supplemental learning and explore careers. Students study faculty-managed courses, take quizzes, earn course-completion badges, and use personalized recommendations and learning roadmaps.

The application operates independently of the school's existing academic system. It does not award academic credit or manage official enrollment, grades, curricula, teaching schedules, or faculty unit loads. It does not import enrollment or grade records. Reviewers consult school records outside the application.

The main product reference is [the original use-case and system-sequence document](docs/project-documents/software-engineering-use-cases-and-system-sequence-diagrams.docx). Explicit decisions in the project discussion refine or replace that source where its academic-administration scope conflicts with this supplemental-learning scope.

This document defines product behavior, permissions, information requirements, and acceptance criteria. Technology choices belong in `TRD.md`, architecture in `ARCHITECTURE.md`, and visual design in `DESIGN_SYSTEM.md` and `docs/design/`. None is selected here.

### 1.1 First-release outcomes

- Eligible students can obtain manually approved accounts and start learning without school-system integration.
- Faculty can author courses and career paths; Program Heads control publication and retirement.
- Students can complete required quizzes, retain their progress, and earn a course badge once.
- Personalized suggestions use the approved catalog and the student's own learning context.
- Students control whether to accept or replace a personal roadmap.
- Core learning remains usable when AI is unavailable.
- Developers can trace the same rules across the PRD, use cases, system sequence diagrams, and flowcharts.

No numeric adoption, learning-improvement, or performance target has been approved. Completion criteria in this document are functional acceptance criteria, not claims of educational efficacy.

### 1.2 Approaches considered and selected

| Decision | Selected approach | Alternative considered and disposition |
|---|---|---|
| Product responsibility | Supplemental learning and career guidance | Official academic administration excluded |
| Course delivery | Faculty-managed internal courses; external links may be lesson resources | External course directory or two distinct course-delivery types not selected for required release |
| Student eligibility | Manual verification at registration; Administrator action when eligibility changes | Term-based expiry and recurring verification explicitly replaced by one-time verification |
| Academic oversight | Program Head approves content, manages ownership, and receives aggregate reports | Program Head authoring and teaching permissions excluded |
| Recommendations | Personalized suggestions drawn from the approved internal catalog | External AI recommendations requested, then made optional and deferred |
| Course activities | Automatically scored multiple-choice quizzes | Practical assignments and manual grading excluded |
| Rewards | One course-completion badge per student per course | Additional reward types are not required |
| AI cost | Prefer free/open-model or free-service options; tolerate unavailable AI | Paid services are not selected; no automatic paid fallback |
| Roadmaps | One accepted active personal roadmap; explicit replacement | Silent replacement after profile or assessment changes prohibited |

### 1.3 Explicit exclusions and deferred items

- Official academic credit, enrollment administration, grade imports, curriculum approval, teaching schedules, and faculty workloads.
- Automatic school-system integration or document uploads for initial student verification.
- Practical assignments, code execution, manual quiz grading, points, leaderboards, and roadmap-completion rewards.
- Public self-registration as Administrator or Program Head; custom permissions; multiple roles on one account.
- Guaranteed external-course completion verification or credit for external study.
- Required external AI roadmaps. Revisit this request with the product owner before final scope sign-off; do not silently include or permanently discard it.
- Emergency recovery when no Administrator can access the system and normal email recovery is unavailable. This was explicitly deferred.
- Permanent account deletion through the application in the first release.
- Automatic term-based account expiry, renewal queues, and offline quiz-taking.
- A separate notification inbox. Relevant state appears in existing dashboards and applicable emails.

## 2. Terms

| Term | Meaning |
|---|---|
| Course | A faculty-managed supplemental offering containing ordered lessons and quizzes |
| Course revision | A particular approved set of course content and completion requirements |
| Lesson | An ordered unit containing learning resources and optionally one course quiz |
| Learning resource | Written content, a PDF, or an external link used within a lesson |
| Course quiz | A required or optional, automatically scored multiple-choice activity belonging to a lesson |
| Skills assessment | The separate optional, untimed, 15-question diagnostic used to inform suggestions; it has no pass/fail result |
| Career path | A shared, faculty-authored and Program Head-approved career guide with skills and ordered course references |
| Personal roadmap | A student's accepted ordered course plan for a selected career or learning goal |
| Recommendation | A suggestion that does not itself start a course or activate a roadmap |
| Start a course | Create the student's ongoing course participation using the currently published revision |
| Completion | Passing all required quizzes in the student's course revision; distinct from official school credit or proof of mastery |
| Archive | Retire content from new discovery/recommendations while preserving applicable existing learning records and access |
| Deactivate | Remove account access while retaining the account and its records |
| Approval | Context-specific authorization of an account application or publication of content; these are different permissions |

Faculty approval of course content does not exist: Faculty author and submit; Program Heads approve. A personal roadmap assembled from approved content is not itself a separately reviewed Program Head publication.

## 3. Roles and information access

**PERM-01.** Each account has exactly one role: Student, Faculty, Program Head, or Administrator. Permissions follow the role and the ownership boundaries below, not individual custom settings.

| Capability | Student | Faculty | Program Head | Administrator |
|---|---|---|---|---|
| Study courses, take quizzes, receive personal AI guidance and badges | Own account | Not granted by this role | Not granted | Not granted |
| Apply for a student/faculty account | Student application | Faculty application | Invitation only | Invitation only |
| Verify student applications | No | Yes, approved Faculty only | No | Yes |
| Verify faculty applications | No | No | No | Yes |
| Invite Administrators and Program Heads | No | No | No | Yes |
| Author courses and career paths | No | Owned content | No | No |
| Approve content publication/revisions/retirement | No | No | Yes | No |
| Transfer course/career-path ownership | No | No | Yes | No |
| See individual course progress and quiz results | Own | Only courses currently owned | No | No |
| See program-wide aggregate learning reports | No | No additional grant | Yes | No additional grant |
| Read private AI conversations | Own | No | No | No |
| Account support, recovery, staff role changes, deactivation | Limited self-service below | No administrative grant | No administrative grant | Yes, with safeguards |
| Read administrative activity history | No | No additional grant | No additional grant | Yes |

**PERM-02.** Faculty inspecting student applications may access the identity and application information necessary for verification. Approving an account does not grant access to its entire learning profile, unrelated courses, or private conversations.

**PERM-03.** Owning a career path does not grant access to individual student records for courses owned by other Faculty. Course ownership transfer removes the former owner's editing and student-record access and grants the new owner the course responsibilities.

**PERM-04.** Program Heads have an oversight-only role. Their student reporting is aggregate. Administrators manage identity, access, and administrative activity; they cannot author or approve academic content, view individual learning results, or manually change progress or rewards.

**PERM-05.** No applicant may approve their own application. Unapproved Faculty cannot verify students, inspect student learning records, or manage content.

## 4. Accounts and onboarding

### 4.1 Registration and identity

**ACC-01.** Student registration requires full name matching the enrollment list, complete student number, school email, and password. Preserve the student number as text, including leading zeros.

**ACC-02.** Students use an existing school-issued address under `@caloocan.sti.edu.ph` and verify ownership by email. The system does not construct addresses from names or student numbers. Verification of email control does not replace manual enrollment verification.

**ACC-03.** Faculty registration requires full name, a reachable email address, and password. A school employee number is optional. Faculty may use a personal email address and must verify it.

**ACC-04.** Every student number and email address belongs to at most one account, including pending, rejected, and deactivated accounts. Returning users recover/reactivate the existing account. An Administrator verifies and corrects identity mistakes before a wrongly claimed student number can be assigned to its rightful owner.

**ACC-05.** Every user creates a separate CS-GAMUERS password. School login credentials and school sign-in integration are not used.

### 4.2 Manual application review

**ACC-06.** Approved Faculty or Administrators compare a student applicant's full name and student number against an enrollment list they already have access to outside the application. No list import or student document upload is required.

**ACC-07.** An Administrator checks a faculty applicant's authorization against existing school records, verifies identity in person using a school-issued employee ID, and confirms that the verified application email belongs to the applicant.

| Application status | Applicant capabilities | Reviewer action |
|---|---|---|
| Pending | Sign in, complete/correct the profile, and see status; no learning or staff permissions | Approve, request correction, or reject |
| Needs correction | Read the reason, correct the same application, and resubmit | Provide a reason; resubmission returns to Pending |
| Approved | Receive the permissions of the approved role, subject to account activation and feature prerequisites | Approval is recorded |
| Rejected | Read the rejection reason; no learning or staff permissions | Provide a reason; reopening rules remain an open decision |

**ACC-08.** Student enrollment verification occurs once at registration. There is no term expiry or recurring renewal. Staff identify graduates, withdrawals, or program changes and arrange Administrator deactivation. Eligibility may therefore become outdated between school changes and staff action.

### 4.3 Invited staff and role changes

**ACC-09.** The school designates the initial Administrator. Existing approved Administrators invite additional Administrators and appoint Program Heads. Those roles cannot be selected through public self-registration.

**ACC-10.** Invitees verify the intended invitation email, provide a full name, and create a password. Employee number is optional. Invitations grant access only to the intended recipient after acceptance.

**ACC-11.** Only an Administrator can change another staff member's role. A reason and activity record are required, and the affected staff member is notified. Existing sessions end immediately. Administrators cannot change their own role or remove the last active Administrator.

**ACC-12.** Faculty-owned content must be transferred by the Program Head before removing the Faculty member's authoring role. Course and career-path ownership follow the same management policy. Student-to-staff conversion has not been requested; its exclusion is listed as an editorial scope default for review in section 17.

### 4.4 Password and assisted recovery

**ACC-13.** Password recovery accepts a registered email and displays the same acknowledgment whether or not an account exists. A reset link is single-use, lasts 30 minutes, and is superseded by a newer reset link. A successful reset ends all existing sessions and requires sign-in again.

**ACC-14.** Password recovery preserves account approval, roles, deactivation state, and learning records. It cannot reactivate an account or bypass pending approval.

**ACC-15.** Loss of email access requires Administrator-assisted recovery. The Administrator verifies identity in person using school-issued student/employee ID matched to the account. The user verifies a replacement address before replacement; students still require the school domain. The old address is notified, sessions and reset links are invalidated, and the user sets their own password. Another Administrator must handle an Administrator's assisted recovery.

**ACC-16.** There is no first-release emergency recovery flow if no Administrator has access and email-based recovery is also unavailable.

### 4.5 Deactivation and reactivation

**ACC-17.** A Student may deactivate their account after confirming their password. Sessions end immediately, learning access stops, and profile, progress, completions, and rewards remain saved. Administrator-approved reactivation requires a fresh enrollment check.

**ACC-18.** Administrators may deactivate student or staff accounts with a recorded reason communicated to the affected user. Sessions and account access end immediately. Before faculty deactivation, the Program Head must transfer owned content. Administrators cannot deactivate themselves or the last active Administrator.

**ACC-19.** Staff reactivation requires another active Administrator to verify authorization and approve restoration. Expedited suspension before ownership transfer is not yet defined; do not invent it as an additional permission.

## 5. Student learning profile

**PROFILE-01.** Approved Students may browse and start courses before completing the learning profile. Personalized recommendations require the complete learning profile. The optional skills assessment is not a substitute for missing required profile answers.

| Field | Requirement | Values/meaning |
|---|---|---|
| Interests | At least one | Shared CS topics below |
| Current learning goal | Exactly one | Explore CS careers; build foundational CS skills; improve a specific topic; prepare for a specific career |
| Target topic | Required for improving a specific topic | One shared topic |
| Career choice | Explicit choice of a published career path or “I'm not sure yet” | A concrete path is required for preparing for a specific career |
| Experience level | Exactly one | No experience; Beginner; Intermediate; Advanced |
| Available study hours per week | Optional | Used only for optional roadmap pacing estimates |

Experience descriptions: No experience means starting from scratch; Beginner means following guided exercises; Intermediate means building small projects independently; Advanced means experience building larger projects. These are self-reports, not verified qualifications or access restrictions.

**PROFILE-02.** The fixed first-release topic list is shared by profile interests, course primary topics, and discovery filters:

1. Programming fundamentals
2. Data structures and algorithms
3. Web development
4. Mobile development
5. Databases
6. Computer systems and networking
7. Software engineering
8. Cybersecurity
9. Data science
10. Artificial intelligence and machine learning

## 6. Optional skills assessment

**ASSESS-01.** The initial diagnostic is optional and untimed, authored by Faculty and approved by the Program Head. Students may skip it and still receive profile-based suggestions.

**ASSESS-02.** It contains exactly 15 multiple-choice questions: three each for programming fundamentals, problem-solving, databases, computer systems, and basic networking. Each question has one correct answer and an additional “I don't know yet” option. Four ordinary choices plus the unknown-answer option are proposed in D-01; that diagnostic choice count is not yet approved.

**ASSESS-03.** Correct answers earn one point; incorrect and “I don't know yet” answers earn zero. There are no penalties and no pass/fail result. Display results by topic. Three questions per topic provide a rough starting signal, not a mastery or career-eligibility judgment.

**ASSESS-04.** Retakes are unlimited. The latest completed attempt informs future suggestions. Previous results remain stored, and an unfinished retake does not replace the latest completed result. Diagnostic results do not award course credit, badges, or completion and do not block access to courses.

**ASSESS-05.** Saved attempts and submission reliability follow section 9. Ownership, publication/revision lifecycle, and release of diagnostic answers require the decisions recorded in section 17.

## 7. Content authoring and governance

### 7.1 Courses and lessons

**CONTENT-01.** Each course has one approved faculty owner, initially its creator. The owner authors drafts, submits publication/revision requests, and reviews students' work in that course. Program Heads may transfer ownership to another approved Faculty member. Content, learner records, and authorship history survive transfer.

| Item | Required before submission for approval | Optional |
|---|---|---|
| Course | Title, description, one primary topic, difficulty, at least one learning outcome, ordered lessons | Prior-knowledge guidance, prerequisite-course references, estimated study time |
| Lesson | Title, at least one learning resource, position in course | One quiz, additional resources |
| Written resource | Learning content | Supporting description |
| PDF resource | Attachment and descriptive title | Supporting description |
| External resource | Link and descriptive title | Supporting description |

**CONTENT-02.** Every course requires at least one lesson and one required quiz. Difficulty is Beginner, Intermediate, or Advanced. Faculty can save incomplete drafts; mandatory content must be valid before review submission. Ownership, revision number, review/publication state, and publication dates are recorded by the application.

**CONTENT-03.** Prerequisites are advisory. Students can start any published course open to new learners and access lessons/quizzes in any order. Suggested order and prior knowledge remain visible guidance. No course completion prerequisite is a hard access restriction.

### 7.2 Review, publication, and revisions

**CONTENT-04.** Program Heads approve publication, request changes, or reject with a reason. Students only receive published content. Faculty and Administrators cannot bypass this approval.

**CONTENT-05.** Revisions to published content require review. The existing approved revision remains available while changes are reviewed. Review and publication must refer to the actual submitted content; an approval must not silently cover later edits.

**CONTENT-06.** Starting a course binds the student to its currently published revision, including content and completion requirements. Existing learners continue that revision after updates. New learners start the latest published revision. Revisions never reset existing progress, scores, completions, or earned badges.

**CONTENT-07.** Faculty request retirement and the Program Head approves archiving. Archived courses disappear from discovery and new recommendations and cannot be started by new learners. Existing learners may continue their course revision; completed records and badges remain accessible. Published courses are retained. Only unpublished drafts may be deleted.

**CONTENT-08.** Ordinary retirement does not provide an urgent takedown mechanism. The treatment of a dangerous, erroneous, or unavailable resource in a pinned revision is not yet approved. External resource availability also remains outside the application's control.

### 7.3 Career paths

**PATH-01.** Each career path has one faculty owner. Publication requires a name, career description, skills list, and at least one published course in a suggested order. Faculty may reference courses owned by other Faculty.

**PATH-02.** Career paths follow the course ownership, Program Head approval, revision, reassignment, and archiving policy. Archived paths are excluded from new recommendations.

**PATH-03.** Updating or archiving a career path does not automatically change an accepted personal roadmap. A path owner receives no extra student-record permissions over its referenced courses.

## 8. Course discovery and starting learning

**DISC-01.** Approved Students browse courses published and open to new learners. Keyword search covers titles and descriptions. Filters cover shared topic and difficulty. Clearing filters restores the full eligible catalog.

**DISC-02.** Course details show description, learning outcomes, faculty owner, lesson outline, and completion requirements. Prerequisite guidance is advisory and visible.

**DISC-03.** “Start course” requires no additional faculty approval and starts the latest published revision. An existing participation must be resumed rather than duplicated by a repeated start action. Starting from a recommendation follows the same rule.

**DISC-04.** “My learning” contains started and completed courses, including archived courses the student previously started. Archive status does not remove that existing right to continue.

## 9. Course quizzes and reliable attempts

### 9.1 Quiz structure and grading

**QUIZ-01.** Each lesson may have one quiz. A quiz requires a title, required/optional setting, passing percentage, and at least one question. Every question requires text, exactly four distinct answer choices, exactly one correct answer, and an explanation. Every question must be answered before submission.

**QUIZ-02.** Every correct answer is worth one point; incorrect answers earn zero. Questions have equal weight. Default passing percentage is 80%; Faculty may choose a whole-number percentage from 1 through 100 before Program Head approval.

**QUIZ-03.** Compare the exact score against the threshold, without rounding up. For `c` correct answers, `n` questions, and threshold `p`, pass when `100 × c >= p × n`. Seven correct out of nine does not meet 80%.

**QUIZ-04.** Quizzes are untimed with unlimited retakes. After a submitted attempt, show the score, correct answers, and Faculty explanations. Retain each attempt and use the highest score to determine passage. A later failed attempt never revokes a previous pass, course completion, or badge.

### 9.2 Saved attempts and submission behavior

**QUIZ-05.** Save answers automatically and indicate whether the latest changes are saved or waiting to save. A Student can leave and resume an unfinished attempt. There is at most one unfinished attempt per Student per quiz/assessment.

**QUIZ-06.** Grade submitted attempts once. Repeated clicks or retries cannot create duplicate submitted attempts or badges. After a connection failure during submission, determine whether submission succeeded before offering a retry.

**QUIZ-07.** A submitted attempt cannot be edited. Retaking starts a new attempt. The same reliability rules apply to the diagnostic assessment with its separate scoring rules. Offline quiz-taking is not part of this release.

**QUIZ-08.** Student-visible course-quiz status is Not started, In progress, or Passed. A below-threshold attempt remains In progress with its result and feedback accessible. A course quiz already passed remains Passed during or after later retakes.

## 10. Progress and rewards

**PROGRESS-01.** Course progress is `passed required quizzes / all required quizzes × 100`. Every published course has at least one required quiz. Optional quizzes show their own results but contribute neither to the numerator nor denominator. Resource views do not increase completion progress.

**PROGRESS-02.** A course completes when all required quizzes in the student's revision are passed. Compute progress from that revision's requirements, not the latest published revision.

**PROGRESS-03.** Roadmap progress is `completed included courses / all included courses × 100`, with equal weight per course regardless of estimated time. Previously completed courses count where included. The roadmap completes when all included courses are completed.

**REWARD-01.** Completion awards one course badge to the Student, showing course name and completion date. Award at most once per Student per course, regardless of retakes or later course revisions. The badge remains saved after updates, archival, and deactivation. Display it in the student's dashboard.

**REWARD-02.** The first release has no additional points, leaderboard, assessment reward, or separate roadmap badge. Badge issuance follows actual completion and cannot be performed by AI or manually overridden by Administrators.

## 11. Recommendations and personal roadmaps

### 11.1 Recommendations

**REC-01.** Recommendations require the complete learning profile. Consider interests, current goal, experience, career preference if known, latest completed diagnostic if available, and completed courses. Match goals/interests to the approved catalog first, then adjust suggestions and order with the remaining learning context.

**REC-02.** Suggest up to three approved career paths and five suitable published courses open to new learners. Explain each suggestion using the student's interests or learning needs. Return fewer when suitable catalog content is limited; do not invent catalog items.

**REC-03.** Exclude completed courses from what-to-study-next course suggestions. Students unsure about careers may receive career suggestions without selecting one first. Recommendations neither enroll the Student nor change an active roadmap.

**REC-04.** Exact model, ranking implementation, and hosting remain technical decisions. The approved product behavior is personalization within catalog constraints, not a claim that a particular model or numeric ranking formula has been selected.

### 11.2 Roadmap creation and replacement

**ROAD-01.** Students with a complete learning profile may request a roadmap for a chosen career path or a specific learning goal. It contains an ordered course list with reasons for inclusion. Relevant previously completed courses count toward the plan.

**ROAD-02.** Each Student has at most one active roadmap; a Student who has not accepted a plan has none. Preview a proposed plan and require explicit acceptance to activate it. For replacement, show the proposed plan and require confirmation before it replaces the active plan. Preserve course attempts, progress, completions, and badges.

**ROAD-03.** Changing profile answers, completing a new assessment, or publishing content revisions does not silently replace an active roadmap. Students may study courses outside the plan. Suggested order is advisory.

**ROAD-04.** Listing an unstarted course in a roadmap does not start it or reserve an old course revision. The latest published revision applies when the Student actually starts it. Existing starts retain their original revision.

**ROAD-05.** When a roadmap course is archived, Students who already started it continue their version. Others see that it is unavailable; it is not silently removed or marked complete. They may request and accept a replacement roadmap. If no suitable replacement exists, explain that the catalog cannot currently provide a complete plan for that goal.

**ROAD-06.** The accepted replacement's course list determines its completion. A course-path update or archive does not itself change an already accepted personal plan.

### 11.3 Optional pacing

**ROAD-07.** Faculty may provide optional course study-time estimates for Program Head review. If the Student provides available weekly hours and every unfinished course has an estimate, show an approximate duration based on their total estimated time divided by weekly availability.

**ROAD-08.** Exclude completed courses. Include the full estimate for each unfinished course, since actual study hours are not tracked. If information is incomplete, show order without duration. Estimates impose no deadlines, penalties, or changes to progress/rewards, and do not precisely account for partial progress or retakes.

### 11.4 External roadmap request

**ROAD-09.** The product owner requested separate internal and external AI roadmap options, including links to internet courses. External recommendations are optional and deferred from required first-release scope. No external progress/reward rules, provider, search service, generation trigger, or cost commitment is approved. Remind the owner during final scope review.

## 12. AI chat, limits, and availability

**AI-01.** Student AI chat may explain programming and course concepts, released quiz feedback, approved career paths, recommendations, and personal roadmaps. It may suggest courses/career paths and produce a proposed roadmap using the same requirements and confirmation flow as other recommendation entry points.

**AI-02.** Relevant context may include the Student's learning profile, diagnostic summary, roadmap, and course progress. The AI must not receive name, student number, email, other Students' records, or unreleased quiz answer keys through automatic account context. How to handle identifiers voluntarily typed into messages requires an explicit clarification of this privacy boundary.

**AI-03.** Chat cannot change scores, mark work complete, award badges, approve accounts, bypass publication rules, or silently start courses/replace roadmaps. Students use course details/start actions and roadmap previews/acceptance to make those changes.

**AI-04.** Aim to avoid paid AI services. No model or provider is selected. Never switch automatically to a paid service. Free-service capacity is not guaranteed.

**AI-05.** Each Student has a shared allowance of 20 successful AI requests per day, resetting at midnight Philippine time. A chat message, recommendation request, or roadmap generation uses one allowance on success. A recommendation delivered through chat counts once, not twice. Reading saved content costs no allowance. Failures do not count, and retries of the same successful request do not count twice. Show remaining allowance and reset time.

**AI-06.** AI downtime/exhausted service capacity or Student allowance does not block course discovery, lessons, quizzes, badges, or saved roadmaps. Saved conversations remain readable. Explain unavailability and offer later retry or catalog browsing. Failed requests leave the active roadmap and learning records unchanged.

**AI-07.** Students may save/reopen separate private conversations. A conversation expires from accessible history 90 days after its last message; Students may delete it sooner. Deleted or expired conversations are no longer used as AI context. Deletion does not remove accepted roadmaps, course records, or badges and does not refund used allowance. Faculty, Program Heads, and Administrators cannot read private chats.

## 13. Reports and administrative history

**REPORT-01.** Program Heads receive aggregate CS-GAMUERS reports covering course participation, ongoing/completed learning and completion rates, course-quiz outcomes by course/revision, and content awaiting approval/published/archived with faculty owners. Filters are course, revision, and date range.

**REPORT-02.** Reports do not grant individual learning-record access or expose private conversations. They contain no imported official grades, official enrollment trends, or faculty evaluation data from school systems. Proposed aggregate calculations, date-filter semantics, and small-group treatment are listed for final review in section 17.

**REPORT-03.** Administrators can see administrative activity history, including who approved accounts, changed roles, or approved content. Administrative visibility is not permission to view student quiz answers, individual assessment results, or private chat text.

## 14. Notifications

**NOTICE-01.** Existing dashboards show relevant application/content state; there is no separate notification inbox.

| Event | Dashboard/in-application behavior | Email recipient |
|---|---|---|
| Application review decision | Applicant sees current status and applicable reason | Applicant; include correction/rejection reason |
| Account deactivation/reactivation | Reflect actual access/status where sign-in is permitted | Affected user; include applicable reason |
| Staff role change | Apply new permissions after sign-in | Affected staff member |
| Course/career-path review submission | Program Head sees pending work | No review-request email required by current decision |
| Content approved/returned/rejected | Owner sees outcome and applicable reason | Faculty owner |
| Ownership transfer | Reflect current owner and permissions | Previous and new owner |
| Quiz result/badge/AI allowance | Display in the application | No additional email required |

**NOTICE-02.** Verification, invitations, password resets, and old-address recovery notices follow the account flows. Email-delivery failure behavior is an editorial proposal requiring review, not a reason to silently reverse an already completed application decision.

## 15. Required product records

This is a conceptual information inventory, not a database design. Credential storage, persistence layout, transport, and implementation-specific identifiers belong in technical documents.

| Record | Required product information |
|---|---|
| Account | Identity, unique verified email, exactly one role, application status where applicable, active/deactivated state, relevant reasons and decision history; student number required for Students; employee number optional for staff |
| Invitation | Intended email, invited role, inviting Administrator, acceptance state; expiry value to be specified in TRD.md |
| Learning profile | Required/conditional selections in section 5; optional weekly hours |
| Course | Stable identity, current owner, title/description/topic/difficulty/outcomes, ordered lessons, approval/publication/archive state, revision history, authorship; optional prerequisites/effort estimate |
| Course revision | Approved content, required quiz set, grading thresholds, review result, publication information; referenced by course participation |
| Resource | Type and content/attachment/link; descriptive title for PDFs/links |
| Quiz/question | Title, required flag, threshold, questions with four distinct choices, correct choices, explanations |
| Skills assessment | Approved 15-question form, topic association, correct answers and unknown-answer options; ownership/version lifecycle is open |
| Attempt | Owner Student, course/assessment revision context, saved answers, unfinished/submitted state, submitted result and submission time; unsubmitted answers are not graded |
| Course participation | Student, stable course identity, revision at start, start time, attempts/passage, completion time where completed |
| Badge | Student, stable course identity, course name, original completion date; unique per Student/course |
| Career path | Owner, name/description, skills, ordered course references, review/publication/archive/revision history |
| Recommendation result | Student, career/course suggestions with explanations; visibility and refresh must respect current catalog availability |
| Personal roadmap | Student, goal context, ordered courses and reasons, proposed/accepted status, active-plan relationship, acceptance history, optional pace estimate |
| Conversation | Student owner, messages, last-message date, expiry/deletion state; private and separate from learning records |
| AI usage | Student, allowance date in Philippine time, count of successful logical requests, remaining allowance; no duplicate charge on retries |
| Administrative event | Actor, action, affected record, date/time, and reason where required; no private chat or quiz-answer content |

**DATA-01.** Accounts, quiz attempts, progress, accepted roadmaps, and badges have no automatic expiry. Deactivation preserves them. Published course/path revisions remain wherever existing records depend on them. Permanent account deletion is not available through the first-release application. Chats follow the separate 90-day/student-deletion rule.

## 16. Acceptance scenarios

| ID | Scenario and required result | Requirements |
|---|---|---|
| AC-01 | A verified school email alone does not unlock learning; manual student approval is required | ACC-01–08 |
| AC-02 | Pending/unapproved Faculty cannot approve Students or inspect learning records | PERM-05, ACC-07 |
| AC-03 | Duplicate student number or email cannot create another account even if the existing account is deactivated | ACC-04 |
| AC-04 | Password reset expires after 30 minutes, is consumed once, and does not reactivate a deactivated account | ACC-13–14 |
| AC-05 | Assisted recovery requires identity checking and verified replacement email and preserves existing records | ACC-15 |
| AC-06 | A staff role change revokes old access; last-Administrator and ownership safeguards prevent prohibited changes | ACC-11–12, ACC-18 |
| AC-07 | Approved Student without a complete learning profile can start a course but cannot receive personalized recommendations | PROFILE-01, REC-01 |
| AC-08 | Skipping the diagnostic permits profile-based recommendations; an unfinished retake does not replace previous completed results | ASSESS-01–04 |
| AC-09 | A course missing a lesson, learning resource, required quiz, or complete quiz question cannot be submitted for publication | CONTENT-02, QUIZ-01 |
| AC-10 | Faculty cannot publish their own draft; Program Head rejection/change request includes a reason | CONTENT-04 |
| AC-11 | A Student starts revision A; revision B publishes with different quizzes; that Student retains A while a new Student receives B | CONTENT-05–06 |
| AC-12 | Archived course cannot be newly started, but an existing Student can continue and keep their badge | CONTENT-07, DISC-04 |
| AC-13 | Transfer removes former owner access, preserves records, and does not grant access to unrelated courses | PERM-02–03, CONTENT-01 |
| AC-14 | Seven correct out of nine fails an 80% quiz; later passage followed by failure retains Passed and completion | QUIZ-03–04 |
| AC-15 | Resume saved answers after leaving; retry uncertain submission without creating a second attempt, score, or reward | QUIZ-05–07 |
| AC-16 | Two of four required quizzes yields 50%; optional quiz completion and resource views do not change that percentage | PROGRESS-01 |
| AC-17 | Completing every required quiz awards exactly one badge, even when completion is retried or the course is revised | REWARD-01 |
| AC-18 | Limited catalog yields fewer suggestions with real published references, not invented courses or paths | REC-02 |
| AC-19 | Student explicitly accepts a replacement roadmap; existing course records remain; a profile change alone does not replace it | ROAD-02–03 |
| AC-20 | Unstarted archived roadmap course remains unavailable rather than becoming complete; replacement requires acceptance | ROAD-05 |
| AC-21 | Missing weekly hours or any unfinished course estimate produces an ordered plan without a duration | ROAD-07–08 |
| AC-22 | AI cannot award a badge, publish a course, change a grade, or bypass Student acceptance of a roadmap | AI-03 |
| AC-23 | Recommendation through chat costs one successful request; a failed request or retry does not consume another allowance | AI-05 |
| AC-24 | AI outage leaves quizzes, core learning, saved conversations, and saved roadmap usable; no paid fallback activates | AI-04–06 |
| AC-25 | Chat deletion or 90-day expiry removes history/context without deleting accepted roadmap or restoring AI allowance | AI-07 |
| AC-26 | Program Head aggregate reports and Administrator activity views do not expose individual quiz records or chat contents | PERM-04, REPORT-01–03 |
| AC-27 | Decisions are visible on the relevant dashboard and email recipients follow the approved event matrix | NOTICE-01–02 |

## 17. Open decisions before final sign-off

These are not approved requirements. They must be resolved or explicitly deferred before claiming implementation readiness.

| ID | Question |
|---|---|
| D-01 | Approve a single shared diagnostic with one Faculty owner assigned by the Program Head, the existing review process, four ordinary options plus “I don't know yet,” correct answers/explanations after submission, and unfinished attempts remaining on the form they started? |
| D-02 | May only an Administrator reopen a rejected application after verifying an error, recording a reason, and returning it to Pending for review? |
| D-05 | Does the AI identity-data restriction cover only automatic account context, or must it also redact/block identifiers Students type into messages? | 

A fresh builder review identified these three consequential product decisions and found no direct contradiction in the consolidated requirements. The remaining items below are explicitly proposed defaults or existing deferrals, not requests for new functionality.

### 17.1 Editorial proposals for review

These close routine behavioral gaps without selecting architecture. They are proposals, not historical user approvals.

- P-01: If email delivery fails after a successful decision, preserve the actual decision, show the current state in the permitted dashboard, and expose delivery failure to account support without exposing private learning content. Retrying notification must not repeat the decision.
- P-02: Reject unsafe or unsupported resource uploads and invalid links with field-specific feedback. Exact size limits and supported rich-text features remain to be set.
- P-03: Preserve entered draft data on validation failure; show actionable errors. Prevent stale review actions from approving content different from what was reviewed.
- P-04: Show 100% only when the completion condition is satisfied; percentage display precision is an implementation detail, but display rounding must not imply completion early.
- P-05: Require positive finite weekly/course hours when estimates are supplied; weekly availability cannot exceed the hours in a week. Missing estimates remain valid because the feature is optional.
- P-06: All core flows must support keyboard interaction, labeled form inputs, understandable validation feedback, and status information that does not rely solely on color. Visual styling is deferred to the design-system document.
- P-07: For reports, use Students who started the selected course/revision within the date range as the cohort, and show their current completion state as of report viewing. Count each Student once per course/revision; program-wide unique participation counts each Student once across selected courses. Completion rate is completed cohort participants divided by all cohort participants, with no-data shown when the denominator is zero. Retained deactivated accounts remain in historical cohorts. For each quiz, average each participating Student's highest submitted percentage; exclude Students without a submitted attempt from that quiz average and state its participant count. Avoid combining the diagnostic with course-quiz results. Proposed small-group protection: show participation counts but suppress completion breakdown and quiz statistics for cohorts with fewer than five Students; suppress a quiz's statistics if fewer than five Students contributed attempts. These report definitions and the threshold require final product-owner review.

### 17.2 Review dispositions and launch responsibilities

- Approved identity corrections remain Administrator-verified account support; Students may edit learning-profile preferences without changing approved identity. Student-to-staff conversion is not part of the requested first-release role-change workflow. This is a proposed scope default, not a new conversion feature.
- Urgent takedown and emergency suspension before content reassignment are not approved capabilities. Retain ordinary archive/access and deactivation/reassignment rules; do not add emergency permissions without an explicit scope decision.
- Ordinary password-strength rules, verification/invitation expiry values, resource-size limits, and text-length bounds are delegated to the technical specification for later review. Preserve the explicitly approved 30-minute reset expiry and the required fields, uniqueness, role restrictions, and content-validation outcomes in this PRD. No implementation may silently omit those checks.
- Actual learning materials, career guides, and diagnostic questions are supplied by authorized Faculty and approved by the Program Head. Content availability is a launch dependency, not permission to publish placeholder or invented approved content. No minimum catalog size has been selected; features must truthfully handle an empty or insufficient catalog.
- External AI roadmaps remain optional and deferred. Include the promised reminder during final scope review; no provider or external tracking feature is selected.
- The editorial clarifications that an active roadmap is optional and that personalized roadmap generation needs a complete profile preserve the agreed Student choice and personalization prerequisites.


## 18. Source reconciliation and remaining deliverables

| Original source area | Product disposition |
|---|---|
| Administrator account/security management | Retained with explicit approval, invitation, recovery, deactivation, and fixed-role rules |
| System monitoring | Administrative activity visibility retained; no grant to private student content |
| System maintenance examples such as backups/cache clearing | No maintenance dashboard capability approved; implementation operations belong in technical documents |
| Program Head curriculum approval | Replaced by supplemental course/career-path publication oversight |
| Program Head faculty assignments and unit loads | Replaced by supplemental content ownership transfer; official schedules/loads excluded |
| Program Head academic reports | Limited to aggregate CS-GAMUERS participation, learning results, and content state |
| Faculty registration and content management | Retained with Administrator approval, single ownership, and Program Head publication review |
| Faculty review recommendations | No separate faculty AI/personalized-recommendation permission granted by the agreed first-release roles |
| Faculty review student progress | Limited to courses currently owned |
| Student search, recommendations, roadmap, materials, chat, progress | Retained and specified above |
| Reward after progress completion | Defined as one badge per completed course |

The final diagram set will live under `docs/diagrams/`, with separate use-case diagrams, system sequence diagrams, and flowcharts. They must share these role names, requirement IDs, states, and exception rules. System sequence diagrams describe actor/system interactions, not internal architecture.

After resolving the builder review, finalize the PRD and diagrams for product-owner review. Invoke the writing-plans skill after design approval and save the agreed documentation/handoff plan under `docs/superpowers/plans/`. Do not introduce technology or architecture into that plan without separate authorization. No application implementation is authorized by this document.
