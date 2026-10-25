import Link from "next/link";
import { TransitionLink } from "@/components/transition/route-transition";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-on-accent hover:bg-signal-400",
  secondary: "bg-night-100 text-night-900 hover:bg-white",
  ghost: "border border-border-strong text-text hover:border-night-300 hover:bg-white/5",
};

const sizes: Record<Size, string> = {
  md: "h-10 px-4",
  lg: "h-12 px-6",
};

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function ButtonLink({ variant = "primary", size = "md", className = "", children, ...props }: ButtonLinkProps) {
  // In-app routes play the page transition; anchors and external links behave normally.
  const Comp = typeof props.href === "string" && props.href.startsWith("/") ? TransitionLink : Link;
  return (
    <Comp
      {...props}
      className={`label focus-ring inline-flex items-center justify-center gap-2 rounded-lg transition-colors duration-200 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </Comp>
  );
}
