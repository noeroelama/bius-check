# Beasiswa ITB Status Checker

Simple scholarship application status checker for ITB students.

## Features

- 📋 **Public Status Check** - Students check status with NIM + Email
- 👨‍💼 **Admin Dashboard** - Manage applications with CRUD operations  
- 📊 **CSV Import/Export** - Bulk data management
- 📱 **Mobile Responsive** - Works on all devices
- 🔐 **Secure Admin Access** - Hidden admin panel with JWT authentication

## Quick Deployment

### 1. Setup aaPanel
1. Add website: `cek.itbuntuksemua.com`
2. Enable SSL (Let's Encrypt)  
3. Add reverse proxy: `http://127.0.0.1:8889` → `/`

### 2. Deploy Application
```bash
# Clone and deploy
git clone <your-repo> /path/to/beasiswa-checker
cd /path/to/beasiswa-checker
chmod +x deploy.sh
./deploy.sh deploy
```

### 3. Change Default Password
```bash
./deploy.sh password
# Follow prompts to set new admin password
```

## Usage

### Public Access
- **Main Site**: https://cek.itbuntuksemua.com
- Students enter NIM + Email to check status

### Admin Access  
- **Admin Panel**: https://cek.itbuntuksemua.com/admin
- **Default Login**: admin / admin123 (change immediately!)

## Commands

```bash
./deploy.sh start      # Start application
./deploy.sh stop       # Stop application  
./deploy.sh restart    # Restart application
./deploy.sh status     # Check status
./deploy.sh logs       # View logs
./deploy.sh password   # Change admin password
./deploy.sh deploy     # Full deployment
```

## Requirements

- Node.js 18+
- Python 3.9+
- MongoDB
- aaPanel (for deployment)

## Architecture

- **Frontend**: React (served by FastAPI)
- **Backend**: FastAPI + MongoDB
- **Port**: Single port 8889 (internal)
- **Domain**: Proxied through aaPanel

## Support

Check logs if issues occur:
```bash
./deploy.sh logs
./deploy.sh status
```

That's it! Simple deployment for ITB scholarship management.
