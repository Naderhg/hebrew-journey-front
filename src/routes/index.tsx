import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpenCheck,
  Check,
  ChevronDown,
  Clock3,
  Compass,
  GraduationCap,
  Heart,
  Menu,
  MessageCircle,
  Mic2,
  Phone,
  Play,
  Sparkles,
  Star,
  Target,
  Users,
  Video,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { usePlatformStore, type PublicTeacher } from "../hooks/use-platform-store";
import { mediaSrc } from "../lib/api";
import { useAuth } from "../hooks/use-auth";
import { getHomeRouteForRole } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import { LanguageSwitcher } from "../components/app-shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "עברית שוטפת — أكاديمية اللغات (عبري وإنجليزي) للناطقين بالعربية" },
      {
        name: "description",
        content:
          "أكاديمية עברית שוטפת لتعليم اللغتين العبرية والإنجليزية باحترافية — مدرسون معتمدون، برامج تفاعلية، ومنهجية مدروسة تضمن لك الإتقان.",
      },
      { property: "og:title", content: "עברית שוטפת — أكاديمية اللغات" },
      { property: "og:description", content: "تعلّم العبرية والإنجليزية مع مدرسين معتمدين وبرامج مصممة لأهدافك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const LANDING_DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "كم من الوقت أحتاج لأتحدث بطلاقة؟",
    a: "يختلف حسب مستواك والتزامك — في المتوسط يصل طلابنا للمحادثة اليومية خلال 4-6 أشهر من الالتزام بالبرنامج والواجبات.",
  },
  {
    q: "هل تقدمون دروساً عبر الإنترنت؟",
    a: "نعم، كل برامجنا متاحة أونلاين عبر جلسات مباشرة مع المدرس، إضافة إلى مكتبة فيديوهات وتسجيلات تفاعلية داخل المنصة.",
  },
  {
    q: "هل يمكنني تغيير المعلم إذا أردت؟",
    a: "بالتأكيد — يمكنك طلب تغيير المدرس في أي وقت من خلال خدمة العملاء، وسننقلك لمدرس آخر يناسب احتياجك دون أي تكلفة إضافية.",
  },
  {
    q: "هل أستطيع دراسة لغتين في نفس الوقت؟",
    a: "نعم، يمكنك الاشتراك في أكثر من برنامج — عبري وإنجليزي معاً — وسنرتب لك جدولاً متوازناً مع مدرسين متخصصين لكل لغة.",
  },
];

const PROGRAMS = [
  {
    icon: BookOpenCheck,
    iconTone: "",
    title: "عبري — المبتدئين (A1-A2)",
    desc: "إتقان الأبجدية العبرية، القواعد الأساسية، وإجراء محادثات يومية بسيطة بثقة تامة.",
    meta: ["لغة عبرية", "أونلاين أو حضوري"],
    featured: true,
    tag: "الأكثر اختيارًا",
  },
  {
    icon: Mic2,
    iconTone: "blue",
    title: "عبري — المتوسط (B1-B2)",
    desc: "توسيع المفردات، فهم الوسائل الإعلامية، والتعبير عن أفكار معقدة بطلاقة أكبر.",
    meta: ["لغة عبرية", "مجموعات صغيرة"],
  },
  {
    icon: Compass,
    iconTone: "coral",
    title: "عبري — المتقدم (B1+-B2)",
    desc: "إتقان اللهجة، فهم المصطلحات المعقدة، والتعامل باحترافية في بيئات العمل العبرية.",
    meta: ["لغة عبرية", "متقدم"],
  },
  {
    icon: Sparkles,
    iconTone: "",
    title: "إنجليزي — المبتدئين (A1-A2)",
    desc: "أساسيات اللغة الإنجليزية، القواعد والمفردات، والتمكن من المحادثات اليومية البسيطة.",
    meta: ["لغة إنجليزية", "أونلاين أو حضوري"],
  },
  {
    icon: Video,
    iconTone: "blue",
    title: "إنجليزي — المتوسط (B1-B2)",
    desc: "تطوير المهارات الأربع، فهم النصوص المعقدة، والتواصل الفعّال في البيئات المهنية.",
    meta: ["لغة إنجليزية", "مجموعات صغيرة"],
  },
  {
    icon: GraduationCap,
    iconTone: "coral",
    title: "إنجليزي — المتقدم (B1+-B2)",
    desc: "إتقان النطق والطلاقة، الكتابة الأكاديمية، والاستعداد لامتحانات IELTS وTOEFL.",
    meta: ["لغة إنجليزية", "متقدم"],
  },
];

function LandingBrand() {
  const { t } = useI18n();
  return (
    <a className="landing-brand" href="#top" aria-label="עברית שוטפת">
      <span className="landing-brand-symbol">ח<i /></span>
      <span>
        <strong className="font-he">עברית שוטפת</strong>
        <small>{t("أكاديمية اللغات العملية")}</small>
      </span>
    </a>
  );
}

function TeacherCard({ teacher }: { teacher: { name: string; badge: string; avatarUrl: string | null; slots: string[]; desc: string; initials: string } }) {
  const { t } = useI18n();
  return (
    <article className="teacher-card">
      <div className="teacher-card-avatar">
        {teacher.avatarUrl ? (
          <img src={mediaSrc(teacher.avatarUrl)} alt={teacher.name} />
        ) : (
          <span>{teacher.initials}</span>
        )}
        <span className="verify"><Check size={13} /></span>
      </div>
      <h3>{teacher.name}</h3>
      <span className="specialty">{teacher.badge}</span>
      <p>{teacher.desc}</p>
      <div className="teacher-card-slots">
        {teacher.slots.length === 0 ? (
          <small>{t("تُعلن المواعيد قريباً")}</small>
        ) : (
          teacher.slots.map((s) => <span key={s}>{s}</span>)
        )}
      </div>
    </article>
  );
}

function Landing() {
  const { user } = useAuth();
  const { t, dir } = useI18n();
  const { publicSchedules, fetchPublicSchedules, publicTeachers, fetchPublicTeachers } = usePlatformStore();
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    fetchPublicSchedules();
    fetchPublicTeachers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const slotsByTeacher = publicSchedules.reduce<Record<string, { slots: string[]; online: boolean }>>(
    (acc, s) => {
      const teacher = s.teacher;
      if (!teacher) return acc;
      acc[teacher.id] ??= { slots: [], online: false };
      acc[teacher.id].slots.push(`${t(LANDING_DAY_NAMES[s.dayOfWeek])} ${s.startTime}`);
      acc[teacher.id].online ||= s.location === "online";
      return acc;
    },
    {},
  );
  const teachersToRender = publicTeachers.map((pt: PublicTeacher) => ({
    name: pt.fullName,
    badge: pt.specialty ?? t("مدرس لغات"),
    avatarUrl: pt.avatarUrl ?? null,
    slots: slotsByTeacher[pt.id]?.slots ?? [],
    desc: pt.bio || t("مدرس معتمد — أونلاين وحضوري، مواعيد ثابتة كل أسبوع"),
    initials: pt.fullName.replace(/^(د\.|أ\.|م\.)\s*/, "")[0] ?? "؟",
  }));

  const ctaTo = user ? getHomeRouteForRole(user.role) : "/register";

  return (
    <div className="landing-page" dir={dir}>
      <header className="landing-header">
        <LandingBrand />
        <nav className={`landing-nav ${mobileNav ? "open" : ""}`} aria-label={t("التنقل الرئيسي")}>
          <a href="#why" onClick={() => setMobileNav(false)}>{t("لماذا עברית שוטפת؟")}</a>
          <a href="#method" onClick={() => setMobileNav(false)}>{t("كيف نتعلم؟")}</a>
          <a href="#programs" onClick={() => setMobileNav(false)}>{t("البرامج")}</a>
          <a href="#teachers" onClick={() => setMobileNav(false)}>{t("معلمونا")}</a>
          <a href="#pricing" onClick={() => setMobileNav(false)}>{t("الأسعار")}</a>
        </nav>
        <div className="landing-header-actions">
          <LanguageSwitcher />
          {user ? (
            <Link to={ctaTo} className="landing-header-cta">{t("لوحة التحكم")} <ArrowLeft size={15} /></Link>
          ) : (
            <>
              <Link to="/login" className="landing-login">{t("تسجيل الدخول")}</Link>
              <Link to="/register" className="landing-header-cta">{t("ابدأ رحلتك")} <ArrowLeft size={15} /></Link>
            </>
          )}
        </div>
        <button className="landing-mobile-toggle" onClick={() => setMobileNav((v) => !v)} aria-label={t("فتح القائمة")}>
          {mobileNav ? <X size={21} /> : <Menu size={21} />}
        </button>
      </header>

      <main id="top">
        {/* ─── Hero ─── */}
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <span className="landing-eyebrow"><span className="eyebrow-dot" /> {t("أكاديمية متخصصة للناطقين بالعربية")}</span>
            <h1>{t("اتكلم عبري وإنجليزي")}<br /><em>{t("بثقة، من أول يوم.")}</em></h1>
            <p>{t("منهج عملي مصمم ليأخذك من أول كلمة إلى محادثة حقيقية — مع مدربين متخصصين، خطة تناسبك، ومجتمع يشجعك في كل خطوة.")}</p>
            <div className="landing-hero-actions">
              <Link to={ctaTo} className="landing-primary">{t("اكتشف مستواك مجانًا")} <ArrowLeft size={17} /></Link>
              <a href="#method" className="landing-play"><span><Play size={14} fill="currentColor" /></span> {t("شاهد كيف نعلّم")}</a>
            </div>
            <div className="landing-hero-note">
              <div className="mini-avatars"><span>س</span><span>م</span><span>ر</span><span>+</span></div>
              <p><strong>{t("+2,500 خريج")}</strong><br />{t("بدأوا رحلتهم معنا")}</p>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-visual-backdrop" />
            <div className="hero-word-card">
              <span className="hero-word-label">{t("كلمة اليوم")}</span>
              <strong>להתחיל</strong>
              <b>{t("يبدأ")}</b>
              <small>lahatchil · {t("فعل")}</small>
              <button aria-label={t("استمع للنطق")}><Play size={13} fill="currentColor" /></button>
            </div>
            <div className="hero-dialog-card">
              <div className="dialog-avatar">ל</div>
              <div>
                <span>{t("المحادثة الذكية")}</span>
                <strong>מה שלומך היום?</strong>
                <small>{t("كيف حالك اليوم؟")}</small>
              </div>
              <div className="dialog-wave"><i /><i /><i /><i /><i /></div>
            </div>
            <div className="hero-progress-card">
              <span className="hero-progress-icon"><Check size={15} /></span>
              <div>
                <strong>{t("خطة اليوم مكتملة")}</strong>
                <small>{t("أحسنت! 3 من 3 مهام")}</small>
              </div>
              <span className="hero-progress-percent">100%</span>
            </div>
            <span className="hero-star hero-star-a">✦</span>
            <span className="hero-star hero-star-b">✦</span>
            <span className="hero-circle-text">HEBREW JOURNEY · EVERY DAY</span>
          </div>
        </section>

        {/* ─── Trust bar ─── */}
        <div className="landing-trust">
          <span>{t("تعلّمها كما تُستخدم في الحياة")}</span>
          <div><strong>+2,500</strong><small>{t("خريج ناجح")}</small></div>
          <div><strong>+50k</strong><small>{t("ساعة تعليمية")}</small></div>
          <div><strong>98%</strong><small>{t("نسبة رضا")}</small></div>
          <div><strong>+15</strong><small>{t("معلم خبير")}</small></div>
          <div className="trust-quote"><Star size={14} fill="currentColor" /> <span>{t('"أخيرًا بدأت أتكلم بدون خوف"')}</span></div>
        </div>

        {/* ─── Why ─── */}
        <section className="landing-section why-section" id="why">
          <div className="landing-section-heading">
            <span className="landing-eyebrow">{t("الفرق في التفاصيل")}</span>
            <h2>{t("اللغة ليست مادة دراسية،")}<br /><em>{t("إنها حياة.")}</em></h2>
            <p>{t("لهذا صممنا تجربة تعليمية تشبه الحياة التي تريد أن تعيشها بالعبرية والإنجليزية — عملية، شخصية، ومليئة بالمواقف الحقيقية.")}</p>
          </div>
          <div className="why-grid">
            <article className="why-card why-card-main">
              <span className="why-icon teal"><MessageCircle size={21} /></span>
              <span className="card-index">01</span>
              <h3>{t("تحدث من أول درس")}</h3>
              <p>{t("لن تنتظر حتى تنهي القواعد. ستبدأ باستخدام جمل حقيقية في مواقف يومية من أول أسبوع.")}</p>
              <div className="speech-bubbles"><span>אני רוצה קפה</span><span>{t("أريد قهوة")}</span></div>
            </article>
            <article className="why-card">
              <span className="why-icon yellow"><Target size={21} /></span>
              <span className="card-index">02</span>
              <h3>{t("خطة تشبهك")}</h3>
              <p>{t("نحدد مستواك ونقاط قوتك ونبني لك خطة مرنة تعرف دائمًا ما هي خطوتك التالية.")}</p>
              <div className="mini-bars"><i /><i /><i /><i /><i /></div>
            </article>
            <article className="why-card">
              <span className="why-icon purple"><Users size={21} /></span>
              <span className="card-index">03</span>
              <h3>{t("مدرب ومجتمع")}</h3>
              <p>{t("مدربون يفهمون هدفك، ومجتمع عربي يشجعك في كل مرة تفتح فيها درسًا جديدًا.")}</p>
              <div className="mini-community"><span>س</span><span>م</span><span>ل</span><b>+2k</b></div>
            </article>
          </div>
        </section>

        {/* ─── Method ─── */}
        <section className="landing-method" id="method">
          <div className="landing-method-art">
            <div className="method-paper">
              <span>הדרך שלך</span>
              <strong>{t("طريقك")}<br />{t("إلى الطلاقة")}</strong>
              <div className="method-route"><i /><i /><i /><i /><i /></div>
              <small>{t("خطوة صغيرة")}<br />{t("كل يوم")}</small>
            </div>
            <span className="method-bubble bubble-one">שמע</span>
            <span className="method-bubble bubble-two">דבר</span>
            <span className="method-bubble bubble-three">התחבר</span>
          </div>
          <div className="landing-method-copy">
            <span className="landing-eyebrow">{t("منهجية واضحة")}</span>
            <h2>{t("ثلاث خطوات.")}<br /><em>{t("تغيير حقيقي.")}</em></h2>
            <p>{t("لا نؤمن بالحفظ العشوائي. كل درس عندنا يقربك من هدف واضح، ويترك في يدك شيئًا تستطيع استخدامه فورًا.")}</p>
            <div className="method-steps">
              <div><span>01</span><div><strong>{t("اعرف مستواك")}</strong><small>{t("اختبار ذكي يحدد نقطة البداية المناسبة لك.")}</small></div></div>
              <div><span>02</span><div><strong>{t("تعلّم ما تحتاجه")}</strong><small>{t("دروس قصيرة، محادثات، وتدريب على مواقف حقيقية.")}</small></div></div>
              <div><span>03</span><div><strong>{t("استخدمها بثقة")}</strong><small>{t("تحدث مع مدربك ومجتمعك حتى تصبح اللغة طبيعية.")}</small></div></div>
            </div>
            <Link to={ctaTo} className="landing-text-link">{t("ابدأ باختبار تحديد المستوى")} <ArrowLeft size={16} /></Link>
          </div>
        </section>

        {/* ─── Programs ─── */}
        <section className="landing-section programs-section" id="programs">
          <div className="landing-section-heading centered">
            <span className="landing-eyebrow">{t("اختر طريقك")}</span>
            <h2>{t("برنامج يناسب")} <em>{t("هدفك.")}</em></h2>
            <p>{t("سواء كنت تبدأ من الصفر أو تريد كسر حاجز التحدث، لديك مسار واضح ينتظرك — عبري أو إنجليزي.")}</p>
          </div>
          <div className="program-grid">
            {PROGRAMS.map((p) => (
              <article className={`program-card ${p.featured ? "featured" : ""}`} key={p.title}>
                {p.tag && <span className="program-tag">{t(p.tag)}</span>}
                <div className={`program-icon ${p.iconTone}`}><p.icon size={22} /></div>
                <h3>{t(p.title)}</h3>
                <p>{t(p.desc)}</p>
                <div className="program-meta">
                  {p.meta.map((m) => <span key={m}><Clock3 size={14} /> {t(m)}</span>)}
                </div>
                <Link to="/packages/basic">{t("اعرف تفاصيل البرنامج")} <ArrowLeft size={15} /></Link>
              </article>
            ))}
          </div>
        </section>

        {/* ─── Teachers ─── */}
        <section className="landing-section" id="teachers">
          <div className="landing-section-heading centered">
            <span className="landing-eyebrow">{t("نخبة المعلمين")}</span>
            <h2>{t("تعلّم من")} <em>{t("خبراء معتمدين.")}</em></h2>
            <p>{t("اطلع على مواعيدهم الأسبوعية واحجز جلستك مباشرة.")}</p>
          </div>
          <div className="teachers-grid">
            {teachersToRender.length === 0 && (
              <article className="teacher-card" style={{ gridColumn: "1 / -1", alignItems: "center" }}>
                <p style={{ margin: "30px 0" }}>{t("سيظهر المعلمون هنا فور إضافة مواعيدهم من إدارة الأكاديمية.")}</p>
              </article>
            )}
            {teachersToRender.map((t) => <TeacherCard key={t.name} teacher={t} />)}
          </div>
        </section>

        {/* ─── Testimonials ─── */}
        <section className="landing-testimonials" id="testimonials">
          <div className="landing-section-heading">
            <span className="landing-eyebrow">{t("أصوات من الرحلة")}</span>
            <h2>{t("النتيجة تُسمع")}<br /><em>{t("في كلام طلابنا.")}</em></h2>
          </div>
          <div className="testimonial-grid">
            <article>
              <div className="quote-mark">“</div>
              <p>{t("كنت أفهم العبرية لكن لا أستطيع التحدث. بعد شهرين أصبحت أشارك في اجتماعات العمل بثقة.")}</p>
              <div className="testimonial-author">
                <span className="testimonial-avatar mint">ن</span>
                <div><strong>{t("نور حسن")}</strong><small>{t("طالبة · مستوى B1")}</small></div>
                <div className="stars">★★★★★</div>
              </div>
            </article>
            <article>
              <div className="quote-mark">“</div>
              <p>{t("الجميل أن كل درس له علاقة بموقف أعيشه فعلًا. لم أشعر للحظة أنني أحفظ كلمات بلا معنى.")}</p>
              <div className="testimonial-author">
                <span className="testimonial-avatar peach">م</span>
                <div><strong>{t("محمد علي")}</strong><small>{t("طالب · مستوى A2")}</small></div>
                <div className="stars">★★★★★</div>
              </div>
            </article>
            <article>
              <div className="quote-mark">“</div>
              <p>{t("المدربة فهمت هدفي من أول جلسة، والخطة كانت واضحة جدًا. لأول مرة أستمر في تعلم لغة حتى النهاية.")}</p>
              <div className="testimonial-author">
                <span className="testimonial-avatar purple">ر</span>
                <div><strong>{t("ريم سامي")}</strong><small>{t("طالبة · مستوى B2")}</small></div>
                <div className="stars">★★★★★</div>
              </div>
            </article>
          </div>
        </section>

        {/* ─── Pricing ─── */}
        <section className="landing-pricing" id="pricing">
          <div className="pricing-copy">
            <span className="landing-eyebrow">{t("ابدأ بالطريقة التي تناسبك")}</span>
            <h2>{t("رحلتك لا تحتاج")}<br /><em>{t("انتظارًا أطول.")}</em></h2>
            <p>{t("اختبر مستواك مجانًا أولًا، ثم اختر الباقة التي تناسب وقتك وهدفك. بدون التزام طويل.")}</p>
            <div className="pricing-checks">
              <span><Check size={15} /> {t("اختبار تحديد مستوى مجاني")}</span>
              <span><Check size={15} /> {t("إلغاء في أي وقت")}</span>
            </div>
          </div>
          <div className="pricing-cards">
            <article className="pricing-card">
              <div className="pricing-card-head">
                <span className="pricing-card-icon"><BookOpenCheck size={20} /></span>
                <div className="pricing-card-titles">
                  <h3>{t("الباقات الأساسية")}</h3>
                  <span className="pricing-tag">{t("الأكثر شمولًا")}</span>
                </div>
              </div>
              <p>{t("دروس أونلاين أو حضوري لكل المستويات مع مدرسين معتمدين — منهج كامل من Pre A1 إلى B2.")}</p>
              <ul>
                <li><Check size={15} /> {t("أونلاين أو حضوري")}</li>
                <li><Check size={15} /> {t("لكل المستويات Pre A1 — B2")}</li>
                <li><Check size={15} /> {t("مدرسون معتمدون")}</li>
              </ul>
              <Link to="/packages/basic" className="pricing-card-cta">{t("تصفح الباقات")} <ArrowLeft size={16} /></Link>
            </article>
            <article className="pricing-card featured">
              <div className="pricing-card-head">
                <span className="pricing-card-icon"><Phone size={20} /></span>
                <div className="pricing-card-titles">
                  <h3>{t("نظام المكالمات")}</h3>
                  <span className="pricing-tag">{t("مرونة كاملة")}</span>
                </div>
              </div>
              <p>{t("حصص فردية أونلاين — احجز وغيّر مواعيدك حسب جدولك من غير التزام بجدول ثابت.")}</p>
              <ul>
                <li><Check size={15} /> {t("حصص فردية (12/20/28)")}</li>
                <li><Check size={15} /> {t("أونلاين فقط")}</li>
                <li><Check size={15} /> {t("تواصل مع الدعم للحجز")}</li>
              </ul>
              <Link to="/packages/calls" className="pricing-card-cta">{t("تصفح الباقات")} <ArrowLeft size={16} /></Link>
            </article>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="landing-section" id="faq" style={{ paddingTop: 0 }}>
          <div className="landing-section-heading centered">
            <span className="landing-eyebrow">{t("عندك سؤال؟")}</span>
            <h2>{t("الأسئلة")} <em>{t("الشائعة")}</em></h2>
          </div>
          <div className="faq-list">
            {FAQ_ITEMS.map((item) => (
              <details className="faq-item" key={item.q}>
                <summary>{t(item.q)}<ChevronDown size={16} /></summary>
                <p>{t(item.a)}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ─── Final CTA ─── */}
        <section className="landing-final-cta">
          <div className="final-cta-pattern" />
          <span className="landing-eyebrow">{t("الكلمة الأولى تبدأ الآن")}</span>
          <h2>{t("جاهز تقول أول جملة؟")}</h2>
          <p>{t("خلّي العبرية والإنجليزية جزءًا من يومك، وليس مجرد هدف مؤجل.")}</p>
          <Link to={ctaTo} className="landing-primary light">{t("ابدأ رحلتك مجانًا")} <ArrowLeft size={17} /></Link>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-brand">
          <LandingBrand />
          <p>{t("نتعلم اللغات، خطوة بخطوة.")}</p>
        </div>
        <div className="landing-footer-links">
          <div>
            <strong>{t("اكتشف")}</strong>
            <a href="#why">{t("لماذا نحن؟")}</a>
            <a href="#programs">{t("البرامج")}</a>
            <a href="#method">{t("منهجيتنا")}</a>
            <a href="#faq">{t("الأسئلة الشائعة")}</a>
          </div>
          <div>
            <strong>{t("تواصل")}</strong>
            <a href="tel:+201270869510"><Phone size={11} /> <span dir="ltr">+20 1270 869 510</span></a>
            <a href="#pricing">{t("الباقات والأسعار")}</a>
            <a href="#teachers">{t("معلمونا")}</a>
          </div>
        </div>
        <div className="landing-footer-bottom">
          <span>© {new Date().getFullYear()} עברית שוטפת. {t("جميع الحقوق محفوظة.")}</span>
          <span>{t("صُنع للرحلة، من أجل الحياة")} <Heart size={13} fill="currentColor" /></span>
        </div>
      </footer>
    </div>
  );
}
