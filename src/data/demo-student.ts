import type { AuthUser } from "../lib/auth";
import type { LeaderboardEntry, StudentDashboard, StudentSkillItem } from "../hooks/use-platform-store";

export const DEMO_STUDENT_EMAIL = "demo@example.test";
export const DEMO_STUDENT_PASSWORD = "demo12345";

export const DEMO_STUDENT_USER: AuthUser = {
  id: "local-demo-student",
  fullName: "طالب تجريبي",
  email: DEMO_STUDENT_EMAIL,
  phone: "01000000000",
  role: "STUDENT",
  locale: "ar",
  level: "A2",
  placementCompletedAt: "2026-10-01T10:00:00.000Z",
  hasActiveSubscription: true,
  isActive: true,
  isDemo: true,
};

export const DEMO_STUDENT_DASHBOARD: StudentDashboard = {
  myResults: [
    {
      title: "اختبار القراءة الأول",
      type: "reading",
      score: 84,
      feedback: "قراءة جيدة. راجع تصريف الأفعال في الماضي.",
    },
    {
      title: "تمرين الترجمة",
      type: "translation",
      score: 76,
      feedback: "تحسن واضح في ترتيب الكلمات.",
    },
  ],
  myAvgScore: 80,
  myRank: 4,
  totalStudents: 24,
};

export const DEMO_STUDENT_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, fullName: "ليلى حسن", avgScore: 94, examsTaken: 8 },
  { rank: 2, fullName: "عمر سامي", avgScore: 89, examsTaken: 7 },
  { rank: 3, fullName: "مريم علي", avgScore: 85, examsTaken: 6 },
  { rank: 4, fullName: "طالب تجريبي", avgScore: 80, examsTaken: 5 },
];

export const DEMO_STUDENT_SKILLS: StudentSkillItem[] = [
  { id: "demo-skill-reading", studentId: "local-demo-student", skill: "reading", score: 84 },
  { id: "demo-skill-writing", studentId: "local-demo-student", skill: "writing", score: 72 },
  { id: "demo-skill-listening", studentId: "local-demo-student", skill: "listening", score: 78 },
  { id: "demo-skill-speaking", studentId: "local-demo-student", skill: "speaking", score: 68 },
];
