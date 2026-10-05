import React, { useState } from "react";
import axios from "axios";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../ui/dialog";
import { API_URL } from "../../lib/site";
import { GALLERY_CATEGORIES } from "../../lib/gallery";

export const MediaPostEditor = ({ item, token, onClose, onSaved }) => {
  const [form, setForm] = useState({ title: item.title, category: item.category, description: item.description || "", price: item.price || "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const field = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });
  const save = async (e) => {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const { data } = await axios.patch(`${API_URL}/api/media/${item.id}`, form, { headers: { Authorization: `Bearer ${token}` } });
      onSaved(data); toast.success("Look updated — live in your gallery."); onClose();
    } catch (err) {
      setError(typeof err.response?.data?.detail === "string" ? err.response.data.detail : "Could not save. Check your fields and try again.");
    } finally { setBusy(false); }
  };
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="max-w-xl w-[calc(100%-2rem)] max-h-[90dvh] overflow-y-auto rounded-2xl" data-lenis-prevent data-testid="edit-look-dialog">
      <DialogTitle className="font-display text-3xl text-plum" data-testid="edit-look-heading">Edit look</DialogTitle>
      <DialogDescription data-testid="edit-look-note">Original photo or video stays unchanged.</DialogDescription>
      <form onSubmit={save} className="space-y-4" data-testid="edit-look-form">
        <div className="flex items-center gap-4">
          {item.media_type === "video" ? <video src={`${API_URL}${item.url}`} muted playsInline className="h-20 w-20 object-contain rounded-lg" data-testid="edit-look-preview" /> : <img src={`${API_URL}${item.url}`} alt={item.title} className="h-20 w-20 object-contain rounded-lg" data-testid="edit-look-preview" />}
          <p className="text-xs text-mutedtext break-all" data-testid="edit-look-media-type">{item.media_type === "video" ? "Video post" : "Photo post"}</p>
        </div>
        <label className="block text-sm font-semibold">Look title<input {...field("title")} required maxLength={160} className="field mt-1" data-testid="edit-look-title" /></label>
        <label className="block text-sm font-semibold">Category<select {...field("category")} className="field mt-1" data-testid="edit-look-category">{GALLERY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></label>
        <label className="block text-sm font-semibold">Description<textarea {...field("description")} rows={3} maxLength={2000} className="field mt-1 resize-y" data-testid="edit-look-description" /></label>
        <label className="block text-sm font-semibold">Price<input {...field("price")} maxLength={60} placeholder="₱6,500" className="field mt-1" data-testid="edit-look-price" /></label>
        {error && <p role="alert" className="text-sm text-ruby" data-testid="edit-look-error">{error}</p>}
        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <button type="button" disabled={busy} onClick={onClose} className="look-action" data-testid="edit-look-cancel">Cancel</button>
          <button type="submit" disabled={busy || !form.title.trim()} className="look-action bg-plum text-white" data-testid="edit-look-save"><Save size={16} />{busy ? "Saving…" : "Save changes"}</button>
        </div>
      </form>
    </DialogContent>
  </Dialog>;
};