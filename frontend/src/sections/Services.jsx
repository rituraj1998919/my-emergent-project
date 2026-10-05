import React from "react";
import { ArrowUpRight } from "lucide-react";
import { Reveal, SectionHead } from "../components/Reveal";
import { WhatsAppIcon } from "../components/Logo";
import { SERVICES, waLink } from "../lib/site";

export default function Services() {
  return (
    <section id="services" className="relative py-24 sm:py-32 bg-tinted" data-testid="services-section">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <SectionHead
            eyebrow="Services"
            title={<>Every look, <span className="italic text-plum">obsessed over</span>.</>}
            sub="From your first skin-prep to the final spritz — each service is fully personalized and uses premium, skin-safe products only."
          />
        </div>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICES.map((s, i) => (
            <Reveal key={s.id} delay={0.08 * i} className="h-full">
              <article
                className="group relative rounded-[24px] bg-white border border-[#F0E6E2] overflow-hidden card-hover h-full flex flex-col"
                data-testid={`service-card-${s.id}`}
              >
                <div className="relative h-52 overflow-hidden img-zoom">
                  <img src={s.img} alt={s.title} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-plum/40 via-transparent to-transparent opacity-70" />
                  <span className="absolute top-4 left-4 rounded-full glass px-3 py-1 text-[11px] font-bold tracking-wide text-plum">
                    From {s.price}
                  </span>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-display text-2xl text-charcoal leading-snug">{s.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-mutedtext flex-1">{s.desc}</p>
                  <a
                    href={waLink(`Hi Hikarah! I'm interested in your ${s.title} service. Could I get a quote?`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`service-inquire-${s.id}-btn`}
                    className="mt-5 inline-flex items-center justify-between rounded-full border-2 border-plum/15 px-5 py-2.5 text-sm font-bold text-plum group-hover:bg-plum group-hover:text-cream group-hover:border-plum transition-all duration-300"
                  >
                    Inquire
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2} className="mt-10 text-center">
          <p className="text-sm text-mutedtext">
            Not sure which look is for you?{" "}
            <a
              href={waLink("Hi Hikarah! I'm not sure which service I need — can you help me choose?")}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="services-consult-link"
              className="font-bold text-plum underline decoration-blush decoration-2 underline-offset-4 hover:text-ruby transition-colors inline-flex items-center gap-1"
            >
              Get a free consultation <WhatsAppIcon className="w-3.5 h-3.5" />
            </a>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
