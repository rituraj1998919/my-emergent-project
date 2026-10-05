import React, { useRef, useState } from "react";
import { MoveHorizontal } from "lucide-react";
import { comparisonImage, PLACEHOLDER_PAIR } from "../../lib/gallery";

export const BeforeAfter = ({ pair = PLACEHOLDER_PAIR, testPrefix = "before-after" }) => {
  const [position, setPosition] = useState(50);
  const surface = useRef(null);
  const dragging = useRef(false);
  const update = (x) => {
    const rect = surface.current.getBoundingClientRect();
    setPosition(Math.max(0, Math.min(100, ((x - rect.left) / rect.width) * 100)));
  };
  const onKey = (e) => {
    const values = { ArrowLeft: position - 2, ArrowRight: position + 2, Home: 0, End: 100 };
    if (values[e.key] !== undefined) { e.preventDefault(); setPosition(Math.max(0, Math.min(100, values[e.key]))); }
  };
  return (
    <figure className="w-full max-w-3xl mx-auto" data-testid={`${testPrefix}-figure`}>
      <div ref={surface} role="slider" tabIndex={0} aria-label="Before and after photo comparison" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(position)} aria-valuetext={`${Math.round(position)}% before photo visible`}
        className="comparison-surface relative aspect-[4/5] sm:aspect-[4/3] overflow-hidden rounded-2xl bg-[#EEE5E3] select-none cursor-ew-resize outline-none focus-visible:ring-4 focus-visible:ring-rosegold"
        style={{ touchAction: "pan-y" }} data-testid={`${testPrefix}-slider`} onKeyDown={onKey}
        onPointerDown={(e) => { if (e.button !== 0) return; dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); e.currentTarget.focus({ preventScroll: true }); update(e.clientX); }}
        onPointerMove={(e) => { if (dragging.current) update(e.clientX); }}
        onPointerUp={(e) => { dragging.current = false; if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); }}
        onPointerCancel={() => { dragging.current = false; }} onLostPointerCapture={() => { dragging.current = false; }}>
        <img src={comparisonImage(pair, "after")} alt={`${pair.is_placeholder ? "Placeholder: " : ""}${pair.after_label}`} draggable={false} className="absolute inset-0 w-full h-full object-contain pointer-events-none" loading="lazy" data-testid={`${testPrefix}-after-image`} />
        <div className="absolute inset-0 bg-[#EEE5E3] pointer-events-none" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }} data-testid={`${testPrefix}-before-layer`}>
          <img src={comparisonImage(pair, "before")} alt={`${pair.is_placeholder ? "Placeholder: " : ""}${pair.before_label}`} draggable={false} className="w-full h-full object-contain" loading="lazy" data-testid={`${testPrefix}-before-image`} />
        </div>
        <div className="absolute inset-y-0 w-0.5 bg-white pointer-events-none" style={{ left: `${position}%` }}>
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-cream text-plum flex items-center justify-center shadow-lg"><MoveHorizontal size={20} /></span>
        </div>
        <span className="comparison-badge absolute top-4 left-4 rounded-full bg-plumdeep/90 text-white text-xs font-bold px-4 py-2 pointer-events-none" data-testid={`${testPrefix}-before-label`}>Before</span>
        <span className="comparison-badge absolute top-4 right-4 rounded-full bg-champagne text-plumdeep text-xs font-bold px-4 py-2 pointer-events-none" data-testid={`${testPrefix}-after-label`}>After</span>
      </div>
      <figcaption className="mt-4">
        <div className="grid grid-cols-2 gap-6 text-sm font-semibold text-plum">
          <p className="break-words" data-testid={`${testPrefix}-before-caption`}>{pair.before_label}</p>
          <p className="text-right break-words" data-testid={`${testPrefix}-after-caption`}>{pair.after_label}</p>
        </div>
        {pair.is_placeholder && <p className="mt-3 text-center text-xs text-mutedtext" data-testid={`${testPrefix}-placeholder-note`}>Placeholder preview · Not an actual client before & after pair.</p>}
      </figcaption>
    </figure>
  );
};