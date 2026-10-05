import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://beauty-showcase-106.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

OWNER_EMAIL = "hikarah@irsmakup.com"
OWNER_PASS = "GlamQueen#2024"

DEFAULT_SETTINGS = {
    "studio_address": "Narra St. Victoria Pelayo, Brgy Centro Agdao, Davao City",
    "service_area": "Davao City studio & doorstep — all over the Philippines",
    "instagram": "https://instagram.com/irsmakup",
    "pinterest": "https://pinterest.com/irsmakup",
    "youtube": "https://youtube.com/@irsmakup",
    "facebook": "https://www.facebook.com/share/19axnjTYpP/",
}


@pytest.fixture(scope="session")
def token():
    r = requests.post(f"{API}/auth/login", json={"email": OWNER_EMAIL, "password": OWNER_PASS}, timeout=20)
    if r.status_code != 200:
        pytest.skip(f"Login failed: {r.status_code} {r.text}")
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# ---- Settings ----
class TestSettings:
    def test_get_settings_public(self):
        r = requests.get(f"{API}/settings", timeout=20)
        assert r.status_code == 200
        d = r.json()
        for k in ("studio_address", "service_area", "instagram", "pinterest", "youtube", "facebook"):
            assert k in d

    def test_put_settings_unauthenticated(self):
        r = requests.put(f"{API}/settings", json=DEFAULT_SETTINGS, timeout=20)
        assert r.status_code == 401

    def test_put_settings_authenticated_prepends_https(self, auth_headers):
        payload = {**DEFAULT_SETTINGS, "instagram": "instagram.com/testuser"}
        r = requests.put(f"{API}/settings", json=payload, headers=auth_headers, timeout=20)
        assert r.status_code == 200
        assert r.json()["instagram"] == "https://instagram.com/testuser"
        # verify persisted
        g = requests.get(f"{API}/settings", timeout=20).json()
        assert g["instagram"] == "https://instagram.com/testuser"

    def test_put_settings_allows_empty_social(self, auth_headers):
        payload = {**DEFAULT_SETTINGS, "pinterest": ""}
        r = requests.put(f"{API}/settings", json=payload, headers=auth_headers, timeout=20)
        assert r.status_code == 200
        assert r.json()["pinterest"] == ""
        g = requests.get(f"{API}/settings", timeout=20).json()
        assert g["pinterest"] == ""

    def test_restore_defaults(self, auth_headers):
        r = requests.put(f"{API}/settings", json=DEFAULT_SETTINGS, headers=auth_headers, timeout=20)
        assert r.status_code == 200
        g = requests.get(f"{API}/settings", timeout=20).json()
        for k, v in DEFAULT_SETTINGS.items():
            assert g[k] == v


# ---- Inquiries ----
class TestInquiries:
    created_id = None

    def test_create_inquiry_default_new_status(self, auth_headers):
        payload = {
            "name": "TEST_Playwright",
            "phone": "+639000000000",
            "event_date": "2026-02-14",
            "event_type": "Bridal",
            "venue": "Davao",
            "pax": 2,
            "message": "test inquiry from automated test",
        }
        r = requests.post(f"{API}/inquiries", json=payload, timeout=20)
        assert r.status_code == 200, r.text
        TestInquiries.created_id = r.json()["id"]
        # verify in list
        lst = requests.get(f"{API}/inquiries", headers=auth_headers, timeout=20).json()
        found = next((i for i in lst if i["id"] == TestInquiries.created_id), None)
        assert found is not None
        assert found["status"] == "new"
        # ensure all items have status
        for item in lst:
            assert "status" in item

    def test_patch_status_requires_auth(self):
        r = requests.patch(f"{API}/inquiries/{TestInquiries.created_id}/status", json={"status": "replied"}, timeout=20)
        assert r.status_code == 401

    def test_patch_status_replied_and_revert(self, auth_headers):
        r = requests.patch(f"{API}/inquiries/{TestInquiries.created_id}/status",
                           json={"status": "replied"}, headers=auth_headers, timeout=20)
        assert r.status_code == 200
        assert r.json()["status"] == "replied"
        # verify list reflects
        lst = requests.get(f"{API}/inquiries", headers=auth_headers, timeout=20).json()
        found = next((i for i in lst if i["id"] == TestInquiries.created_id), None)
        assert found["status"] == "replied"
        # revert
        r2 = requests.patch(f"{API}/inquiries/{TestInquiries.created_id}/status",
                            json={"status": "new"}, headers=auth_headers, timeout=20)
        assert r2.status_code == 200
        assert r2.json()["status"] == "new"

    def test_patch_invalid_status(self, auth_headers):
        r = requests.patch(f"{API}/inquiries/{TestInquiries.created_id}/status",
                           json={"status": "bogus"}, headers=auth_headers, timeout=20)
        assert r.status_code == 400

    def test_patch_bad_id(self, auth_headers):
        r = requests.patch(f"{API}/inquiries/not-an-objectid/status",
                           json={"status": "replied"}, headers=auth_headers, timeout=20)
        assert r.status_code == 400

    def test_patch_unknown_id(self, auth_headers):
        r = requests.patch(f"{API}/inquiries/507f1f77bcf86cd799439011/status",
                           json={"status": "replied"}, headers=auth_headers, timeout=20)
        assert r.status_code == 404


# ---- Media / Gallery (iteration 2) ----
EXPECTED_TITLES = {
    "Classic Davao Bridal Glam": ("Bridal Glam", "₱18,000"),
    "Fresh Filipina Natural Look": ("Soft / Natural", "₱4,500"),
    "Sultry Evening Party Glam": ("Party & Prom", "₱6,500"),
    "Prom & Graduation Queen Look": ("Party & Prom", "₱6,500"),
    "Signature Full Glam & Hair Combo": ("Bridal Glam / Full Glam", "₱8,500"),
    "Precision Kilay & Eye Accent": ("Eye & Brows", "₱2,500"),
    "Radiant Smile Bridal Glow": ("Bridal Glam", "₱18,000"),
    "Dreamy Soft Glam Portrait": ("Soft / Natural", "₱4,500"),
}


class TestMediaGallery:
    def test_media_list_has_8_seeded(self):
        r = requests.get(f"{API}/media", timeout=20)
        assert r.status_code == 200
        items = r.json()
        # filter only seeded (exclude any test uploads with 'TEST_' prefix)
        seeded = [m for m in items if m["title"] in EXPECTED_TITLES]
        assert len(seeded) == 8, f"Expected 8 seeded photos, got {len(seeded)}. Titles: {[m['title'] for m in items]}"
        for m in seeded:
            exp_cat, exp_price = EXPECTED_TITLES[m["title"]]
            assert m["category"] == exp_cat, f"{m['title']}: category {m['category']} != {exp_cat}"
            assert m["price"] == exp_price, f"{m['title']}: price {m['price']} != {exp_price}"
            assert m["rating"] == 5.0
            assert m["media_type"] == "image"
            assert m["url"].startswith("/api/media/file/")
            assert m.get("description", "") != ""
            for key in ("id", "url", "title", "category", "description", "price", "rating", "media_type"):
                assert key in m

    def test_media_file_served(self):
        lst = requests.get(f"{API}/media", timeout=20).json()
        seeded = [m for m in lst if m["title"] in EXPECTED_TITLES]
        assert seeded, "No seeded media"
        url = f"{BASE_URL}{seeded[0]['url']}"
        r = requests.get(url, timeout=30)
        assert r.status_code == 200
        assert r.headers.get("Content-Type", "").startswith("image/")
        assert len(r.content) > 100

    def test_media_upload_and_delete(self, auth_headers):
        # tiny 1x1 PNG
        png = bytes.fromhex(
            "89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000D4944"
            "415478DA63FCCFC0F01F0005000100A5A0F2D30000000049454E44AE426082"
        )
        files = {"file": ("test_tiny.png", png, "image/png")}
        data = {
            "title": "TEST_Upload Playwright",
            "category": "Party & Prom",
            "description": "test description",
            "price": "₱6,500",
        }
        r = requests.post(f"{API}/media", files=files, data=data, headers=auth_headers, timeout=60)
        assert r.status_code == 200, r.text
        doc = r.json()
        assert doc["title"] == "TEST_Upload Playwright"
        assert doc["category"] == "Party & Prom"
        assert doc["description"] == "test description"
        assert doc["price"] == "₱6,500"
        assert doc["rating"] == 5.0
        assert doc["media_type"] == "image"
        media_id = doc["id"]

        # verify present in list
        lst = requests.get(f"{API}/media", timeout=20).json()
        assert any(m["id"] == media_id for m in lst)

        # delete
        d = requests.delete(f"{API}/media/{media_id}", headers=auth_headers, timeout=20)
        assert d.status_code == 200
        assert d.json()["status"] == "deleted"

        # confirm gone
        lst2 = requests.get(f"{API}/media", timeout=20).json()
        assert not any(m["id"] == media_id for m in lst2)

        # ensure 8 seeded still intact
        seeded = [m for m in lst2 if m["title"] in EXPECTED_TITLES]
        assert len(seeded) == 8

    def test_media_upload_requires_auth(self):
        files = {"file": ("x.png", b"not-a-real-png", "image/png")}
        r = requests.post(f"{API}/media", files=files, data={"title": "x"}, timeout=20)
        assert r.status_code == 401


# ---- Regression ----
class TestRegression:
    def test_media_list(self):
        r = requests.get(f"{API}/media", timeout=20)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_reviews_list(self):
        r = requests.get(f"{API}/reviews", timeout=20)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_root(self):
        r = requests.get(f"{API}/", timeout=20)
        assert r.status_code == 200
