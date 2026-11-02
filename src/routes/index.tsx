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
    title: "عبري — المتقدم (C1)",
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
    title: "إنجليزي — المتقدم (C1-C2)",
    desc: "إتقان النطق والطلاقة، الكتابة الأكاديمية، والاستعداد لامتحانات IELTS وTOEFL.",
    meta: ["لغة إنجليزية", "متقدم"],
  },
];

function LandingBrand() {
  return (
    <a className="landing-brand" href="#top" aria-label="עברית שוטפת">
      <span className="landing-brand-symbol">ח<i /></span>
      <span>
        <strong className="font-he">עברית שוטפת</strong>
        <small>أكاديمية اللغات العملية</small>
      </span>
    </a>
  );
}

function TeacherCard({ teacher }: { teacher: { name: string; badge: string; avatarUrl: string | null; slots: string[]; desc: string; initials: string } }) {
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
          <small>تُعلن المواعيد قريباً</small>
        ) : (
          teacher.slots.map((s) => <span key={s}>{s}</span>)
        )}
      </div>
    </article>
  );
}

function Landing() {
  const { user } = useAuth();
  const { publicSchedules, fetchPublicSchedules, publicTeachers, fetchPublicTeachers } = usePlatformStore();
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    fetchPublicSchedules();
    fetchPublicTeachers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const slotsByTeacher = publicSchedules.reduce<Record<string, { slots: string[]; online: boolean }>>(
    (acc, s) => {
      const t = s.teacher;
      if (!t) return acc;
      acc[t.id] ??= { slots: [], online: false };
      acc[t.id].slots.push(`${LANDING_DAY_NAMES[s.dayOfWeek]} ${s.startTime}`);
      acc[t.id].online ||= s.location === "online";
      return acc;
    },
    {},
  );
  const teachersToRender = publicTeachers.map((t: PublicTeacher) => ({
    name: t.fullName,
    badge: t.specialty ?? "مدرس لغات",
    avatarUrl: t.avatarUrl ?? null,
    slots: slotsByTeacher[t.id]?.slots ?? [],
    desc: t.bio || "مدرس معتمد — أونلاين وحضوري، مواعيد ثابتة كل أسبوع",
    initials: t.fullName.replace(/^(د\.|أ\.|م\.)\s*/, "")[0] ?? "؟",
  }));

  const ctaTo = user ? getHomeRouteForRole(user.role) : "/register";

  return (
    <div className="landing-page" dir="rtl">
      <header className="landing-header">
        <LandingBrand />
        <nav className={`landing-nav ${mobileNav ? "open" : ""}`} aria-label="التنقل الرئيسي">
          <a href="#why" onClick={() => setMobileNav(false)}>لماذا עברית שוטפת؟</a>
          <a href="#method" onClick={() => setMobileNav(false)}>كيف نتعلم؟</a>
          <a href="#programs" onClick={() => setMobileNav(false)}>البرامج</a>
          <a href="#teachers" onClick={() => setMobileNav(false)}>معلمونا</a>
          <a href="#pricing" onClick={() => setMobileNav(false)}>الأسعار</a>
        </nav>
        <div className="landing-header-actions">
          {user ? (
            <Link to={ctaTo} className="landing-header-cta">لوحة التحكم <ArrowLeft size={15} /></Link>
          ) : (
            <>
              <Link to="/login" className="landing-login">تسجيل الدخول</Link>
              <Link to="/register" className="landing-header-cta">ابدأ رحلتك <ArrowLeft size={15} /></Link>
            </>
          )}
        </div>
        <button className="landing-mobile-toggle" onClick={() => setMobileNav((v) => !v)} aria-label="فتح القائمة">
          {mobileNav ? <X size={21} /> : <Menu size={21} />}
        </button>
      </header>

      <main id="top">
        {/* ─── Hero ─── */}
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <span className="landing-eyebrow"><span className="eyebrow-dot" /> أكاديمية متخصصة للناطقين بالعربية</span>
            <h1>اتكلم عبري وإنجليزي<br /><em>بثقة، من أول يوم.</em></h1>
            <p>منهج عملي مصمم ليأخذك من أول كلمة إلى محادثة حقيقية — مع مدربين متخصصين، خطة تناسبك، ومجتمع يشجعك في كل خطوة.</p>
            <div className="landing-hero-actions">
              <Link to={ctaTo} className="landing-primary">اكتشف مستواك مجانًا <ArrowLeft size={17} /></Link>
              <a href="#method" className="landing-play"><span><Play size={14} fill="currentColor" /></span> شاهد كيف نعلّم</a>
            </div>
            <div className="landing-hero-note">
              <div className="mini-avatars"><span>س</span><span>م</span><span>ر</span><span>+</span></div>
              <p><strong>+2,500 خريج</strong><br />بدأوا رحلتهم معنا</p>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-visual-backdrop" />
            <div className="hero-word-card">
              <span className="hero-word-label">كلمة اليوم</span>
              <strong>להתחיל</strong>
              <b>يبدأ</b>
              <small>lahatchil · فعل</small>
              <button aria-label="استمع للنطق"><Play size={13} fill="currentColor" /></button>
            </div>
            <div className="hero-dialog-card">
              <div className="dialog-avatar">ל</div>
              <div>
                <span>المحادثة الذكية</span>
                <strong>מה שלומך היום?</strong>
                <small>كيف حالك اليوم؟</small>
              </div>
              <div className="dialog-wave"><i /><i /><i /><i /><i /></div>
            </div>
            <div className="hero-progress-card">
              <span className="hero-progress-icon"><Check size={15} /></span>
              <div>
                <strong>خطة اليوم مكتملة</strong>
                <small>أحسنت! 3 من 3 مهام</small>
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
          <span>تعلّمها كما تُستخدم في الحياة</span>
          <div><strong>+2,500</strong><small>خريج ناجح</small></div>
          <div><strong>+50k</strong><small>ساعة تعليمية</small></div>
          <div><strong>98%</strong><small>نسبة رضا</small></div>
          <div><strong>+15</strong><small>معلم خبير</small></div>
          <div className="trust-quote"><Star size={14} fill="currentColor" /> <span>"أخيرًا بدأت أتكلم بدون خوف"</span></div>
        </div>

        {/* ─── Why ─── */}
        <section className="landing-section why-section" id="why">
          <div className="landing-section-heading">
            <span className="landing-eyebrow">الفرق في التفاصيل</span>
            <h2>اللغة ليست مادة دراسية،<br /><em>إنها حياة.</em></h2>
            <p>لهذا صممنا تجربة تعليمية تشبه الحياة التي تريد أن تعيشها بالعبرية والإنجليزية — عملية، شخصية، ومليئة بالمواقف الحقيقية.</p>
          </div>
          <div className="why-grid">
            <article className="why-card why-card-main">
              <span className="why-icon teal"><MessageCircle size={21} /></span>
              <span className="card-index">01</span>
              <h3>تحدث من أول درس</h3>
              <p>لن تنتظر حتى تنهي القواعد. ستبدأ باستخدام جمل حقيقية في مواقف يومية من أول أسبوع.</p>
              <div className="speech-bubbles"><span>אני רוצה קפה</span><span>أريد قهوة</span></div>
            </article>
            <article className="why-card">
              <span className="why-icon yellow"><Target size={21} /></span>
              <span className="card-index">02</span>
              <h3>خطة تشبهك</h3>
              <p>نحدد مستواك ونقاط قوتك ونبني لك خطة مرنة تعرف دائمًا ما هي خطوتك التالية.</p>
              <div className="mini-bars"><i /><i /><i /><i /><i /></div>
            </article>
            <article className="why-card">
              <span className="why-icon purple"><Users size={21} /></span>
              <span className="card-index">03</span>
              <h3>مدرب ومجتمع</h3>
              <p>مدربون يفهمون هدفك، ومجتمع عربي يشجعك في كل مرة تفتح فيها درسًا جديدًا.</p>
              <div className="mini-community"><span>س</span><span>م</span><span>ل</span><b>+2k</b></div>
            </article>
          </div>
        </section>

        {/* ─── Method ─── */}
        <section className="landing-method" id="method">
          <div className="landing-method-art">
            <div className="method-paper">
              <span>הדרך שלך</span>
              <strong>طريقك<br />إلى الطلاقة</strong>
              <div className="method-route"><i /><i /><i /><i /><i /></div>
              <small>خطوة صغيرة<br />كل يوم</small>
            </div>
            <span className="method-bubble bubble-one">שמע</span>
            <span className="method-bubble bubble-two">דבר</span>
            <span className="method-bubble bubble-three">התחבר</span>
          </div>
          <div className="landing-method-copy">
            <span className="landing-eyebrow">منهجية واضحة</span>
            <h2>ثلاث خطوات.<br /><em>تغيير حقيقي.</em></h2>
            <p>لا نؤمن بالحفظ العشوائي. كل درس عندنا يقربك من هدف واضح، ويترك في يدك شيئًا تستطيع استخدامه فورًا.</p>
            <div className="method-steps">
              <div><span>01</span><div><strong>اعرف مستواك</strong><small>اختبار ذكي يحدد نقطة البداية المناسبة لك.</small></div></div>
              <div><span>02</span><div><strong>تعلّم ما تحتاجه</strong><small>دروس قصيرة، محادثات، وتدريب على مواقف حقيقية.</small></div></div>
              <div><span>03</span><div><strong>استخدمها بثقة</strong><small>تحدث مع مدربك ومجتمعك حتى تصبح اللغة طبيعية.</small></div></div>
            </div>
            <Link to={ctaTo} className="landing-text-link">ابدأ باختبار تحديد المستوى <ArrowLeft size={16} /></Link>
          </div>
        </section>

        {/* ─── Programs ─── */}
        <section className="landing-section programs-section" id="programs">
          <div className="landing-section-heading centered">
            <span className="landing-eyebrow">اختر طريقك</span>
            <h2>برنامج يناسب <em>هدفك.</em></h2>
            <p>سواء كنت تبدأ من الصفر أو تريد كسر حاجز التحدث، لديك مسار واضح ينتظرك — عبري أو إنجليزي.</p>
          </div>
          <div className="program-grid">
            {PROGRAMS.map((p) => (
              <article className={`program-card ${p.featured ? "featured" : ""}`} key={p.title}>
                {p.tag && <span className="program-tag">{p.tag}</span>}
                <div className={`program-icon ${p.iconTone}`}><p.icon size={22} /></div>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
                <div className="program-meta">
                  {p.meta.map((m) => <span key={m}><Clock3 size={14} /> {m}</span>)}
                </div>
                <Link to="/packages/basic">اعرف تفاصيل البرنامج <ArrowLeft size={15} /></Link>
              </article>
            ))}
          </div>
        </section>

        {/* ─── Teachers ─── */}
        <section className="landing-section" id="teachers">
          <div className="landing-section-heading centered">
            <span className="landing-eyebrow">نخبة المعلمين</span>
            <h2>تعلّم من <em>خبراء معتمدين.</em></h2>
            <p>اطلع على مواعيدهم الأسبوعية واحجز جلستك مباشرة.</p>
          </div>
          <div className="teachers-grid">
            {teachersToRender.length === 0 && (
              <article className="teacher-card" style={{ gridColumn: "1 / -1", alignItems: "center" }}>
                <p style={{ margin: "30px 0" }}>سيظهر المعلمون هنا فور إضافة مواعيدهم من إدارة الأكاديمية.</p>
              </article>
            )}
            {teachersToRender.map((t) => <TeacherCard key={t.name} teacher={t} />)}
          </div>
        </section>

        {/* ─── Testimonials ─── */}
        <section className="landing-testimonials" id="testimonials">
          <div className="landing-section-heading">
            <span className="landing-eyebrow">أصوات من الرحلة</span>
            <h2>النتيجة تُسمع<br /><em>في كلام طلابنا.</em></h2>
          </div>
          <div className="testimonial-grid">
            <article>
              <div className="quote-mark">“</div>
              <p>كنت أفهم العبرية لكن لا أستطيع التحدث. بعد شهرين أصبحت أشارك في اجتماعات العمل بثقة.</p>
              <div className="testimonial-author">
                <span className="testimonial-avatar mint">ن</span>
                <div><strong>نور حسن</strong><small>طالبة · مستوى B1</small></div>
                <div className="stars">★★★★★</div>
              </div>
            </article>
            <article>
              <div className="quote-mark">“</div>
              <p>الجميل أن كل درس له علاقة بموقف أعيشه فعلًا. لم أشعر للحظة أنني أحفظ كلمات بلا معنى.</p>
              <div className="testimonial-author">
                <span className="testimonial-avatar peach">م</span>
                <div><strong>محمد علي</strong><small>طالب · مستوى A2</small></div>
                <div className="stars">★★★★★</div>
              </div>
            </article>
            <article>
              <div className="quote-mark">“</div>
              <p>المدربة فهمت هدفي من أول جلسة، والخطة كانت واضحة جدًا. لأول مرة أستمر في تعلم لغة حتى النهاية.</p>
              <div className="testimonial-author">
                <span className="testimonial-avatar purple">ر</span>
                <div><strong>ريم سامي</strong><small>طالبة · مستوى B2</small></div>
                <div className="stars">★★★★★</div>
              </div>
            </article>
          </div>
        </section>

        {/* ─── Pricing ─── */}
        <section className="landing-pricing" id="pricing">
          <div className="pricing-copy">
            <span className="landing-eyebrow">ابدأ بالطريقة التي تناسبك</span>
            <h2>رحلتك لا تحتاج<br /><em>انتظارًا أطول.</em></h2>
            <p>اختبر مستواك مجانًا أولًا، ثم اختر الباقة التي تناسب وقتك وهدفك. بدون التزام طويل.</p>
            <div className="pricing-checks">
              <span><Check size={15} /> اختبار تحديد مستوى مجاني</span>
              <span><Check size={15} /> إلغاء في أي وقت</span>
            </div>
          </div>
          <div className="pricing-cards">
            <div className="pricing-card">
              <div className="pricing-card-top"><span>الباقات الأساسية</span><span className="pricing-recommended">الأكثر شمولًا</span></div>
              <p>دروس أونلاين أو حضوري لكل المستويات مع مدرسين معتمدين — منهج كامل من A1 إلى C2.</p>
              <ul>
                <li><Check size={15} /> أونلاين أو حضوري</li>
                <li><Check size={15} /> لكل المستويات A1 — C2</li>
                <li><Check size={15} /> مدرسون معتمدون</li>
              </ul>
              <Link to="/packages/basic">تصفح الباقات <ArrowLeft size={16} /></Link>
            </div>
            <div className="pricing-card">
              <div className="pricing-card-top"><span>نظام المكالمات</span><span className="pricing-recommended">مرونة كاملة</span></div>
              <p>حصص فردية أونلاين — احجز وغيّر مواعيدك بنفسك حسب جدولك.</p>
              <ul>
                <li><Check size={15} /> حصص فردية (12/20/28)</li>
                <li><Check size={15} /> أونلاين فقط</li>
                <li><Check size={15} /> احجز وغيّر مواعيدك بنفسك</li>
              </ul>
              <Link to="/packages/calls">تصفح الباقات <ArrowLeft size={16} /></Link>
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="landing-section" id="faq" style={{ paddingTop: 0 }}>
          <div className="landing-section-heading centered">
            <span className="landing-eyebrow">عندك سؤال؟</span>
            <h2>الأسئلة <em>الشائعة</em></h2>
          </div>
          <div className="faq-list">
            {FAQ_ITEMS.map((item) => (
              <details className="faq-item" key={item.q}>
                <summary>{item.q}<ChevronDown size={16} /></summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ─── Final CTA ─── */}
        <section className="landing-final-cta">
          <div className="final-cta-pattern" />
          <span className="landing-eyebrow">الكلمة الأولى تبدأ الآن</span>
          <h2>جاهز تقول أول جملة؟</h2>
          <p>خلّي العبرية والإنجليزية جزءًا من يومك، وليس مجرد هدف مؤجل.</p>
          <Link to={ctaTo} className="landing-primary light">ابدأ رحلتك مجانًا <ArrowLeft size={17} /></Link>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-brand">
          <LandingBrand />
          <p>نتعلم اللغات، خطوة بخطوة.</p>
        </div>
        <div className="landing-footer-links">
          <div>
            <strong>اكتشف</strong>
            <a href="#why">لماذا نحن؟</a>
            <a href="#programs">البرامج</a>
            <a href="#method">منهجيتنا</a>
            <a href="#faq">الأسئلة الشائعة</a>
          </div>
          <div>
            <strong>تواصل</strong>
            <a href="tel:+201270869510"><Phone size={11} /> <span dir="ltr">+20 1270 869 510</span></a>
            <a href="#pricing">الباقات والأسعار</a>
            <a href="#teachers">معلمونا</a>
          </div>
        </div>
        <div className="landing-footer-bottom">
          <span>© {new Date().getFullYear()} עברית שוטפת. جميع الحقوق محفوظة.</span>
          <span>صُنع للرحلة، من أجل الحياة <Heart size={13} fill="currentColor" /></span>
        </div>
      </footer>
    </div>
  );
}
