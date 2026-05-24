import jsPDF from "jspdf";
import { TestResult } from "@/types";

export const generatePDFReport = (result: TestResult) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Header
  doc.setFontSize(24);
  doc.setTextColor(33, 150, 243); // Primary color
  doc.text("CIL MT Prep Arena", pageWidth / 2, yPosition, { align: "center" });

  yPosition += 15;
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text("Performance Report", pageWidth / 2, yPosition, { align: "center" });

  yPosition += 20;

  // Test Info
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`Test: ${result.testName}`, 20, yPosition);
  yPosition += 8;
  doc.text(`Date: ${new Date(result.completedAt).toLocaleDateString()}`, 20, yPosition);
  yPosition += 15;

  // Score Summary
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("Performance Summary", 20, yPosition);
  yPosition += 10;

  doc.setFont(undefined, "normal");
  doc.setFontSize(10);

  const summaryData = [
    [`Accuracy:`, `${result.accuracy}%`],
    [`Total Questions:`, `${result.totalQuestions}`],
    [`Correct Answers:`, `${result.correctAnswers}`],
    [`Wrong Answers:`, `${result.wrongAnswers}`],
    [`Skipped:`, `${result.skipped}`],
    [`Time Taken:`, `${Math.floor(result.timeTaken / 60)}m ${result.timeTaken % 60}s`],
  ];

  summaryData.forEach(([label, value]) => {
    doc.text(label, 20, yPosition);
    doc.text(value, 100, yPosition);
    yPosition += 7;
  });

  yPosition += 10;

  // Section Performance
  if (Object.keys(result.sectionPerformance).length > 0) {
    doc.setFont(undefined, "bold");
    doc.setFontSize(12);
    doc.text("Section-wise Performance", 20, yPosition);
    yPosition += 10;

    doc.setFont(undefined, "normal");
    doc.setFontSize(9);

    Object.entries(result.sectionPerformance).forEach(([section, perf]) => {
      const accuracy = Math.round((perf.correct / perf.total) * 100);
      doc.text(`${section}: ${perf.correct}/${perf.total} (${accuracy}%)`, 20, yPosition);
      yPosition += 6;
    });
  }

  yPosition += 10;

  // Difficulty Performance
  if (Object.keys(result.difficultyPerformance).length > 0) {
    doc.setFont(undefined, "bold");
    doc.setFontSize(12);
    doc.text("Difficulty-wise Performance", 20, yPosition);
    yPosition += 10;

    doc.setFont(undefined, "normal");
    doc.setFontSize(9);

    Object.entries(result.difficultyPerformance).forEach(([difficulty, perf]) => {
      const accuracy = Math.round((perf.correct / perf.total) * 100);
      doc.text(`${difficulty.toUpperCase()}: ${perf.correct}/${perf.total} (${accuracy}%)`, 20, yPosition);
      yPosition += 6;
    });
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  const timestamp = new Date().toLocaleString();
  doc.text(`Generated on ${timestamp}`, pageWidth / 2, pageHeight - 10, { align: "center" });

  // Save
  const filename = `CIL_Report_${new Date().getFullYear()}_${String(new Date().getMonth() + 1).padStart(2, "0")}_${String(new Date().getDate()).padStart(2, "0")}.pdf`;
  doc.save(filename);
};
