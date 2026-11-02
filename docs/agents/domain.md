# Domain Docs

This repo uses a single product context. [PRD.md](../../PRD.md) section 2 is the current vocabulary; [ARCHITECTURE.md](../../ARCHITECTURE.md) records the implementation design. Optional future `GLOSSARY.md` and architecture decision records in `docs/adr/` supplement these documents.

## Before exploring

- Read the relevant PRD terms and architecture sections.
- If `GLOSSARY.md` or relevant ADRs exist, read them too.
- If absent, proceed without creating empty documents. Do not assume an unavailable skill or missing glossary is a prerequisite.

## Use the glossary's vocabulary

Use canonical PRD terms in proposals, plans, and tests. An optional glossary may clarify vocabulary but must not change product behavior. Resolve missing terms in the authoritative document rather than creating a competing definition.

## Flag ADR conflicts

If proposed work contradicts an existing ADR or canonical document, identify the conflict and resolve it explicitly. An older ADR or plan does not silently override the current PRD, TRD, or architecture.
