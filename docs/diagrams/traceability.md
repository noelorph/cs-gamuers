# Requirement traceability

[Diagram index](README.md) · [Approved PRD](../../PRD.md)

Each row links an approved PRD requirement or operating rule to the diagrams that show its behavior or the user goals affected by it. Diagrams summarize workflows; they do not replace field definitions or access rules. Cross-cutting rules such as keyboard access apply throughout the relevant flows and are not separate user goals.

Requirement IDs index affected goals as well as demonstrated behavior; an ID alone does not prove every clause is covered. Use-case associations identify goals, while sequence/flow branches and the index shared rules demonstrate specific behavior. P-01 is demonstrated in SS-01/FC-01 and SS-07/FC-03 and shared across applicable account/content decisions. P-04 is demonstrated for courses in SS-11/FC-04 and roadmaps in SS-13/FC-06.

The acceptance references point to section 16 of the PRD. A dash means the behavior is specified in the requirement and mapped diagrams but has no separately numbered acceptance example; the examples are not an exhaustive future test suite.

| Requirement | Diagrams | Acceptance examples |
|---|---|---|
| PERM-01 | [UC-01](use-cases/uc-01.svg), [UC-02](use-cases/uc-02.svg), [UC-06](use-cases/uc-06.svg), [SS-01](system-sequences/ss-01.svg), [SS-02](system-sequences/ss-02.svg), [SS-05](system-sequences/ss-05.svg), [FC-01](flowcharts/fc-01.svg), [FC-08](flowcharts/fc-08.svg) | - |
| PERM-02 | [UC-04](use-cases/uc-04.svg), [UC-06](use-cases/uc-06.svg), [SS-01](system-sequences/ss-01.svg), [SS-15](system-sequences/ss-15.svg), [SS-16](system-sequences/ss-16.svg), [FC-01](flowcharts/fc-01.svg) | AC-13 |
| PERM-03 | [UC-04](use-cases/uc-04.svg), [UC-05](use-cases/uc-05.svg), [UC-06](use-cases/uc-06.svg), [SS-08](system-sequences/ss-08.svg), [SS-15](system-sequences/ss-15.svg), [SS-16](system-sequences/ss-16.svg) | AC-13 |
| PERM-04 | [UC-04](use-cases/uc-04.svg), [UC-05](use-cases/uc-05.svg), [UC-06](use-cases/uc-06.svg), [SS-05](system-sequences/ss-05.svg), [SS-15](system-sequences/ss-15.svg), [SS-16](system-sequences/ss-16.svg), [FC-08](flowcharts/fc-08.svg) | AC-26 |
| PERM-05 | [UC-01](use-cases/uc-01.svg), [UC-04](use-cases/uc-04.svg), [UC-06](use-cases/uc-06.svg), [SS-01](system-sequences/ss-01.svg), [FC-01](flowcharts/fc-01.svg) | AC-02 |
| ACC-01 | [UC-01](use-cases/uc-01.svg), [SS-01](system-sequences/ss-01.svg), [FC-01](flowcharts/fc-01.svg) | AC-01 |
| ACC-02 | [UC-01](use-cases/uc-01.svg), [SS-01](system-sequences/ss-01.svg), [FC-01](flowcharts/fc-01.svg) | AC-01 |
| ACC-03 | [UC-01](use-cases/uc-01.svg), [SS-01](system-sequences/ss-01.svg), [FC-01](flowcharts/fc-01.svg) | AC-01 |
| ACC-04 | [UC-01](use-cases/uc-01.svg), [UC-06](use-cases/uc-06.svg), [SS-01](system-sequences/ss-01.svg), [SS-04](system-sequences/ss-04.svg), [FC-01](flowcharts/fc-01.svg), [FC-02](flowcharts/fc-02.svg) | AC-01, AC-03 |
| ACC-05 | [UC-01](use-cases/uc-01.svg), [SS-01](system-sequences/ss-01.svg), [SS-03](system-sequences/ss-03.svg), [FC-01](flowcharts/fc-01.svg) | AC-01 |
| ACC-06 | [UC-01](use-cases/uc-01.svg), [UC-04](use-cases/uc-04.svg), [UC-06](use-cases/uc-06.svg), [SS-01](system-sequences/ss-01.svg), [FC-01](flowcharts/fc-01.svg) | AC-01 |
| ACC-07 | [UC-01](use-cases/uc-01.svg), [UC-06](use-cases/uc-06.svg), [SS-01](system-sequences/ss-01.svg), [FC-01](flowcharts/fc-01.svg) | AC-01, AC-02 |
| ACC-08 | [UC-01](use-cases/uc-01.svg), [UC-06](use-cases/uc-06.svg), [SS-01](system-sequences/ss-01.svg), [FC-01](flowcharts/fc-01.svg) | AC-01 |
| ACC-20 | [UC-01](use-cases/uc-01.svg), [UC-06](use-cases/uc-06.svg), [SS-01](system-sequences/ss-01.svg), [FC-01](flowcharts/fc-01.svg) | AC-28 |
| ACC-09 | [UC-01](use-cases/uc-01.svg), [UC-06](use-cases/uc-06.svg), [SS-02](system-sequences/ss-02.svg) | - |
| ACC-10 | [UC-01](use-cases/uc-01.svg), [UC-06](use-cases/uc-06.svg), [SS-02](system-sequences/ss-02.svg) | - |
| ACC-11 | [UC-06](use-cases/uc-06.svg), [SS-05](system-sequences/ss-05.svg), [FC-08](flowcharts/fc-08.svg) | AC-06 |
| ACC-12 | [UC-06](use-cases/uc-06.svg), [SS-05](system-sequences/ss-05.svg), [SS-08](system-sequences/ss-08.svg), [FC-08](flowcharts/fc-08.svg) | AC-06 |
| ACC-13 | [UC-01](use-cases/uc-01.svg), [UC-06](use-cases/uc-06.svg), [SS-03](system-sequences/ss-03.svg), [FC-02](flowcharts/fc-02.svg) | AC-04 |
| ACC-14 | [UC-01](use-cases/uc-01.svg), [UC-06](use-cases/uc-06.svg), [SS-03](system-sequences/ss-03.svg), [FC-02](flowcharts/fc-02.svg) | AC-04 |
| ACC-15 | [UC-01](use-cases/uc-01.svg), [UC-06](use-cases/uc-06.svg), [SS-04](system-sequences/ss-04.svg), [FC-02](flowcharts/fc-02.svg) | AC-05 |
| ACC-16 | [UC-01](use-cases/uc-01.svg), [UC-06](use-cases/uc-06.svg), [SS-03](system-sequences/ss-03.svg), [SS-04](system-sequences/ss-04.svg), [FC-02](flowcharts/fc-02.svg) | - |
| ACC-17 | [UC-01](use-cases/uc-01.svg), [UC-06](use-cases/uc-06.svg), [SS-06](system-sequences/ss-06.svg), [FC-08](flowcharts/fc-08.svg) | - |
| ACC-18 | [UC-06](use-cases/uc-06.svg), [SS-05](system-sequences/ss-05.svg), [SS-06](system-sequences/ss-06.svg), [SS-08](system-sequences/ss-08.svg), [FC-08](flowcharts/fc-08.svg) | AC-06 |
| ACC-19 | [UC-06](use-cases/uc-06.svg), [SS-05](system-sequences/ss-05.svg), [FC-08](flowcharts/fc-08.svg) | - |
| PROFILE-01 | [UC-02](use-cases/uc-02.svg), [UC-03](use-cases/uc-03.svg), [SS-10](system-sequences/ss-10.svg), [SS-12](system-sequences/ss-12.svg), [SS-13](system-sequences/ss-13.svg), [SS-14](system-sequences/ss-14.svg), [FC-05](flowcharts/fc-05.svg), [FC-06](flowcharts/fc-06.svg), [FC-07](flowcharts/fc-07.svg) | AC-07 |
| PROFILE-02 | [UC-02](use-cases/uc-02.svg), [UC-03](use-cases/uc-03.svg), [SS-10](system-sequences/ss-10.svg), [SS-12](system-sequences/ss-12.svg) | - |
| ASSESS-01 | [UC-02](use-cases/uc-02.svg), [UC-04](use-cases/uc-04.svg), [UC-05](use-cases/uc-05.svg), [SS-07](system-sequences/ss-07.svg), [SS-08](system-sequences/ss-08.svg), [SS-11](system-sequences/ss-11.svg), [FC-03](flowcharts/fc-03.svg), [FC-05](flowcharts/fc-05.svg) | AC-08, AC-29 |
| ASSESS-02 | [UC-02](use-cases/uc-02.svg), [UC-04](use-cases/uc-04.svg), [UC-05](use-cases/uc-05.svg), [SS-07](system-sequences/ss-07.svg), [SS-11](system-sequences/ss-11.svg), [FC-05](flowcharts/fc-05.svg) | AC-08, AC-29 |
| ASSESS-03 | [UC-02](use-cases/uc-02.svg), [UC-04](use-cases/uc-04.svg), [UC-05](use-cases/uc-05.svg), [SS-11](system-sequences/ss-11.svg), [FC-05](flowcharts/fc-05.svg) | AC-08 |
| ASSESS-04 | [UC-02](use-cases/uc-02.svg), [UC-04](use-cases/uc-04.svg), [UC-05](use-cases/uc-05.svg), [SS-11](system-sequences/ss-11.svg), [FC-05](flowcharts/fc-05.svg) | AC-08 |
| ASSESS-05 | [UC-02](use-cases/uc-02.svg), [UC-04](use-cases/uc-04.svg), [UC-05](use-cases/uc-05.svg), [SS-07](system-sequences/ss-07.svg), [SS-11](system-sequences/ss-11.svg), [FC-03](flowcharts/fc-03.svg), [FC-05](flowcharts/fc-05.svg) | AC-29 |
| CONTENT-01 | [UC-04](use-cases/uc-04.svg), [UC-05](use-cases/uc-05.svg), [SS-07](system-sequences/ss-07.svg), [SS-08](system-sequences/ss-08.svg), [FC-03](flowcharts/fc-03.svg) | AC-13 |
| CONTENT-02 | [UC-04](use-cases/uc-04.svg), [UC-05](use-cases/uc-05.svg), [SS-07](system-sequences/ss-07.svg), [FC-03](flowcharts/fc-03.svg) | AC-09 |
| CONTENT-03 | [UC-02](use-cases/uc-02.svg), [UC-04](use-cases/uc-04.svg), [UC-05](use-cases/uc-05.svg), [SS-07](system-sequences/ss-07.svg), [SS-10](system-sequences/ss-10.svg), [FC-03](flowcharts/fc-03.svg) | - |
| CONTENT-04 | [UC-04](use-cases/uc-04.svg), [UC-05](use-cases/uc-05.svg), [SS-07](system-sequences/ss-07.svg), [FC-03](flowcharts/fc-03.svg) | AC-10 |
| CONTENT-05 | [UC-04](use-cases/uc-04.svg), [UC-05](use-cases/uc-05.svg), [SS-07](system-sequences/ss-07.svg), [FC-03](flowcharts/fc-03.svg) | AC-11 |
| CONTENT-06 | [UC-02](use-cases/uc-02.svg), [UC-04](use-cases/uc-04.svg), [UC-05](use-cases/uc-05.svg), [SS-07](system-sequences/ss-07.svg), [SS-10](system-sequences/ss-10.svg), [SS-11](system-sequences/ss-11.svg), [FC-03](flowcharts/fc-03.svg), [FC-04](flowcharts/fc-04.svg) | AC-11 |
| CONTENT-07 | [UC-02](use-cases/uc-02.svg), [UC-04](use-cases/uc-04.svg), [UC-05](use-cases/uc-05.svg), [SS-09](system-sequences/ss-09.svg), [SS-10](system-sequences/ss-10.svg), [FC-03](flowcharts/fc-03.svg) | AC-12 |
| CONTENT-08 | [UC-04](use-cases/uc-04.svg), [UC-05](use-cases/uc-05.svg), [SS-09](system-sequences/ss-09.svg), [FC-03](flowcharts/fc-03.svg) | - |
| PATH-01 | [UC-04](use-cases/uc-04.svg), [UC-05](use-cases/uc-05.svg), [SS-07](system-sequences/ss-07.svg), [FC-03](flowcharts/fc-03.svg) | - |
| PATH-02 | [UC-04](use-cases/uc-04.svg), [UC-05](use-cases/uc-05.svg), [SS-07](system-sequences/ss-07.svg), [SS-08](system-sequences/ss-08.svg), [SS-09](system-sequences/ss-09.svg), [FC-03](flowcharts/fc-03.svg) | - |
| PATH-03 | [UC-04](use-cases/uc-04.svg), [UC-05](use-cases/uc-05.svg), [SS-07](system-sequences/ss-07.svg), [SS-09](system-sequences/ss-09.svg), [FC-03](flowcharts/fc-03.svg) | - |
| DISC-01 | [UC-02](use-cases/uc-02.svg), [SS-10](system-sequences/ss-10.svg) | - |
| DISC-02 | [UC-02](use-cases/uc-02.svg), [SS-10](system-sequences/ss-10.svg) | - |
| DISC-03 | [UC-02](use-cases/uc-02.svg), [SS-10](system-sequences/ss-10.svg) | - |
| DISC-04 | [UC-02](use-cases/uc-02.svg), [SS-09](system-sequences/ss-09.svg), [SS-10](system-sequences/ss-10.svg) | AC-12 |
| QUIZ-01 | [UC-02](use-cases/uc-02.svg), [SS-11](system-sequences/ss-11.svg), [FC-04](flowcharts/fc-04.svg) | AC-09 |
| QUIZ-02 | [UC-02](use-cases/uc-02.svg), [SS-11](system-sequences/ss-11.svg), [FC-04](flowcharts/fc-04.svg) | - |
| QUIZ-03 | [UC-02](use-cases/uc-02.svg), [SS-11](system-sequences/ss-11.svg), [FC-04](flowcharts/fc-04.svg) | AC-14 |
| QUIZ-04 | [UC-02](use-cases/uc-02.svg), [SS-11](system-sequences/ss-11.svg), [FC-04](flowcharts/fc-04.svg) | AC-14 |
| QUIZ-05 | [UC-02](use-cases/uc-02.svg), [SS-11](system-sequences/ss-11.svg), [FC-04](flowcharts/fc-04.svg), [FC-05](flowcharts/fc-05.svg) | AC-15 |
| QUIZ-06 | [UC-02](use-cases/uc-02.svg), [SS-11](system-sequences/ss-11.svg), [FC-04](flowcharts/fc-04.svg), [FC-05](flowcharts/fc-05.svg) | AC-15 |
| QUIZ-07 | [UC-02](use-cases/uc-02.svg), [SS-11](system-sequences/ss-11.svg), [FC-04](flowcharts/fc-04.svg), [FC-05](flowcharts/fc-05.svg) | AC-15 |
| QUIZ-08 | [UC-02](use-cases/uc-02.svg), [SS-11](system-sequences/ss-11.svg), [FC-04](flowcharts/fc-04.svg) | - |
| PROGRESS-01 | [UC-02](use-cases/uc-02.svg), [SS-11](system-sequences/ss-11.svg), [FC-04](flowcharts/fc-04.svg) | AC-16 |
| PROGRESS-02 | [UC-02](use-cases/uc-02.svg), [SS-11](system-sequences/ss-11.svg), [FC-04](flowcharts/fc-04.svg) | - |
| PROGRESS-03 | [UC-02](use-cases/uc-02.svg), [UC-03](use-cases/uc-03.svg), [SS-11](system-sequences/ss-11.svg), [SS-13](system-sequences/ss-13.svg), [FC-06](flowcharts/fc-06.svg) | - |
| REWARD-01 | [UC-02](use-cases/uc-02.svg), [SS-11](system-sequences/ss-11.svg), [FC-04](flowcharts/fc-04.svg) | AC-17 |
| REWARD-02 | [UC-02](use-cases/uc-02.svg), [SS-11](system-sequences/ss-11.svg), [FC-04](flowcharts/fc-04.svg) | - |
| REC-01 | [UC-03](use-cases/uc-03.svg), [SS-12](system-sequences/ss-12.svg), [SS-13](system-sequences/ss-13.svg), [SS-14](system-sequences/ss-14.svg), [FC-05](flowcharts/fc-05.svg), [FC-07](flowcharts/fc-07.svg) | AC-07 |
| REC-02 | [UC-03](use-cases/uc-03.svg), [SS-12](system-sequences/ss-12.svg), [SS-14](system-sequences/ss-14.svg), [FC-07](flowcharts/fc-07.svg) | AC-18 |
| REC-03 | [UC-03](use-cases/uc-03.svg), [SS-12](system-sequences/ss-12.svg), [SS-14](system-sequences/ss-14.svg), [FC-07](flowcharts/fc-07.svg) | - |
| REC-04 | [UC-03](use-cases/uc-03.svg), [SS-12](system-sequences/ss-12.svg), [FC-07](flowcharts/fc-07.svg) | - |
| ROAD-01 | [UC-03](use-cases/uc-03.svg), [SS-13](system-sequences/ss-13.svg), [SS-14](system-sequences/ss-14.svg), [FC-06](flowcharts/fc-06.svg), [FC-07](flowcharts/fc-07.svg) | - |
| ROAD-02 | [UC-03](use-cases/uc-03.svg), [SS-13](system-sequences/ss-13.svg), [SS-14](system-sequences/ss-14.svg), [FC-06](flowcharts/fc-06.svg), [FC-07](flowcharts/fc-07.svg) | AC-19 |
| ROAD-03 | [UC-03](use-cases/uc-03.svg), [SS-13](system-sequences/ss-13.svg), [SS-14](system-sequences/ss-14.svg), [FC-06](flowcharts/fc-06.svg), [FC-07](flowcharts/fc-07.svg) | AC-19 |
| ROAD-04 | [UC-03](use-cases/uc-03.svg), [SS-13](system-sequences/ss-13.svg), [FC-06](flowcharts/fc-06.svg) | - |
| ROAD-05 | [UC-03](use-cases/uc-03.svg), [SS-09](system-sequences/ss-09.svg), [SS-13](system-sequences/ss-13.svg), [FC-06](flowcharts/fc-06.svg) | AC-20 |
| ROAD-06 | [UC-03](use-cases/uc-03.svg), [SS-09](system-sequences/ss-09.svg), [SS-13](system-sequences/ss-13.svg), [FC-06](flowcharts/fc-06.svg) | - |
| ROAD-07 | [UC-03](use-cases/uc-03.svg), [SS-13](system-sequences/ss-13.svg), [FC-06](flowcharts/fc-06.svg) | AC-21 |
| ROAD-08 | [UC-03](use-cases/uc-03.svg), [SS-13](system-sequences/ss-13.svg), [FC-06](flowcharts/fc-06.svg) | AC-21 |
| ROAD-09 | [UC-03](use-cases/uc-03.svg), [SS-12](system-sequences/ss-12.svg), [FC-06](flowcharts/fc-06.svg) | - |
| AI-01 | [UC-03](use-cases/uc-03.svg), [SS-14](system-sequences/ss-14.svg), [FC-07](flowcharts/fc-07.svg) | - |
| AI-02 | [UC-03](use-cases/uc-03.svg), [SS-12](system-sequences/ss-12.svg), [SS-14](system-sequences/ss-14.svg), [FC-07](flowcharts/fc-07.svg) | AC-30 |
| AI-03 | [UC-03](use-cases/uc-03.svg), [SS-14](system-sequences/ss-14.svg), [FC-07](flowcharts/fc-07.svg) | AC-22 |
| AI-04 | [UC-03](use-cases/uc-03.svg), [SS-12](system-sequences/ss-12.svg), [SS-14](system-sequences/ss-14.svg), [FC-07](flowcharts/fc-07.svg) | AC-24 |
| AI-05 | [UC-03](use-cases/uc-03.svg), [SS-12](system-sequences/ss-12.svg), [SS-13](system-sequences/ss-13.svg), [SS-14](system-sequences/ss-14.svg), [SS-15](system-sequences/ss-15.svg), [FC-06](flowcharts/fc-06.svg), [FC-07](flowcharts/fc-07.svg) | AC-23, AC-24 |
| AI-06 | [UC-03](use-cases/uc-03.svg), [SS-12](system-sequences/ss-12.svg), [SS-13](system-sequences/ss-13.svg), [SS-14](system-sequences/ss-14.svg), [FC-06](flowcharts/fc-06.svg), [FC-07](flowcharts/fc-07.svg) | AC-24 |
| AI-07 | [UC-03](use-cases/uc-03.svg), [SS-14](system-sequences/ss-14.svg), [SS-15](system-sequences/ss-15.svg), [FC-07](flowcharts/fc-07.svg) | AC-25 |
| REPORT-01 | [UC-05](use-cases/uc-05.svg), [SS-16](system-sequences/ss-16.svg) | AC-26 |
| REPORT-02 | [UC-05](use-cases/uc-05.svg), [SS-16](system-sequences/ss-16.svg) | AC-26 |
| REPORT-03 | [UC-04](use-cases/uc-04.svg), [UC-06](use-cases/uc-06.svg), [SS-05](system-sequences/ss-05.svg), [SS-16](system-sequences/ss-16.svg), [FC-08](flowcharts/fc-08.svg) | AC-26 |
| NOTICE-01 | [UC-01](use-cases/uc-01.svg), [UC-04](use-cases/uc-04.svg), [UC-05](use-cases/uc-05.svg), [UC-06](use-cases/uc-06.svg), [SS-01](system-sequences/ss-01.svg), [SS-05](system-sequences/ss-05.svg), [SS-06](system-sequences/ss-06.svg), [SS-07](system-sequences/ss-07.svg), [SS-08](system-sequences/ss-08.svg), [SS-09](system-sequences/ss-09.svg), [SS-16](system-sequences/ss-16.svg), [FC-01](flowcharts/fc-01.svg), [FC-03](flowcharts/fc-03.svg), [FC-08](flowcharts/fc-08.svg) | AC-27 |
| NOTICE-02 | [UC-01](use-cases/uc-01.svg), [UC-04](use-cases/uc-04.svg), [UC-06](use-cases/uc-06.svg), [SS-01](system-sequences/ss-01.svg), [SS-02](system-sequences/ss-02.svg), [SS-03](system-sequences/ss-03.svg), [SS-04](system-sequences/ss-04.svg), [SS-05](system-sequences/ss-05.svg), [SS-06](system-sequences/ss-06.svg), [SS-07](system-sequences/ss-07.svg), [FC-01](flowcharts/fc-01.svg), [FC-02](flowcharts/fc-02.svg), [FC-03](flowcharts/fc-03.svg), [FC-08](flowcharts/fc-08.svg) | AC-27 |
| DATA-01 | [UC-02](use-cases/uc-02.svg), [UC-03](use-cases/uc-03.svg), [UC-06](use-cases/uc-06.svg), [SS-04](system-sequences/ss-04.svg), [SS-06](system-sequences/ss-06.svg), [SS-09](system-sequences/ss-09.svg), [SS-11](system-sequences/ss-11.svg), [SS-13](system-sequences/ss-13.svg), [SS-14](system-sequences/ss-14.svg), [SS-15](system-sequences/ss-15.svg), [SS-16](system-sequences/ss-16.svg), [FC-02](flowcharts/fc-02.svg), [FC-07](flowcharts/fc-07.svg) | - |
| P-07 | [UC-05](use-cases/uc-05.svg), [SS-16](system-sequences/ss-16.svg) | AC-37 |
| P-08 | [UC-06](use-cases/uc-06.svg), [SS-05](system-sequences/ss-05.svg), [FC-08](flowcharts/fc-08.svg) | AC-38 |
| P-01 | [UC-06](use-cases/uc-06.svg), [SS-01](system-sequences/ss-01.svg), [SS-07](system-sequences/ss-07.svg), [FC-01](flowcharts/fc-01.svg), [FC-03](flowcharts/fc-03.svg) | AC-31 |
| P-02 | [UC-02](use-cases/uc-02.svg), [SS-07](system-sequences/ss-07.svg), [FC-03](flowcharts/fc-03.svg) | AC-32 |
| P-03 | [UC-02](use-cases/uc-02.svg), [SS-01](system-sequences/ss-01.svg), [SS-07](system-sequences/ss-07.svg), [SS-11](system-sequences/ss-11.svg), [FC-03](flowcharts/fc-03.svg), [FC-04](flowcharts/fc-04.svg) | AC-33 |
| P-04 | [UC-02](use-cases/uc-02.svg), [SS-11](system-sequences/ss-11.svg), [SS-13](system-sequences/ss-13.svg), [FC-04](flowcharts/fc-04.svg), [FC-06](flowcharts/fc-06.svg) | AC-34 |
| P-05 | [UC-02](use-cases/uc-02.svg), [UC-03](use-cases/uc-03.svg), [SS-13](system-sequences/ss-13.svg), [FC-06](flowcharts/fc-06.svg) | AC-35 |
| P-06 | [UC-02](use-cases/uc-02.svg) | AC-36 |

Index: 94 approved requirement/operating-rule IDs, 30 diagrams. Sources are linked from the index and each gallery.
