"""Persistent abuse controls and safe HTTP defaults (no in-memory security state)."""
import hashlib
import hmac
import ipaddress
import math
import os
import time
from datetime import datetime, timezone
from urllib.parse import unquote, urlsplit

from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError
from starlette.requests import Request
from starlette.responses import JSONResponse

WINDOW_MS = 15 * 60 * 1000
MAX_API_WRITES = 50
MAX_JSON_READS = 500


def utc_ms():
    return int(time.time() * 1000)


def utc_datetime(ms):
    return datetime.fromtimestamp(ms / 1000, tz=timezone.utc)


def timestamp_ms(value):
    if isinstance(value, datetime):
        return int(value.replace(tzinfo=value.tzinfo or timezone.utc).timestamp() * 1000)
    if isinstance(value, (int, float)) and math.isfinite(value):
        return int(value)
    return 0


def private_digest(value):
    return hmac.new(os.environ["JWT_SECRET"].encode(), value.encode(), hashlib.sha256).hexdigest()


def client_address(request):
    # Use the ASGI server's client address, not attacker-supplied forwarding headers.
    # The ingress/ASGI trusted-proxy policy must be verified separately in production.
    candidate = request.client.host if request.client else "unknown"
    try:
        return str(ipaddress.ip_address(candidate))
    except ValueError:
        return "unknown"


def network_label(ip):
    try:
        addr = ipaddress.ip_address(ip)
        return str(ipaddress.ip_network(f"{addr}/{24 if addr.version == 4 else 48}", strict=False))
    except ValueError:
        return "Network unavailable"


def browser_label(request):
    ua = request.headers.get("user-agent", "").lower()
    browser = next((name for signature, name in [("edg/", "Edge"), ("firefox/", "Firefox"), ("chrome/", "Chrome"), ("safari/", "Safari")] if signature in ua), "Other browser")
    device = "Mobile" if any(s in ua for s in ("mobile", "android", "iphone")) else "Desktop"
    return f"{browser} · {device}"


def allowed_origins():
    origins = [value.strip().rstrip("/") for value in os.environ["CORS_ORIGINS"].split(",") if value.strip()]
    if not origins:
        raise RuntimeError("CORS_ORIGINS must list trusted origins")
    for origin in origins:
        parsed = urlsplit(origin)
        if parsed.scheme not in ("https", "http") or not parsed.netloc or parsed.path or parsed.query or parsed.fragment or parsed.username or "*" in origin:
            raise RuntimeError("CORS_ORIGINS must contain exact HTTP(S) origins, not wildcards")
    return origins


def sensitive_path(path):
    decoded = unquote(unquote(path)).lower().replace("\\", "/")
    parts = decoded.split("/")
    return any(p.startswith(".") and p not in ("", ".well-known") for p in parts) or any(p in {"memory", "backend", "node_modules"} for p in parts) or decoded.endswith((".bak", ".backup", ".sql", ".pem", ".key", "/requirements.txt", "/package.json", "/yarn.lock", "/server.py"))


async def consume_rate(db, address, bucket, limit, now=None):
    now = utc_ms() if now is None else now
    # Anchored window; blocked requests cannot prolong it.
    window = now // WINDOW_MS
    reset = (window + 1) * WINDOW_MS
    key = f"{bucket}:{private_digest(address)}:{window}"
    query = {"_id": key}
    update = {"$inc": {"count": 1}, "$setOnInsert": {"expires_at": utc_datetime(reset + WINDOW_MS)}}
    try:
        doc = await db.rate_limits.find_one_and_update(query, update, upsert=True, return_document=ReturnDocument.AFTER, projection={"_id": 0, "count": 1})
    except DuplicateKeyError:
        doc = await db.rate_limits.find_one_and_update(query, {"$inc": {"count": 1}}, return_document=ReturnDocument.AFTER, projection={"_id": 0, "count": 1})
    seconds = max(1, math.ceil((reset - now) / 1000))
    headers = {"RateLimit-Limit": str(limit), "RateLimit-Remaining": str(max(0, limit - doc["count"])), "RateLimit-Reset": str(seconds), "RateLimit-Policy": f"{limit};w=900"}
    return doc["count"] <= limit, headers, seconds


class SecurityMiddleware:
    def __init__(self, app, db, origins):
        self.app, self.db, self.origins = app, db, origins

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
        request = Request(scope)
        path, method = request.url.path, request.method
        extra = {"X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin"}

        async def safe_send(message):
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                existing = {key.lower() for key, _ in headers}
                for key, value in extra.items():
                    if key.lower().encode() not in existing:
                        headers.append((key.lower().encode(), value.encode()))
                message = {**message, "headers": headers}
            await send(message)

        if sensitive_path(path):
            return await JSONResponse({"detail": "Not found"}, status_code=404)(scope, receive, safe_send)
        if path.startswith("/api"):
            origin = request.headers.get("origin")
            if method not in ("GET", "HEAD", "OPTIONS") and origin and origin not in self.origins:
                return await JSONResponse({"detail": "Origin not allowed"}, status_code=403)(scope, receive, safe_send)
            write = method not in ("GET", "HEAD", "OPTIONS")
            if write or (method == "GET" and not path.startswith("/api/media/file/") and path != "/api/"):
                try:
                    allowed, limits, retry = await consume_rate(self.db, client_address(request), "write" if write else "read", MAX_API_WRITES if write else MAX_JSON_READS)
                except Exception:
                    return await JSONResponse({"detail": "Service temporarily unavailable"}, status_code=503)(scope, receive, safe_send)
                extra.update(limits)
                if not allowed:
                    extra["Retry-After"] = str(retry)
                    return await JSONResponse({"detail": "Too many requests. Please try again later."}, status_code=429)(scope, receive, safe_send)
            if "/auth/" in path or path.startswith("/api/security") or request.headers.get("authorization"):
                extra["Cache-Control"] = "no-store"
            # Enforce the whole request bound even before multipart parsing or a chunked upload.
            max_body = 5 * 1024 * 1024 + 64 * 1024 if path.rstrip("/") in ("/api/media", "/api/reviews") else 64 * 1024
            length = request.headers.get("content-length")
            if length and (not length.isdigit() or int(length) > max_body):
                return await JSONResponse({"detail": "Request too large (uploads: 5MB per file)"}, status_code=413)(scope, receive, safe_send)
            if write:
                parts, size = [], 0
                while True:
                    message = await receive()
                    if message["type"] == "http.disconnect":
                        return
                    body = message.get("body", b"")
                    size += len(body)
                    if size > max_body:
                        return await JSONResponse({"detail": "Request too large (uploads: 5MB per file)"}, status_code=413)(scope, receive, safe_send)
                    parts.append(body)
                    if not message.get("more_body", False):
                        break
                sent = False

                async def bounded_receive():
                    nonlocal sent
                    if not sent:
                        sent = True
                        return {"type": "http.request", "body": b"".join(parts), "more_body": False}
                    return await receive()

                return await self.app(scope, bounded_receive, safe_send)
        await self.app(scope, receive, safe_send)