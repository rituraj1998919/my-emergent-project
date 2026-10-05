from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Header, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import bcrypt
import jwt
import requests
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, BeforeValidator
from typing import Optional, Annotated, List
from bson import ObjectId
from datetime import datetime, timezone, timedelta


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "irsmakup"

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
TOKEN_DAYS = 7

IMAGE_EXTS = {"jpg", "jpeg", "png", "webp", "gif"}
VIDEO_EXTS = {"mp4", "mov", "webm", "avi", "m4v"}
MAX_UPLOAD_BYTES = 100 * 1024 * 1024

app = FastAPI()
api_router = APIRouter(prefix="/api")

storage_key = None


def init_storage(force: bool = False) -> str:
    global storage_key
    if storage_key and not force:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=300
    )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=120)
    if resp.status_code in (400, 404):
        key = init_storage(force=True)
        resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=120)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id, "email": email, "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(days=TOKEN_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_owner(authorization: str = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization[7:]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        return {"email": payload.get("email"), "sub": payload.get("sub")}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired, please log in again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def to_str(v) -> str:
    return str(v) if isinstance(v, ObjectId) else v


PyObjectId = Annotated[str, BeforeValidator(to_str)]


class BaseDocument(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    id: Optional[PyObjectId] = Field(None, alias="_id")

    def to_mongo(self) -> dict:
        return self.model_dump(exclude={"id"}, exclude_none=True)


class Inquiry(BaseDocument):
    name: str
    phone: str
    event_date: str
    event_type: str
    venue: str = ""
    pax: int = 1
    message: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class InquiryCreate(BaseModel):
    name: str
    phone: str
    event_date: str
    event_type: str
    venue: str = ""
    pax: int = 1
    message: str = ""


class LoginInput(BaseModel):
    email: str
    password: str


class InquiryStatus(BaseModel):
    status: str


DEFAULT_SETTINGS = {
    "studio_address": "Narra St. Victoria Pelayo, Brgy Centro Agdao, Davao City",
    "service_area": "Davao City studio & doorstep — all over the Philippines",
    "instagram": "https://instagram.com/irsmakup",
    "pinterest": "https://pinterest.com/irsmakup",
    "youtube": "https://youtube.com/@irsmakup",
    "facebook": "https://www.facebook.com/share/19axnjTYpP/",
}


class SettingsInput(BaseModel):
    studio_address: str = DEFAULT_SETTINGS["studio_address"]
    service_area: str = DEFAULT_SETTINGS["service_area"]
    instagram: str = ""
    pinterest: str = ""
    youtube: str = ""
    facebook: str = DEFAULT_SETTINGS["facebook"]


@api_router.get("/settings", response_model=dict)
async def get_settings():
    doc = await db.settings.find_one({"_id": "site"}) or {}
    doc.pop("_id", None)
    return {**DEFAULT_SETTINGS, **doc}


@api_router.put("/settings", response_model=dict)
async def update_settings(input: SettingsInput, authorization: str = Header(None)):
    await get_current_owner(authorization)
    data = {k: v.strip() for k, v in input.model_dump().items()}
    for key in ("instagram", "pinterest", "youtube", "facebook"):
        if data[key] and not data[key].startswith(("http://", "https://")):
            data[key] = "https://" + data[key]
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.settings.update_one({"_id": "site"}, {"$set": data}, upsert=True)
    return {**DEFAULT_SETTINGS, **data}


def serialize_media(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "url": f"/api/media/file/{doc['storage_path']}",
        "title": doc.get("title", ""),
        "category": doc.get("category", "Bridal Glam"),
        "description": doc.get("description", ""),
        "price": doc.get("price", ""),
        "rating": doc.get("rating", 5.0),
        "media_type": doc.get("media_type", "image"),
        "created_at": doc.get("created_at"),
    }


class Review(BaseDocument):
    name: str
    event: str = ""
    quote: str
    rating: int = 5
    photo_path: str = ""
    is_deleted: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


def serialize_review(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "name": doc.get("name", ""),
        "event": doc.get("event", ""),
        "quote": doc.get("quote", ""),
        "rating": doc.get("rating", 5),
        "photo_url": f"/api/media/file/{doc['photo_path']}" if doc.get("photo_path") else None,
        "created_at": doc.get("created_at"),
    }


@api_router.post("/reviews", response_model=dict)
async def create_review(
    name: str = Form(...),
    event: str = Form(""),
    quote: str = Form(...),
    rating: int = Form(5),
    photo: UploadFile = File(None),
    authorization: str = Header(None),
):
    await get_current_owner(authorization)
    rating = max(1, min(5, rating))
    photo_path = ""
    if photo and photo.filename:
        ext = photo.filename.split(".")[-1].lower() if "." in photo.filename else ""
        if ext not in IMAGE_EXTS:
            raise HTTPException(status_code=400, detail="Review photo must be an image (jpg, png, webp, gif)")
        data = await photo.read()
        if len(data) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail="Photo too large (max 100MB)")
        result = put_object(f"{APP_NAME}/reviews/{uuid.uuid4()}.{ext}", data, photo.content_type or "image/jpeg")
        photo_path = result["path"]
    doc = {
        "name": name.strip() or "Happy Client",
        "event": (event or "").strip(),
        "quote": (quote or "").strip(),
        "rating": rating,
        "photo_path": photo_path,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    inserted = await db.reviews.insert_one(doc)
    doc["_id"] = inserted.inserted_id
    return serialize_review(doc)


@api_router.get("/reviews", response_model=List[dict])
async def list_reviews():
    docs = await db.reviews.find({"is_deleted": False}).sort("created_at", -1).to_list(100)
    return [serialize_review(d) for d in docs]


@api_router.delete("/reviews/{review_id}", response_model=dict)
async def delete_review(review_id: str, authorization: str = Header(None)):
    await get_current_owner(authorization)
    try:
        oid = ObjectId(review_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    result = await db.reviews.update_one({"_id": oid}, {"$set": {"is_deleted": True}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"status": "deleted", "id": review_id}


@api_router.get("/")
async def root():
    return {"status": "ok", "service": "irsmakup.com API"}


@api_router.post("/auth/login")
async def owner_login(input: LoginInput):
    email = input.email.strip().lower()
    identifier = f"owner:{email}"
    attempts = await db.login_attempts.find_one({"identifier": identifier})
    if attempts and attempts.get("count", 0) >= 5 and datetime.now(timezone.utc) < attempts.get("locked_until", datetime.now(timezone.utc)):
        raise HTTPException(status_code=429, detail="Too many attempts. Try again in 15 minutes.")
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(input.password, user.get("password_hash", "")):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1},
             "$set": {"locked_until": datetime.now(timezone.utc) + timedelta(minutes=15)}},
            upsert=True,
        )
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    await db.login_attempts.delete_one({"identifier": identifier})
    return {"access_token": create_token(str(user["_id"]), user["email"]), "email": user["email"], "role": user.get("role", "owner")}


@api_router.post("/inquiries", response_model=dict)
async def create_inquiry(input: InquiryCreate):
    if not input.name.strip() or not input.phone.strip():
        raise HTTPException(status_code=400, detail="Name and phone are required")
    inquiry = Inquiry(**input.model_dump())
    doc = inquiry.to_mongo()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["status"] = "new"
    result = await db.inquiries.insert_one(doc)
    return {
        "id": str(result.inserted_id),
        "status": "received",
        "name": inquiry.name,
        "event_type": inquiry.event_type,
        "event_date": inquiry.event_date,
    }


@api_router.get("/inquiries", response_model=List[dict])
async def get_inquiries(authorization: str = Header(None)):
    await get_current_owner(authorization)
    docs = await db.inquiries.find({}).sort("created_at", -1).to_list(500)
    for d in docs:
        d["id"] = str(d.pop("_id"))
        d["status"] = d.get("status", "new")
    return docs


@api_router.patch("/inquiries/{inquiry_id}/status", response_model=dict)
async def update_inquiry_status(inquiry_id: str, input: InquiryStatus, authorization: str = Header(None)):
    await get_current_owner(authorization)
    if input.status not in ("new", "replied"):
        raise HTTPException(status_code=400, detail="Status must be 'new' or 'replied'")
    try:
        oid = ObjectId(inquiry_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    update = {"status": input.status}
    update["replied_at"] = datetime.now(timezone.utc).isoformat() if input.status == "replied" else None
    result = await db.inquiries.update_one({"_id": oid}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    return {"id": inquiry_id, "status": input.status}


@api_router.post("/media", response_model=dict)
async def upload_media(
    file: UploadFile = File(...),
    title: str = Form(""),
    category: str = Form("Bridal Glam"),
    description: str = Form(""),
    price: str = Form(""),
    authorization: str = Header(None),
):
    await get_current_owner(authorization)
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if ext not in IMAGE_EXTS and ext not in VIDEO_EXTS:
        raise HTTPException(status_code=400, detail="Only photos (jpg, png, webp, gif) and videos (mp4, mov, webm) are allowed")
    media_type = "video" if ext in VIDEO_EXTS else "image"
    data = await file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 100MB)")
    path = f"{APP_NAME}/media/{uuid.uuid4()}.{ext}"
    result = put_object(path, data, file.content_type or "application/octet-stream")
    doc = {
        "storage_path": result["path"],
        "title": (title or "").strip() or "New Glam",
        "category": (category or "Bridal Glam").strip(),
        "description": (description or "").strip(),
        "price": (price or "").strip(),
        "rating": 5.0,
        "media_type": media_type,
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": result.get("size", len(data)),
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    inserted = await db.media.insert_one(doc)
    doc["_id"] = inserted.inserted_id
    return serialize_media(doc)


@api_router.get("/media", response_model=List[dict])
async def list_media():
    docs = await db.media.find({"is_deleted": False}).sort("created_at", -1).to_list(500)
    return [serialize_media(d) for d in docs]


@api_router.get("/media/file/{path:path}")
async def serve_media(path: str):
    try:
        data, content_type = get_object(path)
    except requests.HTTPError:
        raise HTTPException(status_code=404, detail="File not found")
    return Response(content=data, media_type=content_type, headers={"Cache-Control": "public, max-age=86400"})


@api_router.delete("/media/{media_id}", response_model=dict)
async def delete_media(media_id: str, authorization: str = Header(None)):
    await get_current_owner(authorization)
    try:
        oid = ObjectId(media_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    result = await db.media.update_one({"_id": oid}, {"$set": {"is_deleted": True}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Media not found")
    return {"status": "deleted", "id": media_id}


async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "hikarah@irsmakup.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "GlamQueen#2024")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Hikarah Lntc",
            "role": "owner",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    elif not verify_password(admin_password, existing.get("password_hash", "")):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}},
        )


@app.on_event("startup")
async def startup():
    await seed_admin()
    try:
        init_storage()
        logger.info("Object storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
