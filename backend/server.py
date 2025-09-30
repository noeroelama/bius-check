from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import hashlib
import csv
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
security = HTTPBearer()
SECRET_KEY = os.environ.get("JWT_SECRET", "beasiswa-secret-key-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Create the main app without a prefix
app = FastAPI(title="Beasiswa ITB Status Checker")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure paths
ROOT_DIR = Path(__file__).parent
FRONTEND_BUILD_DIR = ROOT_DIR / "../frontend/build"

# Pydantic Models
class ScholarshipApplication(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nim: str
    email: EmailStr
    nama_lengkap: str
    nomor_telepon: str
    alamat: str
    ipk: float
    penghasilan_keluarga: int  # dalam rupiah
    essay: str
    dokumen_pendukung: Optional[str] = None  # URL atau nama file
    rekomendasi: Optional[str] = None
    status: str = "Dalam Review"  # Dalam Review, Diterima, Ditolak
    tahap: str = "Administrasi"  # Administrasi, Wawancara, Final
    catatan: Optional[str] = None
    tanggal_daftar: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    tanggal_update: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ScholarshipApplicationCreate(BaseModel):
    nim: str
    email: EmailStr
    nama_lengkap: str
    nomor_telepon: str
    alamat: str
    ipk: float
    penghasilan_keluarga: int
    essay: str
    dokumen_pendukung: Optional[str] = None
    rekomendasi: Optional[str] = None
    tahap: Optional[str] = "Administrasi"

class ScholarshipApplicationUpdate(BaseModel):
    nama_lengkap: Optional[str] = None
    nomor_telepon: Optional[str] = None
    alamat: Optional[str] = None
    ipk: Optional[float] = None
    penghasilan_keluarga: Optional[int] = None
    essay: Optional[str] = None
    dokumen_pendukung: Optional[str] = None
    rekomendasi: Optional[str] = None
    status: Optional[str] = None
    tahap: Optional[str] = None
    catatan: Optional[str] = None

class StatusCheckRequest(BaseModel):
    nim: str
    email: EmailStr

class StatusResponse(BaseModel):
    found: bool
    nim: Optional[str] = None
    nama_lengkap: Optional[str] = None
    status: Optional[str] = None
    tahap: Optional[str] = None
    catatan: Optional[str] = None
    tanggal_daftar: Optional[datetime] = None
    tanggal_update: Optional[datetime] = None

class AdminLogin(BaseModel):
    username: str
    password: str

class AdminToken(BaseModel):
    access_token: str
    token_type: str

class Admin(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    hashed_password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ImportResult(BaseModel):
    success: bool
    imported_count: int
    errors: List[str]
    message: str

# Helper functions
def prepare_for_mongo(data):
    """Convert datetime objects to ISO strings for MongoDB storage"""
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
    return data

def parse_from_mongo(item):
    """Convert ISO strings back to datetime objects"""
    if isinstance(item, dict):
        for key, value in item.items():
            if key in ['tanggal_daftar', 'tanggal_update', 'created_at'] and isinstance(value, str):
                try:
                    item[key] = datetime.fromisoformat(value.replace('Z', '+00:00'))
                except:
                    item[key] = datetime.now(timezone.utc)
    return item

def verify_password(plain_password, hashed_password):
    return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password

def get_password_hash(password):
    return hashlib.sha256(password.encode()).hexdigest()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    admin = await db.admins.find_one({"username": username})
    if admin is None:
        raise credentials_exception
    return admin

def parse_csv_row(row):
    """Parse a CSV row into a scholarship application"""
    try:
        # Handle optional numeric fields
        ipk_value = row.get("ipk", "").strip()
        if not ipk_value or ipk_value == "-":
            ipk_value = 0.0
        else:
            ipk_value = float(ipk_value)
        
        penghasilan_value = row.get("penghasilan_keluarga", "").strip()
        if not penghasilan_value or penghasilan_value == "-":
            penghasilan_value = 0
        else:
            penghasilan_value = int(penghasilan_value)
        
        return {
            "nim": str(row.get("nim", "")).strip(),
            "email": str(row.get("email", "")).strip(),
            "nama_lengkap": str(row.get("nama_lengkap", "")).strip(),
            "nomor_telepon": str(row.get("nomor_telepon", "")).strip(),
            "alamat": str(row.get("alamat", "")).strip(),
            "ipk": ipk_value,
            "penghasilan_keluarga": penghasilan_value,
            "essay": str(row.get("essay", "")).strip(),
            "dokumen_pendukung": str(row.get("dokumen_pendukung", "")).strip() or None,
            "rekomendasi": str(row.get("rekomendasi", "")).strip() or None,
            "status": str(row.get("status", "Dalam Review")).strip(),
            "tahap": str(row.get("tahap", "Administrasi")).strip(),
            "catatan": str(row.get("catatan", "")).strip() or None,
        }
    except (ValueError, TypeError) as e:
        raise ValueError(f"Invalid data in row: {e}")

# Routes
@api_router.get("/")
async def root():
    return {"message": "Beasiswa ITB Status Checker API"}

# Public route - Check scholarship status
@api_router.post("/check-status", response_model=StatusResponse)
async def check_scholarship_status(request: StatusCheckRequest):
    try:
        # Find application by NIM and email
        application = await db.applications.find_one({
            "nim": request.nim,
            "email": request.email
        })
        
        if not application:
            return StatusResponse(found=False)
        
        application = parse_from_mongo(application)
        
        return StatusResponse(
            found=True,
            nim=application["nim"],
            nama_lengkap=application["nama_lengkap"],
            status=application["status"],
            tahap=application.get("tahap", "Administrasi"),
            catatan=application.get("catatan"),
            tanggal_daftar=application["tanggal_daftar"],
            tanggal_update=application["tanggal_update"]
        )
    except Exception as e:
        logging.error(f"Error checking status: {e}")
        raise HTTPException(status_code=500, detail="Terjadi kesalahan internal")

# Admin authentication
@api_router.post("/admin/login", response_model=AdminToken)
async def admin_login(admin_data: AdminLogin):
    admin = await db.admins.find_one({"username": admin_data.username})
    if not admin or not verify_password(admin_data.password, admin["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau password salah",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": admin["username"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Admin CRUD routes
@api_router.get("/admin/applications", response_model=dict)
async def get_all_applications(
    page: int = 1, 
    limit: int = 10, 
    admin: dict = Depends(get_current_admin)
):
    try:
        # Calculate skip value for pagination
        skip = (page - 1) * limit
        
        # Get total count
        total_count = await db.applications.count_documents({})
        
        # Get paginated applications
        applications = await db.applications.find().skip(skip).limit(limit).to_list(length=None)
        parsed_applications = [ScholarshipApplication(**parse_from_mongo(app)) for app in applications]
        
        # Calculate pagination info
        total_pages = (total_count + limit - 1) // limit  # Ceiling division
        
        return {
            "applications": parsed_applications,
            "pagination": {
                "current_page": page,
                "total_pages": total_pages,
                "total_count": total_count,
                "limit": limit,
                "has_next": page < total_pages,
                "has_prev": page > 1
            }
        }
    except Exception as e:
        logging.error(f"Error getting applications: {e}")
        raise HTTPException(status_code=500, detail="Terjadi kesalahan internal")

@api_router.get("/admin/applications/{app_id}", response_model=ScholarshipApplication)
async def get_application_by_id(app_id: str, admin: dict = Depends(get_current_admin)):
    try:
        application = await db.applications.find_one({"id": app_id})
        if not application:
            raise HTTPException(status_code=404, detail="Aplikasi tidak ditemukan")
        return ScholarshipApplication(**parse_from_mongo(application))
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting application: {e}")
        raise HTTPException(status_code=500, detail="Terjadi kesalahan internal")

@api_router.post("/admin/applications", response_model=ScholarshipApplication)
async def create_application(application: ScholarshipApplicationCreate, admin: dict = Depends(get_current_admin)):
    try:
        # Check if NIM already exists
        existing = await db.applications.find_one({"nim": application.nim})
        if existing:
            raise HTTPException(status_code=400, detail="NIM sudah terdaftar")
        
        app_dict = application.dict()
        app_obj = ScholarshipApplication(**app_dict)
        app_data = prepare_for_mongo(app_obj.dict())
        
        await db.applications.insert_one(app_data)
        return app_obj
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating application: {e}")
        raise HTTPException(status_code=500, detail="Terjadi kesalahan internal")

@api_router.put("/admin/applications/{app_id}", response_model=ScholarshipApplication)
async def update_application(app_id: str, updates: ScholarshipApplicationUpdate, admin: dict = Depends(get_current_admin)):
    try:
        # Check if application exists
        existing = await db.applications.find_one({"id": app_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Aplikasi tidak ditemukan")
        
        # Prepare update data
        update_data = {k: v for k, v in updates.dict().items() if v is not None}
        if update_data:
            update_data["tanggal_update"] = datetime.now(timezone.utc).isoformat()
            
            await db.applications.update_one(
                {"id": app_id},
                {"$set": update_data}
            )
        
        # Return updated application
        updated_app = await db.applications.find_one({"id": app_id})
        return ScholarshipApplication(**parse_from_mongo(updated_app))
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error updating application: {e}")
        raise HTTPException(status_code=500, detail="Terjadi kesalahan internal")

@api_router.delete("/admin/applications/{app_id}")
async def delete_application(app_id: str, admin: dict = Depends(get_current_admin)):
    try:
        result = await db.applications.delete_one({"id": app_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Aplikasi tidak ditemukan")
        return {"message": "Aplikasi berhasil dihapus"}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting application: {e}")
        raise HTTPException(status_code=500, detail="Terjadi kesalahan internal")

# CSV Import route
@api_router.post("/admin/import-csv", response_model=ImportResult)
async def import_applications_csv(file: UploadFile = File(...), admin: dict = Depends(get_current_admin)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File harus berformat CSV")
    
    try:
        # Read CSV content
        content = await file.read()
        csv_content = content.decode('utf-8')
        
        # Parse CSV
        csv_reader = csv.DictReader(io.StringIO(csv_content))
        
        imported_count = 0
        updated_count = 0
        errors = []
        
        for row_num, row in enumerate(csv_reader, start=2):  # Start from 2 because row 1 is header
            try:
                # Parse row data
                app_data = parse_csv_row(row)
                
                # Validate required fields
                if not all([app_data["nim"], app_data["email"], app_data["nama_lengkap"]]):
                    errors.append(f"Baris {row_num}: NIM, email, dan nama_lengkap harus diisi")
                    continue
                
                # Check if application already exists (by NIM and email)
                existing = await db.applications.find_one({
                    "nim": app_data["nim"],
                    "email": app_data["email"]
                })
                
                if existing:
                    # Update existing record
                    app_data["tanggal_update"] = datetime.now(timezone.utc).isoformat()
                    await db.applications.update_one(
                        {"nim": app_data["nim"], "email": app_data["email"]},
                        {"$set": app_data}
                    )
                    updated_count += 1
                else:
                    # Create new application
                    app_obj = ScholarshipApplication(**app_data)
                    app_mongo_data = prepare_for_mongo(app_obj.dict())
                    await db.applications.insert_one(app_mongo_data)
                    imported_count += 1
                
            except ValueError as e:
                errors.append(f"Baris {row_num}: {str(e)}")
            except Exception as e:
                errors.append(f"Baris {row_num}: Kesalahan tidak terduga - {str(e)}")
        
        total_processed = imported_count + updated_count
        message = f"Berhasil memproses {total_processed} aplikasi ({imported_count} baru, {updated_count} diperbarui). {len(errors)} error ditemukan."
        
        return ImportResult(
            success=total_processed > 0,
            imported_count=total_processed,
            errors=errors,
            message=message
        )
    
    except Exception as e:
        logging.error(f"Error importing CSV: {e}")
        raise HTTPException(status_code=500, detail="Gagal memproses file CSV")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Startup event to create default admin
@app.on_event("startup")
async def startup_event():
    # Get admin credentials from environment variables
    admin_username = os.environ.get("ADMIN_USERNAME", "admin")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    
    # Create default admin if not exists
    admin_exists = await db.admins.find_one({"username": admin_username})
    if not admin_exists:
        default_admin = Admin(
            username=admin_username,
            hashed_password=get_password_hash(admin_password)
        )
        await db.admins.insert_one(prepare_for_mongo(default_admin.dict()))
        logger.info(f"Default admin created with username: {admin_username}")
    else:
        # Update existing admin password if it changed
        current_hash = admin_exists.get("hashed_password")
        new_hash = get_password_hash(admin_password)
        if current_hash != new_hash:
            await db.admins.update_one(
                {"username": admin_username},
                {"$set": {"hashed_password": new_hash}}
            )
            logger.info(f"Admin password updated for username: {admin_username}")
        else:
            logger.info(f"Admin user already exists: {admin_username}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()