import { useState } from "react";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Grade, insertGradeSchema } from "@shared/schema";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type GradeFormValues = z.infer<typeof insertGradeSchema>;

export default function Grades() {
  const { toast } = useToast();
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  // Forms
  const addForm = useForm<GradeFormValues>({
    resolver: zodResolver(insertGradeSchema),
    defaultValues: {
      name: "",
    },
  });

  const editForm = useForm<GradeFormValues>({
    resolver: zodResolver(insertGradeSchema),
    defaultValues: {
      name: "",
    },
  });

  // Fetch grades
  const { data: grades = [], isLoading } = useQuery<Grade[]>({
    queryKey: ["/api/grades"],
  });

  // Create grade
  const createGrade = useMutation({
    mutationFn: async (data: GradeFormValues) => {
      const res = await apiRequest("POST", "/api/grades", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Grade created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
      setIsAddDialogOpen(false);
      addForm.reset();
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
    mutationFn: async ({ id, data }: { id: number; data: GradeFormValues }) => {
      const res = await apiRequest("PUT", `/api/grades/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Grade updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
      setIsEditDialogOpen(false);
      editForm.reset();
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
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/grades/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Grade deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
      setIsDeleteAlertOpen(false);
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

  // Handle edit grade
  const handleEditGrade = (grade: Grade) => {
    setSelectedGrade(grade);
    editForm.reset({
      name: grade.name,
    });
    setIsEditDialogOpen(true);
  };

  // Submit handlers
  const onAddSubmit = (data: GradeFormValues) => {
    createGrade.mutate(data);
  };

  const onEditSubmit = (data: GradeFormValues) => {
    if (selectedGrade) {
      updateGrade.mutate({ id: selectedGrade.id, data });
    }
  };

  return (
    <PageWrapper title="Grades">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">
          Manage Grades
        </h1>
        <p className="text-neutral-600 mt-2">Add, edit, and delete grade levels for the school</p>
      </div>

      <div className="mb-6 flex justify-end">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Add Grade
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Grade</DialogTitle>
              <DialogDescription>
                Create a new grade level for the school.
              </DialogDescription>
            </DialogHeader>
            <Form {...addForm}>
              <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
                <FormField
                  control={addForm.control}
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
                  <Button type="submit" disabled={createGrade.isPending}>
                    {createGrade.isPending ? "Adding..." : "Add Grade"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-lg">Grades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grade Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grades.map((grade) => (
                  <TableRow key={grade.id}>
                    <TableCell className="font-medium">{grade.name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditGrade(grade)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedGrade(grade);
                            setIsDeleteAlertOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {grades.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-neutral-500">
                      No grades found. Add your first grade to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Grade Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Grade</DialogTitle>
            <DialogDescription>
              Update the grade level name.
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
              <DialogFooter>
                <Button type="submit" disabled={updateGrade.isPending}>
                  {updateGrade.isPending ? "Updating..." : "Update Grade"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the grade "{selectedGrade?.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => selectedGrade && deleteGrade.mutate(selectedGrade.id)}
            >
              {deleteGrade.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageWrapper>
  );
}
