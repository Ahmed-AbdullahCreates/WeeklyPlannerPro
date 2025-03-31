import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { GraduationCap, BookOpen, ClipboardList, Plus, BadgeCheck } from "lucide-react";
import { Grade, Subject } from "@shared/schema";

export function TeacherDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("assigned-grades");

  // Query assigned grades
  const { data: assignedGrades = [], isLoading: isLoadingGrades } = useQuery<Grade[]>({
    queryKey: ["/api/teacher-grades", user?.id],
    enabled: !!user?.id,
  });

  // Function to handle grade selection for displaying subjects
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);

  // Query subjects for selected grade
  const { data: assignedSubjects = [], isLoading: isLoadingSubjects } = useQuery<Subject[]>({
    queryKey: ["/api/teacher-subjects", user?.id, selectedGrade],
    enabled: !!user?.id && !!selectedGrade,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome, {user?.fullName}</h2>
        <p className="text-gray-600">
          View your assigned grades, subjects, and create weekly lesson plans.
        </p>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assigned-grades" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" /> Your Grades
          </TabsTrigger>
          <TabsTrigger value="assigned-subjects" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> Your Subjects
          </TabsTrigger>
        </TabsList>

        {/* Assigned Grades Tab */}
        <TabsContent value="assigned-grades" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Your Assigned Grades
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingGrades ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : assignedGrades.length === 0 ? (
                <div className="text-center py-8">
                  <BadgeCheck className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <h3 className="text-lg font-medium text-gray-500 mb-1">No Grades Assigned</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    You haven't been assigned to any grades yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Grade Name</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignedGrades.map((grade) => (
                        <TableRow key={grade.id}>
                          <TableCell className="font-medium">{grade.name}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedGrade(grade.id);
                                setActiveTab("assigned-subjects");
                              }}
                            >
                              View Subjects
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assigned Subjects Tab */}
        <TabsContent value="assigned-subjects" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {selectedGrade ? (
                  <span>
                    Subjects for {assignedGrades.find(g => g.id === selectedGrade)?.name || "Selected Grade"}
                  </span>
                ) : (
                  <span>Your Assigned Subjects</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedGrade ? (
                <div className="text-center py-8">
                  <GraduationCap className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <h3 className="text-lg font-medium text-gray-500 mb-1">Select a Grade</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Please select a grade first to view your assigned subjects.
                  </p>
                  <Button variant="outline" onClick={() => setActiveTab("assigned-grades")}>
                    Go to Grades
                  </Button>
                </div>
              ) : isLoadingSubjects ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : assignedSubjects.length === 0 ? (
                <div className="text-center py-8">
                  <BadgeCheck className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <h3 className="text-lg font-medium text-gray-500 mb-1">No Subjects Assigned</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    You haven't been assigned to any subjects for this grade yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignedSubjects.map((subject) => (
                        <TableRow key={subject.id}>
                          <TableCell className="font-medium">{subject.name}</TableCell>
                          <TableCell>
                            <span className="capitalize">{subject.type}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/plans/create?gradeId=${selectedGrade}&subjectId=${subject.id}`}>
                              <Button size="sm" className="flex items-center gap-1">
                                <Plus className="h-3.5 w-3.5" />
                                Create Plan
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Plans Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Your Recent Plans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Link href="/plans">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                View All Plans
              </Button>
            </Link>
          </div>
          
          <div className="text-center py-8">
            <ClipboardList className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-500 mb-1">Create Your First Plan</h3>
            <p className="text-sm text-gray-400 mb-4">
              Start by selecting a grade and subject to create a weekly plan.
            </p>
            <Link href="/plans/create">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create New Plan
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}