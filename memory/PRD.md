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

## Backlog
- **P0**: none (core flows verified).
- **P1**: real testimonial photos; Instagram/Pinterest/YouTube links in footer; Google Maps embed in booking section.
- **P2**: WhatsApp click counter/analytics; multi-image bulk upload; video thumbnails/posters; admin dashboard for inquiries list.
