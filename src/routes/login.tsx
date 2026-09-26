import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { Button, Card, Input, Label } from "../components/ui";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Ohran — تسجيل الدخول" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
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
            <span className="inline-grid size-12 place-items-center rounded-md bg-brand font-lat text-xl font-bold text-primary-foreground">O</span>
            <h1 className="mt-4 text-2xl font-bold">تسجيل الدخول</h1>
            <p className="mt-2 text-sm text-muted-foreground">أهلاً بعودتك إلى Ohran</p>
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
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
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
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
              {loading ? "جاري الدخول..." : "دخول"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            ليس لديك حساب؟{" "}
            <Link to="/register" className="text-brand hover:underline">
              أنشئ حساباً
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
