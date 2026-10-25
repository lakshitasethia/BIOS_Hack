"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { navigateWithTransition } from "@/components/transition/route-transition";
import { site } from "@/lib/site";

// Demo sign-in: nothing leaves the browser — a valid-looking email and any password open the control tower.
export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const ready = /\S+@\S+\.\S+/.test(email) && password.length >= 4;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setTimeout(() => navigateWithTransition(site.appHref), 450);
  };

  const field = "mt-2 w-full border-b border-white/25 bg-transparent pb-3 text-[1.0625rem] text-white placeholder:text-white/35 focus:border-lime focus:outline-none";

  return (
    <form onSubmit={submit} className="dark-autofill rounded-2xl bg-deep p-8 text-white shadow-[0_40px_80px_-40px_rgba(11,42,44,0.7)] sm:p-12">
      <p className="label text-white/55">Sign in</p>
      <h2 className="mt-3 text-[1.75rem] font-medium tracking-[-0.02em]">Welcome back</h2>

      <label className="mt-10 block">
        <span className="text-[0.9375rem] text-white/85">Work email *</span>
        <input type="email" required autoComplete="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
      </label>

      <label className="mt-8 block">
        <span className="text-[0.9375rem] text-white/85">Password *</span>
        <span className="relative block">
          <input
            type={show ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${field} pr-10`}
          />
          <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} className="focus-ring absolute bottom-3 right-0 rounded text-white/50 hover:text-white">
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </span>
      </label>

      <div className="mt-6 flex items-center justify-between text-[0.875rem] text-white/60">
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" defaultChecked className="size-4 accent-lime" /> Keep me signed in
        </label>
        <span className="cursor-not-allowed">Forgot password?</span>
      </div>

      <button
        type="submit"
        disabled={!ready || busy}
        className={`label focus-ring mt-10 flex h-14 w-full items-center justify-center gap-2 rounded-lg transition-colors duration-300 ${
          ready ? "bg-lime text-deep hover:bg-white" : "bg-white/10 text-white/40"
        }`}
      >
        {busy ? "Opening control tower…" : "Sign in"} {!busy && <ArrowRight size={16} />}
      </button>

      <p className="mt-6 text-center font-mono text-[0.75rem] text-white/40">Demo build · any work email signs you in</p>
    </form>
  );
}
