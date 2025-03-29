import { WeeklyPlanComplete } from "@shared/schema";
import { getSubjectTypeDisplay } from "./subject-utils";
import jsPDF from "jspdf";
import { format } from "date-fns";

// Helper function to format date
const formatDate = (dateString: string | Date): string => {
  return format(new Date(dateString), "MMM d, yyyy");
};

// Create a day name lookup
const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export const generatePdf = (planData: WeeklyPlanComplete) => {
  const { teacher, grade, subject, week, dailyPlans, notes } = planData;
  
  // Create new PDF document
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });
  
  // Add fonts for Arabic text
  doc.addFont("https://fonts.gstatic.com/s/notosansarabic/v18/nwpxtLGrOAZMl5nJ_wfgRg3DrWFZWsnVBJ_sS6tlqHHFlhQ5l3sQWIHPqzCfyG2vu3CBFQLaig.ttf", "NotoSansArabic", "normal");
  
  // Set up document properties
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - (margin * 2);
  
  // Colors
  const primaryColor = [79, 70, 229]; // RGB values for Indigo-600 (#4f46e5)
  
  // Add header with school info
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(margin, margin, contentWidth, 20, "F");
  
  // Set text color to white for header content
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  
  // Add logo placeholder (would be replaced with actual logo)
  const logoSize = 15;
  doc.setFillColor(255, 255, 255);
  doc.circle(margin + logoSize/2 + 2, margin + 10, logoSize/2, "F");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(12);
  doc.text("RAS", margin + 2, margin + 11);
  
  // School name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Royal American School", margin + logoSize + 10, margin + 8);
  
  // Arabic school name
  doc.setFont("NotoSansArabic", "normal");
  doc.text("مدرسة رويال الامريكية", margin + logoSize + 10, margin + 16);
  
  // Week info
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  const weekInfo = `Week ${week.weekNumber}, ${week.year}`;
  const dateRange = `${formatDate(week.startDate)} - ${formatDate(week.endDate)}`;
  doc.text(weekInfo, pageWidth - margin - doc.getTextWidth(weekInfo), margin + 8);
  doc.text(dateRange, pageWidth - margin - doc.getTextWidth(dateRange), margin + 16);
  
  // Grade & Subject
  doc.setFont("helvetica", "bold");
  const gradeSubject = `${grade.name} - ${subject.name}`;
  doc.text(gradeSubject, pageWidth - margin - doc.getTextWidth(gradeSubject), margin + 24);
  
  // Add teacher info bar
  doc.setFillColor(240, 240, 240); // Light gray background
  doc.rect(margin, margin + 22, contentWidth, 10, "F");
  doc.setTextColor(80, 80, 80); // Dark gray text
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Teacher: ${teacher.fullName}`, margin + 5, margin + 28);
  
  // Generated date
  const generatedDate = `Generated: ${formatDate(new Date())}`;
  doc.text(generatedDate, pageWidth - margin - doc.getTextWidth(generatedDate), margin + 28);
  
  // Weekly notes
  if (notes) {
    doc.setFillColor(250, 250, 250);
    doc.rect(margin, margin + 35, contentWidth, 12, "F");
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Weekly Notes:", margin + 5, margin + 41);
    doc.setFont("helvetica", "normal");
    doc.text(notes, margin + 30, margin + 41);
  }
  
  // Start position for table
  const tableTop = margin + (notes ? 50 : 35);
  
  // Create table headers based on subject type
  const createTableHeaders = () => {
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    
    if (subject.type === "standard") {
      const headers = ["Day", "Lessons/Topics", "Books and Pages", "Homework", "HW Due Date", "Assessments", "Notes"];
      const colWidths = [20, 35, 35, 35, 25, 35, 35];
      
      let xPos = margin;
      headers.forEach((header, index) => {
        doc.rect(xPos, tableTop, colWidths[index], 10, "F");
        doc.text(header, xPos + colWidths[index] / 2, tableTop + 6, { align: "center" });
        xPos += colWidths[index];
      });
      
      return { headers, colWidths };
    } else if (subject.type === "art") {
      const headers = ["Day", "Lessons/Topics", "Required Items", "Notes"];
      const colWidths = [20, 80, 80, 40];
      
      let xPos = margin;
      headers.forEach((header, index) => {
        doc.rect(xPos, tableTop, colWidths[index], 10, "F");
        doc.text(header, xPos + colWidths[index] / 2, tableTop + 6, { align: "center" });
        xPos += colWidths[index];
      });
      
      return { headers, colWidths };
    } else if (subject.type === "pe") {
      const headers = ["Day", "Skill", "Activity", "Notes"];
      const colWidths = [20, 90, 90, 20];
      
      let xPos = margin;
      headers.forEach((header, index) => {
        doc.rect(xPos, tableTop, colWidths[index], 10, "F");
        doc.text(header, xPos + colWidths[index] / 2, tableTop + 6, { align: "center" });
        xPos += colWidths[index];
      });
      
      return { headers, colWidths };
    }
    
    // Default fallback 
    const headers = ["Day", "Content"];
    const colWidths = [20, contentWidth - 20];
    
    let xPos = margin;
    headers.forEach((header, index) => {
      doc.rect(xPos, tableTop, colWidths[index], 10, "F");
      doc.text(header, xPos + colWidths[index] / 2, tableTop + 6, { align: "center" });
      xPos += colWidths[index];
    });
    
    return { headers, colWidths };
  };
  
  const { colWidths } = createTableHeaders();
  
  // Fill table data
  const rowHeight = 20;
  let currentY = tableTop + 10;
  
  // Sort daily plans by day of week
  const sortedDailyPlans = [...dailyPlans].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  
  sortedDailyPlans.forEach((plan) => {
    const dayIndex = plan.dayOfWeek - 1;
    const dayName = dayNames[dayIndex] || `Day ${plan.dayOfWeek}`;
    
    // Set styling for row
    doc.setFillColor(dayIndex % 2 === 0 ? 255 : 245, 245, 245);
    doc.rect(margin, currentY, contentWidth, rowHeight, "F");
    
    // Set text color
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    
    // Add day name (always present)
    doc.setFont("helvetica", "bold");
    doc.text(dayName, margin + colWidths[0] / 2, currentY + 6, { align: "center" });
    
    // Add plan details based on subject type
    doc.setFont("helvetica", "normal");
    let xPos = margin + colWidths[0];
    
    if (subject.type === "standard") {
      // Topic
      doc.text(plan.topic || "-", xPos + 2, currentY + 6);
      xPos += colWidths[1];
      
      // Books and Pages
      doc.text(plan.booksAndPages || "-", xPos + 2, currentY + 6);
      xPos += colWidths[2];
      
      // Homework
      doc.text(plan.homework || "-", xPos + 2, currentY + 6);
      xPos += colWidths[3];
      
      // HW Due Date
      const dueDate = plan.homeworkDueDate ? formatDate(plan.homeworkDueDate) : "-";
      doc.text(dueDate, xPos + 2, currentY + 6);
      xPos += colWidths[4];
      
      // Assessments
      doc.text(plan.assignments || "-", xPos + 2, currentY + 6);
      xPos += colWidths[5];
      
      // Notes
      doc.text(plan.notes || "-", xPos + 2, currentY + 6);
    } else if (subject.type === "art") {
      // Topic
      doc.text(plan.topic || "-", xPos + 2, currentY + 6);
      xPos += colWidths[1];
      
      // Required Items
      doc.text(plan.requiredItems || "-", xPos + 2, currentY + 6);
      xPos += colWidths[2];
      
      // Notes
      doc.text(plan.notes || "-", xPos + 2, currentY + 6);
    } else if (subject.type === "pe") {
      // Skill
      doc.text(plan.skill || "-", xPos + 2, currentY + 6);
      xPos += colWidths[1];
      
      // Activity
      doc.text(plan.activity || "-", xPos + 2, currentY + 6);
      xPos += colWidths[2];
      
      // Notes
      doc.text(plan.notes || "-", xPos + 2, currentY + 6);
    }
    
    // Draw cell borders
    let cellX = margin;
    for (let i = 0; i < colWidths.length; i++) {
      doc.rect(cellX, currentY, colWidths[i], rowHeight);
      cellX += colWidths[i];
    }
    
    currentY += rowHeight;
  });
  
  // Add footer
  const footerY = pageHeight - margin - 10;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("Royal American School Weekly Plan - Generated by WeeklyScheduler System", pageWidth / 2, footerY, { align: "center" });
  
  // Save the PDF
  const fileName = `${grade.name}_${subject.name}_Week${week.weekNumber}_${week.year}.pdf`;
  doc.save(fileName);
  
  return fileName;
};
