# CrewClaw Data Model and System Design

This is a UI-oriented domain model for consistent implementation.

## Core entities

### Business
- id
- name
- prefix
- type: primary | subsidiary
- status
- parentBusinessId

### Council
- id
- name
- domain
- primaryBusinessId
- status
- leadAssistantId
- description

### CouncilMember
- id
- councilId
- assistantId
- role
- originatingBusinessId

### Team
- id
- name
- businessId
- primaryAdvisorAssistantId
- orchestratorAssistantId
- status
- defaultRuntimeProfileId
- policyPackId

### Assistant
- id
- name
- businessId
- teamId
- status
- operatingMode
- defaultProvider
- defaultModel
- defaultApiKeyRef
- description

### AssistantCouncilLink
- id
- assistantId
- councilId

### AssistantRbacPolicy
- id
- assistantId
- fileRead
- fileWrite
- fileEdit
- fileDelete
- mayMessageHuman
- mayUseChannels
- mayMessageAssistants
- approvalThreshold

### AssistantCommAllow
- id
- assistantId
- targetType: assistant | channel | human
- targetRef
- status

### AssistantModelAllow
- id
- assistantId
- provider
- model
- status

### ApiKey
- id
- name
- provider
- scope
- environment
- status
- lastRotatedAt

### SecretReference
- id
- assistantId
- kind: channel | provider | app
- providerOrChannel
- purpose
- environment
- status
- lastRotatedAt

### ModelRegistryEntry
- id
- provider
- model
- capabilityTags[]
- contextWindow
- costTier
- latencyTier
- status

### ModelRoutingRule
- id
- name
- scope
- conditionJson
- provider
- model
- apiKeyRef
- priority
- status

### Workflow
- id
- name
- businessScope
- status
- version
- graphJson

### Pipeline
- id
- name
- businessScope
- status
- version
- graphJson

### Approval
- id
- sourceType
- sourceRef
- criticality
- requestedByType
- requestedByRef
- status
- submittedAt
- decisionAt
- reason

### RuntimeResolutionEvent
- id
- assistantId
- workflowId
- pipelineId
- taskId
- selectedProvider
- selectedModel
- selectedApiKeyRef
- sourceOfDecision
- blockedReason
- approvalCreated

## UI state guidance

Use consistent state slices or query keys for:
- businesses
- councils
- teams
- assistants
- assistant identity cards
- assistant RBAC
- API keys
- secrets
- model registry
- routing rules
- workflows
- pipelines
- approvals

## Canvas/editor guidance

Workflows and pipelines should both use:
- node definitions
- edge definitions
- validation rules
- inspector panel state
- draft vs active version state

## Preview/simulation guidance

Support simulation objects that return:
- selected runtime
- selected approvals
- blocked edges
- denied policies
- explanation strings
