# Beasiswa ITB Status Checker

A full-stack web application for checking scholarship application status, built with FastAPI (Python), React, and MongoDB.

## Features

- 🔍 **Public Status Checker**: Students can check their scholarship status using NIM and email
- 👨‍💼 **Admin Dashboard**: Complete CRUD operations for managing scholarship applications
- 📊 **Smart Pagination**: Efficiently handles large datasets (10 records per page)
- 📱 **Mobile Responsive**: Optimized for both desktop and mobile devices
- 📁 **CSV Import/Export**: Bulk data management with CSV file support
- 🏷️ **Status & Stage Tracking**: Track both application status and current stage
- 🔐 **Secure Admin Access**: JWT authentication with hidden admin entrance
- 🇮🇩 **Indonesian Language**: Complete interface in Bahasa Indonesia

## Technology Stack

- **Backend**: FastAPI (Python 3.8+)
- **Frontend**: React 19 with Tailwind CSS
- **Database**: MongoDB
- **UI Components**: Shadcn/UI
- **Authentication**: JWT tokens
- **Deployment**: Docker-ready with custom deployment scripts

## Quick Start

### Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- MongoDB (local or cloud)
- Git

### Installation & Deployment

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd beasiswa-checker
```

2. **Make deployment script executable**
```bash
chmod +x deploy.sh
```

3. **Start the application**
```bash
./deploy.sh start
```

4. **Access the application**
- **Public Status Checker**: http://localhost:8889
- **Admin Dashboard**: http://localhost:8889/admin
- **API Documentation**: http://localhost:8889/docs

### Default Admin Credentials
- **Username**: `admin`
- **Password**: `admin123`

## Deployment Commands

```bash
# Start all services
./deploy.sh start

# Stop all services
./deploy.sh stop

# Restart all services
./deploy.sh restart

# View service status
./deploy.sh status

# View logs
./deploy.sh logs

# Clean build and restart
./deploy.sh clean

# Setup nginx proxy config
./deploy.sh nginx
```

## Environment Configuration

The deployment script automatically creates environment files, but you can customize them:

### Backend Environment (`/backend/.env`)
```env
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
```

### Frontend Environment (`/frontend/.env`)
```env
# Backend API URL
REACT_APP_BACKEND_URL=http://localhost:8889

# Build Configuration
GENERATE_SOURCEMAP=false
```

## Application Structure

```
beasiswa-checker/
├── backend/                 # FastAPI backend
│   ├── server.py           # Main application file
│   ├── requirements.txt    # Python dependencies
│   ├── .env               # Backend environment variables
│   └── Dockerfile         # Docker configuration
├── frontend/               # React frontend
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   ├── App.css        # Styles
│   │   └── components/ui/ # UI components
│   ├── public/
│   │   └── index.html     # HTML template
│   ├── package.json       # Node.js dependencies
│   ├── .env              # Frontend environment variables
│   └── Dockerfile        # Docker configuration
├── deploy.sh              # Deployment script
├── docker-compose.yml     # Docker Compose configuration
├── nginx.conf            # Nginx reverse proxy configuration
└── README.md             # This file
```

## Docker Deployment

For containerized deployment:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

## API Endpoints

### Public Endpoints
- `POST /api/check-status` - Check scholarship status

### Admin Endpoints (Requires Authentication)
- `POST /api/admin/login` - Admin login
- `GET /api/admin/applications` - Get paginated applications
- `POST /api/admin/applications` - Create new application
- `PUT /api/admin/applications/{id}` - Update application
- `DELETE /api/admin/applications/{id}` - Delete application
- `POST /api/admin/import-csv` - Import applications from CSV

## Data Schema

### Scholarship Application Fields
- `nim`: Student ID number
- `email`: Student email address
- `nama_lengkap`: Full name
- `nomor_telepon`: Phone number
- `alamat`: Address
- `ipk`: GPA
- `penghasilan_keluarga`: Family income
- `essay`: Motivation essay
- `dokumen_pendukung`: Supporting documents
- `rekomendasi`: Recommendation letters
- `status`: Application status (Dalam Review, Diterima, Ditolak)
- `tahap`: Current stage (Administrasi, Wawancara, Final)
- `catatan`: Notes/comments
- `tanggal_daftar`: Registration date
- `tanggal_update`: Last update date

## CSV Import Format

Create a CSV file with the following columns:
```csv
nim,email,nama_lengkap,nomor_telepon,alamat,ipk,penghasilan_keluarga,essay,dokumen_pendukung,rekomendasi,status,tahap,catatan
```

**Example:**
```csv
13523001,student@students.itb.ac.id,"John Doe","081234567890","Jl. Example St.","3.75","5000000","My essay","Documents","Recommendation","Diterima","Administrasi","Approved"
```

## Status & Stage Values

### Status Options
- `Dalam Review`: Under review
- `Diterima`: Accepted
- `Ditolak`: Rejected

### Stage (Tahap) Options
- `Administrasi`: Administrative review
- `Wawancara`: Interview stage
- `Final`: Final decision

## Production Deployment

### Manual Production Setup

1. **Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8889
```

2. **Frontend Setup**
```bash
cd frontend
npm install
npm run build
# Serve build folder with nginx or apache
```

3. **MongoDB Setup**
```bash
# Install and start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

## Customizing Admin Credentials

You can change admin credentials by modifying the `.env` file:

```env
# In backend/.env
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_secure_password
```

Then restart the application:
```bash
./deploy.sh restart
```

## Environment Variables

### Required Environment Variables
- `MONGO_URL`: MongoDB connection string
- `DB_NAME`: Database name
- `JWT_SECRET`: Secret key for JWT tokens
- `REACT_APP_BACKEND_URL`: Backend API URL for frontend

### Optional Environment Variables
- `ADMIN_USERNAME`: Admin username (default: admin)
- `ADMIN_PASSWORD`: Admin password (default: admin123)
- `CORS_ORIGINS`: Allowed CORS origins
- `PORT`: Server port (default: 8889)

## Troubleshooting

### Common Issues

**1. Port Already in Use**
```bash
# The deploy script automatically handles this, but manual fix:
sudo lsof -ti:8889 | xargs sudo kill -9
```

**2. MongoDB Connection Issues**
```bash
# Check MongoDB status
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod
```

**3. Permission Issues**
```bash
# Make scripts executable
chmod +x deploy.sh
```

**4. Admin Login Issues**
- Check if admin credentials in `.env` match your login attempt
- Restart the application after changing credentials: `./deploy.sh restart`

### Logs Location
- Backend logs: `backend.log` (when using deploy.sh)
- Frontend logs: `frontend.log` (when using deploy.sh)
- MongoDB logs: `/var/log/mongodb/mongod.log`

## Development

### Backend Development
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --reload --host 0.0.0.0 --port 8889
```

### Frontend Development
```bash
cd frontend
npm install
npm start  # Development server on port 3000
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section above
- Review API documentation at `/docs` endpoint

## Changelog

### v1.0.0
- Initial release with status checking functionality
- Admin dashboard with CRUD operations  
- CSV import/export functionality
- Mobile responsive design
- JWT authentication
- Pagination support
- Multi-stage scholarship tracking
- Configurable admin credentials
- Docker support
- Comprehensive deployment script

---

**Made with ❤️ for Beasiswa ITB untuk Semua**
