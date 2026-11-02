# Specs, plans, and task tracking

Canonical behavior, technical requirements, and architecture live in the root PRD, TRD, and ARCHITECTURE documents respectively. Specification entries may index those documents without duplicating them. Plans track only their authorized scope; historical checklists and commit instructions do not authorize current work or override an explicit no-commit instruction.

Specs and plans live in local Markdown files using the Superpowers layout:

- Specs: `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`.
- Plans: `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`.
- Track implementation tasks and their completion with checkboxes in the relevant plan. Each plan links to its spec.

Use GitHub Issues only when explicitly requested by the user.

## When a skill says "publish to the issue tracker"

Save specs in `docs/superpowers/specs/` and record implementation tasks in the relevant plan under `docs/superpowers/plans/`. Create a GitHub issue only when the user explicitly requests GitHub Issues.

## When a skill says "fetch the relevant ticket"

Read the referenced local plan, its spec, and the relevant task. For an explicitly requested GitHub issue, use `gh issue view` as below.

## GitHub Issues conventions for explicit requests

Use GitHub Issues for `noelorph/cs-gamuers`. Run the `gh` CLI from this clone, or pass `--repo noelorph/cs-gamuers` from another directory.

- Create an issue: `gh issue create --title "..." --body-file <file>`.
- Read an issue: `gh issue view <number> --json number,title,body,labels,comments`.
- List open issues: `gh issue list --state open --json number,title,body,labels`. Add `--label` filters as needed.
- Update an issue body: `gh issue edit <number> --body-file <file>`.
- Comment on an issue: `gh issue comment <number> --body-file <file>`.
- Apply or remove labels: `gh issue edit <number> --add-label "..."` or `--remove-label "..."`.
- Close an issue: `gh issue close <number>`.
- Link a child issue: `gh issue edit <parent> --add-sub-issue <child>`. If sub-issues are unavailable, put `Part of #<parent>` at the top of the child body.
- Record a blocker: `gh issue edit <child> --add-blocked-by <blocker>`. If native dependencies are unavailable, use a `Blocked by: #<number>` line at the top of the child body. A ticket is unblocked when all its blockers are closed.

Write multiline bodies and comments to a temporary file and pass it with `--body-file` to preserve formatting and avoid shell interpolation.

## Pull requests as a triage surface

**PRs as a request surface: no.**
