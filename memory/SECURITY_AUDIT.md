# Security Audit — Hikarah Lntc / irsmakup.com

Date: 2026-10-05
Request: "Run the Security Audit on the deployed app."
Mode: Read-only. No application code, credentials, data, or production configuration changed.

## Scope and verdict
- **Conditional source/configuration pass — needs attention. NOT a production security certification.**
- Confidence: medium. No verified production URL/runtime available; only the current preview URL from frontend environment was identifiable. Production deployment, hosting controls, actual production secrets, headers, and storage tenancy remain unverified.
- No confirmed critical/high exploit found in the reviewed source. This does not establish their absence in production.

## Findings
### SEC-001 — Medium, likely: owner login lockout can jam
- `backend/server.py` around lines 23 and 291–302: Mongo client is not timezone-aware, while lockout logic compares stored `locked_until` to a timezone-aware UTC datetime.
- After the failed-login threshold, a naive/aware comparison can raise TypeError on every subsequent login. Successful-login cleanup becomes unreachable.
- Impact: an attacker knowing the owner email could deny owner dashboard access.
- Evidence: source-inferred; not exercised against the owner account or production, avoiding deliberate lockout.
- Remediation: consistent UTC handling, expired-lock reset, bounded attempt policy; verify fresh/active/expired locks and successful login after expiry with isolated test accounts.

### SEC-002 — Low, confirmed in source/config: secret-file hygiene and default/self-resetting credentials
- `.gitignore` does not ignore `.env`; environment secret files were reported untracked by the auditor, not confirmed leaked.
- `backend/server.py` around lines 418–433 contains fallback admin credentials and rewrites the stored password to the environment value on startup.
- Current environment overrides are present; default credential exposure is conditional on configuration loss. Secret values are intentionally omitted here.
- Remediation: ignore secret environment files, remove credential fallbacks, fail fast on missing settings, seed once rather than resetting passwords implicitly. Rotate secrets only if actual exposure is established.

### SEC-003 — Low, confirmed: public write abuse controls absent
- Anonymous `POST /api/media/{id}/enquiry-tap` and `POST /api/inquiries` lack rate limits/quotas.
- Unique-event spam can inflate analytics and inquiry writes despite bounded retry ID storage.
- Remediation: per-source/time request limits and proportionate bot mitigation; validate legitimate booking usability and rejected excessive requests.

## Additional hardening
- Credentialed wildcard CORS: use an explicit allowed-origin policy. Bearer tokens are not automatically attached by foreign sites, so current cookie-CSRF assumptions would overstate impact. HttpOnly cookie migration is optional architecture work, not itself a confirmed vulnerability.
- Public object-storage proxy: enforce app namespace/path validation; actual cross-tenant exploitability depends on unverified storage-key scope.
- Owner-only uploads: validate file signatures and normalize served MIME types rather than trusting client content type.

## Coverage
Reviewed backend authentication/JWT, owner guards, private/public boundaries, Mongo query parameterization, IDs/UUIDs, React output escaping, share/canvas code, manifests, CORS, file upload/proxy and resource controls. No dangerous HTML injection found in reviewed React rendering; protected mutation/private routes enforce the owner guard.

## Next steps
1. Remediate SEC-001 first. Authentication changes require the auth integration playbook before implementation.
2. Then secret/seeding hygiene and public endpoint abuse limits; test each affected flow.
3. Obtain the actual deployed URL/runtime access for production verification, without disclosing secrets.
4. **No fixes applied in this audit.** If any fix is subsequently implemented, the testing agent must verify it before reporting it fixed, per the user's instruction.