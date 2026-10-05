import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Star, ArrowDown } from "lucide-react";
import { MaskLine, Reveal } from "../components/Reveal";
import { WhatsAppIcon, Sparkle } from "../components/Logo";
import { waLink, scrollToId, IMG } from "../lib/site";

const CircularBadge = () => (
  <div className="absolute -bottom-8 -left-8 sm:-left-12 w-28 h-28 sm:w-36 sm:h-36 z-20" data-testid="hero-circular-badge">
    <div className="absolute inset-0 rounded-full bg-plum text-cream flex items-center justify-center shadow-2xl">
      <Sparkle className="w-6 h-6 text-champagne" />
    </div>
    <svg viewBox="0 0 100 100" className="absolute inset-0 animate-spin-slow">
      <defs>
        <path id="circlePath" d="M 50,50 m -38,0 a 38,38 0 1,1 0,76 a 38,38 0 1,1 0,-76" />
      </defs>
      <text className="fill-cream" style={{ fontSize: "8.5px", letterSpacing: "2.6px", fontWeight: 700 }}>
        <textPath href="#circlePath">HIKARAH LNTC • IRSMAKUP • GLAM •</textPath>
      </text>
    </svg>
  </div>
);

export default function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yImg = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const yWord = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const yBlob = useTransform(scrollYProgress, [0, 1], [0, 160]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center overflow-hidden pt-24 pb-16" data-testid="hero-section">
      <motion.div style={{ y: yBlob }} className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-[560px] h-[560px] rounded-full bg-blush/40 blur-[120px]" />
        <div className="absolute top-1/3 right-[-140px] w-[520px] h-[520px] rounded-full bg-champagne/45 blur-[130px]" />
        <div className="absolute bottom-[-160px] left-1/4 w-[420px] h-[420px] rounded-full bg-ruby/15 blur-[110px]" />
      </motion.div>

      <motion.span
        style={{ y: yWord }}
        aria-hidden="true"
        className="absolute top-24 left-1/2 -translate-x-1/2 font-display italic text-[22vw] leading-none text-outline select-none pointer-events-none whitespace-nowrap"
      >
        glam
      </motion.span>

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-12 gap-14 lg:gap-8 items-center w-full">
        <div className="lg:col-span-7">
          <MaskLine delay={0.1}>
            <span className="inline-flex items-center gap-2 rounded-full glass border border-blush/40 px-4 py-2 text-[11px] sm:text-xs font-bold text-plum mb-5" data-testid="hero-greeting-chip">
              <Sparkle className="w-3.5 h-3.5 text-rosegold" /> Maayong adlaw, gwapa! · Bookings open
            </span>
          </MaskLine>
          <MaskLine delay={0.15}>
            <p className="eyebrow" data-testid="hero-eyebrow">irsmakup.com — makeup artistry · Philippines</p>
          </MaskLine>

          <h1 className="font-display text-[13.5vw] sm:text-7xl lg:text-[5.6rem] leading-[0.98] tracking-tight text-charcoal" data-testid="hero-heading">
            <MaskLine delay={0.25}>Hikarah</MaskLine>
            <MaskLine delay={0.4} innerClass="italic text-plum">Lntc<span className="text-rosegold">.</span></MaskLine>
          </h1>

          <MaskLine delay={0.55} className="mt-6">
            <p className="font-display italic text-2xl sm:text-3xl text-charcoal/80 max-w-xl" data-testid="hero-subheadline">
              Flawless makeup for your <span className="text-ruby">unforgettable</span> moments.
            </p>
          </MaskLine>

          <MaskLine delay={0.62} className="mt-4">
            <p className="text-sm sm:text-base text-mutedtext" data-testid="hero-cebuano-line">
              <span className="font-semibold text-plum">Ikaw ang bituon sa imong adlaw</span> — you're the star of the day.
            </p>
          </MaskLine>

          <Reveal delay={0.7} className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href={waLink("Hi Hikarah! I'd like to book an appointment.")}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="hero-book-btn"
              className="group inline-flex items-center gap-3 rounded-full bg-plum text-cream font-semibold px-8 py-4 text-sm sm:text-base hover:bg-ruby transition-all duration-300 hover:shadow-[0_18px_40px_-10px_rgba(230,57,86,0.55)] hover:-translate-y-0.5"
            >
              <WhatsAppIcon className="w-5 h-5" />
              Book an Appointment
            </a>
            <a
              href="https://www.facebook.com/share/19axnjTYpP/"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="hero-facebook-btn"
              className="inline-flex items-center gap-3 rounded-full border-2 border-charcoal/15 text-charcoal font-semibold px-8 py-[14px] text-sm sm:text-base hover:border-plum hover:bg-plum hover:text-cream transition-all duration-300"
            >
              Follow on Facebook
            </a>
          </Reveal>

          <Reveal delay={0.85} className="mt-10 flex items-center gap-4">
            <div className="flex" aria-label="5 star rating">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-champagne text-champagne" />
              ))}
            </div>
            <p className="text-sm text-mutedtext" data-testid="hero-trust-line">
              Trusted by <span className="font-bold text-charcoal">500+ brides</span> & clients across the Philippines
            </p>
          </Reveal>
        </div>

        <div className="lg:col-span-5 relative">
          <motion.div style={{ y: yImg }} className="relative mx-auto max-w-[420px]">
            <Reveal delay={0.35} y={60}>
              <div className="relative arch overflow-hidden shadow-[0_50px_100px_-30px_rgba(74,21,37,0.45)]" data-testid="hero-portrait">
                <img
                  src={IMG.hero}
                  alt="Bridal makeup look by Hikarah Lntc"
                  className="w-full h-[440px] sm:h-[540px] object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-plum/25 via-transparent to-transparent" />
              </div>
            </Reveal>

            <CircularBadge />

            <motion.div
              className="absolute top-8 -right-3 sm:-right-10 glass rounded-2xl px-5 py-4 shadow-xl z-20 animate-float-y"
              data-testid="hero-floating-badge"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.1, duration: 0.6 }}
            >
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-rosegold">Bookings open</p>
              <p className="font-display italic text-xl text-plum">2026 · 2027 dates</p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <button
        onClick={() => scrollToId("about")}
        data-testid="hero-scroll-btn"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-charcoal/50 hover:text-plum transition-colors"
        aria-label="Scroll to about"
      >
        <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Scroll</span>
        <ArrowDown className="w-4 h-4 animate-bounce" />
      </button>
    </section>
  );
}
