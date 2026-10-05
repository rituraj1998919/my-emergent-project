import React from "react";
import { Check } from "lucide-react";
import { Reveal, SectionHead } from "../components/Reveal";
import { WhatsAppIcon } from "../components/Logo";
import { PACKAGES, waLink } from "../lib/site";

export default function Pricing() {
  return (
    <section id="packages" className="relative py-24 sm:py-32 bg-tinted overflow-hidden" data-testid="pricing-section">
      <div className="absolute top-20 right-[-120px] w-[420px] h-[420px] rounded-full bg-blush/30 blur-[110px]" aria-hidden="true" />
      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative">
        <SectionHead
          center
          eyebrow="Packages & Pricing"
          title={<>Luxury that <span className="italic text-plum">fits your moment</span>.</>}
          sub="Transparent packages, custom quotes always available. Every booking includes skin-prep and premium products."
        />

        <div className="mt-14 grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {PACKAGES.map((p, i) => (
            <Reveal key={p.id} delay={0.1 * i} className="h-full">
              <article
                className={`relative rounded-[28px] p-8 h-full flex flex-col card-hover ${
                  p.featured
                    ? "bg-plum text-cream shadow-[0_40px_80px_-30px_rgba(74,21,37,0.6)] md:-translate-y-4"
                    : "bg-white border border-[#F0E6E2] text-charcoal"
                }`}
                data-testid={`package-card-${p.id}`}
              >
                {p.featured && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-champagne text-plumdeep text-[11px] font-extrabold tracking-widest uppercase px-5 py-1.5" data-testid="package-featured-badge">
                    Most loved
                  </span>
                )}
                <h3 className="font-display text-3xl italic">{p.name}</h3>
                <p className={`mt-1 text-sm ${p.featured ? "text-cream/60" : "text-mutedtext"}`}>{p.tagline}</p>
                <p className="mt-6 flex items-baseline gap-2">
                  <span className="text-xs uppercase tracking-widest font-bold opacity-60">From</span>
                  <span className="font-display text-5xl" data-testid={`package-price-${p.id}`}>{p.price}</span>
                </p>
                <ul className="mt-7 space-y-3 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <span className={`mt-0.5 rounded-full p-1 ${p.featured ? "bg-champagne/20 text-champagne" : "bg-blush/20 text-rosegold"}`}>
                        <Check className="w-3 h-3" />
                      </span>
                      <span className={p.featured ? "text-cream/85" : "text-charcoal/80"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={waLink(`Hi Hikarah! I'd like to enquire about the ${p.name} (${p.price}).`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`package-enquire-${p.id}-btn`}
                  className={`mt-8 inline-flex items-center justify-center gap-2.5 rounded-full px-6 py-3.5 font-bold text-sm transition-all duration-300 hover:-translate-y-0.5 ${
                    p.featured
                      ? "bg-champagne text-plumdeep hover:shadow-[0_16px_36px_-10px_rgba(229,195,120,0.7)]"
                      : "bg-plum text-cream hover:bg-ruby"
                  }`}
                >
                  <WhatsAppIcon className="w-4 h-4" /> Enquire Now
                </a>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.3}>
          <p className="mt-12 text-center text-sm text-mutedtext" data-testid="pricing-note">
            Packages start from ₱6,500 · <span className="font-semibold text-charcoal">Custom quotes available</span> for entourages, pre-debut & multi-day celebrations · Doorstep & studio service across the Philippines
          </p>
        </Reveal>
      </div>
    </section>
  );
}
