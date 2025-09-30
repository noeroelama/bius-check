#!/bin/bash

# Change Admin Password Script for Beasiswa ITB Status Checker

set -e

# Configuration
BACKEND_DIR="$(pwd)/backend"
SCRIPT_DIR="$(pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "$BACKEND_DIR/server.py" ] || [ ! -f "deploy.sh" ]; then
    print_error "Please run this script from the beasiswa-checker root directory"
    exit 1
fi

# Function to change password via Python script
change_password_python() {
    local new_password="$1"
    
    print_status "Creating password change script..."
    
    cat > "/tmp/change_admin_password.py" << EOF
import sys
import os
import hashlib
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

# Load environment
ROOT_DIR = Path(__file__).parent
env_path = "$BACKEND_DIR/.env"
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    print("Error: Backend .env file not found")
    sys.exit(1)

# Get MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/beasiswa_production')
db_name = os.environ.get('DB_NAME', 'beasiswa_production')

def get_password_hash(password):
    return hashlib.sha256(password.encode()).hexdigest()

async def change_admin_password(new_password):
    try:
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        # Hash the new password
        hashed_password = get_password_hash(new_password)
        
        # Update admin password
        result = await db.admins.update_one(
            {"username": "admin"},
            {"\$set": {"hashed_password": hashed_password}}
        )
        
        if result.modified_count > 0:
            print("✅ Admin password changed successfully!")
            return True
        else:
            print("❌ Admin user not found")
            return False
            
    except Exception as e:
        print(f"❌ Error changing password: {e}")
        return False
    finally:
        client.close()

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 change_admin_password.py <new_password>")
        sys.exit(1)
    
    new_password = sys.argv[1]
    success = asyncio.run(change_admin_password(new_password))
    sys.exit(0 if success else 1)
EOF

    print_status "Changing admin password..."
    
    # Activate virtual environment and run script
    cd "$BACKEND_DIR"
    if [ -d "venv" ]; then
        source venv/bin/activate
        python3 /tmp/change_admin_password.py "$new_password"
        success=$?
    else
        python3 /tmp/change_admin_password.py "$new_password"
        success=$?
    fi
    
    # Clean up
    rm -f /tmp/change_admin_password.py
    
    return $success
}

# Function to change password via MongoDB CLI
change_password_mongo() {
    local new_password="$1"
    
    print_status "Changing password via MongoDB CLI..."
    
    # Get database name from .env or use default
    DB_NAME="beasiswa_production"
    if [ -f "$BACKEND_DIR/.env" ]; then
        DB_NAME=$(grep "DB_NAME=" "$BACKEND_DIR/.env" | cut -d'=' -f2 | tr -d '"')
        if [ -z "$DB_NAME" ]; then
            DB_NAME="beasiswa_production"
        fi
    fi
    
    # Hash password using Python (same method as backend)
    hashed_password=$(python3 -c "import hashlib; print(hashlib.sha256('$new_password'.encode()).hexdigest())")
    
    # Update via MongoDB
    mongosh --eval "
        db = db.getSiblingDB('$DB_NAME');
        result = db.admins.updateOne(
            {'username': 'admin'},
            {\$set: {'hashed_password': '$hashed_password'}}
        );
        if (result.modifiedCount > 0) {
            print('✅ Admin password changed successfully!');
        } else {
            print('❌ Admin user not found');
            quit(1);
        }
    "
}

# Main function
main() {
    echo "🔐 Beasiswa ITB Status Checker - Admin Password Changer"
    echo ""
    
    # Get new password
    if [ -n "$1" ]; then
        new_password="$1"
    else
        echo -n "Enter new admin password: "
        read -s new_password
        echo ""
        echo -n "Confirm new admin password: "
        read -s confirm_password
        echo ""
        
        if [ "$new_password" != "$confirm_password" ]; then
            print_error "Passwords do not match"
            exit 1
        fi
    fi
    
    if [ ${#new_password} -lt 6 ]; then
        print_error "Password must be at least 6 characters long"
        exit 1
    fi
    
    print_warning "This will change the admin password for the Beasiswa ITB Status Checker"
    echo -n "Are you sure? (y/N): "
    read -r confirm
    
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        print_status "Password change cancelled"
        exit 0
    fi
    
    # Try Python method first, fallback to MongoDB CLI
    if change_password_python "$new_password"; then
        print_success "Password changed successfully using Python method"
    elif command -v mongosh &> /dev/null; then
        print_status "Trying MongoDB CLI method..."
        if change_password_mongo "$new_password"; then
            print_success "Password changed successfully using MongoDB CLI"
        else
            print_error "Failed to change password using MongoDB CLI"
            exit 1
        fi
    else
        print_error "Failed to change password. MongoDB CLI not available."
        print_status "Please install MongoDB CLI (mongosh) or ensure Python dependencies are installed"
        exit 1
    fi
    
    echo ""
    print_success "🎉 Admin password has been changed!"
    print_status "New credentials:"
    echo "   Username: admin"
    echo "   Password: $new_password"
    echo ""
    print_status "You can now login at: https://cek.itbuntuksemua.com/admin"
}

# Show help
show_help() {
    echo "Beasiswa ITB Status Checker - Change Admin Password"
    echo ""
    echo "Usage: $0 [new_password]"
    echo ""
    echo "Options:"
    echo "  new_password  - Optional: Set password directly (not recommended for security)"
    echo "  -h, --help   - Show this help"
    echo ""
    echo "Examples:"
    echo "  $0                    # Interactive password change"
    echo "  $0 mynewpassword123   # Direct password change (less secure)"
    echo ""
    echo "Security Notes:"
    echo "  - Use a strong password (at least 8 characters)"
    echo "  - Include numbers, letters, and special characters"
    echo "  - Don't use common passwords or dictionary words"
}

# Handle command line arguments
case "${1:-}" in
    -h|--help|help)
        show_help
        exit 0
        ;;
    *)
        main "$1"
        ;;
esac