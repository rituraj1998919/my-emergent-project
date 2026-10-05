import React, { useState } from "react";
import axios from "axios";
import { KeyRound } from "lucide-react";
import { API_URL } from "../../lib/site";

export const PasswordChange = ({ token, onTokenChange }) => {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const save = async event => {
    event.preventDefault(); setError(""); setStatus("");
    if (form.next !== form.confirm) { setError("New passwords don't match."); return; }
    if (new TextEncoder().encode(form.next).length > 72) { setError("Password must be 72 bytes or fewer."); return; }
    setBusy(true);
    try {
      const { data } = await axios.put(`${API_URL}/api/auth/password`, { current_password: form.current, new_password: form.next }, { headers: { Authorization: `Bearer ${token}` } });
      onTokenChange(data.access_token); setForm({ current: "", next: "", confirm: "" }); setStatus("Password updated. Other sessions have been signed out.");
    } catch (err) { setError(typeof err.response?.data?.detail === "string" ? err.response.data.detail : "Could not update password. Please try again."); }
    finally { setBusy(false); }
  };
  return <section className="border-t border-blush/40 py-9 mt-10" data-testid="security-password-section">
    <h2 className="font-display text-2xl flex items-center gap-3"><KeyRound size={20} className="text-rosegold" /> Change password</h2>
    <form onSubmit={save} className="max-w-xl mt-5 space-y-4" data-testid="security-password-form">
      {[["current", "Current password", "current-password"], ["next", "New password", "new-password"], ["confirm", "Confirm new password", "new-password"]].map(([key, label, autoComplete]) => <label key={key} className="block text-sm font-semibold">{label}<input type="password" autoComplete={autoComplete} value={form[key]} required minLength={key === "current" ? 1 : 12} maxLength={72} onChange={e => setForm({ ...form, [key]: e.target.value })} className="field mt-2" data-testid={`security-password-${key}`} /></label>)}
      <p className="text-xs text-mutedtext" data-testid="security-password-requirements">At least 12 characters. Changing your password signs out other sessions.</p>
      {error && <p role="alert" className="text-sm text-ruby" data-testid="security-password-error">{error}</p>}
      {status && <p role="status" className="text-sm text-plum" data-testid="security-password-success">{status}</p>}
      <button disabled={busy} type="submit" className="look-action bg-plum text-white" data-testid="security-password-submit"><KeyRound size={16} />{busy ? "Updating…" : "Update password"}</button>
    </form>
  </section>;
};