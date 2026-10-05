import React from "react";
import { motion } from "framer-motion";

export const Reveal = ({ children, delay = 0, y = 32, className = "" }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.15 }}
    transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

export const MaskLine = ({ children, delay = 0, className = "", innerClass = "" }) => (
  <span className={`block overflow-hidden ${className}`}>
    <motion.span
      className={`block ${innerClass}`}
      initial={{ y: "115%" }}
      animate={{ y: 0 }}
      transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.span>
  </span>
);

export const SectionHead = ({ eyebrow, title, sub, light = false, center = false }) => (
  <div className={`max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
    <Reveal>
      <p className="eyebrow" data-testid="section-eyebrow">{eyebrow}</p>
    </Reveal>
    <Reveal delay={0.08}>
      <h2 className={`font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05] mt-4 ${light ? "text-cream" : "text-charcoal"}`}>
        {title}
      </h2>
    </Reveal>
    {sub && (
      <Reveal delay={0.16}>
        <p className={`mt-5 text-base sm:text-lg leading-relaxed ${light ? "text-cream/70" : "text-mutedtext"}`}>{sub}</p>
      </Reveal>
    )}
  </div>
);
