# Repo Target Map

This document tells the AI where to look in the repo.

## Known repo structure

- `src/app` contains route pages
- `src/components` contains reusable UI components
- `src/hooks` contains React hooks
- `src/lib` contains utilities/data access helpers
- `tests` contains Playwright tests
- `playwright.config.js` exists
- `package.json` already includes the main app/tooling stack

## Primary route targets

These route folders already exist and should be upgraded from placeholders where needed:

- `src/app/councils`
- `src/app/teams`
- `src/app/assistants-rbac`
- `src/app/api-keys`
- `src/app/workflows`
- `src/app/pipelines`
- `src/app/approvals`
- `src/app/model-registry`
- `src/app/model-routing-rules`

Also enhance:
- `src/app/secrets-vault`

## Recommended shared UI additions

Create or expand shared components in `src/components`, for example:

- `assistant/assistant-identity-card.*`
- `assistant/assistant-runtime-preview.*`
- `assistant/assistant-permission-matrix.*`
- `councils/council-membership-builder.*`
- `teams/team-defaults-panel.*`
- `graphs/communication-topology-graph.*`
- `models/model-registry-table.*`
- `models/model-routing-rule-builder.*`
- `models/model-resolution-simulator.*`
- `workflow/workflow-canvas.*`
- `workflow/node-palette.*`
- `pipeline/pipeline-canvas.*`
- `approvals/approvals-dashboard.*`
- `shared/loading-state.*`
- `shared/error-state.*`
- `shared/empty-state.*`

Adjust naming to match the project’s conventions.

## Recommended lib/hooks additions

Potential additions:
- `src/lib/mock-data/crewclaw-governance.ts`
- `src/lib/runtime/resolve-runtime.ts`
- `src/lib/runtime/allowlist-check.ts`
- `src/lib/runtime/simulate-resolution.ts`
- `src/hooks/use-model-resolution.ts`
- `src/hooks/use-approval-summary.ts`

These can be implemented with local/static/mock data first if needed, as long as the UI is realistic and internally consistent.

## Test targets

Create or extend Playwright tests for:
- route navigation to each target page
- realistic content presence
- no placeholder text on target pages
- key UI interactions
- workflow/pipeline editor rendering
- model routing simulation
- RBAC permission display
- approvals filtering/search

## Environment normalization

Normalize test/runtime URL selection so the repo does not rely on a single hardcoded LAN URL. Support env-based base URL in Playwright and document fallback behavior.
