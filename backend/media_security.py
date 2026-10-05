"""Photo/video validation and public-gallery namespace restrictions."""
from io import BytesIO
import re
import warnings

import av
from fastapi import HTTPException
from PIL import Image, ImageSequence
from starlette.concurrency import run_in_threadpool

MAX_UPLOAD_BYTES = 5 * 1024 * 1024
IMAGE_TYPES = {"jpg": ("JPEG", "image/jpeg"), "jpeg": ("JPEG", "image/jpeg"), "png": ("PNG", "image/png"), "webp": ("WEBP", "image/webp"), "gif": ("GIF", "image/gif")}
VIDEO_TYPES = {"mp4": ("mov", "video/mp4"), "m4v": ("mov", "video/mp4"), "mov": ("mov", "video/quicktime"), "webm": ("matroska", "video/webm"), "avi": ("avi", "video/x-msvideo")}
SAFE_MEDIA_PATH = re.compile(r"^irsmakup/(?:media|reviews)/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp|gif|mp4|m4v|mov|webm|avi)$")


def public_media_path(path):
    if not SAFE_MEDIA_PATH.fullmatch(path):
        raise HTTPException(404, "File not found")
    return path


def canonical_type(path):
    ext = path.rsplit(".", 1)[-1].lower()
    return (IMAGE_TYPES | VIDEO_TYPES)[ext][1]


def validate_image(data, ext):
    expected, mime = IMAGE_TYPES[ext]
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(BytesIO(data)) as photo:
                if photo.format != expected or photo.width * photo.height > 24000000:
                    raise ValueError("Image format or dimensions not allowed")
                photo.verify()
            with Image.open(BytesIO(data)) as photo:
                output = BytesIO()
                frames = []
                frame_count = getattr(photo, "n_frames", 1)
                if frame_count > 150 or frame_count * photo.width * photo.height > 60000000:
                    raise ValueError("Animation too large")
                if frame_count > 1 and expected in ("GIF", "WEBP"):
                    durations = []
                    for frame in ImageSequence.Iterator(photo):
                        frames.append(frame.convert("RGBA")); durations.append(frame.info.get("duration", 100))
                    frames[0].save(output, format=expected, save_all=True, append_images=frames[1:], duration=durations, loop=photo.info.get("loop", 0))
                else:
                    photo.load()
                    clean = photo.convert("RGB" if expected == "JPEG" else "RGBA")
                    clean.save(output, format=expected, **({"quality": 92} if expected in ("JPEG", "WEBP") else {}))
                result = output.getvalue()
                if len(result) > MAX_UPLOAD_BYTES:
                    raise HTTPException(413, "Validated photo exceeds 5MB")
                return result, mime
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(400, "Invalid or damaged photo. Upload a genuine JPEG, PNG, WebP or GIF image.")


def validate_video(data, ext):
    container_format, mime = VIDEO_TYPES[ext]
    try:
        # Forced binary container + in-memory buffer: never parse playlists/URLs.
        with av.open(BytesIO(data), format=container_format, options={"protocol_whitelist": "file,pipe"}) as container:
            if not container.streams.video:
                raise ValueError("Missing video")
            stream = container.streams.video[0]
            if not stream.width or not stream.height or stream.width * stream.height > 9000000:
                raise ValueError("Invalid video dimensions")
            frame = next(container.decode(video=0), None)
            if frame is None:
                raise ValueError("Unplayable video")
        return data, mime
    except Exception:
        raise HTTPException(400, "Invalid or damaged video. Upload a genuine MP4, MOV, WebM or AVI file.")


async def validated_upload(file, photos_only=False):
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    types = IMAGE_TYPES if photos_only else IMAGE_TYPES | VIDEO_TYPES
    if ext not in types:
        raise HTTPException(400, "Only gallery photos and videos are allowed. Documents and executable files are not supported.")
    expected_mime = types[ext][1]
    supplied = (file.content_type or "").split(";", 1)[0].strip().lower()
    accepted = {expected_mime}
    if ext == "m4v":
        accepted.add("video/x-m4v")
    if ext == "avi":
        accepted.add("video/avi")
    if supplied not in accepted:
        raise HTTPException(400, "File extension and MIME type do not match")
    data = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "File exceeds the 5MB limit")
    if not data:
        raise HTTPException(400, "Empty files are not allowed")
    validator = validate_image if ext in IMAGE_TYPES else validate_video
    clean, mime = await run_in_threadpool(validator, data, ext)
    return clean, mime, ext, "image" if ext in IMAGE_TYPES else "video"