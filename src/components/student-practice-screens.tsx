import { useState } from "react";
import { Mic, Send } from "lucide-react";
import { AppShell, PageHeader } from "./app-shell";
import { Badge, Button, Card } from "./ui";

export function PlanScreen() {
  return (
    <AppShell role="STUDENT">
      <PageHeader title="خطة التعلم الشخصية" subtitle="المسار اليومي المخصص لك" />
      <Card className="py-12 text-center text-sm text-muted-foreground">
        <Badge tone="gold">قيد التجهيز</Badge>
        <p className="mt-3">خطة التعلم لم تُربط ببيانات الحساب بعد. لن تظهر خطة محفوظة في هذه الصفحة حالياً.</p>
      </Card>
    </AppShell>
  );
}

export function ConversationScreen() {
  const [messages, setMessages] = useState<string[]>([]);
  const [text, setText] = useState("");

  function send() {
    if (!text.trim()) return;
    setMessages((current) => [...current, text.trim()]);
    setText("");
  }

  return (
    <AppShell role="STUDENT">
      <PageHeader title="محادثة عبرية" subtitle="معاينة للواجهة — لم يتم ربطها بمساعد أو خدمة حفظ بعد" />
      <Card className="flex min-h-[520px] flex-col p-0">
        <p className="border-b border-border bg-amber-500/10 px-4 py-3 text-xs text-amber-900">
          الرسائل هنا تجريبية وتبقى في الصفحة الحالية فقط. زر التسجيل الصوتي غير متاح بعد.
        </p>
        <div className="flex flex-1 flex-col gap-4 p-5">
          {messages.length === 0 ? (
            <div className="m-auto text-center text-sm text-muted-foreground">
              ابدأ المحادثة بكتابة رسالة بالعبرية...
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={`${index}-${message}`}
                dir="rtl"
                className="me-auto max-w-[78%] rounded-lg bg-brand px-4 py-3 font-he text-primary-foreground"
              >
                {message}
              </div>
            ))
          )}
        </div>
        <div className="flex items-end gap-2 border-t border-border p-4">
          <Button
            disabled
            aria-label="التسجيل الصوتي غير متاح حالياً"
            variant="secondary"
            className="size-11 shrink-0 rounded-full p-0"
          >
            <Mic />
          </Button>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
            dir="rtl"
            aria-label="رسالتك بالعبرية"
            className="max-h-28 min-h-11 flex-1 resize-none rounded-md border border-input bg-background/70 px-3 py-2 font-he outline-none focus:ring-2 focus:ring-ring"
            placeholder="اكتب رسالة بالعبرية..."
          />
          <Button onClick={send} disabled={!text.trim()} aria-label="إرسال الرسالة" className="size-11 p-0">
            <Send className="size-4" />
          </Button>
        </div>
      </Card>
    </AppShell>
  );
}

export function ScenariosScreen() {
  return (
    <AppShell role="STUDENT">
      <PageHeader title="مكتبة السيناريوهات" subtitle="تدرّب على مواقف واقعية تناسب مستواك" />
      <Card className="py-12 text-center text-sm text-muted-foreground">
        <Badge tone="gold">قيد التجهيز</Badge>
        <p className="mt-3">مكتبة السيناريوهات غير متصلة بمحتوى حتى الآن.</p>
      </Card>
    </AppShell>
  );
}

export function MistakesScreen() {
  return (
    <AppShell role="STUDENT">
      <PageHeader title="سجل الأخطاء" subtitle="متابعة الأخطاء المتكررة وتصحيحها" />
      <Card className="py-12 text-center text-sm text-muted-foreground">
        <Badge tone="gold">قيد التجهيز</Badge>
        <p className="mt-3">سجل الأخطاء غير متصل بنتائج التدريبات حتى الآن.</p>
      </Card>
    </AppShell>
  );
}
