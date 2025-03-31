import { PageWrapper } from "@/components/layout/page-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Grade } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const gradeSchema = z.object({
  name: z.string().min(1, "Grade name is required"),
});

type GradeFormValues = z.infer<typeof gradeSchema>;

export default function Grades() {
  const { toast } = useToast();
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [isAddGradeOpen, setIsAddGradeOpen] = useState(false);
  const [isEditGradeOpen, setIsEditGradeOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
  const form = useForm<GradeFormValues>({
    resolver: zodResolver(gradeSchema),
    defaultValues: {
      name: "",
    },
  });
  
  const editForm = useForm<GradeFormValues>({
    resolver: zodResolver(gradeSchema),
    defaultValues: {
      name: selectedGrade?.name || "",
    },
  });
  
  // Update edit form when selected grade changes
  useEffect(() => {
    if (selectedGrade) {
      editForm.setValue("name", selectedGrade.name);
    }
  }, [selectedGrade, editForm]);
  
  // Fetch grades
  const { data: grades = [], isLoading } = useQuery<Grade[]>({
    queryKey: ["/api/grades"],
  });
  
  // Add grade
  const addGrade = useMutation({
    mutationFn: async (data: GradeFormValues) => {
      const res = await apiRequest("POST", "/api/grades", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Grade added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
      setIsAddGradeOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update grade
  const updateGrade = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: GradeFormValues }) => {
      const res = await apiRequest("PATCH", `/api/grades/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Grade updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
      setIsEditGradeOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete grade
  const deleteGrade = useMutation({
    mutationFn: async (gradeId: number) => {
      const res = await apiRequest("DELETE", `/api/grades/${gradeId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete grade");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Grade deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
      setIsDeleteConfirmOpen(false);
      setSelectedGrade(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: GradeFormValues) => {
    addGrade.mutate(data);
  };
  
  const onEditSubmit = (data: GradeFormValues) => {
    if (selectedGrade) {
      updateGrade.mutate({ id: selectedGrade.id, data });
    }
  };
  
  return (
    <PageWrapper title="Grades">
      {/* Simplified Header Section */}
      <div className="mb-8">
        {/* Simple background with fewer elements */}
        <div className="absolute -z-10 top-0 right-0 w-96 h-80 bg-indigo-50/30 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          {/* Cleaner title with simpler gradient */}
          <h1 className="text-2xl font-bold mb-2 text-indigo-600">Manage Grades</h1>
          <p className="text-slate-600 max-w-2xl">Create and manage grade levels for your school's structure.</p>
        </div>
      </div>
      
      {/* Simplified Action Bar - Removed grade count indicator */}
      <div className="mb-6 flex flex-wrap">
        <div className="flex flex-wrap gap-3">
          {/* Add Grade Button with simpler styling */}
          <Dialog open={isAddGradeOpen} onOpenChange={setIsAddGradeOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Plus className="mr-2 h-4 w-4" /> 
                <span>Add Grade</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="border-slate-200">
              <DialogHeader>
                <DialogTitle className="text-indigo-700 flex items-center">
                  <GraduationCap className="h-5 w-5 text-indigo-500 mr-2" />
                  Add New Grade
                </DialogTitle>
                <DialogDescription>
                  Create a new grade level for your school.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Grade 1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={addGrade.isPending}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      {addGrade.isPending ? "Adding..." : "Add Grade"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Cleaner Card - Removed search input */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="py-4 bg-slate-50 border-b border-slate-200 flex flex-row items-center">
          <CardTitle className="text-lg text-slate-800 font-medium flex items-center">
            <GraduationCap className="h-5 w-5 text-indigo-500 mr-2" />
            <span>Grades Directory</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/70 border-b border-slate-200">
                <TableRow>
                  <TableHead className="text-slate-500 font-medium py-3 text-sm">Grade Name</TableHead>
                  <TableHead className="text-slate-500 font-medium py-3 text-sm text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {grades.map(grade => (
                  <TableRow 
                    key={grade.id} 
                    className="hover:bg-slate-50 border-b border-slate-100"
                  >
                    <TableCell className="font-medium text-slate-700">
                      {grade.name}
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedGrade(grade);
                            setIsEditGradeOpen(true);
                          }}
                          className="hover:bg-indigo-50 hover:text-indigo-600 h-8 w-8 p-0"
                          title="Edit Grade"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedGrade(grade);
                            setIsDeleteConfirmOpen(true);
                          }}
                          title="Delete Grade"
                          className="hover:bg-rose-50 hover:text-rose-600 h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                
                {/* Simplified Empty State */}
                {grades.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="h-40 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-500 py-6">
                        <GraduationCap className="h-8 w-8 text-slate-300 mb-2" />
                        <p className="text-slate-600">No grades found</p>
                        <p className="text-xs text-slate-400 mt-1">Add your first grade to get started</p>
                        <Button 
                          onClick={() => setIsAddGradeOpen(true)} 
                          className="mt-4 bg-indigo-600"
                          size="sm"
                        >
                          <Plus className="h-4 w-4 mr-2" /> Add Grade
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
      
      {/* Edit Grade Dialog */}
      <Dialog open={isEditGradeOpen} onOpenChange={setIsEditGradeOpen}>
        <DialogContent className="border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-indigo-700 flex items-center">
              <Pencil className="h-5 w-5 text-indigo-500 mr-2" /> 
              Edit Grade
            </DialogTitle>
            <DialogDescription>
              Update the details for {selectedGrade?.name}.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Grade 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="gap-2 sm:gap-0">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditGradeOpen(false)}
                  className="border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateGrade.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {updateGrade.isPending ? "Updating..." : "Update Grade"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent className="border-rose-100">
          <AlertDialogHeader>
            <div className="bg-rose-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-rose-500" />
            </div>
            <AlertDialogTitle className="text-rose-600 text-center">Delete Grade?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              This will permanently delete <span className="font-medium">{selectedGrade?.name}</span> and remove any associated teacher assignments.
              <br />This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="text-slate-700 hover:bg-slate-50 border-slate-200">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-500 hover:bg-rose-600 text-white"
              onClick={() => {
                if (selectedGrade) {
                  deleteGrade.mutate(selectedGrade.id);
                }
              }}
            >
              {deleteGrade.isPending ? "Deleting..." : "Yes, Delete Grade"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageWrapper>
  );
}
