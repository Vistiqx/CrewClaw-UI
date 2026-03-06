# CrewClaw Agent Rules

These rules are mandatory.

## Non-negotiable rules

- Do not delete working pages.
- Do not remove tests unless replacing them with better coverage in the same commit.
- Do not leave the repo in a failing state after a phase commit.
- Do not replace realistic UI with placeholders.
- Do not bypass assistant RBAC.
- Do not bypass approvals for risky actions.
- Do not let workflow or routing rules silently override assistant model restrictions.
- Model access is default deny. Only explicitly allowlisted provider/model pairs may be used by an assistant.
- Every page must include realistic loading, empty, error, and populated states.
- Prefer component reuse and shared state patterns over page-local duplication.
- Keep the current visual language and component library consistent with the repo.
- Use environment-driven configuration for test URLs and secrets.
- Preserve existing completed pages as design references.
- Add audit visibility wherever routing, permissions, approvals, or execution decisions are made.

## Commit rules

- Commit after every meaningful phase.
- Use descriptive commit messages.
- Run lint/tests before each phase commit.
- If a phase introduces a regression, fix it before moving on.

## Quality rules

- React Doctor must be run and findings addressed.
- Playwright must cover the new pages and key flows.
- Chrome DevTools CLI must be used to inspect console errors and obvious runtime issues on critical pages.
- Avoid dead controls. Buttons, tabs, filters, cards, and tables should feel plausible and purposeful even if some actions still use mock or local data.
- Replace any under-construction content on the targeted pages.

## Runtime policy rules

Model resolution precedence is:

1. assistant override
2. workflow step rule
3. team default
4. global default

But every candidate must pass allowlist enforcement:

- provider/model exists in Model Registry
- assistant allowlist includes that provider/model
- required API key exists and is active
- model is not blocked or deprecated for new runs
- assistant RBAC permits execution context
- task criticality and approval thresholds are satisfied

If resolution fails, execution must stop with a clear reason and optionally create an approval request.

## UX rules

- Build pages as if they are on the path to being fully functional, not as wireframes.
- Use the existing dashboard/businesses/assistants/tasks/secrets pages as visual reference patterns.
- Favor explainability: show why a model, permission, approval, or route decision happened.
