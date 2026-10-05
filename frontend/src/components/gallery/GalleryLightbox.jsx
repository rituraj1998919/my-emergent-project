import React, { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../ui/dialog";
import { WhatsAppIcon } from "../Logo";
import { waLink } from "../../lib/site";
import { lookLink, trackLookTap } from "../../lib/gallery";
import { RatingBadge } from "./GalleryCard";
import { LookShare } from "./LookShare";

export const GalleryLightbox = ({ items, index, onClose, onChange }) => {
  const item = index !== null ? items[index] : null;
  const isOpen = !!item;
  const trigger = useRef(null);
  useEffect(() => {
    if (!isOpen) return;
    trigger.current = document.activeElement;
    window.__lenis?.stop();
    return () => { window.__lenis?.start(); };
  }, [isOpen]);
  const change = (delta) => onChange((index + delta + items.length) % items.length);
  return <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
    {item && <DialogContent className="z-[90] w-[calc(100%-1.5rem)] max-w-6xl max-h-[94dvh] overflow-y-auto rounded-2xl bg-plumdeep border-cream/20 text-cream p-4 sm:p-7 gap-4" data-lenis-prevent data-testid="gallery-lightbox" closeButtonTestId="lightbox-close-btn"
      onCloseAutoFocus={e => { e.preventDefault(); if (trigger.current?.isConnected) trigger.current.focus({ preventScroll: true }); }}
      onKeyDown={e => { if (["INPUT", "TEXTAREA", "VIDEO"].includes(e.target.tagName)) return; if (e.key === "ArrowRight") { e.preventDefault(); change(1); } if (e.key === "ArrowLeft") { e.preventDefault(); change(-1); } }}>
      <div className="flex items-center gap-3 pr-10">
        <button onClick={() => change(-1)} disabled={items.length < 2} aria-label="Previous look" className="look-action !p-2.5" data-testid="lightbox-prev-btn"><ChevronLeft size={18} /></button>
        <span className="text-xs text-cream/70 tabular-nums" data-testid="lightbox-position">{index + 1} / {items.length}</span>
        <button onClick={() => change(1)} disabled={items.length < 2} aria-label="Next look" className="look-action !p-2.5" data-testid="lightbox-next-btn"><ChevronRight size={18} /></button>
      </div>
      <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-5 lg:gap-8 items-center">
        <div className="relative min-w-0 bg-black/20 rounded-lg overflow-hidden">
          {item.video ? <video key={item.id} src={item.img} controls autoPlay playsInline className="w-full h-[35dvh] sm:h-[44dvh] lg:h-[68dvh] object-contain" data-testid="lightbox-video" /> : <img src={item.img} alt={item.title} className="w-full h-[35dvh] sm:h-[44dvh] lg:h-[68dvh] object-contain" data-testid="lightbox-image" />}
          <RatingBadge rating={item.rating} testId="lightbox-rating-badge" className="absolute top-3 left-3" />
        </div>
        <div className="min-w-0 lg:pr-2" data-testid="lightbox-details">
          <p className="text-xs font-bold text-champagne" data-testid="lightbox-category">{item.cat}</p>
          <DialogTitle className="font-display font-normal italic text-3xl sm:text-4xl leading-tight mt-2 break-words" data-testid="lightbox-caption">{item.title}</DialogTitle>
          <DialogDescription className="mt-3 text-sm text-cream/75 leading-relaxed break-words whitespace-pre-line" data-testid="lightbox-description">{item.description || "Makeup artistry by Hikarah Lntc · Davao City"}</DialogDescription>
          {item.price && <p className="mt-4 font-bold text-champagne break-words" data-testid="lightbox-price">{item.price}</p>}
          <a href={waLink(`Hi Hikarah! I'd love to book the "${item.title}" look${item.price ? ` (${item.price})` : ""}. When are you available?\n${lookLink(item.id)}`)} target="_blank" rel="noopener noreferrer" onClick={() => trackLookTap(item.id)} data-testid="lightbox-book-btn" className="mt-5 inline-flex items-center justify-center gap-3 rounded-full bg-whatsapp text-plumdeep text-sm font-extrabold px-6 py-3.5 hover:-translate-y-0.5 transition-transform">
            <WhatsAppIcon className="w-5 h-5" />Book This Look
          </a>
          <LookShare key={item.id} item={item} />
        </div>
      </div>
    </DialogContent>}
  </Dialog>;
};