# PRD — irsmakup.com · Hikarah Lntc Makeup Artist Portfolio

## Original Problem Statement
Premium, high-converting, Awwwards-level makeup artist portfolio website for **Hikarah Lntc** (brand: irsmakup.com), Philippines. Primary goal: drive direct WhatsApp bookings (+63 9558896008) and Facebook follows. Must be colorful, modern, easy-to-book UI, mobile-first. Later additions: owner can post her own makeup photos & videos on the site; Cebuano language touches; Christian church wedding + Jehovah's Witness (modest/soft glam) representation with matching images.

## Architecture
- **Frontend**: React (CRA) + Tailwind + framer-motion + lenis smooth scroll. Single-page site `/` + Owner panel `/admin` (react-router).
  - Sections: Navbar (glass sticky), Hero (masked line reveal, parallax, circular rotating badge), Marquee (plum, slow), About (stats), Services (4 cards, WhatsApp inquire), Portfolio (before/after drag slider, filters, masonry, lightbox, owner-uploaded media with "New" badge + videos), Pricing (3 PHP packages), Trust (dark, brands wall), Reviews, Booking form (saves to backend → opens WhatsApp prefilled), Footer (big CTA, tel:, FB, Owner Login).
- **Backend**: FastAPI + MongoDB (motor). `/api/inquiries` (POST/GET), `/api/auth/login` (bcrypt + JWT, 5-attempt lockout), `/api/media` (POST upload multipart, GET public list), `/api/media/file/{path}` (public serve), `/api/media/{id}` DELETE (soft). Object storage via Emergent objstore playbook (paths prefixed `irsmakup/media/…`).
- **Auth**: single seeded owner admin; credentials in `/app/memory/test_credentials.md`. JWT Bearer, 7-day token. Admin panel: upload photo/video (≤100MB), metadata editing, comparison selection, enquiry insights, list + delete.
- Fonts: Cormorant Garamond (serif) + Plus Jakarta Sans. Palette: blush #E89CAE, rosegold #C5A059, plum #4A1525, champagne #E5C378, ruby #E63956, cream #FAF7F5. Custom SVG monogram logo + favicon.

## User Personas
1. **Bride/family (mobile, PH)** — browses portfolio, checks packages, books instantly via WhatsApp.
2. **Owner (Hikarah)** — logs into /admin, posts fresh makeup photos/videos, deletes old posts.

## Core Requirements (static)
- WhatsApp CTA everywhere with prefilled messages; FB links target=_blank.
- Cebuano-English mixed copy (Maayong adlaw, gwapa! · Book karon! · Gwapa kaayo ka · Salamat kaayo · Kasalan Glam).
- Christian church weddings + JW modest soft-glam explicitly covered (services copy, booking dropdown, About).
- Before/after interactive slider; gallery filters All/Bridal/Glam/Soft Glam/Editorial/Hair.

## Implemented (2026-10-05)
- Full single-page site (all sections above), responsive (1440/390 verified), lenis + framer-motion reveals, marquee, parallax hero.
- Booking form → POST /api/inquiries (Mongo) → WhatsApp handoff; error fallback opens WhatsApp directly.
- Owner Studio at /admin: bcrypt+JWT login, photo/video upload to object storage, public serving, soft delete; live in portfolio with "New" badge; videos play on hover/inline.
- Sample content flagged: prices (₱6.5k/₱12k/₱18k), reviews (3 testimonials), stats (8+ yrs, 500+ brides), before/after pair — replace with real client data.

## Implemented (2026-10-05, update 2)
- Real Brides Wall: owner posts client reviews (name, event, quote, 1–5 rating, client photo) from Owner Studio → live in Reviews section; falls back to samples when empty. POST/GET/DELETE /api/reviews.
- Bulk upload: Owner Studio media input accepts up to 10 photos/videos at once (sequential upload, per-file toast).
- Footer social buttons: Instagram / Pinterest / YouTube (placeholder handles @irsmakup — replace with real handles).
- Google Maps embed (Philippines service-area) in Booking section.

## Implemented (2026-10-05, update 3)
- Inquiry Inbox: Owner Studio me "Booking Inquiries" panel — har form inquiry (naam, phone, date, event type, venue, pax, message) owner ko dikhti hai with one-tap "Reply on WhatsApp". GET /api/inquiries ab owner-only hai (privacy fix; pehle public tha).

## Implemented (2026-10-05, update 4)
- Studio Settings (Owner Studio): studio address, service-area line, Facebook/Instagram/Pinterest/YouTube links editable by owner. GET /api/settings (public) / PUT /api/settings (owner). Booking map pin + address line and Footer social icons/address read from settings. Default studio address: Narra St. Victoria Pelayo, Brgy Centro Agdao, Davao City. Empty social link hides that icon.
- Inquiry Inbox: Mark as Replied / Mark as New toggle (PATCH /api/inquiries/{id}/status), New/Replied badges, All/New/Replied filter, "N new" counter. New inquiries default status "new".
- Portfolio rebuilt as "Our Real Transformations & Client Gallery": 8 real client photos (owner-provided) seeded into object storage + db.media via `/app/backend/seed_gallery.py` (idempotent). Filter tabs All Looks / Bridal Glam / Soft / Natural / Party & Prom / Eye & Brows; hover overlay (soft pink/nude) shows look name, category, price; gold 5.0 ★ badge; lightbox with description, price, "Book This Look" WhatsApp CTA, keyboard nav. Stock gallery images removed (before/after slider kept, still stock).
- Media schema extended: description, price, rating. Admin upload form has Description + Price inputs; categories updated to the new 5.
- Components split: `components/gallery/GalleryCard.jsx`, `GalleryLightbox.jsx`, `components/admin/StudioSettings.jsx`, hook `lib/useSettings.js`.
- Gallery prices are placeholders (₱18,000 bridal, ₱8,500 full glam+hair, ₱6,500 party/prom, ₱4,500 soft/natural, ₱2,500 kilay/eye) — owner should confirm. Two extra photos got agent-assigned titles ("Radiant Smile Bridal Glow", "Dreamy Soft Glam Portrait").

## Current User Requests (2026-10-05, update 5)
- Enable editing gallery posts from Owner Studio without re-uploading photos.
- Implement a real before & after drag slider using two of Hikarah's own client photos.
- Add look enquiry counters to track most popular "Book This Look" taps.
- Add shareable look cards to share via Messenger or WhatsApp from the lightbox.
- Clarified: **Dynamic Admin Selection**, initially use clearly labeled placeholder photos with captions **Bare Face & Skin Prep** / **Davao Signature Full Glam Transformation**. Owner selects any two uploaded photos; touch-friendly comparison, hover badges. User selected both direct link and share card options; both implemented.
- User supplied alternative `.look-action` CSS; retained ONE rule using `border-color: color-mix(in srgb, currentColor 20%, transparent)` (no unsupported `border-current/20` utility).
- Latest user: "ye jo photos mai money diye hai unhe htaa kr low budget like 500 peso 1500 peso 300 peso 1000 peso 700 peso krdo". Applied to all 8 gallery photos; category mapping below. Service/package section rates were not requested and remain unchanged.

## Implemented (2026-10-05, update 5)
- **Edit existing looks**: owner-only `PATCH /api/media/{id}` accepts title/category/description/price, validates limits/categories/nulls; file URL/id/type stay intact. Edit dialog with original preview, save/cancel/error states. Public gallery, lightbox, booking and share text reflect saved metadata on load.
- **Dynamic comparison**: public `GET /api/gallery/comparison`, owner-only `PUT`; settings doc `_id: gallery_comparison` stores two distinct active image IDs and captions. Reject videos, deleted/missing ids, same image and partial pairs. Default and missing/deleted selections fall back to honestly labeled placeholders, not a claimed real transformation. Owner selection UI + preview + Publish pair + Use placeholders. `BeforeAfter.jsx`: fixed-size aligned images using clip-path (no distorted resizing), pointer capture/cancellation, pan-y touch scrolling, 0–100% drag, keyboard arrows/Home/End, accessible slider values. Hover/focus badges on hover-capable desktop, always visible on touch devices.
- **Look enquiry counts**: public `POST /api/media/{id}/enquiry-tap` accepts a UUID event; atomic Mongo `$inc` plus bounded latest-100 event-ID retry deduplication. `GET /api/gallery/insights` is owner-only and returns active-post totals/ranking. Private metrics excluded from public media responses. Admin total, top five and each post's tap count; refresh and focus refresh. Counts mean button taps, NOT sent messages, unique clients or confirmed bookings. No visitor PII, no fabricated analytics; verified +1 test click removed with exact event/timestamp guard.
- **Share looks**: `/?look=<id>#portfolio` links reopen correct lightbox, support next/previous/history, removed/invalid look notice. New public `GET /api/media/{id}` supports direct look retrieval. WhatsApp share composer, browser share sheet (Messenger only when available), clipboard/manual-copy fallback. PNG look cards (1080×1350) contain uncropped photo, title/category/price/brand; pregenerated for native file sharing, with download fallback. Video cards are explicitly text-only; existing video card/lightbox rendering preserved. No API credentials or automatic social messages. Platform-generated social link preview thumbnails (Open Graph) are not included.
- **Lightbox** uses accessible shadcn/Radix dialog, keyboard navigation, focus trap/restore, scroll locking and scrollable mobile content. Gallery cards are keyboard accessible and use unique data-testids. API URL now fails fast when missing env configuration.
- **Budget prices now saved in Mongo + seed script**: Bridal Glam **₱1,500** (Classic Davao / Radiant Smile); Soft / Natural **₱500** (Fresh Filipina / Dreamy Soft); Party & Prom **₱700** (Sultry Evening / Prom & Graduation); Full Glam & Hair **₱1,000**; Eye & Brows **₱300**. Prices remain owner-editable, no photo re-upload. Existing service/package prices deliberately unchanged.

### New/Updated Files & Data
- Backend: `gallery_features.py` (typed router factory, validation, comparison, counters, insights); `server.py` registers router; `seed_gallery.py` uses budget pricing.
- Frontend: `components/admin/{MediaPostEditor,ComparisonManager,LookInsights}.jsx`, `components/gallery/{BeforeAfter,LookShare,GalleryLightbox,GalleryCard}.jsx`; `lib/{gallery,lookCard}.js`; updated Portfolio/Admin/dialog/CSS/site.
- `media` optional private fields: `enquiry_taps`, `tap_event_ids` (bounded 100 UUIDs), `last_enquiry_tap_at`, `updated_at`. IDs serialized explicitly; no ObjectId leakage.
- Current public data: 8 original photos intact, low-budget prices applied; comparison intentionally remains PLACEHOLDER until owner publishes a real pair.

### Verification
- `yarn build` succeeds without warnings after callback dependencies/CSS fix; Python compilation passes.
- Testing agent `/app/test_reports/iteration_3.json`: 22 backend tests pass; edit/save/persistence, comparison publish/reset, enquiry increments, sharing fallbacks, deep links/history, keyboard/focus validated. Tests extended for actual concurrent duplicate-event requests and to edit disposable fixtures rather than real gallery posts; 22/22 pass again.
- Follow-up browser verification: desktop `(hover: hover)` reports true; badge opacity is **0 before hover, 1 on hover** (testing report's unconditional-badge RCA was not reproducible; existing media-query CSS works). Keyboard full endpoints pass. PNG Blob inspected: 1080×1350, 720,510 bytes, 14,284 sampled photo colours — real image content, not blank.
- Budget update: all 8 saved records re-fetched and asserted; public card prices, lightbox price and encoded WhatsApp booking/share messages verified in browser. Generated look card ready with updated data.
- Native Messenger targets/file handoff depend on installed apps/browser; real-device send-sheet testing remains user verification. No app APIs are mocked. PLACEHOLDERS: before/after preview photos only (plus pre-existing sample content described above).

## Prioritized Backlog / Next Action Items
- **P0**: none known in requested gallery flows. User verification pending.
- **P1**: Hikarah to select actual before/after photo pair in Owner Studio; verify native Messenger/file sharing on her phone; set real social handles. Optionally align Services/Pricing rates with the new gallery budget (not yet requested).
- **P2**: gallery/admin pagination; video thumbnails; inquiry deletion; optional social Open Graph previews. Pre-existing auth hardening follow-up (CORS policy and cookie/session strategy) needs separate scoped work; no auth changes made in this task, bearer flow works. `/app/auth_testing.md` mentioned by tester does not exist and was not a requirement of this gallery task.
- **Enhancement suggestion**: budget-based gallery filters (e.g. under ₱500 / ₱1,000 / ₱1,500) to help clients find an affordable look quickly.
