export const translations = {
  ar: {
    dashboard: "لوحة الطالب", placement: "اختبار المستوى", plan: "خطة التعلم", conversation: "المحادثة",
    scenarios: "السيناريوهات", mistakes: "سجل الأخطاء", progress: "التقدم", teacher: "لوحة المدرس",
    admin: "الإدارة", sales: "المبيعات", support: "خدمة العملاء", welcome: "مرحبًا، لينا",
  },
  he: {
    dashboard: "לוח תלמיד", placement: "מבחן רמה", plan: "תוכנית למידה", conversation: "שיחה",
    scenarios: "תרחישים", mistakes: "יומן טעויות", progress: "התקדמות", teacher: "לוח מורה",
    admin: "ניהול", sales: "מכירות", support: "שירות לקוחות", welcome: "שלום, לינה",
  },
  en: {},
  zh: {},
} as const;

export type Locale = keyof typeof translations;
