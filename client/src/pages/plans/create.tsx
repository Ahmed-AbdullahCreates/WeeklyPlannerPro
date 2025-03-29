import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DailyPlanFormComponent } from "@/components/plans/daily-plan-form";
import { PdfPreviewDialog } from "@/components/plans/pdf-preview-dialog";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { Form, FormControl, FormField as BaseFormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Save } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const weeklyPlanSchema = z.object({
  gradeId: z.string().min(1, { message: "Please select a grade" }),
  subjectId: z.string().min(1, { message: "Please select a subject" }),
  weekId: z.string().min(1, { message: "Please select a planning week" }),
  notes: z.string().optional(),
});

type WeeklyPlanFormValues = z.infer<typeof weeklyPlanSchema>;

const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function CreatePlan() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedGradeId, setSelectedGradeId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedSubjectType, setSelectedSubjectType] = useState<string>("standard");
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form for the weekly plan header info
  const form = useForm<WeeklyPlanFormValues>({
    resolver: zodResolver(weeklyPlanSchema),
    defaultValues: {
      gradeId: "",
      subjectId: "",
      weekId: "",
      notes: "",
    },
  });

  // Get teacher's assigned grades
  const { data: assignedGrades = [] } = useQuery({
    queryKey: ["/api/teacher-grades", user?.id],
    enabled: !!user?.id,
  });

  // Get active planning weeks
  const { data: planningWeeks = [] } = useQuery({
    queryKey: ["/api/planning-weeks/active"],
  });

  // Get teacher's subjects for selected grade
  const { data: assignedSubjects = [] } = useQuery({
    queryKey: ["/api/teacher-subjects", user?.id, selectedGradeId],
    enabled: !!user?.id && !!selectedGradeId,
  });

  // Create weekly plan mutation
  const createWeeklyPlan = useMutation({
    mutationFn: async (data: WeeklyPlanFormValues) => {
      const res = await apiRequest("POST", "/api/weekly-plans", {
        gradeId: parseInt(data.gradeId),
        subjectId: parseInt(data.subjectId),
        weekId: parseInt(data.weekId),
        notes: data.notes,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Weekly plan created. Now you can add daily details.",
      });
      
      // Store the created plan ID for daily plan creation
      setSelectedPlanId(data.id);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-plans/teacher", user?.id] });
    },
    onError: (error: any) => {
      setError(error.message || "Failed to create weekly plan");
      toast({
        title: "Error",
        description: error.message || "Failed to create weekly plan",
        variant: "destructive",
      });
    },
  });

  // Watch for changes in the form fields
  const watchGradeId = form.watch("gradeId");
  const watchSubjectId = form.watch("subjectId");

  // Update state when form values change
  useEffect(() => {
    if (watchGradeId) {
      setSelectedGradeId(watchGradeId);
    }
  }, [watchGradeId]);

  useEffect(() => {
    if (watchSubjectId) {
      setSelectedSubjectId(watchSubjectId);
      
      // Find the selected subject to determine its type
      const subject = assignedSubjects.find(s => s.id.toString() === watchSubjectId);
      if (subject) {
        setSelectedSubjectType(subject.type);
      }
    }
  }, [watchSubjectId, assignedSubjects]);

  const onSubmit = (data: WeeklyPlanFormValues) => {
    setError(null);
    createWeeklyPlan.mutate(data);
  };

  return (
    <PageWrapper title="Create Weekly Plan">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">
          Create Weekly Plan
        </h1>
        <p className="text-neutral-600 mt-2">
          Create a new weekly lesson plan and add daily details
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Plan Details</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <BaseFormField
                  control={form.control}
                  name="gradeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={!!selectedPlanId || createWeeklyPlan.isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {assignedGrades.map((grade) => (
                            <SelectItem key={grade.id} value={grade.id.toString()}>
                              {grade.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <BaseFormField
                  control={form.control}
                  name="subjectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={!selectedGradeId || !!selectedPlanId || createWeeklyPlan.isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {assignedSubjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id.toString()}>
                              {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <BaseFormField
                  control={form.control}
                  name="weekId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Planning Week</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={!!selectedPlanId || createWeeklyPlan.isPending}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select week" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {planningWeeks.map((week) => (
                            <SelectItem key={week.id} value={week.id.toString()}>
                              Week {week.weekNumber} ({new Date(week.startDate).toLocaleDateString()} - {new Date(week.endDate).toLocaleDateString()})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <BaseFormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weekly Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any general notes about this week's plan..."
                        className="resize-none"
                        {...field}
                        disabled={!!selectedPlanId || createWeeklyPlan.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!selectedPlanId && (
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={createWeeklyPlan.isPending}
                  >
                    {createWeeklyPlan.isPending ? (
                      "Creating..."
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Create Weekly Plan
                      </>
                    )}
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {selectedPlanId && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Daily Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="1" className="w-full">
                <TabsList className="grid grid-cols-5 mb-4">
                  {dayNames.map((day, index) => (
                    <TabsTrigger key={index} value={(index + 1).toString()}>
                      {day}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {dayNames.map((day, index) => (
                  <TabsContent key={index} value={(index + 1).toString()}>
                    <DailyPlanFormComponent 
                      weeklyPlanId={selectedPlanId} 
                      dayOfWeek={index + 1}
                      dayName={day}
                      subjectType={selectedSubjectType}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2 mb-8">
            <Button variant="outline" onClick={() => navigate("/plans")}>
              Done
            </Button>
            <Button onClick={() => setIsPreviewOpen(true)}>
              Preview PDF
            </Button>
          </div>

          <PdfPreviewDialog 
            planId={selectedPlanId}
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
          />
        </>
      )}
    </PageWrapper>
  );
}
