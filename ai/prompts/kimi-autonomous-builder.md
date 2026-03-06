You are a senior full-stack AI engineer responsible for completing the CrewClaw UI application.

Repository:
https://github.com/Vistiqx/CrewClaw-UI

Local Path:
D:\__Projects\CrewClaw-UI

You must work directly inside this repository and use the planning files located under `/ai`.

--------------------------------------------------
MANDATORY FIRST READ
--------------------------------------------------

Before writing code, read these files in this order:

1. ai/AGENT_RULES.md
2. ai/planning/pages-to-build.md
3. ai/planning/crewclaw-page-blueprint.md
4. ai/planning/crewclaw-architecture-improvements.md
5. ai/planning/data-model-and-system-design.md
6. ai/implementation/repo-target-map.md
7. ai/implementation/crewclaw-implementation-plan.md
8. ai/implementation/phased-commit-plan.md
9. ai/testing/crewclaw-testing-strategy.md
10. ai/testing/test-matrix.md

These files are the product contract for this build.

--------------------------------------------------
PRIMARY MISSION
--------------------------------------------------

Replace the targeted CrewClaw placeholder pages with realistic, production-shaped UI that matches the planning documents and preserves the repo's existing design language.

Target pages:

- councils
- teams
- assistants-rbac
- api-keys
- model-registry
- model-routing-rules
- workflows
- pipelines
- approvals
- secrets-vault improvements

Do not ship placeholders.

--------------------------------------------------
CORE PRODUCT RULES
--------------------------------------------------

CrewClaw is a governance-first AI operations dashboard for a single owner managing one primary company and subsidiary companies.

Important domain rules:

- Councils are advisory groups composed around a primary company and possibly subsidiary assistants.
- Teams are subsidiary execution groups with a primary advisor and orchestrator.
- Assistants RBAC controls file actions, communications, channels, human contact, and model/provider allowlists.
- Workflows define who communicates with whom and in what sequence.
- Pipelines define how work is executed, validated, tested, and reported.
- Approvals are a central owner-facing review center.
- API keys and secret references must be explicitly visible in runtime selection surfaces.

--------------------------------------------------
STRICT MODEL POLICY
--------------------------------------------------

Model access is allowlist-only and default deny.

Routing precedence is:

1. assistant override
2. workflow step rule
3. team default
4. global default

However, every candidate must pass allowlist enforcement:

- provider/model exists in Model Registry
- provider/model is explicitly allowlisted for the assistant
- required API key or credential reference exists and is active
- model is not blocked or deprecated for new runs
- assistant RBAC allows execution context
- approval threshold and criticality rules are satisfied

If a candidate fails, it must not be silently chosen.
Instead:
- show a blocked/denied explanation in the UI
- stop execution/simulation
- show or generate an approval requirement where appropriate

--------------------------------------------------
IMPLEMENTATION PHASES
--------------------------------------------------

Execute these phases in order.

PHASE 0 — BASELINE
- inspect current route files
- inspect placeholder pages
- inspect existing completed pages for reference
- normalize Playwright base URL to env-based handling
- confirm app boots and existing tests are understood

PHASE 1 — SHARED PRIMITIVES
- create shared loading/empty/error patterns if needed
- create assistant identity card
- create runtime preview card
- create permission matrix
- create communication topology graph/panel
- create reusable filter/summary patterns

PHASE 2 — MODEL + SECURITY SURFACES
- implement api-keys page
- upgrade secrets-vault page
- implement model-registry page
- implement model-routing-rules page
- include simulator/explanation surfaces

PHASE 3 — ORGANIZATION SURFACES
- implement councils page
- implement teams page
- implement assistants-rbac page
- integrate assistant identity cards and runtime previews

PHASE 4 — EXECUTION SURFACES
- implement workflows page
- implement pipelines page
- implement approvals page
- provide editor-shell experiences for workflows and pipelines
- provide lifecycles: draft, testing, approved, active, deprecated, archived

PHASE 5 — CROSS-PAGE COHERENCE
- add policy pack selectors where relevant
- add operating mode labels where relevant
- cross-link assistants/teams/councils/approvals/routing pages
- add simulation-before-activation experiences

PHASE 6 — TESTING + REMEDIATION
- add/expand Playwright tests for target routes
- add assertions that placeholders are gone
- run React Doctor and address findings
- inspect critical pages with Chrome DevTools CLI
- fix regressions and polish obvious issues

--------------------------------------------------
QUALITY BAR
--------------------------------------------------

Every target page must include:
- a real page header
- summary cards
- realistic filters/search
- a primary table/list/canvas
- a detail panel or secondary inspection area
- loading state
- empty state
- error state
- realistic labels and actions

Workflows and pipelines must feel like true builder pages, even if they use local/mock-backed state.

--------------------------------------------------
TESTING INSTRUCTIONS
--------------------------------------------------

Use the repo's existing testing setup and improve it.

At minimum:
- run lint or equivalent validation
- run Playwright for target page coverage
- run React Doctor
- use Chrome DevTools CLI to inspect critical pages for console/runtime problems

Target route assertions must prove:
- meaningful content exists
- placeholder strings are absent
- key controls render

--------------------------------------------------
COMMIT DISCIPLINE
--------------------------------------------------

Commit after each phase with descriptive messages.
Do not move to the next phase if the repo is broken.

Suggested commit sequence is documented in:
`ai/implementation/phased-commit-plan.md`

--------------------------------------------------
FINAL DELIVERABLE
--------------------------------------------------

When complete:
- all target pages are implemented
- tests pass for the target areas
- placeholder text is removed from target routes
- runtime selection is visibly allowlist-first
- approvals act like a real review center
- workflows and pipelines have credible editor shells
- provide a concise summary of what was built, what was tested, and any remaining follow-up items
