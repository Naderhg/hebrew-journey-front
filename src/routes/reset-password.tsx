import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { apiFetch } from "../lib/api";
import { Button, Card, Input, Label } from "../components/ui";
import { useI18n } from "../lib/i18n";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "עברית שוטפת — تعيين كلمة مرور جديدة" }] }),
  validateSearch: (search: Record<string, unknown>): { token?: string } => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError(t("كلمتا المرور غير متطابقتين"));
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: { token, password },
        skipAuth: true,
      });
      navigate({ to: "/login" });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("رابط غير صالح أو منتهي — اطلب رابطاً جديداً"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div dir="rtl" className="relative min-h-screen overflow-hidden bg-paper text-ink">
      <div className="page-glow absolute inset-0 -z-10" />
      <div className="grid-fade absolute inset-0 -z-10 opacity-40" />
      <div className="flex min-h-screen items-center justify-center px-5 py-10">
        <Card className="w-full max-w-md p-8">
          <div className="mb-8 text-center">
            <Link to="/" className="inline-grid size-12 place-items-center rounded-md bg-brand font-lat text-xl font-bold text-primary-foreground">
              O
            </Link>
            <h1 className="mt-4 text-2xl font-bold">{t("كلمة مرور جديدة")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("اختر كلمة مرور جديدة لحسابك")}
            </p>
          </div>

          {!token ? (
            <div className="rounded-md bg-danger/10 px-4 py-4 text-center text-sm font-semibold text-danger">
              {t("رابط الاستعادة غير صالح — تأكد من فتح الرابط الكامل من بريدك.")}
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">{t("كلمة المرور الجديدة")}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder={t("8 أحرف على الأقل")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">{t("تأكيد كلمة المرور")}</Label>
                  <Input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={8}
                    placeholder={t("أعد كتابة كلمة المرور")}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t("جاري الحفظ...") : t("حفظ كلمة المرور")}
                </Button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/forgot-password" className="font-semibold text-brand hover:underline">
              {t("طلب رابط استعادة جديد")}
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
