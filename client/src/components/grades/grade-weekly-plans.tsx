import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Grade, PlanningWeek, WeeklyPlanComplete } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Download, FileSpreadsheet, UserIcon, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { generatePdf } from "@/utils/pdf-generator";
import { generateExcel } from "@/utils/excel-generator";

interface GradeWeeklyPlansProps {
  grade: Grade;
  selectedWeek: PlanningWeek;
  onBack: () => void;
}

export function GradeWeeklyPlans({ grade, selectedWeek, onBack }: GradeWeeklyPlansProps) {
  const { toast } = useToast();
  const [plans, setPlans] = useState<WeeklyPlanComplete[]>([]);

  // Fetch the complete weekly plans for this grade and week
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/weekly-plans/grade', grade.id, 'week', selectedWeek.id, 'complete'],
    queryFn: () => 
      fetch(`/api/weekly-plans/grade/${grade.id}/week/${selectedWeek.id}/complete`)
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch grade plans");
          return res.json();
        }),
  });

  useEffect(() => {
    if (data) {
      setPlans(data);
    }
  }, [data]);

  const handleDownloadPdf = async (plan: WeeklyPlanComplete) => {
    try {
      await generatePdf(plan);
      toast({
        title: "PDF Downloaded",
        description: "Weekly plan has been exported to PDF successfully",
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF",
        variant: "destructive",
      });
    }
  };

  const handleDownloadExcel = (plan: WeeklyPlanComplete) => {
    try {
      generateExcel(plan);
      toast({
        title: "Excel Downloaded",
        description: "Weekly plan has been exported to Excel successfully",
      });
    } catch (error) {
      console.error("Excel generation error:", error);
      toast({
        title: "Excel Generation Failed",
        description: "There was an error generating the Excel file",
        variant: "destructive",
      });
    }
  };

  // Format date range for display
  const dateRange = selectedWeek.startDate && selectedWeek.endDate
    ? `${format(new Date(selectedWeek.startDate), "MMM d, yyyy")} - ${format(new Date(selectedWeek.endDate), "MMM d, yyyy")}`
    : "Date range not available";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onBack}
            className="border-primary/40 text-primary"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h2 className="text-2xl font-bold text-slate-800">
            {grade.name} - Weekly Plans
          </h2>
        </div>
      </div>

      <Card>
        <CardHeader className="bg-primary/5 pb-2">
          <CardTitle className="flex justify-between items-center">
            <div className="text-xl">
              Planning Week {selectedWeek.weekNumber}
            </div>
            <Badge variant="outline" className="text-sm font-normal">
              {dateRange}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-500">
              Error loading plans. Please try again.
            </div>
          ) : plans.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              No weekly plans found for this grade and week.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-2 text-primary" />
                        {plan.subject.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-2 text-slate-400" />
                        {plan.teacher.fullName}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(plan.updatedAt), "MMM d, yyyy 'at' h:mm a")}
                    </TableCell>
                    <TableCell>
                      <Badge className={plan.dailyPlans.length >= 5 ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-amber-100 text-amber-800 hover:bg-amber-200"}>
                        {plan.dailyPlans.length >= 5 ? "Complete" : "Incomplete"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPdf(plan)}
                          className="border-primary/40 text-primary hover:bg-primary hover:text-white"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadExcel(plan)}
                          className="border-green-600/40 text-green-600 hover:bg-green-600 hover:text-white"
                        >
                          <FileSpreadsheet className="h-4 w-4 mr-1" />
                          Excel
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}