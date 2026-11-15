import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { getHomeRouteForRole } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import { Button, Card, Input, Label } from "../components/ui";
import { LanguageSwitcher } from "../components/app-shell";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "עברית שוטפת — تسجيل الدخول" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const { t, dir } = useI18n();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
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
    <div dir={dir} className="relative min-h-screen overflow-hidden bg-paper text-ink">
      <div className="page-glow absolute inset-0 -z-10" />
      <div className="grid-fade absolute inset-0 -z-10 opacity-40" />
      <div className="absolute end-4 top-4 z-10">
        <LanguageSwitcher />
      </div>
      <div className="flex min-h-screen items-center justify-center px-5 py-10">
        <Card className="w-full max-w-md p-8">
          <div className="mb-8 text-center">
            <Link to="/" className="inline-grid size-12 place-items-center rounded-md bg-brand font-lat text-xl font-bold text-primary-foreground">
              O
            </Link>
            <h1 className="mt-4 text-2xl font-bold">{t("تسجيل الدخول")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("أهلاً بعودتك إلى עברית שוטפת— أكاديمية اللغات (عبري وإنجليزي).")}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">{t("رقم الهاتف أو البريد الإلكتروني")}</Label>
              <Input
                id="identifier"
                type="text"
                dir="ltr"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                placeholder="01xxxxxxxxx"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("كلمة المرور")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("جاري الدخول...") : t("دخول")}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm">
            <Link to="/forgot-password" className="text-muted-foreground hover:text-brand hover:underline">
              {t("نسيت كلمة المرور؟")}
            </Link>
          </p>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("طالب جديد وليس لديك حساب؟")}{" "}
            <Link to="/register" className="font-semibold text-brand hover:underline">
              {t("أنشئ حساب طالب")}
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
