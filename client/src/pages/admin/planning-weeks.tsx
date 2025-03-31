import { useState } from "react";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Calendar, Trash2, Power, PowerOff } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PlanningWeek, insertPlanningWeekSchema } from "@shared/schema";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const planningWeekSchema = z.object({
  weekNumber: z.coerce.number().min(1, "Week number must be at least 1").max(52, "Week number must be at most 52"),
  year: z.coerce.number().min(2000, "Year must be at least 2000").max(2100, "Year must be at most 2100"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isActive: z.boolean().default(true),
}).refine(data => {
  return data.startDate <= data.endDate;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

type PlanningWeekFormValues = z.infer<typeof planningWeekSchema>;

export default function PlanningWeeks() {
  const { toast } = useToast();
  const [selectedWeek, setSelectedWeek] = useState<PlanningWeek | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  // Form
  const form = useForm<PlanningWeekFormValues>({
    resolver: zodResolver(planningWeekSchema),
    defaultValues: {
      weekNumber: 1,
      year: new Date().getFullYear(),
      startDate: new Date(),
      endDate: new Date(),
      isActive: true,
    },
  });

  // Fetch planning weeks
  const { data: planningWeeks = [], isLoading } = useQuery<PlanningWeek[]>({
    queryKey: ["/api/planning-weeks"],
  });

  // Create planning week
  const createPlanningWeek = useMutation({
    mutationFn: async (data: PlanningWeekFormValues) => {
      const res = await apiRequest("POST", "/api/planning-weeks", {
        ...data,
        startDate: data.startDate.toISOString().split("T")[0],
        endDate: data.endDate.toISOString().split("T")[0],
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Planning week created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/planning-weeks"] });
      setIsAddDialogOpen(false);
      form.reset({
        weekNumber: 1,
        year: new Date().getFullYear(),
        startDate: new Date(),
        endDate: new Date(),
        isActive: true,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle week active status
  const toggleWeekActive = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/planning-weeks/${id}/toggle`, {});
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Week ${data.weekNumber} is now ${data.isActive ? "active" : "inactive"}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/planning-weeks"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete planning week
  const deletePlanningWeek = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/planning-weeks/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Planning week deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/planning-weeks"] });
      setIsDeleteAlertOpen(false);
      setSelectedWeek(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Submit handler
  const onSubmit = (data: PlanningWeekFormValues) => {
    createPlanningWeek.mutate(data);
  };

  return (
    <PageWrapper title="Planning Weeks">
      {/* Simplified Header Section */}
      <div className="mb-8">
        <div className="absolute -z-10 top-0 right-0 w-96 h-80 bg-indigo-50/30 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-2 text-indigo-600">Manage Planning Weeks</h1>
          <p className="text-slate-600 max-w-2xl">Configure academic planning weeks for teacher lesson planning.</p>
        </div>
      </div>

      {/* Simplified Action Bar */}
      <div className="mb-6 flex flex-wrap">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="mr-2 h-4 w-4" /> 
              <span>Add Planning Week</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-indigo-700 flex items-center">
                <Calendar className="h-5 w-5 text-indigo-500 mr-2" />
                Add Planning Week
              </DialogTitle>
              <DialogDescription>
                Create a new planning week period for teachers.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="weekNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Week Number</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="15" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="2024" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : ""}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : ""}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Active Week
                        </FormLabel>
                        <p className="text-sm text-neutral-500">
                          Teachers can create and edit plans during active weeks
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createPlanningWeek.isPending}>
                    {createPlanningWeek.isPending ? "Creating..." : "Create Week"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Enhanced Card */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="py-4 bg-slate-50 border-b border-slate-200 flex flex-row items-center">
          <CardTitle className="text-lg text-slate-800 font-medium flex items-center">
            <Calendar className="h-5 w-5 text-indigo-500 mr-2" />
            <span>Planning Weeks</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/70 border-b border-slate-200">
                <TableRow>
                  <TableHead className="text-slate-500 font-medium py-3 text-sm">Week</TableHead>
                  <TableHead className="text-slate-500 font-medium py-3 text-sm">Dates</TableHead>
                  <TableHead className="text-slate-500 font-medium py-3 text-sm">Status</TableHead>
                  <TableHead className="text-slate-500 font-medium py-3 text-sm text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {planningWeeks.map((week) => (
                  <TableRow 
                    key={week.id}
                    className="hover:bg-slate-50 border-b border-slate-100"
                  >
                    <TableCell>
                      <div className="flex items-center">
                        <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-500 mr-2">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-700">Week {week.weekNumber}</div>
                          <div className="text-xs text-slate-500">{week.year}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {format(new Date(week.startDate), "MMM d, yyyy")} - {format(new Date(week.endDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {week.isActive ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-600 border-slate-200 bg-slate-50">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleWeekActive.mutate(week.id)}
                          className={week.isActive 
                            ? "hover:bg-rose-50 hover:text-rose-600 h-8 w-8 p-0" 
                            : "hover:bg-emerald-50 hover:text-emerald-600 h-8 w-8 p-0"
                          }
                          title={week.isActive ? "Deactivate" : "Activate"}
                        >
                          {week.isActive ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedWeek(week);
                            setIsDeleteAlertOpen(true);
                          }}
                          className="hover:bg-rose-50 hover:text-rose-600 h-8 w-8 p-0"
                          title="Delete Week"
                        >
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                
                {/* Empty State */}
                {planningWeeks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-40 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-500 py-6">
                        <Calendar className="h-8 w-8 text-slate-300 mb-2" />
                        <p className="text-slate-600">No planning weeks found</p>
                        <p className="text-xs text-slate-400 mt-1">Add your first planning week to get started</p>
                        <Button 
                          onClick={() => setIsAddDialogOpen(true)} 
                          className="mt-4 bg-indigo-600"
                          size="sm"
                        >
                          <Plus className="h-4 w-4 mr-2" /> Add Week
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Alert Dialog with consistent styling */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="border-rose-100">
          <AlertDialogHeader>
            <div className="bg-rose-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-rose-500" />
            </div>
            <AlertDialogTitle className="text-rose-600 text-center">Delete Planning Week?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              This will permanently delete Week {selectedWeek?.weekNumber} ({selectedWeek?.year}).
              <br />This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="text-slate-700 hover:bg-slate-50 border-slate-200">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-500 hover:bg-rose-600 text-white"
              onClick={() => selectedWeek && deletePlanningWeek.mutate(selectedWeek.id)}
            >
              {deletePlanningWeek.isPending ? "Deleting..." : "Yes, Delete Week"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageWrapper>
  );
}
