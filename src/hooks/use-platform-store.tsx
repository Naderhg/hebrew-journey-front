import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiFetch, uploadFile } from "../lib/api";
import type { UserRole } from "../lib/auth";
import { useAuth } from "./use-auth";

export interface PlatformUser {
  id: string;
  fullName: string;
  email: string | null;
  phone?: string | null;
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

export type PlacementSection = "ترجمة" | "قراءة" | "استماع" | "كتابة" | "محادثة";

export type PlacementQuestionType = "mcq" | "truefalse" | "text" | "audio";

export interface PlacementQuestion {
  id: string;
  section: PlacementSection;
  promptAr: string;
  hebrewText: string;
  questionType: PlacementQuestionType;
  options: string[];
  correctOptionIndex: number;
  expectedAnswer?: string | null;
  paragraph?: string | null;
  audioUrl?: string | null;
  levelTag: "A1" | "A2" | "B1" | "B2";
  isActive: boolean;
}

export interface PlacementAnswerEntry {
  questionId: string;
  answer?: number | string;
  audioUrl?: string;
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
  student?: { id: string; fullName: string; email: string | null; phone?: string | null };
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
  student: { id: string; fullName: string; email: string | null; phone?: string | null };
  teacher: { id: string; fullName: string; email: string | null; phone?: string | null };
}

export interface TeacherStudent {
  linkId: string;
  groupName?: string | null;
  assignedAt: string;
  examsTaken: number;
  avgScore: number | null;
  id: string;
  fullName: string;
  email: string | null;
  phone?: string;
  level?: string;
  createdAt: string;
}

interface CreateStaffUserInput {
  fullName: string;
  phone: string;
  password?: string;
  email?: string;
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
  questionType: PlacementQuestionType;
  options: string[];
  correctOptionIndex: number;
  expectedAnswer?: string;
  paragraph?: string;
  audioUrl?: string;
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
  packageType?: string;
  sessionsTotal?: number | null;
  validityDays?: number | null;
  category?: string;
  studyMode?: string;
  level?: string | null;
  durationUnit?: string;
}

export interface Subscription {
  id: string;
  studentId: string;
  student: { id: string; fullName: string; email: string | null; phone?: string | null };
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

// ─── Support types ──────────────────────────────────────────────────────────

export interface SupportStudent {
  id: string;
  fullName: string;
  email: string | null;
  phone?: string | null;
  level?: string | null;
  placementScore?: number | null;
  placementCompletedAt?: string | null;
  studentStatus: string;
  teachers: { id: string; name: string; groupName?: string | null }[];
  examsCount: number;
  createdAt: string;
}

export interface SupportTicketItem {
  id: string;
  subject: string;
  description?: string | null;
  category: string;
  priority: string;
  status: string;
  student?: { id: string; fullName: string; email: string | null; phone?: string | null } | null;
  support?: { id: string; fullName: string } | null;
  forwardedTo?: { id: string; fullName: string; role: string } | null;
  _count?: { messages: number };
  createdAt: string;
  resolvedAt?: string | null;
}

export interface ScheduleItem {
  id: string;
  teacherId: string;
  teacher: { id: string; fullName: string };
  groupId?: string | null;
  group?: { id: string; name: string } | null;
  groupName?: string | null;
  title: string;
  description?: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
  meetingUrl?: string | null;
  isActive: boolean;
  // today's generated lecture instance (set when the teacher pressed "بدء")
  todayLecture?: { id: string; status: string; meetingUrl?: string | null } | null;
  isLive?: boolean;
}

export interface AttendanceRecord {
  id: string;
  scheduleId: string;
  schedule: { id: string; title: string; dayOfWeek: number; startTime: string; teacher: { fullName: string } };
  studentId: string;
  student: { id: string; fullName: string; email: string | null; phone?: string | null };
  date: string;
  status: string;
  notes?: string | null;
}

export interface IrregularStudent {
  id: string;
  fullName: string;
  email: string | null;
  phone?: string | null;
  studentStatus: string;
  teacher: string;
  lastSubmission?: string | null;
  avgScore?: number | null;
  examsTaken: number;
  reason: string;
}

// ─── Teacher extras ─────────────────────────────────────────────────────────

export interface Homework {
  id: string;
  teacherId: string;
  studentId?: string | null;
  student?: { id: string; fullName: string; email: string | null; phone?: string | null } | null;
  groupName?: string | null;
  title: string;
  description?: string | null;
  hebrewText?: string | null;
  dueDate?: string | null;
  status: string;
  submissionText?: string | null;
  submissionAudioUrl?: string | null;
  grade?: number | null;
  feedback?: string | null;
  submittedAt?: string | null;
  createdAt: string;
  submissions?: HomeworkSub[];
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export interface PaymentRequestItem {
  id: string;
  studentId: string;
  packageId: string;
  method: string; // wallet | instapay
  screenshotUrl?: string | null;
  status: string; // pending | approved | rejected
  rejectReason?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  package?: { id: string; nameAr: string; price: number; durationMonths: number };
  student?: { id: string; fullName: string; email: string | null; phone?: string | null; level?: string | null };
  reviewedBy?: { fullName: string } | null;
}

export interface MySubscription {
  id: string;
  status: string;
  paymentStatus: string;
  startDate: string;
  endDate?: string | null;
  package?: { nameAr: string; durationMonths: number };
}

export interface PlacementResultRow {
  id: string;
  fullName: string;
  email: string | null;
  phone?: string | null;
  level?: string | null;
  placementScore?: number | null;
  placementCompletedAt?: string | null;
  studentStatus?: string | null;
  audioAnswers?: { questionId: string; audioUrl?: string }[];
}

export interface AdminLectureItem {
  id: string;
  title: string;
  description?: string | null;
  teacherId: string;
  teacher?: { id: string; fullName: string; specialty?: string | null };
  groupName?: string | null;
  groupId?: string | null;
  group?: { id: string; name: string } | null;
  level?: string | null;
  startsAt: string;
  endsAt?: string | null;
  meetingUrl?: string | null;
  status: string; // scheduled | live | completed | cancelled
  createdById: string;
  createdBy?: { id: string; fullName: string };
  createdAt: string;
}

export interface CreateLectureInput {
  title: string;
  description?: string;
  teacherId: string;
  groupName?: string;
  groupId?: string;
  level?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  startsAt: string; // ISO datetime
  endsAt?: string;
  meetingUrl?: string;
  status?: "scheduled" | "live" | "completed" | "cancelled";
}

export interface GroupItem {
  id: string;
  name: string;
  description?: string | null;
  teacherId?: string | null;
  teacher?: { id: string; fullName: string } | null;
  level?: string | null;
  maxStudents?: number | null;
  _count?: { members: number };
  createdAt: string;
}

export interface GroupMemberItem {
  id: string;
  groupId: string;
  studentId: string;
  student: { id: string; fullName: string; phone?: string | null; email?: string | null };
  addedAt: string;
}

export interface FreeLectureStudent {
  id: string;
  name: string;
  phone: string;
  level?: string | null;
  groupId?: string | null;
  group?: { id: string; name: string } | null;
  notes?: string | null;
  createdAt: string;
}

export interface FreeLecture {
  id: string;
  title: string;
  description?: string | null;
  teacherId?: string | null;
  teacher?: { id: string; fullName: string } | null;
  groupId?: string | null;
  group?: { id: string; name: string } | null;
  level?: string | null;
  startsAt: string;
  endsAt?: string | null;
  meetingUrl?: string | null;
  files?: { name: string; url: string }[] | null;
  status: string;
  createdBy?: { id: string; fullName: string };
  createdAt: string;
}

export interface CallsStudentItem {
  id: string; // subscription id
  studentId: string;
  studentName: string;
  studentPhone?: string | null;
  packageName: string;
  sessionsTotal?: number | null;
  sessionsUsed?: number | null;
  sessionsRemaining?: number | null;
  expiresAt?: string | null;
}

export interface OpsTeacherItem {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  specialty?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface OpsPackageItem {
  id: string;
  nameAr: string;
  price: number;
  category: string; // basic | calls
  packageType: string; // subscription | sessions
  sessionsTotal?: number | null;
  durationMonths: number;
  durationUnit: string; // month | week
  validityDays?: number | null;
  level?: string | null;
  studyMode?: string;
}

export interface OpsStudentSubscription {
  id: string;
  status: string;
  paymentStatus: string;
  paidAmount?: number | null;
  sessionsTotal?: number | null;
  sessionsRemaining?: number | null;
  expiresAt?: string | null;
  endDate?: string | null;
  createdAt: string;
  package: { id: string; nameAr: string; category: string; price: number };
}

export interface OpsStudentItem {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  level?: string | null;
  studentStatus: string;
  placementScore?: number | null;
  placementCompletedAt?: string | null;
  createdAt: string;
  teachers: { id: string; name: string; groupName?: string | null }[];
  groups: { id: string; name: string }[];
  subscriptions: OpsStudentSubscription[];
  examsCount: number;
}

export interface TeacherAnalytics {
  totals: {
    sessionsCompleted: number;
    sessionsDeducted: number;
    studentsAttended: number;
    lectureEarnings: number;
    sessionEarnings: number;
    earnings: number;
    lecturesCompleted: number;
    lectureRate: number;
    sessionRate: number;
  };
  lectures: { id: string; title: string; startsAt: string; status?: string; groupName: string | null; groupSize: number | null; attended: number; absent?: number; earned: number }[];
  bookings: { id: string; studentId: string; studentName: string; packageName: string | null; startsAt: string; status: string; attended: boolean; deducted: boolean; earned: number; sessionPrice: number }[];
  students: { studentId: string; studentName: string; attended: number; noShow: number; lateCancel: number; remaining: number | null; earned: number; upcoming: number }[];
}

export interface LectureStudent {
  id: string;
  fullName: string;
  status: "present" | "absent" | null;
}

export interface AdminAnalytics {
  teacherName?: string | null;
  totals?: TeacherAnalytics["totals"];
  lectures?: TeacherAnalytics["lectures"];
  bookings?: TeacherAnalytics["bookings"];
  students?: TeacherAnalytics["students"];
  teachers?: {
    teacherId: string;
    teacherName: string;
    lecturesCompleted: number;
    sessionsDeducted: number;
    studentsAttended: number;
    lectureEarnings: number;
    sessionEarnings: number;
    earnings: number;
  }[];
}

export interface WalletItem {
  id: string;
  packageName: string;
  price: number;
  status: string;
  sessionsTotal: number;
  sessionsUsed: number;
  sessionsRemaining?: number | null;
  expiresAt?: string | null;
  startDate: string;
  attended: number;
  noShow: number;
  lateCancel: number;
  deductedNotAttended: number;
  sessionPrice: number;
  spent: number;
}

export interface WalletBooking {
  id: string;
  subscriptionId?: string | null;
  teacherName: string;
  startsAt: string;
  status: string;
  cancelledBy?: string | null;
  cancelReason?: string | null;
}

export interface WeeklyScheduleItem {
  id: string;
  teacherId: string;
  teacher?: { id: string; fullName: string; specialty?: string | null };
  groupId?: string | null;
  group?: { id: string; name: string } | null;
  groupName?: string | null;
  title: string;
  description?: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
  meetingUrl?: string | null;
  isActive: boolean;
  _count?: { attendances: number };
}

export interface CreateScheduleInput {
  teacherId: string;
  title: string;
  description?: string;
  groupName?: string;
  groupId?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: "online" | "offline";
  meetingUrl?: string;
  isActive?: boolean;
}

export interface StudentSkillItem {
  id: string;
  studentId: string;
  skill: string;
  score: number;
  notes?: string | null;
  updatedBy?: { fullName: string } | null;
}

export interface TeacherSchedule {
  id: string;
  teacherId: string;
  groupId?: string | null;
  group?: { id: string; name: string } | null;
  groupName?: string | null;
  title: string;
  description?: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
  meetingUrl?: string | null;
  isActive: boolean;
  todayLecture?: { id: string; status: string; meetingUrl?: string | null } | null;
}

export interface LectureItem {
  id: string;
  title: string;
  description?: string | null;
  teacherId: string;
  teacher?: { id: string; fullName: string; specialty?: string | null };
  groupName?: string | null;
  level?: string | null;
  startsAt: string;
  endsAt?: string | null;
  meetingUrl?: string | null;
  status: string;
  createdBy?: { id: string; fullName: string };
  createdAt: string;
}

export interface TeacherAttendance {
  id: string;
  scheduleId: string;
  schedule: { title: string; dayOfWeek: number; startTime: string };
  studentId: string;
  student: { id: string; fullName: string; email: string | null; phone?: string | null };
  date: string;
  status: string;
  notes?: string | null;
}

export interface StudentReport {
  student: { id: string; fullName: string; email: string | null; phone?: string | null; level?: string | null; studentStatus: string };
  avgScore: number | null;
  examsTaken: number;
  skills: Record<string, { score: number; notes: string | null }>;
  attendanceRate: number | null;
  totalSessions: number;
  presentCount: number;
  recentResults: { score: number | null; submittedAt: string; exam: { title: string; type: string } }[];
  homework: { title: string; status: string; grade: number | null; feedback: string | null }[];
  weakAreas: { skill: string; score: number }[];
}

// ─── Student extras ─────────────────────────────────────────────────────────

export interface HomeworkSub {
  id: string;
  homeworkId: string;
  studentId: string;
  student?: { id: string; fullName: string };
  submissionText?: string | null;
  audioUrl?: string | null;
  status: string; // submitted | late | graded
  grade?: number | null;
  feedback?: string | null;
  submittedAt?: string | null;
  gradedAt?: string | null;
}

export interface StudentHomework {
  id: string;
  teacherId: string;
  teacher: { fullName: string };
  studentId?: string | null;
  groupName?: string | null;
  title: string;
  description?: string | null;
  hebrewText?: string | null;
  dueDate?: string | null;
  status: string;
  submissionText?: string | null;
  submissionAudioUrl?: string | null;
  grade?: number | null;
  feedback?: string | null;
  submittedAt?: string | null;
  createdAt: string;
  mySubmission?: HomeworkSub | null;
}

export interface StudentAttendanceItem {
  id: string;
  scheduleId: string;
  schedule: { title: string; dayOfWeek: number; startTime: string; teacher: { fullName: string } };
  date: string;
  status: string;
  notes?: string | null;
}

export interface StudentCertificate {
  id: string;
  title: string;
  level?: string | null;
  description?: string | null;
  issuedAt: string;
  issuedBy?: { fullName: string } | null;
}

export interface StudentTicket {
  id: string;
  subject: string;
  description?: string | null;
  category: string;
  status: string;
  createdAt: string;
  resolvedAt?: string | null;
  support?: { fullName: string } | null;
}

// ─── Admin extras ───────────────────────────────────────────────────────────

export interface AdminPackage extends Package {
  _count?: { subscriptions: number };
  teacher?: { id: string; fullName: string; specialty?: string | null } | null;
}

export interface AdminLead extends SalesLead {
  _count?: { callLogs: number };
}

export interface SalesReportRow {
  salesId: string;
  name: string;
  email: string | null;
  leads: number;
  newLeads: number;
  converted: number;
  lost: number;
  calls: number;
  subscriptions: number;
  paidSubscriptions: number;
  revenue: number;
  conversionRate: number;
}

export interface AdminSalesReport {
  perSales: SalesReportRow[];
  totals: {
    leads: number;
    unassigned: number;
    calls: number;
    subscriptions: number;
    paidSubscriptions: number;
    revenue: number;
  };
}

export interface AdminCertificate {
  id: string;
  studentId: string;
  student: { id: string; fullName: string; email: string | null; phone?: string | null; level?: string | null };
  title: string;
  level?: string | null;
  description?: string | null;
  issuedAt: string;
  issuedBy?: { fullName: string } | null;
}

// ─── Chat & public ──────────────────────────────────────────────────────────

export interface ChatMsg {
  id: string;
  studentId: string;
  staffId?: string | null;
  channel: string;
  fromRole: string;
  content: string;
  createdAt: string;
}

export interface MyTeacher {
  id: string;
  fullName: string;
  specialty?: string | null;
  groupName?: string | null;
}

export interface TeacherChatThread {
  student: { id: string; fullName: string; email: string | null; phone?: string | null };
  groupName?: string | null;
  lastMessage: { content: string; createdAt: string; fromRole: string } | null;
}

export interface SupportChatThread {
  student: { id: string; fullName: string; email: string | null; phone?: string | null };
  lastMessage: { content: string; createdAt: string; fromRole: string };
}

export interface PublicPackage {
  id: string;
  nameAr: string;
  description: string;
  price: number;
  durationMonths: number;
  features?: string[] | null;
  teacher?: { fullName: string; specialty?: string | null } | null;
  category?: string;
  studyMode?: string;
  level?: string | null;
  durationUnit?: string;
  packageType?: string;
  sessionsTotal?: number | null;
  validityDays?: number | null;
}

// ─── Session-package booking types ───
export interface SessionSubscription {
  id: string;
  packageName: string;
  sessionsTotal: number;
  sessionsUsed: number;
  sessionsRemaining: number | null;
  expiresAt: string | null;
}

export interface LessonBookingItem {
  id: string;
  teacher?: { id: string; fullName: string };
  student?: { id: string; fullName: string; phone?: string | null };
  subscription?: { id: string; package: { nameAr: string } } | null;
  startsAt: string;
  endsAt: string;
  status: "booked" | "completed" | "cancelled" | "no_show";
  meetingUrl?: string | null;
  cancelledBy?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  notes?: string | null;
  createdAt?: string;
}

export interface AvailableSlot {
  availabilityId: string;
  teacherId: string;
  teacherName: string;
  startsAt: string;
  endsAt: string;
}

export interface TeacherAvailabilitySlot {
  id: string;
  dayOfWeek: number | null;
  specificDate: string | null;
  startTime: string;
  endTime: string;
  isActive: boolean;
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
  supportStudents: SupportStudent[];
  tickets: SupportTicketItem[];
  schedules: ScheduleItem[];
  attendance: AttendanceRecord[];
  irregularStudents: IrregularStudent[];
  teacherSchedules: TeacherSchedule[];
  teacherLectures: LectureItem[];
  teacherHomework: Homework[];
  teacherAttendance: TeacherAttendance[];
  studentSchedules: ScheduleItem[];
  studentLectures: LectureItem[];
  studentHomework: StudentHomework[];
  studentAttendance: StudentAttendanceItem[];
  studentAttendanceRate: number | null;
  studentSkills: StudentSkillItem[];
  studentCertificates: StudentCertificate[];
  studentTickets: StudentTicket[];
  adminPackages: AdminPackage[];
  adminLeads: AdminLead[];
  salesReport: AdminSalesReport | null;
  adminSubscriptions: Subscription[];
  adminCertificates: AdminCertificate[];
  publicPackages: PublicPackage[];
  myChatTeachers: MyTeacher[];
  teacherChatMsgs: ChatMsg[];
  supportChatMsgs: ChatMsg[];
  teacherChatThreads: TeacherChatThread[];
  supportChatThreads: SupportChatThread[];
  notifications: AppNotification[];
  unreadCount: number;
  myPaymentRequests: PaymentRequestItem[];
  mySubscription: MySubscription | null;
  adminPaymentRequests: PaymentRequestItem[];
  placementResults: PlacementResultRow[];
  adminLectures: AdminLectureItem[];
  adminSchedules: WeeklyScheduleItem[];
  publicSchedules: WeeklyScheduleItem[];
  supportLectures: AdminLectureItem[];
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
  // Support
  fetchSupportData: () => Promise<void>;
  updateStudentStatus: (studentId: string, status: string) => Promise<void>;
  createTicket: (input: { subject: string; description?: string; studentId?: string; category: string; priority: string }) => Promise<void>;
  updateTicket: (id: string, input: { status?: string; priority?: string; forwardedToId?: string }) => Promise<void>;
  createSchedule: (input: { teacherId: string; groupName?: string; title: string; description?: string; dayOfWeek: number; startTime: string; endTime: string; location: string }) => Promise<void>;
  recordAttendance: (input: { scheduleId: string; studentId: string; status: string; notes?: string; date?: string }) => Promise<void>;
  // Teacher extras
  fetchTeacherSchedules: () => Promise<void>;
  fetchTeacherLectures: (all?: boolean) => Promise<void>;
  fetchTeacherAttendance: () => Promise<void>;
  recordTeacherAttendance: (input: { scheduleId: string; studentId: string; status: string; notes?: string; date?: string }) => Promise<void>;
  createHomework: (input: { title: string; description?: string; hebrewText?: string; studentId?: string; groupName?: string; dueDate?: string }) => Promise<void>;
  gradeHomework: (id: string, input: { status?: string; grade?: number; feedback?: string }) => Promise<void>;
  updateStudentSkill: (studentId: string, input: { skill: string; score: number; notes?: string }) => Promise<void>;
  fetchStudentReport: (studentId: string) => Promise<StudentReport | null>;
  // Student extras
  submitHomework: (id: string, input: { submissionText?: string; submissionAudioUrl?: string }) => Promise<void>;
  createStudentTicket: (input: { subject: string; description?: string; category: string }) => Promise<void>;
  // Admin extras
  fetchAdminOps: () => Promise<void>;
  createPackage: (input: { nameAr: string; description?: string; price: number; durationMonths: number; features?: string[]; teacherId?: string; packageType?: "subscription" | "sessions"; sessionsTotal?: number | null; validityDays?: number | null; category?: "basic" | "calls"; studyMode?: "online" | "offline" | "both"; level?: string | null; durationUnit?: "month" | "week" }) => Promise<void>;
  updatePackage: (id: string, input: { nameAr?: string; description?: string; price?: number; durationMonths?: number; teacherId?: string; isActive?: boolean; packageType?: "subscription" | "sessions"; sessionsTotal?: number | null; validityDays?: number | null; category?: "basic" | "calls"; studyMode?: "online" | "offline" | "both"; level?: string | null; durationUnit?: "month" | "week" }) => Promise<void>;
  deletePackage: (id: string) => Promise<void>;
  assignLead: (leadId: string, salesId: string | null) => Promise<void>;
  issueCertificate: (input: { studentId: string; title: string; level?: string; description?: string }) => Promise<void>;
  deleteCertificate: (id: string) => Promise<void>;
  // Teacher schedule CRUD
  createTeacherSchedule: (input: { title: string; groupName?: string; description?: string; dayOfWeek: number; startTime: string; endTime: string; location: string; meetingUrl?: string }) => Promise<void>;
  deleteTeacherSchedule: (id: string) => Promise<void>;
  // Chat
  fetchPublicPackages: (category?: string) => Promise<void>;
  submitPublicLead: (input: { name: string; phone: string; email?: string; packageName?: string }) => Promise<void>;
  fetchMyChatTeachers: () => Promise<void>;
  fetchTeacherChat: (teacherId?: string) => Promise<void>;
  sendTeacherChatMsg: (content: string, teacherId?: string) => Promise<void>;
  fetchSupportChat: () => Promise<void>;
  sendSupportChatMsg: (content: string) => Promise<void>;
  sendAiMessage: (message: string, history: { role: "user" | "assistant"; content: string }[]) => Promise<string>;
  fetchTeacherChatThreads: () => Promise<void>;
  fetchTeacherChatThread: (studentId: string) => Promise<ChatMsg[]>;
  sendTeacherChatReply: (studentId: string, content: string) => Promise<void>;
  fetchSupportChatThreads: () => Promise<void>;
  fetchSupportChatThread: (studentId: string) => Promise<ChatMsg[]>;
  sendSupportChatReply: (studentId: string, content: string) => Promise<void>;
  // Notifications & misc
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  gradeHomeworkSubmission: (submissionId: string, input: { grade?: number; feedback?: string }) => Promise<void>;
  submitPlacementResult: (scorePercent: number, level: string, answers?: PlacementAnswerEntry[]) => Promise<void>;
  // Billing / bookings
  fetchMyBilling: () => Promise<void>;
  createPaymentRequest: (input: { packageId: string; method: "wallet" | "instapay"; studyMode?: "online" | "offline"; screenshotUrl: string }) => Promise<void>;
  fetchAdminPaymentRequests: (status?: string) => Promise<void>;
  reviewPaymentRequest: (id: string, input: { action: "approve" | "reject"; rejectReason?: string }) => Promise<void>;
  fetchPlacementResults: () => Promise<void>;
  fetchAdminLectures: (filter?: { status?: string }) => Promise<void>;
  createAdminLecture: (input: CreateLectureInput) => Promise<void>;
  updateAdminLecture: (id: string, input: Partial<CreateLectureInput>) => Promise<void>;
  deleteAdminLecture: (id: string) => Promise<void>;
  fetchAdminSchedules: () => Promise<void>;
  createAdminSchedule: (input: CreateScheduleInput) => Promise<void>;
  updateAdminSchedule: (id: string, input: Partial<CreateScheduleInput>) => Promise<void>;
  deleteAdminSchedule: (id: string) => Promise<void>;
  fetchPublicSchedules: () => Promise<void>;
  fetchSupportLectures: () => Promise<void>;
  // ─── Session-package bookings ───
  mySessions: SessionSubscription[];
  myBookings: LessonBookingItem[];
  availableSlots: AvailableSlot[];
  teacherAvailability: TeacherAvailabilitySlot[];
  teacherBookings: LessonBookingItem[];
  adminBookings: LessonBookingItem[];
  adminBookingsReport: { students: any[]; totals: any } | null;
  fetchMySessions: () => Promise<void>;
  fetchHasCallsPackage: () => Promise<void>;
  hasCallsPackage: boolean;
  hasBasicPackage: boolean;
  fetchAvailableSlots: () => Promise<void>;
  bookSession: (input: { availabilityId: string; startsAt: string }) => Promise<void>;
  rescheduleBooking: (id: string, input: { newAvailabilityId: string; newStartsAt: string }) => Promise<void>;
  cancelBooking: (id: string, reason?: string) => Promise<{ refunded: boolean }>;
  fetchTeacherAvailability: () => Promise<void>;
  addTeacherAvailability: (input: { dayOfWeek: number | null; specificDate?: string | null; startTime: string; endTime: string }) => Promise<void>;
  toggleTeacherAvailability: (id: string) => Promise<void>;
  deleteTeacherAvailability: (id: string) => Promise<void>;
  fetchTeacherBookings: () => Promise<void>;
  setBookingStatus: (id: string, status: "completed" | "no_show" | "booked") => Promise<void>;
  teacherCancelBooking: (id: string, reason?: string) => Promise<void>;
  fetchAdminBookings: (filter?: { status?: string; teacherId?: string; studentId?: string }) => Promise<void>;
  fetchAdminBookingsReport: () => Promise<void>;
  adminUpdateBooking: (id: string, input: { status?: string; notes?: string; meetingUrl?: string; reason?: string }) => Promise<void>;
  // groups
  adminGroups: GroupItem[];
  groupMembers: GroupMemberItem[];
  fetchAdminGroups: () => Promise<void>;
  createAdminGroup: (input: { name: string; description?: string; teacherId?: string; level?: string | null; maxStudents?: number | null }) => Promise<void>;
  updateAdminGroup: (id: string, input: Partial<{ name: string; description: string; teacherId: string; level: string | null; maxStudents: number | null }>) => Promise<void>;
  deleteAdminGroup: (id: string) => Promise<void>;
  fetchGroupMembers: (groupId: string) => Promise<void>;
  addGroupMembers: (groupId: string, studentIds: string[]) => Promise<void>;
  removeGroupMember: (groupId: string, studentId: string) => Promise<void>;
  // admin teacher availability
  adminTeacherAvailability: any[];
  fetchAdminTeacherAvailability: (teacherId?: string) => Promise<void>;
  // ops: individual-session booking + calls students
  callsStudents: CallsStudentItem[];
  fetchCallsStudents: () => Promise<void>;
  opsCreateBooking: (input: { studentId: string; teacherId: string; startsAt: string; endsAt?: string; meetingUrl?: string; notes?: string }) => Promise<void>;
  opsBookings: LessonBookingItem[];
  fetchOpsBookings: () => Promise<void>;
  // ops directories + manual subscription activation
  opsTeachers: OpsTeacherItem[];
  fetchOpsTeachers: () => Promise<void>;
  opsStudents: OpsStudentItem[];
  fetchOpsStudents: () => Promise<void>;
  opsPackages: OpsPackageItem[];
  fetchOpsPackages: () => Promise<void>;
  activateOpsSubscription: (input: { studentId: string; packageId: string; paidAmount?: number; notes?: string }) => Promise<void>;
  // free lectures
  freeStudents: FreeLectureStudent[];
  freeLectures: FreeLecture[];
  fetchFreeStudents: () => Promise<void>;
  createFreeStudent: (input: { name: string; phone: string; level?: string | null; groupId?: string | null; notes?: string }) => Promise<void>;
  deleteFreeStudent: (id: string) => Promise<void>;
  fetchFreeLectures: () => Promise<void>;
  createFreeLecture: (input: { title: string; description?: string; teacherId?: string; groupId?: string; level?: string | null; startsAt: string; endsAt?: string; meetingUrl?: string }) => Promise<void>;
  updateFreeLecture: (id: string, input: Record<string, unknown>) => Promise<void>;
  deleteFreeLecture: (id: string) => Promise<void>;
  addFreeLectureFile: (id: string, file: { name: string; url: string }) => Promise<void>;
  removeFreeLectureFile: (id: string, index: number) => Promise<void>;
  // student view of free lectures
  studentFreeLectures: FreeLecture[];
  fetchStudentFreeLectures: () => Promise<void>;
  // teacher lectures lifecycle + per-lecture attendance
  updateTeacherLectureStatus: (id: string, status: "live" | "completed") => Promise<void>;
  startScheduleLecture: (scheduleId: string) => Promise<LectureItem>;
  lectureStudents: LectureStudent[];
  fetchLectureStudents: (lectureId: string) => Promise<void>;
  saveLectureAttendance: (lectureId: string, records: { studentId: string; status: "present" | "absent" }[]) => Promise<void>;
  // admin analytics
  adminAnalytics: AdminAnalytics | null;
  fetchAdminAnalytics: (filters?: { teacherId?: string | undefined; from?: string | undefined; to?: string | undefined; studentId?: string | undefined }) => Promise<void>;
  // teacher analytics + student wallet
  teacherAnalytics: TeacherAnalytics | null;
  fetchTeacherAnalytics: (filters?: { from?: string | undefined; to?: string | undefined; studentId?: string | undefined }) => Promise<void>;
  studentWallet: WalletItem[];
  studentWalletBookings: WalletBooking[];
  fetchStudentWallet: () => Promise<void>;
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
  const [supportStudents, setSupportStudents] = useState<SupportStudent[]>([]);
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [irregularStudents, setIrregularStudents] = useState<IrregularStudent[]>([]);
  const [teacherSchedules, setTeacherSchedules] = useState<TeacherSchedule[]>([]);
  const [teacherLectures, setTeacherLectures] = useState<LectureItem[]>([]);
  const [teacherHomework, setTeacherHomework] = useState<Homework[]>([]);
  const [teacherAttendance, setTeacherAttendance] = useState<TeacherAttendance[]>([]);
  const [studentSchedules, setStudentSchedules] = useState<ScheduleItem[]>([]);
  const [studentLectures, setStudentLectures] = useState<LectureItem[]>([]);
  const [studentHomework, setStudentHomework] = useState<StudentHomework[]>([]);
  const [studentAttendance, setStudentAttendance] = useState<StudentAttendanceItem[]>([]);
  const [studentAttendanceRate, setStudentAttendanceRate] = useState<number | null>(null);
  const [studentSkills, setStudentSkills] = useState<StudentSkillItem[]>([]);
  const [studentCertificates, setStudentCertificates] = useState<StudentCertificate[]>([]);
  const [studentTickets, setStudentTickets] = useState<StudentTicket[]>([]);
  const [adminPackages, setAdminPackages] = useState<AdminPackage[]>([]);
  const [adminLeads, setAdminLeads] = useState<AdminLead[]>([]);
  const [salesReport, setSalesReport] = useState<AdminSalesReport | null>(null);
  const [adminSubscriptions, setAdminSubscriptions] = useState<Subscription[]>([]);
  const [adminCertificates, setAdminCertificates] = useState<AdminCertificate[]>([]);
  const [publicPackages, setPublicPackages] = useState<PublicPackage[]>([]);
  const [myChatTeachers, setMyChatTeachers] = useState<MyTeacher[]>([]);
  const [teacherChatMsgs, setTeacherChatMsgs] = useState<ChatMsg[]>([]);
  const [supportChatMsgs, setSupportChatMsgs] = useState<ChatMsg[]>([]);
  const [teacherChatThreads, setTeacherChatThreads] = useState<TeacherChatThread[]>([]);
  const [supportChatThreads, setSupportChatThreads] = useState<SupportChatThread[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [myPaymentRequests, setMyPaymentRequests] = useState<PaymentRequestItem[]>([]);
  const [mySubscription, setMySubscription] = useState<MySubscription | null>(null);
  const [adminPaymentRequests, setAdminPaymentRequests] = useState<PaymentRequestItem[]>([]);
  const [placementResults, setPlacementResults] = useState<PlacementResultRow[]>([]);
  const [adminLectures, setAdminLectures] = useState<AdminLectureItem[]>([]);
  const [adminSchedules, setAdminSchedules] = useState<WeeklyScheduleItem[]>([]);
  const [publicSchedules, setPublicSchedules] = useState<WeeklyScheduleItem[]>([]);
  const [supportLectures, setSupportLectures] = useState<AdminLectureItem[]>([]);
  // booking state
  const [mySessions, setMySessions] = useState<SessionSubscription[]>([]);
  const [myBookings, setMyBookings] = useState<LessonBookingItem[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [teacherAvailability, setTeacherAvailability] = useState<TeacherAvailabilitySlot[]>([]);
  const [teacherBookings, setTeacherBookings] = useState<LessonBookingItem[]>([]);
  const [adminBookings, setAdminBookings] = useState<LessonBookingItem[]>([]);
  const [adminBookingsReport, setAdminBookingsReport] = useState<{ students: any[]; totals: any } | null>(null);
  const [hasCallsPackage, setHasCallsPackage] = useState(false);
  const [hasBasicPackage, setHasBasicPackage] = useState(false);
  const [adminGroups, setAdminGroups] = useState<GroupItem[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMemberItem[]>([]);
  const [adminTeacherAvailability, setAdminTeacherAvailability] = useState<any[]>([]);
  const [callsStudents, setCallsStudents] = useState<CallsStudentItem[]>([]);
  const [opsBookings, setOpsBookings] = useState<LessonBookingItem[]>([]);
  const [opsTeachers, setOpsTeachers] = useState<OpsTeacherItem[]>([]);
  const [opsStudents, setOpsStudents] = useState<OpsStudentItem[]>([]);
  const [opsPackages, setOpsPackages] = useState<OpsPackageItem[]>([]);
  const [freeStudents, setFreeStudents] = useState<FreeLectureStudent[]>([]);
  const [freeLectures, setFreeLectures] = useState<FreeLecture[]>([]);
  const [studentFreeLectures, setStudentFreeLectures] = useState<FreeLecture[]>([]);
  const [teacherAnalytics, setTeacherAnalytics] = useState<TeacherAnalytics | null>(null);
  const [lectureStudents, setLectureStudents] = useState<LectureStudent[]>([]);
  const [adminAnalytics, setAdminAnalytics] = useState<AdminAnalytics | null>(null);
  const [studentWallet, setStudentWallet] = useState<WalletItem[]>([]);
  const [studentWalletBookings, setStudentWalletBookings] = useState<WalletBooking[]>([]);
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

      // Notifications — any authenticated user
      if (user) {
        apiFetch<{ notifications: AppNotification[]; unreadCount: number }>("/api/notifications")
          .then((res) => {
            if (res?.notifications) setNotifications(res.notifications);
            if (res?.unreadCount !== undefined) setUnreadCount(res.unreadCount);
          })
          .catch(() => {});
      }

      if (user?.role === "ADMIN") {
        const [usersRes, matRes, qRes, examsRes, linksRes, resultsRes, packsRes, leadsRes, repRes, subsRes, certRes] = await Promise.allSettled([
          apiFetch<{ users: PlatformUser[] }>("/api/admin/users"),
          apiFetch<{ materials: CourseMaterial[] }>("/api/admin/materials"),
          apiFetch<{ questions: PlacementQuestion[] }>("/api/admin/placement-questions"),
          apiFetch<{ exams: Exam[] }>("/api/admin/exams"),
          apiFetch<{ links: StudentTeacherLink[] }>("/api/admin/student-teachers"),
          apiFetch<{ results: ExamResult[] }>("/api/admin/exam-results"),
          apiFetch<{ packages: AdminPackage[] }>("/api/admin/packages"),
          apiFetch<{ leads: AdminLead[] }>("/api/admin/leads"),
          apiFetch<AdminSalesReport>("/api/admin/sales-report"),
          apiFetch<{ subscriptions: Subscription[] }>("/api/admin/subscriptions"),
          apiFetch<{ certificates: AdminCertificate[] }>("/api/admin/certificates"),
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
        if (packsRes.status === "fulfilled" && packsRes.value?.packages) setAdminPackages(packsRes.value.packages);
        if (leadsRes.status === "fulfilled" && leadsRes.value?.leads) setAdminLeads(leadsRes.value.leads);
        if (repRes.status === "fulfilled" && repRes.value) setSalesReport(repRes.value);
        if (subsRes.status === "fulfilled" && subsRes.value?.subscriptions) setAdminSubscriptions(subsRes.value.subscriptions);
        if (certRes.status === "fulfilled" && certRes.value?.certificates) setAdminCertificates(certRes.value.certificates);
      } else if (user?.role === "TEACHER") {
        const [matRes, examsRes, studentsRes, schedRes, hwRes, lecRes] = await Promise.allSettled([
          apiFetch<{ materials: CourseMaterial[] }>("/api/teacher/materials"),
          apiFetch<{ exams: Exam[] }>("/api/teacher/exams"),
          apiFetch<{ students: TeacherStudent[] }>("/api/teacher/students"),
          apiFetch<{ schedules: TeacherSchedule[] }>("/api/teacher/schedules"),
          apiFetch<{ homework: Homework[] }>("/api/teacher/homework"),
          apiFetch<{ lectures: LectureItem[] }>("/api/teacher/lectures"),
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
        if (schedRes.status === "fulfilled" && schedRes.value?.schedules) {
          setTeacherSchedules(schedRes.value.schedules);
        }
        if (hwRes.status === "fulfilled" && hwRes.value?.homework) {
          setTeacherHomework(hwRes.value.homework);
        }
        if (lecRes.status === "fulfilled" && lecRes.value?.lectures) {
          setTeacherLectures(lecRes.value.lectures);
        }
      } else if (user?.role === "STUDENT") {
        // Locked students can only reach billing endpoints — skip the rest
        // until placement is done and a subscription is confirmed.
        if (!user.placementCompletedAt) return;
        if (!user.hasActiveSubscription) {
          await fetchMyBilling().catch(() => {});
          return;
        }
        const [matRes, examsRes, dashRes, schedRes, hwRes, attRes, skillsRes, certRes, tkRes, lecRes] = await Promise.allSettled([
          apiFetch<{ materials: CourseMaterial[] }>("/api/student/courses"),
          apiFetch<{ exams: Exam[] }>("/api/student/exams"),
          apiFetch<{
            myResults: { title: string; type: ExamType; score: number | null; feedback: string | null }[];
            myAvgScore: number | null;
            myRank: number | null;
            totalStudents: number;
          }>("/api/student/dashboard"),
          apiFetch<{ schedules: ScheduleItem[] }>("/api/student/schedule"),
          apiFetch<{ homework: StudentHomework[] }>("/api/student/homework"),
          apiFetch<{ attendance: StudentAttendanceItem[]; attendanceRate: number | null }>("/api/student/attendance"),
          apiFetch<{ skills: StudentSkillItem[] }>("/api/student/skills"),
          apiFetch<{ certificates: StudentCertificate[] }>("/api/student/certificates"),
          apiFetch<{ tickets: StudentTicket[] }>("/api/student/tickets"),
          apiFetch<{ lectures: LectureItem[] }>("/api/student/lectures"),
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
        if (schedRes.status === "fulfilled" && schedRes.value?.schedules) setStudentSchedules(schedRes.value.schedules);
        if (hwRes.status === "fulfilled" && hwRes.value?.homework) setStudentHomework(hwRes.value.homework);
        if (attRes.status === "fulfilled" && attRes.value) {
          setStudentAttendance(attRes.value.attendance);
          setStudentAttendanceRate(attRes.value.attendanceRate);
        }
        if (skillsRes.status === "fulfilled" && skillsRes.value?.skills) setStudentSkills(skillsRes.value.skills);
        if (certRes.status === "fulfilled" && certRes.value?.certificates) setStudentCertificates(certRes.value.certificates);
        if (tkRes.status === "fulfilled" && tkRes.value?.tickets) setStudentTickets(tkRes.value.tickets);
        if (lecRes.status === "fulfilled" && lecRes.value?.lectures) setStudentLectures(lecRes.value.lectures);
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
      } else if (user?.role === "SUPPORT") {
        const [stRes, tkRes, scRes, atRes, irRes] = await Promise.allSettled([
          apiFetch<{ students: SupportStudent[] }>("/api/support/students"),
          apiFetch<{ tickets: SupportTicketItem[] }>("/api/support/tickets"),
          apiFetch<{ schedules: ScheduleItem[] }>("/api/support/schedules"),
          apiFetch<{ attendance: AttendanceRecord[] }>("/api/support/attendance"),
          apiFetch<{ irregular: IrregularStudent[] }>("/api/support/irregular"),
        ]);
        if (stRes.status === "fulfilled" && stRes.value?.students) setSupportStudents(stRes.value.students);
        if (tkRes.status === "fulfilled" && tkRes.value?.tickets) setTickets(tkRes.value.tickets);
        if (scRes.status === "fulfilled" && scRes.value?.schedules) setSchedules(scRes.value.schedules);
        if (atRes.status === "fulfilled" && atRes.value?.attendance) setAttendance(atRes.value.attendance);
        if (irRes.status === "fulfilled" && irRes.value?.irregular) setIrregularStudents(irRes.value.irregular);
      }
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role, user?.hasActiveSubscription, user?.placementCompletedAt]);

  // Poll notifications every 60s while logged in
  useEffect(() => {
    if (!user) return;
    const t = setInterval(() => {
      fetchNotifications().catch(() => {});
    }, 60_000);
    return () => clearInterval(t);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Near-real-time dashboard data — poll every 45s while the tab is visible
  useEffect(() => {
    if (!user) return;
    const t = setInterval(() => {
      if (document.visibilityState === "visible") {
        refreshAll().catch(() => {});
      }
    }, 45_000);
    return () => clearInterval(t);
  }, [user?.id, user?.role]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ─── Support functions ────────────────────────────────────────────────────

  async function fetchSupportData() {
    const [stRes, tkRes, scRes, atRes, irRes] = await Promise.allSettled([
      apiFetch<{ students: SupportStudent[] }>("/api/support/students"),
      apiFetch<{ tickets: SupportTicketItem[] }>("/api/support/tickets"),
      apiFetch<{ schedules: ScheduleItem[] }>("/api/support/schedules"),
      apiFetch<{ attendance: AttendanceRecord[] }>("/api/support/attendance"),
      apiFetch<{ irregular: IrregularStudent[] }>("/api/support/irregular"),
    ]);
    if (stRes.status === "fulfilled" && stRes.value?.students) setSupportStudents(stRes.value.students);
    if (tkRes.status === "fulfilled" && tkRes.value?.tickets) setTickets(tkRes.value.tickets);
    if (scRes.status === "fulfilled" && scRes.value?.schedules) setSchedules(scRes.value.schedules);
    if (atRes.status === "fulfilled" && atRes.value?.attendance) setAttendance(atRes.value.attendance);
    if (irRes.status === "fulfilled" && irRes.value?.irregular) setIrregularStudents(irRes.value.irregular);
  }

  async function updateStudentStatus(studentId: string, status: string) {
    await apiFetch(`/api/support/students/${studentId}/status`, { method: "PATCH", body: { status } });
    setSupportStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, studentStatus: status } : s)),
    );
    setOpsStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, studentStatus: status } : s)),
    );
  }

  async function createTicket(input: { subject: string; description?: string; studentId?: string; category: string; priority: string }) {
    await apiFetch("/api/support/tickets", { method: "POST", body: input });
    await fetchSupportData();
  }

  async function updateTicket(id: string, input: { status?: string; priority?: string; forwardedToId?: string }) {
    await apiFetch(`/api/support/tickets/${id}`, { method: "PATCH", body: input });
    await fetchSupportData();
  }

  async function createSchedule(input: { teacherId: string; groupName?: string; title: string; description?: string; dayOfWeek: number; startTime: string; endTime: string; location: string }) {
    await apiFetch("/api/support/schedules", { method: "POST", body: input });
    await fetchSupportData();
  }

  async function recordAttendance(input: { scheduleId: string; studentId: string; status: string; notes?: string; date?: string }) {
    await apiFetch("/api/support/attendance", { method: "POST", body: input });
    await fetchSupportData();
  }

  // ─── Teacher extras ──────────────────────────────────────────────────────

  async function fetchTeacherSchedules() {
    try {
      const res = await apiFetch<{ schedules: TeacherSchedule[] }>("/api/teacher/schedules");
      if (res?.schedules) setTeacherSchedules(res.schedules);
    } catch { /* ignore */ }
  }

  async function fetchTeacherLectures(all = false) {
    try {
      const res = await apiFetch<{ lectures: LectureItem[] }>(`/api/teacher/lectures${all ? "?status=all" : ""}`);
      if (res?.lectures) setTeacherLectures(res.lectures);
    } catch { /* ignore */ }
  }

  async function updateTeacherLectureStatus(id: string, status: "live" | "completed") {
    await apiFetch(`/api/teacher/lectures/${id}/status`, { method: "PATCH", body: { status } });
    await fetchTeacherLectures();
  }

  // Materialize today's lecture from a fixed weekly slot and start it.
  async function startScheduleLecture(scheduleId: string) {
    const res = await apiFetch<{ lecture: LectureItem }>(`/api/teacher/schedules/${scheduleId}/start`, { method: "POST" });
    await fetchTeacherSchedules();
    await fetchTeacherLectures();
    return res.lecture;
  }

  async function fetchLectureStudents(lectureId: string) {
    setLectureStudents([]);
    const res = await apiFetch<{ lecture: { id: string; title: string; startsAt: string; groupName: string | null }; students: LectureStudent[] }>(`/api/teacher/lectures/${lectureId}/students`);
    setLectureStudents(res?.students ?? []);
  }

  async function saveLectureAttendance(lectureId: string, records: { studentId: string; status: "present" | "absent" }[]) {
    await apiFetch(`/api/teacher/lectures/${lectureId}/attendance`, { method: "POST", body: { records } });
  }

  async function fetchAdminAnalytics(filters?: { teacherId?: string | undefined; from?: string | undefined; to?: string | undefined; studentId?: string | undefined }) {
    const qs = new URLSearchParams();
    if (filters?.teacherId) qs.set("teacherId", filters.teacherId);
    if (filters?.from) qs.set("from", filters.from);
    if (filters?.to) qs.set("to", filters.to);
    if (filters?.studentId) qs.set("studentId", filters.studentId);
    const res = await apiFetch<AdminAnalytics>(`/api/admin/analytics${qs.size ? `?${qs}` : ""}`);
    if (res) setAdminAnalytics(res);
  }

  async function fetchTeacherAttendance() {
    try {
      const res = await apiFetch<{ attendance: TeacherAttendance[] }>("/api/teacher/attendance");
      if (res?.attendance) setTeacherAttendance(res.attendance);
    } catch { /* ignore */ }
  }

  async function recordTeacherAttendance(input: { scheduleId: string; studentId: string; status: string; notes?: string; date?: string }) {
    await apiFetch("/api/teacher/attendance", { method: "POST", body: input });
    await fetchTeacherAttendance();
  }

  async function createHomework(input: { title: string; description?: string; hebrewText?: string; studentId?: string; groupName?: string; dueDate?: string }) {
    await apiFetch("/api/teacher/homework", { method: "POST", body: input });
    const res = await apiFetch<{ homework: Homework[] }>("/api/teacher/homework");
    if (res?.homework) setTeacherHomework(res.homework);
  }

  async function gradeHomework(id: string, input: { status?: string; grade?: number; feedback?: string }) {
    await apiFetch(`/api/teacher/homework/${id}`, { method: "PATCH", body: input });
    const res = await apiFetch<{ homework: Homework[] }>("/api/teacher/homework");
    if (res?.homework) setTeacherHomework(res.homework);
  }

  async function updateStudentSkill(studentId: string, input: { skill: string; score: number; notes?: string }) {
    await apiFetch(`/api/teacher/students/${studentId}/skills`, { method: "PATCH", body: input });
  }

  async function fetchStudentReport(studentId: string): Promise<StudentReport | null> {
    try {
      return await apiFetch<StudentReport>(`/api/teacher/students/${studentId}/report`);
    } catch {
      return null;
    }
  }

  // ─── Student extras ──────────────────────────────────────────────────────

  async function fetchStudentHomework() {
    try {
      const res = await apiFetch<{ homework: StudentHomework[] }>("/api/student/homework");
      if (res?.homework) setStudentHomework(res.homework);
    } catch { /* ignore */ }
  }

  async function submitHomework(id: string, input: { submissionText?: string; submissionAudioUrl?: string }) {
    await apiFetch(`/api/student/homework/${id}/submit`, { method: "POST", body: input });
    await fetchStudentHomework();
  }

  async function createStudentTicket(input: { subject: string; description?: string; category: string }) {
    await apiFetch("/api/student/tickets", { method: "POST", body: input });
    try {
      const res = await apiFetch<{ tickets: StudentTicket[] }>("/api/student/tickets");
      if (res?.tickets) setStudentTickets(res.tickets);
    } catch { /* ignore */ }
  }

  // ─── Admin extras ────────────────────────────────────────────────────────

  async function fetchAdminOps() {
    const [packsRes, leadsRes, repRes, subsRes, certRes] = await Promise.allSettled([
      apiFetch<{ packages: AdminPackage[] }>("/api/admin/packages"),
      apiFetch<{ leads: AdminLead[] }>("/api/admin/leads"),
      apiFetch<AdminSalesReport>("/api/admin/sales-report"),
      apiFetch<{ subscriptions: Subscription[] }>("/api/admin/subscriptions"),
      apiFetch<{ certificates: AdminCertificate[] }>("/api/admin/certificates"),
    ]);
    if (packsRes.status === "fulfilled" && packsRes.value?.packages) setAdminPackages(packsRes.value.packages);
    if (leadsRes.status === "fulfilled" && leadsRes.value?.leads) setAdminLeads(leadsRes.value.leads);
    if (repRes.status === "fulfilled" && repRes.value) setSalesReport(repRes.value);
    if (subsRes.status === "fulfilled" && subsRes.value?.subscriptions) setAdminSubscriptions(subsRes.value.subscriptions);
    if (certRes.status === "fulfilled" && certRes.value?.certificates) setAdminCertificates(certRes.value.certificates);
  }

  async function createPackage(input: { nameAr: string; description?: string; price: number; durationMonths: number; features?: string[]; teacherId?: string }) {
    await apiFetch("/api/admin/packages", { method: "POST", body: input });
    await fetchAdminOps();
  }

  async function updatePackage(id: string, input: { nameAr?: string; description?: string; price?: number; durationMonths?: number; teacherId?: string; isActive?: boolean }) {
    await apiFetch(`/api/admin/packages/${id}`, { method: "PATCH", body: input });
    await fetchAdminOps();
  }

  async function deletePackage(id: string) {
    await apiFetch(`/api/admin/packages/${id}`, { method: "DELETE" });
    await fetchAdminOps();
  }

  async function assignLead(leadId: string, salesId: string | null) {
    await apiFetch(`/api/admin/leads/${leadId}/assign`, { method: "PATCH", body: { salesId } });
    await fetchAdminOps();
  }

  async function issueCertificate(input: { studentId: string; title: string; level?: string; description?: string }) {
    await apiFetch("/api/admin/certificates", { method: "POST", body: input });
    await fetchAdminOps();
  }

  async function deleteCertificate(id: string) {
    await apiFetch(`/api/admin/certificates/${id}`, { method: "DELETE" });
    await fetchAdminOps();
  }

  // ─── Teacher schedule CRUD ───────────────────────────────────────────────

  async function createTeacherSchedule(input: { title: string; groupName?: string; description?: string; dayOfWeek: number; startTime: string; endTime: string; location: string; meetingUrl?: string }) {
    await apiFetch("/api/teacher/schedules", { method: "POST", body: input });
    await fetchTeacherSchedules();
  }

  async function deleteTeacherSchedule(id: string) {
    await apiFetch(`/api/teacher/schedules/${id}`, { method: "DELETE" });
    await fetchTeacherSchedules();
  }

  // ─── Chat & public packages ──────────────────────────────────────────────

  async function fetchPublicPackages(category?: string) {
    try {
      const qs = category ? `?category=${category}` : "";
      const res = await apiFetch<{ packages: PublicPackage[] }>(`/api/public/packages${qs}`, { skipAuth: true });
      if (res?.packages) setPublicPackages(res.packages);
    } catch { /* ignore */ }
  }

  async function submitPublicLead(input: { name: string; phone: string; email?: string; packageName?: string }) {
    await apiFetch("/api/public/leads", { method: "POST", body: input, skipAuth: true });
  }

  async function fetchMyChatTeachers() {
    try {
      const res = await apiFetch<{ teachers: MyTeacher[] }>("/api/student/chat/teachers");
      if (res?.teachers) setMyChatTeachers(res.teachers);
    } catch { /* ignore */ }
  }

  async function fetchTeacherChat(teacherId?: string) {
    try {
      const q = teacherId ? `?teacherId=${teacherId}` : "";
      const res = await apiFetch<{ messages: ChatMsg[] }>(`/api/student/chat/teacher${q}`);
      if (res?.messages) setTeacherChatMsgs(res.messages);
    } catch { /* ignore */ }
  }

  async function sendTeacherChatMsg(content: string, teacherId?: string) {
    await apiFetch("/api/student/chat/teacher", { method: "POST", body: { content, ...(teacherId ? { teacherId } : {}) } });
    await fetchTeacherChat(teacherId);
  }

  async function fetchSupportChat() {
    try {
      const res = await apiFetch<{ messages: ChatMsg[] }>("/api/student/chat/support");
      if (res?.messages) setSupportChatMsgs(res.messages);
    } catch { /* ignore */ }
  }

  async function sendSupportChatMsg(content: string) {
    await apiFetch("/api/student/chat/support", { method: "POST", body: { content } });
    await fetchSupportChat();
  }

  async function sendAiMessage(message: string, history: { role: "user" | "assistant"; content: string }[]): Promise<string> {
    const res = await apiFetch<{ reply: string }>("/api/student/ai-chat", {
      method: "POST",
      body: { message, history },
    });
    return res.reply;
  }

  async function fetchTeacherChatThreads() {
    try {
      const res = await apiFetch<{ threads: TeacherChatThread[] }>("/api/teacher/chat/threads");
      if (res?.threads) setTeacherChatThreads(res.threads);
    } catch { /* ignore */ }
  }

  async function fetchTeacherChatThread(studentId: string): Promise<ChatMsg[]> {
    const res = await apiFetch<{ messages: ChatMsg[] }>(`/api/teacher/chat/${studentId}`);
    return res?.messages ?? [];
  }

  async function sendTeacherChatReply(studentId: string, content: string) {
    await apiFetch(`/api/teacher/chat/${studentId}`, { method: "POST", body: { content } });
  }

  async function fetchSupportChatThreads() {
    try {
      const res = await apiFetch<{ threads: SupportChatThread[] }>("/api/support/chats");
      if (res?.threads) setSupportChatThreads(res.threads);
    } catch { /* ignore */ }
  }

  async function fetchSupportChatThread(studentId: string): Promise<ChatMsg[]> {
    const res = await apiFetch<{ messages: ChatMsg[] }>(`/api/support/chat/${studentId}`);
    return res?.messages ?? [];
  }

  async function sendSupportChatReply(studentId: string, content: string) {
    await apiFetch(`/api/support/chat/${studentId}`, { method: "POST", body: { content } });
  }

  // ─── Notifications & misc ────────────────────────────────────────────────

  async function fetchNotifications() {
    try {
      const res = await apiFetch<{ notifications: AppNotification[]; unreadCount: number }>(
        "/api/notifications"
      );
      if (res?.notifications) setNotifications(res.notifications);
      if (res?.unreadCount !== undefined) setUnreadCount(res.unreadCount);
    } catch { /* ignore */ }
  }

  async function markNotificationRead(id: string) {
    await apiFetch(`/api/notifications/${id}/read`, { method: "POST" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function markAllNotificationsRead() {
    await apiFetch("/api/notifications/read-all", { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    setUnreadCount(0);
  }

  async function gradeHomeworkSubmission(submissionId: string, input: { grade?: number; feedback?: string }) {
    await apiFetch(`/api/teacher/homework/submissions/${submissionId}`, { method: "PATCH", body: input });
    const res = await apiFetch<{ homework: Homework[] }>("/api/teacher/homework");
    if (res?.homework) setTeacherHomework(res.homework);
  }

  async function submitPlacementResult(scorePercent: number, level: string, answers?: PlacementAnswerEntry[]) {
    await apiFetch("/api/placement/result", { method: "POST", body: { scorePercent, level, ...(answers?.length ? { answers } : {}) } });
  }

  // ─── Billing / bookings ────────────────────────────────────────────────

  async function fetchMyBilling() {
    const res = await apiFetch<{ requests: PaymentRequestItem[]; subscription: MySubscription | null }>(
      "/api/student/payment-requests"
    );
    if (res) {
      setMyPaymentRequests(res.requests ?? []);
      setMySubscription(res.subscription ?? null);
    }
  }

  async function createPaymentRequest(input: {
    packageId: string;
    method: "wallet" | "instapay";
    studyMode?: "online" | "offline";
    screenshotUrl: string;
  }) {
    await apiFetch("/api/student/payment-requests", { method: "POST", body: input });
    await fetchMyBilling();
  }

  async function fetchAdminPaymentRequests(status?: string) {
    const qs = status ? `?status=${status}` : "";
    const res = await apiFetch<{ requests: PaymentRequestItem[] }>(`/api/admin/payment-requests${qs}`);
    if (res?.requests) setAdminPaymentRequests(res.requests);
  }

  async function reviewPaymentRequest(
    id: string,
    input: { action: "approve" | "reject"; rejectReason?: string }
  ) {
    await apiFetch(`/api/admin/payment-requests/${id}`, { method: "PATCH", body: input });
    await fetchAdminPaymentRequests();
  }

  async function fetchPlacementResults() {
    const res = await apiFetch<{ results: PlacementResultRow[] }>("/api/admin/placement-results");
    if (res?.results) setPlacementResults(res.results);
  }

  async function fetchAdminLectures(filter?: { status?: string }) {
    const qs = filter?.status ? `?status=${filter.status}` : "";
    const res = await apiFetch<{ lectures: AdminLectureItem[] }>(`/api/admin/lectures${qs}`);
    if (res?.lectures) setAdminLectures(res.lectures);
  }

  async function createAdminLecture(input: CreateLectureInput) {
    await apiFetch("/api/admin/lectures", { method: "POST", body: input });
    await fetchAdminLectures();
  }

  async function updateAdminLecture(id: string, input: Partial<CreateLectureInput>) {
    await apiFetch(`/api/admin/lectures/${id}`, { method: "PATCH", body: input });
    await fetchAdminLectures();
  }

  async function deleteAdminLecture(id: string) {
    await apiFetch(`/api/admin/lectures/${id}`, { method: "DELETE" });
    await fetchAdminLectures();
  }

  async function fetchAdminSchedules() {
    const res = await apiFetch<{ schedules: WeeklyScheduleItem[] }>("/api/ops/schedules");
    if (res?.schedules) setAdminSchedules(res.schedules);
  }

  async function createAdminSchedule(input: CreateScheduleInput) {
    await apiFetch("/api/ops/schedules", { method: "POST", body: input });
    await fetchAdminSchedules();
  }

  async function updateAdminSchedule(id: string, input: Partial<CreateScheduleInput>) {
    await apiFetch(`/api/ops/schedules/${id}`, { method: "PATCH", body: input });
    await fetchAdminSchedules();
  }

  async function deleteAdminSchedule(id: string) {
    await apiFetch(`/api/ops/schedules/${id}`, { method: "DELETE" });
    await fetchAdminSchedules();
  }

  async function fetchPublicSchedules() {
    try {
      const res = await apiFetch<{ schedules: WeeklyScheduleItem[] }>("/api/public/schedules");
      if (res?.schedules) setPublicSchedules(res.schedules);
    } catch { /* public page — ignore */ }
  }

  async function fetchSupportLectures() {
    const res = await apiFetch<{ lectures: AdminLectureItem[] }>("/api/support/lectures");
    if (res?.lectures) setSupportLectures(res.lectures);
  }

  // ─── Session-package booking functions ───
  async function fetchHasCallsPackage() {
    try {
      const res = await apiFetch<{ hasCallsPackage: boolean; hasBasicPackage?: boolean }>("/api/student/has-calls-package");
      if (res) {
        setHasCallsPackage(res.hasCallsPackage);
        setHasBasicPackage(res.hasBasicPackage ?? false);
      }
    } catch { /* ignore */ }
  }

  async function fetchMySessions() {
    const res = await apiFetch<{ subscriptions: SessionSubscription[]; bookings: LessonBookingItem[] }>("/api/student/sessions");
    if (res) {
      setMySessions(res.subscriptions ?? []);
      setMyBookings(res.bookings ?? []);
    }
  }

  async function fetchAvailableSlots() {
    const res = await apiFetch<{ slots: AvailableSlot[] }>("/api/student/available-slots");
    if (res) setAvailableSlots(res.slots ?? []);
  }

  async function bookSession(input: { availabilityId: string; startsAt: string }) {
    await apiFetch("/api/student/bookings", {
      method: "POST",
      body: input,
    });
    await fetchMySessions();
    await fetchAvailableSlots();
  }

  async function rescheduleBooking(id: string, input: { newAvailabilityId: string; newStartsAt: string }) {
    await apiFetch(`/api/student/bookings/${id}/reschedule`, {
      method: "PATCH",
      body: input,
    });
    await fetchMySessions();
    await fetchAvailableSlots();
  }

  async function cancelBooking(id: string, reason?: string): Promise<{ refunded: boolean }> {
    const res = await apiFetch<{ refunded: boolean }>(`/api/student/bookings/${id}`, {
      method: "DELETE",
      body: { reason },
    });
    await fetchMySessions();
    await fetchAvailableSlots();
    return res ?? { refunded: false };
  }

  async function fetchTeacherAvailability() {
    const res = await apiFetch<{ availability: TeacherAvailabilitySlot[] }>("/api/teacher/availability");
    if (res) setTeacherAvailability(res.availability ?? []);
  }

  async function addTeacherAvailability(input: { dayOfWeek: number | null; specificDate?: string | null; startTime: string; endTime: string }) {
    await apiFetch("/api/teacher/availability", {
      method: "POST",
      body: input,
    });
    await fetchTeacherAvailability();
  }

  async function toggleTeacherAvailability(id: string) {
    await apiFetch(`/api/teacher/availability/${id}/toggle`, { method: "PATCH" });
    await fetchTeacherAvailability();
  }

  async function deleteTeacherAvailability(id: string) {
    await apiFetch(`/api/teacher/availability/${id}`, { method: "DELETE" });
    await fetchTeacherAvailability();
  }

  async function fetchTeacherBookings() {
    const res = await apiFetch<{ bookings: LessonBookingItem[] }>("/api/teacher/bookings");
    if (res) setTeacherBookings(res.bookings ?? []);
  }

  async function setBookingStatus(id: string, status: "completed" | "no_show" | "booked") {
    await apiFetch(`/api/teacher/bookings/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
    await fetchTeacherBookings();
  }

  async function teacherCancelBooking(id: string, reason?: string) {
    await apiFetch(`/api/teacher/bookings/${id}`, {
      method: "DELETE",
      body: { reason },
    });
    await fetchTeacherBookings();
  }

  async function fetchAdminBookings(filter?: { status?: string; teacherId?: string; studentId?: string }) {
    const params = new URLSearchParams();
    if (filter?.status) params.set("status", filter.status);
    if (filter?.teacherId) params.set("teacherId", filter.teacherId);
    if (filter?.studentId) params.set("studentId", filter.studentId);
    const qs = params.toString();
    const res = await apiFetch<{ bookings: LessonBookingItem[] }>(`/api/admin/bookings${qs ? `?${qs}` : ""}`);
    if (res) setAdminBookings(res.bookings ?? []);
  }

  async function fetchAdminBookingsReport() {
    const res = await apiFetch<{ students: any[]; totals: any }>("/api/admin/bookings/report");
    if (res) setAdminBookingsReport(res);
  }

  async function adminUpdateBooking(id: string, input: { status?: string; notes?: string; meetingUrl?: string; reason?: string }) {
    await apiFetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      body: input,
    });
    await fetchAdminBookings();
  }

  // ─── Groups ───
  async function fetchAdminGroups() {
    const res = await apiFetch<{ groups: GroupItem[] }>("/api/ops/groups");
    if (res) setAdminGroups(res.groups ?? []);
  }

  async function createAdminGroup(input: { name: string; description?: string; teacherId?: string; level?: string | null; maxStudents?: number | null }) {
    await apiFetch("/api/ops/groups", { method: "POST", body: input });
    await fetchAdminGroups();
  }

  async function updateAdminGroup(id: string, input: Partial<{ name: string; description: string; teacherId: string; level: string | null; maxStudents: number | null }>) {
    await apiFetch(`/api/ops/groups/${id}`, { method: "PATCH", body: input });
    await fetchAdminGroups();
  }

  async function deleteAdminGroup(id: string) {
    await apiFetch(`/api/ops/groups/${id}`, { method: "DELETE" });
    await fetchAdminGroups();
  }

  async function fetchGroupMembers(groupId: string) {
    const res = await apiFetch<{ members: GroupMemberItem[] }>(`/api/ops/groups/${groupId}/members`);
    if (res) setGroupMembers(res.members ?? []);
  }

  async function addGroupMembers(groupId: string, studentIds: string[]) {
    await apiFetch(`/api/ops/groups/${groupId}/members`, { method: "POST", body: { studentIds } });
    await fetchGroupMembers(groupId);
    await fetchAdminGroups();
    await fetchOpsStudents().catch(() => {});
  }

  async function removeGroupMember(groupId: string, studentId: string) {
    await apiFetch(`/api/ops/groups/${groupId}/members/${studentId}`, { method: "DELETE" });
    await fetchGroupMembers(groupId);
    await fetchAdminGroups();
  }

  // ─── Admin teacher availability (for creating lectures from slots) ───
  async function fetchAdminTeacherAvailability(teacherId?: string) {
    const qs = teacherId ? `?teacherId=${teacherId}` : "";
    const res = await apiFetch<{ availability: any[] }>(`/api/ops/teacher-availability${qs}`);
    if (res) setAdminTeacherAvailability(res.availability ?? []);
  }

  // ─── Ops: calls students + booking creation ───
  async function fetchCallsStudents() {
    const res = await apiFetch<{ students: CallsStudentItem[] }>("/api/ops/calls-students");
    if (res) setCallsStudents(res.students ?? []);
  }

  async function fetchOpsBookings() {
    const res = await apiFetch<{ bookings: LessonBookingItem[] }>("/api/ops/bookings");
    if (res) setOpsBookings(res.bookings ?? []);
  }

  async function fetchOpsTeachers() {
    const res = await apiFetch<{ teachers: OpsTeacherItem[] }>("/api/ops/teachers");
    if (res) setOpsTeachers(res.teachers ?? []);
  }

  async function fetchOpsStudents() {
    const res = await apiFetch<{ students: OpsStudentItem[] }>("/api/ops/students");
    if (res) setOpsStudents(res.students ?? []);
  }

  async function fetchOpsPackages() {
    const res = await apiFetch<{ packages: OpsPackageItem[] }>("/api/ops/packages");
    if (res) setOpsPackages(res.packages ?? []);
  }

  async function activateOpsSubscription(input: { studentId: string; packageId: string; paidAmount?: number; notes?: string }) {
    await apiFetch("/api/ops/subscriptions", { method: "POST", body: input });
    await fetchOpsStudents();
  }

  async function opsCreateBooking(input: { studentId: string; teacherId: string; startsAt: string; endsAt?: string; meetingUrl?: string; notes?: string }) {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    await apiFetch("/api/ops/bookings", { method: "POST", body: { ...input, timeZone } });
    await Promise.all([fetchOpsBookings(), fetchCallsStudents()]);
  }

  // ─── Free lectures management (admin/support) ───
  async function fetchFreeStudents() {
    const res = await apiFetch<{ students: FreeLectureStudent[] }>("/api/ops/free-students");
    if (res) setFreeStudents(res.students ?? []);
  }

  async function createFreeStudent(input: { name: string; phone: string; level?: string | null; groupId?: string | null; notes?: string }) {
    await apiFetch("/api/ops/free-students", { method: "POST", body: input });
    await fetchFreeStudents();
  }

  async function deleteFreeStudent(id: string) {
    await apiFetch(`/api/ops/free-students/${id}`, { method: "DELETE" });
    await fetchFreeStudents();
  }

  async function fetchFreeLectures() {
    const res = await apiFetch<{ lectures: FreeLecture[] }>("/api/ops/free-lectures");
    if (res) setFreeLectures(res.lectures ?? []);
  }

  async function createFreeLecture(input: { title: string; description?: string; teacherId?: string; groupId?: string; level?: string | null; startsAt: string; endsAt?: string; meetingUrl?: string }) {
    await apiFetch("/api/ops/free-lectures", { method: "POST", body: input });
    await fetchFreeLectures();
  }

  async function updateFreeLecture(id: string, input: Record<string, unknown>) {
    await apiFetch(`/api/ops/free-lectures/${id}`, { method: "PATCH", body: input });
    await fetchFreeLectures();
  }

  async function deleteFreeLecture(id: string) {
    await apiFetch(`/api/ops/free-lectures/${id}`, { method: "DELETE" });
    await fetchFreeLectures();
  }

  async function addFreeLectureFile(id: string, file: { name: string; url: string }) {
    await apiFetch(`/api/ops/free-lectures/${id}/files`, { method: "POST", body: file });
    await fetchFreeLectures();
  }

  async function removeFreeLectureFile(id: string, index: number) {
    await apiFetch(`/api/ops/free-lectures/${id}/files`, { method: "DELETE", body: { index } });
    await fetchFreeLectures();
  }

  // ─── Student: free lectures view ───
  async function fetchStudentFreeLectures() {
    try {
      const res = await apiFetch<{ lectures: FreeLecture[] }>("/api/student/free-lectures");
      if (res) setStudentFreeLectures(res.lectures ?? []);
    } catch { /* ignore */ }
  }

  // ─── Teacher analytics ───
  async function fetchTeacherAnalytics(filters?: { from?: string | undefined; to?: string | undefined; studentId?: string | undefined }) {
    const qs = new URLSearchParams();
    if (filters?.from) qs.set("from", filters.from);
    if (filters?.to) qs.set("to", filters.to);
    if (filters?.studentId) qs.set("studentId", filters.studentId);
    const res = await apiFetch<TeacherAnalytics>(`/api/teacher/analytics${qs.size ? `?${qs}` : ""}`);
    if (res) setTeacherAnalytics(res);
  }

  // ─── Student wallet ───
  async function fetchStudentWallet() {
    const res = await apiFetch<{ wallet: WalletItem[]; bookings: WalletBooking[] }>("/api/student/wallet");
    if (res) {
      setStudentWallet(res.wallet ?? []);
      setStudentWalletBookings(res.bookings ?? []);
    }
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
        supportStudents,
        tickets,
        schedules,
        attendance,
        irregularStudents,
        teacherSchedules,
        teacherLectures,
        teacherHomework,
        teacherAttendance,
        studentSchedules,
        studentLectures,
        studentHomework,
        studentAttendance,
        studentAttendanceRate,
        studentSkills,
        studentCertificates,
        studentTickets,
        adminPackages,
        adminLeads,
        salesReport,
        adminSubscriptions,
        adminCertificates,
        publicPackages,
        myChatTeachers,
        teacherChatMsgs,
        supportChatMsgs,
        teacherChatThreads,
        supportChatThreads,
        notifications,
        unreadCount,
        myPaymentRequests,
        mySubscription,
        adminPaymentRequests,
        placementResults,
        adminLectures,
        adminSchedules,
        publicSchedules,
        supportLectures,
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
        fetchSupportData,
        updateStudentStatus,
        createTicket,
        updateTicket,
        createSchedule,
        recordAttendance,
        fetchTeacherSchedules,
        fetchTeacherLectures,
        fetchTeacherAttendance,
        recordTeacherAttendance,
        createHomework,
        gradeHomework,
        updateStudentSkill,
        fetchStudentReport,
        submitHomework,
        createStudentTicket,
        fetchAdminOps,
        createPackage,
        updatePackage,
        deletePackage,
        assignLead,
        issueCertificate,
        deleteCertificate,
        createTeacherSchedule,
        deleteTeacherSchedule,
        fetchPublicPackages,
        submitPublicLead,
        fetchMyChatTeachers,
        fetchTeacherChat,
        sendTeacherChatMsg,
        fetchSupportChat,
        sendSupportChatMsg,
        sendAiMessage,
        fetchTeacherChatThreads,
        fetchTeacherChatThread,
        sendTeacherChatReply,
        fetchSupportChatThreads,
        fetchSupportChatThread,
        sendSupportChatReply,
        fetchNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        gradeHomeworkSubmission,
        submitPlacementResult,
        fetchMyBilling,
        createPaymentRequest,
        fetchAdminPaymentRequests,
        reviewPaymentRequest,
        fetchPlacementResults,
        fetchAdminLectures,
        createAdminLecture,
        updateAdminLecture,
        deleteAdminLecture,
        fetchAdminSchedules,
        createAdminSchedule,
        updateAdminSchedule,
        deleteAdminSchedule,
        fetchPublicSchedules,
        fetchSupportLectures,
        // bookings
        mySessions,
        myBookings,
        availableSlots,
        teacherAvailability,
        teacherBookings,
        hasCallsPackage,
        hasBasicPackage,
        adminBookings,
        adminBookingsReport,
        fetchMySessions,
        fetchHasCallsPackage,
        fetchAvailableSlots,
        bookSession,
        rescheduleBooking,
        cancelBooking,
        fetchTeacherAvailability,
        addTeacherAvailability,
        toggleTeacherAvailability,
        deleteTeacherAvailability,
        fetchTeacherBookings,
        setBookingStatus,
        teacherCancelBooking,
        fetchAdminBookings,
        fetchAdminBookingsReport,
        adminUpdateBooking,
        // groups
        adminGroups,
        groupMembers,
        fetchAdminGroups,
        createAdminGroup,
        updateAdminGroup,
        deleteAdminGroup,
        fetchGroupMembers,
        addGroupMembers,
        removeGroupMember,
        // admin teacher availability
        adminTeacherAvailability,
        fetchAdminTeacherAvailability,
        callsStudents,
        fetchCallsStudents,
        opsCreateBooking,
        opsBookings,
        fetchOpsBookings,
        opsTeachers,
        fetchOpsTeachers,
        opsStudents,
        fetchOpsStudents,
        opsPackages,
        fetchOpsPackages,
        activateOpsSubscription,
        freeStudents,
        freeLectures,
        fetchFreeStudents,
        createFreeStudent,
        deleteFreeStudent,
        fetchFreeLectures,
        createFreeLecture,
        updateFreeLecture,
        deleteFreeLecture,
        addFreeLectureFile,
        removeFreeLectureFile,
        studentFreeLectures,
        fetchStudentFreeLectures,
        teacherAnalytics,
        fetchTeacherAnalytics,
        updateTeacherLectureStatus,
        startScheduleLecture,
        lectureStudents,
        fetchLectureStudents,
        saveLectureAttendance,
        adminAnalytics,
        fetchAdminAnalytics,
        studentWallet,
        studentWalletBookings,
        fetchStudentWallet,
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
