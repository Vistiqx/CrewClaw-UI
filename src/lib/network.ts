// src/lib/network.ts
import Database from "better-sqlite3";
import { getDb } from "./db";

export interface NetworkConfig {
  id: number;
  parentInterface: string;
  subnet: string;
  gateway: string;
  ipRangeStart: string;
  ipRangeEnd: string;
  networkName: string;
  updatedAt: string;
}

export interface IpAssignment {
  id: number;
  assistantId: number | null;
  ipAddress: string;
  macAddress: string | null;
  status: "available" | "assigned" | "reserved" | "released";
  assignedAt: string | null;
  releasedAt: string | null;
  createdAt: string;
}

export interface NetworkStatus {
  total: number;
  available: number;
  assigned: number;
  reserved: number;
  released: number;
}

// Get current network configuration
export function getNetworkConfig(): NetworkConfig | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM network_config WHERE id = 1").get() as any;
  
  if (!row) return null;
  
  return {
    id: row.id,
    parentInterface: row.parent_interface,
    subnet: row.subnet,
    gateway: row.gateway,
    ipRangeStart: row.ip_range_start,
    ipRangeEnd: row.ip_range_end,
    networkName: row.network_name,
    updatedAt: row.updated_at,
  };
}

// Update network configuration
export function updateNetworkConfig(config: Partial<NetworkConfig>): NetworkConfig | null {
  const db = getDb();
  
  const fields: string[] = [];
  const params: any[] = [];
  
  if (config.parentInterface !== undefined) {
    fields.push("parent_interface = ?");
    params.push(config.parentInterface);
  }
  if (config.subnet !== undefined) {
    fields.push("subnet = ?");
    params.push(config.subnet);
  }
  if (config.gateway !== undefined) {
    fields.push("gateway = ?");
    params.push(config.gateway);
  }
  if (config.ipRangeStart !== undefined) {
    fields.push("ip_range_start = ?");
    params.push(config.ipRangeStart);
  }
  if (config.ipRangeEnd !== undefined) {
    fields.push("ip_range_end = ?");
    params.push(config.ipRangeEnd);
  }
  if (config.networkName !== undefined) {
    fields.push("network_name = ?");
    params.push(config.networkName);
  }
  
  if (fields.length === 0) return getNetworkConfig();
  
  params.push(1); // id = 1
  
  db.prepare(`UPDATE network_config SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...params);
  
  return getNetworkConfig();
}

// Initialize network configuration from setup
export function initializeNetworkConfig(config: NetworkConfig): NetworkConfig {
  const db = getDb();
  
  // Check if already exists
  const existing = getNetworkConfig();
  if (existing) {
    return existing;
  }
  
  // Insert new config
  db.prepare(`
    INSERT INTO network_config (id, parent_interface, subnet, gateway, ip_range_start, ip_range_end, network_name)
    VALUES (1, ?, ?, ?, ?, ?, ?)
  `).run(
    config.parentInterface,
    config.subnet,
    config.gateway,
    config.ipRangeStart,
    config.ipRangeEnd,
    config.networkName
  );
  
  // Initialize IP pool
  initializeIpPool(config.ipRangeStart, config.ipRangeEnd);
  
  return getNetworkConfig()!;
}

// Calculate all IPs in range
function calculateIpRange(start: string, end: string): string[] {
  const ips: string[] = [];
  const startParts = start.split(".").map(Number);
  const endParts = end.split(".").map(Number);
  
  for (let i = startParts[3]; i <= endParts[3]; i++) {
    ips.push(`${startParts[0]}.${startParts[1]}.${startParts[2]}.${i}`);
  }
  
  return ips;
}

// Initialize IP pool in database
function initializeIpPool(startIp: string, endIp: string) {
  const db = getDb();
  const ips = calculateIpRange(startIp, endIp);
  
  const insertStmt = db.prepare("INSERT OR IGNORE INTO ip_assignments (ip_address, status) VALUES (?, 'available')");
  
  const insertMany = db.transaction(() => {
    for (const ip of ips) {
      insertStmt.run(ip);
    }
  });
  
  insertMany();
}

// Get next available IP
export function getNextAvailableIp(): string | null {
  const db = getDb();
  
  const row = db.prepare(`
    SELECT ip_address FROM ip_assignments 
    WHERE status = 'available' 
    ORDER BY ip_address 
    LIMIT 1
  `).get() as { ip_address: string } | undefined;
  
  return row?.ip_address || null;
}

// Get all IPs with status
export function getAllIps(): IpAssignment[] {
  const db = getDb();
  
  const rows = db.prepare(`
    SELECT ia.*, a.name as assistant_name, b.name as business_name
    FROM ip_assignments ia
    LEFT JOIN assistants a ON ia.assistant_id = a.id
    LEFT JOIN businesses b ON a.business_id = b.id
    ORDER BY 
      CASE ia.status 
        WHEN 'assigned' THEN 1 
        WHEN 'reserved' THEN 2 
        WHEN 'available' THEN 3 
        WHEN 'released' THEN 4 
      END,
      ia.ip_address
  `).all() as any[];
  
  return rows.map(row => ({
    id: row.id,
    assistantId: row.assistant_id,
    ipAddress: row.ip_address,
    macAddress: row.mac_address,
    status: row.status,
    assignedAt: row.assigned_at,
    releasedAt: row.released_at,
    createdAt: row.created_at,
    assistantName: row.assistant_name,
    businessName: row.business_name,
  }));
}

// Get available IPs
export function getAvailableIps(): string[] {
  const db = getDb();
  
  const rows = db.prepare(`
    SELECT ip_address FROM ip_assignments 
    WHERE status = 'available' 
    ORDER BY ip_address
  `).all() as { ip_address: string }[];
  
  return rows.map(row => row.ip_address);
}

// Get IP status summary
export function getIpStatusSummary(): NetworkStatus {
  const db = getDb();
  
  const result = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
      SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END) as assigned,
      SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) as reserved,
      SUM(CASE WHEN status = 'released' THEN 1 ELSE 0 END) as released
    FROM ip_assignments
  `).get() as any;
  
  return {
    total: result.total,
    available: result.available,
    assigned: result.assigned,
    reserved: result.reserved,
    released: result.released,
  };
}

// Reserve IP for assistant
export function reserveIp(assistantId: number, ipAddress: string): boolean {
  const db = getDb();
  
  const result = db.prepare(`
    UPDATE ip_assignments 
    SET assistant_id = ?, status = 'reserved', assigned_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE ip_address = ? AND status = 'available'
  `).run(assistantId, ipAddress);
  
  return result.changes > 0;
}

// Assign IP to assistant
export function assignIp(assistantId: number, ipAddress: string, macAddress?: string): boolean {
  const db = getDb();
  
  const result = db.prepare(`
    UPDATE ip_assignments 
    SET assistant_id = ?, mac_address = ?, status = 'assigned', assigned_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE ip_address = ? AND (status = 'available' OR status = 'reserved')
  `).run(assistantId, macAddress || null, ipAddress);
  
  return result.changes > 0;
}

// Release IP (when assistant is deleted)
export function releaseIp(assistantId: number): boolean {
  const db = getDb();
  
  const result = db.prepare(`
    UPDATE ip_assignments 
    SET assistant_id = NULL, mac_address = NULL, status = 'released', released_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE assistant_id = ? AND status = 'assigned'
  `).run(assistantId);
  
  return result.changes > 0;
}

// Make released IP available again (cleanup job)
export function makeReleasedAvailable(): number {
  const db = getDb();
  
  const result = db.prepare(`
    UPDATE ip_assignments 
    SET status = 'available', released_at = NULL, assigned_at = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE status = 'released'
  `).run();
  
  return result.changes;
}

// Auto-assign next available IP
export function autoAssignIp(assistantId: number): string | null {
  const ipAddress = getNextAvailableIp();
  if (!ipAddress) return null;
  
  if (assignIp(assistantId, ipAddress)) {
    return ipAddress;
  }
  
  return null;
}

// Check if IP is valid and available
export function isIpAvailable(ipAddress: string): boolean {
  const db = getDb();
  
  const row = db.prepare(`
    SELECT status FROM ip_assignments WHERE ip_address = ?
  `).get(ipAddress) as { status: string } | undefined;
  
  return row?.status === "available";
}

// Validate IP is in configured range
export function isIpInRange(ipAddress: string): boolean {
  const config = getNetworkConfig();
  if (!config) return false;
  
  const ipParts = ipAddress.split(".").map(Number);
  const startParts = config.ipRangeStart.split(".").map(Number);
  const endParts = config.ipRangeEnd.split(".").map(Number);
  
  // Simple comparison for /24 subnet
  if (ipParts[0] !== startParts[0] || ipParts[1] !== startParts[1] || ipParts[2] !== startParts[2]) {
    return false;
  }
  
  return ipParts[3] >= startParts[3] && ipParts[3] <= endParts[3];
}

// Get IP by assistant ID
export function getIpByAssistantId(assistantId: number): IpAssignment | null {
  const db = getDb();
  
  const row = db.prepare(`
    SELECT * FROM ip_assignments WHERE assistant_id = ? AND status = 'assigned'
  `).get(assistantId) as any;
  
  if (!row) return null;
  
  return {
    id: row.id,
    assistantId: row.assistant_id,
    ipAddress: row.ip_address,
    macAddress: row.mac_address,
    status: row.status,
    assignedAt: row.assigned_at,
    releasedAt: row.released_at,
    createdAt: row.created_at,
  };
}
