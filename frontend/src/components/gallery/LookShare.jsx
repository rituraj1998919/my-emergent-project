import React, { useEffect, useState } from "react";
import { Share2, Link, Download, Image } from "lucide-react";
import { WhatsAppIcon } from "../Logo";
import { lookLink } from "../../lib/gallery";
import { makeLookCard, downloadCard } from "../../lib/lookCard";

export const LookShare = ({ item }) => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [failed, setFailed] = useState(false);
  const [manualCopy, setManualCopy] = useState(false);
  const [busy, setBusy] = useState(false);
  const url = lookLink(item.id);
  const text = `${item.title}${item.price ? ` · ${item.price}` : ""} — Hikarah Lntc`;
  useEffect(() => {
    const controller = new AbortController();
    makeLookCard(item, controller.signal).then(card => { if (!controller.signal.aborted) setFile(card); }).catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [item]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setStatus("Look link copied."); }
    catch { setManualCopy(true); setStatus("Select and copy the link below."); }
  };
  const share = async (withCard = false) => {
    const canShareFile = withCard && file && navigator.canShare?.({ files: [file] });
    if (!navigator.share || (withCard && !canShareFile)) {
      if (withCard && file) { downloadCard(file); setStatus("Card downloaded. Copy the look link to share alongside it."); }
      else await copy();
      return;
    }
    setBusy(true);
    try {
      await navigator.share(canShareFile ? { files: [file], title: item.title, text: `${text}\n${url}` } : { title: item.title, text, url });
      setStatus("Share sheet completed.");
    } catch (err) { if (err.name !== "AbortError") { if (withCard && file) { downloadCard(file); setStatus("Sharing unavailable. Card downloaded instead."); } else await copy(); } }
    finally { setBusy(false); }
  };
  return <div className="border-t border-cream/20 mt-5 pt-4" data-testid="look-share-controls">
    <p className="text-xs font-bold text-champagne mb-3" data-testid="look-share-heading">Share this look</p>
    <div className="flex flex-wrap gap-2">
      <a href={`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`} target="_blank" rel="noopener noreferrer" className="look-action" data-testid="look-share-whatsapp"><WhatsAppIcon className="w-4 h-4" />WhatsApp</a>
      <button onClick={() => share()} disabled={busy} className="look-action" title="Messenger appears in your device's share menu when available; otherwise copy the link" data-testid="look-share-messenger"><Share2 size={15} />Messenger / Share</button>
      <button onClick={copy} className="look-action" data-testid="look-copy-link"><Link size={15} />Copy link</button>
      <button onClick={() => share(true)} disabled={!file || busy} className="look-action" data-testid="look-share-card"><Image size={15} />{file ? "Share card" : failed ? "Card unavailable" : "Preparing card…"}</button>
      {file && <button onClick={() => { downloadCard(file); setStatus("Look card downloaded."); }} className="look-action" title="Download look card" aria-label="Download look card" data-testid="look-download-card"><Download size={15} /></button>}
    </div>
    {manualCopy && <input readOnly value={url} onFocus={e => e.target.select()} aria-label="Shareable look link" className="field mt-3" data-testid="look-share-link-fallback" />}
    {(status || failed) && <p role="status" className="text-xs text-cream/75 mt-3" data-testid="look-share-status">{status || "Card preview couldn't load. The look link is still available."}</p>}
  </div>;
};