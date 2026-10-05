import { API_URL, IMG } from "./site";

export const GALLERY_CATEGORIES = ["Bridal Glam", "Soft / Natural", "Party & Prom", "Eye & Brows", "Bridal Glam / Full Glam"];
export const PLACEHOLDER_PAIR = {
  before_id: null, after_id: null, is_placeholder: true,
  before_label: "Bare Face & Skin Prep",
  after_label: "Davao Signature Full Glam Transformation",
};
export const comparisonImage = (pair, side) => pair?.[side]?.url ? `${API_URL}${pair[side].url}` : IMG[side];
export const galleryItem = (u) => ({
  id: u.id, cat: u.category, title: u.title, description: u.description,
  price: u.price, rating: u.rating, img: `${API_URL}${u.url}`, video: u.media_type === "video",
});
export const lookLink = (id) => {
  const url = new URL("/", API_URL);
  url.searchParams.set("look", id);
  url.hash = "portfolio";
  return url.href;
};
export const trackLookTap = (id) => {
  const eventId = crypto.randomUUID();
  // Do not wait for analytics before opening WhatsApp. Retry uses the same event ID.
  const send = () => fetch(`${API_URL}/api/media/${id}/enquiry-tap`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event_id: eventId }), keepalive: true,
  });
  send().then((response) => { if (response.status >= 500) send().catch(() => {}); }).catch(() => send().catch(() => {}));
};