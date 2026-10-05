import React from "react";
import { BadgeCheck, ArrowDown } from "lucide-react";
import { Reveal, SectionHead } from "../components/Reveal";
import { WhatsAppIcon } from "../components/Logo";
import { waLink, IMG } from "../lib/site";

const STATS = [
  { value: "8+", label: "Years of artistry" },
  { value: "500+", label: "Happy brides & clients" },
  { value: "100%", label: "Premium brands only" },
];

export default function About() {
  return (
    <section id="about" className="relative py-24 sm:py-32 overflow-hidden" data-testid="about-section">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-16 items-center">
        <div className="relative order-2 lg:order-1">
          <Reveal y={50}>
            <div className="relative rounded-[28px] overflow-hidden shadow-[0_40px_80px_-30px_rgba(74,21,37,0.35)]" data-testid="about-portrait">
              <img src={IMG.artist} alt="Hikarah Lntc — makeup artist" className="w-full h-[420px] sm:h-[540px] object-cover" loading="lazy" />
            </div>
          </Reveal>
          <Reveal delay={0.2} className="absolute -bottom-10 -right-2 sm:right-[-24px] w-40 sm:w-56 hidden sm:block">
            <div className="rounded-2xl overflow-hidden border-8 border-cream shadow-2xl rotate-3" data-testid="about-secondary-img">
              <img src={IMG.aboutSmall} alt="Premium makeup products" className="w-full h-48 sm:h-64 object-cover" loading="lazy" />
            </div>
          </Reveal>
          <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-blush/50 blur-2xl" aria-hidden="true" />
        </div>

        <div className="order-1 lg:order-2">
          <SectionHead
            eyebrow="About the artist"
            title={<>Hi, I'm <span className="italic text-plum">Hikarah</span> — your beauty partner for life's biggest moments.</>}
          />
          <Reveal delay={0.2}>
            <p className="mt-6 text-base sm:text-lg leading-relaxed text-charcoal/75" data-testid="about-bio">
              Based in the beautiful Philippines, I specialize in <strong>bridal and soft glam makeup</strong> that
              celebrates — never masks — your natural beauty. Every face is a canvas with its own story, so I
              personalize every look: skin-matched bases, premium-only products, and hygiene-first tools, always.
            </p>
          </Reveal>
          <Reveal delay={0.28}>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-charcoal/75">
              From grand Christian church weddings to intimate Kingdom Hall celebrations, debuts and editorial sets —
              modest, soft glam or full drama, <em className="font-display text-plum">ikaw ang bahala</em> (your call).
              My promise: you'll look like
              <em className="font-display text-plum"> yourself, elevated</em> — calm, confident and camera-ready.
            </p>
          </Reveal>

          <div className="mt-10 grid grid-cols-3 gap-4" data-testid="about-stats">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={0.1 * i}>
                <div className="rounded-2xl bg-white border border-[#F0E6E2] p-4 sm:p-6 text-center card-hover h-full">
                  <p className="font-display text-3xl sm:text-5xl text-plum">{s.value}</p>
                  <p className="mt-2 text-[11px] sm:text-xs uppercase tracking-wider text-mutedtext font-semibold leading-snug">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.35} className="mt-9 flex flex-wrap items-center gap-5">
            <a
              href={waLink("Hi Hikarah! I found you through your portfolio — I'd love to chat about my event.")}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="about-whatsapp-btn"
              className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-blush to-rosegold text-plumdeep font-bold px-7 py-3.5 hover:shadow-[0_16px_36px_-10px_rgba(197,160,89,0.6)] hover:-translate-y-0.5 transition-all duration-300"
            >
              <WhatsAppIcon className="w-5 h-5" /> Say hello on WhatsApp
            </a>
            <span className="inline-flex items-center gap-2 text-sm text-mutedtext">
              <BadgeCheck className="w-4 h-4 text-rosegold" /> Studio & doorstep service
            </span>
          </Reveal>
        </div>
      </div>

      <div className="hidden lg:flex justify-center mt-16 text-charcoal/40">
        <ArrowDown className="w-5 h-5 animate-bounce" />
      </div>
    </section>
  );
}
