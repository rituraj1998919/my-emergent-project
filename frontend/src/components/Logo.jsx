import React from "react";

export const LogoMark = ({ size = 40 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="irsmakup.com logo"
    data-testid="logo-mark"
  >
    <defs>
      <linearGradient id="logoG" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#E89CAE" />
        <stop offset="0.55" stopColor="#C5A059" />
        <stop offset="1" stopColor="#4A1525" />
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="url(#logoG)" />
    <circle cx="32" cy="32" r="25.5" stroke="#FAF7F5" strokeOpacity="0.55" strokeWidth="1" fill="none" />
    <text
      x="32"
      y="45"
      fontFamily="Georgia, 'Times New Roman', serif"
      fontStyle="italic"
      fontSize="38"
      fill="#FAF7F5"
      textAnchor="middle"
    >
      i
    </text>
    <path d="M46 12 l1.8 4.2 4.2 1.8 -4.2 1.8 -1.8 4.2 -1.8 -4.2 -4.2 -1.8 4.2 -1.8 z" fill="#E5C378" />
  </svg>
);

export const Logo = ({ light = false }) => (
  <span className="inline-flex items-center gap-2.5" data-testid="brand-logo">
    <LogoMark size={38} />
    <span className={`leading-none ${light ? "text-cream" : "text-charcoal"}`}>
      <span className="font-display italic text-2xl tracking-tight">irsmakup</span>
      <span className="text-[11px] font-sans font-bold tracking-widest text-rosegold">.COM</span>
    </span>
  </span>
);

export const WhatsAppIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35Zm-5.42 7.4h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88a9.82 9.82 0 0 1 9.88 9.9c0 5.45-4.44 9.87-9.89 9.87Zm8.42-18.3A11.82 11.82 0 0 0 12.04 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.94L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.44h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.16-3.48-8.41Z" />
  </svg>
);

export const Sparkle = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6L12 0z" />
  </svg>
);
