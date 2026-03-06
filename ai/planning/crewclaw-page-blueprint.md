# CrewClaw Page Blueprint

This document defines what the targeted CrewClaw pages should contain.

---

## 1. Councils

### Purpose
Advisory councils are cross-assistant leadership groups centered around a primary company and, when needed, assistants from subsidiary companies. Think of these as specialized boards for finance, operations, legal, security, marketing, or strategy.

### Key UI sections
- header with council name, domain, business scope, status
- summary cards:
  - active councils
  - members
  - open recommendations
  - pending approvals
- council directory table:
  - name
  - primary company
  - specialty
  - chair / lead assistant
  - member count
  - status
- council detail panel:
  - mission
  - participating businesses
  - advisors / member assistants
  - related workflows
  - recent recommendations
  - recent approvals
- council composition builder:
  - add/remove assistants
  - assign primary advisor
  - tag council domain
  - mark primary and subsidiary participation
- recommendation activity stream:
  - recommendation title
  - criticality
  - originating workflow
  - approval status

### Suggested interactions
- create council
- edit council membership
- link a council to one or more workflows
- view communication topology for the council
- simulate a request through the council

### MVP notes
Use realistic local/mock-backed data if APIs are not complete, but structure the page like a true operating surface.

---

## 2. Teams

### Purpose
Teams represent subsidiary company execution groups with a primary advisor/orchestrator and a working set of assistants.

### Key UI sections
- summary cards:
  - active teams
  - assistants assigned
  - active workflows
  - task load
- team directory table:
  - name
  - parent business
  - primary advisor
  - orchestrator
  - assistant count
  - task count
  - status
- team detail workspace:
  - mission
  - business ownership
  - assigned assistants
  - default model policy
  - default workflow set
  - recent execution metrics
- membership panel:
  - assign/remove assistants
  - primary advisor
  - orchestrator
  - council relationships
- defaults panel:
  - default provider
  - default model
  - default API key / credential reference
  - policy pack
- communication map:
  - human owner
  - councils
  - team orchestrator
  - assistants

### Suggested interactions
- create/edit team
- set team defaults
- assign assistants
- view team execution overview
- view team communication permissions

---

## 3. Assistants RBAC

### Purpose
This page controls what an assistant may do, who it may communicate with, which channels it may use, what files it may affect, and which provider/model pairs it is allowed to execute.

### Core policy concept
Default deny. Explicit allowlists only.

### Key UI sections
- assistant selector
- identity card:
  - business
  - team
  - councils
  - status
  - current runtime defaults
- permission summary cards:
  - file permissions
  - communication permissions
  - tool permissions
  - model permissions
  - pending approval triggers
- policy tabs:
  - files
  - communications
  - tools/actions
  - models/providers
  - approvals
  - audit history
- file permissions:
  - read
  - write
  - edit
  - delete
  - workspace scopes
- communication permissions:
  - may talk to human owner
  - may talk to channels (Discord etc.)
  - may talk to other assistants
  - explicit target allowlist
- model/provider allowlist:
  - allowed provider/model pairs
  - default approved model
  - blocked/deprecated warnings
- approval triggers:
  - file deletion
  - external message sending
  - premium model usage
  - secret access
  - workflow publishing
- explanation panel:
  - why a run was allowed or blocked

### Suggested interactions
- select assistant
- edit policies
- test permission scenario
- preview effective permissions
- inspect recent policy decisions

---

## 4. API Keys

### Purpose
Manage external provider credentials used by assistants and model routing.

### Key UI sections
- summary cards:
  - total keys
  - active keys
  - expiring soon
  - provider coverage
- API key registry table:
  - name
  - provider
  - scope
  - environment
  - assigned assistants count
  - status
  - last rotated
- assignment panel:
  - bind keys to assistants
  - bind keys to team defaults
  - bind keys to provider/model rules
- validation results:
  - last tested
  - health
  - rate-limit notes
- rotation panel:
  - created date
  - last rotated
  - next rotation target

### Required behavior
Assistants must explicitly reference usable keys through assistant override, workflow rule, team default, or global default. Keys should not be silently used outside policy.

---

## 5. Secret Vault Improvements

### Purpose
Enhance the existing Secrets Vault page so one assistant can hold multiple secrets for multiple communication channels and providers.

### New sections to add
- secret usage matrix:
  - assistant
  - provider/channel
  - purpose
  - environment
  - secret reference
  - last rotated
- assistant-channel mapping
- secret health / rotation indicators
- usage scope panel
- audit trail for secret access requests

### Design rules
- secrets remain references, not exposed values
- clearly separate channel secrets from model/provider keys
- explain which secret is used for which communication path

---

## 6. Model Registry

### Purpose
Canonical registry of available providers/models that CrewClaw may route to.

### Key UI sections
- summary cards:
  - active models
  - providers
  - blocked models
  - deprecated models
- registry table:
  - provider
  - model
  - capabilities
  - context window
  - cost tier
  - latency tier
  - status
- model detail panel:
  - usage guidance
  - recommended workloads
  - deprecation status
  - compatibility notes
  - required API key type
- tags and classification:
  - research
  - reasoning
  - writing
  - coding
  - vision

### Required behavior
Registry is the source of truth. A provider/model pair cannot be selected anywhere if it is not in the registry.

---

## 7. Model Routing Rules

### Purpose
Define how model selection happens within the guardrails of assistant allowlists.

### Resolution order
1. assistant override
2. workflow step rule
3. team default
4. global default

Every candidate must still pass allowlist enforcement.

### Key UI sections
- summary cards:
  - active rules
  - blocked resolutions
  - deprecated model hits
  - approval escalations
- rule table:
  - name
  - scope
  - condition
  - selected provider/model
  - selected key reference
  - priority
  - status
- rule builder:
  - scope: workflow, step type, task criticality, team, assistant class
  - conditions
  - selected model target
  - selected key target
  - fallback behavior
- resolution simulator:
  - choose assistant
  - choose workflow step
  - choose task criticality
  - show resolved provider/model
  - show why it won
  - show why other options lost
- audit panel:
  - recent routing decisions
  - blocked decisions
  - approval-caused stops

### Required behavior
The page must visibly enforce allowlist-first routing. No silent bypass.

---

## 8. Workflows

### Purpose
Define who communicates with whom and in what sequence. Workflows represent orchestration and delegation.

### Key UI sections
- summary cards:
  - active workflows
  - draft workflows
  - runs today
  - blocked runs
- workflow list:
  - name
  - owner scope
  - type
  - status
  - last modified
- drag-and-drop editor:
  - human node
  - assistant node
  - council node
  - team node
  - action node
  - approval node
  - condition node
- properties panel:
  - selected node config
  - communication permissions
  - escalation rules
  - expected outputs
- execution preview:
  - topology
  - approvals
  - routing decisions
  - blocked edges
- lifecycle:
  - draft
  - testing
  - approved
  - active
  - deprecated
  - archived

### Design inspiration
Node-RED / n8n style canvas, but adapted to CrewClaw entities and policy gates.

---

## 9. Pipelines

### Purpose
Define how tasks are executed, validated, tested, reported, and promoted.

### Key UI sections
- summary cards:
  - active pipelines
  - drafts
  - average completion time
  - failed stages
- pipeline list
- drag-and-drop editor:
  - stage node
  - validation node
  - testing node
  - reporting node
  - approval gate
  - retry node
  - completion node
- stage policy panel:
  - who can work the stage
  - which assistant types are allowed
  - quality gates
  - required artifacts
- execution history preview
- promotion rules and exit criteria

### Design distinction
Workflow = communication/orchestration graph  
Pipeline = execution/testing/reporting graph

---

## 10. Approvals

### Purpose
Single owner approval center and dashboard.

### Key UI sections
- dashboard cards:
  - pending total
  - critical
  - high
  - approved today
  - rejected today
- charts:
  - approvals by criticality
  - approval trend
  - source category
- approvals table:
  - request
  - source
  - criticality
  - requested by
  - target entity
  - submitted at
  - status
- detail drawer:
  - reason
  - impacted assets
  - proposed action
  - risk notes
  - audit history
- search and filtering:
  - criticality
  - status
  - source type
  - assistant
  - business
- action buttons:
  - approve
  - reject
  - request change
  - inspect context

### Suggested approval sources
- premium model escalation
- external communication
- file deletion
- workflow publish
- pipeline publish
- sensitive secret access
- risky tool execution

---

## Cross-page improvements to include

### Assistant identity cards
Use across assistants, teams, councils, approvals, and RBAC:
- assistant name
- business/team/council memberships
- runtime defaults
- communication profile
- health
- recent runs
- recent approvals

### Communication topology graph
Use on councils, teams, workflows, RBAC:
- owner
- councils
- teams
- assistants
- allowed edges
- blocked edges

### Resolved runtime preview
Use on assistants, tasks, workflows, routing rules:
- selected provider
- selected model
- selected API key reference
- decision source
- allowlist check result
- approval requirement

### Simulation before activation
Use on workflows, pipelines, routing rules:
- simulate route
- simulate approvals
- simulate block reasons
- simulate selected runtime
