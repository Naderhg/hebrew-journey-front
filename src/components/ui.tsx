import type { ButtonHTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/utils";

export function Button({ className, variant = "primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "dark" | "ghost" }) {
  const variants = { primary: "dash-btn-primary bg-brand text-primary-foreground hover:bg-brand/90", secondary: "bg-brand/10 text-brand hover:bg-brand/15", dark: "bg-ink text-primary-foreground hover:bg-ink/90", ghost: "border border-border bg-background text-foreground hover:bg-accent" };
  return <button className={cn("inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-4 py-2 text-[13px] font-bold transition-colors disabled:opacity-50", variants[variant], className)} {...props} />;
}
export function Card({ children, className }: { children: ReactNode; className?: string }) { return <section className={cn("glass rounded-2xl p-5", className)}>{children}</section>; }
export function Badge({ children, tone = "brand" }: { children: ReactNode; tone?: "brand" | "sage" | "gold" | "muted" | "danger" }) {
  const tones = { brand: "bg-brand/10 text-brand", sage: "bg-sage/12 text-sage", gold: "bg-gold/12 text-gold", muted: "bg-muted text-muted-foreground", danger: "bg-danger/10 text-danger" };
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold", tones[tone])}>{children}</span>;
}
export function ProgressBar({ value, tone = "brand" }: { value: number; tone?: string }) { return <div className="h-1.5 overflow-hidden rounded-full bg-ink/10"><div className={cn("h-full rounded-full", tone === "sage" ? "bg-sage" : tone === "gold" ? "bg-gold" : tone === "brand2" ? "bg-brand2" : tone === "mut" ? "bg-muted-foreground" : "bg-brand")} style={{ width: `${value}%` }} /></div>; }
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("flex h-10 w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50", className)} {...props} />;
}
export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-[13px] font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)} {...props} />;
}
export function SectionHeader({ icon: Icon, title, subtitle, actions, tone = "brand" }: { icon: React.ComponentType<{ className?: string }>; title: string; subtitle?: ReactNode; actions?: ReactNode; tone?: "brand" | "sage" | "gold" }) {
  const tones = { brand: "bg-brand/10 text-brand", sage: "bg-sage/15 text-sage", gold: "bg-gold/15 text-gold" };
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <span className={cn("grid size-12 place-items-center rounded-2xl", tones[tone])}><Icon className="size-5" /></span>
      <div className="min-w-0">
        <h2 className="text-xl font-extrabold">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="me-auto flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
