# Kimi Repair Loop Prompt

You are in remediation mode for CrewClaw-UI.

Read:
- ai/AGENT_RULES.md
- ai/testing/crewclaw-testing-strategy.md

Then:
1. run the failing tests and validations
2. inspect the failure output
3. fix the highest-signal issues first
4. rerun validations
5. repeat until the failing set is green or the remaining blocker is clearly documented

Priorities:
- target routes first
- console/runtime errors on critical pages
- placeholder regressions
- broken interactions introduced by new UI
