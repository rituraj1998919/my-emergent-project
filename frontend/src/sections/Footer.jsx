import React from "react";
import { ArrowUpRight } from "lucide-react";
import { Logo, WhatsAppIcon } from "../components/Logo";
import { MaskLine, Reveal } from "../components/Reveal";
import { WA_LINK, FB_LINK, waLink, scrollToId } from "../lib/site";

const LINKS = [
  { id: "about", label: "About" },
  { id: "services", label: "Services" },
  { id: "portfolio", label: "Portfolio" },
  { id: "packages", label: "Packages" },
  { id: "reviews", label: "Reviews" },
  { id: "contact", label: "Contact" },
];

export default function Footer() {
  return (
    <footer className="relative bg-plumdeep text-cream overflow-hidden" data-testid="footer-section">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-20 sm:pt-28 pb-10">
        <div className="text-center max-w-4xl mx-auto">
          <MaskLine delay={0.1}>
            <p className="eyebrow">Ready when you are — Book karon!</p>
          </MaskLine>
          <h2 className="font-display text-5xl sm:text-7xl lg:text-8xl leading-[1.02] mt-4" data-testid="footer-cta-heading">
            <MaskLine delay={0.2}>Ready for your</MaskLine>
            <MaskLine delay={0.35} innerClass="italic text-blush">glam session?</MaskLine>
          </h2>
          <Reveal delay={0.42}>
            <p className="mt-5 font-display italic text-xl sm:text-2xl text-cream/70" data-testid="footer-cebuano-line">
              Gwapa kaayo ka — salamat kaayo for trusting me with your day.
            </p>
          </Reveal>
          <Reveal delay={0.45} className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href={waLink("Hi Hikarah! I'm ready for my glam session — let's book a date.")}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="footer-whatsapp-btn"
              className="inline-flex items-center gap-3 rounded-full bg-whatsapp text-plumdeep font-extrabold px-9 py-4 hover:-translate-y-1 hover:shadow-[0_20px_45px_-12px_rgba(37,211,102,0.55)] transition-all duration-300"
            >
              <WhatsAppIcon className="w-5 h-5" /> Chat on WhatsApp
            </a>
            <a
              href={FB_LINK}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="footer-facebook-btn"
              className="inline-flex items-center gap-3 rounded-full border-2 border-cream/25 px-9 py-4 font-bold hover:bg-cream hover:text-plumdeep transition-all duration-300"
            >
              Follow on Facebook <ArrowUpRight className="w-4 h-4" />
            </a>
          </Reveal>
          <Reveal delay={0.55}>
            <a href={`tel:${WA_LINK}`} data-testid="footer-phone-link" className="mt-8 inline-block font-display italic text-2xl sm:text-3xl text-champagne hover:text-blush transition-colors">
              +63 955 889 6008
            </a>
          </Reveal>
        </div>

        <div className="mt-20 border-t border-cream/10 pt-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <Logo light />
          <nav className="flex flex-wrap justify-center gap-x-7 gap-y-2" data-testid="footer-links">
            {LINKS.map((l) => (
              <a
                key={l.id}
                href={`#${l.id}`}
                onClick={(e) => { e.preventDefault(); scrollToId(l.id); }}
                data-testid={`footer-${l.id}-link`}
                className="text-sm text-cream/60 hover:text-blush transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-cream/45">
          <p data-testid="footer-copyright">Copyright © 2024 irsmakup.com — All rights reserved</p>
          <a href="/admin" data-testid="footer-owner-link" className="hover:text-blush transition-colors">Owner Login</a>
          <p>Hikarah Lntc · Makeup Artistry · Philippines</p>
        </div>
      </div>
    </footer>
  );
}
