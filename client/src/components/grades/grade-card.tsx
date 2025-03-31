import { GraduationCap, ClipboardCheck } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Grade } from "@shared/schema";

interface GradeCardProps {
  grade: Grade;
  activePlanCount?: number;
  onClick: () => void;
}

export function GradeCard({ grade, activePlanCount = 0, onClick }: GradeCardProps) {
  return (
    <Card 
      className="border hover:border-primary/40 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-3 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
              <GraduationCap className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold ml-2 text-slate-800">
              {grade.name}
            </h3>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center text-sm text-slate-500">
            <ClipboardCheck className="h-4 w-4 mr-1 text-primary/70" />
            <span>
              {activePlanCount} {activePlanCount === 1 ? 'plan' : 'plans'} available
            </span>
          </div>
          <div className="text-xs px-2 py-1 bg-primary/10 text-primary rounded font-medium">
            View Plans
          </div>
        </div>
      </CardContent>
    </Card>
  );
}