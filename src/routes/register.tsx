import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Phone, User, AlertCircle, Sparkles } from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { useI18n } from "../lib/i18n";
import { Badge, Button, Input, Label } from "../components/ui";
import { AuthShell } from "../components/auth-shell";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "עברית שוטפת  — إنشاء حساب طالب" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const { register } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [learningLanguage, setLearningLanguage] = useState<"hebrew" | "english">("hebrew");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register({ phone, password, fullName, learningLanguage });
      navigate({ to: "/login" });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("تعذر إنشاء الحساب، تأكد من اتصال السيرفر"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="auth-card">
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <Link to="/" className="hidden size-12 place-items-center rounded-xl bg-white shadow-md ring-1 ring-border lg:inline-grid">
              <img src="/logo.jpg" alt="עברית שוטפת" className="size-10 rounded-lg object-cover" />
            </Link>
          </div>
          <h1 className="mt-5 text-2xl font-bold text-[#0d3b56]">{t("إنشاء حساب طالب")}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {t("ابدأ مسارك باختبار تحديد المستوى وخطة تعلم شخصية — التسجيل مخصص للطلاب فقط.")}
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">{t("الاسم الكامل")}</Label>
            <div className="auth-input-wrap">
              <User className="auth-input-icon" />
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder={t("اسمك الكامل")}
                className="ps-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t("رقم الهاتف")}</Label>
            <div className="auth-input-wrap">
              <Phone className="auth-input-icon" />
              <Input
                id="phone"
                type="tel"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="01xxxxxxxxx"
                className="ps-10 text-start"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="learningLanguage">{t("اللغة اللي عايز تتعلمها")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { value: "hebrew", label: "עברית — العبرية" },
                  { value: "english", label: "English — الإنجليزية" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLearningLanguage(opt.value)}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
                    learningLanguage === opt.value
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border hover:border-brand/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("كلمة المرور")}</Label>
            <div className="auth-input-wrap">
              <LockKeyhole className="auth-input-icon" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder={t("8 أحرف على الأقل")}
                className="ps-10 pe-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="auth-pass-toggle"
                aria-label={showPassword ? t("إخفاء كلمة المرور") : t("إظهار كلمة المرور")}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="auth-submit w-full" disabled={loading}>
            {loading ? t("جاري إنشاء حساب الطالب...") : t("إنشاء حساب طالب")}
          </Button>
        </form>

        <p className="mt-7 text-center text-sm text-muted-foreground">
          {t("لديك حساب بالفعل؟")}{" "}
          <Link to="/login" className="font-semibold text-brand hover:underline">
            {t("سجل الدخول")}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
