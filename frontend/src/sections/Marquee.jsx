import React from "react";
import { Sparkle } from "../components/Logo";

const ITEMS = ["Kasalan Glam", "Soft Glam", "Gwapa Kaayo", "Editorial Artistry", "Hair Styling", "Airbrush HD", "Hikarah Lntc", "Salamat Kaayo"];

const Row = ({ ariaHidden = false }) => (
  <div aria-hidden={ariaHidden} className="flex shrink-0 items-center">
    {ITEMS.map((item, i) => (
      <span key={`${item}-${i}`} className="flex items-center">
        <span className="font-display italic text-2xl sm:text-4xl text-cream/90 px-6 sm:px-10 whitespace-nowrap">
          {item}
        </span>
        <Sparkle className="w-4 h-4 sm:w-5 sm:h-5 text-champagne shrink-0" />
      </span>
    ))}
  </div>
);

export default function Marquee() {
  return (
    <section className="relative bg-plum py-6 sm:py-8 overflow-hidden -rotate-1 scale-[1.02] my-4 shadow-[0_30px_60px_-30px_rgba(74,21,37,0.6)]" data-testid="marquee-section">
      <div className="flex w-max animate-marquee">
        <Row />
        <Row ariaHidden />
      </div>
    </section>
  );
}
