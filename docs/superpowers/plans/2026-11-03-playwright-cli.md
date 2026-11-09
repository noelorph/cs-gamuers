# Playwright CLI tooling plan

Scope: the owner-authorized [development tooling spec](../specs/2026-11-03-playwright-cli-design.md), using the existing pinned development dependency.

- [x] Confirm installed Playwright exposes `playwright cli`.
- [x] Install the official skill into `.agents/skills/playwright-cli/` and ignore workspace artifacts.
- [x] Add the npm command and document usage in README, AGENTS, and TRD.
- [x] Verify browser access to the local application, heading/title, narrow viewport screenshot, formatting, and diff.

Evidence: `playwright cli --help` and workspace/skill installation succeeded with Playwright 1.64.1. `npm run browser -- -s=tooling-check open http://127.0.0.1:3100` opened the temporary local Next.js development server. A CLI `run-code` check waited for the visible exact CS-GAMUERS h1, asserted the page title, set a 320×800 viewport, and saved `.playwright-cli/home-mobile.png`. `git check-ignore` confirmed the screenshot is ignored. `npm run format:check` and `git diff --check` passed. Skill installation and browser verification required sandbox escalation for the protected skill directory and Playwright's daemon cache. `next dev` added its enabled agent-feedback instructions to AGENTS.md; that generated block is retained as instructed.

No application logic or dependency versions change. Browser checks prove tooling operation only; PRD acceptance, backend permissions, and physical-device coverage remain outside this task.
