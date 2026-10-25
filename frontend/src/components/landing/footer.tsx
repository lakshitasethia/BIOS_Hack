"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { site } from "@/lib/site";
import { onAnchorClick } from "@/components/landing/smooth-scroll";

const LINKS = [
  { label: "Platform", href: "#platform" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Impact", href: "#impact" },
  { label: "Scenarios", href: "#scenarios" },
  { label: "Control tower", href: site.appHref },
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
];

// The brand mark: two posts, the signal bar between them, and the zigzag route.
function BigMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 202 110" className={className} aria-hidden>
      <g fill="var(--color-signal-500)">
        <rect x="0" y="18" width="18" height="92" />
        <rect x="22" y="0" width="20" height="100" />
        <rect x="46" y="18" width="18" height="92" />
        <polygon points="80,110 100,110 134,18 114,18" />
        <polygon points="114,18 134,18 168,110 148,110" />
        <polygon points="148,110 168,110 202,18 182,18" />
      </g>
    </svg>
  );
}

export function Footer() {
  const [sent, setSent] = useState(false);

  return (
    <footer className="relative overflow-hidden bg-black text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "repeating-linear-gradient(115deg, transparent 0 140px, rgba(11,42,44,0.55) 140px 230px, transparent 230px 380px)",
          maskImage: "linear-gradient(to bottom, #000, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-5 pb-10 pt-20 md:px-8 md:pt-24">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="max-w-xl text-[clamp(2rem,3.6vw,3rem)] font-medium leading-[1.08] tracking-[-0.03em]">
            See the next disruption before it hits
          </h2>
          <div className="flex gap-1.5">
            <ButtonLink href={site.appHref} size="lg">
              Open control tower
            </ButtonLink>
            <ButtonLink href={site.appHref} size="lg" aria-label="Open control tower" className="!px-0 w-12">
              <ArrowRight size={18} />
            </ButtonLink>
          </div>
        </div>

        <div className="mt-16 flex items-end gap-6 md:mt-20 md:gap-10">
          <BigMark className="h-[clamp(3.5rem,11vw,9.5rem)] w-auto shrink-0" />
          <p className="text-[clamp(4rem,15vw,12.5rem)] font-medium leading-[0.78] tracking-[-0.06em] text-paper">
            {site.name.toLowerCase()}
          </p>
        </div>

        <div className="mt-14 grid gap-10 border-b border-white/15 pb-10 md:grid-cols-3">
          <p className="max-w-xs text-[1.0625rem] leading-relaxed text-white/80">
            Supply-chain risk detection and route recommendations your team can act on.
          </p>
          <div>
            <p className="label text-white/55">Built for</p>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-white/80">
              BIOS Hackathon 2026
              <br />
              Frontier track · Intelligent supply-chain risk &amp; route management
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            <label htmlFor="footer-email" className="label text-white/55">
              Stay up to date
            </label>
            <div className="mt-3 flex border-b border-white/30 focus-within:border-white">
              <input
                id="footer-email"
                type="email"
                required
                placeholder="you@company.com"
                className="min-w-0 flex-1 bg-transparent py-2.5 text-[0.9375rem] placeholder:text-white/40 focus:outline-none"
              />
              <button type="submit" className="label focus-ring my-1.5 rounded bg-white px-3 text-black">
                {sent ? "Thanks" : "Submit"}
              </button>
            </div>
          </form>
        </div>

        <nav aria-label="Footer" className="mt-8">
          <ul className="flex flex-wrap justify-between gap-x-8 gap-y-3">
            {LINKS.map((l) => (
              <li key={l.label}>
                <a href={l.href} onClick={onAnchorClick} className="label focus-ring rounded text-white/75 hover:text-white">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <p className="mt-10 text-sm text-white/50">© 2026 {site.name}. Built at BIOS Hackathon, Thapar Institute.</p>
      </div>
    </footer>
  );
}
