import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  ClipboardCheck,
  GraduationCap,
  Headphones,
  MessageCircle,
  Mic,
  RotateCcw,
  Sparkles,
  UsersRound,
  Video,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge, Button, Card, Input, Label, ProgressBar } from "../components/ui";
import { usePlatformStore, type PublicPackage } from "../hooks/use-platform-store";
import { useAuth } from "../hooks/use-auth";
import { getHomeRouteForRole } from "../lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ohran — أكاديمية العبرية للناطقين بالعربية" },
      {
        name: "description",
        content:
          "أكاديمية عبرية متكاملة: مدرسون متخصصون، محاضرات لايف، اختبار تحديد مستوى، وباقات مرنة.",
      },
      { property: "og:title", content: "Ohran — أكاديمية العبرية" },
      { property: "og:description", content: "تعلّم العبرية مع مدرسين متخصصين وباقات مرنة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function BookingModal({
  pkg,
  onClose,
}: {
  pkg: PublicPackage;
  onClose: () => void;
}) {
  const { submitPublicLead } = usePlatformStore();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setSaving(true);
    try {
      await submitPublicLead({ name, phone, ...(email ? { email } : {}), packageName: pkg.nameAr });
      setDone(true);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "فشل إرسال الطلب — حاول مرة أخرى");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4" onClick={onClose}>
      <Card className="w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="py-6 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-sage/15 text-sage">
              <Check className="size-7" />
            </div>
            <h3 className="mt-4 text-lg font-bold">تم استلام طلبك</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              سيتواصل معك فريق المبيعات قريباً لإتمام حجز باقة <b>{pkg.nameAr}</b>.
            </p>
            <Button className="mt-5 w-full" onClick={onClose}>
              تمام
            </Button>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-bold">حجز باقة: {pkg.nameAr}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              اترك بياناتك وسيتواصل معك فريقنا لتأكيد الحجز
            </p>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label>الاسم الكامل</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>رقم الهاتف / واتساب</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} required dir="ltr" placeholder="+20..." />
              </div>
              <div className="space-y-1.5">
                <Label>البريد الإلكتروني (اختياري)</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
              </div>
              {err && <p className="text-sm font-semibold text-danger">{err}</p>}
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? "جاري الإرسال..." : "تأكيد الحجز"}
                </Button>
                <Button type="button" variant="ghost" onClick={onClose}>
                  إلغاء
                </Button>
              </div>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}

function Landing() {
  const { user } = useAuth();
  const { placementQuestions, publicPackages, fetchPublicPackages } = usePlatformStore();
  const activeQuestions = placementQuestions.filter((q) => q.isActive);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);
  const [bookingPkg, setBookingPkg] = useState<PublicPackage | null>(null);

  useEffect(() => {
    fetchPublicPackages();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentQ = activeQuestions[currentIdx];

  function handleSelectOption(optionIdx: number) {
    if (!currentQ) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: optionIdx }));
  }

  function handleNext() {
    if (currentIdx + 1 < activeQuestions.length) setCurrentIdx(currentIdx + 1);
    else setFinished(true);
  }

  function handleReset() {
    setAnswers({});
    setCurrentIdx(0);
    setFinished(false);
  }

  const correctCount = activeQuestions.reduce(
    (acc, q) => (answers[q.id] === q.correctOptionIndex ? acc + 1 : acc),
    0,
  );
  const scorePercent =
    activeQuestions.length > 0 ? Math.round((correctCount / activeQuestions.length) * 100) : 0;
  const estimatedLevel =
    scorePercent >= 80 ? "B2" : scorePercent >= 55 ? "B1" : scorePercent >= 30 ? "A2" : "A1";

  return (
    <div dir="rtl" className="relative min-h-screen overflow-hidden bg-paper text-ink">
      <div className="page-glow absolute inset-0 -z-10" />
      <div className="grid-fade absolute inset-0 -z-10 opacity-40" />

      {/* ─── Header ─── */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-md bg-brand font-lat text-xl font-bold text-primary-foreground">
            O
          </span>
          <span>
            <b className="block text-lg">Ohran</b>
            <small className="font-he text-muted-foreground">עברית שוטפת</small>
          </span>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">لماذا أهران</a>
          <a href="#method" className="hover:text-foreground">منهجيتنا</a>
          <a href="#packages" className="hover:text-foreground">الباقات والأسعار</a>
          <a href="#quiz" className="hover:text-foreground">اختبار المستوى</a>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Link to={getHomeRouteForRole(user.role)}>
              <Button>لوحة التحكم الخاصة بك</Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost">تسجيل الدخول</Button>
              </Link>
              <Link to="/register">
                <Button>إنشاء حساب طالب</Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* ─── Hero ─── */}
      <main className="mx-auto max-w-7xl px-5 pb-20">
        <section className="pt-10 text-center lg:pt-16">
          <Badge className="mx-auto">
            <Sparkles className="ms-1 size-3" />
            أكاديمية العبرية الأولى للناطقين بالعربية
          </Badge>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-[1.3] lg:text-6xl">
            اتكلم العبرية <span className="text-brand">بثقة</span> — بمدرس حقيقي ومتابعة يومية
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            محاضرات لايف أونلاين وأوفلاين، مدرسون متخصصون، اختبار تحديد مستوى مجاني، وخطة تعلم
            شخصية من أول يوم.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#packages">
              <Button className="min-h-12 px-8 text-base">
                احجز باقتك الآن <ArrowLeft className="size-4" />
              </Button>
            </a>
            <a href="#quiz">
              <Button variant="ghost" className="min-h-12 px-6 text-base">
                اختبر مستواك مجاناً
              </Button>
            </a>
          </div>
        </section>

        {/* ─── Features ─── */}
        <section id="features" className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Video,
              t: "محاضرات لايف أونلاين وأوفلاين",
              d: "جلسات Zoom مباشرة مع مدرسك وحصص حضورية — الجدول يحدده مدرسك ويظهر في حسابك تلقائياً.",
            },
            {
              icon: UsersRound,
              t: "مدرسون متخصصون",
              d: "كل باقة لها مدرس مسؤول يتابع تقدمك، يصحح واجباتك، ويقيّم مهاراتك الأربع.",
            },
            {
              icon: Mic,
              t: "تدريب نطق وتسجيل",
              d: "سجّل صوتك داخل المنصة، والمدرس يصحح النطق والطلاقة بملاحظات مفصلة.",
            },
            {
              icon: ClipboardCheck,
              t: "اختبارات وامتحانات شاملة",
              d: "ترجمة، قراءة، كتابة، استماع وتحدث — مع نتائج وتصحيح مفصل لكل سؤال.",
            },
            {
              icon: MessageCircle,
              t: "محادثة مباشرة مع مدرسك",
              d: "شات مباشر مع المدرس وخدمة العملاء، ومساعد ذكي يتكلم معك في أي وقت.",
            },
            {
              icon: GraduationCap,
              t: "شهادات معتمدة",
              d: "شهادة إتمام لكل مستوى عند استيفاء شروط النجاح، تصدر من إدارة الأكاديمية.",
            },
          ].map(({ icon: Icon, t, d }) => (
            <Card key={t}>
              <span className="grid size-10 place-items-center rounded-md bg-brand/10 text-brand">
                <Icon className="size-5" />
              </span>
              <h2 className="mt-3 text-lg font-bold">{t}</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{d}</p>
            </Card>
          ))}
        </section>

        {/* ─── Methodology ─── */}
        <section id="method" className="mt-20">
          <div className="text-center">
            <Badge>منهجيتنا</Badge>
            <h2 className="mt-4 text-3xl font-bold">رحلتك من الصفر للطلاقة في 4 خطوات</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {[
              ["١", "اختبار تحديد المستوى", "اختبار مجاني يحدد مستواك بدقة قبل البدء."],
              ["٢", "اختيار الباقة المناسبة", "باقات مرنة بأسعار واضحة ومدرس متخصص لكل باقة."],
              ["٣", "محاضرات ومتابعة", "لايف Zoom + واجبات + تصحيح مفصل وتقارير دورية."],
              ["٤", "شهادة الإتمام", "تقييم نهائي وشهادة معتمدة تفتح لك المستوى التالي."],
            ].map(([n, t, d]) => (
              <Card key={n} className="text-center">
                <span className="mx-auto grid size-10 place-items-center rounded-full bg-brand font-lat font-bold text-primary-foreground">
                  {n}
                </span>
                <h3 className="mt-3 font-bold">{t}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{d}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* ─── Packages ─── */}
        <section id="packages" className="mt-20">
          <div className="text-center">
            <Badge>الباقات والأسعار</Badge>
            <h2 className="mt-4 text-3xl font-bold">اختار الباقة اللي تناسبك</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              كل باقة لها مدرس متخصص مسؤول عنها — احجز وسيتواصل معك فريقنا لتأكيد التسجيل.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {publicPackages.length === 0 ? (
              <Card className="col-span-full py-12 text-center text-sm text-muted-foreground">
                الباقات تُعرض هنا فور تفعيلها من إدارة الأكاديمية.
              </Card>
            ) : (
              publicPackages.map((p) => (
                <Card key={p.id} className="flex flex-col">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-bold">{p.nameAr}</h3>
                    <Badge tone="brand">{p.durationMonths} شهر</Badge>
                  </div>
                  <p className="mt-2 font-lat text-3xl font-bold text-brand">
                    ${p.price}
                    <small className="text-sm font-normal text-muted-foreground"> / للباقة</small>
                  </p>
                  {p.description && (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{p.description}</p>
                  )}
                  {p.teacher && (
                    <div className="mt-3 flex items-center gap-2.5 rounded-md bg-muted/60 p-2.5">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand2/15 font-bold text-brand2">
                        {p.teacher.fullName[0]}
                      </span>
                      <div className="min-w-0">
                        <b className="block text-xs">{p.teacher.fullName}</b>
                        {p.teacher.specialty && (
                          <small className="block truncate text-muted-foreground">
                            {p.teacher.specialty}
                          </small>
                        )}
                      </div>
                    </div>
                  )}
                  {p.features && p.features.length > 0 && (
                    <ul className="mt-3 flex-1 space-y-1.5 border-t border-border pt-3">
                      {p.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Check className="mt-0.5 size-3.5 shrink-0 text-sage" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Button className="mt-4 w-full" onClick={() => setBookingPkg(p)}>
                    احجز الآن
                  </Button>
                </Card>
              ))
            )}
          </div>
        </section>

        {/* ─── Placement quiz ─── */}
        <section id="quiz" className="mt-20">
          <div className="grid items-start gap-10 lg:grid-cols-[1fr_540px]">
            <div className="pt-4">
              <Badge tone="gold">
                <ClipboardCheck className="ms-1 size-3" />
                اختبار مجاني
              </Badge>
              <h2 className="mt-5 text-3xl font-bold leading-snug">
                مش متأكد من مستواك؟ <br />
                اكتشفه في دقائق
              </h2>
              <p className="mt-4 leading-8 text-muted-foreground">
                اختبار تفاعلي قصير يحدد مستواك التقريبي (A1 → B2) — جرّبه الآن بدون تسجيل، وسجّل
                حسابك بعدها لحفظ النتيجة والبدء بخطة مناسبة.
              </p>
              <div className="mt-6 space-y-2.5 text-sm text-muted-foreground">
                {[
                  "أسئلة محدّثة مباشرة من إدارة الأكاديمية",
                  "نتيجة فورية مع مستوى مقترح",
                  "سجّل بعدها وابدأ مع مدرسك الخاص",
                ].map((x) => (
                  <p key={x}>
                    <Check className="ms-2 inline size-4 text-sage" />
                    {x}
                  </p>
                ))}
              </div>
            </div>

            <Card className="p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <span className="grid size-9 place-items-center rounded-md bg-brand/10 text-brand">
                    <ClipboardCheck className="size-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold">اختبار تحديد المستوى السريع</h2>
                    <small className="text-muted-foreground">الأسئلة محدّثة من إدارة المنصة</small>
                  </div>
                </div>
                <Badge tone="brand">{activeQuestions.length} أسئلة</Badge>
              </div>

              {activeQuestions.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  لا توجد أسئلة مفعلة حالياً في اختبار تحديد المستوى.
                </div>
              ) : finished ? (
                <div className="mt-6 space-y-5 text-center">
                  <div className="mx-auto grid size-20 place-items-center rounded-xl bg-brand/10 font-lat text-3xl font-bold text-brand">
                    {estimatedLevel}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">مستواك المبدئي المقترح: {estimatedLevel}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      أجبت بشكل صحيح على {correctCount} من أصل {activeQuestions.length} (
                      {scorePercent}%)
                    </p>
                  </div>
                  <ProgressBar value={scorePercent} tone="sage" />
                  <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                    <Link to="/register" className="flex-1">
                      <Button className="w-full">سجّل كطالب لحفظ النتيجة والبدء</Button>
                    </Link>
                    <Button variant="ghost" onClick={handleReset}>
                      <RotateCcw className="size-4" />
                      إعادة الاختبار
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      السؤال {currentIdx + 1} من {activeQuestions.length}
                    </span>
                    <div className="flex gap-2">
                      <Badge tone="gold">{currentQ.section}</Badge>
                      <Badge tone="muted">مستوى {currentQ.levelTag}</Badge>
                    </div>
                  </div>

                  <div className="mt-2">
                    <ProgressBar
                      value={Math.round(((currentIdx + 1) / activeQuestions.length) * 100)}
                    />
                  </div>

                  <h3 className="mt-5 text-base font-bold">{currentQ.promptAr}</h3>
                  {currentQ.hebrewText && (
                    <div
                      dir="rtl"
                      className="mt-3 rounded-md bg-muted/80 p-3.5 font-he text-lg leading-8 text-foreground"
                    >
                      {currentQ.hebrewText}
                    </div>
                  )}

                  <div className="mt-4 space-y-2.5">
                    {currentQ.options.map((opt, idx) => {
                      const selected = answers[currentQ.id] === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectOption(idx)}
                          className={`flex w-full items-center justify-between rounded-md border p-3.5 text-right text-sm transition-colors ${
                            selected
                              ? "border-brand bg-brand/10 font-semibold text-brand"
                              : "border-border bg-background/60 hover:border-brand/50"
                          }`}
                        >
                          <span>{opt}</span>
                          <span
                            className={`grid size-5 shrink-0 place-items-center rounded-full border text-xs ${
                              selected ? "border-brand bg-brand text-primary-foreground" : "border-border"
                            }`}
                          >
                            {selected ? "✓" : idx + 1}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <Button
                      variant="ghost"
                      disabled={currentIdx === 0}
                      onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                    >
                      السابق
                    </Button>
                    <Button onClick={handleNext} disabled={answers[currentQ.id] === undefined}>
                      {currentIdx + 1 === activeQuestions.length ? "عرض النتيجة" : "السؤال التالي"}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </section>

        {/* ─── Final CTA ─── */}
        <section className="mt-20">
          <Card className="bg-brand/5 px-8 py-12 text-center">
            <Headphones className="mx-auto size-10 text-brand" />
            <h2 className="mt-4 text-2xl font-bold">جاهز تبدأ رحلتك مع العبرية؟</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-muted-foreground">
              أنشئ حسابك كطالب، اختبر مستواك، واختار الباقة المناسبة — فريقنا جاهز لأي استفسار.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/register">
                <Button className="min-h-11 px-8">إنشاء حساب طالب</Button>
              </Link>
              <a href="#packages">
                <Button variant="ghost" className="min-h-11 px-6">
                  تصفح الباقات
                </Button>
              </a>
            </div>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Ohran · أكاديمية العبرية للناطقين بالعربية · جميع الحقوق محفوظة
      </footer>

      {bookingPkg && <BookingModal pkg={bookingPkg} onClose={() => setBookingPkg(null)} />}
    </div>
  );
}
