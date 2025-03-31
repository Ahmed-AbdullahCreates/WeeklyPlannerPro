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
import { Plus, Pencil, UserPlus, UserCheck, UserX, ShieldCheck, ShieldOff, Trash2, Upload, Users } from "lucide-react";
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
      {/* Ultra-Enhanced Header Section with Dynamic Visual Elements */}
      <div className="relative mb-10 overflow-hidden">
        {/* Enhanced decorative background elements with better positioning and opacity */}
        <div className="absolute -top-20 right-0 w-[30rem] h-[30rem] bg-gradient-to-br from-indigo-50/40 to-indigo-100/20 rounded-full blur-3xl -z-10 opacity-80"></div>
        <div className="absolute -bottom-32 -left-20 w-[20rem] h-[20rem] bg-gradient-to-tr from-indigo-100/10 to-slate-100/20 rounded-full blur-3xl -z-10 opacity-40"></div>
        
        {/* Additional subtle decorative elements */}
        <div className="absolute top-10 right-1/4 w-6 h-6 rounded-full bg-indigo-200/20 blur-md"></div>
        <div className="absolute bottom-5 right-1/3 w-4 h-4 rounded-full bg-indigo-300/20 blur-sm"></div>
        
        <div className="relative z-10">
          {/* Enhanced category tag with better visual treatment */}
          <div className="inline-flex items-center mb-4 px-3 py-1.5 rounded-full bg-indigo-50/90 text-indigo-600 text-xs font-medium shadow-sm">
            <svg className="h-3.5 w-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
            </svg>
            <span>User Management</span>
          </div>
          
          {/* Enhanced title with better typography and gradient */}
          <h1 className="text-3xl font-bold mb-2">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600">
              Manage Teachers
            </span>
          </h1>
          
          {/* Enhanced description with better width control and typography */}
          <p className="text-slate-600 max-w-2xl text-lg leading-relaxed">
            Add, edit, and manage teacher accounts and their assignments to grades and subjects.
          </p>
        </div>
      </div>
      
      {/* Enhanced Action Bar with better spacing and visual hierarchy */}
      <div className="mb-8 flex flex-wrap justify-between items-center gap-4 bg-white/50 p-4 rounded-xl border border-slate-200/50 shadow-sm">
        {/* Enhanced button group with better visual relationship */}
        <div className="flex flex-wrap gap-3">
          {/* Enhanced Add Teacher button */}
          <Dialog open={isAddTeacherOpen} onOpenChange={setIsAddTeacherOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600/20 to-transparent blur-sm group-hover:opacity-100 opacity-0 transition-opacity duration-300"></div>
                <div className="relative z-10 flex items-center">
                  <UserPlus className="mr-2 h-4 w-4" /> 
                  <span>Add Teacher</span>
                </div>
              </Button>
            </DialogTrigger>
            <DialogContent className="border-slate-200">
              <DialogHeader>
                <DialogTitle className="text-indigo-700">Add New Teacher</DialogTitle>
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
                    <Button 
                      type="submit" 
                      disabled={addTeacher.isPending}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      {addTeacher.isPending ? "Adding..." : "Add Teacher"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          {/* Enhanced Import Teachers button */}
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 shadow-sm relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-indigo-50 opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
                <div className="relative z-10 flex items-center">
                  <Upload className="mr-2 h-4 w-4 group-hover:translate-y-[-1px] transition-transform duration-200" /> 
                  <span>Import Teachers</span>
                </div>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border-slate-200">
              <DialogHeader>
                <DialogTitle className="text-indigo-700">Import Teachers</DialogTitle>
                <DialogDescription>
                  Import multiple teachers from a CSV file.
                </DialogDescription>
              </DialogHeader>
              <UserImportCard />
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Enhanced teacher count indicator with animated element */}
        <div className="text-sm text-slate-500 flex items-center bg-slate-50/80 px-3 py-1.5 rounded-full">
          <div className="w-3 h-3 rounded-full bg-indigo-100 mr-2 flex items-center justify-center relative">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 absolute animate-pulse-subtle"></div>
          </div>
          <span className="font-medium text-indigo-600">{teachers.length}</span>
          <span className="ml-1">teachers registered</span>
        </div>
      </div>
      
      {/* Super-Enhanced Card with frosted glass effect and improved shadows */}
      <Card className="border-slate-200/60 shadow-sm overflow-hidden rounded-xl backdrop-blur-[2px] bg-white/90">
        {/* Enhanced card header with better gradient and alignment */}
        <CardHeader className="py-4 bg-gradient-to-r from-slate-50/95 to-white/95 border-b border-slate-200/60 flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-slate-800 font-medium flex items-center">
            <div className="p-1.5 rounded-md bg-indigo-50/80 text-indigo-500 mr-3">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-indigo-600 font-semibold">Teachers</span>
            <span className="ml-1.5 text-slate-600">Directory</span>
          </CardTitle>
          
          {/* Enhanced search with better interaction feedback */}
          <div className="relative w-64 group">
            <Input 
              placeholder="Search teachers..."
              className="pl-8 border-slate-200 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300/30 h-9 text-sm transition-all duration-200 group-hover:border-slate-300"
            />
            <div className="absolute left-2.5 top-2.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-200">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </CardHeader>
        
        {/* Enhanced table with subtle hover effects and better spacing */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/70 border-b border-slate-200/60">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-slate-500 font-medium py-3 text-sm">Name</TableHead>
                  <TableHead className="text-slate-500 font-medium py-3 text-sm">Username</TableHead>
                  <TableHead className="text-slate-500 font-medium py-3 text-sm">Role</TableHead>
                  <TableHead className="text-slate-500 font-medium py-3 text-sm">Assigned Grades</TableHead>
                  <TableHead className="text-slate-500 font-medium py-3 text-sm text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {teachers.map(teacher => (
                  <TableRow 
                    key={teacher.id} 
                    className="hover:bg-slate-50/80 border-b border-slate-100/80 transition-colors group"
                  >
                    <TableCell className="font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                      {teacher.fullName}
                    </TableCell>
                    <TableCell className="text-slate-600 group-hover:text-slate-700 transition-colors">
                      {teacher.username}
                    </TableCell>
                    <TableCell>
                      {/* Enhanced badges with better visual feedback */}
                      {teacher.isAdmin ? (
                        <Badge variant="default" className="bg-indigo-500 hover:bg-indigo-600 text-[10px] group-hover:shadow-sm transition-all">
                          Administrator
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-600 border-slate-200 bg-slate-50 text-[10px] group-hover:bg-white group-hover:border-slate-300 transition-all">
                          Teacher
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {/* Enhanced grade badges with better visual feedback */}
                        {teacherGradesMap[teacher.id]?.map(grade => (
                          <Badge 
                            key={grade.id} 
                            variant="secondary" 
                            className="bg-slate-100 text-slate-600 hover:bg-slate-200 text-[10px] py-0 px-2 group-hover:bg-slate-100/80 transition-colors"
                          >
                            {grade.name}
                          </Badge>
                        )) || 
                        <span className="text-slate-400 text-xs italic flex items-center">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300/80 mr-1.5"></span>
                          No grades assigned
                        </span>}
                      </div>
                    </TableCell>
                    
                    {/* Enhanced action buttons with better hover effects */}
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {/* Enhanced assign to grade button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTeacher(teacher);
                            setIsAssignGradeOpen(true);
                          }}
                          className="hover:bg-indigo-50 hover:text-indigo-600 h-8 w-8 p-0 opacity-80 group-hover:opacity-100 transition-all"
                          title="Assign to Grade"
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                        
                        {/* Enhanced assign to subject button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTeacher(teacher);
                            setIsAssignSubjectOpen(true);
                          }}
                          disabled={!teacherGradesMap[teacher.id]?.length}
                          className="hover:bg-indigo-50 h-8 w-8 p-0 disabled:opacity-30 opacity-80 group-hover:opacity-100 transition-all"
                          title="Assign to Subject"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        
                        {/* Enhanced delete button */}
                        {teacher.id !== currentUser?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTeacher(teacher);
                              setIsDeleteConfirmOpen(true);
                            }}
                            title="Delete User"
                            className="hover:bg-rose-50 hover:text-rose-600 h-8 w-8 p-0 opacity-80 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="h-4 w-4 text-rose-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                
                {/* Enhanced Empty State */}
                {teachers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-52 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-500 py-10">
                        <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-3 border border-slate-100">
                          <UserPlus className="h-8 w-8 text-indigo-200" />
                        </div>
                        <p className="font-medium text-slate-600">No teachers found</p>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm">
                          Add your first teacher to get started with class assignments and weekly planning
                        </p>
                        <Button 
                          onClick={() => setIsAddTeacherOpen(true)} 
                          className="mt-4 bg-indigo-500 hover:bg-indigo-600"
                          size="sm"
                        >
                          <UserPlus className="h-4 w-4 mr-2" /> Add Teacher
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
      
      {/* Enhanced Assign to Grade Dialog */}
      <Dialog open={isAssignGradeOpen} onOpenChange={setIsAssignGradeOpen}>
        <DialogContent className="border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-indigo-700 flex items-center">
              <UserCheck className="h-5 w-5 text-indigo-500 mr-2" /> 
              Assign to Grade
            </DialogTitle>
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
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setIsAssignGradeOpen(false)}
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
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
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {assignGrade.isPending ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Enhanced Assign to Subject Dialog */}
      <Dialog open={isAssignSubjectOpen} onOpenChange={setIsAssignSubjectOpen}>
        <DialogContent className="border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-indigo-700 flex items-center">
              <Pencil className="h-5 w-5 text-indigo-500 mr-2" /> 
              Assign to Subject
            </DialogTitle>
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
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setIsAssignSubjectOpen(false)}
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
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
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {assignSubject.isPending ? "Assigning..." : "Assign Subject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Enhanced Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent className="border-rose-100">
          <AlertDialogHeader>
            <div className="bg-rose-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-rose-500" />
            </div>
            <AlertDialogTitle className="text-rose-600 text-center">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              This will permanently delete the account for <span className="font-medium">{selectedTeacher?.fullName}</span>.
              <br />This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="text-slate-700 hover:bg-slate-50 border-slate-200">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-500 hover:bg-rose-600 text-white"
              onClick={() => {
                if (selectedTeacher) {
                  deleteUser.mutate(selectedTeacher.id);
                }
              }}
            >
              {deleteUser.isPending ? "Deleting..." : "Yes, Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageWrapper>
  );
}
