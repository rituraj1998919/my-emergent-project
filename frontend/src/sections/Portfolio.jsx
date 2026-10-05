import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { MoveHorizontal } from "lucide-react";
import { Reveal, SectionHead } from "../components/Reveal";
import { GalleryCard } from "../components/gallery/GalleryCard";
import { GalleryLightbox } from "../components/gallery/GalleryLightbox";
import { IMG, API_URL } from "../lib/site";

function BeforeAfter() {
  const [pos, setPos] = useState(50);
  const ref = useRef(null);
  const dragging = useRef(false);

  const update = (clientX) => {
    const rect = ref.current.getBoundingClientRect();
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(96, Math.max(4, p)));
  };

  return (
    <div
      ref={ref}
      className="relative w-full aspect-[16/10] sm:aspect-[16/8] rounded-[28px] overflow-hidden select-none cursor-ew-resize shadow-[0_40px_80px_-30px_rgba(74,21,37,0.4)]"
      onPointerDown={(e) => { dragging.current = true; update(e.clientX); }}
      onPointerMove={(e) => dragging.current && update(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
      onPointerLeave={() => (dragging.current = false)}
      data-testid="before-after-slider"
    >
      <img src={IMG.after} alt="After glam" className="absolute inset-0 w-full h-full object-cover" draggable="false" loading="lazy" />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <img
          src={IMG.before}
          alt="Before makeup"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ width: ref.current?.offsetWidth ? `${ref.current.offsetWidth}px` : "100vw", maxWidth: "none" }}
          draggable="false"
          loading="lazy"
        />
      </div>

      <div className="absolute inset-y-0 w-[3px] bg-cream shadow-lg" style={{ left: `${pos}%` }}>
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-1/2 w-12 h-12 rounded-full bg-cream text-plum flex items-center justify-center shadow-xl">
          <MoveHorizontal className="w-5 h-5" />
        </div>
      </div>

      <span className="absolute top-4 left-4 rounded-full bg-plumdeep/70 text-cream text-[11px] font-bold tracking-widest uppercase px-4 py-1.5" data-testid="before-after-before-label">Before</span>
      <span className="absolute top-4 right-4 rounded-full bg-champagne/90 text-plumdeep text-[11px] font-bold tracking-widest uppercase px-4 py-1.5" data-testid="before-after-after-label">After</span>
      <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full glass px-4 py-1.5 text-[11px] font-semibold text-charcoal/70">
        Drag to compare the transformation
      </span>
    </div>
  );
}


const FILTERS = ["All Looks", "Bridal Glam", "Soft / Natural", "Party & Prom", "Eye & Brows"];

const matches = (cat, filter) =>
  filter === "All Looks" || cat === filter || cat.split("/").map((c) => c.trim()).includes(filter);

export default function Portfolio() {
  const [filter, setFilter] = useState("All Looks");
  const [lightbox, setLightbox] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/media`)
      .then(({ data }) => setUploads(Array.isArray(data) ? data : []))
      .catch(() => setUploads([]))
      .finally(() => setLoaded(true));
  }, []);

  const allItems = uploads.map((u) => ({
    id: u.id,
    cat: u.category || "Bridal Glam",
    title: u.title || "New Glam",
    description: u.description || "",
    price: u.price || "",
    rating: u.rating || 5.0,
    img: `${API_URL}${u.url}`,
    video: u.media_type === "video",
  }));

  const items = allItems.filter((g) => matches(g.cat, filter));
  const counts = Object.fromEntries(FILTERS.map((f) => [f, allItems.filter((g) => matches(g.cat, f)).length]));
  const closeLightbox = useCallback(() => setLightbox(null), []);

  return (
    <section id="portfolio" className="py-24 sm:py-32 relative overflow-hidden" data-testid="portfolio-section">
      <div className="absolute top-40 right-[-160px] w-[420px] h-[420px] rounded-full bg-blush/25 blur-[130px] pointer-events-none" aria-hidden="true" />
      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative">
        <SectionHead
          center
          eyebrow="Client Gallery · Davao City"
          title={<>Our Real <span className="italic text-plum">Transformations</span> &amp; Client Gallery</>}
          sub="Walay filter, walay stock photos — real clients, real glow, posted by Hikarah herself. Hover for the look & price, tap to view full-size and book it."
        />

        <Reveal delay={0.15} className="mt-12">
          <BeforeAfter />
        </Reveal>

        <div className="mt-14 flex flex-wrap justify-center gap-3" data-testid="gallery-filters">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setLightbox(null); }}
              data-testid={`gallery-filter-${f.toLowerCase().replace(/[^a-z]+/g, "-").replace(/-$/, "")}-btn`}
              className={`rounded-full px-5 sm:px-6 py-2.5 text-sm font-bold transition-all duration-300 inline-flex items-center gap-2 ${
                filter === f
                  ? "bg-plum text-cream shadow-[0_14px_30px_-10px_rgba(74,21,37,0.5)]"
                  : "bg-white border border-[#F0E6E2] text-charcoal/70 hover:border-blush hover:text-plum"
              }`}
            >
              {f}
              <span className={`text-[10px] font-extrabold rounded-full px-1.5 py-0.5 ${filter === f ? "bg-cream/20 text-cream" : "bg-blush/30 text-plum"}`}>{counts[f]}</span>
            </button>
          ))}
        </div>

        {loaded && allItems.length === 0 && (
          <div className="mt-10 rounded-[24px] border-2 border-dashed border-blush/60 p-14 text-center text-mutedtext" data-testid="gallery-empty">
            <p className="font-semibold">Fresh looks coming soon — Hikarah is posting new client transformations.</p>
          </div>
        )}

        <motion.div layout className="mt-10 columns-2 md:columns-3 lg:columns-4 gap-4 sm:gap-5 [column-fill:balance]" data-testid="gallery-grid">
          <AnimatePresence mode="popLayout">
            {items.map((g, idx) => (
              <GalleryCard key={g.id} item={g} index={idx} onOpen={setLightbox} />
            ))}
          </AnimatePresence>
        </motion.div>

        {loaded && allItems.length > 0 && items.length === 0 && (
          <p className="mt-8 text-center text-sm text-mutedtext" data-testid="gallery-filter-empty">No looks in this category yet — check back soon!</p>
        )}
      </div>

      <GalleryLightbox items={items} index={lightbox} onClose={closeLightbox} onChange={setLightbox} />
    </section>
  );
}
