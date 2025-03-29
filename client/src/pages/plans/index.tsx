import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Pencil,
  Download,
  FileSpreadsheet,
  FileText,
  Search,
  AlertCircle,
  ChevronRight,
  Calendar,
  Book
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { WeeklyPlanComplete } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { generatePdf } from "@/utils/pdf-generator";

export default function Plans() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: myPlans = [], isLoading } = useQuery<WeeklyPlanComplete[]>({
    queryKey: ["/api/weekly-plans/teacher", user?.id],
    enabled: !!user?.id,
  });

  const filteredPlans = searchQuery 
    ? myPlans.filter(plan => 
        plan.grade.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.subject.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : myPlans;

  const handleExportPdf = async (planId: number) => {
    try {
      const response = await fetch(`/api/weekly-plans/${planId}/complete`);
      const data = await response.json();
      generatePdf(data);
    } catch (error) {
      console.error("Failed to generate PDF", error);
    }
  };

  if (isLoading) {
    return (
      <PageWrapper title="My Plans">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">
            My Plans
          </h1>
          <p className="text-neutral-600 mt-2">
            View and manage your weekly lesson plans
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search plans..."
              className="pl-8"
              disabled
            />
          </div>
          <Link href="/plans/create">
            <Button>Create New Plan</Button>
          </Link>
        </div>

        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-8 w-full mb-4" />
            <Skeleton className="h-8 w-full mb-4" />
            <Skeleton className="h-8 w-full mb-4" />
            <Skeleton className="h-8 w-full mb-4" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="My Plans">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text">
          My Plans
        </h1>
        <p className="text-neutral-600 mt-2">
          View and manage your weekly lesson plans
        </p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search plans..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Link href="/plans/create">
          <Button>Create New Plan</Button>
        </Link>
      </div>

      {filteredPlans.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No plans found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery 
                ? "No plans match your search criteria. Try a different search." 
                : "You haven't created any plans yet."}
            </p>
            {!searchQuery && (
              <Link href="/plans/create">
                <Button>Create Your First Plan</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grade & Subject</TableHead>
                  <TableHead>Week</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div className="font-medium flex items-center">
                        <Book className="h-4 w-4 mr-2 text-primary/70" />
                        {plan.grade.name} - {plan.subject.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        <span>
                          Week {plan.week.weekNumber}, {plan.week.year}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(plan.week.startDate).toLocaleDateString()} - {new Date(plan.week.endDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(plan.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(plan.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleExportPdf(plan.id)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <FileSpreadsheet className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </PageWrapper>
  );
}
