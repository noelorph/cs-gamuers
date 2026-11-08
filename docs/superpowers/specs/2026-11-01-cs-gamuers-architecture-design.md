# CS-GAMUERS architecture design

The canonical design is [ARCHITECTURE.md](../../../ARCHITECTURE.md). This entry indexes it; do not maintain a competing copy here.

The product owner approved the design in conversation on 2026-11-01 and authorized writing it and aligning the documentation. The owner subsequently approved the written architecture on 2026-11-02, including the folder responsibilities and Groq Free / `openai/gpt-oss-20b` selection. Approval was recorded before the owner separately authorized the documentation commit on 2026-11-02. Approval does not authorize product implementation, installations, hosted changes, or public deployment.

[PRD.md](../../../PRD.md) owns product behavior. [TRD.md](../../../TRD.md) owns technical requirements and limits. The architecture owns component boundaries and enforcement mechanisms. [The documentation handoff plan](../plans/2026-11-01-cs-gamuers-architecture-handoff-plan.md) tracks this task and its validation.

The later role-authentication extension implements separate Administrator entry at `/admin/sign-in`, public Student/Faculty application, and versioned application review/correction within those same boundaries. See the [2026-11-06 plan](../plans/2026-11-06-role-authentication.md) and [demonstration readiness](../../demo/README.md) for measured TEST evidence and unfinished acceptance/DEMO rollout. The earlier approval record above remains historical; it is not an additional approval requirement for the authorized extension.
