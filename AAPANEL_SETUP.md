# aaPanel Setup Guide for Beasiswa ITB Status Checker

## Quick Setup Instructions

### Prerequisites
- Node.js 18+ or 20+ installed
- Python 3.9+ installed
- MongoDB installed and running
- Git installed

### 1. aaPanel Website Setup
1. Go to **Website** → **Add Site**
2. Enter domain: `cek.itbuntuksemua.com`
3. Choose **Static** or **PHP** (doesn't matter - we'll use reverse proxy)
4. Click **Submit**

### 2. SSL Certificate (Let's Encrypt)
1. Click on your website name
2. Go to **SSL** tab
3. Select **Let's Encrypt**
4. Enter domains: `cek.itbuntuksemua.com` and `www.cek.itbuntuksemua.com`
5. Click **Apply** - aaPanel will automatically get and install SSL

### 3. Reverse Proxy Setup
1. Click on your website name
2. Go to **Reverse Proxy** tab
3. Click **Add Reverse Proxy**
4. Configure as follows:

**Proxy Configuration:**
```
Target URL: http://127.0.0.1:8889
Proxy Directory: /
Proxy Domain: cek.itbuntuksemua.com
Send Domain: $host
```

**Advanced Settings (click "Show Advanced"):**
```
Request Headers:
X-Real-IP: $remote_addr
X-Forwarded-For: $proxy_add_x_forwarded_for  
X-Forwarded-Proto: $scheme
Host: $host

Response Headers:
Access-Control-Allow-Origin: https://cek.itbuntuksemua.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

5. Click **Submit**

### 4. Deploy Application
On your server, run these commands:

```bash
# Clone your repository (if not already done)
git clone <your-repo> /path/to/beasiswa-checker
cd /path/to/beasiswa-checker

# Make deploy script executable
chmod +x deploy.sh

# Run full deployment
./deploy.sh deploy
```

**Note:** The deploy script automatically handles the Node.js 20 compatibility issue by installing the correct ajv version.

### 5. Application Management Commands

```bash
# Start application
./deploy.sh start

# Stop application  
./deploy.sh stop

# Restart application
./deploy.sh restart

# Check status
./deploy.sh status

# View logs
./deploy.sh logs

# Build frontend only
./deploy.sh build

# Full deployment (install deps, build, start)
./deploy.sh deploy
```

## Troubleshooting Node.js Issues

### If you get "Cannot find module 'ajv/dist/compile/codegen'" error:
The deploy script automatically fixes this, but if you encounter it manually:

```bash
cd frontend
npm install ajv@^8.11.0 --legacy-peer-deps
```

### If you get date-fns peer dependency errors:
Already fixed in package.json, but for reference:
- Updated `date-fns` from `^4.1.0` to `^3.6.0` for compatibility with `react-day-picker`

## URLs After Setup

- **Main Website**: https://cek.itbuntuksemua.com
- **Admin Panel**: https://cek.itbuntuksemua.com/admin  
- **API Documentation**: https://cek.itbuntuksemua.com/docs
- **API Base**: https://cek.itbuntuksemua.com/api

## Default Admin Credentials

- **Username**: admin
- **Password**: admin123

⚠️ **IMPORTANT**: Change the default password after first login!

### Change Admin Password

After deployment, change the default password using one of these methods:

**Method 1: Using deploy script (Recommended)**
```bash
./deploy.sh password
# Follow the interactive prompts
```

**Method 2: Using dedicated script**
```bash
./change-password.sh
# Follow the interactive prompts
```

**Method 3: Direct password change**
```bash
./change-password.sh "your-new-strong-password"
```

**Password Requirements:**
- Minimum 6 characters (8+ recommended)
- Use a mix of letters, numbers, and special characters
- Avoid common passwords or dictionary words

## Architecture

- **Single Port**: Everything runs on port 8889 internally
- **aaPanel Proxy**: Routes external traffic (port 80/443) to internal port 8889
- **FastAPI Backend**: Serves both API and React frontend static files
- **MongoDB**: Default local MongoDB instance

## Troubleshooting

### If application won't start:
```bash
./deploy.sh logs  # Check error logs
./deploy.sh status  # Check if running
```

### If port 8889 is busy:
```bash
sudo netstat -tlnp | grep :8889  # Check what's using the port
sudo kill -9 <PID>  # Kill the process
./deploy.sh start  # Restart
```

### If database connection fails:
```bash
sudo systemctl status mongod  # Check MongoDB status
sudo systemctl start mongod   # Start MongoDB if needed
```

### If frontend build fails with Node.js errors:
The deploy script handles this automatically, but if needed:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm install ajv@^8.11.0 --legacy-peer-deps
npm run build
```

### Update .env files if needed:
- Backend: `/path/to/beasiswa-checker/backend/.env`  
- Frontend: `/path/to/beasiswa-checker/frontend/.env`

## Security Notes

- Admin access is hidden (no button on public site)
- Access admin via: https://cek.itbuntuksemua.com/admin
- Change default admin password after first login
- aaPanel handles SSL certificate renewal automatically

## Production Monitoring

Use aaPanel's built-in monitoring:
1. **Website** → Your domain → **Traffic Statistics**  
2. **System** → **System Status** (CPU, RAM, etc.)
3. **Database** → **MongoDB** (if using aaPanel's MongoDB)

## Performance Notes

- React build is optimized for production
- Static files are served directly by FastAPI
- MongoDB queries use proper indexing
- All dependencies are compatible with Node.js 20

The application is now ready for production use! 🚀