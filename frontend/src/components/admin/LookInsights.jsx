import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { TrendingUp, RefreshCw } from "lucide-react";
import { API_URL } from "../../lib/site";

export const LookInsights = ({ token, items, onCounts }) => {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setBusy(true); setError("");
    try {
      const { data: next } = await axios.get(`${API_URL}/api/gallery/insights`, { headers: { Authorization: `Bearer ${token}` } });
      setData(next); onCounts(Object.fromEntries(next.looks.map(m => [m.id, m.taps])));
    } catch { setError("Could not load look counts. Try refresh."); }
    finally { setBusy(false); }
  }, [token, onCounts]);
  useEffect(() => { load(); }, [load, items]);
  useEffect(() => { const refresh = () => { if (!document.hidden) load(); }; window.addEventListener("focus", refresh); return () => window.removeEventListener("focus", refresh); }, [load]);
  const popular = data?.looks.filter(m => m.taps > 0).slice(0, 5) || [];
  return <section className="mt-12 border-y border-blush/40 py-9" data-testid="admin-look-insights">
    <div className="flex flex-wrap justify-between items-center gap-4">
      <h2 className="font-display text-3xl flex items-center gap-3"><TrendingUp className="w-5 h-5 text-rosegold" /> Look enquiries</h2>
      <button onClick={load} disabled={busy} className="look-action text-plum" data-testid="look-insights-refresh"><RefreshCw size={15} className={busy ? "animate-spin" : ""} />Refresh</button>
    </div>
    <p className="text-sm text-mutedtext mt-2" data-testid="look-insights-note">“Book This Look” taps · not confirmed messages or bookings · active posts only</p>
    <p className="mt-5 font-display text-4xl text-plum" data-testid="look-insights-total">{data ? data.total_taps.toLocaleString() : "—"} <span className="font-sans text-sm text-mutedtext">total taps</span></p>
    {error && <p role="alert" className="text-sm text-ruby mt-3" data-testid="look-insights-error">{error}</p>}
    {popular.length > 0 ? <ol className="mt-5 divide-y divide-blush/30" data-testid="look-insights-ranking">{popular.map((look, index) => <li key={look.id} className="flex items-center gap-4 py-3 min-w-0" data-testid={`look-insight-${look.id}`}>
      <span className="text-rosegold text-sm font-bold w-5" data-testid={`look-rank-${look.id}`}>{index + 1}</span>
      <div className="min-w-0 flex-1"><p className="text-sm font-semibold break-words" data-testid={`look-rank-title-${look.id}`}>{look.title}</p><p className="text-xs text-mutedtext" data-testid={`look-rank-category-${look.id}`}>{look.category}</p></div>
      <span className="text-sm text-plum font-bold shrink-0" data-testid={`look-rank-taps-${look.id}`}>{look.taps} taps</span>
    </li>)}</ol> : !error && data && <p className="text-sm text-mutedtext mt-4" data-testid="look-insights-empty">No look taps yet.</p>}
  </section>;
};