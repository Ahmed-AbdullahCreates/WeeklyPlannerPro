import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PlanFieldsBySubject } from "@/components/plans/plan-fields-by-subject";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { dailyPlanFormSchema, DailyPlanForm } from "@shared/schema";

interface DailyPlanFormProps {
  weeklyPlanId: number;
  dayOfWeek: number;
  dayName: string;
  subjectType: string;
}

export function DailyPlanFormComponent({ weeklyPlanId, dayOfWeek, dayName, subjectType }: DailyPlanFormProps) {
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [existingPlanId, setExistingPlanId] = useState<number | null>(null);
  
  const form = useForm<DailyPlanForm>({
    resolver: zodResolver(dailyPlanFormSchema),
    defaultValues: {
      weeklyPlanId,
      dayOfWeek,
      topic: "",
      booksAndPages: "",
      homework: "",
      homeworkDueDate: null,
      assignments: "",
      notes: "",
      requiredItems: "",
      skill: "",
      activity: "",
    },
  });
  
  // Fetch existing daily plans for this weekly plan
  const { data: dailyPlans = [], isLoading: isLoadingPlans } = useQuery({
    queryKey: ["/api/daily-plans/weekly", weeklyPlanId],
  });
  
  // Find if there's an existing plan for this day
  useEffect(() => {
    if (dailyPlans.length > 0) {
      const existingPlan = dailyPlans.find(plan => plan.dayOfWeek === dayOfWeek);
      if (existingPlan) {
        setExistingPlanId(existingPlan.id);
        
        // Convert date string to Date object for the form, if it exists
        const homeworkDueDate = existingPlan.homeworkDueDate 
          ? new Date(existingPlan.homeworkDueDate) 
          : null;
        
        // Reset form with existing data
        form.reset({
          ...existingPlan,
          homeworkDueDate,
        });
      }
    }
  }, [dailyPlans, dayOfWeek, form]);
  
  // Create daily plan mutation
  const createDailyPlan = useMutation({
    mutationFn: async (data: DailyPlanForm) => {
      // Handle date serialization
      const formattedData = {
        ...data,
        homeworkDueDate: data.homeworkDueDate ? data.homeworkDueDate.toISOString().split('T')[0] : null,
      };
      
      const res = await apiRequest("POST", "/api/daily-plans", formattedData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `${dayName}'s plan created successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-plans/weekly", weeklyPlanId] });
    },
    onError: (error: any) => {
      setError(error.message || "Failed to create daily plan");
      toast({
        title: "Error",
        description: error.message || "Failed to create daily plan",
        variant: "destructive",
      });
    },
  });
  
  // Update daily plan mutation
  const updateDailyPlan = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: DailyPlanForm }) => {
      // Handle date serialization
      const formattedData = {
        ...data,
        homeworkDueDate: data.homeworkDueDate ? data.homeworkDueDate.toISOString().split('T')[0] : null,
      };
      
      const res = await apiRequest("PUT", `/api/daily-plans/${id}`, formattedData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `${dayName}'s plan updated successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-plans/weekly", weeklyPlanId] });
    },
    onError: (error: any) => {
      setError(error.message || "Failed to update daily plan");
      toast({
        title: "Error",
        description: error.message || "Failed to update daily plan",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: DailyPlanForm) => {
    setError(null);
    
    if (existingPlanId) {
      updateDailyPlan.mutate({ id: existingPlanId, data });
    } else {
      createDailyPlan.mutate(data);
    }
  };
  
  if (isLoadingPlans) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <Card>
      <CardContent className="pt-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <PlanFieldsBySubject 
              form={form} 
              subjectType={subjectType}
            />
            
            <div className="flex justify-end pt-2">
              <Button 
                type="submit" 
                disabled={createDailyPlan.isPending || updateDailyPlan.isPending}
              >
                {(createDailyPlan.isPending || updateDailyPlan.isPending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save {dayName}'s Plan
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
