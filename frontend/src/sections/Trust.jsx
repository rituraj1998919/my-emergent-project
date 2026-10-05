import React from "react";
import { ShieldCheck, Sparkles, Clock, Droplets } from "lucide-react";
import { Reveal, SectionHead } from "../components/Reveal";
import { BRANDS, IMG } from "../lib/site";

const TRUSTS = [
  { icon: Sparkles, title: "100% Premium Products", desc: "Only authentic, skin-loving luxury formulas touch your face." },
  { icon: ShieldCheck, title: "Strict Hygiene Standards", desc: "Sanitized brushes, disposables and fresh tools for every single client." },
  { icon: Droplets, title: "Personalized Skin-Matching", desc: "Bases blended to your exact undertone — never cakey, never gray." },
  { icon: Clock, title: "On-Time, Every Time", desc: "Punctual doorstep or studio service, scheduled around your day." },
];

export default function Trust() {
  return (
    <section className="relative py-24 sm:py-32 bg-plumdeep text-cream overflow-hidden" data-testid="trust-section">
      <img src={IMG.cosmetics} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover opacity-[0.08]" loading="lazy" />
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
        <SectionHead
          center
          light
          eyebrow="Why choose me"
          title={<>Famous products. <span className="italic text-blush">Flawless standards</span>.</>}
        />

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TRUSTS.map((t, i) => (
            <Reveal key={t.title} delay={0.08 * i} className="h-full">
              <div className="rounded-[24px] bg-cream/[0.05] border border-cream/10 p-7 backdrop-blur-sm card-hover h-full" data-testid={`trust-card-${i}`}>
                <span className="inline-flex w-12 h-12 rounded-full bg-gradient-to-br from-blush to-rosegold text-plumdeep items-center justify-center">
                  <t.icon className="w-5 h-5" />
                </span>
                <h3 className="mt-5 font-display text-2xl">{t.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-cream/65">{t.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.25}>
          <div className="mt-16 border-t border-cream/10 pt-10" data-testid="brand-wall">
            <p className="text-center text-[11px] uppercase tracking-[0.35em] text-cream/50 font-bold">Stocked with the brands you trust</p>
            <div className="mt-6 flex flex-wrap justify-center items-center gap-x-8 gap-y-3">
              {BRANDS.map((b) => (
                <span key={b} className="font-display italic text-xl sm:text-2xl text-cream/75 hover:text-champagne transition-colors duration-300">
                  {b}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
