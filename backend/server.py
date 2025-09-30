from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
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
from passlib.context import CryptContext
import hashlib

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get("JWT_SECRET", "beasiswa-secret-key-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Create the main app without a prefix
app = FastAPI(title="Beasiswa ITB Status Checker")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

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
    catatan: Optional[str] = None

class StatusCheckRequest(BaseModel):
    nim: str
    email: EmailStr

class StatusResponse(BaseModel):
    found: bool
    nim: Optional[str] = None
    nama_lengkap: Optional[str] = None
    status: Optional[str] = None
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
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

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
@api_router.get("/admin/applications", response_model=List[ScholarshipApplication])
async def get_all_applications(admin: dict = Depends(get_current_admin)):
    try:
        applications = await db.applications.find().to_list(length=None)
        return [ScholarshipApplication(**parse_from_mongo(app)) for app in applications]
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
    # Create default admin if not exists
    admin_exists = await db.admins.find_one({"username": "admin"})
    if not admin_exists:
        default_admin = Admin(
            username="admin",
            hashed_password=get_password_hash("admin123")
        )
        await db.admins.insert_one(prepare_for_mongo(default_admin.dict()))
        logger.info("Default admin created with username: admin, password: admin123")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()