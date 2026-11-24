import { useCallback, useEffect, useState } from "react";
import { Ban, Check, Eye, Flag, MessageSquareOff, ShieldCheck, Trash2, Volume2 } from "lucide-react";
import { useI18n } from "../lib/i18n";
import { communityApi, timeAgo, type CommunityReportView, type CommunitySettingsView } from "../lib/community";
import { Badge, Button, Card } from "./ui";
import { Avatar, RichText, RoleBadge, ROLE_META } from "./community-common";

const ROLE_KEYS = ["STUDENT", "TEACHER", "SALES", "SUPPORT", "ADMIN"] as const;
const ROLE_LABELS: Record<string, string> = {
  STUDENT: "الطلاب", TEACHER: "المدرسون", SALES: "فريق المبيعات", SUPPORT: "خدمة العملاء", ADMIN: "الأدمن",
};

function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex w-full items-center gap-3 rounded-xl border border-border px-4 py-3 text-start transition hover:bg-muted/50">
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-sage" : "bg-border"}`}>
        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${checked ? "start-[22px]" : "start-0.5"}`} />
      </span>
      <span className="min-w-0">
        <b className="block text-sm">{label}</b>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </span>
    </button>
  );
}

export function CommunityAdmin({ onAccessChange }: { onAccessChange: () => void }) {
  const { t } = useI18n();
  const [settings, setSettings] = useState<CommunitySettingsView | null>(null);
  const [wordsText, setWordsText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reports, setReports] = useState<CommunityReportView[]>([]);
  const [mutes, setMutes] = useState<Awaited<ReturnType<typeof communityApi.mutes>>["mutes"]>([]);

  const load = useCallback(async () => {
    const [s, r, m] = await Promise.all([communityApi.getSettings(), communityApi.reports(), communityApi.mutes()]);
    setSettings(s.settings);
    setWordsText(s.settings.bannedWords.join("\n"));
    setReports(r.reports);
    setMutes(m.mutes);
  }, []);

  useEffect(() => { load().catch(() => {}); }, [load]);

  async function save() {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await communityApi.saveSettings({
        visibleRoles: settings.visibleRoles,
        postsEnabled: settings.postsEnabled,
        chatEnabled: settings.chatEnabled,
        bannedWords: wordsText.split(/[\n,،]/).map((w) => w.trim()).filter(Boolean),
      });
      setSettings(res.settings);
      setWordsText(res.settings.bannedWords.join("\n"));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onAccessChange();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : t("تعذر الحفظ"));
    } finally { setSaving(false); }
  }

  const toggleRole = (r: string) =>
    setSettings((s) => (s ? { ...s, visibleRoles: s.visibleRoles.includes(r) ? s.visibleRoles.filter((x) => x !== r) : [...s.visibleRoles, r] } : s));

  if (!settings) return <p className="py-10 text-center text-sm text-muted-foreground">{t("جاري التحميل...")}</p>;

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="mb-1 flex items-center gap-2 text-base font-bold"><ShieldCheck className="size-5 text-brand" /> {t("من يستطيع رؤية المجتمع؟")}</h2>
        <p className="mb-3 text-xs text-muted-foreground">{t("اختر الأدوار المسموح لها بدخول المجتمع (السوبر أدمن دائماً مسموح له).")}</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ROLE_KEYS.map((r) => {
            const on = settings.visibleRoles.includes(r);
            return (
              <button key={r} type="button" onClick={() => toggleRole(r)}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-start transition active:scale-[0.98] ${on ? "border-brand bg-brand/10" : "border-border hover:bg-muted/50"}`}>
                <span className={`grid size-6 place-items-center rounded-md border-2 ${on ? "border-brand bg-brand text-white" : "border-border"}`}>{on && <Check className="size-4" />}</span>
                <span className="text-sm font-semibold">{t(ROLE_LABELS[r]!)}</span>
                <Badge tone={ROLE_META[r]!.tone}>{t(ROLE_META[r]!.label)}</Badge>
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Switch checked={settings.postsEnabled} onChange={(v) => setSettings({ ...settings, postsEnabled: v })} label={t("السماح بالنشر والتعليق")} hint={t("عند الإيقاف يستطيع الأدمن فقط النشر")} />
          <Switch checked={settings.chatEnabled} onChange={(v) => setSettings({ ...settings, chatEnabled: v })} label={t("تفعيل شات المجتمع")} hint={t("عند الإيقاف يستطيع الأدمن فقط المراسلة")} />
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-bold">{t("الكلمات المحظورة")}</label>
          <textarea value={wordsText} onChange={(e) => setWordsText(e.target.value)} rows={3} placeholder={t("كلمة في كل سطر (أو مفصولة بفاصلة)")}
            className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-brand" />
          <p className="mt-1 text-[11px] text-muted-foreground">{t("أي منشور أو تعليق أو رسالة تحتوي على هذه الكلمات سيتم رفضها.")}</p>
        </div>

        <Button className="mt-4" onClick={save} disabled={saving}>{saving ? t("جاري الحفظ...") : saved ? `✓ ${t("تم الحفظ")}` : t("حفظ الإعدادات")}</Button>
      </Card>

      <Card>
        <h2 className="mb-3 flex items-center gap-2 text-base font-bold"><Flag className="size-5 text-danger" /> {t("البلاغات المفتوحة")} <Badge tone={reports.length ? "danger" : "muted"}>{reports.length}</Badge></h2>
        {reports.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">{t("لا توجد بلاغات 🎉")}</p>}
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="rounded-xl border border-border p-3">
              <p className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge tone="danger">{r.target?.kind === "comment" ? t("تعليق") : t("منشور")}</Badge>
                {t("بلاغ من")} <b className="text-foreground">{r.reporter.fullName}</b> · {timeAgo(r.createdAt)}
              </p>
              {r.reason && <p className="mb-2 rounded-lg bg-danger/5 px-3 py-1.5 text-xs text-danger">{t("السبب")}: {r.reason}</p>}
              {r.target ? (
                <div className="flex gap-2 rounded-lg bg-muted/50 p-2">
                  <Avatar user={r.target.author} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-xs font-bold">{r.target.author.fullName} <RoleBadge role={r.target.author.role} /></p>
                    <p className="line-clamp-3 text-sm"><RichText text={r.target.content || t("(مرفقات فقط)")} /></p>
                  </div>
                </div>
              ) : <p className="text-xs text-muted-foreground">{t("المحتوى محذوف")}</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                {r.target && (
                  <a href={`/community?post=${r.target.postId}`} className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold hover:brightness-95"><Eye className="size-3.5" /> {t("عرض")}</a>
                )}
                <button onClick={() => communityApi.resolveReport(r.id, "dismiss").then(load).catch(() => {})} className="flex items-center gap-1.5 rounded-lg bg-sage/15 px-3 py-1.5 text-xs font-semibold text-sage hover:brightness-95"><Check className="size-3.5" /> {t("تجاهل")}</button>
                <button onClick={() => { if (window.confirm(t("حذف المحتوى المبلّغ عنه؟"))) communityApi.resolveReport(r.id, "delete").then(load).catch(() => {}); }} className="flex items-center gap-1.5 rounded-lg bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger hover:brightness-95"><Trash2 className="size-3.5" /> {t("حذف المحتوى")}</button>
                {r.target && r.target.author.role !== "ADMIN" && r.target.author.role !== "SUPER_ADMIN" && (
                  <button onClick={() => { if (window.confirm(`${t("كتم")} ${r.target!.author.fullName}؟`)) communityApi.mute(r.target!.author.id, r.reason).then(load).catch(() => {}); }} className="flex items-center gap-1.5 rounded-lg bg-gold/15 px-3 py-1.5 text-xs font-semibold text-gold hover:brightness-95"><Ban className="size-3.5" /> {t("كتم الكاتب")}</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 flex items-center gap-2 text-base font-bold"><MessageSquareOff className="size-5 text-gold" /> {t("المستخدمون المكتومون")} <Badge tone="muted">{mutes.length}</Badge></h2>
        {mutes.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">{t("لا يوجد مكتومون")}</p>}
        <div className="space-y-2">
          {mutes.map((m) => (
            <div key={m.userId} className="flex items-center gap-3 rounded-xl border border-border px-3 py-2">
              <Avatar user={m.user} size={36} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-sm font-bold">{m.user.fullName} <RoleBadge role={m.user.role} /></p>
                {m.reason && <p className="truncate text-[11px] text-muted-foreground">{m.reason}</p>}
              </div>
              <button onClick={() => communityApi.unmute(m.userId).then(load).catch(() => {})} className="flex items-center gap-1.5 rounded-lg bg-sage/15 px-3 py-1.5 text-xs font-semibold text-sage hover:brightness-95"><Volume2 className="size-3.5" /> {t("إلغاء الكتم")}</button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
