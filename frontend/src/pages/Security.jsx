import React, { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import axios from "axios";
import { ShieldCheck, RefreshCw, Check, ArrowLeft, LogOut } from "lucide-react";
import { Toaster } from "sonner";
import { LogoMark } from "../components/Logo";
import { PasswordChange } from "../components/admin/PasswordChange";
import { useOwnerSession } from "../lib/ownerSession";
import { API_URL } from "../lib/site";

const LABELS = { unfamiliar_login: "Sign-in from an unfamiliar browser or network", unfamiliar_attempt: "Failed sign-in from an unfamiliar browser or network", login_lockout: "Sign-in temporarily locked after 5 failed attempts", password_changed: "Owner password changed" };

export default function Security() {
  const { token, updateToken, checking } = useOwnerSession();
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reviewing, setReviewing] = useState("");
  const load = useCallback(async () => {
    if (!token) return;
    setBusy(true); setError("");
    try { const { data } = await axios.get(`${API_URL}/api/security/events`, { headers: { Authorization: `Bearer ${token}` } }); setData(data); }
    catch { setError("Security alerts couldn't load. Please try again."); }
    finally { setBusy(false); }
  }, [token]);
  useEffect(() => { if (!checking) load(); }, [checking, load]);
  const review = async id => {
    setReviewing(id); setError("");
    try { await axios.patch(`${API_URL}/api/security/events/${id}/review`, {}, { headers: { Authorization: `Bearer ${token}` } }); await load(); }
    catch { setError("Could not mark the alert as reviewed."); }
    finally { setReviewing(""); }
  };
  if (checking) return <div className="min-h-screen bg-cream p-10 text-center" data-testid="security-session-loading">Checking owner session…</div>;
  if (!token) return <Navigate to="/admin" replace />;
  return <div className="min-h-screen bg-cream" data-testid="security-page">
    <Toaster position="top-center" richColors />
    <header className="border-b border-blush/40"><div className="max-w-5xl mx-auto px-5 py-5 flex flex-wrap gap-4 items-center justify-between"><Link to="/admin" className="flex gap-3 items-center text-plum" data-testid="security-back-link"><LogoMark size={32} /><ArrowLeft size={16} />Owner Studio</Link><button onClick={() => updateToken("")} className="look-action text-plum" data-testid="security-logout"><LogOut size={16} />Log out</button></div></header>
    <main className="max-w-5xl mx-auto px-5 sm:px-8 py-12">
      <div className="flex items-center gap-3 text-rosegold"><ShieldCheck size={22} /><span className="text-xs font-bold">OWNER ACCESS</span></div>
      <h1 className="font-display text-4xl sm:text-5xl text-plum mt-3" data-testid="security-page-heading">Studio security</h1>
      <div className="mt-7 py-4 border-y border-blush/40 flex flex-wrap items-center justify-between gap-4"><p className="text-sm" data-testid="security-unread-count">{data ? data.unread : "—"} unreviewed alerts</p><button onClick={load} disabled={busy} className="look-action text-plum" data-testid="security-refresh"><RefreshCw size={15} className={busy ? "animate-spin" : ""} />Refresh</button></div>
      <p className="mt-4 text-sm text-mutedtext" data-testid="security-delivery-note">Owner Studio alerts only · Email and SMS are not connected.</p>
      <p className="mt-2 text-xs text-mutedtext" data-testid="security-privacy-note">Last 100 events · 90-day retention · Network addresses are masked. Browser/network changes are signals, not verified locations.</p>
      {error && <p role="alert" className="mt-5 text-ruby text-sm" data-testid="security-alert-error">{error}</p>}
      {!data && busy && <p className="py-8 text-sm" data-testid="security-alert-loading">Loading alerts…</p>}
      {data?.events.length === 0 && <p className="py-10 text-mutedtext" data-testid="security-alert-empty">No security alerts yet.</p>}
      <ul className="divide-y divide-blush/30 mt-5" data-testid="security-alert-list">{data?.events.map(event => <li key={event.id} className="py-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between" data-testid={`security-alert-${event.id}`}>
        <div className="min-w-0"><p className="font-semibold text-sm break-words" data-testid={`security-alert-title-${event.id}`}>{LABELS[event.kind] || "Security event"}</p><p className="text-xs text-mutedtext mt-2 break-words" data-testid={`security-alert-context-${event.id}`}>{event.browser} · {event.network}</p><time className="text-xs text-mutedtext mt-1 block" dateTime={event.created_at} data-testid={`security-alert-time-${event.id}`}>{new Date(event.created_at).toLocaleString()}</time></div>
        {event.reviewed ? <span className="text-xs text-mutedtext flex items-center gap-1" data-testid={`security-alert-reviewed-${event.id}`}><Check size={14} />Reviewed</span> : <button onClick={() => review(event.id)} disabled={!!reviewing} className="look-action text-plum shrink-0" data-testid={`security-alert-review-${event.id}`}>{reviewing === event.id ? "Saving…" : "Mark reviewed"}</button>}
      </li>)}</ul>
      <PasswordChange token={token} onTokenChange={updateToken} />
    </main>
  </div>;
}