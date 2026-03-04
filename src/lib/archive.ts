// src/lib/archive.ts
import Database from "better-sqlite3";
import { getDb } from "./db";
import fs from "fs";
import path from "path";

export interface AssistantArchive {
  id: number;
  originalAssistantId: number | null;
  originalContainerName: string;
  businessPrefix: string;
  assistantName: string;
  volumePath: string;
  archivePath: string;
  archivedAt: string;
  expiresAt: string;
  permanentlyDeleted: boolean;
  deletedAt: string | null;
}

const ARCHIVE_RETENTION_DAYS = 90;

// Archive assistant volume when deleted
export function archiveAssistantVolume(
  assistantId: number,
  containerName: string,
  volumePath: string
): AssistantArchive | null {
  const db = getDb();

  // Parse container name (format: XXX-name)
  const parts = containerName.split("-");
  if (parts.length < 2) {
    throw new Error("Invalid container name format");
  }

  const businessPrefix = parts[0];
  const assistantName = parts.slice(1).join("-");

  // Create archive path
  const archiveDir = path.join(
    process.env.ASSISTANTS_DATA_PATH || "/opt/data/crewclaw-assistants",
    ".archive"
  );
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const archiveName = `${containerName}-${timestamp}`;
  const archivePath = path.join(archiveDir, archiveName);

  // Create archive directory if not exists
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }

  // Move volume to archive
  if (fs.existsSync(volumePath)) {
    fs.renameSync(volumePath, archivePath);
  }

  // Calculate expiration date (90 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ARCHIVE_RETENTION_DAYS);

  // Insert archive record
  const result = db
    .prepare(
      `
    INSERT INTO assistant_archives (
      original_assistant_id, original_container_name, business_prefix, 
      assistant_name, volume_path, archive_path, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `
    )
    .run(
      assistantId,
      containerName,
      businessPrefix,
      assistantName,
      volumePath,
      archivePath,
      expiresAt.toISOString()
    );

  return getArchiveById(result.lastInsertRowid as number);
}

// Get archive by ID
export function getArchiveById(id: number): AssistantArchive | null {
  const db = getDb();

  const row = db
    .prepare("SELECT * FROM assistant_archives WHERE id = ?")
    .get(id) as any;

  if (!row) return null;

  return {
    id: row.id,
    originalAssistantId: row.original_assistant_id,
    originalContainerName: row.original_container_name,
    businessPrefix: row.business_prefix,
    assistantName: row.assistant_name,
    volumePath: row.volume_path,
    archivePath: row.archive_path,
    archivedAt: row.archived_at,
    expiresAt: row.expires_at,
    permanentlyDeleted: Boolean(row.permanently_deleted),
    deletedAt: row.deleted_at,
  };
}

// Get all archives (with optional filters)
export function getArchives(
  options: {
    businessPrefix?: string;
    includeDeleted?: boolean;
    expiredOnly?: boolean;
  } = {}
): AssistantArchive[] {
  const db = getDb();

  let query = "SELECT * FROM assistant_archives WHERE 1=1";
  const params: any[] = [];

  if (options.businessPrefix) {
    query += " AND business_prefix = ?";
    params.push(options.businessPrefix);
  }

  if (!options.includeDeleted) {
    query += " AND permanently_deleted = 0";
  }

  if (options.expiredOnly) {
    query += " AND expires_at < CURRENT_TIMESTAMP";
  }

  query += " ORDER BY archived_at DESC";

  const rows = db.prepare(query).all(...params) as any[];

  return rows.map((row) => ({
    id: row.id,
    originalAssistantId: row.original_assistant_id,
    originalContainerName: row.original_container_name,
    businessPrefix: row.business_prefix,
    assistantName: row.assistant_name,
    volumePath: row.volume_path,
    archivePath: row.archive_path,
    archivedAt: row.archived_at,
    expiresAt: row.expires_at,
    permanentlyDeleted: Boolean(row.permanently_deleted),
    deletedAt: row.deleted_at,
  }));
}

// Permanently delete archived volume
export function permanentlyDeleteArchive(id: number): boolean {
  const db = getDb();

  const archive = getArchiveById(id);
  if (!archive) return false;

  // Delete physical files
  if (fs.existsSync(archive.archivePath)) {
    fs.rmSync(archive.archivePath, { recursive: true, force: true });
  }

  // Update database
  const result = db
    .prepare(
      `
    UPDATE assistant_archives 
    SET permanently_deleted = 1, deleted_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `
    )
    .run(id);

  return result.changes > 0;
}

// Restore archived volume
export function restoreArchive(id: number): boolean {
  const db = getDb();

  const archive = getArchiveById(id);
  if (!archive || archive.permanentlyDeleted) return false;

  // Check if original path exists
  if (fs.existsSync(archive.volumePath)) {
    throw new Error("Volume path already exists, cannot restore");
  }

  // Move archive back to original location
  if (fs.existsSync(archive.archivePath)) {
    fs.renameSync(archive.archivePath, archive.volumePath);
  }

  // Update database (mark as restored by deleting the record)
  db.prepare("DELETE FROM assistant_archives WHERE id = ?").run(id);

  return true;
}

// Clean up expired archives (cron job)
export function cleanupExpiredArchives(): number {
  const db = getDb();

  // Get all expired archives
  const expired = getArchives({ expiredOnly: true });

  let deletedCount = 0;

  for (const archive of expired) {
    if (permanentlyDeleteArchive(archive.id)) {
      deletedCount++;
    }
  }

  return deletedCount;
}

// Get archive statistics
export function getArchiveStats(): {
  total: number;
  active: number;
  deleted: number;
  expired: number;
  totalSize: number;
} {
  const db = getDb();

  const stats = db
    .prepare(
      `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN permanently_deleted = 0 THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN permanently_deleted = 1 THEN 1 ELSE 0 END) as deleted,
      SUM(CASE WHEN expires_at < CURRENT_TIMESTAMP AND permanently_deleted = 0 THEN 1 ELSE 0 END) as expired
    FROM assistant_archives
  `
    )
    .get() as any;

  // Calculate total size (this is expensive, do sparingly)
  let totalSize = 0;
  const archives = getArchives();
  for (const archive of archives) {
    if (!archive.permanentlyDeleted && fs.existsSync(archive.archivePath)) {
      try {
        const stats = fs.statSync(archive.archivePath);
        if (stats.isDirectory()) {
          // Rough estimation for directories
          totalSize += stats.size;
        } else {
          totalSize += stats.size;
        }
      } catch (e) {
        // Ignore errors
      }
    }
  }

  return {
    total: stats.total,
    active: stats.active,
    deleted: stats.deleted,
    expired: stats.expired,
    totalSize,
  };
}

// Check if volume exists in archive
export function isVolumeArchived(containerName: string): AssistantArchive | null {
  const db = getDb();

  const row = db
    .prepare(
      `
    SELECT * FROM assistant_archives 
    WHERE original_container_name = ? AND permanently_deleted = 0
    ORDER BY archived_at DESC
    LIMIT 1
  `
    )
    .get(containerName) as any;

  if (!row) return null;

  return {
    id: row.id,
    originalAssistantId: row.original_assistant_id,
    originalContainerName: row.original_container_name,
    businessPrefix: row.business_prefix,
    assistantName: row.assistant_name,
    volumePath: row.volume_path,
    archivePath: row.archive_path,
    archivedAt: row.archived_at,
    expiresAt: row.expires_at,
    permanentlyDeleted: Boolean(row.permanently_deleted),
    deletedAt: row.deleted_at,
  };
}
