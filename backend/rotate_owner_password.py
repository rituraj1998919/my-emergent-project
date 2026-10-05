"""Explicit local owner rotation; never run implicitly during application startup.

Run only with operator authorization. Writes the new credential to ignored files,
never stdout. Production secrets cannot be modified by this local utility.
"""
import argparse
from datetime import datetime, timezone
from pathlib import Path
import secrets
import os

import bcrypt
from dotenv import dotenv_values, set_key
from pymongo import MongoClient


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--confirm-rotate-owner", action="store_true", required=True)
    parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    env_path = root / "backend" / ".env"
    values = dotenv_values(env_path)
    db = MongoClient(values["MONGO_URL"])[values["DB_NAME"]]
    email = values["ADMIN_EMAIL"].strip().lower()
    user = db.users.find_one({"email": email, "role": "owner"})
    if not user:
        raise RuntimeError("Configured owner does not exist; rotation aborted")
    password = secrets.token_urlsafe(24)
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    result = db.users.update_one({"_id": user["_id"], "password_hash": user["password_hash"]}, {"$set": {"password_hash": hashed, "password_changed_at": datetime.now(timezone.utc).isoformat()}, "$inc": {"token_version": 1}})
    if result.modified_count != 1:
        raise RuntimeError("Owner changed concurrently; rotation aborted")
    set_key(str(env_path), "ADMIN_PASSWORD", password)
    credentials = root / "memory" / "test_credentials.md"
    credentials.write_text(f"""# Owner test credentials — private operational file

Updated: {datetime.now(timezone.utc).date().isoformat()}
Scope: current preview database only; not a production secret update.
Owner route: `/admin`; security route: `/admin/security`.
Preview URL: read `frontend/.env` REACT_APP_BACKEND_URL (never assume a historic URL).

- Email: {email}
- Password: {password}
- Role: owner
- Prior demonstration password has been invalidated. Existing JWT sessions revoked by token version.

Security testing: read `/app/auth_testing.md`; never brute-force the actual owner.
Authentication: POST `/api/auth/login`, GET `/api/auth/me`, PUT `/api/auth/password`.
Private security events: GET `/api/security/events`, PATCH `/api/security/events/{{id}}/review`.
Existing gallery/settings/inquiry routes use the same Bearer owner session.
No external email/SMS credentials or alert destination configured.

Do not copy these values to reports, application source, public assets or Git.
""")
    os.chmod(credentials, 0o600)
    os.chmod(env_path, 0o600)
    print("Owner password rotated; prior sessions revoked. New credential written to ignored memory/test_credentials.md and backend/.env. No secret printed.")


if __name__ == "__main__":
    main()