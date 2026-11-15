import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AreaChart, Area, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ArrowLeft,
  Award,
  Banknote,
  BarChart3,
  Camera,
  Rocket,
  CalendarDays,
  Check,
  Circle,
  Clock,
  Clock3,
  Gift,
  PhoneCall,
  CreditCard,
  PlusCircle,
  ShieldCheck,
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
import { useI18n } from "../lib/i18n";
import { Badge, Button, Card, Dropzone, HeroAction, HeroBanner, Input, Label, Pagination, ProgressBar, SearchBox, SectionHeader, StatCard, StatTile } from "./ui";
import {
  usePlatformStore,
  uploadFile,
  EXAM_TYPE_LABELS,
  QUESTION_TYPE_LABELS,
  PLATFORM_LEVELS,
  type PlatformLevel,
  type Exam,
  type ExamQuestionItem,
  type ExamQuestions,
  type ExamType,
  type LeaderboardEntry,
  type MaterialAttachment,
  type MaterialType,
  type PlacementSection,
  type PlacementQuestionType,
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
  type WeeklyScheduleItem,
  type CreateScheduleInput,
  type GroupItem,
} from "../hooks/use-platform-store";
import { useAuth } from "../hooks/use-auth";
import { ROLE_LABELS, updateProfile, type UserRole } from "../lib/auth";
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

const todayLabel = () =>
  new Date().toLocaleDateString("ar-EG-u-nu-latn", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const dayGreeting = () => (new Date().getHours() < 12 ? "صباح الخير" : "مساء الخير");
const firstNameOf = (fullName?: string) => fullName?.trim().split(/\s+/)[0] ?? "بك";

function SingleMediaView({ url, type, title, fileName }: { url: string; type: MaterialType; title: string; fileName: string }) {
  const { t } = useI18n();
  const src = mediaSrc(url);
  if (type === "VIDEO") {
    return (
      <video controls preload="metadata" className="w-full rounded-md bg-black" src={src}>
        {t("متصفحك لا يدعم تشغيل الفيديو.")}
      </video>
    );
  }
  if (type === "AUDIO") {
    return (
      <audio controls preload="metadata" className="w-full" src={src}>
        {t("متصفحك لا يدعم تشغيل الصوت.")}
      </audio>
    );
  }
  return (
    <div className="space-y-2">
      <iframe src={src} title={title} className="h-[420px] w-full rounded-md border border-border bg-white" />
      <a
        href={src}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
      >
        <ExternalLink className="size-3.5" />
        {t("فتح الملف في تبويب جديد")} ({fileName})
      </a>
    </div>
  );
}

export function MaterialPlayer({
  material,
}: {
  material: { storageUrl: string; type: MaterialType; title: string; fileName: string; attachments?: MaterialAttachment[] | null };
}) {
  const { t } = useI18n();
  const extras = material.attachments ?? [];
  return (
    <div className="space-y-4">
      <SingleMediaView url={material.storageUrl} type={material.type} title={material.title} fileName={material.fileName} />
      {extras.map((att, idx) => (
        <div key={idx} className="space-y-2 rounded-lg border border-border bg-background/60 p-3">
          <div className="flex items-center justify-between gap-2 text-xs">
            <b className="truncate">{att.name}</b>
            <Badge tone="muted">{att.type === "VIDEO" ? t("فيديو") : att.type === "AUDIO" ? t("صوت") : t("ملف")} · {att.size}</Badge>
          </div>
          <SingleMediaView url={att.url} type={att.type} title={att.name} fileName={att.name} />
        </div>
      ))}
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
  const { t } = useI18n();
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
      setError(t("تعذر الوصول إلى الميكروفون — تأكد من السماح بالوصول"));
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
          {recording ? t("إيقاف التسجيل") : label}
        </Button>
        {recording && <span className="text-xs font-semibold text-danger">{t("جاري التسجيل...")}</span>}
      </div>
      {audioUrl && !recording && (
        <audio controls src={audioUrl} className="mt-3 w-full" />
      )}
      {error && <p className="mt-2 text-xs font-semibold text-danger">{error}</p>}
    </div>
  );
}

export function HebrewTTS({ text, label = "استمع للفقرة" }: { text: string; label?: string }) {
  const { t } = useI18n();
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
      {playing ? t("إيقاف") : label}
    </Button>
  );
}

export function LeaderboardCard({ entries }: { entries: LeaderboardEntry[] }) {
  const { t } = useI18n();
  return (
    <Card>
      <div className="flex items-center gap-2">
        <Trophy className="size-5 text-amber-500" />
        <h2 className="text-lg font-bold">{t("لوحة المتفوقين")}</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("ترتيب الطلاب حسب متوسط درجاتهم في كل الامتحانات")}
      </p>
      <div className="mt-4 space-y-2">
        {entries.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {t("لا توجد نتائج منشورة بعد — سلّم امتحاناً لتظهر هنا!")}
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
                  {entry.examsTaken} {t("امتحانات")}
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
  const { t } = useI18n();
  const { studentDashboard, leaderboard } = usePlatformStore();
  const dash = studentDashboard;

  return (
    <AppShell role="STUDENT">
      <HeroBanner
        tone="green"
        word="בוקר טוב"
        wordCaption={t("صباح الخير")}
        kicker={todayLabel()}
        title={
          <>
            {t(dayGreeting())}، {firstNameOf(user?.fullName)}{" "}
            <span className="text-amber-300">✦</span>
          </>
        }
        subtitle={t("خطواتك واضحة اليوم — تابع تقدمك ونتائجك وخطة تعلمك من مكان واحد")}
        cta={
          <>
            <Link to="/plan">
              <HeroAction>
                {t("ابدأ خطة اليوم")}
                <ArrowLeft className="size-4" />
              </HeroAction>
            </Link>
            <Link to="/courses">
              <HeroAction>{t("كورساتي")}</HeroAction>
            </Link>
          </>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          chip="teal"
          icon={ClipboardCheck}
          label={t("مستواك الحالي")}
          value={user?.level ?? "—"}
          sub={t("حسب اختبار تحديد المستوى")}
        />
        <StatCard
          chip="mint"
          icon={TrendingUp}
          label={t("متوسط درجاتك")}
          value={dash?.myAvgScore !== null && dash?.myAvgScore !== undefined ? `${dash.myAvgScore}%` : "—"}
          sub={t("من كل الامتحانات المصححة")}
        />
        <StatCard
          chip="lilac"
          icon={Trophy}
          label={t("ترتيبك بين الطلاب")}
          value={dash?.myRank !== null && dash?.myRank !== undefined ? `#${dash.myRank}` : "—"}
          sub={`${t("من أصل")} ${dash?.totalStudents ?? 0} ${t("طالب")}`}
        />
        <StatCard
          chip="peach"
          icon={FileCheck}
          label={t("امتحانات مصححة")}
          value={dash?.myResults?.filter((r) => r.score !== null).length ?? 0}
          sub={t("إجمالي النتائج المعتمدة")}
        />
      </div>

      {!user?.placementCompletedAt && (
        <Card className="mb-4 flex flex-wrap items-center justify-between gap-4 bg-ink text-primary-foreground">
          <div className="min-w-0">
            <small className="opacity-75">{t("اختبار تحديد المستوى")}</small>
            <h2 className="mt-1 text-lg font-bold">{t("حدد مستواك الحالي")}</h2>
            <p className="mt-1 text-xs opacity-80">
              {t("ابدأ اختبار تحديد المستوى لبناء خطتك الشخصية وتقييم مهاراتك.")}
            </p>
          </div>
          <Link to="/placement">
            <Button className="bg-card text-foreground hover:bg-card/90">{t("بدء الاختبار")}</Button>
          </Link>
        </Card>
      )}

      <div className="mt-4">
        <Card>
          <h2 className="text-lg font-bold">{t("نتائج امتحاناتي وملاحظات المدرسين")}</h2>
          <div className="mt-4 space-y-3">
            {!dash || !dash.myResults || dash.myResults.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {t("لا توجد نتائج مصححة لك حتى الآن — سلّم امتحاناً وستظهر نتيجتك وملاحظة المدرس هنا فوراً.")}
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
                      {t(EXAM_TYPE_LABELS[r.type])}
                    </small>
                    {r.feedback && (
                      <p className="mt-1 rounded-sm bg-sage/10 px-2 py-1 text-xs text-sage">
                        {t("ملاحظة المدرس")}: {r.feedback}
                      </p>
                    )}
                  </div>
                  <Badge tone={r.score !== null ? "sage" : "muted"}>
                    {r.score !== null ? `${r.score}%` : t("بانتظار التصحيح")}
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
  const { t } = useI18n();
  return (
    <Card>
      <div className="flex justify-between">
        <h2 className="text-lg font-bold">{t("المستوى والتقدم")}</h2>
        <span className="text-xs text-muted-foreground">{t("الحالة الحالية")}</span>
      </div>
      <div className="mt-5 flex items-center gap-4">
        <span className="grid size-16 place-items-center rounded-md bg-brand/10 font-lat text-2xl font-bold text-brand">
          —
        </span>
        <div className="flex-1">
          <b className="font-lat text-3xl">0%</b>
          <small className="block text-muted-foreground">{t("إتمام المسار الحالي")}</small>
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
  const { t } = useI18n();
  return (
    <Card>
      <div className="flex justify-between">
        <h2 className="text-lg font-bold">{t("مهاراتي الأربع")}</h2>
        <Link to="/progress" className="text-xs text-brand">
          {t("عرض التفاصيل")}
        </Link>
      </div>
      {studentSkills.length === 0 ? (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          {t("لم يتم تسجيل تقييمات للمهارات بعد — سيقيّمها مدرسك هنا.")}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {studentSkills.map((s) => (
            <div key={s.id}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span>{t(SKILL_LABELS[s.skill] ?? s.skill)}</span>
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
  const { t } = useI18n();
  const activeQuestions = placementQuestions.filter((q) => q.isActive);
  const [step, setStep] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number | string>>({});
  const [audioAnswers, setAudioAnswers] = useState<Record<string, string>>({});
  const [audioUploading, setAudioUploading] = useState(false);
  const [audioError, setAudioError] = useState("");

  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const isAudioQ = (q: (typeof activeQuestions)[number]) => q.questionType === "audio";
  const gradedQuestions = activeQuestions.filter((q) => !isAudioQ(q));
  const isCorrect = (q: (typeof activeQuestions)[number]) => {
    const ans = selectedAnswers[q.id];
    if (q.questionType === "text") {
      return typeof ans === "string" && !!q.expectedAnswer
        && normalize(ans) === normalize(q.expectedAnswer);
    }
    return ans === q.correctOptionIndex;
  };
  const hasAnswer = (q: (typeof activeQuestions)[number]) => {
    if (isAudioQ(q)) return !!audioAnswers[q.id];
    const ans = selectedAnswers[q.id];
    if (q.questionType === "text") return typeof ans === "string" && ans.trim().length > 0;
    return typeof ans === "number";
  };

  async function handleAudioRecorded(qId: string, blob: Blob) {
    setAudioError("");
    setAudioUploading(true);
    try {
      const up = await uploadFile(blob, "audio");
      setAudioAnswers((p) => ({ ...p, [qId]: up.url }));
    } catch {
      setAudioError(t("تعذر رفع التسجيل — حاول مرة أخرى"));
    } finally {
      setAudioUploading(false);
    }
  }

  if (step >= activeQuestions.length && activeQuestions.length > 0) {
    const correctCount = gradedQuestions.reduce(
      (acc, q) => (isCorrect(q) ? acc + 1 : acc),
      0,
    );
    const scorePercent = gradedQuestions.length
      ? Math.round((correctCount / gradedQuestions.length) * 100)
      : 0;
    const answers = activeQuestions.map((q) => ({
      questionId: q.id,
      ...(isAudioQ(q)
        ? { audioUrl: audioAnswers[q.id] }
        : { answer: selectedAnswers[q.id] }),
    }));
    return (
      <PlacementResult
        scorePercent={scorePercent}
        correctCount={correctCount}
        total={gradedQuestions.length}
        answers={answers}
      />
    );
  }

  const currentQ = activeQuestions[step];

  return (
    <AppShell role="STUDENT">
      <PageHeader
        title={t("اختبار تحديد المستوى")}
        subtitle={t("الأسئلة المخصصة من إدارة المنصة لتحديد مستواك بدقة")}
      />
      <Card className="mx-auto max-w-4xl">
        {!currentQ ? (
          <div className="py-12 text-center text-muted-foreground">
            {t("لا توجد أسئلة مفعلة حالياً في قاعدة البيانات.")}
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
                  {t("السؤال")} {step + 1} {t("من")} {activeQuestions.length}
                </Badge>
                <Badge tone="gold">{currentQ.section}</Badge>
                <Badge tone="muted">{t("مستوى")} {currentQ.levelTag}</Badge>
              </div>
              <h2 className="mt-4 text-2xl font-bold">{currentQ.promptAr}</h2>
              <p className="mt-3 font-he text-xl leading-9">{currentQ.hebrewText}</p>

              {currentQ.paragraph && (
                <div className="mt-4 rounded-md border border-border bg-muted/40 p-4">
                  <small className="block text-xs font-semibold text-muted-foreground">{t("اقرأ الفقرة التالية ثم أجب")}</small>
                  <p className="mt-1 whitespace-pre-wrap font-he text-base leading-8">{currentQ.paragraph}</p>
                </div>
              )}

              {currentQ.audioUrl && (
                <div className="mt-4">
                  <small className="mb-1 block text-xs font-semibold text-muted-foreground">{t("استمع للمقطع ثم أجب")}</small>
                  <audio controls src={mediaSrc(currentQ.audioUrl)} className="w-full" />
                </div>
              )}

              {currentQ.questionType === "audio" ? (
                <div className="mt-6">
                  <AudioRecorder
                    label={t("سجّل إجابتك الصوتية")}
                    onRecorded={(blob) => void handleAudioRecorded(currentQ.id, blob)}
                  />
                  {audioUploading && <p className="mt-2 text-xs text-muted-foreground">{t("جاري رفع التسجيل...")}</p>}
                  {audioAnswers[currentQ.id] && !audioUploading && (
                    <p className="mt-2 text-xs font-semibold text-sage">{t("تم حفظ تسجيلك — يمكنك إعادة التسجيل إن أردت")}</p>
                  )}
                  {audioError && <p className="mt-2 text-xs font-semibold text-danger">{audioError}</p>}
                </div>
              ) : currentQ.questionType === "text" ? (
                <div className="mt-6">
                  <Input
                    dir="rtl"
                    value={typeof selectedAnswers[currentQ.id] === "string" ? (selectedAnswers[currentQ.id] as string) : ""}
                    onChange={(e) =>
                      setSelectedAnswers((p) => ({ ...p, [currentQ.id]: e.target.value }))
                    }
                    placeholder={t("اكتب إجابتك هنا...")}
                    className="text-base"
                  />
                </div>
              ) : (
                <div className={`mt-6 grid gap-3 ${currentQ.questionType === "truefalse" ? "" : "sm:grid-cols-2"}`}>
                  {(currentQ.questionType === "truefalse" ? [t("صح"), t("خطأ")] : currentQ.options).map((x, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedAnswers((p) => ({ ...p, [currentQ.id]: idx }))}
                      className={`rounded-md border p-4 text-center text-sm font-bold transition-colors ${
                        selectedAnswers[currentQ.id] === idx
                          ? "border-brand bg-brand/10 text-brand"
                          : "border-border bg-background/60 hover:border-brand hover:bg-brand/5"
                      }`}
                    >
                      {currentQ.questionType === "truefalse" ? t(x) : x}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))}>
                {t("السابق")}
              </Button>
              <Button onClick={() => setStep(step + 1)}>
                {step === activeQuestions.length - 1 ? t("إنهاء وعرض النتيجة") : t("التالي")}
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
  answers,
}: {
  scorePercent: number;
  correctCount: number;
  total: number;
  answers?: { questionId: string; answer?: number | string; audioUrl?: string }[];
}) {
  const { submitPlacementResult } = usePlatformStore();
  const { t } = useI18n();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const submitted = useRef(false);
  const level: PlatformLevel =
    scorePercent >= 90 ? "B2"
    : scorePercent >= 78 ? "B1+"
    : scorePercent >= 65 ? "B1"
    : scorePercent >= 52 ? "A2+"
    : scorePercent >= 40 ? "A2"
    : scorePercent >= 28 ? "A1+"
    : scorePercent >= 15 ? "A1"
    : "Pre A1";

  useEffect(() => {
    if (!user || submitted.current) return;
    submitted.current = true;
    setSaveState("saving");
    submitPlacementResult(scorePercent, level, answers)
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
      <PageHeader title={t("نتيجة اختبار المستوى")} subtitle={t("تم حساب النتيجة بناءً على إجاباتك")} />
      <Card className="mx-auto max-w-lg text-center">
        <span className="mx-auto grid size-24 place-items-center rounded-lg bg-brand/10 font-lat text-4xl font-bold text-brand">
          {level}
        </span>
        <h2 className="mt-4 text-xl font-bold">{t("مستواك")}: {level}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("أجبت بشكل صحيح على")} {correctCount} {t("من أصل")} {total} ({scorePercent}%)
        </p>
        <div className="mt-4">
          <ProgressBar value={scorePercent} tone="sage" />
        </div>
        {saveState === "saved" && (
          <p className="mt-3 text-xs font-semibold text-sage">{t("تم حفظ مستواك في ملفك الشخصي")}</p>
        )}
        {saveState === "error" && (
          <p className="mt-3 text-xs font-semibold text-danger">{t("تعذر حفظ النتيجة — حاول مجدداً لاحقاً")}</p>
        )}

        <div className="mt-6 rounded-md border border-brand/30 bg-brand/5 p-4 text-right">
          <b className="text-sm">{t("الخطوة التالية: احجز محاضرتك المجانية")}</b>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("تواصل معنا على واتساب لحجز محاضرة تجريبية مجانية مع مدرسك")}
          </p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`أهلاً، أنا ${user?.fullName ?? "طالب جديد"}. خلصت اختبار تحديد المستوى وطلع مستواي ${level} — عايز أحجز المحاضرة المجانية`)}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-sage px-4 py-2.5 text-sm font-bold text-white transition hover:bg-sage/90"
          >
            {t("احجز محاضرتك المجانية عبر واتساب")}
          </a>
        </div>

        <Button className="mt-4 w-full" onClick={goToSubscribe}>
          {t("متابعة — اختيار الباقة والاشتراك")}
        </Button>
      </Card>
    </AppShell>
  );
}

export function PlanScreen() {
  const { t } = useI18n();
  return (
    <AppShell role="STUDENT">
      <PageHeader title={t("خطة التعلم الشخصية")} subtitle={t("المسار اليومي المخصص لك")} />
      <Card className="py-12 text-center text-sm text-muted-foreground">
        {t("لا توجد خطة تعلم مسجلة حالياً.")}
      </Card>
    </AppShell>
  );
}

export function ConversationScreen() {
  const { t } = useI18n();
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
      <PageHeader title={t("محادثة عبرية")} subtitle={t("محادثة تفاعلية")} />
      <Card className="flex min-h-[520px] flex-col p-0">
        <div className="flex flex-1 flex-col gap-4 p-5">
          {messages.length === 0 ? (
            <div className="m-auto text-center text-sm text-muted-foreground">
              {t("ابدأ المحادثة بكتابة رسالة بالعبرية...")}
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
  const { t } = useI18n();
  return (
    <AppShell role="STUDENT">
      <PageHeader title={t("مكتبة السيناريوهات")} subtitle={t("تدرّب على مواقف واقعية تناسب مستواك")} />
      <Card className="py-12 text-center text-sm text-muted-foreground">
        {t("لا توجد سيناريوهات مضافة في قاعدة البيانات حالياً.")}
      </Card>
    </AppShell>
  );
}

export function MistakesScreen() {
  const { t } = useI18n();
  return (
    <AppShell role="STUDENT">
      <PageHeader title={t("سجل الأخطاء")} subtitle={t("متابعة الأخطاء المتكررة وتصحيحها")} />
      <Card className="py-12 text-center text-sm text-muted-foreground">
        {t("لا توجد أخطاء مسجلة حالياً.")}
      </Card>
    </AppShell>
  );
}

export function ProgressScreen() {
  const { studentSkills, studentAttendanceRate, studentAttendance, studentDashboard, studentLectureReports, fetchStudentLectureReports } = usePlatformStore();
  const { t } = useI18n();
  useEffect(() => {
    fetchStudentLectureReports().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const chartData: { m: string; reading: number; speaking: number }[] = [];
  return (
    <AppShell role="STUDENT">
      <PageHeader title={t("تقدمك")} subtitle={t("تطور مهاراتك وحضورك ونتائجك")} />
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="p-4 text-center">
              <small className="text-muted-foreground">{t("متوسط درجاتي")}</small>
              <b className="mt-1 block font-lat text-2xl text-brand">
                {studentDashboard?.myAvgScore !== null && studentDashboard?.myAvgScore !== undefined
                  ? `${studentDashboard.myAvgScore}%`
                  : "—"}
              </b>
            </Card>
            <Card className="p-4 text-center">
              <small className="text-muted-foreground">{t("نسبة الحضور")}</small>
              <b className="mt-1 block font-lat text-2xl text-sage">
                {studentAttendanceRate !== null ? `${studentAttendanceRate}%` : "—"}
              </b>
            </Card>
            <Card className="p-4 text-center">
              <small className="text-muted-foreground">{t("ترتيبي")}</small>
              <b className="mt-1 block font-lat text-2xl text-gold">
                {studentDashboard?.myRank ? `#${studentDashboard.myRank}` : "—"}
              </b>
            </Card>
          </div>
          <Card>
            <h2 className="font-bold">{t("تاريخ التطور")}</h2>
            {chartData.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                {t("لا توجد بيانات تقدم تاريخية بعد — تقييماتك الحالية تظهر في بطاقة المهارات.")}
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
            <h2 className="font-bold">{t("سجل حضوري")} ({studentAttendance.length})</h2>
            <div className="mt-3 space-y-2">
              {studentAttendance.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("لا توجد سجلات حضور بعد.")}</p>
              ) : (
                studentAttendance.slice(0, 10).map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-md bg-muted/60 p-2.5 text-sm">
                    <span>
                      {a.schedule.title} · {a.schedule.teacher.fullName} ·{" "}
                      {new Date(a.date).toLocaleDateString("ar-EG")}
                    </span>
                    <Badge tone={a.status === "present" ? "sage" : a.status === "late" ? "gold" : a.status === "excused" ? "brand" : "danger"}>
                      {a.status === "present" ? t("حاضر") : a.status === "absent" ? t("غائب") : a.status === "late" ? t("متأخر") : t("معذور")}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
          {studentLectureReports.filter((r) => r.report).length > 0 && (
            <Card>
              <h2 className="font-bold">{t("تقارير المدرس عني")} ({studentLectureReports.filter((r) => r.report).length})</h2>
              <div className="mt-3 space-y-2">
                {studentLectureReports.filter((r) => r.report).map((r) => (
                  <div key={r.id} className="rounded-md border border-border bg-background/60 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <b className="text-sm">{r.lecture.title}</b>
                      <Badge tone={r.status === "present" ? "sage" : "danger"}>
                        {r.status === "present" ? t("حاضر") : t("غائب")}
                      </Badge>
                    </div>
                    <small className="text-muted-foreground">
                      {new Date(r.lecture.startsAt).toLocaleDateString("ar-EG", { day: "numeric", month: "long" })}
                      {r.lecture.teacher?.fullName ? ` · ${r.lecture.teacher.fullName}` : ""}
                    </small>
                    <p className="mt-1.5 border-t border-border/60 pt-1.5 text-sm text-muted-foreground">{r.report}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
        <div className="space-y-4">
          <Card>
            <h2 className="font-bold">{t("تقييم المهارات")}</h2>
            {studentSkills.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">{t("لم يقيّم مدرسك مهاراتك بعد.")}</p>
            ) : (
              <div className="mt-4 space-y-4">
                {studentSkills.map((s) => (
                  <div key={s.id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <b>{t(SKILL_LABELS[s.skill] ?? s.skill)}</b>
                      <span className="font-lat text-brand">{s.score}%</span>
                    </div>
                    <ProgressBar value={s.score} tone={s.score >= 70 ? "sage" : s.score >= 50 ? "gold" : "brand"} />
                    {s.notes && <p className="mt-1 text-xs text-muted-foreground">{s.notes}</p>}
                    {s.updatedBy && (
                      <small className="text-xs text-muted-foreground">{t("بواسطة")}: {s.updatedBy.fullName}</small>
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

export type TeacherSection = "profile" | "free-lectures" | "students" | "materials" | "exams" | "schedule" | "homework" | "attendance" | "chat" | "reports" | "sessions" | "analytics";

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
    teacherFreeLectures,
    fetchTeacherFreeLectures,
    teacherAttendance,
    createTeacherSchedule,
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
    teacherAnalytics,
    fetchTeacherAnalytics,
    fetchTeacherSchedules,
    fetchTeacherLectures,
    updateTeacherLectureStatus,
    startScheduleLecture,
    lectureStudents,
    fetchLectureStudents,
    saveLectureAttendance,
  } = usePlatformStore();
  const { user } = useAuth();
  const { t } = useI18n();
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
  const [hwType, setHwType] = useState<ExamType>("translation");
  const [hwItems, setHwItems] = useState<ExamQuestionItem[]>([]);
  const [hwAudioBlob, setHwAudioBlob] = useState<Blob | null>(null);

  // Attendance
  const [attScheduleId, setAttScheduleId] = useState("");
  const [attLectureId, setAttLectureId] = useState("");
  const [lectureAttDraft, setLectureAttDraft] = useState<Record<string, "present" | "absent">>({});
  const [lectureReportDraft, setLectureReportDraft] = useState<Record<string, string>>({});
  const [reportOpenFor, setReportOpenFor] = useState<string | null>(null);
  const [attLectureSaving, setAttLectureSaving] = useState(false);
  const [attErr, setAttErr] = useState("");
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

  // Analytics filters
  const [anFrom, setAnFrom] = useState("");
  const [anTo, setAnTo] = useState("");
  const [anStudentId, setAnStudentId] = useState("");

  // Session availability form
  const [avMode, setAvMode] = useState<"date" | "weekly">("date");
  const [avDay, setAvDay] = useState<number | null>(0);
  const [avDate, setAvDate] = useState("");
  const [avStart, setAvStart] = useState("18:00");
  const [avEnd, setAvEnd] = useState("19:00");
  const [avSaving, setAvSaving] = useState(false);
  const [avMsg, setAvMsg] = useState("");

  useEffect(() => {
    if (activeSection === "attendance") {
      fetchTeacherAttendance().catch(() => {});
      fetchTeacherSchedules().catch(() => {});
      fetchTeacherLectures(true).catch(() => {});
    }
    if (activeSection === "schedule") {
      fetchTeacherLectures(true).catch(() => {});
      fetchTeacherBookings().catch(() => {});
      fetchTeacherFreeLectures().catch(() => {});
    }
    if (activeSection === "chat") fetchTeacherChatThreads().catch(() => {});
    if (activeSection === "sessions") {
      fetchTeacherAvailability().catch(() => {});
      fetchTeacherBookings().catch(() => {});
    }
    if (activeSection === "analytics") {
      fetchTeacherAnalytics({ from: anFrom || undefined, to: anTo || undefined, studentId: anStudentId || undefined }).catch(() => {});
    }
  }, [activeSection, anFrom, anTo, anStudentId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAddAvailability(e: React.FormEvent) {
    e.preventDefault();
    setAvMsg("");
    setAvSaving(true);
    try {
      await addTeacherAvailability({
        dayOfWeek: avMode === "weekly" ? avDay : null,
        specificDate: avMode === "date" ? avDate || null : null,
        startTime: avStart,
        endTime: avEnd,
      });
      setAvMsg(t("تمت إضافة الموعد — تقدر تضيف معاد تاني لنفس اليوم"));
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
      // listening homework: teacher records the audio students will hear
      let hwAudioUrl: string | undefined;
      if (hwType === "listening" && hwAudioBlob) {
        const file = new File([hwAudioBlob], `hw-listen-${Date.now()}.webm`, { type: hwAudioBlob.type || "audio/webm" });
        hwAudioUrl = (await uploadFile(file, "audio")).url;
      }
      const items = hwItems
        .filter((q) => q.prompt.trim())
        .map((q) => ({
          ...q,
          options: q.type === "truefalse" ? ["صح", "خطأ"] : (q.options ?? []).filter((o) => o.trim()),
          points: q.points ?? 1,
        }));
      await createHomework({
        title: hwTitle,
        ...(hwDesc ? { description: hwDesc } : {}),
        ...(hwHebrew ? { hebrewText: hwHebrew } : {}),
        type: hwType,
        questions: {
          ...(hwHebrew ? { paragraph: hwHebrew } : {}),
          ...(hwAudioUrl ? { audioUrl: hwAudioUrl } : {}),
          items,
        },
        ...(hwStudentId ? { studentId: hwStudentId } : {}),
        ...(hwGroup ? { groupName: hwGroup } : {}),
        ...(hwDue ? { dueDate: hwDue } : {}),
      });
      setHwTitle(""); setHwDesc(""); setHwHebrew(""); setHwStudentId(""); setHwGroup(""); setHwDue("");
      setHwType("translation"); setHwItems([]); setHwAudioBlob(null);
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
      {activeSection !== "students" && (
        <PageHeader
          title={t("لوحة المدرس")}
          subtitle={t("طلابك المسجلون وتقدمهم · الماتيريال المرسلة من الإدارة · الامتحانات والنتائج")}
        />
      )}

      {activeSection === "profile" && <TeacherProfileSection />}

      {activeSection === "free-lectures" && (
        <TeacherFreeLecturesSection lectures={teacherFreeLectures} />
      )}

      {activeSection === "students" && (
        <>
        <HeroBanner
          tone="teal"
          icon={Video}
          kicker={todayLabel()}
          title={
            <>
              {t(dayGreeting())}، {firstNameOf(user?.fullName)}{" "}
              <span className="text-amber-300">✦</span>
            </>
          }
          subtitle={t("طلابك وجدولك وواجباتك بانتظارك — تابع كل شيء من مكان واحد")}
          cta={
            <HeroAction onClick={() => setActiveSection("schedule")}>
              {t("عرض جدولك اليوم")}
              <ArrowLeft className="size-4" />
            </HeroAction>
          }
        />

        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard chip="mint" icon={UsersRound} label={t("إجمالي طلابك")} value={teacherStudents.length} sub={t("طالب مربوط بك")} />
          <StatCard chip="teal" icon={Video} label={t("المحاضرات المجانية")} value={teacherFreeLectures.length} sub={t("محاضرة مجدولة")} />
          <StatCard chip="lilac" icon={Film} label={t("المواد التعليمية")} value={materials.length} sub={t("مادة مرسلة لك")} />
          <StatCard chip="peach" icon={ClipboardCheck} label={t("الواجبات")} value={teacherHomework.length} sub={t("واجب منشور")} />
        </div>

        <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
          <Card>
            <h2 className="mb-3 font-bold">{t("طلابي المسجلون")} ({teacherStudents.length})</h2>
            <div className="relative">
              <Search className="absolute right-3 top-3 size-4 text-muted-foreground" />
              <input
                className="w-full rounded-md border border-input bg-background/60 py-2.5 pe-10 ps-3 text-sm outline-none"
                placeholder={t("ابحث عن طالب")}
              />
            </div>
            <div className="mt-4 space-y-2">
              {teacherStudents.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {t("لا يوجد طلاب مربوطون بك حالياً — تتم الربط من لوحة الإدارة.")}
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
                        {s.phone ?? s.email ?? "—"} · {t("المستوى")}: {s.level ?? t("غير محدد")}
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
                  <Badge tone="brand">{t("المستوى")}: {selectedStudent.level ?? t("غير محدد")}</Badge>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-md bg-muted/60 p-4 text-center">
                    <small className="text-muted-foreground">{t("امتحانات محلولة")}</small>
                    <b className="mt-1 block font-lat text-2xl">{selectedStudent.examsTaken}</b>
                  </div>
                  <div className="rounded-md bg-muted/60 p-4 text-center">
                    <small className="text-muted-foreground">{t("متوسط الدرجات")}</small>
                    <b className="mt-1 block font-lat text-2xl text-brand">
                      {selectedStudent.avgScore !== null ? `${selectedStudent.avgScore}%` : "—"}
                    </b>
                  </div>
                  <div className="rounded-md bg-muted/60 p-4 text-center">
                    <small className="text-muted-foreground">{t("المجموعة")}</small>
                    <b className="mt-1 block text-sm">{selectedStudent.groupName ?? "—"}</b>
                  </div>
                </div>
                {selectedStudent.examsTaken > 0 && (
                  <div className="mt-5">
                    <small className="mb-1 block text-muted-foreground">{t("نسبة التقدم في الامتحانات")}</small>
                    <ProgressBar value={selectedStudent.avgScore ?? 0} tone="brand" />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center py-16 text-sm text-muted-foreground">
                {t("اختر طالباً من القائمة لعرض تقدمه")}
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
              <h2 className="text-lg font-bold">{t("الكورسات والملفات المرسلة لك من الإدارة")}</h2>
              <p className="text-xs text-muted-foreground">
                {t("اضغط على أي مادة لفتحها وتشغيلها داخل المنصة مباشرة")}
              </p>
            </div>
            <Badge tone="brand">{materials.length} {t("مادة")}</Badge>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {materials.length === 0 ? (
              <div className="col-span-2 rounded-md bg-muted/60 p-6 text-center text-sm text-muted-foreground">
                {t("لا توجد كورسات أو ملفات مخصصة لك حتى الآن.")}
              </div>
            ) : (
              materials.map((mat) => (
                <div
                  key={mat.id}
                  className="flex flex-col rounded-md border border-border bg-background/60 p-4"
                >
                  <div className="flex items-center justify-between">
                    <Badge tone={mat.type === "VIDEO" ? "brand" : "gold"}>
                      {mat.type === "VIDEO" ? t("فيديو") : mat.type === "AUDIO" ? t("صوتي") : t("ملف")}
                    </Badge>
                    <div className="flex gap-1.5">
                      <Badge tone="sage">{t("مستوى")} {mat.level}</Badge>
                      <Badge tone={mat.status === "PUBLISHED" ? "sage" : "muted"}>
                        {mat.status === "PUBLISHED" ? t("منشور") : t("مسودة")}
                      </Badge>
                    </div>
                  </div>
                  <h3 className="mt-3 font-bold">{mat.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{mat.description}</p>
                  <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                    {mat.fileName} · {mat.fileSize}
                    {(mat.attachments?.length ?? 0) > 0 && (
                      <Badge tone="brand" className="mr-1.5">+{mat.attachments!.length} {t("مرفق")}</Badge>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    className="mt-3 w-full text-xs"
                    onClick={() =>
                      setOpenMaterialId(openMaterialId === mat.id ? null : mat.id)
                    }
                  >
                    {openMaterialId === mat.id ? t("إغلاق") : t("فتح المادة في المنصة")}
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
                <h2 className="text-lg font-bold">{t("الامتحانات المخصصة لك من الإدارة")}</h2>
                <p className="text-xs text-muted-foreground">
                  {t("تظهر تلقائياً لطلابك المربوطين بك عند نشرها")}
                </p>
              </div>
              <Badge tone="brand">{exams.length} {t("امتحان")}</Badge>
            </div>

            <div className="mt-4 space-y-3">
              {exams.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  {t("لا توجد امتحانات مخصصة لك حالياً.")}
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
                            {exam.description || t("بدون وصف")}
                          </small>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone="gold">{t(EXAM_TYPE_LABELS[exam.type])}</Badge>
                        <Badge tone={exam.status === "PUBLISHED" ? "sage" : "muted"}>
                          {exam.status === "PUBLISHED" ? t("منشور") : t("مسودة")}
                        </Badge>
                        <Badge tone="muted">{exam.resultsCount ?? 0} {t("تسليم")}</Badge>
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
                          {openExamId === exam.id ? t("إخفاء النتائج") : t("عرض نتائج الطلاب")}
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
          <TeacherScheduleTimeline
            lectures={teacherLectures}
            bookings={teacherBookings}
            freeLectures={teacherFreeLectures}
            onLectureStatus={(id, s) => updateTeacherLectureStatus(id, s).then(() => fetchTeacherAnalytics({})).catch(() => {})}
            onBookingStatus={(id, s) => setBookingStatus(id, s).catch(() => {})}
            attStudents={lectureStudents}
            onFetchAttStudents={fetchLectureStudents}
            onSaveAttendance={saveLectureAttendance}
          />

          <Card>
            <h2 className="text-lg font-bold">{t("مواعيدي الثابتة")} ({teacherSchedules.length})</h2>
            <p className="text-xs text-muted-foreground">
              {t("المواعيد الأسبوعية الثابتة — كل أسبوع في نفس الموعد وبنفس رابط الاجتماع. اضغط \"بدء محاضرة اليوم\" عند بدء الحصة.")}
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {teacherSchedules.length === 0 ? (
                <div className="col-span-2 rounded-md bg-muted/60 p-6 text-center text-sm text-muted-foreground">
                  {t("لا توجد مواعيد أسبوعية — الإدارة تحددها لك من المواعيد المتاحة.")}
                </div>
              ) : (
                teacherSchedules.map((s) => {
                  const isToday = new Date().getDay() === s.dayOfWeek;
                  const tl = s.todayLecture;
                  return (
                    <div key={s.id} className={`rounded-md border p-4 ${isToday ? "border-brand/40 bg-brand/5" : "border-border bg-background/60"}`}>
                      <div className="flex items-center justify-between gap-2">
                        <b className="text-sm">{s.title}</b>
                        <div className="flex items-center gap-1.5">
                          {isToday && <Badge tone="gold">{t("اليوم")}</Badge>}
                          {tl?.status === "live" && <Badge tone="sage">{t("مباشر الآن")}</Badge>}
                          {tl?.status === "completed" && <Badge tone="muted">{t("انتهت اليوم")}</Badge>}
                          <Badge tone={s.location === "online" ? "brand" : "gold"}>
                            {s.location === "online" ? t("أونلاين") : t("أوفلاين")}
                          </Badge>
                        </div>
                      </div>
                      <small className="mt-1 block text-muted-foreground">
                        {t("كل")} {t(DAY_NAMES[s.dayOfWeek])} · {s.startTime}–{s.endTime}
                        {(s.group?.name ?? s.groupName) && ` · ${t("مجموعة")} ${s.group?.name ?? s.groupName}`}
                      </small>
                      {s.description && (
                        <p className="mt-2 text-xs text-muted-foreground">{s.description}</p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {s.meetingUrl && s.location !== "offline" && (
                          <a
                            href={s.meetingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-brand/90"
                          >
                            {t("دخول الاجتماع ↗")}
                          </a>
                        )}
                        {isToday && (!tl || tl.status === "scheduled") && (
                          <Button
                            variant="primary"
                            onClick={() => startScheduleLecture(s.id).then(() => fetchTeacherAnalytics({})).catch(() => {})}
                          >
                            {t("بدء محاضرة اليوم")}
                          </Button>
                        )}
                        {isToday && tl?.status === "live" && (
                          <Button
                            variant="secondary"
                            onClick={() => updateTeacherLectureStatus(tl.id, "completed").then(() => { fetchTeacherSchedules().catch(() => {}); fetchTeacherAnalytics({}).catch(() => {}); }).catch(() => {})}
                          >
                            {t("إنهاء المحاضرة")}
                          </Button>
                        )}
                        {!isToday && !tl && (
                          <span className="text-xs text-muted-foreground">{t("محاضرة الأسبوع القادمة")} {t(DAY_NAMES[s.dayOfWeek])}</span>
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

      {activeSection === "chat" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <h2 className="text-lg font-bold">{t("محادثات الطلاب")} ({teacherChatThreads.length})</h2>
            <div className="mt-4 space-y-2">
              {teacherChatThreads.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">{t("لا توجد محادثات بعد.")}</div>
              ) : (
                teacherChatThreads.map((th) => (
                  <button
                    key={th.student.id}
                    type="button"
                    onClick={() => openStudentChat(th.student.id)}
                    className={`w-full rounded-md border p-3 text-right transition-colors ${
                      chatStudentId === th.student.id
                        ? "border-brand bg-brand/5"
                        : "border-border bg-background/60 hover:border-brand/40"
                    }`}
                  >
                    <b className="block text-sm">{th.student.fullName}</b>
                    <small className="block truncate text-muted-foreground">
                      {th.lastMessage ? `${th.lastMessage.content}` : t("بدون رسائل")}
                    </small>
                  </button>
                ))
              )}
            </div>
          </Card>

          <Card className="lg:col-span-2">
            {!chatStudentId ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                {t("اختر محادثة من القائمة لعرض الرسائل والرد على الطالب.")}
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
                        {m.fromRole === "STUDENT" ? t("الطالب") : t("أنت")} ·{" "}
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
                    placeholder={t("اكتب ردك للطالب...")}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={chatSending || !chatReply.trim()}>{t("إرسال")}</Button>
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
                <h2 className="text-lg font-bold">{t("الواجبات")}</h2>
                <p className="text-xs text-muted-foreground">{t("واجبات تنشئها لطلابك أو لمجموعة كاملة")}</p>
              </div>
              <Button variant="secondary" className="text-xs" onClick={() => setShowHwForm(!showHwForm)}>
                {showHwForm ? t("إلغاء") : t("+ واجب جديد")}
              </Button>
            </div>

            {showHwForm && (
              <form onSubmit={handleCreateHomework} className="mt-4 space-y-3 rounded-md border border-border bg-muted/40 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>{t("عنوان الواجب")}</Label>
                    <Input value={hwTitle} onChange={(e) => setHwTitle(e.target.value)} required placeholder={t("مثال: ترجمة الفقرة")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("تاريخ التسليم (اختياري)")}</Label>
                    <Input type="date" value={hwDue} onChange={(e) => setHwDue(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("طالب معين (اختياري — بدونه = المجموعة)")}</Label>
                    <select value={hwStudentId} onChange={(e) => setHwStudentId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                      <option value="">{t("— كل المجموعة / طالب محدد —")}</option>
                      {teacherStudents.map((s) => (
                        <option key={s.id} value={s.id}>{s.fullName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("المجموعة (اختياري)")}</Label>
                    <select value={hwGroup} onChange={(e) => setHwGroup(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                      <option value="">{t("— اختر المجموعة —")}</option>
                      {groups.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>{t("الوصف / التعليمات")}</Label>
                    <textarea value={hwDesc} onChange={(e) => setHwDesc(e.target.value)} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder={t("شرح الواجب للطالب")} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>{t("نص عبري (اختياري)")}</Label>
                    <textarea value={hwHebrew} onChange={(e) => setHwHebrew(e.target.value)} rows={3} dir="rtl" className="w-full rounded-md border border-input bg-background px-3 py-2 font-he text-sm" placeholder="פסקה בעברית..." />
                    {hwHebrew && <HebrewTTS text={hwHebrew} label={t("معاينة الصوت")} />}
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>{t("نوع الواجب")}</Label>
                    <select value={hwType} onChange={(e) => setHwType(e.target.value as ExamType)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                      {(Object.keys(EXAM_TYPE_LABELS) as ExamType[]).map((et) => <option key={et} value={et}>{t(EXAM_TYPE_LABELS[et])}</option>)}
                    </select>
                  </div>
                  {hwType === "listening" && (
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>{t("التسجيل الصوتي (صوت المدرس اللي الطالب هيسمعه)")}</Label>
                      <AudioRecorder label={t("سجّل صوت الاستماع")} onRecorded={(blob) => setHwAudioBlob(blob)} />
                    </div>
                  )}
                  {hwType !== "speaking" && (
                    <div className="space-y-2 sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <Label>{t("الأسئلة")} ({hwItems.length})</Label>
                        <Button type="button" variant="secondary" className="min-h-7 px-2.5 py-1 text-xs" onClick={() => setHwItems((p) => [...p, { type: "text", prompt: "", points: 1 }])}>
                          {t("+ إضافة سؤال")}
                        </Button>
                      </div>
                      {hwItems.map((q, qi) => (
                        <div key={qi} className="space-y-2 rounded-md border border-border bg-background/60 p-3">
                          <div className="flex items-center gap-2">
                            <select
                              value={q.type}
                              onChange={(e) => {
                                const qt = e.target.value as QuestionType;
                                setHwItems((p) => p.map((x, i) => i === qi ? { ...x, type: qt, options: qt === "mcq" ? (x.options?.length ? x.options : ["", "", "", ""]) : qt === "truefalse" ? ["صح", "خطأ"] : [], correctIndex: qt === "text" ? undefined : (x.correctIndex ?? 0) } : x));
                              }}
                              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                            >
                              <option value="text">{t("نص حر (يدوي)")}</option>
                              <option value="mcq">{t("اختيار متعدد (تلقائي)")}</option>
                              <option value="truefalse">{t("صح / خطأ (تلقائي)")}</option>
                            </select>
                            <Input type="number" min={1} value={q.points ?? 1} onChange={(e) => setHwItems((p) => p.map((x, i) => i === qi ? { ...x, points: Number(e.target.value) || 1 } : x))} className="h-8 w-20 text-xs" title={t("النقاط")} />
                            <button type="button" onClick={() => setHwItems((p) => p.filter((_, i) => i !== qi))} className="mr-auto rounded-md p-1.5 text-muted-foreground hover:bg-danger/10 hover:text-danger">
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                          <Input value={q.prompt} onChange={(e) => setHwItems((p) => p.map((x, i) => i === qi ? { ...x, prompt: e.target.value } : x))} placeholder={`${t("نص السؤال")} ${qi + 1}`} />
                          {q.type === "mcq" && (
                            <div className="space-y-1.5">
                              {(q.options ?? []).map((opt, oi) => (
                                <div key={oi} className="flex items-center gap-2">
                                  <input type="radio" name={`hwq-${qi}`} checked={q.correctIndex === oi} onChange={() => setHwItems((p) => p.map((x, i) => i === qi ? { ...x, correctIndex: oi } : x))} title={t("الإجابة الصحيحة")} />
                                  <Input value={opt} onChange={(e) => setHwItems((p) => p.map((x, i) => i === qi ? { ...x, options: (x.options ?? []).map((o, j) => j === oi ? e.target.value : o) } : x))} placeholder={`${t("اختيار")} ${oi + 1}`} className="h-8 text-xs" />
                                </div>
                              ))}
                              <small className="text-muted-foreground">{t("علّم على الاختيار الصحيح بجانب كل إجابة")}</small>
                            </div>
                          )}
                          {q.type === "truefalse" && (
                            <div className="flex gap-3 text-sm">
                              {["صح", "خطأ"].map((lbl, oi) => (
                                <label key={oi} className="flex items-center gap-1.5">
                                  <input type="radio" name={`hwq-${qi}`} checked={(q.correctIndex ?? 0) === oi} onChange={() => setHwItems((p) => p.map((x, i) => i === qi ? { ...x, correctIndex: oi } : x))} />
                                  {t(lbl)}
                                </label>
                              ))}
                            </div>
                          )}
                          {q.type === "text" && (
                            <Input value={q.expected ?? ""} onChange={(e) => setHwItems((p) => p.map((x, i) => i === qi ? { ...x, expected: e.target.value } : x))} placeholder={t("الإجابة المتوقعة (اختياري — تظهر لك عند التصحيح)")} className="text-xs" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {hwType === "speaking" && (
                    <p className="text-xs text-muted-foreground sm:col-span-2">{t("الطالب هيسلّم تسجيلاً صوتياً — التصحيح يدوي.")}</p>
                  )}
                </div>
                <Button type="submit" disabled={hwSaving}>{hwSaving ? t("جاري الحفظ...") : t("إنشاء الواجب")}</Button>
              </form>
            )}
          </Card>

          <Card>
            <h2 className="text-lg font-bold">{t("قائمة الواجبات")} ({teacherHomework.length})</h2>
            <div className="mt-4 space-y-3">
              {teacherHomework.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">{t("لا توجد واجبات بعد.")}</div>
              ) : (
                teacherHomework.map((hw) => (
                  <div key={hw.id} className="rounded-md border border-border bg-background/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <b className="text-sm">{hw.title}</b>
                        <small className="block text-muted-foreground">
                          {hw.student ? `${t("للطالب")}: ${hw.student.fullName}` : hw.groupName ? `${t("مجموعة")} ${hw.groupName}` : t("للمجموعة")}
                          {hw.dueDate && ` · ${t("تسليم")}: ${new Date(hw.dueDate).toLocaleDateString("ar-EG")}`}
                        </small>
                      </div>
                      <Badge tone="muted">{hw.submissions?.length ?? 0} {t("تسليم")}</Badge>
                    </div>
                    {hw.description && <p className="mt-2 text-xs text-muted-foreground">{hw.description}</p>}
                    {hw.hebrewText && (
                      <div className="mt-2">
                        <p dir="rtl" className="rounded-md bg-muted/60 p-2 font-he text-xs leading-6">{hw.hebrewText}</p>
                        <HebrewTTS text={hw.hebrewText} label={t("استمع للنص")} />
                      </div>
                    )}
                    <div className="mt-3 space-y-2 border-t border-border pt-3">
                      {(hw.submissions ?? []).length === 0 && !hw.submissionText ? (
                        <p className="py-2 text-center text-xs text-muted-foreground">{t("لا توجد تسليمات من الطلاب بعد.")}</p>
                      ) : (
                        (hw.submissions ?? []).map((sub) => (
                          <div key={sub.id} className="rounded-md border border-border/60 bg-muted/30 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <b className="text-xs">{sub.student?.fullName ?? t("طالب")}</b>
                              <div className="flex items-center gap-2">
                                <Badge tone={sub.status === "graded" ? "sage" : sub.status === "late" ? "danger" : "gold"}>
                                  {sub.status === "graded" ? t("مُصحّح") : sub.status === "late" ? t("متأخر") : t("مُسلَّم")}
                                </Badge>
                                {sub.grade !== null && sub.grade !== undefined && <Badge tone="brand">{sub.grade}%</Badge>}
                              </div>
                            </div>
                            {sub.submissionText && <p className="mt-2 text-xs text-muted-foreground">{sub.submissionText}</p>}
                            {sub.audioUrl && <audio controls src={mediaSrc(sub.audioUrl)} className="mt-2 w-full" />}
                            {sub.recordingUrl && (
                              <div className="mt-2">
                                <small className="text-muted-foreground">{t("تسجيل الطالب الصوتي")}:</small>
                                <audio controls src={mediaSrc(sub.recordingUrl)} className="mt-1 w-full" />
                              </div>
                            )}
                            {(sub.answers?.details ?? []).length > 0 && (
                              <div className="mt-2 space-y-1 rounded-md bg-muted/40 p-2">
                                <small className="font-semibold text-muted-foreground">{t("إجابات الأسئلة")}:</small>
                                {(sub.answers?.details ?? []).map((d) => (
                                  <div key={d.idx} className="flex items-center gap-2 text-xs">
                                    <span className={`grid size-4 place-items-center rounded-full text-[10px] font-bold text-white ${d.isAuto ? (d.correct ? "bg-sage" : "bg-danger") : "bg-gold"}`}>
                                      {d.isAuto ? (d.correct ? "✓" : "✗") : "؟"}
                                    </span>
                                    <span className="font-semibold">{t("س")}{d.idx + 1}:</span>
                                    <span className="text-muted-foreground">{d.studentAnswer || "—"}</span>
                                    {d.isAuto && !d.correct && <span className="text-sage">{t("الصحيحة")}: {d.correctAnswer}</span>}
                                    {!d.isAuto && <span className="text-gold">({t("تصحيح يدوي")}{d.correctAnswer && d.correctAnswer !== "—" ? ` — ${t("متوقع")}: ${d.correctAnswer}` : ""})</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <Input
                                type="number" min={0} max={100} placeholder={t("الدرجة")}
                                value={hwDrafts[sub.id]?.grade ?? (sub.grade?.toString() ?? "")}
                                onChange={(e) => setHwDrafts((prev) => ({ ...prev, [sub.id]: { grade: e.target.value, feedback: prev[sub.id]?.feedback ?? sub.feedback ?? "" } }))}
                                className="h-8 w-24 text-xs"
                              />
                              <Input
                                placeholder={t("ملاحظة للطالب")}
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
                                {t("حفظ التقييم")}
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                      {hw.submissionText && (hw.submissions ?? []).length === 0 && (
                        <div className="rounded-md bg-muted/60 p-2 text-xs">
                          <small className="text-muted-foreground">{t("تسليم قديم")}:</small>
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
          {attErr && <Card className="border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{attErr}</Card>}
          <Card>
            <h3 className="font-bold">{t("حضور المحاضرات")}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{t("اضغط على محاضرة لعرض طلابها — سجّل الحضور وأضف تقرير لكل طالب بعد المحاضرة")}</p>

            {teacherLectures.length === 0 ? (
              <div className="mt-4 rounded-md bg-muted/60 p-6 text-center text-sm text-muted-foreground">
                {t("لا توجد محاضرات مسجلة لك حالياً.")}
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {teacherLectures.map((l) => {
                  const selected = attLectureId === l.id;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => {
                        if (selected) {
                          setAttLectureId("");
                          setLectureAttDraft({});
                          setLectureReportDraft({});
                          setReportOpenFor(null);
                          return;
                        }
                        setAttLectureId(l.id);
                        setLectureAttDraft({});
                        setLectureReportDraft({});
                        setReportOpenFor(null);
                        setAttErr("");
                        fetchLectureStudents(l.id).catch(() => setAttErr(t("فشل تحميل طلاب المحاضرة")));
                      }}
                      className={`rounded-xl border p-3.5 text-right transition ${
                        selected ? "border-brand bg-brand/5 ring-1 ring-brand" : "border-border bg-background/60 hover:border-brand/40 hover:bg-brand/5"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <b className="min-w-0 truncate text-sm">{l.title}</b>
                        <Badge tone={l.status === "live" ? "sage" : l.status === "completed" ? "muted" : "brand"}>
                          {l.status === "live" ? t("مباشر") : l.status === "completed" ? t("مكتملة") : t("مجدولة")}
                        </Badge>
                      </div>
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarDays className="size-3.5 shrink-0" />
                        {new Date(l.startsAt).toLocaleString("ar-EG", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                      </p>
                      {l.groupName && <Badge tone="muted" className="mt-2">{l.groupName}</Badge>}
                    </button>
                  );
                })}
              </div>
            )}

            {attLectureId && (
              <div className="mt-5 border-t border-border pt-4">
                {lectureStudents.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">{t("لا يوجد طلاب لهذه المحاضرة.")}</div>
                ) : (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {lectureStudents.map((s) => {
                        const cur = lectureAttDraft[s.id] ?? s.status ?? null;
                        const reportVal = lectureReportDraft[s.id] ?? s.report ?? "";
                        const hasReport = !!(s.report || lectureReportDraft[s.id]);
                        return (
                          <div key={s.id} className="flex flex-col rounded-xl border border-border bg-background/60 p-3.5">
                            <div className="flex items-center justify-between gap-2">
                              <b className="min-w-0 truncate text-sm">{s.fullName}</b>
                              {hasReport && <Badge tone="gold">{t("تقرير")}</Badge>}
                            </div>
                            <div className="mt-2.5 flex gap-1.5">
                              {(["present", "absent"] as const).map((st) => (
                                <button
                                  key={st}
                                  onClick={() => setLectureAttDraft((d) => ({ ...d, [s.id]: st }))}
                                  className={`flex-1 rounded-md px-2 py-1.5 text-xs font-bold transition ${
                                    cur === st
                                      ? st === "present" ? "bg-sage text-white" : "bg-danger text-white"
                                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                                  }`}
                                >
                                  {st === "present" ? t("حاضر") : t("غائب")}
                                </button>
                              ))}
                            </div>
                            <button
                              onClick={() => setReportOpenFor((o) => (o === s.id ? null : s.id))}
                              className="mt-2 self-start text-xs font-semibold text-brand hover:underline"
                            >
                              {hasReport ? t("تعديل التقرير") : t("+ إضافة تقرير")}
                            </button>
                            {(reportOpenFor === s.id || reportVal) && (
                              <textarea
                                value={reportVal}
                                onChange={(e) => setLectureReportDraft((d) => ({ ...d, [s.id]: e.target.value }))}
                                placeholder={t("تقرير عن أداء الطالب في المحاضرة...")}
                                rows={3}
                                className="mt-2 w-full rounded-md border border-input bg-background px-2.5 py-2 text-xs"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <Button
                      variant="primary"
                      className="mt-4"
                      disabled={attLectureSaving || (Object.keys(lectureAttDraft).length === 0 && Object.keys(lectureReportDraft).length === 0)}
                      onClick={async () => {
                        setAttLectureSaving(true);
                        setAttErr("");
                        try {
                          const records = lectureStudents
                            .filter((s) => lectureAttDraft[s.id] !== undefined || lectureReportDraft[s.id] !== undefined)
                            .map((s) => ({
                              studentId: s.id,
                              status: (lectureAttDraft[s.id] ?? s.status ?? "present") as "present" | "absent",
                              ...(lectureReportDraft[s.id] !== undefined ? { report: lectureReportDraft[s.id] } : {}),
                            }));
                          await saveLectureAttendance(attLectureId, records);
                          await fetchLectureStudents(attLectureId);
                          setLectureAttDraft({});
                          setLectureReportDraft({});
                          setReportOpenFor(null);
                        } catch {
                          setAttErr(t("فشل حفظ الحضور — حاول مرة أخرى"));
                        } finally {
                          setAttLectureSaving(false);
                        }
                      }}
                    >
                      {attLectureSaving ? t("جاري الحفظ...") : t("حفظ الحضور والتقارير")}
                    </Button>
                  </>
                )}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="font-bold">{t("تسجيل حضور الموعد الأسبوعي")}</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t("الموعد / المحاضرة")}</Label>
                <select value={attScheduleId} onChange={(e) => setAttScheduleId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">{t("— اختر الموعد —")}</option>
                  {teacherSchedules.map((s) => (
                    <option key={s.id} value={s.id}>{t(DAY_NAMES[s.dayOfWeek])} {s.startTime} — {s.title}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("التاريخ")}</Label>
                <Input type="date" value={attDate} onChange={(e) => setAttDate(e.target.value)} />
              </div>
            </div>

            {attScheduleId && (
              <div className="mt-4 space-y-2">
                {teacherStudents.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">{t("لا يوجد طلاب مربوطون بك.")}</div>
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
                                recordTeacherAttendance({ scheduleId: attScheduleId, studentId: s.id, status: st, date: attDate }).catch(() => setAttErr(t("فشل تسجيل الحضور")))
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
                              {st === "present" ? t("حاضر") : st === "absent" ? t("غائب") : st === "late" ? t("متأخر") : t("معذور")}
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
            <h2 className="text-lg font-bold">{t("سجل الحضور")} ({teacherAttendance.length})</h2>
            <div className="mt-4 space-y-2">
              {teacherAttendance.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">{t("لا توجد سجلات حضور بعد.")}</div>
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
                      {a.status === "present" ? t("حاضر") : a.status === "absent" ? t("غائب") : a.status === "late" ? t("متأخر") : t("معذور")}
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
            <h3 className="font-bold">{t("تقرير طالب")}</h3>
            <div className="mt-3 flex items-center gap-3">
              <select
                value={reportStudentId}
                onChange={(e) => { if (e.target.value) handleLoadReport(e.target.value); }}
                className="flex h-10 max-w-sm flex-1 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">{t("— اختر الطالب —")}</option>
                {teacherStudents.map((s) => (
                  <option key={s.id} value={s.id}>{s.fullName}</option>
                ))}
              </select>
            </div>
          </Card>

          {reportLoading && (
            <Card><div className="py-8 text-center text-sm text-muted-foreground">{t("جاري تحميل التقرير...")}</div></Card>
          )}

          {report && !reportLoading && (
            <>
              <div className="grid gap-3 sm:grid-cols-4">
                <Card className="p-3 text-center">
                  <small className="text-muted-foreground">{t("متوسط الدرجات")}</small>
                  <b className="mt-1 block font-lat text-2xl text-brand">{report.avgScore !== null ? `${report.avgScore}%` : "—"}</b>
                </Card>
                <Card className="p-3 text-center">
                  <small className="text-muted-foreground">{t("امتحانات محلولة")}</small>
                  <b className="mt-1 block font-lat text-2xl">{report.examsTaken}</b>
                </Card>
                <Card className="p-3 text-center">
                  <small className="text-muted-foreground">{t("نسبة الحضور")}</small>
                  <b className="mt-1 block font-lat text-2xl text-sage">{report.attendanceRate !== null ? `${report.attendanceRate}%` : "—"}</b>
                </Card>
                <Card className="p-3 text-center">
                  <small className="text-muted-foreground">{t("حالة الطالب")}</small>
                  <b className="mt-1 block text-sm">{t(STUDENT_STATUSES[report.student.studentStatus] ?? report.student.studentStatus)}</b>
                </Card>
              </div>

              <Card>
                <h3 className="font-bold">{t("تقييم المهارات الأربع")}</h3>
                <p className="text-xs text-muted-foreground">{t("استماع · تحدث · قراءة · كتابة — مع ملاحظات على النطق والقواعد والطلاقة")}</p>
                <div className="mt-4 space-y-3">
                  {Object.entries(SKILL_LABELS).map(([key, label]) => (
                    <div key={key} className="rounded-md border border-border bg-background/60 p-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <b className="w-16 text-sm">{t(label)}</b>
                        <Input
                          type="number" min={0} max={100} placeholder="0–100"
                          value={skillDrafts[key]?.score ?? ""}
                          onChange={(e) => setSkillDrafts((prev) => ({ ...prev, [key]: { score: e.target.value, notes: prev[key]?.notes ?? "" } }))}
                          className="h-8 w-24 text-xs"
                        />
                        <Input
                          placeholder={t("ملاحظات (نطق، قواعد، طلاقة...)")}
                          value={skillDrafts[key]?.notes ?? ""}
                          onChange={(e) => setSkillDrafts((prev) => ({ ...prev, [key]: { score: prev[key]?.score ?? "", notes: e.target.value } }))}
                          className="h-8 min-w-40 flex-1 text-xs"
                        />
                        <Button
                          variant="secondary" className="min-h-8 px-3 py-1 text-xs"
                          disabled={skillSaving === key}
                          onClick={() => handleSaveSkill(key)}
                        >
                          {skillSaving === key ? t("جاري الحفظ...") : t("حفظ")}
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
                  <h3 className="font-bold text-danger">{t("نقاط تحتاج تحسين")}</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {report.weakAreas.map((w) => (
                      <Badge key={w.skill} tone="danger">{t(SKILL_LABELS[w.skill] ?? w.skill)}: {w.score}%</Badge>
                    ))}
                  </div>
                </Card>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <h3 className="font-bold">{t("آخر نتائج الامتحانات")}</h3>
                  <div className="mt-3 space-y-2">
                    {report.recentResults.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t("لا توجد نتائج.")}</p>
                    ) : (
                      report.recentResults.map((r, i) => (
                        <div key={i} className="flex items-center justify-between rounded-md bg-muted/60 p-2.5 text-sm">
                          <span>{r.exam.title} <small className="text-muted-foreground">({t(EXAM_TYPE_LABELS[r.exam.type] ?? r.exam.type)})</small></span>
                          <Badge tone={r.score !== null && r.score >= 50 ? "sage" : "danger"}>{r.score !== null ? `${r.score}%` : t("لم تُقيّم")}</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
                <Card>
                  <h3 className="font-bold">{t("واجبات الطالب")}</h3>
                  <div className="mt-3 space-y-2">
                    {report.homework.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t("لا توجد واجبات.")}</p>
                    ) : (
                      report.homework.map((h, i) => (
                        <div key={i} className="flex items-center justify-between rounded-md bg-muted/60 p-2.5 text-sm">
                          <span>{h.title}</span>
                          <div className="flex items-center gap-2">
                            <Badge tone={h.status === "graded" ? "sage" : h.status === "submitted" ? "gold" : "muted"}>
                              {h.status === "graded" ? t("مُصحّح") : h.status === "submitted" ? t("مُسلَّم") : h.status === "late" ? t("متأخر") : t("مُكلَّف")}
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
            <h3 className="font-bold">{t("إضافة موعد متاح للحجز")}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("اختر تاريخ اليوم وأضف مواعيدك فيه — تقدر تضيف أكثر من معاد في نفس اليوم (مثلاً 6–7 و10–11). المواعيد دي بتظهر للإدارة عند حجز حصصك.")}
            </p>
            <form onSubmit={handleAddAvailability} className="mt-4 space-y-3">
              <div className="flex gap-1.5">
                {([["date", t("تاريخ محدد")], ["weekly", t("أسبوعي متكرر")]] as const).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAvMode(v)}
                    className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                      avMode === v ? "bg-brand text-white" : "bg-muted/60 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {avMode === "date" ? (
                  <div className="space-y-1.5">
                    <Label>{t("التاريخ")}</Label>
                    <Input type="date" value={avDate} onChange={(e) => setAvDate(e.target.value)} required />
                    {avDate && (
                      <Badge tone="brand" className="mt-1">
                        {t(DAY_NAMES[new Date(`${avDate}T00:00:00`).getDay()])}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label>{t("اليوم")}</Label>
                    <select value={avDay ?? 0} onChange={(e) => setAvDay(Number(e.target.value))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                      {DAY_NAMES.map((d, i) => (
                        <option key={i} value={i}>{t(d)}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>{t("من")}</Label>
                  <Input type="time" value={avStart} onChange={(e) => setAvStart(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("إلى")}</Label>
                  <Input type="time" value={avEnd} onChange={(e) => setAvEnd(e.target.value)} required />
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full" disabled={avSaving || (avMode === "date" && !avDate)}>
                    {avSaving ? t("جاري...") : t("+ إضافة الموعد")}
                  </Button>
                </div>
              </div>

              {avMsg && <p className="rounded-md bg-sage/15 p-2.5 text-xs font-semibold text-sage">{avMsg}</p>}

              {(() => {
                const daySlots = teacherAvailability.filter((a) =>
                  avMode === "date"
                    ? a.specificDate && String(a.specificDate).slice(0, 10) === avDate
                    : !a.specificDate && a.dayOfWeek === avDay,
                );
                if (daySlots.length === 0) return null;
                return (
                  <div className="flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-3">
                    <small className="text-xs font-semibold text-muted-foreground">{t("مواعيدك في هذا اليوم:")}</small>
                    {daySlots
                      .slice()
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map((a) => (
                        <Badge key={a.id} tone={a.isActive ? "sage" : "muted"}>
                          {a.startTime} — {a.endTime}{!a.isActive ? ` (${t("معطّل")})` : ""}
                        </Badge>
                      ))}
                  </div>
                );
              })()}
            </form>
          </Card>

          {/* Availability list */}
          <Card>
            <h3 className="font-bold">{t("مواعيدي المتاحة")}</h3>
            <div className="mt-3 space-y-2">
              {teacherAvailability.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("لا توجد مواعيد متاحة — أضف موعداً ليحجز الطلاب.")}</p>
              ) : (
                teacherAvailability.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border border-[#eef2f9] bg-white px-4 py-3">
                    <div className="text-sm">
                      {a.specificDate ? (
                        <span>📅 {new Date(a.specificDate).toLocaleDateString("ar-EG")} </span>
                      ) : (
                        <span>🔁 {t(DAY_NAMES[a.dayOfWeek ?? 0])} </span>
                      )}
                      <span className="text-muted-foreground"> {a.startTime} — {a.endTime}</span>
                      {!a.isActive && <Badge tone="muted" className="mr-2">{t("معطّل")}</Badge>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => toggleTeacherAvailability(a.id)}>
                        {a.isActive ? t("تعطيل") : t("تفعيل")}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { if (confirm(t("حذف هذا الموعد؟"))) deleteTeacherAvailability(a.id); }}>
                        {t("حذف")}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

        </div>
      )}

      {activeSection === "analytics" && (
        <TeacherAnalyticsSection
          data={teacherAnalytics}
          students={teacherStudents}
          from={anFrom}
          to={anTo}
          studentId={anStudentId}
          onFromChange={setAnFrom}
          onToChange={setAnTo}
          onStudentChange={setAnStudentId}
        />
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
  const { t } = useI18n();
  const [drafts, setDrafts] = useState<Record<string, { score: string; feedback: string }>>({});

  return (
    <div className="mt-4 space-y-3 border-t border-border pt-4">
      {exam.questions.audioUrl && (
        <div className="rounded-md bg-muted/60 p-3">
          <small className="mb-1 block text-muted-foreground">{t("تسجيل الأدمن الصوتي للامتحان")}</small>
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
          {t("لم يسلّم أي طالب هذا الامتحان بعد.")}
        </div>
      ) : (
        examResults.map((r) => (
          <div key={r.id} className="rounded-md border border-border bg-background p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <b className="text-sm">{r.student?.fullName ?? t("طالب")}</b>
              <span className="text-xs text-muted-foreground">
                {new Date(r.submittedAt).toLocaleString("ar-EG")}
              </span>
            </div>

            {r.recordingUrl && (
              <div className="mt-2">
                <small className="mb-1 block text-muted-foreground">{t("تسجيل الطالب الصوتي")}</small>
                <audio controls src={mediaSrc(r.recordingUrl)} className="w-full" />
              </div>
            )}

            {r.answers && Object.keys(r.answers).length > 0 && (
              <div className="mt-2 space-y-1.5">
                {Object.entries(r.answers).map(([k, v]) => (
                  <div key={k} className="rounded-sm bg-muted/60 px-3 py-1.5 text-xs">
                    <b className="text-muted-foreground">{t("إجابة")} {Number(k) + 1}:</b> {v}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <Input
                type="number"
                min={0}
                max={100}
                placeholder={t("الدرجة %")}
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
                placeholder={t("ملاحظات للطالب")}
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
                {t("حفظ التقييم")}
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
  | "schedules"
  | "analytics"
  | "guide";

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
    updateUserStatus,
    resetUserPassword,
    updateAdminUser,
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
    adminSchedules,
    fetchAdminSchedules,
    adminLectures,
    fetchAdminLectures,
    updateAdminLecture,
    fetchAdminLectureAttendance,
    fetchAdminTeacherProfile,
    fetchAdminStudentProfile,
    resetStudentBoundIp,
    deleteAdminSubscription,
    restoreSubscriptionSessions,
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
    setFreeLectureStudents,
    deleteFreeLecture,
    addFreeLectureFile,
    removeFreeLectureFile,
    adminAnalytics,
    fetchAdminAnalytics,
    opsStudents,
    fetchOpsStudents,
    opsPackages,
    fetchOpsPackages,
    activateOpsSubscription,
    updateStudentStatus,
  } = usePlatformStore();
  const { t } = useI18n();

  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const PAGE_SIZE = 5;
  const [matSearch, setMatSearch] = useState("");
  const [matPage, setMatPage] = useState(1);
  const [examSearch, setExamSearch] = useState("");
  const [examPage, setExamPage] = useState(1);
  const [bookingFilter, setBookingFilter] = useState<string>("");
  const [anTeacherId, setAnTeacherId] = useState("");
  const [anFrom, setAnFrom] = useState("");
  const [anTo, setAnTo] = useState("");

  useEffect(() => {
    if (activeSection === "bookings") fetchAdminPaymentRequests(bookingFilter).catch(() => {});
    if (activeSection === "students") {
      fetchOpsStudents().catch(() => {});
      fetchOpsPackages().catch(() => {});
      fetchAdminGroups().catch(() => {});
    }
    if (activeSection === "placement-results") fetchPlacementResults().catch(() => {});
    if (activeSection === "schedules") fetchAdminSchedules().catch(() => {});
    if (activeSection === "sessions") {
      fetchAdminBookings().catch(() => {});
      fetchAdminBookingsReport().catch(() => {});
      fetchCallsStudents().catch(() => {});
      fetchAdminLectures({ status: "all" }).catch(() => {});
      fetchFreeLectures().catch(() => {});
    }
    if (activeSection === "groups") {
      fetchAdminGroups().catch(() => {});
    }
    if (activeSection === "free-lectures") {
      fetchFreeStudents().catch(() => {});
      fetchFreeLectures().catch(() => {});
      fetchAdminGroups().catch(() => {});
      fetchOpsStudents().catch(() => {});
    }
    if (activeSection === "analytics") {
      fetchAdminAnalytics({
        teacherId: anTeacherId || undefined,
        from: anFrom || undefined,
        to: anTo || undefined,
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, bookingFilter, anTeacherId, anFrom, anTo]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [newUserRole, setNewUserRole] = useState<Exclude<UserRole, "STUDENT">>("TEACHER");
  const [profileView, setProfileView] = useState<{ type: "teacher" | "student"; id: string } | null>(null);
  const [editingUser, setEditingUser] = useState<PlatformUser | null>(null);
  const [specialty, setSpecialty] = useState("");
  const [userSuccess, setUserSuccess] = useState("");
  const [userError, setUserError] = useState("");

  const teachers = users.filter((u) => u.role === "TEACHER");
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDesc, setCourseDesc] = useState("");
  const [courseLevel, setCourseLevel] = useState<PlatformLevel>("A1");
  const [courseType, setCourseType] = useState<MaterialType>("VIDEO");
  const [courseStatus, setCourseStatus] = useState<PublishStatus>("DRAFT");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extraFiles, setExtraFiles] = useState<File[]>([]);
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
  const [qLevel, setQLevel] = useState<PlatformLevel>("A1");
  const [qType, setQType] = useState<PlacementQuestionType>("mcq");
  const [qPromptAr, setQPromptAr] = useState("");
  const [qHebrewText, setQHebrewText] = useState("");
  const [qParagraph, setQParagraph] = useState("");
  const [qAudioFile, setQAudioFile] = useState<File | null>(null);
  const [qUploading, setQUploading] = useState(false);
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
    { name: t("طلاب"), value: counts.students, color: "var(--brand)" },
    { name: t("مدرسون"), value: counts.teachers, color: "var(--sage)" },
    { name: t("مبيعات"), value: counts.sales, color: "var(--gold)" },
    { name: t("دعم"), value: counts.support, color: "var(--brand2)" },
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
      setUserSuccess(`${t("تم إضافة حساب")} (${t(ROLE_LABELS[newUserRole])}) ${t("في قاعدة البيانات بنجاح.")}`);
    } catch (err) {
      setUserError(err instanceof Error ? err.message : t("فشل إضافة المستخدم"));
    }
  }

  async function handleUploadCourse(e: React.FormEvent) {
    e.preventDefault();
    setCourseError("");
    setCourseSuccess("");
    if (!activeTeacherId) {
      setCourseError(t("يرجى إضافة مدرس أولاً قبل رفع الكورسات"));
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

      // Upload any extra files + attachments (video + document + audio combos)
      const inferMatType = (f: File): MaterialType => {
        if (f.type.startsWith("video/") || /\.(mp4|mov|webm|mkv)$/i.test(f.name)) return "VIDEO";
        if (f.type.startsWith("audio/") || /\.(mp3|wav|m4a|ogg)$/i.test(f.name)) return "AUDIO";
        return "DOCUMENT";
      };
      const uploadedExtras: MaterialAttachment[] = [];
      for (const ef of extraFiles) {
        const up = await uploadFile(ef, "courses");
        uploadedExtras.push({
          url: up.url,
          type: inferMatType(ef),
          name: ef.name,
          size: `${(ef.size / (1024 * 1024)).toFixed(1)} MB`,
        });
      }
      const finalAttachments: MaterialAttachment[] = [...extraAttachments, ...uploadedExtras];

      await addCourseMaterial({
        title: courseTitle,
        description: courseDesc || t("مادة تدريبية مرفوعة من الإدارة"),
        level: courseLevel,
        type: selectedFile ? inferMatType(selectedFile) : courseType,
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
      setExtraFiles([]);
      setExtraAttachments([]);
      setCourseSuccess(
        courseStatus === "PUBLISHED"
          ? t("تم رفع الكورس ونشره — يظهر الآن للمدرس وللطلاب المربوطين به.")
          : t("تم رفع الكورس كمسودة (Draft) — لن يظهر للطلاب حتى تنشره."),
      );
    } catch (err) {
      setCourseError(err instanceof Error ? err.message : t("فشل رفع الكورس"));
    } finally {
      setCourseUploading(false);
    }
  }

  async function handleCreateExam(e: React.FormEvent) {
    e.preventDefault();
    setExamError("");
    setExamSuccess("");
    if (!activeExamTeacherId) {
      setExamError(t("يرجى إضافة مدرس أولاً قبل إنشاء الامتحانات"));
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
          ? t("تم إنشاء الامتحان ونشره — يظهر الآن للمدرس والطلاب المربوطين به.")
          : t("تم حفظ الامتحان كمسودة — فعّل زر النشر ليظهر للمدرس والطلاب."),
      );
    } catch (err) {
      setExamError(err instanceof Error ? err.message : t("فشل إنشاء الامتحان"));
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
      setAssignMsg(t("تم ربط الطالب بالمدرس — سيظهر له كل امتحانات وكورسات هذا المدرس."));
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : t("فشل ربط الطالب"));
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
        setQuestionError(t("أسئلة الاختيار تحتاج خيارين على الأقل"));
        return;
      }
      correctOptionIndex = Math.min(correctIdx, options.length - 1);
    } else if (qType === "truefalse") {
      options = ["صح", "خطأ"];
      correctOptionIndex = qTrueFalse ? 0 : 1;
    } else if (qType === "text") {
      expectedAnswer = qExpected.trim();
      if (!expectedAnswer) {
        setQuestionError(t("سؤال النص يحتاج الإجابة المتوقعة"));
        return;
      }
    }

    setQUploading(true);
    try {
      let audioUrl: string | undefined;
      if (qAudioFile) {
        const up = await uploadFile(qAudioFile, "audio");
        audioUrl = up.url;
      }
      await addPlacementQuestion({
        section: qSection,
        promptAr: qPromptAr,
        hebrewText: qHebrewText,
        questionType: qType,
        options,
        correctOptionIndex,
        ...(expectedAnswer ? { expectedAnswer } : {}),
        ...(qParagraph.trim() ? { paragraph: qParagraph.trim() } : {}),
        ...(audioUrl ? { audioUrl } : {}),
        levelTag: qLevel,
      });

      setQPromptAr("");
      setQHebrewText("");
      setQParagraph("");
      setQAudioFile(null);
      setOpt1("");
      setOpt2("");
      setOpt3("");
      setOpt4("");
      setCorrectIdx(0);
      setQTrueFalse(true);
      setQExpected("");
      setQuestionSuccess(t("تم نشر السؤال فوراً في اختبار تحديد المستوى بالصفحة الرئيسية."));
    } catch (err) {
      setQuestionError(err instanceof Error ? err.message : t("فشل حفظ السؤال"));
    } finally {
      setQUploading(false);
    }
  }

  function renderUsersTable(list: PlatformUser[], emptyText: string) {
    if (loadingData) {
      return <div className="py-12 text-center text-sm text-muted-foreground">{t("جاري التحميل...")}</div>;
    }
    if (list.length === 0) {
      return <div className="py-12 text-center text-sm text-muted-foreground">{emptyText}</div>;
    }
    return (
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-right text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr>
              <th className="border-b border-border px-3 py-3 font-medium">{t("الاسم")}</th>
              <th className="border-b border-border px-3 py-3 font-medium">{t("البريد الإلكتروني")}</th>
              <th className="border-b border-border px-3 py-3 font-medium">{t("رقم الهاتف")}</th>
              <th className="border-b border-border px-3 py-3 font-medium">{t("الدور")}</th>
              <th className="border-b border-border px-3 py-3 font-medium">{t("التفاصيل / المستوى")}</th>
              <th className="border-b border-border px-3 py-3 font-medium">{t("إجراء")}</th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id} className="border-b border-border/60">
                <td className="px-3 py-3.5 font-semibold">
                  <div className="flex items-center gap-2">
                    {u.avatarUrl ? (
                      <img src={mediaSrc(u.avatarUrl)} alt="" className="size-8 rounded-full object-cover" />
                    ) : (
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand/10 text-xs font-bold text-brand">{u.fullName[0]}</span>
                    )}
                    {u.fullName}
                  </div>
                </td>
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
                    {t(ROLE_LABELS[u.role])}
                  </Badge>
                </td>
                <td className="px-3 py-3.5 text-xs text-muted-foreground">
                  {u.role === "STUDENT" ? (
                    `${t("المستوى")}: ${u.level ?? t("غير محدد")}`
                  ) : (
                    <>
                      {u.specialty ?? "—"}
                      {u.role === "TEACHER" && u.bio && (
                        <p className="mt-0.5 max-w-[260px] truncate text-[11px]" title={u.bio}>{u.bio}</p>
                      )}
                    </>
                  )}
                </td>
                <td className="px-3 py-3.5">
                  <div className="flex items-center gap-1">
                    {!u.isActive && <Badge tone="muted">{t("معطّل")}</Badge>}
                    {(u.role === "TEACHER" || u.role === "STUDENT") && (
                      <button
                        onClick={() => setProfileView({ type: u.role === "TEACHER" ? "teacher" : "student", id: u.id })}
                        className="rounded-md px-2 py-1.5 text-[11px] font-bold text-muted-foreground hover:bg-brand/10 hover:text-brand"
                        title={t("عرض الملف الكامل")}
                      >
                        {t("الملف")}
                      </button>
                    )}
                    {u.role !== "ADMIN" && (
                      <>
                        <button
                          onClick={async () => {
                            try {
                              await updateUserStatus(u.id, !u.isActive);
                            } catch (err) {
                              alert(err instanceof Error ? err.message : t("فشل تغيير حالة المستخدم"));
                            }
                          }}
                          className={`rounded-md px-2 py-1.5 text-[11px] font-bold ${
                            u.isActive
                              ? "text-muted-foreground hover:bg-gold/10 hover:text-gold"
                              : "text-muted-foreground hover:bg-sage/10 hover:text-sage"
                          }`}
                          title={u.isActive ? t("تعطيل الحساب") : t("تفعيل الحساب")}
                        >
                          {u.isActive ? t("تعطيل") : t("تفعيل")}
                        </button>
                        <button
                          onClick={() => setEditingUser(u)}
                          className="rounded-md px-2 py-1.5 text-[11px] font-bold text-muted-foreground hover:bg-brand/10 hover:text-brand"
                          title={t("تعديل بيانات المستخدم")}
                        >
                          {t("تعديل")}
                        </button>
                        <button
                          onClick={async () => {
                            const password = prompt(`${t("كلمة مرور جديدة لـ")} "${u.fullName}" — ${t("6 أحرف على الأقل")}:`);
                            if (password === null) return;
                            try {
                              await resetUserPassword(u.id, password);
                              alert(t("تم تغيير كلمة المرور بنجاح — سيتم تسجيل خروج المستخدم من كل الأجهزة"));
                            } catch (err) {
                              alert(err instanceof Error ? err.message : t("فشل تغيير كلمة المرور"));
                            }
                          }}
                          className="rounded-md px-2 py-1.5 text-[11px] font-bold text-muted-foreground hover:bg-brand/10 hover:text-brand"
                          title={t("تغيير كلمة المرور")}
                        >
                          {t("باسورد")}
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm(`${t("حذف المستخدم")} "${u.fullName}"؟ ${t("سيتم نقل بياناته (محاضرات، مواعيد، اشتراكات) إليك.")}`)) return;
                            try {
                              await deleteUser(u.id);
                            } catch (err) {
                              alert(err instanceof Error ? err.message : t("فشل حذف المستخدم"));
                            }
                          }}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-danger/10 hover:text-danger"
                          title={t("حذف المستخدم")}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const courseFormCard = (
  <Card>
  <div className="flex items-center gap-2">
    <span className="grid size-9 place-items-center rounded-md bg-brand/10 text-brand">
      <Upload className="size-4" />
    </span>
    <div>
      <h2 className="font-bold">{t("رفع كورس / فيديو / ملف لمدرس")}</h2>
      <small className="text-muted-foreground">
        {t("اختر المدرس الذي ستصل إليه هذه الماتيريال في لوحته")}
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
      <Label>{t("اختر المدرس المستلم (تخصيص الماتيريال)")}</Label>
      <select
        value={activeTeacherId}
        onChange={(e) => setSelectedTeacherId(e.target.value)}
        required
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        {teachers.length === 0 ? (
          <option value="">{t("لا يوجد مدرسون — أضف مدرساً أولاً")}</option>
        ) : (
          teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.fullName} ({teacher.specialty ?? t("مدرس")})
            </option>
          ))
        )}
      </select>
    </div>

    <div className="space-y-1.5">
      <Label>{t("عنوان الكورس / المحاضرة")}</Label>
      <Input
        value={courseTitle}
        onChange={(e) => setCourseTitle(e.target.value)}
        required
        placeholder={t("عنوان الكورس أو المحاضرة")}
      />
    </div>

    <div className="grid grid-cols-2 gap-2">
      <div className="space-y-1.5">
        <Label>{t("نوع الملف")}</Label>
        <select
          value={courseType}
          onChange={(e) => setCourseType(e.target.value as MaterialType)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="VIDEO">{t("فيديو (Video)")}</option>
          <option value="DOCUMENT">{t("ملف / كتاب (PDF)")}</option>
          <option value="AUDIO">{t("ملف صوتي (Audio)")}</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <Label>{t("المستوى")}</Label>
        <select
          value={courseLevel}
          onChange={(e) => setCourseLevel(e.target.value as PlatformLevel)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {PLATFORM_LEVELS.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>
    </div>

    <div className="space-y-1.5">
      <Label>{t("وصف مختصر للمدرس")}</Label>
      <textarea
        value={courseDesc}
        onChange={(e) => setCourseDesc(e.target.value)}
        className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
        placeholder={t("ملاحظات حول طريقة شرح هذا الدرس...")}
      />
    </div>

    <div className="space-y-1.5">
      <Label>{t("اختيار الملف الأساسي (فيديو / مستند / صوت)")}</Label>
      <Dropzone
        file={selectedFile}
        onFile={setSelectedFile}
        accept="video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx"
        hint="MP4, PDF, MP3, DOC, PPT"
      />
    </div>

    <div className="space-y-2 rounded-lg border border-dashed border-border bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Label>{t("ملفات إضافية مع نفس الماتيريال (اختياري)")}</Label>
          <p className="text-[11px] text-muted-foreground">{t("يمكنك إرفاق فيديو + PDF + صوت أو عدة ملفات معاً في درس واحد")}</p>
        </div>
        <label className="cursor-pointer rounded-md bg-brand/10 px-3 py-1.5 text-xs font-bold text-brand hover:bg-brand/20">
          {t("+ إضافة ملفات")}
          <input
            type="file"
            multiple
            accept="video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx"
            className="hidden"
            onChange={(e) => {
              const list = Array.from(e.target.files ?? []);
              if (list.length > 0) setExtraFiles((prev) => [...prev, ...list]);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {extraFiles.length > 0 && (
        <div className="space-y-1 pt-1">
          {extraFiles.map((f, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs">
              <span className="truncate font-medium">{f.name} <small className="font-lat text-muted-foreground">({(f.size / (1024 * 1024)).toFixed(1)} MB)</small></span>
              <button
                type="button"
                onClick={() => setExtraFiles((prev) => prev.filter((_, i) => i !== idx))}
                className="text-danger hover:underline"
              >
                {t("إزالة")}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>

    <div className="space-y-1.5">
      <Label>{t("حالة النشر")}</Label>
      <select
        value={courseStatus}
        onChange={(e) => setCourseStatus(e.target.value as PublishStatus)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        <option value="DRAFT">{t("مسودة (Draft) — لا تظهر للطلاب")}</option>
        <option value="PUBLISHED">{t("نشر (Publish) — تظهر للطلاب فوراً")}</option>
      </select>
    </div>

    <Button
      type="submit"
      className="w-full"
      disabled={teachers.length === 0 || courseUploading}
    >
      <Upload className="size-4" />
      {courseUploading
        ? t("جاري رفع الملف...")
        : courseStatus === "PUBLISHED"
          ? t("رفع ونشر للمدرس والطلاب")
          : t("رفع كمسودة")}
    </Button>
  </form>
  </Card>
  );

  const examFormCard = (
    <Card>
      <div className="flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-md bg-brand/10 text-brand">
          <FileCheck className="size-4" />
        </span>
        <div>
          <h2 className="font-bold">{t("إنشاء امتحان جديد")}</h2>
          <small className="text-muted-foreground">
            {t("يظهر للمدرس المحدد وللطلاب المربوطين به عند النشر")}
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
          <Label>{t("عنوان الامتحان")}</Label>
          <Input
            value={examTitle}
            onChange={(e) => setExamTitle(e.target.value)}
            required
            placeholder={t("مثال: امتحان ترجمة — الوحدة 3")}
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t("وصف مختصر (يظهر للطالب)")}</Label>
          <Input
            value={examDesc}
            onChange={(e) => setExamDesc(e.target.value)}
            placeholder={t("تعليمات أو وصف الامتحان")}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label>{t("نوع الامتحان")}</Label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value as ExamType)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="translation">{t("ترجمة (نص ↔ نص)")}</option>
              <option value="reading">{t("قراءة وفهم")}</option>
              <option value="speaking">{t("فقرة مكتوبة — الطالب يسجل صوته")}</option>
              <option value="listening">{t("استماع — صوت الأدمن + كتابة")}</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("المدرس المستلم")}</Label>
            <select
              value={activeExamTeacherId}
              onChange={(e) => setExamTeacherId(e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {teachers.length === 0 ? (
                <option value="">{t("لا يوجد مدرسون — أضف مدرساً أولاً")}</option>
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
              {t("أسئلة نص حر سريعة — كل سطر: النص العبري | الإجابة المتوقعة (اختياري)")}
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
            <Label>{t("أسئلة منظمة (اختياري — تظهر للطالب بالترتيب)")}</Label>
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
              {t("إضافة سؤال")}
            </Button>
          </div>

          {examQuestions.length > 0 && (
            <div className="space-y-3">
              {examQuestions.map((q, qi) => (
                <div key={qi} className="rounded-md border border-border bg-background p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-muted-foreground">
                      {t("سؤال")} {qi + 1}
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
                      <option value="text">{t("نص حر (يدوي)")}</option>
                      <option value="mcq">{t("اختيار من متعدد (تلقائي)")}</option>
                      <option value="truefalse">{t("صح/خطأ (تلقائي)")}</option>
                    </select>
                    <Input
                      type="number"
                      min={1}
                      placeholder={t("الدرجة")}
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
                    placeholder={t("نص السؤال بالعبرية...")}
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
                            placeholder={`${t("الاختيار")} ${oi + 1}`}
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
                        {t("إضافة اختيار")}
                      </Button>
                      <small className="block text-muted-foreground">
                        {t("الإجابة الصحيحة محددة بـ ✓ — التصحيح تلقائي")}
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
                          {t(opt)} {q.correctIndex === oi && "✓"}
                        </button>
                      ))}
                      <small className="text-muted-foreground">{t("التصحيح تلقائي")}</small>
                    </div>
                  )}

                  {q.type === "text" && (
                    <Input
                      className="mt-2 text-xs"
                      placeholder={t("الإجابة المتوقعة (اختياري — للمرجعية فقط)")}
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
              <Label>{t("الفقرة المكتوبة (بالعبرية — الطالب يقرؤها ويسجل صوته)")}</Label>
              {examParagraph.trim() && <HebrewTTS text={examParagraph} label={t("معاينة الصوت")} />}
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
            <Label>{t("تسجيل صوتي منك — الطالب يسمعه ويكتب ما فهمه")}</Label>
            <AudioRecorder
              label={t("سجّل صوتك الآن")}
              onRecorded={(blob) => {
                setExamRecordedBlob(blob);
                setExamAudioFile(null);
              }}
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              {t("أو ارفع ملف صوتي جاهز")}
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
                  ? `${t("الملف الجاهز:")} ${examAudioFile.name}`
                  : t("تم تسجيل صوتك — سيُرفع مع الامتحان")}
              </small>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <Label>{t("حالة النشر")}</Label>
          <select
            value={examStatus}
            onChange={(e) => setExamStatusSel(e.target.value as PublishStatus)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="DRAFT">{t("مسودة (Draft)")}</option>
            <option value="PUBLISHED">{t("نشر فوري (Publish)")}</option>
          </select>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={teachers.length === 0 || examSubmitting}
        >
          <Plus className="size-4" />
          {examSubmitting ? t("جاري الحفظ والرفع...") : t("إنشاء الامتحان")}
        </Button>
      </form>
    </Card>
  );

  return (
    <AppShell
      role="ADMIN"
      activeSection={activeSection}
      onSelectSection={(s) => setActiveSection(s as AdminSection)}
    >
      {activeSection !== "overview" && (
        <PageHeader
          title={t("لوحة تحكم الإدارة")}
          subtitle={t("إدارة المستخدمين والمحتوى والمحاضرات والجدول الأكاديمي")}
        />
      )}

      {activeSection === "overview" && (
        <>
          <HeroBanner
            tone="navy"
            icon={ShieldCheck}
            kicker={t("مركز الإدارة • تحديث مباشر")}
            title={
              <>
                {t("كل شيء تحت السيطرة")} <span className="text-amber-300">✦</span>
              </>
            }
            subtitle={t("تابع نمو المنصة، أداء الفريق، وتجربة الطلاب من مكان واحد")}
            cta={
              <HeroAction onClick={() => setActiveSection("analytics")}>
                {t("عرض التحليلات")}
                <ArrowLeft className="size-4" />
              </HeroAction>
            }
          />

          <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard chip="teal" icon={UsersRound} label={t("المدرسون")} value={counts.teachers} sub={t("في قاعدة البيانات")} />
            <StatCard chip="mint" icon={GraduationCap} label={t("الطلاب المسجلون")} value={counts.students} sub={t("تسجيل ذاتي")} />
            <StatCard chip="peach" icon={TicketCheck} label={t("فريق المبيعات")} value={counts.sales} sub={t("في قاعدة البيانات")} />
            <StatCard chip="lilac" icon={Headphones} label={t("خدمة العملاء")} value={counts.support} sub={t("في قاعدة البيانات")} />
          </div>

          <div className="mb-4 grid gap-4 lg:grid-cols-[1fr_320px]">
            <Card>
              <h2 className="mb-3 text-base font-bold">{t("نمو المستخدمين (آخر 6 أشهر)")}</h2>
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
                    <Area type="monotone" dataKey="total" name={t("المستخدمون")} stroke="var(--brand)" strokeWidth={3} fill="url(#adminGrowth)" dot={{ r: 3, fill: "var(--sage)", stroke: "var(--sage)" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card>
              <h2 className="mb-3 text-base font-bold">{t("توزيع الأدوار")}</h2>
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
                <small className="text-muted-foreground">{t("سيرفر VPS (API)")}</small>
                <Badge tone="sage">{t("متصل")}</Badge>
              </div>
              <b className="mt-1 block font-lat text-sm">{SERVER_CONFIG.vpsServerIp}</b>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <small className="text-muted-foreground">{t("سيرفر التخزين (Storage)")}</small>
                <Badge tone="brand">{t("متصل")}</Badge>
              </div>
              <b className="mt-1 block font-lat text-sm">{SERVER_CONFIG.storageServerIp}</b>
            </Card>
          </div>

          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{t("جميع المستخدمين المسجلين في النظام")}</h2>
              <Button onClick={() => setActiveSection("add-user")}>
                <UserPlus className="size-4" />
                {t("إضافة مستخدم جديد")}
              </Button>
            </div>
            {renderUsersTable(users, t("لا يوجد مستخدمون في قاعدة البيانات حالياً."))}
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
              <h2 className="text-lg font-bold">{t("قائمة المدرسين (Teachers)")}</h2>
              <p className="text-xs text-muted-foreground">
                {t("جميع المدرسين المسجلين في قاعدة البيانات")}
              </p>
            </div>
            <Button
              onClick={() => {
                setNewUserRole("TEACHER");
                setActiveSection("add-user");
              }}
            >
              <Plus className="size-4" />
              {t("إضافة مدرس جديد")}
            </Button>
          </div>
          {renderUsersTable(
            users.filter((u) => u.role === "TEACHER"),
            t("لا يوجد مدرسون مضافون حالياً."),
          )}
        </Card>
      )}

      {activeSection === "students" && (
        <div className="space-y-4">
          <StudentsDirectorySection
            students={opsStudents}
            groups={adminGroups}
            packages={opsPackages}
            loading={loadingData}
            onStatusChange={(id, status) => updateStudentStatus(id, status).catch(() => {})}
            onActivate={activateOpsSubscription}
            onAddToGroup={addGroupMembers}
            onDeleteStudent={async (id) => {
              await deleteUser(id);
              await fetchOpsStudents();
            }}
            onViewProfile={(id) => setProfileView({ type: "student", id })}
            onResetIp={resetStudentBoundIp}
            onDeleteSubscription={async (id) => {
              await deleteAdminSubscription(id);
              await fetchOpsStudents();
            }}
            onRestoreSessions={async (id) => {
              await restoreSubscriptionSessions(id);
              await fetchOpsStudents();
            }}
          />

          <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
            <Card>
              <div className="flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-md bg-brand/10 text-brand">
                  <Link2 className="size-4" />
                </span>
                <div>
                  <h2 className="font-bold">{t("ربط طالب بمدرس")}</h2>
                  <small className="text-muted-foreground">
                    {t("الطالب المربوط يرى امتحانات وكورسات المدرس تلقائياً")}
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
                  <Label>{t("الطالب")}</Label>
                  <select
                    value={assignStudentId}
                    onChange={(e) => setAssignStudentId(e.target.value)}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">{t("اختر طالباً...")}</option>
                    {studentsList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} — {s.phone ?? s.email ?? "—"}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("المدرس")}</Label>
                  <select
                    value={assignTeacherId}
                    onChange={(e) => setAssignTeacherId(e.target.value)}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">{t("اختر مدرساً...")}</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.fullName} ({teacher.specialty ?? t("مدرس")})
                      </option>
                    ))}
                  </select>
                </div>
                <Button type="submit" className="w-full" disabled={!assignStudentId || !assignTeacherId}>
                  <Link2 className="size-4" />
                  {t("ربط الطالب بالمدرس")}
                </Button>
              </form>
            </Card>

            <Card>
              <h2 className="font-bold">{t("الروابط الحالية (طالب ↔ مدرس)")}</h2>
              <div className="mt-4 space-y-2">
                {studentLinks.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    {t("لا توجد روابط بين الطلاب والمدرسين حالياً.")}
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
                        title={t("إلغاء الربط")}
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
              <h2 className="text-lg font-bold">{t("فريق المبيعات (Sales Users)")}</h2>
              <p className="text-xs text-muted-foreground">{t("مستخدمو قسم المبيعات في المنصة")}</p>
            </div>
            <Button
              onClick={() => {
                setNewUserRole("SALES");
                setActiveSection("add-user");
              }}
            >
              <Plus className="size-4" />
              {t("إضافة موظف مبيعات")}
            </Button>
          </div>
          {renderUsersTable(
            users.filter((u) => u.role === "SALES"),
            t("لا يوجد موظفو مبيعات حالياً."),
          )}
        </Card>
      )}

      {activeSection === "support" && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">{t("فريق خدمة العملاء (Support Users)")}</h2>
              <p className="text-xs text-muted-foreground">{t("مستخدمو قسم الدعم وخدمة العملاء")}</p>
            </div>
            <Button
              onClick={() => {
                setNewUserRole("SUPPORT");
                setActiveSection("add-user");
              }}
            >
              <Plus className="size-4" />
              {t("إضافة موظف خدمة عملاء")}
            </Button>
          </div>
          {renderUsersTable(
            users.filter((u) => u.role === "SUPPORT"),
            t("لا يوجد موظفو خدمة عملاء حالياً."),
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
              <h2 className="font-bold">{t("إضافة مستخدم جديد من الإدارة")}</h2>
              <small className="text-muted-foreground">
                {t("مخصص لإضافة المدرسين والمبيعات وخدمة العملاء (الطالب ينشئ حسابه بنفسه)")}
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
              <Label>{t("الدور الوظيفي")}</Label>
              <select
                value={newUserRole}
                onChange={(e) =>
                  setNewUserRole(e.target.value as Exclude<UserRole, "STUDENT">)
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="TEACHER">{t("مدرس (Teacher)")}</option>
                <option value="SALES">{t("مبيعات (Sales)")}</option>
                <option value="SUPPORT">{t("خدمة عملاء (Support)")}</option>
                <option value="ADMIN">{t("مدير (Admin)")}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>{t("الاسم الكامل")}</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder={t("الاسم الكامل")}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t("رقم الهاتف")}</Label>
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
              <Label>{t("كلمة المرور")}</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder={t("8 أحرف على الأقل")}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t("التخصص / القسم")}</Label>
              <Input
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder={t("التخصص أو القسم")}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t("البريد الإلكتروني (اختياري)")}</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@עברית שוטפת.com"
              />
            </div>

            <Button type="submit" className="w-full">
              <Plus className="size-4" />
              {t("إضافة")} {t(ROLE_LABELS[newUserRole])}
            </Button>
          </form>
        </Card>
      )}

      {activeSection === "courses" && (() => {
        const q = matSearch.trim().toLowerCase();
        const filteredMats = materials.filter((m) => !q || `${m.title} ${m.description} ${m.assignedTeacherName}`.toLowerCase().includes(q));
        const matPages = Math.max(1, Math.ceil(filteredMats.length / PAGE_SIZE));
        const curPage = Math.min(matPage, matPages);
        const pageMats = filteredMats.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);
        const publishedCount = materials.filter((m) => m.status === "PUBLISHED").length;
        return (
        <>
        <SectionHeader
          icon={Film}
          title={t("الكورسات والماتيريال")}
          subtitle={t("إدارة رفع الملفات التعليمية والفيديوهات الملحقة")}
        />
        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          <StatTile icon={Film} label={t("فيديوهات")} value={materials.filter((m) => m.type === "VIDEO").length} />
          <StatTile icon={FileText} tone="gold" label={t("مستندات وصوتيات")} value={materials.filter((m) => m.type !== "VIDEO").length} />
          <StatTile icon={Check} tone="sage" label={t("قيد النشر")} value={publishedCount} />
        </div>
        <div className="grid items-start gap-4 xl:grid-cols-[400px_1fr]">
          <div className="animate-rise space-y-4 xl:sticky xl:top-4 xl:col-start-1 xl:row-start-1">
            {courseFormCard}
            <div className="rounded-2xl bg-gradient-to-br from-brand to-brand2 p-5 text-white shadow-xl">
              <small className="text-[11px] opacity-80">{t("إحصائيات سريعة")}</small>
              <b className="mt-1 block text-lg">{t("أداء الماتيريال المرفوعة")}</b>
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between"><span>{t("إجمالي الملفات")}</span><b className="font-lat text-base">{materials.length}</b></div>
                <div className="flex justify-between"><span>{t("منشورة للطلاب")}</span><b className="font-lat text-base">{publishedCount}</b></div>
                <div className="flex justify-between"><span>{t("مسودات")}</span><b className="font-lat text-base">{materials.length - publishedCount}</b></div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/25">
                  <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${materials.length ? (publishedCount / materials.length) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          </div>

          <Card className="xl:col-start-2 xl:row-start-1">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base font-bold">{t("الماتيريال المرفوعة")} ({materials.length})</h3>
              <SearchBox value={matSearch} onChange={(v) => { setMatSearch(v); setMatPage(1); }} placeholder={t("بحث عن مادة...")} />
            </div>
            <div className="space-y-3">
              {pageMats.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  {t("لا توجد كورسات مطابقة في قاعدة البيانات حالياً.")}
                </div>
              ) : (
                pageMats.map((m, i) => (
                  <div
                    key={m.id}
                    style={{ animationDelay: `${i * 70}ms` }}
                    className="animate-rise hover-lift rounded-2xl border border-border bg-card p-4"
                  >
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="relative grid h-24 w-36 shrink-0 place-items-center rounded-xl bg-muted/70 text-muted-foreground">
                        <span className="grid size-10 place-items-center rounded-full bg-background shadow-sm">
                          {m.type === "VIDEO" ? <Film className="size-4" /> : m.type === "AUDIO" ? <Mic className="size-4" /> : <FileText className="size-4" />}
                        </span>
                        <span className="absolute end-2 top-2 rounded-md bg-background px-1.5 py-0.5 font-lat text-[9px] font-bold">
                          {m.type === "VIDEO" ? "VIDEO" : m.type === "AUDIO" ? "AUDIO" : "PDF"}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <b className="text-sm">{m.title}</b>
                          <Badge tone="muted">{m.level}</Badge>
                          <Badge tone={m.status === "PUBLISHED" ? "sage" : "gold"}>
                            {m.status === "PUBLISHED" ? t("منشور") : t("مسودة (Draft)")}
                          </Badge>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{m.description}</p>
                        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                          <span>{t("المدرس")}: {m.assignedTeacherName}</span>
                          <span>{new Date(m.createdAt).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" })}</span>
                          <span className="font-lat">{m.fileSize}</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col gap-1.5">
                        <Button
                          variant="secondary"
                          className="min-h-8 px-4 py-1 text-xs"
                          onClick={() => setMaterialStatus(m.id, m.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED")}
                        >
                          {m.status === "PUBLISHED" ? t("إرجاع كمسودة") : t("نشر للطلاب")}
                        </Button>
                        <div className="flex gap-1.5">
                          <Button
                            variant="ghost"
                            className="min-h-8 flex-1 px-3 py-1 text-xs"
                            onClick={() => setOpenMaterialId(openMaterialId === m.id ? null : m.id)}
                          >
                            {openMaterialId === m.id ? t("إغلاق") : t("معاينة")}
                          </Button>
                          <button
                            onClick={() => deleteCourseMaterial(m.id)}
                            className="grid size-8 place-items-center rounded-xl bg-muted/70 text-muted-foreground hover:bg-danger/10 hover:text-danger"
                            title={t("حذف المادة")}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    {openMaterialId === m.id && (
                      <div className="animate-rise mt-4 border-t border-border pt-4">
                        <MaterialPlayer material={m} />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            <Pagination page={curPage} pages={matPages} total={filteredMats.length} size={PAGE_SIZE} onPage={setMatPage} />
          </Card>
        </div>
        </>
        );
      })()}

      {activeSection === "exams" && (() => {
        const q = examSearch.trim().toLowerCase();
        const filteredExams = exams.filter((e) => !q || `${e.title} ${e.description} ${e.assignedTeacherName ?? ""}`.toLowerCase().includes(q));
        const examPages = Math.max(1, Math.ceil(filteredExams.length / PAGE_SIZE));
        const curPage = Math.min(examPage, examPages);
        const pageExams = filteredExams.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);
        const publishedCount = exams.filter((e) => e.status === "PUBLISHED").length;
        const submissions = exams.reduce((n, e) => n + (e.resultsCount ?? 0), 0);
        return (
        <>
        <SectionHeader
          icon={FileCheck}
          tone="gold"
          title={t("الامتحانات")}
          subtitle={t("إنشاء الامتحانات وتخصيصها للمدرسين ومتابعة تسليمات الطلاب")}
        />
        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          <StatTile icon={FileCheck} label={t("إجمالي الامتحانات")} value={exams.length} />
          <StatTile icon={Check} tone="sage" label={t("منشورة")} value={publishedCount} />
          <StatTile icon={ClipboardCheck} tone="gold" label={t("التسليمات")} value={submissions} />
        </div>
        <div className="grid items-start gap-4 xl:grid-cols-[440px_1fr]">
          <div className="animate-rise space-y-4 xl:sticky xl:top-4 xl:col-start-1 xl:row-start-1">
            {examFormCard}
          </div>

          <Card className="xl:col-start-2 xl:row-start-1">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base font-bold">{t("الامتحانات المخصصة للمدرسين")} ({exams.length})</h3>
              <SearchBox value={examSearch} onChange={(v) => { setExamSearch(v); setExamPage(1); }} placeholder={t("بحث عن امتحان...")} />
            </div>
            <div className="space-y-3">
              {pageExams.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  {t("لا توجد امتحانات مطابقة في قاعدة البيانات حالياً.")}
                </div>
              ) : (
                pageExams.map((exam, i) => (
                  <div
                    key={exam.id}
                    style={{ animationDelay: `${i * 70}ms` }}
                    className="animate-rise hover-lift rounded-2xl border border-border bg-card p-4"
                  >
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="grid h-24 w-36 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold">
                        <span className="grid size-10 place-items-center rounded-full bg-background shadow-sm">
                          <FileCheck className="size-4" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <b className="text-sm">{exam.title}</b>
                          <Badge tone="muted">{t(EXAM_TYPE_LABELS[exam.type])}</Badge>
                          <Badge tone={exam.status === "PUBLISHED" ? "sage" : "gold"}>
                            {exam.status === "PUBLISHED" ? t("منشور") : t("مسودة")}
                          </Badge>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{exam.description || t("بدون وصف")}</p>
                        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                          <span>{t("المدرس")}: {exam.assignedTeacherName ?? "—"}</span>
                          <span>{new Date(exam.createdAt).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" })}</span>
                          <span>{t("التسليمات")}: {exam.resultsCount ?? 0}</span>
                        </div>
                        {exam.questions.audioUrl && (
                          <audio controls src={mediaSrc(exam.questions.audioUrl)} className="mt-2 h-8 w-56" />
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col gap-1.5">
                        <Button
                          variant="secondary"
                          className="min-h-8 px-4 py-1 text-xs"
                          onClick={() => setExamStatus(exam.id, exam.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED")}
                        >
                          {exam.status === "PUBLISHED" ? t("إرجاع كمسودة") : t("نشر الآن")}
                        </Button>
                        <button
                          onClick={() => deleteExam(exam.id)}
                          className="grid h-8 place-items-center rounded-xl bg-muted/70 text-muted-foreground hover:bg-danger/10 hover:text-danger"
                          title={t("حذف الامتحان")}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Pagination page={curPage} pages={examPages} total={filteredExams.length} size={PAGE_SIZE} onPage={setExamPage} />
          </Card>
        </div>
        </>
        );
      })()}

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
                  {t("أسئلة تحديد المستوى المعروضة في الصفحة الرئيسية")}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {t("أي سؤال تضيفه أو تفعّله هنا يظهر مباشرة للزوار والطلاب في الصفحة الرئيسية (`/`)")}
                </p>
              </div>
              <Badge tone="sage">
                {placementQuestions.filter((q) => q.isActive).length} {t("سؤال مفعل")}
              </Badge>
            </div>

            <div className="mt-4 space-y-3">
              {placementQuestions.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  {t("لا توجد أسئلة مضافة حالياً.")}
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
                        <Badge tone="gold">{t(q.section)}</Badge>
                        <Badge tone="brand">{t("مستوى")} {q.levelTag}</Badge>
                        <Badge tone="muted">
                          {q.questionType === "truefalse" ? t("صح/خطأ") : q.questionType === "text" ? t("إجابة نصية") : t("اختيار متعدد")}
                        </Badge>
                        <Badge tone={q.isActive ? "sage" : "muted"}>
                          {q.isActive ? t("مفعل بالرئيسية") : t("مخفي")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          className="min-h-7 px-2 py-1 text-xs"
                          onClick={() => togglePlacementQuestion(q.id)}
                        >
                          {q.isActive ? t("إخفاء") : t("تفعيل")}
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
                        {t("الإجابة المتوقعة")}: {q.expectedAnswer}
                      </div>
                    ) : q.questionType === "truefalse" ? (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {(["صح", "خطأ"] as const).map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`rounded-sm px-3 py-1.5 text-xs ${
                              oIdx === q.correctOptionIndex
                                ? "bg-sage/15 font-bold text-sage ring-1 ring-sage/30"
                                : "bg-muted/60 text-muted-foreground"
                            }`}
                          >
                            {t(opt)}
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
                          {oIdx + 1}. {opt} {oIdx === q.correctOptionIndex && ` (${t("الإجابة الصحيحة")})`}
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
                <h2 className="font-bold">{t("إضافة سؤال جديد لتحديد المستوى")}</h2>
                <small className="text-muted-foreground">
                  {t("يظهر في قسم تحديد المستوى بالصفحة الرئيسية")}
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
                  <Label>{t("المهارة / القسم")}</Label>
                  <select
                    value={qSection}
                    onChange={(e) => setQSection(e.target.value as PlacementSection)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="ترجمة">{t("ترجمة")}</option>
                    <option value="قراءة">{t("قراءة")}</option>
                    <option value="استماع">{t("استماع")}</option>
                    <option value="كتابة">{t("كتابة")}</option>
                    <option value="محادثة">{t("محادثة")}</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("المستوى المستهدف")}</Label>
                  <select
                    value={qLevel}
                    onChange={(e) => setQLevel(e.target.value as PlatformLevel)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {PLATFORM_LEVELS.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>{t("نص السؤال (بالعربية)")}</Label>
                <Input
                  value={qPromptAr}
                  onChange={(e) => setQPromptAr(e.target.value)}
                  required
                  placeholder={t("نص السؤال بالعربية")}
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t("الجملة أو النص بالعبرية")}</Label>
                <Input
                  dir="rtl"
                  className="font-he"
                  value={qHebrewText}
                  onChange={(e) => setQHebrewText(e.target.value)}
                  required
                  placeholder="שלום..."
                />
              </div>

              {qSection === "قراءة" && (
                <div className="space-y-1.5">
                  <Label>{t("فقرة القراءة (تظهر للطالب قبل السؤال)")}</Label>
                  <textarea
                    value={qParagraph}
                    onChange={(e) => setQParagraph(e.target.value)}
                    className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
                    dir="rtl"
                    placeholder={t("اكتب فقرة الفهم هنا...")}
                  />
                </div>
              )}

              {qSection === "استماع" && (
                <div className="space-y-1.5">
                  <Label>{t("مقطع الاستماع (صوت الأدمن — يظهر للطالب)")}</Label>
                  <Dropzone
                    file={qAudioFile}
                    onFile={setQAudioFile}
                    accept="audio/*,.mp3,.wav,.ogg,.m4a"
                    hint="MP3 / WAV / M4A"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label>{t("نوع السؤال")}</Label>
                <div className="grid grid-cols-4 gap-2">
                  {([
                    ["mcq", "اختيار من متعدد"],
                    ["truefalse", "صح / خطأ"],
                    ["text", "إجابة نصية"],
                    ["audio", "إجابة صوتية"],
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
                      {t(l)}
                    </button>
                  ))}
                </div>
              </div>

              {qType === "mcq" && (
                <>
                  <div className="space-y-2">
                    <Label>{t("الاختيارات (2 على الأقل)")}</Label>
                    <Input value={opt1} onChange={(e) => setOpt1(e.target.value)} placeholder={t("الاختيار الأول")} />
                    <Input value={opt2} onChange={(e) => setOpt2(e.target.value)} placeholder={t("الاختيار الثاني")} />
                    <Input value={opt3} onChange={(e) => setOpt3(e.target.value)} placeholder={t("الاختيار الثالث (اختياري)")} />
                    <Input value={opt4} onChange={(e) => setOpt4(e.target.value)} placeholder={t("الاختيار الرابع (اختياري)")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("رقم الإجابة الصحيحة")}</Label>
                    <select
                      value={correctIdx}
                      onChange={(e) => setCorrectIdx(Number(e.target.value))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value={0}>{t("الاختيار الأول (1)")}</option>
                      <option value={1}>{t("الاختيار الثاني (2)")}</option>
                      <option value={2}>{t("الاختيار الثالث (3)")}</option>
                      <option value={3}>{t("الاختيار الرابع (4)")}</option>
                    </select>
                  </div>
                </>
              )}

              {qType === "truefalse" && (
                <div className="space-y-1.5">
                  <Label>{t("الإجابة الصحيحة")}</Label>
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
                        {v ? t("صح") : t("خطأ")}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {qType === "text" && (
                <div className="space-y-1.5">
                  <Label>{t("الإجابة المتوقعة (النص الصحيح)")}</Label>
                  <Input
                    dir="rtl"
                    value={qExpected}
                    onChange={(e) => setQExpected(e.target.value)}
                    placeholder={t("الإجابة الصحيحة — يُقارن بها نص الطالب بعد تجاهل المسافات")}
                  />
                  <small className="text-muted-foreground">
                    {t("المقارنة بتتجاهل حالة الأحرف والمسافات الزائدة — اكتب الإجابة الأدق")}
                  </small>
                </div>
              )}

              {qType === "audio" && (
                <div className="rounded-md border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                  {t("سؤال إجابة صوتية — الطالب يسجّل صوته (قراءة الجملة/الفقرة بالعبرية)، ولا يدخل في الدرجة التلقائية، تتم مراجعته من الإدارة.")}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={qUploading}>
                <Plus className="size-4" />
                {qUploading ? t("جاري رفع الصوت والنشر...") : t("نشر السؤال في الصفحة الرئيسية")}
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

      {activeSection === "schedules" && (
        <div className="space-y-4">
          <AdminSchedulesSection
            schedules={adminSchedules}
            teachers={users.filter((u) => u.role === "TEACHER")}
            groups={adminGroups}
            availability={adminTeacherAvailability}
            onFetchAvailability={fetchAdminTeacherAvailability}
            onCreate={createAdminSchedule}
            onUpdate={updateAdminSchedule}
            onDelete={deleteAdminSchedule}
          />
          <OpsLecturesListCard
            lectures={adminLectures}
            fetchLectures={() => fetchAdminLectures({ status: "all" })}
            onCancel={(id) => updateAdminLecture(id, { status: "cancelled" })}
          />
          <AdminLectureReportsCard
            lectures={adminLectures}
            fetchLectures={fetchAdminLectures}
            fetchAttendance={fetchAdminLectureAttendance}
          />
        </div>
      )}

      {activeSection === "sessions" && (
        <div className="space-y-4">
          {/* Report summary */}
          {adminBookingsReport && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <Card className="p-4">
                  <b className="font-lat text-2xl text-sage">{(adminBookingsReport.totals.totalRevenue ?? 0).toLocaleString("ar-EG")} {t("ج")}</b>
                  <p className="text-xs text-muted-foreground">{t("إجمالي الفلوس الداخلة من كل الباقات")} ({adminBookingsReport.totals.subscriptionsCount ?? 0} {t("اشتراك")})</p>
                </Card>
                <Card className="p-4">
                  <b className="font-lat text-2xl text-brand">{(adminBookingsReport.totals.callsRevenue ?? 0).toLocaleString("ar-EG")} {t("ج")}</b>
                  <p className="text-xs text-muted-foreground">{t("إيراد باقات المكالمات")}</p>
                </Card>
                <Card className="p-4">
                  <b className="font-lat text-2xl text-[#7a4fd0]">{(adminBookingsReport.totals.basicRevenue ?? 0).toLocaleString("ar-EG")} {t("ج")}</b>
                  <p className="text-xs text-muted-foreground">{t("إيراد الباقات الأساسية فقط")}</p>
                </Card>
                <Card className="p-4">
                  <b className="font-lat text-2xl text-gold">{(adminBookingsReport.totals.teacherPayout ?? 0).toLocaleString("ar-EG")} {t("ج")}</b>
                  <p className="text-xs text-muted-foreground">{t("مستحقات المدرسين من الحصص")}</p>
                </Card>
                <Card className="p-4">
                  <b className="font-lat text-2xl text-[#0b2f6e]">{(adminBookingsReport.totals.netRevenue ?? 0).toLocaleString("ar-EG")} {t("ج")}</b>
                  <p className="text-xs text-muted-foreground">{t("صافي ربح باقات المكالمات")}</p>
                </Card>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="p-4">
                  <b className="text-2xl text-[#0b2f6e]">{adminBookingsReport.totals.totalBookings}</b>
                  <p className="text-xs text-muted-foreground">{t("إجمالي الحجوزات")}</p>
                </Card>
                <Card className="p-4">
                  <b className="text-2xl text-[#2f9e4f]">{adminBookingsReport.totals.completed}</b>
                  <p className="text-xs text-muted-foreground">{t("حصص مكتملة")}</p>
                </Card>
                <Card className="p-4">
                  <b className="text-2xl text-[#c0392b]">{adminBookingsReport.totals.cancelled}</b>
                  <p className="text-xs text-muted-foreground">{t("حصص ملغاة")}</p>
                </Card>
                <Card className="p-4">
                  <b className="text-2xl text-[#e67e22]">{adminBookingsReport.totals.noShow}</b>
                  <p className="text-xs text-muted-foreground">{t("لم يحضر")}</p>
                </Card>
              </div>
            </>
          )}

          <OpsCreateSessionCard
            callsStudents={callsStudents}
            teachers={users.filter((u) => u.role === "TEACHER")}
            availability={adminTeacherAvailability}
            onFetchAvailability={fetchAdminTeacherAvailability}
            onCreate={opsCreateBooking}
            onFetchCallsStudents={fetchCallsStudents}
            bookings={adminBookings}
            lectures={[...adminLectures, ...freeLectures]}
          />

          {adminBookingsReport && (
            <>

              {Array.isArray(adminBookingsReport.packages) && adminBookingsReport.packages.length > 0 && (
                <Card>
                  <h3 className="font-bold">{t("تحليل الفلوس الداخلة حسب الباقة")}</h3>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-right text-xs text-muted-foreground">
                          <th className="p-2">{t("الباقة")}</th>
                          <th className="p-2">{t("النوع")}</th>
                          <th className="p-2">{t("سعر الباقة")}</th>
                          <th className="p-2">{t("مدة الحصة")}</th>
                          <th className="p-2">{t("الاشتراكات (نشط)")}</th>
                          <th className="p-2">{t("إجمالي الفلوس الداخلة")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {adminBookingsReport.packages.map((p: any) => (
                          <tr key={p.id} className="border-b">
                            <td className="p-2 font-semibold">{p.nameAr}</td>
                            <td className="p-2"><Badge tone={p.category === "calls" ? "gold" : "brand"}>{p.category === "calls" ? t("مكالمات") : t("أساسية")}</Badge></td>
                            <td className="p-2 font-lat">{p.price} {t("ج")}</td>
                            <td className="p-2 text-xs">{p.durationMin ? `${p.durationMin} ${t("دقيقة")}` : "—"}</td>
                            <td className="p-2 font-lat">{p.count} ({p.activeCount})</td>
                            <td className="p-2 font-lat font-bold text-sage">{(p.revenue ?? 0).toLocaleString("ar-EG")} {t("ج")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </>
          )}

          {/* Students balance */}
          {adminBookingsReport && adminBookingsReport.students.length > 0 && (
            <Card>
              <h3 className="font-bold">{t("رصيد الطلاب")}</h3>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-right text-xs text-muted-foreground">
                      <th className="p-2">{t("الطالب")}</th>
                      <th className="p-2">{t("الباقة")}</th>
                      <th className="p-2">{t("المدفوع")}</th>
                      <th className="p-2">{t("أجر المدرس/حصة")}</th>
                      <th className="p-2">{t("الإجمالي")}</th>
                      <th className="p-2">{t("المستخدم")}</th>
                      <th className="p-2">{t("المتبقي")}</th>
                      <th className="p-2">{t("تنتهي")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminBookingsReport.students.map((s: any, idx: number) => (
                      <tr key={`${s.studentId}-${idx}`} className="border-b">
                        <td className="p-2 font-semibold">{s.studentName}</td>
                        <td className="p-2">{s.packageName}</td>
                        <td className="p-2 font-lat">{s.paidAmount != null ? `${s.paidAmount} ${t("ج")}` : "—"}</td>
                        <td className="p-2 font-lat text-xs">{s.teacherRate ?? 50} {t("ج")} ({s.sessionDurationMinutes ?? 30} {t("د")})</td>
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
          <AdminAllBookingsCard bookings={adminBookings} onUpdate={adminUpdateBooking} />
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
          platformStudents={opsStudents}
          onFetchAvailability={fetchAdminTeacherAvailability}
          onCreateStudent={createFreeStudent}
          onDeleteStudent={deleteFreeStudent}
          onCreateLecture={createFreeLecture}
          onUpdateLecture={updateFreeLecture}
          onSetLectureStudents={setFreeLectureStudents}
          onDeleteLecture={deleteFreeLecture}
          onAddFile={addFreeLectureFile}
          onRemoveFile={removeFreeLectureFile}
        />
      )}

      {activeSection === "analytics" && (
        <AdminAnalyticsSection
          data={adminAnalytics}
          teachers={teachers}
          teacherId={anTeacherId}
          from={anFrom}
          to={anTo}
          onTeacherChange={setAnTeacherId}
          onFromChange={setAnFrom}
          onToChange={setAnTo}
        />
      )}

      {activeSection === "guide" && <AdminGuideSection />}

      {profileView?.type === "teacher" && (
        <AdminTeacherProfileModal
          teacherId={profileView.id}
          fetchProfile={fetchAdminTeacherProfile}
          onClose={() => setProfileView(null)}
        />
      )}
      {profileView?.type === "student" && (
        <AdminStudentProfileModal
          studentId={profileView.id}
          fetchProfile={fetchAdminStudentProfile}
          onDeleteSub={deleteAdminSubscription}
          onRestore={restoreSubscriptionSessions}
          onChanged={() => fetchOpsStudents().catch(() => {})}
          onClose={() => setProfileView(null)}
        />
      )}
      {editingUser && (
        <AdminEditUserModal
          user={editingUser}
          onSave={updateAdminUser}
          onClose={() => setEditingUser(null)}
        />
      )}
    </AppShell>
  );
}

// ─── Admin guide ────────────────────────────────────────────────────────────

function GuideBlock({ icon: Icon, title, children, tone = "brand" }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: ReactNode;
  tone?: "brand" | "sage" | "gold";
}) {
  const tones = { brand: "bg-brand/10 text-brand", sage: "bg-sage/15 text-sage", gold: "bg-gold/15 text-gold" };
  return (
    <Card>
      <div className="flex items-center gap-2">
        <span className={`grid size-9 shrink-0 place-items-center rounded-md ${tones[tone]}`}>
          <Icon className="size-4" />
        </span>
        <h2 className="font-bold">{title}</h2>
      </div>
      <div className="mt-3 space-y-2 text-sm leading-7 text-foreground/90">{children}</div>
    </Card>
  );
}

function AdminGuideSection() {
  const { t } = useI18n();
  const li = (n: ReactNode) => (
    <li className="flex gap-2">
      <Check className="mt-1.5 size-3.5 shrink-0 text-sage" />
      <span>{n}</span>
    </li>
  );
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Card className="bg-brand/5">
        <h2 className="text-lg font-extrabold">{t("دليل تشغيل المنصة — من تسجيل الطالب حتى الشهادة")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("الصفحة دي مرجعك الكامل: رحلة الطالب، دور كل فريق، طريقة استخدام كل قسم، وسيناريوهات الشغل اليومي.")}
        </p>
      </Card>

      <GuideBlock icon={GraduationCap} title={t("١) رحلة الطالب الكاملة")}>
        <ol className="list-decimal space-y-1.5 pe-5">
          <li>{t("التسجيل:")} {t("الطالب يسجل من صفحة \"إنشاء حساب\" — بيظهر فوراً في قسم \"الطلاب\" بحالة \"جديد\".")}</li>
          <li>{t("تحديد المستوى:")} {t("يحل اختبار المستوى — النتيجة بتظهر في \"نتائج تحديد المستوى\" (مع تسجيلاته الصوتية إن وجدت).")}</li>
          <li>{t("المحاضرة المجانية:")} {t("يتواصل واتساب لحجز المحاضرة التجريبية — أنت تضيفه في \"المحاضرة المجانية\" كطالب تجربة أو لمجموعة.")}</li>
          <li>{t("الاشتراك:")} {t("يختار باقة — إما يدفع برنامج الدفع ويوافق الطلب من \"طلبات الدفع\"، أو يدفع خارج المنصة وانت تفعّله يدوياً من \"الطلاب\" ← \"تفعيل اشتراك\".")}</li>
          <li>{t("التجميع:")} {t("حدد الطلاب من دليل الطلاب (checkbox) وضمهم لمجموعة — أو أنشئ مجموعة من قسم \"المجموعات\".")}</li>
          <li>{t("المعاد الثابت:")} {t("المدرس يضيف مواعيده المتاحة، وأنت تنشئ منها \"موعد أسبوعي\" برابط زووم دائم للمجموعة.")}</li>
          <li>{t("المحاضرات:")} {t("كل أسبوع الطالب والمدرس يدخلوا نفس الرابط — المدرس يدوس \"بدء محاضرة اليوم\" ويسجل الحضور.")}</li>
          <li>{t("المحتوى:")} {t("ترفع كورسات/امتحانات/واجبات للمدرس — بتظهر لطلابه المربوطين وأعضاء مجموعاته.")}</li>
          <li>{t("الحصص الفردية:")} {t("طلاب باقة المكالمات تحجزلهم حصصاً من \"نظام المكالمات\" داخل مواعيد المدرس المتاحة.")}</li>
          <li>{t("الشهادة:")} {t("عند إتمام المستوى تصدر شهادة للطالب من قسم \"الشهادات\".")}</li>
        </ol>
      </GuideBlock>

      <GuideBlock icon={UsersRound} title={t("٢) من يعمل إيه (الأدوار)")} tone="sage">
        <ul className="space-y-1.5">
          {li(<><b>{t("الأدمن (أنت):")}</b> {t("كل شيء — المستخدمين، الباقات، الاشتراكات، المحتوى، المواعيد، الشهادات، التحليلات.")}</>)}
          {li(<><b>{t("خدمة العملاء:")}</b> {t("الطلاب (حالات + تفعيل اشتراك يدوي + ضم لمجموعات)، الشكاوى، المحادثات، المواعيد الأسبوعية، نظام المكالمات، المحاضرة المجانية، الحضور.")}</>)}
          {li(<><b>{t("المبيعات:")}</b> {t("العملاء المحتملون (leads)، سجل المكالمات، متابعة الاشتراكات.")}</>)}
          {li(<><b>{t("المدرس:")}</b> {t("مواعيده المتاحة، جدوله الثابت، بدء المحاضرات، تسجيل الحضور، الواجبات والتصحيح، محادثات الطلاب، تحليلات أرباحه.")}</>)}
          {li(<><b>{t("الطالب:")}</b> {t("اختبار المستوى، محفظته، حصصه الفردية، جدوله الثابت ورابط الزووم، كورساته وامتحاناته وواجباته.")}</>)}
        </ul>
      </GuideBlock>

      <GuideBlock icon={Rocket} title={t("٣) الإعداد الأولي لمدرس جديد")} tone="gold">
        <ol className="list-decimal space-y-1.5 pe-5">
          <li>{t("أنشئ حسابه من \"إضافة مستخدم\" بدور مدرس.")}</li>
          <li>{t("اطلب منه يضيف مواعيده المتاحة من صفحة \"مواعيدي المتاحة\" في لوحته.")}</li>
          <li>{t("أنشئ مجموعة (أو أكثر) من \"المجموعات\" واربطها به.")}</li>
          <li>{t("من \"المواعيد الأسبوعية\" اختر المدرس ← اضغط موعداً من مواعيده المتاحة ← حدد المجموعة والرابط الدائم.")}</li>
          <li>{t("ارفع له الكورسات/الامتحانات من \"الكورسات والماتيريال\" و\"الامتحانات والنتائج\".")}</li>
          <li>{t("اربط الطلاب بمجموعته من دليل الطلاب (تحديد جماعي → أضف للمجموعة).")}</li>
        </ol>
      </GuideBlock>

      <GuideBlock icon={CalendarDays} title={t("٤) المواعيد الأسبوعية والمحاضرات")}>
        <ul className="space-y-1.5">
          {li(<>{t("المعاد الثابت = \"كل يوم كذا الساعة كذا\" — يظهر للطالب والمدرس دائماً بنفس رابط الزووم.")}</>)}
          {li(<>{t("لا تحتاج إنشاء محاضرة يدوياً — المدرس يضغط \"بدء محاضرة اليوم\" في النظام يولّدها تلقائياً ويحسبها في أرباحه (300 ج).")}</>)}
          {li(<>{t("المحاضرة الموجهة لمجموعة يشوفها أعضاء المجموعة فقط — وبدون مجموعة يشوفها طلاب المدرس المربوطين.")}</>)}
          {li(<>{t("الحضور: المدرس يسجله من \"الحضور والغياب\" ← يختار المحاضرة ← يحدد حاضر/غائب لكل طالب.")}</>)}
        </ul>
      </GuideBlock>

      <GuideBlock icon={Headphones} title={t("٥) نظام المكالمات (الحصص الفردية)")}>
        <ul className="space-y-1.5">
          {li(<>{t("باقة مكالمات = عدد حصص محدد برصيد — الطالب يشوف رصيده وحجوزاته في \"محفظتي\" و\"حصصي الفردية\".")}</>)}
          {li(<>{t("الحجز من عندك فقط: \"نظام المكالمات\" ← اختر مدرس ← اضغط موعداً متاحاً ← اختر الطالب — يخصم حصة من رصيده.")}</>)}
          {li(<>{t("كل حصة محسوبة للمدرس بـ 50 ج — سواء حضر أو لم يحضر أو ألغى متأخراً (أقل من 12 ساعة).")}</>)}
          {li(<>{t("طالب المكالمات فقط (بدون باقة أساسية) لا يرى الكورسات والمحاضرات — حصصه الفردية فقط.")}</>)}
        </ul>
      </GuideBlock>

      <GuideBlock icon={CreditCard} title={t("٦) الاشتراكات والمدفوعات")}>
        <ul className="space-y-1.5">
          {li(<><b>{t("باقات أساسية:")}</b> {t("مدة بالأشهر/الأسابيع + يمكن تحديد عدد حصص أونلاين/أوفلاين.")}</>)}
          {li(<><b>{t("باقات مكالمات:")}</b> {t("عدد حصص + صلاحية بالأيام — أونلاين فقط.")}</>)}
          {li(<><b>{t("طلبات الدفع:")}</b> {t("الطالب يحوّل ويرفع صورة → تراجع الطلب من \"طلبات الدفع\" → الموافقة تفعّل الاشتراك فوراً.")}</>)}
          {li(<><b>{t("الدفع الخارجي (واتساب/كاش):")}</b> {t("\"الطلاب\" ← \"تفعيل اشتراك\" ← اختر الباقة والمبلغ — نفس النتيجة فوراً.")}</>)}
        </ul>
      </GuideBlock>

      <GuideBlock icon={BarChart3} title={t("٧) التحليلات وأرباح المدرسين")}>
        <ul className="space-y-1.5">
          {li(<>{t("المحاضرة المنتهية/الجارية = 300 ج للمدرس — بغض النظر عن عدد الحضور.")}</>)}
          {li(<>{t("حصة المكالمات = 50 ج للمدرس — عند الحضور أو عدم الحضور أو الإلغاء المتأخر.")}</>)}
          {li(<>{t("صفحة \"التحليلات\" تعرض كل مدرس على حدة مع فلترة بالتاريخ والمدرس.")}</>)}
          {li(<>{t("الطالب يرى استهلاكه في \"محفظتي\" — والمدرس يرى أرباحه في \"التحليلات\" عنده.")}</>)}
        </ul>
      </GuideBlock>

      <GuideBlock icon={ClipboardCheck} title={t("٨) سيناريوهات يومية سريعة")}>
        <ul className="space-y-1.5">
          {li(<><b>{t("طالب دفع على واتساب:")}</b> {t("الطلاب ← ابحث عنه ← تفعيل اشتراك ← الباقة والمبلغ.")}</>)}
          {li(<><b>{t("نقل طلاب لمجموعة جديدة:")}</b> {t("الطلاب ← حدد بالـ checkbox ← اختر المجموعة ← أضف المحددين.")}</>)}
          {li(<><b>{t("محاضرة تجريبية مجانية:")}</b> {t("المحاضرة المجانية ← أضف طالب تجربة ← أنشئ المحاضرة بموعد ورابط.")}</>)}
          {li(<><b>{t("متابعة طالب متخلف:")}</b> {t("\"متابعة الطلاب\" عند خدمة العملاء يعرض المتأخرين في الامتحانات.")}</>)}
          {li(<><b>{t("إصدار شهادة:")}</b> {t("الشهادات ← اختر الطالب والمستوى ← تصدر فوراً ويصل الطالب إشعار.")}</>)}
        </ul>
      </GuideBlock>
    </div>
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
  const { t } = useI18n();
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
      setError(e instanceof Error ? e.message : t("تعذر تنفيذ العملية"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold">{t("طلبات الحجز والمدفوعات")} ({requests.length})</h3>
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => onFilterChange(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">{t("الكل")}</option>
              <option value="pending">{t("قيد المراجعة")}</option>
              <option value="approved">{t("مؤكدة")}</option>
              <option value="rejected">{t("مرفوضة")}</option>
            </select>
            <Button variant="secondary" className="min-h-9 px-3 text-xs" onClick={onRefresh}>
              {t("تحديث")}
            </Button>
          </div>
        </div>
        {error && <p className="mt-3 rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}
      </Card>

      {requests.length === 0 ? (
        <Card className="py-12 text-center text-sm text-muted-foreground">
          {t("لا توجد طلبات حجز")} {filter === "pending" ? t("قيد المراجعة") : ""}.
        </Card>
      ) : (
        requests.map((r) => (
          <Card key={r.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <b className="text-sm">{r.student?.fullName ?? t("طالب")}</b>
                <small className="block text-muted-foreground">
                  {r.student?.phone ?? r.student?.email ?? "—"}
                  {r.student?.level && ` · ${t("مستوى")} ${r.student.level}`}
                </small>
                <small className="mt-1 block text-muted-foreground">
                  {new Date(r.createdAt).toLocaleString("ar-EG")}
                  {r.reviewedBy && ` · ${t("راجعه")}: ${r.reviewedBy.fullName}`}
                </small>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={r.status === "approved" ? "sage" : r.status === "rejected" ? "danger" : "gold"}>
                  {r.status === "approved" ? t("مؤكد") : r.status === "rejected" ? t("مرفوض") : t("قيد المراجعة")}
                </Badge>
                <Badge tone="muted">{r.method === "wallet" ? t("محفظة إلكترونية") : "انستاباي"}</Badge>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-md bg-muted/40 p-3 text-sm">
              <b>{r.package?.nameAr}</b>
              <span className="text-muted-foreground">
                {r.package?.price} {t("ج.م")} · {r.package?.durationMonths} {r.package?.durationMonths === 1 ? t("شهر") : t("شهور")}
              </span>
              {r.screenshotUrl && (
                <a
                  href={mediaSrc(r.screenshotUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-brand hover:underline"
                >
                  {t("عرض إثبات التحويل")}
                </a>
              )}
            </div>
            {r.screenshotUrl && /\.(png|jpe?g|webp)$/i.test(r.screenshotUrl) && (
              <img
                src={mediaSrc(r.screenshotUrl)}
                alt={t("إثبات التحويل")}
                className="mt-2 max-h-48 rounded-md border border-border object-contain"
              />
            )}
            {r.status === "rejected" && r.rejectReason && (
              <p className="mt-2 text-xs text-danger">{t("سبب الرفض")}: {r.rejectReason}</p>
            )}

            {r.status === "pending" && (
              <div className="mt-3 space-y-2 border-t border-border pt-3">
                <Input
                  placeholder={t("سبب الرفض (اختياري — يظهر للطالب)")}
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
                    {busyId === r.id ? "..." : t("تأكيد الدفع وتفعيل الاشتراك")}
                  </Button>
                  <Button
                    variant="ghost"
                    className="min-h-9 px-4 text-xs text-danger"
                    disabled={busyId === r.id}
                    onClick={() => handle(r.id, "reject")}
                  >
                    {t("رفض الطلب")}
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
  const { t } = useI18n();
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <Card>
      <h3 className="font-bold">{t("نتائج اختبار تحديد المستوى")} ({results.length})</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("الطلاب الذين أكملوا اختبار تحديد المستوى — مرتبون بالأحدث")}
      </p>
      <div className="mt-4 space-y-2">
        {results.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("لم يكمل أي طالب الاختبار بعد.")}</p>
        ) : (
          results.map((r) => {
            const audios = (r.audioAnswers ?? []).filter((a) => a.audioUrl);
            return (
              <div key={r.id} className="rounded-md border border-border bg-background/60 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <b className="text-sm">{r.fullName}</b>
                    <small className="block text-muted-foreground">
                      {r.phone ?? r.email ?? "—"}
                    </small>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="brand">{t("مستوى")} {r.level}</Badge>
                    <Badge tone="muted">{r.placementScore}%</Badge>
                    {audios.length > 0 && (
                      <Button
                        variant="secondary"
                        className="min-h-8 px-2.5 text-xs"
                        onClick={() => setOpenId(openId === r.id ? null : r.id)}
                      >
                        🎧 {t("التسجيلات")} ({audios.length})
                      </Button>
                    )}
                    <small className="text-muted-foreground">
                      {r.placementCompletedAt ? new Date(r.placementCompletedAt).toLocaleDateString("ar-EG") : ""}
                    </small>
                  </div>
                </div>
                {openId === r.id && audios.length > 0 && (
                  <div className="mt-3 space-y-2 rounded-md border border-dashed border-border bg-muted/30 p-3">
                    <small className="block text-xs font-semibold text-muted-foreground">{t("تسجيلات الطالب الصوتية")}:</small>
                    {audios.map((a, i) => (
                      <audio key={a.questionId} controls src={mediaSrc(a.audioUrl!)} className="w-full" title={`${t("تسجيل")} ${i + 1}`} />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}

const SCH_DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

const DIR_STATUS_LABELS: Record<string, string> = { new: "جديد", active: "نشط", paused: "متوقف", completed: "منتهي" };
const DIR_STATUS_TONES: Record<string, "sage" | "gold" | "brand" | "muted"> = {
  active: "sage", paused: "gold", completed: "brand", new: "muted",
};

function StudentsDirectorySection({
  students,
  groups,
  packages,
  loading,
  onStatusChange,
  onActivate,
  onAddToGroup,
  onDeleteStudent,
  onViewProfile,
  onResetIp,
  onDeleteSubscription,
  onRestoreSessions,
}: {
  students: import("../hooks/use-platform-store").OpsStudentItem[];
  groups: GroupItem[];
  packages: import("../hooks/use-platform-store").OpsPackageItem[];
  loading: boolean;
  onStatusChange: (studentId: string, status: string) => void | Promise<void>;
  onActivate: (input: { studentId: string; packageId: string; paidAmount?: number; notes?: string }) => Promise<void>;
  onAddToGroup: (groupId: string, studentIds: string[]) => Promise<void>;
  onDeleteStudent?: (id: string) => Promise<void>;
  onViewProfile?: (studentId: string) => void;
  onResetIp?: (studentId: string) => Promise<void>;
  onDeleteSubscription?: (id: string) => Promise<void>;
  onRestoreSessions?: (id: string) => Promise<void>;
}) {
  const { t } = useI18n();
  const PAGE_SIZE = 10;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [subFilter, setSubFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkGroupId, setBulkGroupId] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [err, setErr] = useState("");

  // activate-subscription modal
  const [actStudent, setActStudent] = useState<import("../hooks/use-platform-store").OpsStudentItem | null>(null);
  const [actPackageId, setActPackageId] = useState("");
  const [actAmount, setActAmount] = useState("");
  const [actNotes, setActNotes] = useState("");
  const [actSaving, setActSaving] = useState(false);

  const filtered = students.filter((s) => {
    const q = search.trim().toLowerCase();
    if (q && ![s.fullName, s.email ?? "", s.phone ?? ""].some((v) => v.toLowerCase().includes(q))) return false;
    if (statusFilter && s.studentStatus !== statusFilter) return false;
    if (levelFilter && s.level !== levelFilter) return false;
    if (groupFilter && !s.groups.some((g) => g.id === groupFilter)) return false;
    if (subFilter) {
      const actives = s.subscriptions.filter((x) => x.status === "ACTIVE");
      if (subFilter === "active" && actives.length === 0) return false;
      if (subFilter === "none" && actives.length > 0) return false;
      if (subFilter === "basic" && !actives.some((x) => x.package.category === "basic")) return false;
      if (subFilter === "calls" && !actives.some((x) => x.package.category === "calls")) return false;
    }
    return true;
  });

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageIds = pageRows.map((s) => s.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleBulkAdd() {
    if (!bulkGroupId || selected.size === 0) return;
    setBulkSaving(true); setErr(""); setNotice("");
    try {
      await onAddToGroup(bulkGroupId, [...selected]);
      setNotice(`${t("تمت إضافة")} ${selected.size} ${t("طالب إلى المجموعة")}`);
      setSelected(new Set());
      setBulkGroupId("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("فشل إضافة الطلاب للمجموعة"));
    } finally {
      setBulkSaving(false);
    }
  }

  function openActivate(s: import("../hooks/use-platform-store").OpsStudentItem) {
    setActStudent(s);
    setActPackageId("");
    setActAmount("");
    setActNotes("");
    setErr("");
  }

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    if (!actStudent || !actPackageId) return;
    setActSaving(true); setErr("");
    try {
      await onActivate({
        studentId: actStudent.id,
        packageId: actPackageId,
        ...(actAmount ? { paidAmount: Number(actAmount) } : {}),
        ...(actNotes ? { notes: actNotes } : {}),
      });
      setActStudent(null);
      setNotice(`${t("تم تفعيل الاشتراك للطالب")} ${actStudent.fullName}`);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : t("فشل تفعيل الاشتراك"));
    } finally {
      setActSaving(false);
    }
  }

  const activeSubsOf = (s: import("../hooks/use-platform-store").OpsStudentItem) =>
    s.subscriptions.filter((x) => x.status === "ACTIVE");

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold">{t("دليل الطلاب")} ({filtered.length} / {students.length})</h2>
            <p className="text-xs text-muted-foreground">{t("بحث وفلترة كاملة — حدد طلاباً لضمهم لمجموعة أو فعّل اشتراكاً يدوياً")}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder={t("بحث بالاسم / الهاتف / الإيميل")} />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">{t("كل الحالات")}</option>
            <option value="new">{t("جديد")}</option>
            <option value="active">{t("نشط")}</option>
            <option value="paused">{t("متوقف")}</option>
            <option value="completed">{t("منتهي")}</option>
          </select>
          <select value={levelFilter} onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">{t("كل المستويات")}</option>
            {PLATFORM_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={groupFilter} onChange={(e) => { setGroupFilter(e.target.value); setPage(1); }} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">{t("كل المجموعات")}</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <select value={subFilter} onChange={(e) => { setSubFilter(e.target.value); setPage(1); }} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">{t("كل الاشتراكات")}</option>
            <option value="active">{t("لديه اشتراك نشط")}</option>
            <option value="none">{t("بدون اشتراك")}</option>
            <option value="basic">{t("باقة أساسية")}</option>
            <option value="calls">{t("باقة مكالمات")}</option>
          </select>
        </div>

        {notice && <p className="mt-3 rounded-md bg-sage/15 p-2.5 text-xs font-semibold text-sage">{notice}</p>}
        {err && <p className="mt-3 rounded-md bg-danger/10 p-2.5 text-xs font-semibold text-danger">{err}</p>}

        {selected.size > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-brand/30 bg-brand/5 p-3">
            <span className="text-sm font-bold">{selected.size} {t("طالب محدد")}</span>
            <select value={bulkGroupId} onChange={(e) => setBulkGroupId(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
              <option value="">— {t("اختر المجموعة")} —</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <Button variant="primary" className="min-h-9 text-xs" disabled={!bulkGroupId || bulkSaving} onClick={handleBulkAdd}>
              {bulkSaving ? t("جاري الإضافة...") : t("أضف المحددين للمجموعة")}
            </Button>
            <Button variant="ghost" className="min-h-9 px-3 text-xs" onClick={() => setSelected(new Set())}>
              {t("إلغاء التحديد")}
            </Button>
          </div>
        )}
      </Card>

      <Card className="overflow-x-auto p-0">
        {loading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">{t("جاري التحميل...")}</div>
        ) : pageRows.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">{t("لا يوجد طلاب مطابقون للفلاتر.")}</div>
        ) : (
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                <th className="w-10 p-3 text-start">
                  <input type="checkbox" checked={allPageSelected} onChange={toggleAll} className="size-4 accent-brand" />
                </th>
                <th className="p-3 text-start">{t("الطالب")}</th>
                <th className="p-3 text-start">{t("المستوى")}</th>
                <th className="p-3 text-start">{t("الحالة")}</th>
                <th className="p-3 text-start">{t("المجموعات")}</th>
                <th className="p-3 text-start">{t("الاشتراك")}</th>
                <th className="p-3 text-start">{t("المدرس")}</th>
                <th className="p-3 text-start">{t("إجراءات")}</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((s) => {
                const subs = activeSubsOf(s);
                return (
                  <tr key={s.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                    <td className="p-3">
                      <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} className="size-4 accent-brand" />
                    </td>
                    <td className="p-3">
                      <b className="block text-sm">{s.fullName}</b>
                      <small className="block text-muted-foreground">{s.phone ?? s.email ?? "—"}</small>
                      <small className="block text-[11px] text-muted-foreground/70">{t("انضم")} {s.createdAt}</small>
                    </td>
                    <td className="p-3">
                      {s.level ? <Badge tone="muted">{s.level}{s.placementScore != null ? ` · ${s.placementScore}%` : ""}</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="p-3">
                      <Badge tone={DIR_STATUS_TONES[s.studentStatus] ?? "muted"}>
                        {t(DIR_STATUS_LABELS[s.studentStatus] ?? s.studentStatus)}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex max-w-[160px] flex-wrap gap-1">
                        {s.groups.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          s.groups.map((g) => <Badge key={g.id} tone="muted">{g.name}</Badge>)
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      {subs.length === 0 ? (
                        <span className="text-xs text-muted-foreground">{t("بدون اشتراك")}</span>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          {subs.map((sub) => (
                            <div key={sub.id} className="text-xs">
                              <Badge tone={sub.package.category === "calls" ? "gold" : "brand"}>{sub.package.nameAr}</Badge>
                              {sub.sessionsRemaining != null && (
                                <small className="mt-0.5 block text-muted-foreground">{t("متبقي")} {sub.sessionsRemaining} {t("حصة")}</small>
                              )}
                              {(onDeleteSubscription || onRestoreSessions) && (
                                <span className="mt-0.5 flex gap-1">
                                  {sub.sessionsTotal != null && onRestoreSessions && (
                                    <button
                                      title={t("استرجاع الحصص من الأول")}
                                      onClick={async () => {
                                        if (!confirm(`${t("استرجاع حصص")} "${sub.package.nameAr}"؟`)) return;
                                        try { await onRestoreSessions(sub.id); setNotice(t("تم استرجاع الحصص")); } catch (e) { setErr(e instanceof Error ? e.message : t("فشل الاسترجاع")); }
                                      }}
                                      className="rounded px-1.5 py-0.5 text-[10px] font-bold text-brand hover:bg-brand/10"
                                    >↺</button>
                                  )}
                                  {onDeleteSubscription && (
                                    <button
                                      title={t("حذف الباقة نهائياً")}
                                      onClick={async () => {
                                        if (!confirm(`${t("حذف باقة")} "${sub.package.nameAr}"؟`)) return;
                                        try { await onDeleteSubscription(sub.id); setNotice(t("تم حذف الباقة")); } catch (e) { setErr(e instanceof Error ? e.message : t("فشل الحذف")); }
                                      }}
                                      className="rounded px-1.5 py-0.5 text-[10px] font-bold text-danger hover:bg-danger/10"
                                    >✕</button>
                                  )}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {s.teachers.length === 0 ? "—" : s.teachers.map((t) => t.name).join("، ")}
                    </td>
                    <td className="p-3">
                      {onResetIp && (
                        <div className="mb-1 flex items-center gap-1.5 font-lat text-[10px] text-muted-foreground">
                          <span>{s.boundIp ?? "—"}</span>
                          {s.boundIp && (
                            <button
                              title={t("تصفير الجهاز — يسمح للطالب بالدخول من جهاز جديد")}
                              className="rounded px-1.5 py-0.5 text-[10px] font-bold text-danger hover:bg-danger/10"
                              onClick={async () => { if (confirm(`${t("تصفير الجهاز للطالب")} "${s.fullName}"؟`)) await onResetIp(s.id); }}
                            >
                              reset
                            </button>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        {onViewProfile && (
                          <Button variant="secondary" className="min-h-8 px-2.5 text-xs" onClick={() => onViewProfile(s.id)}>
                            {t("الملف")}
                          </Button>
                        )}
                        <Button variant="primary" className="min-h-8 px-2.5 text-xs" onClick={() => openActivate(s)}>
                          {t("تفعيل اشتراك")}
                        </Button>
                        <select
                          value=""
                          onChange={(e) => { if (e.target.value) void onStatusChange(s.id, e.target.value); }}
                          className="h-8 rounded-md border border-input bg-background px-1.5 text-xs"
                        >
                          <option value="">{t("الحالة")}</option>
                          <option value="new">{t("جديد")}</option>
                          <option value="active">{t("نشط")}</option>
                          <option value="paused">{t("متوقف")}</option>
                          <option value="completed">{t("منتهي")}</option>
                        </select>
                        {onDeleteStudent && (
                          <Button
                            variant="danger"
                            className="min-h-8 px-2.5 text-xs"
                            onClick={async () => {
                              if (!confirm(`${t("حذف الطالب")} ${s.fullName}؟ ${t("لا يمكن التراجع.")}`)) return;
                              try {
                                await onDeleteStudent(s.id);
                                setNotice(`${t("تم حذف الطالب")} ${s.fullName}`);
                              } catch (e) {
                                setErr(e instanceof Error ? e.message : t("فشل حذف الطالب"));
                              }
                            }}
                          >
                            {t("حذف")}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <div className="border-t border-border p-3">
          <Pagination page={currentPage} pages={pages} total={filtered.length} size={PAGE_SIZE} onPage={setPage} />
        </div>
      </Card>

      {/* Activate subscription modal */}
      {actStudent && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setActStudent(null)}>
          <Card className="w-full max-w-md">
            <div onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold">{t("تفعيل اشتراك")} — {actStudent.fullName}</h3>
            <p className="text-xs text-muted-foreground">{t("للطالب الذي دفع خارج المنصة (واتساب / كاش / تحويل)")}</p>
            {activeSubsOf(actStudent).length > 0 && (
              <div className="mt-3 rounded-md border border-gold/40 bg-gold/10 p-3 text-xs">
                <b className="text-gold">⚠ {t("تنبيه: الطالب مشترك بالفعل في")}:</b>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {activeSubsOf(actStudent).map((sub) => (
                    <Badge key={sub.id} tone="gold">
                      {sub.package.nameAr}
                      {sub.sessionsRemaining != null ? ` · ${t("متبقي")} ${sub.sessionsRemaining} ${t("حصة")}` : ""}
                    </Badge>
                  ))}
                </div>
                <p className="mt-1.5 text-muted-foreground">{t("التفعيل الجديد هيتضاف كاشتراك منفصل بجانب الموجود — مش بديل له.")}</p>
              </div>
            )}
            <form onSubmit={handleActivate} className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label>{t("الباقة")}</Label>
                <select value={actPackageId} onChange={(e) => setActPackageId(e.target.value)} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">— {t("اختر الباقة")} —</option>
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nameAr} — {p.price} {t("ج")} {p.category === "calls" ? `(${t("مكالمات")})` : ""}{p.sessionsTotal ? ` · ${p.sessionsTotal} ${t("حصة")}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("المبلغ المدفوع (اختياري — الافتراضي سعر الباقة)")}</Label>
                <Input type="number" min="0" step="0.01" value={actAmount} onChange={(e) => setActAmount(e.target.value)} placeholder={t("سعر الباقة")} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("ملاحظات (اختياري)")}</Label>
                <Input value={actNotes} onChange={(e) => setActNotes(e.target.value)} placeholder={t("مثال: دفع واتساب — محفظة")} />
              </div>
              {err && <p className="rounded-md bg-danger/10 p-2 text-xs font-semibold text-danger">{err}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={actSaving || !actPackageId} className="flex-1">
                  {actSaving ? t("جاري التفعيل...") : t("تفعيل الاشتراك")}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setActStudent(null)}>
                  {t("إلغاء")}
                </Button>
              </div>
            </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function AdminSchedulesSection({
  schedules,
  teachers,
  groups,
  availability,
  onFetchAvailability,
  onCreate,
  onUpdate,
  onDelete,
}: {
  schedules: WeeklyScheduleItem[];
  teachers: { id: string; fullName: string; specialty?: string | null }[];
  groups: GroupItem[];
  availability: any[];
  onFetchAvailability: (teacherId: string) => Promise<void>;
  onCreate: (input: CreateScheduleInput) => Promise<void>;
  onUpdate: (id: string, input: Partial<CreateScheduleInput>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const { t } = useI18n();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [teacherId, setTeacherId] = useState("");
  const [title, setTitle] = useState("");
  const [groupId, setGroupId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("19:30");
  const [location, setLocation] = useState<"online" | "offline">("online");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [pickedSlot, setPickedSlot] = useState<string | null>(null);

  useEffect(() => {
    if (teacherId && showForm && !editId) onFetchAvailability(teacherId).catch(() => {});
  }, [teacherId, showForm, editId]); // eslint-disable-line react-hooks/exhaustive-deps

  const weeklySlots = (availability ?? []).filter((a) => !a.specificDate && a.isActive !== false);

  function pickSlot(a: any) {
    setDayOfWeek(a.dayOfWeek);
    setStartTime(a.startTime);
    setEndTime(a.endTime);
    setPickedSlot(a.id);
  }

  function resetForm() {
    setTeacherId(""); setTitle(""); setGroupId(""); setDayOfWeek(0);
    setStartTime("18:00"); setEndTime("19:30"); setLocation("online"); setMeetingUrl("");
    setPickedSlot(null); setEditId(null); setShowForm(false); setErr("");
  }

  function startEdit(s: WeeklyScheduleItem) {
    setEditId(s.id);
    setTeacherId(s.teacherId);
    setTitle(s.title);
    setGroupId(s.groupId ?? "");
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
      setErr(t("العنوان والمدرس مطلوبان"));
      return;
    }
    setSaving(true);
    try {
      const input: CreateScheduleInput = {
        teacherId, title, dayOfWeek, startTime, endTime, location,
        ...(groupId ? { groupId } : {}),
        ...(location === "online" && meetingUrl ? { meetingUrl } : {}),
      };
      if (editId) await onUpdate(editId, input);
      else await onCreate(input);
      resetForm();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : t("فشل حفظ الموعد"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold">{t("المواعيد الأسبوعية الثابتة")} ({schedules.length})</h2>
            <p className="text-xs text-muted-foreground">
              {t("المعاد الثابت للمجموعة كل أسبوع — بنفس رابط الاجتماع. اختر مدرساً ثم اضغط على أحد مواعيده المتاحة.")}
            </p>
          </div>
          <Button variant="secondary" className="text-xs" onClick={() => (showForm ? resetForm() : setShowForm(true))}>
            {showForm ? t("إلغاء") : t("+ موعد جديد")}
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-md border border-border bg-muted/40 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>{t("عنوان الموعد")}</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder={t("مثال: محاضرة أسبوعية — قواعد")} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("المدرس")}</Label>
                <select
                  value={teacherId}
                  onChange={(e) => { setTeacherId(e.target.value); setPickedSlot(null); }}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">— {t("اختر المدرس")} —</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.fullName}{t.specialty ? ` — ${t.specialty}` : ""}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("المجموعة (اختياري)")}</Label>
                <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">— {t("بدون مجموعة")} —</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              {teacherId && !editId && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>{t("اختر من مواعيد المدرس المتاحة")}</Label>
                  {weeklySlots.length === 0 ? (
                    <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-800">
                      {t("هذا المدرس لم يضف مواعيد أسبوعية متاحة بعد — يمكنك إدخال اليوم والوقت يدوياً.")}
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {weeklySlots.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => pickSlot(a)}
                          className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                            pickedSlot === a.id
                              ? "border-brand bg-brand text-white"
                              : "border-border bg-background hover:border-brand/50"
                          }`}
                        >
                          {t(SCH_DAY_NAMES[a.dayOfWeek]!)} · {a.startTime}–{a.endTime}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <Label>{t("اليوم")}</Label>
                <select value={dayOfWeek} onChange={(e) => { setDayOfWeek(Number(e.target.value)); setPickedSlot(null); }} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  {SCH_DAY_NAMES.map((d, i) => <option key={i} value={i}>{t(d)}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("النوع")}</Label>
                <select value={location} onChange={(e) => setLocation(e.target.value as "online" | "offline")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="online">{t("أونلاين")}</option>
                  <option value="offline">{t("أوفلاين (حضوري)")}</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("من")}</Label>
                <Input type="time" value={startTime} onChange={(e) => { setStartTime(e.target.value); setPickedSlot(null); }} required />
              </div>
              <div className="space-y-1.5">
                <Label>{t("إلى")}</Label>
                <Input type="time" value={endTime} onChange={(e) => { setEndTime(e.target.value); setPickedSlot(null); }} required />
              </div>
              {location === "online" && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>{t("رابط الاجتماع الثابت (Zoom / Meet)")}</Label>
                  <Input value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} type="url" dir="ltr" placeholder="https://zoom.us/j/..." />
                  <p className="text-xs text-muted-foreground">{t("نفس الرابط يظهر للطالب والمدرس كل أسبوع.")}</p>
                </div>
              )}
            </div>
            {err && <p className="text-sm font-semibold text-danger">{err}</p>}
            <Button type="submit" disabled={saving}>
              {saving ? t("جاري الحفظ...") : editId ? t("حفظ التعديل") : t("إضافة الموعد")}
            </Button>
          </form>
        )}
      </Card>

      <div className="space-y-2">
        {schedules.length === 0 ? (
          <Card className="py-10 text-center text-sm text-muted-foreground">{t("لا توجد مواعيد أسبوعية بعد.")}</Card>
        ) : (
          schedules.map((s) => (
            <Card key={s.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <b className="text-sm">{s.title}</b>
                    <Badge tone={s.location === "online" ? "brand" : "gold"}>
                      {s.location === "online" ? t("أونلاين") : t("أوفلاين")}
                    </Badge>
                    <Badge tone={s.isActive ? "sage" : "danger"}>{s.isActive ? t("مفعل") : t("معطل")}</Badge>
                    {(s.group?.name ?? s.groupName) && <Badge tone="muted">{s.group?.name ?? s.groupName}</Badge>}
                  </div>
                  <small className="mt-1 block text-muted-foreground">
                    {t("المدرس")}: {s.teacher?.fullName ?? "—"} · {t("كل")} {t(SCH_DAY_NAMES[s.dayOfWeek]!)} · {s.startTime}–{s.endTime}
                  </small>
                  {s.meetingUrl && (
                    <a href={s.meetingUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-semibold text-brand hover:underline">
                      {t("رابط الاجتماع الثابت ↗")}
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" className="min-h-7 px-2.5 text-xs" onClick={() => startEdit(s)}>
                    {t("تعديل")}
                  </Button>
                  <Button
                    variant="ghost"
                    className="min-h-7 px-2.5 text-xs"
                    onClick={() => onUpdate(s.id, { isActive: !s.isActive }).catch(() => {})}
                  >
                    {s.isActive ? t("تعطيل") : t("تفعيل")}
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
  onCreate: (input: { nameAr: string; description?: string; price: number; durationMonths: number; features?: string[]; teacherId?: string; packageType?: "subscription" | "sessions"; sessionsTotal?: number | null; validityDays?: number | null; sessionDurationMinutes?: number | null; category?: "basic" | "calls"; studyMode?: "online" | "offline" | "both"; level?: string | null; durationUnit?: "month" | "week" }) => Promise<void>;
  onUpdate: (id: string, input: { nameAr?: string; description?: string; price?: number; durationMonths?: number; teacherId?: string; isActive?: boolean; packageType?: "subscription" | "sessions"; sessionsTotal?: number | null; validityDays?: number | null; sessionDurationMinutes?: number | null; category?: "basic" | "calls"; studyMode?: "online" | "offline" | "both"; level?: string | null; durationUnit?: "month" | "week" }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const { t } = useI18n();
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
  const [pSessionDuration, setPSessionDuration] = useState("60");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  function resetForm() {
    setPName(""); setPDesc(""); setPPrice(""); setPMonths("1"); setPFeatures(""); setPTeacherId("");
    setPCategory("basic"); setPStudyMode("online"); setPLevel(""); setPDurationUnit("month");
    setPPackageType("subscription"); setPSessionsTotal(""); setPValidityDays(""); setPSessionDuration("60");
    setEditId(null);
  }

  function startEdit(p: AdminPackage) {
    setPName(p.nameAr); setPDesc(p.description ?? ""); setPPrice(String(p.price));
    setPMonths(String(p.durationMonths)); setPFeatures(Array.isArray(p.features) ? p.features.join("\n") : "");
    setPTeacherId(p.teacher?.id ?? ""); setPCategory(p.category === "calls" ? "calls" : "basic");
    setPStudyMode(p.studyMode === "offline" || p.studyMode === "both" ? p.studyMode : "online");
    setPLevel(p.level ?? ""); setPDurationUnit(p.durationUnit === "week" ? "week" : "month");
    setPPackageType(p.packageType === "sessions" ? "sessions" : "subscription");
    setPSessionsTotal(p.sessionsTotal != null ? String(p.sessionsTotal) : "");
    setPValidityDays(p.validityDays != null ? String(p.validityDays) : "");
    setPSessionDuration(p.sessionDurationMinutes != null ? String(p.sessionDurationMinutes) : "60");
    setEditId(p.id); setShowForm(true); setErr("");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setSaving(true);
    try {
      const input = {
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
        sessionDurationMinutes: pCategory === "calls" && pSessionDuration ? Number(pSessionDuration) : null,
        description: pDesc || undefined,
        features: pFeatures.trim() ? pFeatures.split("\n").map((f) => f.trim()).filter(Boolean) : undefined,
        teacherId: pTeacherId || undefined,
      };
      if (editId) await onUpdate(editId, input);
      else await onCreate(input);
      resetForm();
      setShowForm(false);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : editId ? t("فشل تعديل الباقة") : t("فشل إنشاء الباقة"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">{t("الباقات والأسعار")} ({packages.length})</h2>
            <p className="text-xs text-muted-foreground">{t("الأسعار المعتمدة — السيلز يشوفها ولا يقدر يعدّلها")}</p>
          </div>
          <Button variant="secondary" className="text-xs" onClick={() => { if (showForm) resetForm(); setShowForm(!showForm); }}>
            {showForm ? t("إلغاء") : t("+ باقة جديدة")}
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="mt-4 space-y-3 rounded-md border border-border bg-muted/40 p-4">
            {editId && <p className="rounded-md bg-brand/10 px-3 py-2 text-xs font-bold text-brand">{t("وضع التعديل — بتعدّل باقة موجودة، كل الحقول متاحة")}</p>}
            {/* Category */}
            <div className="space-y-1.5">
              <Label>{t("نظام الباقة")}</Label>
              <div className="flex gap-2">
                <label className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <input type="radio" name="category" checked={pCategory === "basic"} onChange={() => setPCategory("basic")} />
                  {t("باقة أساسية (أونلاين/حضوري)")}
                </label>
                <label className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <input type="radio" name="category" checked={pCategory === "calls"} onChange={() => { setPCategory("calls"); setPStudyMode("online"); }} />
                  {t("نظام المكالمات (أونلاين فقط)")}
                </label>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t("اسم الباقة")}</Label>
                <Input value={pName} onChange={(e) => setPName(e.target.value)} required placeholder={t("مثال: مستوى A1 كامل")} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("السعر")}</Label>
                <Input type="number" min={0} step="0.01" value={pPrice} onChange={(e) => setPPrice(e.target.value)} required placeholder="500" />
              </div>
              <div className="space-y-1.5">
                <Label>{t("المدة")}</Label>
                <div className="flex gap-2">
                  <Input type="number" min={1} value={pMonths} onChange={(e) => setPMonths(e.target.value)} className="flex-1" />
                  <select value={pDurationUnit} onChange={(e) => setPDurationUnit(e.target.value as "month" | "week")} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="month">{t("شهر")}</option>
                    <option value="week">{t("أسبوع")}</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t("المستوى")}</Label>
                <select value={pLevel} onChange={(e) => setPLevel(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">— {t("بدون مستوى محدد")} —</option>
                  {PLATFORM_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              {/* Study mode — hidden for calls (online only) */}
              {pCategory === "basic" && (
                <div className="space-y-1.5">
                  <Label>{t("نظام الدراسة")}</Label>
                  <select value={pStudyMode} onChange={(e) => setPStudyMode(e.target.value as "online" | "offline" | "both")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="online">{t("أونلاين")}</option>
                    <option value="offline">{t("حضوري")}</option>
                    <option value="both">{t("أونلاين + حضوري")}</option>
                  </select>
                </div>
              )}

              {/* Session count — for calls / sessions packages */}
              <div className="space-y-1.5">
                <Label>{t("نوع الباقة")}</Label>
                <select value={pPackageType} onChange={(e) => setPPackageType(e.target.value as "subscription" | "sessions")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="subscription">{t("اشتراك زمني")}</option>
                  <option value="sessions">{t("باقة بعدد حصص")}</option>
                </select>
              </div>
              {pPackageType === "sessions" && (
                <div className="space-y-1.5">
                  <Label>{t("عدد الحصص")}</Label>
                  <Input type="number" min={1} value={pSessionsTotal} onChange={(e) => setPSessionsTotal(e.target.value)} placeholder="12 / 20 / 28" />
                </div>
              )}
              {pPackageType === "sessions" && (
                <div className="space-y-1.5">
                  <Label>{t("صلاحية الباقة (أيام)")}</Label>
                  <Input type="number" min={1} value={pValidityDays} onChange={(e) => setPValidityDays(e.target.value)} placeholder="90" />
                </div>
              )}

              {/* Session duration — calls packages only */}
              {pCategory === "calls" && (
                <div className="space-y-1.5">
                  <Label>{t("مدة الحصة")}</Label>
                  <select value={pSessionDuration} onChange={(e) => setPSessionDuration(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="30">{t("30 دقيقة")}</option>
                    <option value="60">{t("ساعة")}</option>
                    <option value="90">{t("ساعة ونصف")}</option>
                  </select>
                  <small className="text-muted-foreground">{t("اعمل باقة مختلفة بسعر مختلف لكل مدة (30 / 60 / 90)")}</small>
                </div>
              )}

              <div className="space-y-1.5 sm:col-span-2">
                <Label>{t("الوصف")}</Label>
                <Input value={pDesc} onChange={(e) => setPDesc(e.target.value)} placeholder={t("وصف مختصر للباقة")} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>{t("المدرس المسؤول عن الباقة")}</Label>
                <select value={pTeacherId} onChange={(e) => setPTeacherId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">— {t("بدون مدرس محدد")} —</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                </select>
                <small className="text-muted-foreground">{t("يظهر اسم المدرس وتخصصه مع الباقة في الصفحة الرئيسية")}</small>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>{t("المميزات (سطر لكل ميزة)")}</Label>
                <textarea value={pFeatures} onChange={(e) => setPFeatures(e.target.value)} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder={t("24 محاضرة لايف\nواجبات أسبوعية\nشهادة إتمام")} />
              </div>
            </div>
            {err && <p className="text-sm font-semibold text-danger">{err}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? t("جاري الحفظ...") : editId ? t("حفظ التعديلات") : t("إنشاء الباقة")}</Button>
              {editId && <Button type="button" variant="secondary" onClick={() => { resetForm(); setShowForm(false); }}>{t("إلغاء التعديل")}</Button>}
            </div>
          </form>
        )}
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {packages.length === 0 ? (
          <Card className="col-span-full py-10 text-center text-sm text-muted-foreground">{t("لا توجد باقات بعد.")}</Card>
        ) : (
          packages.map((p) => (
            <Card key={p.id}>
              <div className="flex items-start justify-between">
                <div>
                  <b>{p.nameAr}</b>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge tone={p.category === "calls" ? "gold" : "brand"}>{p.category === "calls" ? t("مكالمات") : t("أساسية")}</Badge>
                    <Badge tone="muted">{p.durationMonths} {p.durationUnit === "week" ? t("أسبوع") : t("شهر")}</Badge>
                    {p.level && <Badge tone="muted">{p.level}</Badge>}
                    {p.studyMode && <Badge tone="muted">{p.studyMode === "online" ? t("أونلاين") : p.studyMode === "offline" ? t("حضوري") : t("أونلاين+حضوري")}</Badge>}
                    {p.sessionsTotal && <Badge tone="gold">{p.sessionsTotal} {t("حصة")}</Badge>}
                    {p.sessionDurationMinutes && <Badge tone="gold">{t("حصة")} {p.sessionDurationMinutes === 90 ? t("ساعة ونصف") : p.sessionDurationMinutes === 60 ? t("ساعة") : `${p.sessionDurationMinutes} ${t("دقيقة")}`}</Badge>}
                    {p.packageType === "sessions" && <Badge tone="muted">{t("باقة حصص")}</Badge>}
                    {p.validityDays && <Badge tone="muted">{t("صالحة")} {p.validityDays} {t("يوم")}</Badge>}
                  </div>
                  <p className="mt-1 font-lat text-2xl font-bold text-brand">${p.price}</p>
                </div>
                <Badge tone={p.isActive ? "sage" : "muted"}>{p.isActive ? t("مفعلة") : t("معطلة")}</Badge>
              </div>
              {p.description && <p className="mt-2 text-xs text-muted-foreground">{p.description}</p>}
              {p.teacher && (
                <p className="mt-2 text-xs font-semibold text-brand2">
                  {t("المدرس")}: {p.teacher.fullName}{p.teacher.specialty ? ` — ${p.teacher.specialty}` : ""}
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
                <small className="text-muted-foreground">{p._count?.subscriptions ?? 0} {t("اشتراك")}</small>
                <div className="flex gap-1.5">
                  {p.category === "calls" && (
                    <select
                      value={p.sessionDurationMinutes ?? 60}
                      onChange={(e) => onUpdate(p.id, { sessionDurationMinutes: Number(e.target.value) }).catch(() => {})}
                      className="h-7 rounded-md border border-input bg-background px-1.5 text-[10px]"
                      title={t("مدة الحصة")}
                    >
                      <option value={30}>30 {t("د")}</option>
                      <option value={60}>{t("ساعة")}</option>
                      <option value={90}>{t("ساعة ونصف")}</option>
                    </select>
                  )}
                  <select
                    value={p.teacher?.id ?? ""}
                    onChange={(e) => onUpdate(p.id, { teacherId: e.target.value || undefined }).catch(() => {})}
                    className="h-7 max-w-[120px] rounded-md border border-input bg-background px-1.5 text-[10px]"
                    title={t("تغيير المدرس")}
                  >
                    <option value="">{t("بدون مدرس")}</option>
                    {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                  </select>
                  <Button variant="ghost" className="min-h-7 px-2 py-1 text-xs" onClick={() => startEdit(p)}>
                    {t("تعديل")}
                  </Button>
                  <Button variant="ghost" className="min-h-7 px-2 py-1 text-xs" onClick={() => onUpdate(p.id, { isActive: !p.isActive })}>
                    {p.isActive ? t("تعطيل") : t("تفعيل")}
                  </Button>
                  <button
                    onClick={async () => {
                      if (!confirm(`${t("حذف الباقة")} "${p.nameAr}"؟ ${t("سيتم حذف اشتراكاتها وطلبات حجزها معها.")}`)) return;
                      try {
                        await onDelete(p.id);
                      } catch (err) {
                        alert(err instanceof Error ? err.message : t("فشل حذف الباقة"));
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
        <h2 className="text-lg font-bold">{t("كل الاشتراكات")} ({subscriptions.length})</h2>
        <div className="mt-4 space-y-2">
          {subscriptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("لا توجد اشتراكات بعد.")}</p>
          ) : (
            subscriptions.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-background/60 p-3">
                <div>
                  <b className="text-sm">{s.student.fullName}</b>
                  <small className="block text-muted-foreground">{s.package.nameAr} · {t("بواسطة")} {s.createdBy.fullName}</small>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={s.paymentStatus === "PAID" ? "sage" : "gold"}>{s.paymentStatus === "PAID" ? t("مدفوع") : t("معلق")}</Badge>
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
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{t("تقرير المبيعات الإجمالي")}</h2>
          <Button variant="secondary" className="text-xs" onClick={() => onRefresh()}>{t("تحديث")}</Button>
        </div>
        {report && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {[
              { label: t("إجمالي العملاء"), value: report.totals.leads },
              { label: t("غير مخصصين"), value: report.totals.unassigned },
              { label: t("المكالمات"), value: report.totals.calls },
              { label: t("الاشتراكات"), value: report.totals.subscriptions },
              { label: t("المدفوعة"), value: report.totals.paidSubscriptions },
              { label: t("الإيرادات"), value: `$${report.totals.revenue}` },
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
        <h2 className="text-lg font-bold">{t("أداء كل موظف سيلز")}</h2>
        <div className="mt-4 space-y-2">
          {!report || report.perSales.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("لا يوجد موظفو سيلز بعد.")}</p>
          ) : (
            report.perSales.map((s) => (
              <div key={s.salesId} className="rounded-md border border-border bg-background/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <b className="text-sm">{s.name}</b>
                    <small className="block text-muted-foreground">{s.email ?? "—"}</small>
                  </div>
                  <Badge tone="brand">{t("تحويل")} {s.conversionRate}%</Badge>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
                  {[
                    { l: t("عملاء"), v: s.leads },
                    { l: t("جدد"), v: s.newLeads },
                    { l: t("محوّلون"), v: s.converted },
                    { l: t("مفقودون"), v: s.lost },
                    { l: t("مكالمات"), v: s.calls },
                    { l: t("إيراد"), v: `$${s.revenue}` },
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
  const { t } = useI18n();
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
          <h2 className="text-lg font-bold">{t("توزيع العملاء على السيلز")} ({leads.length})</h2>
          <p className="text-xs text-muted-foreground">{t("خصّص كل عميل لموظف لقياس أدائه — أو اتركه غير مخصص")}</p>
        </div>
        <div className="flex gap-1.5">
          {(["all", "unassigned", "assigned"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1 text-xs ${filter === f ? "bg-brand text-white" : "bg-muted/60 text-muted-foreground"}`}
            >
              {f === "all" ? t("الكل") : f === "unassigned" ? t("غير مخصص") : t("مخصص")}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">{t("لا توجد عملاء في هذا الفلتر.")}</div>
        ) : (
          filtered.map((lead) => (
            <div key={lead.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-background/60 p-3">
              <div>
                <b className="text-sm">{lead.name}</b>
                <small className="block text-muted-foreground">
                  {lead.phone ?? lead.email ?? "—"} · {lead.need ?? "—"} · {lead._count?.callLogs ?? 0} {t("مكالمة")}
                </small>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={lead.stage === "converted" ? "sage" : lead.stage === "lost" ? "danger" : lead.stage === "interested" ? "gold" : "muted"}>
                  {t(STAGE_LABELS[lead.stage] ?? lead.stage)}
                </Badge>
                <select
                  value={lead.salesId ?? ""}
                  onChange={(e) => onAssign(lead.id, e.target.value || null).catch(() => {})}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="">{t("غير مخصص")}</option>
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
  const { t } = useI18n();
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
      setErr(e2 instanceof Error ? e2.message : t("فشل إصدار الشهادة"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={Award}
        tone="gold"
        title={t("الشهادات")}
        subtitle={<>{t("تم إصدار")} <b>{certificates.length}</b> {t("شهادة — تصدر فقط من الإدارة عند استيفاء شروط النجاح")}</>}
        actions={
          <Button className="min-h-11 px-5" onClick={() => setShowForm(!showForm)}>
            <PlusCircle className="size-4" />
            {showForm ? t("إلغاء") : t("إصدار شهادة")}
          </Button>
        }
      />
      {showForm && (
        <Card>
          <form onSubmit={handleIssue} className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t("الطالب")}</Label>
                <select value={cStudentId} onChange={(e) => setCStudentId(e.target.value)} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">— {t("اختر الطالب")} —</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.fullName} — {s.phone ?? s.email ?? "—"}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("المستوى")}</Label>
                <select value={cLevel} onChange={(e) => setCLevel(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  {PLATFORM_LEVELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>{t("عنوان الشهادة")}</Label>
                <Input value={cTitle} onChange={(e) => setCTitle(e.target.value)} required placeholder={t("مثال: شهادة إتمام مستوى A1 — עברית שוטפת")} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>{t("وصف / ملاحظات")}</Label>
                <Input value={cDesc} onChange={(e) => setCDesc(e.target.value)} placeholder={t("اختياري")} />
              </div>
            </div>
            {err && <p className="text-sm font-semibold text-danger">{err}</p>}
            <Button type="submit" disabled={saving}>{saving ? t("جاري الإصدار...") : t("إصدار الشهادة")}</Button>
          </form>
        </Card>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {certificates.length === 0 ? (
          <Card className="col-span-full py-10 text-center text-sm text-muted-foreground">{t("لم تصدر أي شهادات بعد.")}</Card>
        ) : (
          certificates.map((c) => (
            <Card key={c.id} className="p-6">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <span className="grid size-12 place-items-center rounded-2xl bg-gold/15 text-gold">
                    <Award className="size-5" />
                  </span>
                  <div>
                    <b className="text-sm">{c.title}</b>
                    <small className="block text-muted-foreground">
                      {c.student.fullName} · {c.student.phone ?? c.student.email ?? "—"}
                    </small>
                    <small className="block text-muted-foreground">
                      {new Date(c.issuedAt).toLocaleDateString("ar-EG")}
                      {c.issuedBy && ` · ${t("بواسطة")} ${c.issuedBy.fullName}`}
                    </small>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {c.level && <Badge tone="gold">{c.level}</Badge>}
                  <button onClick={() => onDelete(c.id).catch(() => {})} className="grid size-9 place-items-center rounded-xl bg-muted/70 text-muted-foreground hover:bg-danger/10 hover:text-danger">
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

// Wraps student screens that belong to basic packages — students with only a
// calls package get individual sessions only and see a notice instead.
export function CallsOnlyGuard({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { hasCallsPackage, hasBasicPackage, fetchHasCallsPackage } = usePlatformStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await fetchHasCallsPackage();
      } finally {
        if (alive) setChecking(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (checking) {
    return (
      <AppShell role="STUDENT">
        <div className="py-16 text-center text-sm text-muted-foreground">{t("جاري التحقق من اشتراكك...")}</div>
      </AppShell>
    );
  }

  if (hasCallsPackage && !hasBasicPackage) {
    return (
      <AppShell role="STUDENT">
        <Card className="mx-auto mt-10 max-w-md p-8 text-center">
          <h2 className="text-lg font-bold text-[#0b2f6e]">{t("هذا القسم غير متاح لباقة المكالمات")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("اشتراكك الحالي في نظام المكالمات — يمكنك الوصول لحصصك الفردية ومحفظتك فقط. المحاضرات والكورسات متاحة مع الباقات الأساسية.")}
          </p>
        </Card>
      </AppShell>
    );
  }

  return <>{children}</>;
}

export function LecturesScreen() {
  const { studentSchedules, studentLectures, studentAttendance, studentAttendanceRate, studentTickets, createStudentTicket } =
    usePlatformStore();
  const { t } = useI18n();
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
        title={t("المحاضرات والمواعيد")}
        subtitle={t("جدول محاضراتك · سجل حضورك · طلبات تغيير المواعيد")}
        actions={
          <Button onClick={() => setShowRequest(!showRequest)}>
            <CalendarDays className="size-4" />
            {t("طلب تغيير موعد")}
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card className="p-3 text-center">
          <small className="text-muted-foreground">{t("مواعيد أسبوعية")}</small>
          <b className="mt-1 block font-lat text-2xl text-brand">{studentSchedules.length}</b>
        </Card>
        <Card className="p-3 text-center">
          <small className="text-muted-foreground">{t("نسبة حضوري")}</small>
          <b className="mt-1 block font-lat text-2xl text-sage">
            {studentAttendanceRate !== null ? `${studentAttendanceRate}%` : "—"}
          </b>
        </Card>
        <Card className="p-3 text-center">
          <small className="text-muted-foreground">{t("طلبات مفتوحة")}</small>
          <b className="mt-1 block font-lat text-2xl text-gold">
            {studentTickets.filter((tk) => tk.status === "open" || tk.status === "in_progress").length}
          </b>
        </Card>
      </div>

      {showRequest && (
        <Card className="mb-4 border-brand/30">
          <h3 className="font-bold">{t("طلب تغيير موعد / استفسار")}</h3>
          <form onSubmit={handleRequest} className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label>{t("الموضوع")}</Label>
              <Input
                value={rqSubject}
                onChange={(e) => setRqSubject(e.target.value)}
                required
                placeholder={t("مثال: طلب تغيير موعد محاضرة الأحد")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("التفاصيل (اختياري)")}</Label>
              <textarea
                value={rqDesc}
                onChange={(e) => setRqDesc(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder={t("اشرح الموعد المطلوب أو السبب...")}
              />
            </div>
            <Button type="submit" disabled={rqSaving}>{rqSaving ? t("جاري الإرسال...") : t("إرسال الطلب")}</Button>
          </form>
        </Card>
      )}

      <Card className="mb-4">
        <h2 className="text-lg font-bold">{t("المحاضرات المباشرة")} ({studentLectures.length})</h2>
        <p className="text-xs text-muted-foreground">{t("المحاضرات القادمة — انضم عبر رابط الاجتماع")}</p>
        <div className="mt-4 space-y-2">
          {studentLectures.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t("لا توجد محاضرات مباشرة مجدولة حالياً.")}
            </div>
          ) : (
            studentLectures.map((l) => (
              <div key={l.id} className="rounded-md border border-border bg-background/60 p-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <b className="text-sm">{l.title}</b>
                    <Badge tone={l.status === "live" ? "sage" : l.status === "completed" ? "muted" : "brand"}>
                      {l.status === "live" ? t("مباشر الآن") : l.status === "completed" ? t("مكتملة") : t("مجدولة")}
                    </Badge>
                    {l.level && <Badge tone="muted">{t("مستوى")} {l.level}</Badge>}
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
                {l.meetingUrl && l.status !== "cancelled" && (
                  <a
                    href={l.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 flex w-full items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-brand/90"
                  >
                    {l.status === "live" ? t("انضم إلى المحاضرة الآن") : t("دخول المحاضرة")}
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="text-lg font-bold">{t("جدول محاضراتي")} ({studentSchedules.length})</h2>
          <div className="mt-4 space-y-2">
            {studentSchedules.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {t("لا توجد مواعيد مجدولة لك حالياً — ستظهر فور إضافتها من الإدارة.")}
              </div>
            ) : (
              studentSchedules.map((s) => (
                <div key={s.id} className={`rounded-md border p-3 ${s.isLive ? "border-sage/50 bg-sage/5" : "border-border bg-background/60"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <b className="text-sm">{s.title}</b>
                    <div className="flex items-center gap-2">
                      {s.isLive && <Badge tone="sage">{t("مباشر الآن")}</Badge>}
                      <Badge tone={s.location === "online" ? "brand" : "gold"}>
                        {s.location === "online" ? t("أونلاين") : t("أوفلاين")}
                      </Badge>
                    </div>
                  </div>
                  <small className="mt-1 block text-muted-foreground">
                    {t("كل")} {t(DAY_NAMES[s.dayOfWeek] ?? "")} · {s.startTime}–{s.endTime}
                    {(s.group?.name ?? s.groupName) && ` · ${t("مجموعة")} ${s.group?.name ?? s.groupName}`} · {t("المدرس")}: {s.teacher.fullName}
                  </small>
                  {s.meetingUrl && s.location !== "offline" && (
                    <a
                      href={s.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 flex w-full items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-brand/90"
                    >
                      {s.isLive ? t("انضم الآن") : t("دخول المحاضرة")}
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-bold">{t("طلباتي")} ({studentTickets.length})</h2>
          <div className="mt-4 space-y-2">
            {studentTickets.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {t("لا توجد طلبات — استخدم زر \"طلب تغيير موعد\" لإرسال طلب.")}
              </div>
            ) : (
              studentTickets.map((tk) => (
                <div key={tk.id} className="rounded-md border border-border bg-background/60 p-3">
                  <div className="flex items-center justify-between">
                    <b className="text-sm">{tk.subject}</b>
                    <Badge tone={tk.status === "resolved" ? "sage" : tk.status === "in_progress" ? "gold" : "muted"}>
                      {tk.status === "resolved" ? t("تم الحل") : tk.status === "in_progress" ? t("قيد المعالجة") : tk.status === "closed" ? t("مغلقة") : t("مفتوحة")}
                    </Badge>
                  </div>
                  <small className="mt-1 block text-muted-foreground">
                    {new Date(tk.createdAt).toLocaleDateString("ar-EG")}
                    {tk.support && ` · ${t("المسؤول")}: ${tk.support.fullName}`}
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
  const { t } = useI18n();

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
      alert(t("المتصفح لا يدعم التعرّف الصوتي — جرّب Chrome"));
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
        title={t("المحادثات")}
        subtitle={t("تواصل مع مدرسك أو خدمة العملاء أو المساعد الذكي")}
      />

      <div className="mb-4 flex gap-2">
        {(
          [
            { key: "teacher", label: t("مع المدرس") },
            { key: "support", label: t("خدمة العملاء") },
            { key: "ai", label: t("المساعد الذكي") },
          ] as const
        ).map((tb) => (
          <Button
            key={tb.key}
            variant={tab === tb.key ? "secondary" : "ghost"}
            className="text-xs"
            onClick={() => setTab(tb.key)}
          >
            {tb.label}
          </Button>
        ))}
      </div>

      <Card>
        {tab === "teacher" && (
          <div className="mb-3 flex items-center gap-2">
            <Label className="shrink-0">{t("المدرس")}:</Label>
            <select
              value={teacherId}
              onChange={(e) => {
                setTeacherId(e.target.value);
                fetchTeacherChat(e.target.value || undefined);
              }}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="">{t("كل مدرسيك")}</option>
              {myChatTeachers.map((tc) => (
                <option key={tc.id} value={tc.id}>
                  {tc.fullName}{tc.groupName ? ` (${tc.groupName})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="max-h-[440px] min-h-[220px] space-y-2 overflow-y-auto rounded-md bg-muted/40 p-3">
          {tab === "ai" ? (
            aiMsgs.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                {t("اسأل المساعد الذكي أي سؤال عن العبرية — يمكنك الكتابة أو التحدث بالمايك.")}
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
                    {m.role === "user" ? t("أنت") : t("المساعد")}
                  </small>
                  <p className="mt-0.5 whitespace-pre-wrap">{m.content}</p>
                  {m.role === "assistant" && (
                    <button
                      type="button"
                      onClick={() => speak(m.content)}
                      className="mt-1 text-[10px] font-semibold text-brand"
                    >
                      {t("استمع")}
                    </button>
                  )}
                </div>
              ))
            )
          ) : msgs.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {t("لا توجد رسائل بعد — اكتب أول رسالة بالأسفل.")}
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
                  {m.fromRole === "STUDENT" ? t("أنت") : m.fromRole === "TEACHER" ? t("المدرس") : t("خدمة العملاء")} ·{" "}
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
              {listening ? t("أسمعك…") : "🎤"}
            </Button>
          )}
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={tab === "ai" ? t("اكتب أو تحدث مع المساعد...") : t("اكتب رسالتك...")}
            className="flex-1"
          />
          <Button type="submit" disabled={sending || !text.trim()}>
            {sending ? "..." : t("إرسال")}
          </Button>
        </form>
      </Card>
    </AppShell>
  );
}

export function StudentHomeworkScreen() {
  const { studentHomework, submitHomework } = usePlatformStore();
  const { t } = useI18n();
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [blobs, setBlobs] = useState<Record<string, Blob>>({});
  const [hwAnswers, setHwAnswers] = useState<Record<string, Record<string, string>>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState("");

  function setHwAnswer(hwId: string, idx: number, value: string) {
    setHwAnswers((prev) => ({ ...prev, [hwId]: { ...(prev[hwId] ?? {}), [idx]: value } }));
  }

  async function handleSubmitHw(hw: { id: string; type?: string; questions?: ExamQuestions | null }) {
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
      const answers = hwAnswers[hw.id] ?? {};
      const items = hw.questions?.items ?? [];
      const isSpeaking = hw.type === "speaking";
      const hasContent = Boolean(text) || Boolean(audioUrl) || Object.keys(answers).length > 0;
      if (!hasContent) {
        setError(isSpeaking ? t("سجّل إجابتك الصوتية قبل التسليم") : t("أجب على الأسئلة أو اكتب إجابة نصية قبل التسليم"));
        return;
      }
      if (items.length > 0 && items.some((_, i) => !answers[i]?.trim())) {
        setError(t("أجب على كل الأسئلة قبل التسليم"));
        return;
      }
      await submitHomework(hw.id, {
        ...(text ? { submissionText: text } : {}),
        ...(Object.keys(answers).length > 0 ? { answers } : {}),
        ...(isSpeaking && audioUrl ? { recordingUrl: audioUrl } : audioUrl ? { submissionAudioUrl: audioUrl } : {}),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("فشل تسليم الواجب"));
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <AppShell role="STUDENT">
      <PageHeader
        title={t("الواجبات")}
        subtitle={t("واجباتك من مدرسيك — سلّم إجابة نصية أو تسجيلاً صوتياً")}
      />
      {error && <p className="mb-3 rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>}
      <div className="space-y-3">
        {studentHomework.length === 0 ? (
          <Card className="py-12 text-center text-sm text-muted-foreground">
            {t("لا توجد واجبات مسندة لك حالياً.")}
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
                    {t("المدرس")}: {hw.teacher.fullName}
                    {hw.groupName && ` · ${t("مجموعة")} ${hw.groupName}`}
                    {hw.dueDate && ` · ${t("التسليم")}: ${new Date(hw.dueDate).toLocaleDateString("ar-EG")}`}
                  </small>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={st === "graded" ? "sage" : st === "submitted" ? "gold" : st === "late" ? "danger" : "muted"}>
                    {st === "graded" ? t("تم التصحيح") : st === "submitted" ? t("مُسلَّم") : st === "late" ? t("متأخر") : t("مطلوب")}
                  </Badge>
                  {sub?.grade !== null && sub?.grade !== undefined && <Badge tone="brand">{sub.grade}%</Badge>}
                </div>
              </div>

              {hw.description && <p className="mt-2 text-sm text-muted-foreground">{hw.description}</p>}
              {hw.type && (
                <Badge tone="brand">{t(EXAM_TYPE_LABELS[hw.type as ExamType] ?? hw.type)}</Badge>
              )}
              {hw.hebrewText && (
                <div className="mt-3">
                  <p dir="rtl" className="rounded-md bg-muted/60 p-3 font-he text-sm leading-7">{hw.hebrewText}</p>
                </div>
              )}
              {hw.type === "listening" && hw.questions?.audioUrl && (
                <div className="mt-3 rounded-md border border-brand/30 bg-brand/5 p-3">
                  <small className="font-semibold text-brand">{t("استمع لتسجيل المدرس ثم أجب:")}</small>
                  <audio controls src={mediaSrc(hw.questions.audioUrl)} className="mt-2 w-full" />
                </div>
              )}

              {st === "graded" ? (
                <div className="mt-3 rounded-md border border-sage/30 bg-sage/5 p-3">
                  <div className="flex items-center gap-2">
                    <b className="text-sm">{t("نتيجتك")}: {sub?.grade}%</b>
                  </div>
                  {sub?.feedback && <p className="mt-1 text-sm text-muted-foreground">{t("ملاحظة المدرس")}: {sub.feedback}</p>}
                  {sub?.submissionText && (
                    <p className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground">{t("إجابتك")}: {sub.submissionText}</p>
                  )}
                  {sub?.audioUrl && (
                    <audio controls src={mediaSrc(sub.audioUrl)} className="mt-2 w-full" />
                  )}
                  {sub?.recordingUrl && (
                    <audio controls src={mediaSrc(sub.recordingUrl)} className="mt-2 w-full" />
                  )}
                  {(sub?.answers?.details ?? []).length > 0 && (
                    <div className="mt-2 space-y-1 border-t border-border pt-2">
                      {(sub?.answers?.details ?? []).map((d) => (
                        <div key={d.idx} className="flex items-center gap-2 text-xs">
                          <span className={`grid size-4 place-items-center rounded-full text-[10px] font-bold text-white ${d.isAuto ? (d.correct ? "bg-sage" : "bg-danger") : "bg-gold"}`}>
                            {d.isAuto ? (d.correct ? "✓" : "✗") : "؟"}
                          </span>
                          <span className="font-semibold">{t("س")}{d.idx + 1}:</span>
                          <span className="text-muted-foreground">{d.studentAnswer || "—"}</span>
                          {d.isAuto && !d.correct && <span className="text-sage">{t("الصحيحة")}: {d.correctAnswer}</span>}
                          {!d.isAuto && <span className="text-gold">{t("(تصحيح يدوي)")}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : st === "submitted" || st === "late" ? (
                <div className="mt-3 rounded-md bg-muted/60 p-3 text-sm text-muted-foreground">
                  {t("تم تسليم الواجب — بانتظار تصحيح المدرس.")}
                  {sub?.submissionText && <p className="mt-2 border-t border-border pt-2 text-xs">{t("إجابتك")}: {sub.submissionText}</p>}
                  {sub?.audioUrl && <audio controls src={mediaSrc(sub.audioUrl)} className="mt-2 w-full" />}
                  {sub?.recordingUrl && <audio controls src={mediaSrc(sub.recordingUrl)} className="mt-2 w-full" />}
                </div>
              ) : (
                <div className="mt-4 space-y-3 border-t border-border pt-4">
                  {/* Exam-style items */}
                  {(hw.questions?.items ?? []).map((q, qi) => (
                    <div key={qi} className="space-y-2 rounded-md border border-border bg-background/60 p-3">
                      <b className="text-sm">{t("س")}{qi + 1}: {q.prompt}</b>
                      {q.type === "mcq" && (
                        <div className="grid gap-1.5">
                          {(q.options ?? []).map((opt, oi) => (
                            <label key={oi} className="flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm hover:bg-muted/40">
                              <input
                                type="radio"
                                name={`hw-${hw.id}-${qi}`}
                                checked={(hwAnswers[hw.id]?.[qi] ?? "") === String(oi)}
                                onChange={() => setHwAnswer(hw.id, qi, String(oi))}
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      )}
                      {q.type === "truefalse" && (
                        <div className="grid grid-cols-2 gap-2">
                          {([t("صح"), t("خطأ")] as const).map((lbl, oi) => (
                            <label key={oi} className="flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm hover:bg-muted/40">
                              <input
                                type="radio"
                                name={`hw-${hw.id}-${qi}`}
                                checked={(hwAnswers[hw.id]?.[qi] ?? "") === String(oi)}
                                onChange={() => setHwAnswer(hw.id, qi, String(oi))}
                              />
                              {lbl}
                            </label>
                          ))}
                        </div>
                      )}
                      {q.type === "text" && (
                        <textarea
                          value={hwAnswers[hw.id]?.[qi] ?? ""}
                          onChange={(e) => setHwAnswer(hw.id, qi, e.target.value)}
                          rows={2}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          placeholder={t("اكتب إجابتك...")}
                        />
                      )}
                    </div>
                  ))}

                  {hw.type === "speaking" ? (
                    <AudioRecorder
                      label={t("سجّل إجابتك الصوتية")}
                      onRecorded={(blob) => setBlobs((prev) => ({ ...prev, [hw.id]: blob }))}
                    />
                  ) : (
                    <>
                      {(hw.questions?.items ?? []).length === 0 && (
                        <div className="space-y-1.5">
                          <Label>{t("إجابتك الكتابية")}</Label>
                          <textarea
                            value={texts[hw.id] ?? ""}
                            onChange={(e) => setTexts((prev) => ({ ...prev, [hw.id]: e.target.value }))}
                            rows={3}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            placeholder={t("اكتب إجابتك هنا...")}
                          />
                        </div>
                      )}
                      <AudioRecorder
                        label={t("سجّل إجابة صوتية (اختياري)")}
                        onRecorded={(blob) => setBlobs((prev) => ({ ...prev, [hw.id]: blob }))}
                      />
                    </>
                  )}
                  <Button onClick={() => handleSubmitHw(hw)} disabled={submitting === hw.id}>
                    <Send className="size-4" />
                    {submitting === hw.id ? t("جاري التسليم...") : t("تسليم الواجب")}
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
  const { t } = useI18n();
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
    if (!selectedPkg || !method) return;
    setError("");
    if (!shot) {
      setError(t("ارفع سكرين شوت لإثبات التحويل قبل الإرسال"));
      return;
    }
    setSubmitting(true);
    try {
      const uploaded = await uploadFile(shot, "payments");
      await createPaymentRequest({
        packageId: selectedPkg.id,
        method,
        screenshotUrl: uploaded.url,
      });
      setSelectedPkgId(null);
      setMethod(null);
      setShot(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("تعذر إرسال طلب الحجز — حاول مرة أخرى"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell role="STUDENT">
      <PageHeader
        title={t("الباقات والاشتراك")}
        subtitle={t("اختر باقتك، حوّل على الرقم، وارفع إثبات التحويل — الإدارة تؤكد وتفتح حسابك")}
      />

      {user?.hasActiveSubscription ? (
        <Card className="mx-auto max-w-lg py-10 text-center">
          <Check className="mx-auto size-10 text-sage" />
          <h2 className="mt-3 text-lg font-bold">{t("اشتراكك نشط")}</h2>
          {mySubscription?.package && (
            <p className="mt-1 text-sm text-muted-foreground">
              {mySubscription.package.nameAr} — {t("حتى")}{" "}
              {mySubscription.endDate ? new Date(mySubscription.endDate).toLocaleDateString("ar-EG") : "—"}
            </p>
          )}
          <Link to="/dashboard">
            <Button className="mt-5">{t("الانتقال للداشبورد")}</Button>
          </Link>
        </Card>
      ) : pendingReq ? (
        <Card className="mx-auto max-w-lg py-10 text-center">
          <Badge tone="gold" className="mx-auto">{t("قيد المراجعة")}</Badge>
          <h2 className="mt-3 text-lg font-bold">{t("طلب حجزك وصل الإدارة")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {pendingReq.package?.nameAr} — {pendingReq.package?.price} {t("ج.م")} ·{" "}
            {pendingReq.method === "wallet" ? t("محفظة إلكترونية") : t("انستاباي")}
            <br />
            {t("تم الإرسال")} {new Date(pendingReq.createdAt).toLocaleString("ar-EG")}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            {t("بمجرد تأكيد الإدارة للتحويل، ستتفتح كل أقسام المنصة تلقائياً — سنوافيك بإشعار.")}
          </p>
          <Button
            variant="secondary"
            className="mt-5"
            onClick={() => {
              refreshUser().catch(() => {});
              fetchMyBilling().catch(() => {});
            }}
          >
            {t("تحديث حالة الطلب")}
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {lastRejected && (
            <Card className="border-danger/40 bg-danger/5">
              <b className="text-sm text-danger">{t("تم رفض طلبك السابق")} ({lastRejected.package?.nameAr})</b>
              <p className="mt-1 text-xs text-muted-foreground">
                {lastRejected.rejectReason || t("لم يتم التحقق من التحويل")} — {t("يمكنك إعادة الحجز أو التواصل مع الدعم.")}
              </p>
            </Card>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {publicPackages.map((pkg) => (
              <Card key={pkg.id} className="flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <b>{pkg.nameAr}</b>
                  <Badge tone="brand">{pkg.durationMonths === 1 ? t("شهرياً") : `${pkg.durationMonths} ${t("شهور")}`}</Badge>
                </div>
                <p className="mt-2 text-2xl font-bold text-brand">
                  {pkg.price} <span className="text-sm font-normal text-muted-foreground">{t("ج.م")}</span>
                </p>
                {pkg.sessionsTotal && (
                  <small className="mt-1 block text-muted-foreground">
                    {pkg.sessionsTotal} {t("حصة")}
                    {pkg.sessionDurationMinutes ? ` × ${pkg.sessionDurationMinutes === 90 ? t("ساعة ونصف") : pkg.sessionDurationMinutes === 60 ? t("ساعة") : `${pkg.sessionDurationMinutes} ${t("دقيقة")}`}` : ""}
                  </small>
                )}
                {pkg.description && (
                  <p className="mt-2 text-xs text-muted-foreground">{pkg.description}</p>
                )}
                {pkg.teacher && (
                  <small className="mt-2 block text-muted-foreground">
                    {t("المدرس")}: {pkg.teacher.fullName}
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
                  {t("احجز الآن")}
                </Button>
              </Card>
            ))}
          </div>

          {selectedPkg && (
            <Card className="mx-auto max-w-xl">
              <h3 className="font-bold">{t("تفاصيل الحجز")} — {selectedPkg.nameAr}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("المبلغ المطلوب")}: <b className="text-brand">{selectedPkg.price} {t("ج.م")}</b>
              </p>

              <div className="mt-4 space-y-1.5">
                <Label>{t("طريقة التحويل")}</Label>
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
                    {t("محفظة إلكترونية")}
                  </button>
                </div>
              </div>

              {method && (
                <div className="mt-4 space-y-4">
                  <div className="rounded-md border border-brand/30 bg-brand/5 p-4 text-center">
                    <small className="block text-muted-foreground">
                      {method === "instapay"
                        ? t("حوّل على رقم انستاباي التالي:")
                        : t("حوّل على رقم المحفظة الإلكترونية التالي (فودافون كاش / اتصالات كاش / أورانج كاش):")}
                    </small>
                    <div className="mt-2 flex items-center justify-center gap-3">
                      <b dir="ltr" className="font-lat text-xl tracking-widest">{PAYMENT_NUMBER_DISPLAY}</b>
                      <Button variant="secondary" className="min-h-8 px-3 text-xs" onClick={copyNumber}>
                        {copied ? t("تم النسخ") : t("نسخ الرقم")}
                      </Button>
                    </div>
                  </div>

                  <ol className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Badge tone="brand" className="shrink-0">1</Badge>
                      {t("حوّل المبلغ")} ({selectedPkg.price} {t("ج.م")}) {t("على الرقم أعلاه")}
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge tone="brand" className="shrink-0">2</Badge>
                      {t("ارفع سكرين شوت لإثبات التحويل واضغط إرسال")}
                    </li>
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

                  {error && (
                    <p className="rounded-md bg-danger/10 p-3 text-sm font-semibold text-danger">{error}</p>
                  )}

                  <Button
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={submitting || !shot}
                  >
                    {submitting ? t("جاري الإرسال...") : t("إرسال طلب الحجز")}
                  </Button>
                </div>
              )}
            </Card>
          )}

          <Card className="text-center">
            <p className="text-sm text-muted-foreground">
              {t("تحتاج مساعدة في الحجز؟ تواصل معنا على واتساب")}
            </p>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("أهلاً، محتاج مساعدة في حجز باقة على منصة עברית שוטפת")}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-md bg-sage px-4 py-2 text-sm font-bold text-white hover:bg-sage/90"
            >
              {t("تواصل واتساب")} — {PAYMENT_NUMBER_DISPLAY}
            </a>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

export function CertificatesScreen() {
  const { studentCertificates } = usePlatformStore();
  const { t } = useI18n();

  return (
    <AppShell role="STUDENT">
      <PageHeader
        title={t("شهاداتي")}
        subtitle={t("الشهادات التي حصلت عليها عند إتمام المستويات")}
      />
      {studentCertificates.length === 0 ? (
        <Card className="py-16 text-center">
          <GraduationCap className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            {t("لا توجد شهادات بعد — تُصدر من الإدارة عند استيفاء شروط النجاح في المستوى.")}
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
                  {c.level && <Badge tone="gold" >{t("مستوى")} {c.level}</Badge>}
                  {c.description && <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>}
                  <small className="mt-2 block text-muted-foreground">
                    {t("صدرت في")} {new Date(c.issuedAt).toLocaleDateString("ar-EG")}
                    {c.issuedBy && ` · ${t("بواسطة")} ${c.issuedBy.fullName}`}
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
  const { t } = useI18n();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <AppShell role="STUDENT">
      <PageHeader
        title={t("كورساتي")}
        subtitle={t("الكورسات والفيديوهات والملفات المنشورة لك من مدرسيك — افتحها وشغّلها داخل المنصة")}
      />
      {loadingData ? (
        <Card className="py-12 text-center text-sm text-muted-foreground">{t("جاري التحميل...")}</Card>
      ) : materials.length === 0 ? (
        <Card className="py-12 text-center text-sm text-muted-foreground">
          {t("لا توجد كورسات منشورة لك حالياً — ستظهر هنا فور نشرها من الإدارة.")}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {materials.map((m) => (
            <Card key={m.id}>
              <div className="flex items-center justify-between">
                <Badge tone={m.type === "VIDEO" ? "brand" : "gold"}>
                  {m.type === "VIDEO" ? t("فيديو") : m.type === "AUDIO" ? t("ملف صوتي") : t("ملف")}
                </Badge>
                <Badge tone="sage">{t("مستوى")} {m.level}</Badge>
              </div>
              <h2 className="mt-3 font-bold">{m.title}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{m.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {t("المدرس")}: {m.assignedTeacherName} · {m.fileSize}
                {(m.attachments?.length ?? 0) > 0 && (
                  <Badge tone="brand" className="mr-1.5">{1 + m.attachments!.length} {t("ملفات")}</Badge>
                )}
              </p>
              <Button
                variant="secondary"
                className="mt-3 w-full text-xs"
                onClick={() => setOpenId(openId === m.id ? null : m.id)}
              >
                {openId === m.id ? t("إغلاق") : t("فتح المادة داخل المنصة")}
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
  const { t } = useI18n();
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
          setSubmitError(t("سجّل صوتك أولاً قبل التسليم"));
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
      setSubmitError(err instanceof Error ? err.message : t("فشل تسليم الامتحان"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell role="STUDENT">
      <PageHeader
        title={t("الامتحانات")}
        subtitle={t("الامتحانات المنشورة من مدرسيك — سلّم إجاباتك أو تسجيلك الصوتي")}
      />
      {loadingData ? (
        <Card className="py-12 text-center text-sm text-muted-foreground">{t("جاري التحميل...")}</Card>
      ) : exams.length === 0 ? (
        <Card className="py-12 text-center text-sm text-muted-foreground">
          {t("لا توجد امتحانات منشورة لك حالياً.")}
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
                      <Badge tone="gold">{t(EXAM_TYPE_LABELS[exam.type])}</Badge>
                      {exam.myResult ? (
                        <Badge tone="sage">
                          {t("تم التسليم")}
                          {exam.myResult.score != null ? ` — ${exam.myResult.score}%` : ""}
                        </Badge>
                      ) : (
                        <Badge tone="muted">{t("لم يُسلَّم")}</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {exam.description || t("بدون وصف")} · {t("المدرس")}: {exam.assignedTeacherName ?? "—"}
                    </p>
                    {exam.myResult?.feedback && (
                      <p className="mt-1 rounded-sm bg-sage/10 px-2 py-1 text-xs text-sage">
                        {t("ملاحظات المدرس")}: {exam.myResult.feedback}
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
                    ? t("إغلاق")
                    : exam.myResult
                      ? t("عرض النتيجة")
                      : t("بدء الامتحان")}
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
                          <b className="text-sm">{t("تم تسليم هذا الامتحان — لا يمكن إعادة التسليم")}</b>
                          {exam.myResult.score != null && (
                            <p className="text-xs text-muted-foreground">
                              {t("درجتك")}: <b className="text-sage">{exam.myResult.score}%</b>
                            </p>
                          )}
                        </div>
                      </div>

                      {exam.myResult.feedback && (
                        <p className="rounded-sm bg-sage/10 px-3 py-2 text-sm text-sage">
                          <b>{t("ملاحظة المدرس/الإدارة")}:</b> {exam.myResult.feedback}
                        </p>
                      )}

                      {/* Show per-question results for auto-graded items */}
                      {(exam.questions.items ?? []).length > 0 && (
                        <div className="space-y-2">
                          <small className="font-semibold text-muted-foreground">
                            {t("مراجعة الإجابات")}
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
                                      {t("إجابتك")}{" "}
                                      <b className={isMcq ? (isCorrect ? "text-sage" : "text-danger") : ""}>
                                        {isMcq
                                          ? item.options?.[Number(studentAns)] ?? studentAns
                                          : studentAns || "—"}
                                      </b>
                                    </p>
                                    {isMcq && !isCorrect && (
                                      <p className="text-xs text-sage">
                                        {t("الإجابة الصحيحة")}{" "}
                                        <b>{item.options?.[item.correctIndex ?? 0] ?? "—"}</b>
                                      </p>
                                    )}
                                    {!isMcq && (
                                      <p className="mt-1 text-xs text-muted-foreground">
                                        {t("(التصحيح يدوي من المدرس/الإدارة)")}
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
                          <small className="mb-1 block text-muted-foreground">{t("تسجيلك الصوتي")}:</small>
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
                                ? t("اقرأ الفقرة التالية بصوتك وسجّلها:")
                                : t("النص:")}
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
                                {t("استمع للتسجيل ثم اكتب ما سمعته وفهمته بالعبرية:")}
                              </small>
                              <audio controls src={mediaSrc(exam.questions.audioUrl)} className="w-full" />
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">{t("لا يوجد تسجيل صوتي مرفق.")}</p>
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
                                <HebrewTTS text={item.prompt} label={t("استمع")} />
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
                                  {([t("صح"), t("خطأ")] as const).map((opt, oi) => (
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
                                  placeholder={t("إجابتك هنا...")}
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
                              placeholder={t("اكتب إجابتك هنا...")}
                            />
                          )}
                        </div>
                      )}

                      {exam.type === "speaking" && (
                        <AudioRecorder
                          label={t("سجّل قراءتك للفقرة")}
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
                        {submitting ? t("جاري التسليم...") : t("تسليم الامتحان")}
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
  const { t } = useI18n();
  const [drafts, setDrafts] = useState<Record<string, { score: string; feedback: string }>>({});

  return (
    <>
    <SectionHeader
      icon={ClipboardCheck}
      tone="sage"
      title={t("تسليمات الطلاب")}
      subtitle={<>{t("لديك")} <b>{results.length}</b> {t("تسليم — يمكنك تعديل الدرجة وإرسال ملاحظة للطالب")}</>}
      actions={<Button variant="secondary" onClick={() => onRefresh()}>{t("تحديث القائمة")}</Button>}
    />
    <Card>
      <div className="space-y-3">
        {results.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {t("لا توجد تسليمات من الطلاب حالياً.")}
          </div>
        ) : (
          results.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-muted/30 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <b className="text-sm">{r.student?.fullName ?? t("طالب")}</b>
                  <small className="block text-muted-foreground">
                    {r.student?.phone ?? r.student?.email ?? "—"} · {r.exam?.title ?? t("امتحان")} ·{" "}
                    {new Date(r.submittedAt).toLocaleString("ar-EG")}
                  </small>
                </div>
                <Badge tone={r.score !== null && r.score !== undefined ? "sage" : "muted"}>
                  {r.score !== null && r.score !== undefined ? `${r.score}%` : t("بانتظار التصحيح")}
                </Badge>
              </div>

              {r.recordingUrl && (
                <div className="mt-2">
                  <small className="mb-1 block text-muted-foreground">{t("تسجيل الطالب الصوتي")}</small>
                  <audio controls src={mediaSrc(r.recordingUrl)} className="w-full" />
                </div>
              )}

              {r.answers && Object.keys(r.answers).length > 0 && (
                <div className="mt-2 space-y-1">
                  {Object.entries(r.answers).map(([k, v]) => (
                    <div key={k} className="rounded-sm bg-muted/60 px-3 py-1 text-xs">
                      <b className="text-muted-foreground">{t("إجابة")} {Number(k) + 1}:</b> {v}
                    </div>
                  ))}
                </div>
              )}

              {r.feedback && (
                <p className="mt-2 rounded-sm bg-sage/10 px-2 py-1 text-xs text-sage">
                  {t("ملاحظة سابقة")}: {r.feedback}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder={t("الدرجة %")}
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
                  placeholder={t("ملاحظة للطالب (تظهر فوراً في لوحته)")}
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
                  {t("حفظ الدرجة والملاحظة")}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
    </>
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
  const { user } = useAuth();
  const { t } = useI18n();

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
      setLeadError(err instanceof Error ? err.message : t("فشل الحفظ"));
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
      {activeSection === "leads" ? (
        <HeroBanner
          tone="navy"
          icon={Headphones}
          kicker={t("مساحة المبيعات • متابعة يومية")}
          title={
            <>
              {t(dayGreeting())}، {firstNameOf(user?.fullName)}{" "}
              <span className="text-amber-300">✦</span>
            </>
          }
          subtitle={t("تابع عملاءك المحتملين وسجل مكالماتك واشتراكاتك من مكان واحد")}
          cta={
            <>
              <HeroAction onClick={() => { resetLeadForm(); setShowLeadForm(true); }}>
                {t("عميل جديد")}
                <ArrowLeft className="size-4" />
              </HeroAction>
              <HeroAction onClick={() => { setSelectedLeadId(salesLeads[0]?.id ?? ""); setShowCallForm(true); }}>
                {t("تسجيل مكالمة")}
              </HeroAction>
            </>
          }
        />
      ) : (
        <PageHeader
          title={t("لوحة المبيعات")}
          subtitle={t("إدارة العملاء المحتملين والمكالمات والاشتراكات والتقارير")}
          actions={
            <>
              <Button variant="secondary" onClick={() => { setSelectedLeadId(salesLeads[0]?.id ?? ""); setShowCallForm(true); }}>
                <Headphones className="size-4" />
                {t("تسجيل مكالمة")}
              </Button>
              <Button onClick={() => { resetLeadForm(); setShowLeadForm(true); }}>
                <UserPlus className="size-4" />
                {t("عميل جديد")}
              </Button>
            </>
          }
        />
      )}

      {/* Quick stats bar */}
      {stats && (
        <div className="mb-4 grid gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <Card className="p-3 text-center">
            <small className="text-muted-foreground">{t("إجمالي العملاء")}</small>
            <b className="mt-1 block font-lat text-2xl text-brand">{stats.totalLeads}</b>
          </Card>
          <Card className="p-3 text-center">
            <small className="text-muted-foreground">{t("جديد")}</small>
            <b className="mt-1 block font-lat text-2xl">{stats.newLeads}</b>
          </Card>
          <Card className="p-3 text-center">
            <small className="text-muted-foreground">{t("مهتم")}</small>
            <b className="mt-1 block font-lat text-2xl text-amber-600">{stats.interestedLeads}</b>
          </Card>
          <Card className="p-3 text-center">
            <small className="text-muted-foreground">{t("مشترك")}</small>
            <b className="mt-1 block font-lat text-2xl text-sage">{stats.convertedLeads}</b>
          </Card>
          <Card className="p-3 text-center">
            <small className="text-muted-foreground">{t("مكالمات اليوم")}</small>
            <b className="mt-1 block font-lat text-2xl">{stats.todayCalls}</b>
          </Card>
          <Card className="p-3 text-center">
            <small className="text-muted-foreground">{t("إجمالي المبيعات")}</small>
            <b className="mt-1 block font-lat text-2xl text-sage">${stats.totalRevenue}</b>
          </Card>
          <Card className="p-3 text-center">
            <small className="text-muted-foreground">{t("معدل التحويل")}</small>
            <b className="mt-1 block font-lat text-2xl text-brand">{stats.conversionRate}%</b>
          </Card>
        </div>
      )}

      {activeSection === "leads" && (
        <div className="space-y-4">
          {/* Lead form */}
          {showLeadForm && (
            <Card>
              <h3 className="font-bold">{editingLead ? t("تعديل العميل") : t("إضافة عميل محتمل جديد")}</h3>
              <form onSubmit={handleSaveLead} className="mt-3 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>{t("الاسم الكامل")}</Label>
                    <Input value={leadName} onChange={(e) => setLeadName(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("البريد الإلكتروني")}</Label>
                    <Input type="email" value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("رقم الهاتف")}</Label>
                    <Input dir="ltr" className="text-left" value={leadPhone} onChange={(e) => setLeadPhone(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("مصدر المعرفة بالأكاديمية")}</Label>
                    <select
                      value={leadSource}
                      onChange={(e) => setLeadSource(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">— {t("اختر")} —</option>
                      <option value="facebook">{t("فيسبوك / إنستجرام")}</option>
                      <option value="google">{t("بحث جوجل")}</option>
                      <option value="referral">{t("توصية من طالب")}</option>
                      <option value="whatsapp">{t("واتساب")}</option>
                      <option value="other">{t("أخرى")}</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>{t("الاحتياج / نوع الكورس")}</Label>
                    <select
                      value={leadNeed}
                      onChange={(e) => setLeadNeed(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">— {t("اختر")} —</option>
                      <option value="levels">{t("كورس مستويات (Pre A1–B2)")}</option>
                      <option value="conversation">{t("ورش محادثة")}</option>
                      <option value="calls">{t("مكالمات محادثة فردية")}</option>
                      <option value="private">{t("كورس خاص / VIP")}</option>
                      <option value="placement">{t("تحديد مستوى فقط")}</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>{t("ملاحظات")}</Label>
                    <textarea
                      value={leadNotes}
                      onChange={(e) => setLeadNotes(e.target.value)}
                      className="min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
                      placeholder={t("أي ملاحظات عن العميل...")}
                    />
                  </div>
                </div>
                {leadError && <p className="text-xs font-semibold text-danger">{leadError}</p>}
                <div className="flex gap-2">
                  <Button type="submit" disabled={leadSaving}>
                    {leadSaving ? t("جاري الحفظ...") : editingLead ? t("تحديث العميل") : t("إضافة العميل")}
                  </Button>
                  <Button type="button" variant="ghost" onClick={resetLeadForm}>
                    {t("إلغاء")}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Leads table */}
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{t("العملاء المحتملون")} ({salesLeads.length})</h2>
              <Button variant="secondary" className="text-xs" onClick={() => { resetLeadForm(); setShowLeadForm(true); }}>
                <Plus className="size-3.5" />
                {t("إضافة عميل")}
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              {loadingData ? (
                <div className="py-8 text-center text-sm text-muted-foreground">{t("جاري التحميل...")}</div>
              ) : salesLeads.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {t("لا يوجد عملاء محتملون بعد — أضف أول عميل!")}
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
                          {t(LEAD_STAGES[lead.stage] ?? lead.stage)}
                        </Badge>
                      </div>
                    </button>

                    {expandedLeadId === lead.id && (
                      <div className="border-t border-border px-3 pb-3 pt-2">
                        <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                          {lead.email && <span>{t("الإيميل")}: {lead.email}</span>}
                          {lead.expectedValue != null && <span>{t("القيمة المتوقعة")}: ${lead.expectedValue}</span>}
                          {lead.sales && <span>{t("الموظف")}: {lead.sales.fullName}</span>}
                        </div>
                        {lead.notes && <p className="mt-1 text-xs text-muted-foreground">{t("ملاحظات")}: {lead.notes}</p>}
                        {lead.lostReason && <p className="mt-1 text-xs text-danger">{t("سبب الخسارة")}: {lead.lostReason}</p>}

                        {/* Latest call */}
                        {lead.callLogs?.[0] && (
                          <div className="mt-2 rounded-sm bg-muted/60 p-2 text-xs">
                            <b>{t("آخر مكالمة")}:</b> {lead.callLogs[0].notes} —{" "}
                            <Badge tone="muted">{t(CALL_OUTCOMES[lead.callLogs[0].outcome] ?? lead.callLogs[0].outcome)}</Badge>
                            <small className="block text-muted-foreground">
                              {t("بواسطة")} {lead.callLogs[0].calledBy.fullName} · {new Date(lead.callLogs[0].calledAt).toLocaleString("ar-EG")}
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
                            <option value="">{t("تغيير الحالة...")}</option>
                            <option value="new">{t("جديد")}</option>
                            <option value="contacted">{t("تم التواصل")}</option>
                            <option value="interested">{t("مهتم")}</option>
                            <option value="follow_up">{t("متابعة")}</option>
                            <option value="converted">{t("مشترك")}</option>
                            <option value="lost">{t("خسر")}</option>
                          </select>
                          <Button
                            variant="secondary"
                            className="min-h-8 px-2 text-xs"
                            onClick={() => openEditLead(lead)}
                          >
                            {t("تعديل")}
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
                            {t("تسجيل مكالمة")}
                          </Button>
                          <Button
                            variant="ghost"
                            className="min-h-8 px-2 text-xs text-danger"
                            onClick={() => { if (confirm(t("حذف هذا العميل؟"))) deleteLead(lead.id); }}
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
          <h3 className="font-bold">{t("تسجيل مكالمة")}</h3>
          <form onSubmit={handleLogCall} className="mt-3 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t("العميل")}</Label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">— {t("اختر العميل")} —</option>
                  {salesLeads.map((l) => (
                    <option key={l.id} value={l.id}>{l.name} — {l.phone}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("نتيجة المكالمة")}</Label>
                <select
                  value={callOutcome}
                  onChange={(e) => setCallOutcome(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="interested">{t("مهتم")}</option>
                  <option value="not_interested">{t("غير مهتم")}</option>
                  <option value="callback">{t("متابعة لاحقاً")}</option>
                  <option value="no_answer">{t("لم يرد")}</option>
                  <option value="converted">{t("تحول لمشترك")}</option>
                  <option value="wrong_number">{t("رقم خطأ")}</option>
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>{t("ملاحظات المكالمة")}</Label>
                <textarea
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  required
                  className="min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
                  placeholder={t("ماذا قال العميل؟ ماذا تم الاتفاق عليه؟")}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("موعد المتابعة القادم (اختياري)")}</Label>
                <Input
                  type="datetime-local"
                  value={callFollowUp}
                  onChange={(e) => setCallFollowUp(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={callSaving}>
                {callSaving ? t("جاري الحفظ...") : t("تسجيل المكالمة")}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowCallForm(false)}>
                {t("إلغاء")}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {activeSection === "calls" && (
        <Card>
          <h2 className="text-lg font-bold">{t("سجل المكالمات")} ({callLogs.length})</h2>
          <div className="mt-4 space-y-2">
            {callLogs.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">{t("لا توجد مكالمات مسجلة.")}</div>
            ) : (
              callLogs.map((c) => (
                <div key={c.id} className="flex items-start justify-between rounded-md border border-border bg-background/60 p-3">
                  <div>
                    <b className="text-sm">{c.lead?.name ?? "—"}</b>
                    <p className="mt-1 text-xs">{c.notes}</p>
                    <small className="text-muted-foreground">
                      {t("بواسطة")} {c.calledBy.fullName} · {new Date(c.calledAt).toLocaleString("ar-EG")}
                    </small>
                    {c.nextFollowUp && (
                      <small className="block text-amber-600">
                        {t("متابعة")}: {new Date(c.nextFollowUp).toLocaleString("ar-EG")}
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
                    {t(CALL_OUTCOMES[c.outcome] ?? c.outcome)}
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
              <h3 className="font-bold">{t("إنشاء اشتراك جديد")}</h3>
              <form onSubmit={handleCreateSub} className="mt-3 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>{t("الطالب")}</Label>
                    <select
                      value={subStudentId}
                      onChange={(e) => setSubStudentId(e.target.value)}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">— {t("اختر الطالب")} —</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>{s.fullName} — {s.phone ?? s.email ?? "—"}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("الباقة")}</Label>
                    <select
                      value={subPackageId}
                      onChange={(e) => setSubPackageId(e.target.value)}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">— {t("اختر الباقة")} —</option>
                      {packages.map((p) => (
                        <option key={p.id} value={p.id}>{p.nameAr} — ${p.price} / {p.durationMonths} {t("شهر")}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("المبلغ المدفوع ($)")}</Label>
                    <Input type="number" min={0} step="0.01" value={subPaidAmount} onChange={(e) => setSubPaidAmount(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("حالة الدفع")}</Label>
                    <select
                      value={subPaymentStatus}
                      onChange={(e) => setSubPaymentStatus(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="PENDING">{t("بانتظار الدفع")}</option>
                      <option value="PAID">{t("مدفوع")}</option>
                      <option value="PARTIAL">{t("جزئي")}</option>
                      <option value="REFUNDED">{t("مسترد")}</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>{t("ملاحظات")}</Label>
                    <Input value={subNotes} onChange={(e) => setSubNotes(e.target.value)} placeholder={t("أي ملاحظات...")} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={subSaving}>
                    {subSaving ? t("جاري الإنشاء...") : t("إنشاء الاشتراك")}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowSubForm(false)}>
                    {t("إلغاء")}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{t("الاشتراكات")} ({subscriptions.length})</h2>
              <Button variant="secondary" className="text-xs" onClick={() => setShowSubForm(true)}>
                <Plus className="size-3.5" />
                {t("اشتراك جديد")}
              </Button>
            </div>
            <div className="mt-4 space-y-2">
              {subscriptions.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">{t("لا توجد اشتراكات بعد.")}</div>
              ) : (
                subscriptions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-md border border-border bg-background/60 p-3">
                    <div>
                      <b className="text-sm">{s.student.fullName}</b>
                      <p className="text-xs text-muted-foreground">
                        {s.package.nameAr} · {s.package.durationMonths} {t("شهر")} · ${s.package.price}
                      </p>
                      <small className="text-muted-foreground">
                        {t("بواسطة")} {s.createdBy.fullName} · {new Date(s.createdAt).toLocaleDateString("ar-EG")}
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
                        {s.paymentStatus === "PAID" ? t("مدفوع") : s.paymentStatus === "PENDING" ? t("بانتظار") : s.paymentStatus === "PARTIAL" ? t("جزئي") : t("مسترد")}
                      </Badge>
                      {s.paidAmount != null && <small className="font-lat">${s.paidAmount}</small>}
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) updateSubscription(s.id, { status: e.target.value });
                        }}
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                      >
                        <option value="">{t("تغيير الحالة")}</option>
                        <option value="ACTIVE">{t("نشط")}</option>
                        <option value="EXPIRED">{t("منتهي")}</option>
                        <option value="CANCELLED">{t("ملغي")}</option>
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
              <small className="text-muted-foreground">{t("إجمالي العملاء المتواصل معهم")}</small>
              <b className="mt-2 block font-lat text-4xl text-brand">{stats.totalCalls}</b>
            </Card>
            <Card className="p-5 text-center">
              <small className="text-muted-foreground">{t("الاشتراكات المحققة")}</small>
              <b className="mt-2 block font-lat text-4xl text-sage">{stats.totalSubscriptions}</b>
            </Card>
            <Card className="p-5 text-center">
              <small className="text-muted-foreground">{t("إجمالي المبيعات")}</small>
              <b className="mt-2 block font-lat text-4xl text-sage">${stats.totalRevenue}</b>
            </Card>
            <Card className="p-5 text-center">
              <small className="text-muted-foreground">{t("معدل التحويل")}</small>
              <b className="mt-2 block font-lat text-4xl text-brand">{stats.conversionRate}%</b>
            </Card>
          </div>

          <Card>
            <h3 className="font-bold">{t("توزيع العملاء حسب المرحلة")}</h3>
            <div className="mt-4 space-y-3">
              {[
                { label: t("جديد"), count: stats.newLeads, color: "bg-slate-300" },
                { label: t("تم التواصل"), count: stats.contactedLeads, color: "bg-blue-400" },
                { label: t("مهتم"), count: stats.interestedLeads, color: "bg-amber-400" },
                { label: t("مشترك"), count: stats.convertedLeads, color: "bg-sage" },
                { label: t("خسر"), count: stats.lostLeads, color: "bg-danger" },
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

type SupportSection = "students" | "tickets" | "chat" | "schedules" | "sessions" | "groups" | "free-lectures" | "attendance" | "irregular";

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
    adminSchedules,
    fetchAdminSchedules,
    createAdminSchedule,
    updateAdminSchedule,
    deleteAdminSchedule,
    opsTeachers,
    fetchOpsTeachers,
    opsStudents,
    fetchOpsStudents,
    opsPackages,
    fetchOpsPackages,
    activateOpsSubscription,
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
    setFreeLectureStudents,
    deleteFreeLecture,
    addFreeLectureFile,
    removeFreeLectureFile,
    studentLinks,
    assignStudentToTeacher,
    unassignStudent,
    supportLectures,
    fetchSupportLectures,
    opsUpdateBooking,
    opsUpdateLecture,
    fetchOpsStudentProfile,
  } = usePlatformStore();
  const { user } = useAuth();
  const { t } = useI18n();

  const [activeSection, setActiveSection] = useState<SupportSection>("students");
  const [profileStudentId, setProfileStudentId] = useState<string | null>(null);
  const [assignStudentId, setAssignStudentId] = useState("");
  const [assignTeacherId, setAssignTeacherId] = useState("");
  const [assignMsg, setAssignMsg] = useState("");
  const [assignError, setAssignError] = useState("");
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

  const teachers = opsTeachers;

  useEffect(() => {
    fetchSupportChatThreads();
    fetchOpsTeachers().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeSection === "students") {
      fetchOpsStudents().catch(() => {});
      fetchOpsPackages().catch(() => {});
      fetchAdminGroups().catch(() => {});
      fetchOpsTeachers().catch(() => {});
      fetchSupportData().catch(() => {});
    }
    if (activeSection === "sessions") {
      fetchOpsBookings().catch(() => {});
      fetchCallsStudents().catch(() => {});
      fetchOpsTeachers().catch(() => {});
      fetchSupportLectures().catch(() => {});
      fetchFreeLectures().catch(() => {});
    }
    if (activeSection === "groups") fetchAdminGroups().catch(() => {});
    if (activeSection === "schedules") {
      fetchAdminSchedules().catch(() => {});
      fetchAdminGroups().catch(() => {});
    }
    if (activeSection === "attendance") fetchSupportData().catch(() => {});
    if (activeSection === "free-lectures") {
      fetchFreeStudents().catch(() => {});
      fetchFreeLectures().catch(() => {});
      fetchAdminGroups().catch(() => {});
      fetchOpsStudents().catch(() => {});
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

  async function handleAssignStudent(e: React.FormEvent) {
    e.preventDefault();
    setAssignMsg("");
    setAssignError("");
    if (!assignStudentId || !assignTeacherId) return;
    try {
      await assignStudentToTeacher(assignStudentId, assignTeacherId);
      setAssignStudentId("");
      setAssignTeacherId("");
      setAssignMsg(t("تم ربط الطالب بالمدرس — سيظهر له كل امتحانات وكورسات هذا المدرس."));
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : t("فشل ربط الطالب"));
    }
  }

  return (
    <AppShell role="SUPPORT" activeSection={activeSection} onSelectSection={(s) => setActiveSection(s as SupportSection)}>
      {activeSection === "students" ? (
        <HeroBanner
          tone="teal"
          icon={TicketCheck}
          kicker={t("خدمة العملاء • متابعة يومية")}
          title={
            <>
              {t(dayGreeting())}، {firstNameOf(user?.fullName)}{" "}
              <span className="text-amber-300">✦</span>
            </>
          }
          subtitle={t("تابع الطلاب والتذاكر والمواعيد من مكان واحد")}
          cta={
            <HeroAction onClick={() => setShowTicketForm(true)}>
              {t("تذكرة جديدة")}
              <ArrowLeft className="size-4" />
            </HeroAction>
          }
        />
      ) : (
        <PageHeader
          title={t("لوحة خدمة العملاء")}
          subtitle={t("متابعة الطلاب · الشكاوى · المواعيد · الحضور · المتابعة")}
          actions={
            <Button onClick={() => setShowTicketForm(true)}>
              <Plus className="size-4" />
              {t("تذكرة جديدة")}
            </Button>
          }
        />
      )}

      {/* Quick stats */}
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <Card className="p-3 text-center">
          <small className="text-muted-foreground">{t("إجمالي الطلاب")}</small>
          <b className="mt-1 block font-lat text-2xl text-brand">{supportStudents.length}</b>
        </Card>
        <Card className="p-3 text-center">
          <small className="text-muted-foreground">{t("تذاكر مفتوحة")}</small>
          <b className="mt-1 block font-lat text-2xl text-amber-600">
            {tickets.filter((tk) => tk.status === "open" || tk.status === "in_progress").length}
          </b>
        </Card>
        <Card className="p-3 text-center">
          <small className="text-muted-foreground">{t("محاضرات مجدولة")}</small>
          <b className="mt-1 block font-lat text-2xl">{schedules.length}</b>
        </Card>
        <Card className="p-3 text-center">
          <small className="text-muted-foreground">{t("طلاب غير منتظمين")}</small>
          <b className="mt-1 block font-lat text-2xl text-danger">{irregularStudents.length}</b>
        </Card>
      </div>

      {activeSection === "students" && (
        <>
          <StudentsDirectorySection
            students={opsStudents}
            groups={adminGroups}
            packages={opsPackages}
            loading={loadingData}
            onStatusChange={(id, status) => updateStudentStatus(id, status).catch(() => {})}
            onActivate={activateOpsSubscription}
            onAddToGroup={addGroupMembers}
            onViewProfile={(id) => setProfileStudentId(id)}
          />

          <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
            <Card>
              <div className="flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-md bg-brand/10 text-brand">
                  <Link2 className="size-4" />
                </span>
                <div>
                  <h2 className="font-bold">{t("ربط طالب بمدرس")}</h2>
                  <small className="text-muted-foreground">
                    {t("الطالب المربوط يرى امتحانات وكورسات المدرس تلقائياً")}
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
                  <Label>{t("الطالب")}</Label>
                  <select
                    value={assignStudentId}
                    onChange={(e) => setAssignStudentId(e.target.value)}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">{t("اختر طالباً...")}</option>
                    {opsStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} — {s.phone ?? s.email ?? "—"}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("المدرس")}</Label>
                  <select
                    value={assignTeacherId}
                    onChange={(e) => setAssignTeacherId(e.target.value)}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">{t("اختر مدرساً...")}</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.fullName} ({teacher.specialty ?? t("مدرس")})
                      </option>
                    ))}
                  </select>
                </div>
                <Button type="submit" className="w-full" disabled={!assignStudentId || !assignTeacherId}>
                  <Link2 className="size-4" />
                  {t("ربط الطالب بالمدرس")}
                </Button>
              </form>
            </Card>

            <Card>
              <h2 className="font-bold">{t("الروابط الحالية (طالب ↔ مدرس)")}</h2>
              <div className="mt-4 space-y-2">
                {studentLinks.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    {t("لا توجد روابط بين الطلاب والمدرسين حالياً.")}
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
                        title={t("إلغاء الربط")}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Ticket form */}
      {showTicketForm && (
        <Card className="mt-4">
          <h3 className="font-bold">{t("تذكرة جديدة")}</h3>
          <form onSubmit={handleCreateTicket} className="mt-3 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t("الطالب (اختياري)")}</Label>
                <select
                  value={tkStudentId}
                  onChange={(e) => setTkStudentId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">— {t("عام / بدون طالب")} —</option>
                  {supportStudents.map((s) => (
                    <option key={s.id} value={s.id}>{s.fullName}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("النوع")}</Label>
                <select
                  value={tkCategory}
                  onChange={(e) => setTkCategory(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {Object.entries(TICKET_CATEGORIES).map(([k, v]) => (
                    <option key={k} value={k}>{t(v)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("الأولوية")}</Label>
                <select
                  value={tkPriority}
                  onChange={(e) => setTkPriority(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="low">{t("منخفضة")}</option>
                  <option value="normal">{t("عادية")}</option>
                  <option value="high">{t("عالية")}</option>
                  <option value="urgent">{t("عاجلة")}</option>
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>{t("الموضوع")}</Label>
                <Input value={tkSubject} onChange={(e) => setTkSubject(e.target.value)} required />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>{t("الوصف")}</Label>
                <textarea
                  value={tkDesc}
                  onChange={(e) => setTkDesc(e.target.value)}
                  className="min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={tkSaving}>{tkSaving ? t("جاري الإنشاء...") : t("إنشاء التذكرة")}</Button>
              <Button type="button" variant="ghost" onClick={() => setShowTicketForm(false)}>{t("إلغاء")}</Button>
            </div>
          </form>
        </Card>
      )}

      {activeSection === "tickets" && (
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{t("الشكاوى والتذاكر")} ({tickets.length})</h2>
            <Button variant="secondary" className="text-xs" onClick={() => setShowTicketForm(true)}>
              <Plus className="size-3.5" />
              {t("تذكرة جديدة")}
            </Button>
          </div>
          <div className="mt-4 space-y-2">
            {tickets.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">{t("لا توجد تذاكر.")}</div>
            ) : (
              tickets.map((tk) => (
                <div key={tk.id} className="rounded-md border border-border bg-background/60">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between p-3 text-right"
                    onClick={() => setExpandedTicket(expandedTicket === tk.id ? null : tk.id)}
                  >
                    <div>
                      <b className="text-sm">{tk.subject}</b>
                      <small className="block text-muted-foreground">
                        {tk.student?.fullName ?? t("عام")} · {t(TICKET_CATEGORIES[tk.category] ?? tk.category)}
                        {tk._count && ` · ${tk._count.messages} ${t("رسالة")}`}
                      </small>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={tk.priority === "urgent" ? "danger" : tk.priority === "high" ? "gold" : "muted"}>
                        {tk.priority === "urgent" ? t("عاجل") : tk.priority === "high" ? t("عالية") : tk.priority === "low" ? t("منخفضة") : t("عادية")}
                      </Badge>
                      <Badge tone={
                        tk.status === "resolved" || tk.status === "closed" ? "sage"
                        : tk.status === "in_progress" ? "gold"
                        : tk.status === "forwarded" ? "brand"
                        : "muted"
                      }>
                        {t(TICKET_STATUSES[tk.status] ?? tk.status)}
                      </Badge>
                    </div>
                  </button>
                  {expandedTicket === tk.id && (
                    <div className="border-t border-border px-3 pb-3 pt-2 text-xs">
                      {tk.description && <p className="text-muted-foreground">{tk.description}</p>}
                      {tk.forwardedTo && (
                        <p className="mt-1 text-brand">{t("تم التحويل إلى")}: {tk.forwardedTo.fullName} ({tk.forwardedTo.role})</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <select
                          value=""
                          onChange={(e) => { if (e.target.value) updateTicket(tk.id, { status: e.target.value }); }}
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                        >
                          <option value="">{t("تغيير الحالة")}</option>
                          <option value="open">{t("مفتوحة")}</option>
                          <option value="in_progress">{t("قيد المعالجة")}</option>
                          <option value="resolved">{t("تم الحل")}</option>
                          <option value="closed">{t("مغلقة")}</option>
                        </select>
                        <select
                          value=""
                          onChange={(e) => { if (e.target.value) updateTicket(tk.id, { forwardedToId: e.target.value }); }}
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                        >
                          <option value="">{t("تحويل إلى...")}</option>
                          {teachers.map((tc) => (
                            <option key={tc.id} value={tc.id}>{t("مدرس")}: {tc.fullName}</option>
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
            <h2 className="text-lg font-bold">{t("محادثات الطلاب")} ({supportChatThreads.length})</h2>
            <p className="text-xs text-muted-foreground">{t("رسائل مباشرة من الطلاب عبر صفحة \"المحادثات\"")}</p>
            <div className="mt-4 space-y-2">
              {supportChatThreads.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">{t("لا توجد محادثات بعد.")}</div>
              ) : (
                supportChatThreads.map((th) => (
                  <button
                    key={th.student.id}
                    type="button"
                    onClick={() => openChat(th.student.id)}
                    className={`w-full rounded-md border p-3 text-right transition-colors ${
                      chatStudentId === th.student.id
                        ? "border-brand bg-brand/5"
                        : "border-border bg-background/60 hover:border-brand/40"
                    }`}
                  >
                    <b className="block text-sm">{th.student.fullName}</b>
                    <small className="block truncate text-muted-foreground">
                      {th.lastMessage.content} · {new Date(th.lastMessage.createdAt).toLocaleDateString("ar-EG")}
                    </small>
                  </button>
                ))
              )}
            </div>
          </Card>

          <Card className="lg:col-span-2">
            {!chatStudentId ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                {t("اختر محادثة من القائمة لعرض الرسائل والرد.")}
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
                        {m.fromRole === "STUDENT" ? t("الطالب") : t("خدمة العملاء")} ·{" "}
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
                    placeholder={t("اكتب ردك للطالب...")}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={chatSending || !chatReply.trim()}>
                    {t("إرسال")}
                  </Button>
                </form>
              </>
            )}
          </Card>
        </div>
      )}

      {activeSection === "schedules" && (
        <div className="space-y-4">
          <AdminSchedulesSection
            schedules={adminSchedules}
            teachers={teachers}
            groups={adminGroups}
            availability={adminTeacherAvailability}
            onFetchAvailability={fetchAdminTeacherAvailability}
            onCreate={createAdminSchedule}
            onUpdate={updateAdminSchedule}
            onDelete={deleteAdminSchedule}
          />
          <OpsLecturesListCard
            lectures={supportLectures}
            fetchLectures={fetchSupportLectures}
            onCancel={(id) => opsUpdateLecture(id, { status: "cancelled" })}
          />
        </div>
      )}

      {activeSection === "attendance" && (
        <div className="space-y-4">
          <Card>
            <h3 className="font-bold">{t("تسجيل حضور")}</h3>
            <form onSubmit={handleRecordAttendance} className="mt-3 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t("الموعد / المحاضرة")}</Label>
                  <select value={selectedScheduleId} onChange={(e) => setSelectedScheduleId(e.target.value)} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">— {t("اختر الموعد")} —</option>
                    {schedules.map((s) => (
                      <option key={s.id} value={s.id}>
                        {t(DAY_NAMES[s.dayOfWeek] ?? "")} {s.startTime} — {s.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("الطالب")}</Label>
                  <select value={atStudentId} onChange={(e) => setAtStudentId(e.target.value)} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">— {t("اختر الطالب")} —</option>
                    {supportStudents.map((s) => (
                      <option key={s.id} value={s.id}>{s.fullName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("الحالة")}</Label>
                  <select value={atStatus} onChange={(e) => setAtStatus(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="present">{t("حاضر")}</option>
                    <option value="absent">{t("غائب")}</option>
                    <option value="late">{t("متأخر")}</option>
                    <option value="excused">{t("معذور")}</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("التاريخ")}</Label>
                  <Input type="date" value={atDate} onChange={(e) => setAtDate(e.target.value)} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>{t("ملاحظات")}</Label>
                  <Input value={atNotes} onChange={(e) => setAtNotes(e.target.value)} placeholder={t("أي ملاحظات...")} />
                </div>
              </div>
              <Button type="submit" disabled={atSaving}>{atSaving ? t("جاري التسجيل...") : t("تسجيل الحضور")}</Button>
            </form>
          </Card>

          <Card>
            <h2 className="text-lg font-bold">{t("سجل الحضور")} ({attendance.length})</h2>
            <div className="mt-4 space-y-2">
              {attendance.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">{t("لا توجد سجلات حضور.")}</div>
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
                      {a.status === "present" ? t("حاضر") : a.status === "absent" ? t("غائب") : a.status === "late" ? t("متأخر") : t("معذور")}
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
              <h2 className="text-lg font-bold">{t("طلاب غير منتظمين")} ({irregularStudents.length})</h2>
              <p className="text-xs text-muted-foreground">{t("طلاب لم يسلموا امتحاناً منذ 30 يوم أو درجاتهم أقل من 50%")}</p>
            </div>
            <Button variant="secondary" className="text-xs" onClick={() => fetchSupportData()}>
              {t("تحديث")}
            </Button>
          </div>
          <div className="mt-4 space-y-2">
            {irregularStudents.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {t("كل الطلاب منتظمون — لا يوجد طلاب متأخرون.")}
              </div>
            ) : (
              irregularStudents.map((s) => (
                <div key={s.id} className="rounded-md border border-danger/30 bg-danger/5 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <b className="text-sm">{s.fullName}</b>
                      <small className="block text-muted-foreground">
                        {s.phone ?? s.email ?? "—"} · {t("المدرس")}: {s.teacher}
                      </small>
                      <p className="mt-1 text-xs text-danger">{s.reason}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.avgScore !== null && (
                        <Badge tone="danger">{s.avgScore}%</Badge>
                      )}
                      <Badge tone="muted">{t(STUDENT_STATUSES[s.studentStatus] ?? s.studentStatus)}</Badge>
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
            bookings={opsBookings}
            lectures={[...supportLectures, ...freeLectures]}
          />
          <Card>
            <h3 className="font-bold">{t("الحجوزات الحديثة")}</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-right text-xs text-muted-foreground">
                    <th className="p-2">{t("الطالب")}</th>
                    <th className="p-2">{t("المدرس")}</th>
                    <th className="p-2">{t("الموعد")}</th>
                    <th className="p-2">{t("الحالة")}</th>
                    <th className="p-2">{t("إجراءات")}</th>
                  </tr>
                </thead>
                <tbody>
                  {opsBookings.length === 0 ? (
                    <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">{t("لا توجد حجوزات.")}</td></tr>
                  ) : (
                    opsBookings.slice(0, 30).map((b) => {
                      const st: Record<string, { label: string; tone: "brand" | "sage" | "danger" | "gold" }> = {
                        booked: { label: t("محجوزة"), tone: "brand" },
                        completed: { label: t("مكتملة"), tone: "sage" },
                        cancelled: { label: t("ملغاة"), tone: "danger" },
                        no_show: { label: t("لم يحضر"), tone: "gold" },
                      };
                      const s = st[b.status] ?? st.booked!;
                      return (
                        <tr key={b.id} className="border-b">
                          <td className="p-2 font-semibold">{b.student?.fullName ?? "—"}</td>
                          <td className="p-2">{b.teacher?.fullName ?? "—"}</td>
                          <td className="p-2 text-xs">{new Date(b.startsAt).toLocaleString("ar-EG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                          <td className="p-2"><Badge tone={s.tone}>{s.label}</Badge></td>
                          <td className="p-2">
                            {b.status === "booked" && (
                              <Button size="sm" variant="ghost" onClick={() => { if (confirm(t("إلغاء الحصة؟ ستُرجع للطالب ويتحرر موعد المدرس."))) opsUpdateBooking(b.id, { status: "cancelled", reason: "إلغاء من خدمة العملاء" }).catch(() => {}); }}>
                                {t("إلغاء")}
                              </Button>
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
          <AdminAllBookingsCard bookings={opsBookings} onUpdate={opsUpdateBooking} />
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
          platformStudents={opsStudents}
          onFetchAvailability={fetchAdminTeacherAvailability}
          onCreateStudent={createFreeStudent}
          onDeleteStudent={deleteFreeStudent}
          onCreateLecture={createFreeLecture}
          onUpdateLecture={updateFreeLecture}
          onSetLectureStudents={setFreeLectureStudents}
          onDeleteLecture={deleteFreeLecture}
          onAddFile={addFreeLectureFile}
          onRemoveFile={removeFreeLectureFile}
        />
      )}

      {profileStudentId && (
        <AdminStudentProfileModal
          studentId={profileStudentId}
          fetchProfile={fetchOpsStudentProfile}
          onChanged={() => fetchOpsStudents().catch(() => {})}
          onClose={() => setProfileStudentId(null)}
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
  const { t } = useI18n();
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
      setErr(e2 instanceof Error ? e2.message : t("فشل إنشاء المجموعة"));
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
            <h2 className="text-lg font-bold">{t("المجموعات")} ({groups.length})</h2>
            <p className="text-xs text-muted-foreground">{t("إنشاء مجموعات طلاب وإدارة أعضائها — تستخدم لاستهداف محاضرات لمجموعة محددة")}</p>
          </div>
          <Button variant="secondary" className="text-xs" onClick={() => setShowForm(!showForm)}>
            {showForm ? t("إلغاء") : t("+ مجموعة جديدة")}
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="mt-4 space-y-3 rounded-md border border-border bg-muted/40 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t("اسم المجموعة")}</Label>
                <Input value={gName} onChange={(e) => setGName(e.target.value)} required placeholder={t("مثال: مجموعة A1 مساء")} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("المدرس المسؤول")}</Label>
                <select value={gTeacherId} onChange={(e) => setGTeacherId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">— {t("بدون مدرس")} —</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("المستوى")}</Label>
                <select value={gLevel} onChange={(e) => setGLevel(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">— {t("بدون")} —</option>
                  {PLATFORM_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("الحد الأقصى للطلاب")}</Label>
                <Input type="number" min={1} value={gMax} onChange={(e) => setGMax(e.target.value)} placeholder={t("مثال: 15")} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>{t("الوصف")}</Label>
                <Input value={gDesc} onChange={(e) => setGDesc(e.target.value)} placeholder={t("وصف مختصر للمجموعة")} />
              </div>
            </div>
            {err && <p className="text-sm font-semibold text-danger">{err}</p>}
            <Button type="submit" disabled={saving}>{saving ? t("جاري الحفظ...") : t("إنشاء المجموعة")}</Button>
          </form>
        )}
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {groups.length === 0 ? (
          <Card className="col-span-full py-10 text-center text-sm text-muted-foreground">{t("لا توجد مجموعات بعد.")}</Card>
        ) : (
          groups.map((g) => (
            <Card key={g.id}>
              <div className="flex items-start justify-between">
                <div>
                  <b>{g.name}</b>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {g.level && <Badge tone="muted">{g.level}</Badge>}
                    <Badge tone="brand">{g._count?.members ?? 0} {t("طالب")}</Badge>
                    {g.maxStudents && <Badge tone="gold">{t("الحد")}: {g.maxStudents}</Badge>}
                  </div>
                  {g.teacher && <p className="mt-1 text-xs font-semibold text-brand2">{t("المدرس")}: {g.teacher.fullName}</p>}
                  {g.description && <p className="mt-1 text-xs text-muted-foreground">{g.description}</p>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" className="min-h-7 px-2 py-1 text-xs" onClick={() => handleToggleGroup(g.id)}>
                    {openGroupId === g.id ? t("إغلاق") : t("الأعضاء")}
                  </Button>
                  <button
                    onClick={() => { if (confirm(`${t("حذف المجموعة")} "${g.name}"؟`)) onDelete(g.id); }}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              {openGroupId === g.id && (
                <div className="mt-4 border-t border-border pt-3">
                  {/* Members list */}
                  <h4 className="text-xs font-bold text-muted-foreground">{t("الأعضاء الحاليون")}</h4>
                  <div className="mt-2 space-y-1.5">
                    {members.length === 0 ? (
                      <p className="text-xs text-muted-foreground">{t("لا يوجد أعضاء.")}</p>
                    ) : (
                      members.map((m) => (
                        <div key={m.id} className="flex items-center justify-between rounded-md bg-muted/60 px-2.5 py-1.5 text-sm">
                          <span>{m.student.fullName}</span>
                          <button
                            onClick={() => onRemoveMember(g.id, m.studentId)}
                            className="text-xs text-danger hover:underline"
                          >
                            {t("إزالة")}
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add members */}
                  <h4 className="mt-4 text-xs font-bold text-muted-foreground">{t("إضافة طلاب")}</h4>
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
                    {t("إضافة")} {selectedStudentIds.length > 0 ? `(${selectedStudentIds.length})` : ""}
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
  bookings,
  lectures,
}: {
  callsStudents: import("../hooks/use-platform-store").CallsStudentItem[];
  teachers: { id: string; fullName: string; specialty?: string | null; avatarUrl?: string | null }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  availability: any[];
  onFetchAvailability: (teacherId?: string) => Promise<void>;
  onCreate: (input: { studentId: string; teacherId: string; startsAt: string; endsAt?: string; meetingUrl?: string; notes?: string }) => Promise<void>;
  onFetchCallsStudents: () => Promise<void>;
  bookings?: import("../hooks/use-platform-store").LessonBookingItem[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lectures?: any[];
}) {
  const { t } = useI18n();
  const [teacherId, setTeacherId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [duration, setDuration] = useState(30);
  const [pickedTime, setPickedTime] = useState<string | null>(null);
  const [meetingUrl, setMeetingUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    onFetchCallsStudents().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setPickedTime(null);
    if (teacherId) onFetchAvailability(teacherId).catch(() => {});
  }, [teacherId]); // eslint-disable-line react-hooks/exhaustive-deps

  const teacher = teachers.find((t) => t.id === teacherId) ?? null;
  const linked = callsStudents.filter((s) => !teacherId || (s.teacherIds ?? []).includes(teacherId));
  const studentList = linked.length > 0 || !teacherId ? linked : callsStudents;
  const selectedStudent = callsStudents.find((s) => s.studentId === studentId) ?? null;

  // Times already taken for this teacher (booked sessions + scheduled/live lectures)
  const busyEvents = useMemo(() => {
    if (!teacherId) return [] as { start: number; end: number }[];
    const evts: { start: number; end: number }[] = [];
    for (const b of bookings ?? []) {
      if (b.status !== "booked" || b.teacher?.id !== teacherId) continue;
      const s = new Date(b.startsAt).getTime();
      const e = b.endsAt ? new Date(b.endsAt).getTime() : s + 30 * 60_000;
      evts.push({ start: s, end: e });
    }
    for (const l of lectures ?? []) {
      const tid = l.teacherId ?? l.teacher?.id;
      if (tid !== teacherId) continue;
      if (l.status !== "scheduled" && l.status !== "live") continue;
      const s = new Date(l.startsAt).getTime();
      const e = l.endsAt ? new Date(l.endsAt).getTime() : s + 60 * 60_000;
      evts.push({ start: s, end: e });
    }
    return evts;
  }, [teacherId, bookings, lectures]);

  // Expand the teacher's availability on `date` into discrete time slots
  const timeSlots = useMemo(() => {
    if (!teacherId || !date) return [] as { time: string; label: string; busy: boolean }[];
    const d = new Date(`${date}T00:00:00`);
    const dow = d.getDay();
    const out: { time: string; label: string; busy: boolean }[] = [];
    const seen = new Set<string>();
    for (const slot of availability ?? []) {
      if (slot.isActive === false) continue;
      if (slot.specificDate) {
        if (String(slot.specificDate).slice(0, 10) !== date) continue;
      } else if (slot.dayOfWeek !== dow) {
        continue;
      }
      const [sh = 0, sm = 0] = String(slot.startTime).split(":").map(Number);
      const [eh = 0, em = 0] = String(slot.endTime).split(":").map(Number);
      let cur = sh * 60 + sm;
      const end = eh * 60 + em;
      const step = Math.max(duration, 30);
      while (cur + duration <= end) {
        const hh = String(Math.floor(cur / 60)).padStart(2, "0");
        const mm = String(cur % 60).padStart(2, "0");
        const t24 = `${hh}:${mm}`;
        if (!seen.has(t24)) {
          seen.add(t24);
          const h12 = Math.floor(cur / 60) % 12 || 12;
          const ampm = Math.floor(cur / 60) < 12 ? t("ص") : t("م");
          const slotStart = new Date(`${date}T${t24}:00`).getTime();
          const slotEnd = slotStart + duration * 60_000;
          const busy = busyEvents.some((e) => slotStart < e.end && slotEnd > e.start);
          out.push({ time: t24, label: `${String(h12).padStart(2, "0")}:${mm} ${ampm}`, busy });
        }
        cur += step;
      }
    }
    return out;
  }, [teacherId, date, duration, availability, busyEvents]);

  function resetAll() {
    setPickedTime(null); setStudentId(""); setMeetingUrl(""); setNotes(""); setErr(""); setOk("");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setOk("");
    if (!teacherId || !studentId || !date || !pickedTime) {
      setErr(t("اختر المدرس والتاريخ والوقت والطالب لتأكيد الحجز"));
      return;
    }
    const start = new Date(`${date}T${pickedTime}:00`);
    const end = new Date(start.getTime() + duration * 60_000);
    setSaving(true);
    try {
      await onCreate({
        studentId,
        teacherId,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        ...(meetingUrl ? { meetingUrl } : {}),
        ...(notes ? { notes } : {}),
      });
      setOk(t("تم تأكيد الحجز وخصم الحصة من رصيد الطالب ✓"));
      setPickedTime(null); setMeetingUrl(""); setNotes(""); setStudentId("");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : t("فشل إنشاء الحصة"));
    } finally {
      setSaving(false);
    }
  }

  const pickedLabel = timeSlots.find((s) => s.time === pickedTime)?.label ?? pickedTime;
  const dateLabel = date
    ? new Date(`${date}T00:00:00`).toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "—";

  return (
    <form onSubmit={handleCreate} className="space-y-4">
      {/* Header */}
      <Card>
        <div className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-xl bg-brand/10 text-brand">
            <CalendarDays className="size-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold">{t("حجز موعد للطالب")}</h2>
            <p className="text-xs text-muted-foreground">{t("احجز جلسة جديدة لطالب مع المدرس المحدد")}</p>
          </div>
        </div>

        {/* Teacher + Date + Duration */}
        <div className="mt-4 space-y-3 rounded-xl border border-border bg-background/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-sm font-bold text-brand">
              <Award className="size-4" /> {t("المدرس")}
            </span>
            <div className="flex flex-1 items-center gap-3 sm:max-w-md">
              {teacher && (
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand/10 text-sm font-bold text-brand">
                  {teacher.fullName[0]}
                </span>
              )}
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                required
                className="flex h-11 flex-1 rounded-xl border border-input bg-card px-3 text-sm font-semibold"
              >
                <option value="">— {t("اختر المدرس")} —</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName}{t.specialty ? ` · ${t.specialty}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-3">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <CalendarDays className="size-3.5 text-brand" /> {t("التاريخ")}
              </label>
              <Input
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={date}
                onChange={(e) => { setDate(e.target.value); setPickedTime(null); }}
                className="mt-1.5 border-0 bg-transparent px-0 font-semibold"
                required
              />
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Clock3 className="size-3.5 text-brand" /> {t("مدة المكالمة")}
              </label>
              <select
                value={duration}
                onChange={(e) => { setDuration(Number(e.target.value)); setPickedTime(null); }}
                className="mt-1.5 flex h-9 w-full rounded-md bg-transparent text-sm font-semibold"
              >
                <option value={30}>30 {t("دقيقة")}</option>
                <option value={60}>60 {t("دقيقة")} ({t("ساعة")})</option>
                <option value={90}>90 {t("دقيقة")} ({t("ساعة ونصف")})</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Available time slots grid */}
      <Card>
        <div className="flex items-center gap-2">
          <Clock3 className="size-4 text-brand" />
          <h3 className="font-bold">{t("المواعيد المتاحة للمدرس")}</h3>
          {date && <small className="text-xs text-muted-foreground">({dateLabel})</small>}
        </div>
        {!teacherId ? (
          <p className="mt-3 rounded-xl bg-muted/50 py-6 text-center text-xs text-muted-foreground">
            {t("اختر المدرس أولاً لعرض مواعيده المتاحة.")}
          </p>
        ) : timeSlots.length === 0 ? (
          <div className="mt-3 space-y-2 rounded-xl bg-muted/50 p-4 text-center text-xs text-muted-foreground">
            <p>{t("لا توجد فترات متاحة للمدرس في هذا اليوم — جرّب تاريخاً آخر أو اختر وقتاً يدوياً:")}</p>
            {availability.length > 0 && (
              <p className="text-[11px]">
                {t("أيام المدرس المتاحة")}:{" "}
                {Array.from(new Set(availability.map((a) =>
                  a.specificDate
                    ? new Date(a.specificDate).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })
                    : t(["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"][a.dayOfWeek ?? 0]!)
                ))).join(" · ")}
              </p>
            )}
            <div className="mx-auto max-w-[200px] pt-1">
              <Input type="time" value={pickedTime ?? ""} onChange={(e) => setPickedTime(e.target.value || null)} />
            </div>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {timeSlots.map((slot) => {
              const active = pickedTime === slot.time;
              return (
                <button
                  key={slot.time}
                  type="button"
                  disabled={slot.busy}
                  onClick={() => setPickedTime(active ? null : slot.time)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
                    slot.busy
                      ? "cursor-not-allowed border-border bg-muted/70 text-muted-foreground line-through opacity-60"
                      : active
                        ? "border-brand bg-brand text-white shadow-sm"
                        : "border-border bg-background/60 text-foreground hover:border-brand/50 hover:bg-brand/5"
                  }`}
                >
                  {slot.busy ? <span>{slot.label} · {t("محجوز")}</span> : <>{active && <Check className="size-4" />}<span>{slot.label}</span></>}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Student selector */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2 font-bold text-brand">
            <UsersRound className="size-4" /> {t("الطالب")}
          </span>
          <div className="flex-1 sm:max-w-md">
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm font-semibold"
            >
              <option value="">— {t("اختر الطالب")} —</option>
              {studentList.map((s) => (
                <option key={s.id} value={s.studentId}>
                  {s.studentName} — {s.packageName} ({t("متبقي")} {s.sessionsRemaining ?? "—"})
                </option>
              ))}
            </select>
            {teacherId && linked.length === 0 && callsStudents.length > 0 && (
              <small className="mt-1 block text-xs text-muted-foreground">{t("لا يوجد طلاب مربوطون بهذا المدرس — تظهر كل باقات المكالمات.")}</small>
            )}
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Input value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} placeholder={t("رابط الاجتماع (اختياري — يُنشأ تلقائياً إن تُرك فارغاً)")} />
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("ملاحظات للحصة (اختياري)")} />
        </div>
      </Card>

      {/* Booking summary */}
      <Card className="border-brand/30 bg-brand/5">
        <div className="flex items-center gap-2 text-brand">
          <ClipboardCheck className="size-4" />
          <h3 className="font-bold">{t("ملخص الحجز")}</h3>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
          <div className="rounded-xl bg-card p-3">
            <small className="block text-xs text-muted-foreground">{t("الطالب")}</small>
            <b className="mt-1 block truncate text-sm">{selectedStudent?.studentName ?? "—"}</b>
          </div>
          <div className="rounded-xl bg-card p-3">
            <small className="block text-xs text-muted-foreground">{t("المدرس")}</small>
            <b className="mt-1 block truncate text-sm">{teacher?.fullName ?? "—"}</b>
          </div>
          <div className="rounded-xl bg-card p-3">
            <small className="block text-xs text-muted-foreground">{t("التاريخ")}</small>
            <b className="mt-1 block text-xs">{dateLabel}</b>
          </div>
          <div className="rounded-xl bg-card p-3">
            <small className="block text-xs text-muted-foreground">{t("الوقت · المدة")}</small>
            <b className="mt-1 block text-sm">{pickedLabel ?? "—"} · {duration} {t("دقيقة")}</b>
          </div>
        </div>

        {err && <p className="mt-3 rounded-md bg-danger/10 p-2 text-xs font-semibold text-danger">{err}</p>}
        {ok && <p className="mt-3 rounded-md bg-sage/15 p-2 text-xs font-semibold text-sage">{ok}</p>}

        <div className="mt-4 flex gap-3">
          <Button type="submit" disabled={saving || !teacherId || !studentId || !pickedTime} className="flex-1 py-3 text-sm">
            {saving ? t("جاري التأكيد...") : t("✓ تأكيد الحجز")}
          </Button>
          <Button type="button" variant="secondary" onClick={resetAll} className="px-6">
            {t("إلغاء")}
          </Button>
        </div>
      </Card>
    </form>
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
  platformStudents,
  onFetchAvailability,
  onCreateStudent,
  onDeleteStudent,
  onCreateLecture,
  onUpdateLecture,
  onSetLectureStudents,
  onDeleteLecture,
  onAddFile,
  onRemoveFile,
}: {
  freeStudents: import("../hooks/use-platform-store").FreeLectureStudent[];
  freeLectures: import("../hooks/use-platform-store").FreeLecture[];
  groups: import("../hooks/use-platform-store").GroupItem[];
  teachers: { id: string; fullName: string; specialty?: string | null }[];
  availability: any[];
  platformStudents: import("../hooks/use-platform-store").OpsStudentItem[];
  onFetchAvailability: (teacherId?: string) => Promise<void>;
  onCreateStudent: (input: { name: string; phone: string; level?: string | null; groupId?: string | null; notes?: string }) => Promise<void>;
  onDeleteStudent: (id: string) => Promise<void>;
  onCreateLecture: (input: { title: string; description?: string; teacherId?: string; groupId?: string; level?: string | null; startsAt: string; endsAt?: string; meetingUrl?: string; studentIds?: string[] }) => Promise<void>;
  onUpdateLecture: (id: string, input: Record<string, unknown>) => Promise<void>;
  onSetLectureStudents: (id: string, studentIds: string[]) => Promise<void>;
  onDeleteLecture: (id: string) => Promise<void>;
  onAddFile: (id: string, file: { name: string; url: string }) => Promise<void>;
  onRemoveFile: (id: string, index: number) => Promise<void>;
}) {
  const { t } = useI18n();
  const [tab, setTab] = useState<"lectures" | "students">("lectures");
  const [lecPeriod, setLecPeriod] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  const lecInPeriod = (l: import("../hooks/use-platform-store").FreeLecture, v: "upcoming" | "past" | "cancelled") => {
    const end = l.endsAt ? Date.parse(l.endsAt) : Date.parse(l.startsAt);
    if (v === "cancelled") return l.status === "cancelled";
    if (l.status === "cancelled") return false;
    if (v === "upcoming") return end > Date.now() && l.status !== "completed";
    return end <= Date.now() || l.status === "completed";
  };
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
  const [lTargetType, setLTargetType] = useState<"group" | "student">("group");
  const [lGroupId, setLGroupId] = useState("");
  const [lStudentId, setLStudentId] = useState("");
  const [lLevel, setLLevel] = useState("");
  const [lDate, setLDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [lDuration, setLDuration] = useState(60);
  const [lPickedTime, setLPickedTime] = useState<string | null>(null);
  const [lUrl, setLUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [studentsOpenFor, setStudentsOpenFor] = useState<string | null>(null);

  useEffect(() => {
    setLPickedTime(null);
    if (lTeacherId) onFetchAvailability(lTeacherId).catch(() => {});
  }, [lTeacherId]); // eslint-disable-line react-hooks/exhaustive-deps

  const lecTimeSlots = useMemo(() => {
    if (!lTeacherId || !lDate) return [] as { time: string; label: string; busy: boolean }[];
    const d = new Date(`${lDate}T00:00:00`);
    const dow = d.getDay();
    const busyEvts = freeLectures
      .filter((fl) => fl.teacherId === lTeacherId && (fl.status === "scheduled" || fl.status === "live"))
      .map((fl) => {
        const s = new Date(fl.startsAt).getTime();
        const e = fl.endsAt ? new Date(fl.endsAt).getTime() : s + 60 * 60_000;
        return { start: s, end: e };
      });
    const out: { time: string; label: string; busy: boolean }[] = [];
    const seen = new Set<string>();
    for (const slot of availability ?? []) {
      if (slot.isActive === false) continue;
      if (slot.specificDate) {
        if (String(slot.specificDate).slice(0, 10) !== lDate) continue;
      } else if (slot.dayOfWeek !== dow) {
        continue;
      }
      const [sh = 0, sm = 0] = String(slot.startTime).split(":").map(Number);
      const [eh = 0, em = 0] = String(slot.endTime).split(":").map(Number);
      let cur = sh * 60 + sm;
      const end = eh * 60 + em;
      const step = Math.max(lDuration, 30);
      while (cur + lDuration <= end) {
        const hh = String(Math.floor(cur / 60)).padStart(2, "0");
        const mm = String(cur % 60).padStart(2, "0");
        const t24 = `${hh}:${mm}`;
        if (!seen.has(t24)) {
          seen.add(t24);
          const h12 = Math.floor(cur / 60) % 12 || 12;
          const ampm = Math.floor(cur / 60) < 12 ? t("ص") : t("م");
          const slotStart = new Date(`${lDate}T${t24}:00`).getTime();
          const slotEnd = slotStart + lDuration * 60_000;
          const busy = busyEvts.some((e) => slotStart < e.end && slotEnd > e.start);
          out.push({ time: t24, label: `${String(h12).padStart(2, "0")}:${mm} ${ampm}`, busy });
        }
        cur += step;
      }
    }
    return out;
  }, [lTeacherId, lDate, lDuration, availability, freeLectures]);

  const lDateLabel = lDate
    ? new Date(`${lDate}T00:00:00`).toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "—";

  async function handleCreateStudent(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setSaving(true);
    try {
      await onCreateStudent({ name: sName, phone: sPhone, level: sLevel || null, groupId: sGroupId || null, ...(sNotes ? { notes: sNotes } : {}) });
      setSName(""); setSPhone(""); setSLevel(""); setSGroupId(""); setSNotes("");
    } catch (e2) { setErr(e2 instanceof Error ? e2.message : t("فشل إضافة الطالب")); } finally { setSaving(false); }
  }

  async function handleCreateLecture(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!lTitle || !lDate || !lPickedTime) { setErr(t("العنوان والتاريخ والوقت مطلوبون")); return; }
    if (lTargetType === "student" && !lStudentId) { setErr(t("اختر الطالب المستهدف")); return; }
    const start = new Date(`${lDate}T${lPickedTime}:00`);
    const end = new Date(start.getTime() + lDuration * 60_000);
    setSaving(true);
    try {
      await onCreateLecture({
        title: lTitle,
        ...(lDesc ? { description: lDesc } : {}),
        ...(lTeacherId ? { teacherId: lTeacherId } : {}),
        ...(lTargetType === "group" && lGroupId ? { groupId: lGroupId } : {}),
        ...(lTargetType === "student" && lStudentId ? { studentIds: [lStudentId] } : {}),
        level: lLevel || null,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        ...(lUrl ? { meetingUrl: lUrl } : {}),
      });
      setLTitle(""); setLDesc(""); setLTeacherId(""); setLGroupId(""); setLStudentId(""); setLLevel(""); setLPickedTime(null); setLUrl("");
      setShowLecForm(false);
    } catch (e2) { setErr(e2 instanceof Error ? e2.message : t("فشل إنشاء المحاضرة")); } finally { setSaving(false); }
  }

  async function handleUpload(lectureId: string, file: File) {
    setErr("");
    setUploadingFor(lectureId);
    try {
      const uploaded = await uploadFile(file, "courses");
      await onAddFile(lectureId, { name: file.name, url: uploaded.url });
    } catch (e2) { setErr(e2 instanceof Error ? e2.message : t("فشل رفع الملف")); } finally { setUploadingFor(null); }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold">{t("المحاضرة المجانية")}</h2>
            <p className="text-xs text-muted-foreground">{t("المحاضرة تظهر للطلاب اللي تختارهم بس (أو لأعضاء المجموعة المستهدفة) — طلاب التجربة من حجز واتساب + ملفات")}</p>
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => setTab("lectures")} className={`rounded-md px-3 py-1 text-xs ${tab === "lectures" ? "bg-brand text-white" : "bg-muted/60 text-muted-foreground"}`}>
              {t("المحاضرات")} ({freeLectures.length})
            </button>
            <button onClick={() => setTab("students")} className={`rounded-md px-3 py-1 text-xs ${tab === "students" ? "bg-brand text-white" : "bg-muted/60 text-muted-foreground"}`}>
              {t("طلاب التجربة")} ({freeStudents.length})
            </button>
          </div>
        </div>
        {err && <p className="mt-2 text-sm font-semibold text-danger">{err}</p>}
      </Card>

      {tab === "students" && (
        <>
          <Card>
            <h3 className="font-bold">{t("إضافة طالب تجريبي")}</h3>
            <form onSubmit={handleCreateStudent} className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t("الاسم")}</Label>
                <Input value={sName} onChange={(e) => setSName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>{t("رقم الهاتف / واتساب")}</Label>
                <Input value={sPhone} onChange={(e) => setSPhone(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>{t("المستوى")}</Label>
                <select value={sLevel} onChange={(e) => setSLevel(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">— {t("بدون")} —</option>
                  {PLATFORM_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("المجموعة")}</Label>
                <select value={sGroupId} onChange={(e) => setSGroupId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">— {t("بدون مجموعة")} —</option>
                  {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>{t("ملاحظات")}</Label>
                <Input value={sNotes} onChange={(e) => setSNotes(e.target.value)} />
              </div>
              <Button type="submit" disabled={saving}>{saving ? t("جاري الإضافة...") : t("إضافة الطالب")}</Button>
            </form>
          </Card>

          <Card>
            <h3 className="font-bold">{t("قائمة طلاب التجربة")}</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-right text-xs text-muted-foreground">
                    <th className="p-2">{t("الاسم")}</th>
                    <th className="p-2">{t("الهاتف")}</th>
                    <th className="p-2">{t("المستوى")}</th>
                    <th className="p-2">{t("المجموعة")}</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {freeStudents.length === 0 ? (
                    <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">{t("لا يوجد طلاب تجريبيون بعد.")}</td></tr>
                  ) : (
                    freeStudents.map((s) => (
                      <tr key={s.id} className="border-b">
                        <td className="p-2 font-semibold">{s.name}</td>
                        <td className="p-2">{s.phone}</td>
                        <td className="p-2">{s.level ?? "—"}</td>
                        <td className="p-2">{s.group?.name ?? "—"}</td>
                        <td className="p-2">
                          <button onClick={() => { if (confirm(`${t("حذف")} "${s.name}"؟`)) onDeleteStudent(s.id); }} className="text-xs text-danger hover:underline">{t("حذف")}</button>
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
              <h3 className="font-bold">{t("إنشاء محاضرة مجانية")}</h3>
              <Button variant="secondary" className="text-xs" onClick={() => setShowLecForm(!showLecForm)}>
                {showLecForm ? t("إلغاء") : t("+ محاضرة مجانية")}
              </Button>
            </div>
            {showLecForm && (
              <form onSubmit={handleCreateLecture} className="mt-4 space-y-4 rounded-xl border border-border bg-muted/40 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>{t("عنوان المحاضرة")}</Label>
                    <Input value={lTitle} onChange={(e) => setLTitle(e.target.value)} required placeholder={t("مثال: محاضرة تعريفية — مستوى A1")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("المدرس")}</Label>
                    <select value={lTeacherId} onChange={(e) => setLTeacherId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                      <option value="">— {t("اختر المدرس")} —</option>
                      {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("المستوى")}</Label>
                    <select value={lLevel} onChange={(e) => setLLevel(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                      <option value="">— {t("بدون")} —</option>
                      {PLATFORM_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>

                  {/* Target: group OR single student */}
                  <div className="space-y-2 sm:col-span-2">
                    <Label>{t("موجهة إلى")}</Label>
                    <div className="flex gap-1.5">
                      {([["group", "مجموعة"], ["student", "طالب معين"]] as const).map(([v, label]) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setLTargetType(v)}
                          className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                            lTargetType === v ? "bg-brand text-white" : "bg-background text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {t(label)}
                        </button>
                      ))}
                    </div>
                    {lTargetType === "group" ? (
                      <select value={lGroupId} onChange={(e) => setLGroupId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                        <option value="">— {t("اختر المجموعة (أو اتركها وتحدد الطلاب لاحقاً)")} —</option>
                        {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    ) : (
                      <select value={lStudentId} onChange={(e) => setLStudentId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                        <option value="">— {t("اختر الطالب")} —</option>
                        {platformStudents.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.fullName}{s.phone ? ` — ${s.phone}` : ""}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Date + Duration + Teacher availability grid (calls-style) */}
                  <div className="space-y-1.5">
                    <Label>{t("التاريخ")}</Label>
                    <Input
                      type="date"
                      value={lDate}
                      onChange={(e) => { setLDate(e.target.value); setLPickedTime(null); }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("مدة المحاضرة")}</Label>
                    <select
                      value={lDuration}
                      onChange={(e) => { setLDuration(Number(e.target.value)); setLPickedTime(null); }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value={30}>30 {t("دقيقة")}</option>
                      <option value={60}>60 {t("دقيقة")} ({t("ساعة")})</option>
                      <option value={90}>90 {t("دقيقة")} ({t("ساعة ونصف")})</option>
                    </select>
                  </div>

                  <div className="space-y-2 rounded-xl border border-border bg-background/70 p-3 sm:col-span-2">
                    <div className="flex items-center gap-2">
                      <Clock3 className="size-4 text-brand" />
                      <span className="text-xs font-bold">{t("المواعيد المتاحة للمدرس")}</span>
                      {lDate && <small className="text-xs text-muted-foreground">({lDateLabel})</small>}
                    </div>
                    {!lTeacherId ? (
                      <div className="space-y-2 py-2 text-center text-xs text-muted-foreground">
                        <p>{t("اختر المدرس أولاً لعرض مواعيده المتاحة — أو اختر الوقت يدوياً:")}</p>
                        <div className="mx-auto max-w-[200px]">
                          <Input type="time" value={lPickedTime ?? ""} onChange={(e) => setLPickedTime(e.target.value || null)} />
                        </div>
                      </div>
                    ) : lecTimeSlots.length === 0 ? (
                      <div className="space-y-2 py-2 text-center text-xs text-muted-foreground">
                        <p>{t("لا توجد فترات متاحة للمدرس في هذا اليوم — جرّب تاريخاً آخر أو اختر وقتاً يدوياً:")}</p>
                        {availability.length > 0 && (
                          <p className="text-[11px]">
                            {t("أيام المدرس المتاحة")}:{" "}
                            {Array.from(new Set(availability.map((a) =>
                              a.specificDate
                                ? new Date(a.specificDate).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })
                                : t(["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"][a.dayOfWeek ?? 0]!)
                            ))).join(" · ")}
                          </p>
                        )}
                        <div className="mx-auto max-w-[200px]">
                          <Input type="time" value={lPickedTime ?? ""} onChange={(e) => setLPickedTime(e.target.value || null)} />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {lecTimeSlots.map((slot) => {
                          const active = lPickedTime === slot.time;
                          return (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={slot.busy}
                              onClick={() => setLPickedTime(active ? null : slot.time)}
                              className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                                slot.busy
                                  ? "cursor-not-allowed border-border bg-muted/70 text-muted-foreground line-through opacity-60"
                                  : active
                                    ? "border-brand bg-brand text-white shadow-sm"
                                    : "border-border bg-background text-foreground hover:border-brand/50 hover:bg-brand/5"
                              }`}
                            >
                              {slot.busy ? <span>{slot.label} · {t("محجوز")}</span> : <>{active && <Check className="size-3.5" />}<span>{slot.label}</span></>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>{t("رابط الاجتماع (اختياري — يُنشأ تلقائياً إن تُرك فارغاً)")}</Label>
                    <Input value={lUrl} onChange={(e) => setLUrl(e.target.value)} placeholder="https://zoom.us/j/..." />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>{t("الوصف")}</Label>
                    <textarea value={lDesc} onChange={(e) => setLDesc(e.target.value)} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  </div>
                </div>
                {err && <p className="rounded-md bg-danger/10 p-2 text-xs font-semibold text-danger">{err}</p>}
                <Button type="submit" disabled={saving}>{saving ? t("جاري الإنشاء...") : t("إنشاء المحاضرة")}</Button>
              </form>
            )}
          </Card>

          <div className="flex flex-wrap gap-1.5">
            {([["upcoming", "القادمة"], ["past", "السابقة"], ["cancelled", "الملغية"]] as const).map(([v, label]) => (
              <button
                key={v}
                onClick={() => setLecPeriod(v)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                  lecPeriod === v ? "bg-brand text-white" : "bg-muted/60 text-muted-foreground hover:bg-muted"
                }`}
              >
                {t(label)} ({freeLectures.filter((l) => lecInPeriod(l, v)).length})
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {freeLectures.filter((l) => lecInPeriod(l, lecPeriod)).length === 0 ? (
              <Card className="py-10 text-center text-sm text-muted-foreground">{t("لا توجد محاضرات في هذا القسم.")}</Card>
            ) : (
              freeLectures
                .filter((l) => lecInPeriod(l, lecPeriod))
                .map((l) => (
                <Card key={l.id}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <b>{l.title}</b>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge tone="muted">{l.status === "scheduled" ? t("مجدولة") : l.status === "live" ? t("مباشرة") : l.status === "completed" ? t("مكتملة") : t("ملغاة")}</Badge>
                        {l.group && <Badge tone="brand">{l.group.name}</Badge>}
                        {l.level && <Badge tone="gold">{l.level}</Badge>}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(l.startsAt).toLocaleString("ar-EG", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                        {l.teacher && ` · ${l.teacher.fullName}`}
                      </p>
                      {l.meetingUrl && (
                        <a href={l.meetingUrl} target="_blank" rel="noreferrer" className="mt-1 block text-xs text-brand2 underline">{t("رابط الاجتماع")}</a>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="secondary"
                        className="min-h-8 px-2.5 py-1 text-xs"
                        onClick={() => setStudentsOpenFor(studentsOpenFor === l.id ? null : l.id)}
                      >
                        {t("الطلاب")} ({l.invites?.length ?? 0})
                      </Button>
                      <select
                        value={l.status}
                        onChange={(e) => onUpdateLecture(l.id, { status: e.target.value })}
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                      >
                        <option value="scheduled">{t("مجدولة")}</option>
                        <option value="live">{t("مباشرة")}</option>
                        <option value="completed">{t("مكتملة")}</option>
                        <option value="cancelled">{t("ملغاة")}</option>
                      </select>
                      <button onClick={() => { if (confirm(`${t("حذف")} "${l.title}"؟`)) onDeleteLecture(l.id); }} className="rounded-md p-1.5 text-muted-foreground hover:bg-danger/10 hover:text-danger">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>

                  {/* Files */}
                  <div className="mt-3 border-t border-border pt-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-muted-foreground">{t("الملفات")} ({l.files?.length ?? 0})</h4>
                      <label className="cursor-pointer text-xs font-semibold text-brand2 hover:underline">
                        {uploadingFor === l.id ? t("جاري الرفع...") : t("+ رفع ملف")}
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
                            <button onClick={() => onRemoveFile(l.id, i)} className="text-xs text-danger hover:underline">{t("إزالة")}</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {studentsOpenFor === l.id && (
                    <FreeLectureStudentsPanel
                      key={l.id}
                      lecture={l}
                      students={platformStudents}
                      groups={groups}
                      onSave={onSetLectureStudents}
                    />
                  )}
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Free lecture invited-students picker ────────────────────────────────────
// The admin picks exactly which platform students can see a free lecture.
// All students are listed with filters (search, level, group, status,
// subscription, teacher) and multi-select checkboxes.
function FreeLectureStudentsPanel({
  lecture,
  students,
  groups,
  onSave,
}: {
  lecture: import("../hooks/use-platform-store").FreeLecture;
  students: import("../hooks/use-platform-store").OpsStudentItem[];
  groups: import("../hooks/use-platform-store").GroupItem[];
  onSave: (id: string, studentIds: string[]) => Promise<void>;
}) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");
  const [groupId, setGroupId] = useState("");
  const [status, setStatus] = useState("");
  const [subFilter, setSubFilter] = useState<"" | "active" | "none">("");
  const [teacherId, setTeacherId] = useState("");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set((lecture.invites ?? []).map((i) => i.studentId)),
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const teacherOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of students) for (const t of s.teachers) map.set(t.id, t.name);
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [students]);

  const filtered = students.filter((s) => {
    if (search) {
      const q = search.trim().toLowerCase();
      const hay = `${s.fullName} ${s.phone ?? ""} ${s.email ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (level && s.level !== level) return false;
    if (groupId && !s.groups.some((g) => g.id === groupId)) return false;
    if (status && s.studentStatus !== status) return false;
    if (teacherId && !s.teachers.some((t) => t.id === teacherId)) return false;
    if (subFilter === "active" && !s.subscriptions.some((sub) => sub.status === "ACTIVE")) return false;
    if (subFilter === "none" && s.subscriptions.some((sub) => sub.status === "ACTIVE")) return false;
    return true;
  });

  const allFilteredSelected = filtered.length > 0 && filtered.every((s) => selected.has(s.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllFiltered() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) filtered.forEach((s) => next.delete(s.id));
      else filtered.forEach((s) => next.add(s.id));
      return next;
    });
  }

  async function handleSave() {
    setErr("");
    setMsg("");
    setSaving(true);
    try {
      await onSave(lecture.id, [...selected]);
      setMsg(`${t("تم الحفظ — المحاضرة تظهر الآن لـ")} ${selected.size} ${t("طالب")}${lecture.group ? ` + ${t("أعضاء المجموعة")}` : ""}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("فشل حفظ الطلاب"));
    } finally {
      setSaving(false);
    }
  }

  const invitedNames = (lecture.invites ?? []).map((i) => i.student.fullName);

  return (
    <div className="mt-3 border-t border-border pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-xs font-bold text-muted-foreground">
          {t("الطلاب المدعوون — المحاضرة تظهر لهم فقط")}{lecture.group ? ` + ${t("أعضاء المجموعة المستهدفة")}` : ""}
        </h4>
        <Button variant="primary" className="min-h-7 px-3 py-1 text-xs" disabled={saving} onClick={handleSave}>
          {saving ? t("جاري الحفظ...") : `${t("حفظ الاختيار")} (${selected.size})`}
        </Button>
      </div>
      {invitedNames.length > 0 && (
        <p className="mt-1 text-[11px] text-muted-foreground">{t("حالياً")}: {invitedNames.join("، ")}</p>
      )}
      {msg && <p className="mt-1 text-xs font-semibold text-sage">{msg}</p>}
      {err && <p className="mt-1 text-xs font-semibold text-danger">{err}</p>}

      {/* Filters */}
      <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("بحث بالاسم / الهاتف / البريد")} className="sm:col-span-2" />
        <select value={level} onChange={(e) => setLevel(e.target.value)} className="h-10 rounded-md border border-input bg-background px-2 text-sm">
          <option value="">{t("كل المستويات")}</option>
          {PLATFORM_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="h-10 rounded-md border border-input bg-background px-2 text-sm">
          <option value="">{t("كل المجموعات")}</option>
          {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-md border border-input bg-background px-2 text-sm">
          <option value="">{t("كل الحالات")}</option>
          <option value="new">{t("جديد")}</option>
          <option value="active">{t("نشط")}</option>
          <option value="paused">{t("موقوف")}</option>
          <option value="completed">{t("مكتمل")}</option>
        </select>
        <select value={subFilter} onChange={(e) => setSubFilter(e.target.value as "" | "active" | "none")} className="h-10 rounded-md border border-input bg-background px-2 text-sm">
          <option value="">{t("كل الاشتراكات")}</option>
          <option value="active">{t("لديه اشتراك نشط")}</option>
          <option value="none">{t("بدون اشتراك")}</option>
        </select>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
          <option value="">{t("كل المدرسين")}</option>
          {teacherOptions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <span className="text-xs text-muted-foreground">{filtered.length} {t("نتيجة")}</span>
      </div>

      {/* Students table */}
      <div className="mt-2 max-h-72 overflow-y-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted/80 text-right text-xs text-muted-foreground">
            <tr>
              <th className="w-10 p-2">
                <input type="checkbox" checked={allFilteredSelected} onChange={toggleAllFiltered} title={t("تحديد كل النتائج")} />
              </th>
              <th className="p-2">{t("الاسم")}</th>
              <th className="p-2">{t("الهاتف")}</th>
              <th className="p-2">{t("المستوى")}</th>
              <th className="p-2">{t("المجموعات")}</th>
              <th className="p-2">{t("الحالة")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">{t("لا توجد نتائج مطابقة للفلاتر.")}</td></tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} className="cursor-pointer border-b hover:bg-muted/40" onClick={() => toggle(s.id)}>
                  <td className="p-2">
                    <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} onClick={(e) => e.stopPropagation()} />
                  </td>
                  <td className="p-2 font-semibold">{s.fullName}</td>
                  <td className="p-2 font-lat text-xs">{s.phone ?? s.email ?? "—"}</td>
                  <td className="p-2">{s.level ?? "—"}</td>
                  <td className="p-2 text-xs">{s.groups.map((g) => g.name).join("، ") || "—"}</td>
                  <td className="p-2 text-xs">{s.studentStatus === "active" ? t("نشط") : s.studentStatus === "paused" ? t("موقوف") : s.studentStatus === "completed" ? t("مكتمل") : t("جديد")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Teacher Analytics Section (new dashboard style) ────────────────────────
// Earnings rule: 300 per lecture, 50 per counted calls session.
// A session earns when attended OR not attended without timely cancellation.
function TeacherAnalyticsSection({
  data,
  students,
  from,
  to,
  studentId,
  onFromChange,
  onToChange,
  onStudentChange,
  hideFilters,
}: {
  data: import("../hooks/use-platform-store").TeacherAnalytics | null;
  students: { id: string; fullName: string }[];
  from: string;
  to: string;
  studentId: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onStudentChange: (v: string) => void;
  hideFilters?: boolean;
}) {
  const { t } = useI18n();
  const STATUS: Record<string, { label: string; tone: "sage" | "danger" | "muted" | "gold" | "brand" }> = {
    booked: { label: t("قادمة"), tone: "brand" },
    completed: { label: t("حضرها"), tone: "sage" },
    no_show: { label: t("لم يحضر (مخصومة)"), tone: "danger" },
    late_cancel: { label: t("إلغاء متأخر (مخصومة)"), tone: "danger" },
    cancelled: { label: t("ملغاة"), tone: "muted" },
  };

  const stats = data?.totals;
  const cards = [
    { label: t("محاضرات منتهية"), value: `${stats?.lecturesCompleted ?? 0} × ${stats?.lectureRate ?? 300} ج`, icon: Video, tone: "text-brand bg-brand/10" },
    { label: t("حصص محسوبة"), value: `${stats?.sessionsDeducted ?? 0} ${t("حصة")} · ${(stats?.sessionEarnings ?? 0).toLocaleString("ar-EG")} ${t("ج")}`, icon: Clock, tone: "text-gold bg-gold/15" },
    { label: t("طلاب حضروا"), value: stats?.studentsAttended ?? 0, icon: UsersRound, tone: "text-sage bg-sage/15" },
    { label: t("إجمالي الأرباح"), value: `${(stats?.earnings ?? 0).toLocaleString("ar-EG", { maximumFractionDigits: 0 })} ج.م`, icon: Banknote, tone: "text-brand2 bg-brand2/10" },
  ];

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={BarChart3}
        tone="sage"
        title={t("التحليلات")}
        subtitle={t("أرباحك بالحصة: المحاضرة الأساسية = 300 ج · حصة المكالمات حسب مدتها (30 د = 50 ج · ساعة = 100 ج · ساعة ونصف = 150 ج)")}
      />

      {/* Filters */}
      {!hideFilters && (
        <Card className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label>{t("من تاريخ")}</Label>
              <Input type="date" value={from} onChange={(e) => onFromChange(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1">
              <Label>{t("إلى تاريخ")}</Label>
              <Input type="date" value={to} onChange={(e) => onToChange(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1">
              <Label>{t("الطالب")}</Label>
              <select
                value={studentId}
                onChange={(e) => onStudentChange(e.target.value)}
                className="flex h-10 w-48 rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="">{t("كل الطلاب")}</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.fullName}</option>
                ))}
              </select>
            </div>
            {(from || to || studentId) && (
              <Button variant="ghost" onClick={() => { onFromChange(""); onToChange(""); onStudentChange(""); }}>
                {t("مسح الفلاتر")}
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
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

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Completed lectures with attendance */}
        <Card>
          <h3 className="font-bold">{t("المحاضرات المنتهية")} ({data?.lectures.length ?? 0})</h3>
          <div className="mt-3 space-y-2">
            {!data || data.lectures.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">{t("لا توجد محاضرات منتهية في هذه الفترة.")}</p>
            ) : (
              data.lectures.map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-2xl border border-border bg-muted/30 px-4 py-3">
                  <div className="min-w-0">
                    <b className="block truncate text-sm">{l.title}</b>
                    <p className="text-xs text-muted-foreground">
                      {new Date(l.startsAt).toLocaleString("ar-EG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      {l.groupName && ` · ${l.groupName}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {l.status === "live" && <Badge tone="gold">{t("جارية")}</Badge>}
                    {l.counted === false ? (
                      <span className="text-xs text-muted-foreground">{t("تُحتسب بعد انتهاء الموعد")}</span>
                    ) : (
                      <span className="text-xs font-bold text-brand2">+{l.earned} {t("ج.م")}</span>
                    )}
                    <Badge tone="sage">{l.attended} {t("حضور")}{l.groupSize ? ` / ${l.groupSize}` : ""}</Badge>
                    {(l.absent ?? 0) > 0 && <Badge tone="danger">{l.absent} {t("غياب")}</Badge>}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Per-student breakdown */}
        <Card>
          <h3 className="font-bold">{t("الطلاب — الحصص والأرباح")}</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-right text-[11px] text-muted-foreground">
                  <th className="p-2">{t("الطالب")}</th>
                  <th className="p-2">{t("حضر")}</th>
                  <th className="p-2">{t("لم يحضر")}</th>
                  <th className="p-2">{t("قادمة")}</th>
                  <th className="p-2">{t("متبقي")}</th>
                  <th className="p-2">{t("أرباحي")}</th>
                </tr>
              </thead>
              <tbody>
                {!data || data.students.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">{t("لا توجد حصص في هذه الفترة.")}</td></tr>
                ) : (
                  data.students.map((s) => (
                    <tr key={s.studentId} className="border-b border-border/50">
                      <td className="p-2 font-semibold">{s.studentName}</td>
                      <td className="p-2"><Badge tone="sage">{s.attended}</Badge></td>
                      <td className="p-2"><Badge tone="danger">{s.noShow + s.lateCancel}</Badge></td>
                      <td className="p-2"><Badge tone="muted">{s.upcoming}</Badge></td>
                      <td className="p-2">{s.remaining ?? "—"}</td>
                      <td className="p-2 font-bold text-brand2">{s.earned.toLocaleString("ar-EG", { maximumFractionDigits: 0 })} {t("ج.م")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Sessions log */}
      <Card>
        <h3 className="font-bold">{t("سجل الحصص")}</h3>
        <div className="mt-3 space-y-2">
          {!data || data.bookings.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t("لا توجد حصص في هذه الفترة.")}</p>
          ) : (
            data.bookings.map((b) => {
              const st = b.status === "booked" && b.ended
                ? { label: t("انتهت — تم احتسابها"), tone: "sage" as const }
                : STATUS[b.status] ?? { label: b.status, tone: "muted" as const };
              return (
                <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-muted/30 px-4 py-3">
                  <div className="min-w-0">
                    <b className="block text-sm">{b.studentName}</b>
                    <p className="text-xs text-muted-foreground">
                      {new Date(b.startsAt).toLocaleString("ar-EG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      {b.packageName && ` · ${b.packageName}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {b.deducted && (
                      <span className="text-xs font-bold text-brand2">+{b.earned.toLocaleString("ar-EG", { maximumFractionDigits: 0 })} {t("ج.م")}</span>
                    )}
                    <Badge tone={st.tone}>{st.label}</Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}

// ─── Admin Analytics Section ────────────────────────────────────────────────
// Full filtering; the key filter is the teacher. Shows per-teacher totals
// (lecture money + attendance counts) or one teacher's full detail view.
function AdminAnalyticsSection({
  data,
  teachers,
  teacherId,
  from,
  to,
  onTeacherChange,
  onFromChange,
  onToChange,
}: {
  data: import("../hooks/use-platform-store").AdminAnalytics | null;
  teachers: { id: string; fullName: string }[];
  teacherId: string;
  from: string;
  to: string;
  onTeacherChange: (v: string) => void;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
}) {
  const { t } = useI18n();
  const detail =
    data && data.totals && data.lectures && data.bookings && data.students
      ? ({ totals: data.totals, lectures: data.lectures, bookings: data.bookings, students: data.students } as import("../hooks/use-platform-store").TeacherAnalytics)
      : null;

  const agg = data?.teachers ?? [];
  const totals = data?.totals;

  const cards = [
    { label: t("محاضرات تمت"), value: totals?.lecturesCompleted ?? agg.reduce((s, t) => s + t.lecturesCompleted, 0), icon: Video, tone: "text-brand bg-brand/10" },
    { label: t("حصص محسوبة"), value: totals?.sessionsDeducted ?? agg.reduce((s, t) => s + t.sessionsDeducted, 0), icon: Clock, tone: "text-gold bg-gold/15" },
    { label: t("مدرسون"), value: agg.length, icon: UsersRound, tone: "text-sage bg-sage/15" },
    { label: t("إجمالي المستحقات"), value: `${(totals?.earnings ?? agg.reduce((s, t) => s + t.earnings, 0)).toLocaleString("ar-EG", { maximumFractionDigits: 0 })} ${t("ج.م")}`, icon: Banknote, tone: "text-brand2 bg-brand2/10" },
  ];

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={BarChart3}
        tone="brand"
        title={t("التحليلات")}
        subtitle={t("أرباح المدرسين والحضور — المحاضرة = 300 ج · حصة المكالمات = 50 ج")}
      />

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label>{t("المدرس")}</Label>
            <select
              value={teacherId}
              onChange={(e) => onTeacherChange(e.target.value)}
              className="flex h-10 w-56 rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="">{t("كل المدرسين")}</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.fullName}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>{t("من تاريخ")}</Label>
            <Input type="date" value={from} onChange={(e) => onFromChange(e.target.value)} className="w-40" />
          </div>
          <div className="space-y-1">
            <Label>{t("إلى تاريخ")}</Label>
            <Input type="date" value={to} onChange={(e) => onToChange(e.target.value)} className="w-40" />
          </div>
          {(teacherId || from || to) && (
            <Button variant="ghost" onClick={() => { onTeacherChange(""); onFromChange(""); onToChange(""); }}>
              {t("مسح الفلاتر")}
            </Button>
          )}
        </div>
      </Card>

      {/* Stat cards (aggregate only — detail view has its own) */}
      {!(teacherId && detail) && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
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
      )}

      {teacherId && detail ? (
        <TeacherAnalyticsSection
          data={detail}
          students={detail.students.map((s) => ({ id: s.studentId, fullName: s.studentName }))}
          from={from}
          to={to}
          studentId=""
          onFromChange={onFromChange}
          onToChange={onToChange}
          onStudentChange={() => {}}
          hideFilters
        />
      ) : (
        <Card>
          <h3 className="font-bold">{t("المدرسون — المحاضرات والمستحقات")}</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-right text-[11px] text-muted-foreground">
                  <th className="p-2">{t("المدرس")}</th>
                  <th className="p-2">{t("محاضرات")}</th>
                  <th className="p-2">{t("حصص محسوبة")}</th>
                  <th className="p-2">{t("طلاب حضروا")}</th>
                  <th className="p-2">{t("أرباح المحاضرات")}</th>
                  <th className="p-2">{t("أرباح الحصص")}</th>
                  <th className="p-2">{t("الإجمالي")}</th>
                </tr>
              </thead>
              <tbody>
                {agg.length === 0 ? (
                  <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">{t("لا توجد بيانات في هذه الفترة.")}</td></tr>
                ) : (
                  agg.map((t) => (
                    <tr key={t.teacherId} className="cursor-pointer border-b border-border/50 hover:bg-muted/30" onClick={() => onTeacherChange(t.teacherId)}>
                      <td className="p-2 font-semibold text-brand2 underline">{t.teacherName}</td>
                      <td className="p-2">{t.lecturesCompleted}</td>
                      <td className="p-2">{t.sessionsDeducted}</td>
                      <td className="p-2">{t.studentsAttended}</td>
                      <td className="p-2">{t.lectureEarnings.toLocaleString("ar-EG", { maximumFractionDigits: 0 })} {t("ج.م")}</td>
                      <td className="p-2">{t.sessionEarnings.toLocaleString("ar-EG", { maximumFractionDigits: 0 })} {t("ج.م")}</td>
                      <td className="p-2 font-bold text-brand2">{t.earnings.toLocaleString("ar-EG", { maximumFractionDigits: 0 })} {t("ج.م")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Teacher profile (photo + bio) ──────────────────────────────────────────
// The teacher uploads their photo and writes a short bio. Both auto-save to
// their account, appear to the admin, and show on the landing page teachers
// section.
function TeacherProfileSection() {
  const { user, refreshUser } = useAuth();
  const { t } = useI18n();
  const [bio, setBio] = useState(user?.bio ?? "");
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const savedBioRef = useRef(user?.bio ?? "");

  // Debounced auto-save — bio persists ~1s after the teacher stops typing.
  useEffect(() => {
    if (bio === savedBioRef.current) return;
    setSaveState("saving");
    const timer = setTimeout(async () => {
      try {
        await updateProfile({ bio });
        savedBioRef.current = bio;
        await refreshUser();
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [bio]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAvatar(file: File) {
    setAvatarBusy(true);
    try {
      const uploaded = await uploadFile(file, "avatars");
      await updateProfile({ avatarUrl: uploaded.url });
      await refreshUser();
    } catch (e) {
      alert(e instanceof Error ? e.message : t("فشل رفع الصورة"));
    } finally {
      setAvatarBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="relative">
            {user?.avatarUrl ? (
              <img src={mediaSrc(user.avatarUrl)} alt={user.fullName} className="size-28 rounded-full object-cover ring-4 ring-brand/10" />
            ) : (
              <span className="grid size-28 place-items-center rounded-full bg-brand/10 text-4xl font-bold text-brand">
                {user?.fullName?.[0] ?? "؟"}
              </span>
            )}
            <label className="absolute -bottom-1 -left-1 grid size-9 cursor-pointer place-items-center rounded-full bg-brand text-white shadow-md transition hover:bg-brand2">
              <Camera className="size-4" />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={avatarBusy}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatar(f); e.target.value = ""; }}
              />
            </label>
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-right">
            <h2 className="text-lg font-bold">{user?.fullName}</h2>
            <p className="text-xs text-muted-foreground">
              {user?.specialty || t("مدرس")} · {t("صورتك ونبذتك تظهران في الصفحة الرئيسية وللإدارة")}
            </p>
            {avatarBusy && <p className="mt-1 text-xs text-brand2">{t("جاري رفع الصورة...")}</p>}
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <Label>{t("نبذة عنك")}</Label>
          <span className={`text-xs font-semibold ${saveState === "error" ? "text-danger" : "text-sage"}`}>
            {saveState === "saving" && t("جاري الحفظ...")}
            {saveState === "saved" && t("تم الحفظ تلقائياً ✓")}
            {saveState === "error" && t("فشل الحفظ — حاول مرة أخرى")}
          </span>
        </div>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={6}
          maxLength={2000}
          placeholder={t("اكتب نبذة مختصرة عنك — خبرتك، أسلوبك في التدريس، تخصصك...")}
          className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-7"
        />
        <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{t("تُحفظ تلقائياً أثناء الكتابة وتظهر للطلاب في سيكشن المدرسين بالصفحة الرئيسية")}</span>
          <span className="font-lat">{bio.length}/2000</span>
        </div>
      </Card>
    </div>
  );
}

// ─── Teacher: free lectures assigned by admin ────────────────────────────────
// Read-only view of the free lectures the admin scheduled for this teacher,
// with all details + the invited students (and target-group members).
const FL_STATUS: Record<string, { label: string; tone: "sage" | "danger" | "muted" | "gold" | "brand" }> = {
  scheduled: { label: "مجدولة", tone: "brand" },
  live: { label: "مباشرة الآن", tone: "sage" },
  completed: { label: "انتهت", tone: "muted" },
  cancelled: { label: "ملغاة", tone: "danger" },
};

function TeacherFreeLecturesSection({
  lectures,
}: {
  lectures: import("../hooks/use-platform-store").FreeLecture[];
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-3">
      {lectures.length === 0 ? (
        <Card className="py-12 text-center text-sm text-muted-foreground">
          {t("لا توجد محاضرات مجانية مسندة لك حالياً.")}
        </Card>
      ) : (
        lectures.map((l) => {
          const st = FL_STATUS[l.status] ?? FL_STATUS.scheduled;
          const invited = l.invites ?? [];
          const groupStudents = l.groupStudents ?? [];
          return (
            <Card key={l.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <b>{l.title}</b>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge tone={st.tone}>{t(st.label)}</Badge>
                    {l.group && <Badge tone="brand">{l.group.name}</Badge>}
                    {l.level && <Badge tone="gold">{l.level}</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(l.startsAt).toLocaleString("ar-EG", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {l.endsAt &&
                      ` — ${new Date(l.endsAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}`}
                  </p>
                  {l.description && <p className="mt-1 text-sm text-muted-foreground">{l.description}</p>}
                </div>
                {l.meetingUrl && (l.status === "live" || l.status === "scheduled") && (
                  <a
                    href={l.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block rounded-md bg-[#0b2f6e] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#092652]"
                  >
                    {l.status === "live" ? t("ابدأ المحاضرة") : t("رابط الاجتماع")}
                  </a>
                )}
              </div>

              {(l.files ?? []).length > 0 && (
                <div className="mt-3 border-t border-border pt-3">
                  <h4 className="text-xs font-bold text-muted-foreground">{t("الملفات المرفقة")}</h4>
                  <div className="mt-2 space-y-1">
                    {(l.files ?? []).map((f, i) => (
                      <a key={i} href={mediaSrc(f.url)} target="_blank" rel="noreferrer" className="block rounded-md bg-muted/60 px-2.5 py-1.5 text-sm text-brand2 underline">
                        {f.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Students: admin-invited + target-group members */}
              <div className="mt-3 border-t border-border pt-3">
                <h4 className="text-xs font-bold text-muted-foreground">
                  {t("الطلاب")} ({invited.length + groupStudents.length})
                </h4>
                {invited.length + groupStudents.length === 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">{t("لم يحدد الأدمن طلاباً لهذه المحاضرة بعد.")}</p>
                ) : (
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-right text-xs text-muted-foreground">
                          <th className="p-2">{t("الاسم")}</th>
                          <th className="p-2">{t("الهاتف")}</th>
                          <th className="p-2">{t("المستوى")}</th>
                          <th className="p-2">{t("الحضور")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invited.map((i) => (
                          <tr key={`inv-${i.id}`} className="border-b">
                            <td className="p-2 font-semibold">{i.student.fullName}</td>
                            <td className="p-2 font-lat text-xs">{i.student.phone ?? "—"}</td>
                            <td className="p-2">{i.student.level ?? "—"}</td>
                            <td className="p-2"><Badge tone="gold">{t("مدعو")}</Badge></td>
                          </tr>
                        ))}
                        {groupStudents.map((s) => (
                          <tr key={`grp-${s.id}`} className="border-b">
                            <td className="p-2 font-semibold">{s.fullName}</td>
                            <td className="p-2 font-lat text-xs">{s.phone ?? "—"}</td>
                            <td className="p-2">{s.level ?? "—"}</td>
                            <td className="p-2"><Badge tone="brand">{l.group?.name ?? t("مجموعة")}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}

// ─── Teacher: unified schedule (basic lectures + calls bookings + free lectures) with filters ──
function TeacherScheduleTimeline({
  lectures,
  bookings,
  freeLectures,
  onLectureStatus,
  onBookingStatus,
  attStudents,
  onFetchAttStudents,
  onSaveAttendance,
}: {
  lectures: import("../hooks/use-platform-store").LectureItem[];
  bookings: import("../hooks/use-platform-store").LessonBookingItem[];
  freeLectures: import("../hooks/use-platform-store").FreeLecture[];
  onLectureStatus: (id: string, status: "live" | "completed") => void;
  onBookingStatus: (id: string, status: "completed" | "no_show" | "booked") => void;
  attStudents: import("../hooks/use-platform-store").LectureStudent[];
  onFetchAttStudents: (lectureId: string) => Promise<void>;
  onSaveAttendance: (lectureId: string, records: { studentId: string; status: "present" | "absent"; report?: string }[]) => Promise<void>;
}) {
  const { t } = useI18n();
  const [typeF, setTypeF] = useState("");
  const [periodF, setPeriodF] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  const [groupF, setGroupF] = useState("");
  const [q, setQ] = useState("");
  const [fromD, setFromD] = useState("");
  const [toD, setToD] = useState("");

  // Inline attendance (merged into schedule — after the lecture ends)
  const [attOpenId, setAttOpenId] = useState<string | null>(null);
  const [attDraft, setAttDraft] = useState<Record<string, "present" | "absent">>({});
  const [repDraft, setRepDraft] = useState<Record<string, string>>({});
  const [repOpenFor, setRepOpenFor] = useState<string | null>(null);
  const [attSaving, setAttSaving] = useState(false);
  const [attErr, setAttErr] = useState("");

  function toggleAttendance(id: string) {
    if (attOpenId === id) {
      setAttOpenId(null);
      return;
    }
    setAttOpenId(id);
    setAttDraft({});
    setRepDraft({});
    setRepOpenFor(null);
    setAttErr("");
    onFetchAttStudents(id).catch(() => setAttErr(t("فشل تحميل طلاب المحاضرة")));
  }

  async function saveAttendance(lectureId: string) {
    setAttSaving(true);
    setAttErr("");
    try {
      const records = attStudents
        .filter((s) => attDraft[s.id] !== undefined || repDraft[s.id] !== undefined)
        .map((s) => ({
          studentId: s.id,
          status: (attDraft[s.id] ?? s.status ?? "present") as "present" | "absent",
          ...(repDraft[s.id] !== undefined ? { report: repDraft[s.id] } : {}),
        }));
      await onSaveAttendance(lectureId, records);
      await onFetchAttStudents(lectureId);
      setAttDraft({});
      setRepDraft({});
      setRepOpenFor(null);
    } catch {
      setAttErr(t("فشل حفظ الحضور — حاول مرة أخرى"));
    } finally {
      setAttSaving(false);
    }
  }

  type Row = {
    id: string;
    kind: "lecture" | "booking" | "free";
    title: string;
    sub?: string;
    startsAt: string;
    endsAt?: string | null;
    status: string;
    meetingUrl?: string | null;
    level?: string | null;
    groupName?: string | null;
    studentsCount?: number;
  };

  const all: Row[] = [
    ...lectures.map((l) => ({
      id: l.id, kind: "lecture" as const, title: l.title,
      startsAt: l.startsAt, endsAt: l.endsAt ?? null, status: l.status,
      meetingUrl: l.meetingUrl, level: l.level, groupName: l.groupName ?? null,
      sub: l.groupName ?? undefined,
    })),
    ...bookings.map((b) => ({
      id: b.id, kind: "booking" as const,
      title: `${t("حصة فردية")} — ${b.student?.fullName ?? t("طالب")}`,
      startsAt: b.startsAt, endsAt: b.endsAt ?? null, status: b.status,
      meetingUrl: b.meetingUrl,
    })),
    ...freeLectures.map((l) => ({
      id: l.id, kind: "free" as const, title: l.title,
      sub: l.description ?? undefined,
      startsAt: l.startsAt, endsAt: l.endsAt ?? null, status: l.status,
      meetingUrl: l.meetingUrl, level: l.level,
      groupName: l.group?.name ?? null,
      studentsCount: (l.invites?.length ?? 0) + (l.groupStudents?.length ?? 0),
    })),
  ];

  const groups = Array.from(new Set(all.map((r) => r.groupName).filter(Boolean))) as string[];
  const now = Date.now();

  const rows = all
    .filter((r) => !typeF || r.kind === typeF)
    .filter((r) => !groupF || r.groupName === groupF)
    .filter((r) => {
      const end = (r.endsAt ? Date.parse(r.endsAt) : Date.parse(r.startsAt));
      if (periodF === "cancelled") return r.status === "cancelled";
      if (r.status === "cancelled") return false;
      if (periodF === "upcoming") return end > now && r.status !== "completed";
      return end <= now || r.status === "completed" || r.status === "no_show";
    })
    .filter((r) => !q.trim() || [r.title, r.sub ?? "", r.groupName ?? ""].some((v) => v.toLowerCase().includes(q.trim().toLowerCase())))
    .filter((r) => !fromD || new Date(r.startsAt) >= new Date(`${fromD}T00:00:00`))
    .filter((r) => !toD || new Date(r.startsAt) <= new Date(`${toD}T23:59:59`))
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  const STATUS: Record<string, { label: string; tone: "brand" | "sage" | "muted" | "danger" }> = {
    scheduled: { label: "مجدولة", tone: "brand" },
    live: { label: "مباشر الآن", tone: "sage" },
    booked: { label: "محجوزة", tone: "brand" },
    completed: { label: "مكتملة", tone: "muted" },
    cancelled: { label: "ملغاة", tone: "danger" },
    no_show: { label: "لم يحضر", tone: "danger" },
  };
  const st = (s: string) => STATUS[s] ?? { label: s, tone: "muted" as const };
  const KIND: Record<Row["kind"], { label: string; tone: "brand" | "sage" | "muted" | "gold"; icon: typeof Video }> = {
    lecture: { label: "محاضرة أساسية", tone: "muted", icon: Video },
    booking: { label: "حصة فردية", tone: "sage", icon: PhoneCall },
    free: { label: "محاضرة مجانية", tone: "gold", icon: Gift },
  };
  const fmt = (iso: string) => new Date(iso).toLocaleString("ar-EG", { weekday: "long", day: "numeric", month: "long" });
  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">{t("جدولي")} ({rows.length})</h2>
          <p className="text-xs text-muted-foreground">{t("المحاضرات الأساسية والحصص الفردية والمحاضرات المجانية في مكان واحد")}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {([["upcoming", t("القادمة")], ["past", t("السابقة")], ["cancelled", t("الملغية")]] as const).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setPeriodF(v)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
              periodF === v ? "bg-brand text-white" : "bg-muted/60 text-muted-foreground hover:bg-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <SearchBox value={q} onChange={setQ} placeholder={t("بحث باسم الطالب / المحاضرة / المجموعة")} />
        <select value={typeF} onChange={(e) => setTypeF(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
          <option value="">{t("كل الأنواع")}</option>
          <option value="lecture">{t("محاضرات أساسية")}</option>
          <option value="booking">{t("حصص فردية (مكالمات)")}</option>
          <option value="free">{t("محاضرات مجانية")}</option>
        </select>
        {groups.length > 0 && (
          <select value={groupF} onChange={(e) => setGroupF(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">{t("كل المجموعات")}</option>
            {groups.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        )}
        <Input type="date" value={fromD} onChange={(e) => setFromD(e.target.value)} />
        <Input type="date" value={toD} onChange={(e) => setToD(e.target.value)} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.length === 0 ? (
          <div className="rounded-md bg-muted/60 p-6 text-center text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">
            {t("لا توجد مواعيد مطابقة للفلاتر الحالية.")}
          </div>
        ) : (
          rows.map((r) => {
            const k = KIND[r.kind];
            const KIcon = k.icon;
            const ended = (r.endsAt ? Date.parse(r.endsAt) : Date.parse(r.startsAt)) <= now;
            return (
              <div key={`${r.kind}-${r.id}`} className="flex flex-col rounded-xl border border-border bg-background/60 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                      <KIcon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <b className="block truncate text-sm">{r.title}</b>
                      <Badge tone={k.tone} className="mt-0.5">{t(k.label)}</Badge>
                    </div>
                  </div>
                  <Badge tone={st(r.status).tone}>{t(st(r.status).label)}</Badge>
                </div>

                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5"><CalendarDays className="size-3.5 shrink-0" />{fmt(r.startsAt)}</p>
                  <p className="flex items-center gap-1.5 font-lat"><Clock3 className="size-3.5 shrink-0" />{fmtTime(r.startsAt)}{r.endsAt ? ` → ${fmtTime(r.endsAt)}` : ""}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {r.level && <Badge tone="muted">{t("مستوى")} {r.level}</Badge>}
                    {r.groupName && <Badge tone="muted">{r.groupName}</Badge>}
                    {r.studentsCount !== undefined && r.studentsCount > 0 && <Badge tone="brand">{r.studentsCount} {t("طالب")}</Badge>}
                  </div>
                  {r.sub && <p className="truncate pt-0.5" title={r.sub}>{r.sub}</p>}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
                  {r.kind === "lecture" && r.status === "scheduled" && (
                    <Button variant="primary" className="text-xs" onClick={() => onLectureStatus(r.id, "live")}>{t("بدء المحاضرة")}</Button>
                  )}
                  {r.kind === "lecture" && r.status === "live" && (
                    <Button variant="secondary" className="text-xs" onClick={() => onLectureStatus(r.id, "completed")}>{t("إنهاء المحاضرة")}</Button>
                  )}
                  {r.kind === "booking" && r.status === "booked" && ended && (
                    <>
                      <Button variant="primary" className="text-xs" onClick={() => onBookingStatus(r.id, "completed")}>{t("مكتملة")}</Button>
                      <Button variant="secondary" className="text-xs" onClick={() => onBookingStatus(r.id, "no_show")}>{t("لم يحضر")}</Button>
                    </>
                  )}
                  {r.meetingUrl && (r.status === "scheduled" || r.status === "live" || r.status === "booked") && (
                    <a
                      href={r.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand/20"
                    >
                      {t("دخول الاجتماع ↗")}
                    </a>
                  )}
                  {r.kind === "lecture" && (ended || r.status === "completed") && (
                    <button
                      onClick={() => toggleAttendance(r.id)}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                        attOpenId === r.id
                          ? "bg-gold/20 text-gold"
                          : "bg-gold/10 text-gold hover:bg-gold/20"
                      }`}
                    >
                      {attOpenId === r.id ? t("إخفاء الحضور") : t("تسجيل الحضور")}
                    </button>
                  )}
                </div>

                {attOpenId === r.id && (
                  <div className="mt-3 border-t border-border/60 pt-3">
                    {attErr && (
                      <p className="mb-2 rounded-md bg-danger/10 p-2 text-xs font-semibold text-danger">{attErr}</p>
                    )}
                    {attStudents.length === 0 ? (
                      <p className="py-3 text-center text-xs text-muted-foreground">{t("لا يوجد طلاب لهذه المحاضرة.")}</p>
                    ) : (
                      <>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {attStudents.map((s) => {
                            const cur = attDraft[s.id] ?? s.status ?? null;
                            const reportVal = repDraft[s.id] ?? s.report ?? "";
                            const hasReport = !!(s.report || repDraft[s.id]);
                            return (
                              <div key={s.id} className="flex flex-col rounded-lg border border-border bg-background/60 p-2.5">
                                <div className="flex items-center justify-between gap-2">
                                  <b className="min-w-0 truncate text-xs">{s.fullName}</b>
                                  {hasReport && <Badge tone="gold">{t("تقرير")}</Badge>}
                                </div>
                                <div className="mt-2 flex gap-1.5">
                                  {(["present", "absent"] as const).map((st2) => (
                                    <button
                                      key={st2}
                                      onClick={() => setAttDraft((d) => ({ ...d, [s.id]: st2 }))}
                                      className={`flex-1 rounded-md px-2 py-1 text-[11px] font-bold transition ${
                                        cur === st2
                                          ? st2 === "present" ? "bg-sage text-white" : "bg-danger text-white"
                                          : "bg-muted/60 text-muted-foreground hover:bg-muted"
                                      }`}
                                    >
                                      {st2 === "present" ? t("حاضر") : t("غائب")}
                                    </button>
                                  ))}
                                </div>
                                <button
                                  onClick={() => setRepOpenFor((o) => (o === s.id ? null : s.id))}
                                  className="mt-1.5 self-start text-[11px] font-semibold text-brand hover:underline"
                                >
                                  {hasReport ? t("تعديل التقرير") : t("+ إضافة تقرير")}
                                </button>
                                {(repOpenFor === s.id || reportVal) && (
                                  <textarea
                                    value={reportVal}
                                    onChange={(e) => setRepDraft((d) => ({ ...d, [s.id]: e.target.value }))}
                                    placeholder={t("تقرير عن أداء الطالب في المحاضرة...")}
                                    rows={2}
                                    className="mt-1.5 w-full rounded-md border border-input bg-background px-2 py-1.5 text-[11px]"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <Button
                          variant="primary"
                          className="mt-3 w-full text-xs"
                          disabled={attSaving || (Object.keys(attDraft).length === 0 && Object.keys(repDraft).length === 0)}
                          onClick={() => saveAttendance(r.id)}
                        >
                          {attSaving ? t("جاري الحفظ...") : t("حفظ الحضور والتقارير")}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}

// ─── Admin: lecture attendance + teacher reports viewer ──
function AdminLectureReportsCard({
  lectures,
  fetchLectures,
  fetchAttendance,
}: {
  lectures: import("../hooks/use-platform-store").AdminLectureItem[];
  fetchLectures: (filter?: { status?: string }) => Promise<void>;
  fetchAttendance: (lectureId: string) => Promise<import("../hooks/use-platform-store").AdminLectureAttendance[]>;
}) {
  const { t } = useI18n();
  const [lectureId, setLectureId] = useState("");
  const [records, setRecords] = useState<import("../hooks/use-platform-store").AdminLectureAttendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) {
      fetchLectures({ status: "all" }).then(() => setLoaded(true)).catch(() => {});
    }
  }, [loaded, fetchLectures]);

  async function pick(id: string) {
    setLectureId(id);
    if (!id) { setRecords([]); return; }
    setLoading(true);
    try {
      setRecords(await fetchAttendance(id));
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h3 className="font-bold">{t("حضور وتقارير المحاضرات")}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{t("اختر محاضرة لعرض حضور طلابها وتقارير المدرس عن كل طالب")}</p>
      <div className="mt-3">
        <select
          value={lectureId}
          onChange={(e) => pick(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">— {t("اختر المحاضرة")} —</option>
          {lectures.map((l) => (
            <option key={l.id} value={l.id}>
              {new Date(l.startsAt).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })} — {l.title}
              {l.teacher?.fullName ? ` (${l.teacher.fullName})` : ""}
            </option>
          ))}
        </select>
      </div>

      {lectureId && (
        <div className="mt-4">
          {loading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">{t("جاري التحميل...")}</div>
          ) : records.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">{t("لا توجد سجلات حضور لهذه المحاضرة بعد.")}</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {records.map((r) => (
                <div key={r.id} className="rounded-xl border border-border bg-background/60 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <b className="min-w-0 truncate text-sm">{r.student.fullName}</b>
                    <Badge tone={r.status === "present" ? "sage" : "danger"}>
                      {r.status === "present" ? t("حاضر") : t("غائب")}
                    </Badge>
                  </div>
                  <small className="text-muted-foreground">{r.student.phone ?? r.student.level ?? "—"}</small>
                  {r.report && (
                    <p className="mt-2 border-t border-border/60 pt-2 text-xs text-muted-foreground">{r.report}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ─── Admin: full-screen profile overlay (teacher / student) ──────────────────
function ProfileOverlay({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-3 sm:p-6" onClick={onClose}>
      <div className="mx-auto max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{title}</h2>
            <button onClick={onClose} className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted">✕ {t("إغلاق")}</button>
          </div>
          {children}
        </Card>
      </div>
    </div>
  );
}

const PROFILE_STATUS: Record<string, { label: string; tone: "brand" | "sage" | "muted" | "danger" | "gold" }> = {
  scheduled: { label: "مجدولة", tone: "brand" },
  live: { label: "مباشر", tone: "sage" },
  booked: { label: "محجوزة", tone: "brand" },
  completed: { label: "مكتملة", tone: "muted" },
  cancelled: { label: "ملغاة", tone: "danger" },
  no_show: { label: "لم يحضر", tone: "danger" },
};
const profSt = (s: string) => PROFILE_STATUS[s] ?? { label: s, tone: "muted" as const };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AdminTeacherProfileModal({ teacherId, fetchProfile, onClose }: { teacherId: string; fetchProfile: (id: string) => Promise<any>; onClose: () => void }) {
  const { t: tr } = useI18n();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [d, setD] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lectureF, setLectureF] = useState("all");
  const [studentQ, setStudentQ] = useState("");

  useEffect(() => {
    fetchProfile(teacherId).then(setD).catch(() => {}).finally(() => setLoading(false));
  }, [teacherId, fetchProfile]);

  if (loading || !d) {
    return <ProfileOverlay title={tr("ملف المدرس")} onClose={onClose}><div className="py-16 text-center text-sm text-muted-foreground">{tr("جاري تحميل الملف...")}</div></ProfileOverlay>;
  }

  const t = d.teacher;
  const now = Date.now();
  const upcomingLectures = d.lectures.filter((l: { startsAt: string }) => new Date(l.startsAt).getTime() >= now);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filteredLectures = d.lectures.filter((l: any) => lectureF === "all" || (lectureF === "upcoming" ? new Date(l.startsAt).getTime() >= now : l.status === lectureF));
  const filteredStudents = d.students.filter((s: { fullName: string; phone?: string | null }) =>
    !studentQ.trim() || s.fullName.includes(studentQ.trim()) || (s.phone ?? "").includes(studentQ.trim()));
  const totals = d.analytics?.totals;

  return (
    <ProfileOverlay title={`${tr("ملف المدرس")} — ${t.fullName}`} onClose={onClose}>
      <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-border bg-background/60 p-4">
        <span className="grid size-14 place-items-center rounded-full bg-brand/10 text-xl font-bold text-brand">{t.fullName[0]}</span>
        <div className="min-w-0 flex-1">
          <b className="text-lg">{t.fullName}</b>
          <p className="text-xs text-muted-foreground">{t.specialty ?? "—"} · {tr("انضم")} {new Date(t.createdAt).toLocaleDateString("ar-EG")}</p>
          <p className="mt-0.5 font-lat text-xs text-muted-foreground">{t.phone ?? ""} {t.email ? `· ${t.email}` : ""}</p>
          {t.bio && <p className="mt-1 text-xs text-muted-foreground">{t.bio}</p>}
        </div>
        <Badge tone={t.isActive ? "sage" : "danger"}>{t.isActive ? tr("نشط") : tr("معطّل")}</Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-3 text-center"><b className="font-lat text-xl text-brand">{d.students.length}</b><p className="text-xs text-muted-foreground">{tr("طالب")}</p></Card>
        <Card className="p-3 text-center"><b className="font-lat text-xl">{d.groups.length}</b><p className="text-xs text-muted-foreground">{tr("مجموعة")}</p></Card>
        <Card className="p-3 text-center"><b className="font-lat text-xl">{upcomingLectures.length}</b><p className="text-xs text-muted-foreground">{tr("محاضرة قادمة")}</p></Card>
        <Card className="p-3 text-center"><b className="font-lat text-xl text-sage">{totals?.earnings ?? 0} {tr("ج")}</b><p className="text-xs text-muted-foreground">{tr("إجمالي الأرباح")}</p></Card>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-3 text-center"><b className="font-lat text-xl">{totals?.lecturesCompleted ?? 0}</b><p className="text-xs text-muted-foreground">{tr("محاضرة أساسية")}</p></Card>
        <Card className="p-3 text-center"><b className="font-lat text-xl">{d.freeLectures.length}</b><p className="text-xs text-muted-foreground">{tr("محاضرة مجانية")}</p></Card>
        <Card className="p-3 text-center"><b className="font-lat text-xl">{d.bookings.length}</b><p className="text-xs text-muted-foreground">{tr("حصة مكالمات")}</p></Card>
        <Card className="p-3 text-center"><b className="font-lat text-xl">{totals?.sessionsDeducted ?? 0}</b><p className="text-xs text-muted-foreground">{tr("حصص محتسبة")}</p></Card>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="font-bold">{tr("المواعيد الثابتة")} ({d.schedules.length})</h3>
          <div className="mt-2 space-y-1.5">
            {d.schedules.length === 0 ? <p className="text-xs text-muted-foreground">{tr("لا توجد مواعيد ثابتة.")}</p> :
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              d.schedules.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between rounded-md bg-muted/50 px-2.5 py-1.5 text-xs">
                  <span><b>{s.title}</b>{s.group?.name ? ` · ${s.group.name}` : ""}</span>
                  <span className="text-muted-foreground">{DAY_NAMES[s.dayOfWeek]} {s.startTime}–{s.endTime}</span>
                </div>
              ))}
          </div>
          <h3 className="mt-4 font-bold">{tr("الأوقات المتاحة")} ({d.availability.length})</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {d.availability.length === 0 ? <p className="text-xs text-muted-foreground">{tr("لم يحدد أوقاتاً متاحة.")}</p> :
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              d.availability.map((a: any) => (
                <Badge key={a.id} tone={a.isActive ? "brand" : "muted"}>
                  {a.specificDate ? new Date(a.specificDate).toLocaleDateString("ar-EG") : DAY_NAMES[a.dayOfWeek]} {a.startTime}–{a.endTime}
                </Badge>
              ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-bold">{tr("المجموعات")} ({d.groups.length})</h3>
          <div className="mt-2 space-y-1.5">
            {d.groups.length === 0 ? <p className="text-xs text-muted-foreground">{tr("لا توجد مجموعات.")}</p> :
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              d.groups.map((g: any) => (
                <div key={g.id} className="flex items-center justify-between rounded-md bg-muted/50 px-2.5 py-1.5 text-xs">
                  <b>{g.name}</b>
                  <span className="text-muted-foreground">{g._count?.members ?? 0} {tr("طالب")}</span>
                </div>
              ))}
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold">{tr("محاضراته")} ({filteredLectures.length})</h3>
          <div className="flex gap-1">
            {([["all", "الكل"], ["upcoming", "القادمة"], ["scheduled", "مجدولة"], ["live", "مباشر"], ["completed", "مكتملة"], ["cancelled", "ملغاة"]] as const).map(([v, l]) => (
              <button key={v} onClick={() => setLectureF(v)} className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${lectureF === v ? "bg-brand text-white" : "bg-muted/60 text-muted-foreground"}`}>{tr(l)}</button>
            ))}
          </div>
        </div>
        <div className="mt-3 max-h-72 space-y-1.5 overflow-y-auto">
          {filteredLectures.length === 0 ? <p className="py-4 text-center text-xs text-muted-foreground">{tr("لا توجد محاضرات.")}</p> :
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            filteredLectures.map((l: any) => (
              <div key={l.id} className="flex items-center justify-between gap-2 rounded-md border border-border bg-background/60 px-3 py-2 text-xs">
                <div className="min-w-0">
                  <b className="block truncate">{l.title}</b>
                  <span className="text-muted-foreground">{new Date(l.startsAt).toLocaleString("ar-EG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}{l.group?.name ? ` · ${l.group.name}` : ""} · {l._count?.attendance ?? 0} {tr("حاضر")}</span>
                </div>
                <Badge tone={profSt(l.status).tone}>{tr(profSt(l.status).label)}</Badge>
              </div>
            ))}
        </div>
      </Card>

      <Card className="mt-4">
        <h3 className="font-bold">{tr("حصص المكالمات")} ({d.bookings.length})</h3>
        <div className="mt-3 max-h-60 space-y-1.5 overflow-y-auto">
          {d.bookings.length === 0 ? <p className="py-4 text-center text-xs text-muted-foreground">{tr("لا توجد حصص.")}</p> :
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            d.bookings.map((b: any) => (
              <div key={b.id} className="flex items-center justify-between gap-2 rounded-md border border-border bg-background/60 px-3 py-2 text-xs">
                <span>{b.student?.fullName} · {new Date(b.startsAt).toLocaleString("ar-EG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                <Badge tone={profSt(b.status).tone}>{tr(profSt(b.status).label)}</Badge>
              </div>
            ))}
        </div>
      </Card>

      <Card className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold">{tr("طلابه")} ({filteredStudents.length})</h3>
          <SearchBox value={studentQ} onChange={setStudentQ} placeholder={tr("بحث باسم الطالب أو هاتفه")} />
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-right text-xs text-muted-foreground"><th className="p-2">{tr("الاسم")}</th><th className="p-2">{tr("الهاتف")}</th><th className="p-2">{tr("المستوى")}</th><th className="p-2">{tr("الحالة")}</th></tr></thead>
            <tbody>
              {filteredStudents.map((s: { id: string; fullName: string; phone: string | null; level: string | null; studentStatus: string | null }) => (
                <tr key={s.id} className="border-b">
                  <td className="p-2 font-semibold">{s.fullName}</td>
                  <td className="p-2 font-lat text-xs">{s.phone ?? "—"}</td>
                  <td className="p-2 text-xs">{s.level ?? "—"}</td>
                  <td className="p-2"><Badge tone={DIR_STATUS_TONES[s.studentStatus ?? ""] ?? "muted"}>{tr(DIR_STATUS_LABELS[s.studentStatus ?? ""] ?? s.studentStatus ?? "—")}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </ProfileOverlay>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AdminStudentProfileModal({ studentId, fetchProfile, onDeleteSub, onRestore, onChanged, onClose }: {
  studentId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchProfile: (id: string) => Promise<any>;
  onDeleteSub?: (id: string) => Promise<void>;
  onRestore?: (id: string) => Promise<void>;
  onChanged?: () => void;
  onClose: () => void;
}) {
  const { t: tr } = useI18n();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [d, setD] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function reload() {
    try { setD(await fetchProfile(studentId)); } catch { /* ignore */ }
    setLoading(false);
  }
  useEffect(() => { reload(); }, [studentId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || !d) {
    return <ProfileOverlay title={tr("ملف الطالب")} onClose={onClose}><div className="py-16 text-center text-sm text-muted-foreground">{tr("جاري تحميل الملف...")}</div></ProfileOverlay>;
  }

  const s = d.student;
  const now = Date.now();
  const upcomingBookings = d.bookings.filter((b: { startsAt: string; status: string }) => new Date(b.startsAt).getTime() >= now && b.status === "booked");

  async function subAction(fn: (id: string) => Promise<void>, id: string, confirmText: string) {
    if (!confirm(confirmText)) return;
    setBusy(true);
    try { await fn(id); await reload(); onChanged?.(); } catch (e) { alert(e instanceof Error ? e.message : tr("فشلت العملية")); }
    finally { setBusy(false); }
  }

  return (
    <ProfileOverlay title={`${tr("ملف الطالب")} — ${s.fullName}`} onClose={onClose}>
      <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-border bg-background/60 p-4">
        <span className="grid size-14 place-items-center rounded-full bg-brand/10 text-xl font-bold text-brand">{s.fullName[0]}</span>
        <div className="min-w-0 flex-1">
          <b className="text-lg">{s.fullName}</b>
          <p className="text-xs text-muted-foreground">{tr("انضم")} {new Date(s.createdAt).toLocaleDateString("ar-EG")} · {tr("المستوى")} {s.level ?? "—"}{s.placementScore != null ? ` (${s.placementScore}%)` : ""}</p>
          <p className="mt-0.5 font-lat text-xs text-muted-foreground">{s.phone ?? ""} {s.email ? `· ${s.email}` : ""}</p>
        </div>
        <div className="flex gap-1.5">
          <Badge tone={DIR_STATUS_TONES[s.studentStatus ?? ""] ?? "muted"}>{tr(DIR_STATUS_LABELS[s.studentStatus ?? ""] ?? s.studentStatus)}</Badge>
          <Badge tone={s.isActive ? "sage" : "danger"}>{s.isActive ? tr("نشط") : tr("معطّل")}</Badge>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-3 text-center"><b className="font-lat text-xl text-brand">{d.stats.avgScore !== null ? `${d.stats.avgScore}%` : "—"}</b><p className="text-xs text-muted-foreground">{tr("متوسط الدرجات")} ({d.stats.examsTaken})</p></Card>
        <Card className="p-3 text-center"><b className="font-lat text-xl text-sage">{d.stats.attendanceRate !== null ? `${d.stats.attendanceRate}%` : "—"}</b><p className="text-xs text-muted-foreground">{tr("نسبة الحضور")}</p></Card>
        <Card className="p-3 text-center"><b className="font-lat text-xl">{d.stats.lecturesAttended} / {d.stats.lecturesAbsent}</b><p className="text-xs text-muted-foreground">{tr("حضور / غياب محاضرات")}</p></Card>
        <Card className="p-3 text-center"><b className="font-lat text-xl text-gold">{d.stats.certificatesCount}</b><p className="text-xs text-muted-foreground">{tr("شهادات")}</p></Card>
      </div>
      {d.stats.skillsAvg !== null && (
        <Card className="mt-3 p-3">
          <div className="flex items-center justify-between text-xs"><b>{tr("مستوى تقدمه في المهارات")}</b><span className="font-lat text-brand">{d.stats.skillsAvg}%</span></div>
          <ProgressBar value={d.stats.skillsAvg} tone={d.stats.skillsAvg >= 70 ? "sage" : d.stats.skillsAvg >= 50 ? "gold" : "brand"} className="mt-2" />
        </Card>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="font-bold">{tr("الاشتراكات")} ({d.subscriptions.length})</h3>
          <div className="mt-2 space-y-2">
            {d.subscriptions.length === 0 ? <p className="text-xs text-muted-foreground">{tr("بدون اشتراكات.")}</p> :
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              d.subscriptions.map((sub: any) => (
                <div key={sub.id} className="rounded-md border border-border bg-background/60 p-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <Badge tone={sub.package.category === "calls" ? "gold" : "brand"}>{sub.package.nameAr}</Badge>
                      <Badge tone={sub.status === "ACTIVE" ? "sage" : "muted"} className="ml-1">{sub.status}</Badge>
                    </div>
                    <div className="flex gap-1">
                      {sub.sessionsTotal != null && onRestore && (
                        <button disabled={busy} title={tr("استرجاع الحصص")} onClick={() => subAction(onRestore, sub.id, tr(`استرجاع حصص "${sub.package.nameAr}" للطالب؟ (الرصيد هيرجع ${sub.sessionsTotal} حصة)`))} className="rounded-md px-2 py-1 text-[11px] font-bold text-brand hover:bg-brand/10">↺ {tr("استرجاع")}</button>
                      )}
                      {onDeleteSub && (
                        <button disabled={busy} title={tr("حذف الباقة نهائياً")} onClick={() => subAction(onDeleteSub, sub.id, tr(`حذف باقة "${sub.package.nameAr}" نهائياً للطالب؟ لا يمكن التراجع.`))} className="rounded-md px-2 py-1 text-[11px] font-bold text-danger hover:bg-danger/10">{tr("حذف الباقة")}</button>
                      )}
                    </div>
                  </div>
                  {sub.sessionsTotal != null && (
                    <p className="mt-1 text-muted-foreground">{tr("المتبقي")} {sub.sessionsRemaining ?? 0} {tr("من")} {sub.sessionsTotal} {tr("حصة")} · {tr("المستخدم")} {sub.sessionsUsed ?? 0}</p>
                  )}
                  <p className="text-muted-foreground">{new Date(sub.createdAt).toLocaleDateString("ar-EG")} · {sub.paidAmount != null ? `${sub.paidAmount} ${tr("ج")}` : ""}</p>
                </div>
              ))}
          </div>
          <h4 className="mt-4 text-sm font-bold">{tr("المجموعات والمدرسون")}</h4>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {d.groups.map((g: { id: string; name: string }) => <Badge key={g.id} tone="muted">{g.name}</Badge>)}
            {d.teachers.map((t: { id: string; fullName: string }) => <Badge key={t.id} tone="brand">{t.fullName}</Badge>)}
            {d.groups.length === 0 && d.teachers.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
          </div>
        </Card>

        <Card>
          <h3 className="font-bold">{tr("حصص المكالمات")} ({d.bookings.length} · {tr("قادمة:")} {upcomingBookings.length})</h3>
          <div className="mt-2 max-h-72 space-y-1.5 overflow-y-auto">
            {d.bookings.length === 0 ? <p className="py-4 text-center text-xs text-muted-foreground">{tr("لا توجد حصص.")}</p> :
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              d.bookings.slice(0, 20).map((b: any) => (
                <div key={b.id} className="flex items-center justify-between gap-2 rounded-md border border-border bg-background/60 px-3 py-2 text-xs">
                  <span>{b.teacher?.fullName} · {new Date(b.startsAt).toLocaleString("ar-EG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  <Badge tone={profSt(b.status).tone}>{tr(profSt(b.status).label)}</Badge>
                </div>
              ))}
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <h3 className="font-bold">{tr("سجل المحاضرات")} ({d.lectureAttendance.length})</h3>
        <div className="mt-2 max-h-72 space-y-1.5 overflow-y-auto">
          {d.lectureAttendance.length === 0 ? <p className="py-4 text-center text-xs text-muted-foreground">{tr("لا توجد سجلات.")}</p> :
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            d.lectureAttendance.map((a: any) => (
              <div key={a.id} className="rounded-md border border-border bg-background/60 px-3 py-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span><b>{a.lecture.title}</b> · {new Date(a.lecture.startsAt).toLocaleDateString("ar-EG")}{a.lecture.teacher?.fullName ? ` · ${a.lecture.teacher.fullName}` : ""}</span>
                  <Badge tone={a.status === "present" ? "sage" : "danger"}>{a.status === "present" ? tr("حاضر") : tr("غائب")}</Badge>
                </div>
                {a.report && <p className="mt-1 border-t border-border/60 pt-1 text-muted-foreground">{a.report}</p>}
              </div>
            ))}
        </div>
      </Card>
    </ProfileOverlay>
  );
}

function AdminEditUserModal({
  user,
  onSave,
  onClose,
}: {
  user: PlatformUser;
  onSave: (id: string, input: { fullName?: string; phone?: string; email?: string | null; specialty?: string | null; password?: string }) => Promise<void>;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [specialty, setSpecialty] = useState(user.specialty ?? "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setSaving(true);
    try {
      await onSave(user.id, {
        fullName,
        phone,
        email: email.trim() || null,
        specialty: specialty.trim() || null,
        ...(password.trim() ? { password: password.trim() } : {}),
      });
      onClose();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : t("فشل حفظ التعديلات"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
      <Card className="w-full">
        <h3 className="font-bold">{t("تعديل بيانات")} — {user.fullName}</h3>
        <p className="text-xs text-muted-foreground">{t("عدّل الاسم أو الرقم أو الإيميل أو التخصص أو كلمة المرور في مكان واحد")}</p>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div className="space-y-1">
            <Label>{t("الاسم الكامل")}</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>{t("رقم الهاتف")}</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} required dir="ltr" />
          </div>
          <div className="space-y-1">
            <Label>{t("البريد الإلكتروني")} {user.role === "TEACHER" && t("(مطلوب لربط حسابه في Zoom)")}</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teacher@example.com" dir="ltr" />
          </div>
          {user.role !== "STUDENT" && (
            <div className="space-y-1">
              <Label>{t("التخصص")}</Label>
              <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder={t("مثال: عبري — محادثة")} />
            </div>
          )}
          <div className="space-y-1">
            <Label>{t("كلمة مرور جديدة (اختياري — اتركها فارغة للإبقاء على الحالية)")}</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("6 أحرف على الأقل")} />
          </div>
          {err && <p className="rounded-md bg-danger/10 p-2 text-xs font-semibold text-danger">{err}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? t("جاري الحفظ...") : t("حفظ التعديلات")}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>{t("إلغاء")}</Button>
          </div>
        </form>
      </Card>
      </div>
    </div>
  );
}

// ─── Ops: basic lectures list with upcoming/past/cancelled tabs (admin + support) ──
function OpsLecturesListCard({
  lectures,
  fetchLectures,
  onCancel,
}: {
  lectures: import("../hooks/use-platform-store").AdminLectureItem[];
  fetchLectures: () => Promise<void>;
  onCancel?: (id: string) => Promise<void>;
}) {
  const { t } = useI18n();
  const [period, setPeriod] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) {
      fetchLectures().then(() => setLoaded(true)).catch(() => setLoaded(true));
    }
  }, [loaded, fetchLectures]);

  const inPeriod = (l: import("../hooks/use-platform-store").AdminLectureItem, v: "upcoming" | "past" | "cancelled") => {
    const end = l.endsAt ? Date.parse(l.endsAt) : Date.parse(l.startsAt);
    if (v === "cancelled") return l.status === "cancelled";
    if (l.status === "cancelled") return false;
    if (v === "upcoming") return end > Date.now() && l.status !== "completed";
    return end <= Date.now() || l.status === "completed";
  };

  const STATUS_LABEL: Record<string, { label: string; tone: "brand" | "sage" | "muted" | "danger" }> = {
    scheduled: { label: t("مجدولة"), tone: "brand" },
    live: { label: t("مباشر الآن"), tone: "sage" },
    completed: { label: t("مكتملة"), tone: "muted" },
    cancelled: { label: t("ملغاة"), tone: "danger" },
  };
  const st = (s: string) => STATUS_LABEL[s] ?? { label: s, tone: "muted" as const };

  const shown = lectures.filter((l) => inPeriod(l, period));

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-bold">{t("المحاضرات الأساسية")} ({shown.length})</h3>
          <p className="text-xs text-muted-foreground">{t("المحاضرات بتنقل تلقائياً للسابقة بعد انتهاء وقتها")}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {([["upcoming", "القادمة"], ["past", "السابقة"], ["cancelled", "الملغية"]] as const).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setPeriod(v)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                period === v ? "bg-brand text-white" : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              {t(label)} ({lectures.filter((l) => inPeriod(l, v)).length})
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {shown.length === 0 ? (
          <div className="rounded-md bg-muted/60 p-6 text-center text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">
            {t("لا توجد محاضرات في هذا القسم.")}
          </div>
        ) : (
          shown.map((l) => (
            <div key={l.id} className="flex flex-col rounded-xl border border-border bg-background/60 p-4">
              <div className="flex items-start justify-between gap-2">
                <b className="min-w-0 truncate text-sm">{l.title}</b>
                <Badge tone={st(l.status).tone}>{st(l.status).label}</Badge>
              </div>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 shrink-0" />
                  {new Date(l.startsAt).toLocaleString("ar-EG", { weekday: "long", day: "numeric", month: "long" })}
                </p>
                <p className="flex items-center gap-1.5 font-lat">
                  <Clock3 className="size-3.5 shrink-0" />
                  {new Date(l.startsAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                  {l.endsAt ? ` → ${new Date(l.endsAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}` : ""}
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {l.teacher?.fullName && <Badge tone="muted">{l.teacher.fullName}</Badge>}
                  {l.groupName && <Badge tone="muted">{l.groupName}</Badge>}
                  {l.level && <Badge tone="muted">{t("مستوى")} {l.level}</Badge>}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
                {l.meetingUrl && (
                  <a
                    href={l.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand/20"
                  >
                    {t("رابط الاجتماع")} ↗
                  </a>
                )}
                {onCancel && l.status !== "cancelled" && l.status !== "completed" && (
                  <Button
                    variant="ghost"
                    className="min-h-8 px-2.5 text-xs text-danger hover:bg-danger/10"
                    onClick={() => { if (confirm(t(`إلغاء محاضرة "${l.title}"؟`))) onCancel(l.id).catch(() => {}); }}
                  >
                    {t("إلغاء")}
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

// ─── Admin: all calls bookings with full filtering (student name, date, teacher, status, period) ──
function AdminAllBookingsCard({
  bookings,
  onUpdate,
}: {
  bookings: import("../hooks/use-platform-store").LessonBookingItem[];
  onUpdate: (id: string, input: { status?: string; notes?: string; meetingUrl?: string; reason?: string }) => Promise<void>;
}) {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [teacherF, setTeacherF] = useState("");
  const [statusF, setStatusF] = useState("");
  const [periodF, setPeriodF] = useState<"" | "upcoming" | "past">("");
  const [dateF, setDateF] = useState("");
  const [fromD, setFromD] = useState("");
  const [toD, setToD] = useState("");
  const [pkgF, setPkgF] = useState("");
  const [modeF, setModeF] = useState("");

  const teachers = Array.from(
    new Map(bookings.filter((b) => b.teacher?.id).map((b) => [b.teacher!.id, b.teacher!.fullName])).entries(),
  );
  const now = Date.now();
  const hasFilters = !!(q || teacherF || statusF || periodF || dateF || fromD || toD || pkgF || modeF);

  const pkgCategory = (b: import("../hooks/use-platform-store").LessonBookingItem) =>
    b.subscription?.package?.category === "calls" ? "calls" : b.subscription ? "basic" : "none";

  const filtered = bookings.filter((b) => {
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      const hay = `${b.student?.fullName ?? ""} ${b.student?.phone ?? ""} ${b.teacher?.fullName ?? ""}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    if (teacherF && b.teacher?.id !== teacherF) return false;
    if (statusF && b.status !== statusF) return false;
    if (pkgF && pkgCategory(b) !== pkgF) return false;
    if (modeF === "online" && !b.meetingUrl) return false;
    if (modeF === "offline" && b.meetingUrl) return false;
    const ms = new Date(b.startsAt).getTime();
    if (periodF === "upcoming" && ms < now) return false;
    if (periodF === "past" && ms >= now) return false;
    if (dateF) {
      const d = new Date(b.startsAt);
      const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (ymd !== dateF) return false;
    }
    if (fromD && new Date(b.startsAt) < new Date(`${fromD}T00:00:00`)) return false;
    if (toD && new Date(b.startsAt) > new Date(`${toD}T23:59:59`)) return false;
    return true;
  });

  const st: Record<string, { label: string; tone: "brand" | "sage" | "danger" | "gold" }> = {
    booked: { label: t("محجوزة"), tone: "brand" },
    completed: { label: t("مكتملة"), tone: "sage" },
    cancelled: { label: t("ملغاة"), tone: "danger" },
    no_show: { label: t("لم يحضر"), tone: "gold" },
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-bold">{t("كل الحجوزات")} ({filtered.length} {t("من")} {bookings.length})</h3>
          <p className="text-xs text-muted-foreground">{t("ابحث باسم الطالب أو صفِّ بالتاريخ والمدرس والحالة")}</p>
        </div>
        {hasFilters && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setQ(""); setTeacherF(""); setStatusF(""); setPeriodF(""); setDateF(""); setFromD(""); setToD(""); setPkgF(""); setModeF(""); }}
          >
            {t("مسح الفلاتر")}
          </Button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {([["", "الكل"], ["upcoming", "القادمة"], ["past", "السابقة"]] as const).map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => setPeriodF(v)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
              periodF === v ? "bg-brand text-white" : "bg-muted/60 text-muted-foreground hover:bg-muted"
            }`}
          >
            {t(label)}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <SearchBox value={q} onChange={setQ} placeholder={t("بحث باسم الطالب / الرقم / المدرس")} />
        <div className="space-y-0.5">
          <Input type="date" value={dateF} onChange={(e) => setDateF(e.target.value)} title={t("تاريخ يوم محدد")} />
        </div>
        <select value={teacherF} onChange={(e) => setTeacherF(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
          <option value="">{t("كل المدرسين")}</option>
          {teachers.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
        <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
          <option value="">{t("كل الحالات")}</option>
          <option value="booked">{t("محجوزة")}</option>
          <option value="completed">{t("مكتملة")}</option>
          <option value="no_show">{t("لم يحضر")}</option>
          <option value="cancelled">{t("ملغاة")}</option>
        </select>
        <select value={pkgF} onChange={(e) => setPkgF(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
          <option value="">{t("كل أنواع الباقات")}</option>
          <option value="calls">{t("باقات المكالمات")}</option>
          <option value="basic">{t("الباقات الأساسية")}</option>
          <option value="none">{t("بدون باقة")}</option>
        </select>
        <select value={modeF} onChange={(e) => setModeF(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
          <option value="">{t("أونلاين + أوفلاين")}</option>
          <option value="online">{t("أونلاين (برابط اجتماع)")}</option>
          <option value="offline">{t("أوفلاين (بدون رابط)")}</option>
        </select>
        <Input type="date" value={fromD} onChange={(e) => setFromD(e.target.value)} title={t("من تاريخ")} />
        <Input type="date" value={toD} onChange={(e) => setToD(e.target.value)} title={t("إلى تاريخ")} />
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-right text-xs text-muted-foreground">
              <th className="p-2">{t("الطالب")}</th>
              <th className="p-2">{t("المدرس")}</th>
              <th className="p-2">{t("الموعد")}</th>
              <th className="p-2">{t("الحالة")}</th>
              <th className="p-2">{t("إجراءات")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">{t("لا توجد حجوزات مطابقة للفلاتر.")}</td></tr>
            ) : (
              filtered.map((b) => {
                const s = st[b.status] ?? st.booked!;
                return (
                  <tr key={b.id} className="border-b">
                    <td className="p-2 font-semibold">{b.student?.fullName ?? "—"}</td>
                    <td className="p-2">{b.teacher?.fullName ?? "—"}</td>
                    <td className="p-2 text-xs">{new Date(b.startsAt).toLocaleString("ar-EG", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="p-2"><Badge tone={s.tone}>{s.label}</Badge></td>
                    <td className="p-2">
                      {b.status === "booked" && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => { if (confirm(t("إلغاء إداري؟"))) onUpdate(b.id, { status: "cancelled", reason: t("إلغاء إداري") }); }}>
                            {t("إلغاء")}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { const url = prompt(t("رابط الاجتماع:")); if (url) onUpdate(b.id, { meetingUrl: url }); }}>
                            {t("رابط")}
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
  );
}
