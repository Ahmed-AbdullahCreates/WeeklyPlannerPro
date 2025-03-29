import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { WeeklyPlanComplete } from "@shared/schema";
import { X, Download, Loader2, Calendar, Book } from "lucide-react";
import { generatePdf } from "@/utils/pdf-generator";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface PdfPreviewDialogProps {
  planId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function PdfPreviewDialog({ planId, isOpen, onClose }: PdfPreviewDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Fetch the complete plan data
  const { data: plan, isLoading, error } = useQuery<WeeklyPlanComplete>({
    queryKey: ["/api/weekly-plans", planId, "complete"],
    enabled: isOpen && !!planId,
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
  
  // Day name lookup
  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  
  const handleDownload = async () => {
    if (!plan) return;
    
    setIsGenerating(true);
    try {
      await generatePdf(plan);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg">Weekly Plan PDF Preview</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2">Loading plan data...</span>
            </div>
          ) : error ? (
            <div className="text-center text-red-500">
              Error loading plan data. Please try again.
            </div>
          ) : plan ? (
            <div className="mx-auto max-w-4xl bg-white shadow-lg border border-slate-200">
              {/* PDF Header with School Info */}
              <div className="border-b-2 border-slate-300 p-6 flex items-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mr-4">
                  <span className="text-white text-2xl font-bold">RAS</span>
                </div>
                
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Royal American School</h1>
                  <h2 className="text-lg font-bold font-arabic text-slate-900 mt-1">مدرسة رويال الامريكية</h2>
                </div>
                
                <div className="ml-auto text-right">
                  <p className="text-sm text-slate-600">Week {plan.week.weekNumber}</p>
                  <p className="text-sm text-slate-600">
                    {format(new Date(plan.week.startDate), "MMMM d, yyyy")} - {format(new Date(plan.week.endDate), "MMMM d, yyyy")}
                  </p>
                  <p className="text-sm font-medium text-slate-800 mt-1">
                    {plan.grade.name} - {plan.subject.name}
                  </p>
                </div>
              </div>
              
              {/* Teacher Info */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between">
                <div>
                  <p className="text-sm text-slate-600">
                    Teacher: <span className="font-medium text-slate-800">{plan.teacher.fullName}</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">
                    Generated: <span className="font-medium text-slate-800">{format(new Date(), "MMM d, yyyy")}</span>
                  </p>
                </div>
              </div>
              
              {/* Weekly Notes */}
              {plan.notes && (
                <div className="p-4 border-b border-slate-200">
                  <h3 className="font-medium text-slate-800 mb-2">Weekly Notes</h3>
                  <p className="text-sm text-slate-600">{plan.notes}</p>
                </div>
              )}
              
              {/* Daily Plan Table */}
              <div className="p-4">
                {plan.subject.type === 'standard' && (
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-300 p-2 text-left">Day</th>
                        <th className="border border-slate-300 p-2 text-left">Lessons/Topics</th>
                        <th className="border border-slate-300 p-2 text-left">Books and Pages</th>
                        <th className="border border-slate-300 p-2 text-left">Homework</th>
                        <th className="border border-slate-300 p-2 text-left">HW Due Date</th>
                        <th className="border border-slate-300 p-2 text-left">Assessments</th>
                        <th className="border border-slate-300 p-2 text-left">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedDailyPlans.map((dailyPlan) => (
                        <tr key={dailyPlan.id}>
                          <td className="border border-slate-300 p-2 font-medium">
                            {dayNames[dailyPlan.dayOfWeek - 1]}
                          </td>
                          <td className="border border-slate-300 p-2">{dailyPlan.topic || "-"}</td>
                          <td className="border border-slate-300 p-2">{dailyPlan.booksAndPages || "-"}</td>
                          <td className="border border-slate-300 p-2">{dailyPlan.homework || "-"}</td>
                          <td className="border border-slate-300 p-2">
                            {dailyPlan.homeworkDueDate 
                              ? format(new Date(dailyPlan.homeworkDueDate), "MMM d, yyyy") 
                              : "-"}
                          </td>
                          <td className="border border-slate-300 p-2">{dailyPlan.assignments || "-"}</td>
                          <td className="border border-slate-300 p-2">{dailyPlan.notes || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                
                {plan.subject.type === 'art' && (
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-300 p-2 text-left">Day</th>
                        <th className="border border-slate-300 p-2 text-left">Lessons/Topics</th>
                        <th className="border border-slate-300 p-2 text-left">Required Items</th>
                        <th className="border border-slate-300 p-2 text-left">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedDailyPlans.map((dailyPlan) => (
                        <tr key={dailyPlan.id}>
                          <td className="border border-slate-300 p-2 font-medium">
                            {dayNames[dailyPlan.dayOfWeek - 1]}
                          </td>
                          <td className="border border-slate-300 p-2">{dailyPlan.topic || "-"}</td>
                          <td className="border border-slate-300 p-2">{dailyPlan.requiredItems || "-"}</td>
                          <td className="border border-slate-300 p-2">{dailyPlan.notes || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                
                {plan.subject.type === 'pe' && (
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-300 p-2 text-left">Day</th>
                        <th className="border border-slate-300 p-2 text-left">Skill</th>
                        <th className="border border-slate-300 p-2 text-left">Activity</th>
                        <th className="border border-slate-300 p-2 text-left">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedDailyPlans.map((dailyPlan) => (
                        <tr key={dailyPlan.id}>
                          <td className="border border-slate-300 p-2 font-medium">
                            {dayNames[dailyPlan.dayOfWeek - 1]}
                          </td>
                          <td className="border border-slate-300 p-2">{dailyPlan.skill || "-"}</td>
                          <td className="border border-slate-300 p-2">{dailyPlan.activity || "-"}</td>
                          <td className="border border-slate-300 p-2">{dailyPlan.notes || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              
              {/* PDF Footer */}
              <div className="p-4 mt-4 border-t border-slate-200 text-center text-sm text-slate-500">
                <p>Royal American School Weekly Plan - Generated by WeeklyScheduler System</p>
              </div>
            </div>
          ) : null}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleDownload}
            disabled={isGenerating || isLoading || !plan}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
