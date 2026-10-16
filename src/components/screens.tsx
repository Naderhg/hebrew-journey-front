import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AreaChart, Area, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Check,
  Circle,
  ClipboardCheck,
  ExternalLink,
  FileCheck,
  FileText,
  Film,
  Link2,
  Mic,
  Plus,
  Search,
  Send,
  Server,
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
} from "../hooks/use-platform-store";
import { useAuth } from "../hooks/use-auth";
import { ROLE_LABELS, type UserRole } from "../lib/auth";
import { SERVER_CONFIG, mediaSrc } from "../lib/api";

const meta = (title: string, description: string) => ({
  meta: [
    { title: `${title} — Ohran` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — Ohran` },
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
  return (
    <Card>
      <div className="flex justify-between">
        <h2 className="text-lg font-bold">المهارات الست</h2>
        <Link to="/progress" className="text-xs text-brand">
          عرض التفاصيل
        </Link>
      </div>
      <div className="mt-6 text-center text-sm text-muted-foreground">
        لم يتم تسجيل تقييمات للمهارات بعد.
      </div>
    </Card>
  );
}

export function PlacementScreen() {
  const { placementQuestions } = usePlatformStore();
  const activeQuestions = placementQuestions.filter((q) => q.isActive);
  const [step, setStep] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});

  if (step >= activeQuestions.length && activeQuestions.length > 0) {
    const correctCount = activeQuestions.reduce(
      (acc, q) => (selectedAnswers[q.id] === q.correctOptionIndex ? acc + 1 : acc),
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
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {currentQ.options.map((x, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedAnswers((p) => ({ ...p, [currentQ.id]: idx }))}
                    className={`rounded-md border p-4 text-right text-sm transition-colors ${
                      selectedAnswers[currentQ.id] === idx
                        ? "border-brand bg-brand/10 font-bold text-brand"
                        : "border-border bg-background/60 hover:border-brand hover:bg-brand/5"
                    }`}
                  >
                    {x}
                  </button>
                ))}
              </div>
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
  const level =
    scorePercent >= 80 ? "B2" : scorePercent >= 55 ? "B1" : scorePercent >= 30 ? "A2" : "A1";
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
        <Link to="/plan">
          <Button className="mt-6 w-full">الانتقال إلى خطة التعلم</Button>
        </Link>
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
  const chartData: { m: string; reading: number; speaking: number }[] = [];
  return (
    <AppShell role="STUDENT">
      <PageHeader title="تقدمك" subtitle="تطور المهارات" />
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <h2 className="font-bold">تاريخ التطور</h2>
          {chartData.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              لا توجد بيانات تقدم مسجلة حتى الآن.
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
        <SkillsCard />
      </div>
    </AppShell>
  );
}

export type TeacherSection = "students" | "materials" | "exams";

export function TeacherScreen() {
  const { materials, exams, teacherStudents, leaderboard, fetchExamResults, gradeExamResult } =
    usePlatformStore();
  const [activeSection, setActiveSection] = useState<TeacherSection>("students");
  const [openMaterialId, setOpenMaterialId] = useState<string | null>(null);
  const [openExamId, setOpenExamId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const selectedStudent = teacherStudents.find((s) => s.id === selectedStudentId) ?? null;

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
                        {s.email} · المستوى: {s.level ?? "غير محدد"}
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
                    <p className="text-xs text-muted-foreground">{selectedStudent.email}</p>
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
  | "placement";

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
  } = usePlatformStore();

  const [activeSection, setActiveSection] = useState<AdminSection>("overview");

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
  const [qPromptAr, setQPromptAr] = useState("");
  const [qHebrewText, setQHebrewText] = useState("");
  const [opt1, setOpt1] = useState("");
  const [opt2, setOpt2] = useState("");
  const [opt3, setOpt3] = useState("");
  const [opt4, setOpt4] = useState("");
  const [correctIdx, setCorrectIdx] = useState(0);
  const [questionSuccess, setQuestionSuccess] = useState("");
  const [questionError, setQuestionError] = useState("");

  const counts = {
    teachers: users.filter((u) => u.role === "TEACHER").length,
    students: users.filter((u) => u.role === "STUDENT").length,
    sales: users.filter((u) => u.role === "SALES").length,
    support: users.filter((u) => u.role === "SUPPORT").length,
  };

  async function handleCreateStaff(e: React.FormEvent) {
    e.preventDefault();
    setUserError("");
    setUserSuccess("");
    try {
      await addStaffUser({
        fullName,
        email,
        password: password || "Ohran@1234",
        ...(phone ? { phone } : {}),
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
    const options = [opt1, opt2, opt3, opt4].map((o) => o.trim()).filter(Boolean);
    if (!qPromptAr.trim() || options.length < 2) return;

    try {
      await addPlacementQuestion({
        section: qSection,
        promptAr: qPromptAr,
        hebrewText: qHebrewText,
        options,
        correctOptionIndex: Math.min(correctIdx, options.length - 1),
        levelTag: qLevel,
      });

      setQPromptAr("");
      setQHebrewText("");
      setOpt1("");
      setOpt2("");
      setOpt3("");
      setOpt4("");
      setCorrectIdx(0);
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
                <td className="px-3 py-3.5 font-lat text-xs text-muted-foreground">{u.email}</td>
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
                      onClick={() => deleteUser(u.id)}
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
        title="لوحة تحكم الإدارة (Admin Dashboard)"
        subtitle="جميع صفحات الإدارة متاحة في القائمة الجانبية (Sidebar) ومربوطة بقاعدة البيانات مباشرة"
      />

      {activeSection === "overview" && (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <Card className="p-4">
              <small className="text-muted-foreground">المدرسون</small>
              <b className="mt-1 block font-lat text-2xl text-brand">{counts.teachers}</b>
              <span className="text-xs text-muted-foreground">في قاعدة البيانات</span>
            </Card>
            <Card className="p-4">
              <small className="text-muted-foreground">الطلاب المسجلون</small>
              <b className="mt-1 block font-lat text-2xl text-sage">{counts.students}</b>
              <span className="text-xs text-muted-foreground">تسجيل ذاتي</span>
            </Card>
            <Card className="p-4">
              <small className="text-muted-foreground">فريق المبيعات (Sales)</small>
              <b className="mt-1 block font-lat text-2xl">{counts.sales}</b>
              <span className="text-xs text-muted-foreground">في قاعدة البيانات</span>
            </Card>
            <Card className="p-4">
              <small className="text-muted-foreground">خدمة العملاء (Support)</small>
              <b className="mt-1 block font-lat text-2xl">{counts.support}</b>
              <span className="text-xs text-muted-foreground">في قاعدة البيانات</span>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <small className="text-muted-foreground">سيرفر VPS (API)</small>
                <Server className="size-4 text-sage" />
              </div>
              <b className="mt-1 block font-lat text-sm">{SERVER_CONFIG.vpsServerIp}</b>
              <span className="text-xs text-sage">متصل</span>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <small className="text-muted-foreground">سيرفر التخزين (Storage)</small>
                <Server className="size-4 text-brand" />
              </div>
              <b className="mt-1 block font-lat text-sm">{SERVER_CONFIG.storageServerIp}</b>
              <span className="text-xs text-brand">متصل</span>
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
                        {s.fullName} ({s.email})
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
              <Label>البريد الإلكتروني</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="staff@ohran.com"
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
              <Label>رقم الهاتف (اختياري)</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+20..."
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

              <div className="space-y-2">
                <Label>الاختيارات الأربعة</Label>
                <Input
                  value={opt1}
                  onChange={(e) => setOpt1(e.target.value)}
                  required
                  placeholder="الاختيار الأول"
                />
                <Input
                  value={opt2}
                  onChange={(e) => setOpt2(e.target.value)}
                  required
                  placeholder="الاختيار الثاني"
                />
                <Input
                  value={opt3}
                  onChange={(e) => setOpt3(e.target.value)}
                  required
                  placeholder="الاختيار الثالث"
                />
                <Input
                  value={opt4}
                  onChange={(e) => setOpt4(e.target.value)}
                  required
                  placeholder="الاختيار الرابع"
                />
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

              <Button type="submit" className="w-full">
                <Plus className="size-4" />
                نشر السؤال في الصفحة الرئيسية
              </Button>
            </form>
          </Card>
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
                    {r.student?.email} · {r.exam?.title ?? "امتحان"} ·{" "}
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
                        <option key={s.id} value={s.id}>{s.fullName} — {s.email}</option>
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

export function OpsScreen({ kind }: { kind: "support" }) {
  return (
    <AppShell role="SUPPORT">
      <PageHeader
        title="لوحة خدمة العملاء المستقلة (Support)"
        subtitle="التذاكر والمحادثات ومتابعة رضا العملاء"
      />
      <Card className="py-16 text-center text-sm text-muted-foreground">
        <span className="mx-auto mb-3 grid size-10 place-items-center rounded-md bg-brand/10 text-brand">
          <TicketCheck className="size-5" />
        </span>
        لا توجد بيانات مسجلة حالياً في قاعدة البيانات.
      </Card>
    </AppShell>
  );
}
