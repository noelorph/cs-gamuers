# Domain Docs

This repo uses a single context: `GLOSSARY.md` at the repo root and architecture decision records in `docs/adr/`.

## Before exploring

- Read `GLOSSARY.md` for the project's domain terms.
- Read the ADRs in `docs/adr/` that relate to the area you are working on.
- If these files do not exist, proceed silently. Do not suggest creating empty documents. The `domain-modeling` skill, used by `grill-with-docs`, creates them when terms or decisions are resolved.

## Use the glossary's vocabulary

Use the glossary's terms in issues, proposals, hypotheses, and tests. Avoid synonyms the glossary explicitly excludes. If a concept is missing, reconsider the term or note the gap for `domain-modeling`.

## Flag ADR conflicts

If proposed work contradicts an existing ADR, identify the ADR and explain why the decision should be revisited.
