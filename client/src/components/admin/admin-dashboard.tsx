import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, GraduationCap, BookOpen, Calendar, Plus, RefreshCw, FileText, Eye, PlaneLanding, Clock, ChevronRight } from "lucide-react";
import { User, Grade, Subject, PlanningWeek, WeeklyPlan } from "@shared/schema";
import { ReseedDataButton } from "./reseed-data-button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { format as formatDate } from "date-fns";

export function AdminDashboard() {
  // Queries for counts
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
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
  
  // Get all weekly plans for active weeks
  const activeWeeks = planningWeeks.filter(week => week.isActive);
  
  // Load all weekly plans for active weeks to show them on the dashboard
  const { data: weeklyPlans = [], isLoading: isLoadingWeeklyPlans } = useQuery<WeeklyPlan[]>({
    queryKey: ["/api/weekly-plans"],
    // Enabled only if we have active weeks
    enabled: activeWeeks.length > 0,
  });
  
  // Filter weekly plans to those from active weeks
  const activeWeeklyPlans = weeklyPlans.filter(plan => 
    activeWeeks.some(week => week.id === plan.weekId)
  );

  // Loading state
  const isLoading = isLoadingUsers || isLoadingGrades || isLoadingSubjects || isLoadingWeeks || isLoadingWeeklyPlans;

  const stats = [
    {
      title: "Teachers",
      value: users.filter(user => !user.isAdmin).length,
      icon: <Users className="h-5 w-5 text-primary" />,
      href: "/admin/teachers",
      loading: isLoadingUsers,
      color: "bg-blue-50 text-blue-700",
    },
    {
      title: "Grades",
      value: grades.length,
      icon: <GraduationCap className="h-5 w-5 text-primary" />,
      href: "/admin/grades",
      loading: isLoadingGrades,
      color: "bg-purple-50 text-purple-700",
    },
    {
      title: "Subjects",
      value: subjects.length,
      icon: <BookOpen className="h-5 w-5 text-primary" />,
      href: "/admin/subjects",
      loading: isLoadingSubjects,
      color: "bg-green-50 text-green-700",
    },
    {
      title: "Active Weeks",
      value: activeWeeks.length,
      icon: <Calendar className="h-5 w-5 text-primary" />,
      href: "/admin/planning-weeks",
      loading: isLoadingWeeks,
      color: "bg-amber-50 text-amber-700",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">School Management</h2>
        <p className="text-slate-600">
          Organize and manage all aspects of the Royal American School curriculum.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="overflow-hidden transition-all hover:shadow-md">
            <div className={`h-1 bg-primary/70`}></div>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  {stat.loading ? (
                    <Skeleton className="h-9 w-16" />
                  ) : (
                    <p className="text-3xl font-bold">{stat.value}</p>
                  )}
                </div>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {stat.icon}
                </div>
              </div>
              <div className="mt-4">
                <Link href={stat.href}>
                  <Button variant="outline" size="sm" className="w-full border-primary/20 hover:bg-primary/5">
                    Manage {stat.title}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly Plans Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              Weekly Plans
            </span>
            <Link href="/plans/create">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-1" /> Create New Plan
              </Button>
            </Link>
          </CardTitle>
          <CardDescription>
            View and manage all weekly plans across grades and subjects
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingWeeklyPlans ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : weeklyPlans.length === 0 ? (
            <div className="text-center py-8 bg-slate-50/50 rounded-lg border border-slate-200/70">
              <FileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <h3 className="text-lg font-medium text-slate-700 mb-1">No Weekly Plans</h3>
              <p className="text-sm text-slate-500 mb-4 max-w-md mx-auto">
                There are no weekly plans created yet. Start by creating a new plan or assigning teachers to grades and subjects.
              </p>
              <Link href="/plans/create">
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Weekly Plan
                </Button>
              </Link>
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
                  {weeklyPlans.slice(0, 5).map((plan) => {
                    // Find related data
                    const teacher = users.find(u => u.id === plan.teacherId);
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
                          {plan.createdAt ? formatDate(new Date(plan.createdAt), "MMM d, yyyy") : "Unknown"}
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
              
              {weeklyPlans.length > 5 && (
                <div className="bg-slate-50 py-2 px-4 text-center border-t border-slate-200">
                  <Link href="/admin/plans">
                    <Button variant="link" size="sm" className="text-primary">
                      View all {weeklyPlans.length} plans
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
            
      {/* Active Planning Weeks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-primary" />
              Active Planning Weeks
            </span>
            <Link href="/admin/planning-weeks">
              <Button size="sm" variant="ghost" className="hover:bg-primary/10 hover:text-primary">View All</Button>
            </Link>
          </CardTitle>
          <CardDescription>
            Currently active planning weeks for teachers to create plans
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingWeeks ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : activeWeeks.length === 0 ? (
            <div className="text-center py-8 bg-slate-50/50 rounded-lg border border-slate-200/70">
              <Calendar className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <h3 className="text-lg font-medium text-slate-700 mb-1">No Active Weeks</h3>
              <p className="text-sm text-slate-500 mb-4 max-w-md mx-auto">
                There are no active planning weeks right now. Teachers can only create plans during active weeks.
              </p>
              <Link href="/admin/planning-weeks">
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Activate Planning Week
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeWeeks.map((week) => (
                <Card key={week.id} className="p-4 flex justify-between items-center bg-primary/5 border border-primary/20">
                  <div>
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      <p className="font-medium text-slate-800">Week {week.weekNumber}, {week.year}</p>
                    </div>
                    <p className="text-sm text-slate-500 ml-4">
                      {new Date(week.startDate).toLocaleDateString()} - {new Date(week.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Link href={`/admin/planning-weeks/${week.id}`}>
                    <Button size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                      View Plans
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* System Administration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <RefreshCw className="h-5 w-5 mr-2 text-primary" />
            <span>System Administration</span>
          </CardTitle>
          <CardDescription>
            Manage system-level functions and data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <ReseedDataButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}