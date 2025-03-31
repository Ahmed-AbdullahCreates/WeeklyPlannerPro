import { WeeklyPlanComplete } from "@shared/schema";
import { format } from "date-fns";

/**
 * Helper function to download a string as a file
 */
function downloadCSV(csvContent: string, fileName: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Convert plan data to CSV format and download it
 */
export function generateExcel(plan: WeeklyPlanComplete): void {
  // Format dates
  const weekStart = format(new Date(plan.week.startDate), "MMM d, yyyy");
  const weekEnd = format(new Date(plan.week.endDate), "MMM d, yyyy");
  const currentDate = format(new Date(), "yyyy-MM-dd");
  
  // CSV Header
  let csvContent = "sep=,\n"; // Specify comma as separator for Excel
  
  // School information
  csvContent += `"Royal American School - Weekly Plan",,,,,\n`;
  csvContent += `"Grade: ${plan.grade.name}",,,,,\n`;
  csvContent += `"Subject: ${plan.subject.name}",,,,,\n`;
  csvContent += `"Teacher: ${plan.teacher.fullName}",,,,,\n`;
  csvContent += `"Week: ${plan.week.weekNumber} (${weekStart} - ${weekEnd})",,,,,\n`;
  csvContent += `"Generated: ${currentDate}",,,,,\n\n`;
  
  // Notes
  if (plan.notes) {
    csvContent += `"Notes:",,,,,\n`;
    csvContent += `"${plan.notes.replace(/"/g, '""')}",,,,,\n\n`;
  }
  
  // Headers for daily plans
  csvContent += `"Day","Topic","Books & Pages","Homework","Assignments","Required Items"\n`;
  
  // Map day numbers to day names
  const dayMap: { [key: number]: string } = {
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday"
  };
  
  // Create a sorted array of daily plans
  const sortedPlans = [...plan.dailyPlans].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  
  // Daily plans data
  sortedPlans.forEach(dailyPlan => {
    const day = dayMap[dailyPlan.dayOfWeek] || `Day ${dailyPlan.dayOfWeek}`;
    const topic = dailyPlan.topic ? dailyPlan.topic.replace(/"/g, '""') : "";
    const books = dailyPlan.booksAndPages ? dailyPlan.booksAndPages.replace(/"/g, '""') : "";
    const homework = dailyPlan.homework ? dailyPlan.homework.replace(/"/g, '""') : "";
    const assignments = dailyPlan.assignments ? dailyPlan.assignments.replace(/"/g, '""') : "";
    const requiredItems = dailyPlan.requiredItems ? dailyPlan.requiredItems.replace(/"/g, '""') : "";
    
    csvContent += `"${day}","${topic}","${books}","${homework}","${assignments}","${requiredItems}"\n`;
  });
  
  // Additional information for specific subject types
  if (plan.subject.type === 'physical_education') {
    csvContent += `\n"Skills:","Activities:"\n`;
    
    sortedPlans.forEach(dailyPlan => {
      const day = dayMap[dailyPlan.dayOfWeek] || `Day ${dailyPlan.dayOfWeek}`;
      const skill = dailyPlan.skill ? dailyPlan.skill.replace(/"/g, '""') : "";
      const activity = dailyPlan.activity ? dailyPlan.activity.replace(/"/g, '""') : "";
      
      csvContent += `"${day} - ${skill}","${activity}"\n`;
    });
  }
  
  // Generate filename
  const fileName = `weekly_plan_${plan.grade.name}_${plan.subject.name}_week${plan.week.weekNumber}.csv`;
  
  // Download the CSV file
  downloadCSV(csvContent, fileName);
}