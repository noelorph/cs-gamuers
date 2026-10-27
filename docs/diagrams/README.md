# CS-GAMUERS diagrams

These diagrams describe the [approved product requirements](../../PRD.md). They are product diagrams, not an architecture or database design. Application implementation is not authorized by this handoff.

Start with the use-case diagram for a role, follow a flowchart for its decisions, and open the corresponding system sequence diagram for requests and responses. Each diagram has an editable `.puml` source and a rendered `.svg` preview. The source is authoritative; regenerate its preview after an edit.

## Reading guide

- [Use-case gallery](use-cases/README.md): who can do what inside CS-GAMUERS.
- [System sequence gallery](system-sequences/README.md): actor requests, system responses, and alternative outcomes.
- [Flowchart gallery](flowcharts/README.md): decisions, state changes, completion, and failure paths.
- [Requirement traceability](traceability.md): every requirement and operating rule mapped to diagrams and acceptance scenarios.
- [Documentation handoff plan](../superpowers/plans/2026-10-27-cs-gamuers-product-handoff-plan.md): completed documentation tasks, validation, and the order of future product work.

## Notation and boundaries

Use-case diagrams use UML actors, ovals for user goals, and a rectangle for the product boundary. Associations show participation, not a time order. The generic actor in UC-01 represents a person holding one of the four roles; it is not a fifth role. Pending applicants only receive application access.

System sequence diagrams contain one CS-GAMUERS lifeline and the human actors involved. Solid arrows show actor requests; dashed arrows show responses or notifications. `alt` means alternative outcomes, `opt` means an optional step, and `loop` means repetition. Labels describe product operations and information, not endpoint names, code signatures, services, or storage choices. Offline identity checks appear in notes and do not imply school integration.

Flowcharts use a start/end marker, actions, and labeled decision branches. A stop ends that request or flow; it does not imply account deactivation. A failed action leaves existing records intact unless the PRD explicitly says otherwise.

Except for registration, invitation acceptance, recovery, and application-status access, actions require the approved active role stated in the diagram. Repeated permission and input checks are summarized where drawing each one would obscure the main flow. The PRD remains authoritative for full field lists, numeric limits, and access rules.

Application approval and account activation are separate. `Pending`, `Needs correction`, `Approved`, and `Rejected` refer to applications. Deactivation removes access without deleting records. Reopening a rejected application returns it to `Pending`, not `Approved`.

Course and assessment revisions preserve the content of existing learning or unfinished attempts. A shared career path is reviewed content; a personal roadmap is a Student-accepted plan assembled from that content. Starting a course, receiving a recommendation, and accepting a roadmap are separate actions.

Private chat is not available to staff. AI receives permitted learning context, but not automatically supplied account identity. Student-written messages are sent as written, with the approved privacy reminder. External AI roadmaps and emergency Administrator recovery remain deferred.

## Shared decision and saved-outcome rules

**Email delivery — P-01 / AC-31:** After a successful account or content decision, failed email delivery does not reverse the decision. Show the current state in relevant dashboards where access is permitted. Administrator account support can see the delivery failure without private learning content. Retry delivery only; never repeat the decision.

This rule applies to all account/content decision flows with applicable email notices, including invitations, recovery, access changes, review, ownership transfer, and retirement. SS-01/FC-01 and SS-07/FC-03 demonstrate representative account/content cases; other diagrams inherit the rule without repeating a delivery workflow. It grants no additional access to account support.

**Saved AI outcomes — AI-05 / AI-06:** Resolve a permitted, accessible saved successful outcome for the same logical request before checks that gate new generation, including profile prerequisites, daily allowance, and AI availability. Return it without generation or extra usage, even when response 20 was lost and usage is already 20. A new request at 20 remains blocked. Failed requests consume nothing. Show remaining allowance and its midnight Philippine reset.

Retrieval preserves permissions, privacy, deletion/expiry rules, and current catalog restrictions; it does not restore deleted/expired conversation content or make unavailable catalog items eligible. Reading a saved outcome does not start courses or activate roadmaps. Saved roadmap proposals still require preview and explicit acceptance or replacement confirmation. FC-07 shows the shared ordering; SS-12–SS-14 and FC-06 apply it without specifying storage, retry mechanisms, or a new retention policy.

Requirement lists index affected goals as well as demonstrated behavior. A requirement ID alone does not prove coverage of every clause; use the actual branches, notes, shared rules, and PRD to assess coverage.

## Diagram inventory

### Use-case diagrams

| ID | Diagram | Preview | Editable source |
|---|---|---|---|
| UC-01 | Account access and applications | [SVG](use-cases/uc-01.svg) | [PlantUML](use-cases/uc-01.puml) |
| UC-02 | Student learning | [SVG](use-cases/uc-02.svg) | [PlantUML](use-cases/uc-02.puml) |
| UC-03 | Student guidance | [SVG](use-cases/uc-03.svg) | [PlantUML](use-cases/uc-03.puml) |
| UC-04 | Faculty responsibilities | [SVG](use-cases/uc-04.svg) | [PlantUML](use-cases/uc-04.puml) |
| UC-05 | Program Head oversight | [SVG](use-cases/uc-05.svg) | [PlantUML](use-cases/uc-05.puml) |
| UC-06 | Administrator responsibilities | [SVG](use-cases/uc-06.svg) | [PlantUML](use-cases/uc-06.puml) |

### System sequence diagrams

| ID | Diagram | Preview | Editable source |
|---|---|---|---|
| SS-01 | Register and review an application | [SVG](system-sequences/ss-01.svg) | [PlantUML](system-sequences/ss-01.puml) |
| SS-02 | Invite and activate privileged staff | [SVG](system-sequences/ss-02.svg) | [PlantUML](system-sequences/ss-02.puml) |
| SS-03 | Reset a forgotten password | [SVG](system-sequences/ss-03.svg) | [PlantUML](system-sequences/ss-03.puml) |
| SS-04 | Recover access after losing email | [SVG](system-sequences/ss-04.svg) | [PlantUML](system-sequences/ss-04.puml) |
| SS-05 | Manage another account access | [SVG](system-sequences/ss-05.svg) | [PlantUML](system-sequences/ss-05.puml) |
| SS-06 | Student self-deactivation and return | [SVG](system-sequences/ss-06.svg) | [PlantUML](system-sequences/ss-06.puml) |
| SS-07 | Review and publish learning content | [SVG](system-sequences/ss-07.svg) | [PlantUML](system-sequences/ss-07.puml) |
| SS-08 | Transfer ownership or assign assessment owner | [SVG](system-sequences/ss-08.svg) | [PlantUML](system-sequences/ss-08.puml) |
| SS-09 | Retire a course or career path | [SVG](system-sequences/ss-09.svg) | [PlantUML](system-sequences/ss-09.puml) |
| SS-10 | Find and start a course | [SVG](system-sequences/ss-10.svg) | [PlantUML](system-sequences/ss-10.puml) |
| SS-11 | Save and submit a quiz or assessment | [SVG](system-sequences/ss-11.svg) | [PlantUML](system-sequences/ss-11.puml) |
| SS-12 | Request personalized suggestions | [SVG](system-sequences/ss-12.svg) | [PlantUML](system-sequences/ss-12.puml) |
| SS-13 | Preview and accept a personal roadmap | [SVG](system-sequences/ss-13.svg) | [PlantUML](system-sequences/ss-13.puml) |
| SS-14 | Ask AI through chat | [SVG](system-sequences/ss-14.svg) | [PlantUML](system-sequences/ss-14.puml) |
| SS-15 | Read, delete, or expire a conversation | [SVG](system-sequences/ss-15.svg) | [PlantUML](system-sequences/ss-15.puml) |
| SS-16 | View permitted reports or history | [SVG](system-sequences/ss-16.svg) | [PlantUML](system-sequences/ss-16.puml) |

### Flowcharts

| ID | Diagram | Preview | Editable source |
|---|---|---|---|
| FC-01 | Application approval and reopening | [SVG](flowcharts/fc-01.svg) | [PlantUML](flowcharts/fc-01.puml) |
| FC-02 | Account recovery | [SVG](flowcharts/fc-02.svg) | [PlantUML](flowcharts/fc-02.puml) |
| FC-03 | Content review and retirement | [SVG](flowcharts/fc-03.svg) | [PlantUML](flowcharts/fc-03.puml) |
| FC-04 | Course quiz progress and badge | [SVG](flowcharts/fc-04.svg) | [PlantUML](flowcharts/fc-04.puml) |
| FC-05 | Optional skills assessment | [SVG](flowcharts/fc-05.svg) | [PlantUML](flowcharts/fc-05.puml) |
| FC-06 | Personal roadmap lifecycle | [SVG](flowcharts/fc-06.svg) | [PlantUML](flowcharts/fc-06.puml) |
| FC-07 | AI request and usage allowance | [SVG](flowcharts/fc-07.svg) | [PlantUML](flowcharts/fc-07.puml) |
| FC-08 | Staff and account access safeguards | [SVG](flowcharts/fc-08.svg) | [PlantUML](flowcharts/fc-08.puml) |

## Render and maintain

The previews were rendered locally with PlantUML 1.2026.9. This is a documentation tool, not a choice of application technology. The renderer was downloaded to a temporary directory; no package dependency or application lockfile was changed. Sources use the built-in Smetana layout for use cases, so a separate Graphviz installation is unnecessary.

With Java and the PlantUML JAR available, run from the repository root:

```sh
java -Djava.awt.headless=true -jar /path/to/plantuml-1.2026.9.jar -tsvg -failfast2 'docs/diagrams/use-cases/*.puml' 'docs/diagrams/system-sequences/*.puml' 'docs/diagrams/flowcharts/*.puml'
```

The command writes SVG files alongside their sources. Review changed previews, update requirement comments and the traceability table, and keep the PRD and all three diagram types consistent. Do not change product behavior through a diagram edit alone.

Rendering references: [PlantUML use-case notation](https://plantuml.com/use-case-diagram), [Smetana layout](https://plantuml.com/smetana02), and [the renderer release](https://github.com/plantuml/plantuml/releases/tag/v1.2026.9).

## Review status

The product owner approved the PRD. The five verified inconsistencies are corrected, and scoped fresh validation is recorded in the handoff plan. Earlier checks remain historical evidence; neither requirement indexing nor this correction pass proves exhaustive coverage of every PRD clause. The product owner approved the diagram set and handoff plan after rereview on 2026-10-27. No application implementation has started.
