import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { apiFetch } from "../lib/api";
import { Button, Card, Input, Label } from "../components/ui";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Fluent Hebrew — استعادة كلمة المرور" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: { email },
        skipAuth: true,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر إرسال رابط الاستعادة — حاول لاحقاً");
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
            <h1 className="mt-4 text-2xl font-bold">استعادة كلمة المرور</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور
            </p>
          </div>

          {done ? (
            <div className="rounded-md bg-sage/10 px-4 py-4 text-center text-sm font-semibold text-sage">
              لو البريد مسجل لدينا، وصلك رابط إعادة التعيين — راجع بريدك الإلكتروني.
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
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "جاري الإرسال..." : "إرسال رابط الاستعادة"}
                </Button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/login" className="font-semibold text-brand hover:underline">
              العودة لتسجيل الدخول
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
