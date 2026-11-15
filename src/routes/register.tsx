import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { useI18n } from "../lib/i18n";
import { Badge, Button, Card, Input, Label } from "../components/ui";
import { LanguageSwitcher } from "../components/app-shell";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "עברית שוטפת  — إنشاء حساب طالب" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const { register } = useAuth();
  const { t, dir } = useI18n();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register({ phone, password, fullName });
      navigate({ to: "/login" });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("تعذر إنشاء الحساب، تأكد من اتصال السيرفر"));
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
            <div className="mt-4 flex justify-center">
              <Badge tone="brand">{t("حساب طالب جديد")}</Badge>
            </div>
            <h1 className="mt-3 text-2xl font-bold">{t("إنشاء حساب طالب")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("التسجيل المتاح عبر المنصة مخصص للطلاب فقط — يبدأ مسارك باختبار تحديد المستوى وخطة تعلم شخصية في العبرية أو الإنجليزية")}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t("الاسم الكامل")}</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="اسمك الكامل"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t("رقم الهاتف")}</Label>
              <Input
                id="phone"
                type="tel"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
                minLength={8}
                placeholder="8 أحرف على الأقل"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("جاري إنشاء حساب الطالب...") : t("إنشاء حساب طالب")}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("لديك حساب بالفعل؟")}{" "}
            <Link to="/login" className="font-semibold text-brand hover:underline">
              {t("سجل الدخول")}
            </Link>
          </p>
          
        </Card>
      </div>
    </div>
  );
}
