from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Header, Response, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import requests
from starlette.concurrency import run_in_threadpool
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, BeforeValidator
from typing import Optional, Annotated, List
from bson import ObjectId
from datetime import datetime, timezone, timedelta
from gallery_features import create_gallery_router, Category
from security_controls import SecurityMiddleware, allowed_origins
from owner_security import OwnerSecurity, LoginInput, LoginOutput, hash_password, verify_password
from media_security import validated_upload, public_media_path, canonical_type


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

STORAGE_BASE = os.environ["INTEGRATION_PROXY_URL"].strip()
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ["EMERGENT_LLM_KEY"]
APP_NAME = "irsmakup"

security = OwnerSecurity(db)
TRUSTED_ORIGINS = allowed_origins()

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


async def get_current_owner(authorization: str = Header(None)) -> dict:
    return await security.owner(authorization)


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
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    name: str = Field(min_length=1, max_length=120)
    phone: str = Field(min_length=5, max_length=40)
    event_date: str = Field(min_length=1, max_length=40)
    event_type: str = Field(min_length=1, max_length=100)
    venue: str = Field(default="", max_length=300)
    pax: int = Field(default=1, ge=1, le=500)
    message: str = Field(default="", max_length=3000)


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
    name: str = Form(..., min_length=1, max_length=120),
    event: str = Form("", max_length=200),
    quote: str = Form(..., min_length=1, max_length=3000),
    rating: int = Form(5),
    photo: UploadFile = File(None),
    authorization: str = Header(None),
):
    await get_current_owner(authorization)
    rating = max(1, min(5, rating))
    photo_path = ""
    if photo and photo.filename:
        data, mime, ext, _ = await validated_upload(photo, photos_only=True)
        result = await run_in_threadpool(put_object, f"{APP_NAME}/reviews/{uuid.uuid4()}.{ext}", data, mime)
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


@api_router.post("/auth/login", response_model=LoginOutput)
async def owner_login(input: LoginInput, request: Request):
    return await security.login(input, request)


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
    title: str = Form("", max_length=160),
    category: Category = Form("Bridal Glam"),
    description: str = Form("", max_length=2000),
    price: str = Form("", max_length=60),
    authorization: str = Header(None),
):
    await get_current_owner(authorization)
    data, mime, ext, media_type = await validated_upload(file)
    path = f"{APP_NAME}/media/{uuid.uuid4()}.{ext}"
    result = await run_in_threadpool(put_object, path, data, mime)
    doc = {
        "storage_path": result["path"],
        "title": (title or "").strip() or "New Glam",
        "category": (category or "Bridal Glam").strip(),
        "description": (description or "").strip(),
        "price": (price or "").strip(),
        "rating": 5.0,
        "media_type": media_type,
        "original_filename": file.filename,
        "content_type": mime,
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
    public_media_path(path)
    visible = await db.media.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0, "storage_path": 1})
    if not visible:
        visible = await db.reviews.find_one({"photo_path": path, "is_deleted": False}, {"_id": 0, "photo_path": 1})
    if not visible:
        raise HTTPException(status_code=404, detail="File not found")
    try:
        data, _ = await run_in_threadpool(get_object, path)
    except requests.HTTPError:
        raise HTTPException(status_code=404, detail="File not found")
    return Response(content=data, media_type=canonical_type(path), headers={"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; sandbox"})


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
    await security.seed()


@app.on_event("startup")
async def startup():
    await security.initialize()
    await seed_admin()
    try:
        init_storage()
        logger.info("Object storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")


app.include_router(api_router)
app.include_router(create_gallery_router(db, get_current_owner, serialize_media))
app.include_router(security.router())

app.add_middleware(SecurityMiddleware, db=db, origins=TRUSTED_ORIGINS)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=TRUSTED_ORIGINS,
    allow_methods=["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
    expose_headers=["Retry-After", "RateLimit-Limit", "RateLimit-Remaining", "RateLimit-Reset"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
