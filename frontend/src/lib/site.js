export const WA_NUMBER = "639558896008";
export const WA_LINK = `https://wa.me/${WA_NUMBER}`;
export const FB_LINK = "https://www.facebook.com/share/19axnjTYpP/";
export const PHONE_DISPLAY = "+63 955 889 6008";
export const API_URL = process.env.REACT_APP_BACKEND_URL || "";

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

export const GALLERY = [
  { id: 11, cat: "Bridal", title: "Church Wedding", img: u("1777414552523-becebd67568a"), tall: true },
  { id: 12, cat: "Soft Glam", title: "Natural Glow", img: "https://images.pexels.com/photos/1124833/pexels-photo-1124833.jpeg?auto=compress&cs=tinysrgb&w=1200" },
  { id: 13, cat: "Bridal", title: "Down the Aisle", img: u("1548313093-370cf4ba3892") },
  { id: 14, cat: "Soft Glam", title: "Barefaced Beauty", img: u("1783703890139-fa5ba14cf707") },
  { id: 15, cat: "Soft Glam", title: "Serene Morning", img: "https://images.pexels.com/photos/39873699/pexels-photo-39873699.jpeg?auto=compress&cs=tinysrgb&w=1200" },
  { id: 1, cat: "Bridal", title: "The Royal Bride", img: u("1600685890506-593fdf55949b"), tall: true },
  { id: 2, cat: "Glam", title: "Electric Night Glam", img: u("1596205521983-9c372fb3d4f1") },
  { id: 3, cat: "Hair", title: "Floral Braid Dream", img: u("1481068164146-e8beb686f4d2") },
  { id: 4, cat: "Bridal", title: "Golden Hour Bride", img: u("1722805740076-7c51a8669afc"), tall: true },
  { id: 5, cat: "Editorial", title: "Studio Editorial", img: u("1628153277991-7a185ac84511") },
  { id: 6, cat: "Glam", title: "Violet Soft Glam", img: u("1585433405076-9626d637cc83"), tall: true },
  { id: 7, cat: "Hair", title: "Pearl Pin Updo", img: u("1586342805832-c0f10f33ac3d") },
  { id: 8, cat: "Bridal", title: "Veil & Lace", img: u("1488846343176-08e05ab9a2a1") },
  { id: 9, cat: "Editorial", title: "Golden Muse", img: u("1610166970010-c2e6c3da7164"), tall: true },
  { id: 10, cat: "Glam", title: "Rose Lips Ritual", img: u("1585049303349-6680e6179692") },
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
