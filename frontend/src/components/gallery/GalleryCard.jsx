import React from "react";
import { motion } from "framer-motion";
import { Play, Star } from "lucide-react";

export const RatingBadge = ({ rating = 5.0, className = "" }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#F1D77C] to-[#C5A059] text-plumdeep text-[11px] font-extrabold px-2.5 py-1 shadow-[0_6px_16px_-6px_rgba(197,160,89,0.8)] ${className}`}
    data-testid="gallery-rating-badge"
  >
    {Number(rating).toFixed(1)} <Star className="w-3 h-3 fill-plumdeep" />
  </span>
);

export function GalleryCard({ item, index, onOpen }) {
  return (
    <motion.figure
      layout
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.4), ease: [0.22, 1, 0.36, 1] }}
      className="relative mb-4 sm:mb-5 rounded-[22px] overflow-hidden cursor-zoom-in group break-inside-avoid bg-gradient-to-br from-blush/25 to-champagne/20 shadow-[0_18px_40px_-24px_rgba(74,21,37,0.35)]"
      onClick={() => onOpen(index)}
      data-testid={`gallery-item-${item.id}`}
    >
      {item.video ? (
        <video
          src={item.img}
          className="w-full aspect-[3/4] object-cover transition-transform duration-700 group-hover:scale-105"
          muted loop playsInline preload="metadata"
          onMouseEnter={(e) => e.target.play().catch(() => {})}
          onMouseLeave={(e) => e.target.pause()}
        />
      ) : (
        <img src={item.img} alt={item.title} className="w-full aspect-[3/4] object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
      )}

      <RatingBadge rating={item.rating} className="absolute top-3 left-3" />
      {item.video && (
        <span className="absolute top-3 right-3 rounded-full bg-plumdeep/75 text-cream p-2 pointer-events-none" data-testid="video-play-badge">
          <Play className="w-3.5 h-3.5" />
        </span>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-[#4A1525]/85 via-[#E89CAE]/35 to-[#F6E3DA]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <figcaption className="absolute bottom-0 inset-x-0 p-5 translate-y-5 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none">
        <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-champagne" data-testid="gallery-card-category">{item.cat}</p>
        <p className="font-display italic text-2xl leading-tight text-cream mt-1" data-testid="gallery-card-title">{item.title}</p>
        {item.price && (
          <p className="mt-2 inline-block rounded-full bg-cream/90 text-plum text-xs font-extrabold px-3 py-1" data-testid="gallery-card-price">{item.price}</p>
        )}
      </figcaption>
    </motion.figure>
  );
}
