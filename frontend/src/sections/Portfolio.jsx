import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, MoveHorizontal, Play } from "lucide-react";
import { Reveal, SectionHead } from "../components/Reveal";
import { GALLERY, IMG, API_URL } from "../lib/site";

const BASE_FILTERS = ["All", "Bridal", "Glam", "Soft Glam", "Editorial", "Hair"];

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

export default function Portfolio() {
  const [filter, setFilter] = useState("All");
  const [lightbox, setLightbox] = useState(null);
  const [uploads, setUploads] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/media`)
      .then(({ data }) => setUploads(Array.isArray(data) ? data : []))
      .catch(() => setUploads([]));
  }, []);

  const ownerItems = uploads.map((u) => ({
    id: `up-${u.id}`,
    cat: u.category || "Bridal",
    title: u.title || "New Glam",
    img: `${API_URL}${u.url}`,
    video: u.media_type === "video",
    owner: true,
  }));

  const allItems = [...ownerItems, ...GALLERY];
  const filters = ["All", ...Array.from(new Set(allItems.map((i) => i.cat).filter((c) => BASE_FILTERS.includes(c) || ownerItems.some((o) => o.cat === c))))];

  const items = allItems.filter((g) => filter === "All" || g.cat === filter);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((v) => (v + 1) % items.length);
      if (e.key === "ArrowLeft") setLightbox((v) => (v - 1 + items.length) % items.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, items.length]);

  return (
    <section id="portfolio" className="py-24 sm:py-32" data-testid="portfolio-section">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <SectionHead
          center
          eyebrow="Portfolio"
          title={<>The <span className="italic text-plum">transformation</span> speaks.</>}
          sub="Real looks, real glows — fresh work posted directly by Hikarah. Tap any photo to view it up close."
        />

        <Reveal delay={0.15} className="mt-12">
          <BeforeAfter />
        </Reveal>

        <div className="mt-14 flex flex-wrap justify-center gap-3" data-testid="portfolio-filters">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              data-testid={`portfolio-filter-${f.toLowerCase()}-btn`}
              className={`rounded-full px-6 py-2.5 text-sm font-bold transition-all duration-300 ${
                filter === f
                  ? "bg-plum text-cream shadow-[0_14px_30px_-10px_rgba(74,21,37,0.5)]"
                  : "bg-white border border-[#F0E6E2] text-charcoal/70 hover:border-blush hover:text-plum"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <motion.div layout className="mt-10 columns-2 md:columns-3 gap-4 [column-fill:balance]" data-testid="portfolio-grid">
          <AnimatePresence mode="popLayout">
            {items.map((g, idx) => (
              <motion.figure
                key={g.id}
                layout
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="relative mb-4 rounded-[20px] overflow-hidden img-zoom cursor-zoom-in group break-inside-avoid"
                onClick={() => setLightbox(idx)}
                data-testid={`portfolio-item-${g.id}`}
              >
                {g.video ? (
                  <video
                    src={g.img}
                    className={`w-full object-cover ${g.tall ? "aspect-[3/4]" : "aspect-square"}`}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    onMouseEnter={(e) => e.target.play().catch(() => {})}
                    onMouseLeave={(e) => e.target.pause()}
                  />
                ) : (
                  <img src={g.img} alt={g.title} className={`w-full object-cover ${g.tall ? "aspect-[3/4]" : "aspect-square"}`} loading="lazy" />
                )}
                {g.video && (
                  <span className="absolute top-3 right-3 rounded-full bg-plumdeep/75 text-cream p-2 pointer-events-none" data-testid="video-play-badge">
                    <Play className="w-3.5 h-3.5" />
                  </span>
                )}
                {g.owner && (
                  <span className="absolute top-3 left-3 rounded-full bg-champagne/90 text-plumdeep text-[10px] font-extrabold tracking-widest uppercase px-3 py-1 pointer-events-none" data-testid="owner-post-badge">
                    New
                  </span>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-plum/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <figcaption className="absolute bottom-0 inset-x-0 p-5 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none">
                  <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-champagne">{g.cat}</p>
                  <p className="font-display italic text-2xl text-cream">{g.title}</p>
                </figcaption>
              </motion.figure>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      <AnimatePresence>
        {lightbox !== null && items[lightbox] && (
          <motion.div
            className="fixed inset-0 z-[90] bg-plumdeep/95 backdrop-blur-md flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            data-testid="portfolio-lightbox"
            onClick={() => setLightbox(null)}
          >
            <button
              className="absolute top-5 right-5 p-3 rounded-full border border-cream/25 text-cream hover:bg-cream hover:text-plum transition-colors"
              aria-label="Close lightbox"
              data-testid="lightbox-close-btn"
              onClick={() => setLightbox(null)}
            >
              <X className="w-5 h-5" />
            </button>
            <button
              className="absolute left-3 sm:left-8 p-3 rounded-full border border-cream/25 text-cream hover:bg-cream hover:text-plum transition-colors"
              aria-label="Previous image"
              data-testid="lightbox-prev-btn"
              onClick={(e) => { e.stopPropagation(); setLightbox((v) => (v - 1 + items.length) % items.length); }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              className="absolute right-3 sm:right-8 p-3 rounded-full border border-cream/25 text-cream hover:bg-cream hover:text-plum transition-colors"
              aria-label="Next image"
              data-testid="lightbox-next-btn"
              onClick={(e) => { e.stopPropagation(); setLightbox((v) => (v + 1) % items.length); }}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <motion.figure
              key={items[lightbox].id}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35 }}
              className="max-w-3xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {items[lightbox].video ? (
                <video src={items[lightbox].img} controls autoPlay playsInline className="w-full max-h-[78vh] rounded-2xl" data-testid="lightbox-video" />
              ) : (
                <img src={items[lightbox].img} alt={items[lightbox].title} className="w-full max-h-[78vh] object-contain rounded-2xl" data-testid="lightbox-image" />
              )}
              <figcaption className="mt-4 text-center">
                <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-champagne">{items[lightbox].cat}</p>
                <p className="font-display italic text-2xl text-cream" data-testid="lightbox-caption">{items[lightbox].title}</p>
              </figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
