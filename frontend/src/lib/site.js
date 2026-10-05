export const WA_NUMBER = "639558896008";
export const WA_LINK = `https://wa.me/${WA_NUMBER}`;
export const FB_LINK = "https://www.facebook.com/share/19axnjTYpP/";
export const PHONE_DISPLAY = "+63 955 889 6008";
export const API_URL = process.env.REACT_APP_BACKEND_URL;
if (!API_URL) throw new Error("REACT_APP_BACKEND_URL is required");

export const waLink = (text) =>
  `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

export const scrollToId = (id) => {
  const el = document.getElementById(id);
  if (!el) return;
  if (window.__lenis) {
    window.__lenis.scrollTo(el, { offset: -72, duration: 1.4 });
  } else {
    el.scrollIntoView({ behavior: "smooth" });
  }
};

const u = (id) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=85`;

export const IMG = {
  hero: u("1583070012333-6cc68114bedf"),
  artist: u("1604261605115-4b34b646a05c"),
  aboutSmall: u("1522335789203-aabd1fc54bc9"),
  bridal: u("1633926947455-5e779c3de5c6"),
  eventGlam: u("1610166970010-c2e6c3da7164"),
  photoshoot:
    "https://images.pexels.com/photos/20459105/pexels-photo-20459105.jpeg?auto=compress&cs=tinysrgb&w=1200",
  hair: u("1591351897269-32424bb1005a"),
  cosmetics: u("1512496015851-a90fb38ba796"),
  before: u("1676439977206-b5ffdfc03da2"),
  after:
    "https://images.pexels.com/photos/36551846/pexels-photo-36551846.jpeg?auto=compress&cs=tinysrgb&w=1400",
};

export const SERVICES = [
  {
    id: "bridal",
    title: "Bridal & Wedding Makeup",
    desc: "Christian church weddings, civil & JW celebrations — 14-hr HD/airbrush wear. Soft & modest or full glam: ikaw ang bahala!",
    price: "₱18,000",
    img: IMG.bridal,
  },
  {
    id: "party",
    title: "Event & Party Glam",
    desc: "Debuts, galas, receptions and red-carpet moments. Soft glam to full drama — you choose the mood.",
    price: "₱6,500",
    img: IMG.eventGlam,
  },
  {
    id: "photoshoot",
    title: "Photoshoot & Editorial",
    desc: "Camera-ready artistry with skin-true finishes that translate beautifully on every lens and light.",
    price: "₱12,000",
    img: IMG.photoshoot,
  },
  {
    id: "hair",
    title: "Hair Styling & Artistry",
    desc: "Signature updos, soft waves, veil and dupatta setting — styled to hold from aisle to after-party.",
    price: "₱3,500",
    img: IMG.hair,
  },
];

export const PACKAGES = [
  {
    id: "party",
    name: "Party Glam",
    price: "₱6,500",
    tagline: "Debuts, cocktails & celebrations",
    features: [
      "HD makeup — soft or full glam",
      "Free false lashes",
      "Skin-prep & touch-up kit",
      "On-location service",
    ],
  },
  {
    id: "bridal",
    name: "Bridal Luxe",
    price: "₱18,000",
    tagline: "Your once-in-a-lifetime look",
    featured: true,
    features: [
      "HD / Airbrush base, 14-hr wear",
      "Hair styling & veil / dupatta draping",
      "Premium lashes & touch-up kit",
      "Trial session included",
      "On-time doorstep service",
    ],
  },
  {
    id: "editorial",
    name: "Photoshoot & Editorial",
    price: "₱12,000",
    tagline: "Camera-ready for brands & creators",
    features: [
      "Editorial look design & moodboard",
      "Unlimited looks within session",
      "Hair styling included",
      "On-set touch-ups",
    ],
  },
];

export const REVIEWS = [
  {
    name: "Andrea & Marco",
    event: "Tagaytay Wedding",
    quote:
      "Hikarah made me feel like the most beautiful version of myself. My bridal glam lasted the entire 14-hour day — through tears, hugs and dancing.",
  },
  {
    name: "Sophia R.",
    event: "Editorial Shoot, BGC",
    quote:
      "Soft glam perfection. She matched my skin tone exactly and my makeup looked flawless on camera — zero retouching needed on the face.",
  },
  {
    name: "Mei L.",
    event: "Debut, Quezon City",
    quote:
      "On time, super hygienic and so calm on the morning of my wedding. The whole entourage booked her for my debut right after.",
  },
];

export const BRANDS = ["M·A·C", "Bobbi Brown", "NARS", "Huda Beauty", "Charlotte Tilbury", "Dior Beauty"];
