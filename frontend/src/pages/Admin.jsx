import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, Toaster } from "sonner";
import { Upload, Trash2, LogOut, Play, Lock, Image as ImageIcon, Film, CheckCircle2, Undo2 } from "lucide-react";
import { LogoMark } from "../components/Logo";
import { StudioSettings } from "../components/admin/StudioSettings";
import { API_URL } from "../lib/site";

const CATEGORIES = ["Bridal Glam", "Soft / Natural", "Party & Prom", "Eye & Brows", "Bridal Glam / Full Glam"];

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem("irsmakup_owner_token") || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [items, setItems] = useState([]);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Bridal Glam");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);
  const [reviewList, setReviewList] = useState([]);
  const [rev, setRev] = useState({ name: "", event: "", quote: "", rating: "5" });
  const [revPhoto, setRevPhoto] = useState(null);
  const [revBusy, setRevBusy] = useState(false);

  const loadItems = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/media`);
      setItems(data);
    } catch {
      /* gallery stays with defaults */
    }
  };

  const [inquiries, setInquiries] = useState([]);
  const [inqFilter, setInqFilter] = useState("all");

  const setInquiryStatus = async (id, status) => {
    try {
      await axios.patch(`${API_URL}/api/inquiries/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInquiries((list) => list.map((q) => (q.id === id ? { ...q, status } : q)));
      toast.success(status === "replied" ? "Marked as replied ✓" : "Moved back to New.");
    } catch {
      toast.error("Could not update inquiry.");
    }
  };

  const visibleInquiries = inquiries.filter((q) => inqFilter === "all" || (q.status || "new") === inqFilter);
  const newCount = inquiries.filter((q) => (q.status || "new") === "new").length;

  const loadReviews = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/reviews`);
      setReviewList(Array.isArray(data) ? data : []);
    } catch {
      setReviewList([]);
    }
  };

  const loadInquiries = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/inquiries`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInquiries(Array.isArray(data) ? data : []);
    } catch {
      setInquiries([]);
    }
  };

  useEffect(() => {
    if (token) {
      loadItems();
      loadReviews();
      loadInquiries();
    }
  }, [token]);

  const submitReview = async (e) => {
    e.preventDefault();
    setRevBusy(true);
    try {
      const fd = new FormData();
      fd.append("name", rev.name);
      fd.append("event", rev.event);
      fd.append("quote", rev.quote);
      fd.append("rating", rev.rating);
      if (revPhoto) fd.append("photo", revPhoto);
      await axios.post(`${API_URL}/api/reviews`, fd, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Review posted! It's live on the website.");
      setRev({ name: "", event: "", quote: "", rating: "5" });
      setRevPhoto(null);
      document.getElementById("review-photo-input").value = "";
      loadReviews();
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Could not post review.");
    } finally {
      setRevBusy(false);
    }
  };

  const removeReview = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/reviews/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Review removed.");
      loadReviews();
    } catch {
      toast.error("Could not delete review.");
    }
  };

  const login = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      localStorage.setItem("irsmakup_owner_token", data.access_token);
      setToken(data.access_token);
      toast.success("Welcome back, Hikarah!");
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Login failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const upload = async (e) => {
    e.preventDefault();
    if (!file || file.length === 0) {
      toast.error("Choose a photo or video first.");
      return;
    }
    setBusy(true);
    try {
      const list = Array.from(file).slice(0, 10);
      let done = 0;
      for (const f of list) {
        const fd = new FormData();
        fd.append("file", f);
        fd.append("title", title);
        fd.append("category", category);
        fd.append("description", description);
        fd.append("price", price);
        await axios.post(`${API_URL}/api/media`, fd, {
          headers: { Authorization: `Bearer ${token}` },
        });
        done += 1;
        toast.success(`Posted ${done}/${list.length} — live on your portfolio.`);
      }
      setFile(null);
      setTitle("");
      setDescription("");
      setPrice("");
      document.getElementById("media-file-input").value = "";
      loadItems();
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Upload failed. Try a smaller file.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/media/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Removed from your portfolio.");
      loadItems();
    } catch {
      toast.error("Could not delete. Try again.");
    }
  };

  const logout = () => {
    localStorage.removeItem("irsmakup_owner_token");
    setToken("");
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-5" data-testid="admin-login-page">
        <Toaster position="top-center" richColors />
        <form onSubmit={login} className="w-full max-w-md bg-white rounded-[28px] border border-[#F0E6E2] p-9 shadow-[0_40px_90px_-35px_rgba(74,21,37,0.3)]" data-testid="admin-login-form">
          <div className="flex justify-center mb-6"><LogoMark size={56} /></div>
          <h1 className="font-display italic text-4xl text-center text-charcoal">Owner Studio</h1>
          <p className="text-sm text-mutedtext text-center mt-2">Only for Hikarah — post your makeup photos & videos.</p>
          <label className="block mt-7">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal/70">Email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="field mt-2" placeholder="owner@irsmakup.com" data-testid="admin-email-input" />
          </label>
          <label className="block mt-4">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal/70">Password</span>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="field mt-2" placeholder="••••••••" data-testid="admin-password-input" />
          </label>
          <button type="submit" disabled={busy} data-testid="admin-login-btn" className="mt-7 w-full inline-flex items-center justify-center gap-2 rounded-full bg-plum text-cream font-bold px-6 py-3.5 hover:bg-ruby transition-colors disabled:opacity-60">
            <Lock className="w-4 h-4" /> {busy ? "Checking…" : "Enter Studio"}
          </button>
          <a href="/" className="block text-center text-sm text-mutedtext hover:text-plum mt-6 transition-colors" data-testid="admin-back-link">← Back to website</a>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream" data-testid="admin-studio-page">
      <Toaster position="top-center" richColors />
      <header className="glass sticky top-0 z-40 border-b border-[#F0E6E2]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-[68px] flex items-center justify-between">
          <div className="flex items-center gap-3"><LogoMark size={34} /><span className="font-display italic text-2xl text-charcoal">Owner Studio</span></div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-sm font-semibold text-mutedtext hover:text-plum transition-colors" data-testid="admin-view-site-link">View site</a>
            <button onClick={logout} data-testid="admin-logout-btn" className="inline-flex items-center gap-2 rounded-full border-2 border-charcoal/10 px-4 py-2 text-sm font-bold hover:border-ruby hover:text-ruby transition-colors">
              <LogOut className="w-4 h-4" /> Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
        <section className="bg-white rounded-[28px] border border-[#F0E6E2] p-7 sm:p-9 shadow-sm" data-testid="admin-inquiries-panel">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl text-charcoal">
                Booking Inquiries <span className="text-base font-sans text-mutedtext" data-testid="admin-inquiries-count">({inquiries.length})</span>
                {newCount > 0 && <span className="ml-3 align-middle rounded-full bg-ruby text-white text-xs font-bold px-2.5 py-1" data-testid="admin-inquiries-new-badge">{newCount} new</span>}
              </h2>
              <p className="text-sm text-mutedtext mt-1">Website ke booking form se aayi har inquiry — WhatsApp par reply karein, phir "Replied" mark karein.</p>
            </div>
            <div className="inline-flex rounded-full border border-[#F0E6E2] p-1 bg-cream" data-testid="admin-inquiry-filter">
              {[["all", "All"], ["new", "New"], ["replied", "Replied"]].map(([v, label]) => (
                <button key={v} type="button" onClick={() => setInqFilter(v)} data-testid={`admin-inquiry-filter-${v}`} className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${inqFilter === v ? "bg-plum text-cream" : "text-charcoal/60 hover:text-plum"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {visibleInquiries.length === 0 ? (
            <div className="mt-6 rounded-[20px] border-2 border-dashed border-blush/60 p-10 text-center text-mutedtext" data-testid="admin-inquiry-empty">
              <p className="font-semibold">{inquiries.length === 0 ? "Abhi koi inquiry nahi aayi — jaise hi koi client form bharega, yahan dikhega." : "Is filter me koi inquiry nahi."}</p>
            </div>
          ) : (
            <div className="mt-6 space-y-4" data-testid="admin-inquiries-list">
              {visibleInquiries.map((q) => {
                const replied = (q.status || "new") === "replied";
                return (
                <div key={q.id} className={`rounded-[20px] border p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 card-hover ${replied ? "border-[#F0E6E2] bg-cream/60 opacity-75" : "border-blush/70 bg-white"}`} data-testid={`admin-inquiry-item-${q.id}`} data-status={replied ? "replied" : "new"}>
                  <div className="min-w-0">
                    <p className="font-bold text-charcoal flex flex-wrap items-center gap-2">
                      {q.name} <span className="text-xs font-semibold text-rosegold uppercase tracking-widest">· {q.event_type}</span>
                      <span className={`rounded-full text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${replied ? "bg-whatsapp/30 text-plumdeep" : "bg-ruby/10 text-ruby"}`} data-testid={`admin-inquiry-status-${q.id}`}>{replied ? "Replied" : "New"}</span>
                    </p>
                    <p className="text-sm text-mutedtext mt-0.5">
                      {q.event_date}{q.venue ? ` · ${q.venue}` : ""} · {q.pax} pax · {q.phone}
                    </p>
                    {q.message && <p className="text-sm text-charcoal/70 mt-1">"{q.message}"</p>}
                  </div>
                  <div className="shrink-0 flex flex-wrap gap-2">
                    <a
                      href={`https://wa.me/${(q.phone || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi ${q.name}! Hikarah here — salamat kaayo for your ${q.event_type} inquiry. Let's confirm your date!`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`admin-inquiry-wa-${q.id}-btn`}
                      className="inline-flex items-center justify-center rounded-full bg-whatsapp text-plumdeep text-sm font-bold px-5 py-2.5 hover:-translate-y-0.5 transition-transform"
                    >
                      Reply on WhatsApp
                    </a>
                    <button
                      type="button"
                      onClick={() => setInquiryStatus(q.id, replied ? "new" : "replied")}
                      data-testid={`admin-inquiry-toggle-${q.id}-btn`}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-full border-2 text-sm font-bold px-5 py-2.5 transition-colors ${replied ? "border-charcoal/15 text-charcoal/60 hover:border-ruby hover:text-ruby" : "border-plum text-plum hover:bg-plum hover:text-cream"}`}
                    >
                      {replied ? <><Undo2 className="w-4 h-4" /> Mark as New</> : <><CheckCircle2 className="w-4 h-4" /> Mark as Replied</>}
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </section>

        <StudioSettings token={token} />

        <form onSubmit={upload} className="bg-white rounded-[28px] border border-[#F0E6E2] p-7 sm:p-9 shadow-sm mt-10" data-testid="admin-upload-form">
          <h2 className="font-display text-3xl text-charcoal flex items-center gap-3">
            <Upload className="w-6 h-6 text-rosegold" /> Post new work
          </h2>
          <p className="text-sm text-mutedtext mt-1">Photo ya video choose karein — website ke portfolio me turant live ho jayega.</p>

          <div className="mt-6 grid sm:grid-cols-3 gap-4">
            <label className="block sm:col-span-1">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal/70">Photos / Videos * (up to 10 ek saath)</span>
              <input id="media-file-input" type="file" accept="image/*,video/*" multiple required onChange={(e) => setFile(e.target.files)} className="field mt-2 p-2 file:mr-3 file:rounded-full file:border-0 file:bg-blush file:text-plumdeep file:px-4 file:py-1.5 file:text-xs file:font-bold" data-testid="admin-file-input" />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal/70">Title</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="field mt-2" placeholder="e.g. Royal Red Bride" data-testid="admin-title-input" />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal/70">Category</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="field mt-2" data-testid="admin-category-select">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal/70">Description (lightbox me dikhega)</span>
              <input value={description} onChange={(e) => setDescription(e.target.value)} className="field mt-2" placeholder="e.g. Elegant, long-lasting wedding makeup with flawless skin prep." data-testid="admin-description-input" />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal/70">Price</span>
              <input value={price} onChange={(e) => setPrice(e.target.value)} className="field mt-2" placeholder="e.g. ₱6,500" data-testid="admin-price-input" />
            </label>
          </div>

          <button type="submit" disabled={busy} data-testid="admin-upload-btn" className="mt-6 inline-flex items-center gap-3 rounded-full bg-plum text-cream font-bold px-8 py-3.5 hover:bg-ruby transition-colors disabled:opacity-60">
            {busy ? "Posting…" : "Post to Portfolio"}
          </button>
        </form>

        <h2 className="font-display text-3xl text-charcoal mt-14 mb-6 flex items-center gap-3">
          <ImageIcon className="w-5 h-5 text-rosegold" /> Your posts <span className="text-base text-mutedtext font-sans">({items.length})</span>
        </h2>

        {items.length === 0 ? (
          <div className="rounded-[24px] border-2 border-dashed border-blush/60 p-14 text-center text-mutedtext" data-testid="admin-empty-state">
            <Film className="w-8 h-8 mx-auto text-blush" />
            <p className="mt-4 font-semibold">No posts yet — apna pehla makeup photo ya video upload karein.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5" data-testid="admin-media-list">
            {items.map((m) => (
              <div key={m.id} className="relative group rounded-[20px] overflow-hidden bg-white border border-[#F0E6E2] card-hover" data-testid={`admin-media-item-${m.id}`}>
                {m.media_type === "video" ? (
                  <video src={`${API_URL}${m.url}`} className="w-full aspect-square object-cover" muted playsInline preload="metadata" />
                ) : (
                  <img src={`${API_URL}${m.url}`} alt={m.title} className="w-full aspect-square object-cover" loading="lazy" />
                )}
                {m.media_type === "video" && (
                  <span className="absolute top-3 left-3 rounded-full bg-plumdeep/80 text-cream p-1.5"><Play className="w-3 h-3" /></span>
                )}
                <div className="p-3">
                  <p className="text-sm font-bold text-charcoal truncate">{m.title}</p>
                  <p className="text-[11px] uppercase tracking-widest text-rosegold font-bold">{m.category}{m.price ? ` · ${m.price}` : ""}</p>
                </div>
                <button
                  onClick={() => remove(m.id)}
                  data-testid={`admin-delete-${m.id}-btn`}
                  aria-label={`Delete ${m.title}`}
                  className="absolute top-3 right-3 rounded-full bg-ruby text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <h2 className="font-display text-3xl text-charcoal mt-16 mb-2" data-testid="admin-reviews-heading">
          Real Brides Wall <span className="text-base font-sans text-mutedtext">({reviewList.length})</span>
        </h2>
        <p className="text-sm text-mutedtext">Asli clients ke photos aur unke words — website ke reviews section me live.</p>

        <form onSubmit={submitReview} className="bg-white rounded-[28px] border border-[#F0E6E2] p-7 sm:p-9 shadow-sm mt-6" data-testid="admin-review-form">
          <div className="grid sm:grid-cols-3 gap-4">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal/70">Client Name *</span>
              <input required value={rev.name} onChange={(e) => setRev((r) => ({ ...r, name: e.target.value }))} className="field mt-2" placeholder="Andrea & Marco" data-testid="admin-review-name-input" />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal/70">Event</span>
              <input value={rev.event} onChange={(e) => setRev((r) => ({ ...r, event: e.target.value }))} className="field mt-2" placeholder="Tagaytay Wedding" data-testid="admin-review-event-input" />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal/70">Rating</span>
              <select value={rev.rating} onChange={(e) => setRev((r) => ({ ...r, rating: e.target.value }))} className="field mt-2" data-testid="admin-review-rating-select">
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{`${"★".repeat(n)} (${n})`}</option>)}
              </select>
            </label>
          </div>
          <label className="block mt-4">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal/70">Their Words *</span>
            <textarea required rows="3" value={rev.quote} onChange={(e) => setRev((r) => ({ ...r, quote: e.target.value }))} className="field mt-2 resize-none" placeholder="Hikarah made me feel like the most beautiful version of myself…" data-testid="admin-review-quote-input" />
          </label>
          <label className="block mt-4">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal/70">Client Photo</span>
            <input id="review-photo-input" type="file" accept="image/*" onChange={(e) => setRevPhoto(e.target.files[0])} className="field mt-2 p-2 file:mr-3 file:rounded-full file:border-0 file:bg-blush file:text-plumdeep file:px-4 file:py-1.5 file:text-xs file:font-bold" data-testid="admin-review-photo-input" />
          </label>
          <button type="submit" disabled={revBusy} data-testid="admin-review-submit-btn" className="mt-6 inline-flex items-center gap-3 rounded-full bg-plum text-cream font-bold px-8 py-3.5 hover:bg-ruby transition-colors disabled:opacity-60">
            {revBusy ? "Posting…" : "Post Review"}
          </button>
        </form>

        {reviewList.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8" data-testid="admin-review-list">
            {reviewList.map((r) => (
              <div key={r.id} className="relative group bg-white rounded-[20px] border border-[#F0E6E2] p-5 card-hover" data-testid={`admin-review-item-${r.id}`}>
                <div className="flex items-center gap-3">
                  {r.photo_url ? (
                    <img src={`${API_URL}${r.photo_url}`} alt={r.name} className="w-11 h-11 rounded-full object-cover border-2 border-champagne" loading="lazy" />
                  ) : (
                    <span className="w-11 h-11 rounded-full bg-gradient-to-br from-blush to-rosegold text-plumdeep flex items-center justify-center font-display italic text-lg">{r.name.charAt(0)}</span>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-charcoal text-sm truncate">{r.name}</p>
                    <p className="text-[11px] uppercase tracking-widest text-rosegold font-bold truncate">{r.event}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-charcoal/80 leading-relaxed">"{r.quote}"</p>
                <p className="mt-2 text-champagne text-sm tracking-widest" aria-label={`${r.rating} stars`}>{"★".repeat(r.rating)}</p>
                <button onClick={() => removeReview(r.id)} data-testid={`admin-review-delete-${r.id}-btn`} aria-label={`Delete review by ${r.name}`} className="absolute top-3 right-3 rounded-full bg-ruby text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-mutedtext" data-testid="admin-reviews-empty">No custom reviews yet — website par abhi sample reviews dikh rahe hain. Upar se pehla review post karein.</p>
        )}
      </main>
    </div>
  );
}
