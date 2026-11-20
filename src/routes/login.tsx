import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Phone, AlertCircle } from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { getHomeRouteForRole } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import { Button, Input, Label } from "../components/ui";
import { AuthShell } from "../components/auth-shell";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "עברית שוטפת — تسجيل الدخول" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const loggedInUser = await login(identifier, password);
      const targetRoute = getHomeRouteForRole(loggedInUser.role);
      navigate({ to: targetRoute });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("فشل تسجيل الدخول — تأكد من رقم الهاتف وكلمة المرور"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="auth-card">
        <div className="mb-8">
          <Link to="/" className="hidden size-12 place-items-center rounded-xl bg-white shadow-md ring-1 ring-border lg:inline-grid">
            <img src="/logo.jpg" alt="עברית שוטפת" className="size-10 rounded-lg object-cover" />
          </Link>
          <h1 className="mt-5 text-2xl font-bold text-[#0d3b56]">{t("تسجيل الدخول")}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {t("أهلاً بعودتك — سجل دخولك وأكمل رحلة التعلم.")}
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
            <Label htmlFor="identifier">{t("رقم الهاتف أو البريد الإلكتروني")}</Label>
            <div className="auth-input-wrap">
              <Phone className="auth-input-icon" />
              <Input
                id="identifier"
                type="text"
                dir="ltr"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                placeholder="01xxxxxxxxx"
                className="ps-10 text-start"
              />
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
                placeholder="••••••••"
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

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-xs font-medium text-muted-foreground hover:text-brand hover:underline">
              {t("نسيت كلمة المرور؟")}
            </Link>
          </div>

          <Button type="submit" className="auth-submit w-full" disabled={loading}>
            {loading ? t("جاري الدخول...") : t("دخول")}
          </Button>
        </form>

        <p className="mt-7 text-center text-sm text-muted-foreground">
          {t("طالب جديد وليس لديك حساب؟")}{" "}
          <Link to="/register" className="font-semibold text-brand hover:underline">
            {t("أنشئ حساب طالب")}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
