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
