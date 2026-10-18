import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Crown,
  Facebook,
  GraduationCap,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Rocket,
  Sprout,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge, Button, Card, Input, Label } from "../components/ui";
import { usePlatformStore, type PublicPackage } from "../hooks/use-platform-store";
import { useAuth } from "../hooks/use-auth";
import { getHomeRouteForRole } from "../lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ohran Academy — أكاديمية العبرية للناطقين بالعربية" },
      {
        name: "description",
        content:
          "الأكاديمية الأولى لتعليم العبرية باحترافية — مدرسون معتمدون، برامج تفاعلية، ومنهجية مدروسة تضمن لك الإتقان.",
      },
      { property: "og:title", content: "Ohran Academy — أكاديمية العبرية" },
      { property: "og:description", content: "تعلّم العبرية مع مدرسين معتمدين وبرامج مصممة لأهدافك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

/* ─── Booking modal (unchanged flow) ─── */
function BookingModal({ pkg, onClose }: { pkg: PublicPackage; onClose: () => void }) {
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
            <Button className="mt-5 w-full" onClick={onClose}>تمام</Button>
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
                <Button type="button" variant="ghost" onClick={onClose}>إلغاء</Button>
              </div>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}

/* ─── 3D Hebrew cube for the hero ─── */
function HebrewCube() {
  const size = 110;
  const faces = ["א", "ל", "ף", "ש", "מ", "ד"];
  const transforms = [
    `rotateY(0deg) translateZ(${size / 2}px)`,
    `rotateY(90deg) translateZ(${size / 2}px)`,
    `rotateY(180deg) translateZ(${size / 2}px)`,
    `rotateY(270deg) translateZ(${size / 2}px)`,
    `rotateX(90deg) translateZ(${size / 2}px)`,
    `rotateX(-90deg) translateZ(${size / 2}px)`,
  ];
  return (
    <div style={{ perspective: 900 }} className="grid place-items-center">
      <div
        className="preserve-3d animate-cube-spin relative"
        style={{ width: size, height: size }}
      >
        {faces.map((f, i) => (
          <div key={i} className="he-cube-face text-4xl" style={{ transform: transforms[i] }}>
            {f}
          </div>
        ))}
      </div>
    </div>
  );
}

const NAVY = "#0b2f6e";
const NAVY_DEEP = "#071f4d";
const GREEN = "#7fc341";

const TEACHER_CARD_COLORS = ["bg-[#dbe7ff]", "bg-[#efe9e4]", "bg-[#ffe0e7]", "bg-[#e2f5d9]"];

const FAQ_ITEMS = [
  "كم من الوقت أحتاج لأتحدث بطلاقة؟",
  "هل تقدمون دروساً عبر الإنترنت؟",
  "هل يمكنني تغيير المعلم إذا أردت؟",
];

function FaqItem({ q }: { q: string }) {
  const [open, setOpen] = useState(false);
  const answers: Record<string, string> = {
    "كم من الوقت أحتاج لأتحدث بطلاقة؟":
      "يختلف حسب مستواك والتزامك — في المتوسط يصل طلابنا للمحادثة اليومية خلال 4-6 أشهر من الالتزام بالبرنامج والواجبات.",
    "هل تقدمون دروساً عبر الإنترنت؟":
      "نعم، كل برامجنا متاحة أونلاين عبر جلسات مباشرة مع المدرس، إضافة إلى مكتبة فيديوهات وتسجيلات تفاعلية داخل المنصة.",
    "هل يمكنني تغيير المعلم إذا أردت؟":
      "بالتأكيد — يمكنك طلب تغيير المدرس في أي وقت من خلال خدمة العملاء، وسننقلك لمدرس آخر يناسب احتياجك دون أي تكلفة إضافية.",
  };
  return (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      className="w-full rounded-xl border border-[#e3e9f5] bg-white px-5 py-4 text-right transition-shadow hover:shadow-md"
    >
      <span className="flex items-center justify-between gap-3">
        <b className="text-sm font-bold text-[#0b2f6e]">{q}</b>
        <span
          className={`grid size-6 shrink-0 place-items-center rounded-full transition-transform duration-300 ${open ? "rotate-180 bg-[#7fc341] text-white" : "bg-[#eef3fb] text-[#7fc341]"}`}
        >
          <ChevronDown className="size-3.5" />
        </span>
      </span>
      <span
        className={`block overflow-hidden text-sm leading-7 text-[#5a6b8c] transition-all duration-300 ${open ? "mt-2 max-h-40" : "max-h-0"}`}
      >
        {answers[q]}
      </span>
    </button>
  );
}

function Landing() {
  const { user } = useAuth();
  const { publicPackages, fetchPublicPackages, publicSchedules, fetchPublicSchedules } = usePlatformStore();
  const [bookingPkg, setBookingPkg] = useState<PublicPackage | null>(null);

  useEffect(() => {
    fetchPublicPackages();
    fetchPublicSchedules();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Group live weekly schedules by teacher — replaces hardcoded slots
  const LANDING_DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const liveTeachers = Object.values(
    publicSchedules.reduce<Record<string, { name: string; badge: string; slots: string[]; online: boolean }>>(
      (acc, s) => {
        const t = s.teacher;
        if (!t) return acc;
        acc[t.id] ??= {
          name: t.fullName,
          badge: t.specialty ?? "مدرس لغة عبرية",
          slots: [],
          online: s.location === "online",
        };
        acc[t.id].slots.push(`${LANDING_DAY_NAMES[s.dayOfWeek]} ${s.startTime}`);
        acc[t.id].online ||= s.location === "online";
        return acc;
      },
      {},
    ),
  );
  const teachersToRender = liveTeachers.map((t, i) => ({
    ...t,
    desc: "أونلاين وحضوري — مواعيد ثابتة كل أسبوع",
    avatarBg: TEACHER_CARD_COLORS[i % TEACHER_CARD_COLORS.length],
    initials: t.name.replace(/^(د\.|أ\.|م\.)\s*/, "")[0] ?? "؟",
  }));

  return (
    <div dir="rtl" className="relative min-h-screen overflow-x-clip bg-[#f6f9fd] text-ink">
      {/* soft bg blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 size-[420px] rounded-full bg-[#dce9ff] blur-3xl opacity-70" />
      <div className="pointer-events-none absolute top-1/3 -right-40 size-[380px] rounded-full bg-[#e4f4d4] blur-3xl opacity-60" />

      {/* ─── Header ─── */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <nav className="hidden items-center gap-7 text-sm font-medium text-[#33436b] lg:flex">
          <a href="#faq" className="hover:text-[#0b2f6e]">الأسئلة الشائعة</a>
          <a href="#teachers" className="hover:text-[#0b2f6e]">المعلمون</a>
          <a href="#programs" className="hover:text-[#0b2f6e]">البرامج</a>
          <a href="#about" className="hover:text-[#0b2f6e]">عن الأكاديمية</a>
        </nav>
        <div className="flex items-center gap-2">
          <span className="grid size-10 place-items-center rounded-xl text-white" style={{ background: `linear-gradient(135deg, ${GREEN}, #4f9e1f)` }}>
            <GraduationCap className="size-5" />
          </span>
          <span className="leading-tight">
            <b className="block text-[15px] font-bold" style={{ color: NAVY }}>Ohran Academy</b>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <Link to={getHomeRouteForRole(user.role)}>
              <button className="rounded-lg px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#0b2f6e]/25 transition-transform hover:-translate-y-0.5" style={{ background: NAVY }}>
                لوحة التحكم
              </button>
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden text-sm font-medium text-[#33436b] hover:text-[#0b2f6e] sm:block">
                تسجيل الدخول
              </Link>
              <Link to="/register">
                <button className="rounded-lg px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#0b2f6e]/25 transition-transform hover:-translate-y-0.5" style={{ background: NAVY }}>
                  احجز جلستك الآن
                </button>
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-5 pb-24">
        {/* ─── Hero ─── */}
        <section className="grid items-center gap-10 pt-10 lg:grid-cols-2 lg:pt-14">
          {/* text */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#dfe8f7] bg-white px-4 py-1.5 text-xs font-semibold text-[#33436b] shadow-sm">
              الأكاديمية الأولى لتعليم العبرية باحترافية
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-[1.25] lg:text-5xl">
              <span style={{ color: NAVY }}>اكتشف قوة</span>
              <br />
              <span style={{ color: GREEN }}>اللغة العبرية</span>{" "}
              <span style={{ color: NAVY }}>مع Ohran</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-8 text-[#5a6b8c]">
              انضم إلى أكاديمية أوهران وتعلم اللغة العبرية على يد نخبة من الخبراء، من خلال برامج
              تفاعلية ومنهجية مدروسة تضمن لك الإتقان.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#programs"
                className="rounded-xl border-2 px-7 py-3 text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{ borderColor: NAVY, color: NAVY }}
              >
                تصفح البرامج
              </a>
              <a
                href="#teachers"
                className="rounded-xl px-7 py-3 text-sm font-bold text-white shadow-lg shadow-[#0b2f6e]/30 transition-all hover:-translate-y-0.5"
                style={{ background: NAVY }}
              >
                تعرّف على معلمينا ←
              </a>
            </div>
          </div>

          {/* 3D visual */}
          <div className="relative mx-auto w-full max-w-lg">
            <div
              className="relative overflow-hidden rounded-[2rem] p-10 lg:p-14"
              style={{
                background: `radial-gradient(120% 130% at 30% 10%, #123b8f 0%, ${NAVY_DEEP} 55%, #050f2b 100%)`,
                boxShadow: "0 40px 80px -24px rgba(7,31,77,.55), inset 0 1px 0 rgba(255,255,255,.08)",
              }}
            >
              {/* floating letter shards */}
              <span className="he-cube-face animate-float absolute right-8 top-8 size-12 text-2xl" style={{ ["--fl-rot" as string]: "-12deg" }}>ב</span>
              <span className="he-cube-face animate-float-slow absolute left-10 top-16 size-10 text-xl" style={{ ["--fl-rot" as string]: "10deg" }}>ח</span>
              <span className="he-cube-face animate-float absolute bottom-24 right-12 size-8 text-lg" style={{ ["--fl-rot" as string]: "14deg", animationDelay: "1.2s" }}>ר</span>
              <span className="he-cube-face animate-float-slow absolute left-16 bottom-32 size-7 text-base" style={{ ["--fl-rot" as string]: "-8deg", animationDelay: ".6s" }}>ט</span>
              <span className="he-cube-face animate-float absolute right-1/3 top-6 size-6 text-sm" style={{ animationDelay: "1.8s" }}>צ</span>
              {/* orbs */}
              <span className="animate-float absolute left-6 top-24 size-3 rounded-full bg-[#7fc341] shadow-[0_0_18px_#7fc341]" style={{ animationDelay: ".9s" }} />
              <span className="animate-float-slow absolute right-1/4 bottom-40 size-2.5 rounded-full bg-[#54c7ec] shadow-[0_0_16px_#54c7ec]" style={{ animationDelay: "1.5s" }} />
              <span className="animate-float absolute right-10 top-1/2 size-2 rounded-full bg-[#a78bfa] shadow-[0_0_14px_#a78bfa]" />

              {/* glow word */}
              <p dir="ltr" className="animate-glow-pulse relative z-10 text-center font-he text-7xl font-bold text-[#8fd0f5] lg:text-8xl" style={{ letterSpacing: ".05em" }}>
                עִבְרִית
              </p>
              <p className="relative z-10 mt-4 text-center text-sm font-medium tracking-widest text-[#9db8e8]">
                اللغة العبرية · Hebrew
              </p>

              {/* 3D cube */}
              <div className="relative z-10 mt-10 flex justify-center">
                <HebrewCube />
              </div>
            </div>

            {/* floating chips outside card */}
            <div className="animate-float absolute -right-4 top-10 hidden rounded-xl bg-white px-4 py-2.5 text-xs font-bold shadow-xl shadow-[#0b2f6e]/15 sm:block" style={{ color: NAVY, animationDelay: ".4s" }}>
              +15 معلم خبير
            </div>
            <div className="animate-float-slow absolute -left-4 bottom-12 hidden rounded-xl bg-white px-4 py-2.5 text-xs font-bold shadow-xl shadow-[#0b2f6e]/15 sm:block" style={{ color: GREEN, animationDelay: "1.1s" }}>
              98% نسبة رضا الطلاب
            </div>
          </div>
        </section>

        {/* ─── Why Ohran ─── */}
        <section id="about" className="mt-24 grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold leading-snug">
              <span style={{ color: GREEN }}>لماذا تختار</span>{" "}
              <span style={{ color: NAVY }}>أكاديمية Ohran؟</span>
            </h2>
            <p className="mt-4 leading-8 text-[#5a6b8c]">
              نحن نجمع بين أحدث التقنيات التعليمية والأساليب التقليدية الفعالة لنخلق لك تجربة تعليمية
              فعالة، مصممة خصيصاً لأهدافك الشخصية والمهنية.
            </p>
            <ul className="mt-7 space-y-4">
              {[
                "معلمون ناطقون باللغة ومعتمدون دولياً",
                "جداول زمنية مرنة (أونلاين وحضوري)",
                "منهاج مخصص لكل مستويات الإتقان",
              ].map((x) => (
                <li key={x} className="flex items-center gap-3 text-sm font-semibold text-[#2d3f63]">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full" style={{ background: `${GREEN}26`, color: "#4f9e1f" }}>
                    <Check className="size-4" />
                  </span>
                  {x}
                </li>
              ))}
            </ul>
          </div>

          {/* illustration card */}
          <div className="tilt-hover relative">
            <div
              className="relative overflow-hidden rounded-[2rem] p-10"
              style={{
                background: "linear-gradient(160deg, #eaf3ff 0%, #f4f9ec 55%, #ffffff 100%)",
                boxShadow: "0 30px 60px -20px rgba(11,47,110,.18)",
                border: "1px solid #e3ecf9",
              }}
            >
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: GraduationCap, bg: "#0b2f6e", c: "#fff", r: "-6deg" },
                  { icon: Rocket, bg: GREEN, c: "#fff", r: "5deg" },
                  { icon: Crown, bg: "#ffb703", c: "#fff", r: "-4deg" },
                ].map(({ icon: Icon, bg, c, r }, i) => (
                  <div
                    key={i}
                    className="animate-float mx-auto grid aspect-square w-full max-w-28 place-items-center rounded-2xl"
                    style={{ background: bg, color: c, ["--fl-rot" as string]: r, animationDelay: `${i * 0.8}s`, boxShadow: `0 18px 34px -10px ${bg}66` }}
                  >
                    <Icon className="size-10" />
                  </div>
                ))}
              </div>
              <div className="mt-8 rounded-2xl bg-white/80 p-5 text-center shadow-inner backdrop-blur">
                <b className="block text-lg" style={{ color: NAVY }}>بيئة تعلم متكاملة</b>
                <p className="mt-1 text-xs leading-6 text-[#5a6b8c]">
                  لايف مباشر + واجبات مصححة + تقارير تقدم + شهادات معتمدة — كل شيء في مكان واحد.
                </p>
              </div>
              <span className="he-shard animate-float-slow absolute left-8 top-8 size-9 text-lg">א</span>
              <span className="he-shard animate-float absolute right-10 bottom-24 size-7 text-sm" style={{ animationDelay: "1s" }}>ת</span>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Stats bar ─── */}
      <section style={{ background: `linear-gradient(90deg, ${NAVY_DEEP}, ${NAVY})` }}>
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-8 px-5 py-12 sm:grid-cols-4">
          {[
            { v: "50k+", l: "ساعة تعليمية" },
            { v: "15+", l: "معلم خبير" },
            { v: "98%", l: "نسبة الرضا" },
            { v: "2,500+", l: "خريج ناجح" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <b className="block font-lat text-4xl font-bold" style={{ color: GREEN }}>{s.v}</b>
              <small className="mt-1 block text-sm text-[#c4d4ee]">{s.l}</small>
            </div>
          ))}
        </div>
      </section>

      <main className="relative z-10 mx-auto max-w-7xl px-5">
        {/* ─── Programs ─── */}
        <section id="programs" className="mt-24">
          <div className="text-center">
            <h2 className="text-3xl font-bold">
              <span style={{ color: GREEN }}>برامجنا</span> <span style={{ color: NAVY }}>التعليمية</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#5a6b8c]">
              مسارات دراسية منظمة مصممة لتأخذك من مستوى المبتدئ إلى التحدث بطلاقة
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Sprout, iconBg: "#2f6fed",
                title: "مسار المبتدئين (A1-A2)",
                desc: "إتقان الأبجدية، القواعد الأساسية، وإجراء محادثات يومية بسيطة بثقة تامة.",
                link: "ابدأ الآن", linkC: GREEN,
              },
              {
                icon: Rocket, iconBg: "#0d3a86",
                title: "المستوى المتوسط (B1-B2)",
                desc: "توسيع المفردات، فهم الوسائل الإعلامية، والتعبير عن أفكار معقدة بطلاقة أكبر.",
                link: "ارتقِ بمستواك", linkC: GREEN,
              },
              {
                icon: Crown, iconBg: "#1647a8",
                title: "المستوى المتقدم (C1)",
                desc: "إتقان اللهجة، فهم المصطلحات المعقدة، والتعامل باحترافية في بيئات العمل العبرية.",
                link: "كن محترفاً", linkC: "#0b2f6e",
              },
            ].map((p) => (
              <div
                key={p.title}
                className="tilt-hover rounded-2xl border border-[#e7edf7] bg-white p-7 text-center shadow-sm"
              >
                <span
                  className="mx-auto grid size-14 place-items-center rounded-xl text-white"
                  style={{ background: p.iconBg, boxShadow: `0 14px 28px -10px ${p.iconBg}88` }}
                >
                  <p.icon className="size-7" />
                </span>
                <h3 className="mt-5 text-lg font-bold" style={{ color: NAVY }}>{p.title}</h3>
                <p className="mt-2.5 text-sm leading-7 text-[#5a6b8c]">{p.desc}</p>
                <a href="#packages" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold transition-transform hover:translate-x-[-4px]" style={{ color: p.linkC }}>
                  {p.link} <ArrowLeft className="size-4" />
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Packages (live from API) ─── */}
        <section id="packages" className="mt-24">
          <div className="text-center">
            <h2 className="text-3xl font-bold" style={{ color: NAVY }}>الباقات والأسعار</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-[#5a6b8c]">
              اختر باقتك وسيتواصل معك فريقنا لتأكيد الحجز.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {publicPackages.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-[#e7edf7] bg-white py-12 text-center text-sm text-[#5a6b8c]">
                الباقات تُعرض هنا فور تفعيلها من إدارة الأكاديمية.
              </div>
            ) : (
              publicPackages.map((p) => (
                <div key={p.id} className="tilt-hover flex flex-col rounded-2xl border border-[#e7edf7] bg-white p-7 shadow-sm">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-bold" style={{ color: NAVY }}>{p.nameAr}</h3>
                    <span className="rounded-full px-3 py-1 text-[11px] font-bold text-white" style={{ background: NAVY }}>
                      {p.durationMonths} شهر
                    </span>
                  </div>
                  <p className="mt-3 font-lat text-3xl font-bold" style={{ color: GREEN }}>
                    {p.price} جنيه
                    <small className="text-sm font-normal text-[#8a98b5]"> / للباقة</small>
                  </p>
                  {p.description && <p className="mt-2 text-sm leading-6 text-[#5a6b8c]">{p.description}</p>}
                  {p.teacher && (
                    <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-[#f2f6fd] p-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full font-bold text-white" style={{ background: NAVY }}>
                        {p.teacher.fullName[0]}
                      </span>
                      <div className="min-w-0">
                        <b className="block text-xs" style={{ color: NAVY }}>{p.teacher.fullName}</b>
                        {p.teacher.specialty && (
                          <small className="block truncate text-[#5a6b8c]">{p.teacher.specialty}</small>
                        )}
                      </div>
                    </div>
                  )}
                  {p.features && p.features.length > 0 && (
                    <ul className="mt-4 flex-1 space-y-2 border-t border-[#eef2f9] pt-4">
                      {p.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-[#5a6b8c]">
                          <Check className="mt-0.5 size-3.5 shrink-0" style={{ color: "#4f9e1f" }} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    className="mt-5 w-full rounded-xl py-3 text-sm font-bold text-white shadow-lg shadow-[#0b2f6e]/25 transition-transform hover:-translate-y-0.5"
                    style={{ background: NAVY }}
                    onClick={() => setBookingPkg(p)}
                  >
                    احجز الآن
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ─── Teachers ─── */}
        <section id="teachers" className="mt-24">
          <div className="text-center">
            <h2 className="text-3xl font-bold">
              <span style={{ color: GREEN }}>نخبة</span> <span style={{ color: NAVY }}>معلمينا</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#5a6b8c]">
              تعلّم من خبراء معتمدين. اطلع على مواعيدهم الأسبوعية واحجز جلستك مباشرة.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {teachersToRender.length === 0 && (
              <div className="col-span-full rounded-2xl border border-[#e7edf7] bg-white py-12 text-center text-sm text-[#5a6b8c]">
                سيظهر المعلمون هنا فور إضافة مواعيدهم من إدارة الأكاديمية.
              </div>
            )}
            {teachersToRender.map((t) => (
              <div key={t.name} className="tilt-hover rounded-2xl border border-[#e7edf7] bg-white p-6 text-center shadow-sm">
                <div className="relative mx-auto w-fit">
                  <span className={`grid size-28 place-items-center rounded-full text-4xl font-bold ring-4 ring-white shadow-lg ${t.avatarBg}`} style={{ color: NAVY }}>
                    {t.initials}
                  </span>
                  <span className="absolute -bottom-1 -left-1 grid size-7 place-items-center rounded-full text-white" style={{ background: GREEN }}>
                    <Check className="size-4" />
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold" style={{ color: NAVY }}>{t.name}</h3>
                <span className="mt-1.5 inline-block rounded-full px-3 py-1 text-[11px] font-bold" style={{ background: `${GREEN}22`, color: "#4f9e1f" }}>
                  {t.badge}
                </span>
                <p className="mt-3 text-xs leading-6 text-[#5a6b8c]">{t.desc}</p>
                <div className="mt-4 border-t border-[#eef2f9] pt-4">
                  <p className="mb-2 text-[11px] font-semibold text-[#8a98b5]">المواعيد المتاحة هذا الأسبوع</p>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {t.slots.map((s) => (
                      <span key={s} className="rounded-md bg-[#eef3fb] px-2 py-1 text-[10px] font-semibold" style={{ color: NAVY }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <a href="#packages">
                  <button className="mt-5 w-full rounded-xl py-3 text-sm font-bold text-white shadow-lg shadow-[#0b2f6e]/20 transition-transform hover:-translate-y-0.5" style={{ background: NAVY }}>
                    احجز جلسة الآن
                  </button>
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section id="faq" className="mx-auto mt-24 max-w-3xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold">
              <span style={{ color: GREEN }}>الأسئلة</span> <span style={{ color: NAVY }}>الشائعة</span>
            </h2>
          </div>
          <div className="mt-8 space-y-3">
            {FAQ_ITEMS.map((q) => <FaqItem key={q} q={q} />)}
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="mt-24" style={{ background: `linear-gradient(180deg, ${NAVY}, ${NAVY_DEEP})` }}>
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid size-10 place-items-center rounded-xl text-white" style={{ background: `linear-gradient(135deg, ${GREEN}, #4f9e1f)` }}>
                <GraduationCap className="size-5" />
              </span>
              <b className="text-lg font-bold text-white">Ohran Academy</b>
            </div>
            <p className="mt-4 text-xs leading-6 text-[#aebfdd]">
              نعمل على تمكين الأفراد من التواصل باللغة العبرية منذ عام 2015 بأحدث المناهج التعليمية.
            </p>
          </div>
          <div>
            <b className="text-sm font-bold text-white">روابط سريعة</b>
            <ul className="mt-4 space-y-2.5 text-xs text-[#aebfdd]">
              <li><a href="#about" className="hover:text-white">عن الأكاديمية</a></li>
              <li><a href="#programs" className="hover:text-white">برامجنا</a></li>
              <li><a href="#teachers" className="hover:text-white">معلمونا</a></li>
              <li><a href="#faq" className="hover:text-white">الأسئلة الشائعة</a></li>
            </ul>
          </div>
          <div>
            <b className="text-sm font-bold text-white">اتصل بنا</b>
            <ul className="mt-4 space-y-3 text-xs text-[#aebfdd]">
              <li className="flex items-center gap-2"><Mail className="size-4" style={{ color: GREEN }} /> info@ohran.com</li>
              <li className="flex items-center gap-2"><Phone className="size-4" style={{ color: GREEN }} /> <span dir="ltr">+20 1270 869 510</span></li>
              <li className="flex items-center gap-2"><MapPin className="size-4" style={{ color: GREEN }} /> القاهرة، مصر</li>
            </ul>
          </div>
          <div>
            <b className="text-sm font-bold text-white">تابعنا</b>
            <div className="mt-4 flex gap-2.5">
              {[Facebook, Instagram, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="grid size-10 place-items-center rounded-lg bg-white/10 text-white transition-colors hover:bg-[#7fc341]">
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
            {user ? null : (
              <Link to="/register">
                <button className="mt-6 rounded-lg px-5 py-2.5 text-xs font-bold text-white transition-transform hover:-translate-y-0.5" style={{ background: GREEN }}>
                  انضم إلينا الآن
                </button>
              </Link>
            )}
          </div>
        </div>
        <div className="border-t border-white/10 py-5 text-center text-[11px] text-[#7f94bd]">
          Ohran Academy · جميع الحقوق محفوظة {new Date().getFullYear()}
        </div>
      </footer>

      {bookingPkg && <BookingModal pkg={bookingPkg} onClose={() => setBookingPkg(null)} />}
    </div>
  );
}
