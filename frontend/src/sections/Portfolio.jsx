import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Reveal, SectionHead } from "../components/Reveal";
import { GalleryCard } from "../components/gallery/GalleryCard";
import { GalleryLightbox } from "../components/gallery/GalleryLightbox";
import { BeforeAfter } from "../components/gallery/BeforeAfter";
import { API_URL } from "../lib/site";
import { galleryItem, PLACEHOLDER_PAIR } from "../lib/gallery";

const FILTERS = ["All Looks", "Bridal Glam", "Soft / Natural", "Party & Prom", "Eye & Brows"];
const matches = (cat, filter) => filter === "All Looks" || cat === filter || cat.split("/").map(c => c.trim()).includes(filter);

export default function Portfolio() {
  const [filter, setFilter] = useState("All Looks");
  const [uploads, setUploads] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [galleryError, setGalleryError] = useState(false);
  const [pair, setPair] = useState(null);
  const [pairError, setPairError] = useState(false);
  const [lookError, setLookError] = useState("");
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("look");
  useEffect(() => {
    axios.get(`${API_URL}/api/media`).then(({ data }) => setUploads(data)).catch(() => setGalleryError(true)).finally(() => setLoaded(true));
    axios.get(`${API_URL}/api/gallery/comparison`).then(({ data }) => setPair(data)).catch(() => { setPairError(true); setPair(PLACEHOLDER_PAIR); });
  }, []);
  useEffect(() => {
    if (!loaded || !selectedId) { setLookError(""); return; }
    const existing = uploads.find(m => m.id === selectedId);
    if (existing) { setLookError(""); setFilter(f => matches(existing.category, f) ? f : "All Looks"); return; }
    let active = true;
    axios.get(`${API_URL}/api/media/${encodeURIComponent(selectedId)}`).then(({ data }) => {
      if (active) { setUploads(old => [...old.filter(m => m.id !== data.id), data]); setLookError(""); }
    }).catch(err => { if (active) setLookError(err.response?.status === 404 || err.response?.status === 400 ? "This look is no longer available. Explore Hikarah's other looks below." : "This look couldn't load. Please try again shortly."); });
    return () => { active = false; };
  }, [loaded, selectedId, uploads]);
  const allItems = useMemo(() => uploads.map(galleryItem), [uploads]);
  const items = allItems.filter(g => matches(g.cat, filter));
  const selectedIndex = items.findIndex(g => g.id === selectedId);
  const counts = Object.fromEntries(FILTERS.map(f => [f, allItems.filter(g => matches(g.cat, f)).length]));
  const closeLightbox = useCallback(() => setParams(previous => { const next = new URLSearchParams(previous); next.delete("look"); return next; }), [setParams]);
  const openLook = (index) => setParams(previous => { const next = new URLSearchParams(previous); next.set("look", items[index].id); return next; });

  return <section id="portfolio" className="py-24 sm:py-32 relative" data-testid="portfolio-section">
    <div className="max-w-7xl mx-auto px-5 sm:px-8 relative">
      <SectionHead center eyebrow="Client Gallery · Davao City" title={<>Our Real <span className="italic text-plum">Transformations</span> &amp; Client Gallery</>} sub="Gikan sa natural glow hangtod sa full glam — artistry by Hikarah, made for you." />
      <Reveal delay={0.15} className="mt-12">
        {pair ? <BeforeAfter pair={pair} /> : <div className="h-40 flex items-center justify-center text-sm text-mutedtext" data-testid="comparison-loading">Loading comparison…</div>}
        {pairError && <p role="status" className="text-center text-xs text-mutedtext mt-2" data-testid="comparison-load-error">Live comparison unavailable. Showing placeholder preview.</p>}
      </Reveal>
      {lookError && <div role="alert" className="mt-8 border border-blush p-5 text-sm text-plum flex flex-wrap items-center gap-3" data-testid="shared-look-error"><span>{lookError}</span><button onClick={closeLightbox} className="look-action" data-testid="shared-look-dismiss">Browse gallery</button></div>}
      <div className="mt-14 flex flex-wrap justify-center gap-3" data-testid="gallery-filters">
        {FILTERS.map(f => {
          const slug = f.toLowerCase().replace(/[^a-z]+/g, "-").replace(/-$/, "");
          return <button key={f} onClick={() => { setFilter(f); if (selectedId) closeLightbox(); }} aria-pressed={filter === f} data-testid={`gallery-filter-${slug}-btn`} className={`rounded-full px-5 sm:px-6 py-2.5 text-sm font-bold transition-colors duration-300 inline-flex items-center gap-2 ${filter === f ? "bg-plum text-cream shadow-lg" : "bg-white border border-[#F0E6E2] text-charcoal/70 hover:border-blush hover:text-plum"}`}>
            {f}<span className={`text-[10px] font-extrabold rounded-full px-1.5 py-0.5 ${filter === f ? "bg-cream/20 text-cream" : "bg-blush/30 text-plum"}`} data-testid={`gallery-filter-${slug}-count`}>{counts[f]}</span>
          </button>;
        })}
      </div>
      {galleryError && <p role="alert" className="mt-10 text-center text-sm text-ruby" data-testid="gallery-load-error">Gallery couldn't load. Please try again shortly.</p>}
      {!loaded && <p className="mt-10 text-center text-sm text-mutedtext" data-testid="gallery-loading">Loading looks…</p>}
      {loaded && !galleryError && !allItems.length && <p className="mt-10 text-center text-mutedtext" data-testid="gallery-empty">Fresh looks coming soon — Hikarah is posting new client transformations.</p>}
      <motion.div layout className="mt-10 columns-2 md:columns-3 lg:columns-4 gap-4 sm:gap-5 [column-fill:balance]" data-testid="gallery-grid">
        <AnimatePresence mode="popLayout">{items.map((g, idx) => <GalleryCard key={g.id} item={g} index={idx} onOpen={openLook} />)}</AnimatePresence>
      </motion.div>
      {loaded && allItems.length > 0 && !items.length && <p className="mt-8 text-center text-sm text-mutedtext" data-testid="gallery-filter-empty">No looks in this category yet — check back soon!</p>}
    </div>
    <GalleryLightbox items={items} index={selectedIndex < 0 ? null : selectedIndex} onClose={closeLightbox} onChange={openLook} />
  </section>;
}