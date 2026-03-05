# CrewClaw-UI

A secure, production-ready web-based dashboard for managing CrewClaw AI assistants with comprehensive Docker security controls, MACVLAN networking, and automated IP management.

---

## Features

- **Multi-Business Support**: Manage multiple businesses with isolated assistant environments
- **Docker Security**: Authorization plugin enforces strict container policies
- **MACVLAN Networking**: Each assistant gets its own IP address on the host network
- **Automated IP Management**: Dynamic IP pool assignment with conflict detection
- **Volume Archiving**: 90-day retention with restore capabilities
- **Audit Logging**: Comprehensive logging of all Docker operations
- **Real-time Monitoring**: Health checks and container status monitoring

---

## Security Architecture

### Docker Authorization Plugin

CrewClaw-UI includes a custom Docker authorization plugin (`Vistiqx/CrewClaw-AuthZ-Plugin`) that enforces security policies at the Docker API level:

| Security Rule | Enforcement |
|---------------|-------------|
| Container Naming | Must match pattern: `XXX-name` (3-char business prefix + assistant name) |
| Privileged Mode | **DENIED** - All privileged containers rejected |
| Network | Must use `assistant-network-internal` (MACVLAN) |
| Volume Mounts | Only `/opt/data/crewclaw-assistants/` allowed |
| System Paths | `/etc`, `/var`, `/root`, `/home`, etc. blocked |

### Network Isolation

- **MACVLAN Network**: `assistant-network-internal` provides direct network access
- **IP Pool Management**: Dynamic assignment from configured range
- **Auto-Detection**: Network interface and subnet auto-detected during setup

---

## Quick Start

### Prerequisites

| Software | Version | Purpose |
|----------|---------|---------|
| Ubuntu | 20.04+ / Debian 11+ | Operating System |
| Node.js | 20+ | UI Application |
| Docker | Latest | Container Runtime |
| Docker Compose | Latest | Container Orchestration |
| Go | 1.22+ | Building AuthZ Plugin |

### Automated Installation

```bash
# 1. Clone the repository
git clone https://github.com/Vistiqx/CrewClaw-UI.git /opt/scripts/crewclaw-ui

# 2. Run installer (requires sudo)
cd /opt/scripts/crewclaw-ui
sudo bash ./setup.sh

# 3. Follow the on-screen instructions
#    - Read the security warning and type "I UNDERSTAND"
#    - Script will:
#      • Create crewclaw user and groups
#      • Install Docker AuthZ Plugin
#      • Configure MACVLAN network
#      • Setup directory structure
#      • Generate encryption keys
#      • Install dependencies
#      • Configure Docker daemon
#
# Note: Docker daemon will be restarted during installation

# 4. Start CrewClaw-UI
cd /opt/scripts/crewclaw-ui
sudo -u crewclaw npm run dev
```

Then open http://localhost:3000

---

## Directory Structure

```
/opt/
├── scripts/crewclaw-ui/          # Source code
│   ├── src/                      # Next.js application
│   ├── docker-compose.yml        # Docker configuration
│   ├── Dockerfile                # Container definition
│   ├── setup.sh                  # Installation script
│   └── .env                      # Environment variables
│
├── data/crewclaw-ui/             # Application data
│   ├── CrewClaw-UI.db            # SQLite database
│   ├── business-registry.json    # Business configuration
│   ├── network-config.json       # MACVLAN configuration
│   └── .archive/                 # Archived assistant volumes
│
├── data/crewclaw-assistants/     # Assistant container data
│   └── {XXX-assistant-name}/     # One directory per assistant
│       ├── workspace/            # Assistant workspace
│       ├── config/               # Credentials and config
│       └── logs/                 # Application logs
│
└── docker/crewclaw-ui/           # Docker configurations
    ├── docker-compose.yml
    └── Dockerfile
```

---

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `UI_ENCRYPTION_KEY` | Encryption key for credentials (32 hex chars) | Yes |
| `DATA_PATH` | Path to data directory | Auto |
| `DB_PATH` | Path to SQLite database | Auto |
| `ASSISTANTS_DATA_PATH` | Path to assistant volumes | Auto |
| `REGISTRY_PATH` | Path to business registry JSON | Auto |
| `UI_PORT` | Port for web interface (default: 3000) | No |
| `UI_HOST` | Host to bind to (default: 0.0.0.0) | No |
| `LOG_LEVEL` | Log level (debug, info, warn, error) | No |

### Network Configuration

Network settings are configured automatically during setup but can be viewed/modified:

1. Go to **Settings → Network** in the UI
2. View current MACVLAN configuration
3. See IP pool usage and availability
4. Monitor security enforcement status

The MACVLAN network provides:
- Direct network access for assistants
- IP range: Auto-detected from host subnet
- Range: Typically .100-.200 within subnet

---

## Running CrewClaw-UI

### Development Mode (Node.js)

```bash
cd /opt/scripts/crewclaw-ui
sudo -u crewclaw npm run dev
```

### Production Mode (Docker)

```bash
cd /opt/docker/crewclaw-ui
sudo -u crewclaw docker-compose up -d
```

### Docker Commands

```bash
# View logs
sudo -u crewclaw docker-compose logs -f

# Stop
sudo -u crewclaw docker-compose down

# Restart
sudo -u crewclaw docker-compose restart

# Rebuild
sudo -u crewclaw docker-compose build
```

---

## Managing Assistants

### Creating an Assistant

1. Navigate to **Assistants** page
2. Click "Create Assistant"
3. Select business (must have 3-char prefix)
4. Enter assistant name
5. IP address is auto-assigned from pool
6. Container is created with format: `{prefix}-{assistant-name}`

### Container Naming

- **Format**: `XXX-assistant-name`
- **Example**: `acm-sales-bot`, `tech-support-agent`
- **Validation**: 3-char prefix enforced by AuthZ plugin

### IP Assignment

- **Auto-Assignment**: Next available IP from pool
- **Manual Override**: Available in network settings
- **Conflict Detection**: Automatic skip to next available

### Volume Management

Each assistant gets:
- **Volume Path**: `/opt/data/crewclaw-assistants/{container-name}/`
- **Workspace**: Persistent storage for assistant files
- **Config**: Credentials and configuration files
- **Logs**: Application and system logs

---

## Archive Management

When an assistant is deleted:

1. **Default Action**: Volume moved to archive
   - Path: `/opt/data/crewclaw-ui/.archive/{container-name}-{timestamp}/`
   - Retention: 90 days

2. **Permanent Delete**: Optional immediate deletion
   - Checkbox in delete confirmation dialog
   - Irreversible action

3. **Restore**: Available from archive page
   - Move back to active location
   - Re-create assistant configuration

### Archive Cleanup

Expired archives (90+ days) are automatically cleaned up. Manual cleanup:

```bash
# View archive stats
curl http://localhost:3000/api/archive?stats=true

# Clean up expired archives
curl -X POST http://localhost:3000/api/archive/cleanup
```

---

## Security Monitoring

### Docker AuthZ Logs

```bash
# View real-time AuthZ logs
sudo tail -f /var/log/crewclaw/crewclaw-authz.log

# View in UI
# Settings → Network → Security Enforcement
```

### Audit Log Events

All Docker operations are logged:
- Container creation (allowed/denied)
- Container start/stop/restart
- Volume mount attempts
- Network configuration changes
- Failed authorization attempts

View in UI: **Audit Logs** page with "Docker AuthZ" filter

### Failed Authorization Examples

```
[DENIED] Container name 'hacker-container' does not match required pattern
[DENIED] Privileged mode denied for: acm-assistant
[DENIED] Invalid network 'bridge' for: acm-sales-bot
[DENIED] Invalid volume mount /etc:/host-etc for: tech-support
```

---

## Troubleshooting

### Permission Denied

If you see permission errors:

```bash
# Ensure you're running as crewclaw user
sudo -u crewclaw <command>

# Fix permissions
sudo chown -R crewclaw:crewclaw /opt/data/crewclaw-ui/
sudo chown -R crewclaw:crewclaw /opt/data/crewclaw-assistants/
```

### Port Already in Use

If port 3000 is in use:

```bash
# Find process
sudo lsof -i :3000

# Change port in .env
UI_PORT=3001
```

### Docker AuthZ Plugin Issues

```bash
# Check plugin status
sudo systemctl status crewclaw-authz

# Restart plugin
sudo systemctl restart crewclaw-authz

# View plugin logs
sudo journalctl -u crewclaw-authz -f

# Verify Docker is using plugin
cat /etc/docker/daemon.json
```

### MACVLAN Network Issues

```bash
# Check network exists
docker network ls | grep assistant-network-internal

# Inspect network
docker network inspect assistant-network-internal

# Recreate network (WARNING: will disconnect containers)
docker network rm assistant-network-internal
# Then run setup.sh again
```

### IP Pool Exhausted

```bash
# Check IP status
curl http://localhost:3000/api/network/ips?type=summary

# Release IPs from deleted assistants
# This happens automatically, but can be done manually via API
```

### Database Errors

```bash
# Check data directory permissions
ls -la /opt/data/crewclaw-ui/

# Verify database exists
ls -la /opt/data/crewclaw-ui/CrewClaw-UI.db

# Fix ownership
sudo chown -R crewclaw:crewclaw /opt/data/crewclaw-ui/
```

---

## Advanced Configuration

### Custom MACVLAN Setup

If you need to manually configure the MACVLAN network:

```bash
# Detect your interface
ip route | grep default

# Create network manually
docker network create -d macvlan \
  --subnet=192.168.1.0/24 \
  --gateway=192.168.1.1 \
  --ip-range=192.168.1.100/24 \
  -o parent=eth0 \
  assistant-network-internal
```

Then update `/opt/data/crewclaw-ui/network-config.json`:

```json
{
  "parent_interface": "eth0",
  "subnet": "192.168.1.0/24",
  "gateway": "192.168.1.1",
  "ip_range_start": "192.168.1.100",
  "ip_range_end": "192.168.1.200",
  "network_name": "assistant-network-internal"
}
```

### AuthZ Plugin Configuration

Edit `/etc/crewclaw/authz-plugin.json`:

```json
{
  "allowed_volume_base": "/opt/data/crewclaw-assistants/",
  "required_network": "assistant-network-internal",
  "log_path": "/var/log/crewclaw/crewclaw-authz.log",
  "ui_api": {
    "enabled": true,
    "endpoint": "http://127.0.0.1:3000/api/audit/docker"
  }
}
```

Reload without restart:

```bash
sudo kill -HUP $(pgrep crewclaw-authz)
```

---

## API Reference

### Network API

```bash
# Get network config
GET /api/network/config

# Update network config
PUT /api/network/config
{
  "parentInterface": "eth0",
  "subnet": "192.168.1.0/24",
  "gateway": "192.168.1.1",
  "ipRangeStart": "192.168.1.100",
  "ipRangeEnd": "192.168.1.200"
}

# Get IP status summary
GET /api/network/ips?type=summary

# Get available IPs
GET /api/network/ips?type=available

# Get next available IP
GET /api/network/ips?type=next

# Assign IP to assistant
POST /api/network/ips
{
  "assistantId": 123,
  "auto": true
}
```

### Archive API

```bash
# Get all archives
GET /api/archive

# Get archive statistics
GET /api/archive?stats=true

# Restore archive
POST /api/archive/restore
{
  "id": 456
}

# Permanently delete
DELETE /api/archive?id=456
```

### Audit API

```bash
# Get Docker AuthZ events
GET /api/audit/docker

# Get with filters
GET /api/audit/docker?action=DENIED&limit=50

# Receive events (AuthZ plugin uses this)
POST /api/audit/docker
{
  "event_type": "container_creation_denied",
  "action": "DENIED",
  "message": "Privileged containers not allowed",
  ...
}
```

---

## Development

### Building from Source

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

### Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── assistants/        # Assistant management UI
│   ├── businesses/        # Business management UI
│   ├── settings/          # Settings pages
│   └── ...
├── components/            # React components
├── lib/                   # Utility libraries
│   ├── db.ts             # Database operations
│   ├── docker.ts         # Docker integration
│   ├── network.ts        # Network management
│   ├── archive.ts        # Archive operations
│   └── encryption.ts     # Encryption utilities
└── hooks/                 # Custom React hooks
```

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

## Security

### Reporting Security Issues

Please report security vulnerabilities to: security@vistiqx.com

### Security Features

- ✅ Docker authorization plugin (mandatory access control)
- ✅ MACVLAN network isolation
- ✅ Privileged container blocking
- ✅ Volume path restrictions
- ✅ Container naming enforcement
- ✅ Comprehensive audit logging
- ✅ Encryption at rest (credentials)
- ✅ No secrets in environment variables

---

## License

MIT License - See LICENSE file for details

---

## Support

- **GitHub Issues**: https://github.com/Vistiqx/CrewClaw-UI/issues
- **Documentation**: https://github.com/Vistiqx/CrewClaw-UI/wiki
- **Email**: support@vistiqx.com

---

## Related Projects

- [CrewClaw-Core](https://github.com/Vistiqx/CrewClaw-Core) - Core AI assistant framework
- [CrewClaw-AuthZ-Plugin](https://github.com/Vistiqx/CrewClaw-AuthZ-Plugin) - Docker authorization plugin

---

**Built with ❤️ by Vistiqx**
