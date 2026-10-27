# CS-GAMUERS product requirements

Status: approved by the product owner. This approval includes the operating rules in section 17. Application code changes remain outside the authorized scope.

## 1. Purpose and scope

CS-GAMUERS helps currently enrolled Computer Science students at the school learn beyond their regular classes and explore possible careers. Faculty create the courses, and the Program Head approves them. Students study lessons, pass quizzes, and earn a badge when they finish a course. AI can suggest what to study and help them build a personal learning plan.

The application operates independently of the school's existing academic system. It does not award academic credit or manage official enrollment, grades, curricula, teaching schedules, or faculty unit loads. It does not import enrollment or grade records. Reviewers consult school records outside the application.

The main reference is [the original use-case and system-sequence document](docs/project-documents/software-engineering-use-cases-and-system-sequence-diagrams.docx). Where that document describes official academic administration, the requirements here follow the supplemental-learning scope we agreed on. Section 18 explains those changes.

This document defines product behavior, permissions, information requirements, and acceptance criteria. Technology choices belong in `TRD.md`, architecture in `ARCHITECTURE.md`, and visual design in `DESIGN_SYSTEM.md` and `docs/design/`. None is selected here.

### 1.1 First-release outcomes

- Eligible students can obtain manually approved accounts and start learning without school-system integration.
- Faculty can author courses and career paths; Program Heads control publication and retirement.
- Students can complete required quizzes, retain their progress, and earn a course badge once.
- Personalized suggestions use the approved catalog and the student's own learning context.
- Students control whether to accept or replace a personal roadmap.
- Core learning remains usable when AI is unavailable.
- Developers can trace the same rules across the PRD, use cases, system sequence diagrams, and flowcharts.

The acceptance scenarios in section 16 describe how to check whether the agreed features work. Targets for adoption, learning improvement, and application performance have not been set.

### 1.2 Approaches considered and selected

| Decision | Selected approach | Other approach considered |
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

Faculty write course content and submit it to the Program Head for approval. A personal roadmap uses approved content, but the Program Head does not review each student's individual plan.

## 3. Roles and information access

PERM-01. Each account has exactly one role: Student, Faculty, Program Head, or Administrator. Each role has the permissions below. Individual accounts do not have custom permissions.

| Capability | Student | Faculty | Program Head | Administrator |
|---|---|---|---|---|
| Study courses, take quizzes, receive personal AI guidance and badges | Own account | Not granted by this role | Not granted | Not granted |
| Apply for a student/faculty account | Student application | Faculty application | Invitation only | Invitation only |
| Verify student applications | No | Yes, approved Faculty only | No | Yes |
| Verify faculty applications | No | No | No | Yes |
| Invite Administrators and Program Heads | No | No | No | Yes |
| Author courses, career paths, and the shared assessment | No | Owned content | No | No |
| Approve content publication, revisions, and retirement | No | No | Yes | No |
| Transfer course, career-path, or shared-assessment ownership | No | No | Yes | No |
| See individual course progress and quiz results | Own | Only courses currently owned | No | No |
| See program-wide aggregate learning reports | No | No additional grant | Yes | No additional grant |
| Read private AI conversations | Own | No | No | No |
| Account support, recovery, staff role changes, deactivation | Limited self-service below | No administrative grant | No administrative grant | Yes, with safeguards |
| Read administrative activity history | No | No additional grant | No additional grant | Yes |

PERM-02. Faculty reviewing a student application can see the identity and application details needed for verification. Approving the account does not give them access to the student's full learning profile, unrelated course results, or private AI conversations.

PERM-03. A career-path owner can see individual student records only for courses they also own. When course ownership changes, the previous owner loses editing access and access to that course's student records. The new owner receives those responsibilities.

PERM-04. Program Heads oversee content and view reports about groups of students. They cannot open individual learning records. Administrators manage accounts, access, and administrative history. They cannot author or approve learning content, view individual learning results, or change progress or rewards.

PERM-05. No applicant may approve their own application. Unapproved Faculty cannot verify students, inspect student learning records, or manage content.

## 4. Accounts and onboarding

### 4.1 Registration and identity

ACC-01. Student registration requires full name matching the enrollment list, complete student number, school email, and password. Preserve the student number as text, including leading zeros.

ACC-02. Students use an existing school-issued address under `@caloocan.sti.edu.ph` and verify ownership by email. The system does not construct addresses from names or student numbers. Verification of email control does not replace manual enrollment verification.

ACC-03. Faculty registration requires full name, a reachable email address, and password. A school employee number is optional. Faculty may use a personal email address and must verify it.

ACC-04. Each student number and email address can belong to only one account. This includes pending, rejected, and deactivated accounts. Returning users recover or reactivate their existing account. If someone entered another student's number by mistake, an Administrator must verify and correct the mistake before that number can be assigned to its rightful owner.

ACC-05. Every user creates a separate CS-GAMUERS password. School login credentials and school sign-in integration are not used.

### 4.2 Manual application review

ACC-06. Approved Faculty or Administrators compare a student applicant's full name and student number against an enrollment list they already have access to outside the application. No list import or student document upload is required.

ACC-07. An Administrator checks a faculty applicant's authorization against existing school records, verifies identity in person using a school-issued employee ID, and confirms that the verified application email belongs to the applicant.

| Application status | Applicant capabilities | Reviewer action |
|---|---|---|
| Pending | Sign in, complete/correct the profile, and see status; no learning or staff permissions | Approve, request correction, or reject |
| Needs correction | Read the reason, correct the same application, and resubmit | Provide a reason; resubmission returns to Pending |
| Approved | Receive the permissions of the approved role, subject to account activation and feature prerequisites | Approval is recorded |
| Rejected | Read the reason; no learning or staff permissions | An Administrator may reopen after verifying an error; see ACC-20 |

ACC-08. Students are verified once when they register. Approval does not expire each term, and students do not submit renewal requests. Staff must report graduates, withdrawals, or changes of program so an Administrator can deactivate accounts that are no longer eligible. Until staff act, a former student may still have access.

ACC-20. Only an Administrator can reopen a rejected application. They must verify the error and record a reason, then return the same application to Pending for review. Reopening does not approve it. Applicants can still correct and resubmit a Needs correction application themselves.

### 4.3 Invited staff and role changes

ACC-09. The school designates the initial Administrator. Existing approved Administrators invite additional Administrators and appoint Program Heads. Those roles cannot be selected through public self-registration.

ACC-10. Invitees verify the intended invitation email, provide a full name, and create a password. Employee number is optional. Invitations grant access only to the intended recipient after acceptance.

ACC-11. An Administrator can change another staff member's role. They must give a reason, and the system records the change and notifies the affected person. The change ends existing sessions so the person must sign in with their new permissions. Administrators cannot change their own role or remove the last active Administrator.

ACC-12. Before a faculty member loses their authoring role, the Program Head must transfer their courses, career paths, and any shared skills assessment they own to another approved faculty member. Student-to-staff conversion is outside this release, as specified in section 17.

### 4.4 Password and assisted recovery

ACC-13. A user can request a password reset using their registered email. The screen shows the same acknowledgment whether or not that account exists. A reset link works once and expires after 30 minutes. Requesting a new link invalidates older links. After a successful reset, all existing sessions end and the user signs in again.

ACC-14. Password recovery preserves account approval, roles, deactivation state, and learning records. It cannot reactivate an account or bypass pending approval.

ACC-15. A user who loses access to their email must ask an Administrator for help. Recovery follows these steps:

1. The Administrator checks a school-issued student or employee ID in person and matches it to the existing account.
2. The user supplies and verifies a replacement email. Students must still use the school email domain.
3. The system replaces the address and notifies the old address.
4. Existing sessions and password-reset links stop working.
5. The user sets their own password. Their existing account, role, approval status, and learning records are preserved.

Another Administrator must handle an Administrator's assisted recovery.

ACC-16. There is no first-release emergency recovery flow if no Administrator has access and email-based recovery is also unavailable.

### 4.5 Deactivation and reactivation

ACC-17. Students can deactivate their own accounts after confirming their password. This immediately ends their sessions and blocks learning access. Their profile, progress, completed courses, and badges stay saved. Reactivation requires an Administrator to approve a fresh enrollment check.

ACC-18. An Administrator can deactivate a student or staff account. They must record a reason and communicate it to the affected user. Deactivation immediately ends sessions and account access. Before deactivating a faculty member, the Program Head must transfer their owned content. Administrators cannot deactivate themselves or the last active Administrator.

ACC-19. Another active Administrator must verify a staff member's authorization before approving reactivation. An emergency suspension that bypasses content transfer is not part of the agreed workflow.

## 5. Student learning profile

PROFILE-01. Approved students can browse and start courses before completing their learning profile. Personalized recommendations require all the required profile answers below. Taking the optional assessment does not replace those answers.

| Field | Requirement | Values/meaning |
|---|---|---|
| Interests | At least one | Shared CS topics below |
| Current learning goal | Exactly one | Explore CS careers; build foundational CS skills; improve a specific topic; prepare for a specific career |
| Target topic | Required for improving a specific topic | One shared topic |
| Career choice | Explicit choice of a published career path or "I'm not sure yet" | A concrete path is required for preparing for a specific career |
| Experience level | Exactly one | No experience; Beginner; Intermediate; Advanced |
| Available study hours per week | Optional | Used only for optional roadmap pacing estimates |

Experience descriptions: No experience means starting from scratch; Beginner means following guided exercises; Intermediate means building small projects independently; Advanced means experience building larger projects. These are self-reports, not verified qualifications or access restrictions.

PROFILE-02. The fixed first-release topic list is shared by profile interests, course primary topics, and discovery filters:

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

ASSESS-01. The skills assessment is an optional, untimed quiz that helps identify a starting point for recommendations. There is one shared assessment, with one faculty owner assigned by the Program Head. The owner writes it, and the Program Head approves publication and revisions through the same review process used for courses. Students can skip it and still receive recommendations based on their profile.

ASSESS-02. The assessment contains exactly 15 questions, with three questions for each of these topics: programming fundamentals, problem-solving, databases, computer systems, and basic networking. Each question has four ordinary answer choices, exactly one correct answer, and an additional "I don't know yet" option. The faculty author provides an explanation of the correct answer.

ASSESS-03. Each correct answer earns one point. An incorrect answer or "I don't know yet" earns zero, with no penalty. Results are shown by topic, with no pass or fail. Three questions per topic give only a rough indication of what to study; the result does not establish mastery or determine whether a student is suited to a career.

ASSESS-04. Students can retake the assessment whenever they choose. Recommendations use the latest completed attempt. Earlier results stay saved, and an unfinished retake does not replace the previous result. The assessment awards no course credit, badges, or course completion and does not restrict course access.

ASSESS-05. After submission, students can see the correct answers and their explanations. An unfinished attempt keeps the assessment revision it started with, even if a new revision is published. New attempts use the latest published revision. Saving and submission follow the rules in section 9, while the assessment keeps its own scoring rules.

## 7. Writing and approving learning content

### 7.1 Courses and lessons

CONTENT-01. Each course has one approved faculty owner, initially the person who created it. The owner edits drafts, submits changes for review, and reviews student results for that course. The Program Head can transfer the course to another approved faculty member. The transfer preserves the content, student records, and authorship history.

| Item | Required before submission for approval | Optional |
|---|---|---|
| Course | Title, description, one primary topic, difficulty, at least one learning outcome, ordered lessons | Prior-knowledge guidance, prerequisite-course references, estimated study time |
| Lesson | Title, at least one learning resource, position in course | One quiz, additional resources |
| Written resource | Learning content | Supporting description |
| PDF resource | Attachment and descriptive title | Supporting description |
| External resource | Link and descriptive title | Supporting description |

CONTENT-02. A course needs at least one lesson and one required quiz. Its difficulty is Beginner, Intermediate, or Advanced. Faculty can save incomplete drafts, but all required fields and quiz details must be complete before submission to the Program Head. The system records the owner, revision number, review status, publication status, and publication dates.

CONTENT-03. Prerequisites and learning order are guidance. Students can start any published course that is open to new learners and access its lessons and quizzes in any order. Recommended prior knowledge stays visible, but it does not lock the course.

### 7.2 Review, publication, and revisions

CONTENT-04. The Program Head can approve publication, request changes, or reject a submission. Requests for changes and rejections need a reason. Students can access only published content. Faculty and Administrators cannot publish content without this approval.

CONTENT-05. Changes to published content go through review again. Students keep seeing the existing approved revision while the new one is under review. Approval applies to the content that was submitted and reviewed; later edits cannot be included without review.

CONTENT-06. Students keep the course revision they started, including its learning materials, quizzes, and completion requirements. A new publication does not change their course. Students who start afterward receive the latest published revision. Updates never reset existing progress, scores, completed courses, or badges.

CONTENT-07. Faculty request retirement, and the Program Head approves archiving. An archived course disappears from discovery and new recommendations, and new students cannot start it. Students who already started it can continue their version. Completed records and badges remain available. Published courses are retained; only unpublished drafts can be deleted.

CONTENT-08. Ordinary archiving keeps access open for existing learners. An urgent takedown that also removes their access has not been approved. External websites may also change or remove resources even when the course itself stays unchanged.

### 7.3 Career paths

PATH-01. Each career path has one faculty owner. Publication requires a name, career description, skills list, and at least one published course in a suggested order. Faculty may reference courses owned by other Faculty.

PATH-02. Career paths use the same ownership, review, revision, transfer, and archiving rules as courses. The Program Head approves publication and revisions. Archived paths are not included in new recommendations.

PATH-03. Updating or archiving a career path does not automatically change an accepted personal roadmap. A path owner receives no extra student-record permissions over its referenced courses.

## 8. Finding and starting courses

DISC-01. Approved students can browse published courses that are open to new learners. Search matches course titles and descriptions. Students can filter by topic and difficulty, then clear filters to return to the full available catalog.

DISC-02. Course details show description, learning outcomes, faculty owner, lesson outline, and completion requirements. Prerequisite guidance is advisory and visible.

DISC-03. Selecting "Start course" starts the latest published revision without another faculty approval step. If the student has already started that course, the system resumes their existing course rather than creating a duplicate. The same rule applies when they start from a recommendation.

DISC-04. "My learning" contains started and completed courses, including archived courses the student previously started. Archive status does not remove that existing right to continue.

## 9. Quizzes, scoring, and saved answers

### 9.1 Quiz structure and grading

QUIZ-01. Each lesson can have one quiz. A quiz needs a title, a required-or-optional setting, a passing percentage, and at least one question. Each question needs text, exactly four distinct answer choices, exactly one correct answer, and an explanation. Students must answer every question before submitting.

QUIZ-02. Every correct answer is worth one point; incorrect answers earn zero. Questions have equal weight. Default passing percentage is 80%; Faculty may choose a whole-number percentage from 1 through 100 before Program Head approval.

QUIZ-03. Compare the exact score against the threshold, without rounding up. For `c` correct answers, `n` questions, and threshold `p`, pass when `100 × c >= p × n`. Seven correct out of nine does not meet 80%.

QUIZ-04. Course quizzes are untimed and allow unlimited retakes. After submission, students see their score, the correct answers, and the faculty explanations. The system saves every attempt and uses the highest score to decide whether the student has passed. A later failed attempt cannot undo a pass, course completion, or badge.

### 9.2 Saved attempts and submission behavior

QUIZ-05. Answers save automatically as students work. The screen shows whether their latest changes are saved or still waiting to save. Students can leave and resume an unfinished attempt. Each student can have at most one unfinished attempt for a particular quiz or for the shared skills assessment.

QUIZ-06. The system grades each submitted attempt once. Repeated clicks and retries cannot create duplicate attempts or badges. If the connection drops during submission, the system checks whether the attempt was submitted successfully before offering a retry.

QUIZ-07. A submitted attempt cannot be edited. Retaking starts a new attempt. The same reliability rules apply to the diagnostic assessment with its separate scoring rules. Offline quiz-taking is not part of this release.

QUIZ-08. Course quizzes show one of three statuses: Not started, In progress, or Passed. An attempt below the passing score leaves the quiz In progress, with its result and feedback available. Once passed, a quiz stays Passed during and after later retakes.

## 10. Progress and rewards

PROGRESS-01. Course progress is `passed required quizzes / all required quizzes × 100`. For example, passing two of four required quizzes gives 50% progress. Every published course has at least one required quiz. Optional quizzes show their own results but do not affect this calculation. Opening a lesson or resource does not increase completion progress.

PROGRESS-02. A student completes a course by passing every required quiz in the revision they started. A newer published revision does not change those requirements.

PROGRESS-03. Roadmap progress is `completed included courses / all included courses × 100`. Each course has equal weight, regardless of its estimated study time. Courses completed earlier count if they are included in the roadmap. The roadmap is complete when every included course is complete.

REWARD-01. Completing a course automatically earns a badge showing its name and the completion date. A student can earn that course badge only once. Retakes and later revisions do not create another badge. Badges appear on the student dashboard and stay saved after updates, archiving, or account deactivation.

REWARD-02. The first release awards course-completion badges only. It has no points, leaderboard, diagnostic-assessment rewards, or separate roadmap badge. AI cannot award badges, and Administrators cannot override completion or award them manually.

## 11. Recommendations and personal roadmaps

### 11.1 Recommendations

REC-01. Personalized recommendations require a complete learning profile. The system considers interests, the current learning goal, experience, a preferred career if known, the latest completed skills assessment if available, and completed courses. It first matches goals and interests to the approved catalog, then uses the other information to adjust the suggestions and learning order.

REC-02. Recommend up to three approved career paths and five suitable published courses that new learners can start. Explain how each suggestion relates to the student's interests or learning needs. Show fewer results when suitable content is limited. Every suggestion must refer to a real catalog item.

REC-03. Suggestions for what to study next exclude courses the student already completed. Students who are unsure of their career can receive career suggestions without choosing a career first. Suggestions do not start courses or change an active roadmap.

REC-04. The model, hosting, and exact method for ranking suggestions will be decided in the technical specification. The product requirement is to personalize suggestions while respecting the approved catalog and the rules above.

### 11.2 Roadmap creation and replacement

ROAD-01. Students with a complete learning profile can request a roadmap for a chosen career path or a specific learning goal. The plan lists courses in a suggested order and explains why they are included. Relevant courses completed earlier count toward the plan.

ROAD-02. A student can have at most one active roadmap. A student who has not accepted a plan has none. The student previews and accepts a proposed plan before it becomes active. Replacing it also requires a preview and explicit confirmation. Course attempts, progress, completions, and badges remain saved.

ROAD-03. Profile changes, assessment retakes, and content updates do not automatically replace a roadmap. Students can study courses outside their plan and follow a different order.

ROAD-04. A roadmap lists courses without starting them. If a course changes before the student starts it, they receive the latest published revision when they select "Start course." Courses already started keep their existing revision.

ROAD-05. If a roadmap course is archived, students who already started it can continue their version. Other students see that it is unavailable. The course is not silently removed or marked complete. They can request a replacement roadmap, review it, and accept it. If no suitable replacement exists, explain that the catalog cannot currently provide a complete plan for their goal.

ROAD-06. After a replacement is accepted, its course list determines roadmap completion. Updating or archiving the shared career path does not automatically change a student's accepted plan.

### 11.3 Optional study-time estimates

ROAD-07. Faculty can include an optional course study-time estimate in the content sent to the Program Head for approval. A student can also enter their available study hours per week. When every unfinished roadmap course has an estimate and weekly hours are provided, show an approximate duration: total estimated hours for unfinished courses divided by the available hours per week.

ROAD-08. Leave completed courses out of the estimate. Count the full estimate for each unfinished course because the application does not track actual study hours. If any required estimate is missing, show the course order without a duration. Estimates create no deadlines or penalties and do not affect progress or badges. They cannot precisely account for partial progress or retakes.

### 11.4 External roadmap request

ROAD-09. External AI roadmaps would suggest learning resources on other websites, separately from the internal roadmap. This feature remains optional and deferred from the required first release. Its search service, generation rules, costs, and treatment of external completion have not been selected. Revisit the deferral during final scope review.

## 12. AI chat, limits, and availability

AI-01. Students can ask AI chat to explain programming concepts, course material, feedback they have received on quizzes, career paths, recommendations, and their roadmap. They can also ask for course or career suggestions and a proposed roadmap. Requests through chat follow the same recommendation rules and roadmap-acceptance steps as requests elsewhere in the application.

AI-02. The system may automatically provide the student's learning profile, skills-assessment summary, roadmap, and course progress as context. It must leave out their name, student number, email, other students' records, and unreleased quiz answer keys.

Messages that students type themselves are sent to the AI, including any personal information they choose to type. Show a clear reminder near the chat input: "Your messages are sent to the AI. Do not include personal information, such as your name, student number, email, or passwords." The application does not promise to automatically remove personal information from typed messages.

AI-03. AI chat cannot change scores, mark learning complete, award badges, approve accounts, or bypass content review. Students still choose whether to start a suggested course or accept a proposed roadmap. Chat cannot make those changes silently.

AI-04. The project aims to avoid paid AI services. No model or provider has been selected, and the application must never switch to a paid service automatically. Free services may become unavailable or run out of capacity.

AI-05. Each student has an allowance of 20 successful AI requests per day, resetting at midnight Philippine time. A chat message, a recommendation request, or a roadmap request uses one allowance when it succeeds. Asking for recommendations through chat counts once, not twice. Reading saved content uses no allowance. Failed requests do not count, and retrying the same successful request cannot charge it again. Show the remaining allowance and its reset time.

AI-06. When AI is unavailable, the service has no capacity, or the student has used their daily allowance, core learning continues. Students can browse courses, study lessons, take quizzes, earn badges, and read saved roadmaps and conversations. Explain why new AI responses are unavailable and offer catalog browsing or a later retry. A failed request leaves learning records and the active roadmap unchanged.

AI-07. Students can save and reopen separate conversations. A conversation disappears from accessible history 90 days after its last message. Students can delete it sooner. Deleted or expired conversations are no longer supplied as AI context. Deletion does not remove accepted roadmaps, learning records, or badges and does not restore used AI allowance. Faculty, Program Heads, and Administrators cannot read private conversations.

## 13. Reports and administrative history

REPORT-01. Program Heads can see reports about course participation, ongoing and completed courses, completion rates, and course-quiz results. They can also see content awaiting review, published content, archived content, and its faculty owners. Reports can be filtered by course, revision, and date range.

REPORT-02. Reports summarize groups of students and do not provide access to individual learning records or private conversations. They contain no imported official grades, school enrollment trends, or faculty evaluations. Section 17 defines the calculations and rules for small groups.

REPORT-03. Administrators can read administrative history, including who approved accounts, changed roles, or approved content. These records do not expose student quiz answers, individual assessment results, or private chat messages.

## 14. Notifications

NOTICE-01. Students and staff see application and content status in their existing dashboards. There is no separate notification inbox.

| Event | Dashboard/in-application behavior | Email recipient |
|---|---|---|
| Application review decision | Applicant sees current status and applicable reason | Applicant; include correction/rejection reason |
| Account deactivation/reactivation | Reflect actual access/status where sign-in is permitted | Affected user; include applicable reason |
| Staff role change | Apply new permissions after sign-in | Affected staff member |
| Course/career-path review submission | Program Head sees pending work | No review-request email required by current decision |
| Content approved/returned/rejected | Owner sees outcome and applicable reason | Faculty owner |
| Ownership transfer | Reflect current owner and permissions | Previous and new owner |
| Quiz result/badge/AI allowance | Display in the application | No additional email required |

NOTICE-02. Email verification, invitations, password resets, and notices to an old email address follow the account flows. Section 17 defines how to handle a delivery failure after an account or content decision has already succeeded.

## 15. Required product records

These are the records the product needs to keep. The database design, password storage, and other technical details belong in the technical documents.

| Record | Required product information |
|---|---|
| Account | Identity, unique verified email, exactly one role, application status where applicable, active/deactivated state, relevant reasons and decision history; student number required for Students; employee number optional for staff |
| Invitation | Intended email, invited role, inviting Administrator, acceptance state; expiry value to be specified in TRD.md |
| Learning profile | Required/conditional selections in section 5; optional weekly hours |
| Course | Stable identity, current owner, title/description/topic/difficulty/outcomes, ordered lessons, approval/publication/archive state, revision history, authorship; optional prerequisites/effort estimate |
| Course revision | Approved content, required quiz set, grading thresholds, review result, publication information; referenced by course participation |
| Resource | Type and content/attachment/link; descriptive title for PDFs/links |
| Quiz/question | Title, required flag, threshold, questions with four distinct choices, correct choices, explanations |
| Skills assessment | One faculty owner; approved revisions of the 15-question form; topic for each question; four ordinary choices and an unknown-answer option; correct answer and explanation; publication and review history |
| Attempt | Owner Student, course/assessment revision context, saved answers, unfinished/submitted state, submitted result and submission time; unsubmitted answers are not graded |
| Course participation | Student, stable course identity, revision at start, start time, attempts/passage, completion time where completed |
| Badge | Student, stable course identity, course name, original completion date; unique per Student/course |
| Career path | Owner, name/description, skills, ordered course references, review/publication/archive/revision history |
| Recommendation result | Student, career/course suggestions with explanations; visibility and refresh must respect current catalog availability |
| Personal roadmap | Student, goal context, ordered courses and reasons, proposed/accepted status, active-plan relationship, acceptance history, optional pace estimate |
| Conversation | Student owner, messages, last-message date, expiry/deletion state; private and separate from learning records |
| AI usage | Student, allowance date in Philippine time, count of successful logical requests, remaining allowance; no duplicate charge on retries |
| Administrative event | Actor, action, affected record, date/time, and reason where required; no private chat or quiz-answer content |

DATA-01. Accounts, quiz attempts, course progress, accepted roadmaps, and badges have no automatic expiry. Deactivation preserves them. Published course and career-path revisions remain available wherever existing student records depend on them. The application has no permanent account-deletion feature in the first release. Chat history follows its separate 90-day and student-deletion rules.

## 16. Checks for the agreed behavior

| ID | Scenario and required result | Requirements |
|---|---|---|
| AC-01 | A verified school email alone does not unlock learning; manual student approval is required | ACC-01 through ACC-08 |
| AC-02 | Pending/unapproved Faculty cannot approve Students or inspect learning records | PERM-05, ACC-07 |
| AC-03 | Duplicate student number or email cannot create another account even if the existing account is deactivated | ACC-04 |
| AC-04 | Password reset expires after 30 minutes, is consumed once, and does not reactivate a deactivated account | ACC-13 through ACC-14 |
| AC-05 | Assisted recovery requires identity checking and verified replacement email and preserves existing records | ACC-15 |
| AC-06 | A staff role change revokes old access; last-Administrator and ownership safeguards prevent prohibited changes | ACC-11 through ACC-12, ACC-18 |
| AC-07 | Approved Student without a complete learning profile can start a course but cannot receive personalized recommendations | PROFILE-01, REC-01 |
| AC-08 | Skipping the diagnostic permits profile-based recommendations; an unfinished retake does not replace previous completed results | ASSESS-01 through ASSESS-04 |
| AC-09 | A course missing a lesson, learning resource, required quiz, or complete quiz question cannot be submitted for publication | CONTENT-02, QUIZ-01 |
| AC-10 | Faculty cannot publish their own draft; Program Head rejection/change request includes a reason | CONTENT-04 |
| AC-11 | A Student starts revision A; revision B publishes with different quizzes; that Student retains A while a new Student receives B | CONTENT-05 through CONTENT-06 |
| AC-12 | Archived course cannot be newly started, but an existing Student can continue and keep their badge | CONTENT-07, DISC-04 |
| AC-13 | Transfer removes former owner access, preserves records, and does not grant access to unrelated courses | PERM-02 through PERM-03, CONTENT-01 |
| AC-14 | Seven correct out of nine fails an 80% quiz; later passage followed by failure retains Passed and completion | QUIZ-03 through QUIZ-04 |
| AC-15 | Resume saved answers after leaving; retry uncertain submission without creating a second attempt, score, or reward | QUIZ-05 through QUIZ-07 |
| AC-16 | Two of four required quizzes yields 50%; optional quiz completion and resource views do not change that percentage | PROGRESS-01 |
| AC-17 | Completing every required quiz awards exactly one badge, even when completion is retried or the course is revised | REWARD-01 |
| AC-18 | Limited catalog yields fewer suggestions with real published references, not invented courses or paths | REC-02 |
| AC-19 | Student explicitly accepts a replacement roadmap; existing course records remain; a profile change alone does not replace it | ROAD-02 through ROAD-03 |
| AC-20 | Unstarted archived roadmap course remains unavailable rather than becoming complete; replacement requires acceptance | ROAD-05 |
| AC-21 | Missing weekly hours or any unfinished course estimate produces an ordered plan without a duration | ROAD-07 through ROAD-08 |
| AC-22 | AI cannot award a badge, publish a course, change a grade, or bypass Student acceptance of a roadmap | AI-03 |
| AC-23 | Recommendation through chat costs one successful request; a failed request or retry does not consume another allowance | AI-05 |
| AC-24 | AI outage leaves quizzes, core learning, saved conversations, and saved roadmap usable; no paid fallback activates | AI-04 through AI-06 |
| AC-25 | Chat deletion or 90-day expiry removes history/context without deleting accepted roadmap or restoring AI allowance | AI-07 |
| AC-26 | Program Head aggregate reports and Administrator activity views do not expose individual quiz records or chat contents | PERM-04, REPORT-01 through REPORT-03 |
| AC-27 | Decisions are visible on the relevant dashboard and email recipients follow the approved event matrix | NOTICE-01 through NOTICE-02 |
| AC-28 | A rejected applicant cannot resubmit directly; an Administrator verifies the error, records a reason, and returns the same application to Pending | ACC-20 |
| AC-29 | Updating the shared assessment leaves an unfinished attempt on its original revision; submitted results reveal the correct answers and explanations | ASSESS-01, ASSESS-02, ASSESS-05 |
| AC-30 | Automatic AI context excludes account identity; student-written messages are sent, and the chat clearly reminds students not to include personal information | AI-02 |
| AC-31 | Email delivery fails after approval; the decision stays saved, permitted dashboards show its state, and retrying delivery does not repeat approval | P-01 |
| AC-32 | An unsafe or unsupported upload or invalid link is rejected with feedback on the affected field | P-02 |
| AC-33 | Invalid drafts keep entered data; an outdated review screen cannot approve changed content | P-03 |
| AC-34 | Rounded display values never show 100% before the completion requirement is satisfied | P-04 |
| AC-35 | Blank effort estimates are accepted; supplied invalid hours are rejected; missing estimates produce no duration | P-05 |
| AC-36 | Core flows support keyboard use, labeled inputs, understandable errors, and status meaning without color alone | P-06 |
| AC-37 | Reports use course starts within the date range, retain historical deactivated accounts, and hide completion/quiz breakdowns below the five-student threshold | P-07 |
| AC-38 | Learning preferences can change without identity reassignment; approved identity corrections require Administrator verification; Student-to-staff conversion is unavailable | P-08 |

## 17. Operating rules

The three questions from the requirements review are resolved: AI-02 defines the chat privacy boundary, ASSESS-01 through ASSESS-05 define the shared assessment, and ACC-20 defines reopening a rejected application.

The product owner approved these rules with the PRD.

### 17.1 Errors, input checks, and accessibility

| ID | Required behavior |
|---|---|
| P-01 | If an email fails after a successful account or content decision, keep the decision and show the current status in the relevant dashboard where the user has access. Account support can see the delivery failure without seeing private learning content. Retrying the email must not repeat the decision. |
| P-02 | Reject unsafe or unsupported uploads and invalid links with an error next to the affected field. File-size limits and supported text formatting will be specified in `TRD.md`. |
| P-03 | Keep entered draft data when validation fails and explain what needs correcting. A reviewer cannot approve a changed submission using an outdated review screen. |
| P-04 | Show 100% only after the completion requirements are met. Display rounding must not make unfinished work appear complete. |
| P-05 | Supplied study-hour estimates must be positive, finite numbers. Weekly availability cannot exceed 168 hours. Leaving estimates blank remains valid. |
| P-06 | Core flows support keyboard use, labeled inputs, clear error messages, and status indicators that do not depend only on color. Styling belongs in `DESIGN_SYSTEM.md`. |

### 17.2 Report calculations

P-07. A date filter selects students who started the selected course and revision within that date range. The report shows where those students are now, including completions recorded after the selected period. For example, a report for September starts can show that some of those students finished in October.

| Report | Calculation |
|---|---|
| Participation for a course and revision | Count each student who started within the date range once |
| Unique participation across selected courses | Count each student once, even if they started several courses |
| Completed courses | Count selected course starts that are complete when the report is viewed |
| Ongoing courses | Count selected course starts that are not yet complete |
| Completion rate | Divide completed course starts by all selected starts; show no data when there are none |
| Results for a particular quiz | Average each student's highest submitted percentage; leave out students with no submitted attempt and show how many students contributed |

Deactivated accounts remain in historical reports because their records are retained. Reports keep the shared skills assessment separate from course-quiz results.

For groups with fewer than five students, the privacy rule is to show participation counts but hide completion breakdowns and quiz statistics. Hide a quiz's statistics if fewer than five students have submitted attempts, even when the wider group is larger. The minimum reporting group is five students.

### 17.3 Identity changes and release boundaries

P-08. Students can update their learning interests and goals. Corrections to approved identity details require Administrator verification. Converting a Student account into a staff account is outside the first-release role-change workflow.

Emergency content removal and suspension before content reassignment have not been added. The application follows the ordinary archive, access, and deactivation rules already agreed.

Password-strength rules, verification and invitation expiry, file-size limits, and text-length limits will be specified in `TRD.md` for later review. The technical specification must preserve the rules already set here, including the 30-minute reset link, unique account identifiers, required content fields, and permission checks.

Faculty supply the actual learning materials, career guides, and assessment questions, and the Program Head approves them. No minimum catalog size has been selected. The application must explain when the catalog is empty or cannot support a requested recommendation or roadmap.

External AI roadmaps remain optional and deferred. This is the reminder requested for final scope review: they are not required for the first release, and no provider, search cost, or external progress-tracking feature has been approved.

## 18. Changes from the original reference and remaining documents

| Original source area | Agreed scope |
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

The [diagram index](docs/diagrams/README.md) links to separate use-case diagrams, system sequence diagrams, and flowcharts. They must share these role names, requirement IDs, states, and exception rules. System sequence diagrams describe actor/system interactions, not internal architecture.

The PRD is approved. The [documentation handoff plan](docs/superpowers/plans/2026-10-27-cs-gamuers-product-handoff-plan.md) covers the diagrams, consistency checks, and final handoff. The product owner approved the diagram set and handoff plan after rereview on 2026-10-27, as recorded in that plan. Technology and architecture remain separate from this product documentation handoff. Approval of this document does not authorize application code changes.
