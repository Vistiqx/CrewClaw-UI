#!/bin/bash
set -e

# =============================================================================
# CrewClaw-UI - Setup Script
# =============================================================================
# This script installs CrewClaw-UI and Framework.
# It creates a dedicated 'crewclaw' user and sets up the directory structure.
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
INSTALL_DIR="/opt/scripts/crewclaw"
DATA_DIR="/opt/data/crewclaw"
DOCKER_DIR="/opt/docker/crewclaw"
REPO_URL="https://github.com/Vistiqx/CrewClaw.git"

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

    # -------------------------------------------------------------------------
    # Install Node.js if not present
    # -------------------------------------------------------------------------
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

    # -------------------------------------------------------------------------
    # Install Docker if not present
    # -------------------------------------------------------------------------
    if ! command -v docker &> /dev/null; then
        log_warn "Docker is not installed. Installing..."
        curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
        sh /tmp/get-docker.sh
        usermod -aG docker "$CREWCLAW_USER" 2>/dev/null || true
        log_info "Docker installed: $(docker --version) ✓"
    else
        log_info "Docker: $(docker --version) ✓"
    fi

    # -------------------------------------------------------------------------
    # Install Docker Compose if not present
    # -------------------------------------------------------------------------
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
        log_warn "Docker Compose is not installed. Installing..."
        apt-get update
        apt-get install -y docker-compose-plugin
        # Try alternative if plugin install failed
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

    # -------------------------------------------------------------------------
    # Check for git
    # -------------------------------------------------------------------------
    if ! command -v git &> /dev/null; then
        log_warn "Git is not installed. Installing..."
        apt-get update
        apt-get install -y git
    fi
    log_info "Git: $(git --version) ✓"

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
    echo -e "${RED}║    • ${DATA_DIR}/                                               ║${NC}"
    echo -e "${RED}║    • ${DOCKER_DIR}/                                             ║${NC}"
    echo -e "${RED}║    • ${INSTALL_DIR}/                                            ║${NC}"
    echo -e "${RED}║    • User '${CREWCLAW_USER}' (if exists)                          ║${NC}"
    echo -e "${RED}║                                                                      ║${NC}"
    echo -e "${RED}║  If you have existing assistants, businesses, or data,           ║${NC}"
    echo -e "${RED}║  please BACK UP before continuing.                                ║${NC}"
    echo -e "${RED}║                                                                      ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════════════════╝${NC}"
    echo

    echo -e "${YELLOW}Type 'I UNDERSTAND' to continue (case-sensitive):${NC} "
    read -r ACKNOWLEDGE

    # Normalize the input (trim whitespace)
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

    # Kill any running processes for crewclaw user
    if id "$CREWCLAW_USER" &> /dev/null; then
        pkill -u "$CREWCLAW_USER" 2>/dev/null || true
    fi

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
        # Create user with 'users' as primary group, add to docker and crewclaw as supplementary
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
    mkdir -p "$DATA_DIR/ui"
    mkdir -p "$DOCKER_DIR/ui"
    mkdir -p "$INSTALL_DIR"

    log_info "Created: $DATA_DIR"
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
    chown -R "$CREWCLAW_USER:$CREWCLAW_GROUP" "$DOCKER_DIR"
    chown -R "$CREWCLAW_USER:$CREWCLAW_GROUP" "$INSTALL_DIR"

    # Ensure docker group has access
    chmod -R 770 "$DATA_DIR" 2>/dev/null || true
    chmod -R 770 "$DOCKER_DIR" 2>/dev/null || true
    chmod -R 770 "$INSTALL_DIR" 2>/dev/null || true

    log_success "Permissions set!"
    echo
}

# =============================================================================
# CLONE REPOSITORY
# =============================================================================
clone_repository() {
    log_step "Cloning CrewClaw repository..."

    # Check if we're already in the repo
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PARENT_DIR="$(dirname "$SCRIPT_DIR")"

    if [ -d "$PARENT_DIR/.git" ]; then
        log_info "Repository found at $PARENT_DIR"
        # Don't copy to another folder - use the existing directory
        log_info "Using existing repository at $PARENT_DIR"
        # Create symlink or just use the existing path
        ln -sf "$PARENT_DIR" "$INSTALL_DIR" 2>/dev/null || true
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

    ENV_FILE="$INSTALL_DIR/ui/.env"
    ENV_EXAMPLE="$INSTALL_DIR/ui/.env.example"

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
            # Add or update the key
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
    sed -i "s|^DATA_PATH=.*|DATA_PATH=$DATA_DIR/ui|" "$ENV_FILE" 2>/dev/null || true
    sed -i "s|^DB_PATH=.*|DB_PATH=$DATA_DIR/ui/CrewClaw-UI.db|" "$ENV_FILE" 2>/dev/null || true
    sed -i "s|^REGISTRY_PATH=.*|REGISTRY_PATH=$DATA_DIR/business-registry.json|" "$ENV_FILE" 2>/dev/null || true

    chown "$CREWCLAW_USER:$CREWCLAW_GROUP" "$ENV_FILE"

    log_success "Environment configured!"
    echo
}

# =============================================================================
# INSTALL DEPENDENCIES
# =============================================================================
install_dependencies() {
    log_step "Installing dependencies..."

    cd "$INSTALL_DIR/ui"

    # Clean up any existing node_modules to ensure fresh install
    log_info "Cleaning up existing dependencies..."
    rm -rf node_modules package-lock.json .next

    # Configure npm to avoid permission issues
    log_info "Configuring npm..."
    npm config set prefix '~/.npm-global'

    # Install npm dependencies as crewclaw user to ensure proper bin linking
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
    chown -R "$CREWCLAW_USER:$CREWCLAW_GROUP" "$INSTALL_DIR/ui"

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

    # Copy docker-compose.yml to data directory
    if [ -f "$INSTALL_DIR/ui/docker-compose.yml" ]; then
        cp "$INSTALL_DIR/ui/docker-compose.yml" "$DOCKER_DIR/ui/"
        chown "$CREWCLAW_USER:$CREWCLAW_GROUP" "$DOCKER_DIR/ui/docker-compose.yml"
        log_info "Copied docker-compose.yml to $DOCKER_DIR/ui/"
    fi

    # Copy Dockerfile if exists
    if [ -f "$INSTALL_DIR/ui/Dockerfile" ]; then
        cp "$INSTALL_DIR/ui/Dockerfile" "$DOCKER_DIR/ui/"
        chown "$CREWCLAW_USER:$CREWCLAW_GROUP" "$DOCKER_DIR/ui/Dockerfile"
        log_info "Copied Dockerfile to $DOCKER_DIR/ui/"
    fi

    log_success "Docker files configured!"
    echo
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
    echo -e "     nano $INSTALL_DIR/ui/.env"
    echo
    echo -e "  2. ${YELLOW}Start CrewClaw-UI (Development):${NC}"
    echo -e "     cd $INSTALL_DIR/ui"
    echo -e "     npm run dev"
    echo
    echo -e "  3. ${YELLOW}Start CrewClaw-UI (Production - Docker):${NC}"
    echo -e "     cd $DOCKER_DIR/ui"
    echo -e "     sudo -u $CREWCLAW_USER docker-compose up -d"
    echo
    echo -e "  4. ${YELLOW}Access CrewClaw-UI:${NC}"
    echo -e "     http://localhost:3000"
    echo
    echo -e "${BOLD}Useful commands:${NC}"
    echo
    echo -e "  View logs:     sudo -u $CREWCLAW_USER docker-compose logs -f"
    echo -e "  Stop:          sudo -u $CREWCLAW_USER docker-compose down"
    echo -e "  Restart:       sudo -u $CREWCLAW_USER docker-compose restart"
    echo
    echo -e "${BOLD}File locations:${NC}"
    echo
    echo -e "  Source code:   $INSTALL_DIR/ui/"
    echo -e "  Docker config: $DOCKER_DIR/ui/"
    echo -e "  Data:          $DATA_DIR/ui/"
    echo -e "  Environment:   $INSTALL_DIR/ui/.env"
    echo
    echo -e "${GREEN}══════════════════════════════════════════════════════════════════════${NC}"
    echo
}

# =============================================================================
# CLEANUP (for re-installation)
# =============================================================================
cleanup() {
    log_step "Cleaning up for re-installation..."

    # Show warning
    show_warning

    # Kill any running processes for crewclaw user
    if id "$CREWCLAW_USER" &> /dev/null; then
        pkill -u "$CREWCLAW_USER" 2>/dev/null || true
    fi

    # Remove user if exists
    if id "$CREWCLAW_USER" &> /dev/null; then
        log_info "Removing user: $CREWCLAW_USER"
        userdel -r "$CREWCLAW_USER" 2>/dev/null || true
    fi

    # Remove group if exists
    if getent group "$CREWCLAW_GROUP" &> /dev/null; then
        groupdel "$CREWCLAW_GROUP" 2>/dev/null || true
    fi

    # Remove directories
    rm -rf "$DATA_DIR" 2>/dev/null || true
    rm -rf "$DOCKER_DIR" 2>/dev/null || true
    rm -rf "$INSTALL_DIR" 2>/dev/null || true

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
    echo -e "${CYAN}║                 ${BOLD}CrewClaw-UI Installer${CYAN}                       ║${NC}}"
    echo -e "${CYAN}║                                                                      ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════╝${NC}"
    echo

    check_prerequisites
    show_warning
    cleanup_existing
    create_user
    create_directories
    set_permissions
    clone_repository
    setup_environment
    install_dependencies
    copy_docker_files
    print_next_steps
}

main "$@"
