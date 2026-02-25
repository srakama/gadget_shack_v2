#!/bin/bash

# GadgetShack Production Deployment Script
# This script handles the complete deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="gadgetshack.co.za"
EMAIL="admin@gadgetshack.co.za"
BACKUP_DIR="./backups"
LOG_FILE="./logs/deployment.log"

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    mkdir -p logs backups ssl uploads monitoring/grafana/dashboards monitoring/grafana/datasources
    chmod 755 logs backups uploads
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check if .env.production exists
    if [ ! -f ".env.production" ]; then
        warn ".env.production not found. Creating from example..."
        cp .env.production.example .env.production
        error "Please configure .env.production with your actual values before deploying."
    fi
    
    log "Prerequisites check completed ✓"
}

# Setup SSL certificates
setup_ssl() {
    log "Setting up SSL certificates..."
    
    if [ ! -f "ssl/fullchain.pem" ] || [ ! -f "ssl/privkey.pem" ]; then
        info "SSL certificates not found. Setting up Let's Encrypt..."
        
        # Create temporary nginx config for certificate generation
        cat > nginx/nginx-certbot.conf << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}
EOF
        
        # Start nginx for certificate generation
        docker run --rm -d \
            --name nginx-certbot \
            -p 80:80 \
            -v $(pwd)/nginx/nginx-certbot.conf:/etc/nginx/conf.d/default.conf \
            -v $(pwd)/ssl:/var/www/certbot \
            nginx:alpine
        
        # Generate certificates
        docker run --rm \
            -v $(pwd)/ssl:/etc/letsencrypt \
            -v $(pwd)/ssl:/var/www/certbot \
            certbot/certbot certonly \
            --webroot \
            --webroot-path=/var/www/certbot \
            --email $EMAIL \
            --agree-tos \
            --no-eff-email \
            -d $DOMAIN \
            -d www.$DOMAIN
        
        # Stop temporary nginx
        docker stop nginx-certbot
        
        # Copy certificates to ssl directory
        cp ssl/live/$DOMAIN/fullchain.pem ssl/
        cp ssl/live/$DOMAIN/privkey.pem ssl/
        
        log "SSL certificates generated ✓"
    else
        log "SSL certificates already exist ✓"
    fi
}

# Database migration
migrate_database() {
    log "Checking database migration..."
    
    if [ -f "backend/data/gadgetshack.db" ]; then
        info "SQLite database found. Migrating to PostgreSQL..."
        
        # Start PostgreSQL container
        docker-compose -f docker-compose.production.yml up -d postgres
        
        # Wait for PostgreSQL to be ready
        sleep 30
        
        # Install migration dependencies
        cd database
        npm install sqlite3 pg
        
        # Run migration
        node migrate-to-postgresql.js
        
        cd ..
        
        log "Database migration completed ✓"
    else
        log "No SQLite database found. Starting fresh ✓"
    fi
}

# Build and deploy
deploy() {
    log "Starting deployment..."
    
    # Pull latest images
    docker-compose -f docker-compose.production.yml pull
    
    # Build custom images
    docker-compose -f docker-compose.production.yml build --no-cache
    
    # Start services
    docker-compose -f docker-compose.production.yml up -d
    
    log "Deployment completed ✓"
}

# Health check
health_check() {
    log "Performing health checks..."
    
    # Wait for services to start
    sleep 60
    
    # Check backend health
    if curl -f http://localhost:9000/health > /dev/null 2>&1; then
        log "Backend health check passed ✓"
    else
        error "Backend health check failed ✗"
    fi
    
    # Check frontend health
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        log "Frontend health check passed ✓"
    else
        error "Frontend health check failed ✗"
    fi
    
    # Check database connection
    if docker-compose -f docker-compose.production.yml exec -T postgres pg_isready -U gadgetshack_user > /dev/null 2>&1; then
        log "Database health check passed ✓"
    else
        error "Database health check failed ✗"
    fi
    
    log "All health checks passed ✓"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Create Prometheus config
    cat > monitoring/prometheus.yml << EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'gadgetshack-backend'
    static_configs:
      - targets: ['backend:9000']
    metrics_path: '/metrics'
    
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:8080']
    metrics_path: '/nginx_status'
EOF

    # Create Grafana datasource
    cat > monitoring/grafana/datasources/prometheus.yml << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
EOF

    log "Monitoring setup completed ✓"
}

# Backup current deployment
backup_current() {
    if [ -d "backups" ]; then
        log "Creating backup of current deployment..."
        
        BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
        mkdir -p "$BACKUP_DIR/$BACKUP_NAME"
        
        # Backup database
        docker-compose -f docker-compose.production.yml exec -T postgres pg_dump -U gadgetshack_user gadgetshack > "$BACKUP_DIR/$BACKUP_NAME/database.sql"
        
        # Backup uploads
        cp -r uploads "$BACKUP_DIR/$BACKUP_NAME/"
        
        # Backup configuration
        cp .env.production "$BACKUP_DIR/$BACKUP_NAME/"
        
        log "Backup created: $BACKUP_NAME ✓"
    fi
}

# Cleanup old backups
cleanup_backups() {
    log "Cleaning up old backups..."
    find "$BACKUP_DIR" -type d -name "backup-*" -mtime +30 -exec rm -rf {} \; 2>/dev/null || true
    log "Old backups cleaned up ✓"
}

# Main deployment process
main() {
    log "🚀 Starting GadgetShack Production Deployment"
    log "=============================================="
    
    # Create log file
    mkdir -p logs
    touch "$LOG_FILE"
    
    create_directories
    check_prerequisites
    backup_current
    setup_ssl
    migrate_database
    setup_monitoring
    deploy
    health_check
    cleanup_backups
    
    log "=============================================="
    log "🎉 Deployment completed successfully!"
    log "=============================================="
    log "🌐 Website: https://$DOMAIN"
    log "📊 Monitoring: http://localhost:3001 (Grafana)"
    log "📈 Metrics: http://localhost:9090 (Prometheus)"
    log "📋 Logs: docker-compose -f docker-compose.production.yml logs -f"
    log "=============================================="
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "health")
        health_check
        ;;
    "backup")
        backup_current
        ;;
    "ssl")
        setup_ssl
        ;;
    "logs")
        docker-compose -f docker-compose.production.yml logs -f
        ;;
    "stop")
        log "Stopping services..."
        docker-compose -f docker-compose.production.yml down
        log "Services stopped ✓"
        ;;
    "restart")
        log "Restarting services..."
        docker-compose -f docker-compose.production.yml restart
        log "Services restarted ✓"
        ;;
    "update")
        log "Updating deployment..."
        docker-compose -f docker-compose.production.yml pull
        docker-compose -f docker-compose.production.yml up -d
        health_check
        log "Update completed ✓"
        ;;
    *)
        echo "Usage: $0 {deploy|health|backup|ssl|logs|stop|restart|update}"
        echo ""
        echo "Commands:"
        echo "  deploy  - Full deployment process (default)"
        echo "  health  - Run health checks"
        echo "  backup  - Create backup"
        echo "  ssl     - Setup SSL certificates"
        echo "  logs    - View application logs"
        echo "  stop    - Stop all services"
        echo "  restart - Restart all services"
        echo "  update  - Update and restart services"
        exit 1
        ;;
esac
