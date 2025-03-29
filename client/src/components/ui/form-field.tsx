import { ReactNode } from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";

interface Options {
  label: string;
  value: string | number;
}

interface FormFieldProps {
  form: UseFormReturn<any>;
  name: string;
  label: string;
  placeholder?: string;
  type?: "text" | "password" | "email" | "textarea" | "checkbox" | "select" | "date";
  required?: boolean;
  options?: Options[];
  defaultValue?: any;
  disabled?: boolean;
}

export function CustomFormField({
  form,
  name,
  label,
  placeholder,
  type = "text",
  required = false,
  options = [],
  defaultValue,
  disabled = false,
}: FormFieldProps) {
  let control: ReactNode;

  switch (type) {
    case "textarea":
      control = (
        <Textarea 
          placeholder={placeholder} 
          className="resize-none" 
          disabled={disabled} 
        />
      );
      break;
    case "checkbox":
      control = (
        <Checkbox 
          disabled={disabled} 
        />
      );
      break;
    case "select":
      control = (
        <Select disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
      break;
    case "date":
      control = (
        <Input 
          type="date" 
          placeholder={placeholder}
          disabled={disabled}
        />
      );
      break;
    default:
      control = (
        <Input 
          type={type} 
          placeholder={placeholder} 
          disabled={disabled}
        />
      );
  }

  return (
    <FormField
      control={form.control}
      name={name}
      defaultValue={defaultValue}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </FormLabel>
          <FormControl>
            {type === "checkbox" ? (
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={disabled}
                />
                <label
                  htmlFor={name}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {placeholder}
                </label>
              </div>
            ) : type === "select" ? (
              <Select
                value={String(field.value) || ""}
                onValueChange={field.onChange}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : type === "textarea" ? (
              <Textarea
                {...field}
                placeholder={placeholder}
                className="resize-none"
                disabled={disabled}
              />
            ) : (
              <Input 
                {...field}
                type={type}
                placeholder={placeholder}
                disabled={disabled}
                value={field.value || (type === "date" ? "" : field.value)}
              />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
