# CrewClaw Implementation Plan

This plan is designed for autonomous execution.

## Goal

Replace key placeholder pages with realistic, production-shaped UI that matches CrewClaw product intent and passes quality gates.

## Overall sequence

1. foundation and shared components
2. model/security governance surfaces
3. organization surfaces
4. execution surfaces
5. visual editors and simulations
6. testing hardening and remediation

---

## Phase 0 — Baseline and repo normalization

### Tasks
- inspect existing route folders and placeholder patterns
- inspect existing completed pages for visual/component patterns
- inspect Playwright configuration
- normalize base URL handling through environment configuration
- document commands needed to run lint/tests/dev

### Deliverables
- working baseline
- environment-driven Playwright config
- no broken existing tests

### Commit suggestion
`chore: normalize crewclaw ui test/runtime baseline`

---

## Phase 1 — Shared governance UI primitives

### Tasks
- create shared loading, empty, and error state components if current ones are inadequate
- create assistant identity card
- create runtime preview card
- create permission matrix UI
- create communication topology graph placeholder/visualization
- create shared summary-card and filter-toolbar patterns if needed

### Deliverables
- reusable components ready for multiple pages

### Commit suggestion
`feat: add shared governance and runtime ui primitives`

---

## Phase 2 — Model and security control plane

### Target pages
- API Keys
- Secrets Vault improvements
- Model Registry
- Model Routing Rules

### Tasks
- replace placeholder pages with realistic content
- implement allowlist-first runtime preview and simulator
- show key/provider binding surfaces
- show rule builder and simulator structure
- add audit/explanation views
- add summary dashboards

### Deliverables
- four realistic governance pages that explain routing and key usage

### Commit suggestion
`feat: implement model and security control surfaces`

---

## Phase 3 — Organization control plane

### Target pages
- Councils
- Teams
- Assistants RBAC

### Tasks
- build council directory and membership builder
- build teams directory, defaults panel, and communication map
- build assistant RBAC page with file/comm/model allowlist tabs
- integrate assistant identity cards and runtime preview
- integrate explanation views for blocked vs allowed actions

### Deliverables
- organization pages with realistic management surfaces

### Commit suggestion
`feat: implement councils teams and assistant rbac pages`

---

## Phase 4 — Execution control plane

### Target pages
- Workflows
- Pipelines
- Approvals

### Tasks
- build workflow directory and visual editor shell
- build pipeline directory and visual editor shell
- create node palette / inspector / simulation panels
- build approvals dashboard, table, filters, detail drawer
- add lifecycle states and publish/test affordances

### Deliverables
- realistic execution pages with drag-and-drop shaped interfaces

### Commit suggestion
`feat: implement workflows pipelines and approvals surfaces`

---

## Phase 5 — Cross-page improvements

### Tasks
- add simulation-before-activation patterns
- add policy pack selections where relevant
- add operating mode labels where relevant
- connect approval sources to other pages at the UI level
- add cross-links between assistants, teams, councils, approvals, workflows, and routing rules

### Deliverables
- app feels coherent instead of page-isolated

### Commit suggestion
`feat: connect governance execution and approval experiences`

---

## Phase 6 — Testing and remediation loop

### Tasks
- expand Playwright coverage for target pages
- assert no placeholder text on targeted routes
- inspect console/runtime issues with Chrome DevTools CLI
- run React Doctor and address findings
- perform final polish on obvious UX and consistency issues

### Deliverables
- stable page coverage and low-regression readiness

### Commit suggestion
`test: add e2e coverage and remediate runtime issues`

---

## Acceptance criteria

The implementation is acceptable when:
- targeted placeholder pages are replaced with realistic UI
- no targeted page shows under-construction placeholder language
- routing/runtime pages visibly enforce allowlist-first logic
- approvals page acts like a real approval center
- workflow/pipeline pages have credible editor experiences
- Playwright covers the new pages and key flows
- React Doctor findings are addressed
- no obvious critical console errors remain on key pages

## Important implementation guidance

- Prefer realistic static/mock/local state over thin placeholders.
- Do not wait for backend completion to create usable page structure.
- Build pages so future backend integration is straightforward.
