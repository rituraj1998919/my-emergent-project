# Authentication Security Regression Playbook

This existing application uses explicit Authorization Bearer JWTs, NOT ambient cookies.
Do not migrate authentication vendors or require cookie checks for this scoped fix.
Production runtime is not available here; use current REACT_APP_BACKEND_URL for browser/API tests.
Read `/app/memory/test_credentials.md` before testing. Never expose secrets in reports.

## MongoDB verification
- Owner password hashes are bcrypt. No literal default credentials in application source.
- `users.email` unique; limiter expiry and security-event expiry have TTL indexes.
- Tokens have `sub`, `type`, `exp`, `iat`, and `ver`; owner guard verifies current DB role and token version.
- Seeding creates only a missing owner; restarting never overwrites an existing password hash.

## Login regression (isolated disposable users, never lock the real owner)
- Wrong passwords 1–4 return 401; failure 5 starts a 15-minute lock and returns 429.
- Correct/wrong password during active lock returns 429 + Retry-After; retries never extend the lock.
- Advance stored expiry for TEST account rather than sleep: success after expiry returns 200; wrong password after expiry starts at count 1.
- Legacy naive/aware BSON datetime locks are normalized to UTC milliseconds; missing/corrupt/expired legacy records cannot permanently jam login.
- Concurrent failures reach threshold atomically; no 500s and no counter loss.
- Successful login clears failed attempts. Invalid/expired/deleted-user/revoked JWTs return 401.
- Password change requires correct current password, valid new password, and revokes prior sessions; existing owner remains unchanged in tests.

## HTTP/browser checks
- Rate limits persist in Mongo across restarts and respond 429 with standard limit and Retry-After headers. Use isolated ASGI/IP fixtures for bursts; don't exhaust real owner's live budget.
- Spoofed forwarded headers do not bypass rate limits when sender isn't trusted.
- CORS accepts configured exact origins only, never wildcard credentials.
- Owner dashboard displays active lock error/countdown, security-event list and reviewed status; no events accessible anonymously.
- Unfamiliar successful browser/network and lockout generate private dashboard alerts. No geo-location claims and no email/SMS sending configured.
- Missing/stale session sends owner back to login rather than silently showing empty private records.

## Cleanup
- Remove only disposable TEST users, TEST lock/rate records/events and uploaded fixture documents; preserve 8 client photos, pricing, settings, inquiries and real owner credentials.
- If test credentials are created or changed, immediately update ignored `/app/memory/test_credentials.md`.
- Final bug-fix verification MUST come from testing_agent report.