import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Grade, PlanningWeek } from "@shared/schema";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { GradeCard } from "@/components/grades/grade-card";
import { GradeWeeklyPlans } from "@/components/grades/grade-weekly-plans";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function GradePlans() {
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [selectedWeekId, setSelectedWeekId] = useState<number | null>(null);
  
  // Fetch all grades
  const { 
    data: grades, 
    isLoading: isLoadingGrades,
    error: gradesError 
  } = useQuery({
    queryKey: ['/api/grades'],
    queryFn: () => 
      fetch('/api/grades').then(res => {
        if (!res.ok) throw new Error("Failed to fetch grades");
        return res.json();
      }),
  });
  
  // Fetch active planning weeks
  const { 
    data: weeks, 
    isLoading: isLoadingWeeks,
    error: weeksError 
  } = useQuery({
    queryKey: ['/api/planning-weeks/active'],
    queryFn: () => 
      fetch('/api/planning-weeks/active').then(res => {
        if (!res.ok) throw new Error("Failed to fetch planning weeks");
        return res.json();
      }),
  });
  
  // Set the first week as selected by default when data is loaded
  useEffect(() => {
    if (weeks && weeks.length > 0 && !selectedWeekId) {
      setSelectedWeekId(weeks[0].id);
    }
  }, [weeks, selectedWeekId]);
  
  const selectedWeek = weeks?.find(week => week.id === selectedWeekId) || null;
  
  const handleSelectGrade = (grade: Grade) => {
    setSelectedGrade(grade);
  };
  
  const handleBackToGrades = () => {
    setSelectedGrade(null);
  };
  
  const handleWeekChange = (weekId: string) => {
    setSelectedWeekId(parseInt(weekId, 10));
  };
  
  // Render error states
  if (gradesError || weeksError) {
    return (
      <PageWrapper title="Grade Weekly Plans">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {gradesError ? "Failed to load grades." : "Failed to load planning weeks."}
          </AlertDescription>
        </Alert>
      </PageWrapper>
    );
  }
  
  return (
    <PageWrapper title="Grade Weekly Plans">
      <div className="space-y-6">
        {/* Header with week selection */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          {selectedGrade ? (
            <h1 className="text-3xl font-bold text-slate-800">
              {selectedGrade.name} - Weekly Plans
            </h1>
          ) : (
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">
              Grade Weekly Plans
            </h1>
          )}
          
          {!isLoadingWeeks && weeks && weeks.length > 0 && (
            <div className="mt-4 md:mt-0 w-full md:w-auto">
              <Select value={selectedWeekId?.toString()} onValueChange={handleWeekChange}>
                <SelectTrigger className="w-full md:w-[240px]">
                  <SelectValue placeholder="Select planning week" />
                </SelectTrigger>
                <SelectContent>
                  {weeks.map((week) => (
                    <SelectItem key={week.id} value={week.id.toString()}>
                      Week {week.weekNumber} ({format(new Date(week.startDate), "MMM d")} - {format(new Date(week.endDate), "MMM d, yyyy")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        {/* Loading states */}
        {(isLoadingGrades || isLoadingWeeks) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-40 w-full" />
              </div>
            ))}
          </div>
        )}
        
        {/* No active weeks warning */}
        {!isLoadingWeeks && (!weeks || weeks.length === 0) && (
          <Alert className="mb-6 bg-amber-50 text-amber-800 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-800" />
            <AlertTitle>No Active Planning Weeks</AlertTitle>
            <AlertDescription>
              There are no active planning weeks. Please activate a planning week to view grade plans.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Content */}
        {!isLoadingGrades && grades && weeks && weeks.length > 0 && (
          <>
            {selectedGrade && selectedWeek ? (
              // Show weekly plans for selected grade
              <GradeWeeklyPlans 
                grade={selectedGrade} 
                selectedWeek={selectedWeek}
                onBack={handleBackToGrades}
              />
            ) : (
              // Show grade cards
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {grades.map((grade) => (
                  <GradeCard
                    key={grade.id}
                    grade={grade}
                    activePlanCount={0} // This would be calculated from actual plan data
                    onClick={() => handleSelectGrade(grade)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  );
}