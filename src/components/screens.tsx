import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AreaChart, Area, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Award,
  CalendarDays,
  Check,
  Circle,
  Clock,
  PlusCircle,
  Video,
  ClipboardCheck,
  ExternalLink,
  FileCheck,
  FileText,
  Film,
  GraduationCap,
  Link2,
  Mic,
  Plus,
  Search,
  Send,
  Square,
  Trash2,
  TrendingUp,
  Upload,
  UserPlus,
  UsersRound,
  Headphones,
  TicketCheck,
  Trophy,
  Volume2,
  XCircle,
} from "lucide-react";
import { AppShell, PageHeader } from "./app-shell";
import { Badge, Button, Card, Input, Label, ProgressBar } from "./ui";
import {
  usePlatformStore,
  uploadFile,
  EXAM_TYPE_LABELS,
  QUESTION_TYPE_LABELS,
  type Exam,
  type ExamQuestionItem,
  type ExamType,
  type LeaderboardEntry,
  type MaterialAttachment,
  type MaterialType,
  type PlacementSection,
  type PlatformUser,
  type PublishStatus,
  type QuestionType,
  type StudentReport,
  type AdminPackage,
  type AdminLead,
  type AdminSalesReport,
  type AdminCertificate,
  type Subscription,
  type PaymentRequestItem,
  type PlacementResultRow,
  type AdminLectureItem,
  type CreateLectureInput,
  type WeeklyScheduleItem,
  type CreateScheduleInput,
} from "../hooks/use-platform-store";
import { useAuth } from "../hooks/use-auth";
import { ROLE_LABELS, type UserRole } from "../lib/auth";
import { SERVER_CONFIG, mediaSrc } from "../lib/api";

const meta = (title: string, description: string) => ({
  meta: [
    { title: `${title} — עברית שוטפת` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — עברית שוטפת` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ],
});
export { meta };

export function MaterialPlayer({ material }: { material: { storageUrl: string; type: MaterialType; title: string; fileName: string } }) {
  const url = mediaSrc(material.storageUrl);
  if (material.type === "VIDEO") {
    return (
      <video controls preload="metadata" className="w-full rounded-md bg-black" src={url}>
        متصفحك لا يدعم تشغيل الفيديو.
      </video>
    );
  }
  if (material.type === "AUDIO") {
    return (
      <audio controls preload="metadata" className="w-full" src={url}>
        متصفحك لا يدعم تشغيل الصوت.
      </audio>
    );
  }
  return (
    <div className="space-y-3">
      <iframe src={url} title={material.title} className="h-[420px] w-full rounded-md border border-border bg-white" />
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
      >
        <ExternalLink className="size-3.5" />
        فتح الملف في تبويب جديد ({material.fileName})
      </a>
    </div>
  );
}

export function AudioRecorder({
  onRecorded,
  label = "تسجيل صوتي",
}: {
  onRecorded: (blob: Blob) => void;
  label?: string;
}) {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        onRecorded(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError("تعذر الوصول إلى الميكروفون — تأكد من السماح بالوصول");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  return (
    <div className="rounded-md border border-dashed border-border bg-muted/40 p-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={recording ? "primary" : "secondary"}
          onClick={recording ? stopRecording : startRecording}
          className="gap-2"
        >
          {recording ? <Square className="size-4" /> : <Circle className="size-4 text-danger" />}
          {recording ? "إيقاف التسجيل" : label}
        </Button>
        {recording && <span className="text-xs font-semibold text-danger">جاري التسجيل...</span>}
      </div>
      {audioUrl && !recording && (
        <audio controls src={audioUrl} className="mt-3 w-full" />
      )}
      {error && <p className="mt-2 text-xs font-semibold text-danger">{error}</p>}
    </div>
  );
}

export function HebrewTTS({ text, label = "استمع للفقرة" }: { text: string; label?: string }) {
  const [playing, setPlaying] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  function play() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "he-IL";
    utter.rate = 0.85;
    utter.onstart = () => setPlaying(true);
    utter.onend = () => setPlaying(false);
    utter.onerror = () => setPlaying(false);
    // Try to find a Hebrew voice
    const voices = window.speechSynthesis.getVoices();
    const heVoice = voices.find((v) => v.lang.startsWith("he"));
    if (heVoice) utter.voice = heVoice;
    window.speechSynthesis.speak(utter);
  }

  function stop() {
    window.speechSynthesis.cancel();
    setPlaying(false);
  }

  if (!supported) return null;

  return (
    <Button
      type="button"
      variant={playing ? "primary" : "secondary"}
      onClick={playing ? stop : play}
      className="gap-2"
    >
      {playing ? <Square className="size-4" /> : <Volume2 className="size-4" />}
      {playing ? "إيقاف" : label}
    </Button>
  );
}

export function LeaderboardCard({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <Card>
      <div className="flex items-center gap-2">
        <Trophy className="size-5 text-amber-500" />
        <h2 className="text-lg font-bold">لوحة المتفوقين</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        ترتيب الطلاب حسب متوسط درجاتهم في كل الامتحانات
      </p>
      <div className="mt-4 space-y-2">
        {entries.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            لا توجد نتائج منشورة بعد — سلّم امتحاناً لتظهر هنا!
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.rank}
              className={`flex items-center justify-between rounded-md border p-3 ${
                entry.rank <= 3
                  ? "border-amber-400/50 bg-amber-50/40"
                  : "border-border bg-background/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
                    entry.rank === 1
                      ? "bg-amber-400 text-white"
                      : entry.rank === 2
                        ? "bg-slate-300 text-slate-800"
                        : entry.rank === 3
                          ? "bg-amber-700 text-white"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  {entry.rank}
                </span>
                <b className="text-sm">{entry.fullName}</b>
              </div>
              <div className="flex items-center gap-3">
                <small className="text-xs text-muted-foreground">
                  {entry.examsTaken} امتحان
                </small>
                <Badge tone="sage">{entry.avgScore}%</Badge>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

export function DashboardScreen() {
  const { user } = useAuth();
  const { studentDashboard, leaderboard } = usePlatformStore();
  const dash = studentDashboard;

  return (
    <AppShell role="STUDENT">
      <PageHeader
        title={user ? `مرحبًا، ${user.fullName}` : "لوحة الطالب"}
        subtitle="نتائجك وترتيبك بين الطلاب وملاحظات المدرسين"
        actions={
          <>
            <Link to="/courses">
              <Button variant="secondary">كورساتي</Button>
            </Link>
            <Link to="/exams">
              <Button variant="dark">الامتحانات</Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <small className="text-muted-foreground">متوسط درجاتك</small>
          <b className="mt-1 block font-lat text-3xl text-brand">
            {dash?.myAvgScore !== null && dash?.myAvgScore !== undefined ? `${dash.myAvgScore}%` : "—"}
          </b>
          <small className="text-muted-foreground">من كل الامتحانات المصححة</small>
        </Card>
        <Card>
          <small className="text-muted-foreground">ترتيبك بين الطلاب</small>
          <b className="mt-1 block font-lat text-3xl text-sage">
            {dash?.myRank !== null && dash?.myRank !== undefined
              ? `#${dash.myRank}`
              : "—"}
          </b>
          <small className="text-muted-foreground">
            من أصل {dash?.totalStudents ?? 0} طالب
          </small>
        </Card>
        <Card className="bg-brand text-primary-foreground">
          <small className="opacity-75">اختبار تحديد المستوى</small>
          <h2 className="mt-1 text-xl font-bold">حدد مستواك الحالي</h2>
          <p className="mt-3 text-sm opacity-90">
            ابدأ اختبار تحديد المستوى لبناء خطتك الشخصية وتقييم مهاراتك.
          </p>
          <Link to="/placement">
            <Button className="mt-6 w-full bg-background text-foreground hover:bg-background/90">
              بدء الاختبار
            </Button>
          </Link>
        </Card>
      </div>

      <div className="mt-4">
        <Card>
          <h2 className="text-lg font-bold">نتائج امتحاناتي وملاحظات المدرسين</h2>
          <div className="mt-4 space-y-3">
            {!dash || !dash.myResults || dash.myResults.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                لا توجد نتائج مصححة لك حتى الآن — سلّم امتحاناً وستظهر نتيجتك وملاحظة المدرس هنا فوراً.
              </div>
            ) : (
              dash.myResults.map((r, i) => (
                <div
                  key={i}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-background/60 p-4"
                >
                  <div>
                    <b className="text-sm">{r.title}</b>
                    <small className="block text-muted-foreground">
                      {EXAM_TYPE_LABELS[r.type]}
                    </small>
                    {r.feedback && (
                      <p className="mt-1 rounded-sm bg-sage/10 px-2 py-1 text-xs text-sage">
                        ملاحظة المدرس: {r.feedback}
                      </p>
                    )}
                  </div>
                  <Badge tone={r.score !== null ? "sage" : "muted"}>
                    {r.score !== null ? `${r.score}%` : "بانتظار التصحيح"}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <LeaderboardCard entries={leaderboard} />
      </div>
    </AppShell>
  );
}

function LevelCard() {
  return (
    <Card>
      <div className="flex justify-between">
        <h2 className="text-lg font-bold">المستوى والتقدم</h2>
        <span className="text-xs text-muted-foreground">الحالة الحالية</span>
      </div>
      <div className="mt-5 flex items-center gap-4">
        <span className="grid size-16 place-items-center rounded-md bg-brand/10 font-lat text-2xl font-bold text-brand">
          —
        </span>
        <div className="flex-1">
          <b className="font-lat text-3xl">0%</b>
          <small className="block text-muted-foreground">إتمام المسار الحالي</small>
          <div className="mt-2">
            <ProgressBar value={0} />
          </div>
        </div>
      </div>
    </Card>
  );
}

function SkillsCard() {
  const { studentSkills } = usePlatformStore();
  return (
    <Card>
      <div className="flex justify-between">
        <h2 className="text-lg font-bold">مهاراتي الأربع</h2>
        <Link to="/progress" className="text-xs text-brand">
          عرض التفاصيل
        </Link>
      </div>
      {studentSkills.length === 0 ? (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          لم يتم تسجيل تقييمات للمهارات بعد — سيقيّمها مدرسك هنا.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {studentSkills.map((s) => (
            <div key={s.id}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span>{SKILL_LABELS[s.skill] ?? s.skill}</span>
                <b className="font-lat">{s.score}%</b>
              </div>
              <ProgressBar value={s.score} tone={s.score >= 70 ? "sage" : s.score >= 50 ? "gold" : "brand"} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function PlacementScreen() {
  const { placementQuestions } = usePlatformStore();
  const activeQuestions = placementQuestions.filter((q) => q.isActive);
  const [step, setStep] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number | string>>({});

  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const isCorrect = (q: (typeof activeQuestions)[number]) => {
    const ans = selectedAnswers[q.id];
    if (q.questionType === "text") {
      return typeof ans === "string" && !!q.expectedAnswer
        && normalize(ans) === normalize(q.expectedAnswer);
    }
    return ans === q.correctOptionIndex;
  };
  const hasAnswer = (q: (typeof activeQuestions)[number]) => {
    const ans = selectedAnswers[q.id];
    if (q.questionType === "text") return typeof ans === "string" && ans.trim().length > 0;
    return typeof ans === "number";
  };

  if (step >= activeQuestions.length && activeQuestions.length > 0) {
    const correctCount = activeQuestions.reduce(
      (acc, q) => (isCorrect(q) ? acc + 1 : acc),
      0,
    );
    const scorePercent = Math.round((correctCount / activeQuestions.length) * 100);
    return <PlacementResult scorePercent={scorePercent} correctCount={correctCount} total={activeQuestions.length} />;
  }

  const currentQ = activeQuestions[step];

  return (
    <AppShell role="STUDENT">
      <PageHeader
        title="اختبار تحديد المستوى"
        subtitle="الأسئلة المخصصة من إدارة المنصة لتحديد مستواك بدقة"
      />
      <Card className="mx-auto max-w-4xl">
        {!currentQ ? (
          <div className="py-12 text-center text-muted-foreground">
            لا توجد أسئلة مفعلة حالياً في قاعدة البيانات.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2">
              {activeQuestions.map((q, i) => (
                <div key={q.id} className="flex flex-1 items-center gap-2">
                  <span
                    className={`grid size-8 place-items-center rounded-full ${
                      i <= step
                        ? "bg-brand text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i < step ? <Check className="size-4" /> : i + 1}
                  </span>
                  <span className="hidden text-sm sm:block">{q.section}</span>
                  {i < activeQuestions.length - 1 && <span className="h-px flex-1 bg-border" />}
                </div>
              ))}
            </div>
            <div className="my-8 border-y border-border py-8">
              <div className="flex gap-2">
                <Badge>
                  السؤال {step + 1} من {activeQuestions.length}
                </Badge>
                <Badge tone="gold">{currentQ.section}</Badge>
                <Badge tone="muted">مستوى {currentQ.levelTag}</Badge>
              </div>
              <h2 className="mt-4 text-2xl font-bold">{currentQ.promptAr}</h2>
              <p className="mt-3 font-he text-xl leading-9">{currentQ.hebrewText}</p>

              {currentQ.questionType === "text" ? (
                <div className="mt-6">
                  <Input
                    dir="rtl"
                    value={typeof selectedAnswers[currentQ.id] === "string" ? (selectedAnswers[currentQ.id] as string) : ""}
                    onChange={(e) =>
                      setSelectedAnswers((p) => ({ ...p, [currentQ.id]: e.target.value }))
                    }
                    placeholder="اكتب إجابتك هنا..."
                    className="text-base"
                  />
                </div>
              ) : (
                <div className={`mt-6 grid gap-3 ${currentQ.questionType === "truefalse" ? "" : "sm:grid-cols-2"}`}>
                  {(currentQ.questionType === "truefalse" ? ["صح", "خطأ"] : currentQ.options).map((x, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedAnswers((p) => ({ ...p, [currentQ.id]: idx }))}
                      className={`rounded-md border p-4 text-center text-sm font-bold transition-colors ${
                        selectedAnswers[currentQ.id] === idx
                          ? "border-brand bg-brand/10 text-brand"
                          : "border-border bg-background/60 hover:border-brand hover:bg-brand/5"
                      }`}
                    >
                      {x}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))}>
                السابق
              </Button>
              <Button onClick={() => setStep(step + 1)}>
                {step === activeQuestions.length - 1 ? "إنهاء وعرض النتيجة" : "التالي"}
              </Button>
            </div>
          </>
        )}
      </Card>
    </AppShell>
  );
}

function PlacementResult({
  scorePercent,
  correctCount,
  total,
}: {
  scorePercent: number;
  correctCount: number;
  total: number;
}) {
  const { submitPlacementResult } = usePlatformStore();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const submitted = useRef(false);
  const level =
    scorePercent >= 80 ? "B2" : scorePercent >= 55 ? "B1" : scorePercent >= 30 ? "A2" : "A1";

  useEffect(() => {
    if (!user || submitted.current) return;
    submitted.current = true;
    setSaveState("saving");
    submitPlacementResult(scorePercent, level)
      .then(() => {
        setSaveState("saved");
        return refreshUser().catch(() => {});
      })
      .catch(() => setSaveState("error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function goToSubscribe() {
    try {
      await refreshUser();
    } catch {
      // ignore — navigation still allowed; the gate re-checks on the server
    }
    navigate({ to: "/subscribe" });
  }

  return (
    <AppShell role="STUDENT">
      <PageHeader title="نتيجة اختبار المستوى" subtitle="تم حساب النتيجة بناءً على إجاباتك" />
      <Card className="mx-auto max-w-lg text-center">
        <span className="mx-auto grid size-24 place-items-center rounded-lg bg-brand/10 font-lat text-4xl font-bold text-brand">
          {level}
        </span>
        <h2 className="mt-4 text-xl font-bold">مستواك: {level}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          أجبت بشكل صحيح على {correctCount} من أصل {total} ({scorePercent}%)
        </p>
        <div className="mt-4">
          <ProgressBar value={scorePercent} tone="sage" />
        </div>
        {saveState === "saved" && (
          <p className="mt-3 text-xs font-semibold text-sage">تم حفظ مستواك في ملفك الشخصي</p>
        )}
        {saveState === "error" && (
          <p className="mt-3 text-xs font-semibold text-danger">تعذر حفظ النتيجة — حاول مجدداً لاحقاً</p>
        )}

        <div className="mt-6 rounded-md border border-brand/30 bg-brand/5 p-4 text-right">
          <b className="text-sm">الخطوة التالية: احجز محاضرتك المجانية</b>
          <p className="mt-1 text-xs text-muted-foreground">
            تواصل معنا على واتساب لحجز محاضرة تجريبية مجانية مع مدرسك
          </p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`أهلاً، أنا ${user?.fullName ?? "طالب جديد"}. خلصت اختبار تحديد المستوى وطلع مستواي ${level} — عايز أحجز المحاضرة المجانية`)}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-sage px-4 py-2.5 text-sm font-bold text-white transition hover:bg-sage/90"
          >
            احجز محاضرتك المجانية عبر واتساب
          </a>
        </div>

        <Button className="mt-4 w-full" onClick={goToSubscribe}>
          متابعة — اختيار الباقة والاشتراك
        </Button>
      </Card>
    </AppShell>
  );
}

export function PlanScreen() {
  return (
    <AppShell role="STUDENT">
      <PageHeader title="خطة التعلم الشخصية" subtitle="المسار اليومي المخصص لك" />
      <Card className="py-12 text-center text-sm text-muted-foreground">
        لا توجد خطة تعلم مسجلة حالياً.
      </Card>
    </AppShell>
  );
}

export function ConversationScreen() {
  const [recording, setRecording] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [text, setText] = useState("");
  const send = () => {
    if (text.trim()) {
      setMessages([...messages, text]);
      setText("");
    }
  };
  return (
    <AppShell role="STUDENT">
      <PageHeader title="محادثة عبرية" subtitle="محادثة تفاعلية" />
      <Card className="flex min-h-[520px] flex-col p-0">
        <div className="flex flex-1 flex-col gap-4 p-5">
          {messages.length === 0 ? (
            <div className="m-auto text-center text-sm text-muted-foreground">
              ابدأ المحادثة بكتابة رسالة بالعبرية...
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                dir="rtl"
                className="me-auto max-w-[78%] rounded-lg bg-brand px-4 py-3 font-he text-primary-foreground"
              >
                {m}
              </div>
            ))
          )}
        </div>
        <div className="flex items-end gap-2 border-t border-border p-4">
          <Button
            onClick={() => setRecording(!recording)}
            variant={recording ? "primary" : "secondary"}
            className="size-11 shrink-0 rounded-full p-0"
          >
            <Mic className={recording ? "animate-pulse" : ""} />
          </Button>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            dir="rtl"
            className="max-h-28 min-h-11 flex-1 resize-none rounded-md border border-input bg-background/70 px-3 py-2 font-he outline-none focus:ring-2 focus:ring-ring"
            placeholder="כתבי הודעה בעברית..."
          />
          <Button onClick={send} className="size-11 p-0">
            <Send className="size-4" />
          </Button>
        </div>
      </Card>
    </AppShell>
  );
}

export function ScenariosScreen() {
  return (
    <AppShell role="STUDENT">
      <PageHeader title="مكتبة السيناريوهات" subtitle="تدرّب على مواقف واقعية تناسب مستواك" />
      <Card className="py-12 text-center text-sm text-muted-foreground">
        لا توجد سيناريوهات مضافة في قاعدة البيانات حالياً.
      </Card>
    </AppShell>
  );
}

export function MistakesScreen() {
  return (
    <AppShell role="STUDENT">
      <PageHeader title="سجل الأخطاء" subtitle="متابعة الأخطاء المتكررة وتصحيحها" />
      <Card className="py-12 text-center text-sm text-muted-foreground">
        لا توجد أخطاء مسجلة حالياً.
      </Card>
    </AppShell>
  );
}

export function ProgressScreen() {
  const { studentSkills, studentAttendanceRate, studentAttendance, studentDashboard } = usePlatformStore();
  const chartData: { m: string; reading: number; speaking: number }[] = [];
  return (
    <AppShell role="STUDENT">
      <PageHeader title="تقدمك" subtitle="تطور مهاراتك وحضورك ونتائجك" />
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="p-4 text-center">
              <small className="text-muted-foreground">متوسط درجاتي</small>
              <b className="mt-1 block font-lat text-2xl text-brand">
                {studentDashboard?.myAvgScore !== null && studentDashboard?.myAvgScore !== undefined
                  ? `${studentDashboard.myAvgScore}%`
                  : "—"}
              </b>
            </Card>
            <Card className="p-4 text-center">
              <small className="text-muted-foreground">نسبة الحضور</small>
              <b className="mt-1 block font-lat text-2xl text-sage">
                {studentAttendanceRate !== null ? `${studentAttendanceRate}%` : "—"}
              </b>
            </Card>
            <Card className="p-4 text-center">
              <small className="text-muted-foreground">ترتيبي</small>
              <b className="mt-1 block font-lat text-2xl text-gold">
                {studentDashboard?.myRank ? `#${studentDashboard.myRank}` : "—"}
              </b>
            </Card>
          </div>
          <Card>
            <h2 className="font-bold">تاريخ التطور</h2>
            {chartData.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                لا توجد بيانات تقدم تاريخية بعد — تقييماتك الحالية تظهر في بطاقة المهارات.
              </div>
            ) : (
              <div className="mt-4 h-72" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="m" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="reading" stroke="var(--brand)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
          <Card>
            <h2 className="font-bold">سجل حضوري ({studentAttendance.length})</h2>
            <div className="mt-3 space-y-2">
              {studentAttendance.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا توجد سجلات حضور بعد.</p>
              ) : (
                studentAttendance.slice(0, 10).map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-md bg-muted/60 p-2.5 text-sm">
                    <span>
                      {a.schedule.title} · {a.schedule.teacher.fullName} ·{" "}
                      {new Date(a.date).toLocaleDateString("ar-EG")}
                    </span>
                    <Badge tone={a.status === "present" ? "sage" : a.status === "late" ? "gold" : a.status === "excused" ? "brand" : "danger"}>
                      {a.status === "present" ? "حاضر" : a.status === "absent" ? "غائب" : a.status === "late" ? "متأخر" : "معذور"}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <h2 className="font-bold">تقييم المهارات</h2>
            {studentSkills.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">لم يقيّم مدرسك مهاراتك بعد.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {studentSkills.map((s) => (
                  <div key={s.id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <b>{SKILL_LABELS[s.skill] ?? s.skill}</b>
                      <span className="font-lat text-brand">{s.score}%</span>
                    </div>
                    <ProgressBar value={s.score} tone={s.score >= 70 ? "sage" : s.score >= 50 ? "gold" : "brand"} />
                    {s.notes && <p className="mt-1 text-xs text-muted-foreground">{s.notes}</p>}
                    {s.updatedBy && (
                      <small className="text-xs text-muted-foreground">بواسطة: {s.updatedBy.fullName}</small>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

export type TeacherSection = "students" | "materials" | "exams" | "schedule" | "homework" | "attendance" | "chat" | "reports" | "sessions";

const SKILL_LABELS: Record<string, string> = {
  listening: "الاستماع",
  speaking: "التحدث",
  reading: "القراءة",
  writing: "الكتابة",
};

export function TeacherScreen() {
  const {
    materials,
    exams,
    teacherStudents,
    leaderboard,
    teacherSchedules,
    teacherLectures,
    teacherHomework,
    teacherAttendance,
    fetchExamResults,
    gradeExamResult,
    fetchTeacherAttendance,
    recordTeacherAttendance,
    createHomework,
    gradeHomework,
    gradeHomeworkSubmission,
    updateStudentSkill,
    fetchStudentReport,
    teacherChatThreads,
    fetchTeacherChatThreads,
    fetchTeacherChatThread,
    sendTeacherChatReply,
    // session bookings
    teacherAvailability,
    teacherBookings,
    fetchTeacherAvailability,
    addTeacherAvailability,
    toggleTeacherAvailability,
    deleteTeacherAvailability,
    fetchTeacherBookings,
    setBookingStatus,
    teacherCancelBooking,
  } = usePlatformStore();
  const [activeSection, setActiveSection] = useState<TeacherSection>("students");
  const [openMaterialId, setOpenMaterialId] = useState<string | null>(null);
  const [openExamId, setOpenExamId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Homework form
  const [showHwForm, setShowHwForm] = useState(false);
  const [hwTitle, setHwTitle] = useState("");
  const [hwDesc, setHwDesc] = useState("");
  const [hwHebrew, setHwHebrew] = useState("");
  const [hwStudentId, setHwStudentId] = useState("");
  const [hwGroup, setHwGroup] = useState("");
  const [hwDue, setHwDue] = useState("");
  const [hwSaving, setHwSaving] = useState(false);
  const [hwDrafts, setHwDrafts] = useState<Record<string, { grade: string; feedback: string }>>({});

  // Attendance
  const [attScheduleId, setAttScheduleId] = useState("");
  const [attDate, setAttDate] = useState(new Date().toISOString().slice(0, 10));

  // Reports
  const [reportStudentId, setReportStudentId] = useState("");
  const [report, setReport] = useState<StudentReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [skillDrafts, setSkillDrafts] = useState<Record<string, { score: string; notes: string }>>({});
  const [skillSaving, setSkillSaving] = useState<string | null>(null);

  // Schedule form
  const [showScForm, setShowScForm] = useState(false);
  const [scTitle, setScTitle] = useState("");
  const [scGroup, setScGroup] = useState("");
  const [scDay, setScDay] = useState(0);
  const [scStart, setScStart] = useState("18:00");
  const [scEnd, setScEnd] = useState("19:30");
  const [scLocation, setScLocation] = useState("online");
  const [scUrl, setScUrl] = useState("");
  const [scDesc, setScDesc] = useState("");
  const [scSaving, setScSaving] = useState(false);

  // Chat
  const [chatStudentId, setChatStudentId] = useState("");
  const [chatMsgs, setChatMsgs] = useState<import("../hooks/use-platform-store").ChatMsg[]>([]);
  const [chatReply, setChatReply] = useState("");
  const [chatSending, setChatSending] = useState(false);

  // Session availability form
  const [avDay, setAvDay] = useState<number | null>(0);
  const [avDate, setAvDate] = useState("");
  const [avStart, setAvStart] = useState("18:00");
  const [avEnd, setAvEnd] = useState("19:00");
  const [avSaving, setAvSaving] = useState(false);

  useEffect(() => {
    if (activeSection === "attendance") fetchTeacherAttendance().catch(() => {});
    if (activeSection === "chat") fetchTeacherChatThreads().catch(() => {});
    if (activeSection === "sessions") {
      fetchTeacherAvailability().catch(() => {});
      fetchTeacherBookings().catch(() => {});
    }
  }, [activeSection]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAddAvailability(e: React.FormEvent) {
    e.preventDefault();
    setAvSaving(true);
    try {
      await addTeacherAvailability({
        dayOfWeek: avDate ? null : avDay,
        specificDate: avDate || null,
        startTime: avStart,
        endTime: avEnd,
      });
      setAvDate("");
    } finally {
      setAvSaving(false);
    }
  }

  const selectedStudent = teacherStudents.find((s) => s.id === selectedStudentId) ?? null;
  const groups = Array.from(new Set(teacherStudents.map((s) => s.groupName).filter(Boolean))) as string[];

  async function handleCreateHomework(e: React.FormEvent) {
    e.preventDefault();
    setHwSaving(true);
    try {
      await createHomework({
        title: hwTitle,
        ...(hwDesc ? { description: hwDesc } : {}),
        ...(hwHebrew ? { hebrewText: hwHebrew } : {}),
        ...(hwStudentId ? { studentId: hwStudentId } : {}),
        ...(hwGroup ? { groupName: hwGroup } : {}),
        ...(hwDue ? { dueDate: hwDue } : {}),
      });
      setHwTitle(""); setHwDesc(""); setHwHebrew(""); setHwStudentId(""); setHwGroup(""); setHwDue("");
      setShowHwForm(false);
    } finally {
      setHwSaving(false);
    }
  }

  async function handleLoadReport(studentId: string) {
    setReportStudentId(studentId);
    setReportLoading(true);
    setReport(null);
    try {
      const r = await fetchStudentReport(studentId);
      setReport(r);
      if (r) {
        const drafts: Record<string, { score: string; notes: string }> = {};
        for (const key of Object.keys(SKILL_LABELS)) {
          const s = r.skills[key];
          drafts[key] = { score: s ? String(s.score) : "", notes: s?.notes ?? "" };
        }
        setSkillDrafts(drafts);
      }
    } finally {
      setReportLoading(false);
    }
  }

  async function handleSaveSkill(skill: string) {
    if (!reportStudentId) return;
    const d = skillDrafts[skill];
    const score = Number(d?.score);
    if (!d || Number.isNaN(score) || score < 0 || score > 100) return;
    setSkillSaving(skill);
    try {
      await updateStudentSkill(reportStudentId, { skill, score, ...(d.notes ? { notes: d.notes } : {}) });
      await handleLoadReport(reportStudentId);
    } finally {
      setSkillSaving(null);
    }
  }

  async function handleCreateSchedule(e: React.FormEvent) {
    e.preventDefault();
    setScSaving(true);
    try {
      await createTeacherSchedule({
        title: scTitle,
        dayOfWeek: scDay,
        startTime: scStart,
        endTime: scEnd,
        location: scLocation,
        ...(scGroup ? { groupName: scGroup } : {}),
        ...(scLocation === "online" && scUrl ? { meetingUrl: scUrl } : {}),
        ...(scDesc ? { description: scDesc } : {}),
      });
      setScTitle(""); setScGroup(""); setScDay(0); setScStart("18:00"); setScEnd("19:30");
      setScLocation("online"); setScUrl(""); setScDesc(""); setShowScForm(false);
    } finally {
      setScSaving(false);
    }
  }

  async function openStudentChat(studentId: string) {
    setChatStudentId(studentId);
    setChatMsgs(await fetchTeacherChatThread(studentId));
  }

  async function handleTeacherChatSend(e: React.FormEvent) {
    e.preventDefault();
    if (!chatReply.trim() || !chatStudentId) return;
    setChatSending(true);
    try {
      await sendTeacherChatReply(chatStudentId, chatReply.trim());
      setChatReply("");
      setChatMsgs(await fetchTeacherChatThread(chatStudentId));
      await fetchTeacherChatThreads();
    } finally {
      setChatSending(false);
    }
  }

  return (
    <AppShell
      role="TEACHER"
      activeSection={activeSection}
      onSelectSection={(s) => setActiveSection(s as TeacherSection)}
    >
      <PageHeader
        title="لوحة المدرس"
        subtitle="طلابك المسجلون وتقدمهم · الماتيريال المرسلة من الإدارة · الامتحانات والنتائج"
      />

      {activeSection === "students" && (
        <>
        <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
          <Card>
            <h2 className="mb-3 font-bold">طلابي المسجلون ({teacherStudents.length})</h2>
            <div className="relative">
              <Search className="absolute right-3 top-3 size-4 text-muted-foreground" />
              <input
                className="w-full rounded-md border border-input bg-background/60 py-2.5 pe-10 ps-3 text-sm outline-none"
                placeholder="ابحث عن طالب"
              />
            </div>
            <div className="mt-4 space-y-2">
              {teacherStudents.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  لا يوجد طلاب مربوطون بك حالياً — تتم الربط من لوحة الإدارة.
                </div>
              ) : (
                teacherStudents.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStudentId(s.id)}
                    className={`flex w-full items-center gap-3 rounded-md p-3 text-right ${
                      selectedStudentId === s.id
                        ? "bg-brand/10 ring-1 ring-brand/20"
                        : "bg-muted/60"
                    }`}
                  >
                    <span className="grid size-10 place-items-center rounded-full bg-brand2/15 text-brand2">
                      {s.fullName[0]}
                    </span>
                    <span className="flex-1">
                      <b className="text-sm">{s.fullName}</b>
                      <small className="block text-muted-foreground">
                        {s.phone ?? s.email ?? "—"} · المستوى: {s.level ?? "غير محدد"}
                      </small>
                    </span>
                  </button>
                ))
              )}
            </div>
          </Card>
          <Card>
            {selectedStudent ? (
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold">{selectedStudent.fullName}</h2>
                    <p className="text-xs text-muted-foreground">{selectedStudent.phone ?? selectedStudent.email ?? "—"}</p>
                  </div>
                  <Badge tone="brand">المستوى: {selectedStudent.level ?? "غير محدد"}</Badge>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-md bg-muted/60 p-4 text-center">
                    <small className="text-muted-foreground">امتحانات محلولة</small>
                    <b className="mt-1 block font-lat text-2xl">{selectedStudent.examsTaken}</b>
                  </div>
                  <div className="rounded-md bg-muted/60 p-4 text-center">
                    <small className="text-muted-foreground">متوسط الدرجات</small>
                    <b className="mt-1 block font-lat text-2xl text-brand">
                      {selectedStudent.avgScore !== null ? `${selectedStudent.avgScore}%` : "—"}
                    </b>
                  </div>
                  <div className="rounded-md bg-muted/60 p-4 text-center">
                    <small className="text-muted-foreground">المجموعة</small>
                    <b className="mt-1 block text-sm">{selectedStudent.groupName ?? "—"}</b>
                  </div>
                </div>
                {selectedStudent.examsTaken > 0 && (
                  <div className="mt-5">
                    <small className="mb-1 block text-muted-foreground">نسبة التقدم في الامتحانات</small>
                    <ProgressBar value={selectedStudent.avgScore ?? 0} tone="brand" />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center py-16 text-sm text-muted-foreground">
                اختر طالباً من القائمة لعرض تقدمه
              </div>
            )}
          </Card>
        </div>

        <div className="mt-4">
          <LeaderboardCard entries={leaderboard} />
        </div>
        </>
      )}

      {activeSection === "materials" && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold">الكورسات والملفات المرسلة لك من الإدارة</h2>
              <p className="text-xs text-muted-foreground">
                اضغط على أي مادة لفتحها وتشغيلها داخل المنصة مباشرة
              </p>
            </div>
            <Badge tone="brand">{materials.length} مادة</Badge>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {materials.length === 0 ? (
              <div className="col-span-2 rounded-md bg-muted/60 p-6 text-center text-sm text-muted-foreground">
                لا توجد كورسات أو ملفات مخصصة لك حتى الآن.
              </div>
            ) : (
              materials.map((mat) => (
                <div
                  key={mat.id}
                  className="flex flex-col rounded-md border border-border bg-background/60 p-4"
                >
                  <div className="flex items-center justify-between">
                    <Badge tone={mat.type === "VIDEO" ? "brand" : "gold"}>
                      {mat.type === "VIDEO" ? "فيديو" : mat.type === "AUDIO" ? "صوتي" : "ملف"}
                    </Badge>
                    <div className="flex gap-1.5">
                      <Badge tone="sage">مستوى {mat.level}</Badge>
                      <Badge tone={mat.status === "PUBLISHED" ? "sage" : "muted"}>
                        {mat.status === "PUBLISHED" ? "منشور" : "مسودة"}
                      </Badge>
                    </div>
                  </div>
                  <h3 className="mt-3 font-bold">{mat.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{mat.description}</p>
                  <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                    {mat.fileName} · {mat.fileSize}
                  </div>
                  <Button
                    variant="secondary"
                    className="mt-3 w-full text-xs"
                    onClick={() =>
                      setOpenMaterialId(openMaterialId === mat.id ? null : mat.id)
                    }
                  >
                    {openMaterialId === mat.id ? "إغلاق" : "فتح المادة في المنصة"}
                  </Button>
                  {openMaterialId === mat.id && (
                    <div className="mt-3">
                      <MaterialPlayer material={mat} />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {activeSection === "exams" && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">الامتحانات المخصصة لك من الإدارة</h2>
                <p className="text-xs text-muted-foreground">
                  تظهر تلقائياً لطلابك المربوطين بك عند نشرها
                </p>
              </div>
              <Badge tone="brand">{exams.length} امتحان</Badge>
            </div>

            <div className="mt-4 space-y-3">
              {exams.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  لا توجد امتحانات مخصصة لك حالياً.
                </div>
              ) : (
                exams.map((exam) => (
                  <div
                    key={exam.id}
                    className="rounded-md border border-border bg-background/60 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="grid size-9 place-items-center rounded-md bg-brand/10 text-brand">
                          <FileCheck className="size-4" />
                        </span>
                        <div>
                          <b className="text-sm">{exam.title}</b>
                          <small className="block text-muted-foreground">
                            {exam.description || "بدون وصف"}
                          </small>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone="gold">{EXAM_TYPE_LABELS[exam.type]}</Badge>
                        <Badge tone={exam.status === "PUBLISHED" ? "sage" : "muted"}>
                          {exam.status === "PUBLISHED" ? "منشور" : "مسودة"}
                        </Badge>
                        <Badge tone="muted">{exam.resultsCount ?? 0} تسليم</Badge>
                        <Button
                          variant="secondary"
                          className="min-h-8 px-3 py-1 text-xs"
                          onClick={() => {
                            if (openExamId === exam.id) {
                              setOpenExamId(null);
                            } else {
                              setOpenExamId(exam.id);
                              fetchExamResults(exam.id).catch(() => {});
                            }
                          }}
                        >
                          {openExamId === exam.id ? "إخفاء النتائج" : "عرض نتائج الطلاب"}
                        </Button>
                      </div>
                    </div>

                    {openExamId === exam.id && (
                      <TeacherExamResults exam={exam} onGrade={gradeExamResult} />
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {activeSection === "schedule" && (
        <div className="space-y-4">
          <Card>
            <div>
              <h2 className="text-lg font-bold">المحاضرات المباشرة ({teacherLectures.length})</h2>
              <p className="text-xs text-muted-foreground">
                المحاضرات التي يحددها لك الأدمن — يمكنك المشاركة عبر رابط الاجتماع
              </p>
            </div>
            <div className="mt-4 space-y-2">
              {teacherLectures.length === 0 ? (
                <div className="rounded-md bg-muted/60 p-6 text-center text-sm text-muted-foreground">
                  لا توجد محاضرات مجدولة لك حالياً.
                </div>
              ) : (
                teacherLectures.map((l) => (
                  <div key={l.id} className="rounded-md border border-border bg-background/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <b className="text-sm">{l.title}</b>
                          <Badge tone={l.status === "live" ? "sage" : "brand"}>
                            {l.status === "live" ? "مباشر الآن" : "مجدولة"}
                          </Badge>
                          {l.level && <Badge tone="muted">مستوى {l.level}</Badge>}
                          {l.groupName && <Badge tone="muted">{l.groupName}</Badge>}
                        </div>
                        <small className="mt-1 block text-muted-foreground">
                          {new Date(l.startsAt).toLocaleString("ar-EG")}
                          {l.endsAt ? ` → ${new Date(l.endsAt).toLocaleString("ar-EG")}` : ""}
                        </small>
                        {l.description && <p className="mt-1 text-xs text-muted-foreground">{l.description}</p>}
                      </div>
                      {l.meetingUrl && (
                        <a
                          href={l.meetingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand/20"
                        >
                          دخول الاجتماع ↗
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-bold">المواعيد الأسبوعية ({teacherSchedules.length})</h2>
            <p className="text-xs text-muted-foreground">المواعيد الثابتة الأسبوعية — يديرها الأدمن</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {teacherSchedules.length === 0 ? (
                <div className="col-span-2 rounded-md bg-muted/60 p-6 text-center text-sm text-muted-foreground">
                  لا توجد مواعيد أسبوعية.
                </div>
              ) : (
                teacherSchedules.map((s) => (
                  <div key={s.id} className="rounded-md border border-border bg-background/60 p-4">
                    <div className="flex items-center justify-between">
                      <b className="text-sm">{s.title}</b>
                      <Badge tone={s.location === "online" ? "brand" : "gold"}>
                        {s.location === "online" ? "أونلاين" : "أوفلاين"}
                      </Badge>
                    </div>
                    <small className="mt-1 block text-muted-foreground">
                      {DAY_NAMES[s.dayOfWeek]} · {s.startTime}–{s.endTime}
                      {s.groupName && ` · مجموعة ${s.groupName}`}
                    </small>
                    {s.meetingUrl && (
                      <a
                        href={s.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block rounded-md bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand"
                      >
                        رابط Zoom
                      </a>
                    )}
                    {s.description && (
                      <p className="mt-2 text-xs text-muted-foreground">{s.description}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {activeSection === "chat" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <h2 className="text-lg font-bold">محادثات الطلاب ({teacherChatThreads.length})</h2>
            <div className="mt-4 space-y-2">
              {teacherChatThreads.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">لا توجد محادثات بعد.</div>
              ) : (
                teacherChatThreads.map((t) => (
                  <button
                    key={t.student.id}
                    type="button"
                    onClick={() => openStudentChat(t.student.id)}
                    className={`w-full rounded-md border p-3 text-right transition-colors ${
                      chatStudentId === t.student.id
                        ? "border-brand bg-brand/5"
                        : "border-border bg-background/60 hover:border-brand/40"
                    }`}
                  >
                    <b className="block text-sm">{t.student.fullName}</b>
                    <small className="block truncate text-muted-foreground">
                      {t.lastMessage ? `${t.lastMessage.content}` : "بدون رسائل"}
                    </small>
                  </button>
                ))
              )}
            </div>
          </Card>

          <Card className="lg:col-span-2">
            {!chatStudentId ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                اختر محادثة من القائمة لعرض الرسائل والرد على الطالب.
              </div>
            ) : (
              <>
                <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-md bg-muted/40 p-3">
                  {chatMsgs.map((m) => (
                    <div
                      key={m.id}
                      className={`max-w-[80%] rounded-md p-2.5 text-sm ${
                        m.fromRole === "TEACHER" ? "ms-auto bg-brand/10" : "bg-background"
                      }`}
                    >
                      <small className="block text-[10px] text-muted-foreground">
                        {m.fromRole === "STUDENT" ? "الطالب" : "أنت"} ·{" "}
                        {new Date(m.createdAt).toLocaleString("ar-EG")}
                      </small>
                      <p className="mt-0.5">{m.content}</p>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleTeacherChatSend} className="mt-3 flex gap-2">
                  <Input
                    value={chatReply}
                    onChange={(e) => setChatReply(e.target.value)}
                    placeholder="اكتب ردك للطالب..."
                    className="flex-1"
                  />
                  <Button type="submit" disabled={chatSending || !chatReply.trim()}>إرسال</Button>
                </form>
              </>
            )}
          </Card>
        </div>
      )}

      {activeSection === "homework" && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">الواجبات</h2>
                <p className="text-xs text-muted-foreground">واجبات تنشئها لطلابك أو لمجموعة كاملة</p>
              </div>
              <Button variant="secondary" className="text-xs" onClick={() => setShowHwForm(!showHwForm)}>
                {showHwForm ? "إلغاء" : "+ واجب جديد"}
              </Button>
            </div>

            {showHwForm && (
              <form onSubmit={handleCreateHomework} className="mt-4 space-y-3 rounded-md border border-border bg-muted/40 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>عنوان الواجب</Label>
                    <Input value={hwTitle} onChange={(e) => setHwTitle(e.target.value)} required placeholder="مثال: ترجمة الفقرة" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>تاريخ التسليم (اختياري)</Label>
                    <Input type="date" value={hwDue} onChange={(e) => setHwDue(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>طالب معين (اختياري — بدونه = المجموعة)</Label>
                    <select value={hwStudentId} onChange={(e) => setHwStudentId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                      <option value="">— كل المجموعة / طالب محدد —</option>
                      {teacherStudents.map((s) => (
                        <option key={s.id} value={s.id}>{s.fullName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>المجموعة (اختياري)</Label>
                    <select value={hwGroup} onChange={(e) => setHwGroup(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                      <option value="">— اختر المجموعة —</option>
                      {groups.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>الوصف / التعليمات</Label>
                    <textarea value={hwDesc} onChange={(e) => setHwDesc(e.target.value)} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="شرح الواجب للطالب" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>نص عبري (اختياري)</Label>
                    <textarea value={hwHebrew} onChange={(e) => setHwHebrew(e.target.value)} rows={3} dir="rtl" className="w-full rounded-md border border-input bg-background px-3 py-2 font-he text-sm" placeholder="פסקה בעברית..." />
                    {hwHebrew && <HebrewTTS text={hwHebrew} label="معاينة الصوت" />}
                  </div>
                </div>
                <Button type="submit" disabled={hwSaving}>{hwSaving ? "جاري الحفظ..." : "إنشاء الواجب"}</Button>
              </form>
            )}
          </Card>

          <Card>
            <h2 className="text-lg font-bold">قائمة الواجبات ({teacherHomework.length})</h2>
            <div className="mt-4 space-y-3">
              {teacherHomework.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">لا توجد واجبات بعد.</div>
              ) : (
                teacherHomework.map((hw) => (
                  <div key={hw.id} className="rounded-md border border-border bg-background/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <b className="text-sm">{hw.title}</b>
                        <small className="block text-muted-foreground">
                          {hw.student ? `للطالب: ${hw.student.fullName}` : hw.groupName ? `مجموعة ${hw.groupName}` : "للمجموعة"}
                          {hw.dueDate && ` · تسليم: ${new Date(hw.dueDate).toLocaleDateString("ar-EG")}`}
                        </small>
                      </div>
                      <Badge tone="muted">{hw.submissions?.length ?? 0} تسليم</Badge>
                    </div>
                    {hw.description && <p className="mt-2 text-xs text-muted-foreground">{hw.description}</p>}
                    {hw.hebrewText && (
                      <div className="mt-2">
                        <p dir="rtl" className="rounded-md bg-muted/60 p-2 font-he text-xs leading-6">{hw.hebrewText}</p>
                        <HebrewTTS text={hw.hebrewText} label="استمع للنص" />
                      </div>
                    )}
                    <div className="mt-3 space-y-2 border-t border-border pt-3">
                      {(hw.submissions ?? []).length === 0 && !hw.submissionText ? (
                        <p className="py-2 text-center text-xs text-muted-foreground">لا توجد تسليمات من الطلاب بعد.</p>
                      ) : (
                        (hw.submissions ?? []).map((sub) => (
                          <div key={sub.id} className="rounded-md border border-border/60 bg-muted/30 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <b className="text-xs">{sub.student?.fullName ?? "طالب"}</b>
                              <div className="flex items-center gap-2">
                                <Badge tone={sub.status === "graded" ? "sage" : sub.status === "late" ? "danger" : "gold"}>
                                  {sub.status === "graded" ? "مُصحّح" : sub.status === "late" ? "متأخر" : "مُسلَّم"}
                                </Badge>
                                {sub.grade !== null && sub.grade !== undefined && <Badge tone="brand">{sub.grade}%</Badge>}
                              </div>
                            </div>
                            {sub.submissionText && <p className="mt-2 text-xs text-muted-foreground">{sub.submissionText}</p>}
                            {sub.audioUrl && <audio controls src={mediaSrc(sub.audioUrl)} className="mt-2 w-full" />}
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <Input
                                type="number" min={0} max={100} placeholder="الدرجة"
                                value={hwDrafts[sub.id]?.grade ?? (sub.grade?.toString() ?? "")}
                                onChange={(e) => setHwDrafts((prev) => ({ ...prev, [sub.id]: { grade: e.target.value, feedback: prev[sub.id]?.feedback ?? sub.feedback ?? "" } }))}
                                className="h-8 w-24 text-xs"
                              />
                              <Input
                                placeholder="ملاحظة للطالب"
                                value={hwDrafts[sub.id]?.feedback ?? (sub.feedback ?? "")}
                                onChange={(e) => setHwDrafts((prev) => ({ ...prev, [sub.id]: { grade: prev[sub.id]?.grade ?? sub.grade?.toString() ?? "", feedback: e.target.value } }))}
                                className="h-8 min-w-40 flex-1 text-xs"
                              />
                              <Button
                                variant="secondary" className="min-h-8 px-3 py-1 text-xs"
                                onClick={() => {
                                  const d = hwDrafts[sub.id];
                                  gradeHomeworkSubmission(sub.id, {
                                    ...(d?.grade ? { grade: Number(d.grade) } : {}),
                                    ...(d?.feedback ? { feedback: d.feedback } : {}),
                                  }).catch(() => {});
                                }}
                              >
                                حفظ التقييم
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                      {hw.submissionText && (hw.submissions ?? []).length === 0 && (
                        <div className="rounded-md bg-muted/60 p-2 text-xs">
                          <small className="text-muted-foreground">تسليم قديم:</small>
                          <p className="mt-1">{hw.submissionText}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {activeSection === "attendance" && (
        <div className="space-y-4">
          <Card>
            <h3 className="font-bold">تسجيل حضور المحاضرة</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>الموعد / المحاضرة</Label>
                <select value={attScheduleId} onChange={(e) => setAttScheduleId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">— اختر الموعد —</option>
                  {teacherSchedules.map((s) => (
                    <option key={s.id} value={s.id}>{DAY_NAMES[s.dayOfWeek]} {s.startTime} — {s.title}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>التاريخ</Label>
                <Input type="date" value={attDate} onChange={(e) => setAttDate(e.target.value)} />
              </div>
            </div>

            {attScheduleId && (
              <div className="mt-4 space-y-2">
                {teacherStudents.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">لا يوجد طلاب مربوطون بك.</div>
                ) : (
                  teacherStudents.map((s) => {
                    const existing = teacherAttendance.find(
                      (a) => a.scheduleId === attScheduleId && a.studentId === s.id && a.date.slice(0, 10) === attDate,
                    );
                    return (
                      <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-background/60 p-3">
                        <div>
                          <b className="text-sm">{s.fullName}</b>
                          <small className="block text-muted-foreground">{s.phone ?? s.email ?? "—"}</small>
                        </div>
                        <div className="flex gap-1.5">
                          {(["present", "late", "absent", "excused"] as const).map((st) => (
                            <button
                              key={st}
                              onClick={() =>
                                recordTeacherAttendance({ scheduleId: attScheduleId, studentId: s.id, status: st, date: attDate }).catch(() => {})
                              }
                              className={`rounded-md px-2.5 py-1 text-xs transition ${
                                existing?.status === st
                                  ? st === "present" ? "bg-sage text-white"
                                    : st === "late" ? "bg-gold text-white"
                                    : st === "excused" ? "bg-brand text-white"
                                    : "bg-danger text-white"
                                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
                              }`}
                            >
                              {st === "present" ? "حاضر" : st === "absent" ? "غائب" : st === "late" ? "متأخر" : "معذور"}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-lg font-bold">سجل الحضور ({teacherAttendance.length})</h2>
            <div className="mt-4 space-y-2">
              {teacherAttendance.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">لا توجد سجلات حضور بعد.</div>
              ) : (
                teacherAttendance.slice(0, 50).map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-md border border-border bg-background/60 p-3">
                    <div>
                      <b className="text-sm">{a.student.fullName}</b>
                      <small className="block text-muted-foreground">
                        {a.schedule.title} · {new Date(a.date).toLocaleDateString("ar-EG")}
                        {a.notes && ` · ${a.notes}`}
                      </small>
                    </div>
                    <Badge tone={a.status === "present" ? "sage" : a.status === "late" ? "gold" : a.status === "excused" ? "brand" : "danger"}>
                      {a.status === "present" ? "حاضر" : a.status === "absent" ? "غائب" : a.status === "late" ? "متأخر" : "معذور"}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {activeSection === "reports" && (
        <div className="space-y-4">
          <Card>
            <h3 className="font-bold">تقرير طالب</h3>
            <div className="mt-3 flex items-center gap-3">
              <select
                value={reportStudentId}
                onChange={(e) => { if (e.target.value) handleLoadReport(e.target.value); }}
                className="flex h-10 max-w-sm flex-1 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">— اختر الطالب —</option>
                {teacherStudents.map((s) => (
                  <option key={s.id} value={s.id}>{s.fullName}</option>
                ))}
              </select>
            </div>
          </Card>

          {reportLoading && (
            <Card><div className="py-8 text-center text-sm text-muted-foreground">جاري تحميل التقرير...</div></Card>
          )}

          {report && !reportLoading && (
            <>
              <div className="grid gap-3 sm:grid-cols-4">
                <Card className="p-3 text-center">
                  <small className="text-muted-foreground">متوسط الدرجات</small>
                  <b className="mt-1 block font-lat text-2xl text-brand">{report.avgScore !== null ? `${report.avgScore}%` : "—"}</b>
                </Card>
                <Card className="p-3 text-center">
                  <small className="text-muted-foreground">امتحانات محلولة</small>
                  <b className="mt-1 block font-lat text-2xl">{report.examsTaken}</b>
                </Card>
                <Card className="p-3 text-center">
                  <small className="text-muted-foreground">نسبة الحضور</small>
                  <b className="mt-1 block font-lat text-2xl text-sage">{report.attendanceRate !== null ? `${report.attendanceRate}%` : "—"}</b>
                </Card>
                <Card className="p-3 text-center">
                  <small className="text-muted-foreground">حالة الطالب</small>
                  <b className="mt-1 block text-sm">{STUDENT_STATUSES[report.student.studentStatus] ?? report.student.studentStatus}</b>
                </Card>
              </div>

              <Card>
                <h3 className="font-bold">تقييم المهارات الأربع</h3>
                <p className="text-xs text-muted-foreground">استماع · تحدث · قراءة · كتابة — مع ملاحظات على النطق والقواعد والطلاقة</p>
                <div className="mt-4 space-y-3">
                  {Object.entries(SKILL_LABELS).map(([key, label]) => (
                    <div key={key} className="rounded-md border border-border bg-background/60 p-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <b className="w-16 text-sm">{label}</b>
                        <Input
                          type="number" min={0} max={100} placeholder="0–100"
                          value={skillDrafts[key]?.score ?? ""}
                          onChange={(e) => setSkillDrafts((prev) => ({ ...prev, [key]: { score: e.target.value, notes: prev[key]?.notes ?? "" } }))}
                          className="h-8 w-24 text-xs"
                        />
                        <Input
                          placeholder="ملاحظات (نطق، قواعد، طلاقة...)"
                          value={skillDrafts[key]?.notes ?? ""}
                          onChange={(e) => setSkillDrafts((prev) => ({ ...prev, [key]: { score: prev[key]?.score ?? "", notes: e.target.value } }))}
                          className="h-8 min-w-40 flex-1 text-xs"
                        />
                        <Button
                          variant="secondary" className="min-h-8 px-3 py-1 text-xs"
                          disabled={skillSaving === key}
                          onClick={() => handleSaveSkill(key)}
                        >
                          {skillSaving === key ? "جاري الحفظ..." : "حفظ"}
                        </Button>
                      </div>
                      {report.skills[key] && (
                        <div className="mt-2">
                          <ProgressBar value={report.skills[key].score} tone={report.skills[key].score >= 70 ? "sage" : report.skills[key].score >= 50 ? "gold" : "danger"} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              {report.weakAreas.length > 0 && (
                <Card>
                  <h3 className="font-bold text-danger">نقاط تحتاج تحسين</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {report.weakAreas.map((w) => (
                      <Badge key={w.skill} tone="danger">{SKILL_LABELS[w.skill] ?? w.skill}: {w.score}%</Badge>
                    ))}
                  </div>
                </Card>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <h3 className="font-bold">آخر نتائج الامتحانات</h3>
                  <div className="mt-3 space-y-2">
                    {report.recentResults.length === 0 ? (
                      <p className="text-sm text-muted-foreground">لا توجد نتائج.</p>
                    ) : (
                      report.recentResults.map((r, i) => (
                        <div key={i} className="flex items-center justify-between rounded-md bg-muted/60 p-2.5 text-sm">
                          <span>{r.exam.title} <small className="text-muted-foreground">({EXAM_TYPE_LABELS[r.exam.type] ?? r.exam.type})</small></span>
                          <Badge tone={r.score !== null && r.score >= 50 ? "sage" : "danger"}>{r.score !== null ? `${r.score}%` : "لم تُقيّم"}</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
                <Card>
                  <h3 className="font-bold">واجبات الطالب</h3>
                  <div className="mt-3 space-y-2">
                    {report.homework.length === 0 ? (
                      <p className="text-sm text-muted-foreground">لا توجد واجبات.</p>
                    ) : (
                      report.homework.map((h, i) => (
                        <div key={i} className="flex items-center justify-between rounded-md bg-muted/60 p-2.5 text-sm">
                          <span>{h.title}</span>
                          <div className="flex items-center gap-2">
                            <Badge tone={h.status === "graded" ? "sage" : h.status === "submitted" ? "gold" : "muted"}>
                              {h.status === "graded" ? "مُصحّح" : h.status === "submitted" ? "مُسلَّم" : h.status === "late" ? "متأخر" : "مُكلَّف"}
                            </Badge>
                            {h.grade !== null && <Badge tone="brand">{h.grade}%</Badge>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      {activeSection === "sessions" && (
        <div className="space-y-4">
          {/* Availability form */}
          <Card>
            <h3 className="font-bold">إضافة موعد متاح للحجز</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              المواعيد الأسبوعية تتكرر كل أسبوع — أو حدد تاريخ محدد لموعد لمرة واحدة.
            </p>
            <form onSubmit={handleAddAvailability} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label>النوع</Label>
                <select
                  value={avDate ? "date" : "weekly"}
                  onChange={(e) => { if (e.target.value === "date") { setAvDay(null); } else { setAvDate(""); setAvDay(0); } }}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="weekly">أسبوعي</option>
                  <option value="date">تاريخ محدد</option>
                </select>
              </div>
              {avDate ? (
                <div className="space-y-1.5">
                  <Label>التاريخ</Label>
                  <Input type="date" value={avDate} onChange={(e) => setAvDate(e.target.value)} required />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label>اليوم</Label>
                  <select value={avDay ?? 0} onChange={(e) => setAvDay(Number(e.target.value))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    {["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"].map((d, i) => (
                      <option key={i} value={i}>{d}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>من</Label>
                <Input type="time" value={avStart} onChange={(e) => setAvStart(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>إلى</Label>
                <Input type="time" value={avEnd} onChange={(e) => setAvEnd(e.target.value)} required />
              </div>
              <div className="sm:col-span-2 lg:col-span-4">
                <Button type="submit" disabled={avSaving}>{avSaving ? "جاري..." : "إضافة الموعد"}</Button>
              </div>
            </form>
          </Card>

          {/* Availability list */}
          <Card>
            <h3 className="font-bold">مواعيدي المتاحة</h3>
            <div className="mt-3 space-y-2">
              {teacherAvailability.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا توجد مواعيد متاحة — أضف موعداً ليحجز الطلاب.</p>
              ) : (
                teacherAvailability.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border border-[#eef2f9] bg-white px-4 py-3">
                    <div className="text-sm">
                      {a.specificDate ? (
                        <span>📅 {new Date(a.specificDate).toLocaleDateString("ar-EG")} </span>
                      ) : (
                        <span>🔁 {["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"][a.dayOfWeek ?? 0]} </span>
                      )}
                      <span className="text-muted-foreground"> {a.startTime} — {a.endTime}</span>
                      {!a.isActive && <Badge tone="muted" className="mr-2">معطّل</Badge>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => toggleTeacherAvailability(a.id)}>
                        {a.isActive ? "تعطيل" : "تفعيل"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { if (confirm("حذف هذا الموعد؟")) deleteTeacherAvailability(a.id); }}>
                        حذف
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Bookings */}
          <Card>
            <h3 className="font-bold">حجوزات الطلاب</h3>
            <div className="mt-3 space-y-2">
              {teacherBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا توجد حجوزات بعد.</p>
              ) : (
                teacherBookings.map((b) => {
                  const st: Record<string, { label: string; color: string }> = {
                    booked: { label: "محجوزة", color: "#0b2f6e" },
                    completed: { label: "مكتملة", color: "#2f9e4f" },
                    cancelled: { label: "ملغاة", color: "#c0392b" },
                    no_show: { label: "لم يحضر", color: "#e67e22" },
                  };
                  const s = st[b.status] ?? st.booked;
                  return (
                    <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#eef2f9] bg-white px-4 py-3">
                      <div>
                        <b className="text-sm text-[#0b2f6e]">{b.student?.fullName ?? "طالب"}</b>
                        <p className="text-xs text-muted-foreground">
                          {new Date(b.startsAt).toLocaleString("ar-EG", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                        </p>
                        {b.cancelReason && <p className="text-xs text-red-600">سبب الإلغاء: {b.cancelReason}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge style={{ background: s.color }}>{s.label}</Badge>
                        {b.status === "booked" && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => { if (confirm("تأكيد حضور الطالب؟")) setBookingStatus(b.id, "completed"); }}>
                              حضر
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { if (confirm("تأكيد غياب الطالب؟")) setBookingStatus(b.id, "no_show"); }}>
                              غاب
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { if (confirm("إلغاء الحصة؟ ستُرجع الحصة للطالب.")) teacherCancelBooking(b.id, "إلغاء من المدرس"); }}>
                              إلغاء
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

function TeacherExamResults({
  exam,
  onGrade,
}: {
  exam: Exam;
  onGrade: (id: string, input: { score?: number; feedback?: string }) => Promise<void>;
}) {
  const { examResults } = usePlatformStore();
  const [drafts, setDrafts] = useState<Record<string, { score: string; feedback: string }>>({});

  return (
    <div className="mt-4 space-y-3 border-t border-border pt-4">
      {exam.questions.audioUrl && (
        <div className="rounded-md bg-muted/60 p-3">
          <small className="mb-1 block text-muted-foreground">تسجيل الأدمن الصوتي للامتحان</small>
          <audio controls src={mediaSrc(exam.questions.audioUrl)} className="w-full" />
        </div>
      )}
      {exam.questions.paragraph && (
        <p dir="rtl" className="rounded-md bg-muted/60 p-3 font-he text-sm leading-7">
          {exam.questions.paragraph}
        </p>
      )}

      {examResults.length === 0 ? (
        <div className="py-6 text-center text-sm text-muted-foreground">
          لم يسلّم أي طالب هذا الامتحان بعد.
        </div>
      ) : (
        examResults.map((r) => (
          <div key={r.id} className="rounded-md border border-border bg-background p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <b className="text-sm">{r.student?.fullName ?? "طالب"}</b>
              <span className="text-xs text-muted-foreground">
                {new Date(r.submittedAt).toLocaleString("ar-EG")}
              </span>
            </div>

            {r.recordingUrl && (
              <div className="mt-2">
                <small className="mb-1 block text-muted-foreground">تسجيل الطالب الصوتي</small>
                <audio controls src={mediaSrc(r.recordingUrl)} className="w-full" />
              </div>
            )}

            {r.answers && Object.keys(r.answers).length > 0 && (
              <div className="mt-2 space-y-1.5">
                {Object.entries(r.answers).map(([k, v]) => (
                  <div key={k} className="rounded-sm bg-muted/60 px-3 py-1.5 text-xs">
                    <b className="text-muted-foreground">إجابة {Number(k) + 1}:</b> {v}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="الدرجة %"
                className="h-9 w-28"
                value={drafts[r.id]?.score ?? (r.score?.toString() ?? "")}
                onChange={(e) =>
                  setDrafts((p) => ({
                    ...p,
                    [r.id]: { score: e.target.value, feedback: p[r.id]?.feedback ?? "" },
                  }))
                }
              />
              <Input
                placeholder="ملاحظات للطالب"
                className="h-9 flex-1"
                value={drafts[r.id]?.feedback ?? (r.feedback ?? "")}
                onChange={(e) =>
                  setDrafts((p) => ({
                    ...p,
                    [r.id]: { score: p[r.id]?.score ?? "", feedback: e.target.value },
                  }))
                }
              />
              <Button
                variant="secondary"
                className="min-h-9 px-3 text-xs"
                onClick={() => {
                  const draft = drafts[r.id];
                  const payload: { score?: number; feedback?: string } = {};
                  const scoreVal = draft?.score ? Number(draft.score) : undefined;
                  const feedbackVal = draft?.feedback || undefined;
                  if (scoreVal !== undefined) payload.score = scoreVal;
                  if (feedbackVal) payload.feedback = feedbackVal;
                  onGrade(r.id, payload);
                }}
              >
                حفظ التقييم
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export type AdminSection =
  | "overview"
  | "teachers"
  | "students"
  | "sales"
  | "support"
  | "add-user"
  | "courses"
  | "exams"
  | "results"
  | "placement"
  | "packages"
  | "bookings"
  | "sessions"
  | "groups"
  | "free-lectures"
  | "placement-results"
  | "sales-report"
  | "leads"
  | "certificates"
  | "lectures"
  | "schedules";

export function AdminScreen() {
  const {
    users,
    materials,
    placementQuestions,
    exams,
    studentLinks,
    allExamResults,
    leaderboard,
    loadingData,
    addStaffUser,
    deleteUser,
    addCourseMaterial,
    deleteCourseMaterial,
    setMaterialStatus,
    addPlacementQuestion,
    deletePlacementQuestion,
    togglePlacementQuestion,
    addExam,
    setExamStatus,
    deleteExam,
    assignStudentToTeacher,
    unassignStudent,
    fetchAdminExamResults,
    adminGradeResult,
    adminPackages,
    adminLeads,
    salesReport,
    adminSubscriptions,
    adminCertificates,
    fetchAdminOps,
    createPackage,
    updatePackage,
    deletePackage,
    assignLead,
    issueCertificate,
    deleteCertificate,
    adminPaymentRequests,
    fetchAdminPaymentRequests,
    reviewPaymentRequest,
    placementResults,
    fetchPlacementResults,
    adminLectures,
    fetchAdminLectures,
    createAdminLecture,
    updateAdminLecture,
    deleteAdminLecture,
    adminSchedules,
    fetchAdminSchedules,
    createAdminSchedule,
    updateAdminSchedule,
    deleteAdminSchedule,
    // session bookings
    adminBookings,
    adminBookingsReport,
    fetchAdminBookings,
    fetchAdminBookingsReport,
    adminUpdateBooking,
    // groups
    adminGroups,
    groupMembers,
    fetchAdminGroups,
    createAdminGroup,
    updateAdminGroup,
    deleteAdminGroup,
    fetchGroupMembers,
    addGroupMembers,
    removeGroupMember,
    // admin teacher availability
    adminTeacherAvailability,
    fetchAdminTeacherAvailability,
    callsStudents,
    fetchCallsStudents,
    opsCreateBooking,
    freeStudents,
    freeLectures,
    fetchFreeStudents,
    createFreeStudent,
    deleteFreeStudent,
    fetchFreeLectures,
    createFreeLecture,
    updateFreeLecture,
    deleteFreeLecture,
    addFreeLectureFile,
    removeFreeLectureFile,
  } = usePlatformStore();

  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [bookingFilter, setBookingFilter] = useState<string>("");
  const [lectureFilter, setLectureFilter] = useState<string>("");

  useEffect(() => {
    if (activeSection === "bookings") fetchAdminPaymentRequests(bookingFilter).catch(() => {});
    if (activeSection === "placement-results") fetchPlacementResults().catch(() => {});
    if (activeSection === "lectures") fetchAdminLectures({ status: lectureFilter }).catch(() => {});
    if (activeSection === "schedules") fetchAdminSchedules().catch(() => {});
    if (activeSection === "sessions") {
      fetchAdminBookings().catch(() => {});
      fetchAdminBookingsReport().catch(() => {});
      fetchCallsStudents().catch(() => {});
    }
    if (activeSection === "groups") {
      fetchAdminGroups().catch(() => {});
    }
    if (activeSection === "free-lectures") {
      fetchFreeStudents().catch(() => {});
      fetchFreeLectures().catch(() => {});
      fetchAdminGroups().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, bookingFilter, lectureFilter]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [newUserRole, setNewUserRole] = useState<Exclude<UserRole, "STUDENT">>("TEACHER");
  const [specialty, setSpecialty] = useState("");
  const [userSuccess, setUserSuccess] = useState("");
  const [userError, setUserError] = useState("");

  const teachers = users.filter((u) => u.role === "TEACHER");
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDesc, setCourseDesc] = useState("");
  const [courseLevel, setCourseLevel] = useState<"A1" | "A2" | "B1" | "B2">("B1");
  const [courseType, setCourseType] = useState<MaterialType>("VIDEO");
  const [courseStatus, setCourseStatus] = useState<PublishStatus>("DRAFT");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extraAttachments, setExtraAttachments] = useState<MaterialAttachment[]>([]);
  const [courseUploading, setCourseUploading] = useState(false);
  const [openMaterialId, setOpenMaterialId] = useState<string | null>(null);
  const [courseSuccess, setCourseSuccess] = useState("");
  const [courseError, setCourseError] = useState("");

  const activeTeacherId = teachers.some((t) => t.id === selectedTeacherId)
    ? selectedTeacherId
    : (teachers[0]?.id ?? "");

  const [examTitle, setExamTitle] = useState("");
  const [examDesc, setExamDesc] = useState("");
  const [examType, setExamType] = useState<ExamType>("translation");
  const [examTeacherId, setExamTeacherId] = useState<string>("");
  const [examStatus, setExamStatusSel] = useState<PublishStatus>("DRAFT");
  const [examParagraph, setExamParagraph] = useState("");
  const [examItemsText, setExamItemsText] = useState("");
  const [examAudioUrl, setExamAudioUrl] = useState("");
  const [examAudioFile, setExamAudioFile] = useState<File | null>(null);
  const [examRecordedBlob, setExamRecordedBlob] = useState<Blob | null>(null);
  const [examQuestions, setExamQuestions] = useState<ExamQuestionItem[]>([]);
  const [examSubmitting, setExamSubmitting] = useState(false);
  const [examSuccess, setExamSuccess] = useState("");
  const [examError, setExamError] = useState("");

  const activeExamTeacherId = teachers.some((t) => t.id === examTeacherId)
    ? examTeacherId
    : (teachers[0]?.id ?? "");

  const studentsList = users.filter((u) => u.role === "STUDENT");
  const [assignStudentId, setAssignStudentId] = useState("");
  const [assignTeacherId, setAssignTeacherId] = useState("");
  const [assignMsg, setAssignMsg] = useState("");
  const [assignError, setAssignError] = useState("");

  const [qSection, setQSection] = useState<PlacementSection>("قراءة");
  const [qLevel, setQLevel] = useState<"A1" | "A2" | "B1" | "B2">("B1");
  const [qType, setQType] = useState<"mcq" | "truefalse" | "text">("mcq");
  const [qPromptAr, setQPromptAr] = useState("");
  const [qHebrewText, setQHebrewText] = useState("");
  const [opt1, setOpt1] = useState("");
  const [opt2, setOpt2] = useState("");
  const [opt3, setOpt3] = useState("");
  const [opt4, setOpt4] = useState("");
  const [correctIdx, setCorrectIdx] = useState(0);
  const [qTrueFalse, setQTrueFalse] = useState(true); // for truefalse: true = صح
  const [qExpected, setQExpected] = useState("");    // for text: expected answer
  const [questionSuccess, setQuestionSuccess] = useState("");
  const [questionError, setQuestionError] = useState("");

  const counts = {
    teachers: users.filter((u) => u.role === "TEACHER").length,
    students: users.filter((u) => u.role === "STUDENT").length,
    sales: users.filter((u) => u.role === "SALES").length,
    support: users.filter((u) => u.role === "SUPPORT").length,
  };

  const roleData = [
    { name: "طلاب", value: counts.students, color: "var(--brand)" },
    { name: "مدرسون", value: counts.teachers, color: "var(--sage)" },
    { name: "مبيعات", value: counts.sales, color: "var(--gold)" },
    { name: "دعم", value: counts.support, color: "var(--brand2)" },
  ].filter((r) => r.value > 0);

  const growthData = (() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      return {
        label: d.toLocaleDateString("ar-EG", { month: "short" }),
        total: users.filter((u) => new Date(u.createdAt) < end).length,
      };
    });
  })();

  async function handleCreateStaff(e: React.FormEvent) {
    e.preventDefault();
    setUserError("");
    setUserSuccess("");
    try {
      await addStaffUser({
        fullName,
        phone,
        password: password || "עברית שוטפת@1234",
        role: newUserRole,
        ...(specialty ? { specialty } : {}),
      });
      setFullName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setSpecialty("");
      setUserSuccess(`تم إضافة حساب (${ROLE_LABELS[newUserRole]}) في قاعدة البيانات بنجاح.`);
    } catch (err) {
      setUserError(err instanceof Error ? err.message : "فشل إضافة المستخدم");
    }
  }

  async function handleUploadCourse(e: React.FormEvent) {
    e.preventDefault();
    setCourseError("");
    setCourseSuccess("");
    if (!activeTeacherId) {
      setCourseError("يرجى إضافة مدرس أولاً قبل رفع الكورسات");
      return;
    }

    setCourseUploading(true);
    try {
      let storageUrl = "";
      let fileName = selectedFile?.name ?? "";
      let fileSize = "";

      if (selectedFile) {
        const uploaded = await uploadFile(selectedFile, "courses");
        storageUrl = uploaded.url;
        fileSize = `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`;
      } else {
        fileName =
          fileName ||
          `${courseTitle.slice(0, 18).replace(/\s+/g, "-")}.${
            courseType === "VIDEO" ? "mp4" : courseType === "AUDIO" ? "mp3" : "pdf"
          }`;
        storageUrl = `${SERVER_CONFIG.storageServerUrl}/courses/${fileName}`;
        fileSize = courseType === "VIDEO" ? "120 MB" : "8.5 MB";
      }

      // Upload any extra attachments (video + document + audio combos)
      const finalAttachments: MaterialAttachment[] = [...extraAttachments];

      await addCourseMaterial({
        title: courseTitle,
        description: courseDesc || "مادة تدريبية مرفوعة من الإدارة",
        level: courseLevel,
        type: courseType,
        fileName,
        fileSize,
        assignedTeacherId: activeTeacherId,
        storageUrl,
        status: courseStatus,
        ...(finalAttachments.length > 0 ? { attachments: finalAttachments } : {}),
      });

      setCourseTitle("");
      setCourseDesc("");
      setSelectedFile(null);
      setExtraAttachments([]);
      setCourseSuccess(
        courseStatus === "PUBLISHED"
          ? "تم رفع الكورس ونشره — يظهر الآن للمدرس وللطلاب المربوطين به."
          : "تم رفع الكورس كمسودة (Draft) — لن يظهر للطلاب حتى تنشره.",
      );
    } catch (err) {
      setCourseError(err instanceof Error ? err.message : "فشل رفع الكورس");
    } finally {
      setCourseUploading(false);
    }
  }

  async function handleCreateExam(e: React.FormEvent) {
    e.preventDefault();
    setExamError("");
    setExamSuccess("");
    if (!activeExamTeacherId) {
      setExamError("يرجى إضافة مدرس أولاً قبل إنشاء الامتحانات");
      return;
    }

    setExamSubmitting(true);
    try {
      let audioUrl = examAudioUrl.trim();
      const audioBlob =
        examAudioFile ??
        (examRecordedBlob
          ? new File([examRecordedBlob], `exam-audio-${Date.now()}.webm`, {
              type: examRecordedBlob.type || "audio/webm",
            })
          : null);
      if (examType === "listening" && audioBlob) {
        const uploaded = await uploadFile(audioBlob, "audio");
        audioUrl = uploaded.url;
      }

      // Build items: structured questions take priority; fall back to text parsing
      let items: ExamQuestionItem[] = examQuestions;
      if (items.length === 0 && examItemsText.trim()) {
        items = examItemsText
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => {
            const [prompt, expected] = line.split("|").map((x) => x.trim());
            return { type: "text" as QuestionType, prompt: prompt ?? "", ...(expected ? { expected } : {}), points: 1 };
          });
      }

      await addExam({
        title: examTitle,
        description: examDesc,
        type: examType,
        questions: {
          ...(examParagraph ? { paragraph: examParagraph } : {}),
          ...(audioUrl ? { audioUrl } : {}),
          ...(items.length ? { items } : {}),
        },
        assignedTeacherId: activeExamTeacherId,
        status: examStatus,
      });

      setExamTitle("");
      setExamDesc("");
      setExamParagraph("");
      setExamItemsText("");
      setExamAudioUrl("");
      setExamAudioFile(null);
      setExamRecordedBlob(null);
      setExamQuestions([]);
      setExamSuccess(
        examStatus === "PUBLISHED"
          ? "تم إنشاء الامتحان ونشره — يظهر الآن للمدرس والطلاب المربوطين به."
          : "تم حفظ الامتحان كمسودة — فعّل زر النشر ليظهر للمدرس والطلاب.",
      );
    } catch (err) {
      setExamError(err instanceof Error ? err.message : "فشل إنشاء الامتحان");
    } finally {
      setExamSubmitting(false);
    }
  }

  async function handleAssignStudent(e: React.FormEvent) {
    e.preventDefault();
    setAssignMsg("");
    setAssignError("");
    if (!assignStudentId || !assignTeacherId) return;
    try {
      await assignStudentToTeacher(assignStudentId, assignTeacherId);
      setAssignStudentId("");
      setAssignTeacherId("");
      setAssignMsg("تم ربط الطالب بالمدرس — سيظهر له كل امتحانات وكورسات هذا المدرس.");
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : "فشل ربط الطالب");
    }
  }

  async function handleCreateQuestion(e: React.FormEvent) {
    e.preventDefault();
    setQuestionError("");
    setQuestionSuccess("");
    if (!qPromptAr.trim()) return;

    let options: string[] = [];
    let correctOptionIndex = 0;
    let expectedAnswer: string | undefined;

    if (qType === "mcq") {
      options = [opt1, opt2, opt3, opt4].map((o) => o.trim()).filter(Boolean);
      if (options.length < 2) {
        setQuestionError("أسئلة الاختيار تحتاج خيارين على الأقل");
        return;
      }
      correctOptionIndex = Math.min(correctIdx, options.length - 1);
    } else if (qType === "truefalse") {
      options = ["صح", "خطأ"];
      correctOptionIndex = qTrueFalse ? 0 : 1;
    } else {
      expectedAnswer = qExpected.trim();
      if (!expectedAnswer) {
        setQuestionError("سؤال النص يحتاج الإجابة المتوقعة");
        return;
      }
    }

    try {
      await addPlacementQuestion({
        section: qSection,
        promptAr: qPromptAr,
        hebrewText: qHebrewText,
        questionType: qType,
        options,
        correctOptionIndex,
        ...(expectedAnswer ? { expectedAnswer } : {}),
        levelTag: qLevel,
      });

      setQPromptAr("");
      setQHebrewText("");
      setOpt1("");
      setOpt2("");
      setOpt3("");
      setOpt4("");
      setCorrectIdx(0);
      setQTrueFalse(true);
      setQExpected("");
      setQuestionSuccess("تم نشر السؤال فوراً في اختبار تحديد المستوى بالصفحة الرئيسية.");
    } catch (err) {
      setQuestionError(err instanceof Error ? err.message : "فشل حفظ السؤال");
    }
  }

  function renderUsersTable(list: PlatformUser[], emptyText: string) {
    if (loadingData) {
      return <div className="py-12 text-center text-sm text-muted-foreground">جاري التحميل...</div>;
    }
    if (list.length === 0) {
      return <div className="py-12 text-center text-sm text-muted-foreground">{emptyText}</div>;
    }
    return (
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-right text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr>
              <th className="border-b border-border px-3 py-3 font-medium">الاسم</th>
              <th className="border-b border-border px-3 py-3 font-medium">البريد الإلكتروني</th>
              <th className="border-b border-border px-3 py-3 font-medium">رقم الهاتف</th>
              <th className="border-b border-border px-3 py-3 font-medium">الدور</th>
              <th className="border-b border-border px-3 py-3 font-medium">التفاصيل / المستوى</th>
              <th className="border-b border-border px-3 py-3 font-medium">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id} className="border-b border-border/60">
                <td className="px-3 py-3.5 font-semibold">{u.fullName}</td>
                <td className="px-3 py-3.5 font-lat text-xs text-muted-foreground">{u.email || "—"}</td>
                <td className="px-3 py-3.5 font-lat text-xs text-muted-foreground">
                  {u.phone || "—"}
                </td>
                <td className="px-3 py-3.5">
                  <Badge
                    tone={
                      u.role === "TEACHER"
                        ? "brand"
                        : u.role === "STUDENT"
                          ? "sage"
                          : u.role === "SALES"
                            ? "gold"
                            : "muted"
                    }
                  >
                    {ROLE_LABELS[u.role]}
                  </Badge>
                </td>
                <td className="px-3 py-3.5 text-xs text-muted-foreground">
                  {u.role === "STUDENT"
                    ? `المستوى: ${u.level ?? "غير محدد"}`
                    : (u.specialty ?? "—")}
                </td>
                <td className="px-3 py-3.5">
                  {u.role !== "ADMIN" && (
                    <button
                      onClick={async () => {
                        if (!confirm(`حذف المستخدم "${u.fullName}" نهائياً؟`)) return;
                        try {
                          await deleteUser(u.id);
                        } catch (err) {
                          alert(err instanceof Error ? err.message : "فشل حذف المستخدم");
                        }
                      }}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-danger/10 hover:text-danger"
                      title="حذف المستخدم"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <AppShell
      role="ADMIN"
      activeSection={activeSection}
      onSelectSection={(s) => setActiveSection(s as AdminSection)}
    >
      <PageHeader
        title="لوحة تحكم الإدارة"
        subtitle="إدارة المستخدمين والمحتوى والمحاضرات والجدول الأكاديمي"
      />

      {activeSection === "overview" && (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "المدرسون", sub: "في قاعدة البيانات", value: counts.teachers, icon: UsersRound, chip: "bg-brand/10 text-brand" },
              { label: "الطلاب المسجلون", sub: "تسجيل ذاتي", value: counts.students, icon: GraduationCap, chip: "bg-sage/15 text-sage" },
              { label: "فريق المبيعات", sub: "في قاعدة البيانات", value: counts.sales, icon: TicketCheck, chip: "bg-gold/15 text-gold" },
              { label: "خدمة العملاء", sub: "في قاعدة البيانات", value: counts.support, icon: Headphones, chip: "bg-brand2/10 text-brand2" },
            ].map((s) => (
              <Card key={s.label} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <b className="block font-lat text-2xl">{s.value}</b>
                    <small className="mt-0.5 block text-muted-foreground">{s.label}</small>
                    <span className="text-[11px] text-muted-foreground/70">{s.sub}</span>
                  </div>
                  <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${s.chip}`}>
                    <s.icon className="size-4.5" />
                  </span>
                </div>
              </Card>
            ))}
          </div>

          <div className="mb-4 grid gap-4 lg:grid-cols-[1fr_320px]">
            <Card>
              <h2 className="mb-3 text-base font-bold">نمو المستخدمين (آخر 6 أشهر)</h2>
              <div dir="ltr" className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData}>
                    <defs>
                      <linearGradient id="adminGrowth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={32} />
                    <Tooltip />
                    <Area type="monotone" dataKey="total" name="المستخدمون" stroke="var(--brand)" strokeWidth={3} fill="url(#adminGrowth)" dot={{ r: 3, fill: "var(--sage)", stroke: "var(--sage)" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card>
              <h2 className="mb-3 text-base font-bold">توزيع الأدوار</h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={roleData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={2} strokeWidth={0}>
                      {roleData.map((r) => (
                        <Cell key={r.name} fill={r.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
                {roleData.map((r) => (
                  <span key={r.name} className="flex items-center gap-1.5">
                    <i className="size-2.5 rounded-sm" style={{ background: r.color }} />
                    {r.name} ({r.value})
                  </span>
                ))}
              </div>
            </Card>
          </div>

          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <small className="text-muted-foreground">سيرفر VPS (API)</small>
                <Badge tone="sage">متصل</Badge>
              </div>
              <b className="mt-1 block font-lat text-sm">{SERVER_CONFIG.vpsServerIp}</b>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <small className="text-muted-foreground">سيرفر التخزين (Storage)</small>
                <Badge tone="brand">متصل</Badge>
              </div>
              <b className="mt-1 block font-lat text-sm">{SERVER_CONFIG.storageServerIp}</b>
            </Card>
          </div>

          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">جميع المستخدمين المسجلين في النظام</h2>
              <Button onClick={() => setActiveSection("add-user")}>
                <UserPlus className="size-4" />
                إضافة مستخدم جديد
              </Button>
            </div>
            {renderUsersTable(users, "لا يوجد مستخدمون في قاعدة البيانات حالياً.")}
          </Card>

          <div className="mt-4">
            <LeaderboardCard entries={leaderboard} />
          </div>
        </>
      )}

      {activeSection === "teachers" && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">قائمة المدرسين (Teachers)</h2>
              <p className="text-xs text-muted-foreground">
                جميع المدرسين المسجلين في قاعدة البيانات
              </p>
            </div>
            <Button
              onClick={() => {
                setNewUserRole("TEACHER");
                setActiveSection("add-user");
              }}
            >
              <Plus className="size-4" />
              إضافة مدرس جديد
            </Button>
          </div>
          {renderUsersTable(
            users.filter((u) => u.role === "TEACHER"),
            "لا يوجد مدرسون مضافون حالياً.",
          )}
        </Card>
      )}

      {activeSection === "students" && (
        <div className="space-y-4">
          <Card>
            <div>
              <h2 className="text-lg font-bold">قائمة الطلاب (Students)</h2>
              <p className="text-xs text-muted-foreground">
                الطلاب الذين قاموا بإنشاء حسابات عبر صفحة التسجيل في المنصة
              </p>
            </div>
            {renderUsersTable(
              users.filter((u) => u.role === "STUDENT"),
              "لا يوجد طلاب مسجلون حالياً.",
            )}
          </Card>

          <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
            <Card>
              <div className="flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-md bg-brand/10 text-brand">
                  <Link2 className="size-4" />
                </span>
                <div>
                  <h2 className="font-bold">ربط طالب بمدرس</h2>
                  <small className="text-muted-foreground">
                    الطالب المربوط يرى امتحانات وكورسات المدرس تلقائياً
                  </small>
                </div>
              </div>

              {assignMsg && (
                <div className="mt-3 rounded-md bg-sage/15 p-3 text-xs font-semibold text-sage">
                  {assignMsg}
                </div>
              )}
              {assignError && (
                <div className="mt-3 rounded-md bg-danger/10 p-3 text-xs font-semibold text-danger">
                  {assignError}
                </div>
              )}

              <form onSubmit={handleAssignStudent} className="mt-4 space-y-3">
                <div className="space-y-1.5">
                  <Label>الطالب</Label>
                  <select
                    value={assignStudentId}
                    onChange={(e) => setAssignStudentId(e.target.value)}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">اختر طالباً...</option>
                    {studentsList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} — {s.phone ?? s.email ?? "—"}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>المدرس</Label>
                  <select
                    value={assignTeacherId}
                    onChange={(e) => setAssignTeacherId(e.target.value)}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">اختر مدرساً...</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName} ({t.specialty ?? "مدرس"})
                      </option>
                    ))}
                  </select>
                </div>
                <Button type="submit" className="w-full" disabled={!assignStudentId || !assignTeacherId}>
                  <Link2 className="size-4" />
                  ربط الطالب بالمدرس
                </Button>
              </form>
            </Card>

            <Card>
              <h2 className="font-bold">الروابط الحالية (طالب ↔ مدرس)</h2>
              <div className="mt-4 space-y-2">
                {studentLinks.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    لا توجد روابط بين الطلاب والمدرسين حالياً.
                  </div>
                ) : (
                  studentLinks.map((l) => (
                    <div
                      key={l.id}
                      className="flex items-center justify-between rounded-md border border-border bg-background/60 p-3"
                    >
                      <div className="flex items-center gap-3 text-sm">
                        <Badge tone="sage">{l.student.fullName}</Badge>
                        <span className="text-muted-foreground">↔</span>
                        <Badge tone="brand">{l.teacher.fullName}</Badge>
                      </div>
                      <button
                        onClick={() => unassignStudent(l.id)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-danger/10 hover:text-danger"
                        title="إلغاء الربط"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeSection === "sales" && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">فريق المبيعات (Sales Users)</h2>
              <p className="text-xs text-muted-foreground">مستخدمو قسم المبيعات في المنصة</p>
            </div>
            <Button
              onClick={() => {
                setNewUserRole("SALES");
                setActiveSection("add-user");
              }}
            >
              <Plus className="size-4" />
              إضافة موظف مبيعات
            </Button>
          </div>
          {renderUsersTable(
            users.filter((u) => u.role === "SALES"),
            "لا يوجد موظفو مبيعات حالياً.",
          )}
        </Card>
      )}

      {activeSection === "support" && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">فريق خدمة العملاء (Support Users)</h2>
              <p className="text-xs text-muted-foreground">مستخدمو قسم الدعم وخدمة العملاء</p>
            </div>
            <Button
              onClick={() => {
                setNewUserRole("SUPPORT");
                setActiveSection("add-user");
              }}
            >
              <Plus className="size-4" />
              إضافة موظف خدمة عملاء
            </Button>
          </div>
          {renderUsersTable(
            users.filter((u) => u.role === "SUPPORT"),
            "لا يوجد موظفو خدمة عملاء حالياً.",
          )}
        </Card>
      )}

      {activeSection === "add-user" && (
        <Card className="mx-auto max-w-xl">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-md bg-brand/10 text-brand">
              <UserPlus className="size-4" />
            </span>
            <div>
              <h2 className="font-bold">إضافة مستخدم جديد من الإدارة</h2>
              <small className="text-muted-foreground">
                مخصص لإضافة المدرسين والمبيعات وخدمة العملاء (الطالب ينشئ حسابه بنفسه)
              </small>
            </div>
          </div>

          {userSuccess && (
            <div className="mt-4 rounded-md bg-sage/15 p-3 text-xs font-semibold text-sage">
              {userSuccess}
            </div>
          )}
          {userError && (
            <div className="mt-4 rounded-md bg-danger/10 p-3 text-xs font-semibold text-danger">
              {userError}
            </div>
          )}

          <form onSubmit={handleCreateStaff} className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label>الدور الوظيفي</Label>
              <select
                value={newUserRole}
                onChange={(e) =>
                  setNewUserRole(e.target.value as Exclude<UserRole, "STUDENT">)
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="TEACHER">مدرس (Teacher)</option>
                <option value="SALES">مبيعات (Sales)</option>
                <option value="SUPPORT">خدمة عملاء (Support)</option>
                <option value="ADMIN">مدير (Admin)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>الاسم الكامل</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="الاسم الكامل"
              />
            </div>

            <div className="space-y-1.5">
              <Label>رقم الهاتف</Label>
              <Input
                type="tel"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="01xxxxxxxxx"
              />
            </div>

            <div className="space-y-1.5">
              <Label>كلمة المرور</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="8 أحرف على الأقل"
              />
            </div>

            <div className="space-y-1.5">
              <Label>التخصص / القسم</Label>
              <Input
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="التخصص أو القسم"
              />
            </div>

            <div className="space-y-1.5">
              <Label>البريد الإلكتروني (اختياري)</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@עברית שוטפת.com"
              />
            </div>

            <Button type="submit" className="w-full">
              <Plus className="size-4" />
              إضافة {ROLE_LABELS[newUserRole]}
            </Button>
          </form>
        </Card>
      )}

      {activeSection === "courses" && (
        <div className="grid gap-4 xl:grid-cols-[1fr_400px]">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">الكورسات والملفات المرفوعة للمدرسين</h2>
                <p className="text-xs text-muted-foreground">
                  مخزنة على KVM Storage ({SERVER_CONFIG.storageServerIp}) ومربوطة بكل مدرس
                </p>
              </div>
              <Badge tone="brand">{materials.length} ملفات</Badge>
            </div>

            <div className="mt-4 space-y-3">
              {materials.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  لا توجد كورسات مرفوعة في قاعدة البيانات حالياً.
                </div>
              ) : (
                materials.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-md border border-border bg-background/60 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-brand/10 text-brand">
                          {m.type === "VIDEO" ? (
                            <Film className="size-5" />
                          ) : m.type === "AUDIO" ? (
                            <Mic className="size-5" />
                          ) : (
                            <FileText className="size-5" />
                          )}
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <b className="text-sm">{m.title}</b>
                            <Badge tone="sage">المدرس: {m.assignedTeacherName}</Badge>
                            <Badge tone="gold">مستوى {m.level}</Badge>
                            <Badge tone={m.status === "PUBLISHED" ? "sage" : "muted"}>
                              {m.status === "PUBLISHED" ? "منشور للطلاب" : "مسودة (Draft)"}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{m.description}</p>
                          <div className="mt-2 flex flex-wrap gap-3 font-lat text-xs text-muted-foreground">
                            <span>{m.fileName}</span>
                            <span>•</span>
                            <span>{m.fileSize}</span>
                            <span>•</span>
                            <span className="text-brand">{m.storageUrl}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          className="min-h-8 px-3 py-1 text-xs"
                          onClick={() =>
                            setMaterialStatus(
                              m.id,
                              m.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
                            )
                          }
                        >
                          {m.status === "PUBLISHED" ? "إرجاع كمسودة" : "نشر للطلاب"}
                        </Button>
                        <Button
                          variant="ghost"
                          className="min-h-8 px-3 py-1 text-xs"
                          onClick={() =>
                            setOpenMaterialId(openMaterialId === m.id ? null : m.id)
                          }
                        >
                          {openMaterialId === m.id ? "إغلاق" : "معاينة"}
                        </Button>
                        <button
                          onClick={() => deleteCourseMaterial(m.id)}
                          className="rounded-md p-2 text-muted-foreground hover:bg-danger/10 hover:text-danger"
                          title="حذف المادة"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                    {openMaterialId === m.id && (
                      <div className="mt-4 border-t border-border pt-4">
                        <MaterialPlayer material={m} />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-md bg-brand/10 text-brand">
                <Upload className="size-4" />
              </span>
              <div>
                <h2 className="font-bold">رفع كورس / فيديو / ملف لمدرس</h2>
                <small className="text-muted-foreground">
                  اختر المدرس الذي ستصل إليه هذه الماتيريال في لوحته
                </small>
              </div>
            </div>

            {courseSuccess && (
              <div className="mt-4 rounded-md bg-sage/15 p-3 text-xs font-semibold text-sage">
                {courseSuccess}
              </div>
            )}
            {courseError && (
              <div className="mt-4 rounded-md bg-danger/10 p-3 text-xs font-semibold text-danger">
                {courseError}
              </div>
            )}

            <form onSubmit={handleUploadCourse} className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label>اختر المدرس المستلم (تخصيص الماتيريال)</Label>
                <select
                  value={activeTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {teachers.length === 0 ? (
                    <option value="">لا يوجد مدرسون — أضف مدرساً أولاً</option>
                  ) : (
                    teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName} ({t.specialty ?? "مدرس"})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>عنوان الكورس / المحاضرة</Label>
                <Input
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  required
                  placeholder="عنوان الكورس أو المحاضرة"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label>نوع الملف</Label>
                  <select
                    value={courseType}
                    onChange={(e) => setCourseType(e.target.value as MaterialType)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="VIDEO">فيديو (Video)</option>
                    <option value="DOCUMENT">ملف / كتاب (PDF)</option>
                    <option value="AUDIO">ملف صوتي (Audio)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>المستوى</Label>
                  <select
                    value={courseLevel}
                    onChange={(e) =>
                      setCourseLevel(e.target.value as "A1" | "A2" | "B1" | "B2")
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>وصف مختصر للمدرس</Label>
                <textarea
                  value={courseDesc}
                  onChange={(e) => setCourseDesc(e.target.value)}
                  className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
                  placeholder="ملاحظات حول طريقة شرح هذا الدرس..."
                />
              </div>

              <div className="space-y-1.5">
                <Label>اختيار ملف الفيديو أو المستند</Label>
                <input
                  type="file"
                  accept="video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                  className="block w-full rounded-md border border-dashed border-border bg-muted/40 p-2.5 text-xs"
                />
                {selectedFile && (
                  <small className="text-muted-foreground">
                    سيتم رفع الملف الفعلي ({selectedFile.name}) وتشغيله داخل المنصة.
                  </small>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>حالة النشر</Label>
                <select
                  value={courseStatus}
                  onChange={(e) => setCourseStatus(e.target.value as PublishStatus)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="DRAFT">مسودة (Draft) — لا تظهر للطلاب</option>
                  <option value="PUBLISHED">نشر (Publish) — تظهر للطلاب فوراً</option>
                </select>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={teachers.length === 0 || courseUploading}
              >
                <Upload className="size-4" />
                {courseUploading
                  ? "جاري رفع الملف..."
                  : courseStatus === "PUBLISHED"
                    ? "رفع ونشر للمدرس والطلاب"
                    : "رفع كمسودة"}
              </Button>
            </form>
          </Card>
        </div>
      )}

      {activeSection === "exams" && (
        <div className="grid gap-4 xl:grid-cols-[1fr_440px]">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">الامتحانات المخصصة للمدرسين</h2>
                <p className="text-xs text-muted-foreground">
                  الامتحان المنشور يظهر للمدرس المعيّن وللطلاب المربوطين به
                </p>
              </div>
              <Badge tone="brand">{exams.length} امتحان</Badge>
            </div>

            <div className="mt-4 space-y-3">
              {exams.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  لا توجد امتحانات في قاعدة البيانات حالياً.
                </div>
              ) : (
                exams.map((exam) => (
                  <div
                    key={exam.id}
                    className="rounded-md border border-border bg-background/60 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-brand/10 text-brand">
                          <FileCheck className="size-5" />
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <b className="text-sm">{exam.title}</b>
                            <Badge tone="gold">{EXAM_TYPE_LABELS[exam.type]}</Badge>
                            <Badge tone={exam.status === "PUBLISHED" ? "sage" : "muted"}>
                              {exam.status === "PUBLISHED" ? "منشور" : "مسودة"}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {exam.description || "بدون وصف"} · المدرس:{" "}
                            {exam.assignedTeacherName ?? "—"} · التسليمات: {exam.resultsCount ?? 0}
                          </p>
                          {exam.questions.audioUrl && (
                            <audio
                              controls
                              src={mediaSrc(exam.questions.audioUrl)}
                              className="mt-2 h-8 w-56"
                            />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          className="min-h-8 px-3 py-1 text-xs"
                          onClick={() =>
                            setExamStatus(
                              exam.id,
                              exam.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
                            )
                          }
                        >
                          {exam.status === "PUBLISHED" ? "إرجاع كمسودة" : "نشر الآن"}
                        </Button>
                        <button
                          onClick={() => deleteExam(exam.id)}
                          className="rounded-md p-2 text-muted-foreground hover:bg-danger/10 hover:text-danger"
                          title="حذف الامتحان"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-md bg-brand/10 text-brand">
                <FileCheck className="size-4" />
              </span>
              <div>
                <h2 className="font-bold">إنشاء امتحان جديد</h2>
                <small className="text-muted-foreground">
                  يظهر للمدرس المحدد وللطلاب المربوطين به عند النشر
                </small>
              </div>
            </div>

            {examSuccess && (
              <div className="mt-4 rounded-md bg-sage/15 p-3 text-xs font-semibold text-sage">
                {examSuccess}
              </div>
            )}
            {examError && (
              <div className="mt-4 rounded-md bg-danger/10 p-3 text-xs font-semibold text-danger">
                {examError}
              </div>
            )}

            <form onSubmit={handleCreateExam} className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label>عنوان الامتحان</Label>
                <Input
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  required
                  placeholder="مثال: امتحان ترجمة — الوحدة 3"
                />
              </div>

              <div className="space-y-1.5">
                <Label>وصف مختصر (يظهر للطالب)</Label>
                <Input
                  value={examDesc}
                  onChange={(e) => setExamDesc(e.target.value)}
                  placeholder="تعليمات أو وصف الامتحان"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label>نوع الامتحان</Label>
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value as ExamType)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="translation">ترجمة (نص ↔ نص)</option>
                    <option value="reading">قراءة وفهم</option>
                    <option value="speaking">فقرة مكتوبة — الطالب يسجل صوته</option>
                    <option value="listening">استماع — صوت الأدمن + كتابة</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>المدرس المستلم</Label>
                  <select
                    value={activeExamTeacherId}
                    onChange={(e) => setExamTeacherId(e.target.value)}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {teachers.length === 0 ? (
                      <option value="">لا يوجد مدرسون — أضف مدرساً أولاً</option>
                    ) : (
                      teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.fullName}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {(examType === "translation" || examType === "reading") && (
                <div className="space-y-1.5">
                  <Label>
                    أسئلة نص حر سريعة — كل سطر: النص العبري | الإجابة المتوقعة (اختياري)
                  </Label>
                  <textarea
                    value={examItemsText}
                    onChange={(e) => setExamItemsText(e.target.value)}
                    className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 font-he text-sm outline-none"
                    dir="rtl"
                    placeholder={"מה השעה? | كم الساعة؟\nאיפה אתה גר? | أين تسكن؟"}
                  />
                </div>
              )}

              {/* Structured question builder — supports text, MCQ, true/false */}
              <div className="space-y-2 rounded-md border border-dashed border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between">
                  <Label>أسئلة منظمة (اختياري — تظهر للطالب بالترتيب)</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-8 px-2 text-xs"
                    onClick={() =>
                      setExamQuestions((prev) => [
                        ...prev,
                        {
                          type: "mcq" as QuestionType,
                          prompt: "",
                          options: ["", ""],
                          correctIndex: 0,
                          points: 1,
                        },
                      ])
                    }
                  >
                    <Plus className="size-3.5" />
                    إضافة سؤال
                  </Button>
                </div>

                {examQuestions.length > 0 && (
                  <div className="space-y-3">
                    {examQuestions.map((q, qi) => (
                      <div key={qi} className="rounded-md border border-border bg-background p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-muted-foreground">
                            سؤال {qi + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setExamQuestions((prev) => prev.filter((_, i) => i !== qi))
                            }
                            className="rounded-md p-1 text-muted-foreground hover:bg-danger/10 hover:text-danger"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <select
                            value={q.type}
                            onChange={(e) => {
                              const newType = e.target.value as QuestionType;
                              setExamQuestions((prev) =>
                                prev.map((p, i) => {
                                  if (i !== qi) return p;
                                  const updated: ExamQuestionItem = {
                                    ...p,
                                    type: newType,
                                    points: p.points ?? 1,
                                  };
                                  if (newType === "mcq") {
                                    updated.options = p.options ?? ["", ""];
                                    updated.correctIndex = p.correctIndex ?? 0;
                                  } else if (newType === "truefalse") {
                                    updated.options = ["صح", "خطأ"];
                                    updated.correctIndex = 0;
                                  } else {
                                    // text — no options
                                  }
                                  return updated;
                                }),
                              );
                            }}
                            className="flex h-9 rounded-md border border-input bg-background px-2 text-xs"
                          >
                            <option value="text">نص حر (يدوي)</option>
                            <option value="mcq">اختيار من متعدد (تلقائي)</option>
                            <option value="truefalse">صح/خطأ (تلقائي)</option>
                          </select>
                          <Input
                            type="number"
                            min={1}
                            placeholder="الدرجة"
                            className="h-9 text-xs"
                            value={q.points ?? 1}
                            onChange={(e) =>
                              setExamQuestions((prev) =>
                                prev.map((p, i) =>
                                  i === qi ? { ...p, points: Number(e.target.value) } : p,
                                ),
                              )
                            }
                          />
                        </div>

                        <Input
                          className="mt-2 font-he text-sm"
                          dir="rtl"
                          placeholder="نص السؤال بالعبرية..."
                          value={q.prompt}
                          onChange={(e) =>
                            setExamQuestions((prev) =>
                              prev.map((p, i) =>
                                i === qi ? { ...p, prompt: e.target.value } : p,
                              ),
                            )
                          }
                        />

                        {q.type === "mcq" && (
                          <div className="mt-2 space-y-1.5">
                            {(q.options ?? []).map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExamQuestions((prev) =>
                                      prev.map((p, i) =>
                                        i === qi ? { ...p, correctIndex: oi } : p,
                                      ),
                                    )
                                  }
                                  className={`grid size-6 shrink-0 place-items-center rounded-full border text-xs ${
                                    q.correctIndex === oi
                                      ? "border-brand bg-brand text-primary-foreground"
                                      : "border-border"
                                  }`}
                                >
                                  {q.correctIndex === oi ? "✓" : oi + 1}
                                </button>
                                <Input
                                  className="h-8 flex-1 text-xs"
                                  placeholder={`الاختيار ${oi + 1}`}
                                  value={opt}
                                  onChange={(e) =>
                                    setExamQuestions((prev) =>
                                      prev.map((p, i) =>
                                        i === qi
                                          ? {
                                              ...p,
                                              options: (p.options ?? []).map((o, j) =>
                                                j === oi ? e.target.value : o,
                                              ),
                                            }
                                          : p,
                                      ),
                                    )
                                  }
                                />
                                {(q.options ?? []).length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExamQuestions((prev) =>
                                        prev.map((p, i) => {
                                          if (i !== qi) return p;
                                          const newOptions = (p.options ?? []).filter(
                                            (_, j) => j !== oi,
                                          );
                                          const newCorrect = Math.max(
                                            0,
                                            (p.correctIndex ?? 0) >= oi
                                              ? (p.correctIndex ?? 0) - 1
                                              : p.correctIndex ?? 0,
                                          );
                                          const updated: ExamQuestionItem = {
                                            ...p,
                                            options: newOptions,
                                            correctIndex: newCorrect,
                                            points: p.points ?? 1,
                                          };
                                          return updated;
                                        }),
                                      )
                                    }
                                    className="rounded-md p-1 text-muted-foreground hover:bg-danger/10 hover:text-danger"
                                  >
                                    <Trash2 className="size-3" />
                                  </button>
                                )}
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="ghost"
                              className="min-h-7 px-2 text-xs"
                              onClick={() =>
                                setExamQuestions((prev) =>
                                  prev.map((p, i) =>
                                    i === qi
                                      ? { ...p, options: [...(p.options ?? []), ""] }
                                      : p,
                                  ),
                                )
                              }
                            >
                              <Plus className="size-3" />
                              إضافة اختيار
                            </Button>
                            <small className="block text-muted-foreground">
                              الإجابة الصحيحة محددة بـ ✓ — التصحيح تلقائي
                            </small>
                          </div>
                        )}

                        {q.type === "truefalse" && (
                          <div className="mt-2 flex items-center gap-2">
                            {["صح", "خطأ"].map((opt, oi) => (
                              <button
                                key={oi}
                                type="button"
                                onClick={() =>
                                  setExamQuestions((prev) =>
                                    prev.map((p, i) =>
                                      i === qi ? { ...p, correctIndex: oi } : p,
                                    ),
                                  )
                                }
                                className={`rounded-md border px-4 py-1.5 text-sm ${
                                  q.correctIndex === oi
                                    ? "border-brand bg-brand/10 font-bold text-brand"
                                    : "border-border"
                                }`}
                              >
                                {opt} {q.correctIndex === oi && "✓"}
                              </button>
                            ))}
                            <small className="text-muted-foreground">التصحيح تلقائي</small>
                          </div>
                        )}

                        {q.type === "text" && (
                          <Input
                            className="mt-2 text-xs"
                            placeholder="الإجابة المتوقعة (اختياري — للمرجعية فقط)"
                            value={q.expected ?? ""}
                            onChange={(e) =>
                              setExamQuestions((prev) =>
                                prev.map((p, i) =>
                                  i === qi ? { ...p, expected: e.target.value } : p,
                                ),
                              )
                            }
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {examType === "speaking" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>الفقرة المكتوبة (بالعبرية — الطالب يقرؤها ويسجل صوته)</Label>
                    {examParagraph.trim() && <HebrewTTS text={examParagraph} label="معاينة الصوت" />}
                  </div>
                  <textarea
                    value={examParagraph}
                    onChange={(e) => setExamParagraph(e.target.value)}
                    required
                    className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 font-he text-sm outline-none"
                    dir="rtl"
                    placeholder="כתוב כאן את הפסקה שהתלמיד יקרא ויקליט..."
                  />
                </div>
              )}

              {examType === "listening" && (
                <div className="space-y-2">
                  <Label>تسجيل صوتي منك — الطالب يسمعه ويكتب ما فهمه</Label>
                  <AudioRecorder
                    label="سجّل صوتك الآن"
                    onRecorded={(blob) => {
                      setExamRecordedBlob(blob);
                      setExamAudioFile(null);
                    }}
                  />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="h-px flex-1 bg-border" />
                    أو ارفع ملف صوتي جاهز
                    <span className="h-px flex-1 bg-border" />
                  </div>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => {
                      setExamAudioFile(e.target.files?.[0] ?? null);
                      if (e.target.files?.[0]) setExamRecordedBlob(null);
                    }}
                    className="block w-full rounded-md border border-dashed border-border bg-muted/40 p-2.5 text-xs"
                  />
                  {(examAudioFile || examRecordedBlob) && (
                    <small className="font-semibold text-sage">
                      {examAudioFile
                        ? `الملف الجاهز: ${examAudioFile.name}`
                        : "تم تسجيل صوتك — سيُرفع مع الامتحان"}
                    </small>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <Label>حالة النشر</Label>
                <select
                  value={examStatus}
                  onChange={(e) => setExamStatusSel(e.target.value as PublishStatus)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="DRAFT">مسودة (Draft)</option>
                  <option value="PUBLISHED">نشر فوري (Publish)</option>
                </select>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={teachers.length === 0 || examSubmitting}
              >
                <Plus className="size-4" />
                {examSubmitting ? "جاري الحفظ والرفع..." : "إنشاء الامتحان"}
              </Button>
            </form>
          </Card>
        </div>
      )}

      {activeSection === "results" && (
        <AdminResultsSection
          results={allExamResults}
          onRefresh={fetchAdminExamResults}
          onGrade={adminGradeResult}
        />
      )}

      {activeSection === "placement" && (
        <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">
                  أسئلة تحديد المستوى المعروضة في الصفحة الرئيسية
                </h2>
                <p className="text-xs text-muted-foreground">
                  أي سؤال تضيفه أو تفعّله هنا يظهر مباشرة للزوار والطلاب في الصفحة الرئيسية (`/`)
                </p>
              </div>
              <Badge tone="sage">
                {placementQuestions.filter((q) => q.isActive).length} سؤال مفعل
              </Badge>
            </div>

            <div className="mt-4 space-y-3">
              {placementQuestions.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  لا توجد أسئلة مضافة حالياً.
                </div>
              ) : (
                placementQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="rounded-md border border-border bg-background/60 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="grid size-6 place-items-center rounded-full bg-brand/10 font-lat text-xs font-bold text-brand">
                          {idx + 1}
                        </span>
                        <Badge tone="gold">{q.section}</Badge>
                        <Badge tone="brand">مستوى {q.levelTag}</Badge>
                        <Badge tone="muted">
                          {q.questionType === "truefalse" ? "صح/خطأ" : q.questionType === "text" ? "إجابة نصية" : "اختيار متعدد"}
                        </Badge>
                        <Badge tone={q.isActive ? "sage" : "muted"}>
                          {q.isActive ? "مفعل بالرئيسية" : "مخفي"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          className="min-h-7 px-2 py-1 text-xs"
                          onClick={() => togglePlacementQuestion(q.id)}
                        >
                          {q.isActive ? "إخفاء" : "تفعيل"}
                        </Button>
                        <button
                          onClick={() => deletePlacementQuestion(q.id)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-danger/10 hover:text-danger"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="mt-3 font-bold">{q.promptAr}</h3>
                    <p dir="rtl" className="mt-1 font-he text-base text-brand">
                      {q.hebrewText}
                    </p>
                    {q.questionType === "text" ? (
                      <div className="mt-3 rounded-sm bg-sage/15 px-3 py-1.5 text-xs font-bold text-sage ring-1 ring-sage/30">
                        الإجابة المتوقعة: {q.expectedAnswer}
                      </div>
                    ) : q.questionType === "truefalse" ? (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {["صح", "خطأ"].map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`rounded-sm px-3 py-1.5 text-xs ${
                              oIdx === q.correctOptionIndex
                                ? "bg-sage/15 font-bold text-sage ring-1 ring-sage/30"
                                : "bg-muted/60 text-muted-foreground"
                            }`}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`rounded-sm px-3 py-1.5 text-xs ${
                            oIdx === q.correctOptionIndex
                              ? "bg-sage/15 font-bold text-sage ring-1 ring-sage/30"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {oIdx + 1}. {opt} {oIdx === q.correctOptionIndex && " (الإجابة الصحيحة)"}
                        </div>
                      ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-md bg-brand/10 text-brand">
                <ClipboardCheck className="size-4" />
              </span>
              <div>
                <h2 className="font-bold">إضافة سؤال جديد لتحديد المستوى</h2>
                <small className="text-muted-foreground">
                  يظهر في قسم تحديد المستوى بالصفحة الرئيسية
                </small>
              </div>
            </div>

            {questionSuccess && (
              <div className="mt-4 rounded-md bg-sage/15 p-3 text-xs font-semibold text-sage">
                {questionSuccess}
              </div>
            )}
            {questionError && (
              <div className="mt-4 rounded-md bg-danger/10 p-3 text-xs font-semibold text-danger">
                {questionError}
              </div>
            )}

            <form onSubmit={handleCreateQuestion} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label>المهارة / القسم</Label>
                  <select
                    value={qSection}
                    onChange={(e) => setQSection(e.target.value as PlacementSection)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="قراءة">قراءة</option>
                    <option value="استماع">استماع</option>
                    <option value="كتابة">كتابة</option>
                    <option value="محادثة">محادثة</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>المستوى المستهدف</Label>
                  <select
                    value={qLevel}
                    onChange={(e) => setQLevel(e.target.value as "A1" | "A2" | "B1" | "B2")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>نص السؤال (بالعربية)</Label>
                <Input
                  value={qPromptAr}
                  onChange={(e) => setQPromptAr(e.target.value)}
                  required
                  placeholder="نص السؤال بالعربية"
                />
              </div>

              <div className="space-y-1.5">
                <Label>الجملة أو النص بالعبرية</Label>
                <Input
                  dir="rtl"
                  className="font-he"
                  value={qHebrewText}
                  onChange={(e) => setQHebrewText(e.target.value)}
                  required
                  placeholder="שלום..."
                />
              </div>

              <div className="space-y-1.5">
                <Label>نوع السؤال</Label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    ["mcq", "اختيار من متعدد"],
                    ["truefalse", "صح / خطأ"],
                    ["text", "إجابة نصية"],
                  ] as const).map(([v, l]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setQType(v)}
                      className={`rounded-md border p-2.5 text-xs font-semibold transition ${
                        qType === v
                          ? "border-brand bg-brand/10 text-brand"
                          : "border-border hover:border-brand/50"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {qType === "mcq" && (
                <>
                  <div className="space-y-2">
                    <Label>الاختيارات (2 على الأقل)</Label>
                    <Input value={opt1} onChange={(e) => setOpt1(e.target.value)} placeholder="الاختيار الأول" />
                    <Input value={opt2} onChange={(e) => setOpt2(e.target.value)} placeholder="الاختيار الثاني" />
                    <Input value={opt3} onChange={(e) => setOpt3(e.target.value)} placeholder="الاختيار الثالث (اختياري)" />
                    <Input value={opt4} onChange={(e) => setOpt4(e.target.value)} placeholder="الاختيار الرابع (اختياري)" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>رقم الإجابة الصحيحة</Label>
                    <select
                      value={correctIdx}
                      onChange={(e) => setCorrectIdx(Number(e.target.value))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value={0}>الاختيار الأول (1)</option>
                      <option value={1}>الاختيار الثاني (2)</option>
                      <option value={2}>الاختيار الثالث (3)</option>
                      <option value={3}>الاختيار الرابع (4)</option>
                    </select>
                  </div>
                </>
              )}

              {qType === "truefalse" && (
                <div className="space-y-1.5">
                  <Label>الإجابة الصحيحة</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {([true, false] as const).map((v) => (
                      <button
                        key={String(v)}
                        type="button"
                        onClick={() => setQTrueFalse(v)}
                        className={`rounded-md border p-3 text-sm font-bold transition ${
                          qTrueFalse === v
                            ? "border-brand bg-brand/10 text-brand"
                            : "border-border hover:border-brand/50"
                        }`}
                      >
                        {v ? "صح" : "خطأ"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {qType === "text" && (
                <div className="space-y-1.5">
                  <Label>الإجابة المتوقعة (النص الصحيح)</Label>
                  <Input
                    dir="rtl"
                    value={qExpected}
                    onChange={(e) => setQExpected(e.target.value)}
                    placeholder="الإجابة الصحيحة — يُقارن بها نص الطالب بعد تجاهل المسافات"
                  />
                  <small className="text-muted-foreground">
                    المقارنة بتتجاهل حالة الأحرف والمسافات الزائدة — اكتب الإجابة الأدق
                  </small>
                </div>
              )}

              <Button type="submit" className="w-full">
                <Plus className="size-4" />
                نشر السؤال في الصفحة الرئيسية
              </Button>
            </form>
          </Card>
        </div>
      )}

      {activeSection === "packages" && (
        <AdminPackagesSection
          packages={adminPackages}
          subscriptions={adminSubscriptions}
          teachers={users.filter((u) => u.role === "TEACHER")}
          onCreate={createPackage}
          onUpdate={updatePackage}
          onDelete={deletePackage}
        />
      )}

      {activeSection === "sales-report" && (
        <AdminSalesReportSection report={salesReport} onRefresh={fetchAdminOps} />
      )}

      {activeSection === "leads" && (
        <AdminLeadsSection leads={adminLeads} salesUsers={users.filter((u) => u.role === "SALES")} onAssign={assignLead} />
      )}

      {activeSection === "certificates" && (
        <AdminCertificatesSection
          certificates={adminCertificates}
          students={studentsList}
          onIssue={issueCertificate}
          onDelete={deleteCertificate}
        />
      )}

      {activeSection === "bookings" && (
        <AdminBookingsSection
          requests={adminPaymentRequests}
          onRefresh={() => fetchAdminPaymentRequests(bookingFilter)}
          filter={bookingFilter}
          onFilterChange={setBookingFilter}
          onReview={reviewPaymentRequest}
        />
      )}

      {activeSection === "placement-results" && (
        <AdminPlacementResultsSection results={placementResults} />
      )}

      {activeSection === "lectures" && (
        <AdminLecturesSection
          lectures={adminLectures}
          teachers={users.filter((u) => u.role === "TEACHER")}
          groups={adminGroups}
          adminTeacherAvailability={adminTeacherAvailability}
          filter={lectureFilter}
          onFilterChange={setLectureFilter}
          onCreate={createAdminLecture}
          onUpdate={updateAdminLecture}
          onDelete={deleteAdminLecture}
          onFetchTeacherAvailability={fetchAdminTeacherAvailability}
        />
      )}

      {activeSection === "schedules" && (
        <AdminSchedulesSection
          schedules={adminSchedules}
          teachers={users.filter((u) => u.role === "TEACHER")}
          onCreate={createAdminSchedule}
          onUpdate={updateAdminSchedule}
          onDelete={deleteAdminSchedule}
        />
      )}

      {activeSection === "sessions" && (
        <div className="space-y-4">
          <OpsCreateSessionCard
            callsStudents={callsStudents}
            teachers={users.filter((u) => u.role === "TEACHER")}
            availability={adminTeacherAvailability}
            onFetchAvailability={fetchAdminTeacherAvailability}
            onCreate={opsCreateBooking}
            onFetchCallsStudents={fetchCallsStudents}
          />
          {/* Report summary */}
          {adminBookingsReport && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="p-4">
                <b className="text-2xl text-[#0b2f6e]">{adminBookingsReport.totals.totalBookings}</b>
                <p className="text-xs text-muted-foreground">إجمالي الحجوزات</p>
              </Card>
              <Card className="p-4">
                <b className="text-2xl text-[#2f9e4f]">{adminBookingsReport.totals.completed}</b>
                <p className="text-xs text-muted-foreground">حصص مكتملة</p>
              </Card>
              <Card className="p-4">
                <b className="text-2xl text-[#c0392b]">{adminBookingsReport.totals.cancelled}</b>
                <p className="text-xs text-muted-foreground">حصص ملغاة</p>
              </Card>
              <Card className="p-4">
                <b className="text-2xl text-[#e67e22]">{adminBookingsReport.totals.noShow}</b>
                <p className="text-xs text-muted-foreground">لم يحضر</p>
              </Card>
            </div>
          )}

          {/* Students balance */}
          {adminBookingsReport && adminBookingsReport.students.length > 0 && (
            <Card>
              <h3 className="font-bold">رصيد الطلاب</h3>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-right text-xs text-muted-foreground">
                      <th className="p-2">الطالب</th>
                      <th className="p-2">الباقة</th>
                      <th className="p-2">الإجمالي</th>
                      <th className="p-2">المستخدم</th>
                      <th className="p-2">المتبقي</th>
                      <th className="p-2">تنتهي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminBookingsReport.students.map((s: any) => (
                      <tr key={s.studentId} className="border-b">
                        <td className="p-2 font-semibold">{s.studentName}</td>
                        <td className="p-2">{s.packageName}</td>
                        <td className="p-2">{s.sessionsTotal}</td>
                        <td className="p-2">{s.sessionsUsed}</td>
                        <td className="p-2 font-bold text-[#2f9e4f]">{s.sessionsRemaining}</td>
                        <td className="p-2 text-xs">{s.expiresAt ? new Date(s.expiresAt).toLocaleDateString("ar-EG") : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* All bookings */}
          <Card>
            <h3 className="font-bold">كل الحجوزات</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-right text-xs text-muted-foreground">
                    <th className="p-2">الطالب</th>
                    <th className="p-2">المدرس</th>
                    <th className="p-2">الموعد</th>
                    <th className="p-2">الحالة</th>
                    <th className="p-2">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {adminBookings.length === 0 ? (
                    <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">لا توجد حجوزات.</td></tr>
                  ) : (
                    adminBookings.map((b) => {
                      const st: Record<string, { label: string; color: string }> = {
                        booked: { label: "محجوزة", color: "#0b2f6e" },
                        completed: { label: "مكتملة", color: "#2f9e4f" },
                        cancelled: { label: "ملغاة", color: "#c0392b" },
                        no_show: { label: "لم يحضر", color: "#e67e22" },
                      };
                      const s = st[b.status] ?? st.booked;
                      return (
                        <tr key={b.id} className="border-b">
                          <td className="p-2 font-semibold">{b.student?.fullName ?? "—"}</td>
                          <td className="p-2">{b.teacher?.fullName ?? "—"}</td>
                          <td className="p-2 text-xs">{new Date(b.startsAt).toLocaleString("ar-EG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                          <td className="p-2"><Badge style={{ background: s.color }}>{s.label}</Badge></td>
                          <td className="p-2">
                            {b.status === "booked" && (
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => { if (confirm("إلغاء إداري؟")) adminUpdateBooking(b.id, { status: "cancelled", reason: "إلغاء إداري" }); }}>
                                  إلغاء
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => { const url = prompt("رابط الاجتماع:"); if (url) adminUpdateBooking(b.id, { meetingUrl: url }); }}>
                                  رابط
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeSection === "groups" && (
        <AdminGroupsSection
          groups={adminGroups}
          members={groupMembers}
          students={users.filter((u) => u.role === "STUDENT")}
          teachers={users.filter((u) => u.role === "TEACHER")}
          onCreate={createAdminGroup}
          onUpdate={updateAdminGroup}
          onDelete={deleteAdminGroup}
          onFetchMembers={fetchGroupMembers}
          onAddMembers={addGroupMembers}
          onRemoveMember={removeGroupMember}
        />
      )}

      {activeSection === "free-lectures" && (
        <OpsFreeLecturesSection
          freeStudents={freeStudents}
          freeLectures={freeLectures}
          groups={adminGroups}
          teachers={users.filter((u) => u.role === "TEACHER")}
          availability={adminTeacherAvailability}
          onFetchAvailability={fetchAdminTeacherAvailability}
          onCreateStudent={createFreeStudent}
          onDeleteStudent={deleteFreeStudent}
          onCreateLecture={createFreeLecture}
          onUpdateLecture={updateFreeLecture}
          onDeleteLecture={deleteFreeLecture}
          onAddFile={addFreeLectureFile}
          onRemoveFile={removeFreeLectureFile}
        />
      )}
    </AppShell>
  );
}

// ─── Admin ops sections ─────────────────────────────────────────────────────

function AdminBookingsSection({
  requests,
  onRefresh,
  filter,
  onFilterChange,
  onReview,
}: {
  requests: PaymentRequestItem[];
  onRefresh: () => void;
  filter: string;
  onFilterChange: (s: string) => void;
  onReview: (id: string, input: { action: "approve" | "reject"; rejectReason?: string }) => Promise<void>;
}) {
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handle(id: string, action: "approve" | "reject") {
    setError("");
    setBusyId(id);
    try {
      await onReview(id, {
        action,
        ...(action === "reject" && rejectReasons[id]?.trim()
          ? { rejectReason: rejectReasons[id].trim() }
          : {}),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر تنفيذ العملية");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold">طلبات الحجز والمدفوعات ({requests.length})</h3>
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => onFilterChange(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">الكل</option>
              <option value="pending">قيد المراجعة</option>
              <option value="approved">مؤكدة</option>
              <option value="rejected">مرفوضة</option>
            </select>
            <Button variant="secondary" className="min-h-9 px-3 text-xs" onClick={onRefresh}>
              تحديث
            </Button>
          </div>
        </div>
        {error && <p className="mt-3 rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}
      </Card>

      {requests.length === 0 ? (
        <Card className="py-12 text-center text-sm text-muted-foreground">
          لا توجد طلبات حجز {filter === "pending" ? "قيد المراجعة" : ""} حالياً.
        </Card>
      ) : (
        requests.map((r) => (
          <Card key={r.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <b className="text-sm">{r.student?.fullName ?? "طالب"}</b>
                <small className="block text-muted-foreground">
                  {r.student?.phone ?? r.student?.email ?? "—"}
                  {r.student?.level && ` · مستوى ${r.student.level}`}
                </small>
                <small className="mt-1 block text-muted-foreground">
                  {new Date(r.createdAt).toLocaleString("ar-EG")}
                  {r.reviewedBy && ` · راجعه: ${r.reviewedBy.fullName}`}
                </small>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={r.status === "approved" ? "sage" : r.status === "rejected" ? "danger" : "gold"}>
                  {r.status === "approved" ? "مؤكد" : r.status === "rejected" ? "مرفوض" : "قيد المراجعة"}
                </Badge>
                <Badge tone="muted">{r.method === "wallet" ? "محفظة إلكترونية" : "انستاباي"}</Badge>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-md bg-muted/40 p-3 text-sm">
              <b>{r.package?.nameAr}</b>
              <span className="text-muted-foreground">
                {r.package?.price} ج.م · {r.package?.durationMonths} {r.package?.durationMonths === 1 ? "شهر" : "شهور"}
              </span>
              {r.screenshotUrl && (
                <a
                  href={mediaSrc(r.screenshotUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-brand hover:underline"
                >
                  عرض إثبات التحويل
                </a>
              )}
            </div>
            {r.screenshotUrl && /\.(png|jpe?g|webp)$/i.test(r.screenshotUrl) && (
              <img
                src={mediaSrc(r.screenshotUrl)}
                alt="إثبات التحويل"
                className="mt-2 max-h-48 rounded-md border border-border object-contain"
              />
            )}
            {r.status === "rejected" && r.rejectReason && (
              <p className="mt-2 text-xs text-danger">سبب الرفض: {r.rejectReason}</p>
            )}

            {r.status === "pending" && (
              <div className="mt-3 space-y-2 border-t border-border pt-3">
                <Input
                  placeholder="سبب الرفض (اختياري — يظهر للطالب)"
                  value={rejectReasons[r.id] ?? ""}
                  onChange={(e) => setRejectReasons((p) => ({ ...p, [r.id]: e.target.value }))}
                  className="h-9 text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    className="min-h-9 px-4 text-xs"
                    disabled={busyId === r.id}
                    onClick={() => handle(r.id, "approve")}
                  >
                    {busyId === r.id ? "..." : "تأكيد الدفع وتفعيل الاشتراك"}
                  </Button>
                  <Button
                    variant="ghost"
                    className="min-h-9 px-4 text-xs text-danger"
                    disabled={busyId === r.id}
                    onClick={() => handle(r.id, "reject")}
                  >
                    رفض الطلب
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
}

function AdminPlacementResultsSection({ results }: { results: PlacementResultRow[] }) {
  return (
    <Card>
      <h3 className="font-bold">نتائج اختبار تحديد المستوى ({results.length})</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        الطلاب الذين أكملوا اختبار تحديد المستوى — مرتبون بالأحدث
      </p>
      <div className="mt-4 space-y-2">
        {results.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">لم يكمل أي طالب الاختبار بعد.</p>
        ) : (
          results.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-background/60 p-3">
              <div>
                <b className="text-sm">{r.fullName}</b>
                <small className="block text-muted-foreground">
                  {r.phone ?? r.email ?? "—"}
                </small>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone="brand">مستوى {r.level}</Badge>
                <Badge tone="muted">{r.placementScore}%</Badge>
                <small className="text-muted-foreground">
                  {r.placementCompletedAt ? new Date(r.placementCompletedAt).toLocaleDateString("ar-EG") : ""}
                </small>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

const LECTURE_STATUS_LABELS: Record<string, string> = {
  scheduled: "مجدولة",
  live: "مباشر الآن",
  completed: "منتهية",
  cancelled: "ملغاة",
};

function AdminLecturesSection({
  lectures,
  teachers,
  groups,
  adminTeacherAvailability,
  filter,
  onFilterChange,
  onCreate,
  onUpdate,
  onDelete,
  onFetchTeacherAvailability,
}: {
  lectures: AdminLectureItem[];
  teachers: PlatformUser[];
  groups: import("../hooks/use-platform-store").GroupItem[];
  adminTeacherAvailability: any[];
  filter: string;
  onFilterChange: (f: string) => void;
  onCreate: (input: CreateLectureInput) => Promise<void>;
  onUpdate: (id: string, input: Partial<CreateLectureInput>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onFetchTeacherAvailability: (teacherId?: string) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupId, setGroupId] = useState("");
  const [level, setLevel] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // Fetch teacher availability when teacher changes
  useEffect(() => {
    if (teacherId) onFetchTeacherAvailability(teacherId);
  }, [teacherId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!title || !teacherId || !startsAt) {
      setErr("العنوان والمدرس وتاريخ البداية مطلوبة");
      return;
    }
    setSaving(true);
    try {
      await onCreate({
        title,
        ...(description ? { description } : {}),
        teacherId,
        ...(groupName ? { groupName } : {}),
        ...(groupId ? { groupId } : {}),
        ...(level ? { level: level as "A1" | "A2" | "B1" | "B2" | "C1" | "C2" } : {}),
        startsAt: new Date(startsAt).toISOString(),
        ...(endsAt ? { endsAt: new Date(endsAt).toISOString() } : {}),
        ...(meetingUrl ? { meetingUrl } : {}),
      });
      setTitle(""); setDescription(""); setTeacherId(""); setGroupName(""); setGroupId("");
      setLevel(""); setStartsAt(""); setEndsAt(""); setMeetingUrl("");
      setShowForm(false);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "فشل إنشاء المحاضرة");
    } finally {
      setSaving(false);
    }
  }

  const filtered = filter ? lectures.filter((l) => l.status === filter) : lectures;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-sage/15 text-sage">
            <Video className="size-5" />
          </span>
          <div>
            <h2 className="text-xl font-extrabold">المحاضرات المباشرة</h2>
            <p className="text-xs text-muted-foreground">
              لديك <b>{lectures.length}</b> محاضرة مجدولة في النظام
            </p>
          </div>
        </div>
        <Button className="me-auto min-h-11 px-5" onClick={() => setShowForm(!showForm)}>
          <PlusCircle className="size-4" />
          {showForm ? "إلغاء" : "إضافة محاضرة جديدة"}
        </Button>
      </div>

      <Card className="flex flex-wrap items-center gap-4 px-5 py-4">
        <div className="flex flex-wrap gap-2">
          {["", "scheduled", "live", "completed", "cancelled"].map((f) => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={`rounded-xl px-5 py-2 text-[13px] font-bold transition-colors ${
                filter === f
                  ? "bg-brand text-white shadow-[0_8px_20px_-10px] shadow-brand"
                  : f === "live"
                    ? "bg-sage/12 text-sage"
                    : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {f === "live" && <span className="me-1.5 inline-block size-1.5 rounded-full bg-sage align-middle" />}
              {f === "" ? "الكل" : LECTURE_STATUS_LABELS[f]}
            </button>
          ))}
        </div>
        <div className="me-auto flex items-center gap-5 text-center">
          <div>
            <small className="block text-[11px] text-muted-foreground">قيد الانتظار</small>
            <b className="font-lat text-lg">{lectures.filter((l) => l.status === "scheduled").length}</b>
          </div>
          <span className="h-8 w-px bg-border" />
          <div>
            <small className="block text-[11px] text-muted-foreground">تمت بنجاح</small>
            <b className="font-lat text-lg">{lectures.filter((l) => l.status === "completed").length}</b>
          </div>
        </div>
      </Card>

      {showForm && (
        <Card>
          <form onSubmit={handleCreate} className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>عنوان المحاضرة</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="مثال: محاضرة A1 — القواعد الأساسية" />
              </div>
              <div className="space-y-1.5">
                <Label>المدرس</Label>
                <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">— اختر المدرس —</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.fullName}{t.specialty ? ` — ${t.specialty}` : ""}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>المجموعة (اختياري)</Label>
                <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">— بدون مجموعة —</option>
                  {groups.map((g) => <option key={g.id} value={g.id}>{g.name} ({g._count?.members ?? 0} طالب)</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>اسم المجموعة (نص حر — اختياري)</Label>
                <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="مثال: مجموعة المساء" />
              </div>
              <div className="space-y-1.5">
                <Label>المستوى (اختياري)</Label>
                <select value={level} onChange={(e) => setLevel(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">— بدون مستوى —</option>
                  {["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>تاريخ ووقت البداية</Label>
                <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>تاريخ ووقت النهاية (اختياري)</Label>
                <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
              </div>

              {/* Teacher available slots — shown when a teacher is selected */}
              {teacherId && adminTeacherAvailability.length > 0 && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>مواعيد المدرس المتاحة (اضغط لاختيار موعد)</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {adminTeacherAvailability.map((slot) => {
                      const dayName = slot.specificDate
                        ? new Date(slot.specificDate).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })
                        : ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"][slot.dayOfWeek ?? 0];
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => {
                            // For weekly slots, pick the next occurrence
                            const now = new Date();
                            if (slot.specificDate) {
                              const d = new Date(slot.specificDate);
                              d.setHours(Number(slot.startTime.split(":")[0]), Number(slot.startTime.split(":")[1]), 0, 0);
                              setStartsAt(d.toISOString().slice(0, 16));
                              const end = new Date(d);
                              const [eh, em] = slot.endTime.split(":").map(Number);
                              end.setHours(eh, em, 0, 0);
                              setEndsAt(end.toISOString().slice(0, 16));
                            } else {
                              const day = slot.dayOfWeek ?? 0;
                              const diff = (day - now.getDay() + 7) % 7;
                              const d = new Date(now);
                              d.setDate(d.getDate() + diff);
                              const [sh, sm] = slot.startTime.split(":").map(Number);
                              d.setHours(sh, sm, 0, 0);
                              setStartsAt(d.toISOString().slice(0, 16));
                              const end = new Date(d);
                              const [eh, em] = slot.endTime.split(":").map(Number);
                              end.setHours(eh, em, 0, 0);
                              setEndsAt(end.toISOString().slice(0, 16));
                            }
                          }}
                          className="rounded-md border border-input bg-background px-2.5 py-1 text-xs hover:border-brand hover:bg-brand/5"
                        >
                          {dayName} {slot.startTime}—{slot.endTime}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-1.5 sm:col-span-2">
                <Label>رابط الاجتماع (Zoom/Meet — اختياري)</Label>
                <Input value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} placeholder="https://zoom.us/j/..." />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>الوصف (اختياري)</Label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
            </div>
            {err && <p className="text-sm font-semibold text-danger">{err}</p>}
            <Button type="submit" disabled={saving}>{saving ? "جاري الحفظ..." : "إنشاء المحاضرة"}</Button>
          </form>
        </Card>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {filtered.length === 0 ? (
          <Card className="py-10 text-center text-sm text-muted-foreground xl:col-span-2">لا توجد محاضرات بهذا الفلتر.</Card>
        ) : (
          filtered.map((l) => {
            const isLive = l.status === "live";
            const start = new Date(l.startsAt);
            return (
              <Card key={l.id} className="space-y-4 p-6">
                <div className="flex items-start gap-3">
                  <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${isLive ? "bg-sage/15 text-sage" : "bg-brand/10 text-brand"}`}>
                    {isLive ? <Video className="size-5" /> : <CalendarDays className="size-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <b className="block truncate text-base">{l.title}</b>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge tone={isLive ? "sage" : l.status === "cancelled" ? "danger" : l.status === "completed" ? "muted" : "brand"}>
                        {LECTURE_STATUS_LABELS[l.status] ?? l.status}
                      </Badge>
                      {l.level && <Badge tone="sage">مستوى {l.level}</Badge>}
                      {l.groupName && <Badge tone="muted">{l.groupName}</Badge>}
                    </div>
                  </div>
                  <button onClick={() => onDelete(l.id).catch(() => {})} className="grid size-9 place-items-center rounded-xl bg-muted/70 text-muted-foreground hover:bg-danger/10 hover:text-danger" title="حذف">
                    <Trash2 className="size-4" />
                  </button>
                </div>

                {l.description && <p className="text-xs text-muted-foreground">{l.description}</p>}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-muted/40 p-4">
                    <small className="block text-[11px] text-muted-foreground">المعلم المسؤول</small>
                    <b className="mt-2 flex items-center gap-2 text-[13px]">
                      <span className="grid size-6 place-items-center rounded-full bg-brand/10 text-[11px] text-brand">{(l.teacher?.fullName ?? "—")[0]}</span>
                      {l.teacher?.fullName ?? "—"}
                    </b>
                  </div>
                  <div className="rounded-2xl border border-border bg-muted/40 p-4">
                    <small className="block text-[11px] text-muted-foreground">توقيت المحاضرة</small>
                    <b className="mt-2 flex items-center gap-2 text-[13px]">
                      <Clock className="size-3.5 text-muted-foreground" />
                      {start.toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" })}
                      {l.endsAt ? ` – ${new Date(l.endsAt).toLocaleTimeString("ar-EG", { timeStyle: "short" })}` : ""}
                    </b>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={l.status}
                    onChange={(e) => onUpdate(l.id, { status: e.target.value as CreateLectureInput["status"] }).catch(() => {})}
                    className="h-11 shrink-0 rounded-xl border border-border bg-muted/40 px-3 text-xs font-semibold text-muted-foreground"
                    title="تغيير الحالة"
                  >
                    <option value="scheduled">مجدولة</option>
                    <option value="live">مباشر الآن</option>
                    <option value="completed">منتهية</option>
                    <option value="cancelled">ملغاة</option>
                  </select>
                  {l.meetingUrl ? (
                    <a
                      href={l.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="dash-btn-primary inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand text-[13px] font-bold text-white hover:bg-brand/90"
                    >
                      <Video className="size-4" />
                      {isLive ? "الدخول للاجتماع الآن" : "رابط الاجتماع"}
                    </a>
                  ) : (
                    <span className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-muted text-[13px] font-bold text-muted-foreground/70">
                      <Video className="size-4" />
                      لا يوجد رابط اجتماع
                    </span>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

const SCH_DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function AdminSchedulesSection({
  schedules,
  teachers,
  onCreate,
  onUpdate,
  onDelete,
}: {
  schedules: WeeklyScheduleItem[];
  teachers: PlatformUser[];
  onCreate: (input: CreateScheduleInput) => Promise<void>;
  onUpdate: (id: string, input: Partial<CreateScheduleInput>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [teacherId, setTeacherId] = useState("");
  const [title, setTitle] = useState("");
  const [groupName, setGroupName] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("19:30");
  const [location, setLocation] = useState<"online" | "offline">("online");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  function resetForm() {
    setTeacherId(""); setTitle(""); setGroupName(""); setDayOfWeek(0);
    setStartTime("18:00"); setEndTime("19:30"); setLocation("online"); setMeetingUrl("");
    setEditId(null); setShowForm(false); setErr("");
  }

  function startEdit(s: WeeklyScheduleItem) {
    setEditId(s.id);
    setTeacherId(s.teacherId);
    setTitle(s.title);
    setGroupName(s.groupName ?? "");
    setDayOfWeek(s.dayOfWeek);
    setStartTime(s.startTime);
    setEndTime(s.endTime);
    setLocation(s.location === "offline" ? "offline" : "online");
    setMeetingUrl(s.meetingUrl ?? "");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!teacherId || !title) {
      setErr("العنوان والمدرس مطلوبان");
      return;
    }
    setSaving(true);
    try {
      const input: CreateScheduleInput = {
        teacherId, title, dayOfWeek, startTime, endTime, location,
        ...(groupName ? { groupName } : {}),
        ...(meetingUrl ? { meetingUrl } : {}),
      };
      if (editId) await onUpdate(editId, input);
      else await onCreate(input);
      resetForm();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "فشل حفظ الموعد");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold">المواعيد الأسبوعية الثابتة ({schedules.length})</h2>
            <p className="text-xs text-muted-foreground">
              المواعيد المتكررة كل أسبوع — تظهر للطلاب المرتبطين بالمدرس وعلى الموقع الرئيسي
            </p>
          </div>
          <Button variant="secondary" className="text-xs" onClick={() => (showForm ? resetForm() : setShowForm(true))}>
            {showForm ? "إلغاء" : "+ موعد جديد"}
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-md border border-border bg-muted/40 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>عنوان الموعد</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="مثال: محاضرة أسبوعية — قواعد" />
              </div>
              <div className="space-y-1.5">
                <Label>المدرس</Label>
                <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">— اختر المدرس —</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.fullName}{t.specialty ? ` — ${t.specialty}` : ""}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>المجموعة (اختياري)</Label>
                <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="مثال: مجموعة المساء" />
              </div>
              <div className="space-y-1.5">
                <Label>اليوم</Label>
                <select value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  {SCH_DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>النوع</Label>
                <select value={location} onChange={(e) => setLocation(e.target.value as "online" | "offline")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="online">أونلاين</option>
                  <option value="offline">أوفلاين (حضوري)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>من</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>إلى</Label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
              </div>
              {location === "online" && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>رابط الاجتماع (اختياري)</Label>
                  <Input value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} type="url" dir="ltr" placeholder="https://zoom.us/j/..." />
                </div>
              )}
            </div>
            {err && <p className="text-sm font-semibold text-danger">{err}</p>}
            <Button type="submit" disabled={saving}>
              {saving ? "جاري الحفظ..." : editId ? "حفظ التعديل" : "إضافة الموعد"}
            </Button>
          </form>
        )}
      </Card>

      <div className="space-y-2">
        {schedules.length === 0 ? (
          <Card className="py-10 text-center text-sm text-muted-foreground">لا توجد مواعيد أسبوعية بعد.</Card>
        ) : (
          schedules.map((s) => (
            <Card key={s.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <b className="text-sm">{s.title}</b>
                    <Badge tone={s.location === "online" ? "brand" : "gold"}>
                      {s.location === "online" ? "أونلاين" : "أوفلاين"}
                    </Badge>
                    <Badge tone={s.isActive ? "sage" : "danger"}>{s.isActive ? "مفعل" : "معطل"}</Badge>
                    {s.groupName && <Badge tone="muted">{s.groupName}</Badge>}
                  </div>
                  <small className="mt-1 block text-muted-foreground">
                    المدرس: {s.teacher?.fullName ?? "—"} · {SCH_DAY_NAMES[s.dayOfWeek]} · {s.startTime}–{s.endTime}
                  </small>
                  {s.meetingUrl && (
                    <a href={s.meetingUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-semibold text-brand hover:underline">
                      رابط الاجتماع ↗
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" className="min-h-7 px-2.5 text-xs" onClick={() => startEdit(s)}>
                    تعديل
                  </Button>
                  <Button
                    variant="ghost"
                    className="min-h-7 px-2.5 text-xs"
                    onClick={() => onUpdate(s.id, { isActive: !s.isActive }).catch(() => {})}
                  >
                    {s.isActive ? "تعطيل" : "تفعيل"}
                  </Button>
                  <button onClick={() => onDelete(s.id).catch(() => {})} className="rounded-md p-1.5 text-muted-foreground hover:bg-danger/10 hover:text-danger">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function AdminPackagesSection({
  packages,
  subscriptions,
  teachers,
  onCreate,
  onUpdate,
  onDelete,
}: {
  packages: AdminPackage[];
  subscriptions: Subscription[];
  teachers: { id: string; fullName: string }[];
  onCreate: (input: { nameAr: string; description?: string; price: number; durationMonths: number; features?: string[]; teacherId?: string; packageType?: "subscription" | "sessions"; sessionsTotal?: number | null; validityDays?: number | null; category?: "basic" | "calls"; studyMode?: "online" | "offline" | "both"; level?: string | null; durationUnit?: "month" | "week" }) => Promise<void>;
  onUpdate: (id: string, input: { nameAr?: string; description?: string; price?: number; durationMonths?: number; teacherId?: string; isActive?: boolean; packageType?: "subscription" | "sessions"; sessionsTotal?: number | null; validityDays?: number | null; category?: "basic" | "calls"; studyMode?: "online" | "offline" | "both"; level?: string | null; durationUnit?: "month" | "week" }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [pName, setPName] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pMonths, setPMonths] = useState("1");
  const [pFeatures, setPFeatures] = useState("");
  const [pTeacherId, setPTeacherId] = useState("");
  const [pCategory, setPCategory] = useState<"basic" | "calls">("basic");
  const [pStudyMode, setPStudyMode] = useState<"online" | "offline" | "both">("online");
  const [pLevel, setPLevel] = useState("");
  const [pDurationUnit, setPDurationUnit] = useState<"month" | "week">("month");
  const [pPackageType, setPPackageType] = useState<"subscription" | "sessions">("subscription");
  const [pSessionsTotal, setPSessionsTotal] = useState("");
  const [pValidityDays, setPValidityDays] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setSaving(true);
    try {
      await onCreate({
        nameAr: pName,
        price: Number(pPrice),
        durationMonths: Number(pMonths) || 1,
        category: pCategory,
        studyMode: pCategory === "calls" ? "online" : pStudyMode,
        level: pLevel || null,
        durationUnit: pDurationUnit,
        packageType: pPackageType,
        sessionsTotal: pPackageType === "sessions" && pSessionsTotal ? Number(pSessionsTotal) : null,
        validityDays: pValidityDays ? Number(pValidityDays) : null,
        ...(pDesc ? { description: pDesc } : {}),
        ...(pFeatures.trim() ? { features: pFeatures.split("\n").map((f) => f.trim()).filter(Boolean) } : {}),
        ...(pTeacherId ? { teacherId: pTeacherId } : {}),
      });
      setPName(""); setPDesc(""); setPPrice(""); setPMonths("1"); setPFeatures(""); setPTeacherId("");
      setPCategory("basic"); setPStudyMode("online"); setPLevel(""); setPDurationUnit("month");
      setPPackageType("subscription"); setPSessionsTotal(""); setPValidityDays("");
      setShowForm(false);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "فشل إنشاء الباقة");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">الباقات والأسعار ({packages.length})</h2>
            <p className="text-xs text-muted-foreground">الأسعار المعتمدة — السيلز يشوفها ولا يقدر يعدّلها</p>
          </div>
          <Button variant="secondary" className="text-xs" onClick={() => setShowForm(!showForm)}>
            {showForm ? "إلغاء" : "+ باقة جديدة"}
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="mt-4 space-y-3 rounded-md border border-border bg-muted/40 p-4">
            {/* Category */}
            <div className="space-y-1.5">
              <Label>نظام الباقة</Label>
              <div className="flex gap-2">
                <label className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <input type="radio" name="category" checked={pCategory === "basic"} onChange={() => setPCategory("basic")} />
                  باقة أساسية (أونلاين/حضوري)
                </label>
                <label className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <input type="radio" name="category" checked={pCategory === "calls"} onChange={() => { setPCategory("calls"); setPStudyMode("online"); }} />
                  نظام المكالمات (أونلاين فقط)
                </label>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>اسم الباقة</Label>
                <Input value={pName} onChange={(e) => setPName(e.target.value)} required placeholder="مثال: مستوى A1 كامل" />
              </div>
              <div className="space-y-1.5">
                <Label>السعر</Label>
                <Input type="number" min={0} step="0.01" value={pPrice} onChange={(e) => setPPrice(e.target.value)} required placeholder="500" />
              </div>
              <div className="space-y-1.5">
                <Label>المدة</Label>
                <div className="flex gap-2">
                  <Input type="number" min={1} value={pMonths} onChange={(e) => setPMonths(e.target.value)} className="flex-1" />
                  <select value={pDurationUnit} onChange={(e) => setPDurationUnit(e.target.value as "month" | "week")} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="month">شهر</option>
                    <option value="week">أسبوع</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>المستوى</Label>
                <select value={pLevel} onChange={(e) => setPLevel(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">— بدون مستوى محدد —</option>
                  {["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              {/* Study mode — hidden for calls (online only) */}
              {pCategory === "basic" && (
                <div className="space-y-1.5">
                  <Label>نظام الدراسة</Label>
                  <select value={pStudyMode} onChange={(e) => setPStudyMode(e.target.value as "online" | "offline" | "both")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="online">أونلاين</option>
                    <option value="offline">حضوري</option>
                    <option value="both">أونلاين + حضوري</option>
                  </select>
                </div>
              )}

              {/* Session count — for calls / sessions packages */}
              <div className="space-y-1.5">
                <Label>نوع الباقة</Label>
                <select value={pPackageType} onChange={(e) => setPPackageType(e.target.value as "subscription" | "sessions")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="subscription">اشتراك زمني</option>
                  <option value="sessions">باقة بعدد حصص</option>
                </select>
              </div>
              {pPackageType === "sessions" && (
                <div className="space-y-1.5">
                  <Label>عدد الحصص</Label>
                  <Input type="number" min={1} value={pSessionsTotal} onChange={(e) => setPSessionsTotal(e.target.value)} placeholder="12 / 20 / 28" />
                </div>
              )}
              {pPackageType === "sessions" && (
                <div className="space-y-1.5">
                  <Label>صلاحية الباقة (أيام)</Label>
                  <Input type="number" min={1} value={pValidityDays} onChange={(e) => setPValidityDays(e.target.value)} placeholder="90" />
                </div>
              )}

              <div className="space-y-1.5 sm:col-span-2">
                <Label>الوصف</Label>
                <Input value={pDesc} onChange={(e) => setPDesc(e.target.value)} placeholder="وصف مختصر للباقة" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>المدرس المسؤول عن الباقة</Label>
                <select value={pTeacherId} onChange={(e) => setPTeacherId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">— بدون مدرس محدد —</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                </select>
                <small className="text-muted-foreground">يظهر اسم المدرس وتخصصه مع الباقة في الصفحة الرئيسية</small>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>المميزات (سطر لكل ميزة)</Label>
                <textarea value={pFeatures} onChange={(e) => setPFeatures(e.target.value)} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="24 محاضرة لايف&#10;واجبات أسبوعية&#10;شهادة إتمام" />
              </div>
            </div>
            {err && <p className="text-sm font-semibold text-danger">{err}</p>}
            <Button type="submit" disabled={saving}>{saving ? "جاري الحفظ..." : "إنشاء الباقة"}</Button>
          </form>
        )}
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {packages.length === 0 ? (
          <Card className="col-span-full py-10 text-center text-sm text-muted-foreground">لا توجد باقات بعد.</Card>
        ) : (
          packages.map((p) => (
            <Card key={p.id}>
              <div className="flex items-start justify-between">
                <div>
                  <b>{p.nameAr}</b>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge tone={p.category === "calls" ? "gold" : "brand"}>{p.category === "calls" ? "مكالمات" : "أساسية"}</Badge>
                    <Badge tone="muted">{p.durationMonths} {p.durationUnit === "week" ? "أسبوع" : "شهر"}</Badge>
                    {p.level && <Badge tone="muted">{p.level}</Badge>}
                    {p.studyMode && <Badge tone="muted">{p.studyMode === "online" ? "أونلاين" : p.studyMode === "offline" ? "حضوري" : "أونلاين+حضوري"}</Badge>}
                    {p.sessionsTotal && <Badge tone="gold">{p.sessionsTotal} حصة</Badge>}
                  </div>
                  <p className="mt-1 font-lat text-2xl font-bold text-brand">${p.price}</p>
                </div>
                <Badge tone={p.isActive ? "sage" : "muted"}>{p.isActive ? "مفعلة" : "معطلة"}</Badge>
              </div>
              {p.description && <p className="mt-2 text-xs text-muted-foreground">{p.description}</p>}
              {p.teacher && (
                <p className="mt-2 text-xs font-semibold text-brand2">
                  المدرس: {p.teacher.fullName}{p.teacher.specialty ? ` — ${p.teacher.specialty}` : ""}
                </p>
              )}
              {Array.isArray(p.features) && p.features.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Check className="size-3 text-sage" /> {f}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <small className="text-muted-foreground">{p._count?.subscriptions ?? 0} اشتراك</small>
                <div className="flex gap-1.5">
                  <select
                    value={p.teacher?.id ?? ""}
                    onChange={(e) => onUpdate(p.id, { teacherId: e.target.value || undefined }).catch(() => {})}
                    className="h-7 max-w-[120px] rounded-md border border-input bg-background px-1.5 text-[10px]"
                    title="تغيير المدرس"
                  >
                    <option value="">بدون مدرس</option>
                    {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                  </select>
                  <Button variant="ghost" className="min-h-7 px-2 py-1 text-xs" onClick={() => onUpdate(p.id, { isActive: !p.isActive })}>
                    {p.isActive ? "تعطيل" : "تفعيل"}
                  </Button>
                  <button
                    onClick={async () => {
                      if (!confirm(`حذف الباقة "${p.nameAr}" نهائياً؟ سيتم حذف اشتراكاتها وطلبات حجزها معها.`)) return;
                      try {
                        await onDelete(p.id);
                      } catch (err) {
                        alert(err instanceof Error ? err.message : "فشل حذف الباقة");
                      }
                    }}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Card>
        <h2 className="text-lg font-bold">كل الاشتراكات ({subscriptions.length})</h2>
        <div className="mt-4 space-y-2">
          {subscriptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد اشتراكات بعد.</p>
          ) : (
            subscriptions.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-background/60 p-3">
                <div>
                  <b className="text-sm">{s.student.fullName}</b>
                  <small className="block text-muted-foreground">{s.package.nameAr} · بواسطة {s.createdBy.fullName}</small>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={s.paymentStatus === "PAID" ? "sage" : "gold"}>{s.paymentStatus === "PAID" ? "مدفوع" : "معلق"}</Badge>
                  <b className="font-lat text-sm">${s.paidAmount ?? s.package.price}</b>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function AdminSalesReportSection({ report, onRefresh }: { report: AdminSalesReport | null; onRefresh: () => Promise<void> }) {
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">تقرير المبيعات الإجمالي</h2>
          <Button variant="secondary" className="text-xs" onClick={() => onRefresh()}>تحديث</Button>
        </div>
        {report && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {[
              { label: "إجمالي العملاء", value: report.totals.leads },
              { label: "غير مخصصين", value: report.totals.unassigned },
              { label: "المكالمات", value: report.totals.calls },
              { label: "الاشتراكات", value: report.totals.subscriptions },
              { label: "المدفوعة", value: report.totals.paidSubscriptions },
              { label: "الإيرادات", value: `$${report.totals.revenue}` },
            ].map((s) => (
              <div key={s.label} className="rounded-md bg-muted/60 p-3 text-center">
                <small className="text-muted-foreground">{s.label}</small>
                <b className="mt-1 block font-lat text-xl text-brand">{s.value}</b>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-bold">أداء كل موظف سيلز</h2>
        <div className="mt-4 space-y-2">
          {!report || report.perSales.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا يوجد موظفو سيلز بعد.</p>
          ) : (
            report.perSales.map((s) => (
              <div key={s.salesId} className="rounded-md border border-border bg-background/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <b className="text-sm">{s.name}</b>
                    <small className="block text-muted-foreground">{s.email ?? "—"}</small>
                  </div>
                  <Badge tone="brand">تحويل {s.conversionRate}%</Badge>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
                  {[
                    { l: "عملاء", v: s.leads },
                    { l: "جدد", v: s.newLeads },
                    { l: "محوّلون", v: s.converted },
                    { l: "مفقودون", v: s.lost },
                    { l: "مكالمات", v: s.calls },
                    { l: "إيراد", v: `$${s.revenue}` },
                  ].map((x) => (
                    <div key={x.l} className="rounded-md bg-muted/60 p-2">
                      <small className="text-xs text-muted-foreground">{x.l}</small>
                      <b className="block font-lat text-sm">{x.v}</b>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function AdminLeadsSection({
  leads,
  salesUsers,
  onAssign,
}: {
  leads: AdminLead[];
  salesUsers: PlatformUser[];
  onAssign: (leadId: string, salesId: string | null) => Promise<void>;
}) {
  const [filter, setFilter] = useState<"all" | "unassigned" | "assigned">("all");
  const filtered = leads.filter((l) =>
    filter === "all" ? true : filter === "unassigned" ? !l.salesId : !!l.salesId,
  );

  const STAGE_LABELS: Record<string, string> = {
    new: "جديد", contacted: "تم التواصل", interested: "مهتم", converted: "مشترك", lost: "مفقود",
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">توزيع العملاء على السيلز ({leads.length})</h2>
          <p className="text-xs text-muted-foreground">خصّص كل عميل لموظف لقياس أدائه — أو اتركه غير مخصص</p>
        </div>
        <div className="flex gap-1.5">
          {(["all", "unassigned", "assigned"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1 text-xs ${filter === f ? "bg-brand text-white" : "bg-muted/60 text-muted-foreground"}`}
            >
              {f === "all" ? "الكل" : f === "unassigned" ? "غير مخصص" : "مخصص"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">لا توجد عملاء في هذا الفلتر.</div>
        ) : (
          filtered.map((lead) => (
            <div key={lead.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-background/60 p-3">
              <div>
                <b className="text-sm">{lead.name}</b>
                <small className="block text-muted-foreground">
                  {lead.phone ?? lead.email ?? "—"} · {lead.need ?? "—"} · {lead._count?.callLogs ?? 0} مكالمة
                </small>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={lead.stage === "converted" ? "sage" : lead.stage === "lost" ? "danger" : lead.stage === "interested" ? "gold" : "muted"}>
                  {STAGE_LABELS[lead.stage] ?? lead.stage}
                </Badge>
                <select
                  value={lead.salesId ?? ""}
                  onChange={(e) => onAssign(lead.id, e.target.value || null).catch(() => {})}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="">غير مخصص</option>
                  {salesUsers.map((s) => (
                    <option key={s.id} value={s.id}>{s.fullName}</option>
                  ))}
                </select>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function AdminCertificatesSection({
  certificates,
  students,
  onIssue,
  onDelete,
}: {
  certificates: AdminCertificate[];
  students: PlatformUser[];
  onIssue: (input: { studentId: string; title: string; level?: string; description?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [cStudentId, setCStudentId] = useState("");
  const [cTitle, setCTitle] = useState("");
  const [cLevel, setCLevel] = useState("A1");
  const [cDesc, setCDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function handleIssue(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setSaving(true);
    try {
      await onIssue({
        studentId: cStudentId,
        title: cTitle,
        ...(cLevel ? { level: cLevel } : {}),
        ...(cDesc ? { description: cDesc } : {}),
      });
      setCStudentId(""); setCTitle(""); setCLevel("A1"); setCDesc("");
      setShowForm(false);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "فشل إصدار الشهادة");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">الشهادات الصادرة ({certificates.length})</h2>
            <p className="text-xs text-muted-foreground">تصدر فقط من الإدارة عند استيفاء شروط النجاح</p>
          </div>
          <Button variant="secondary" className="text-xs" onClick={() => setShowForm(!showForm)}>
            {showForm ? "إلغاء" : "+ إصدار شهادة"}
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleIssue} className="mt-4 space-y-3 rounded-md border border-border bg-muted/40 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>الطالب</Label>
                <select value={cStudentId} onChange={(e) => setCStudentId(e.target.value)} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">— اختر الطالب —</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.fullName} — {s.phone ?? s.email ?? "—"}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>المستوى</Label>
                <select value={cLevel} onChange={(e) => setCLevel(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="A1">A1</option>
                  <option value="A2">A2</option>
                  <option value="B1">B1</option>
                  <option value="B2">B2</option>
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>عنوان الشهادة</Label>
                <Input value={cTitle} onChange={(e) => setCTitle(e.target.value)} required placeholder="مثال: شهادة إتمام مستوى A1 — עברית שוטפת" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>وصف / ملاحظات</Label>
                <Input value={cDesc} onChange={(e) => setCDesc(e.target.value)} placeholder="اختياري" />
              </div>
            </div>
            {err && <p className="text-sm font-semibold text-danger">{err}</p>}
            <Button type="submit" disabled={saving}>{saving ? "جاري الإصدار..." : "إصدار الشهادة"}</Button>
          </form>
        )}
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {certificates.length === 0 ? (
          <Card className="col-span-full py-10 text-center text-sm text-muted-foreground">لم تصدر أي شهادات بعد.</Card>
        ) : (
          certificates.map((c) => (
            <Card key={c.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 place-items-center rounded-md bg-gold/15 text-gold">
                    <Award className="size-5" />
                  </span>
                  <div>
                    <b className="text-sm">{c.title}</b>
                    <small className="block text-muted-foreground">
                      {c.student.fullName} · {c.student.phone ?? c.student.email ?? "—"}
                    </small>
                    <small className="block text-muted-foreground">
                      {new Date(c.issuedAt).toLocaleDateString("ar-EG")}
                      {c.issuedBy && ` · بواسطة ${c.issuedBy.fullName}`}
                    </small>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {c.level && <Badge tone="gold">{c.level}</Badge>}
                  <button onClick={() => onDelete(c.id).catch(() => {})} className="rounded-md p-1.5 text-muted-foreground hover:bg-danger/10 hover:text-danger">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export function LecturesScreen() {
  const { studentSchedules, studentLectures, studentAttendance, studentAttendanceRate, studentTickets, createStudentTicket } =
    usePlatformStore();
  const [showRequest, setShowRequest] = useState(false);
  const [rqSubject, setRqSubject] = useState("");
  const [rqDesc, setRqDesc] = useState("");
  const [rqSaving, setRqSaving] = useState(false);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setRqSaving(true);
    try {
      await createStudentTicket({
        subject: rqSubject,
        category: "schedule",
        ...(rqDesc ? { description: rqDesc } : {}),
      });
      setRqSubject(""); setRqDesc(""); setShowRequest(false);
    } finally {
      setRqSaving(false);
    }
  }

  return (
    <AppShell role="STUDENT">
      <PageHeader
        title="المحاضرات والمواعيد"
        subtitle="جدول محاضراتك · سجل حضورك · طلبات تغيير المواعيد"
        actions={
          <Button onClick={() => setShowRequest(!showRequest)}>
            <CalendarDays className="size-4" />
            طلب تغيير موعد
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card className="p-3 text-center">
          <small className="text-muted-foreground">مواعيد أسبوعية</small>
          <b className="mt-1 block font-lat text-2xl text-brand">{studentSchedules.length}</b>
        </Card>
        <Card className="p-3 text-center">
          <small className="text-muted-foreground">نسبة حضوري</small>
          <b className="mt-1 block font-lat text-2xl text-sage">
            {studentAttendanceRate !== null ? `${studentAttendanceRate}%` : "—"}
          </b>
        </Card>
        <Card className="p-3 text-center">
          <small className="text-muted-foreground">طلبات مفتوحة</small>
          <b className="mt-1 block font-lat text-2xl text-gold">
            {studentTickets.filter((t) => t.status === "open" || t.status === "in_progress").length}
          </b>
        </Card>
      </div>

      {showRequest && (
        <Card className="mb-4 border-brand/30">
          <h3 className="font-bold">طلب تغيير موعد / استفسار</h3>
          <form onSubmit={handleRequest} className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label>الموضوع</Label>
              <Input
                value={rqSubject}
                onChange={(e) => setRqSubject(e.target.value)}
                required
                placeholder="مثال: طلب تغيير موعد محاضرة الأحد"
              />
            </div>
            <div className="space-y-1.5">
              <Label>التفاصيل (اختياري)</Label>
              <textarea
                value={rqDesc}
                onChange={(e) => setRqDesc(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="اشرح الموعد المطلوب أو السبب..."
              />
            </div>
            <Button type="submit" disabled={rqSaving}>{rqSaving ? "جاري الإرسال..." : "إرسال الطلب"}</Button>
          </form>
        </Card>
      )}

      <Card className="mb-4">
        <h2 className="text-lg font-bold">المحاضرات المباشرة ({studentLectures.length})</h2>
        <p className="text-xs text-muted-foreground">المحاضرات القادمة — انضم عبر رابط الاجتماع</p>
        <div className="mt-4 space-y-2">
          {studentLectures.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              لا توجد محاضرات مباشرة مجدولة حالياً.
            </div>
          ) : (
            studentLectures.map((l) => (
              <div key={l.id} className="rounded-md border border-border bg-background/60 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <b className="text-sm">{l.title}</b>
                      <Badge tone={l.status === "live" ? "sage" : "brand"}>
                        {l.status === "live" ? "مباشر الآن" : "مجدولة"}
                      </Badge>
                      {l.level && <Badge tone="muted">مستوى {l.level}</Badge>}
                      {l.groupName && <Badge tone="muted">{l.groupName}</Badge>}
                    </div>
                    <small className="mt-1 block text-muted-foreground">
                      {l.teacher?.fullName ?? "—"}
                      {" · "}
                      {new Date(l.startsAt).toLocaleString("ar-EG")}
                      {l.endsAt ? ` → ${new Date(l.endsAt).toLocaleString("ar-EG")}` : ""}
                    </small>
                    {l.description && <p className="mt-1 text-xs text-muted-foreground">{l.description}</p>}
                  </div>
                  {l.meetingUrl && (
                    <a
                      href={l.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-brand/90"
                    >
                      دخول المحاضرة ↗
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="text-lg font-bold">جدول محاضراتي ({studentSchedules.length})</h2>
          <div className="mt-4 space-y-2">
            {studentSchedules.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                لا توجد مواعيد مجدولة لك حالياً — ستظهر فور إضافتها من الإدارة.
              </div>
            ) : (
              studentSchedules.map((s) => (
                <div key={s.id} className="rounded-md border border-border bg-background/60 p-3">
                  <div className="flex items-center justify-between">
                    <b className="text-sm">{s.title}</b>
                    <div className="flex items-center gap-2">
                      {s.meetingUrl && (
                        <a
                          href={s.meetingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md bg-brand px-2.5 py-1 text-xs font-semibold text-primary-foreground"
                        >
                          دخول Zoom
                        </a>
                      )}
                      <Badge tone={s.location === "online" ? "brand" : "gold"}>
                        {s.location === "online" ? "أونلاين" : "أوفلاين"}
                      </Badge>
                    </div>
                  </div>
                  <small className="mt-1 block text-muted-foreground">
                    {DAY_NAMES[s.dayOfWeek]} · {s.startTime}–{s.endTime}
                    {s.groupName && ` · مجموعة ${s.groupName}`} · المدرس: {s.teacher.fullName}
                  </small>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-bold">طلباتي ({studentTickets.length})</h2>
          <div className="mt-4 space-y-2">
            {studentTickets.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                لا توجد طلبات — استخدم زر "طلب تغيير موعد" لإرسال طلب.
              </div>
            ) : (
              studentTickets.map((t) => (
                <div key={t.id} className="rounded-md border border-border bg-background/60 p-3">
                  <div className="flex items-center justify-between">
                    <b className="text-sm">{t.subject}</b>
                    <Badge tone={t.status === "resolved" ? "sage" : t.status === "in_progress" ? "gold" : "muted"}>
                      {t.status === "resolved" ? "تم الحل" : t.status === "in_progress" ? "قيد المعالجة" : t.status === "closed" ? "مغلقة" : "مفتوحة"}
                    </Badge>
                  </div>
                  <small className="mt-1 block text-muted-foreground">
                    {new Date(t.createdAt).toLocaleDateString("ar-EG")}
                    {t.support && ` · المسؤول: ${t.support.fullName}`}
                  </small>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

export function ChatsScreen() {
  const {
    myChatTeachers,
    teacherChatMsgs,
    supportChatMsgs,
    fetchMyChatTeachers,
    fetchTeacherChat,
    sendTeacherChatMsg,
    fetchSupportChat,
    sendSupportChatMsg,
    sendAiMessage,
  } = usePlatformStore();

  const [tab, setTab] = useState<"teacher" | "support" | "ai">("teacher");
  const [teacherId, setTeacherId] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [aiMsgs, setAiMsgs] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMyChatTeachers().catch(() => {});
    fetchTeacherChat().catch(() => {});
    fetchSupportChat().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [teacherChatMsgs, supportChatMsgs, aiMsgs, tab]);

  function speak(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = /[\u0590-\u05FF]/.test(text) ? "he-IL" : "ar-EG";
    u.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  function startVoice() {
    const SR = (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition
      ?? (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;
    if (!SR) {
      alert("المتصفح لا يدعم التعرّف الصوتي — جرّب Chrome");
      return;
    }
    const rec = new SR();
    rec.lang = "ar-EG";
    rec.interimResults = false;
    setListening(true);
    rec.onresult = (e: any) => setText(e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const msg = text.trim();
    if (!msg || sending) return;
    setSending(true);
    setText("");
    try {
      if (tab === "teacher") {
        await sendTeacherChatMsg(msg, teacherId || undefined);
      } else if (tab === "support") {
        await sendSupportChatMsg(msg);
      } else {
        const next = [...aiMsgs, { role: "user" as const, content: msg }];
        setAiMsgs(next);
        const reply = await sendAiMessage(msg, next.slice(-12));
        setAiMsgs([...next, { role: "assistant", content: reply }]);
        speak(reply);
      }
    } finally {
      setSending(false);
    }
  }

  const msgs =
    tab === "teacher" ? teacherChatMsgs
    : tab === "support" ? supportChatMsgs
    : [];

  return (
    <AppShell role="STUDENT">
      <PageHeader
        title="المحادثات"
        subtitle="تواصل مع مدرسك أو خدمة العملاء أو المساعد الذكي"
      />

      <div className="mb-4 flex gap-2">
        {(
          [
            { key: "teacher", label: "مع المدرس" },
            { key: "support", label: "خدمة العملاء" },
            { key: "ai", label: "المساعد الذكي" },
          ] as const
        ).map((t) => (
          <Button
            key={t.key}
            variant={tab === t.key ? "secondary" : "ghost"}
            className="text-xs"
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <Card>
        {tab === "teacher" && (
          <div className="mb-3 flex items-center gap-2">
            <Label className="shrink-0">المدرس:</Label>
            <select
              value={teacherId}
              onChange={(e) => {
                setTeacherId(e.target.value);
                fetchTeacherChat(e.target.value || undefined);
              }}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="">كل مدرسيك</option>
              {myChatTeachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName}{t.groupName ? ` (${t.groupName})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="max-h-[440px] min-h-[220px] space-y-2 overflow-y-auto rounded-md bg-muted/40 p-3">
          {tab === "ai" ? (
            aiMsgs.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                اسأل المساعد الذكي أي سؤال عن العبرية — يمكنك الكتابة أو التحدث بالمايك.
              </div>
            ) : (
              aiMsgs.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[80%] rounded-md p-2.5 text-sm ${
                    m.role === "user" ? "ms-auto bg-brand/10" : "bg-background"
                  }`}
                >
                  <small className="block text-[10px] text-muted-foreground">
                    {m.role === "user" ? "أنت" : "المساعد"}
                  </small>
                  <p className="mt-0.5 whitespace-pre-wrap">{m.content}</p>
                  {m.role === "assistant" && (
                    <button
                      type="button"
                      onClick={() => speak(m.content)}
                      className="mt-1 text-[10px] font-semibold text-brand"
                    >
                      استمع
                    </button>
                  )}
                </div>
              ))
            )
          ) : msgs.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              لا توجد رسائل بعد — اكتب أول رسالة بالأسفل.
            </div>
          ) : (
            msgs.map((m) => (
              <div
                key={m.id}
                className={`max-w-[80%] rounded-md p-2.5 text-sm ${
                  m.fromRole === "STUDENT" ? "ms-auto bg-brand/10" : "bg-background"
                }`}
              >
                <small className="block text-[10px] text-muted-foreground">
                  {m.fromRole === "STUDENT" ? "أنت" : m.fromRole === "TEACHER" ? "المدرس" : "خدمة العملاء"} ·{" "}
                  {new Date(m.createdAt).toLocaleString("ar-EG")}
                </small>
                <p className="mt-0.5 whitespace-pre-wrap">{m.content}</p>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="mt-3 flex gap-2">
          {tab === "ai" && (
            <Button
              type="button"
              variant={listening ? "secondary" : "ghost"}
              className="shrink-0"
              onClick={startVoice}
              disabled={listening}
            >
              {listening ? "أسمعك…" : "🎤"}
            </Button>
          )}
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={tab === "ai" ? "اكتب أو تحدث مع المساعد..." : "اكتب رسالتك..."}
            className="flex-1"
          />
          <Button type="submit" disabled={sending || !text.trim()}>
            {sending ? "..." : "إرسال"}
          </Button>
        </form>
      </Card>
    </AppShell>
  );
}

export function StudentHomeworkScreen() {
  const { studentHomework, submitHomework } = usePlatformStore();
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [blobs, setBlobs] = useState<Record<string, Blob>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleSubmitHw(hw: { id: string }) {
    setError("");
    setSubmitting(hw.id);
    try {
      let audioUrl: string | undefined;
      const blob = blobs[hw.id];
      if (blob) {
        const file = new File([blob], `homework-${Date.now()}.webm`, {
          type: blob.type || "audio/webm",
        });
        const uploaded = await uploadFile(file, "audio");
        audioUrl = uploaded.url;
      }
      const text = texts[hw.id]?.trim();
      if (!text && !audioUrl) {
        setError("اكتب إجابة نصية أو سجّل إجابة صوتية قبل التسليم");
        return;
      }
      await submitHomework(hw.id, {
        ...(text ? { submissionText: text } : {}),
        ...(audioUrl ? { submissionAudioUrl: audioUrl } : {}),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل تسليم الواجب");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <AppShell role="STUDENT">
      <PageHeader
        title="الواجبات"
        subtitle="واجباتك من مدرسيك — سلّم إجابة نصية أو تسجيلاً صوتياً"
      />
      {error && <p className="mb-3 rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}
      <div className="space-y-3">
        {studentHomework.length === 0 ? (
          <Card className="py-12 text-center text-sm text-muted-foreground">
            لا توجد واجبات مسندة لك حالياً.
          </Card>
        ) : (
          studentHomework.map((hw) => {
            const sub = hw.mySubmission;
            const st = sub?.status ?? "assigned";
            return (
            <Card key={hw.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <b>{hw.title}</b>
                  <small className="block text-muted-foreground">
                    المدرس: {hw.teacher.fullName}
                    {hw.groupName && ` · مجموعة ${hw.groupName}`}
                    {hw.dueDate && ` · التسليم: ${new Date(hw.dueDate).toLocaleDateString("ar-EG")}`}
                  </small>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={st === "graded" ? "sage" : st === "submitted" ? "gold" : st === "late" ? "danger" : "muted"}>
                    {st === "graded" ? "تم التصحيح" : st === "submitted" ? "مُسلَّم" : st === "late" ? "متأخر" : "مطلوب"}
                  </Badge>
                  {sub?.grade !== null && sub?.grade !== undefined && <Badge tone="brand">{sub.grade}%</Badge>}
                </div>
              </div>

              {hw.description && <p className="mt-2 text-sm text-muted-foreground">{hw.description}</p>}
              {hw.hebrewText && (
                <div className="mt-3">
                  <p dir="rtl" className="rounded-md bg-muted/60 p-3 font-he text-sm leading-7">{hw.hebrewText}</p>
                  <HebrewTTS text={hw.hebrewText} label="استمع للنص" />
                </div>
              )}

              {st === "graded" ? (
                <div className="mt-3 rounded-md border border-sage/30 bg-sage/5 p-3">
                  <div className="flex items-center gap-2">
                    <b className="text-sm">نتيجتك: {sub?.grade}%</b>
                  </div>
                  {sub?.feedback && <p className="mt-1 text-sm text-muted-foreground">ملاحظة المدرس: {sub.feedback}</p>}
                  {sub?.submissionText && (
                    <p className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground">إجابتك: {sub.submissionText}</p>
                  )}
                  {sub?.audioUrl && (
                    <audio controls src={mediaSrc(sub.audioUrl)} className="mt-2 w-full" />
                  )}
                </div>
              ) : st === "submitted" || st === "late" ? (
                <div className="mt-3 rounded-md bg-muted/60 p-3 text-sm text-muted-foreground">
                  تم تسليم الواجب — بانتظار تصحيح المدرس.
                  {sub?.submissionText && <p className="mt-2 border-t border-border pt-2 text-xs">إجابتك: {sub.submissionText}</p>}
                  {sub?.audioUrl && <audio controls src={mediaSrc(sub.audioUrl)} className="mt-2 w-full" />}
                </div>
              ) : (
                <div className="mt-4 space-y-3 border-t border-border pt-4">
                  <div className="space-y-1.5">
                    <Label>إجابتك الكتابية</Label>
                    <textarea
                      value={texts[hw.id] ?? ""}
                      onChange={(e) => setTexts((prev) => ({ ...prev, [hw.id]: e.target.value }))}
                      rows={3}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="اكتب إجابتك هنا..."
                    />
                  </div>
                  <AudioRecorder
                    label="سجّل إجابة صوتية"
                    onRecorded={(blob) => setBlobs((prev) => ({ ...prev, [hw.id]: blob }))}
                  />
                  <Button onClick={() => handleSubmitHw(hw)} disabled={submitting === hw.id}>
                    <Send className="size-4" />
                    {submitting === hw.id ? "جاري التسليم..." : "تسليم الواجب"}
                  </Button>
                </div>
              )}
            </Card>
            );
          })
        )}
      </div>
    </AppShell>
  );
}

export function SubscribeScreen() {
  const { user, refreshUser } = useAuth();
  const {
    publicPackages,
    fetchPublicPackages,
    myPaymentRequests,
    mySubscription,
    fetchMyBilling,
    createPaymentRequest,
  } = usePlatformStore();
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null);
  const [method, setMethod] = useState<"wallet" | "instapay" | null>(null);
  const [studyMode, setStudyMode] = useState<"online" | "offline" | null>(null);
  const [shot, setShot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const pendingReq = myPaymentRequests.find((r) => r.status === "pending");
  const lastRejected = myPaymentRequests.find((r) => r.status === "rejected");
  const selectedPkg = publicPackages.find((p) => p.id === selectedPkgId) ?? null;

  useEffect(() => {
    fetchPublicPackages().catch(() => {});
    fetchMyBilling().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh the subscription flag while a request is pending review
  useEffect(() => {
    if (!pendingReq) return;
    const t = setInterval(() => {
      refreshUser().catch(() => {});
      fetchMyBilling().catch(() => {});
    }, 20000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingReq?.id]);

  async function copyNumber() {
    try {
      await navigator.clipboard.writeText("01270869510");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  }

  async function handleSubmit() {
    if (!selectedPkg || !method || !studyMode) return;
    setError("");
    if (!shot) {
      setError("ارفع سكرين شوت لإثبات التحويل قبل الإرسال");
      return;
    }
    setSubmitting(true);
    try {
      const uploaded = await uploadFile(shot, "payments");
      await createPaymentRequest({
        packageId: selectedPkg.id,
        method,
        studyMode,
        screenshotUrl: uploaded.url,
      });
      setSelectedPkgId(null);
      setMethod(null);
      setStudyMode(null);
      setShot(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر إرسال طلب الحجز — حاول مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell role="STUDENT">
      <PageHeader
        title="الباقات والاشتراك"
        subtitle="اختر باقتك، حوّل على الرقم، وارفع إثبات التحويل — الإدارة تؤكد وتفتح حسابك"
      />

      {user?.hasActiveSubscription ? (
        <Card className="mx-auto max-w-lg py-10 text-center">
          <Check className="mx-auto size-10 text-sage" />
          <h2 className="mt-3 text-lg font-bold">اشتراكك نشط</h2>
          {mySubscription?.package && (
            <p className="mt-1 text-sm text-muted-foreground">
              {mySubscription.package.nameAr} — حتى{" "}
              {mySubscription.endDate ? new Date(mySubscription.endDate).toLocaleDateString("ar-EG") : "—"}
            </p>
          )}
          <Link to="/dashboard">
            <Button className="mt-5">الانتقال للداشبورد</Button>
          </Link>
        </Card>
      ) : pendingReq ? (
        <Card className="mx-auto max-w-lg py-10 text-center">
          <Badge tone="gold" className="mx-auto">قيد المراجعة</Badge>
          <h2 className="mt-3 text-lg font-bold">طلب حجزك وصل الإدارة</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {pendingReq.package?.nameAr} — {pendingReq.package?.price} ج.م ·{" "}
            {pendingReq.method === "wallet" ? "محفظة إلكترونية" : "انستاباي"}
            <br />
            تم الإرسال {new Date(pendingReq.createdAt).toLocaleString("ar-EG")}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            بمجرد تأكيد الإدارة للتحويل، ستتفتح كل أقسام المنصة تلقائياً — سنوافيك بإشعار.
          </p>
          <Button
            variant="secondary"
            className="mt-5"
            onClick={() => {
              refreshUser().catch(() => {});
              fetchMyBilling().catch(() => {});
            }}
          >
            تحديث حالة الطلب
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {lastRejected && (
            <Card className="border-danger/40 bg-danger/5">
              <b className="text-sm text-danger">تم رفض طلبك السابق ({lastRejected.package?.nameAr})</b>
              <p className="mt-1 text-xs text-muted-foreground">
                {lastRejected.rejectReason || "لم يتم التحقق من التحويل"} — يمكنك إعادة الحجز أو التواصل مع الدعم.
              </p>
            </Card>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {publicPackages.map((pkg) => (
              <Card key={pkg.id} className="flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <b>{pkg.nameAr}</b>
                  <Badge tone="brand">{pkg.durationMonths === 1 ? "شهرياً" : `${pkg.durationMonths} شهور`}</Badge>
                </div>
                <p className="mt-2 text-2xl font-bold text-brand">
                  {pkg.price} <span className="text-sm font-normal text-muted-foreground">ج.م</span>
                </p>
                {pkg.description && (
                  <p className="mt-2 text-xs text-muted-foreground">{pkg.description}</p>
                )}
                {pkg.teacher && (
                  <small className="mt-2 block text-muted-foreground">
                    المدرس: {pkg.teacher.fullName}
                    {pkg.teacher.specialty && ` · ${pkg.teacher.specialty}`}
                  </small>
                )}
                {(pkg.features ?? []).length > 0 && (
                  <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {(pkg.features ?? []).slice(0, 5).map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <Check className="size-3 text-sage" /> {f}
                      </li>
                    ))}
                  </ul>
                )}
                <Button
                  className="mt-4 w-full"
                  variant={selectedPkgId === pkg.id ? "secondary" : "primary"}
                  onClick={() => {
                    setSelectedPkgId(selectedPkgId === pkg.id ? null : pkg.id);
                    setMethod(null);
                    setShot(null);
                    setError("");
                  }}
                >
                  احجز الآن
                </Button>
              </Card>
            ))}
          </div>

          {selectedPkg && (
            <Card className="mx-auto max-w-xl">
              <h3 className="font-bold">تفاصيل الحجز — {selectedPkg.nameAr}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                المبلغ المطلوب: <b className="text-brand">{selectedPkg.price} ج.م</b>
              </p>

              <div className="mt-4 space-y-1.5">
                <Label>نظام الحضور</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStudyMode("online")}
                    className={`rounded-md border p-3 text-sm font-semibold transition ${
                      studyMode === "online"
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-border hover:border-brand/50"
                    }`}
                  >
                    أونلاين
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudyMode("offline")}
                    className={`rounded-md border p-3 text-sm font-semibold transition ${
                      studyMode === "offline"
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-border hover:border-brand/50"
                    }`}
                  >
                    أوفلاين (حضوري)
                  </button>
                </div>
              </div>

              {studyMode && (
                <div className="mt-4 space-y-1.5">
                <Label>طريقة التحويل</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMethod("instapay")}
                    className={`rounded-md border p-3 text-sm font-semibold transition ${
                      method === "instapay"
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-border hover:border-brand/50"
                    }`}
                  >
                    انستاباي InstaPay
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod("wallet")}
                    className={`rounded-md border p-3 text-sm font-semibold transition ${
                      method === "wallet"
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-border hover:border-brand/50"
                    }`}
                  >
                    محفظة إلكترونية
                  </button>
                </div>
                </div>
              )}

              {method && (
                <div className="mt-4 space-y-4">
                  <div className="rounded-md border border-brand/30 bg-brand/5 p-4 text-center">
                    <small className="block text-muted-foreground">
                      {method === "instapay"
                        ? "حوّل على رقم انستاباي التالي:"
                        : "حوّل على رقم المحفظة الإلكترونية التالي (فودافون كاش / اتصالات كاش / أورانج كاش):"}
                    </small>
                    <div className="mt-2 flex items-center justify-center gap-3">
                      <b dir="ltr" className="font-lat text-xl tracking-widest">{PAYMENT_NUMBER_DISPLAY}</b>
                      <Button variant="secondary" className="min-h-8 px-3 text-xs" onClick={copyNumber}>
                        {copied ? "تم النسخ" : "نسخ الرقم"}
                      </Button>
                    </div>
                  </div>

                  <ol className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Badge tone="brand" className="shrink-0">1</Badge>
                      حوّل المبلغ ({selectedPkg.price} ج.م) على الرقم أعلاه
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge tone="brand" className="shrink-0">2</Badge>
                      ارفع سكرين شوت لإثبات التحويل واضغط إرسال
                    </li>
                  </ol>

                  <div className="space-y-1.5">
                    <Label>سكرين شوت إثبات التحويل</Label>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,application/pdf"
                      onChange={(e) => setShot(e.target.files?.[0] ?? null)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:ml-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1 file:text-xs"
                    />
                    {shot && <small className="block text-sage">{shot.name}</small>}
                  </div>

                  {error && (
                    <p className="rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>
                  )}

                  <Button
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={submitting || !shot}
                  >
                    {submitting ? "جاري الإرسال..." : "إرسال طلب الحجز"}
                  </Button>
                </div>
              )}
            </Card>
          )}

          <Card className="text-center">
            <p className="text-sm text-muted-foreground">
              تحتاج مساعدة في الحجز؟ تواصل معنا على واتساب
            </p>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("أهلاً، محتاج مساعدة في حجز باقة على منصة עברית שוטפת")}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-md bg-sage px-4 py-2 text-sm font-bold text-white hover:bg-sage/90"
            >
              تواصل واتساب — {PAYMENT_NUMBER_DISPLAY}
            </a>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

export function CertificatesScreen() {
  const { studentCertificates } = usePlatformStore();

  return (
    <AppShell role="STUDENT">
      <PageHeader
        title="شهاداتي"
        subtitle="الشهادات التي حصلت عليها عند إتمام المستويات"
      />
      {studentCertificates.length === 0 ? (
        <Card className="py-16 text-center">
          <GraduationCap className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            لا توجد شهادات بعد — تُصدر من الإدارة عند استيفاء شروط النجاح في المستوى.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {studentCertificates.map((c) => (
            <Card key={c.id} className="border-gold/40">
              <div className="flex items-start gap-3">
                <span className="grid size-11 place-items-center rounded-md bg-gold/15 text-gold">
                  <Award className="size-5" />
                </span>
                <div className="flex-1">
                  <b>{c.title}</b>
                  {c.level && <Badge tone="gold" >مستوى {c.level}</Badge>}
                  {c.description && <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>}
                  <small className="mt-2 block text-muted-foreground">
                    صدرت في {new Date(c.issuedAt).toLocaleDateString("ar-EG")}
                    {c.issuedBy && ` · بواسطة ${c.issuedBy.fullName}`}
                  </small>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}

export function CoursesScreen() {
  const { materials, loadingData } = usePlatformStore();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <AppShell role="STUDENT">
      <PageHeader
        title="كورساتي"
        subtitle="الكورسات والفيديوهات والملفات المنشورة لك من مدرسيك — افتحها وشغّلها داخل المنصة"
      />
      {loadingData ? (
        <Card className="py-12 text-center text-sm text-muted-foreground">جاري التحميل...</Card>
      ) : materials.length === 0 ? (
        <Card className="py-12 text-center text-sm text-muted-foreground">
          لا توجد كورسات منشورة لك حالياً — ستظهر هنا فور نشرها من الإدارة.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {materials.map((m) => (
            <Card key={m.id}>
              <div className="flex items-center justify-between">
                <Badge tone={m.type === "VIDEO" ? "brand" : "gold"}>
                  {m.type === "VIDEO" ? "فيديو" : m.type === "AUDIO" ? "ملف صوتي" : "ملف"}
                </Badge>
                <Badge tone="sage">مستوى {m.level}</Badge>
              </div>
              <h2 className="mt-3 font-bold">{m.title}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{m.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                المدرس: {m.assignedTeacherName} · {m.fileSize}
              </p>
              <Button
                variant="secondary"
                className="mt-3 w-full text-xs"
                onClick={() => setOpenId(openId === m.id ? null : m.id)}
              >
                {openId === m.id ? "إغلاق" : "فتح المادة داخل المنصة"}
              </Button>
              {openId === m.id && (
                <div className="mt-3">
                  <MaterialPlayer material={m} />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}

export function ExamsScreen() {
  const { exams, submitExam, loadingData } = usePlatformStore();
  const [openExamId, setOpenExamId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [writtenText, setWrittenText] = useState("");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const openExam = exams.find((e) => e.id === openExamId) ?? null;

  function openExamView(id: string) {
    setOpenExamId(openExamId === id ? null : id);
    setAnswers({});
    setWrittenText("");
    setRecordedBlob(null);
    setSubmitError("");
  }

  async function handleSubmit(exam: Exam) {
    setSubmitError("");
    setSubmitting(true);
    try {
      let recordingUrl: string | undefined;
      if (exam.type === "speaking") {
        if (!recordedBlob) {
          setSubmitError("سجّل صوتك أولاً قبل التسليم");
          setSubmitting(false);
          return;
        }
        const file = new File([recordedBlob], `speaking-${Date.now()}.webm`, {
          type: recordedBlob.type || "audio/webm",
        });
        const uploaded = await uploadFile(file, "audio");
        recordingUrl = uploaded.url;
      }

      const payload: { answers?: Record<string, string>; recordingUrl?: string } = {};
      if (recordingUrl) payload.recordingUrl = recordingUrl;
      if (exam.type === "listening") {
        payload.answers = { "0": writtenText };
      } else if (exam.type === "translation" || exam.type === "reading") {
        const itemCount = (exam.questions.items ?? []).length;
        payload.answers = itemCount ? answers : { "0": writtenText };
      } else if (exam.type === "speaking") {
        // speaking only sends recording
      }

      await submitExam(exam.id, payload);
      setOpenExamId(null);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "فشل تسليم الامتحان");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell role="STUDENT">
      <PageHeader
        title="الامتحانات"
        subtitle="الامتحانات المنشورة من مدرسيك — سلّم إجاباتك أو تسجيلك الصوتي"
      />
      {loadingData ? (
        <Card className="py-12 text-center text-sm text-muted-foreground">جاري التحميل...</Card>
      ) : exams.length === 0 ? (
        <Card className="py-12 text-center text-sm text-muted-foreground">
          لا توجد امتحانات منشورة لك حالياً.
        </Card>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => (
            <Card key={exam.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-md bg-brand/10 text-brand">
                    <FileCheck className="size-5" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <b>{exam.title}</b>
                      <Badge tone="gold">{EXAM_TYPE_LABELS[exam.type]}</Badge>
                      {exam.myResult ? (
                        <Badge tone="sage">
                          تم التسليم
                          {exam.myResult.score != null ? ` — ${exam.myResult.score}%` : ""}
                        </Badge>
                      ) : (
                        <Badge tone="muted">لم يُسلَّم</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {exam.description || "بدون وصف"} · المدرس: {exam.assignedTeacherName ?? "—"}
                    </p>
                    {exam.myResult?.feedback && (
                      <p className="mt-1 rounded-sm bg-sage/10 px-2 py-1 text-xs text-sage">
                        ملاحظات المدرس: {exam.myResult.feedback}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant={exam.myResult ? "ghost" : "secondary"}
                  className="text-xs"
                  onClick={() => openExamView(exam.id)}
                >
                  {openExamId === exam.id
                    ? "إغلاق"
                    : exam.myResult
                      ? "عرض النتيجة"
                      : "بدء الامتحان"}
                </Button>
              </div>

              {openExamId === exam.id && (
                <div className="mt-4 space-y-4 border-t border-border pt-4">
                  {exam.myResult ? (
                    /* Already submitted — show results, no re-submission */
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 rounded-md bg-sage/10 p-3">
                        <Check className="size-5 text-sage" />
                        <div>
                          <b className="text-sm">تم تسليم هذا الامتحان — لا يمكن إعادة التسليم</b>
                          {exam.myResult.score != null && (
                            <p className="text-xs text-muted-foreground">
                              درجتك: <b className="text-sage">{exam.myResult.score}%</b>
                            </p>
                          )}
                        </div>
                      </div>

                      {exam.myResult.feedback && (
                        <p className="rounded-sm bg-sage/10 px-3 py-2 text-sm text-sage">
                          <b>ملاحظة المدرس/الإدارة:</b> {exam.myResult.feedback}
                        </p>
                      )}

                      {/* Show per-question results for auto-graded items */}
                      {(exam.questions.items ?? []).length > 0 && (
                        <div className="space-y-2">
                          <small className="font-semibold text-muted-foreground">
                            مراجعة الإجابات:
                          </small>
                          {(exam.questions.items ?? []).map((item, qi) => {
                            const studentAns = (exam.myResult?.answers as Record<string, string>)?.[qi] ?? "";
                            const isMcq = item.type === "mcq" || item.type === "truefalse";
                            const isCorrect =
                              isMcq &&
                              studentAns !== "" &&
                              Number(studentAns) === (item.correctIndex ?? -1);
                            return (
                              <div
                                key={qi}
                                className={`rounded-md border p-3 ${
                                  isMcq
                                    ? isCorrect
                                      ? "border-sage/40 bg-sage/5"
                                      : "border-danger/40 bg-danger/5"
                                    : "border-border bg-muted/40"
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  {isMcq ? (
                                    isCorrect ? (
                                      <Check className="mt-0.5 size-4 shrink-0 text-sage" />
                                    ) : (
                                      <XCircle className="mt-0.5 size-4 shrink-0 text-danger" />
                                    )
                                  ) : null}
                                  <div className="flex-1">
                                    <p dir="rtl" className="font-he text-sm font-semibold">
                                      {qi + 1}. {item.prompt}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      إجابتك:{" "}
                                      <b className={isMcq ? (isCorrect ? "text-sage" : "text-danger") : ""}>
                                        {isMcq
                                          ? item.options?.[Number(studentAns)] ?? studentAns
                                          : studentAns || "—"}
                                      </b>
                                    </p>
                                    {isMcq && !isCorrect && (
                                      <p className="text-xs text-sage">
                                        الإجابة الصحيحة:{" "}
                                        <b>{item.options?.[item.correctIndex ?? 0] ?? "—"}</b>
                                      </p>
                                    )}
                                    {!isMcq && (
                                      <p className="mt-1 text-xs text-muted-foreground">
                                        (التصحيح يدوي من المدرس/الإدارة)
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {exam.myResult.recordingUrl && (
                        <div>
                          <small className="mb-1 block text-muted-foreground">تسجيلك الصوتي:</small>
                          <audio controls src={mediaSrc(exam.myResult.recordingUrl)} className="w-full" />
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Not submitted — show exam form */
                    <>
                      {exam.questions.paragraph && (
                        <div className="rounded-md bg-muted/60 p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <small className="text-muted-foreground">
                              {exam.type === "speaking"
                                ? "اقرأ الفقرة التالية بصوتك وسجّلها:"
                                : "النص:"}
                            </small>
                            <HebrewTTS text={exam.questions.paragraph} />
                          </div>
                          <p dir="rtl" className="font-he text-base leading-8">
                            {exam.questions.paragraph}
                          </p>
                        </div>
                      )}

                      {exam.type === "listening" && (
                        <>
                          {exam.questions.audioUrl ? (
                            <div className="rounded-md bg-muted/60 p-4">
                              <small className="mb-1 block text-muted-foreground">
                                استمع للتسجيل ثم اكتب ما سمعته وفهمته بالعبرية:
                              </small>
                              <audio controls src={mediaSrc(exam.questions.audioUrl)} className="w-full" />
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">لا يوجد تسجيل صوتي مرفق.</p>
                          )}
                          <textarea
                            value={writtenText}
                            onChange={(e) => setWrittenText(e.target.value)}
                            dir="rtl"
                            className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 font-he text-sm outline-none"
                            placeholder="כתוב כאן את מה ששמעת והבנת..."
                          />
                        </>
                      )}

                      {(exam.type === "translation" || exam.type === "reading") && (
                        <div className="space-y-3">
                          {(exam.questions.items ?? []).map((item, idx) => (
                            <div key={idx} className="rounded-md border border-border bg-background/60 p-3">
                              <div className="flex items-start justify-between gap-2">
                                <p dir="rtl" className="flex-1 font-he text-sm font-semibold">
                                  {idx + 1}. {item.prompt}
                                </p>
                                <HebrewTTS text={item.prompt} label="استمع" />
                              </div>

                              {item.type === "mcq" && (
                                <div className="mt-2 space-y-1.5">
                                  {(item.options ?? []).map((opt, oi) => (
                                    <button
                                      key={oi}
                                      type="button"
                                      onClick={() => setAnswers((p) => ({ ...p, [idx]: String(oi) }))}
                                      className={`flex w-full items-center gap-2 rounded-md border p-2.5 text-right text-sm ${
                                        answers[idx] === String(oi)
                                          ? "border-brand bg-brand/10 font-bold text-brand"
                                          : "border-border hover:border-brand/50"
                                      }`}
                                    >
                                      <span className={`grid size-5 shrink-0 place-items-center rounded-full border text-xs ${
                                        answers[idx] === String(oi)
                                          ? "border-brand bg-brand text-primary-foreground"
                                          : "border-border"
                                      }`}>
                                        {answers[idx] === String(oi) ? "✓" : oi + 1}
                                      </span>
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                              )}

                              {item.type === "truefalse" && (
                                <div className="mt-2 flex gap-2">
                                  {["صح", "خطأ"].map((opt, oi) => (
                                    <button
                                      key={oi}
                                      type="button"
                                      onClick={() => setAnswers((p) => ({ ...p, [idx]: String(oi) }))}
                                      className={`flex-1 rounded-md border p-2.5 text-sm ${
                                        answers[idx] === String(oi)
                                          ? "border-brand bg-brand/10 font-bold text-brand"
                                          : "border-border hover:border-brand/50"
                                      }`}
                                    >
                                      {opt} {answers[idx] === String(oi) && "✓"}
                                    </button>
                                  ))}
                                </div>
                              )}

                              {(!item.type || item.type === "text") && (
                                <Input
                                  dir="rtl"
                                  className="mt-2 font-he"
                                  placeholder="إجابتك هنا..."
                                  value={answers[idx] ?? ""}
                                  onChange={(e) =>
                                    setAnswers((p) => ({ ...p, [idx]: e.target.value }))
                                  }
                                />
                              )}
                            </div>
                          ))}
                          {(exam.questions.items ?? []).length === 0 && (
                            <textarea
                              value={writtenText}
                              onChange={(e) => setWrittenText(e.target.value)}
                              dir="rtl"
                              className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 font-he text-sm outline-none"
                              placeholder="اكتب إجابتك هنا..."
                            />
                          )}
                        </div>
                      )}

                      {exam.type === "speaking" && (
                        <AudioRecorder
                          label="سجّل قراءتك للفقرة"
                          onRecorded={(blob) => setRecordedBlob(blob)}
                        />
                      )}

                      {submitError && (
                        <p className="rounded-md bg-danger/10 p-2 text-xs font-semibold text-danger">
                          {submitError}
                        </p>
                      )}

                      <Button
                        className="w-full"
                        disabled={submitting}
                        onClick={() => handleSubmit(exam)}
                      >
                        <Send className="size-4" />
                        {submitting ? "جاري التسليم..." : "تسليم الامتحان"}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function AdminResultsSection({
  results,
  onRefresh,
  onGrade,
}: {
  results: import("../hooks/use-platform-store").ExamResult[];
  onRefresh: () => Promise<void>;
  onGrade: (id: string, input: { score?: number; feedback?: string }) => Promise<void>;
}) {
  const [drafts, setDrafts] = useState<Record<string, { score: string; feedback: string }>>({});

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">تسليمات الطلاب — كل الامتحانات</h2>
          <p className="text-xs text-muted-foreground">
            عرض كل تسليمات الطلاب مع درجاتهم وملاحظات المدرسين — يمكنك تعديل الدرجة وإرسال ملاحظة للطالب
          </p>
        </div>
        <Button variant="secondary" className="text-xs" onClick={() => onRefresh()}>
          تحديث القائمة
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        {results.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            لا توجد تسليمات من الطلاب حالياً.
          </div>
        ) : (
          results.map((r) => (
            <div key={r.id} className="rounded-md border border-border bg-background/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <b className="text-sm">{r.student?.fullName ?? "طالب"}</b>
                  <small className="block text-muted-foreground">
                    {r.student?.phone ?? r.student?.email ?? "—"} · {r.exam?.title ?? "امتحان"} ·{" "}
                    {new Date(r.submittedAt).toLocaleString("ar-EG")}
                  </small>
                </div>
                <Badge tone={r.score !== null && r.score !== undefined ? "sage" : "muted"}>
                  {r.score !== null && r.score !== undefined ? `${r.score}%` : "بانتظار التصحيح"}
                </Badge>
              </div>

              {r.recordingUrl && (
                <div className="mt-2">
                  <small className="mb-1 block text-muted-foreground">تسجيل الطالب الصوتي</small>
                  <audio controls src={mediaSrc(r.recordingUrl)} className="w-full" />
                </div>
              )}

              {r.answers && Object.keys(r.answers).length > 0 && (
                <div className="mt-2 space-y-1">
                  {Object.entries(r.answers).map(([k, v]) => (
                    <div key={k} className="rounded-sm bg-muted/60 px-3 py-1 text-xs">
                      <b className="text-muted-foreground">إجابة {Number(k) + 1}:</b> {v}
                    </div>
                  ))}
                </div>
              )}

              {r.feedback && (
                <p className="mt-2 rounded-sm bg-sage/10 px-2 py-1 text-xs text-sage">
                  ملاحظة سابقة: {r.feedback}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="الدرجة %"
                  className="h-9 w-28"
                  value={drafts[r.id]?.score ?? (r.score?.toString() ?? "")}
                  onChange={(e) =>
                    setDrafts((p) => ({
                      ...p,
                      [r.id]: { score: e.target.value, feedback: p[r.id]?.feedback ?? "" },
                    }))
                  }
                />
                <Input
                  placeholder="ملاحظة للطالب (تظهر فوراً في لوحته)"
                  className="h-9 flex-1"
                  value={drafts[r.id]?.feedback ?? (r.feedback ?? "")}
                  onChange={(e) =>
                    setDrafts((p) => ({
                      ...p,
                      [r.id]: { score: p[r.id]?.score ?? "", feedback: e.target.value },
                    }))
                  }
                />
                <Button
                  variant="secondary"
                  className="min-h-9 px-3 text-xs"
                  onClick={() => {
                    const draft = drafts[r.id];
                    const payload: { score?: number; feedback?: string } = {};
                    const scoreVal = draft?.score ? Number(draft.score) : undefined;
                    const feedbackVal = draft?.feedback || undefined;
                    if (scoreVal !== undefined) payload.score = scoreVal;
                    if (feedbackVal) payload.feedback = feedbackVal;
                    onGrade(r.id, payload);
                  }}
                >
                  حفظ الدرجة والملاحظة
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

type SalesSection = "leads" | "calls" | "subscriptions" | "stats";

const LEAD_STAGES: Record<string, string> = {
  new: "جديد",
  contacted: "تم التواصل",
  interested: "مهتم",
  follow_up: "متابعة",
  converted: "مشترك",
  lost: "خسر",
};

const CALL_OUTCOMES: Record<string, string> = {
  interested: "مهتم",
  not_interested: "غير مهتم",
  callback: "متابعة لاحقاً",
  no_answer: "لم يرد",
  converted: "تحول لمشترك",
  wrong_number: "رقم خطأ",
};

export function SalesScreen() {
  const {
    salesLeads,
    callLogs,
    packages,
    subscriptions,
    salesStats,
    users,
    loadingData,
    addLead,
    updateLead,
    deleteLead,
    addCallLog,
    addSubscription,
    updateSubscription,
    fetchSalesData,
  } = usePlatformStore();

  const [activeSection, setActiveSection] = useState<SalesSection>("leads");
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [editingLead, setEditingLead] = useState<import("../hooks/use-platform-store").SalesLead | null>(null);
  const [showCallForm, setShowCallForm] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [showSubForm, setShowSubForm] = useState(false);
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);

  // Lead form
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadSource, setLeadSource] = useState("");
  const [leadNeed, setLeadNeed] = useState("");
  const [leadNotes, setLeadNotes] = useState("");
  const [leadSaving, setLeadSaving] = useState(false);
  const [leadError, setLeadError] = useState("");

  // Call form
  const [callNotes, setCallNotes] = useState("");
  const [callOutcome, setCallOutcome] = useState("callback");
  const [callFollowUp, setCallFollowUp] = useState("");
  const [callSaving, setCallSaving] = useState(false);

  // Subscription form
  const [subStudentId, setSubStudentId] = useState("");
  const [subPackageId, setSubPackageId] = useState("");
  const [subPaidAmount, setSubPaidAmount] = useState("");
  const [subPaymentStatus, setSubPaymentStatus] = useState("PENDING");
  const [subNotes, setSubNotes] = useState("");
  const [subSaving, setSubSaving] = useState(false);

  const students = users.filter((u) => u.role === "STUDENT");

  function resetLeadForm() {
    setLeadName("");
    setLeadEmail("");
    setLeadPhone("");
    setLeadSource("");
    setLeadNeed("");
    setLeadNotes("");
    setEditingLead(null);
    setShowLeadForm(false);
  }

  async function handleSaveLead(e: React.FormEvent) {
    e.preventDefault();
    setLeadError("");
    setLeadSaving(true);
    try {
      const payload = {
        name: leadName,
        ...(leadEmail ? { email: leadEmail } : {}),
        ...(leadPhone ? { phone: leadPhone } : {}),
        ...(leadSource ? { source: leadSource } : {}),
        ...(leadNeed ? { need: leadNeed } : {}),
        ...(leadNotes ? { notes: leadNotes } : {}),
      };
      if (editingLead) {
        await updateLead(editingLead.id, payload);
      } else {
        await addLead(payload);
      }
      resetLeadForm();
    } catch (err) {
      setLeadError(err instanceof Error ? err.message : "فشل الحفظ");
    } finally {
      setLeadSaving(false);
    }
  }

  async function handleLogCall(e: React.FormEvent) {
    e.preventDefault();
    setCallSaving(true);
    try {
      await addCallLog({
        leadId: selectedLeadId,
        notes: callNotes,
        outcome: callOutcome,
        ...(callFollowUp ? { nextFollowUp: callFollowUp } : {}),
      });
      setCallNotes("");
      setCallOutcome("callback");
      setCallFollowUp("");
      setSelectedLeadId("");
      setShowCallForm(false);
    } finally {
      setCallSaving(false);
    }
  }

  async function handleCreateSub(e: React.FormEvent) {
    e.preventDefault();
    setSubSaving(true);
    try {
      await addSubscription({
        studentId: subStudentId,
        packageId: subPackageId,
        ...(subPaidAmount ? { paidAmount: Number(subPaidAmount) } : {}),
        paymentStatus: subPaymentStatus,
        ...(subNotes ? { notes: subNotes } : {}),
      });
      setSubStudentId("");
      setSubPackageId("");
      setSubPaidAmount("");
      setSubPaymentStatus("PENDING");
      setSubNotes("");
      setShowSubForm(false);
    } finally {
      setSubSaving(false);
    }
  }

  function openEditLead(lead: import("../hooks/use-platform-store").SalesLead) {
    setEditingLead(lead);
    setLeadName(lead.name);
    setLeadEmail(lead.email ?? "");
    setLeadPhone(lead.phone ?? "");
    setLeadSource(lead.source ?? "");
    setLeadNeed(lead.need ?? "");
    setLeadNotes(lead.notes ?? "");
    setShowLeadForm(true);
  }

  const stats = salesStats;

  return (
    <AppShell role="SALES" activeSection={activeSection} onSelectSection={(s) => setActiveSection(s as SalesSection)}>
      <PageHeader
        title="لوحة المبيعات"
        subtitle="إدارة العملاء المحتملين والمكالمات والاشتراكات والتقارير"
        actions={
          <>
            <Button variant="secondary" onClick={() => { setSelectedLeadId(salesLeads[0]?.id ?? ""); setShowCallForm(true); }}>
              <Headphones className="size-4" />
              تسجيل مكالمة
            </Button>
            <Button onClick={() => { resetLeadForm(); setShowLeadForm(true); }}>
              <UserPlus className="size-4" />
              عميل جديد
            </Button>
          </>
        }
      />

      {/* Quick stats bar */}
      {stats && (
        <div className="mb-4 grid gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <Card className="p-3 text-center">
            <small className="text-muted-foreground">إجمالي العملاء</small>
            <b className="mt-1 block font-lat text-2xl text-brand">{stats.totalLeads}</b>
          </Card>
          <Card className="p-3 text-center">
            <small className="text-muted-foreground">جديد</small>
            <b className="mt-1 block font-lat text-2xl">{stats.newLeads}</b>
          </Card>
          <Card className="p-3 text-center">
            <small className="text-muted-foreground">مهتم</small>
            <b className="mt-1 block font-lat text-2xl text-amber-600">{stats.interestedLeads}</b>
          </Card>
          <Card className="p-3 text-center">
            <small className="text-muted-foreground">مشترك</small>
            <b className="mt-1 block font-lat text-2xl text-sage">{stats.convertedLeads}</b>
          </Card>
          <Card className="p-3 text-center">
            <small className="text-muted-foreground">مكالمات اليوم</small>
            <b className="mt-1 block font-lat text-2xl">{stats.todayCalls}</b>
          </Card>
          <Card className="p-3 text-center">
            <small className="text-muted-foreground">إجمالي المبيعات</small>
            <b className="mt-1 block font-lat text-2xl text-sage">${stats.totalRevenue}</b>
          </Card>
          <Card className="p-3 text-center">
            <small className="text-muted-foreground">معدل التحويل</small>
            <b className="mt-1 block font-lat text-2xl text-brand">{stats.conversionRate}%</b>
          </Card>
        </div>
      )}

      {activeSection === "leads" && (
        <div className="space-y-4">
          {/* Lead form */}
          {showLeadForm && (
            <Card>
              <h3 className="font-bold">{editingLead ? "تعديل العميل" : "إضافة عميل محتمل جديد"}</h3>
              <form onSubmit={handleSaveLead} className="mt-3 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>الاسم الكامل</Label>
                    <Input value={leadName} onChange={(e) => setLeadName(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>البريد الإلكتروني</Label>
                    <Input type="email" value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>رقم الهاتف</Label>
                    <Input dir="ltr" className="text-left" value={leadPhone} onChange={(e) => setLeadPhone(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>مصدر المعرفة بالأكاديمية</Label>
                    <select
                      value={leadSource}
                      onChange={(e) => setLeadSource(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">— اختر —</option>
                      <option value="facebook">فيسبوك / إنستجرام</option>
                      <option value="google">بحث جوجل</option>
                      <option value="referral">توصية من طالب</option>
                      <option value="whatsapp">واتساب</option>
                      <option value="other">أخرى</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>الاحتياج / نوع الكورس</Label>
                    <select
                      value={leadNeed}
                      onChange={(e) => setLeadNeed(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">— اختر —</option>
                      <option value="levels">كورس مستويات (A1–B2)</option>
                      <option value="conversation">ورش محادثة</option>
                      <option value="calls">مكالمات محادثة فردية</option>
                      <option value="private">كورس خاص / VIP</option>
                      <option value="placement">تحديد مستوى فقط</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>ملاحظات</Label>
                    <textarea
                      value={leadNotes}
                      onChange={(e) => setLeadNotes(e.target.value)}
                      className="min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
                      placeholder="أي ملاحظات عن العميل..."
                    />
                  </div>
                </div>
                {leadError && <p className="text-xs font-semibold text-danger">{leadError}</p>}
                <div className="flex gap-2">
                  <Button type="submit" disabled={leadSaving}>
                    {leadSaving ? "جاري الحفظ..." : editingLead ? "تحديث العميل" : "إضافة العميل"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={resetLeadForm}>
                    إلغاء
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Leads table */}
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">العملاء المحتملون ({salesLeads.length})</h2>
              <Button variant="secondary" className="text-xs" onClick={() => { resetLeadForm(); setShowLeadForm(true); }}>
                <Plus className="size-3.5" />
                إضافة عميل
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              {loadingData ? (
                <div className="py-8 text-center text-sm text-muted-foreground">جاري التحميل...</div>
              ) : salesLeads.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  لا يوجد عملاء محتملون بعد — أضف أول عميل!
                </div>
              ) : (
                salesLeads.map((lead) => (
                  <div key={lead.id} className="rounded-md border border-border bg-background/60">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between p-3 text-right"
                      onClick={() => setExpandedLeadId(expandedLeadId === lead.id ? null : lead.id)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 place-items-center rounded-full bg-brand2/15 text-sm font-bold text-brand2">
                          {lead.name[0]}
                        </span>
                        <div>
                          <b className="text-sm">{lead.name}</b>
                          <small className="block text-muted-foreground">
                            {lead.phone ?? "—"} · {lead.source ?? "—"}
                          </small>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {lead.need && (
                          <Badge tone="brand">{lead.need}</Badge>
                        )}
                        <Badge
                          tone={
                            lead.stage === "converted"
                              ? "sage"
                              : lead.stage === "lost"
                                ? "danger"
                                : lead.stage === "interested" || lead.stage === "follow_up"
                                  ? "gold"
                                  : "muted"
                          }
                        >
                          {LEAD_STAGES[lead.stage] ?? lead.stage}
                        </Badge>
                      </div>
                    </button>

                    {expandedLeadId === lead.id && (
                      <div className="border-t border-border px-3 pb-3 pt-2">
                        <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                          {lead.email && <span>الإيميل: {lead.email}</span>}
                          {lead.expectedValue != null && <span>القيمة المتوقعة: ${lead.expectedValue}</span>}
                          {lead.sales && <span>الموظف: {lead.sales.fullName}</span>}
                        </div>
                        {lead.notes && <p className="mt-1 text-xs text-muted-foreground">ملاحظات: {lead.notes}</p>}
                        {lead.lostReason && <p className="mt-1 text-xs text-danger">سبب الخسارة: {lead.lostReason}</p>}

                        {/* Latest call */}
                        {lead.callLogs?.[0] && (
                          <div className="mt-2 rounded-sm bg-muted/60 p-2 text-xs">
                            <b>آخر مكالمة:</b> {lead.callLogs[0].notes} —{" "}
                            <Badge tone="muted">{CALL_OUTCOMES[lead.callLogs[0].outcome] ?? lead.callLogs[0].outcome}</Badge>
                            <small className="block text-muted-foreground">
                              بواسطة {lead.callLogs[0].calledBy.fullName} · {new Date(lead.callLogs[0].calledAt).toLocaleString("ar-EG")}
                            </small>
                          </div>
                        )}

                        <div className="mt-3 flex flex-wrap gap-2">
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                updateLead(lead.id, { stage: e.target.value });
                              }
                            }}
                            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                          >
                            <option value="">تغيير الحالة...</option>
                            <option value="new">جديد</option>
                            <option value="contacted">تم التواصل</option>
                            <option value="interested">مهتم</option>
                            <option value="follow_up">متابعة</option>
                            <option value="converted">مشترك</option>
                            <option value="lost">خسر</option>
                          </select>
                          <Button
                            variant="secondary"
                            className="min-h-8 px-2 text-xs"
                            onClick={() => openEditLead(lead)}
                          >
                            تعديل
                          </Button>
                          <Button
                            variant="secondary"
                            className="min-h-8 px-2 text-xs"
                            onClick={() => {
                              setSelectedLeadId(lead.id);
                              setShowCallForm(true);
                            }}
                          >
                            <Headphones className="size-3" />
                            تسجيل مكالمة
                          </Button>
                          <Button
                            variant="ghost"
                            className="min-h-8 px-2 text-xs text-danger"
                            onClick={() => { if (confirm("حذف هذا العميل؟")) deleteLead(lead.id); }}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Call form modal */}
      {showCallForm && (
        <Card className="mt-4">
          <h3 className="font-bold">تسجيل مكالمة</h3>
          <form onSubmit={handleLogCall} className="mt-3 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>العميل</Label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">— اختر العميل —</option>
                  {salesLeads.map((l) => (
                    <option key={l.id} value={l.id}>{l.name} — {l.phone}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>نتيجة المكالمة</Label>
                <select
                  value={callOutcome}
                  onChange={(e) => setCallOutcome(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="interested">مهتم</option>
                  <option value="not_interested">غير مهتم</option>
                  <option value="callback">متابعة لاحقاً</option>
                  <option value="no_answer">لم يرد</option>
                  <option value="converted">تحول لمشترك</option>
                  <option value="wrong_number">رقم خطأ</option>
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>ملاحظات المكالمة</Label>
                <textarea
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  required
                  className="min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
                  placeholder="ماذا قال العميل؟ ماذا تم الاتفاق عليه؟"
                />
              </div>
              <div className="space-y-1.5">
                <Label>موعد المتابعة القادم (اختياري)</Label>
                <Input
                  type="datetime-local"
                  value={callFollowUp}
                  onChange={(e) => setCallFollowUp(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={callSaving}>
                {callSaving ? "جاري الحفظ..." : "تسجيل المكالمة"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowCallForm(false)}>
                إلغاء
              </Button>
            </div>
          </form>
        </Card>
      )}

      {activeSection === "calls" && (
        <Card>
          <h2 className="text-lg font-bold">سجل المكالمات ({callLogs.length})</h2>
          <div className="mt-4 space-y-2">
            {callLogs.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">لا توجد مكالمات مسجلة.</div>
            ) : (
              callLogs.map((c) => (
                <div key={c.id} className="flex items-start justify-between rounded-md border border-border bg-background/60 p-3">
                  <div>
                    <b className="text-sm">{c.lead?.name ?? "—"}</b>
                    <p className="mt-1 text-xs">{c.notes}</p>
                    <small className="text-muted-foreground">
                      بواسطة {c.calledBy.fullName} · {new Date(c.calledAt).toLocaleString("ar-EG")}
                    </small>
                    {c.nextFollowUp && (
                      <small className="block text-amber-600">
                        متابعة: {new Date(c.nextFollowUp).toLocaleString("ar-EG")}
                      </small>
                    )}
                  </div>
                  <Badge
                    tone={
                      c.outcome === "converted" ? "sage"
                      : c.outcome === "interested" ? "gold"
                      : c.outcome === "not_interested" ? "danger"
                      : "muted"
                    }
                  >
                    {CALL_OUTCOMES[c.outcome] ?? c.outcome}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {activeSection === "subscriptions" && (
        <div className="space-y-4">
          {showSubForm && (
            <Card>
              <h3 className="font-bold">إنشاء اشتراك جديد</h3>
              <form onSubmit={handleCreateSub} className="mt-3 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>الطالب</Label>
                    <select
                      value={subStudentId}
                      onChange={(e) => setSubStudentId(e.target.value)}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">— اختر الطالب —</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>{s.fullName} — {s.phone ?? s.email ?? "—"}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>الباقة</Label>
                    <select
                      value={subPackageId}
                      onChange={(e) => setSubPackageId(e.target.value)}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">— اختر الباقة —</option>
                      {packages.map((p) => (
                        <option key={p.id} value={p.id}>{p.nameAr} — ${p.price} / {p.durationMonths} شهر</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>المبلغ المدفوع ($)</Label>
                    <Input type="number" min={0} step="0.01" value={subPaidAmount} onChange={(e) => setSubPaidAmount(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>حالة الدفع</Label>
                    <select
                      value={subPaymentStatus}
                      onChange={(e) => setSubPaymentStatus(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="PENDING">بانتظار الدفع</option>
                      <option value="PAID">مدفوع</option>
                      <option value="PARTIAL">جزئي</option>
                      <option value="REFUNDED">مسترد</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>ملاحظات</Label>
                    <Input value={subNotes} onChange={(e) => setSubNotes(e.target.value)} placeholder="أي ملاحظات..." />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={subSaving}>
                    {subSaving ? "جاري الإنشاء..." : "إنشاء الاشتراك"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowSubForm(false)}>
                    إلغاء
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">الاشتراكات ({subscriptions.length})</h2>
              <Button variant="secondary" className="text-xs" onClick={() => setShowSubForm(true)}>
                <Plus className="size-3.5" />
                اشتراك جديد
              </Button>
            </div>
            <div className="mt-4 space-y-2">
              {subscriptions.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">لا توجد اشتراكات بعد.</div>
              ) : (
                subscriptions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-md border border-border bg-background/60 p-3">
                    <div>
                      <b className="text-sm">{s.student.fullName}</b>
                      <p className="text-xs text-muted-foreground">
                        {s.package.nameAr} · {s.package.durationMonths} شهر · ${s.package.price}
                      </p>
                      <small className="text-muted-foreground">
                        بواسطة {s.createdBy.fullName} · {new Date(s.createdAt).toLocaleDateString("ar-EG")}
                      </small>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        tone={
                          s.paymentStatus === "PAID" ? "sage"
                          : s.paymentStatus === "PENDING" ? "gold"
                          : s.paymentStatus === "REFUNDED" ? "danger"
                          : "muted"
                        }
                      >
                        {s.paymentStatus === "PAID" ? "مدفوع" : s.paymentStatus === "PENDING" ? "بانتظار" : s.paymentStatus === "PARTIAL" ? "جزئي" : "مسترد"}
                      </Badge>
                      {s.paidAmount != null && <small className="font-lat">${s.paidAmount}</small>}
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) updateSubscription(s.id, { status: e.target.value });
                        }}
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                      >
                        <option value="">تغيير الحالة</option>
                        <option value="ACTIVE">نشط</option>
                        <option value="EXPIRED">منتهي</option>
                        <option value="CANCELLED">ملغي</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {activeSection === "stats" && stats && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-5 text-center">
              <small className="text-muted-foreground">إجمالي العملاء المتواصل معهم</small>
              <b className="mt-2 block font-lat text-4xl text-brand">{stats.totalCalls}</b>
            </Card>
            <Card className="p-5 text-center">
              <small className="text-muted-foreground">الاشتراكات المحققة</small>
              <b className="mt-2 block font-lat text-4xl text-sage">{stats.totalSubscriptions}</b>
            </Card>
            <Card className="p-5 text-center">
              <small className="text-muted-foreground">إجمالي المبيعات</small>
              <b className="mt-2 block font-lat text-4xl text-sage">${stats.totalRevenue}</b>
            </Card>
            <Card className="p-5 text-center">
              <small className="text-muted-foreground">معدل التحويل</small>
              <b className="mt-2 block font-lat text-4xl text-brand">{stats.conversionRate}%</b>
            </Card>
          </div>

          <Card>
            <h3 className="font-bold">توزيع العملاء حسب المرحلة</h3>
            <div className="mt-4 space-y-3">
              {[
                { label: "جديد", count: stats.newLeads, color: "bg-slate-300" },
                { label: "تم التواصل", count: stats.contactedLeads, color: "bg-blue-400" },
                { label: "مهتم", count: stats.interestedLeads, color: "bg-amber-400" },
                { label: "مشترك", count: stats.convertedLeads, color: "bg-sage" },
                { label: "خسر", count: stats.lostLeads, color: "bg-danger" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <span className="w-20 text-xs text-muted-foreground">{s.label}</span>
                  <div className="h-5 flex-1 overflow-hidden rounded-md bg-muted">
                    <div
                      className={`h-full rounded-md ${s.color}`}
                      style={{ width: `${stats.totalLeads > 0 ? (s.count / stats.totalLeads) * 100 : 0}%` }}
                    />
                  </div>
                  <b className="w-10 text-left font-lat text-sm">{s.count}</b>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

type SupportSection = "students" | "tickets" | "chat" | "schedules" | "lectures" | "sessions" | "groups" | "free-lectures" | "attendance" | "irregular";

const TICKET_CATEGORIES: Record<string, string> = {
  login: "مشكلة دخول",
  payment: "مشكلة دفع",
  academic: "شكوى أكاديمية",
  technical: "مشكلة تقنية",
  schedule: "موعد/جدول",
  general: "عام",
};

const TICKET_STATUSES: Record<string, string> = {
  open: "مفتوحة",
  in_progress: "قيد المعالجة",
  forwarded: "تم التحويل",
  resolved: "تم الحل",
  closed: "مغلقة",
};

const STUDENT_STATUSES: Record<string, string> = {
  new: "جديد",
  active: "نشط",
  paused: "متوقف",
  completed: "منتهي",
};

const DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const WHATSAPP_NUMBER = "201270869510";
const PAYMENT_NUMBER_DISPLAY = "0127 086 9510";

export function SupportScreen() {
  const {
    supportStudents,
    tickets,
    schedules,
    attendance,
    irregularStudents,
    users,
    loadingData,
    updateStudentStatus,
    createTicket,
    updateTicket,
    recordAttendance,
    fetchSupportData,
    supportChatThreads,
    fetchSupportChatThreads,
    fetchSupportChatThread,
    sendSupportChatReply,
    supportLectures,
    fetchSupportLectures,
    // ops (shared with admin)
    adminGroups,
    groupMembers,
    fetchAdminGroups,
    createAdminGroup,
    updateAdminGroup,
    deleteAdminGroup,
    fetchGroupMembers,
    addGroupMembers,
    removeGroupMember,
    adminTeacherAvailability,
    fetchAdminTeacherAvailability,
    callsStudents,
    fetchCallsStudents,
    opsCreateBooking,
    opsBookings,
    fetchOpsBookings,
    freeStudents,
    freeLectures,
    fetchFreeStudents,
    createFreeStudent,
    deleteFreeStudent,
    fetchFreeLectures,
    createFreeLecture,
    updateFreeLecture,
    deleteFreeLecture,
    addFreeLectureFile,
    removeFreeLectureFile,
  } = usePlatformStore();

  const [activeSection, setActiveSection] = useState<SupportSection>("students");
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState("");

  // Chat
  const [chatStudentId, setChatStudentId] = useState("");
  const [chatMsgs, setChatMsgs] = useState<import("../hooks/use-platform-store").ChatMsg[]>([]);
  const [chatReply, setChatReply] = useState("");
  const [chatSending, setChatSending] = useState(false);

  // Ticket form
  const [tkSubject, setTkSubject] = useState("");
  const [tkDesc, setTkDesc] = useState("");
  const [tkStudentId, setTkStudentId] = useState("");
  const [tkCategory, setTkCategory] = useState("general");
  const [tkPriority, setTkPriority] = useState("normal");
  const [tkSaving, setTkSaving] = useState(false);

  // Attendance form
  const [atStudentId, setAtStudentId] = useState("");
  const [atStatus, setAtStatus] = useState("present");
  const [atNotes, setAtNotes] = useState("");
  const [atDate, setAtDate] = useState(new Date().toISOString().slice(0, 10));
  const [atSaving, setAtSaving] = useState(false);

  const teachers = users.filter((u) => u.role === "TEACHER");

  useEffect(() => {
    fetchSupportChatThreads();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeSection === "lectures") fetchSupportLectures().catch(() => {});
    if (activeSection === "sessions") {
      fetchOpsBookings().catch(() => {});
      fetchCallsStudents().catch(() => {});
    }
    if (activeSection === "groups") fetchAdminGroups().catch(() => {});
    if (activeSection === "free-lectures") {
      fetchFreeStudents().catch(() => {});
      fetchFreeLectures().catch(() => {});
      fetchAdminGroups().catch(() => {});
    }
  }, [activeSection]); // eslint-disable-line react-hooks/exhaustive-deps

  async function openChat(studentId: string) {
    setChatStudentId(studentId);
    setChatMsgs(await fetchSupportChatThread(studentId));
  }

  async function handleChatSend(e: React.FormEvent) {
    e.preventDefault();
    if (!chatReply.trim() || !chatStudentId) return;
    setChatSending(true);
    try {
      await sendSupportChatReply(chatStudentId, chatReply.trim());
      setChatReply("");
      setChatMsgs(await fetchSupportChatThread(chatStudentId));
      await fetchSupportChatThreads();
    } finally {
      setChatSending(false);
    }
  }

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    setTkSaving(true);
    try {
      await createTicket({
        subject: tkSubject,
        ...(tkDesc ? { description: tkDesc } : {}),
        ...(tkStudentId ? { studentId: tkStudentId } : {}),
        category: tkCategory,
        priority: tkPriority,
        ...(tkStudentId ? { studentId: tkStudentId } : {}),
      });
      setTkSubject(""); setTkDesc(""); setTkStudentId(""); setTkCategory("general"); setTkPriority("normal");
      setShowTicketForm(false);
    } finally {
      setTkSaving(false);
    }
  }

  async function handleRecordAttendance(e: React.FormEvent) {
    e.preventDefault();
    setAtSaving(true);
    try {
      await recordAttendance({
        scheduleId: selectedScheduleId,
        studentId: atStudentId,
        status: atStatus,
        date: atDate,
        ...(atNotes ? { notes: atNotes } : {}),
      });
      setAtStudentId(""); setAtStatus("present"); setAtNotes("");
    } finally {
      setAtSaving(false);
    }
  }

  return (
    <AppShell role="SUPPORT" activeSection={activeSection} onSelectSection={(s) => setActiveSection(s as SupportSection)}>
      <PageHeader
        title="لوحة خدمة العملاء"
        subtitle="متابعة الطلاب · الشكاوى · المواعيد · الحضور · المتابعة"
        actions={
          <Button onClick={() => setShowTicketForm(true)}>
            <Plus className="size-4" />
            تذكرة جديدة
          </Button>
        }
      />

      {/* Quick stats */}
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <Card className="p-3 text-center">
          <small className="text-muted-foreground">إجمالي الطلاب</small>
          <b className="mt-1 block font-lat text-2xl text-brand">{supportStudents.length}</b>
        </Card>
        <Card className="p-3 text-center">
          <small className="text-muted-foreground">تذاكر مفتوحة</small>
          <b className="mt-1 block font-lat text-2xl text-amber-600">
            {tickets.filter((t) => t.status === "open" || t.status === "in_progress").length}
          </b>
        </Card>
        <Card className="p-3 text-center">
          <small className="text-muted-foreground">محاضرات مجدولة</small>
          <b className="mt-1 block font-lat text-2xl">{schedules.length}</b>
        </Card>
        <Card className="p-3 text-center">
          <small className="text-muted-foreground">طلاب غير منتظمين</small>
          <b className="mt-1 block font-lat text-2xl text-danger">{irregularStudents.length}</b>
        </Card>
      </div>

      {activeSection === "students" && (
        <Card>
          <h2 className="text-lg font-bold">الطلاب المسجلون ({supportStudents.length})</h2>
          <p className="text-xs text-muted-foreground">عرض بيانات الطلاب وحالاتهم والمجموعات والمدرسين</p>
          <div className="mt-4 space-y-2">
            {loadingData ? (
              <div className="py-8 text-center text-sm text-muted-foreground">جاري التحميل...</div>
            ) : supportStudents.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">لا يوجد طلاب بعد.</div>
            ) : (
              supportStudents.map((s) => (
                <div key={s.id} className="rounded-md border border-border bg-background/60 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <b className="text-sm">{s.fullName}</b>
                      <small className="block text-muted-foreground">
                        {s.phone ?? s.email ?? "—"}
                      </small>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={
                        s.studentStatus === "active" ? "sage"
                        : s.studentStatus === "paused" ? "gold"
                        : s.studentStatus === "completed" ? "brand"
                        : "muted"
                      }>
                        {STUDENT_STATUSES[s.studentStatus] ?? s.studentStatus}
                      </Badge>
                      <select
                        value=""
                        onChange={(e) => { if (e.target.value) updateStudentStatus(s.id, e.target.value); }}
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                      >
                        <option value="">تغيير الحالة</option>
                        <option value="new">جديد</option>
                        <option value="active">نشط</option>
                        <option value="paused">متوقف</option>
                        <option value="completed">منتهي</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {s.level && (
                      <span>
                        المستوى: {s.level}
                        {s.placementScore !== null && s.placementScore !== undefined && ` (${s.placementScore}%)`}
                      </span>
                    )}
                    {s.placementCompletedAt && (
                      <span>اختبار المستوى: {new Date(s.placementCompletedAt).toLocaleDateString("ar-EG")}</span>
                    )}
                    {s.teachers.map((t) => (
                      <span key={t.id}>المدرس: {t.name}{t.groupName && ` (${t.groupName})`}</span>
                    ))}
                    {s.teachers.length === 0 && <span className="text-danger">غير مربوط بمدرس</span>}
                    <span>امتحانات: {s.examsCount}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Ticket form */}
      {showTicketForm && (
        <Card className="mt-4">
          <h3 className="font-bold">تذكرة جديدة</h3>
          <form onSubmit={handleCreateTicket} className="mt-3 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>الطالب (اختياري)</Label>
                <select
                  value={tkStudentId}
                  onChange={(e) => setTkStudentId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">— عام / بدون طالب —</option>
                  {supportStudents.map((s) => (
                    <option key={s.id} value={s.id}>{s.fullName}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>النوع</Label>
                <select
                  value={tkCategory}
                  onChange={(e) => setTkCategory(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {Object.entries(TICKET_CATEGORIES).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>الأولوية</Label>
                <select
                  value={tkPriority}
                  onChange={(e) => setTkPriority(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="low">منخفضة</option>
                  <option value="normal">عادية</option>
                  <option value="high">عالية</option>
                  <option value="urgent">عاجلة</option>
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>الموضوع</Label>
                <Input value={tkSubject} onChange={(e) => setTkSubject(e.target.value)} required />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>الوصف</Label>
                <textarea
                  value={tkDesc}
                  onChange={(e) => setTkDesc(e.target.value)}
                  className="min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={tkSaving}>{tkSaving ? "جاري الإنشاء..." : "إنشاء التذكرة"}</Button>
              <Button type="button" variant="ghost" onClick={() => setShowTicketForm(false)}>إلغاء</Button>
            </div>
          </form>
        </Card>
      )}

      {activeSection === "tickets" && (
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">الشكاوى والتذاكر ({tickets.length})</h2>
            <Button variant="secondary" className="text-xs" onClick={() => setShowTicketForm(true)}>
              <Plus className="size-3.5" />
              تذكرة جديدة
            </Button>
          </div>
          <div className="mt-4 space-y-2">
            {tickets.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">لا توجد تذاكر.</div>
            ) : (
              tickets.map((t) => (
                <div key={t.id} className="rounded-md border border-border bg-background/60">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between p-3 text-right"
                    onClick={() => setExpandedTicket(expandedTicket === t.id ? null : t.id)}
                  >
                    <div>
                      <b className="text-sm">{t.subject}</b>
                      <small className="block text-muted-foreground">
                        {t.student?.fullName ?? "عام"} · {TICKET_CATEGORIES[t.category] ?? t.category}
                        {t._count && ` · ${t._count.messages} رسالة`}
                      </small>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={t.priority === "urgent" ? "danger" : t.priority === "high" ? "gold" : "muted"}>
                        {t.priority === "urgent" ? "عاجل" : t.priority === "high" ? "عالية" : t.priority === "low" ? "منخفضة" : "عادية"}
                      </Badge>
                      <Badge tone={
                        t.status === "resolved" || t.status === "closed" ? "sage"
                        : t.status === "in_progress" ? "gold"
                        : t.status === "forwarded" ? "brand"
                        : "muted"
                      }>
                        {TICKET_STATUSES[t.status] ?? t.status}
                      </Badge>
                    </div>
                  </button>
                  {expandedTicket === t.id && (
                    <div className="border-t border-border px-3 pb-3 pt-2 text-xs">
                      {t.description && <p className="text-muted-foreground">{t.description}</p>}
                      {t.forwardedTo && (
                        <p className="mt-1 text-brand">تم التحويل إلى: {t.forwardedTo.fullName} ({t.forwardedTo.role})</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <select
                          value=""
                          onChange={(e) => { if (e.target.value) updateTicket(t.id, { status: e.target.value }); }}
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                        >
                          <option value="">تغيير الحالة</option>
                          <option value="open">مفتوحة</option>
                          <option value="in_progress">قيد المعالجة</option>
                          <option value="resolved">تم الحل</option>
                          <option value="closed">مغلقة</option>
                        </select>
                        <select
                          value=""
                          onChange={(e) => { if (e.target.value) updateTicket(t.id, { forwardedToId: e.target.value }); }}
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                        >
                          <option value="">تحويل إلى...</option>
                          {teachers.map((t) => (
                            <option key={t.id} value={t.id}>مدرس: {t.fullName}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {activeSection === "chat" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <h2 className="text-lg font-bold">محادثات الطلاب ({supportChatThreads.length})</h2>
            <p className="text-xs text-muted-foreground">رسائل مباشرة من الطلاب عبر صفحة "المحادثات"</p>
            <div className="mt-4 space-y-2">
              {supportChatThreads.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">لا توجد محادثات بعد.</div>
              ) : (
                supportChatThreads.map((t) => (
                  <button
                    key={t.student.id}
                    type="button"
                    onClick={() => openChat(t.student.id)}
                    className={`w-full rounded-md border p-3 text-right transition-colors ${
                      chatStudentId === t.student.id
                        ? "border-brand bg-brand/5"
                        : "border-border bg-background/60 hover:border-brand/40"
                    }`}
                  >
                    <b className="block text-sm">{t.student.fullName}</b>
                    <small className="block truncate text-muted-foreground">
                      {t.lastMessage.content} · {new Date(t.lastMessage.createdAt).toLocaleDateString("ar-EG")}
                    </small>
                  </button>
                ))
              )}
            </div>
          </Card>

          <Card className="lg:col-span-2">
            {!chatStudentId ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                اختر محادثة من القائمة لعرض الرسائل والرد.
              </div>
            ) : (
              <>
                <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-md bg-muted/40 p-3">
                  {chatMsgs.map((m) => (
                    <div
                      key={m.id}
                      className={`max-w-[80%] rounded-md p-2.5 text-sm ${
                        m.fromRole === "SUPPORT" || m.fromRole === "ADMIN"
                          ? "ms-auto bg-brand/10"
                          : "bg-background"
                      }`}
                    >
                      <small className="block text-[10px] text-muted-foreground">
                        {m.fromRole === "STUDENT" ? "الطالب" : "خدمة العملاء"} ·{" "}
                        {new Date(m.createdAt).toLocaleString("ar-EG")}
                      </small>
                      <p className="mt-0.5">{m.content}</p>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleChatSend} className="mt-3 flex gap-2">
                  <Input
                    value={chatReply}
                    onChange={(e) => setChatReply(e.target.value)}
                    placeholder="اكتب ردك للطالب..."
                    className="flex-1"
                  />
                  <Button type="submit" disabled={chatSending || !chatReply.trim()}>
                    إرسال
                  </Button>
                </form>
              </>
            )}
          </Card>
        </div>
      )}

      {activeSection === "schedules" && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">جداول المدرسين ({schedules.length})</h2>
              <p className="text-xs text-muted-foreground">
                عرض فقط — المواعيد الأسبوعية الثابتة يحددها الأدمن من لوحة التحكم
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {schedules.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">لا توجد مواعيد مجدولة.</div>
            ) : (
              schedules.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-md border border-border bg-background/60 p-3">
                  <div>
                    <b className="text-sm">{s.title}</b>
                    <small className="block text-muted-foreground">
                      {DAY_NAMES[s.dayOfWeek]} · {s.startTime}–{s.endTime} · {s.location === "online" ? "أونلاين" : "أوفلاين"}
                      {s.groupName && ` · ${s.groupName}`}
                      {s.meetingUrl && " · 🔗 Zoom"}
                    </small>
                  </div>
                  <small className="text-muted-foreground">المدرس: {s.teacher.fullName}</small>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {activeSection === "lectures" && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">المحاضرات المباشرة ({supportLectures.length})</h2>
              <p className="text-xs text-muted-foreground">
                عرض فقط — المحاضرات المجدولة والمباشرة من الإدارة
              </p>
            </div>
            <Button variant="ghost" className="min-h-8 px-3 text-xs" onClick={() => fetchSupportLectures().catch(() => {})}>
              تحديث
            </Button>
          </div>
          <div className="mt-4 space-y-2">
            {supportLectures.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">لا توجد محاضرات مجدولة.</div>
            ) : (
              supportLectures.map((l) => (
                <div key={l.id} className="rounded-md border border-border bg-background/60 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <b className="text-sm">{l.title}</b>
                        <Badge tone={l.status === "live" ? "sage" : "brand"}>
                          {l.status === "live" ? "مباشر الآن" : "مجدولة"}
                        </Badge>
                        {l.level && <Badge tone="muted">{l.level}</Badge>}
                        {l.groupName && <Badge tone="muted">{l.groupName}</Badge>}
                      </div>
                      <small className="mt-1 block text-muted-foreground">
                        {l.teacher?.fullName ?? "—"} · {new Date(l.startsAt).toLocaleString("ar-EG")}
                        {l.endsAt && ` → ${new Date(l.endsAt).toLocaleString("ar-EG")}`}
                      </small>
                    </div>
                    {l.meetingUrl && (
                      <a href={l.meetingUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-brand hover:underline">
                        رابط الاجتماع ↗
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {activeSection === "attendance" && (
        <div className="space-y-4">
          <Card>
            <h3 className="font-bold">تسجيل حضور</h3>
            <form onSubmit={handleRecordAttendance} className="mt-3 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>الموعد / المحاضرة</Label>
                  <select value={selectedScheduleId} onChange={(e) => setSelectedScheduleId(e.target.value)} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">— اختر الموعد —</option>
                    {schedules.map((s) => (
                      <option key={s.id} value={s.id}>
                        {DAY_NAMES[s.dayOfWeek]} {s.startTime} — {s.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>الطالب</Label>
                  <select value={atStudentId} onChange={(e) => setAtStudentId(e.target.value)} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">— اختر الطالب —</option>
                    {supportStudents.map((s) => (
                      <option key={s.id} value={s.id}>{s.fullName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>الحالة</Label>
                  <select value={atStatus} onChange={(e) => setAtStatus(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="present">حاضر</option>
                    <option value="absent">غائب</option>
                    <option value="late">متأخر</option>
                    <option value="excused">معذور</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>التاريخ</Label>
                  <Input type="date" value={atDate} onChange={(e) => setAtDate(e.target.value)} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>ملاحظات</Label>
                  <Input value={atNotes} onChange={(e) => setAtNotes(e.target.value)} placeholder="أي ملاحظات..." />
                </div>
              </div>
              <Button type="submit" disabled={atSaving}>{atSaving ? "جاري التسجيل..." : "تسجيل الحضور"}</Button>
            </form>
          </Card>

          <Card>
            <h2 className="text-lg font-bold">سجل الحضور ({attendance.length})</h2>
            <div className="mt-4 space-y-2">
              {attendance.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">لا توجد سجلات حضور.</div>
              ) : (
                attendance.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-md border border-border bg-background/60 p-3">
                    <div>
                      <b className="text-sm">{a.student.fullName}</b>
                      <small className="block text-muted-foreground">
                        {a.schedule.title} · {new Date(a.date).toLocaleDateString("ar-EG")}
                        {a.notes && ` · ${a.notes}`}
                      </small>
                    </div>
                    <Badge tone={
                      a.status === "present" ? "sage"
                      : a.status === "late" ? "gold"
                      : a.status === "excused" ? "brand"
                      : "danger"
                    }>
                      {a.status === "present" ? "حاضر" : a.status === "absent" ? "غائب" : a.status === "late" ? "متأخر" : "معذور"}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {activeSection === "irregular" && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">طلاب غير منتظمين ({irregularStudents.length})</h2>
              <p className="text-xs text-muted-foreground">طلاب لم يسلموا امتحاناً منذ 30 يوم أو درجاتهم أقل من 50%</p>
            </div>
            <Button variant="secondary" className="text-xs" onClick={() => fetchSupportData()}>
              تحديث
            </Button>
          </div>
          <div className="mt-4 space-y-2">
            {irregularStudents.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                كل الطلاب منتظمون — لا يوجد طلاب متأخرون.
              </div>
            ) : (
              irregularStudents.map((s) => (
                <div key={s.id} className="rounded-md border border-danger/30 bg-danger/5 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <b className="text-sm">{s.fullName}</b>
                      <small className="block text-muted-foreground">
                        {s.phone ?? s.email ?? "—"} · المدرس: {s.teacher}
                      </small>
                      <p className="mt-1 text-xs text-danger">{s.reason}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.avgScore !== null && (
                        <Badge tone="danger">{s.avgScore}%</Badge>
                      )}
                      <Badge tone="muted">{STUDENT_STATUSES[s.studentStatus] ?? s.studentStatus}</Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {activeSection === "sessions" && (
        <div className="space-y-4">
          <OpsCreateSessionCard
            callsStudents={callsStudents}
            teachers={teachers}
            availability={adminTeacherAvailability}
            onFetchAvailability={fetchAdminTeacherAvailability}
            onCreate={opsCreateBooking}
            onFetchCallsStudents={fetchCallsStudents}
          />
          <Card>
            <h3 className="font-bold">الحجوزات الحديثة</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-right text-xs text-muted-foreground">
                    <th className="p-2">الطالب</th>
                    <th className="p-2">المدرس</th>
                    <th className="p-2">الموعد</th>
                    <th className="p-2">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {opsBookings.length === 0 ? (
                    <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">لا توجد حجوزات.</td></tr>
                  ) : (
                    opsBookings.slice(0, 30).map((b) => {
                      const st: Record<string, { label: string; color: string }> = {
                        booked: { label: "محجوزة", color: "#0b2f6e" },
                        completed: { label: "مكتملة", color: "#2f9e4f" },
                        cancelled: { label: "ملغاة", color: "#c0392b" },
                        no_show: { label: "لم يحضر", color: "#e67e22" },
                      };
                      const s = st[b.status] ?? st.booked;
                      return (
                        <tr key={b.id} className="border-b">
                          <td className="p-2 font-semibold">{b.student?.fullName ?? "—"}</td>
                          <td className="p-2">{b.teacher?.fullName ?? "—"}</td>
                          <td className="p-2 text-xs">{new Date(b.startsAt).toLocaleString("ar-EG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                          <td className="p-2"><Badge style={{ background: s.color }}>{s.label}</Badge></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeSection === "groups" && (
        <AdminGroupsSection
          groups={adminGroups}
          members={groupMembers}
          students={supportStudents.map((s) => ({ id: s.id, fullName: s.fullName }))}
          teachers={teachers.map((t) => ({ id: t.id, fullName: t.fullName }))}
          onCreate={createAdminGroup}
          onUpdate={updateAdminGroup}
          onDelete={deleteAdminGroup}
          onFetchMembers={fetchGroupMembers}
          onAddMembers={addGroupMembers}
          onRemoveMember={removeGroupMember}
        />
      )}

      {activeSection === "free-lectures" && (
        <OpsFreeLecturesSection
          freeStudents={freeStudents}
          freeLectures={freeLectures}
          groups={adminGroups}
          teachers={teachers}
          availability={adminTeacherAvailability}
          onFetchAvailability={fetchAdminTeacherAvailability}
          onCreateStudent={createFreeStudent}
          onDeleteStudent={deleteFreeStudent}
          onCreateLecture={createFreeLecture}
          onUpdateLecture={updateFreeLecture}
          onDeleteLecture={deleteFreeLecture}
          onAddFile={addFreeLectureFile}
          onRemoveFile={removeFreeLectureFile}
        />
      )}
    </AppShell>
  );
}

// ─── Admin Groups Section ───────────────────────────────────────────────────
function AdminGroupsSection({
  groups,
  members,
  students,
  teachers,
  onCreate,
  onUpdate,
  onDelete,
  onFetchMembers,
  onAddMembers,
  onRemoveMember,
}: {
  groups: import("../hooks/use-platform-store").GroupItem[];
  members: import("../hooks/use-platform-store").GroupMemberItem[];
  students: { id: string; fullName: string }[];
  teachers: { id: string; fullName: string }[];
  onCreate: (input: { name: string; description?: string; teacherId?: string; level?: string | null; maxStudents?: number | null }) => Promise<void>;
  onUpdate: (id: string, input: Partial<{ name: string; description: string; teacherId: string; level: string | null; maxStudents: number | null }>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onFetchMembers: (groupId: string) => Promise<void>;
  onAddMembers: (groupId: string, studentIds: string[]) => Promise<void>;
  onRemoveMember: (groupId: string, studentId: string) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [gName, setGName] = useState("");
  const [gDesc, setGDesc] = useState("");
  const [gTeacherId, setGTeacherId] = useState("");
  const [gLevel, setGLevel] = useState("");
  const [gMax, setGMax] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setSaving(true);
    try {
      await onCreate({
        name: gName,
        ...(gDesc ? { description: gDesc } : {}),
        ...(gTeacherId ? { teacherId: gTeacherId } : {}),
        level: gLevel || null,
        maxStudents: gMax ? Number(gMax) : null,
      });
      setGName(""); setGDesc(""); setGTeacherId(""); setGLevel(""); setGMax("");
      setShowForm(false);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "فشل إنشاء المجموعة");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleGroup(id: string) {
    if (openGroupId === id) {
      setOpenGroupId(null);
    } else {
      setOpenGroupId(id);
      await onFetchMembers(id);
      setSelectedStudentIds([]);
    }
  }

  async function handleAddMembers(groupId: string) {
    if (selectedStudentIds.length === 0) return;
    await onAddMembers(groupId, selectedStudentIds);
    setSelectedStudentIds([]);
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">المجموعات ({groups.length})</h2>
            <p className="text-xs text-muted-foreground">إنشاء مجموعات طلاب وإدارة أعضائها — تستخدم لاستهداف محاضرات لمجموعة محددة</p>
          </div>
          <Button variant="secondary" className="text-xs" onClick={() => setShowForm(!showForm)}>
            {showForm ? "إلغاء" : "+ مجموعة جديدة"}
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="mt-4 space-y-3 rounded-md border border-border bg-muted/40 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>اسم المجموعة</Label>
                <Input value={gName} onChange={(e) => setGName(e.target.value)} required placeholder="مثال: مجموعة A1 مساء" />
              </div>
              <div className="space-y-1.5">
                <Label>المدرس المسؤول</Label>
                <select value={gTeacherId} onChange={(e) => setGTeacherId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">— بدون مدرس —</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>المستوى</Label>
                <select value={gLevel} onChange={(e) => setGLevel(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">— بدون —</option>
                  {["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>الحد الأقصى للطلاب</Label>
                <Input type="number" min={1} value={gMax} onChange={(e) => setGMax(e.target.value)} placeholder="مثال: 15" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>الوصف</Label>
                <Input value={gDesc} onChange={(e) => setGDesc(e.target.value)} placeholder="وصف مختصر للمجموعة" />
              </div>
            </div>
            {err && <p className="text-sm font-semibold text-danger">{err}</p>}
            <Button type="submit" disabled={saving}>{saving ? "جاري الحفظ..." : "إنشاء المجموعة"}</Button>
          </form>
        )}
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {groups.length === 0 ? (
          <Card className="col-span-full py-10 text-center text-sm text-muted-foreground">لا توجد مجموعات بعد.</Card>
        ) : (
          groups.map((g) => (
            <Card key={g.id}>
              <div className="flex items-start justify-between">
                <div>
                  <b>{g.name}</b>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {g.level && <Badge tone="muted">{g.level}</Badge>}
                    <Badge tone="brand">{g._count?.members ?? 0} طالب</Badge>
                    {g.maxStudents && <Badge tone="gold">الحد: {g.maxStudents}</Badge>}
                  </div>
                  {g.teacher && <p className="mt-1 text-xs font-semibold text-brand2">المدرس: {g.teacher.fullName}</p>}
                  {g.description && <p className="mt-1 text-xs text-muted-foreground">{g.description}</p>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" className="min-h-7 px-2 py-1 text-xs" onClick={() => handleToggleGroup(g.id)}>
                    {openGroupId === g.id ? "إغلاق" : "الأعضاء"}
                  </Button>
                  <button
                    onClick={() => { if (confirm(`حذف المجموعة "${g.name}"؟`)) onDelete(g.id); }}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              {openGroupId === g.id && (
                <div className="mt-4 border-t border-border pt-3">
                  {/* Members list */}
                  <h4 className="text-xs font-bold text-muted-foreground">الأعضاء الحاليون</h4>
                  <div className="mt-2 space-y-1.5">
                    {members.length === 0 ? (
                      <p className="text-xs text-muted-foreground">لا يوجد أعضاء.</p>
                    ) : (
                      members.map((m) => (
                        <div key={m.id} className="flex items-center justify-between rounded-md bg-muted/60 px-2.5 py-1.5 text-sm">
                          <span>{m.student.fullName}</span>
                          <button
                            onClick={() => onRemoveMember(g.id, m.studentId)}
                            className="text-xs text-danger hover:underline"
                          >
                            إزالة
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add members */}
                  <h4 className="mt-4 text-xs font-bold text-muted-foreground">إضافة طلاب</h4>
                  <div className="mt-2 max-h-40 overflow-y-auto rounded-md border border-input bg-background p-2">
                    {students.map((s) => (
                      <label key={s.id} className="flex items-center gap-2 py-1 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(s.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedStudentIds([...selectedStudentIds, s.id]);
                            else setSelectedStudentIds(selectedStudentIds.filter((id) => id !== s.id));
                          }}
                        />
                        {s.fullName}
                      </label>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    className="mt-2"
                    disabled={selectedStudentIds.length === 0}
                    onClick={() => handleAddMembers(g.id)}
                  >
                    إضافة {selectedStudentIds.length > 0 ? `(${selectedStudentIds.length})` : ""}
                  </Button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Ops: create an individual session (admin/support) ──────────────────────
// Teacher availability slots fill the datetime; then pick a calls-package
// student and create the booking.
function OpsCreateSessionCard({
  callsStudents,
  teachers,
  availability,
  onFetchAvailability,
  onCreate,
  onFetchCallsStudents,
}: {
  callsStudents: import("../hooks/use-platform-store").CallsStudentItem[];
  teachers: PlatformUser[];
  availability: any[];
  onFetchAvailability: (teacherId?: string) => Promise<void>;
  onCreate: (input: { studentId: string; teacherId: string; startsAt: string; endsAt?: string; meetingUrl?: string; notes?: string }) => Promise<void>;
  onFetchCallsStudents: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [teacherId, setTeacherId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    if (open) onFetchCallsStudents().catch(() => {});
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (teacherId) onFetchAvailability(teacherId).catch(() => {});
  }, [teacherId]); // eslint-disable-line react-hooks/exhaustive-deps

  function pickSlot(slot: any) {
    const [sh, sm] = slot.startTime.split(":").map(Number);
    const [eh, em] = slot.endTime.split(":").map(Number);
    const d = new Date();
    if (slot.specificDate) {
      const sd = new Date(slot.specificDate);
      d.setFullYear(sd.getFullYear(), sd.getMonth(), sd.getDate());
    } else {
      const diff = ((slot.dayOfWeek ?? 0) - d.getDay() + 7) % 7;
      d.setDate(d.getDate() + diff);
    }
    d.setHours(sh, sm, 0, 0);
    setStartsAt(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}`);
    const e = new Date(d);
    e.setHours(eh, em, 0, 0);
    setEndsAt(`${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, "0")}-${String(e.getDate()).padStart(2, "0")}T${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setOk("");
    if (!teacherId || !studentId || !startsAt) { setErr("اختر المدرس والطالب والموعد"); return; }
    setSaving(true);
    try {
      await onCreate({
        studentId,
        teacherId,
        startsAt: new Date(startsAt).toISOString(),
        ...(endsAt ? { endsAt: new Date(endsAt).toISOString() } : {}),
        ...(meetingUrl ? { meetingUrl } : {}),
        ...(notes ? { notes } : {}),
      });
      setOk("تم إنشاء الحصة وخصمها من رصيد الطالب");
      setStartsAt(""); setEndsAt(""); setMeetingUrl(""); setNotes(""); setStudentId("");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "فشل إنشاء الحصة");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold">إنشاء حصة فردية</h3>
          <p className="text-xs text-muted-foreground">اختر المدرس ← موعد متاح ← طالب لديه باقة مكالمات</p>
        </div>
        <Button variant="secondary" className="text-xs" onClick={() => setOpen(!open)}>
          {open ? "إخفاء" : "+ حصة جديدة"}
        </Button>
      </div>
      {open && (
        <form onSubmit={handleCreate} className="mt-4 space-y-3 rounded-md border border-border bg-muted/40 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>المدرس</Label>
              <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">— اختر المدرس —</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>الطالب (باقة مكالمات برصيد متبقٍ)</Label>
              <select value={studentId} onChange={(e) => setStudentId(e.target.value)} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">— اختر الطالب —</option>
                {callsStudents.map((s) => (
                  <option key={s.id} value={s.studentId}>
                    {s.studentName} — {s.packageName} (متبقي {s.sessionsRemaining ?? "—"})
                  </option>
                ))}
              </select>
            </div>
            {teacherId && availability.length > 0 && (
              <div className="space-y-1.5 sm:col-span-2">
                <Label>مواعيد المدرس المتاحة (اضغط لملء الوقت)</Label>
                <div className="flex flex-wrap gap-1.5">
                  {availability.map((slot) => {
                    const dayName = slot.specificDate
                      ? new Date(slot.specificDate).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })
                      : ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"][slot.dayOfWeek ?? 0];
                    return (
                      <button key={slot.id} type="button" onClick={() => pickSlot(slot)}
                        className="rounded-md border border-input bg-background px-2.5 py-1 text-xs hover:border-brand hover:bg-brand/5">
                        {dayName} {slot.startTime}—{slot.endTime}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {teacherId && availability.length === 0 && (
              <p className="text-xs text-muted-foreground sm:col-span-2">هذا المدرس لم يضف مواعيد متاحة بعد.</p>
            )}
            <div className="space-y-1.5">
              <Label>البداية</Label>
              <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>النهاية</Label>
              <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>رابط الاجتماع</Label>
              <Input value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} placeholder="https://zoom.us/j/..." />
            </div>
            <div className="space-y-1.5">
              <Label>ملاحظات</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          {err && <p className="text-sm font-semibold text-danger">{err}</p>}
          {ok && <p className="text-sm font-semibold text-[#2f9e4f]">{ok}</p>}
          <Button type="submit" disabled={saving}>{saving ? "جاري الإنشاء..." : "إنشاء الحصة"}</Button>
        </form>
      )}
    </Card>
  );
}

// ─── Ops: free lecture management (admin/support) ───────────────────────────
// Two halves: trial students (name/phone/level/group) and the free lectures
// themselves (with group targeting + file attachments).
function OpsFreeLecturesSection({
  freeStudents,
  freeLectures,
  groups,
  teachers,
  availability,
  onFetchAvailability,
  onCreateStudent,
  onDeleteStudent,
  onCreateLecture,
  onUpdateLecture,
  onDeleteLecture,
  onAddFile,
  onRemoveFile,
}: {
  freeStudents: import("../hooks/use-platform-store").FreeLectureStudent[];
  freeLectures: import("../hooks/use-platform-store").FreeLecture[];
  groups: import("../hooks/use-platform-store").GroupItem[];
  teachers: PlatformUser[];
  availability: any[];
  onFetchAvailability: (teacherId?: string) => Promise<void>;
  onCreateStudent: (input: { name: string; phone: string; level?: string | null; groupId?: string | null; notes?: string }) => Promise<void>;
  onDeleteStudent: (id: string) => Promise<void>;
  onCreateLecture: (input: { title: string; description?: string; teacherId?: string; groupId?: string; level?: string | null; startsAt: string; endsAt?: string; meetingUrl?: string }) => Promise<void>;
  onUpdateLecture: (id: string, input: Record<string, unknown>) => Promise<void>;
  onDeleteLecture: (id: string) => Promise<void>;
  onAddFile: (id: string, file: { name: string; url: string }) => Promise<void>;
  onRemoveFile: (id: string, index: number) => Promise<void>;
}) {
  const [tab, setTab] = useState<"lectures" | "students">("lectures");
  // student form
  const [sName, setSName] = useState("");
  const [sPhone, setSPhone] = useState("");
  const [sLevel, setSLevel] = useState("");
  const [sGroupId, setSGroupId] = useState("");
  const [sNotes, setSNotes] = useState("");
  // lecture form
  const [showLecForm, setShowLecForm] = useState(false);
  const [lTitle, setLTitle] = useState("");
  const [lDesc, setLDesc] = useState("");
  const [lTeacherId, setLTeacherId] = useState("");
  const [lGroupId, setLGroupId] = useState("");
  const [lLevel, setLLevel] = useState("");
  const [lStarts, setLStarts] = useState("");
  const [lEnds, setLEnds] = useState("");
  const [lUrl, setLUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  useEffect(() => {
    if (lTeacherId) onFetchAvailability(lTeacherId).catch(() => {});
  }, [lTeacherId]); // eslint-disable-line react-hooks/exhaustive-deps

  function pickSlot(slot: any) {
    const [sh, sm] = slot.startTime.split(":").map(Number);
    const [eh, em] = slot.endTime.split(":").map(Number);
    const d = new Date();
    if (slot.specificDate) {
      const sd = new Date(slot.specificDate);
      d.setFullYear(sd.getFullYear(), sd.getMonth(), sd.getDate());
    } else {
      const diff = ((slot.dayOfWeek ?? 0) - d.getDay() + 7) % 7;
      d.setDate(d.getDate() + diff);
    }
    d.setHours(sh, sm, 0, 0);
    setLStarts(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}`);
    const e = new Date(d);
    e.setHours(eh, em, 0, 0);
    setLEnds(`${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, "0")}-${String(e.getDate()).padStart(2, "0")}T${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`);
  }

  async function handleCreateStudent(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setSaving(true);
    try {
      await onCreateStudent({ name: sName, phone: sPhone, level: sLevel || null, groupId: sGroupId || null, ...(sNotes ? { notes: sNotes } : {}) });
      setSName(""); setSPhone(""); setSLevel(""); setSGroupId(""); setSNotes("");
    } catch (e2) { setErr(e2 instanceof Error ? e2.message : "فشل إضافة الطالب"); } finally { setSaving(false); }
  }

  async function handleCreateLecture(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!lTitle || !lStarts) { setErr("العنوان والموعد مطلوبان"); return; }
    setSaving(true);
    try {
      await onCreateLecture({
        title: lTitle,
        ...(lDesc ? { description: lDesc } : {}),
        ...(lTeacherId ? { teacherId: lTeacherId } : {}),
        ...(lGroupId ? { groupId: lGroupId } : {}),
        level: lLevel || null,
        startsAt: new Date(lStarts).toISOString(),
        ...(lEnds ? { endsAt: new Date(lEnds).toISOString() } : {}),
        ...(lUrl ? { meetingUrl: lUrl } : {}),
      });
      setLTitle(""); setLDesc(""); setLTeacherId(""); setLGroupId(""); setLLevel(""); setLStarts(""); setLEnds(""); setLUrl("");
      setShowLecForm(false);
    } catch (e2) { setErr(e2 instanceof Error ? e2.message : "فشل إنشاء المحاضرة"); } finally { setSaving(false); }
  }

  async function handleUpload(lectureId: string, file: File) {
    setErr("");
    setUploadingFor(lectureId);
    try {
      const uploaded = await uploadFile(file, "courses");
      await onAddFile(lectureId, { name: file.name, url: uploaded.url });
    } catch (e2) { setErr(e2 instanceof Error ? e2.message : "فشل رفع الملف"); } finally { setUploadingFor(null); }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold">المحاضرة المجانية</h2>
            <p className="text-xs text-muted-foreground">طلاب تجريبيون (من حجز واتساب) + محاضرات مجانية مجدولة + ملفات</p>
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => setTab("lectures")} className={`rounded-md px-3 py-1 text-xs ${tab === "lectures" ? "bg-brand text-white" : "bg-muted/60 text-muted-foreground"}`}>
              المحاضرات ({freeLectures.length})
            </button>
            <button onClick={() => setTab("students")} className={`rounded-md px-3 py-1 text-xs ${tab === "students" ? "bg-brand text-white" : "bg-muted/60 text-muted-foreground"}`}>
              طلاب التجربة ({freeStudents.length})
            </button>
          </div>
        </div>
        {err && <p className="mt-2 text-sm font-semibold text-danger">{err}</p>}
      </Card>

      {tab === "students" && (
        <>
          <Card>
            <h3 className="font-bold">إضافة طالب تجريبي</h3>
            <form onSubmit={handleCreateStudent} className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>الاسم</Label>
                <Input value={sName} onChange={(e) => setSName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>رقم الهاتف / واتساب</Label>
                <Input value={sPhone} onChange={(e) => setSPhone(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>المستوى</Label>
                <select value={sLevel} onChange={(e) => setSLevel(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">— بدون —</option>
                  {["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>المجموعة</Label>
                <select value={sGroupId} onChange={(e) => setSGroupId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">— بدون مجموعة —</option>
                  {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>ملاحظات</Label>
                <Input value={sNotes} onChange={(e) => setSNotes(e.target.value)} />
              </div>
              <Button type="submit" disabled={saving}>{saving ? "جاري الإضافة..." : "إضافة الطالب"}</Button>
            </form>
          </Card>

          <Card>
            <h3 className="font-bold">قائمة طلاب التجربة</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-right text-xs text-muted-foreground">
                    <th className="p-2">الاسم</th>
                    <th className="p-2">الهاتف</th>
                    <th className="p-2">المستوى</th>
                    <th className="p-2">المجموعة</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {freeStudents.length === 0 ? (
                    <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">لا يوجد طلاب تجريبيون بعد.</td></tr>
                  ) : (
                    freeStudents.map((s) => (
                      <tr key={s.id} className="border-b">
                        <td className="p-2 font-semibold">{s.name}</td>
                        <td className="p-2">{s.phone}</td>
                        <td className="p-2">{s.level ?? "—"}</td>
                        <td className="p-2">{s.group?.name ?? "—"}</td>
                        <td className="p-2">
                          <button onClick={() => { if (confirm(`حذف "${s.name}"؟`)) onDeleteStudent(s.id); }} className="text-xs text-danger hover:underline">حذف</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {tab === "lectures" && (
        <>
          <Card>
            <div className="flex items-center justify-between">
              <h3 className="font-bold">إنشاء محاضرة مجانية</h3>
              <Button variant="secondary" className="text-xs" onClick={() => setShowLecForm(!showLecForm)}>
                {showLecForm ? "إلغاء" : "+ محاضرة مجانية"}
              </Button>
            </div>
            {showLecForm && (
              <form onSubmit={handleCreateLecture} className="mt-4 space-y-3 rounded-md border border-border bg-muted/40 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>عنوان المحاضرة</Label>
                    <Input value={lTitle} onChange={(e) => setLTitle(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>المدرس</Label>
                    <select value={lTeacherId} onChange={(e) => setLTeacherId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                      <option value="">— بدون مدرس —</option>
                      {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>المجموعة المستهدفة</Label>
                    <select value={lGroupId} onChange={(e) => setLGroupId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                      <option value="">— عامة (كل الطلاب) —</option>
                      {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>المستوى</Label>
                    <select value={lLevel} onChange={(e) => setLLevel(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                      <option value="">— بدون —</option>
                      {["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>رابط الاجتماع</Label>
                    <Input value={lUrl} onChange={(e) => setLUrl(e.target.value)} placeholder="https://zoom.us/j/..." />
                  </div>
                  {lTeacherId && availability.length > 0 && (
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>مواعيد المدرس المتاحة</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {availability.map((slot) => {
                          const dayName = slot.specificDate
                            ? new Date(slot.specificDate).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })
                            : ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"][slot.dayOfWeek ?? 0];
                          return (
                            <button key={slot.id} type="button" onClick={() => pickSlot(slot)}
                              className="rounded-md border border-input bg-background px-2.5 py-1 text-xs hover:border-brand hover:bg-brand/5">
                              {dayName} {slot.startTime}—{slot.endTime}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label>البداية</Label>
                    <Input type="datetime-local" value={lStarts} onChange={(e) => setLStarts(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>النهاية</Label>
                    <Input type="datetime-local" value={lEnds} onChange={(e) => setLEnds(e.target.value)} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>الوصف</Label>
                    <textarea value={lDesc} onChange={(e) => setLDesc(e.target.value)} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  </div>
                </div>
                <Button type="submit" disabled={saving}>{saving ? "جاري الإنشاء..." : "إنشاء المحاضرة"}</Button>
              </form>
            )}
          </Card>

          <div className="space-y-2">
            {freeLectures.length === 0 ? (
              <Card className="py-10 text-center text-sm text-muted-foreground">لا توجد محاضرات مجانية بعد.</Card>
            ) : (
              freeLectures.map((l) => (
                <Card key={l.id}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <b>{l.title}</b>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge tone="muted">{l.status === "scheduled" ? "مجدولة" : l.status === "live" ? "مباشرة" : l.status === "completed" ? "مكتملة" : "ملغاة"}</Badge>
                        {l.group && <Badge tone="brand">{l.group.name}</Badge>}
                        {l.level && <Badge tone="gold">{l.level}</Badge>}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(l.startsAt).toLocaleString("ar-EG", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                        {l.teacher && ` · ${l.teacher.fullName}`}
                      </p>
                      {l.meetingUrl && (
                        <a href={l.meetingUrl} target="_blank" rel="noreferrer" className="mt-1 block text-xs text-brand2 underline">رابط الاجتماع</a>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={l.status}
                        onChange={(e) => onUpdateLecture(l.id, { status: e.target.value })}
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                      >
                        <option value="scheduled">مجدولة</option>
                        <option value="live">مباشرة</option>
                        <option value="completed">مكتملة</option>
                        <option value="cancelled">ملغاة</option>
                      </select>
                      <button onClick={() => { if (confirm(`حذف "${l.title}"؟`)) onDeleteLecture(l.id); }} className="rounded-md p-1.5 text-muted-foreground hover:bg-danger/10 hover:text-danger">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>

                  {/* Files */}
                  <div className="mt-3 border-t border-border pt-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-muted-foreground">الملفات ({l.files?.length ?? 0})</h4>
                      <label className="cursor-pointer text-xs font-semibold text-brand2 hover:underline">
                        {uploadingFor === l.id ? "جاري الرفع..." : "+ رفع ملف"}
                        <input
                          type="file"
                          className="hidden"
                          disabled={uploadingFor === l.id}
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(l.id, f); e.target.value = ""; }}
                        />
                      </label>
                    </div>
                    {(l.files ?? []).length > 0 && (
                      <div className="mt-2 space-y-1">
                        {(l.files ?? []).map((f, i) => (
                          <div key={i} className="flex items-center justify-between rounded-md bg-muted/60 px-2.5 py-1.5 text-sm">
                            <a href={f.url} target="_blank" rel="noreferrer" className="text-brand2 underline">{f.name}</a>
                            <button onClick={() => onRemoveFile(l.id, i)} className="text-xs text-danger hover:underline">إزالة</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
