import { pgTable, text, serial, integer, boolean, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (both admins and teachers)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("fullName").notNull(),
  email: text("email"),
  isAdmin: boolean("isAdmin").default(false).notNull(),
});

// Grades table (e.g., "Grade 1", "Grade 2")
export const grades = pgTable("grades", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

// Subjects table (e.g., "Math", "Science", "Art", "PE")
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: text("type").notNull().default("standard"), // "standard", "art", "pe"
});

// Teacher to Grade assignments
export const teacherGrades = pgTable("teacher_grades", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacherId").notNull().references(() => users.id),
  gradeId: integer("gradeId").notNull().references(() => grades.id),
});

// Teacher to Subject within Grade assignments
export const teacherSubjects = pgTable("teacher_subjects", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacherId").notNull().references(() => users.id),
  gradeId: integer("gradeId").notNull().references(() => grades.id),
  subjectId: integer("subjectId").notNull().references(() => subjects.id),
});

// Planning Weeks
export const planningWeeks = pgTable("planning_weeks", {
  id: serial("id").primaryKey(),
  weekNumber: integer("weekNumber").notNull(),
  year: integer("year").notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
});

// Weekly Plans
export const weeklyPlans = pgTable("weekly_plans", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacherId").notNull().references(() => users.id),
  gradeId: integer("gradeId").notNull().references(() => grades.id),
  subjectId: integer("subjectId").notNull().references(() => subjects.id),
  weekId: integer("weekId").notNull().references(() => planningWeeks.id),
  notes: text("notes"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Daily Plans
export const dailyPlans = pgTable("daily_plans", {
  id: serial("id").primaryKey(),
  weeklyPlanId: integer("weeklyPlanId").notNull().references(() => weeklyPlans.id),
  dayOfWeek: integer("dayOfWeek").notNull(), // 1=Monday through 5=Friday
  topic: text("topic"),
  booksAndPages: text("booksAndPages"),
  homework: text("homework"),
  homeworkDueDate: date("homeworkDueDate"),
  assignments: text("assignments"),
  notes: text("notes"),
  // Special fields for Art subject
  requiredItems: text("requiredItems"),
  // Special fields for PE subject
  skill: text("skill"),
  activity: text("activity"),
});

// Zod schemas for insert operations

export const insertUserSchema = createInsertSchema(users, {
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email().optional(),
  isAdmin: z.boolean().default(false),
});

export const insertGradeSchema = createInsertSchema(grades, {
  name: z.string().min(1, "Grade name is required"),
});

export const insertSubjectSchema = createInsertSchema(subjects, {
  name: z.string().min(1, "Subject name is required"),
  type: z.enum(["standard", "art", "pe"]).default("standard"),
});

export const insertTeacherGradeSchema = createInsertSchema(teacherGrades, {
  teacherId: z.number(),
  gradeId: z.number(),
});

export const insertTeacherSubjectSchema = createInsertSchema(teacherSubjects, {
  teacherId: z.number(),
  gradeId: z.number(),
  subjectId: z.number(),
});

export const insertPlanningWeekSchema = createInsertSchema(planningWeeks, {
  weekNumber: z.number().min(1).max(52),
  year: z.number().min(2000).max(2100),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isActive: z.boolean().default(true),
});

export const insertWeeklyPlanSchema = createInsertSchema(weeklyPlans, {
  teacherId: z.number(),
  gradeId: z.number(),
  subjectId: z.number(),
  weekId: z.number(),
  notes: z.string().optional(),
});

export const insertDailyPlanSchema = createInsertSchema(dailyPlans, {
  weeklyPlanId: z.number(),
  dayOfWeek: z.number().min(1).max(5),
  topic: z.string().optional(),
  booksAndPages: z.string().optional(),
  homework: z.string().optional(),
  homeworkDueDate: z.coerce.date().optional(),
  assignments: z.string().optional(),
  notes: z.string().optional(),
  requiredItems: z.string().optional(),
  skill: z.string().optional(),
  activity: z.string().optional(),
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Grade = typeof grades.$inferSelect;
export type InsertGrade = z.infer<typeof insertGradeSchema>;

export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;

export type TeacherGrade = typeof teacherGrades.$inferSelect;
export type InsertTeacherGrade = z.infer<typeof insertTeacherGradeSchema>;

export type TeacherSubject = typeof teacherSubjects.$inferSelect;
export type InsertTeacherSubject = z.infer<typeof insertTeacherSubjectSchema>;

export type PlanningWeek = typeof planningWeeks.$inferSelect;
export type InsertPlanningWeek = z.infer<typeof insertPlanningWeekSchema>;

export type WeeklyPlan = typeof weeklyPlans.$inferSelect;
export type InsertWeeklyPlan = z.infer<typeof insertWeeklyPlanSchema>;

export type DailyPlan = typeof dailyPlans.$inferSelect;
export type InsertDailyPlan = z.infer<typeof insertDailyPlanSchema>;

// Custom schemas
export const userAuthSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const userRoleSchema = z.object({
  userId: z.number(),
  isAdmin: z.boolean(),
});

export type UserAuth = z.infer<typeof userAuthSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;

// Daily plan with enhanced context for form handling
export const dailyPlanFormSchema = z.object({
  id: z.number().optional(),
  weeklyPlanId: z.number(),
  dayOfWeek: z.number().min(1).max(5),
  topic: z.string().optional(),
  booksAndPages: z.string().optional(),
  homework: z.string().optional(),
  homeworkDueDate: z.coerce.date().optional().nullable(),
  assignments: z.string().optional(),
  notes: z.string().optional(),
  // Special fields for Art subject
  requiredItems: z.string().optional(),
  // Special fields for PE subject
  skill: z.string().optional(),
  activity: z.string().optional(),
});

export type DailyPlanForm = z.infer<typeof dailyPlanFormSchema>;

// Weekly plan with daily plans included for complete view
export type WeeklyPlanComplete = WeeklyPlan & {
  teacher: User;
  grade: Grade;
  subject: Subject;
  week: PlanningWeek;
  dailyPlans: DailyPlan[];
};
