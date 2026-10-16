import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, ClipboardCheck, RotateCcw, Sparkles } from "lucide-react";
import { useState } from "react";
import { Badge, Button, Card, ProgressBar } from "../components/ui";
import { usePlatformStore } from "../hooks/use-platform-store";
import { useAuth } from "../hooks/use-auth";
import { getHomeRouteForRole } from "../lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ohran — تعلّم العبرية بثقة" },
      {
        name: "description",
        content: "منصة تعلم عبرية بخطة شخصية ومحادثات واقعية واختبار تحديد مستوى تفاعلي.",
      },
      { property: "og:title", content: "Ohran — تعلّم العبرية بثقة" },
      { property: "og:description", content: "اختبر مستواك وابدأ خطة تعلم عبرية شخصية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user } = useAuth();
  const { placementQuestions } = usePlatformStore();
  const activeQuestions = placementQuestions.filter((q) => q.isActive);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);

  const currentQ = activeQuestions[currentIdx]!;

  function handleSelectOption(optionIdx: number) {
    if (!currentQ) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: optionIdx }));
  }

  function handleNext() {
    if (currentIdx + 1 < activeQuestions.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setFinished(true);
    }
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

      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-md bg-brand font-lat text-xl font-bold text-primary-foreground">
            O
          </span>
          <span>
            <b className="block text-lg">Ohran</b>
            <small className="font-he text-muted-foreground">עברית, בביטחון</small>
          </span>
        </div>
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

      <main className="mx-auto max-w-7xl px-5 pb-20 pt-10 lg:pt-16">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_540px]">
          <div className="pt-4">
            <Badge>
              <Sparkles className="ms-1 size-3" />
              مسارك الشخصي للعبرية
            </Badge>
            <h1 className="mt-6 max-w-3xl text-5xl font-bold leading-[1.25] lg:text-6xl">
              تعلّم العبرية للمواقف التي <span className="text-brand">تعيشها فعلًا.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              ابدأ باختبار تحديد المستوى التفاعلي مباشرة من هنا، ثم أنشئ حسابك كطالب للحصول على خطة
              تعلم شخصية ومحادثات واقعية مع متابعة المدرسين.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register">
                <Button className="min-h-12 px-6 text-base">
                  إنشاء حساب طالب <ArrowLeft className="size-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="ghost" className="min-h-12 px-6 text-base">
                  تسجيل الدخول
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-5 text-sm text-muted-foreground">
              {["اختبار تحديد مستوى فوري", "سيناريوهات محادثة يومية", "متابعة مباشرة مع المدرسين"].map(
                (x) => (
                  <span key={x}>
                    <Check className="ms-2 inline size-4 text-sage" />
                    {x}
                  </span>
                ),
              )}
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
                  <small className="text-muted-foreground">
                    الأسئلة محدّثة مباشرة من إدارة المنصة
                  </small>
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
                    أجبت بشكل صحيح على {correctCount} من أصل {activeQuestions.length} ({scorePercent}
                    %)
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
                  <Button
                    onClick={handleNext}
                    disabled={answers[currentQ.id] === undefined}
                  >
                    {currentIdx + 1 === activeQuestions.length ? "عرض النتيجة" : "السؤال التالي"}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="mt-20 grid gap-4 md:grid-cols-3">
          {[
            [
              "اختبار يعرفك",
              "قراءة واستماع وكتابة ومحادثة ترسم مستوى البداية بدقة وتوجهك للمسار الأنسب.",
            ],
            [
              "خطة تتعلم منك",
              "كل خطأ متكرر يتحول إلى مهمة وتدريب قصير مخصص داخل حساب الطالب.",
            ],
            [
              "ممارسة تشبه الحياة",
              "مطعم، مستشفى، بنك، مقابلة عمل، سفر، وكول سنتر مع متابعة المدرسين.",
            ],
          ].map(([t, d], i) => (
            <Card key={t}>
              <span className="font-lat text-sm text-brand">0{i + 1}</span>
              <h2 className="mt-3 text-xl font-bold">{t}</h2>
              <p className="mt-2 leading-7 text-muted-foreground">{d}</p>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
