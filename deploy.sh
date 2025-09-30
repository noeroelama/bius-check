#!/bin/bash

# Beasiswa ITB Status Checker - Deployment Script
# Usage: ./deploy.sh [start|stop|restart|status|build|logs]

set -e

# Configuration
APP_NAME="beasiswa-checker"
APP_PORT=8889
BACKEND_DIR="$(pwd)/backend"
FRONTEND_DIR="$(pwd)/frontend"
PID_FILE="/tmp/${APP_NAME}.pid"
LOG_FILE="/tmp/${APP_NAME}.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_dependencies() {
    print_status "Checking dependencies..."
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python3 is not installed"
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    print_success "All dependencies found"
}

install_backend_deps() {
    print_status "Installing backend dependencies..."
    cd "$BACKEND_DIR"
    
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    source venv/bin/activate
    pip install -r requirements.txt
    
    print_success "Backend dependencies installed"
}

install_frontend_deps() {
    print_status "Installing frontend dependencies..."
    cd "$FRONTEND_DIR"
    
    # Clean install for better compatibility
    if [ -d "node_modules" ]; then
        print_status "Cleaning existing node_modules..."
        rm -rf node_modules package-lock.json
    fi
    
    # Try yarn first, then npm with legacy peer deps
    if command -v yarn &> /dev/null; then
        print_status "Using yarn for dependency installation..."
        yarn install
        # Fix Node.js 20 compatibility issue
        npm install ajv@^8.11.0 --legacy-peer-deps
    else
        print_status "Using npm for dependency installation..."
        npm install --legacy-peer-deps
        # Fix Node.js 20 compatibility issue  
        npm install ajv@^8.11.0 --legacy-peer-deps
    fi
    
    print_success "Frontend dependencies installed"
}

build_frontend() {
    print_status "Building frontend..."
    cd "$FRONTEND_DIR"
    
    # Update environment for production
    cat > .env << EOF
REACT_APP_BACKEND_URL=https://cek.itbuntuksemua.com
WDS_SOCKET_PORT=443
GENERATE_SOURCEMAP=false
NODE_ENV=production
REACT_APP_NODE_ENV=production
EOF
    
    # Set production environment
    export NODE_ENV=production
    export REACT_APP_NODE_ENV=production
    
    # Try yarn first, then npm
    if command -v yarn &> /dev/null && [ -f "yarn.lock" ]; then
        print_status "Building with yarn..."
        NODE_ENV=production yarn build
    else
        print_status "Building with npm..."
        NODE_ENV=production npm run build
    fi
    
    print_success "Frontend built successfully"
}

start_app() {
    if is_running; then
        print_warning "Application is already running (PID: $(cat $PID_FILE))"
        return 0
    fi
    
    print_status "Starting $APP_NAME..."
    
    cd "$BACKEND_DIR"
    source venv/bin/activate
    
    # Create backend .env if it doesn't exist
    if [ ! -f ".env" ]; then
        print_status "Creating backend .env file..."
        cat > .env << EOF
DB_NAME=beasiswa_production
JWT_SECRET=beasiswa-itb-secret-$(date +%s)
CORS_ORIGINS=https://cek.itbuntuksemua.com,https://www.cek.itbuntuksemua.com,http://localhost:3000
MONGO_URL=mongodb://localhost:27017/beasiswa_production
EOF
    fi
    
    # Start the application
    nohup python3 -m uvicorn server:app --host 0.0.0.0 --port $APP_PORT > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    
    sleep 3
    
    if is_running; then
        print_success "$APP_NAME started successfully (PID: $(cat $PID_FILE))"
        print_status "Application running on port $APP_PORT"
        print_status "Access: https://cek.itbuntuksemua.com"
        print_status "Admin: https://cek.itbuntuksemua.com/admin"
        print_status "API: https://cek.itbuntuksemua.com/api"
    else
        print_error "Failed to start $APP_NAME"
        cat "$LOG_FILE"
        exit 1
    fi
}

stop_app() {
    if ! is_running; then
        print_warning "Application is not running"
        return 0
    fi
    
    print_status "Stopping $APP_NAME..."
    PID=$(cat "$PID_FILE")
    kill "$PID"
    
    # Wait for process to stop
    for i in {1..10}; do
        if ! is_running; then
            break
        fi
        sleep 1
    done
    
    if is_running; then
        print_warning "Process didn't stop gracefully, forcing..."
        kill -9 "$PID"
    fi
    
    rm -f "$PID_FILE"
    print_success "$APP_NAME stopped"
}

is_running() {
    [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null
}

show_status() {
    if is_running; then
        PID=$(cat "$PID_FILE")
        print_success "$APP_NAME is running (PID: $PID)"
        
        # Show process info
        if command -v ps &> /dev/null; then
            echo "Process info:"
            ps -p "$PID" -o pid,ppid,cpu,pmem,etime,cmd
        fi
        
        # Check if port is listening
        if command -v netstat &> /dev/null; then
            echo "Port status:"
            netstat -tlnp 2>/dev/null | grep ":$APP_PORT " || echo "Port $APP_PORT not found in netstat"
        fi
        
        # Show recent logs
        if [ -f "$LOG_FILE" ]; then
            echo "Recent logs:"
            tail -n 10 "$LOG_FILE"
        fi
    else
        print_warning "$APP_NAME is not running"
    fi
}

show_logs() {
    if [ -f "$LOG_FILE" ]; then
        print_status "Showing logs from $LOG_FILE"
        tail -f "$LOG_FILE"
    else
        print_warning "Log file not found: $LOG_FILE"
    fi
}

setup_systemd() {
    print_status "Setting up systemd service..."
    
    cat > "/tmp/${APP_NAME}.service" << EOF
[Unit]
Description=Beasiswa ITB Status Checker
After=network.target mongodb.service
Requires=mongodb.service

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$BACKEND_DIR
Environment=PATH=$BACKEND_DIR/venv/bin
ExecStart=$BACKEND_DIR/venv/bin/python -m uvicorn server:app --host 0.0.0.0 --port $APP_PORT
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

    print_status "Systemd service file created at /tmp/${APP_NAME}.service"
    print_status "To install: sudo cp /tmp/${APP_NAME}.service /etc/systemd/system/"
    print_status "To enable: sudo systemctl enable $APP_NAME"
    print_status "To start: sudo systemctl start $APP_NAME"
}

full_deploy() {
    print_status "🚀 Starting full deployment..."
    
    check_dependencies
    install_backend_deps
    install_frontend_deps
    build_frontend
    
    if is_running; then
        stop_app
        sleep 2
    fi
    
    start_app
    
    print_success "🎉 Deployment completed successfully!"
    echo ""
    print_status "📋 Application URLs:"
    echo "   🌐 Main Site: https://cek.itbuntuksemua.com"
    echo "   🔧 Admin Panel: https://cek.itbuntuksemua.com/admin"
    echo "   📡 API Docs: https://cek.itbuntuksemua.com/docs"
    echo ""
    print_status "📊 Default Admin Credentials:"
    echo "   Username: admin"
    echo "   Password: admin123"
}

show_help() {
    echo "Beasiswa ITB Status Checker - Deployment Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start     - Start the application"
    echo "  stop      - Stop the application"
    echo "  restart   - Restart the application"
    echo "  status    - Show application status"
    echo "  logs      - Show application logs"
    echo "  build     - Build frontend only"
    echo "  deploy    - Full deployment (install deps, build, start)"
    echo "  password  - Change admin password"
    echo "  systemd   - Generate systemd service file"
    echo "  help      - Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 deploy    # Full deployment"
    echo "  $0 start     # Start application"
    echo "  $0 password  # Change admin password"
    echo "  $0 logs      # View logs"
}

# Main script logic
case "${1:-help}" in
    start)
        start_app
        ;;
    stop)
        stop_app
        ;;
    restart)
        stop_app
        sleep 2
        start_app
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    build)
        install_frontend_deps
        build_frontend
        ;;
    deploy)
        full_deploy
        ;;
    password|passwd|change-password)
        if [ -n "$2" ]; then
            ./change-password.sh "$2"
        else
            ./change-password.sh
        fi
        ;;
    systemd)
        setup_systemd
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac