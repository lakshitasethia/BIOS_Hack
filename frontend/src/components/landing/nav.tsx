"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { TransitionLink } from "@/components/transition/route-transition";
import { onAnchorClick } from "@/components/landing/smooth-scroll";
import { site } from "@/lib/site";

// In page order, so the bar reads like the story it jumps through.
const links = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Impact", href: "#impact" },
  { label: "Platform", href: "#platform" },
  { label: "Scenarios", href: "#scenarios" },
];

export function Logo() {
  return (
    <Link href="/" className="focus-ring flex items-center gap-2.5 rounded-md">
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
        <path d="M12 2 L21.5 7.5 V16.5 L12 22 L2.5 16.5 V7.5 Z" fill="var(--accent)" rx="3" />
        <path d="M7 9 L12 17 L17 9" stroke="var(--on-accent)" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="7" cy="9" r="1.3" fill="var(--on-accent)" />
        <circle cx="17" cy="9" r="1.3" fill="var(--on-accent)" />
      </svg>
      <span className="text-[1.0625rem] font-medium tracking-tight">{site.name}</span>
    </Link>
  );
}

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [light, setLight] = useState(false);

  useEffect(() => {
    // Sections marked data-nav="light" sit under the bar → switch to the light treatment.
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      const under = document.elementsFromPoint(window.innerWidth / 2, 40).find((el) => el.closest("[data-nav]"));
      setLight(under?.closest("[data-nav]")?.getAttribute("data-nav") === "light");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-light={light || undefined}
      className={`group/nav fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        light
          ? "border-black/10 bg-[#f8faf0]/85 text-black backdrop-blur-xl"
          : scrolled || open
            ? "border-border bg-night-950/80 backdrop-blur-xl"
            : "border-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
        <Logo />

        <ul className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} onClick={onAnchorClick} className="label focus-ring rounded text-text-muted transition-colors hover:text-text group-data-light/nav:text-black/60 group-data-light/nav:hover:text-black">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-5 md:flex">
          <TransitionLink href="/login" className="label focus-ring rounded text-text-muted hover:text-text group-data-light/nav:text-black/60 group-data-light/nav:hover:text-black">
            Log in
          </TransitionLink>
          <ButtonLink href={site.appHref}>Open control tower</ButtonLink>
        </div>

        <button
          className="focus-ring -mr-2 rounded-md p-2 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-border px-5 pb-6 pt-4 md:hidden">
          <ul className="flex flex-col gap-4">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={(e) => {
                    setOpen(false);
                    onAnchorClick(e);
                  }}
                  className="label text-text-muted"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <ButtonLink href={site.appHref} className="mt-6 w-full">
            Open control tower
          </ButtonLink>
        </div>
      )}
    </header>
  );
}
