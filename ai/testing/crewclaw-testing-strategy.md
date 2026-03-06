# CrewClaw Testing Strategy

This strategy is written for autonomous implementation.

## Objectives

- prevent placeholder pages from shipping
- verify realistic content exists
- verify critical governance views render
- catch console/runtime issues
- catch React code health issues early

## Tooling gates

### 1. React Doctor
Run React Doctor against the repo and address findings that are actionable.

### 2. Playwright CLI
Use Playwright for route coverage and interaction coverage.

### 3. Chrome DevTools CLI
Use Chrome DevTools CLI to inspect:
- console errors
- failed network requests on key pages
- obvious rendering/runtime issues

## Test priorities

### High-priority routes
- `/councils`
- `/teams`
- `/assistants-rbac`
- `/api-keys`
- `/model-registry`
- `/model-routing-rules`
- `/workflows`
- `/pipelines`
- `/approvals`
- `/secrets-vault`

### Assertions to add
- page has meaningful headings/content
- page does not contain placeholder language
- summary cards render
- a primary table/list/canvas exists
- filters/search controls exist
- detail panel or drawer exists where expected
- simulation/runtime explanation UI exists on relevant pages

## Placeholder-ban assertions

For target routes, assert absence of strings such as:
- under construction
- placeholder
- coming soon
- not implemented

## Example flow coverage

### Assistants RBAC
- navigate to page
- choose/select an assistant if selector exists
- confirm permission sections render
- confirm model allowlist section renders
- confirm communication policy section renders

### Model Routing Rules
- navigate to page
- open simulator or builder
- confirm rule list/table exists
- confirm resolved runtime explanation area exists

### Workflows / Pipelines
- navigate to page
- confirm canvas/editor region exists
- confirm node palette exists
- confirm properties panel exists

### Approvals
- navigate to page
- confirm dashboard cards exist
- confirm approvals table exists
- confirm filtering/search controls exist

## Manual-ish smoke pass

After E2E, perform a focused browser pass on critical pages to look for:
- layout collapse
- dead tabs
- console errors
- missing data labels
- inaccessible or hidden actions

## URL/base configuration

Do not hardcode a single LAN IP for Playwright unless the environment explicitly demands it. Use env-driven base URL with a safe local fallback.

## Exit criteria

Testing is acceptable when:
- target routes pass Playwright coverage
- no target route shows placeholder language
- critical pages are free of severe runtime/console errors
- React Doctor findings are addressed or documented
