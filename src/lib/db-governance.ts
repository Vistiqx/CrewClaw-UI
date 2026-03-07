import Database from "better-sqlite3";

export function createGovernanceTables(database: Database.Database): void {
  // Create councils table
  database.exec(`
    CREATE TABLE IF NOT EXISTS councils (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      domain TEXT NOT NULL,
      primary_business_id TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      lead_assistant_id INTEGER,
      description TEXT,
      recent_recommendations INTEGER DEFAULT 0,
      pending_approvals INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (primary_business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );
  `);

  // Create council_members table (many-to-many)
  database.exec(`
    CREATE TABLE IF NOT EXISTS council_members (
      council_id TEXT NOT NULL,
      assistant_id INTEGER NOT NULL,
      PRIMARY KEY (council_id, assistant_id),
      FOREIGN KEY (council_id) REFERENCES councils(id) ON DELETE CASCADE,
      FOREIGN KEY (assistant_id) REFERENCES assistants(id) ON DELETE CASCADE
    );
  `);

  // Create council_subsidiaries table
  database.exec(`
    CREATE TABLE IF NOT EXISTS council_subsidiaries (
      council_id TEXT NOT NULL,
      business_id TEXT NOT NULL,
      PRIMARY KEY (council_id, business_id),
      FOREIGN KEY (council_id) REFERENCES councils(id) ON DELETE CASCADE,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );
  `);

  // Create teams table
  database.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      business_id TEXT NOT NULL,
      primary_advisor_assistant_id INTEGER,
      orchestrator_assistant_id INTEGER,
      status TEXT DEFAULT 'active',
      default_provider TEXT,
      default_model TEXT,
      default_api_key_ref TEXT,
      policy_pack_id TEXT,
      task_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );
  `);

  // Create team_members table (many-to-many)
  database.exec(`
    CREATE TABLE IF NOT EXISTS team_members (
      team_id TEXT NOT NULL,
      assistant_id INTEGER NOT NULL,
      PRIMARY KEY (team_id, assistant_id),
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (assistant_id) REFERENCES assistants(id) ON DELETE CASCADE
    );
  `);

  // Create api_keys table
  database.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      provider TEXT NOT NULL,
      scope TEXT DEFAULT 'global',
      environment TEXT DEFAULT 'production',
      status TEXT DEFAULT 'active',
      assigned_assistants INTEGER DEFAULT 0,
      health TEXT DEFAULT 'healthy',
      last_rotated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create model_registry table
  database.exec(`
    CREATE TABLE IF NOT EXISTS model_registry (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      capability_tags TEXT NOT NULL,
      context_window INTEGER NOT NULL,
      cost_tier TEXT NOT NULL,
      latency_tier TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create model_routing_rules table
  database.exec(`
    CREATE TABLE IF NOT EXISTS model_routing_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      scope TEXT NOT NULL,
      condition_workflow_id TEXT,
      condition_step_type TEXT,
      condition_task_criticality TEXT,
      condition_team_id TEXT,
      condition_assistant_class TEXT,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      api_key_ref TEXT NOT NULL,
      priority INTEGER NOT NULL,
      status TEXT DEFAULT 'active',
      fallback_behavior TEXT DEFAULT 'next_rule',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create workflows table
  database.exec(`
    CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      business_scope TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      version INTEGER DEFAULT 1,
      node_count INTEGER DEFAULT 0,
      description TEXT,
      last_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create pipelines table
  database.exec(`
    CREATE TABLE IF NOT EXISTS pipelines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      business_scope TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      version INTEGER DEFAULT 1,
      stage_count INTEGER DEFAULT 0,
      avg_completion_time INTEGER DEFAULT 0,
      description TEXT,
      last_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create approvals table
  database.exec(`
    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      source_type TEXT NOT NULL,
      source_ref TEXT NOT NULL,
      criticality TEXT DEFAULT 'medium',
      requested_by_type TEXT NOT NULL,
      requested_by_ref TEXT NOT NULL,
      requested_by_name TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      decision_at DATETIME,
      reason TEXT NOT NULL,
      proposed_action TEXT NOT NULL,
      impacted_assets TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create secrets_vault table
  database.exec(`
    CREATE TABLE IF NOT EXISTS secrets_vault (
      id TEXT PRIMARY KEY,
      assistant_id INTEGER NOT NULL,
      kind TEXT NOT NULL,
      provider_or_channel TEXT NOT NULL,
      purpose TEXT NOT NULL,
      environment TEXT DEFAULT 'production',
      status TEXT DEFAULT 'active',
      last_rotated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assistant_id) REFERENCES assistants(id) ON DELETE CASCADE
    );
  `);

  // Create assistant_model_allows table
  database.exec(`
    CREATE TABLE IF NOT EXISTS assistant_model_allows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assistant_id INTEGER NOT NULL,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      status TEXT DEFAULT 'allowed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assistant_id) REFERENCES assistants(id) ON DELETE CASCADE,
      UNIQUE(assistant_id, provider, model)
    );
  `);

  // Create assistant_rbac_policies table
  database.exec(`
    CREATE TABLE IF NOT EXISTS assistant_rbac_policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assistant_id INTEGER NOT NULL UNIQUE,
      file_read INTEGER DEFAULT 0,
      file_write INTEGER DEFAULT 0,
      file_edit INTEGER DEFAULT 0,
      file_delete INTEGER DEFAULT 0,
      may_message_human INTEGER DEFAULT 0,
      may_use_channels INTEGER DEFAULT 0,
      may_message_assistants INTEGER DEFAULT 0,
      approval_threshold TEXT DEFAULT 'medium',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assistant_id) REFERENCES assistants(id) ON DELETE CASCADE
    );
  `);
}

export function seedGovernanceData(database: Database.Database): void {
  const now = new Date().toISOString();

  // Seed businesses first (check if they exist from registry)
  const existingBusinesses = database.prepare("SELECT COUNT(*) as count FROM businesses").get() as { count: number };
  if (existingBusinesses.count === 0) {
    const businesses = [
      { id: 'biz-1', name: 'Acme Corp', prefix: 'ACME', type: 'primary', industry: 'Technology', description: 'Primary company headquarters' },
      { id: 'biz-2', name: 'Acme Subsidiary A', prefix: 'ACME-A', type: 'subsidiary', industry: 'Sales', description: 'Sales operations division' },
      { id: 'biz-3', name: 'Acme Subsidiary B', prefix: 'ACME-B', type: 'subsidiary', industry: 'Operations', description: 'Operations and logistics division' },
    ];

    const insertBiz = database.prepare(`
      INSERT INTO businesses (id, name, prefix, industry, description, timezone, status, business_type, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const biz of businesses) {
      insertBiz.run(biz.id, biz.name, biz.prefix, biz.industry, biz.description, 'UTC', 'active', biz.type, now, now);
    }
  }

  // Check if governance data already exists
  const existingAssistants = database.prepare("SELECT COUNT(*) as count FROM assistants").get() as { count: number };
  if (existingAssistants.count > 0) {
    return; // Don't seed governance data if assistants already exist
  }

  // Seed assistants
  const assistants = [
    { name: 'ACME-Finance-Advisor', business_id: 'biz-1', channel: 'slack', role: 'Financial Analyst', status: 'running' },
    { name: 'ACME-Legal-Counsel', business_id: 'biz-1', channel: 'email', role: 'Legal Reviewer', status: 'running' },
    { name: 'ACME-A-Sales-Lead', business_id: 'biz-2', channel: 'telegram', role: 'Sales Lead', status: 'running' },
    { name: 'ACME-B-Ops-Manager', business_id: 'biz-3', channel: 'discord', role: 'Operations Manager', status: 'stopped' },
    { name: 'ACME-Security-Analyst', business_id: 'biz-1', channel: 'slack', role: 'Security Analyst', status: 'running' },
  ];

  const insertAssistant = database.prepare(`
    INSERT INTO assistants (business_id, name, channel, role, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const assistantIds: number[] = [];
  for (const ast of assistants) {
    const result = insertAssistant.run(ast.business_id, ast.name, ast.channel, ast.role, ast.status, now, now);
    assistantIds.push(result.lastInsertRowid as number);
  }

  // Seed councils
  const councils = [
    { id: 'council-1', name: 'Finance Council', domain: 'finance', business_id: 'biz-1', lead_assistant_id: assistantIds[0], description: 'Financial strategy and investment advisory', recommendations: 23, approvals: 3 },
    { id: 'council-2', name: 'Legal Council', domain: 'legal', business_id: 'biz-1', lead_assistant_id: assistantIds[1], description: 'Legal compliance and risk management', recommendations: 12, approvals: 1 },
    { id: 'council-3', name: 'Operations Council', domain: 'operations', business_id: 'biz-3', lead_assistant_id: assistantIds[3], description: 'Operational efficiency and process optimization', recommendations: 8, approvals: 0 },
    { id: 'council-4', name: 'Security Council', domain: 'security', business_id: 'biz-1', lead_assistant_id: assistantIds[4], description: 'Security governance and threat response', recommendations: 15, approvals: 2 },
  ];

  const insertCouncil = database.prepare(`
    INSERT INTO councils (id, name, domain, primary_business_id, lead_assistant_id, description, recent_recommendations, pending_approvals, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const council of councils) {
    insertCouncil.run(council.id, council.name, council.domain, council.business_id, council.lead_assistant_id, council.description, council.recommendations, council.approvals, now, now);
  }

  // Seed council members
  const councilMembers = [
    { council_id: 'council-1', assistant_id: assistantIds[0] },
    { council_id: 'council-1', assistant_id: assistantIds[4] },
    { council_id: 'council-2', assistant_id: assistantIds[1] },
    { council_id: 'council-3', assistant_id: assistantIds[3] },
    { council_id: 'council-4', assistant_id: assistantIds[4] },
    { council_id: 'council-4', assistant_id: assistantIds[0] },
  ];

  const insertCouncilMember = database.prepare(`
    INSERT INTO council_members (council_id, assistant_id)
    VALUES (?, ?)
  `);

  for (const member of councilMembers) {
    insertCouncilMember.run(member.council_id, member.assistant_id);
  }

  // Seed council subsidiaries
  const councilSubsidiaries = [
    { council_id: 'council-1', business_id: 'biz-2' },
    { council_id: 'council-4', business_id: 'biz-2' },
    { council_id: 'council-4', business_id: 'biz-3' },
  ];

  const insertCouncilSubsidiary = database.prepare(`
    INSERT INTO council_subsidiaries (council_id, business_id)
    VALUES (?, ?)
  `);

  for (const sub of councilSubsidiaries) {
    insertCouncilSubsidiary.run(sub.council_id, sub.business_id);
  }

  // Seed teams
  const teams = [
    { id: 'team-1', name: 'Finance Team', business_id: 'biz-1', advisor_id: assistantIds[0], orchestrator_id: assistantIds[0], provider: 'openai', model: 'gpt-4', api_key: 'key-1', policy: 'pack-1', tasks: 45 },
    { id: 'team-2', name: 'Legal Team', business_id: 'biz-1', advisor_id: assistantIds[1], orchestrator_id: assistantIds[1], provider: 'anthropic', model: 'claude-3-opus', api_key: 'key-2', policy: 'pack-2', tasks: 23 },
    { id: 'team-3', name: 'Sales Team A', business_id: 'biz-2', advisor_id: assistantIds[2], orchestrator_id: assistantIds[2], provider: 'openai', model: 'gpt-3.5-turbo', api_key: 'key-3', policy: 'pack-3', tasks: 67 },
    { id: 'team-4', name: 'Operations Team B', business_id: 'biz-3', advisor_id: assistantIds[3], orchestrator_id: assistantIds[3], provider: 'anthropic', model: 'claude-3-sonnet', api_key: 'key-4', policy: 'pack-4', tasks: 12 },
  ];

  const insertTeam = database.prepare(`
    INSERT INTO teams (id, name, business_id, primary_advisor_assistant_id, orchestrator_assistant_id, default_provider, default_model, default_api_key_ref, policy_pack_id, task_count, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const team of teams) {
    insertTeam.run(team.id, team.name, team.business_id, team.advisor_id, team.orchestrator_id, team.provider, team.model, team.api_key, team.policy, team.tasks, now, now);
  }

  // Seed team members
  const teamMembers = [
    { team_id: 'team-1', assistant_id: assistantIds[0] },
    { team_id: 'team-1', assistant_id: assistantIds[4] },
    { team_id: 'team-2', assistant_id: assistantIds[1] },
    { team_id: 'team-3', assistant_id: assistantIds[2] },
    { team_id: 'team-4', assistant_id: assistantIds[3] },
  ];

  const insertTeamMember = database.prepare(`
    INSERT INTO team_members (team_id, assistant_id)
    VALUES (?, ?)
  `);

  for (const member of teamMembers) {
    insertTeamMember.run(member.team_id, member.assistant_id);
  }

  // Seed API keys
  const apiKeys = [
    { id: 'key-1', name: 'OpenAI Production Key', provider: 'openai', scope: 'global', env: 'production', status: 'active', assistants: 3, health: 'healthy' },
    { id: 'key-2', name: 'Anthropic Legal Key', provider: 'anthropic', scope: 'team', env: 'production', status: 'active', assistants: 1, health: 'healthy' },
    { id: 'key-3', name: 'OpenAI Sales Key', provider: 'openai', scope: 'team', env: 'production', status: 'active', assistants: 1, health: 'warning' },
    { id: 'key-4', name: 'Anthropic Dev Key', provider: 'anthropic', scope: 'assistant', env: 'development', status: 'inactive', assistants: 1, health: 'error' },
  ];

  const insertApiKey = database.prepare(`
    INSERT INTO api_keys (id, name, provider, scope, environment, status, assigned_assistants, health, last_rotated_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const key of apiKeys) {
    insertApiKey.run(key.id, key.name, key.provider, key.scope, key.env, key.status, key.assistants, key.health, now, now, now);
  }

  // Seed model registry
  const models = [
    { id: 'model-1', provider: 'openai', model: 'gpt-4', tags: JSON.stringify(['reasoning', 'writing', 'coding']), window: 8192, cost: 'premium', latency: 'medium', status: 'active', desc: 'Most capable GPT-4 model for complex tasks' },
    { id: 'model-2', provider: 'openai', model: 'gpt-4-turbo', tags: JSON.stringify(['reasoning', 'writing', 'coding', 'vision']), window: 128000, cost: 'high', latency: 'medium', status: 'active', desc: 'Latest GPT-4 Turbo with improved capabilities' },
    { id: 'model-3', provider: 'openai', model: 'gpt-3.5-turbo', tags: JSON.stringify(['writing', 'coding']), window: 16385, cost: 'low', latency: 'fast', status: 'active', desc: 'Fast and cost-effective for simpler tasks' },
    { id: 'model-4', provider: 'anthropic', model: 'claude-3-opus', tags: JSON.stringify(['reasoning', 'writing', 'coding', 'vision']), window: 200000, cost: 'premium', latency: 'slow', status: 'active', desc: 'Most capable Claude model for complex reasoning' },
    { id: 'model-5', provider: 'anthropic', model: 'claude-3-sonnet', tags: JSON.stringify(['reasoning', 'writing', 'coding']), window: 200000, cost: 'medium', latency: 'medium', status: 'active', desc: 'Balanced performance and cost' },
    { id: 'model-6', provider: 'openai', model: 'gpt-4-vision', tags: JSON.stringify(['vision', 'reasoning']), window: 128000, cost: 'premium', latency: 'medium', status: 'deprecated', desc: 'Deprecated - use GPT-4 Turbo instead' },
  ];

  const insertModel = database.prepare(`
    INSERT INTO model_registry (id, provider, model, capability_tags, context_window, cost_tier, latency_tier, status, description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const m of models) {
    insertModel.run(m.id, m.provider, m.model, m.tags, m.window, m.cost, m.latency, m.status, m.desc, now, now);
  }

  // Seed model routing rules
  const routingRules = [
    { id: 'rule-1', name: 'High Criticality Financial Tasks', scope: 'workflow', workflow: 'wf-1', criticality: 'high', provider: 'openai', model: 'gpt-4', key: 'key-1', priority: 1, status: 'active', fallback: 'next_rule' },
    { id: 'rule-2', name: 'Legal Document Review', scope: 'team', team: 'team-2', provider: 'anthropic', model: 'claude-3-opus', key: 'key-2', priority: 2, status: 'active', fallback: 'next_rule' },
    { id: 'rule-3', name: 'Sales Outreach Default', scope: 'team', team: 'team-3', provider: 'openai', model: 'gpt-3.5-turbo', key: 'key-3', priority: 3, status: 'active', fallback: 'default' },
    { id: 'rule-4', name: 'Security Analysis Override', scope: 'assistant', class: 'security', provider: 'openai', model: 'gpt-4-turbo', key: 'key-1', priority: 0, status: 'active', fallback: 'block' },
  ];

  const insertRule = database.prepare(`
    INSERT INTO model_routing_rules (id, name, scope, condition_workflow_id, condition_task_criticality, condition_team_id, condition_assistant_class, provider, model, api_key_ref, priority, status, fallback_behavior, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const rule of routingRules) {
    insertRule.run(rule.id, rule.name, rule.scope, rule.workflow || null, rule.criticality || null, rule.team || null, rule.class || null, rule.provider, rule.model, rule.key, rule.priority, rule.status, rule.fallback, now, now);
  }

  // Seed workflows
  const workflows = [
    { id: 'wf-1', name: 'Financial Report Generation', scope: 'biz-1', status: 'active', version: 3, nodes: 8, desc: 'Automated quarterly financial report generation workflow' },
    { id: 'wf-2', name: 'Legal Contract Review', scope: 'biz-1', status: 'testing', version: 2, nodes: 12, desc: 'Multi-stage legal contract review and approval workflow' },
    { id: 'wf-3', name: 'Sales Lead Qualification', scope: 'biz-2', status: 'active', version: 5, nodes: 6, desc: 'Lead scoring and qualification automation' },
    { id: 'wf-4', name: 'Security Incident Response', scope: 'biz-1', status: 'draft', version: 1, nodes: 15, desc: 'Security incident detection and response orchestration' },
  ];

  const insertWorkflow = database.prepare(`
    INSERT INTO workflows (id, name, business_scope, status, version, node_count, description, last_modified, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const wf of workflows) {
    insertWorkflow.run(wf.id, wf.name, wf.scope, wf.status, wf.version, wf.nodes, wf.desc, now, now, now);
  }

  // Seed pipelines
  const pipelines = [
    { id: 'pipe-1', name: 'Document Processing Pipeline', scope: 'biz-1', status: 'active', version: 4, stages: 6, time: 120, desc: 'Document ingestion, validation, and processing pipeline' },
    { id: 'pipe-2', name: 'Code Review Pipeline', scope: 'biz-1', status: 'testing', version: 2, stages: 8, time: 45, desc: 'Automated code quality and security review pipeline' },
    { id: 'pipe-3', name: 'Data ETL Pipeline', scope: 'biz-2', status: 'active', version: 7, stages: 10, time: 300, desc: 'Extract, transform, and load pipeline for analytics' },
  ];

  const insertPipeline = database.prepare(`
    INSERT INTO pipelines (id, name, business_scope, status, version, stage_count, avg_completion_time, description, last_modified, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const pipe of pipelines) {
    insertPipeline.run(pipe.id, pipe.name, pipe.scope, pipe.status, pipe.version, pipe.stages, pipe.time, pipe.desc, now, now, now);
  }

  // Seed approvals
  const approvals = [
    { id: 'app-1', source: 'model_escalation', ref: 'run-123', criticality: 'high', req_type: 'assistant', req_ref: 'ast-3', req_name: 'ACME-A-Sales-Lead', status: 'pending', reason: 'Request to use GPT-4 for high-value client proposal', assets: JSON.stringify(['client-data', 'proposal-draft']), action: 'Upgrade from GPT-3.5 to GPT-4 for this task' },
    { id: 'app-2', source: 'external_communication', ref: 'msg-456', criticality: 'medium', req_type: 'assistant', req_ref: 'ast-1', req_name: 'ACME-Finance-Advisor', status: 'approved', reason: 'Request to send financial summary to external auditor', assets: JSON.stringify(['financial-data']), action: 'Send encrypted email with Q1 summary' },
    { id: 'app-3', source: 'file_deletion', ref: 'file-789', criticality: 'critical', req_type: 'workflow', req_ref: 'wf-4', req_name: 'Security Incident Response', status: 'pending', reason: 'Delete compromised log files as part of incident response', assets: JSON.stringify(['security-logs', 'audit-trail']), action: 'Delete and archive affected log files' },
    { id: 'app-4', source: 'secret_access', ref: 'sec-4', criticality: 'high', req_type: 'assistant', req_ref: 'ast-5', req_name: 'ACME-Security-Analyst', status: 'approved', reason: 'Access to PagerDuty API for incident escalation', assets: JSON.stringify(['pagerduty-credentials']), action: 'Grant temporary access for incident response' },
    { id: 'app-5', source: 'workflow_publish', ref: 'wf-4', criticality: 'medium', req_type: 'assistant', req_ref: 'ast-5', req_name: 'ACME-Security-Analyst', status: 'pending', reason: 'Publish Security Incident Response workflow to production', assets: JSON.stringify(['production-workflows']), action: 'Activate workflow v1 in production' },
    { id: 'app-6', source: 'tool_execution', ref: 'tool-101', criticality: 'low', req_type: 'assistant', req_ref: 'ast-2', req_name: 'ACME-Legal-Counsel', status: 'rejected', reason: 'Execute external contract analysis tool', assets: JSON.stringify(['contract-data']), action: 'Run third-party AI analysis on contract' },
  ];

  const insertApproval = database.prepare(`
    INSERT INTO approvals (id, source_type, source_ref, criticality, requested_by_type, requested_by_ref, requested_by_name, status, reason, impacted_assets, proposed_action, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const app of approvals) {
    const decisionAt = app.status !== 'pending' ? now : null;
    insertApproval.run(app.id, app.source, app.ref, app.criticality, app.req_type, app.req_ref, app.req_name, app.status, app.reason, app.assets, app.action, now, now);
    if (decisionAt) {
      database.prepare("UPDATE approvals SET decision_at = ? WHERE id = ?").run(decisionAt, app.id);
    }
  }

  // Seed secrets
  const secrets = [
    { id: 'sec-1', assistant_id: assistantIds[0], kind: 'channel', channel: 'slack', purpose: 'Finance channel notifications', env: 'production' },
    { id: 'sec-2', assistant_id: assistantIds[1], kind: 'channel', channel: 'email', purpose: 'Legal alerts', env: 'production' },
    { id: 'sec-3', assistant_id: assistantIds[2], kind: 'channel', channel: 'telegram', purpose: 'Sales notifications', env: 'production' },
    { id: 'sec-4', assistant_id: assistantIds[4], kind: 'app', channel: 'pagerduty', purpose: 'Security incident alerts', env: 'production' },
  ];

  const insertSecret = database.prepare(`
    INSERT INTO secrets_vault (id, assistant_id, kind, provider_or_channel, purpose, environment, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const sec of secrets) {
    insertSecret.run(sec.id, sec.assistant_id, sec.kind, sec.channel, sec.purpose, sec.env, now, now);
  }

  // Seed RBAC policies
  const rbacPolicies = [
    { assistant_id: assistantIds[0], read: 1, write: 1, edit: 1, delete: 0, msg_human: 1, channels: 1, msg_ast: 1, threshold: 'medium' },
    { assistant_id: assistantIds[1], read: 1, write: 0, edit: 1, delete: 0, msg_human: 1, channels: 0, msg_ast: 1, threshold: 'high' },
    { assistant_id: assistantIds[2], read: 1, write: 1, edit: 1, delete: 1, msg_human: 0, channels: 1, msg_ast: 0, threshold: 'low' },
    { assistant_id: assistantIds[3], read: 1, write: 0, edit: 0, delete: 0, msg_human: 1, channels: 0, msg_ast: 1, threshold: 'medium' },
    { assistant_id: assistantIds[4], read: 1, write: 1, edit: 1, delete: 1, msg_human: 1, channels: 1, msg_ast: 1, threshold: 'critical' },
  ];

  const insertRbac = database.prepare(`
    INSERT INTO assistant_rbac_policies (assistant_id, file_read, file_write, file_edit, file_delete, may_message_human, may_use_channels, may_message_assistants, approval_threshold, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const policy of rbacPolicies) {
    insertRbac.run(policy.assistant_id, policy.read, policy.write, policy.edit, policy.delete, policy.msg_human, policy.channels, policy.msg_ast, policy.threshold, now, now);
  }

  // Seed model allows
  const modelAllows = [
    { assistant_id: assistantIds[0], provider: 'openai', model: 'gpt-4', status: 'allowed' },
    { assistant_id: assistantIds[0], provider: 'openai', model: 'gpt-4-turbo', status: 'allowed' },
    { assistant_id: assistantIds[0], provider: 'openai', model: 'gpt-3.5-turbo', status: 'allowed' },
    { assistant_id: assistantIds[1], provider: 'anthropic', model: 'claude-3-opus', status: 'allowed' },
    { assistant_id: assistantIds[1], provider: 'anthropic', model: 'claude-3-sonnet', status: 'allowed' },
    { assistant_id: assistantIds[2], provider: 'openai', model: 'gpt-3.5-turbo', status: 'allowed' },
    { assistant_id: assistantIds[3], provider: 'anthropic', model: 'claude-3-sonnet', status: 'allowed' },
    { assistant_id: assistantIds[4], provider: 'openai', model: 'gpt-4-turbo', status: 'allowed' },
    { assistant_id: assistantIds[4], provider: 'openai', model: 'gpt-4', status: 'allowed' },
  ];

  const insertModelAllow = database.prepare(`
    INSERT INTO assistant_model_allows (assistant_id, provider, model, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const allow of modelAllows) {
    insertModelAllow.run(allow.assistant_id, allow.provider, allow.model, allow.status, now, now);
  }
}
