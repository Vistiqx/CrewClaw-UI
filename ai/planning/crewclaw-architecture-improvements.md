# CrewClaw Architecture Improvements

This document converts the strategic suggestions into buildable requirements.

## A. Governance-first architecture

CrewClaw should be optimized as a single-owner control plane managing one primary company and its subsidiaries.

### Required implications
- Approvals are owner-facing, not team queue-facing in MVP.
- Human user management can remain simplified for now.
- Every page should assume one controlling operator with broad visibility.
- Multi-user permission administration can be deferred, but audit concepts should still be visible.

## B. Deterministic runtime selection

Implement a dedicated runtime resolver concept in the UI and supporting state structure.

### Resolution precedence
1. assistant override
2. workflow step rule
3. team default
4. global default

### Hard exception
No selected provider/model may bypass the assistant allowlist.

### Display requirements
Every relevant screen should be able to explain:
- what model/provider would be selected
- which key reference would be selected
- why it was selected
- what policy blocked it if denied

## C. Policy packs

Add reusable policy concepts to reduce repetitive setup.

### Suggested starter packs
- Research Assistant Policy
- Writer Assistant Policy
- Coding Assistant Policy
- Executive Assistant Policy

Each pack should imply:
- model tier defaults
- communication permissions
- approval thresholds
- file operation permissions
- channel permissions

## D. Operating modes

Every assistant should conceptually support:
- observe only
- propose only
- execute with approval
- autonomous within limits

These can appear initially as UI fields or labels even before deep backend wiring exists.

## E. Communication topology

Introduce graph/relationship views showing:
- owner
- councils
- teams
- assistants
- channels
- allowed communication edges

These improve explainability and make RBAC easier to understand.

## F. Approval integration

Approvals must not be an isolated page. They should be produced by:
- premium model selection
- secret access
- external communication
- file deletion
- workflow publishing
- pipeline changes
- risky actions

## G. Cost governance

Because model selection is strategic, show:
- model cost tier
- expected run class
- premium usage warnings
- routing decisions that escalate cost

A first version can use labels and heuristics without real billing integration.

## H. Lifecycle states

Add lifecycle/status patterns for workflow and pipeline management:
- draft
- testing
- approved
- active
- deprecated
- archived

## I. Incident/replay visibility

Future-facing but useful even in UI-first mode:
- run timeline
- tools used
- model selected
- approvals generated
- outputs produced
- failure point

## J. Single-owner control center

Across the app, bias the experience toward:
- one inbox for approvals
- one notification center
- one cross-company activity stream
- one global command bar or quick search
