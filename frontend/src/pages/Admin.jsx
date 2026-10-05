import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, Toaster } from "sonner";
import { Upload, Trash2, LogOut, Play, Lock, Image as ImageIcon, Film } from "lucide-react";
import { LogoMark } from "../components/Logo";
import { API_URL } from "../lib/site";

const CATEGORIES = ["Bridal", "Glam", "Editorial", "Hair"];

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem("irsmakup_owner_token") || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [items, setItems] = useState([]);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Bridal");
  const [busy, setBusy] = useState(false);

  const loadItems = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/media`);
      setItems(data);
    } catch {
      /* gallery stays with defaults */
    }
  };

  useEffect(() => {
    if (token) loadItems();
  }, [token]);

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
    if (!file) {
      toast.error("Choose a photo or video first.");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title);
      fd.append("category", category);
      await axios.post(`${API_URL}/api/media`, fd, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Posted! It's live on your portfolio now.");
      setFile(null);
      setTitle("");
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
        <form onSubmit={upload} className="bg-white rounded-[28px] border border-[#F0E6E2] p-7 sm:p-9 shadow-sm" data-testid="admin-upload-form">
          <h2 className="font-display text-3xl text-charcoal flex items-center gap-3">
            <Upload className="w-6 h-6 text-rosegold" /> Post new work
          </h2>
          <p className="text-sm text-mutedtext mt-1">Photo ya video choose karein — website ke portfolio me turant live ho jayega.</p>

          <div className="mt-6 grid sm:grid-cols-3 gap-4">
            <label className="block sm:col-span-1">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal/70">Photo / Video *</span>
              <input id="media-file-input" type="file" accept="image/*,video/*" required onChange={(e) => setFile(e.target.files[0])} className="field mt-2 p-2 file:mr-3 file:rounded-full file:border-0 file:bg-blush file:text-plumdeep file:px-4 file:py-1.5 file:text-xs file:font-bold" data-testid="admin-file-input" />
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
                  <p className="text-[11px] uppercase tracking-widest text-rosegold font-bold">{m.category}</p>
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
      </main>
    </div>
  );
}
