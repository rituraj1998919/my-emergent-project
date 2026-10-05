import React from "react";
import { ArrowUpRight, Instagram, Youtube, MapPin } from "lucide-react";
import { Logo, WhatsAppIcon } from "../components/Logo";
import { MaskLine, Reveal } from "../components/Reveal";
import { WA_LINK, FB_LINK, waLink, scrollToId } from "../lib/site";
import { useSettings } from "../lib/useSettings";

const PinterestIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.16 9.43 7.63 11.18-.11-.95-.2-2.41.04-3.45.22-.93 1.4-5.94 1.4-5.94s-.36-.71-.36-1.77c0-1.66.96-2.9 2.16-2.9 1.02 0 1.51.76 1.51 1.68 0 1.02-.65 2.55-.99 3.97-.28 1.19.6 2.16 1.77 2.16 2.12 0 3.76-2.24 3.76-5.47 0-2.86-2.06-4.86-5-4.86-3.4 0-5.39 2.55-5.39 5.18 0 1.03.4 2.13.89 2.73.1.12.11.22.08.34l-.33 1.36c-.05.22-.17.27-.4.16-1.5-.7-2.43-2.88-2.43-4.64 0-3.77 2.74-7.25 7.9-7.25 4.14 0 7.36 2.95 7.36 6.9 0 4.12-2.6 7.43-6.2 7.43-1.21 0-2.35-.63-2.74-1.37l-.75 2.85c-.27 1.04-1 2.35-1.49 3.14 1.12.35 2.3.53 3.54.53 6.63 0 12-5.37 12-12S18.63 0 12 0z" />
  </svg>
);

const LINKS = [
  { id: "about", label: "About" },
  { id: "services", label: "Services" },
  { id: "portfolio", label: "Portfolio" },
  { id: "packages", label: "Packages" },
  { id: "reviews", label: "Reviews" },
  { id: "contact", label: "Contact" },
];

export default function Footer() {
  const settings = useSettings();
  const SOCIALS = [
    { key: "instagram", label: "Instagram", Icon: Instagram },
    { key: "pinterest", label: "Pinterest", Icon: PinterestIcon },
    { key: "youtube", label: "YouTube", Icon: Youtube },
  ].filter((s) => settings[s.key]);

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
              href={settings.facebook || FB_LINK}
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
          <Reveal delay={0.6} className="mt-7 flex justify-center gap-4">
            {SOCIALS.map(({ key, label, Icon }) => (
              <a key={key} href={settings[key]} target="_blank" rel="noopener noreferrer" aria-label={label} data-testid={`footer-${key}-link`} className="w-11 h-11 rounded-full border-2 border-cream/25 text-cream flex items-center justify-center hover:bg-cream hover:text-plumdeep hover:-translate-y-1 transition-all duration-300">
                <Icon className="w-5 h-5" />
              </a>
            ))}
          </Reveal>
          <Reveal delay={0.65}>
            <p className="mt-6 inline-flex items-center gap-2 text-sm text-cream/55" data-testid="footer-studio-address">
              <MapPin className="w-4 h-4 text-blush" /> {settings.studio_address}
            </p>
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
