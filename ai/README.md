# CrewClaw AI Builder Pack

This folder is meant to be copied into the root of the `CrewClaw-UI` repository.

## Purpose

These documents give an autonomous coding agent enough context to:

- replace placeholder pages with real, realistic UI
- preserve CrewClaw product intent
- implement governance-first architecture
- enforce strict assistant model allowlists
- run quality gates with React Doctor, Playwright CLI, and Chrome DevTools CLI
- commit by phase and keep the repo in a working state

## Expected repo placement

Place this folder at:

`D:\__Projects\CrewClaw-UI\ai`

Resulting structure:

```text
CrewClaw-UI/
├─ ai/
│  ├─ README.md
│  ├─ AGENT_RULES.md
│  ├─ planning/
│  ├─ implementation/
│  ├─ prompts/
│  └─ testing/
├─ src/
├─ tests/
└─ package.json
```

## Execution order for AI

1. Read `ai/AGENT_RULES.md`
2. Read `ai/planning/pages-to-build.md`
3. Read `ai/planning/crewclaw-page-blueprint.md`
4. Read `ai/planning/crewclaw-architecture-improvements.md`
5. Read `ai/planning/data-model-and-system-design.md`
6. Read `ai/implementation/repo-target-map.md`
7. Read `ai/implementation/crewclaw-implementation-plan.md`
8. Read `ai/testing/crewclaw-testing-strategy.md`
9. Execute `ai/prompts/kimi-autonomous-builder.md`

## Notes

This pack assumes the local repo matches the public GitHub repo and that the current placeholder routes already exist in `src/app`.
