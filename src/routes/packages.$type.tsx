import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Check, GraduationCap, Phone, Users } from "lucide-react";
import { Button } from "../components/ui";
import { usePlatformStore, type PublicPackage } from "../hooks/use-platform-store";
import { useAuth } from "../hooks/use-auth";

export const Route = createFileRoute("/packages/$type")({
  head: ({ params }) => ({
    meta: [{ title: params.type === "calls" ? "نظام المكالمات" : "الباقات الأساسية" }],
  }),
  component: PackagesCategoryPage,
});

const NAVY = "#0b2f6e";
const NAVY_DEEP = "#071f4d";
const GREEN = "#7fc341";

function PackagesCategoryPage() {
  const type = Route.useParams().type as "basic" | "calls";
  const { publicPackages, fetchPublicPackages } = usePlatformStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchPublicPackages(type);
      setLoading(false);
    })();
  }, [type]); // eslint-disable-line react-hooks/exhaustive-deps

  const isCalls = type === "calls";
  const title = isCalls ? "نظام المكالمات" : "الباقات الأساسية";
  const subtitle = isCalls
    ? "حصص فردية أونلاين — احجز مواعيدك بنفسك"
    : "دروس لكل المستويات — أونلاين أو حضوري";

  function handleBook(pkg: PublicPackage) {
    if (!user) {
      navigate({ to: "/register" });
      return;
    }
    if (user.role !== "STUDENT") {
      navigate({ to: "/login" });
      return;
    }
    navigate({ to: "/subscribe", search: { packageId: pkg.id } });
  }

  return (
    <div dir="rtl" className="relative min-h-screen overflow-x-clip bg-[#f6f9fd] text-ink">
      <div className="pointer-events-none absolute -top-32 -left-32 size-[420px] rounded-full bg-[#dce9ff] blur-3xl opacity-70" />
      <div className="pointer-events-none absolute top-1/3 -right-40 size-[380px] rounded-full bg-[#e4f4d4] blur-3xl opacity-60" />

      {/* Header */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <Link to="/" className="flex items-center gap-2 text-sm font-medium text-[#33436b] hover:text-[#0b2f6e]">
          <ArrowRight className="size-4" /> العودة للرئيسية
        </Link>
        <div className="flex items-center gap-2">
          <span className="grid size-10 place-items-center rounded-xl text-white" style={{ background: `linear-gradient(135deg, ${GREEN}, #4f9e1f)` }}>
            <GraduationCap className="size-5" />
          </span>
          <b className="text-[15px] font-bold" style={{ color: NAVY }}>עברית שוטפת</b>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-5 pb-24">
        {/* Hero */}
        <section className="pt-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#dfe8f7] bg-white px-4 py-1.5 text-xs font-semibold text-[#33436b] shadow-sm">
            {isCalls ? <Phone className="size-3.5" /> : <Users className="size-3.5" />}
            {isCalls ? "حصص فردية أونلاين" : "باقات تعليمية شاملة"}
          </span>
          <h1 className="mt-5 text-3xl font-bold lg:text-4xl" style={{ color: NAVY }}>{title}</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#5a6b8c]">{subtitle}</p>
        </section>

        {/* Packages grid */}
        <section className="mt-10">
          {loading ? (
            <div className="rounded-2xl border border-[#e7edf7] bg-white py-16 text-center text-sm text-[#5a6b8c]">
              جاري تحميل الباقات...
            </div>
          ) : publicPackages.length === 0 ? (
            <div className="rounded-2xl border border-[#e7edf7] bg-white py-16 text-center text-sm text-[#5a6b8c]">
              لا توجد باقات في هذه الفئة حالياً — تابعنا قريباً.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {publicPackages.map((p) => (
                <div key={p.id} className="tilt-hover flex flex-col rounded-2xl border border-[#e7edf7] bg-white p-7 shadow-sm">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-bold" style={{ color: NAVY }}>{p.nameAr}</h3>
                    <span className="rounded-full px-3 py-1 text-[11px] font-bold text-white" style={{ background: NAVY }}>
                      {p.durationMonths} {p.durationUnit === "week" ? "أسبوع" : "شهر"}
                    </span>
                  </div>

                  {/* level + study mode badges */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.level && (
                      <span className="rounded-md bg-[#eef3fb] px-2 py-0.5 text-[10px] font-semibold" style={{ color: NAVY }}>
                        المستوى: {p.level}
                      </span>
                    )}
                    {p.studyMode && (
                      <span className="rounded-md bg-[#e4f4d4] px-2 py-0.5 text-[10px] font-semibold" style={{ color: "#4f9e1f" }}>
                        {p.studyMode === "online" ? "أونلاين" : p.studyMode === "offline" ? "حضوري" : "أونلاين + حضوري"}
                      </span>
                    )}
                    {p.sessionsTotal && (
                      <span className="rounded-md bg-[#fff3e0] px-2 py-0.5 text-[10px] font-semibold" style={{ color: "#e67e22" }}>
                        {p.sessionsTotal} حصة
                      </span>
                    )}
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

                  <Button
                    className="mt-5 w-full"
                    onClick={() => handleBook(p)}
                  >
                    {user ? "اشترك الآن" : "سجّل واشترك"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
