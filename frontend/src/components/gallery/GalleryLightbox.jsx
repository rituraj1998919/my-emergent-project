import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { WhatsAppIcon } from "../Logo";
import { waLink } from "../../lib/site";
import { RatingBadge } from "./GalleryCard";

const NavBtn = ({ side, onClick, label, testId, children }) => (
  <button
    className={`absolute ${side === "left" ? "left-3 sm:left-8" : "right-3 sm:right-8"} top-1/2 -translate-y-1/2 p-3 rounded-full border border-cream/25 text-cream hover:bg-cream hover:text-plum transition-colors z-10`}
    aria-label={label}
    data-testid={testId}
    onClick={(e) => { e.stopPropagation(); onClick(); }}
  >
    {children}
  </button>
);

export function GalleryLightbox({ items, index, onClose, onChange }) {
  const item = index !== null ? items[index] : null;

  useEffect(() => {
    if (!item) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onChange((index + 1) % items.length);
      if (e.key === "ArrowLeft") onChange((index - 1 + items.length) % items.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, index, items.length, onClose, onChange]);

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          className="fixed inset-0 z-[90] bg-plumdeep/95 backdrop-blur-md flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          data-testid="gallery-lightbox"
          onClick={onClose}
        >
          <button className="absolute top-5 right-5 p-3 rounded-full border border-cream/25 text-cream hover:bg-cream hover:text-plum transition-colors z-10" aria-label="Close lightbox" data-testid="lightbox-close-btn" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
          <NavBtn side="left" label="Previous look" testId="lightbox-prev-btn" onClick={() => onChange((index - 1 + items.length) % items.length)}><ChevronLeft className="w-5 h-5" /></NavBtn>
          <NavBtn side="right" label="Next look" testId="lightbox-next-btn" onClick={() => onChange((index + 1) % items.length)}><ChevronRight className="w-5 h-5" /></NavBtn>

          <motion.div
            key={item.id}
            initial={{ scale: 0.94, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-5xl grid lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-6 lg:gap-10 items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative rounded-[24px] overflow-hidden bg-black/30">
              {item.video ? (
                <video src={item.img} controls autoPlay playsInline className="w-full max-h-[60vh] lg:max-h-[80vh] object-contain" data-testid="lightbox-video" />
              ) : (
                <img src={item.img} alt={item.title} className="w-full max-h-[60vh] lg:max-h-[80vh] object-contain" data-testid="lightbox-image" />
              )}
              <RatingBadge rating={item.rating} className="absolute top-4 left-4" />
            </div>

            <div className="text-cream lg:pr-4" data-testid="lightbox-details">
              <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-champagne" data-testid="lightbox-category">{item.cat}</p>
              <h3 className="font-display italic text-3xl sm:text-4xl lg:text-5xl leading-[1.05] mt-2" data-testid="lightbox-caption">{item.title}</h3>
              {item.description && <p className="mt-4 text-sm sm:text-base text-cream/75 leading-relaxed" data-testid="lightbox-description">{item.description}</p>}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                {item.price && <span className="rounded-full bg-cream text-plum font-extrabold px-4 py-1.5 text-sm" data-testid="lightbox-price">{item.price}</span>}
                <span className="text-xs text-cream/60">5.0 rated by real clients · Davao City</span>
              </div>
              <a
                href={waLink(`Hi Hikarah! I'd love to book the "${item.title}" look${item.price ? ` (${item.price})` : ""}. When are you available?`)}
                target="_blank" rel="noopener noreferrer"
                data-testid="lightbox-book-btn"
                className="mt-7 inline-flex items-center gap-3 rounded-full bg-whatsapp text-plumdeep font-extrabold px-8 py-3.5 hover:-translate-y-1 hover:shadow-[0_20px_45px_-12px_rgba(37,211,102,0.55)] transition-all duration-300"
              >
                <WhatsAppIcon className="w-5 h-5" /> Book This Look
              </a>
              <p className="mt-3 text-xs text-cream/50">{index + 1} / {items.length} · use ← → keys to browse</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
