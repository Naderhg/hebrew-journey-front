import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { Button, Card, Input, Label } from "../components/ui";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Ohran — إنشاء حساب" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register({ email, password, fullName, phone: phone || undefined, role });
      navigate({ to: "/login" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
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
            <h1 className="mt-4 text-2xl font-bold">إنشاء حساب</h1>
            <p className="mt-2 text-sm text-muted-foreground">ابدأ رحلتك في تعلم العبرية</p>
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">الاسم الكامل</Label>
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
                minLength={8}
                placeholder="8 أحرف على الأقل"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف (اختياري)</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+20..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">الدور</Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="STUDENT">طالب</option>
                <option value="TEACHER">مدرس</option>
                <option value="ADMIN">مدير</option>
                <option value="SALES">مبيعات</option>
                <option value="SUPPORT">دعم فني</option>
              </select>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "جاري الإنشاء..." : "إنشاء حساب"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            لديك حساب بالفعل؟{" "}
            <Link to="/login" className="text-brand hover:underline">
              سجل الدخول
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
