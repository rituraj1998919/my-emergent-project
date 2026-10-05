"""One-off seed: uploads the owner's real client photos into object storage + db.media.
Idempotent: skips titles that already exist. Run: python seed_gallery.py
"""
import asyncio
import uuid
from datetime import datetime, timezone
from pathlib import Path

from server import db, put_object, APP_NAME

PHOTOS = [
    ("a8.jpg", "Classic Davao Bridal Glam", "Bridal Glam", "Elegant, long-lasting wedding makeup with flawless skin prep.", "₱18,000"),
    ("a7.jpg", "Fresh Filipina Natural Look", "Soft / Natural", "Lightweight, glowing everyday makeup for a soft, radiant look.", "₱4,500"),
    ("a1.jpg", "Sultry Evening Party Glam", "Party & Prom", "Bold eyes, defined contour, and full glam for nightlife and special events.", "₱6,500"),
    ("a4.jpg", "Prom & Graduation Queen Look", "Party & Prom", "Youthful, photo-ready glam designed to look stunning on camera.", "₱6,500"),
    ("a3.jpg", "Signature Full Glam & Hair Combo", "Bridal Glam / Full Glam", "Complete face makeover paired with soft waves or sleek hair.", "₱8,500"),
    ("a5.jpg", "Precision Kilay & Eye Accent", "Eye & Brows", "Perfectly shaped eyebrows and eye makeup to pop your facial features.", "₱2,500"),
    ("a6.jpg", "Radiant Smile Bridal Glow", "Bridal Glam", "Luminous bridal skin with soft rose lips and pearl-pinned updo — made to last the whole celebration.", "₱18,000"),
    ("a2.jpg", "Dreamy Soft Glam Portrait", "Soft / Natural", "Barely-there base, warm bronzed lids and a nude lip for effortless, camera-ready softness.", "₱4,500"),
]


async def main():
    src = Path("/tmp/gal")
    for fname, title, category, description, price in PHOTOS:
        if await db.media.find_one({"title": title, "is_deleted": False}):
            print("skip", title)
            continue
        data = (src / fname).read_bytes()
        result = put_object(f"{APP_NAME}/media/{uuid.uuid4()}.jpg", data, "image/jpeg")
        await db.media.insert_one({
            "storage_path": result["path"],
            "title": title,
            "category": category,
            "description": description,
            "price": price,
            "rating": 5.0,
            "media_type": "image",
            "original_filename": fname,
            "content_type": "image/jpeg",
            "size": result.get("size", len(data)),
            "is_deleted": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        print("added", title)


if __name__ == "__main__":
    asyncio.run(main())
