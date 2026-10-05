import React from "react";
import { Star, Quote } from "lucide-react";
import { Reveal, SectionHead } from "../components/Reveal";
import { REVIEWS } from "../lib/site";

export default function Reviews() {
  return (
    <section id="reviews" className="py-24 sm:py-32" data-testid="reviews-section">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <SectionHead
          center
          eyebrow="Client love"
          title={<>Brides who <span className="italic text-plum">glowed</span> — and said so.</>}
        />

        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {REVIEWS.map((r, i) => (
            <Reveal key={r.name} delay={0.1 * i} className="h-full">
              <figure
                className={`relative rounded-[24px] p-8 h-full flex flex-col card-hover ${
                  i === 1 ? "bg-plum text-cream" : "bg-white border border-[#F0E6E2]"
                }`}
                data-testid={`review-card-${i}`}
              >
                <Quote className={`w-8 h-8 ${i === 1 ? "text-champagne" : "text-blush"}`} />
                <blockquote className={`mt-5 flex-1 font-display italic text-xl leading-relaxed ${i === 1 ? "text-cream/90" : "text-charcoal/85"}`}>
                  "{r.quote}"
                </blockquote>
                <figcaption className="mt-7">
                  <div className="flex gap-1" aria-label="5 star rating" data-testid={`review-stars-${i}`}>
                    {[...Array(5)].map((_, s) => (
                      <Star key={s} className="w-4 h-4 fill-champagne text-champagne" />
                    ))}
                  </div>
                  <p className={`mt-3 font-bold ${i === 1 ? "text-cream" : "text-charcoal"}`}>{r.name}</p>
                  <p className={`text-xs uppercase tracking-widest font-semibold mt-0.5 ${i === 1 ? "text-cream/55" : "text-mutedtext"}`}>
                    {r.event}
                  </p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
