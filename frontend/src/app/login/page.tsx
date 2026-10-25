import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { TransitionLink } from "@/components/transition/route-transition";
import { NeonText } from "@/components/ui/neon-text";
import { LoginForm } from "@/components/login/login-form";
import { LoginVisual } from "@/components/login/login-visual";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: `Sign in — ${site.name}` };

const SIGNALS = ["Weather alerts", "Traffic", "Ports", "Suppliers", "Stock"];

export default function LoginPage() {
  return (
    <main
      className="relative min-h-[100svh] overflow-hidden bg-paper text-[#0b2a2c]"
      style={{
        backgroundImage:
          "radial-gradient(40% 45% at 100% 100%, rgba(196,255,157,0.55), transparent 70%), linear-gradient(rgba(11,42,44,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(11,42,44,0.05) 1px, transparent 1px)",
        backgroundSize: "100% 100%, 72px 72px, 72px 72px",
      }}
    >
      <TransitionLink href="/" className="label focus-ring absolute right-6 top-6 z-10 flex items-center gap-2 rounded-lg border border-black/15 bg-white/70 px-3 py-2 text-black/70 backdrop-blur hover:text-black">
        <ArrowLeft size={14} /> Back to site
      </TransitionLink>

      <div className="mx-auto grid min-h-[100svh] max-w-7xl items-center gap-12 px-5 py-20 md:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-20">
        <div>
          <div className="flex items-center gap-3">
            <svg width="34" height="34" viewBox="0 0 22 22" aria-hidden>
              <rect x="1" y="1" width="20" height="20" rx="5" fill="#0b2a2c" />
              <path d="M6 15 L10 7 L13 12 L16 7" stroke="var(--color-signal-500)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[2rem] font-semibold tracking-[-0.03em]">{site.name}</span>
          </div>

          <h1 className="mt-8 max-w-2xl text-[clamp(1.75rem,2.8vw,2.5rem)] font-normal leading-[1.22] tracking-[-0.02em]">
            <NeonText text={`Sign in to **${site.name}**, the risk control tower that sees disruptions **before** they reach your customers.`} />
          </h1>
          <p className="mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-[#0b2a2c]/70">
            Every corridor, supplier and warehouse in one live picture — with ranked routes and actions ready for your team to approve.
          </p>

          <div className="mt-8 aspect-[16/9] max-w-2xl overflow-hidden rounded-xl bg-[#2a1d16] shadow-[0_30px_60px_-30px_rgba(11,42,44,0.6)]">
            <LoginVisual />
          </div>

          <p className="mt-7 text-sm text-[#0b2a2c]/55">Watching the signals that move your freight</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {SIGNALS.map((s) => (
              <li key={s} className="label rounded-full border border-[#0b2a2c]/15 bg-white/60 px-3 py-1.5 text-[#0b2a2c]/70">
                {s}
              </li>
            ))}
          </ul>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
