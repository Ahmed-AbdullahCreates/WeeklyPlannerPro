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
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">
          Manage Planning Weeks
        </h1>
        <p className="text-neutral-600 mt-2">
          Define planning periods for teachers to create their weekly plans
        </p>
      </div>

      <div className="mb-6 flex justify-end">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Add Planning Week
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Planning Week</DialogTitle>
              <DialogDescription>
                Create a new weekly planning period for teachers.
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

      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-lg">Planning Weeks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Week</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planningWeeks.map((week) => (
                  <TableRow key={week.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-primary" />
                        <div>
                          <div className="font-medium">Week {week.weekNumber}</div>
                          <div className="text-sm text-neutral-500">{week.year}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(week.startDate), "MMM d, yyyy")} - {format(new Date(week.endDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {week.isActive ? (
                        <Badge className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleWeekActive.mutate(week.id)}
                        >
                          {week.isActive ? (
                            <PowerOff className="h-4 w-4 text-red-500" title="Deactivate" />
                          ) : (
                            <Power className="h-4 w-4 text-green-500" title="Activate" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedWeek(week);
                            setIsDeleteAlertOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {planningWeeks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-neutral-500">
                      No planning weeks found. Add your first planning week to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete Week {selectedWeek?.weekNumber} ({selectedWeek?.year}).
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => selectedWeek && deletePlanningWeek.mutate(selectedWeek.id)}
            >
              {deletePlanningWeek.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageWrapper>
  );
}
