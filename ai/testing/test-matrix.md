# Test Matrix

## Route coverage matrix

| Route | Visual content | Placeholder absent | Primary interaction | Notes |
|---|---|---:|---:|---|
| `/councils` | Yes | Yes | Yes | council directory + detail panel |
| `/teams` | Yes | Yes | Yes | team defaults + topology |
| `/assistants-rbac` | Yes | Yes | Yes | tabs + allowlist matrix |
| `/api-keys` | Yes | Yes | Yes | registry + assignment |
| `/secrets-vault` | Yes | Yes | Yes | secret usage matrix |
| `/model-registry` | Yes | Yes | Yes | registry + detail panel |
| `/model-routing-rules` | Yes | Yes | Yes | rules + simulator |
| `/workflows` | Yes | Yes | Yes | editor shell |
| `/pipelines` | Yes | Yes | Yes | editor shell |
| `/approvals` | Yes | Yes | Yes | dashboard + table + filters |

## Cross-feature matrix

| Feature | Routes |
|---|---|
| Assistant identity card | assistants-rbac, teams, councils, approvals |
| Runtime preview | assistants-rbac, model-routing-rules, workflows |
| Communication topology | teams, councils, workflows |
| Approval visibility | approvals, workflows, model-routing-rules, assistants-rbac |
| Policy/allowlist visibility | assistants-rbac, model-routing-rules, model-registry |
