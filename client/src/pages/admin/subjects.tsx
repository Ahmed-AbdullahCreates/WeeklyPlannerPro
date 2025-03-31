import { PageWrapper } from "@/components/layout/page-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Subject } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const subjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  type: z.string().optional(),
});

type SubjectFormValues = z.infer<typeof subjectSchema>;

export default function Subjects() {
  const { toast } = useToast();
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [isEditSubjectOpen, setIsEditSubjectOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
  const subjectTypes = [
    { value: "standard", label: "Standard Subject" },
    { value: "art", label: "Art" },
    { value: "pe", label: "PE" }
  ];
  
  const form = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: "",
      type: "standard",
    },
  });
  
  const editForm = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: selectedSubject?.name || "",
      type: selectedSubject?.type || "standard",
    },
  });
  
  // Update edit form when selected subject changes
  useEffect(() => {
    if (selectedSubject) {
      editForm.setValue("name", selectedSubject.name);
      editForm.setValue("type", selectedSubject.type || "standard");
    }
  }, [selectedSubject, editForm]);
  
  // Fetch subjects
  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });
  
  // Add subject
  const addSubject = useMutation({
    mutationFn: async (data: SubjectFormValues) => {
      const res = await apiRequest("POST", "/api/subjects", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Subject added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      setIsAddSubjectOpen(false);
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
  
  // Update subject
  const updateSubject = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: SubjectFormValues }) => {
      const res = await apiRequest("PATCH", `/api/subjects/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Subject updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      setIsEditSubjectOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete subject
  const deleteSubject = useMutation({
    mutationFn: async (subjectId: number) => {
      const res = await apiRequest("DELETE", `/api/subjects/${subjectId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete subject");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Subject deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      setIsDeleteConfirmOpen(false);
      setSelectedSubject(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: SubjectFormValues) => {
    addSubject.mutate(data);
  };
  
  const onEditSubmit = (data: SubjectFormValues) => {
    if (selectedSubject) {
      updateSubject.mutate({ id: selectedSubject.id, data });
    }
  };
  
  // Simplified badge styling
  const getSubjectTypeBadge = (type: string | undefined) => {
    const types = {
      art: "bg-violet-50 text-violet-700",
      pe: "bg-emerald-50 text-emerald-700",
      language: "bg-sky-50 text-sky-700",
      standard: "bg-slate-50 text-slate-700"
    };

    return (
      <Badge className={cn(
        types[type as keyof typeof types] || types.standard,
        "px-2.5 py-0.5 font-medium"
      )}>
        {type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Standard'}
      </Badge>
    );
  };

  return (
    <PageWrapper title="Subjects">
      {/* Header Section */}
      <div className="relative mb-8 overflow-hidden">
        <div className="absolute -z-10 inset-0">
          <div className="absolute -top-20 right-0 w-[800px] h-[500px] bg-gradient-to-br from-indigo-50/50 to-transparent rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center mb-4 px-3 py-1.5 rounded-full bg-indigo-50/90 text-indigo-600 text-xs font-medium shadow-sm border border-indigo-100/50">
            <BookOpen className="h-3.5 w-3.5 mr-1.5" />
            <span>Subject Management</span>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-indigo-600">
            Manage Subjects
          </h1>
          <p className="text-slate-600 max-w-2xl">
            Create and manage subjects taught at your school.
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="mb-6 flex justify-between items-center">
        <Dialog open={isAddSubjectOpen} onOpenChange={setIsAddSubjectOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> Add Subject
            </Button>
          </DialogTrigger>
          {/* ...existing dialog content... */}
        </Dialog>
      </div>

      {/* Main Card */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="py-4 bg-slate-50 border-b border-slate-200 flex flex-row items-center">
          <CardTitle className="text-lg text-slate-800 font-medium flex items-center">
            <BookOpen className="h-5 w-5 text-indigo-500 mr-2" />
            <span>Subject Directory</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/70 border-b border-slate-200">
              <TableRow>
                <TableHead className="text-slate-500 font-medium py-3 text-sm">Subject Name</TableHead>
                <TableHead className="text-slate-500 font-medium py-3 text-sm">Type</TableHead>
                <TableHead className="text-slate-500 font-medium py-3 text-sm text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((subject) => (
                <TableRow 
                  key={subject.id}
                  className="border-b border-slate-100"
                >
                  <TableCell className="font-medium text-slate-900">
                    {subject.name}
                  </TableCell>
                  <TableCell>{getSubjectTypeBadge(subject.type)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedSubject(subject);
                          setIsEditSubjectOpen(true);
                        }}
                        className="h-8 w-8 p-0 hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedSubject(subject);
                          setIsDeleteConfirmOpen(true);
                        }}
                        className="h-8 w-8 p-0 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {/* Empty State */}
              {subjects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500 py-6">
                      <BookOpen className="h-8 w-8 text-slate-300 mb-2" />
                      <p className="text-slate-600">No subjects found</p>
                      <p className="text-xs text-slate-400 mt-1">Add your first subject to get started</p>
                      <Button 
                        onClick={() => setIsAddSubjectOpen(true)} 
                        className="mt-4 bg-indigo-600 hover:bg-indigo-700"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Subject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modern Dialog Styling */}
      <Dialog open={isEditSubjectOpen} onOpenChange={setIsEditSubjectOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Edit Subject</DialogTitle>
            <DialogDescription className="text-slate-600">
              Make changes to {selectedSubject?.name}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjectTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditSubjectOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {updateSubject.isPending ? "Saving..." : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modern Alert Dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <AlertDialogTitle className="text-center text-lg font-semibold">
              Delete Subject
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-slate-600">
              Are you sure you want to delete <span className="font-medium text-slate-900">{selectedSubject?.name}</span>?
              <br />This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2">
            <AlertDialogCancel className="border-slate-200">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => selectedSubject && deleteSubject.mutate(selectedSubject.id)}
            >
              {deleteSubject.isPending ? "Deleting..." : "Delete Subject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageWrapper>
  );
}
