import { useQuery } from "@tanstack/react-query";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { ClipboardList, Calendar, GraduationCap, Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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

  return (
    <PageWrapper title="Dashboard">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">
          Welcome, {user?.fullName}
        </h1>
        <p className="text-neutral-600 mt-2">
          Here's an overview of your weekly planning system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="My Plans"
          value={isLoadingPlans ? null : myPlans.length.toString()}
          description="Your active lesson plans"
          icon={<ClipboardList className="h-8 w-8 text-indigo-600" />}
          to="/plans"
        />

        <DashboardCard
          title="Planning Weeks"
          value={isLoadingWeeks ? null : planningWeeks.length.toString()}
          description="Active planning periods"
          icon={<Calendar className="h-8 w-8 text-emerald-600" />}
          to={isAdmin ? "/admin/planning-weeks" : undefined}
        />

        <DashboardCard
          title="Assigned Grades"
          value={isLoadingGrades ? null : userGrades.length.toString()}
          description="Grades you teach"
          icon={<GraduationCap className="h-8 w-8 text-amber-600" />}
          to={undefined}
        />

        {isAdmin && (
          <DashboardCard
            title="Teachers"
            value={isLoadingTeachers ? null : teachers.length.toString()}
            description="Registered teachers"
            icon={<Users className="h-8 w-8 text-blue-600" />}
            to="/admin/teachers"
          />
        )}
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-800">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <Link href="/plans/create">
                <Button className="w-full flex items-center justify-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Plan
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <Link href="/plans">
                <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  View My Plans
                </Button>
              </Link>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card>
              <CardContent className="p-6">
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

      <div>
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Recent Activity</h2>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-neutral-500 py-8">
              Your recent activity will appear here
            </p>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}

interface DashboardCardProps {
  title: string;
  value: string | null;
  description: string;
  icon: React.ReactNode;
  to?: string;
}

function DashboardCard({ title, value, description, icon, to }: DashboardCardProps) {
  const content = (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {value === null ? (
          <Skeleton className="h-8 w-1/2 mb-1" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );

  if (to) {
    return <Link href={to}>{content}</Link>;
  }

  return content;
}
