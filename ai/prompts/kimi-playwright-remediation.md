# Kimi Playwright Remediation Prompt

Focus only on Playwright and runtime/browser issues.

Read:
- ai/AGENT_RULES.md
- ai/testing/crewclaw-testing-strategy.md
- ai/testing/test-matrix.md

Then:
- run Playwright for the target routes
- inspect failures and screenshots
- fix route content issues, missing selectors, broken interactions, and placeholder regressions
- use Chrome DevTools CLI on critical pages to inspect console errors
- rerun Playwright until the target pages are stable
