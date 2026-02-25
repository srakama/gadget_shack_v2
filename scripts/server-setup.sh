#!/bin/bash

# GadgetShack Server Setup Script
# Run this on a fresh Ubuntu 20.04+ server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root. Please run as a regular user with sudo privileges."
fi

# Check if sudo is available
if ! command -v sudo &> /dev/null; then
    error "sudo is required but not installed. Please install sudo first."
fi

log "🚀 Starting GadgetShack server setup..."
log "=============================================="

# Update system
log "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
log "📦 Installing essential packages..."
sudo apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    fail2ban \
    htop \
    nano \
    vim

# Configure firewall
log "🔥 Configuring firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Install Docker
log "🐳 Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
log "🐳 Installing Docker Compose..."
DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js (for migration scripts)
log "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL client (for database operations)
log "🗄️ Installing PostgreSQL client..."
sudo apt install -y postgresql-client

# Configure fail2ban
log "🛡️ Configuring fail2ban..."
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Create application directory
log "📁 Creating application directory..."
sudo mkdir -p /opt/gadgetshack
sudo chown $USER:$USER /opt/gadgetshack

# Create swap file (if not exists and less than 2GB RAM)
TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
if [ $TOTAL_MEM -lt 2048 ] && [ ! -f /swapfile ]; then
    log "💾 Creating swap file..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# Configure system limits
log "⚙️ Configuring system limits..."
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# Install Certbot for SSL
log "🔒 Installing Certbot..."
sudo apt install -y certbot

# Create log directory
sudo mkdir -p /var/log/gadgetshack
sudo chown $USER:$USER /var/log/gadgetshack

# Configure log rotation
sudo tee /etc/logrotate.d/gadgetshack > /dev/null <<EOF
/var/log/gadgetshack/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
}
EOF

# Install monitoring tools
log "📊 Installing monitoring tools..."
sudo apt install -y htop iotop nethogs

# Configure automatic security updates
log "🔄 Configuring automatic security updates..."
sudo apt install -y unattended-upgrades
echo 'Unattended-Upgrade::Automatic-Reboot "false";' | sudo tee -a /etc/apt/apt.conf.d/50unattended-upgrades

# Create deployment user and SSH key setup
log "👤 Setting up deployment configuration..."
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Generate SSH key for GitHub (if not exists)
if [ ! -f ~/.ssh/id_rsa ]; then
    ssh-keygen -t rsa -b 4096 -C "gadgetshack-server" -f ~/.ssh/id_rsa -N ""
    log "📋 SSH public key generated. Add this to your GitHub repository:"
    cat ~/.ssh/id_rsa.pub
fi

# Configure Git
read -p "Enter your Git username: " git_username
read -p "Enter your Git email: " git_email
git config --global user.name "$git_username"
git config --global user.email "$git_email"

# Install additional useful tools
log "🛠️ Installing additional tools..."
sudo apt install -y \
    tree \
    ncdu \
    jq \
    curl \
    wget \
    zip \
    unzip

# Configure timezone
log "🕐 Configuring timezone..."
sudo timedatectl set-timezone Africa/Johannesburg

# Create systemd service for automatic startup
log "⚙️ Creating systemd service..."
sudo tee /etc/systemd/system/gadgetshack.service > /dev/null <<EOF
[Unit]
Description=GadgetShack E-commerce Platform
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/gadgetshack
ExecStart=/usr/local/bin/docker-compose -f docker-compose.production.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.production.yml down
User=$USER
Group=$USER

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable gadgetshack

# Create backup directory
log "💾 Creating backup directory..."
sudo mkdir -p /opt/backups
sudo chown $USER:$USER /opt/backups

# Setup cron job for backups
log "⏰ Setting up backup cron job..."
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/gadgetshack/scripts/backup.sh") | crontab -

# Final system optimization
log "⚡ Applying system optimizations..."
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
echo 'net.core.rmem_max=16777216' | sudo tee -a /etc/sysctl.conf
echo 'net.core.wmem_max=16777216' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

log "=============================================="
log "✅ Server setup completed successfully!"
log "=============================================="
log "📋 Next steps:"
log "1. Logout and login again to apply docker group membership"
log "2. Clone your GadgetShack repository to /opt/gadgetshack"
log "3. Configure environment variables"
log "4. Run the deployment script"
log "=============================================="
log "🔑 SSH Public Key (add to GitHub):"
cat ~/.ssh/id_rsa.pub
log "=============================================="

info "Server is ready for GadgetShack deployment!"
