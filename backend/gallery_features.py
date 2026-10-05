"""Gallery metadata, owner-selected comparisons and anonymous tap totals."""
from datetime import datetime, timezone
from typing import Literal, Optional
from uuid import UUID

from bson import ObjectId
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from pymongo import ReturnDocument

Category = Literal["Bridal Glam", "Soft / Natural", "Party & Prom", "Eye & Brows", "Bridal Glam / Full Glam"]


class MediaOutput(BaseModel):
    id: str
    url: str
    title: str
    category: str
    description: str
    price: str
    rating: float
    media_type: str
    created_at: Optional[str] = None


class MediaEdit(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: Optional[str] = Field(default=None, min_length=1, max_length=160)
    category: Optional[Category] = None
    description: Optional[str] = Field(default=None, max_length=2000)
    price: Optional[str] = Field(default=None, max_length=60)

    @field_validator("title", "category", "description", "price", mode="before")
    @classmethod
    def clean_text(cls, value):
        if not isinstance(value, str):
            raise ValueError("Use text, not null")
        return value.strip()

    @model_validator(mode="after")
    def require_changes(self):
        if not self.model_fields_set:
            raise ValueError("Choose at least one field to edit")
        return self


class ComparisonInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    before_id: Optional[str] = None
    after_id: Optional[str] = None
    before_label: str = Field(default="Bare Face & Skin Prep", min_length=1, max_length=100)
    after_label: str = Field(default="Davao Signature Full Glam Transformation", min_length=1, max_length=100)

    @field_validator("before_label", "after_label", mode="before")
    @classmethod
    def trim_label(cls, value):
        return value.strip() if isinstance(value, str) else value

    @model_validator(mode="after")
    def pair_required(self):
        if bool(self.before_id) != bool(self.after_id):
            raise ValueError("Choose both photos")
        if self.before_id and self.before_id == self.after_id:
            raise ValueError("Choose two different photos")
        return self


class ComparisonOutput(ComparisonInput):
    before: Optional[MediaOutput] = None
    after: Optional[MediaOutput] = None
    is_placeholder: bool


class TapInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    event_id: UUID


class TapOutput(BaseModel):
    recorded: bool


class LookCount(BaseModel):
    id: str
    title: str
    category: str
    url: str
    media_type: str
    taps: int


class InsightsOutput(BaseModel):
    total_taps: int
    looks: list[LookCount]


def object_id(value: str):
    if not ObjectId.is_valid(value):
        raise HTTPException(400, "Invalid look id")
    return ObjectId(value)


def create_gallery_router(db, owner_guard, serialize_media):
    router = APIRouter(prefix="/api")

    async def active_media(media_id):
        doc = await db.media.find_one({"_id": object_id(media_id), "is_deleted": False})
        if not doc:
            raise HTTPException(404, "This look is no longer available")
        # ObjectId stays internal; serialize_media explicitly converts it to a string.
        return doc

    @router.get("/media/{media_id}", response_model=MediaOutput)
    async def get_media(media_id: str):
        return serialize_media(await active_media(media_id))

    @router.patch("/media/{media_id}", response_model=MediaOutput)
    async def edit_media(media_id: str, input: MediaEdit, authorization: str = Header(None)):
        await owner_guard(authorization)
        changes = input.model_dump(exclude_unset=True)
        changes["updated_at"] = datetime.now(timezone.utc).isoformat()
        doc = await db.media.find_one_and_update(
            {"_id": object_id(media_id), "is_deleted": False},
            {"$set": changes}, return_document=ReturnDocument.AFTER,
        )
        if not doc:
            raise HTTPException(404, "This look is no longer available")
        return serialize_media(doc)

    @router.get("/gallery/comparison", response_model=ComparisonOutput)
    async def get_comparison():
        saved = await db.settings.find_one({"_id": "gallery_comparison"}, {"_id": 0}) or {}
        config = ComparisonInput.model_validate(saved)
        before = after = None
        if config.before_id and config.after_id:
            before = await db.media.find_one({"_id": object_id(config.before_id), "is_deleted": False, "media_type": "image"})
            after = await db.media.find_one({"_id": object_id(config.after_id), "is_deleted": False, "media_type": "image"})
        if not before or not after:
            return ComparisonOutput(**ComparisonInput().model_dump(), is_placeholder=True)
        return ComparisonOutput(**config.model_dump(), before=serialize_media(before), after=serialize_media(after), is_placeholder=False)

    @router.put("/gallery/comparison", response_model=ComparisonOutput)
    async def set_comparison(input: ComparisonInput, authorization: str = Header(None)):
        await owner_guard(authorization)
        for media_id in (input.before_id, input.after_id):
            if media_id:
                doc = await active_media(media_id)
                if doc.get("media_type") != "image":
                    raise HTTPException(400, "Before & after selections must be photos, not videos")
        await db.settings.update_one({"_id": "gallery_comparison"}, {"$set": input.model_dump()}, upsert=True)
        return await get_comparison()

    @router.post("/media/{media_id}/enquiry-tap", response_model=TapOutput)
    async def record_tap(media_id: str, input: TapInput):
        oid = object_id(media_id)
        event_id = str(input.event_id)
        # One atomic write prevents double-counting retries, even concurrently.
        # Retain only recent event IDs; never store visitor identities or contact data.
        result = await db.media.update_one(
            {"_id": oid, "is_deleted": False, "tap_event_ids": {"$ne": event_id}},
            {"$inc": {"enquiry_taps": 1},
             "$push": {"tap_event_ids": {"$each": [event_id], "$slice": -100}},
             "$set": {"last_enquiry_tap_at": datetime.now(timezone.utc).isoformat()}},
        )
        if not result.matched_count:
            await active_media(media_id)
        return TapOutput(recorded=bool(result.modified_count))

    @router.get("/gallery/insights", response_model=InsightsOutput)
    async def get_insights(authorization: str = Header(None)):
        await owner_guard(authorization)
        looks = []
        async for doc in db.media.find({"is_deleted": False}, {"storage_path": 1, "title": 1, "category": 1, "media_type": 1, "enquiry_taps": 1}).sort([("enquiry_taps", -1), ("created_at", -1)]):
            looks.append(LookCount(id=str(doc["_id"]), title=doc.get("title", "New Glam"),
                category=doc.get("category", "Bridal Glam"), url=f"/api/media/file/{doc['storage_path']}",
                media_type=doc.get("media_type", "image"), taps=doc.get("enquiry_taps", 0)))
        return InsightsOutput(total_taps=sum(item.taps for item in looks), looks=looks)

    return router