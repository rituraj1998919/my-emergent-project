# PRD — irsmakup.com · Hikarah Lntc Makeup Artist Portfolio

## Original Problem Statement
Premium, high-converting, Awwwards-level makeup artist portfolio website for **Hikarah Lntc** (brand: irsmakup.com), Philippines. Primary goal: drive direct WhatsApp bookings (+63 9558896008) and Facebook follows. Must be colorful, modern, easy-to-book UI, mobile-first. Later additions: owner can post her own makeup photos & videos on the site; Cebuano language touches; Christian church wedding + Jehovah's Witness (modest/soft glam) representation with matching images.

## Architecture
- **Frontend**: React (CRA) + Tailwind + framer-motion + lenis smooth scroll. Single-page site `/` + Owner panel `/admin` (react-router).
  - Sections: Navbar (glass sticky), Hero (masked line reveal, parallax, circular rotating badge), Marquee (plum, slow), About (stats), Services (4 cards, WhatsApp inquire), Portfolio (before/after drag slider, filters, masonry, lightbox, owner-uploaded media with "New" badge + videos), Pricing (3 PHP packages), Trust (dark, brands wall), Reviews, Booking form (saves to backend → opens WhatsApp prefilled), Footer (big CTA, tel:, FB, Owner Login).
- **Backend**: FastAPI + MongoDB (motor). `/api/inquiries` (POST/GET), `/api/auth/login` (bcrypt + JWT, 5-attempt lockout), `/api/media` (POST upload multipart, GET public list), `/api/media/file/{path}` (public serve), `/api/media/{id}` DELETE (soft). Object storage via Emergent objstore playbook (paths prefixed `irsmakup/media/…`).
- **Auth**: single seeded owner admin (hikarah@irsmakup.com / GlamQueen#2024), JWT Bearer, 7-day token. Admin panel: upload photo/video (≤100MB), title, category, list + delete.
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

## Backlog
- **P0**: none (core flows verified).
- **P1**: replace placeholder social handles (@irsmakup) with real ones; exact studio address for map pin.
- **P2**: WhatsApp click counter/analytics; inquiry delete/mark-replied; video thumbnails/posters.
