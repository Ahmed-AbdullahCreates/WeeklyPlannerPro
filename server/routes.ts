import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import express from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { z } from 'zod';
import { 
  insertUserSchema, userAuthSchema, userRoleSchema, insertGradeSchema, 
  insertSubjectSchema, insertTeacherGradeSchema, insertTeacherSubjectSchema,
  insertPlanningWeekSchema, insertWeeklyPlanSchema, insertDailyPlanSchema
} from '@shared/schema';

const MemoryStoreSession = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'weekly-scheduler-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 86400000, // 24 hours
      httpOnly: true,
      sameSite: 'lax'
    },
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // 24hrs
    })
  }));

  // Set up passport authentication
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport local strategy
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.verifyUserCredentials(username, password);
      if (!user) {
        return done(null, false, { message: 'Invalid username or password' });
      }
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));

  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: 'Unauthorized' });
  };

  // Middleware to check if user is admin
  const isAdmin = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated() && req.user && (req.user as any).isAdmin) {
      return next();
    }
    res.status(403).json({ message: 'Forbidden' });
  };

  // Authentication Routes
  app.post('/api/login', (req, res, next) => {
    try {
      const parsed = userAuthSchema.parse(req.body);
      
      passport.authenticate('local', (err: any, user: any, info: any) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ message: info.message || 'Invalid credentials' });
        
        req.logIn(user, (err) => {
          if (err) return next(err);
          return res.json({
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            isAdmin: user.isAdmin
          });
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });

  app.post('/api/logout', (req, res) => {
    req.logout(() => {
      res.json({ message: 'Logged out successfully' });
    });
  });

  app.get('/api/user', isAuthenticated, (req, res) => {
    const user = req.user as any;
    res.json({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      isAdmin: user.isAdmin
    });
  });

  // User Management Routes
  app.post('/api/register', isAdmin, async (req, res, next) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      const user = await storage.createUser(userData);
      
      res.status(201).json({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        isAdmin: user.isAdmin
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });

  app.get('/api/users', isAdmin, async (req, res) => {
    const users = await storage.listUsers();
    res.json(users.map(user => ({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      isAdmin: user.isAdmin
    })));
  });

  app.get('/api/teachers', isAdmin, async (req, res) => {
    const teachers = await storage.listTeachers();
    res.json(teachers.map(teacher => ({
      id: teacher.id,
      username: teacher.username,
      fullName: teacher.fullName,
      isAdmin: teacher.isAdmin
    })));
  });

  app.delete('/api/users/:id', isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      
      // Prevent deleting your own account
      if (id === (req.user as any).id) {
        return res.status(400).json({ message: 'You cannot delete your own account' });
      }
      
      const success = await storage.deleteUser(id);
      if (success) {
        return res.json({ message: 'User deleted successfully' });
      }
      res.status(404).json({ message: 'User not found' });
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/users/:id/role', isAdmin, async (req, res, next) => {
    try {
      const { userId, isAdmin } = userRoleSchema.parse({
        userId: parseInt(req.params.id, 10),
        isAdmin: req.body.isAdmin
      });
      
      // Prevent modifying your own admin status
      if (userId === (req.user as any).id) {
        return res.status(400).json({ message: 'You cannot modify your own admin status' });
      }
      
      const updatedUser = await storage.updateUser(userId, { isAdmin });
      if (updatedUser) {
        return res.json({
          id: updatedUser.id,
          username: updatedUser.username,
          fullName: updatedUser.fullName,
          isAdmin: updatedUser.isAdmin
        });
      }
      res.status(404).json({ message: 'User not found' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });

  app.patch('/api/users/:id', isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const currentUser = req.user as any;
      
      // Allow users to update only their own profile unless they are admin
      if (id !== currentUser.id && !currentUser.isAdmin) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      // Only allow updating fullName for now
      const updateData = { fullName: req.body.fullName };
      
      const updatedUser = await storage.updateUser(id, updateData);
      if (updatedUser) {
        return res.json({
          id: updatedUser.id,
          username: updatedUser.username,
          fullName: updatedUser.fullName,
          isAdmin: updatedUser.isAdmin
        });
      }
      res.status(404).json({ message: 'User not found' });
    } catch (error) {
      next(error);
    }
  });

  // Grade Management Routes
  app.get('/api/grades', isAuthenticated, async (req, res) => {
    const grades = await storage.listGrades();
    res.json(grades);
  });

  app.post('/api/grades', isAdmin, async (req, res, next) => {
    try {
      const gradeData = insertGradeSchema.parse(req.body);
      const grade = await storage.createGrade(gradeData);
      res.status(201).json(grade);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });

  app.put('/api/grades/:id', isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const gradeData = insertGradeSchema.parse(req.body);
      
      const updatedGrade = await storage.updateGrade(id, gradeData);
      if (updatedGrade) {
        return res.json(updatedGrade);
      }
      res.status(404).json({ message: 'Grade not found' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });

  app.delete('/api/grades/:id', isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await storage.deleteGrade(id);
      if (success) {
        return res.json({ message: 'Grade deleted successfully' });
      }
      res.status(404).json({ message: 'Grade not found' });
    } catch (error) {
      next(error);
    }
  });

  // Subject Management Routes
  app.get('/api/subjects', isAuthenticated, async (req, res) => {
    const subjects = await storage.listSubjects();
    res.json(subjects);
  });

  app.post('/api/subjects', isAdmin, async (req, res, next) => {
    try {
      const subjectData = insertSubjectSchema.parse(req.body);
      const subject = await storage.createSubject(subjectData);
      res.status(201).json(subject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });

  app.put('/api/subjects/:id', isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const subjectData = insertSubjectSchema.parse(req.body);
      
      const updatedSubject = await storage.updateSubject(id, subjectData);
      if (updatedSubject) {
        return res.json(updatedSubject);
      }
      res.status(404).json({ message: 'Subject not found' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });

  app.delete('/api/subjects/:id', isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await storage.deleteSubject(id);
      if (success) {
        return res.json({ message: 'Subject deleted successfully' });
      }
      res.status(404).json({ message: 'Subject not found' });
    } catch (error) {
      next(error);
    }
  });

  // Teacher Assignment Routes
  app.post('/api/teacher-grades', isAdmin, async (req, res, next) => {
    try {
      const assignmentData = insertTeacherGradeSchema.parse(req.body);
      const assignment = await storage.assignTeacherToGrade(assignmentData);
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });

  app.delete('/api/teacher-grades/:teacherId/:gradeId', isAdmin, async (req, res, next) => {
    try {
      const teacherId = parseInt(req.params.teacherId, 10);
      const gradeId = parseInt(req.params.gradeId, 10);
      
      const success = await storage.removeTeacherFromGrade(teacherId, gradeId);
      if (success) {
        return res.json({ message: 'Teacher removed from grade successfully' });
      }
      res.status(404).json({ message: 'Assignment not found' });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/teacher-grades/:teacherId', isAuthenticated, async (req, res, next) => {
    try {
      const teacherId = parseInt(req.params.teacherId, 10);
      const currentUser = req.user as any;
      
      // Make sure users can only access their own assignments unless they are admin
      if (teacherId !== currentUser.id && !currentUser.isAdmin) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const grades = await storage.getTeacherGrades(teacherId);
      res.json(grades);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/grade-teachers/:gradeId', isAdmin, async (req, res, next) => {
    try {
      const gradeId = parseInt(req.params.gradeId, 10);
      const teachers = await storage.getGradeTeachers(gradeId);
      res.json(teachers.map(teacher => ({
        id: teacher.id,
        username: teacher.username,
        fullName: teacher.fullName
      })));
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/teacher-subjects', isAdmin, async (req, res, next) => {
    try {
      const assignmentData = insertTeacherSubjectSchema.parse(req.body);
      const assignment = await storage.assignTeacherToSubject(assignmentData);
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });

  app.delete('/api/teacher-subjects/:teacherId/:gradeId/:subjectId', isAdmin, async (req, res, next) => {
    try {
      const teacherId = parseInt(req.params.teacherId, 10);
      const gradeId = parseInt(req.params.gradeId, 10);
      const subjectId = parseInt(req.params.subjectId, 10);
      
      const success = await storage.removeTeacherFromSubject(teacherId, gradeId, subjectId);
      if (success) {
        return res.json({ message: 'Teacher removed from subject successfully' });
      }
      res.status(404).json({ message: 'Assignment not found' });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/teacher-subjects/:teacherId/:gradeId', isAuthenticated, async (req, res, next) => {
    try {
      const teacherId = parseInt(req.params.teacherId, 10);
      const gradeId = parseInt(req.params.gradeId, 10);
      const currentUser = req.user as any;
      
      // Make sure users can only access their own assignments unless they are admin
      if (teacherId !== currentUser.id && !currentUser.isAdmin) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const subjects = await storage.getTeacherSubjectsForGrade(teacherId, gradeId);
      res.json(subjects);
    } catch (error) {
      next(error);
    }
  });

  // Planning Week Routes
  app.get('/api/planning-weeks', isAuthenticated, async (req, res) => {
    const weeks = await storage.listPlanningWeeks();
    res.json(weeks);
  });

  app.get('/api/planning-weeks/active', isAuthenticated, async (req, res) => {
    const weeks = await storage.listActivePlanningWeeks();
    res.json(weeks);
  });

  app.post('/api/planning-weeks', isAdmin, async (req, res, next) => {
    try {
      const weekData = insertPlanningWeekSchema.parse(req.body);
      const week = await storage.createPlanningWeek(weekData);
      res.status(201).json(week);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });

  app.put('/api/planning-weeks/:id/toggle', isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const updatedWeek = await storage.togglePlanningWeekActive(id);
      if (updatedWeek) {
        return res.json(updatedWeek);
      }
      res.status(404).json({ message: 'Planning week not found' });
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/planning-weeks/:id', isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await storage.deletePlanningWeek(id);
      if (success) {
        return res.json({ message: 'Planning week deleted successfully' });
      }
      res.status(404).json({ message: 'Planning week not found' });
    } catch (error) {
      next(error);
    }
  });

  // Weekly Plan Routes
  app.post('/api/weekly-plans', isAuthenticated, async (req, res, next) => {
    try {
      const planData = insertWeeklyPlanSchema.parse({
        ...req.body,
        teacherId: (req.user as any).id, // Always use the authenticated user's ID
      });
      
      // Verify the teacher is assigned to this grade and subject
      const subjectsForGrade = await storage.getTeacherSubjectsForGrade(planData.teacherId, planData.gradeId);
      const hasSubject = subjectsForGrade.some(subject => subject.id === planData.subjectId);
      
      if (!hasSubject) {
        return res.status(403).json({ message: 'You are not assigned to teach this subject in this grade' });
      }
      
      // Verify the planning week is active
      const week = await storage.getPlanningWeek(planData.weekId);
      if (!week || !week.isActive) {
        return res.status(400).json({ message: 'The selected planning week is not active' });
      }
      
      // Check if a plan already exists
      const existingPlans = await storage.listGradeWeekPlans(planData.gradeId, planData.weekId);
      const duplicatePlan = existingPlans.find(p => 
        p.teacherId === planData.teacherId && 
        p.subjectId === planData.subjectId
      );
      
      if (duplicatePlan) {
        return res.status(400).json({ message: 'A plan for this subject in this week already exists' });
      }
      
      const plan = await storage.createWeeklyPlan(planData);
      res.status(201).json(plan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });

  app.get('/api/weekly-plans/teacher/:teacherId', isAuthenticated, async (req, res, next) => {
    try {
      const teacherId = parseInt(req.params.teacherId, 10);
      const currentUser = req.user as any;
      
      // Make sure users can only access their own plans unless they are admin
      if (teacherId !== currentUser.id && !currentUser.isAdmin) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const plans = await storage.listTeacherWeeklyPlans(teacherId);
      res.json(plans);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/weekly-plans/grade/:gradeId/week/:weekId', isAuthenticated, async (req, res, next) => {
    try {
      const gradeId = parseInt(req.params.gradeId, 10);
      const weekId = parseInt(req.params.weekId, 10);
      
      const plans = await storage.listGradeWeekPlans(gradeId, weekId);
      res.json(plans);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/weekly-plans/:id', isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const plan = await storage.getWeeklyPlan(id);
      
      if (!plan) {
        return res.status(404).json({ message: 'Weekly plan not found' });
      }
      
      const currentUser = req.user as any;
      
      // Make sure users can only access their own plans unless they are admin
      if (plan.teacherId !== currentUser.id && !currentUser.isAdmin) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      res.json(plan);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/weekly-plans/:id/complete', isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const plan = await storage.getWeeklyPlanComplete(id);
      
      if (!plan) {
        return res.status(404).json({ message: 'Weekly plan not found' });
      }
      
      const currentUser = req.user as any;
      
      // Make sure users can only access their own plans unless they are admin
      if (plan.teacherId !== currentUser.id && !currentUser.isAdmin) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      res.json(plan);
    } catch (error) {
      next(error);
    }
  });

  app.put('/api/weekly-plans/:id/notes', isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const plan = await storage.getWeeklyPlan(id);
      
      if (!plan) {
        return res.status(404).json({ message: 'Weekly plan not found' });
      }
      
      const currentUser = req.user as any;
      
      // Make sure users can only update their own plans unless they are admin
      if (plan.teacherId !== currentUser.id && !currentUser.isAdmin) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const notes = req.body.notes || '';
      const updatedPlan = await storage.updateWeeklyPlanNotes(id, notes);
      
      res.json(updatedPlan);
    } catch (error) {
      next(error);
    }
  });

  // Daily Plan Routes
  app.post('/api/daily-plans', isAuthenticated, async (req, res, next) => {
    try {
      const planData = insertDailyPlanSchema.parse(req.body);
      
      // Verify the weekly plan exists and user has permission
      const weeklyPlan = await storage.getWeeklyPlan(planData.weeklyPlanId);
      if (!weeklyPlan) {
        return res.status(404).json({ message: 'Weekly plan not found' });
      }
      
      const currentUser = req.user as any;
      
      // Make sure users can only add to their own plans unless they are admin
      if (weeklyPlan.teacherId !== currentUser.id && !currentUser.isAdmin) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      // Check if a plan for this day already exists
      const existingDailyPlans = await storage.listDailyPlansForWeeklyPlan(planData.weeklyPlanId);
      const duplicatePlan = existingDailyPlans.find(p => p.dayOfWeek === planData.dayOfWeek);
      
      if (duplicatePlan) {
        return res.status(400).json({ message: 'A plan for this day already exists' });
      }
      
      const plan = await storage.createDailyPlan(planData);
      res.status(201).json(plan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });

  app.put('/api/daily-plans/:id', isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const dailyPlan = await storage.getDailyPlan(id);
      
      if (!dailyPlan) {
        return res.status(404).json({ message: 'Daily plan not found' });
      }
      
      // Verify the weekly plan exists and user has permission
      const weeklyPlan = await storage.getWeeklyPlan(dailyPlan.weeklyPlanId);
      if (!weeklyPlan) {
        return res.status(404).json({ message: 'Weekly plan not found' });
      }
      
      const currentUser = req.user as any;
      
      // Make sure users can only update their own plans unless they are admin
      if (weeklyPlan.teacherId !== currentUser.id && !currentUser.isAdmin) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      // Parse and validate the update data
      const planData = insertDailyPlanSchema.partial().parse(req.body);
      
      // If changing day of week, check for duplicates
      if (planData.dayOfWeek && planData.dayOfWeek !== dailyPlan.dayOfWeek) {
        const existingDailyPlans = await storage.listDailyPlansForWeeklyPlan(dailyPlan.weeklyPlanId);
        const duplicatePlan = existingDailyPlans.find(p => 
          p.id !== id && p.dayOfWeek === planData.dayOfWeek
        );
        
        if (duplicatePlan) {
          return res.status(400).json({ message: 'A plan for this day already exists' });
        }
      }
      
      const updatedPlan = await storage.updateDailyPlan(id, planData);
      res.json(updatedPlan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      next(error);
    }
  });

  app.get('/api/daily-plans/weekly/:weeklyPlanId', isAuthenticated, async (req, res, next) => {
    try {
      const weeklyPlanId = parseInt(req.params.weeklyPlanId, 10);
      
      // Verify the weekly plan exists and user has permission
      const weeklyPlan = await storage.getWeeklyPlan(weeklyPlanId);
      if (!weeklyPlan) {
        return res.status(404).json({ message: 'Weekly plan not found' });
      }
      
      const currentUser = req.user as any;
      
      // Make sure users can only access their own plans unless they are admin
      if (weeklyPlan.teacherId !== currentUser.id && !currentUser.isAdmin) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const plans = await storage.listDailyPlansForWeeklyPlan(weeklyPlanId);
      res.json(plans);
    } catch (error) {
      next(error);
    }
  });

  // Export Routes
  app.get('/api/weekly-plans/:id/export-pdf', isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const plan = await storage.getWeeklyPlanComplete(id);
      
      if (!plan) {
        return res.status(404).json({ message: 'Weekly plan not found' });
      }
      
      // We'll just return the plan data here since the PDF generation will be handled on the client side
      res.json({ 
        message: 'PDF export data', 
        plan 
      });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/weekly-plans/:id/export-excel', isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const plan = await storage.getWeeklyPlanComplete(id);
      
      if (!plan) {
        return res.status(404).json({ message: 'Weekly plan not found' });
      }
      
      // We'll just return the plan data here since the Excel generation will be handled on the client side
      res.json({ 
        message: 'Excel export data',
        plan 
      });
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
