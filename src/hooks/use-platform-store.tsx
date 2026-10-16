import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiFetch, uploadFile } from "../lib/api";
import type { UserRole } from "../lib/auth";
import { useAuth } from "./use-auth";

export interface PlatformUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  level?: string;
  specialty?: string;
  isActive: boolean;
  createdAt: string;
}

export type MaterialType = "VIDEO" | "DOCUMENT" | "AUDIO";
export type PublishStatus = "DRAFT" | "PUBLISHED";

export interface MaterialAttachment {
  url: string;
  type: MaterialType;
  name: string;
  size: string;
}

export interface CourseMaterial {
  id: string;
  title: string;
  description: string;
  level: "A1" | "A2" | "B1" | "B2";
  type: MaterialType;
  fileName: string;
  fileSize: string;
  storageUrl: string;
  status: PublishStatus;
  attachments?: MaterialAttachment[] | null;
  assignedTeacherId: string;
  assignedTeacherName: string;
  createdAt: string;
}

export type PlacementSection = "قراءة" | "استماع" | "كتابة" | "محادثة";

export interface PlacementQuestion {
  id: string;
  section: PlacementSection;
  promptAr: string;
  hebrewText: string;
  options: string[];
  correctOptionIndex: number;
  levelTag: "A1" | "A2" | "B1" | "B2";
  isActive: boolean;
}

export type ExamType = "translation" | "reading" | "speaking" | "listening";

export const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  translation: "ترجمة",
  reading: "قراءة",
  speaking: "فقرة مكتوبة — تسجيل صوتي",
  listening: "استماع وإملاء (صوت الأدمن)",
};

export type QuestionType = "text" | "mcq" | "truefalse";

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  text: "نص حر / ترجمة (تصحيح يدوي)",
  mcq: "اختيار من متعدد (تصحيح تلقائي)",
  truefalse: "صح / خطأ (تصحيح تلقائي)",
};

export interface ExamQuestionItem {
  type: QuestionType;
  prompt: string;
  expected?: string;
  options?: string[];
  correctIndex?: number;
  points?: number;
}

export interface ExamQuestions {
  paragraph?: string;
  audioUrl?: string;
  items?: ExamQuestionItem[];
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  answers?: Record<string, string>;
  score?: number | null;
  feedback?: string | null;
  recordingUrl?: string | null;
  submittedAt: string;
  student?: { id: string; fullName: string; email: string };
  exam?: { id: string; title: string; type: ExamType; questions?: ExamQuestions; assignedTeacher?: { fullName: string } };
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  type: ExamType;
  questions: ExamQuestions;
  status: PublishStatus;
  assignedTeacherId?: string;
  assignedTeacherName?: string;
  createdByName?: string;
  resultsCount?: number;
  myResult?: {
    id: string;
    score?: number | null;
    feedback?: string | null;
    answers?: Record<string, string> | null;
    recordingUrl?: string | null;
    submittedAt: string;
  } | null;
  createdAt: string;
}

export interface StudentTeacherLink {
  id: string;
  groupName?: string | null;
  student: { id: string; fullName: string; email: string };
  teacher: { id: string; fullName: string; email: string };
}

export interface TeacherStudent {
  linkId: string;
  groupName?: string | null;
  assignedAt: string;
  examsTaken: number;
  avgScore: number | null;
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  level?: string;
  createdAt: string;
}

interface CreateStaffUserInput {
  fullName: string;
  email: string;
  password?: string;
  phone?: string;
  role: Exclude<UserRole, "STUDENT">;
  specialty?: string;
}

interface CreateMaterialInput {
  title: string;
  description: string;
  level: "A1" | "A2" | "B1" | "B2";
  type: MaterialType;
  fileName: string;
  fileSize: string;
  assignedTeacherId: string;
  storageUrl: string;
  status: PublishStatus;
  attachments?: MaterialAttachment[];
}

interface CreatePlacementQuestionInput {
  section: PlacementSection;
  promptAr: string;
  hebrewText: string;
  options: string[];
  correctOptionIndex: number;
  levelTag: "A1" | "A2" | "B1" | "B2";
}

interface CreateExamInput {
  title: string;
  description: string;
  type: ExamType;
  questions: ExamQuestions;
  assignedTeacherId: string;
  status: PublishStatus;
}

export interface StudentDashboard {
  myResults: { title: string; type: ExamType; score: number | null; feedback: string | null }[];
  myAvgScore: number | null;
  myRank: number | null;
  totalStudents: number;
}

export interface LeaderboardEntry {
  rank: number;
  fullName: string;
  avgScore: number;
  examsTaken: number;
}

// ─── Sales types ────────────────────────────────────────────────────────────

export interface SalesLead {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  need?: string | null;
  stage: string;
  lostReason?: string | null;
  expectedValue?: number | null;
  notes?: string | null;
  salesId?: string | null;
  sales?: { id: string; fullName: string } | null;
  callLogs?: { id: string; notes: string; outcome: string; calledAt: string; calledBy: { fullName: string } }[];
  createdAt: string;
  updatedAt: string;
}

export interface CallLog {
  id: string;
  leadId: string;
  lead?: { id: string; name: string };
  calledById: string;
  calledBy: { fullName: string };
  notes: string;
  outcome: string;
  nextFollowUp?: string | null;
  calledAt: string;
}

export interface Package {
  id: string;
  nameAr: string;
  description: string;
  price: number;
  durationMonths: number;
  features?: string[] | null;
  isActive: boolean;
}

export interface Subscription {
  id: string;
  studentId: string;
  student: { id: string; fullName: string; email: string; phone?: string | null };
  packageId: string;
  package: { id: string; nameAr: string; price: number; durationMonths: number };
  status: string;
  paidAmount?: number | null;
  paymentStatus: string;
  startDate: string;
  endDate?: string | null;
  createdById: string;
  createdBy: { fullName: string };
  notes?: string | null;
  createdAt: string;
}

export interface SalesStats {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  interestedLeads: number;
  convertedLeads: number;
  lostLeads: number;
  conversionRate: number;
  totalCalls: number;
  todayCalls: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalRevenue: number;
}

interface PlatformStoreValue {
  users: PlatformUser[];
  materials: CourseMaterial[];
  placementQuestions: PlacementQuestion[];
  exams: Exam[];
  studentLinks: StudentTeacherLink[];
  teacherStudents: TeacherStudent[];
  examResults: ExamResult[];
  allExamResults: ExamResult[];
  studentDashboard: StudentDashboard | null;
  leaderboard: LeaderboardEntry[];
  salesLeads: SalesLead[];
  callLogs: CallLog[];
  packages: Package[];
  subscriptions: Subscription[];
  salesStats: SalesStats | null;
  loadingData: boolean;
  refreshAll: () => Promise<void>;
  addStaffUser: (input: CreateStaffUserInput) => Promise<PlatformUser>;
  deleteUser: (id: string) => Promise<void>;
  addCourseMaterial: (input: CreateMaterialInput) => Promise<CourseMaterial>;
  deleteCourseMaterial: (id: string) => Promise<void>;
  setMaterialStatus: (id: string, status: PublishStatus) => Promise<void>;
  addPlacementQuestion: (input: CreatePlacementQuestionInput) => Promise<PlacementQuestion>;
  deletePlacementQuestion: (id: string) => Promise<void>;
  togglePlacementQuestion: (id: string) => Promise<void>;
  addExam: (input: CreateExamInput) => Promise<Exam>;
  setExamStatus: (id: string, status: PublishStatus) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;
  assignStudentToTeacher: (studentId: string, teacherId: string) => Promise<void>;
  unassignStudent: (linkId: string) => Promise<void>;
  submitExam: (examId: string, input: { answers?: Record<string, string>; recordingUrl?: string }) => Promise<void>;
  fetchExamResults: (examId: string) => Promise<ExamResult[]>;
  gradeExamResult: (resultId: string, input: { score?: number; feedback?: string }) => Promise<void>;
  fetchAdminExamResults: () => Promise<void>;
  adminGradeResult: (resultId: string, input: { score?: number; feedback?: string }) => Promise<void>;
  refreshStudentDashboard: () => Promise<void>;
  fetchLeaderboard: () => Promise<void>;
  fetchSalesData: () => Promise<void>;
  addLead: (input: { name: string; email?: string; phone?: string; source?: string; need?: string; notes?: string }) => Promise<void>;
  updateLead: (id: string, input: Partial<SalesLead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  addCallLog: (input: { leadId: string; notes: string; outcome: string; nextFollowUp?: string }) => Promise<void>;
  addSubscription: (input: { studentId: string; packageId: string; paidAmount?: number; paymentStatus: string; notes?: string }) => Promise<void>;
  updateSubscription: (id: string, input: { paidAmount?: number; paymentStatus?: string; status?: string }) => Promise<void>;
}

const PlatformStoreContext = createContext<PlatformStoreValue | undefined>(undefined);

export function PlatformStoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [placementQuestions, setPlacementQuestions] = useState<PlacementQuestion[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [studentLinks, setStudentLinks] = useState<StudentTeacherLink[]>([]);
  const [teacherStudents, setTeacherStudents] = useState<TeacherStudent[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [allExamResults, setAllExamResults] = useState<ExamResult[]>([]);
  const [studentDashboard, setStudentDashboard] = useState<StudentDashboard | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [salesLeads, setSalesLeads] = useState<SalesLead[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [salesStats, setSalesStats] = useState<SalesStats | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  async function refreshAll() {
    setLoadingData(true);
    try {
      apiFetch<{ questions: PlacementQuestion[] }>("/api/placement/questions", { skipAuth: true })
        .then((res) => {
          if (res?.questions) setPlacementQuestions(res.questions);
        })
        .catch(() => {});

      // Public leaderboard — always fetch
      apiFetch<{ leaderboard: LeaderboardEntry[] }>("/api/leaderboard", { skipAuth: true })
        .then((res) => {
          if (res?.leaderboard) setLeaderboard(res.leaderboard);
        })
        .catch(() => {});

      if (user?.role === "ADMIN") {
        const [usersRes, matRes, qRes, examsRes, linksRes, resultsRes] = await Promise.allSettled([
          apiFetch<{ users: PlatformUser[] }>("/api/admin/users"),
          apiFetch<{ materials: CourseMaterial[] }>("/api/admin/materials"),
          apiFetch<{ questions: PlacementQuestion[] }>("/api/admin/placement-questions"),
          apiFetch<{ exams: Exam[] }>("/api/admin/exams"),
          apiFetch<{ links: StudentTeacherLink[] }>("/api/admin/student-teachers"),
          apiFetch<{ results: ExamResult[] }>("/api/admin/exam-results"),
        ]);

        if (usersRes.status === "fulfilled" && usersRes.value?.users) {
          setUsers(usersRes.value.users);
        }
        if (matRes.status === "fulfilled" && matRes.value?.materials) {
          setMaterials(matRes.value.materials);
        }
        if (qRes.status === "fulfilled" && qRes.value?.questions) {
          setPlacementQuestions(qRes.value.questions);
        }
        if (examsRes.status === "fulfilled" && examsRes.value?.exams) {
          setExams(examsRes.value.exams);
        }
        if (linksRes.status === "fulfilled" && linksRes.value?.links) {
          setStudentLinks(linksRes.value.links);
        }
        if (resultsRes.status === "fulfilled" && resultsRes.value?.results) {
          setAllExamResults(resultsRes.value.results);
        }
      } else if (user?.role === "TEACHER") {
        const [matRes, examsRes, studentsRes] = await Promise.allSettled([
          apiFetch<{ materials: CourseMaterial[] }>("/api/teacher/materials"),
          apiFetch<{ exams: Exam[] }>("/api/teacher/exams"),
          apiFetch<{ students: TeacherStudent[] }>("/api/teacher/students"),
        ]);
        if (matRes.status === "fulfilled" && matRes.value?.materials) {
          setMaterials(matRes.value.materials);
        }
        if (examsRes.status === "fulfilled" && examsRes.value?.exams) {
          setExams(examsRes.value.exams);
        }
        if (studentsRes.status === "fulfilled" && studentsRes.value?.students) {
          setTeacherStudents(studentsRes.value.students);
        }
      } else if (user?.role === "STUDENT") {
        const [matRes, examsRes, dashRes] = await Promise.allSettled([
          apiFetch<{ materials: CourseMaterial[] }>("/api/student/courses"),
          apiFetch<{ exams: Exam[] }>("/api/student/exams"),
          apiFetch<{
            myResults: { title: string; type: ExamType; score: number | null; feedback: string | null }[];
            myAvgScore: number | null;
            myRank: number | null;
            totalStudents: number;
          }>("/api/student/dashboard"),
        ]);
        if (matRes.status === "fulfilled" && matRes.value?.materials) {
          setMaterials(matRes.value.materials);
        }
        if (examsRes.status === "fulfilled" && examsRes.value?.exams) {
          setExams(examsRes.value.exams);
        }
        if (dashRes.status === "fulfilled" && dashRes.value) {
          setStudentDashboard(dashRes.value);
        }
      } else if (user?.role === "SALES") {
        const [leadsRes, callsRes, packsRes, subsRes, statsRes] = await Promise.allSettled([
          apiFetch<{ leads: SalesLead[] }>("/api/sales/leads"),
          apiFetch<{ calls: CallLog[] }>("/api/sales/calls"),
          apiFetch<{ packages: Package[] }>("/api/sales/packages"),
          apiFetch<{ subscriptions: Subscription[] }>("/api/sales/subscriptions"),
          apiFetch<{ stats: SalesStats }>("/api/sales/stats"),
        ]);
        if (leadsRes.status === "fulfilled" && leadsRes.value?.leads) setSalesLeads(leadsRes.value.leads);
        if (callsRes.status === "fulfilled" && callsRes.value?.calls) setCallLogs(callsRes.value.calls);
        if (packsRes.status === "fulfilled" && packsRes.value?.packages) setPackages(packsRes.value.packages);
        if (subsRes.status === "fulfilled" && subsRes.value?.subscriptions) setSubscriptions(subsRes.value.subscriptions);
        if (statsRes.status === "fulfilled" && statsRes.value?.stats) setSalesStats(statsRes.value.stats);
      }
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    refreshAll();
  }, [user?.id, user?.role]);

  async function addStaffUser(input: CreateStaffUserInput): Promise<PlatformUser> {
    const res = await apiFetch<{ user: PlatformUser }>("/api/admin/users", {
      method: "POST",
      body: input,
    });
    setUsers((prev) => [res.user, ...prev]);
    return res.user;
  }

  async function deleteUser(id: string) {
    await apiFetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setStudentLinks((prev) => prev.filter((l) => l.student.id !== id && l.teacher.id !== id));
  }

  async function addCourseMaterial(input: CreateMaterialInput): Promise<CourseMaterial> {
    const res = await apiFetch<{ material: CourseMaterial }>("/api/admin/materials", {
      method: "POST",
      body: input,
    });
    setMaterials((prev) => [res.material, ...prev]);
    return res.material;
  }

  async function deleteCourseMaterial(id: string) {
    await apiFetch(`/api/admin/materials/${id}`, { method: "DELETE" });
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  }

  async function setMaterialStatus(id: string, status: PublishStatus) {
    await apiFetch(`/api/admin/materials/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
    setMaterials((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
  }

  async function addPlacementQuestion(
    input: CreatePlacementQuestionInput,
  ): Promise<PlacementQuestion> {
    const res = await apiFetch<{ question: PlacementQuestion }>("/api/admin/placement-questions", {
      method: "POST",
      body: input,
    });
    setPlacementQuestions((prev) => [...prev, res.question]);
    return res.question;
  }

  async function deletePlacementQuestion(id: string) {
    await apiFetch(`/api/admin/placement-questions/${id}`, { method: "DELETE" });
    setPlacementQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  async function togglePlacementQuestion(id: string) {
    const res = await apiFetch<{ question: PlacementQuestion }>(
      `/api/admin/placement-questions/${id}/toggle`,
      { method: "PATCH" },
    );
    setPlacementQuestions((prev) =>
      prev.map((q) => (q.id === id ? res.question : q)),
    );
  }

  async function addExam(input: CreateExamInput): Promise<Exam> {
    const res = await apiFetch<{ exam: Exam }>("/api/admin/exams", {
      method: "POST",
      body: input,
    });
    const exam: Exam = {
      ...res.exam,
      assignedTeacherId: res.exam.assignedTeacherId ?? input.assignedTeacherId,
      resultsCount: 0,
    };
    setExams((prev) => [exam, ...prev]);
    return exam;
  }

  async function setExamStatus(id: string, status: PublishStatus) {
    await apiFetch(`/api/admin/exams/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
    setExams((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
  }

  async function deleteExam(id: string) {
    await apiFetch(`/api/admin/exams/${id}`, { method: "DELETE" });
    setExams((prev) => prev.filter((e) => e.id !== id));
  }

  async function assignStudentToTeacher(studentId: string, teacherId: string) {
    const res = await apiFetch<{ link: StudentTeacherLink }>("/api/admin/student-teachers", {
      method: "POST",
      body: { studentId, teacherId },
    });
    setStudentLinks((prev) => [res.link, ...prev.filter((l) => l.id !== res.link.id)]);
  }

  async function unassignStudent(linkId: string) {
    await apiFetch(`/api/admin/student-teachers/${linkId}`, { method: "DELETE" });
    setStudentLinks((prev) => prev.filter((l) => l.id !== linkId));
  }

  async function submitExam(
    examId: string,
    input: { answers?: Record<string, string>; recordingUrl?: string },
  ) {
    await apiFetch(`/api/student/exams/${examId}/submit`, {
      method: "POST",
      body: input,
    });
    setExams((prev) =>
      prev.map((e) =>
        e.id === examId
          ? { ...e, myResult: { id: "submitted", submittedAt: new Date().toISOString() } }
          : e,
      ),
    );
  }

  async function fetchExamResults(examId: string): Promise<ExamResult[]> {
    const res = await apiFetch<{ results: ExamResult[] }>(`/api/teacher/exams/${examId}/results`);
    setExamResults(res.results);
    return res.results;
  }

  async function gradeExamResult(resultId: string, input: { score?: number; feedback?: string }) {
    await apiFetch(`/api/teacher/results/${resultId}`, {
      method: "PATCH",
      body: input,
    });
    setExamResults((prev) =>
      prev.map((r) => (r.id === resultId ? { ...r, ...input } : r)),
    );
  }

  async function fetchAdminExamResults() {
    const res = await apiFetch<{ results: ExamResult[] }>("/api/admin/exam-results");
    setAllExamResults(res.results);
  }

  async function adminGradeResult(resultId: string, input: { score?: number; feedback?: string }) {
    await apiFetch(`/api/admin/results/${resultId}`, {
      method: "PATCH",
      body: input,
    });
    setAllExamResults((prev) =>
      prev.map((r) => (r.id === resultId ? { ...r, ...input } : r)),
    );
  }

  async function refreshStudentDashboard() {
    try {
      const res = await apiFetch<{
        myResults: { title: string; type: ExamType; score: number | null; feedback: string | null }[];
        myAvgScore: number | null;
        myRank: number | null;
        totalStudents: number;
      }>("/api/student/dashboard");
      setStudentDashboard(res);
    } catch {
      // ignore
    }
  }

  async function fetchLeaderboard() {
    try {
      const res = await apiFetch<{ leaderboard: LeaderboardEntry[] }>("/api/leaderboard", {
        skipAuth: true,
      });
      if (res?.leaderboard) setLeaderboard(res.leaderboard);
    } catch {
      // ignore
    }
  }

  // ─── Sales functions ─────────────────────────────────────────────────────

  async function fetchSalesData() {
    const [leadsRes, callsRes, packsRes, subsRes, statsRes] = await Promise.allSettled([
      apiFetch<{ leads: SalesLead[] }>("/api/sales/leads"),
      apiFetch<{ calls: CallLog[] }>("/api/sales/calls"),
      apiFetch<{ packages: Package[] }>("/api/sales/packages"),
      apiFetch<{ subscriptions: Subscription[] }>("/api/sales/subscriptions"),
      apiFetch<{ stats: SalesStats }>("/api/sales/stats"),
    ]);
    if (leadsRes.status === "fulfilled" && leadsRes.value?.leads) setSalesLeads(leadsRes.value.leads);
    if (callsRes.status === "fulfilled" && callsRes.value?.calls) setCallLogs(callsRes.value.calls);
    if (packsRes.status === "fulfilled" && packsRes.value?.packages) setPackages(packsRes.value.packages);
    if (subsRes.status === "fulfilled" && subsRes.value?.subscriptions) setSubscriptions(subsRes.value.subscriptions);
    if (statsRes.status === "fulfilled" && statsRes.value?.stats) setSalesStats(statsRes.value.stats);
  }

  async function addLead(input: { name: string; email?: string; phone?: string; source?: string; need?: string; notes?: string }) {
    await apiFetch("/api/sales/leads", { method: "POST", body: input });
    await fetchSalesData();
  }

  async function updateLead(id: string, input: Partial<SalesLead>) {
    await apiFetch(`/api/sales/leads/${id}`, { method: "PATCH", body: input });
    await fetchSalesData();
  }

  async function deleteLead(id: string) {
    await apiFetch(`/api/sales/leads/${id}`, { method: "DELETE" });
    setSalesLeads((prev) => prev.filter((l) => l.id !== id));
  }

  async function addCallLog(input: { leadId: string; notes: string; outcome: string; nextFollowUp?: string }) {
    await apiFetch("/api/sales/calls", { method: "POST", body: input });
    await fetchSalesData();
  }

  async function addSubscription(input: { studentId: string; packageId: string; paidAmount?: number; paymentStatus: string; notes?: string }) {
    await apiFetch("/api/sales/subscriptions", { method: "POST", body: input });
    await fetchSalesData();
  }

  async function updateSubscription(id: string, input: { paidAmount?: number; paymentStatus?: string; status?: string }) {
    await apiFetch(`/api/sales/subscriptions/${id}`, { method: "PATCH", body: input });
    await fetchSalesData();
  }

  return (
    <PlatformStoreContext.Provider
      value={{
        users,
        materials,
        placementQuestions,
        exams,
        studentLinks,
        teacherStudents,
        examResults,
        allExamResults,
        studentDashboard,
        leaderboard,
        salesLeads,
        callLogs,
        packages,
        subscriptions,
        salesStats,
        loadingData,
        refreshAll,
        addStaffUser,
        deleteUser,
        addCourseMaterial,
        deleteCourseMaterial,
        setMaterialStatus,
        addPlacementQuestion,
        deletePlacementQuestion,
        togglePlacementQuestion,
        addExam,
        setExamStatus,
        deleteExam,
        assignStudentToTeacher,
        unassignStudent,
        submitExam,
        fetchExamResults,
        gradeExamResult,
        fetchAdminExamResults,
        adminGradeResult,
        refreshStudentDashboard,
        fetchLeaderboard,
        fetchSalesData,
        addLead,
        updateLead,
        deleteLead,
        addCallLog,
        addSubscription,
        updateSubscription,
      }}
    >
      {children}
    </PlatformStoreContext.Provider>
  );
}

export function usePlatformStore() {
  const ctx = useContext(PlatformStoreContext);
  if (!ctx) throw new Error("usePlatformStore must be used within PlatformStoreProvider");
  return ctx;
}

export { uploadFile };
