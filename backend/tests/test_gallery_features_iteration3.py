import os
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from dotenv import dotenv_values

import pytest
import requests


FRONTEND_ENV = dotenv_values(Path(__file__).parents[2] / "frontend" / ".env")
BACKEND_ENV = dotenv_values(Path(__file__).parents[1] / ".env")
BASE_URL = os.environ.get("REACT_APP_BACKEND_URL") or FRONTEND_ENV.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    pytest.skip("REACT_APP_BACKEND_URL missing", allow_module_level=True)

BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"

OWNER_EMAIL = BACKEND_ENV["ADMIN_EMAIL"]
OWNER_PASS = BACKEND_ENV["ADMIN_PASSWORD"]


@pytest.fixture(scope="session")
def session_client():
    s = requests.Session()
    s.headers.update({"Accept": "application/json"})
    return s


@pytest.fixture(scope="session")
def owner_token(session_client):
    # Owner auth for protected gallery/admin endpoints
    r = session_client.post(
        f"{API}/auth/login",
        json={"email": OWNER_EMAIL, "password": OWNER_PASS},
        timeout=30,
    )
    if r.status_code != 200:
        pytest.skip(f"Owner login failed: {r.status_code} {r.text}")
    data = r.json()
    assert isinstance(data.get("access_token"), str) and data["access_token"]
    return data["access_token"]


@pytest.fixture(scope="session")
def owner_headers(owner_token):
    return {"Authorization": f"Bearer {owner_token}"}


@pytest.fixture(scope="session")
def seeded_media(session_client):
    # Public media list used for comparison pair selection and tap checks
    r = session_client.get(f"{API}/media", timeout=30)
    assert r.status_code == 200, r.text
    items = r.json()
    assert isinstance(items, list)
    return items


@pytest.fixture
def uploaded_fixtures(session_client, owner_headers):
    # Temp media fixtures: one image + one video for validation paths
    created_ids = []

    tiny_png = bytes.fromhex(
        "89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000D4944"
        "415478DA63FCCFC0F01F0005000100A5A0F2D30000000049454E44AE426082"
    )
    img_files = {"file": ("test_i3_image.png", tiny_png, "image/png")}
    img_data = {
        "title": "TEST_I3_IMAGE_FIXTURE",
        "category": "Soft / Natural",
        "description": "fixture",
        "price": "₱1",
    }
    img = session_client.post(f"{API}/media", files=img_files, data=img_data, headers=owner_headers, timeout=60)
    assert img.status_code == 200, img.text
    image_doc = img.json()
    created_ids.append(image_doc["id"])

    fake_mp4 = b"\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00mp42isom"
    vid_files = {"file": ("test_i3_video.mp4", fake_mp4, "video/mp4")}
    vid_data = {
        "title": "TEST_I3_VIDEO_FIXTURE",
        "category": "Party & Prom",
        "description": "fixture",
        "price": "₱2",
    }
    vid = session_client.post(f"{API}/media", files=vid_files, data=vid_data, headers=owner_headers, timeout=60)
    assert vid.status_code == 200, vid.text
    video_doc = vid.json()
    created_ids.append(video_doc["id"])

    yield {"image": image_doc, "video": video_doc}

    for media_id in created_ids:
        session_client.delete(f"{API}/media/{media_id}", headers=owner_headers, timeout=20)


@pytest.fixture
def restore_placeholder_pair(session_client, owner_headers):
    # Ensure tests always leave comparison pair in placeholder mode
    yield
    body = {
        "before_id": None,
        "after_id": None,
        "before_label": "Bare Face & Skin Prep",
        "after_label": "Davao Signature Full Glam Transformation",
    }
    session_client.put(f"{API}/gallery/comparison", json=body, headers=owner_headers, timeout=30)


class TestMediaPatchOwnerEdit:
    """PATCH /api/media/{id} owner-only edits and validation"""

    def test_patch_requires_auth(self, seeded_media):
        target = seeded_media[0]
        r = requests.patch(f"{API}/media/{target['id']}", json={"title": "TEST"}, timeout=20)
        assert r.status_code == 401

    def test_patch_updates_metadata_only_and_persists(self, session_client, owner_headers, uploaded_fixtures):
        target = uploaded_fixtures["image"]
        get_before = session_client.get(f"{API}/media/{target['id']}", timeout=20)
        assert get_before.status_code == 200
        before_doc = get_before.json()

        new_title = "TEST_I3_EDIT_TITLE"
        payload = {
            "title": new_title,
            "category": "Party & Prom",
            "description": "TEST_I3_EDIT_DESCRIPTION",
            "price": "₱9,999",
        }
        patch = session_client.patch(f"{API}/media/{target['id']}", json=payload, headers=owner_headers, timeout=30)
        assert patch.status_code == 200, patch.text
        updated = patch.json()
        assert updated["title"] == new_title
        assert updated["category"] == "Party & Prom"
        assert updated["description"] == "TEST_I3_EDIT_DESCRIPTION"
        assert updated["price"] == "₱9,999"
        assert updated["url"] == before_doc["url"]
        assert "_id" not in updated

        get_after = session_client.get(f"{API}/media/{target['id']}", timeout=20)
        assert get_after.status_code == 200
        persisted = get_after.json()
        assert persisted["title"] == new_title
        assert persisted["url"] == before_doc["url"]
        assert "_id" not in persisted

        # restore original metadata to preserve seeded gallery expectations
        restore = {
            "title": before_doc["title"],
            "category": before_doc["category"],
            "description": before_doc.get("description", ""),
            "price": before_doc.get("price", ""),
        }
        back = session_client.patch(f"{API}/media/{target['id']}", json=restore, headers=owner_headers, timeout=30)
        assert back.status_code == 200

    @pytest.mark.parametrize(
        "payload, expected_status",
        [
            ({"title": ""}, 422),
            ({"title": " "}, 422),
            ({"title": None}, 422),
            ({"title": "x" * 161}, 422),
            ({"category": "Unknown Category"}, 422),
            ({"description": "x" * 2001}, 422),
            ({"price": "x" * 61}, 422),
            ({"random_field": "oops"}, 422),
            ({}, 422),
        ],
    )
    def test_patch_rejects_invalid_payloads(self, session_client, owner_headers, seeded_media, payload, expected_status):
        target = seeded_media[0]
        r = session_client.patch(f"{API}/media/{target['id']}", json=payload, headers=owner_headers, timeout=20)
        assert r.status_code == expected_status, r.text

    def test_patch_invalid_missing_deleted_ids(self, session_client, owner_headers):
        bad_id = session_client.patch(f"{API}/media/not-an-objectid", json={"title": "TEST"}, headers=owner_headers, timeout=20)
        assert bad_id.status_code == 400

        missing = session_client.patch(
            f"{API}/media/507f1f77bcf86cd799439011",
            json={"title": "TEST"},
            headers=owner_headers,
            timeout=20,
        )
        assert missing.status_code == 404

        # create and soft-delete then patch should 404
        tiny_png = bytes.fromhex(
            "89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000D4944"
            "415478DA63FCCFC0F01F0005000100A5A0F2D30000000049454E44AE426082"
        )
        files = {"file": ("test_deleted_patch.png", tiny_png, "image/png")}
        create = session_client.post(
            f"{API}/media",
            files=files,
            data={"title": "TEST_I3_PATCH_DELETED", "category": "Bridal Glam"},
            headers=owner_headers,
            timeout=60,
        )
        assert create.status_code == 200, create.text
        media_id = create.json()["id"]
        delete = session_client.delete(f"{API}/media/{media_id}", headers=owner_headers, timeout=20)
        assert delete.status_code == 200
        patch_deleted = session_client.patch(f"{API}/media/{media_id}", json={"title": "TEST"}, headers=owner_headers, timeout=20)
        assert patch_deleted.status_code == 404


class TestComparisonPair:
    """GET/PUT /api/gallery/comparison validation and persistence"""

    def test_comparison_get_public(self, session_client):
        r = session_client.get(f"{API}/gallery/comparison", timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert data["before_label"] == "Bare Face & Skin Prep" or isinstance(data.get("before_label"), str)
        assert data["after_label"] == "Davao Signature Full Glam Transformation" or isinstance(data.get("after_label"), str)

    def test_comparison_put_requires_auth(self, session_client):
        r = session_client.put(f"{API}/gallery/comparison", json={"before_id": None, "after_id": None}, timeout=20)
        assert r.status_code == 401

    def test_comparison_put_rejects_invalid_inputs(self, session_client, owner_headers, uploaded_fixtures):
        img_id = uploaded_fixtures["image"]["id"]
        vid_id = uploaded_fixtures["video"]["id"]

        same = session_client.put(
            f"{API}/gallery/comparison",
            json={"before_id": img_id, "after_id": img_id},
            headers=owner_headers,
            timeout=20,
        )
        assert same.status_code == 422

        one_missing = session_client.put(
            f"{API}/gallery/comparison",
            json={"before_id": img_id, "after_id": None},
            headers=owner_headers,
            timeout=20,
        )
        assert one_missing.status_code == 422

        invalid_oid = session_client.put(
            f"{API}/gallery/comparison",
            json={"before_id": "bad-id", "after_id": img_id},
            headers=owner_headers,
            timeout=20,
        )
        assert invalid_oid.status_code in (400, 422)

        reject_video = session_client.put(
            f"{API}/gallery/comparison",
            json={"before_id": img_id, "after_id": vid_id},
            headers=owner_headers,
            timeout=20,
        )
        assert reject_video.status_code == 400

        deleted_id = uploaded_fixtures["image"]["id"]
        d = session_client.delete(f"{API}/media/{deleted_id}", headers=owner_headers, timeout=20)
        assert d.status_code == 200
        deleted_pair = session_client.put(
            f"{API}/gallery/comparison",
            json={"before_id": deleted_id, "after_id": "507f1f77bcf86cd799439011"},
            headers=owner_headers,
            timeout=20,
        )
        assert deleted_pair.status_code in (400, 404)

    def test_comparison_publish_and_reset_placeholder(self, session_client, owner_headers, seeded_media, restore_placeholder_pair):
        photos = [m for m in seeded_media if m.get("media_type") == "image"]
        assert len(photos) >= 2
        before_id, after_id = photos[0]["id"], photos[1]["id"]
        body = {
            "before_id": before_id,
            "after_id": after_id,
            "before_label": "Bare Face & Skin Prep",
            "after_label": "Davao Signature Full Glam Transformation",
        }
        save = session_client.put(f"{API}/gallery/comparison", json=body, headers=owner_headers, timeout=30)
        assert save.status_code == 200, save.text
        saved = save.json()
        assert saved["is_placeholder"] is False
        assert saved["before"]["id"] == before_id
        assert saved["after"]["id"] == after_id

        get_now = session_client.get(f"{API}/gallery/comparison", timeout=20)
        assert get_now.status_code == 200
        now_data = get_now.json()
        assert now_data["before"]["id"] == before_id
        assert now_data["after"]["id"] == after_id

        reset = session_client.put(
            f"{API}/gallery/comparison",
            json={
                "before_id": None,
                "after_id": None,
                "before_label": "Bare Face & Skin Prep",
                "after_label": "Davao Signature Full Glam Transformation",
            },
            headers=owner_headers,
            timeout=30,
        )
        assert reset.status_code == 200
        reset_data = reset.json()
        assert reset_data["is_placeholder"] is True
        assert reset_data["before_id"] is None
        assert reset_data["after_id"] is None
        assert reset_data["before_label"] == "Bare Face & Skin Prep"
        assert reset_data["after_label"] == "Davao Signature Full Glam Transformation"


class TestEnquiryTapInsights:
    """Tap analytics idempotency + owner-only insights"""

    def test_tap_rejects_invalid_uuid(self, session_client, seeded_media):
        look_id = seeded_media[0]["id"]
        r = session_client.post(f"{API}/media/{look_id}/enquiry-tap", json={"event_id": "not-uuid"}, timeout=20)
        assert r.status_code == 422

    def test_tap_missing_deleted_rejected(self, session_client, owner_headers):
        missing = session_client.post(
            f"{API}/media/507f1f77bcf86cd799439011/enquiry-tap",
            json={"event_id": str(uuid.uuid4())},
            timeout=20,
        )
        assert missing.status_code == 404

        tiny_png = bytes.fromhex(
            "89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000D4944"
            "415478DA63FCCFC0F01F0005000100A5A0F2D30000000049454E44AE426082"
        )
        files = {"file": ("test_tap_deleted.png", tiny_png, "image/png")}
        created = session_client.post(
            f"{API}/media",
            files=files,
            data={"title": "TEST_I3_TAP_DELETED", "category": "Bridal Glam"},
            headers=owner_headers,
            timeout=60,
        )
        assert created.status_code == 200
        media_id = created.json()["id"]
        session_client.delete(f"{API}/media/{media_id}", headers=owner_headers, timeout=20)

        deleted = session_client.post(
            f"{API}/media/{media_id}/enquiry-tap",
            json={"event_id": str(uuid.uuid4())},
            timeout=20,
        )
        assert deleted.status_code == 404

    def test_tap_deduplicates_same_event_and_counts_unique(self, session_client, owner_headers, uploaded_fixtures):
        look_id = uploaded_fixtures["image"]["id"]
        first_event = str(uuid.uuid4())
        r1 = session_client.post(f"{API}/media/{look_id}/enquiry-tap", json={"event_id": first_event}, timeout=20)
        assert r1.status_code == 200
        assert r1.json()["recorded"] is True

        r2 = session_client.post(f"{API}/media/{look_id}/enquiry-tap", json={"event_id": first_event}, timeout=20)
        assert r2.status_code == 200
        assert r2.json()["recorded"] is False

        r3 = session_client.post(f"{API}/media/{look_id}/enquiry-tap", json={"event_id": str(uuid.uuid4())}, timeout=20)
        assert r3.status_code == 200
        assert r3.json()["recorded"] is True

        insights = session_client.get(f"{API}/gallery/insights", headers=owner_headers, timeout=20)
        assert insights.status_code == 200
        looks = insights.json()["looks"]
        row = next((x for x in looks if x["id"] == look_id), None)
        assert row is not None
        assert row["taps"] == 2

    def test_tap_concurrent_same_event_counted_once(self, session_client, owner_headers, uploaded_fixtures):
        look_id = uploaded_fixtures["image"]["id"]
        event_id = str(uuid.uuid4())

        def send(_):
            rr = requests.post(
                f"{API}/media/{look_id}/enquiry-tap",
                json={"event_id": event_id},
                timeout=20,
            )
            assert rr.status_code == 200
            return rr.json()["recorded"]

        with ThreadPoolExecutor(max_workers=5) as pool:
            results = list(pool.map(send, range(5)))
        assert sum(1 for x in results if x is True) == 1
        insights = session_client.get(f"{API}/gallery/insights", headers=owner_headers, timeout=20).json()
        assert next(row["taps"] for row in insights["looks"] if row["id"] == look_id) == 1

    def test_insights_owner_only_and_sorted(self, session_client, owner_headers):
        unauth = session_client.get(f"{API}/gallery/insights", timeout=20)
        assert unauth.status_code == 401

        auth = session_client.get(f"{API}/gallery/insights", headers=owner_headers, timeout=20)
        assert auth.status_code == 200
        data = auth.json()
        assert "total_taps" in data and isinstance(data["total_taps"], int)
        assert isinstance(data["looks"], list)
        taps = [m.get("taps", 0) for m in data["looks"]]
        assert taps == sorted(taps, reverse=True)
        for item in data["looks"]:
            assert "_id" not in item

    def test_media_list_does_not_expose_insight_only_fields(self, session_client):
        r = session_client.get(f"{API}/media", timeout=20)
        assert r.status_code == 200
        for m in r.json()[:10]:
            assert "tap_event_ids" not in m
            assert "enquiry_taps" not in m
