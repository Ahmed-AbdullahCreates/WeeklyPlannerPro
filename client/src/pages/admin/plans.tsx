import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Eye, FileText, Plus, ArrowLeft, Calendar, Search, Filter, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WeeklyPlan, PlanningWeek, User, Grade, Subject } from "@shared/schema";
import { format } from "date-fns";

export default function AdminPlans() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGradeId, setFilterGradeId] = useState("");
  const [filterSubjectId, setFilterSubjectId] = useState("");
  const [filterWeekId, setFilterWeekId] = useState("");
  const [filterTeacherId, setFilterTeacherId] = useState("");
  
  // Fetch all weekly plans
  const { data: weeklyPlans = [], isLoading: isLoadingPlans } = useQuery<WeeklyPlan[]>({
    queryKey: ["/api/weekly-plans"],
  });
  
  // Fetch supporting data for filters and display
  const { data: teachers = [], isLoading: isLoadingTeachers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    select: (users) => users.filter(user => !user.isAdmin),
  });
  
  const { data: grades = [], isLoading: isLoadingGrades } = useQuery<Grade[]>({
    queryKey: ["/api/grades"],
  });
  
  const { data: subjects = [], isLoading: isLoadingSubjects } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });
  
  const { data: planningWeeks = [], isLoading: isLoadingWeeks } = useQuery<PlanningWeek[]>({
    queryKey: ["/api/planning-weeks"],
  });
  
  const isLoading = isLoadingPlans || isLoadingTeachers || isLoadingGrades || isLoadingSubjects || isLoadingWeeks;
  
  // Filter and sort the weekly plans
  const filteredPlans = weeklyPlans
    .filter(plan => {
      // Apply text search on teacher name, grade name, or subject name
      const teacher = teachers.find(t => t.id === plan.teacherId);
      const grade = grades.find(g => g.id === plan.gradeId);
      const subject = subjects.find(s => s.id === plan.subjectId);
      
      const searchString = `${teacher?.fullName || ""} ${grade?.name || ""} ${subject?.name || ""}`.toLowerCase();
      
      const matchesSearch = !searchTerm || searchString.includes(searchTerm.toLowerCase());
      const matchesGrade = !filterGradeId || plan.gradeId === parseInt(filterGradeId);
      const matchesSubject = !filterSubjectId || plan.subjectId === parseInt(filterSubjectId);
      const matchesWeek = !filterWeekId || plan.weekId === parseInt(filterWeekId);
      const matchesTeacher = !filterTeacherId || plan.teacherId === parseInt(filterTeacherId);
      
      return matchesSearch && matchesGrade && matchesSubject && matchesWeek && matchesTeacher;
    })
    .sort((a, b) => {
      // Sort by creation date, newest first
      if (!a.createdAt || !b.createdAt) return 0;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
  const clearFilters = () => {
    setSearchTerm("");
    setFilterGradeId("");
    setFilterSubjectId("");
    setFilterWeekId("");
    setFilterTeacherId("");
  };
  
  const hasActiveFilters = searchTerm || filterGradeId || filterSubjectId || filterWeekId || filterTeacherId;
  
  return (
    <PageWrapper title="All Weekly Plans">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/admin/dashboard")}
            className="gap-1 text-slate-600 mb-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Weekly Plans</h1>
          <p className="text-slate-600">
            View and manage all weekly plans across grades and subjects
          </p>
        </div>
        
        <Link href="/plans/create">
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> Create New Plan
          </Button>
        </Link>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>
            Filter weekly plans by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={filterGradeId} onValueChange={setFilterGradeId}>
              <SelectTrigger>
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Grades</SelectItem>
                {grades.map((grade) => (
                  <SelectItem key={grade.id} value={grade.id.toString()}>
                    {grade.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterSubjectId} onValueChange={setFilterSubjectId}>
              <SelectTrigger>
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id.toString()}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterWeekId} onValueChange={setFilterWeekId}>
              <SelectTrigger>
                <SelectValue placeholder="All Weeks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Weeks</SelectItem>
                {planningWeeks.map((week) => (
                  <SelectItem key={week.id} value={week.id.toString()}>
                    Week {week.weekNumber}, {week.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterTeacherId} onValueChange={setFilterTeacherId}>
              <SelectTrigger>
                <SelectValue placeholder="All Teachers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Teachers</SelectItem>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id.toString()}>
                    {teacher.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {hasActiveFilters && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500">
                {filteredPlans.length} plans match your filters
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="text-slate-500"
              >
                <X className="h-3 w-3 mr-1" /> Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="text-center py-8 bg-slate-50/50 rounded-lg border border-slate-200/70">
              <FileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <h3 className="text-lg font-medium text-slate-700 mb-1">No Plans Found</h3>
              <p className="text-sm text-slate-500 mb-4 max-w-md mx-auto">
                {hasActiveFilters 
                  ? "No weekly plans match your current filters. Try adjusting your filters or clearing them."
                  : "There are no weekly plans created yet. Start by creating a new plan."}
              </p>
              
              {hasActiveFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              ) : (
                <Link href="/plans/create">
                  <Button className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Weekly Plan
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border border-slate-200">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-[180px]">Teacher</TableHead>
                    <TableHead>Grade / Subject</TableHead>
                    <TableHead>Week</TableHead>
                    <TableHead className="w-[120px]">Created</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlans.map((plan) => {
                    // Find related data
                    const teacher = teachers.find(u => u.id === plan.teacherId);
                    const grade = grades.find(g => g.id === plan.gradeId);
                    const subject = subjects.find(s => s.id === plan.subjectId);
                    const week = planningWeeks.find(w => w.id === plan.weekId);
                    
                    const isActive = week?.isActive || false;
                    
                    return (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">
                          {teacher?.fullName || "Unknown"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{grade?.name || "Unknown"}</span>
                            <span className="text-xs text-slate-500">{subject?.name || "Unknown"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>Week {week?.weekNumber || "??"}</span>
                            {isActive && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px]">
                                Active
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm">
                          {plan.createdAt ? format(new Date(plan.createdAt), "MMM d, yyyy") : "Unknown"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/plans/${plan.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              {filteredPlans.length > 20 && (
                <div className="bg-slate-50 py-3 px-4 text-center border-t border-slate-200">
                  <p className="text-sm text-slate-500">
                    Showing {filteredPlans.length} plans. Use filters to narrow your results.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  );
}