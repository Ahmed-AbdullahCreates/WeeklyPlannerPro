import { useQuery } from "@tanstack/react-query";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { ClipboardList, Calendar, GraduationCap, Users, Plus, Zap, Activity, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardCardProps {
  title: string;
  value: string | null;
  description: string;
  icon: React.ReactNode;
  to?: string;
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth();

  const { data: planningWeeks = [], isLoading: isLoadingWeeks } = useQuery({
    queryKey: ["/api/planning-weeks/active"],
  });

  const { data: userGrades = [], isLoading: isLoadingGrades } = useQuery({
    queryKey: ["/api/teacher-grades", user?.id],
    enabled: !!user?.id,
  });

  const { data: myPlans = [], isLoading: isLoadingPlans } = useQuery({
    queryKey: ["/api/weekly-plans/teacher", user?.id],
    enabled: !!user?.id,
  });

  const { data: teachers = [], isLoading: isLoadingTeachers } = useQuery({
    queryKey: ["/api/teachers"],
    enabled: isAdmin,
  });

  const isLoading = isLoadingPlans || isLoadingWeeks || isLoadingGrades || (isAdmin && isLoadingTeachers);

  // Add proper type assertions
  const planLength = Array.isArray(myPlans) ? myPlans.length : 0;
  const weekLength = Array.isArray(planningWeeks) ? planningWeeks.length : 0;
  const gradeLength = Array.isArray(userGrades) ? userGrades.length : 0;
  const teacherLength = Array.isArray(teachers) ? teachers.length : 0;

  return (
    <PageWrapper title="Dashboard">
      {/* Enhanced Welcome Section */}
      <div className="relative mb-10 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute -z-10 inset-0">
          <div className="absolute -top-20 right-0 w-[800px] h-[500px] bg-gradient-to-br from-indigo-50/50 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute top-10 right-1/4 w-6 h-6 rounded-full bg-indigo-200/20 blur-md"></div>
          <div className="absolute bottom-5 right-1/3 w-4 h-4 rounded-full bg-indigo-300/20 blur-sm"></div>
        </div>

        <div className="relative">
          <div className="inline-flex items-center mb-4 px-3 py-1.5 rounded-full bg-indigo-50/90 text-indigo-600 text-xs font-medium shadow-sm">
            <svg className="h-3.5 w-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
            </svg>
            <span>Dashboard Overview</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600">
              Welcome, {user?.fullName}
            </span>
          </h1>
          <p className="text-slate-600 max-w-2xl text-lg">
            Here's an overview of your weekly planning system
          </p>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="My Plans"
          value={isLoadingPlans ? null : planLength.toString()}
          description="Your active lesson plans"
          icon={<ClipboardList className="h-8 w-8 text-indigo-600" />}
          to="/plans"
        />

        <DashboardCard
          title="Planning Weeks"
          value={isLoadingWeeks ? null : weekLength.toString()}
          description="Active planning periods"
          icon={<Calendar className="h-8 w-8 text-emerald-600" />}
          to={isAdmin ? "/admin/planning-weeks" : undefined}
        />

        <DashboardCard
          title="Assigned Grades"
          value={isLoadingGrades ? null : gradeLength.toString()}
          description="Grades you teach"
          icon={<GraduationCap className="h-8 w-8 text-amber-600" />}
          to={undefined}
        />

        {isAdmin && (
          <DashboardCard
            title="Teachers"
            value={isLoadingTeachers ? null : teacherLength.toString()}
            description="Registered teachers"
            icon={<Users className="h-8 w-8 text-blue-600" />}
            to="/admin/teachers"
          />
        )}
      </div>

      {/* Quick Actions Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center text-slate-800">
            <div className="p-1.5 rounded-md bg-indigo-50/80 text-indigo-500 mr-3">
              <Zap className="h-5 w-5" />
            </div>
            Quick Actions
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="group hover:shadow-md transition-all duration-200 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/0 via-indigo-50/0 to-indigo-50/0 group-hover:from-indigo-50/50 group-hover:via-indigo-50/20 group-hover:to-indigo-50/0 transition-all duration-500"></div>
            <CardContent className="p-6 relative">
              <Link href="/plans/create">
                <Button className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 shadow-sm group-hover:-translate-y-0.5 transition-all duration-200">
                  <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-200" />
                  Create New Plan
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-md transition-all duration-200 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/0 via-indigo-50/0 to-indigo-50/0 group-hover:from-indigo-50/50 group-hover:via-indigo-50/20 group-hover:to-indigo-50/0 transition-all duration-500"></div>
            <CardContent className="p-6 relative">
              <Link href="/plans">
                <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  View My Plans
                </Button>
              </Link>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className="group hover:shadow-md transition-all duration-200 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/0 via-indigo-50/0 to-indigo-50/0 group-hover:from-indigo-50/50 group-hover:via-indigo-50/20 group-hover:to-indigo-50/0 transition-all duration-500"></div>
              <CardContent className="p-6 relative">
                <Link href="/admin/teachers">
                  <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                    <Users className="h-4 w-4" />
                    Manage Teachers
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Recent Activity Section */}
      <div>
        <h2 className="text-xl font-semibold flex items-center text-slate-800 mb-4">
          <div className="p-1.5 rounded-md bg-indigo-50/80 text-indigo-500 mr-3">
            <Activity className="h-5 w-5" />
          </div>
          Recent Activity
        </h2>
        <Card className="border-slate-200/60 shadow-sm overflow-hidden backdrop-blur-[2px] bg-white/90">
          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-500 py-8">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-4">
                  <Clock className="h-6 w-6 text-slate-400" />
                </div>
                <p className="font-medium text-slate-600">Your recent activity will appear here</p>
                <p className="text-sm text-slate-400 mt-1">Start creating plans to see your activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}

// Enhanced DashboardCard Component
function DashboardCard({ title, value, description, icon, to }: DashboardCardProps) {
  const content = (
    <Card className="group hover:shadow-md transition-all duration-200 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-slate-50/0 via-slate-50/0 to-slate-50/0 group-hover:from-slate-50/50 group-hover:via-slate-50/20 group-hover:to-slate-50/0 transition-all duration-500"></div>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative">
        <CardTitle className="text-sm font-medium flex items-center">
          <div className="p-1.5 rounded-md bg-slate-50/80 mr-2 group-hover:bg-white/80 transition-colors duration-200">
            {icon}
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        {value === null ? (
          <Skeleton className="h-8 w-1/2 mb-1" />
        ) : (
          <div className="text-2xl font-bold group-hover:translate-x-1 transition-transform duration-200">
            {value}
          </div>
        )}
        <CardDescription className="group-hover:text-slate-600 transition-colors duration-200">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );

  if (to) {
    return <Link href={to}>{content}</Link>;
  }

  return content;
}
