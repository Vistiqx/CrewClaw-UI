# Phased Commit Plan

Use small, descriptive commits.

## Suggested commit sequence

1. `chore: normalize crewclaw ui test/runtime baseline`
2. `feat: add shared governance and runtime ui primitives`
3. `feat: implement model and security control surfaces`
4. `feat: implement councils teams and assistant rbac pages`
5. `feat: implement workflows pipelines and approvals surfaces`
6. `feat: connect governance execution and approval experiences`
7. `test: add e2e coverage and remediate runtime issues`

## Commit checklist before each phase commit

- app boots
- lint passes or known warnings are understood and minimized
- relevant tests pass
- no targeted page is still a placeholder
- new UI uses project style patterns
