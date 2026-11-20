import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Check, GraduationCap, Play, Star } from "lucide-react";
import { useI18n } from "../lib/i18n";
import { LanguageSwitcher } from "./app-shell";

export function AuthShell({ children }: { children: ReactNode }) {
  const { t, dir } = useI18n();
  return (
    <div dir={dir} className="min-h-screen bg-[#f4f8fc] text-ink lg:grid lg:grid-cols-[1fr_1.05fr]">
      {/* ─── Brand panel ─── */}
      <aside className="auth-brand relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between">
        <div className="auth-brand-glow" />
        <span className="auth-brand-letter" style={{ top: "12%", insetInlineStart: "6%" }}>א</span>
        <span className="auth-brand-letter" style={{ top: "55%", insetInlineEnd: "8%" }}>ש</span>
        <span className="auth-brand-letter" style={{ bottom: "10%", insetInlineStart: "14%" }}>מ</span>

        <div className="relative z-10 flex items-center gap-3 p-8">
          <img src="/logo.jpg" alt="עברית שוטפת" className="size-11 rounded-xl object-cover shadow-lg ring-1 ring-white/20" />
          <div>
            <b className="block font-lat text-lg font-bold text-white">עברית שוטפת</b>
            <small className="text-[11px] text-white/60">{t("أكاديمية اللغات — عبري وإنجليزي")}</small>
          </div>
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-10">
          <img
            src="/logo.jpg"
            alt="شعار الأكاديمية"
            className="w-52 rounded-[2rem] object-cover shadow-2xl ring-1 ring-white/25"
          />
          <h2 className="max-w-sm text-center text-2xl font-bold leading-relaxed text-white">
            {t("رحلتك لإتقان اللغة")}
            <br />
            <span className="text-[#7fd4c4]">{t("تبدأ من هنا.")}</span>
          </h2>
          <p className="max-w-sm text-center text-sm leading-7 text-white/65">
            {t("من أول كلمة إلى محادثة حقيقية — منهج عملي، مدرسون متخصصون، وخطة تناسب وقتك وهدفك.")}
          </p>

          <div className="auth-word-card">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/55">{t("كلمة اليوم")}</span>
            <b className="font-lat text-2xl text-white">להתחיל</b>
            <small className="text-xs text-white/70">{t("يبدأ")} · lahatchil</small>
            <span className="grid size-8 place-items-center rounded-full bg-white/15 text-white">
              <Play className="size-3.5" fill="currentColor" />
            </span>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-center gap-8 p-8">
          <div className="text-center">
            <b className="block font-lat text-xl text-white">+2,500</b>
            <small className="text-[11px] text-white/55">{t("خريج ناجح")}</small>
          </div>
          <div className="h-8 w-px bg-white/15" />
          <div className="text-center">
            <b className="block font-lat text-xl text-white">+50k</b>
            <small className="text-[11px] text-white/55">{t("ساعة تعليمية")}</small>
          </div>
          <div className="h-8 w-px bg-white/15" />
          <div className="text-center">
            <b className="flex items-center justify-center gap-1 font-lat text-xl text-white">
              98% <Star className="size-3.5" fill="currentColor" />
            </b>
            <small className="text-[11px] text-white/55">{t("نسبة رضا")}</small>
          </div>
        </div>
      </aside>

      {/* ─── Form side ─── */}
      <main className="relative flex min-h-screen items-center justify-center px-5 py-10">
        <div className="page-glow absolute inset-0 -z-10" />
        <div className="absolute end-4 top-4 z-10 flex items-center gap-3">
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-md">
          {/* mobile brand header */}
          <Link to="/" className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <img src="/logo.jpg" alt="עברית שוטפת" className="size-12 rounded-xl object-cover shadow-md" />
            <b className="font-lat text-xl font-bold text-[#0d3b56]">עברית שוטפת</b>
          </Link>
          {children}
          <p className="mt-8 text-center text-[11px] text-muted-foreground/70">
            <Check className="me-1 inline size-3" />
            {t("منصة تعليمية آمنة — بياناتك محمية")}
          </p>
        </div>
      </main>
    </div>
  );
}
