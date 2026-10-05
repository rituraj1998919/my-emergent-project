import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo, WhatsAppIcon } from "../components/Logo";
import { waLink, scrollToId } from "../lib/site";

const LINKS = [
  { id: "about", label: "About" },
  { id: "services", label: "Services" },
  { id: "portfolio", label: "Portfolio" },
  { id: "packages", label: "Packages" },
  { id: "reviews", label: "Reviews" },
];

const go = (id) => (e) => {
  e.preventDefault();
  scrollToId(id);
};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled ? "glass shadow-[0_10px_40px_-18px_rgba(74,21,37,0.25)]" : "bg-transparent"
        }`}
        data-testid="site-header"
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-[72px] flex items-center justify-between">
          <a href="#" onClick={(e) => { e.preventDefault(); window.__lenis ? window.__lenis.scrollTo(0) : window.scrollTo(0, 0); }} data-testid="nav-home-link">
            <Logo />
          </a>

          <nav className="hidden lg:flex items-center gap-8">
            {LINKS.map((l) => (
              <a
                key={l.id}
                href={`#${l.id}`}
                onClick={go(l.id)}
                data-testid={`nav-${l.id}-link`}
                className="text-[13px] font-semibold tracking-wide text-charcoal/70 hover:text-plum transition-colors relative group"
              >
                {l.label}
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-gradient-to-r from-blush to-rosegold transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={waLink("Hi Hikarah! I'd like to book a glam session.")}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="nav-whatsapp-btn"
              className="hidden sm:inline-flex items-center gap-2 rounded-full bg-plum text-cream text-[13px] font-semibold px-5 py-2.5 hover:bg-ruby transition-colors duration-300 hover:shadow-[0_12px_30px_-8px_rgba(230,57,86,0.5)]"
            >
              <WhatsAppIcon className="w-4 h-4" />
              Book on WhatsApp
            </a>
            <button
              className="lg:hidden p-2 rounded-full border border-charcoal/10"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              data-testid="nav-menu-open-btn"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[80] bg-plumdeep/97 backdrop-blur-xl flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            data-testid="nav-mobile-menu"
          >
            <div className="flex items-center justify-between px-5 h-[72px]">
              <Logo light />
              <button
                className="p-2 rounded-full border border-cream/20 text-cream"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                data-testid="nav-menu-close-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 flex flex-col items-start justify-center px-8 gap-2">
              {[...LINKS, { id: "contact", label: "Contact" }].map((l, i) => (
                <motion.a
                  key={l.id}
                  href={`#${l.id}`}
                  onClick={(e) => { go(l.id)(e); setOpen(false); }}
                  data-testid={`nav-mobile-${l.id}-link`}
                  className="font-display italic text-5xl text-cream py-2 hover:text-blush transition-colors"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 * i }}
                >
                  {l.label}
                </motion.a>
              ))}
            </nav>
            <div className="px-8 pb-12">
              <a
                href={waLink("Hi Hikarah! I'd like to book a glam session.")}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="nav-mobile-whatsapp-btn"
                className="inline-flex items-center gap-3 rounded-full bg-whatsapp text-plumdeep font-bold px-7 py-4"
              >
                <WhatsAppIcon className="w-5 h-5" /> Book on WhatsApp
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
