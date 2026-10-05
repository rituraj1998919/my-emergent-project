import React, { useState } from "react";
import axios from "axios";
import { toast, Toaster } from "sonner";
import { CalendarCheck, Facebook, Phone, MapPin } from "lucide-react";
import { Reveal, SectionHead } from "../components/Reveal";
import { WhatsAppIcon } from "../components/Logo";
import { API_URL, WA_LINK, waLink, FB_LINK, PHONE_DISPLAY } from "../lib/site";
import { useSettings, mapEmbedUrl } from "../lib/useSettings";

const EVENT_TYPES = ["Christian Church Wedding", "Jehovah's Witness Wedding", "Civil Wedding", "Engagement", "Debut", "Party / Reception", "Photoshoot / Editorial", "Hair Styling Only", "Other"];

export default function Booking() {
  const settings = useSettings();
  const [form, setForm] = useState({ name: "", phone: "", event_date: "", event_type: "", venue: "", pax: "1", message: "" });
  const [sending, setSending] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const waMessage = () =>
    `Hi Hikarah! New booking inquiry from irsmakup.com:\n\nName: ${form.name}\nPhone: ${form.phone}\nEvent Date: ${form.event_date}\nEvent Type: ${form.event_type}\nVenue / Location: ${form.venue || "TBA"}\nNo. of People: ${form.pax}\nMessage: ${form.message || "—"}`;

  const onSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await axios.post(`${API_URL}/api/inquiries`, { ...form, pax: Number(form.pax) || 1 });
      toast.success("Inquiry received! Opening WhatsApp to confirm…");
      window.open(waLink(waMessage()), "_blank");
    } catch (err) {
      toast.error("Could not save your inquiry — opening WhatsApp directly so nothing blocks your booking.");
      window.open(waLink(waMessage()), "_blank");
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="relative py-24 sm:py-32 bg-tinted overflow-hidden" data-testid="booking-section">
      <Toaster position="top-center" richColors />
      <div className="absolute bottom-[-140px] left-[-120px] w-[440px] h-[440px] rounded-full bg-champagne/35 blur-[120px]" aria-hidden="true" />
      <div className="max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-14 items-center relative">
        <div>
          <SectionHead
            eyebrow="Book karon — reserve your date"
            title={<>Reserve your <span className="italic text-plum">glam session</span>.</>}
            sub="Tell me about your event — church wedding, Kingdom Hall celebration, debut or party — and I'll reply personally on WhatsApp, usually within the hour. Peak-season dates fill fast!"
          />
          <div className="mt-9 space-y-4">
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" data-testid="booking-phone-link" className="flex items-center gap-4 group">
              <span className="w-12 h-12 rounded-full bg-plum text-cream flex items-center justify-center group-hover:bg-ruby transition-colors"><Phone className="w-5 h-5" /></span>
              <span>
                <span className="block text-[11px] uppercase tracking-widest font-bold text-mutedtext">WhatsApp / Call</span>
                <span className="font-bold text-charcoal group-hover:text-plum transition-colors">{PHONE_DISPLAY}</span>
              </span>
            </a>
            <a href={settings.facebook || FB_LINK} target="_blank" rel="noopener noreferrer" data-testid="booking-fb-link" className="flex items-center gap-4 group">
              <span className="w-12 h-12 rounded-full bg-plum text-cream flex items-center justify-center group-hover:bg-ruby transition-colors"><Facebook className="w-5 h-5" /></span>
              <span>
                <span className="block text-[11px] uppercase tracking-widest font-bold text-mutedtext">Facebook</span>
                <span className="font-bold text-charcoal group-hover:text-plum transition-colors">irsmakup.com on Facebook</span>
              </span>
            </a>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.studio_address)}`} target="_blank" rel="noopener noreferrer" data-testid="booking-address-link" className="flex items-center gap-4 group">
              <span className="w-12 h-12 rounded-full bg-plum text-cream flex items-center justify-center group-hover:bg-ruby transition-colors"><MapPin className="w-5 h-5" /></span>
              <span>
                <span className="block text-[11px] uppercase tracking-widest font-bold text-mutedtext">Studio Address</span>
                <span className="font-bold text-charcoal group-hover:text-plum transition-colors" data-testid="booking-studio-address">{settings.studio_address}</span>
                <span className="block text-xs text-mutedtext mt-0.5" data-testid="booking-service-area">{settings.service_area}</span>
              </span>
            </a>
          </div>

          <Reveal delay={0.2} className="mt-8">
            <div className="rounded-[24px] overflow-hidden border border-[#F0E6E2] shadow-[0_30px_60px_-30px_rgba(74,21,37,0.3)]" data-testid="booking-map-embed">
              <iframe
                title={`Hikarah Lntc studio — ${settings.studio_address}`}
                src={mapEmbedUrl(settings.studio_address)}
                className="w-full h-[260px] border-0 block"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </Reveal>
        </div>

        <Reveal y={40}>
          <form
            onSubmit={onSubmit}
            className="rounded-[28px] bg-white p-7 sm:p-10 shadow-[0_40px_90px_-35px_rgba(74,21,37,0.35)] border border-[#F0E6E2] grid sm:grid-cols-2 gap-5"
            data-testid="booking-form"
          >
            <div className="sm:col-span-2">
              <h3 className="font-display text-3xl text-charcoal">Booking inquiry</h3>
              <p className="text-sm text-mutedtext mt-1">Takes under a minute — confirmation happens on WhatsApp.</p>
            </div>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal/70">Full Name *</span>
              <input required value={form.name} onChange={set("name")} placeholder="Your name" className="field mt-2" data-testid="booking-input-name" />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal/70">Phone / WhatsApp *</span>
              <input required value={form.phone} onChange={set("phone")} placeholder="+63 9XX XXX XXXX" className="field mt-2" data-testid="booking-input-phone" />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal/70">Event Date *</span>
              <input required type="date" value={form.event_date} onChange={set("event_date")} className="field mt-2" data-testid="booking-input-date" />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal/70">Event Type *</span>
              <select required value={form.event_type} onChange={set("event_type")} className="field mt-2 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236E6B7B%22 stroke-width=%222%22%3E%3Cpath d=%22m6 9 6 6 6-6%22/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_1rem_center]" data-testid="booking-input-type">
                <option value="" disabled>Select event…</option>
                {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal/70">Venue / Location</span>
              <input value={form.venue} onChange={set("venue")} placeholder="e.g. Tagaytay" className="field mt-2" data-testid="booking-input-venue" />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal/70">No. of People</span>
              <input type="number" min="1" value={form.pax} onChange={set("pax")} className="field mt-2" data-testid="booking-input-pax" />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal/70">Message</span>
              <textarea rows="3" value={form.message} onChange={set("message")} placeholder="Tell me about your look, entourage size, timing…" className="field mt-2 resize-none" data-testid="booking-input-message" />
            </label>

            <button
              type="submit"
              disabled={sending}
              data-testid="booking-submit-btn"
              className="sm:col-span-2 inline-flex items-center justify-center gap-3 rounded-full bg-plum text-cream font-bold px-8 py-4 hover:bg-ruby disabled:opacity-60 transition-all duration-300 hover:shadow-[0_18px_40px_-10px_rgba(230,57,86,0.5)] hover:-translate-y-0.5"
            >
              <CalendarCheck className="w-5 h-5" />
              {sending ? "Sending…" : "Submit & Chat on WhatsApp"}
            </button>
            <p className="sm:col-span-2 text-center text-xs text-mutedtext" data-testid="booking-note">
              Reply within the hour, <span className="font-semibold">salamat kaayo!</span> · Confirmation happens on WhatsApp
            </p>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
