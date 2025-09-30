#!/bin/bash

# Beasiswa ITB Status Checker Deployment Script
# Usage: ./deploy.sh [start|stop|restart|status|logs|clean]

set -e

# Configuration
PROJECT_NAME="beasiswa-checker"
BACKEND_PORT=8889
FRONTEND_PORT=3000
MONGO_PORT=27017

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    if check_port $port; then
        warn "Port $port is in use. Killing existing processes..."
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Function to check if MongoDB is running
check_mongodb() {
    if pgrep mongod > /dev/null; then
        log "MongoDB is running"
        return 0
    else
        return 1
    fi
}

# Function to start MongoDB
start_mongodb() {
    if ! check_mongodb; then
        log "Starting MongoDB..."
        if command -v systemctl > /dev/null; then
            sudo systemctl start mongod || {
                error "Failed to start MongoDB with systemctl"
                info "Trying to start MongoDB manually..."
                mongod --fork --logpath /var/log/mongodb/mongod.log --dbpath /var/lib/mongodb
            }
        else
            mongod --fork --logpath /var/log/mongodb/mongod.log --dbpath /var/lib/mongodb
        fi
        sleep 3
    fi
}

# Function to stop MongoDB
stop_mongodb() {
    if check_mongodb; then
        log "Stopping MongoDB..."
        if command -v systemctl > /dev/null; then
            sudo systemctl stop mongod || true
        else
            pkill mongod || true
        fi
    fi
}

# Function to setup environment files
setup_env() {
    log "Setting up environment files..."
    
    # Backend .env
    if [ ! -f "backend/.env" ]; then
        log "Creating backend/.env file..."
        cat > backend/.env << EOF
# Database Configuration
MONGO_URL=mongodb://localhost:27017
DB_NAME=beasiswa_db

# JWT Configuration
JWT_SECRET=beasiswa-itb-secret-key-2024-very-secure

# Admin Configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# CORS Configuration
CORS_ORIGINS=http://localhost:8889,http://127.0.0.1:8889

# Server Configuration
PORT=8889
EOF
    else
        log "Backend .env file already exists"
    fi
    
    # Frontend .env
    if [ ! -f "frontend/.env" ]; then
        log "Creating frontend/.env file..."
        cat > frontend/.env << EOF
# Backend API URL
REACT_APP_BACKEND_URL=http://localhost:8889

# Build Configuration
GENERATE_SOURCEMAP=false
EOF
    else
        log "Frontend .env file already exists"
    fi
}

# Function to install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    # Backend dependencies
    if [ -d "backend" ]; then
        log "Installing Python dependencies..."
        cd backend
        if [ ! -d "venv" ]; then
            python3 -m venv venv
        fi
        source venv/bin/activate
        pip install -r requirements.txt
        cd ..
    fi
    
    # Frontend dependencies
    if [ -d "frontend" ]; then
        log "Installing Node.js dependencies..."
        cd frontend
        npm install || yarn install
        cd ..
    fi
}

# Function to start backend
start_backend() {
    log "Starting FastAPI backend on port $BACKEND_PORT..."
    cd backend
    source venv/bin/activate
    nohup uvicorn server:app --host 0.0.0.0 --port $BACKEND_PORT --reload > ../backend.log 2>&1 &
    echo $! > ../backend.pid
    cd ..
    sleep 3
    if check_port $BACKEND_PORT; then
        log "Backend started successfully on port $BACKEND_PORT"
    else
        error "Failed to start backend"
        exit 1
    fi
}

# Function to start frontend
start_frontend() {
    log "Building and serving React frontend..."
    cd frontend
    
    # Build the frontend
    npm run build
    
    # Serve the built frontend using Python's built-in server
    nohup python3 -m http.server $FRONTEND_PORT --directory build > ../frontend.log 2>&1 &
    echo $! > ../frontend.pid
    cd ..
    sleep 3
    if check_port $FRONTEND_PORT; then
        log "Frontend started successfully on port $FRONTEND_PORT"
    else
        error "Failed to start frontend"
        exit 1
    fi
}

# Function to setup nginx proxy (optional)
setup_nginx_proxy() {
    if command -v nginx > /dev/null; then
        log "Setting up nginx reverse proxy..."
        cat > /tmp/beasiswa-nginx.conf << EOF
server {
    listen 8889;
    server_name localhost;

    # Frontend (React app)
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8889;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
        info "Nginx configuration created at /tmp/beasiswa-nginx.conf"
        info "To enable: sudo cp /tmp/beasiswa-nginx.conf /etc/nginx/sites-available/beasiswa && sudo ln -s /etc/nginx/sites-available/beasiswa /etc/nginx/sites-enabled/"
    fi
}

# Function to start all services
start_services() {
    log "Starting Beasiswa ITB Status Checker..."
    
    # Kill existing processes on required ports
    kill_port $BACKEND_PORT
    kill_port $FRONTEND_PORT
    
    # Setup environment
    setup_env
    
    # Start MongoDB
    start_mongodb
    
    # Install dependencies
    install_dependencies
    
    # Start services
    start_backend
    start_frontend
    
    # Display status
    echo ""
    log "🎉 Beasiswa ITB Status Checker started successfully!"
    echo ""
    echo -e "${GREEN}📋 Service Information:${NC}"
    echo -e "  ${BLUE}• Application URL:${NC} http://localhost:8889"
    echo -e "  ${BLUE}• Admin Dashboard:${NC} http://localhost:8889/admin"
    echo -e "  ${BLUE}• API Documentation:${NC} http://localhost:8889/docs"
    echo -e "  ${BLUE}• Backend API:${NC} http://localhost:$BACKEND_PORT"
    echo -e "  ${BLUE}• Frontend:${NC} http://localhost:$FRONTEND_PORT"
    echo ""
    echo -e "${GREEN}🔐 Admin Credentials:${NC}"
    echo -e "  ${BLUE}• Username:${NC} admin"
    echo -e "  ${BLUE}• Password:${NC} admin123"
    echo ""
    echo -e "${GREEN}📝 Useful Commands:${NC}"
    echo -e "  ${BLUE}• View status:${NC} ./deploy.sh status"
    echo -e "  ${BLUE}• View logs:${NC} ./deploy.sh logs"
    echo -e "  ${BLUE}• Stop services:${NC} ./deploy.sh stop"
    echo ""
}

# Function to stop all services
stop_services() {
    log "Stopping Beasiswa ITB Status Checker..."
    
    # Stop backend
    if [ -f "backend.pid" ]; then
        kill $(cat backend.pid) 2>/dev/null || true
        rm -f backend.pid
    fi
    kill_port $BACKEND_PORT
    
    # Stop frontend
    if [ -f "frontend.pid" ]; then
        kill $(cat frontend.pid) 2>/dev/null || true
        rm -f frontend.pid
    fi
    kill_port $FRONTEND_PORT
    
    # Stop MongoDB (optional)
    # stop_mongodb
    
    log "All services stopped"
}

# Function to restart services
restart_services() {
    log "Restarting services..."
    stop_services
    sleep 3
    start_services
}

# Function to show service status
show_status() {
    echo -e "${GREEN}🔍 Service Status:${NC}"
    echo ""
    
    # Check MongoDB
    if check_mongodb; then
        echo -e "  ${GREEN}✅ MongoDB:${NC} Running"
    else
        echo -e "  ${RED}❌ MongoDB:${NC} Not running"
    fi
    
    # Check Backend
    if check_port $BACKEND_PORT; then
        echo -e "  ${GREEN}✅ Backend:${NC} Running on port $BACKEND_PORT"
    else
        echo -e "  ${RED}❌ Backend:${NC} Not running"
    fi
    
    # Check Frontend
    if check_port $FRONTEND_PORT; then
        echo -e "  ${GREEN}✅ Frontend:${NC} Running on port $FRONTEND_PORT"
    else
        echo -e "  ${RED}❌ Frontend:${NC} Not running"
    fi
    
    echo ""
    echo -e "${BLUE}📊 Process Information:${NC}"
    ps aux | grep -E "(uvicorn|python3.*server|python3.*http.server|mongod)" | grep -v grep || echo "  No processes found"
}

# Function to show logs
show_logs() {
    echo -e "${GREEN}📋 Recent Logs:${NC}"
    echo ""
    
    if [ -f "backend.log" ]; then
        echo -e "${BLUE}🔗 Backend Logs (last 20 lines):${NC}"
        tail -20 backend.log
        echo ""
    fi
    
    if [ -f "frontend.log" ]; then
        echo -e "${BLUE}🖥️  Frontend Logs (last 20 lines):${NC}"
        tail -20 frontend.log
        echo ""
    fi
    
    echo -e "${BLUE}📁 Log files location:${NC}"
    echo "  • Backend: $(pwd)/backend.log"
    echo "  • Frontend: $(pwd)/frontend.log"
}

# Function to clean build and restart
clean_restart() {
    log "Cleaning and restarting..."
    
    stop_services
    
    # Clean frontend build
    if [ -d "frontend/build" ]; then
        rm -rf frontend/build
    fi
    
    # Clean backend cache
    if [ -d "backend/__pycache__" ]; then
        rm -rf backend/__pycache__
    fi
    
    # Clean logs
    rm -f backend.log frontend.log
    
    start_services
}

# Main script logic
case "${1:-start}" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    clean)
        clean_restart
        ;;
    nginx)
        setup_nginx_proxy
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|clean|nginx}"
        echo ""
        echo "Commands:"
        echo "  start   - Start all services (default)"
        echo "  stop    - Stop all services"
        echo "  restart - Restart all services"
        echo "  status  - Show service status"
        echo "  logs    - Show recent logs"
        echo "  clean   - Clean build and restart"
        echo "  nginx   - Setup nginx reverse proxy config"
        exit 1
        ;;
esac