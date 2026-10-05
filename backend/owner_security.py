"""Owner authentication, fixed-expiry lockouts and private security events."""
import math
import os
import uuid
from datetime import datetime, timezone, timedelta

import bcrypt
import jwt
from bson import ObjectId
from fastapi import APIRouter, Header, HTTPException, Request
from pydantic import BaseModel, Field, ConfigDict, field_validator
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError
from starlette.concurrency import run_in_threadpool

from security_controls import (WINDOW_MS, utc_ms, utc_datetime, timestamp_ms, private_digest,
                               client_address, network_label, browser_label, consume_rate)

MAX_FAILED_ATTEMPTS = 5


def hash_password(password):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain, hashed):
    try:
        return len(plain.encode()) <= 72 and bcrypt.checkpw(plain.encode(), hashed.encode())
    except (ValueError, TypeError):
        return False


class LoginInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=72)

    @field_validator("password")
    @classmethod
    def password_bytes(cls, value):
        if len(value.encode()) > 72:
            raise ValueError("Password exceeds 72 bytes")
        return value


class PasswordInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    current_password: str = Field(min_length=1, max_length=72)
    new_password: str = Field(min_length=12, max_length=72)

    @field_validator("current_password", "new_password")
    @classmethod
    def byte_limit(cls, value):
        if len(value.encode()) > 72:
            raise ValueError("Password exceeds 72 bytes")
        return value


class LoginOutput(BaseModel):
    access_token: str
    email: str
    role: str


class SecurityEvent(BaseModel):
    id: str
    kind: str
    created_at: str
    browser: str
    network: str
    reviewed: bool


class EventList(BaseModel):
    events: list[SecurityEvent]
    unread: int
    delivery: str = "studio_only"


class OwnerSecurity:
    def __init__(self, db):
        self.db = db
        self.secret = os.environ["JWT_SECRET"]
        if len(self.secret) < 32:
            raise RuntimeError("JWT_SECRET must be at least 32 characters")
        self.dummy_hash = hash_password(uuid.uuid4().hex)

    async def initialize(self):
        await self.db.users.create_index("email", unique=True)
        await self.db.login_attempts.create_index("expires_at", expireAfterSeconds=0)
        await self.db.rate_limits.create_index("expires_at", expireAfterSeconds=0)
        await self.db.security_events.create_index("expires_at", expireAfterSeconds=0)
        await self.db.security_events.create_index([("owner_id", 1), ("created_at", -1)])
        await self.db.login_contexts.create_index("expires_at", expireAfterSeconds=0)

    def token(self, user):
        now = datetime.now(timezone.utc)
        return jwt.encode({"sub": str(user["_id"]), "email": user["email"], "type": "access",
                           "ver": user.get("token_version", 0), "iat": now, "exp": now + timedelta(days=7)}, self.secret, algorithm="HS256")

    async def owner(self, authorization=None):
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(401, "Not authenticated")
        try:
            payload = jwt.decode(authorization[7:], self.secret, algorithms=["HS256"], options={"require": ["sub", "exp", "type"]})
            if payload["type"] != "access" or not ObjectId.is_valid(payload["sub"]):
                raise HTTPException(401, "Invalid token")
            user = await self.db.users.find_one({"_id": ObjectId(payload["sub"]), "role": "owner"}, {"password_hash": 0})
            if not user or user.get("token_version", 0) != payload.get("ver", 0):
                raise HTTPException(401, "Session expired, please log in again")
            return {"email": user["email"], "sub": str(user["_id"]), "role": user["role"]}
        except jwt.ExpiredSignatureError:
            raise HTTPException(401, "Session expired, please log in again")
        except (jwt.InvalidTokenError, TypeError, ValueError):
            raise HTTPException(401, "Invalid token")

    async def seed(self):
        email = os.environ["ADMIN_EMAIL"].strip().lower()
        password = os.environ["ADMIN_PASSWORD"]
        if not email or len(password) < 12 or len(password.encode()) > 72:
            raise RuntimeError("Explicit owner email and a 12–72 byte bootstrap password are required")
        # Bootstrap only: restarts NEVER overwrite an existing password.
        if await self.db.users.find_one({"email": email}, {"_id": 1}):
            return
        hashed = await run_in_threadpool(hash_password, password)
        await self.db.users.update_one({"email": email}, {"$setOnInsert": {"password_hash": hashed, "role": "owner", "name": "Hikarah Lntc", "token_version": 0, "created_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)

    async def attempts(self, email, now):
        key = private_digest(f"login:{email}")
        # Migrate legacy BSON dates safely (Mongo dates may be timezone-naive).
        legacy = await self.db.login_attempts.find_one({"identifier": f"owner:{email}"})
        if legacy:
            end = timestamp_ms(legacy.get("locked_until"))
            locked = legacy.get("count", 0) >= MAX_FAILED_ATTEMPTS and end > now
            await self.db.login_attempts.update_one({"_id": key}, {"$setOnInsert": {"count": MAX_FAILED_ATTEMPTS if locked else 0, "locked_until_ms": end if locked else 0, "window_started_ms": now, "expires_at": utc_datetime(max(end, now) + WINDOW_MS)}}, upsert=True)
            await self.db.login_attempts.delete_one({"_id": legacy["_id"]})
        doc = await self.db.login_attempts.find_one({"_id": key}, {"_id": 0}) or {}
        return key, doc

    @staticmethod
    def enforce_lock(state, now):
        end = timestamp_ms(state.get("locked_until_ms"))
        if state.get("count", 0) >= MAX_FAILED_ATTEMPTS and end > now:
            seconds = max(1, math.ceil((end - now) / 1000))
            raise HTTPException(429, f"Account temporarily locked. Please try again after {math.ceil(seconds / 60)} minutes.", headers={"Retry-After": str(seconds)})

    async def failed(self, key, now):
        active = {"$gt": [{"$ifNull": ["$locked_until_ms", 0]}, now]}
        reset = {"$and": [{"$not": [active]}, {"$or": [{"$gte": [{"$ifNull": ["$count", 0]}, MAX_FAILED_ATTEMPTS]}, {"$lte": [{"$ifNull": ["$window_started_ms", 0]}, now - WINDOW_MS]}]}]}
        pipeline = [
            {"$set": {"count": {"$cond": [active, "$count", {"$add": [{"$cond": [reset, 0, {"$ifNull": ["$count", 0]}]}, 1]}]}, "window_started_ms": {"$cond": [reset, now, {"$ifNull": ["$window_started_ms", now]}]}}},
            {"$set": {"locked_until_ms": {"$cond": [active, "$locked_until_ms", {"$cond": [{"$gte": ["$count", MAX_FAILED_ATTEMPTS]}, now + WINDOW_MS, 0]}]}, "expires_at": utc_datetime(now + 2 * WINDOW_MS)}}
        ]
        try:
            return await self.db.login_attempts.find_one_and_update({"_id": key}, pipeline, upsert=True, return_document=ReturnDocument.AFTER, projection={"_id": 0})
        except DuplicateKeyError:
            return await self.db.login_attempts.find_one_and_update({"_id": key}, pipeline, return_document=ReturnDocument.AFTER, projection={"_id": 0})

    def context_id(self, user, request):
        return private_digest(f"{user['_id']}:{client_address(request)}:{request.headers.get('user-agent', '')[:500]}")

    async def event(self, user, request, kind):
        now = utc_ms()
        event_id = private_digest(f"{self.context_id(user, request)}:{kind}:{now // WINDOW_MS}")
        await self.db.security_events.update_one({"_id": event_id}, {"$setOnInsert": {
            "owner_id": str(user["_id"]), "kind": kind, "created_at": utc_datetime(now).isoformat(),
            "browser": browser_label(request), "network": network_label(client_address(request)),
            "reviewed": False, "expires_at": utc_datetime(now + 90 * 86400000)}}, upsert=True)

    async def login(self, input, request):
        email, now = input.email.strip().lower(), utc_ms()
        key, state = await self.attempts(email, now)
        self.enforce_lock(state, now)
        user = await self.db.users.find_one({"email": email, "role": "owner"})
        valid = await run_in_threadpool(verify_password, input.password, user["password_hash"] if user else self.dummy_hash)
        if not user or not valid:
            state = await self.failed(key, utc_ms())
            if user:
                known = await self.db.login_contexts.find_one({"_id": self.context_id(user, request)}, {"_id": 1})
                if not known:
                    await self.event(user, request, "unfamiliar_attempt")
                if state.get("count", 0) >= MAX_FAILED_ATTEMPTS:
                    await self.event(user, request, "login_lockout")
            self.enforce_lock(state, utc_ms())
            raise HTTPException(401, "Incorrect email or password")
        # Don't clear a lock created by another concurrent failed attempt.
        current = await self.db.login_attempts.find_one({"_id": key}, {"_id": 0}) or {}
        self.enforce_lock(current, utc_ms())
        await self.db.login_attempts.delete_one({"_id": key, "locked_until_ms": {"$lte": utc_ms()}})
        seen = await self.db.login_contexts.update_one({"_id": self.context_id(user, request)}, {"$set": {"owner_id": str(user["_id"]), "expires_at": utc_datetime(utc_ms() + 90 * 86400000)}}, upsert=True)
        if seen.upserted_id:
            await self.event(user, request, "unfamiliar_login")
        return LoginOutput(access_token=self.token(user), email=user["email"], role="owner")

    def router(self):
        router = APIRouter(prefix="/api")

        @router.get("/auth/me", response_model=dict)
        async def me(authorization: str = Header(None)):
            return await self.owner(authorization)

        @router.put("/auth/password", response_model=LoginOutput)
        async def change_password(input: PasswordInput, request: Request, authorization: str = Header(None)):
            owner = await self.owner(authorization)
            allowed, headers, retry = await consume_rate(self.db, owner["sub"], "password-change", 5)
            if not allowed:
                raise HTTPException(429, "Too many password change attempts. Try again later.", headers={**headers, "Retry-After": str(retry)})
            user = await self.db.users.find_one({"_id": ObjectId(owner["sub"])})
            if not await run_in_threadpool(verify_password, input.current_password, user["password_hash"]):
                raise HTTPException(400, "Current password is incorrect")
            if input.current_password == input.new_password:
                raise HTTPException(400, "Choose a different new password")
            hashed = await run_in_threadpool(hash_password, input.new_password)
            updated = await self.db.users.find_one_and_update({"_id": user["_id"], "password_hash": user["password_hash"]}, {"$set": {"password_hash": hashed}, "$inc": {"token_version": 1}}, return_document=ReturnDocument.AFTER)
            if not updated:
                raise HTTPException(409, "Password changed in another session. Please log in again.")
            await self.event(updated, request, "password_changed")
            return LoginOutput(access_token=self.token(updated), email=updated["email"], role="owner")

        @router.get("/security/events", response_model=EventList)
        async def events(authorization: str = Header(None)):
            owner = await self.owner(authorization)
            records = await self.db.security_events.find({"owner_id": owner["sub"]}, {"expires_at": 0}).sort("created_at", -1).to_list(100)
            return EventList(events=[SecurityEvent(id=str(d["_id"]), kind=d["kind"], created_at=d["created_at"], browser=d["browser"], network=d["network"], reviewed=d["reviewed"]) for d in records], unread=await self.db.security_events.count_documents({"owner_id": owner["sub"], "reviewed": False}))

        @router.patch("/security/events/{event_id}/review", response_model=dict)
        async def review_event(event_id: str, authorization: str = Header(None)):
            owner = await self.owner(authorization)
            result = await self.db.security_events.update_one({"_id": event_id, "owner_id": owner["sub"]}, {"$set": {"reviewed": True}})
            if not result.matched_count:
                raise HTTPException(404, "Alert not found")
            return {"id": event_id, "reviewed": True}

        return router