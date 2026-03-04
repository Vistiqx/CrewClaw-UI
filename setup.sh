#!/bin/bash
set -e

# =============================================================================
# CrewClaw-UI - Setup Script
# =============================================================================
# This script installs CrewClaw-UI with Docker Authorization Plugin.
# It creates a dedicated 'crewclaw' user and sets up the complete infrastructure.
#
# Usage:
#   sudo bash ./setup.sh              # Run installation
#   sudo bash ./setup.sh --cleanup   # Clean up existing installation
#   sudo bash ./setup.sh -c           # Clean up existing installation
#
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
CREWCLAW_USER="crewclaw"
CREWCLAW_GROUP="crewclaw"
INSTALL_DIR="/opt/scripts/crewclaw-ui"
DATA_DIR="/opt/data/crewclaw-ui"
ASSISTANTS_DIR="/opt/data/crewclaw-assistants"
DOCKER_DIR="/opt/docker/crewclaw-ui"
REPO_URL="https://github.com/Vistiqx/CrewClaw-UI.git"
AUTHZ_REPO_URL="https://github.com/Vistiqx/CrewClaw-AuthZ-Plugin.git"

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }
log_success() { echo -e "${CYAN}[SUCCESS]${NC} $1"; }

# =============================================================================
# CHECK & INSTALL PREREQUISITES
# =============================================================================
check_prerequisites() {
    log_step "Checking prerequisites..."

    # Check if running as root
    if [ "$EUID" -ne 0 ]; then
        log_error "This script must be run as root (use sudo)."
        exit 1
    fi

    # Install Node.js if not present
    if ! command -v node &> /dev/null; then
        log_warn "Node.js is not installed. Installing..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
        log_info "Node.js installed: $(node -v) ✓"
    else
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -lt 20 ]; then
            log_warn "Node.js version is below 20. Upgrading..."
            curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
            apt-get install -y nodejs
        fi
        log_info "Node.js: $(node -v) ✓"
    fi

    # Install Docker if not present
    if ! command -v docker &> /dev/null; then
        log_warn "Docker is not installed. Installing..."
        curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
        sh /tmp/get-docker.sh
        usermod -aG docker "$CREWCLAW_USER" 2>/dev/null || true
        log_info "Docker installed: $(docker --version) ✓"
    else
        log_info "Docker: $(docker --version) ✓"
    fi

    # Install Docker Compose if not present
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
        log_warn "Docker Compose is not installed. Installing..."
        apt-get update
        apt-get install -y docker-compose-plugin
        if ! command -v docker-compose &> /dev/null; then
            curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            chmod +x /usr/local/bin/docker-compose
        fi
        log_info "Docker Compose installed ✓"
    fi
    
    if command -v docker-compose &> /dev/null; then
        log_info "Docker Compose: $(docker-compose --version) ✓"
    else
        log_info "Docker Compose: $(docker compose version) ✓"
    fi

    # Install Go for building AuthZ plugin
    if ! command -v go &> /dev/null; then
        log_warn "Go is not installed. Installing..."
        GO_VERSION="1.22.0"
        wget "https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz" -O /tmp/go.tar.gz
        tar -C /usr/local -xzf /tmp/go.tar.gz
        export PATH=$PATH:/usr/local/go/bin
        echo 'export PATH=$PATH:/usr/local/go/bin' >> /etc/profile
        log_info "Go installed: $(go version) ✓"
    else
        log_info "Go: $(go version) ✓"
    fi

    # Check for git
    if ! command -v git &> /dev/null; then
        log_warn "Git is not installed. Installing..."
        apt-get update
        apt-get install -y git
    fi
    log_info "Git: $(git --version) ✓"

    # Install make
    if ! command -v make &> /dev/null; then
        log_warn "Make is not installed. Installing..."
        apt-get install -y make
    fi

    log_success "All prerequisites satisfied!"
    echo
}

# =============================================================================
# WARNING & ACKNOWLEDGMENT
# =============================================================================
show_warning() {
    echo -e "${RED}╔══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                                      ║${NC}"
    echo -e "${RED}║  ${BOLD}WARNING: This installation will PERMANENTLY DELETE all${RED}             ║${NC}"
    echo -e "${RED}║  ${BOLD}existing CrewClaw data if previously installed.${RED}                   ║${NC}"
    echo -e "${RED}║                                                                      ║${NC}"
    echo -e "${RED}║  The following will be REMOVED:                                      ║${NC}"
    echo -e "${RED}║    • ${INSTALL_DIR}/                                          ║${NC}"
    echo -e "${RED}║    • ${DATA_DIR}/                                             ║${NC}"
    echo -e "${RED}║    • ${ASSISTANTS_DIR}/                                       ║${NC}"
    echo -e "${RED}║    • ${DOCKER_DIR}/                                           ║${NC}"
    echo -e "${RED}║    • Docker AuthZ Plugin configuration                        ║${NC}"
    echo -e "${RED}║    • MACVLAN network (if exists)                              ║${NC}"
    echo -e "${RED}║    • User '${CREWCLAW_USER}' (if exists)                       ║${NC}"
    echo -e "${RED}║                                                                      ║${NC}"
    echo -e "${RED}║  Docker daemon will be RESTARTED during installation.           ║${NC}"
    echo -e "${RED}║                                                                      ║${NC}"
    echo -e "${RED}║  If you have existing assistants, businesses, or data,          ║${NC}"
    echo -e "${RED}║  please BACK UP before continuing.                              ║${NC}"
    echo -e "${RED}║                                                                      ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════════════════╝${NC}"
    echo

    echo -e "${YELLOW}Type 'I UNDERSTAND' to continue (case-sensitive):${NC} "
    read -r ACKNOWLEDGE

    ACKNOWLEDGE=$(echo "$ACKNOWLEDGE" | xargs)

    if [ "$ACKNOWLEDGE" != "I UNDERSTAND" ]; then
        log_error "Installation cancelled."
        exit 1
    fi

    echo
    log_info "Continuing with installation..."
    echo
}

# =============================================================================
# CLEANUP EXISTING INSTALLATION
# =============================================================================
cleanup_existing() {
    log_step "Cleaning up existing installation..."

    # Stop services
    systemctl stop crewclaw-authz 2>/dev/null || true
    
    # Remove AuthZ plugin from Docker
    if [ -f /etc/docker/daemon.json ]; then
        log_info "Removing AuthZ plugin from Docker configuration..."
        # Backup and modify daemon.json
        cp /etc/docker/daemon.json /etc/docker/daemon.json.backup.$(date +%s)
    fi

    # Kill any running processes for crewclaw user
    if id "$CREWCLAW_USER" &> /dev/null; then
        pkill -u "$CREWCLAW_USER" 2>/dev/null || true
    fi

    # Remove containers
    docker ps -q --filter "name=crewclaw" | xargs -r docker stop 2>/dev/null || true
    docker ps -aq --filter "name=crewclaw" | xargs -r docker rm 2>/dev/null || true

    # Remove MACVLAN network
    docker network rm assistant-network-internal 2>/dev/null || true

    # Remove user if exists
    if id "$CREWCLAW_USER" &> /dev/null; then
        log_info "Removing existing user: $CREWCLAW_USER"
        userdel -r "$CREWCLAW_USER" 2>/dev/null || true
    fi

    # Remove group if exists
    if getent group "$CREWCLAW_GROUP" &> /dev/null; then
        groupdel "$CREWCLAW_GROUP" 2>/dev/null || true
    fi

    # Remove directories
    if [ -d "$DATA_DIR" ]; then
        log_info "Removing: $DATA_DIR"
        rm -rf "$DATA_DIR"
    fi

    if [ -d "$DOCKER_DIR" ]; then
        log_info "Removing: $DOCKER_DIR"
        rm -rf "$DOCKER_DIR"
    fi

    if [ -d "$INSTALL_DIR" ]; then
        log_info "Removing: $INSTALL_DIR"
        rm -rf "$INSTALL_DIR"
    fi

    if [ -d "$ASSISTANTS_DIR" ]; then
        log_info "Removing: $ASSISTANTS_DIR"
        rm -rf "$ASSISTANTS_DIR"
    fi

    # Remove AuthZ plugin
    rm -rf /usr/lib/docker/plugins/crewclaw-authz 2>/dev/null || true
    rm -f /etc/systemd/system/crewclaw-authz.service 2>/dev/null || true
    rm -rf /etc/crewclaw 2>/dev/null || true
    
    systemctl daemon-reload 2>/dev/null || true

    log_success "Cleanup complete!"
    echo
}

# =============================================================================
# CREATE USER & GROUPS
# =============================================================================
create_user() {
    log_step "Creating user and groups..."

    # Create group (ignore if exists)
    if getent group "$CREWCLAW_GROUP" > /dev/null 2>&1; then
        log_info "Group already exists: $CREWCLAW_GROUP"
    else
        groupadd -r "$CREWCLAW_GROUP"
        log_info "Created group: $CREWCLAW_GROUP"
    fi

    # Create user
    if id "$CREWCLAW_USER" &> /dev/null; then
        log_info "User already exists: $CREWCLAW_USER"
    else
        useradd -r -s /bin/bash -d "$INSTALL_DIR" -g users -G docker "$CREWCLAW_USER"
        log_info "Created user: $CREWCLAW_USER"
    fi

    # Add user to crewclaw group
    usermod -aG "$CREWCLAW_GROUP" "$CREWCLAW_USER" 2>/dev/null || true

    log_success "User and groups ready!"
    echo
}

# =============================================================================
# CREATE DIRECTORIES
# =============================================================================
create_directories() {
    log_step "Creating directory structure..."

    # Create base directories
    mkdir -p "$DATA_DIR"
    mkdir -p "$ASSISTANTS_DIR"
    mkdir -p "$DOCKER_DIR"
    mkdir -p "$INSTALL_DIR"
    mkdir -p /var/log/crewclaw
    mkdir -p /etc/crewclaw

    log_info "Created: $DATA_DIR"
    log_info "Created: $ASSISTANTS_DIR"
    log_info "Created: $DOCKER_DIR"
    log_info "Created: $INSTALL_DIR"

    log_success "Directories created!"
    echo
}

# =============================================================================
# SET PERMISSIONS
# =============================================================================
set_permissions() {
    log_step "Setting permissions..."

    # Set ownership
    chown -R "$CREWCLAW_USER:$CREWCLAW_GROUP" "$DATA_DIR"
    chown -R "$CREWCLAW_USER:$CREWCLAW_GROUP" "$ASSISTANTS_DIR"
    chown -R "$CREWCLAW_USER:$CREWCLAW_GROUP" "$DOCKER_DIR"
    chown -R "$CREWCLAW_USER:$CREWCLAW_GROUP" "$INSTALL_DIR"
    chown -R "$CREWCLAW_USER:$CREWCLAW_GROUP" /var/log/crewclaw

    # Ensure docker group has access
    chmod -R 770 "$DATA_DIR" 2>/dev/null || true
    chmod -R 770 "$ASSISTANTS_DIR" 2>/dev/null || true
    chmod -R 770 "$DOCKER_DIR" 2>/dev/null || true
    chmod -R 770 "$INSTALL_DIR" 2>/dev/null || true

    log_success "Permissions set!"
    echo
}

# =============================================================================
# DETECT NETWORK INTERFACE
# =============================================================================
detect_network_interface() {
    log_step "Detecting network interface..."

    # Try to find primary interface
    PRIMARY_IF=$(ip route | grep default | awk '{print $5}' | head -n1)
    
    # Fallback options if primary not found
    if [ -z "$PRIMARY_IF" ]; then
        PRIMARY_IF=$(ip -o link show | grep -v "lo:" | awk -F': ' '{print $2}' | head -n1)
    fi
    
    if [ -z "$PRIMARY_IF" ]; then
        log_error "Could not detect network interface. Please specify manually."
        exit 1
    fi
    
    log_info "Detected primary interface: $PRIMARY_IF"
    echo "$PRIMARY_IF"
}

# =============================================================================
# CREATE MACVLAN NETWORK
# =============================================================================
create_macvlan_network() {
    log_step "Creating MACVLAN network..."

    PARENT_IF=$(detect_network_interface)
    
    # Get subnet information
    SUBNET=$(ip -o -f inet addr show "$PARENT_IF" | awk '{print $4}' | head -n1)
    GATEWAY=$(ip route | grep default | awk '{print $3}' | head -n1)
    
    if [ -z "$SUBNET" ] || [ -z "$GATEWAY" ]; then
        log_error "Could not detect network configuration."
        exit 1
    fi
    
    log_info "Subnet: $SUBNET"
    log_info "Gateway: $GATEWAY"
    
    # Calculate dynamic IP range
    # Use .100-.200 range within the subnet
    NETWORK_BASE=$(echo "$SUBNET" | cut -d'/' -f1 | cut -d'.' -f1-3)
    IP_RANGE_START="${NETWORK_BASE}.100"
    IP_RANGE_END="${NETWORK_BASE}.200"
    
    log_info "IP Range: $IP_RANGE_START - $IP_RANGE_END"
    
    # Check if network already exists
    if docker network ls | grep -q "assistant-network-internal"; then
        log_warn "MACVLAN network already exists. Removing and recreating..."
        docker network rm assistant-network-internal 2>/dev/null || true
    fi
    
    # Create MACVLAN network
    docker network create -d macvlan \
        --subnet="$SUBNET" \
        --gateway="$GATEWAY" \
        --ip-range="${IP_RANGE_START}/24" \
        -o parent="$PARENT_IF" \
        assistant-network-internal
        
    log_success "Created MACVLAN network 'assistant-network-internal'"
    
    # Store network configuration
    cat > "$DATA_DIR/network-config.json" <<EOF
{
    "parent_interface": "$PARENT_IF",
    "subnet": "$SUBNET",
    "gateway": "$GATEWAY",
    "ip_range_start": "$IP_RANGE_START",
    "ip_range_end": "$IP_RANGE_END",
    "network_name": "assistant-network-internal"
}
EOF
    
    chown "$CREWCLAW_USER:$CREWCLAW_GROUP" "$DATA_DIR/network-config.json"
    log_success "Network configuration saved"
    echo
}

# =============================================================================
# INSTALL DOCKER AUTHZ PLUGIN
# =============================================================================
install_authz_plugin() {
    log_step "Installing Docker Authorization Plugin..."
    
    # Clone AuthZ plugin repository
    log_info "Cloning AuthZ Plugin repository..."
    if [ -d "/tmp/crewclaw-authz-plugin" ]; then
        rm -rf /tmp/crewclaw-authz-plugin
    fi
    git clone "$AUTHZ_REPO_URL" /tmp/crewclaw-authz-plugin
    
    cd /tmp/crewclaw-authz-plugin
    
    # Build the binary
    log_info "Building AuthZ Plugin binary..."
    export PATH=$PATH:/usr/local/go/bin
    make build
    
    # Install to system
    log_info "Installing AuthZ Plugin to system..."
    make install
    
    # Update configuration for this deployment
    cat > /etc/crewclaw/authz-plugin.json <<EOF
{
  "allowed_volume_base": "$ASSISTANTS_DIR/",
  "required_network": "assistant-network-internal",
  "log_path": "/var/log/crewclaw/crewclaw-authz.log",
  "ui_api": {
    "enabled": true,
    "endpoint": "http://127.0.0.1:3000/api/audit/docker",
    "timeout_seconds": 5,
    "retry_attempts": 3
  },
  "audit": {
    "log_to_file": true,
    "log_to_ui": true,
    "log_level": "info"
  },
  "enforcement": {
    "strict_mode": true,
    "allow_container_inspect": true,
    "allow_container_logs": true,
    "allow_container_exec": false
  }
}
EOF

    # Set proper permissions
    chown -R "$CREWCLAW_USER:$CREWCLAW_GROUP" /etc/crewclaw
    chmod 644 /etc/crewclaw/authz-plugin.json
    
    # Enable and start service
    log_info "Enabling AuthZ Plugin service..."
    systemctl daemon-reload
    systemctl enable crewclaw-authz
    systemctl start crewclaw-authz
    
    log_success "AuthZ Plugin installed and started"
    echo
}

# =============================================================================
# CONFIGURE DOCKER DAEMON
# =============================================================================
configure_docker_daemon() {
    log_step "Configuring Docker daemon..."
    
    # Backup existing config
    if [ -f /etc/docker/daemon.json ]; then
        cp /etc/docker/daemon.json /etc/docker/daemon.json.backup.$(date +%s)
        log_info "Backed up existing Docker configuration"
    fi
    
    # Create Docker daemon configuration
    cat > /etc/docker/daemon.json <<EOF
{
    "authorization-plugins": ["crewclaw-authz"],
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    }
}
EOF
    
    log_success "Docker daemon configuration updated"
    echo
}

# =============================================================================
# CLONE REPOSITORY
# =============================================================================
clone_repository() {
    log_step "Cloning CrewClaw-UI repository..."
    
    if [ -d "$INSTALL_DIR/.git" ]; then
        log_info "Repository already exists at $INSTALL_DIR, updating..."
        cd "$INSTALL_DIR"
        git pull
    else
        log_info "Cloning from $REPO_URL..."
        git clone "$REPO_URL" "$INSTALL_DIR"
    fi
    
    # Ensure proper ownership
    chown -R "$CREWCLAW_USER:$CREWCLAW_GROUP" "$INSTALL_DIR"
    
    log_success "Repository ready!"
    echo
}

# =============================================================================
# ENVIRONMENT SETUP
# =============================================================================
setup_environment() {
    log_step "Setting up environment..."

    ENV_FILE="$INSTALL_DIR/.env"
    ENV_EXAMPLE="$INSTALL_DIR/.env.example"

    # Create .env from example if it doesn't exist
    if [ ! -f "$ENV_FILE" ]; then
        if [ -f "$ENV_EXAMPLE" ]; then
            cp "$ENV_EXAMPLE" "$ENV_FILE"
            log_info "Created .env from .env.example"
        else
            touch "$ENV_FILE"
            log_info "Created empty .env"
        fi
    else
        log_info ".env already exists, preserving..."
    fi

    # Generate encryption key if empty
    if grep -q "^UI_ENCRYPTION_KEY=$" "$ENV_FILE" || ! grep -q "^UI_ENCRYPTION_KEY=" "$ENV_FILE"; then
        ENCRYPTION_KEY=$(openssl rand -hex 32 2>/dev/null)
        if [ -n "$ENCRYPTION_KEY" ]; then
            if grep -q "^UI_ENCRYPTION_KEY=" "$ENV_FILE"; then
                sed -i "s|^UI_ENCRYPTION_KEY=.*|UI_ENCRYPTION_KEY=$ENCRYPTION_KEY|" "$ENV_FILE"
            else
                echo "UI_ENCRYPTION_KEY=$ENCRYPTION_KEY" >> "$ENV_FILE"
            fi
            log_info "Generated UI_ENCRYPTION_KEY"
        else
            log_warn "Could not generate encryption key. Please set UI_ENCRYPTION_KEY manually."
        fi
    fi

    # Update data paths in .env
    sed -i "s|^DATA_PATH=.*|DATA_PATH=$DATA_DIR|" "$ENV_FILE" 2>/dev/null || true
    sed -i "s|^DB_PATH=.*|DB_PATH=$DATA_DIR/CrewClaw-UI.db|" "$ENV_FILE" 2>/dev/null || true
    sed -i "s|^ASSISTANTS_DATA_PATH=.*|ASSISTANTS_DATA_PATH=$ASSISTANTS_DIR|" "$ENV_FILE" 2>/dev/null || true

    chown "$CREWCLAW_USER:$CREWCLAW_GROUP" "$ENV_FILE"

    log_success "Environment configured!"
    echo
}

# =============================================================================
# INSTALL DEPENDENCIES
# =============================================================================
install_dependencies() {
    log_step "Installing dependencies..."

    cd "$INSTALL_DIR"

    # Clean up any existing node_modules to ensure fresh install
    log_info "Cleaning up existing dependencies..."
    rm -rf node_modules package-lock.json .next

    # Configure npm to avoid permission issues
    log_info "Configuring npm..."
    npm config set prefix '~/.npm-global'

    # Install npm dependencies as crewclaw user
    log_info "Installing npm dependencies as $CREWCLAW_USER..."
    sudo -u "$CREWCLAW_USER" npm install --legacy-peer-deps

    # Verify next was installed
    if [ ! -f "node_modules/next/package.json" ]; then
        log_error "Next.js failed to install. Retrying..."
        sudo -u "$CREWCLAW_USER" npm install --legacy-peer-deps --force
    fi

    if [ ! -f "node_modules/next/package.json" ]; then
        log_error "Next.js installation failed. Please check your network connection and try again."
        exit 1
    fi

    # Ensure ownership is correct
    log_info "Setting ownership..."
    chown -R "$CREWCLAW_USER:$CREWCLAW_GROUP" "$INSTALL_DIR"

    # Pre-create .next directory structure to avoid permission issues
    log_info "Creating .next directory..."
    mkdir -p .next/dev
    mkdir -p .next/cache
    chown -R "$CREWCLAW_USER:$CREWCLAW_GROUP" .next

    log_success "Dependencies installed!"
    echo
}

# =============================================================================
# COPY DOCKER FILES
# =============================================================================
copy_docker_files() {
    log_step "Setting up Docker configurations..."

    # Copy docker-compose.yml
    if [ -f "$INSTALL_DIR/docker-compose.yml" ]; then
        cp "$INSTALL_DIR/docker-compose.yml" "$DOCKER_DIR/"
        chown "$CREWCLAW_USER:$CREWCLAW_GROUP" "$DOCKER_DIR/docker-compose.yml"
        log_info "Copied docker-compose.yml to $DOCKER_DIR/"
    fi

    # Copy Dockerfile
    if [ -f "$INSTALL_DIR/Dockerfile" ]; then
        cp "$INSTALL_DIR/Dockerfile" "$DOCKER_DIR/"
        chown "$CREWCLAW_USER:$CREWCLAW_GROUP" "$DOCKER_DIR/Dockerfile"
        log_info "Copied Dockerfile to $DOCKER_DIR/"
    fi

    log_success "Docker files configured!"
    echo
}

# =============================================================================
# RESTART DOCKER
# =============================================================================
restart_docker() {
    log_step "Restarting Docker daemon..."
    log_warn "This will briefly interrupt all Docker containers!"
    
    systemctl restart docker
    
    # Wait for Docker to be ready
    log_info "Waiting for Docker to be ready..."
    for i in {1..30}; do
        if docker ps &>/dev/null; then
            log_success "Docker daemon is ready"
            return 0
        fi
        sleep 1
    done
    
    log_error "Docker daemon failed to start within 30 seconds"
    exit 1
}

# =============================================================================
# PRINT NEXT STEPS
# =============================================================================
print_next_steps() {
    echo
    echo -e "${GREEN}══════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}                    INSTALLATION COMPLETE!${NC}"
    echo -e "${GREEN}══════════════════════════════════════════════════════════════════════${NC}"
    echo
    echo -e "${BOLD}Next steps:${NC}"
    echo
    echo -e "  1. ${YELLOW}Edit environment variables (optional):${NC}"
    echo -e "     nano $INSTALL_DIR/.env"
    echo
    echo -e "  2. ${YELLOW}Start CrewClaw-UI (Development):${NC}"
    echo -e "     cd $INSTALL_DIR"
    echo -e "     sudo -u $CREWCLAW_USER npm run dev"
    echo
    echo -e "  3. ${YELLOW}Start CrewClaw-UI (Production - Docker):${NC}"
    echo -e "     cd $DOCKER_DIR"
    echo -e "     sudo -u $CREWCLAW_USER docker-compose up -d"
    echo
    echo -e "  4. ${YELLOW}Access CrewClaw-UI:${NC}"
    echo -e "     http://localhost:3000"
    echo
    echo -e "${BOLD}Security:${NC}"
    echo
    echo -e "  • Docker AuthZ Plugin: Installed and running"
    echo -e "  • MACVLAN Network: Created on $(detect_network_interface)"
    echo -e "  • Container naming: Enforced (XXX-name pattern)"
    echo -e "  • Privileged mode: DENIED"
    echo -e "  • Volume restrictions: Only $ASSISTANTS_DIR allowed"
    echo
    echo -e "${BOLD}Useful commands:${NC}"
    echo
    echo -e "  View AuthZ logs:  sudo tail -f /var/log/crewclaw/crewclaw-authz.log"
    echo -e "  Check AuthZ status: sudo systemctl status crewclaw-authz"
    echo -e "  View UI logs:     sudo -u $CREWCLAW_USER docker-compose logs -f"
    echo -e "  Stop UI:          sudo -u $CREWCLAW_USER docker-compose down"
    echo -e "  Restart UI:       sudo -u $CREWCLAW_USER docker-compose restart"
    echo
    echo -e "${BOLD}File locations:${NC}"
    echo
    echo -e "  Source code:   $INSTALL_DIR/"
    echo -e "  Docker config: $DOCKER_DIR/"
    echo -e "  Data:          $DATA_DIR/"
    echo -e "  Assistants:    $ASSISTANTS_DIR/"
    echo -e "  Environment:   $INSTALL_DIR/.env"
    echo -e "  AuthZ config:  /etc/crewclaw/authz-plugin.json"
    echo
    echo -e "${GREEN}══════════════════════════════════════════════════════════════════════${NC}"
    echo
}

# =============================================================================
# CLEANUP (for re-installation)
# =============================================================================
cleanup() {
    log_step "Cleaning up for re-installation..."

    show_warning
    cleanup_existing

    log_success "Cleanup complete! Run the installer again."
    echo
    exit 0
}

# =============================================================================
# MAIN
# =============================================================================
main() {
    # Check for cleanup flag
    if [ "$1" = "--cleanup" ] || [ "$1" = "-c" ]; then
        cleanup
    fi

    echo
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                                                                      ║${NC}"
    echo -e "${CYAN}║                 ${BOLD}CrewClaw-UI Installer${CYAN}                       ║${NC}"
    echo -e "${CYAN}║                                                                      ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
    echo

    check_prerequisites
    show_warning
    cleanup_existing
    create_user
    create_directories
    set_permissions
    create_macvlan_network
    install_authz_plugin
    configure_docker_daemon
    restart_docker
    clone_repository
    setup_environment
    install_dependencies
    copy_docker_files
    print_next_steps
}

main "$@"
