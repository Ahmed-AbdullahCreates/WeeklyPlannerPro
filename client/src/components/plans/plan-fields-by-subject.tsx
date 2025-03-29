import { CustomFormField as FormField } from "@/components/ui/form-field";
import { UseFormReturn } from "react-hook-form";
import { DailyPlanForm } from "@shared/schema";
import { getFieldsForSubjectType, getFieldLabel, getFieldType, getFieldPlaceholder } from "@/utils/subject-utils";

interface PlanFieldsBySubjectProps {
  form: UseFormReturn<DailyPlanForm>;
  subjectType: string;
}

export function PlanFieldsBySubject({ form, subjectType }: PlanFieldsBySubjectProps) {
  // Get the fields to display based on subject type
  const fields = getFieldsForSubjectType(subjectType);
  
  return (
    <div className="space-y-4">
      {fields.map((field) => {
        if (field === 'homeworkDueDate') {
          return (
            <FormField
              key={field}
              form={form}
              name={field}
              label={getFieldLabel(field)}
              placeholder={getFieldPlaceholder(field)}
              type="date"
            />
          );
        }
        
        return (
          <FormField
            key={field}
            form={form}
            name={field}
            label={getFieldLabel(field)}
            placeholder={getFieldPlaceholder(field)}
            type={getFieldType(field)}
          />
        );
      })}
    </div>
  );
}
