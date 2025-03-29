import { PageWrapper } from "@/components/layout/page-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Grade, Subject } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, UserPlus, UserCheck, UserX, ShieldCheck, ShieldOff, Trash2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { UserImportCard } from "@/components/admin/user-import";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required"),
  isAdmin: z.boolean().default(false),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Teachers() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [selectedTeacher, setSelectedTeacher] = useState<User | null>(null);
  const [isAssignGradeOpen, setIsAssignGradeOpen] = useState(false);
  const [isAssignSubjectOpen, setIsAssignSubjectOpen] = useState(false);
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
  // State for the subject assignment form
  const [selectedGradeId, setSelectedGradeId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  
  // State for tracking teacher grades in UI
  const [teacherGradesMap, setTeacherGradesMap] = useState<Record<number, Grade[]>>({});
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      isAdmin: false,
    },
  });
  
  // Fetch teachers
  const { data: teachers = [], isLoading: isLoadingTeachers } = useQuery<User[]>({
    queryKey: ["/api/teachers"],
  });
  
  // Fetch grades
  const { data: grades = [] } = useQuery<Grade[]>({
    queryKey: ["/api/grades"],
  });
  
  // Fetch subjects
  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });
  
  // Get teacher grades
  const { data: teacherGrades = [] } = useQuery<Grade[]>({
    queryKey: ["/api/teacher-grades", selectedTeacher?.id],
    enabled: !!selectedTeacher,
  });
  
  // Prefetch teacher grades when component loads
  useEffect(() => {
    if (teachers.length > 0) {
      // Create batched fetches for teacher grades
      const fetchTeacherGrades = async () => {
        for (const teacher of teachers) {
          if (!teacherGradesMap[teacher.id]) {
            try {
              const res = await fetch(`/api/teacher-grades/${teacher.id}`);
              const grades = await res.json();
              setTeacherGradesMap(prev => ({
                ...prev,
                [teacher.id]: grades
              }));
            } catch (error) {
              console.error(`Failed to fetch grades for teacher ${teacher.id}`, error);
            }
          }
        }
      };
      
      fetchTeacherGrades();
    }
  }, [teachers]);
  
  // Add teacher
  const addTeacher = useMutation({
    mutationFn: async (data: RegisterFormValues) => {
      const res = await apiRequest("POST", "/api/register", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Teacher added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      setIsAddTeacherOpen(false);
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
  
  // Assign teacher to grade
  const assignGrade = useMutation({
    mutationFn: async ({ teacherId, gradeId }: { teacherId: number, gradeId: number }) => {
      const res = await apiRequest("POST", "/api/teacher-grades", { teacherId, gradeId });
      return await res.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Success",
        description: "Grade assigned successfully",
      });
      
      // Get the latest teacher grades to update our UI
      if (selectedTeacher) {
        fetch(`/api/teacher-grades/${variables.teacherId}`)
          .then(res => res.json())
          .then(grades => {
            // Update the local map with fresh data
            setTeacherGradesMap(prev => ({
              ...prev,
              [variables.teacherId]: grades
            }));
          });
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/teacher-grades", selectedTeacher?.id] });
      setIsAssignGradeOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Assign teacher to subject
  const assignSubject = useMutation({
    mutationFn: async ({ teacherId, gradeId, subjectId }: { teacherId: number, gradeId: number, subjectId: number }) => {
      const res = await apiRequest("POST", "/api/teacher-subjects", { teacherId, gradeId, subjectId });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Subject assigned successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher-subjects", selectedTeacher?.id] });
      setIsAssignSubjectOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Toggle user role (admin/teacher)
  const toggleUserRole = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: number, isAdmin: boolean }) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}/role`, { isAdmin });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete user
  const deleteUser = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/users/${userId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete user");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      setIsDeleteConfirmOpen(false);
      setSelectedTeacher(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: RegisterFormValues) => {
    addTeacher.mutate(data);
  };
  
  return (
    <PageWrapper title="Teachers">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">
          Manage Teachers
        </h1>
        <p className="text-neutral-600 mt-2">Add, edit, and manage teacher accounts and their assignments</p>
      </div>
      
      <div className="mb-6 flex flex-col sm:flex-row justify-end items-start sm:items-center gap-3">
        <div className="flex space-x-2">
          <Dialog open={isAddTeacherOpen} onOpenChange={setIsAddTeacherOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <UserPlus className="mr-2 h-4 w-4" /> Add Teacher
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Teacher</DialogTitle>
                <DialogDescription>
                  Create a new teacher account to give them access to the weekly planner system.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="johnsmith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isAdmin"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-2">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Admin Account
                          </FormLabel>
                          <p className="text-sm text-neutral-500">
                            Grant this user administrative privileges
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={addTeacher.isPending}>
                      {addTeacher.isPending ? "Adding..." : "Add Teacher"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                <Upload className="mr-2 h-4 w-4" /> Import Users
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Import Teachers</DialogTitle>
                <DialogDescription>
                  Import multiple teachers from a CSV file.
                </DialogDescription>
              </DialogHeader>
              <UserImportCard />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-lg">Teachers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Assigned Grades</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map(teacher => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium">{teacher.fullName}</TableCell>
                    <TableCell>{teacher.username}</TableCell>
                    <TableCell>
                      {teacher.isAdmin ? (
                        <Badge variant="default" className="bg-blue-500">Admin</Badge>
                      ) : (
                        <Badge variant="outline">Teacher</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {teacherGradesMap[teacher.id]?.map(grade => (
                          <Badge key={grade.id} variant="secondary">{grade.name}</Badge>
                        )) || <span className="text-neutral-500 text-sm">No grades assigned</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTeacher(teacher);
                            setIsAssignGradeOpen(true);
                          }}
                          title="Assign to Grade"
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTeacher(teacher);
                            setIsAssignSubjectOpen(true);
                          }}
                          title="Assign to Subject"
                          disabled={!teacherGradesMap[teacher.id]?.length}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        
                        {teacher.id !== currentUser?.id && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                toggleUserRole.mutate({
                                  userId: teacher.id,
                                  isAdmin: !teacher.isAdmin
                                });
                              }}
                              title={teacher.isAdmin ? "Remove Admin" : "Make Admin"}
                            >
                              {teacher.isAdmin ? (
                                <ShieldOff className="h-4 w-4 text-red-500" />
                              ) : (
                                <ShieldCheck className="h-4 w-4 text-blue-500" />
                              )}
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedTeacher(teacher);
                                setIsDeleteConfirmOpen(true);
                              }}
                              title="Delete User"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                
                {teachers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-neutral-500">
                      No teachers found. Add your first teacher to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Assign to Grade Dialog */}
      <Dialog open={isAssignGradeOpen} onOpenChange={setIsAssignGradeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign to Grade</DialogTitle>
            <DialogDescription>
              Assign {selectedTeacher?.fullName} to a grade.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="grade">Select Grade</Label>
              <Select onValueChange={(value) => setSelectedGradeId(value)}>
                <SelectTrigger id="grade">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map(grade => (
                    <SelectItem key={grade.id} value={grade.id.toString()}>
                      {grade.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Current Assignments</h4>
              <ScrollArea className="h-32 border rounded-md p-2">
                {teacherGrades.length > 0 ? (
                  <div className="space-y-2">
                    {teacherGrades.map(grade => (
                      <div key={grade.id} className="flex justify-between items-center">
                        <span>{grade.name}</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            if (selectedTeacher) {
                              // Remove teacher from grade
                              apiRequest("DELETE", `/api/teacher-grades/${selectedTeacher.id}/${grade.id}`)
                                .then(() => {
                                  queryClient.invalidateQueries({ 
                                    queryKey: ["/api/teacher-grades", selectedTeacher.id] 
                                  });
                                  toast({
                                    title: "Success",
                                    description: `Removed from ${grade.name}`,
                                  });
                                })
                                .catch(error => {
                                  toast({
                                    title: "Error",
                                    description: error.message,
                                    variant: "destructive",
                                  });
                                });
                            }
                          }}
                        >
                          <UserX className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-neutral-500 text-sm">No grades assigned yet.</p>
                )}
              </ScrollArea>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAssignGradeOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedTeacher && selectedGradeId) {
                  assignGrade.mutate({
                    teacherId: selectedTeacher.id,
                    gradeId: parseInt(selectedGradeId)
                  });
                }
              }}
              disabled={!selectedGradeId || assignGrade.isPending}
            >
              {assignGrade.isPending ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Assign to Subject Dialog */}
      <Dialog open={isAssignSubjectOpen} onOpenChange={setIsAssignSubjectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign to Subject</DialogTitle>
            <DialogDescription>
              Assign {selectedTeacher?.fullName} to a subject within a grade.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="grade-select">Grade</Label>
              <Select onValueChange={(value) => setSelectedGradeId(value)}>
                <SelectTrigger id="grade-select">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {teacherGrades.map(grade => (
                    <SelectItem key={grade.id} value={grade.id.toString()}>
                      {grade.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subject-select">Subject</Label>
              <Select 
                onValueChange={(value) => setSelectedSubjectId(value)}
                disabled={!selectedGradeId}
              >
                <SelectTrigger id="subject-select">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAssignSubjectOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedTeacher && selectedGradeId && selectedSubjectId) {
                  assignSubject.mutate({
                    teacherId: selectedTeacher.id,
                    gradeId: parseInt(selectedGradeId),
                    subjectId: parseInt(selectedSubjectId)
                  });
                }
              }}
              disabled={!selectedGradeId || !selectedSubjectId || assignSubject.isPending}
            >
              {assignSubject.isPending ? "Assigning..." : "Assign Subject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the account for {selectedTeacher?.fullName}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => {
                if (selectedTeacher) {
                  deleteUser.mutate(selectedTeacher.id);
                }
              }}
            >
              {deleteUser.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageWrapper>
  );
}
