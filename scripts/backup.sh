#!/bin/bash

# GadgetShack Automated Backup Script
# Handles database, file, and configuration backups

set -e

# Configuration
BACKUP_DIR="/backups"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="gadgetshack_backup_$DATE"
LOG_FILE="/app/logs/backup.log"

# AWS S3 Configuration (optional)
S3_BUCKET="${BACKUP_S3_BUCKET:-}"
AWS_REGION="${AWS_REGION:-af-south-1}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

# Create backup directory
create_backup_dir() {
    mkdir -p "$BACKUP_DIR/$BACKUP_NAME"
    log "Created backup directory: $BACKUP_DIR/$BACKUP_NAME"
}

# Backup PostgreSQL database
backup_database() {
    log "Starting database backup..."
    
    # Database connection details
    DB_HOST="${POSTGRES_HOST:-postgres}"
    DB_PORT="${POSTGRES_PORT:-5432}"
    DB_NAME="${POSTGRES_DB:-gadgetshack}"
    DB_USER="${POSTGRES_USER:-gadgetshack_user}"
    
    # Create database dump
    PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose \
        --clean \
        --if-exists \
        --create \
        --format=custom \
        > "$BACKUP_DIR/$BACKUP_NAME/database.dump"
    
    # Also create SQL format for easier inspection
    PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose \
        --clean \
        --if-exists \
        --create \
        > "$BACKUP_DIR/$BACKUP_NAME/database.sql"
    
    # Compress SQL file
    gzip "$BACKUP_DIR/$BACKUP_NAME/database.sql"
    
    log "Database backup completed ✓"
}

# Backup uploaded files
backup_files() {
    log "Starting file backup..."
    
    if [ -d "/app/uploads" ]; then
        tar -czf "$BACKUP_DIR/$BACKUP_NAME/uploads.tar.gz" -C /app uploads/
        log "File backup completed ✓"
    else
        warn "Uploads directory not found, skipping file backup"
    fi
}

# Backup configuration files
backup_config() {
    log "Starting configuration backup..."
    
    # Create config directory
    mkdir -p "$BACKUP_DIR/$BACKUP_NAME/config"
    
    # Backup environment file (without sensitive data)
    if [ -f "/app/.env.production" ]; then
        # Remove sensitive values for security
        sed 's/=.*/=***REDACTED***/g' /app/.env.production > "$BACKUP_DIR/$BACKUP_NAME/config/env.example"
    fi
    
    # Backup docker-compose file
    if [ -f "/app/docker-compose.production.yml" ]; then
        cp /app/docker-compose.production.yml "$BACKUP_DIR/$BACKUP_NAME/config/"
    fi
    
    # Backup nginx configuration
    if [ -d "/app/nginx" ]; then
        tar -czf "$BACKUP_DIR/$BACKUP_NAME/config/nginx.tar.gz" -C /app nginx/
    fi
    
    log "Configuration backup completed ✓"
}

# Create backup metadata
create_metadata() {
    log "Creating backup metadata..."
    
    cat > "$BACKUP_DIR/$BACKUP_NAME/metadata.json" << EOF
{
    "backup_name": "$BACKUP_NAME",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "version": "$(cat /app/package.json | grep version | cut -d'"' -f4 2>/dev/null || echo 'unknown')",
    "database_size": "$(du -h $BACKUP_DIR/$BACKUP_NAME/database.dump | cut -f1)",
    "files_size": "$(du -h $BACKUP_DIR/$BACKUP_NAME/uploads.tar.gz 2>/dev/null | cut -f1 || echo '0')",
    "total_size": "$(du -sh $BACKUP_DIR/$BACKUP_NAME | cut -f1)",
    "retention_until": "$(date -d '+$RETENTION_DAYS days' -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
    
    log "Backup metadata created ✓"
}

# Upload to S3 (if configured)
upload_to_s3() {
    if [ -n "$S3_BUCKET" ] && command -v aws &> /dev/null; then
        log "Uploading backup to S3..."
        
        # Create compressed archive
        tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" -C "$BACKUP_DIR" "$BACKUP_NAME"
        
        # Upload to S3
        aws s3 cp "$BACKUP_DIR/$BACKUP_NAME.tar.gz" "s3://$S3_BUCKET/backups/" \
            --region "$AWS_REGION" \
            --storage-class STANDARD_IA
        
        # Remove local compressed archive
        rm "$BACKUP_DIR/$BACKUP_NAME.tar.gz"
        
        log "Backup uploaded to S3 ✓"
    else
        log "S3 upload skipped (not configured or AWS CLI not available)"
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up old backups..."
    
    # Remove local backups older than retention period
    find "$BACKUP_DIR" -type d -name "gadgetshack_backup_*" -mtime +$RETENTION_DAYS -exec rm -rf {} \; 2>/dev/null || true
    
    # Cleanup S3 backups if configured
    if [ -n "$S3_BUCKET" ] && command -v aws &> /dev/null; then
        # List and delete old S3 backups
        aws s3 ls "s3://$S3_BUCKET/backups/" --region "$AWS_REGION" | \
        while read -r line; do
            backup_date=$(echo "$line" | awk '{print $1}')
            backup_file=$(echo "$line" | awk '{print $4}')
            
            if [ -n "$backup_date" ] && [ -n "$backup_file" ]; then
                # Calculate age in days
                backup_timestamp=$(date -d "$backup_date" +%s)
                current_timestamp=$(date +%s)
                age_days=$(( (current_timestamp - backup_timestamp) / 86400 ))
                
                if [ $age_days -gt $RETENTION_DAYS ]; then
                    aws s3 rm "s3://$S3_BUCKET/backups/$backup_file" --region "$AWS_REGION"
                    log "Removed old S3 backup: $backup_file"
                fi
            fi
        done
    fi
    
    log "Cleanup completed ✓"
}

# Verify backup integrity
verify_backup() {
    log "Verifying backup integrity..."
    
    # Check database dump
    if [ -f "$BACKUP_DIR/$BACKUP_NAME/database.dump" ]; then
        if pg_restore --list "$BACKUP_DIR/$BACKUP_NAME/database.dump" > /dev/null 2>&1; then
            log "Database backup verification passed ✓"
        else
            error "Database backup verification failed ✗"
        fi
    fi
    
    # Check file archive
    if [ -f "$BACKUP_DIR/$BACKUP_NAME/uploads.tar.gz" ]; then
        if tar -tzf "$BACKUP_DIR/$BACKUP_NAME/uploads.tar.gz" > /dev/null 2>&1; then
            log "File backup verification passed ✓"
        else
            error "File backup verification failed ✗"
        fi
    fi
    
    log "Backup verification completed ✓"
}

# Send notification (if configured)
send_notification() {
    local status=$1
    local message=$2
    
    # Email notification (if configured)
    if command -v mail &> /dev/null && [ -n "$NOTIFICATION_EMAIL" ]; then
        echo "$message" | mail -s "GadgetShack Backup $status" "$NOTIFICATION_EMAIL"
    fi
    
    # Slack notification (if configured)
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"GadgetShack Backup $status: $message\"}" \
            "$SLACK_WEBHOOK_URL" > /dev/null 2>&1 || true
    fi
}

# Main backup process
main() {
    log "🔄 Starting GadgetShack backup process"
    log "======================================"
    
    # Ensure log directory exists
    mkdir -p "$(dirname "$LOG_FILE")"
    
    start_time=$(date +%s)
    
    # Perform backup steps
    create_backup_dir
    backup_database
    backup_files
    backup_config
    create_metadata
    verify_backup
    upload_to_s3
    cleanup_old_backups
    
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    
    log "======================================"
    log "✅ Backup completed successfully!"
    log "Backup location: $BACKUP_DIR/$BACKUP_NAME"
    log "Duration: ${duration}s"
    log "======================================"
    
    # Send success notification
    send_notification "SUCCESS" "Backup completed successfully in ${duration}s. Location: $BACKUP_DIR/$BACKUP_NAME"
}

# Error handling
trap 'error "Backup failed at line $LINENO"' ERR

# Handle script arguments
case "${1:-backup}" in
    "backup")
        main
        ;;
    "restore")
        if [ -z "$2" ]; then
            error "Please specify backup name to restore: $0 restore <backup_name>"
        fi
        log "Restoring from backup: $2"
        # Restore logic would go here
        ;;
    "list")
        log "Available backups:"
        ls -la "$BACKUP_DIR" | grep gadgetshack_backup_ || log "No backups found"
        ;;
    "cleanup")
        cleanup_old_backups
        ;;
    *)
        echo "Usage: $0 {backup|restore|list|cleanup}"
        echo ""
        echo "Commands:"
        echo "  backup           - Create new backup (default)"
        echo "  restore <name>   - Restore from backup"
        echo "  list             - List available backups"
        echo "  cleanup          - Remove old backups"
        exit 1
        ;;
esac
