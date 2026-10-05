import React, { useEffect, useState } from "react";
import axios from "axios";
import { Star, Quote } from "lucide-react";
import { Reveal, SectionHead } from "../components/Reveal";
import { REVIEWS, API_URL } from "../lib/site";

const initials = (n) => (n || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export default function Reviews() {
  const [custom, setCustom] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/reviews`)
      .then(({ data }) => setCustom(Array.isArray(data) ? data : []))
      .catch(() => setCustom([]));
  }, []);

  const featured = custom.length === 3 ? 1 : -1;
  const list = custom.length
    ? custom.map((r) => ({ name: r.name, event: r.event, quote: r.quote, rating: r.rating || 5, photo: r.photo_url ? `${API_URL}${r.photo_url}` : null }))
    : REVIEWS.map((r) => ({ ...r, rating: 5, photo: null }));

  return (
    <section id="reviews" className="py-24 sm:py-32" data-testid="reviews-section">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <SectionHead
          center
          eyebrow="Real brides wall"
          title={<>Brides who <span className="italic text-plum">glowed</span> — and said so.</>}
          sub="Real words from real clients — posted straight from Hikarah's studio."
        />

        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {list.map((r, i) => (
            <Reveal key={`${r.name}-${i}`} delay={0.08 * i} className="h-full">
              <figure
                className={`relative rounded-[24px] p-8 h-full flex flex-col card-hover ${
                  i === featured ? "bg-plum text-cream" : "bg-white border border-[#F0E6E2]"
                }`}
                data-testid={`review-card-${i}`}
              >
                <div className="flex items-center justify-between">
                  {r.photo ? (
                    <img src={r.photo} alt={r.name} className="w-14 h-14 rounded-full object-cover border-2 border-champagne shadow" data-testid={`review-photo-${i}`} loading="lazy" />
                  ) : (
                    <span className={`w-14 h-14 rounded-full flex items-center justify-center font-display italic text-xl ${i === featured ? "bg-champagne text-plumdeep" : "bg-gradient-to-br from-blush to-rosegold text-plumdeep"}`} data-testid={`review-avatar-${i}`}>
                      {initials(r.name)}
                    </span>
                  )}
                  <Quote className={`w-7 h-7 ${i === featured ? "text-champagne" : "text-blush"}`} />
                </div>

                <blockquote className={`mt-5 flex-1 font-display italic text-xl leading-relaxed ${i === featured ? "text-cream/90" : "text-charcoal/85"}`} data-testid={`review-quote-${i}`}>
                  "{r.quote}"
                </blockquote>

                <figcaption className="mt-7">
                  <div className="flex gap-1" aria-label={`${r.rating} star rating`} data-testid={`review-stars-${i}`}>
                    {[...Array(5)].map((_, s) => (
                      <Star key={s} className={`w-4 h-4 ${s < r.rating ? "fill-champagne text-champagne" : i === featured ? "text-cream/25" : "text-charcoal/15"}`} />
                    ))}
                  </div>
                  <p className={`mt-3 font-bold ${i === featured ? "text-cream" : "text-charcoal"}`} data-testid={`review-name-${i}`}>{r.name}</p>
                  <p className={`text-xs uppercase tracking-widest font-semibold mt-0.5 ${i === featured ? "text-cream/55" : "text-mutedtext"}`}>{r.event}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
