import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { MapPin, Save } from "lucide-react";
import { API_URL } from "../../lib/site";
import { DEFAULT_SETTINGS, mapEmbedUrl } from "../../lib/useSettings";

const FIELDS = [
  { key: "studio_address", label: "Studio Address (map pin yahi lagega)", placeholder: "Narra St. Victoria Pelayo, Brgy Centro Agdao, Davao City", full: true },
  { key: "service_area", label: "Service Area line", placeholder: "Davao City studio & doorstep", full: true },
  { key: "facebook", label: "Facebook link", placeholder: "https://facebook.com/..." },
  { key: "instagram", label: "Instagram link", placeholder: "https://instagram.com/yourhandle" },
  { key: "pinterest", label: "Pinterest link", placeholder: "https://pinterest.com/yourhandle" },
  { key: "youtube", label: "YouTube link", placeholder: "https://youtube.com/@yourchannel" },
];

export function StudioSettings({ token }) {
  const [form, setForm] = useState(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/api/settings`).then(({ data }) => setForm({ ...DEFAULT_SETTINGS, ...data })).catch(() => {});
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await axios.put(`${API_URL}/api/settings`, form, { headers: { Authorization: `Bearer ${token}` } });
      setForm({ ...DEFAULT_SETTINGS, ...data });
      toast.success("Studio settings saved — website par live!");
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="bg-white rounded-[28px] border border-[#F0E6E2] p-7 sm:p-9 shadow-sm mt-10" data-testid="admin-settings-panel">
      <h2 className="font-display text-3xl text-charcoal flex items-center gap-3">
        <MapPin className="w-6 h-6 text-rosegold" /> Studio Settings
      </h2>
      <p className="text-sm text-mutedtext mt-1">Studio address aur social links — Booking map aur Footer icons yahin se update hote hain. Link khali chhodo to wo icon website se hat jayega.</p>

      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        {FIELDS.map((f) => (
          <label key={f.key} className={`block ${f.full ? "sm:col-span-2" : ""}`}>
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal/70">{f.label}</span>
            <input
              value={form[f.key] || ""}
              onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
              className="field mt-2"
              placeholder={f.placeholder}
              data-testid={`admin-settings-${f.key.replace(/_/g, "-")}-input`}
            />
          </label>
        ))}
      </div>

      <div className="mt-6 rounded-[20px] overflow-hidden border border-[#F0E6E2]" data-testid="admin-settings-map-preview">
        <iframe title="Studio map preview" src={mapEmbedUrl(form.studio_address || DEFAULT_SETTINGS.studio_address)} className="w-full h-[200px] border-0 block" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      </div>

      <button type="submit" disabled={saving} data-testid="admin-settings-save-btn" className="mt-6 inline-flex items-center gap-3 rounded-full bg-plum text-cream font-bold px-8 py-3.5 hover:bg-ruby transition-colors disabled:opacity-60">
        <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Settings"}
      </button>
    </form>
  );
}
