import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { WeeklyPlanComplete, User, Grade, Subject, PlanningWeek, DailyPlan } from "@shared/schema";
import { format } from "date-fns";
import { FileText, Calendar, User as UserIcon, GraduationCap, BookOpen, Download, ArrowLeft, Clock, AlertCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { PdfPreviewDialog } from "@/components/plans/pdf-preview-dialog";

const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function ViewWeeklyPlan() {
  const { planId } = useParams<{ planId: string }>();
  const [, navigate] = useLocation();
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("details");
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  
  // Fetch the complete plan data with all related information
  const { data: plan, isLoading, error } = useQuery<WeeklyPlanComplete>({
    queryKey: ["/api/weekly-plans", planId, "complete"],
    enabled: !!planId,
    queryFn: async () => {
      const res = await fetch(`/api/weekly-plans/${planId}/complete`);
      if (!res.ok) {
        throw new Error("Failed to fetch plan details");
      }
      return res.json();
    },
  });
  
  // Sort daily plans by day of week
  const sortedDailyPlans = plan?.dailyPlans
    ? [...plan.dailyPlans].sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    : [];
    
  // Group daily plans by day for easy access
  const dailyPlansByDay = sortedDailyPlans.reduce((acc, plan) => {
    acc[plan.dayOfWeek] = plan;
    return acc;
  }, {} as Record<number, DailyPlan>);
  
  // Determine if all days have plans
  const hasAllDayPlans = dayNames.every((_, index) => 
    dailyPlansByDay[index + 1] !== undefined
  );
  
  // Custom field renderer based on subject type
  const renderFieldContent = (plan: DailyPlan, field: string) => {
    if (!plan) return null;
    
    const fieldValue = plan[field as keyof DailyPlan];
    if (!fieldValue || fieldValue === "") return <span className="text-gray-400">Not specified</span>;
    
    // Format date fields
    if (field === 'homeworkDueDate' && fieldValue) {
      try {
        return format(new Date(fieldValue as string), "MMM d, yyyy");
      } catch (e) {
        return fieldValue as string;
      }
    }
    
    return fieldValue as string;
  };
  
  if (isLoading) {
    return (
      <PageWrapper title="Weekly Plan">
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/admin/dashboard")}
              className="gap-1 text-slate-600"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </div>
          <Skeleton className="h-10 w-1/3 mb-2" />
          <Skeleton className="h-5 w-1/2" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-3">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-48" />
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </PageWrapper>
    );
  }
  
  if (error || !plan) {
    return (
      <PageWrapper title="Weekly Plan">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/admin/dashboard")}
            className="gap-1 text-slate-600 mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load the weekly plan. The plan might not exist or you may not have permission to view it.
            </AlertDescription>
          </Alert>
        </div>
      </PageWrapper>
    );
  }
  
  return (
    <PageWrapper title={`${plan.subject.name} Weekly Plan`}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(isAdmin ? "/admin/dashboard" : "/dashboard")}
            className="gap-1 text-slate-600"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>
          
          <Button 
            onClick={() => setIsPdfPreviewOpen(true)}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700"
          >
            <Download className="h-4 w-4" /> Generate PDF
          </Button>
        </div>
        
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-700 mb-2">
          {plan.subject.name} Weekly Plan
        </h1>
        <p className="text-slate-600 text-lg">
          {plan.grade.name} • Week {plan.week.weekNumber}, {plan.week.year}
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar with Plan Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Calendar className="h-4 w-4 text-indigo-500 mr-2" />
                Plan Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Teacher</p>
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mr-2">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <span className="font-medium">{plan.teacher.fullName}</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Grade</p>
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 mr-2">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <span className="font-medium">{plan.grade.name}</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Subject</p>
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 mr-2">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <span className="font-medium">{plan.subject.name}</span>
                  <Badge variant="outline" className="ml-2 text-xs capitalize">
                    {plan.subject.type}
                  </Badge>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Planning Week</p>
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 mr-2">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">Week {plan.week.weekNumber}, {plan.week.year}</span>
                    <span className="text-xs text-slate-500">
                      {new Date(plan.week.startDate).toLocaleDateString()} - {new Date(plan.week.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Plan Creation</p>
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 mr-2">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {new Date(plan.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(plan.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <FileText className="h-4 w-4 text-indigo-500 mr-2" />
                Weekly Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {plan.notes ? (
                <div className="text-slate-700 whitespace-pre-wrap">
                  {plan.notes}
                </div>
              ) : (
                <div className="text-slate-400 italic">
                  No weekly notes provided.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content with Daily Plans */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Daily Plans</CardTitle>
              <CardDescription>
                View the detailed daily planning for each day of the week
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sortedDailyPlans.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-md border border-slate-200">
                  <FileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                  <h3 className="text-lg font-medium text-slate-700 mb-1">No Daily Plans</h3>
                  <p className="text-sm text-slate-500 mb-4 max-w-md mx-auto">
                    This weekly plan doesn't have any daily plans created yet.
                  </p>
                </div>
              ) : (
                <Tabs defaultValue={dailyPlansByDay[1] ? "1" : "2"} className="w-full">
                  <TabsList className="grid grid-cols-5 mb-4">
                    {dayNames.map((day, index) => {
                      const hasPlan = !!dailyPlansByDay[index + 1];
                      return (
                        <TabsTrigger 
                          key={index} 
                          value={(index + 1).toString()}
                          disabled={!hasPlan}
                          className={!hasPlan ? "opacity-50 cursor-not-allowed" : ""}
                        >
                          {day}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                  
                  {dayNames.map((day, index) => {
                    const dayPlan = dailyPlansByDay[index + 1];
                    if (!dayPlan) return null;
                    
                    return (
                      <TabsContent key={index} value={(index + 1).toString()}>
                        <div className="p-4 bg-slate-50 rounded-md border border-slate-200">
                          <h3 className="text-lg font-medium mb-4 text-slate-800">{day}'s Plan</h3>
                          
                          {plan.subject.type === 'standard' && (
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-sm font-medium text-slate-600 mb-1">Topic / Lessons</h4>
                                <p className="p-2 bg-white rounded border border-slate-200">
                                  {renderFieldContent(dayPlan, 'topic')}
                                </p>
                              </div>
                              
                              <div>
                                <h4 className="text-sm font-medium text-slate-600 mb-1">Books & Pages</h4>
                                <p className="p-2 bg-white rounded border border-slate-200">
                                  {renderFieldContent(dayPlan, 'booksAndPages')}
                                </p>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-medium text-slate-600 mb-1">Homework</h4>
                                  <p className="p-2 bg-white rounded border border-slate-200">
                                    {renderFieldContent(dayPlan, 'homework')}
                                  </p>
                                </div>
                                
                                <div>
                                  <h4 className="text-sm font-medium text-slate-600 mb-1">Due Date</h4>
                                  <p className="p-2 bg-white rounded border border-slate-200">
                                    {renderFieldContent(dayPlan, 'homeworkDueDate')}
                                  </p>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="text-sm font-medium text-slate-600 mb-1">Tests / Assignments</h4>
                                <p className="p-2 bg-white rounded border border-slate-200">
                                  {renderFieldContent(dayPlan, 'assignments')}
                                </p>
                              </div>
                              
                              <div>
                                <h4 className="text-sm font-medium text-slate-600 mb-1">Notes</h4>
                                <p className="p-2 bg-white rounded border border-slate-200">
                                  {renderFieldContent(dayPlan, 'notes')}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {plan.subject.type === 'art' && (
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-sm font-medium text-slate-600 mb-1">Activity</h4>
                                <p className="p-2 bg-white rounded border border-slate-200">
                                  {renderFieldContent(dayPlan, 'topic')}
                                </p>
                              </div>
                              
                              <div>
                                <h4 className="text-sm font-medium text-slate-600 mb-1">Required Items</h4>
                                <p className="p-2 bg-white rounded border border-slate-200">
                                  {renderFieldContent(dayPlan, 'requiredItems')}
                                </p>
                              </div>
                              
                              <div>
                                <h4 className="text-sm font-medium text-slate-600 mb-1">Notes</h4>
                                <p className="p-2 bg-white rounded border border-slate-200">
                                  {renderFieldContent(dayPlan, 'notes')}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {plan.subject.type === 'pe' && (
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-sm font-medium text-slate-600 mb-1">Skill</h4>
                                <p className="p-2 bg-white rounded border border-slate-200">
                                  {renderFieldContent(dayPlan, 'skill')}
                                </p>
                              </div>
                              
                              <div>
                                <h4 className="text-sm font-medium text-slate-600 mb-1">Activity</h4>
                                <p className="p-2 bg-white rounded border border-slate-200">
                                  {renderFieldContent(dayPlan, 'activity')}
                                </p>
                              </div>
                              
                              <div>
                                <h4 className="text-sm font-medium text-slate-600 mb-1">Notes</h4>
                                <p className="p-2 bg-white rounded border border-slate-200">
                                  {renderFieldContent(dayPlan, 'notes')}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    );
                  })}
                </Tabs>
              )}
            </CardContent>
            <CardFooter className="flex justify-end border-t bg-slate-50/80 py-3">
              <Button 
                onClick={() => setIsPdfPreviewOpen(true)}
                size="sm"
                className="gap-2"
              >
                <Download className="h-4 w-4" /> Preview & Download PDF
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {/* PDF Preview Dialog */}
      <PdfPreviewDialog 
        planId={Number(planId)} 
        isOpen={isPdfPreviewOpen} 
        onClose={() => setIsPdfPreviewOpen(false)}
      />
    </PageWrapper>
  );
}