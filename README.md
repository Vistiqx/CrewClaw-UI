# CrewClaw-UI

A web-based dashboard for managing CrewClaw businesses, assistants, credentials, and health monitoring.

---

## Quick Start

```bash
# 1. Clone repository (or use existing)
git clone https://github.com/Vistiqx/CrewClaw-UI.git /opt/scripts/crewclaw

# 2. Run installer (requires sudo)
cd /opt/scripts/crewclaw/ui
sudo bash ./setup.sh

# 3. Follow the on-screen instructions
#    - Read the warning and type "I UNDERSTAND"
#    - Script will create user, directories, and install dependencies

# 4. Start CrewClaw-UI
cd /opt/scripts/crewclaw/ui
sudo -u crewclaw npm run dev
```

Then open http://localhost:3000

---

## Requirements

| Software | Version |
|----------|---------|
| Ubuntu | 20.04+ / Debian 11+ |
| Node.js | 20+ |
| Docker | Latest |
| Docker Compose | Latest |

---

## Installation

### Automated Installation

```bash
cd /opt/scripts/crewclaw/ui
sudo ./setup.sh
```

The setup script will:
1. Check prerequisites (Node.js, Docker)
2. Warn about data deletion
3. Create `crewclaw` user and group
4. Set up directory structure
5. Clone repository
6. Generate encryption key
7. Install dependencies

### Manual Installation

```bash
# Create directories
sudo mkdir -p /opt/data/crewclaw/ui
sudo mkdir -p /opt/docker/crewclaw/ui

# Clone repository
git clone https://github.com/Vistiqx/CrewClaw-UI.git /opt/scripts/crewclaw
cd /opt/scripts/crewclaw/ui

# Create .env file
cp .env.example .env
# Edit .env with your values

# Install dependencies
npm install

# Start
npm run dev
```

---

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `UI_ENCRYPTION_KEY` | Encryption key for credentials (32 hex chars) | Yes |
| `DATA_PATH` | Path to data directory | Auto |
| `DB_PATH` | Path to SQLite database | Auto |
| `REGISTRY_PATH` | Path to business registry JSON | Auto |
| `UI_PORT` | Port for web interface (default: 3000) | No |
| `UI_HOST` | Host to bind to (default: 0.0.0.0) | No |
| `LOG_LEVEL` | Log level (debug, info, warn, error) | No |

### Generating a New Encryption Key

```bash
openssl rand -hex 32
```

---

## Running

### Development Mode (Node.js)

```bash
cd /opt/scripts/crewclaw/ui
sudo -u crewclaw npm run dev
```

### Production Mode (Docker)

```bash
cd /opt/docker/crewclaw/ui
sudo -u crewclaw docker-compose up -d
```

---

## Docker Commands

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

## Directory Structure

```
/opt/
├── docker/crewclaw/
│   └── ui/     # Docker configs
│       ├── docker-compose.yml
│       └── Dockerfile
├── data/crewclaw/
│   └── ui/    # Data & database
│       ├── ui.db
│       └── business-registry.json
└── scripts/crewclaw/       # Source code
    └── ui/
        ├── src/
        ├── package.json
        ├── .env
        └── setup.sh
```

---

## Troubleshooting

### Permission Denied

If you see permission errors, ensure you're running as the `crewclaw` user:

```bash
sudo -u crewclaw <command>
```

### Port Already in Use

If port 3000 is already in use:

```bash
# Find what's using port 3000
sudo lsof -i :3000

# Change port in .env
UI_PORT=3001
```

### Database Errors

Check that the data directory exists and has correct permissions:

```bash
ls -la /opt/data/crewclaw/ui/
sudo chown -R crewclaw:crewclaw /opt/data/crewclaw/
```

---

## License

MIT
