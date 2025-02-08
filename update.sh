#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Application directory
APP_DIR="/var/www/html/my-app"
BACKUP_DIR="/var/www/html/backups"

# Log file
LOG_FILE="/var/log/app-update.log"

# Function to log messages
log_message() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $1" >> "$LOG_FILE"
    echo -e "$1"
}

# Function to check if command succeeded
check_error() {
    if [ $? -ne 0 ]; then
        log_message "${RED}Error: $1${NC}"
        exit 1
    fi
}

# Function to create backup
create_backup() {
    local backup_name="my-app-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    log_message "${YELLOW}Creating backup...${NC}"
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    check_error "Failed to create backup directory"
    
    # Create backup
    tar -czf "$BACKUP_DIR/$backup_name" -C /var/www/html my-app
    check_error "Failed to create backup"
    
    # Save .env file separately
    cp "$APP_DIR/.env" "$BACKUP_DIR/.env-$(date +%Y%m%d-%H%M%S)"
    check_error "Failed to backup .env file"
    
    log_message "${GREEN}Backup created successfully: $backup_name${NC}"
    echo "$backup_name"
}

# Function to update application
update_app() {
    log_message "${YELLOW}Starting update process...${NC}"
    
    # Create backup before update
    local backup_file=$(create_backup)
    
    cd "$APP_DIR" || exit 1
    
    # Stash any local changes
    log_message "Stashing local changes..."
    git stash
    
    # Pull latest changes
    log_message "Pulling latest changes from GitHub..."
    git pull origin main
    check_error "Failed to pull latest changes"
    
    # Update dependencies
    log_message "Updating dependencies..."
    rm -rf node_modules package-lock.json
    npm install
    check_error "Failed to install dependencies"
    
    # Build application
    log_message "Building application..."
    npm run build
    check_error "Failed to build application"
    
    # Update permissions
    log_message "Updating permissions..."
    chown -R www-data:www-data .
    chmod -R 755 .
    
    # Restart services
    log_message "Restarting services..."
    pm2 restart all
    systemctl reload nginx
    
    log_message "${GREEN}Update completed successfully!${NC}"
    log_message "Backup file: $backup_file"
}

# Function to list available backups
list_backups() {
    log_message "${YELLOW}Available backups:${NC}"
    ls -lt "$BACKUP_DIR" | grep "my-app-backup-" | awk '{print $9}'
}

# Function to rollback to a specific backup
rollback() {
    local backup_file="$1"
    
    if [ ! -f "$BACKUP_DIR/$backup_file" ]; then
        log_message "${RED}Error: Backup file not found${NC}"
        exit 1
    fi
    
    log_message "${YELLOW}Starting rollback process to $backup_file...${NC}"
    
    # Create backup of current state before rollback
    create_backup
    
    # Stop services
    log_message "Stopping services..."
    pm2 stop all
    
    # Remove current application
    log_message "Removing current application..."
    rm -rf "$APP_DIR"
    mkdir -p "$APP_DIR"
    
    # Extract backup
    log_message "Restoring from backup..."
    tar -xzf "$BACKUP_DIR/$backup_file" -C /var/www/html
    check_error "Failed to restore backup"
    
    # Restore permissions
    log_message "Restoring permissions..."
    chown -R www-data:www-data "$APP_DIR"
    chmod -R 755 "$APP_DIR"
    
    # Restart services
    log_message "Restarting services..."
    pm2 restart all
    systemctl reload nginx
    
    log_message "${GREEN}Rollback completed successfully!${NC}"
}

# Main menu
show_menu() {
    echo -e "\n${YELLOW}=== Application Management Script ===${NC}"
    echo "1. Update application from GitHub"
    echo "2. List available backups"
    echo "3. Rollback to previous version"
    echo "4. View update log"
    echo "5. Exit"
    echo -e "${YELLOW}===================================${NC}\n"
}

# Initialize log file
touch "$LOG_FILE"
chmod 644 "$LOG_FILE"

# Main loop
while true; do
    show_menu
    read -p "Please select an option (1-5): " choice
    
    case $choice in
        1)
            read -p "Are you sure you want to update the application? (y/n): " confirm
            if [ "$confirm" = "y" ]; then
                update_app
            fi
            ;;
        2)
            list_backups
            ;;
        3)
            list_backups
            echo
            read -p "Enter the backup filename to rollback to: " backup_file
            if [ -n "$backup_file" ]; then
                read -p "Are you sure you want to rollback to $backup_file? (y/n): " confirm
                if [ "$confirm" = "y" ]; then
                    rollback "$backup_file"
                fi
            fi
            ;;
        4)
            if [ -f "$LOG_FILE" ]; then
                less "$LOG_FILE"
            else
                log_message "${RED}Log file not found${NC}"
            fi
            ;;
        5)
            log_message "${GREEN}Exiting...${NC}"
            exit 0
            ;;
        *)
            log_message "${RED}Invalid option. Please try again.${NC}"
            ;;
    esac
    
    echo -e "\nPress Enter to continue..."
    read
done