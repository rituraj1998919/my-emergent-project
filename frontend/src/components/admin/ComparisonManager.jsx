import React, { useEffect, useState } from "react";
import axios from "axios";
import { ArrowLeftRight, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "../../lib/site";
import { PLACEHOLDER_PAIR } from "../../lib/gallery";
import { BeforeAfter } from "../gallery/BeforeAfter";

export const ComparisonManager = ({ token, items }) => {
  const [draft, setDraft] = useState(PLACEHOLDER_PAIR);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    let active = true;
    axios.get(`${API_URL}/api/gallery/comparison`).then(({ data }) => { if (active) { setDraft(data); setError(""); } })
      .catch(() => { if (active) setError("Could not load the active pair. Reload to try again."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [items]);
  const photos = items.filter(m => m.media_type === "image");
  const before = photos.find(m => m.id === draft.before_id);
  const after = photos.find(m => m.id === draft.after_id);
  const ready = before && after && before.id !== after.id && draft.before_label.trim() && draft.after_label.trim();
  const preview = ready ? { ...draft, before, after, is_placeholder: false } : PLACEHOLDER_PAIR;
  const change = (field, value) => { setDraft(d => ({ ...d, [field]: value })); setSaved(false); };
  const save = async (placeholder = false) => {
    setBusy(true); setError(""); setSaved(false);
    const source = placeholder ? PLACEHOLDER_PAIR : draft;
    const body = Object.fromEntries(["before_id", "after_id", "before_label", "after_label"].map(k => [k, source[k]]));
    try {
      const { data } = await axios.put(`${API_URL}/api/gallery/comparison`, body, { headers: { Authorization: `Bearer ${token}` } });
      setDraft(data); setSaved(true); toast.success(placeholder ? "Placeholder preview restored." : "Before & after pair is live.");
    } catch (err) { setError(typeof err.response?.data?.detail === "string" ? err.response.data.detail : "Could not save the photo pair."); }
    finally { setBusy(false); }
  };
  return <section className="mt-12 border-y border-blush/40 py-10" data-testid="admin-comparison-panel">
    <h2 className="font-display text-3xl text-charcoal flex items-center gap-3"><ArrowLeftRight className="w-5 h-5 text-rosegold" /> Before & after</h2>
    <div className="grid lg:grid-cols-2 gap-8 mt-6 items-start">
      <div className="space-y-4 min-w-0">
        {["before", "after"].map(side => <div key={side}>
          <label className="block text-sm font-bold capitalize">{side} photo
            <select value={draft[`${side}_id`] || ""} onChange={e => change(`${side}_id`, e.target.value || null)} disabled={busy || loading} className="field mt-2" data-testid={`admin-comparison-${side}-select`}>
              <option value="">Select an uploaded photo</option>
              {photos.map(m => <option key={m.id} value={m.id} disabled={m.id === draft[side === "before" ? "after_id" : "before_id"]}>{m.title}</option>)}
            </select>
          </label>
          <label className="block text-xs font-semibold mt-3 capitalize">{side} caption<input value={draft[`${side}_label`]} onChange={e => change(`${side}_label`, e.target.value)} maxLength={100} disabled={busy || loading} className="field mt-1" data-testid={`admin-comparison-${side}-caption`} /></label>
        </div>)}
        {photos.length < 2 && <p className="text-sm text-mutedtext" data-testid="admin-comparison-empty">Two uploaded photos are needed. Videos cannot be used here.</p>}
        {draft.before_id === draft.after_id && draft.before_id && <p className="text-sm text-ruby" data-testid="admin-comparison-invalid">Choose two different photos.</p>}
        <div className="flex flex-wrap gap-3 pt-2">
          <button disabled={!ready || busy || loading} onClick={() => save()} className="look-action bg-plum text-white" data-testid="admin-comparison-save"><Save size={16} />{busy ? "Saving…" : "Publish pair"}</button>
          <button disabled={busy || loading} onClick={() => save(true)} className="look-action text-plum" data-testid="admin-comparison-reset"><RotateCcw size={15} />Use placeholders</button>
        </div>
        {error && <p role="alert" className="text-sm text-ruby" data-testid="admin-comparison-error">{error}</p>}
        {saved && <p role="status" className="text-sm text-plum" data-testid="admin-comparison-saved">Saved · Now live on your portfolio.</p>}
      </div>
      <div className="min-w-0"><p className="text-xs font-bold text-mutedtext mb-3" data-testid="admin-comparison-preview-label">{loading ? "Loading…" : "Preview"}</p><BeforeAfter key={`${draft.before_id}-${draft.after_id}`} pair={preview} testPrefix="admin-comparison-preview" /></div>
    </div>
  </section>;
};