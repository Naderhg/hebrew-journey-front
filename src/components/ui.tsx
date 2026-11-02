import type { ButtonHTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/utils";

export function Button({ className, variant = "primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "dark" | "ghost" }) {
  const variants = { primary: "dash-btn-primary bg-brand text-primary-foreground hover:bg-brand/90", secondary: "bg-brand/10 text-brand hover:bg-brand/15", dark: "bg-ink text-primary-foreground hover:bg-ink/90", ghost: "border border-border bg-card text-foreground hover:bg-accent" };
  return <button className={cn("inline-flex min-h-9 items-center justify-center gap-2 rounded-xl px-4 py-2 text-[13px] font-bold transition-colors disabled:opacity-50", variants[variant], className)} {...props} />;
}
export function Card({ children, className }: { children: ReactNode; className?: string }) { return <section className={cn("glass rounded-[1.25rem] p-5", className)}>{children}</section>; }
export function Badge({ children, tone = "brand" }: { children: ReactNode; tone?: "brand" | "sage" | "gold" | "muted" | "danger" }) {
  const tones = { brand: "bg-brand/10 text-brand", sage: "bg-sage/12 text-sage", gold: "bg-gold/12 text-gold", muted: "bg-muted text-muted-foreground", danger: "bg-danger/10 text-danger" };
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold", tones[tone])}>{children}</span>;
}
export function ProgressBar({ value, tone = "brand" }: { value: number; tone?: string }) { return <div className="h-1.5 overflow-hidden rounded-full bg-ink/8"><div className={cn("h-full rounded-full", tone === "sage" ? "bg-sage" : tone === "gold" ? "bg-gold" : tone === "brand2" ? "bg-brand2" : tone === "mut" ? "bg-muted-foreground" : "bg-brand")} style={{ width: `${value}%` }} /></div>; }
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("flex h-10 w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50", className)} {...props} />;
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
export function StatTile({ icon: Icon, label, value, tone = "brand" }: { icon: React.ComponentType<{ className?: string }>; label: string; value: ReactNode; tone?: "brand" | "sage" | "gold" | "danger" }) {
  const tones = { brand: "chip-mint", sage: "chip-teal", gold: "chip-peach", danger: "chip-rose" };
  return (
    <Card className="group flex items-center gap-4 p-5 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl transition duration-300 group-hover:scale-110 group-hover:rotate-6", tones[tone])}><Icon className="size-5" /></span>
      <div><small className="block text-xs text-muted-foreground">{label}</small><b className="font-lat text-2xl">{value}</b></div>
    </Card>
  );
}
/* ─── Reference-style stat card: pastel icon chip + big value + sub + optional trend pill ─── */
export function StatCard({ icon: Icon, label, value, sub, chip = "mint", trend }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  chip?: "mint" | "peach" | "lilac" | "teal" | "rose" | "amber";
  trend?: ReactNode;
}) {
  const chips = { mint: "chip-mint", peach: "chip-peach", lilac: "chip-lilac", teal: "chip-teal", rose: "chip-rose", amber: "chip-amber" };
  return (
    <Card className="p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <small className="block text-xs text-muted-foreground">{label}</small>
          <b className="mt-1.5 block font-lat text-[26px] leading-tight tracking-tight">{value}</b>
          {sub && <span className="mt-1 block truncate text-[11px] text-muted-foreground/80">{sub}</span>}
        </div>
        <span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl", chips[chip])}>
          <Icon className="size-5" />
        </span>
      </div>
      {trend && (
        <span className="chip-mint mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold">{trend}</span>
      )}
    </Card>
  );
}
/* ─── Dark gradient hero banner with orbital decoration (dashboard landings) ─── */
export function HeroBanner({ tone = "green", icon: Icon, kicker, title, subtitle, children, cta }: {
  tone?: "navy" | "green" | "teal";
  icon: React.ComponentType<{ className?: string }>;
  kicker?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
  cta?: ReactNode;
}) {
  const tones = { navy: "hero-navy", green: "hero-green", teal: "hero-teal" };
  return (
    <section className={cn("relative mb-5 overflow-hidden rounded-[1.75rem] text-white", tones[tone])}>
      {/* orbital decoration — visual left side */}
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-64 sm:block" aria-hidden>
        <div className="absolute left-6 top-1/2 size-56 -translate-y-1/2 rounded-full border border-white/10" />
        <div className="absolute left-14 top-1/2 size-40 -translate-y-1/2 rounded-full border border-white/15" />
        <div className="absolute -left-8 top-1/2 size-72 -translate-y-1/2 rounded-full border border-white/5" />
        <div className="absolute left-10 top-1/2 size-48 -translate-y-1/2 rounded-[42%] border border-white/10 rotate-12" />
        <div className="absolute left-[4.7rem] top-[18%] size-1.5 rounded-full bg-white/60" />
        <div className="absolute left-[8.5rem] bottom-[22%] size-1 rounded-full bg-white/40" />
        <div className="absolute left-[2.2rem] bottom-[30%] size-1 rounded-full bg-amber-300/80" />
      </div>
      <div className="absolute left-16 top-1/2 hidden size-24 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-white/10 backdrop-blur-sm sm:grid">
        <Icon className="size-9 text-white/90" />
      </div>
      {/* content — visual right side */}
      <div className="relative z-10 flex min-h-44 flex-col justify-between gap-4 p-6 sm:pe-72 lg:p-8 lg:pe-80">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-white/70">
          <span className="size-1.5 rounded-full bg-emerald-300" />
          {kicker}
        </div>
        <div className="max-w-xl">
          <h1 className="text-2xl font-extrabold leading-snug lg:text-[1.75rem]">{title}</h1>
          {subtitle && <p className="mt-2 text-[13px] leading-relaxed text-white/70">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {cta}
          {children}
        </div>
      </div>
    </section>
  );
}
/* ─── White pill button used inside hero banners ─── */
export function HeroAction({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn("inline-flex min-h-10 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 text-[13px] font-bold text-white backdrop-blur-sm transition hover:bg-white/20", className)} {...props} />;
}
export function SearchBox({ value, onChange, placeholder = "بحث..." }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-10 w-full max-w-60 rounded-xl border border-input bg-muted/40 px-3.5 text-xs transition focus:w-72 focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring" />;
}
export function Pagination({ page, pages, total, size, onPage }: { page: number; pages: number; total: number; size: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  const from = (page - 1) * size + 1;
  const to = Math.min(total, page * size);
  const btn = "grid size-8 place-items-center rounded-lg text-xs font-semibold transition hover:bg-muted active:scale-90 disabled:opacity-40";
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
      <span>عرض {from}-{to} من أصل {total}</span>
      <div className="flex items-center gap-1">
        <button className={btn} disabled={page === 1} onClick={() => onPage(page - 1)}>›</button>
        {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
          <button key={p} onClick={() => onPage(p)} className={cn(btn, p === page && "bg-brand text-white shadow-md hover:bg-brand")}>{p}</button>
        ))}
        <button className={btn} disabled={page === pages} onClick={() => onPage(page + 1)}>‹</button>
      </div>
    </div>
  );
}
export function Dropzone({ file, onFile, accept, hint }: { file: File | null; onFile: (f: File | null) => void; accept?: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/30 px-4 py-8 text-center transition duration-300 hover:border-brand hover:bg-brand/5">
      <span className="grid size-11 place-items-center rounded-full bg-brand/10 text-brand text-lg transition group-hover:scale-110">⬆</span>
      <b className="text-xs">{file ? file.name : "اضغط للرفع أو اسحب الملف هنا"}</b>
      <small className="text-[10px] text-muted-foreground">{file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : hint}</small>
      <input type="file" accept={accept} className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
    </label>
  );
}
