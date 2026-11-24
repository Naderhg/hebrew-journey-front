import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Banknote, CalendarCheck, CircleCheck, CreditCard, Wallet, XCircle } from "lucide-react";
import { AppShell, PageHeader } from "../components/app-shell";
import { Badge, Button, Card, Label, ProgressBar, SectionHeader } from "../components/ui";
import { usePlatformStore } from "../hooks/use-platform-store";
import { useAuth } from "../hooks/use-auth";
import { uploadFile } from "../lib/api";
import { useI18n } from "../lib/i18n";

export const Route = createFileRoute("/wallet")({
  component: StudentWalletPage,
});

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

const STATUS_LABELS: Record<string, { label: string; tone: "sage" | "danger" | "muted" | "brand" | "gold" }> = {
  booked: { label: "محجوزة", tone: "brand" },
  completed: { label: "حضرتها", tone: "sage" },
  no_show: { label: "لم تحضر (خصمت)", tone: "danger" },
  cancelled: { label: "ملغاة", tone: "muted" },
};

const SUB_LABELS: Record<string, { label: string; tone: "sage" | "muted" | "gold" }> = {
  ACTIVE: { label: "نشطة", tone: "sage" },
  EXPIRED: { label: "انتهت", tone: "muted" },
  PENDING: { label: "بانتظار الدفع", tone: "gold" },
};

const PAYMENT_NUMBER = "01270869510";
const PAYMENT_NUMBER_DISPLAY = "0127 086 9510";

function StudentWalletPage() {
  const {
    studentWallet,
    studentWalletBookings,
    fetchStudentWallet,
    publicPackages,
    fetchPublicPackages,
    myPaymentRequests,
    fetchMyBilling,
    createPaymentRequest,
  } = usePlatformStore();
  const { t } = useI18n();
  const { user } = useAuth();
  const studentLang = user?.learningLanguage === "english" ? "english" : "hebrew";
  const visiblePackages = publicPackages.filter((p) => (p.language ?? "hebrew") === studentLang);

  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null);
  const [method, setMethod] = useState<"wallet" | "instapay" | null>(null);
  const [shot, setShot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pkgError, setPkgError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchStudentWallet().catch(() => {});
    fetchPublicPackages().catch(() => {});
    fetchMyBilling().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const active = studentWallet.find((w) => w.status === "ACTIVE") ?? studentWallet[0];
  const pendingReq = myPaymentRequests.find((r) => r.status === "pending");
  const selectedPkg = visiblePackages.find((p) => p.id === selectedPkgId) ?? null;

  const overview = [
    { label: t("إجمالي الحصص"), value: active?.sessionsTotal ?? 0, icon: CalendarCheck, tone: "text-brand bg-brand/10" },
    { label: t("حصص حضرتها"), value: active?.attended ?? 0, icon: CircleCheck, tone: "text-sage bg-sage/15" },
    { label: t("خصمت دون حضور"), value: active?.deductedNotAttended ?? 0, icon: XCircle, tone: "text-gold bg-gold/15" },
    { label: t("الحصص المتبقية"), value: active?.sessionsRemaining ?? 0, icon: Wallet, tone: "text-brand2 bg-brand2/10" },
  ];

  async function copyNumber() {
    try {
      await navigator.clipboard.writeText(PAYMENT_NUMBER);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  }

  async function handleBuy() {
    if (!selectedPkg || !method) return;
    setPkgError("");
    if (!shot) {
      setPkgError(t("ارفع سكرين شوت لإثبات التحويل قبل الإرسال"));
      return;
    }
    setSubmitting(true);
    try {
      const uploaded = await uploadFile(shot, "payments");
      await createPaymentRequest({ packageId: selectedPkg.id, method, screenshotUrl: uploaded.url });
      setSelectedPkgId(null);
      setMethod(null);
      setShot(null);
    } catch (e) {
      setPkgError(e instanceof Error ? e.message : t("تعذر إرسال طلب الاشتراك — حاول مرة أخرى"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell role="STUDENT">
      <PageHeader title={t("محفظتي")} subtitle={t("تفاصيل باقتك واستهلاك حصصك — الحصة تُخصم عند الحضور أو عدم الحضور بدون إبلاغ مسبق")} />

      <div dir="rtl" className="space-y-4">
        {studentWallet.length === 0 ? (
          <Card className="py-10 text-center text-sm text-muted-foreground">
            {t("لا توجد باقات حصص مفعّلة لديك حالياً.")}
          </Card>
        ) : (
          <>
            {/* Overview cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {overview.map((c) => (
                <Card key={c.label} className="flex items-center gap-3 p-4">
                  <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${c.tone}`}>
                    <c.icon className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <b className="block text-xl leading-tight">{c.value}</b>
                    <p className="text-[11px] text-muted-foreground">{c.label}</p>
                  </div>
                </Card>
              ))}
            </div>

            {/* Packages */}
            {studentWallet.map((w) => {
              const st = SUB_LABELS[w.status] ?? { label: w.status, tone: "muted" as const };
              const stLabel = SUB_LABELS[w.status]?.label ?? w.status;
              const usedPct = w.sessionsTotal > 0 ? (w.sessionsUsed / w.sessionsTotal) * 100 : 0;
              return (
                <Card key={w.id}>
                  <SectionHeader
                    icon={Banknote}
                    tone="gold"
                    title={w.packageName}
                    subtitle={`${w.price.toLocaleString("ar-EG")} ${t("ج.م")} · ${t("الحصة")} = ${w.sessionPrice.toLocaleString("ar-EG", { maximumFractionDigits: 2 })} ${t("ج.م")}`}
                    actions={<Badge tone={st.tone}>{t(stLabel)}</Badge>}
                  />

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{t("استخدمت")} {w.sessionsUsed} {t("من")} {w.sessionsTotal} {t("حصة")}</span>
                      <span>{Math.round(usedPct)}%</span>
                    </div>
                    <div className="mt-1.5"><ProgressBar value={usedPct} /></div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl bg-muted/40 px-3 py-2.5">
                      <p className="text-[11px] text-muted-foreground">{t("حضرت")}</p>
                      <b className="text-sm">{w.attended} {t("حصة")}</b>
                    </div>
                    <div className="rounded-2xl bg-muted/40 px-3 py-2.5">
                      <p className="text-[11px] text-muted-foreground">{t("خصمت دون حضور")}</p>
                      <b className="text-sm">{w.deductedNotAttended} {t("حصة")}</b>
                      <p className="text-[10px] text-muted-foreground">{t("لم تحضر")} {w.noShow} · {t("إلغاء متأخر")} {w.lateCancel}</p>
                    </div>
                    <div className="rounded-2xl bg-muted/40 px-3 py-2.5">
                      <p className="text-[11px] text-muted-foreground">{t("المتبقي")}</p>
                      <b className="text-sm">{w.sessionsRemaining ?? "—"} {t("حصة")}</b>
                    </div>
                    <div className="rounded-2xl bg-muted/40 px-3 py-2.5">
                      <p className="text-[11px] text-muted-foreground">{t("الصلاحية")}</p>
                      <b className="text-sm">{fmtDate(w.expiresAt)}</b>
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* Sessions log */}
            <Card>
              <SectionHeader icon={CalendarCheck} tone="brand" title={t("سجل الحصص")} subtitle={t("آخر حصصك المحجوزة والمكتملة")} />
              <div className="mt-3 space-y-2">
                {studentWalletBookings.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">{t("لا توجد حصص مسجلة بعد.")}</p>
                ) : (
                  studentWalletBookings.map((b) => {
                    const st = STATUS_LABELS[b.status] ?? { label: b.status, tone: "muted" as const };
                    return (
                      <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-muted/30 px-4 py-3">
                        <div>
                          <b className="block text-sm">{b.teacherName}</b>
                          <p className="text-xs text-muted-foreground">
                            {new Date(b.startsAt).toLocaleString("ar-EG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                          {b.cancelReason && <p className="text-[10px] text-muted-foreground">{b.cancelReason}</p>}
                        </div>
                        <Badge tone={st.tone}>{t(st.label)}</Badge>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </>
        )}

        {/* Available packages — subscribe / renew from the wallet */}
        <Card>
          <SectionHeader
            icon={CreditCard}
            tone="brand"
            title={t("باقات متاحة — جدّد أو أضف اشتراك")}
            subtitle={t("اختر باقة، حوّل على الرقم، وارفع إثبات التحويل — الاشتراك يتفعل بعد مراجعة الإدارة")}
          />
          {pendingReq && (
            <p className="mt-3 rounded-md bg-gold/10 p-3 text-xs font-semibold text-gold">
              {t("لديك طلب اشتراك قيد المراجعة")} ({pendingReq.package?.nameAr}) — {t("هيتم تفعيله فور تأكيد الدفع.")}
            </p>
          )}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visiblePackages.map((pkg) => (
              <div key={pkg.id} className={`flex flex-col rounded-2xl border p-4 ${selectedPkgId === pkg.id ? "border-brand bg-brand/5" : "border-border bg-background/60"}`}>
                <div className="flex items-start justify-between gap-2">
                  <b className="text-sm">{pkg.nameAr}</b>
                  <Badge tone="muted">{pkg.language === "english" ? t("الإنجليزية") : t("العبرية")}</Badge>
                </div>
                <p className="mt-2 text-xl font-bold text-brand">
                  {pkg.price} <span className="text-xs font-normal text-muted-foreground">{t("ج.م")}</span>
                </p>
                {pkg.sessionsTotal ? (
                  <small className="mt-1 text-muted-foreground">{pkg.sessionsTotal} {t("حصة")}</small>
                ) : (
                  <small className="mt-1 text-muted-foreground">{pkg.durationMonths} {t("شهور")}</small>
                )}
                <Button
                  className="mt-3 w-full text-xs"
                  variant={selectedPkgId === pkg.id ? "secondary" : "primary"}
                  disabled={!!pendingReq}
                  onClick={() => {
                    setSelectedPkgId(selectedPkgId === pkg.id ? null : pkg.id);
                    setMethod(null);
                    setShot(null);
                    setPkgError("");
                  }}
                >
                  {selectedPkgId === pkg.id ? t("إلغاء الاختيار") : pendingReq ? t("طلب قيد المراجعة") : t("اشترك / جدّد")}
                </Button>
              </div>
            ))}
            {visiblePackages.length === 0 && (
              <p className="col-span-full py-6 text-center text-sm text-muted-foreground">{t("لا توجد باقات متاحة حالياً.")}</p>
            )}
          </div>

          {selectedPkg && (
            <div className="mx-auto mt-4 max-w-xl space-y-4 rounded-2xl border border-brand/30 bg-brand/5 p-4">
              <div className="flex items-center justify-between">
                <b className="text-sm">{t("تفاصيل الاشتراك")} — {selectedPkg.nameAr}</b>
                <span className="font-lat text-lg font-bold text-brand">{selectedPkg.price} {t("ج.م")}</span>
              </div>

              <div className="space-y-1.5">
                <Label>{t("طريقة التحويل")}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["instapay", "wallet"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethod(m)}
                      className={`rounded-md border p-3 text-sm font-semibold transition ${
                        method === m ? "border-brand bg-brand/10 text-brand" : "border-border hover:border-brand/50"
                      }`}
                    >
                      {m === "instapay" ? "InstaPay انستاباي" : t("محفظة إلكترونية")}
                    </button>
                  ))}
                </div>
              </div>

              {method && (
                <>
                  <div className="rounded-md border border-brand/30 bg-brand/5 p-4 text-center">
                    <small className="block text-muted-foreground">
                      {method === "instapay"
                        ? t("حوّل على رقم انستاباي التالي:")
                        : t("حوّل على رقم المحفظة الإلكترونية التالي:")}
                    </small>
                    <div className="mt-2 flex items-center justify-center gap-3">
                      <b dir="ltr" className="font-lat text-xl tracking-widest">{PAYMENT_NUMBER_DISPLAY}</b>
                      <Button variant="secondary" className="min-h-8 px-3 text-xs" onClick={copyNumber}>
                        {copied ? t("تم النسخ") : t("نسخ الرقم")}
                      </Button>
                    </div>
                  </div>

                  <ol className="space-y-1.5 text-sm">
                    <li className="flex items-center gap-2"><Badge tone="brand">1</Badge>{t("حوّل المبلغ على الرقم أعلاه")}</li>
                    <li className="flex items-center gap-2"><Badge tone="brand">2</Badge>{t("ارفع سكرين شوت إثبات التحويل واضغط إرسال")}</li>
                  </ol>

                  <div className="space-y-1.5">
                    <Label>{t("سكرين شوت إثبات التحويل")}</Label>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,application/pdf"
                      onChange={(e) => setShot(e.target.files?.[0] ?? null)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:ml-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1 file:text-xs"
                    />
                    {shot && <small className="block text-sage">{shot.name}</small>}
                  </div>

                  {pkgError && <p className="rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">{pkgError}</p>}

                  <Button className="w-full" onClick={handleBuy} disabled={submitting || !shot || !!pendingReq}>
                    {submitting ? t("جاري الإرسال...") : t("إرسال طلب الاشتراك")}
                  </Button>
                </>
              )}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
