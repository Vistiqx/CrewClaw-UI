export interface Business {
  id: string;
  name: string;
  prefix: string;
  type: 'primary' | 'subsidiary';
  status: 'active' | 'inactive';
  parentBusinessId?: string;
}

export interface Council {
  id: string;
  name: string;
  domain: string;
  primaryBusinessId: string;
  status: 'active' | 'inactive' | 'draft';
  leadAssistantId: string;
  description: string;
  memberIds: string[];
  subsidiaryBusinessIds: string[];
  recentRecommendations: number;
  pendingApprovals: number;
}

export interface Team {
  id: string;
  name: string;
  businessId: string;
  primaryAdvisorAssistantId: string;
  orchestratorAssistantId: string;
  status: 'active' | 'inactive' | 'draft';
  assistantIds: string[];
  taskCount: number;
  defaultProvider: string;
  defaultModel: string;
  defaultApiKeyRef: string;
  policyPackId?: string;
}

export interface Assistant {
  id: string;
  name: string;
  businessId: string;
  teamId?: string;
  status: 'running' | 'stopped' | 'error';
  operatingMode: 'observe' | 'propose' | 'execute_with_approval' | 'autonomous';
  defaultProvider: string;
  defaultModel: string;
  defaultApiKeyRef: string;
  description: string;
  councilIds: string[];
  recentRuns: number;
  recentApprovals: number;
}

export interface AssistantRbacPolicy {
  assistantId: string;
  fileRead: boolean;
  fileWrite: boolean;
  fileEdit: boolean;
  fileDelete: boolean;
  mayMessageHuman: boolean;
  mayUseChannels: boolean;
  mayMessageAssistants: boolean;
  approvalThreshold: 'low' | 'medium' | 'high' | 'critical';
}

export interface AssistantModelAllow {
  assistantId: string;
  provider: string;
  model: string;
  status: 'allowed' | 'blocked' | 'deprecated';
}

export interface ApiKey {
  id: string;
  name: string;
  provider: string;
  scope: 'global' | 'team' | 'assistant';
  environment: 'production' | 'staging' | 'development';
  status: 'active' | 'inactive' | 'expired';
  lastRotatedAt: string;
  assignedAssistants: number;
  health: 'healthy' | 'warning' | 'error';
}

export interface SecretReference {
  id: string;
  assistantId: string;
  kind: 'channel' | 'provider' | 'app';
  providerOrChannel: string;
  purpose: string;
  environment: 'production' | 'staging' | 'development';
  status: 'active' | 'inactive';
  lastRotatedAt: string;
}

export interface ModelRegistryEntry {
  id: string;
  provider: string;
  model: string;
  capabilityTags: string[];
  contextWindow: number;
  costTier: 'free' | 'low' | 'medium' | 'high' | 'premium';
  latencyTier: 'fast' | 'medium' | 'slow';
  status: 'active' | 'blocked' | 'deprecated';
  description: string;
}

export interface ModelRoutingRule {
  id: string;
  name: string;
  scope: 'global' | 'workflow' | 'team' | 'assistant';
  condition: {
    workflowId?: string;
    stepType?: string;
    taskCriticality?: string;
    teamId?: string;
    assistantClass?: string;
  };
  provider: string;
  model: string;
  apiKeyRef: string;
  priority: number;
  status: 'active' | 'inactive' | 'draft';
  fallbackBehavior: 'next_rule' | 'default' | 'block';
}

export interface Workflow {
  id: string;
  name: string;
  businessScope: string;
  status: 'draft' | 'testing' | 'approved' | 'active' | 'deprecated' | 'archived';
  version: number;
  nodeCount: number;
  lastModified: string;
  description: string;
}

export interface Pipeline {
  id: string;
  name: string;
  businessScope: string;
  status: 'draft' | 'testing' | 'approved' | 'active' | 'deprecated' | 'archived';
  version: number;
  stageCount: number;
  avgCompletionTime: number;
  lastModified: string;
  description: string;
}

export interface Approval {
  id: string;
  sourceType: 'model_escalation' | 'external_communication' | 'file_deletion' | 'workflow_publish' | 'pipeline_publish' | 'secret_access' | 'tool_execution';
  sourceRef: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  requestedByType: 'assistant' | 'workflow' | 'system';
  requestedByRef: string;
  requestedByName: string;
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  submittedAt: string;
  decisionAt?: string;
  reason: string;
  impactedAssets: string[];
  proposedAction: string;
}

export const mockBusinesses: Business[] = [
  { id: 'biz-1', name: 'Acme Corp', prefix: 'ACME', type: 'primary', status: 'active' },
  { id: 'biz-2', name: 'Acme Subsidiary A', prefix: 'ACME-A', type: 'subsidiary', status: 'active', parentBusinessId: 'biz-1' },
  { id: 'biz-3', name: 'Acme Subsidiary B', prefix: 'ACME-B', type: 'subsidiary', status: 'active', parentBusinessId: 'biz-1' },
];

export const mockAssistants: Assistant[] = [
  { id: 'ast-1', name: 'ACME-Finance-Advisor', businessId: 'biz-1', teamId: 'team-1', status: 'running', operatingMode: 'execute_with_approval', defaultProvider: 'openai', defaultModel: 'gpt-4', defaultApiKeyRef: 'key-1', description: 'Financial analysis and forecasting assistant', councilIds: ['council-1'], recentRuns: 156, recentApprovals: 12 },
  { id: 'ast-2', name: 'ACME-Legal-Counsel', businessId: 'biz-1', teamId: 'team-2', status: 'running', operatingMode: 'propose', defaultProvider: 'anthropic', defaultModel: 'claude-3-opus', defaultApiKeyRef: 'key-2', description: 'Legal document review and compliance assistant', councilIds: ['council-2'], recentRuns: 89, recentApprovals: 3 },
  { id: 'ast-3', name: 'ACME-A-Sales-Lead', businessId: 'biz-2', teamId: 'team-3', status: 'running', operatingMode: 'autonomous', defaultProvider: 'openai', defaultModel: 'gpt-3.5-turbo', defaultApiKeyRef: 'key-3', description: 'Sales lead qualification and outreach', councilIds: [], recentRuns: 234, recentApprovals: 0 },
  { id: 'ast-4', name: 'ACME-B-Ops-Manager', businessId: 'biz-3', teamId: 'team-4', status: 'stopped', operatingMode: 'observe', defaultProvider: 'anthropic', defaultModel: 'claude-3-sonnet', defaultApiKeyRef: 'key-4', description: 'Operations monitoring and reporting', councilIds: ['council-3'], recentRuns: 45, recentApprovals: 8 },
  { id: 'ast-5', name: 'ACME-Security-Analyst', businessId: 'biz-1', teamId: 'team-1', status: 'running', operatingMode: 'execute_with_approval', defaultProvider: 'openai', defaultModel: 'gpt-4-turbo', defaultApiKeyRef: 'key-1', description: 'Security threat analysis and incident response', councilIds: ['council-4'], recentRuns: 78, recentApprovals: 15 },
];

export const mockCouncils: Council[] = [
  { id: 'council-1', name: 'Finance Council', domain: 'finance', primaryBusinessId: 'biz-1', status: 'active', leadAssistantId: 'ast-1', description: 'Financial strategy and investment advisory', memberIds: ['ast-1', 'ast-5'], subsidiaryBusinessIds: ['biz-2'], recentRecommendations: 23, pendingApprovals: 3 },
  { id: 'council-2', name: 'Legal Council', domain: 'legal', primaryBusinessId: 'biz-1', status: 'active', leadAssistantId: 'ast-2', description: 'Legal compliance and risk management', memberIds: ['ast-2'], subsidiaryBusinessIds: [], recentRecommendations: 12, pendingApprovals: 1 },
  { id: 'council-3', name: 'Operations Council', domain: 'operations', primaryBusinessId: 'biz-3', status: 'active', leadAssistantId: 'ast-4', description: 'Operational efficiency and process optimization', memberIds: ['ast-4'], subsidiaryBusinessIds: [], recentRecommendations: 8, pendingApprovals: 0 },
  { id: 'council-4', name: 'Security Council', domain: 'security', primaryBusinessId: 'biz-1', status: 'active', leadAssistantId: 'ast-5', description: 'Security governance and threat response', memberIds: ['ast-5', 'ast-1'], subsidiaryBusinessIds: ['biz-2', 'biz-3'], recentRecommendations: 15, pendingApprovals: 2 },
];

export const mockTeams: Team[] = [
  { id: 'team-1', name: 'Finance Team', businessId: 'biz-1', primaryAdvisorAssistantId: 'ast-1', orchestratorAssistantId: 'ast-1', status: 'active', assistantIds: ['ast-1', 'ast-5'], taskCount: 45, defaultProvider: 'openai', defaultModel: 'gpt-4', defaultApiKeyRef: 'key-1', policyPackId: 'pack-1' },
  { id: 'team-2', name: 'Legal Team', businessId: 'biz-1', primaryAdvisorAssistantId: 'ast-2', orchestratorAssistantId: 'ast-2', status: 'active', assistantIds: ['ast-2'], taskCount: 23, defaultProvider: 'anthropic', defaultModel: 'claude-3-opus', defaultApiKeyRef: 'key-2', policyPackId: 'pack-2' },
  { id: 'team-3', name: 'Sales Team A', businessId: 'biz-2', primaryAdvisorAssistantId: 'ast-3', orchestratorAssistantId: 'ast-3', status: 'active', assistantIds: ['ast-3'], taskCount: 67, defaultProvider: 'openai', defaultModel: 'gpt-3.5-turbo', defaultApiKeyRef: 'key-3', policyPackId: 'pack-3' },
  { id: 'team-4', name: 'Operations Team B', businessId: 'biz-3', primaryAdvisorAssistantId: 'ast-4', orchestratorAssistantId: 'ast-4', status: 'inactive', assistantIds: ['ast-4'], taskCount: 12, defaultProvider: 'anthropic', defaultModel: 'claude-3-sonnet', defaultApiKeyRef: 'key-4', policyPackId: 'pack-4' },
];

export const mockRbacPolicies: AssistantRbacPolicy[] = [
  { assistantId: 'ast-1', fileRead: true, fileWrite: true, fileEdit: true, fileDelete: false, mayMessageHuman: true, mayUseChannels: true, mayMessageAssistants: true, approvalThreshold: 'medium' },
  { assistantId: 'ast-2', fileRead: true, fileWrite: false, fileEdit: true, fileDelete: false, mayMessageHuman: true, mayUseChannels: false, mayMessageAssistants: true, approvalThreshold: 'high' },
  { assistantId: 'ast-3', fileRead: true, fileWrite: true, fileEdit: true, fileDelete: true, mayMessageHuman: false, mayUseChannels: true, mayMessageAssistants: false, approvalThreshold: 'low' },
  { assistantId: 'ast-4', fileRead: true, fileWrite: false, fileEdit: false, fileDelete: false, mayMessageHuman: true, mayUseChannels: false, mayMessageAssistants: true, approvalThreshold: 'medium' },
  { assistantId: 'ast-5', fileRead: true, fileWrite: true, fileEdit: true, fileDelete: true, mayMessageHuman: true, mayUseChannels: true, mayMessageAssistants: true, approvalThreshold: 'critical' },
];

export const mockModelAllows: AssistantModelAllow[] = [
  { assistantId: 'ast-1', provider: 'openai', model: 'gpt-4', status: 'allowed' },
  { assistantId: 'ast-1', provider: 'openai', model: 'gpt-4-turbo', status: 'allowed' },
  { assistantId: 'ast-1', provider: 'openai', model: 'gpt-3.5-turbo', status: 'allowed' },
  { assistantId: 'ast-2', provider: 'anthropic', model: 'claude-3-opus', status: 'allowed' },
  { assistantId: 'ast-2', provider: 'anthropic', model: 'claude-3-sonnet', status: 'allowed' },
  { assistantId: 'ast-3', provider: 'openai', model: 'gpt-3.5-turbo', status: 'allowed' },
  { assistantId: 'ast-4', provider: 'anthropic', model: 'claude-3-sonnet', status: 'allowed' },
  { assistantId: 'ast-5', provider: 'openai', model: 'gpt-4-turbo', status: 'allowed' },
  { assistantId: 'ast-5', provider: 'openai', model: 'gpt-4', status: 'allowed' },
];

export const mockApiKeys: ApiKey[] = [
  { id: 'key-1', name: 'OpenAI Production Key', provider: 'openai', scope: 'global', environment: 'production', status: 'active', lastRotatedAt: '2024-03-01T00:00:00Z', assignedAssistants: 3, health: 'healthy' },
  { id: 'key-2', name: 'Anthropic Legal Key', provider: 'anthropic', scope: 'team', environment: 'production', status: 'active', lastRotatedAt: '2024-02-15T00:00:00Z', assignedAssistants: 1, health: 'healthy' },
  { id: 'key-3', name: 'OpenAI Sales Key', provider: 'openai', scope: 'team', environment: 'production', status: 'active', lastRotatedAt: '2024-03-05T00:00:00Z', assignedAssistants: 1, health: 'warning' },
  { id: 'key-4', name: 'Anthropic Dev Key', provider: 'anthropic', scope: 'assistant', environment: 'development', status: 'inactive', lastRotatedAt: '2024-01-20T00:00:00Z', assignedAssistants: 1, health: 'error' },
];

export const mockSecrets: SecretReference[] = [
  { id: 'sec-1', assistantId: 'ast-1', kind: 'channel', providerOrChannel: 'slack', purpose: 'Finance channel notifications', environment: 'production', status: 'active', lastRotatedAt: '2024-03-01T00:00:00Z' },
  { id: 'sec-2', assistantId: 'ast-2', kind: 'channel', providerOrChannel: 'email', purpose: 'Legal alerts', environment: 'production', status: 'active', lastRotatedAt: '2024-02-15T00:00:00Z' },
  { id: 'sec-3', assistantId: 'ast-3', kind: 'channel', providerOrChannel: 'telegram', purpose: 'Sales notifications', environment: 'production', status: 'active', lastRotatedAt: '2024-03-05T00:00:00Z' },
  { id: 'sec-4', assistantId: 'ast-5', kind: 'app', providerOrChannel: 'pagerduty', purpose: 'Security incident alerts', environment: 'production', status: 'active', lastRotatedAt: '2024-03-10T00:00:00Z' },
];

export const mockModelRegistry: ModelRegistryEntry[] = [
  { id: 'model-1', provider: 'openai', model: 'gpt-4', capabilityTags: ['reasoning', 'writing', 'coding'], contextWindow: 8192, costTier: 'premium', latencyTier: 'medium', status: 'active', description: 'Most capable GPT-4 model for complex tasks' },
  { id: 'model-2', provider: 'openai', model: 'gpt-4-turbo', capabilityTags: ['reasoning', 'writing', 'coding', 'vision'], contextWindow: 128000, costTier: 'high', latencyTier: 'medium', status: 'active', description: 'Latest GPT-4 Turbo with improved capabilities' },
  { id: 'model-3', provider: 'openai', model: 'gpt-3.5-turbo', capabilityTags: ['writing', 'coding'], contextWindow: 16385, costTier: 'low', latencyTier: 'fast', status: 'active', description: 'Fast and cost-effective for simpler tasks' },
  { id: 'model-4', provider: 'anthropic', model: 'claude-3-opus', capabilityTags: ['reasoning', 'writing', 'coding', 'vision'], contextWindow: 200000, costTier: 'premium', latencyTier: 'slow', status: 'active', description: 'Most capable Claude model for complex reasoning' },
  { id: 'model-5', provider: 'anthropic', model: 'claude-3-sonnet', capabilityTags: ['reasoning', 'writing', 'coding'], contextWindow: 200000, costTier: 'medium', latencyTier: 'medium', status: 'active', description: 'Balanced performance and cost' },
  { id: 'model-6', provider: 'openai', model: 'gpt-4-vision', capabilityTags: ['vision', 'reasoning'], contextWindow: 128000, costTier: 'premium', latencyTier: 'medium', status: 'deprecated', description: 'Deprecated - use GPT-4 Turbo instead' },
];

export const mockRoutingRules: ModelRoutingRule[] = [
  { id: 'rule-1', name: 'High Criticality Financial Tasks', scope: 'workflow', condition: { workflowId: 'wf-1', taskCriticality: 'high' }, provider: 'openai', model: 'gpt-4', apiKeyRef: 'key-1', priority: 1, status: 'active', fallbackBehavior: 'next_rule' },
  { id: 'rule-2', name: 'Legal Document Review', scope: 'team', condition: { teamId: 'team-2' }, provider: 'anthropic', model: 'claude-3-opus', apiKeyRef: 'key-2', priority: 2, status: 'active', fallbackBehavior: 'next_rule' },
  { id: 'rule-3', name: 'Sales Outreach Default', scope: 'team', condition: { teamId: 'team-3' }, provider: 'openai', model: 'gpt-3.5-turbo', apiKeyRef: 'key-3', priority: 3, status: 'active', fallbackBehavior: 'default' },
  { id: 'rule-4', name: 'Security Analysis Override', scope: 'assistant', condition: { assistantClass: 'security' }, provider: 'openai', model: 'gpt-4-turbo', apiKeyRef: 'key-1', priority: 0, status: 'active', fallbackBehavior: 'block' },
];

export const mockWorkflows: Workflow[] = [
  { id: 'wf-1', name: 'Financial Report Generation', businessScope: 'biz-1', status: 'active', version: 3, nodeCount: 8, lastModified: '2024-03-10T00:00:00Z', description: 'Automated quarterly financial report generation workflow' },
  { id: 'wf-2', name: 'Legal Contract Review', businessScope: 'biz-1', status: 'testing', version: 2, nodeCount: 12, lastModified: '2024-03-08T00:00:00Z', description: 'Multi-stage legal contract review and approval workflow' },
  { id: 'wf-3', name: 'Sales Lead Qualification', businessScope: 'biz-2', status: 'active', version: 5, nodeCount: 6, lastModified: '2024-03-12T00:00:00Z', description: 'Lead scoring and qualification automation' },
  { id: 'wf-4', name: 'Security Incident Response', businessScope: 'biz-1', status: 'draft', version: 1, nodeCount: 15, lastModified: '2024-03-11T00:00:00Z', description: 'Security incident detection and response orchestration' },
];

export const mockPipelines: Pipeline[] = [
  { id: 'pipe-1', name: 'Document Processing Pipeline', businessScope: 'biz-1', status: 'active', version: 4, stageCount: 6, avgCompletionTime: 120, lastModified: '2024-03-09T00:00:00Z', description: 'Document ingestion, validation, and processing pipeline' },
  { id: 'pipe-2', name: 'Code Review Pipeline', businessScope: 'biz-1', status: 'testing', version: 2, stageCount: 8, avgCompletionTime: 45, lastModified: '2024-03-07T00:00:00Z', description: 'Automated code quality and security review pipeline' },
  { id: 'pipe-3', name: 'Data ETL Pipeline', businessScope: 'biz-2', status: 'active', version: 7, stageCount: 10, avgCompletionTime: 300, lastModified: '2024-03-12T00:00:00Z', description: 'Extract, transform, and load pipeline for analytics' },
];

export const mockApprovals: Approval[] = [
  { id: 'app-1', sourceType: 'model_escalation', sourceRef: 'run-123', criticality: 'high', requestedByType: 'assistant', requestedByRef: 'ast-3', requestedByName: 'ACME-A-Sales-Lead', status: 'pending', submittedAt: '2024-03-15T10:30:00Z', reason: 'Request to use GPT-4 for high-value client proposal', impactedAssets: ['client-data', 'proposal-draft'], proposedAction: 'Upgrade from GPT-3.5 to GPT-4 for this task' },
  { id: 'app-2', sourceType: 'external_communication', sourceRef: 'msg-456', criticality: 'medium', requestedByType: 'assistant', requestedByRef: 'ast-1', requestedByName: 'ACME-Finance-Advisor', status: 'approved', submittedAt: '2024-03-14T14:00:00Z', decisionAt: '2024-03-14T14:15:00Z', reason: 'Request to send financial summary to external auditor', impactedAssets: ['financial-data'], proposedAction: 'Send encrypted email with Q1 summary' },
  { id: 'app-3', sourceType: 'file_deletion', sourceRef: 'file-789', criticality: 'critical', requestedByType: 'workflow', requestedByRef: 'wf-4', requestedByName: 'Security Incident Response', status: 'pending', submittedAt: '2024-03-15T09:00:00Z', reason: 'Delete compromised log files as part of incident response', impactedAssets: ['security-logs', 'audit-trail'], proposedAction: 'Delete and archive affected log files' },
  { id: 'app-4', sourceType: 'secret_access', sourceRef: 'sec-4', criticality: 'high', requestedByType: 'assistant', requestedByRef: 'ast-5', requestedByName: 'ACME-Security-Analyst', status: 'approved', submittedAt: '2024-03-13T11:00:00Z', decisionAt: '2024-03-13T11:30:00Z', reason: 'Access to PagerDuty API for incident escalation', impactedAssets: ['pagerduty-credentials'], proposedAction: 'Grant temporary access for incident response' },
  { id: 'app-5', sourceType: 'workflow_publish', sourceRef: 'wf-4', criticality: 'medium', requestedByType: 'assistant', requestedByRef: 'ast-5', requestedByName: 'ACME-Security-Analyst', status: 'pending', submittedAt: '2024-03-15T08:00:00Z', reason: 'Publish Security Incident Response workflow to production', impactedAssets: ['production-workflows'], proposedAction: 'Activate workflow v1 in production' },
  { id: 'app-6', sourceType: 'tool_execution', sourceRef: 'tool-101', criticality: 'low', requestedByType: 'assistant', requestedByRef: 'ast-2', requestedByName: 'ACME-Legal-Counsel', status: 'rejected', submittedAt: '2024-03-12T16:00:00Z', decisionAt: '2024-03-12T16:30:00Z', reason: 'Execute external contract analysis tool', impactedAssets: ['contract-data'], proposedAction: 'Run third-party AI analysis on contract' },
];

export const policyPacks = [
  { id: 'pack-1', name: 'Research Assistant Policy', description: 'Full read access, limited write, high approval threshold', fileRead: true, fileWrite: false, fileEdit: true, fileDelete: false, mayMessageHuman: true, mayUseChannels: true, mayMessageAssistants: true, approvalThreshold: 'high', modelTier: 'premium' },
  { id: 'pack-2', name: 'Writer Assistant Policy', description: 'Full content creation access, no deletions', fileRead: true, fileWrite: true, fileEdit: true, fileDelete: false, mayMessageHuman: true, mayUseChannels: true, mayMessageAssistants: false, approvalThreshold: 'medium', modelTier: 'medium' },
  { id: 'pack-3', name: 'Coding Assistant Policy', description: 'Code operations allowed with approval for risky actions', fileRead: true, fileWrite: true, fileEdit: true, fileDelete: true, mayMessageHuman: false, mayUseChannels: false, mayMessageAssistants: true, approvalThreshold: 'medium', modelTier: 'high' },
  { id: 'pack-4', name: 'Executive Assistant Policy', description: 'Broad access with executive approval requirements', fileRead: true, fileWrite: true, fileEdit: true, fileDelete: false, mayMessageHuman: true, mayUseChannels: true, mayMessageAssistants: true, approvalThreshold: 'critical', modelTier: 'premium' },
];
