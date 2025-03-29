import crypto from 'crypto';
import {
  User, InsertUser, Grade, InsertGrade, Subject, InsertSubject,
  TeacherGrade, InsertTeacherGrade, TeacherSubject, InsertTeacherSubject, 
  PlanningWeek, InsertPlanningWeek, WeeklyPlan, InsertWeeklyPlan,
  DailyPlan, InsertDailyPlan, WeeklyPlanComplete
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User Management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  listUsers(): Promise<User[]>;
  listTeachers(): Promise<User[]>;
  verifyUserCredentials(username: string, password: string): Promise<User | undefined>;
  
  // Grade Management
  createGrade(grade: InsertGrade): Promise<Grade>;
  getGrade(id: number): Promise<Grade | undefined>;
  listGrades(): Promise<Grade[]>;
  updateGrade(id: number, grade: InsertGrade): Promise<Grade | undefined>;
  deleteGrade(id: number): Promise<boolean>;
  
  // Subject Management
  createSubject(subject: InsertSubject): Promise<Subject>;
  getSubject(id: number): Promise<Subject | undefined>;
  listSubjects(): Promise<Subject[]>;
  updateSubject(id: number, subject: InsertSubject): Promise<Subject | undefined>;
  deleteSubject(id: number): Promise<boolean>;
  
  // Teacher-Grade Assignments
  assignTeacherToGrade(assignment: InsertTeacherGrade): Promise<TeacherGrade>;
  removeTeacherFromGrade(teacherId: number, gradeId: number): Promise<boolean>;
  getTeacherGrades(teacherId: number): Promise<Grade[]>;
  getGradeTeachers(gradeId: number): Promise<User[]>;
  
  // Teacher-Subject Assignments
  assignTeacherToSubject(assignment: InsertTeacherSubject): Promise<TeacherSubject>;
  removeTeacherFromSubject(teacherId: number, gradeId: number, subjectId: number): Promise<boolean>;
  getTeacherSubjectsForGrade(teacherId: number, gradeId: number): Promise<Subject[]>;
  
  // Planning Weeks
  createPlanningWeek(week: InsertPlanningWeek): Promise<PlanningWeek>;
  getPlanningWeek(id: number): Promise<PlanningWeek | undefined>;
  listPlanningWeeks(): Promise<PlanningWeek[]>;
  listActivePlanningWeeks(): Promise<PlanningWeek[]>;
  updatePlanningWeek(id: number, week: Partial<InsertPlanningWeek>): Promise<PlanningWeek | undefined>;
  togglePlanningWeekActive(id: number): Promise<PlanningWeek | undefined>;
  deletePlanningWeek(id: number): Promise<boolean>;
  
  // Weekly Plans
  createWeeklyPlan(plan: InsertWeeklyPlan): Promise<WeeklyPlan>;
  getWeeklyPlan(id: number): Promise<WeeklyPlan | undefined>;
  listTeacherWeeklyPlans(teacherId: number): Promise<WeeklyPlan[]>;
  listGradeWeekPlans(gradeId: number, weekId: number): Promise<WeeklyPlan[]>;
  updateWeeklyPlanNotes(id: number, notes: string): Promise<WeeklyPlan | undefined>;
  getWeeklyPlanComplete(id: number): Promise<WeeklyPlanComplete | undefined>;
  
  // Daily Plans
  createDailyPlan(plan: InsertDailyPlan): Promise<DailyPlan>;
  updateDailyPlan(id: number, plan: Partial<InsertDailyPlan>): Promise<DailyPlan | undefined>;
  getDailyPlan(id: number): Promise<DailyPlan | undefined>;
  listDailyPlansForWeeklyPlan(weeklyPlanId: number): Promise<DailyPlan[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private grades: Map<number, Grade>;
  private subjects: Map<number, Subject>;
  private teacherGrades: Map<number, TeacherGrade>;
  private teacherSubjects: Map<number, TeacherSubject>;
  private planningWeeks: Map<number, PlanningWeek>;
  private weeklyPlans: Map<number, WeeklyPlan>;
  private dailyPlans: Map<number, DailyPlan>;
  
  private userId: number;
  private gradeId: number;
  private subjectId: number;
  private teacherGradeId: number;
  private teacherSubjectId: number;
  private planningWeekId: number;
  private weeklyPlanId: number;
  private dailyPlanId: number;

  constructor() {
    this.users = new Map();
    this.grades = new Map();
    this.subjects = new Map();
    this.teacherGrades = new Map();
    this.teacherSubjects = new Map();
    this.planningWeeks = new Map();
    this.weeklyPlans = new Map();
    this.dailyPlans = new Map();
    
    this.userId = 1;
    this.gradeId = 1;
    this.subjectId = 1;
    this.teacherGradeId = 1;
    this.teacherSubjectId = 1;
    this.planningWeekId = 1;
    this.weeklyPlanId = 1;
    this.dailyPlanId = 1;
    
    // Initialize with admin user
    this.createUser({
      username: 'admin',
      password: this.hashPassword('admin123'),
      fullName: 'System Administrator',
      isAdmin: true
    });
    
    // Initialize with some sample data for testing
    this.seedInitialData();
  }

  private hashPassword(plainPassword: string): string {
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

  private seedInitialData() {
    // Create some sample grades
    const grade1 = this.createGrade({ name: 'Grade 1' });
    const grade2 = this.createGrade({ name: 'Grade 2' });
    const grade3 = this.createGrade({ name: 'Grade 3' });
    
    // Create some sample subjects
    const mathSubject = this.createSubject({ name: 'Mathematics', type: 'standard' });
    const scienceSubject = this.createSubject({ name: 'Science', type: 'standard' });
    const englishSubject = this.createSubject({ name: 'English', type: 'standard' });
    const artSubject = this.createSubject({ name: 'Art', type: 'art' });
    const peSubject = this.createSubject({ name: 'PE', type: 'pe' });
    
    // Create a sample teacher
    const teacher = this.createUser({
      username: 'teacher',
      password: this.hashPassword('teacher123'),
      fullName: 'John Smith',
      isAdmin: false
    });
    
    // Assign teacher to grade
    this.assignTeacherToGrade({ teacherId: teacher.id, gradeId: grade3.id });
    
    // Assign teacher to subjects within grade
    this.assignTeacherToSubject({ teacherId: teacher.id, gradeId: grade3.id, subjectId: mathSubject.id });
    this.assignTeacherToSubject({ teacherId: teacher.id, gradeId: grade3.id, subjectId: scienceSubject.id });
    
    // Create sample planning weeks
    const week1 = this.createPlanningWeek({
      weekNumber: 15,
      year: 2024,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-01-19'),
      isActive: true
    });
    
    const week2 = this.createPlanningWeek({
      weekNumber: 16,
      year: 2024,
      startDate: new Date('2024-01-22'),
      endDate: new Date('2024-01-26'),
      isActive: true
    });
  }

  // User Management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser: User = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async listTeachers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => !user.isAdmin);
  }

  async verifyUserCredentials(username: string, password: string): Promise<User | undefined> {
    const user = await this.getUserByUsername(username);
    if (!user) return undefined;
    
    if (this.verifyPassword(user.password, password)) {
      return user;
    }
    
    return undefined;
  }

  // Grade Management
  async createGrade(grade: InsertGrade): Promise<Grade> {
    const id = this.gradeId++;
    const newGrade: Grade = { ...grade, id };
    this.grades.set(id, newGrade);
    return newGrade;
  }

  async getGrade(id: number): Promise<Grade | undefined> {
    return this.grades.get(id);
  }

  async listGrades(): Promise<Grade[]> {
    return Array.from(this.grades.values());
  }

  async updateGrade(id: number, grade: InsertGrade): Promise<Grade | undefined> {
    const existingGrade = await this.getGrade(id);
    if (!existingGrade) return undefined;
    
    const updatedGrade: Grade = { ...existingGrade, ...grade };
    this.grades.set(id, updatedGrade);
    return updatedGrade;
  }

  async deleteGrade(id: number): Promise<boolean> {
    return this.grades.delete(id);
  }

  // Subject Management
  async createSubject(subject: InsertSubject): Promise<Subject> {
    const id = this.subjectId++;
    const newSubject: Subject = { ...subject, id };
    this.subjects.set(id, newSubject);
    return newSubject;
  }

  async getSubject(id: number): Promise<Subject | undefined> {
    return this.subjects.get(id);
  }

  async listSubjects(): Promise<Subject[]> {
    return Array.from(this.subjects.values());
  }

  async updateSubject(id: number, subject: InsertSubject): Promise<Subject | undefined> {
    const existingSubject = await this.getSubject(id);
    if (!existingSubject) return undefined;
    
    const updatedSubject: Subject = { ...existingSubject, ...subject };
    this.subjects.set(id, updatedSubject);
    return updatedSubject;
  }

  async deleteSubject(id: number): Promise<boolean> {
    return this.subjects.delete(id);
  }

  // Teacher-Grade Assignments
  async assignTeacherToGrade(assignment: InsertTeacherGrade): Promise<TeacherGrade> {
    // Check if assignment already exists
    for (const tg of this.teacherGrades.values()) {
      if (tg.teacherId === assignment.teacherId && tg.gradeId === assignment.gradeId) {
        return tg;
      }
    }
    
    const id = this.teacherGradeId++;
    const newAssignment: TeacherGrade = { ...assignment, id };
    this.teacherGrades.set(id, newAssignment);
    return newAssignment;
  }

  async removeTeacherFromGrade(teacherId: number, gradeId: number): Promise<boolean> {
    for (const [id, tg] of this.teacherGrades.entries()) {
      if (tg.teacherId === teacherId && tg.gradeId === gradeId) {
        return this.teacherGrades.delete(id);
      }
    }
    return false;
  }

  async getTeacherGrades(teacherId: number): Promise<Grade[]> {
    const gradeIds = Array.from(this.teacherGrades.values())
      .filter(tg => tg.teacherId === teacherId)
      .map(tg => tg.gradeId);
    
    return Promise.all(gradeIds.map(id => this.getGrade(id)))
      .then(grades => grades.filter((g): g is Grade => g !== undefined));
  }

  async getGradeTeachers(gradeId: number): Promise<User[]> {
    const teacherIds = Array.from(this.teacherGrades.values())
      .filter(tg => tg.gradeId === gradeId)
      .map(tg => tg.teacherId);
    
    return Promise.all(teacherIds.map(id => this.getUser(id)))
      .then(users => users.filter((u): u is User => u !== undefined));
  }

  // Teacher-Subject Assignments
  async assignTeacherToSubject(assignment: InsertTeacherSubject): Promise<TeacherSubject> {
    // Check if assignment already exists
    for (const ts of this.teacherSubjects.values()) {
      if (ts.teacherId === assignment.teacherId && 
          ts.gradeId === assignment.gradeId && 
          ts.subjectId === assignment.subjectId) {
        return ts;
      }
    }
    
    const id = this.teacherSubjectId++;
    const newAssignment: TeacherSubject = { ...assignment, id };
    this.teacherSubjects.set(id, newAssignment);
    return newAssignment;
  }

  async removeTeacherFromSubject(teacherId: number, gradeId: number, subjectId: number): Promise<boolean> {
    for (const [id, ts] of this.teacherSubjects.entries()) {
      if (ts.teacherId === teacherId && ts.gradeId === gradeId && ts.subjectId === subjectId) {
        return this.teacherSubjects.delete(id);
      }
    }
    return false;
  }

  async getTeacherSubjectsForGrade(teacherId: number, gradeId: number): Promise<Subject[]> {
    const subjectIds = Array.from(this.teacherSubjects.values())
      .filter(ts => ts.teacherId === teacherId && ts.gradeId === gradeId)
      .map(ts => ts.subjectId);
    
    return Promise.all(subjectIds.map(id => this.getSubject(id)))
      .then(subjects => subjects.filter((s): s is Subject => s !== undefined));
  }

  // Planning Weeks
  async createPlanningWeek(week: InsertPlanningWeek): Promise<PlanningWeek> {
    const id = this.planningWeekId++;
    const newWeek: PlanningWeek = { ...week, id };
    this.planningWeeks.set(id, newWeek);
    return newWeek;
  }

  async getPlanningWeek(id: number): Promise<PlanningWeek | undefined> {
    return this.planningWeeks.get(id);
  }

  async listPlanningWeeks(): Promise<PlanningWeek[]> {
    return Array.from(this.planningWeeks.values())
      .sort((a, b) => {
        // Sort by year (descending) and then by week number (descending)
        if (a.year !== b.year) return b.year - a.year;
        return b.weekNumber - a.weekNumber;
      });
  }

  async listActivePlanningWeeks(): Promise<PlanningWeek[]> {
    return (await this.listPlanningWeeks()).filter(week => week.isActive);
  }

  async updatePlanningWeek(id: number, weekData: Partial<InsertPlanningWeek>): Promise<PlanningWeek | undefined> {
    const week = await this.getPlanningWeek(id);
    if (!week) return undefined;
    
    const updatedWeek: PlanningWeek = { ...week, ...weekData };
    this.planningWeeks.set(id, updatedWeek);
    return updatedWeek;
  }

  async togglePlanningWeekActive(id: number): Promise<PlanningWeek | undefined> {
    const week = await this.getPlanningWeek(id);
    if (!week) return undefined;
    
    const updatedWeek: PlanningWeek = { ...week, isActive: !week.isActive };
    this.planningWeeks.set(id, updatedWeek);
    return updatedWeek;
  }

  async deletePlanningWeek(id: number): Promise<boolean> {
    return this.planningWeeks.delete(id);
  }

  // Weekly Plans
  async createWeeklyPlan(plan: InsertWeeklyPlan): Promise<WeeklyPlan> {
    const id = this.weeklyPlanId++;
    const now = new Date();
    const newPlan: WeeklyPlan = { 
      ...plan, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.weeklyPlans.set(id, newPlan);
    return newPlan;
  }

  async getWeeklyPlan(id: number): Promise<WeeklyPlan | undefined> {
    return this.weeklyPlans.get(id);
  }

  async listTeacherWeeklyPlans(teacherId: number): Promise<WeeklyPlan[]> {
    return Array.from(this.weeklyPlans.values())
      .filter(plan => plan.teacherId === teacherId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async listGradeWeekPlans(gradeId: number, weekId: number): Promise<WeeklyPlan[]> {
    return Array.from(this.weeklyPlans.values())
      .filter(plan => plan.gradeId === gradeId && plan.weekId === weekId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async updateWeeklyPlanNotes(id: number, notes: string): Promise<WeeklyPlan | undefined> {
    const plan = await this.getWeeklyPlan(id);
    if (!plan) return undefined;
    
    const updatedPlan: WeeklyPlan = { 
      ...plan, 
      notes, 
      updatedAt: new Date() 
    };
    this.weeklyPlans.set(id, updatedPlan);
    return updatedPlan;
  }

  async getWeeklyPlanComplete(id: number): Promise<WeeklyPlanComplete | undefined> {
    const plan = await this.getWeeklyPlan(id);
    if (!plan) return undefined;
    
    const [teacher, grade, subject, week, dailyPlans] = await Promise.all([
      this.getUser(plan.teacherId),
      this.getGrade(plan.gradeId),
      this.getSubject(plan.subjectId),
      this.getPlanningWeek(plan.weekId),
      this.listDailyPlansForWeeklyPlan(plan.id)
    ]);
    
    if (!teacher || !grade || !subject || !week) return undefined;
    
    return {
      ...plan,
      teacher,
      grade,
      subject,
      week,
      dailyPlans
    };
  }

  // Daily Plans
  async createDailyPlan(plan: InsertDailyPlan): Promise<DailyPlan> {
    const id = this.dailyPlanId++;
    const newPlan: DailyPlan = { ...plan, id };
    this.dailyPlans.set(id, newPlan);
    return newPlan;
  }

  async updateDailyPlan(id: number, planData: Partial<InsertDailyPlan>): Promise<DailyPlan | undefined> {
    const plan = await this.getDailyPlan(id);
    if (!plan) return undefined;
    
    const updatedPlan: DailyPlan = { ...plan, ...planData };
    this.dailyPlans.set(id, updatedPlan);
    return updatedPlan;
  }

  async getDailyPlan(id: number): Promise<DailyPlan | undefined> {
    return this.dailyPlans.get(id);
  }

  async listDailyPlansForWeeklyPlan(weeklyPlanId: number): Promise<DailyPlan[]> {
    return Array.from(this.dailyPlans.values())
      .filter(plan => plan.weeklyPlanId === weeklyPlanId)
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  }
}

export const storage = new MemStorage();
