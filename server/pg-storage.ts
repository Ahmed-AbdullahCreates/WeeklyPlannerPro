import crypto from 'crypto';
import { and, eq, like, inArray, sql } from 'drizzle-orm';
import { db } from './db';
import { IStorage } from './storage';
import * as schema from '../shared/schema';

// Helper function to safely check rowCount
function hasRowsAffected(result: { rowCount: number | null }): boolean {
  return result.rowCount !== null && result.rowCount > 0;
}

// Import the types we need
import {
  User, InsertUser,
  Grade, InsertGrade,
  Subject, InsertSubject,
  TeacherGrade, InsertTeacherGrade,
  TeacherSubject, InsertTeacherSubject,
  PlanningWeek, InsertPlanningWeek,
  WeeklyPlan, InsertWeeklyPlan,
  DailyPlan, InsertDailyPlan,
  WeeklyPlanComplete
} from '../shared/schema';

/**
 * PostgreSQL implementation of the storage interface using Drizzle ORM
 * Optimized for performance with transaction support and efficient queries
 */
export class PgStorage implements IStorage {
  
  // Make this public so it can be used by the reseed API
  hashPassword(plainPassword: string): string {
    // Using Node.js crypto module with scrypt algorithm for password hashing
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(plainPassword, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(storedPassword: string, suppliedPassword: string): boolean {
    const [salt, hash] = storedPassword.split(':');
    const suppliedHash = crypto.scryptSync(suppliedPassword, salt, 64).toString('hex');
    return hash === suppliedHash;
  }

  constructor() {
    this.seedInitialData();
  }

  /**
   * Create initial admin user and seed test data if the database is empty
   * Uses a transaction to ensure data consistency
   */
  private async seedInitialData() {
    // Check if we have any users first - only seed if empty
    const existingUsers = await db.select().from(schema.users).limit(1);
    
    if (existingUsers.length === 0) {
      console.log('Seeding initial data to database...');
      
      // Use transaction to ensure all or nothing is committed
      await db.transaction(async (tx) => {
        // Create admin user
        const adminUser = await tx.insert(schema.users).values({
          username: 'admin',
          password: this.hashPassword('admin123'),
          fullName: 'System Administrator',
          isAdmin: true
        }).returning();
        
        // Create sample teacher
        const teacher = await tx.insert(schema.users).values({
          username: 'teacher',
          password: this.hashPassword('teacher123'),
          fullName: 'John Smith',
          isAdmin: false
        }).returning();
        
        // Create more teachers
        const mathTeacher = await tx.insert(schema.users).values({
          username: 'math_teacher',
          password: this.hashPassword('teacher123'),
          fullName: 'Michael Johnson',
          isAdmin: false
        }).returning();
        
        const englishTeacher = await tx.insert(schema.users).values({
          username: 'english_teacher',
          password: this.hashPassword('teacher123'),
          fullName: 'Emily Davis',
          isAdmin: false
        }).returning();
        
        // Create sample grades
        const grade1 = await tx.insert(schema.grades).values({ name: 'Grade 1' }).returning();
        const grade2 = await tx.insert(schema.grades).values({ name: 'Grade 2' }).returning();
        const grade3 = await tx.insert(schema.grades).values({ name: 'Grade 3' }).returning();
        const grade2A = await tx.insert(schema.grades).values({ name: '2A' }).returning();
        
        // Create sample subjects
        const mathSubject = await tx.insert(schema.subjects).values({ name: 'Mathematics', type: 'standard' }).returning();
        const scienceSubject = await tx.insert(schema.subjects).values({ name: 'Science', type: 'standard' }).returning();
        const englishSubject = await tx.insert(schema.subjects).values({ name: 'English', type: 'standard' }).returning();
        const artSubject = await tx.insert(schema.subjects).values({ name: 'Art', type: 'art' }).returning();
        const peSubject = await tx.insert(schema.subjects).values({ name: 'PE', type: 'pe' }).returning();
        
        // Assign teachers to grades and subjects
        await tx.insert(schema.teacherGrades).values({ 
          teacherId: teacher[0].id, 
          gradeId: grade3[0].id 
        });
        
        await tx.insert(schema.teacherGrades).values({ 
          teacherId: mathTeacher[0].id, 
          gradeId: grade2A[0].id 
        });
        
        await tx.insert(schema.teacherGrades).values({ 
          teacherId: englishTeacher[0].id, 
          gradeId: grade2A[0].id 
        });
        
        await tx.insert(schema.teacherSubjects).values({ 
          teacherId: teacher[0].id, 
          gradeId: grade3[0].id, 
          subjectId: mathSubject[0].id 
        });
        
        await tx.insert(schema.teacherSubjects).values({ 
          teacherId: teacher[0].id, 
          gradeId: grade3[0].id, 
          subjectId: scienceSubject[0].id 
        });
        
        await tx.insert(schema.teacherSubjects).values({ 
          teacherId: mathTeacher[0].id, 
          gradeId: grade2A[0].id, 
          subjectId: mathSubject[0].id 
        });
        
        await tx.insert(schema.teacherSubjects).values({ 
          teacherId: englishTeacher[0].id, 
          gradeId: grade2A[0].id, 
          subjectId: englishSubject[0].id 
        });
        
        // Create planning weeks
        const week1 = await tx.insert(schema.planningWeeks).values({
          weekNumber: 15,
          year: 2024,
          startDate: new Date("2024-04-10"),
          endDate: new Date("2024-04-16"),
          isActive: false
        }).returning();
        
        const week2 = await tx.insert(schema.planningWeeks).values({
          weekNumber: 16,
          year: 2024,
          startDate: new Date("2024-04-17"),
          endDate: new Date("2024-04-23"),
          isActive: true
        }).returning();
        
        // Create weekly plans
        const mathWeeklyPlan = await tx.insert(schema.weeklyPlans).values({
          teacherId: mathTeacher[0].id,
          gradeId: grade2A[0].id,
          subjectId: mathSubject[0].id,
          weekId: week2[0].id,
          notes: "Focus on fractions and decimals this week"
        }).returning();
        
        const englishWeeklyPlan = await tx.insert(schema.weeklyPlans).values({
          teacherId: englishTeacher[0].id,
          gradeId: grade2A[0].id,
          subjectId: englishSubject[0].id,
          weekId: week2[0].id,
          notes: "Focus on reading comprehension and grammar"
        }).returning();
        
        // Add daily plans for math
        const days = [1, 2, 3, 4, 5]; // Monday to Friday
        
        for (const day of days) {
          // Math daily plans (standard subject)
          await tx.insert(schema.dailyPlans).values({
            weeklyPlanId: mathWeeklyPlan[0].id,
            dayOfWeek: day,
            topic: day === 1 ? "Introduction to Fractions" : 
                  day === 2 ? "Adding Fractions" : 
                  day === 3 ? "Subtracting Fractions" : 
                  day === 4 ? "Introduction to Decimals" :
                  "Converting Fractions to Decimals",
            booksAndPages: `Textbook pages ${40 + day * 2}-${40 + day * 2 + 1}`,
            homework: day === 2 || day === 4 ? `Worksheet ${day}` : null,
            homeworkDueDate: day === 2 ? "2024-04-19" : day === 4 ? "2024-04-23" : null,
            assignments: day === 5 ? "Quiz on fractions and decimals" : null
          });
          
          // English daily plans (standard subject)
          await tx.insert(schema.dailyPlans).values({
            weeklyPlanId: englishWeeklyPlan[0].id,
            dayOfWeek: day,
            topic: day === 1 ? "Reading Comprehension: Main Idea" : 
                  day === 2 ? "Grammar: Verb Tenses" : 
                  day === 3 ? "Vocabulary Development" : 
                  day === 4 ? "Writing: Paragraph Structure" :
                  "Literature Analysis",
            booksAndPages: `Language Arts textbook pages ${70 + day * 2}-${70 + day * 2 + 1}`,
            homework: day === 1 || day === 3 ? `Complete exercises ${day}` : null,
            homeworkDueDate: day === 1 ? "2024-04-18" : day === 3 ? "2024-04-22" : null,
            assignments: day === 5 ? "Writing assignment: Personal narrative" : null
          });
        }
      });
      
      console.log('Initial data seeded successfully.');
    }
  }

  // User Management

  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return results[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return results[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    // Hash password if provided
    const userData = { ...user };
    if (userData.password) {
      userData.password = this.hashPassword(userData.password);
    }
    
    const result = await db.insert(schema.users).values(userData).returning();
    return result[0];
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    // Hash password if updated
    const updateData = { ...userData };
    if (updateData.password) {
      updateData.password = this.hashPassword(updateData.password);
    }
    
    const results = await db
      .update(schema.users)
      .set(updateData)
      .where(eq(schema.users.id, id))
      .returning();
      
    return results[0];
  }

  async deleteUser(id: number): Promise<boolean> {
    // Use transaction to ensure all related records are deleted
    return db.transaction(async (tx) => {
      // First delete all related records
      await tx.delete(schema.teacherSubjects).where(eq(schema.teacherSubjects.teacherId, id));
      await tx.delete(schema.teacherGrades).where(eq(schema.teacherGrades.teacherId, id));
      await tx.delete(schema.weeklyPlans).where(eq(schema.weeklyPlans.teacherId, id));
      
      // Then delete the user
      const result = await tx.delete(schema.users).where(eq(schema.users.id, id));
      return result.rowCount !== null && result.rowCount > 0;
    });
  }

  async listUsers(): Promise<User[]> {
    return db.select().from(schema.users);
  }

  async listTeachers(): Promise<User[]> {
    return db.select().from(schema.users).where(eq(schema.users.isAdmin, false));
  }

  async verifyUserCredentials(username: string, password: string): Promise<User | undefined> {
    const user = await this.getUserByUsername(username);
    if (user && this.verifyPassword(user.password, password)) {
      return user;
    }
    return undefined;
  }

  // Grade Management

  async createGrade(grade: InsertGrade): Promise<Grade> {
    const result = await db.insert(schema.grades).values(grade).returning();
    return result[0];
  }

  async getGrade(id: number): Promise<Grade | undefined> {
    const results = await db.select().from(schema.grades).where(eq(schema.grades.id, id));
    return results[0];
  }

  async listGrades(): Promise<Grade[]> {
    return db.select().from(schema.grades);
  }

  async updateGrade(id: number, grade: InsertGrade): Promise<Grade | undefined> {
    const results = await db
      .update(schema.grades)
      .set(grade)
      .where(eq(schema.grades.id, id))
      .returning();
      
    return results[0];
  }

  async deleteGrade(id: number): Promise<boolean> {
    // Use transaction to ensure all related records are deleted
    return db.transaction(async (tx) => {
      // First delete all related records
      await tx.delete(schema.teacherSubjects).where(eq(schema.teacherSubjects.gradeId, id));
      await tx.delete(schema.teacherGrades).where(eq(schema.teacherGrades.gradeId, id));
      await tx.delete(schema.weeklyPlans).where(eq(schema.weeklyPlans.gradeId, id));
      
      // Then delete the grade
      const result = await tx.delete(schema.grades).where(eq(schema.grades.id, id));
      return result.rowCount !== null && result.rowCount > 0;
    });
  }

  // Subject Management

  async createSubject(subject: InsertSubject): Promise<Subject> {
    const result = await db.insert(schema.subjects).values(subject).returning();
    return result[0];
  }

  async getSubject(id: number): Promise<Subject | undefined> {
    const results = await db.select().from(schema.subjects).where(eq(schema.subjects.id, id));
    return results[0];
  }

  async listSubjects(): Promise<Subject[]> {
    return db.select().from(schema.subjects);
  }

  async updateSubject(id: number, subject: InsertSubject): Promise<Subject | undefined> {
    const results = await db
      .update(schema.subjects)
      .set(subject)
      .where(eq(schema.subjects.id, id))
      .returning();
      
    return results[0];
  }

  async deleteSubject(id: number): Promise<boolean> {
    // Use transaction to ensure all related records are deleted
    return db.transaction(async (tx) => {
      // First delete all related records
      await tx.delete(schema.teacherSubjects).where(eq(schema.teacherSubjects.subjectId, id));
      await tx.delete(schema.weeklyPlans).where(eq(schema.weeklyPlans.subjectId, id));
      
      // Then delete the subject
      const result = await tx.delete(schema.subjects).where(eq(schema.subjects.id, id));
      return result.rowCount !== null && result.rowCount > 0;
    });
  }

  // Teacher-Grade Assignments

  async assignTeacherToGrade(assignment: InsertTeacherGrade): Promise<TeacherGrade> {
    // Create a new assignment without checking for existing ones
    // This allows teachers to be assigned to the same grade multiple times
    const result = await db.insert(schema.teacherGrades).values(assignment).returning();
    return result[0];
  }

  async removeTeacherFromGrade(teacherId: number, gradeId: number): Promise<boolean> {
    // Use transaction for atomicity
    return db.transaction(async (tx) => {
      // First delete related subject assignments
      await tx.delete(schema.teacherSubjects).where(
        and(
          eq(schema.teacherSubjects.teacherId, teacherId),
          eq(schema.teacherSubjects.gradeId, gradeId)
        )
      );
      
      // Then delete all matching grade assignments
      // The database can have multiple entries for the same teacher-grade pair now
      const result = await tx.delete(schema.teacherGrades).where(
        and(
          eq(schema.teacherGrades.teacherId, teacherId),
          eq(schema.teacherGrades.gradeId, gradeId)
        )
      );
      
      return hasRowsAffected(result);
    });
  }

  async getTeacherGrades(teacherId: number): Promise<Grade[]> {
    // Use a JOIN query with DISTINCT to get unique grades
    // This prevents duplicates when a teacher is assigned to the same grade multiple times
    const results = await db
      .select({
        id: schema.grades.id,
        name: schema.grades.name
      })
      .from(schema.teacherGrades)
      .innerJoin(schema.grades, eq(schema.teacherGrades.gradeId, schema.grades.id))
      .where(eq(schema.teacherGrades.teacherId, teacherId))
      .groupBy(schema.grades.id, schema.grades.name); // Group by to get unique values
      
    return results;
  }

  async getGradeTeachers(gradeId: number): Promise<User[]> {
    // Use a JOIN query with GROUP BY to get unique teachers
    // This prevents duplicates when a teacher is assigned to the same grade multiple times
    const results = await db
      .select({
        id: schema.users.id,
        username: schema.users.username,
        password: schema.users.password,
        fullName: schema.users.fullName,
        email: schema.users.email,
        isAdmin: schema.users.isAdmin
      })
      .from(schema.teacherGrades)
      .innerJoin(schema.users, eq(schema.teacherGrades.teacherId, schema.users.id))
      .where(eq(schema.teacherGrades.gradeId, gradeId))
      .groupBy(schema.users.id, schema.users.username, schema.users.password, 
                schema.users.fullName, schema.users.email, schema.users.isAdmin);
      
    return results;
  }

  // Teacher-Subject Assignments

  async assignTeacherToSubject(assignment: InsertTeacherSubject): Promise<TeacherSubject> {
    // First check if this teacher is already assigned to this subject for this grade
    const existingAssignment = await db
      .select()
      .from(schema.teacherSubjects)
      .where(
        and(
          eq(schema.teacherSubjects.teacherId, assignment.teacherId),
          eq(schema.teacherSubjects.gradeId, assignment.gradeId),
          eq(schema.teacherSubjects.subjectId, assignment.subjectId)
        )
      );
      
    // If already assigned, return the existing assignment
    if (existingAssignment.length > 0) {
      return existingAssignment[0];
    }
    
    // Otherwise create a new assignment
    const result = await db.insert(schema.teacherSubjects).values(assignment).returning();
    return result[0];
  }

  async removeTeacherFromSubject(teacherId: number, gradeId: number, subjectId: number): Promise<boolean> {
    const result = await db.delete(schema.teacherSubjects).where(
      and(
        eq(schema.teacherSubjects.teacherId, teacherId),
        eq(schema.teacherSubjects.gradeId, gradeId),
        eq(schema.teacherSubjects.subjectId, subjectId)
      )
    );
    
    return hasRowsAffected(result);
  }

  async getTeacherSubjectsForGrade(teacherId: number, gradeId: number): Promise<Subject[]> {
    // Use a JOIN query for better performance than separate queries
    const results = await db
      .select({
        id: schema.subjects.id,
        name: schema.subjects.name,
        type: schema.subjects.type
      })
      .from(schema.teacherSubjects)
      .innerJoin(schema.subjects, eq(schema.teacherSubjects.subjectId, schema.subjects.id))
      .where(
        and(
          eq(schema.teacherSubjects.teacherId, teacherId),
          eq(schema.teacherSubjects.gradeId, gradeId)
        )
      );
      
    return results;
  }

  // Planning Weeks

  async createPlanningWeek(week: InsertPlanningWeek): Promise<PlanningWeek> {
    // Convert Date objects to strings for database storage
    const dbWeek = {
      ...week,
      startDate: week.startDate instanceof Date ? week.startDate.toISOString().split('T')[0] : week.startDate,
      endDate: week.endDate instanceof Date ? week.endDate.toISOString().split('T')[0] : week.endDate
    };
    
    const result = await db.insert(schema.planningWeeks).values(dbWeek).returning();
    return result[0];
  }

  async getPlanningWeek(id: number): Promise<PlanningWeek | undefined> {
    const results = await db
      .select()
      .from(schema.planningWeeks)
      .where(eq(schema.planningWeeks.id, id));
      
    return results[0];
  }

  async listPlanningWeeks(): Promise<PlanningWeek[]> {
    return db
      .select()
      .from(schema.planningWeeks)
      .orderBy(schema.planningWeeks.year, schema.planningWeeks.weekNumber);
  }

  async listActivePlanningWeeks(): Promise<PlanningWeek[]> {
    return db
      .select()
      .from(schema.planningWeeks)
      .where(eq(schema.planningWeeks.isActive, true))
      .orderBy(schema.planningWeeks.year, schema.planningWeeks.weekNumber);
  }

  async updatePlanningWeek(id: number, weekData: Partial<InsertPlanningWeek>): Promise<PlanningWeek | undefined> {
    // Convert any Date objects to strings for database storage
    const dbWeekData: any = { ...weekData };
    
    if (weekData.startDate instanceof Date) {
      dbWeekData.startDate = weekData.startDate.toISOString().split('T')[0];
    }
    
    if (weekData.endDate instanceof Date) {
      dbWeekData.endDate = weekData.endDate.toISOString().split('T')[0];
    }
    
    const results = await db
      .update(schema.planningWeeks)
      .set(dbWeekData)
      .where(eq(schema.planningWeeks.id, id))
      .returning();
      
    return results[0];
  }

  async togglePlanningWeekActive(id: number): Promise<PlanningWeek | undefined> {
    // First get the current week to determine new state
    const week = await this.getPlanningWeek(id);
    if (!week) return undefined;
    
    // Toggle the isActive state
    const updatedWeek = await this.updatePlanningWeek(id, { isActive: !week.isActive });
    return updatedWeek;
  }

  async deletePlanningWeek(id: number): Promise<boolean> {
    // Use transaction to ensure all related records are deleted
    return db.transaction(async (tx) => {
      // Get all weekly plans for this week
      const weeklyPlans = await tx
        .select({ id: schema.weeklyPlans.id })
        .from(schema.weeklyPlans)
        .where(eq(schema.weeklyPlans.weekId, id));
      
      // Delete all daily plans for each weekly plan
      for (const plan of weeklyPlans) {
        await tx.delete(schema.dailyPlans).where(eq(schema.dailyPlans.weeklyPlanId, plan.id));
      }
      
      // Delete all weekly plans for this week
      await tx.delete(schema.weeklyPlans).where(eq(schema.weeklyPlans.weekId, id));
      
      // Delete the planning week
      const result = await tx.delete(schema.planningWeeks).where(eq(schema.planningWeeks.id, id));
      return hasRowsAffected(result);
    });
  }

  // Weekly Plans

  async createWeeklyPlan(plan: InsertWeeklyPlan): Promise<WeeklyPlan> {
    const result = await db.insert(schema.weeklyPlans).values(plan).returning();
    return result[0];
  }

  async getWeeklyPlan(id: number): Promise<WeeklyPlan | undefined> {
    const results = await db
      .select()
      .from(schema.weeklyPlans)
      .where(eq(schema.weeklyPlans.id, id));
      
    return results[0];
  }

  async listTeacherWeeklyPlans(teacherId: number): Promise<WeeklyPlan[]> {
    return db
      .select()
      .from(schema.weeklyPlans)
      .where(eq(schema.weeklyPlans.teacherId, teacherId))
      .orderBy(schema.weeklyPlans.id);
  }

  async listGradeWeekPlans(gradeId: number, weekId: number): Promise<WeeklyPlan[]> {
    return db
      .select()
      .from(schema.weeklyPlans)
      .where(
        and(
          eq(schema.weeklyPlans.gradeId, gradeId),
          eq(schema.weeklyPlans.weekId, weekId)
        )
      )
      .orderBy(schema.weeklyPlans.id);
  }

  async updateWeeklyPlanNotes(id: number, notes: string): Promise<WeeklyPlan | undefined> {
    const results = await db
      .update(schema.weeklyPlans)
      .set({ notes })
      .where(eq(schema.weeklyPlans.id, id))
      .returning();
      
    return results[0];
  }

  async getWeeklyPlanComplete(id: number): Promise<WeeklyPlanComplete | undefined> {
    // Get the weekly plan first
    const weeklyPlan = await this.getWeeklyPlan(id);
    if (!weeklyPlan) return undefined;
    
    // Use Promise.all for parallel queries to improve performance
    const [teacher, grade, subject, week, dailyPlans] = await Promise.all([
      this.getUser(weeklyPlan.teacherId),
      this.getGrade(weeklyPlan.gradeId),
      this.getSubject(weeklyPlan.subjectId),
      this.getPlanningWeek(weeklyPlan.weekId),
      this.listDailyPlansForWeeklyPlan(id)
    ]);
    
    if (!teacher || !grade || !subject || !week) {
      return undefined;
    }
    
    // Combine all data
    return {
      ...weeklyPlan,
      teacher,
      grade,
      subject,
      week,
      dailyPlans
    };
  }

  // Daily Plans

  async createDailyPlan(plan: InsertDailyPlan): Promise<DailyPlan> {
    // Convert any Date objects to strings for database storage
    const dbPlan: any = { ...plan };
    
    if (plan.homeworkDueDate instanceof Date) {
      dbPlan.homeworkDueDate = plan.homeworkDueDate.toISOString().split('T')[0];
    }
    
    const result = await db.insert(schema.dailyPlans).values(dbPlan).returning();
    return result[0];
  }

  async updateDailyPlan(id: number, planData: Partial<InsertDailyPlan>): Promise<DailyPlan | undefined> {
    // Convert any Date objects to strings for database storage
    const dbPlanData: any = { ...planData };
    
    if (planData.homeworkDueDate instanceof Date) {
      dbPlanData.homeworkDueDate = planData.homeworkDueDate.toISOString().split('T')[0];
    }
    
    const results = await db
      .update(schema.dailyPlans)
      .set(dbPlanData)
      .where(eq(schema.dailyPlans.id, id))
      .returning();
      
    return results[0];
  }

  async getDailyPlan(id: number): Promise<DailyPlan | undefined> {
    const results = await db
      .select()
      .from(schema.dailyPlans)
      .where(eq(schema.dailyPlans.id, id));
      
    return results[0];
  }

  async listDailyPlansForWeeklyPlan(weeklyPlanId: number): Promise<DailyPlan[]> {
    return db
      .select()
      .from(schema.dailyPlans)
      .where(eq(schema.dailyPlans.weeklyPlanId, weeklyPlanId))
      .orderBy(schema.dailyPlans.dayOfWeek);
  }
}