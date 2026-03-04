-- ============================================================================
-- CrewClaw-UI Database Schema Updates for Network Management
-- Run this SQL to add network configuration and IP assignment tables
-- ============================================================================

-- ============================================================================
-- MACVLAN Network Configuration
-- ============================================================================

CREATE TABLE IF NOT EXISTS network_config (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- Only one config row allowed
    parent_interface TEXT NOT NULL,
    subnet TEXT NOT NULL,
    gateway TEXT NOT NULL,
    ip_range_start TEXT NOT NULL,
    ip_range_end TEXT NOT NULL,
    network_name TEXT NOT NULL DEFAULT 'assistant-network-internal',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger to update timestamp
CREATE TRIGGER IF NOT EXISTS network_config_updated_at 
AFTER UPDATE ON network_config
BEGIN
    UPDATE network_config SET updated_at = CURRENT_TIMESTAMP WHERE id = 1;
END;

-- ============================================================================
-- IP Assignments for Assistant Containers
-- ============================================================================

CREATE TABLE IF NOT EXISTS ip_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assistant_id INTEGER,
    ip_address TEXT NOT NULL UNIQUE,
    mac_address TEXT,
    status TEXT DEFAULT 'available', -- available, assigned, reserved, released
    assigned_at DATETIME,
    released_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assistant_id) REFERENCES assistants(id) ON DELETE SET NULL
);

-- Index for faster IP lookups
CREATE INDEX IF NOT EXISTS idx_ip_status ON ip_assignments(status);
CREATE INDEX IF NOT EXISTS idx_ip_assistant ON ip_assignments(assistant_id);

-- ============================================================================
-- Audit Log Enhancement
-- ============================================================================

-- Add source column to existing audit_logs table if not exists
ALTER TABLE audit_logs ADD COLUMN source TEXT DEFAULT 'ui';

-- Create index for source filtering
CREATE INDEX IF NOT EXISTS idx_audit_source ON audit_logs(source);

-- ============================================================================
-- Initial Network Configuration (Auto-populated by setup.sh)
-- ============================================================================

-- This will be populated by the setup script with detected network settings
-- INSERT INTO network_config (parent_interface, subnet, gateway, ip_range_start, ip_range_end)
-- VALUES ('eth0', '192.168.1.0/24', '192.168.1.1', '192.168.1.100', '192.168.1.200');

-- ============================================================================
-- Helper Functions for IP Management
-- ============================================================================

-- Function to get next available IP (implemented in application layer)
-- This SQL is for reference:
-- SELECT ip_address FROM ip_assignments 
-- WHERE status = 'available' 
-- ORDER BY ip_address 
-- LIMIT 1;

-- Function to release an IP when assistant is deleted
-- UPDATE ip_assignments 
-- SET status = 'released', released_at = CURRENT_TIMESTAMP, assistant_id = NULL
-- WHERE assistant_id = ?;

-- ============================================================================
-- Archive Tracking for Assistant Volumes
-- ============================================================================

CREATE TABLE IF NOT EXISTS assistant_archives (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_assistant_id INTEGER,
    original_container_name TEXT NOT NULL,
    business_prefix TEXT NOT NULL,
    assistant_name TEXT NOT NULL,
    volume_path TEXT NOT NULL,
    archive_path TEXT NOT NULL,
    archived_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME, -- 90 days from archived_at
    permanently_deleted BOOLEAN DEFAULT 0,
    deleted_at DATETIME,
    FOREIGN KEY (original_assistant_id) REFERENCES assistants(id) ON DELETE SET NULL
);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_archive_expires ON assistant_archives(expires_at);
CREATE INDEX IF NOT EXISTS idx_archive_deleted ON assistant_archives(permanently_deleted);

-- ============================================================================
-- Container Operations Log
-- ============================================================================

CREATE TABLE IF NOT EXISTS container_operations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assistant_id INTEGER,
    container_name TEXT NOT NULL,
    operation TEXT NOT NULL, -- create, start, stop, restart, delete
    status TEXT NOT NULL, -- success, failed
    error_message TEXT,
    requested_by TEXT DEFAULT 'system',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assistant_id) REFERENCES assistants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_container_ops_assistant ON container_operations(assistant_id);
CREATE INDEX IF NOT EXISTS idx_container_ops_created ON container_operations(created_at);

-- ============================================================================
-- Sample Data (for testing)
-- ============================================================================

-- Only insert sample data if tables are empty
INSERT INTO network_config (id, parent_interface, subnet, gateway, ip_range_start, ip_range_end)
SELECT 1, 'eth0', '192.168.1.0/24', '192.168.1.1', '192.168.1.100', '192.168.1.200'
WHERE NOT EXISTS (SELECT 1 FROM network_config WHERE id = 1);

-- ============================================================================
-- Migration Complete
-- ============================================================================
