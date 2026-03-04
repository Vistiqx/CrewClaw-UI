import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "mission-control.db");

function ensureDbDirectory() {
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
}

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    ensureDbDirectory();
    db = new Database(DB_PATH);
    initDb(db);
  }
  return db;
}

function initDb(database: Database.Database): void {
  // Create businesses table with TEXT id to support registry IDs
  database.exec(`
    CREATE TABLE IF NOT EXISTS businesses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      prefix TEXT NOT NULL,
      industry TEXT,
      description TEXT,
      timezone TEXT DEFAULT 'UTC',
      status TEXT DEFAULT 'active',
      business_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Sync registry businesses from REGISTRY_PATH env var
  // Try multiple possible locations
  const possiblePaths = [
    process.env.REGISTRY_PATH,
    "/opt/data/crewclaw/business-registry.json",
    path.join(process.cwd(), "..", "..", "data", "crewclaw", "business-registry.json"),
    path.join(process.cwd(), "data", "business-registry.json"),
  ];
  
  for (const registryPath of possiblePaths) {
    if (registryPath && fs.existsSync(registryPath)) {
      try {
        const registryData = fs.readFileSync(registryPath, "utf-8");
        const registryBusinesses = JSON.parse(registryData);
        const insertStmt = database.prepare(`
          INSERT OR IGNORE INTO businesses (id, name, prefix, industry, description, timezone, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const biz of registryBusinesses) {
          insertStmt.run(
            biz.id,
            biz.name,
            biz.prefix,
            biz.industry || null,
            biz.description || null,
            biz.timezone || "UTC",
            biz.status || "active",
            biz.created_at || new Date().toISOString(),
            biz.updated_at || new Date().toISOString()
          );
        }
        break; // Successfully synced, exit loop
      } catch (e) {
        // Try next path
      }
    }
  }

  // Create assistants table
  database.exec(`
    CREATE TABLE IF NOT EXISTS assistants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id TEXT NOT NULL,
      name TEXT NOT NULL,
      channel TEXT NOT NULL,
      role TEXT,
      status TEXT DEFAULT 'stopped',
      container_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );
  `);

  // Add container_id column if it doesn't exist (for existing databases)
  try {
    database.exec(`ALTER TABLE assistants ADD COLUMN container_id TEXT`);
  } catch (e) {
    // Column might already exist
  }

  // Add channels column (JSON array) if it doesn't exist
  try {
    database.exec(`ALTER TABLE assistants ADD COLUMN channels TEXT`);
  } catch (e) {
    // Column might already exist
  }

  // Add business_type column if it doesn't exist
  try {
    database.exec(`ALTER TABLE businesses ADD COLUMN business_type TEXT`);
  } catch (e) {
    // Column might already exist
  }

  // Create audit_logs table
  database.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      business TEXT,
      assistant TEXT,
      event_type TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'info',
      message TEXT NOT NULL,
      metadata TEXT,
      stack_trace TEXT
    );
  `);

  // Create credentials table
  database.exec(`
    CREATE TABLE IF NOT EXISTS credentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assistant_id TEXT NOT NULL,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      encrypted_value BLOB NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assistant_id) REFERENCES assistants(id) ON DELETE CASCADE
    );
  `);

  // Create tasks table for Kanban
  database.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'todo',
      priority TEXT DEFAULT 'medium',
      business_id TEXT,
      assistant_id INTEGER,
      assignee TEXT,
      due_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE SET NULL,
      FOREIGN KEY (assistant_id) REFERENCES assistants(id) ON DELETE SET NULL
    );
  `);

  // Create skills table
  database.exec(`
    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      content TEXT,
      file_path TEXT,
      enabled INTEGER DEFAULT 1,
      assistant_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assistant_id) REFERENCES assistants(id) ON DELETE SET NULL
    );
  `);

  // Create plugins table
  database.exec(`
    CREATE TABLE IF NOT EXISTS plugins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      content TEXT,
      file_path TEXT,
      enabled INTEGER DEFAULT 1,
      assistant_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assistant_id) REFERENCES assistants(id) ON DELETE SET NULL
    );
  `);

  // Create tools table
  database.exec(`
    CREATE TABLE IF NOT EXISTS tools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      content TEXT,
      file_path TEXT,
      enabled INTEGER DEFAULT 1,
      assistant_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assistant_id) REFERENCES assistants(id) ON DELETE SET NULL
    );
  `);

  // Create commands table
  database.exec(`
    CREATE TABLE IF NOT EXISTS commands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      content TEXT,
      file_path TEXT,
      enabled INTEGER DEFAULT 1,
      assistant_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assistant_id) REFERENCES assistants(id) ON DELETE SET NULL
    );
  `);

  // Create cron_jobs table
  database.exec(`
    CREATE TABLE IF NOT EXISTS cron_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      cron_expression TEXT NOT NULL,
      command TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      assistant_id INTEGER,
      last_run DATETIME,
      next_run DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assistant_id) REFERENCES assistants(id) ON DELETE SET NULL
    );
  `);
  
  seedAuditLogs();
}

export type Credential = {
  id: number;
  assistant_id: string;
  type: string;
  name: string;
  encrypted_value: Buffer;
  created_at: string;
  updated_at: string;
};

export type Assistant = {
  id: number;
  business_id: string;
  name: string;
  channel: string;
  channels: string | null;
  role: string | null;
  status: string;
  container_id: string | null;
  created_at: string;
  updated_at: string;
};

export function getAllAssistants(status?: string): Assistant[] {
  const db = getDb();
  if (status && status !== "all") {
    if (status === "active") {
      return db.prepare("SELECT * FROM assistants WHERE status = 'running' ORDER BY name").all() as Assistant[];
    } else if (status === "inactive") {
      return db.prepare("SELECT * FROM assistants WHERE status = 'stopped' ORDER BY name").all() as Assistant[];
    }
  }
  return db.prepare("SELECT * FROM assistants ORDER BY name").all() as Assistant[];
}

export type Business = {
  id: string;
  name: string;
  prefix: string;
  industry: string | null;
  description: string | null;
  timezone: string;
  status: string;
  business_type: string | null;
  created_at: string;
  updated_at: string;
};

export function getAllBusinesses(): Business[] {
  const db = getDb();
  return db.prepare("SELECT * FROM businesses ORDER BY created_at DESC").all() as Business[];
}

export function getBusinessById(id: number): Business | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM businesses WHERE id = ?").get(id) as Business | undefined;
}

export function createBusiness(data: {
  name: string;
  prefix: string;
  industry?: string;
  description?: string;
  timezone?: string;
}): Business {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO businesses (name, prefix, industry, description, timezone)
    VALUES (?, ?, ?, ?, ?)
  `).run(data.name, data.prefix, data.industry || null, data.description || null, data.timezone || 'UTC');
  return db.prepare("SELECT * FROM businesses WHERE id = ?").get(result.lastInsertRowid) as Business;
}

export function updateBusiness(id: number, data: Partial<Omit<Business, "id" | "created_at" | "updated_at">>): boolean {
  const db = getDb();
  const fields = Object.keys(data).map(k => `${k} = @${k}`).join(", ");
  if (!fields) return false;
  const result = db.prepare(`UPDATE businesses SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = @id`).run({ ...data, id });
  return result.changes > 0;
}

export function deleteBusiness(id: number): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM businesses WHERE id = ?").run(id);
  return result.changes > 0;
}

// Alias for getAllAssistants
export function getAssistants(businessId?: number): Assistant[] {
  if (businessId) {
    const db = getDb();
    return db.prepare("SELECT * FROM assistants WHERE business_id = ? ORDER BY name").all(businessId) as Assistant[];
  }
  return getAllAssistants();
}

export function getAssistant(id: number): Assistant | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM assistants WHERE id = ?").get(id) as Assistant | undefined;
}

export type Channel = "telegram" | "slack" | "discord" | "signal";
export type AssistantStatus = "active" | "inactive" | "running" | "stopped" | "error";

export function createAssistant(data: {
  name: string;
  business_id: string | number;
  channel: Channel;
  role?: string;
  channels?: string[];
}): Assistant {
  const db = getDb();
  const channelsJson = data.channels ? JSON.stringify(data.channels) : null;
  const result = db.prepare(`
    INSERT INTO assistants (name, business_id, channel, role, channels)
    VALUES (?, ?, ?, ?, ?)
  `).run(data.name, String(data.business_id), data.channel, data.role || null, channelsJson);
  return db.prepare("SELECT * FROM assistants WHERE id = ?").get(result.lastInsertRowid) as Assistant;
}

export function deleteAssistant(id: number): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM assistants WHERE id = ?").run(id);
  return result.changes > 0;
}

export function updateAssistant(id: number, data: Partial<{
  name: string;
  channel: Channel;
  role: string;
  status: AssistantStatus;
  container_id: string;
}>): Assistant | undefined {
  const db = getDb();
  const updates: string[] = [];
  const params: any[] = [];

  if (data.name !== undefined) {
    updates.push("name = ?");
    params.push(data.name);
  }
  if (data.channel !== undefined) {
    updates.push("channel = ?");
    params.push(data.channel);
  }
  if (data.role !== undefined) {
    updates.push("role = ?");
    params.push(data.role);
  }
  if (data.status !== undefined) {
    updates.push("status = ?");
    params.push(data.status);
  }
  if (data.container_id !== undefined) {
    updates.push("container_id = ?");
    params.push(data.container_id);
  }

  if (updates.length === 0) {
    return db.prepare("SELECT * FROM assistants WHERE id = ?").get(id) as Assistant | undefined;
  }

  updates.push("updated_at = ?");
  params.push(new Date().toISOString());
  params.push(id);

  db.prepare(`UPDATE assistants SET ${updates.join(", ")} WHERE id = ?`).run(...params);
  return db.prepare("SELECT * FROM assistants WHERE id = ?").get(id) as Assistant | undefined;
}

export function getCredentials(): (Omit<Credential, "encrypted_value"> & { masked_value: string })[] {
  const db = getDb();
  const credentials = db.prepare(`
    SELECT id, assistant_id, type, name, created_at, updated_at 
    FROM credentials 
    ORDER BY created_at DESC
  `).all() as Omit<Credential, "encrypted_value">[];

  return credentials.map((cred) => ({
    ...cred,
    masked_value: "****",
  }));
}

export function getCredentialById(id: number): Credential | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM credentials WHERE id = ?").get(id) as Credential | undefined;
}

export function getCredentialsByAssistantId(assistantId: number): Credential[] {
  const db = getDb();
  return db.prepare("SELECT * FROM credentials WHERE assistant_id = ?").all(assistantId) as Credential[];
}

export function addCredential(
  assistantId: number,
  type: string,
  name: string,
  encryptedValue: Buffer
): Credential {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO credentials (assistant_id, type, name, encrypted_value)
    VALUES (?, ?, ?, ?)
  `).run(assistantId, type, name, encryptedValue);

  return db.prepare("SELECT * FROM credentials WHERE id = ?").get(result.lastInsertRowid) as Credential;
}

export function deleteCredential(id: number): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM credentials WHERE id = ?").run(id);
  return result.changes > 0;
}

export function updateCredential(
  id: number,
  updates: { assistant_id?: number; type?: string; name?: string; value?: Buffer }
): Credential | undefined {
  const db = getDb();
  const cred = db.prepare("SELECT * FROM credentials WHERE id = ?").get(id) as Credential | undefined;
  if (!cred) return undefined;

  const fields: string[] = [];
  const params: (string | number | Buffer)[] = [];

  if (updates.assistant_id !== undefined) {
    fields.push("assistant_id = ?");
    params.push(updates.assistant_id);
  }
  if (updates.type !== undefined) {
    fields.push("type = ?");
    params.push(updates.type);
  }
  if (updates.name !== undefined) {
    fields.push("name = ?");
    params.push(updates.name);
  }
  if (updates.value !== undefined) {
    fields.push("encrypted_value = ?");
    params.push(updates.value);
  }

  if (fields.length === 0) return cred;

  fields.push("updated_at = ?");
  params.push(new Date().toISOString());
  params.push(id);

  db.prepare(`UPDATE credentials SET ${fields.join(", ")} WHERE id = ?`).run(...params);
  return db.prepare("SELECT * FROM credentials WHERE id = ?").get(id) as Credential | undefined;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  business: string | null;
  assistant: string | null;
  event_type: string;
  severity: string;
  message: string;
  metadata: string | null;
  stack_trace: string | null;
}

export interface AuditLogFilters {
  startDate?: string;
  endDate?: string;
  eventType?: string;
  severity?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function getAuditLogs(filters: AuditLogFilters = {}) {
  const { startDate, endDate, eventType, severity, search, page = 1, limit = 50 } = filters;
  
  const conditions: string[] = [];
  const params: Record<string, unknown> = {};

  if (startDate) {
    conditions.push('timestamp >= @startDate');
    params.startDate = startDate;
  }
  if (endDate) {
    conditions.push('timestamp <= @endDate');
    params.endDate = endDate;
  }
  if (eventType) {
    conditions.push('event_type = @eventType');
    params.eventType = eventType;
  }
  if (severity) {
    conditions.push('severity = @severity');
    params.severity = severity;
  }
  if (search) {
    conditions.push('message LIKE @search');
    params.search = `%${search}%`;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const countStmt = getDb().prepare(`SELECT COUNT(*) as total FROM audit_logs ${whereClause}`);
  const totalResult = countStmt.get(params) as { total: number };
  const total = totalResult.total;

  const stmt = getDb().prepare(`
    SELECT * FROM audit_logs 
    ${whereClause} 
    ORDER BY timestamp DESC 
    LIMIT @limit OFFSET @offset
  `);
  
  const logs = stmt.all({ ...params, limit, offset }) as AuditLog[];

  return {
    logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export function getAuditLogById(id: number) {
  const stmt = getDb().prepare('SELECT * FROM audit_logs WHERE id = ?');
  return stmt.get(id) as AuditLog | undefined;
}

export function getEventTypes(): string[] {
  const stmt = getDb().prepare('SELECT DISTINCT event_type FROM audit_logs ORDER BY event_type');
  const results = stmt.all() as { event_type: string }[];
  return results.map(r => r.event_type);
}

function seedAuditLogs() {
  const db = getDb();
  const existing = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get() as { count: number };
  if (existing.count > 0) return;

  const events = [
    { event_type: 'task_created', severity: 'info' },
    { event_type: 'task_completed', severity: 'info' },
    { event_type: 'task_failed', severity: 'error' },
    { event_type: 'assistant_started', severity: 'info' },
    { event_type: 'assistant_stopped', severity: 'warning' },
    { event_type: 'business_registered', severity: 'info' },
    { event_type: 'docker_container_started', severity: 'info' },
    { event_type: 'docker_container_stopped', severity: 'warning' },
    { event_type: 'api_error', severity: 'error' },
    { event_type: 'system_warning', severity: 'warning' },
  ];

  const businesses = ['Acme Corp', 'TechStart', 'GlobalTrade', 'DataFlow Inc', 'CloudNine'];
  const assistants = ['Claude', 'GPT-4', 'Gemini', 'Llama', null];

  const insert = db.prepare(`
    INSERT INTO audit_logs (timestamp, business, assistant, event_type, severity, message, metadata, stack_trace)
    VALUES (@timestamp, @business, @assistant, @event_type, @severity, @message, @metadata, @stack_trace)
  `);

  const insertMany = db.transaction(() => {
    for (let i = 0; i < 150; i++) {
      const event = events[Math.floor(Math.random() * events.length)];
      const business = businesses[Math.floor(Math.random() * businesses.length)];
      const assistant = assistants[Math.floor(Math.random() * assistants.length)];
      
      const daysAgo = Math.floor(Math.random() * 30);
      const hoursAgo = Math.floor(Math.random() * 24);
      const timestamp = new Date();
      timestamp.setDate(timestamp.getDate() - daysAgo);
      timestamp.setHours(timestamp.getHours() - hoursAgo);

      let message = '';
      let metadata = null;
      let stack_trace = null;

      switch (event.event_type) {
        case 'task_created':
          message = `Task ${Math.random().toString(36).substring(7)} created for ${business}`;
          break;
        case 'task_completed':
          message = `Task completed successfully for ${business}`;
          break;
        case 'task_failed':
          message = `Task failed for ${business} - operation timeout`;
          stack_trace = `Error: TimeoutError: Operation timed out after 30s\n    at TaskRunner.run (task-runner.ts:45)\n    at async Promise.all (index:1)`;
          break;
        case 'assistant_started':
          message = `${assistant} assistant started for ${business}`;
          break;
        case 'assistant_stopped':
          message = `${assistant} assistant stopped - user requested`;
          break;
        case 'business_registered':
          message = `New business registered: ${business}`;
          metadata = JSON.stringify({ registration_id: `REG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`, plan: 'enterprise' });
          break;
        case 'docker_container_started':
          message = `Docker container started: app_${Math.random().toString(36).substring(7)}`;
          metadata = JSON.stringify({ container_id: Math.random().toString(36).substring(2, 17), image: 'nginx:latest' });
          break;
        case 'docker_container_stopped':
          message = `Docker container stopped: app_${Math.random().toString(36).substring(7)}`;
          break;
        case 'api_error':
          message = `API request failed: Invalid authentication token`;
          stack_trace = `Error: AuthenticationError: Invalid token\n    at AuthMiddleware.verify (auth.ts:120)\n    at async Promise.all (index:0)`;
          break;
        case 'system_warning':
          message = `System resource usage above threshold: CPU at 85%`;
          break;
        default:
          message = `Event logged for ${business}`;
      }

      insert.run({
        timestamp: timestamp.toISOString(),
        business,
        assistant,
        event_type: event.event_type,
        severity: event.severity,
        message,
        metadata,
        stack_trace,
      });
    }
  });

  insertMany();
}

export interface UsageOverview {
  totalBusinesses: number;
  totalAssistants: number;
  activeAssistants: number;
  totalRuns: number;
}

export function getUsageOverview(): UsageOverview {
  const db = getDb();
  
  const businesses = db.prepare("SELECT COUNT(*) as count FROM businesses").get() as { count: number };
  const assistants = db.prepare("SELECT COUNT(*) as count FROM assistants").get() as { count: number };
  const activeAssistants = db.prepare("SELECT COUNT(*) as count FROM assistants WHERE status = 'running'").get() as { count: number };
  const totalRuns = db.prepare("SELECT COUNT(*) as count FROM audit_logs WHERE event_type = 'run'").get() as { count: number };
  
  return {
    totalBusinesses: businesses.count,
    totalAssistants: assistants.count,
    activeAssistants: activeAssistants.count,
    totalRuns: totalRuns.count,
  };
}

export interface AssistantUsage {
  assistantId: number;
  assistantName: string;
  businessName: string;
  runCount: number;
  lastRun: string | null;
}

export function getAssistantUsage(limit: number = 10): AssistantUsage[] {
  const db = getDb();
  
  return db.prepare(`
    SELECT 
      a.id as assistantId,
      a.name as assistantName,
      b.name as businessName,
      COUNT(al.id) as runCount,
      MAX(al.timestamp) as lastRun
    FROM assistants a
    JOIN businesses b ON a.business_id = b.id
    LEFT JOIN audit_logs al ON al.assistant = a.name
    GROUP BY a.id
    ORDER BY runCount DESC
    LIMIT ?
  `).all(limit) as AssistantUsage[];
}

export interface DailyUsage {
  date: string;
  runs: number;
}

export function getDailyUsage(days: number = 30): DailyUsage[] {
  const db = getDb();
  
  return db.prepare(`
    SELECT 
      DATE(timestamp) as date,
      COUNT(*) as runs
    FROM audit_logs
    WHERE timestamp >= datetime('now', '-' || ? || ' days')
    GROUP BY DATE(timestamp)
    ORDER BY date DESC
  `).all(days) as DailyUsage[];
}

export interface ModelDistribution {
  model: string;
  count: number;
}

export function getModelDistribution(): ModelDistribution[] {
  const db = getDb();
  
  const results = db.prepare(`
    SELECT metadata->>'model' as model, COUNT(*) as count
    FROM audit_logs
    WHERE metadata->>'model' IS NOT NULL
    GROUP BY metadata->>'model'
    ORDER BY count DESC
  `).all() as { model: string; count: number }[];
  
  return results.map(r => ({ model: r.model || 'unknown', count: r.count }));
}

export interface ScheduledTask {
  id: number;
  assistant_id: number;
  name: string;
  cron: string;
  enabled: boolean;
  last_run: string | null;
  next_run: string | null;
}

export function getAllScheduledTasks(): ScheduledTask[] {
  return [];
}

export interface CronJob {
  id: number;
  name: string;
  description: string | null;
  cron_expression: string;
  command: string;
  enabled: boolean;
  assistant_id: number | null;
  last_run: string | null;
  next_run: string | null;
  created_at: string;
  updated_at: string;
}

export interface CronJobWithAssistant extends CronJob {
  assistant_name: string | null;
}

export function getCronJobs(): CronJobWithAssistant[] {
  const db = getDb();
  const jobs = db.prepare(`
    SELECT cj.*, a.name as assistant_name
    FROM cron_jobs cj
    LEFT JOIN assistants a ON cj.assistant_id = a.id
    ORDER BY cj.created_at DESC
  `).all() as CronJobWithAssistant[];
  
  return jobs.map(job => ({
    ...job,
    enabled: Boolean(job.enabled),
  }));
}

export function getCronJobById(id: number): CronJob | undefined {
  const db = getDb();
  const job = db.prepare("SELECT * FROM cron_jobs WHERE id = ?").get(id) as CronJob | undefined;
  if (job) {
    job.enabled = Boolean(job.enabled);
  }
  return job;
}

export function addCronJob(
  name: string,
  description: string | null,
  cronExpression: string,
  command: string,
  assistantId: number | null
): CronJob {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO cron_jobs (name, description, cron_expression, command, assistant_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, description, cronExpression, command, assistantId);

  return db.prepare("SELECT * FROM cron_jobs WHERE id = ?").get(result.lastInsertRowid) as CronJob;
}

export function updateCronJob(
  id: number,
  updates: {
    name?: string;
    description?: string | null;
    cron_expression?: string;
    command?: string;
    enabled?: boolean;
    assistant_id?: number | null;
    last_run?: string | null;
    next_run?: string | null;
  }
): CronJob | undefined {
  const db = getDb();
  const job = db.prepare("SELECT * FROM cron_jobs WHERE id = ?").get(id) as CronJob | undefined;
  if (!job) return undefined;

  const fields: string[] = [];
  const params: (string | number | null)[] = [];

  if (updates.name !== undefined) {
    fields.push("name = ?");
    params.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push("description = ?");
    params.push(updates.description);
  }
  if (updates.cron_expression !== undefined) {
    fields.push("cron_expression = ?");
    params.push(updates.cron_expression);
  }
  if (updates.command !== undefined) {
    fields.push("command = ?");
    params.push(updates.command);
  }
  if (updates.enabled !== undefined) {
    fields.push("enabled = ?");
    params.push(updates.enabled ? 1 : 0);
  }
  if (updates.assistant_id !== undefined) {
    fields.push("assistant_id = ?");
    params.push(updates.assistant_id);
  }
  if (updates.last_run !== undefined) {
    fields.push("last_run = ?");
    params.push(updates.last_run);
  }
  if (updates.next_run !== undefined) {
    fields.push("next_run = ?");
    params.push(updates.next_run);
  }

  if (fields.length === 0) return { ...job, enabled: Boolean(job.enabled) };

  fields.push("updated_at = ?");
  params.push(new Date().toISOString());
  params.push(id);

  db.prepare(`UPDATE cron_jobs SET ${fields.join(", ")} WHERE id = ?`).run(...params);
  const updated = db.prepare("SELECT * FROM cron_jobs WHERE id = ?").get(id) as CronJob;
  return { ...updated, enabled: Boolean(updated.enabled) };
}

export function deleteCronJob(id: number): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM cron_jobs WHERE id = ?").run(id);
  return result.changes > 0;
}

export interface Skill {
  id: number;
  name: string;
  description: string | null;
  type: string;
  content: string | null;
  file_path: string | null;
  enabled: boolean;
  assistant_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface SkillWithAssistant extends Skill {
  assistant_name: string | null;
}

export function getSkills(assistantId?: number): SkillWithAssistant[] {
  const db = getDb();
  let query = `
    SELECT s.*, a.name as assistant_name
    FROM skills s
    LEFT JOIN assistants a ON s.assistant_id = a.id
  `;
  if (assistantId) {
    query += ` WHERE s.assistant_id = ?`;
  }
  query += ` ORDER BY s.created_at DESC`;
  
  const stmt = assistantId 
    ? db.prepare(query).bind(assistantId) 
    : db.prepare(query);
  const skills = stmt.all() as (Skill & { assistant_name: string | null })[];
  
  return skills.map(s => ({ ...s, enabled: Boolean(s.enabled) }));
}

export function addSkill(name: string, description: string | null, type: string, content: string | null, filePath: string | null, assistantId: number | null): Skill {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO skills (name, description, type, content, file_path, assistant_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, description, type, content, filePath, assistantId);
  return db.prepare("SELECT * FROM skills WHERE id = ?").get(result.lastInsertRowid) as Skill;
}

export function deleteSkill(id: number): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM skills WHERE id = ?").run(id);
  return result.changes > 0;
}

export interface Plugin {
  id: number;
  name: string;
  description: string | null;
  type: string;
  content: string | null;
  file_path: string | null;
  enabled: boolean;
  assistant_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface PluginWithAssistant extends Plugin {
  assistant_name: string | null;
}

export function getPlugins(assistantId?: number): PluginWithAssistant[] {
  const db = getDb();
  let query = `
    SELECT p.*, a.name as assistant_name
    FROM plugins p
    LEFT JOIN assistants a ON p.assistant_id = a.id
  `;
  if (assistantId) {
    query += ` WHERE p.assistant_id = ?`;
  }
  query += ` ORDER BY p.created_at DESC`;
  
  const stmt = assistantId 
    ? db.prepare(query).bind(assistantId) 
    : db.prepare(query);
  const plugins = stmt.all() as (Plugin & { assistant_name: string | null })[];
  
  return plugins.map(p => ({ ...p, enabled: Boolean(p.enabled) }));
}

export function addPlugin(name: string, description: string | null, type: string, content: string | null, filePath: string | null, assistantId: number | null): Plugin {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO plugins (name, description, type, content, file_path, assistant_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, description, type, content, filePath, assistantId);
  return db.prepare("SELECT * FROM plugins WHERE id = ?").get(result.lastInsertRowid) as Plugin;
}

export function deletePlugin(id: number): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM plugins WHERE id = ?").run(id);
  return result.changes > 0;
}

export interface Tool {
  id: number;
  name: string;
  description: string | null;
  type: string;
  content: string | null;
  file_path: string | null;
  enabled: boolean;
  assistant_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface ToolWithAssistant extends Tool {
  assistant_name: string | null;
}

export function getTools(assistantId?: number): ToolWithAssistant[] {
  const db = getDb();
  let query = `
    SELECT t.*, a.name as assistant_name
    FROM tools t
    LEFT JOIN assistants a ON t.assistant_id = a.id
  `;
  if (assistantId) {
    query += ` WHERE t.assistant_id = ?`;
  }
  query += ` ORDER BY t.created_at DESC`;
  
  const stmt = assistantId 
    ? db.prepare(query).bind(assistantId) 
    : db.prepare(query);
  const tools = stmt.all() as (Tool & { assistant_name: string | null })[];
  
  return tools.map(t => ({ ...t, enabled: Boolean(t.enabled) }));
}

export function addTool(name: string, description: string | null, type: string, content: string | null, filePath: string | null, assistantId: number | null): Tool {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO tools (name, description, type, content, file_path, assistant_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, description, type, content, filePath, assistantId);
  return db.prepare("SELECT * FROM tools WHERE id = ?").get(result.lastInsertRowid) as Tool;
}

export function deleteTool(id: number): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM tools WHERE id = ?").run(id);
  return result.changes > 0;
}

export interface Command {
  id: number;
  name: string;
  description: string | null;
  type: string;
  content: string | null;
  file_path: string | null;
  enabled: boolean;
  assistant_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface CommandWithAssistant extends Command {
  assistant_name: string | null;
}

export function getCommands(assistantId?: number): CommandWithAssistant[] {
  const db = getDb();
  let query = `
    SELECT c.*, a.name as assistant_name
    FROM commands c
    LEFT JOIN assistants a ON c.assistant_id = a.id
  `;
  if (assistantId) {
    query += ` WHERE c.assistant_id = ?`;
  }
  query += ` ORDER BY c.created_at DESC`;
  
  const stmt = assistantId 
    ? db.prepare(query).bind(assistantId) 
    : db.prepare(query);
  const commands = stmt.all() as (Command & { assistant_name: string | null })[];
  
  return commands.map(c => ({ ...c, enabled: Boolean(c.enabled) }));
}

export function addCommand(name: string, description: string | null, type: string, content: string | null, filePath: string | null, assistantId: number | null): Command {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO commands (name, description, type, content, file_path, assistant_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, description, type, content, filePath, assistantId);
  return db.prepare("SELECT * FROM commands WHERE id = ?").get(result.lastInsertRowid) as Command;
}

export function deleteCommand(id: number): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM commands WHERE id = ?").run(id);
  return result.changes > 0;
}

export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  business_id: string | null;
  assistant_id: number | null;
  assignee: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskWithDetails extends Task {
  business_name?: string;
  assistant_name?: string;
}

export function getAllTasks(): TaskWithDetails[] {
  const db = getDb();
  const tasks = db.prepare(`
    SELECT t.*, b.name as business_name, a.name as assistant_name
    FROM tasks t
    LEFT JOIN businesses b ON t.business_id = b.id
    LEFT JOIN assistants a ON t.assistant_id = a.id
    ORDER BY 
      CASE t.status 
        WHEN 'todo' THEN 1 
        WHEN 'in_progress' THEN 2 
        WHEN 'review' THEN 3 
        WHEN 'done' THEN 4 
      END,
      CASE t.priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END,
      t.created_at DESC
  `).all() as TaskWithDetails[];
  return tasks;
}

export function getTasksByStatus(status: TaskStatus): TaskWithDetails[] {
  const db = getDb();
  return db.prepare(`
    SELECT t.*, b.name as business_name, a.name as assistant_name
    FROM tasks t
    LEFT JOIN businesses b ON t.business_id = b.id
    LEFT JOIN assistants a ON t.assistant_id = a.id
    WHERE t.status = ?
    ORDER BY 
      CASE t.priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END,
      t.created_at DESC
  `).all(status) as TaskWithDetails[];
}

export function createTask(data: {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  business_id?: string;
  assistant_id?: number;
  assignee?: string;
  due_date?: string;
}): Task {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO tasks (title, description, status, priority, business_id, assistant_id, assignee, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.title,
    data.description || null,
    data.status || "todo",
    data.priority || "medium",
    data.business_id || null,
    data.assistant_id || null,
    data.assignee || null,
    data.due_date || null
  );
  return db.prepare("SELECT * FROM tasks WHERE id = ?").get(result.lastInsertRowid) as Task;
}

export function updateTask(id: number, data: Partial<{
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  business_id: string;
  assistant_id: number;
  assignee: string;
  due_date: string;
}>): Task | undefined {
  const db = getDb();
  const updates: string[] = [];
  const params: any[] = [];

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      updates.push(`${key} = ?`);
      params.push(value);
    }
  });

  if (updates.length === 0) {
    return db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as Task | undefined;
  }

  updates.push("updated_at = ?");
  params.push(new Date().toISOString());
  params.push(id);

  db.prepare(`UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`).run(...params);
  return db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as Task;
}

export function deleteTask(id: number): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  return result.changes > 0;
}

export interface ChatSession {
  id: number;
  assistant_id: number;
  user_id: string;
  started_at: string;
  last_message_at: string;
}

export interface ChatMessage {
  id: number;
  session_id: number;
  role: string;
  content: string;
  timestamp: string;
}

export function getChatSessions(): ChatSession[] {
  const db = getDb();
  return db.prepare(`
    SELECT id, assistant_id, user_id, started_at, last_message_at
    FROM chat_sessions
    ORDER BY last_message_at DESC
    LIMIT 50
  `).all() as ChatSession[];
}

export function getChatMessages(sessionId: number): ChatMessage[] {
  const db = getDb();
  return db.prepare(`
    SELECT id, session_id, role, content, timestamp
    FROM chat_messages
    WHERE session_id = ?
    ORDER BY timestamp ASC
  `).all(sessionId) as ChatMessage[];
}

export function getScheduledTaskById(id: number): ScheduledTask | undefined {
  const tasks = getAllScheduledTasks();
  return tasks.find(t => t.id === id);
}

export function toggleScheduledTask(id: number, enabled: boolean): ScheduledTask | undefined {
  return getScheduledTaskById(id);
}
