import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { ChatMessage, DashboardBundle, KpiValue } from "./types";
import { formatCurrencyFull, formatKpiValue } from "./format";

function withHeader(doc: jsPDF, title: string) {
  doc.setFontSize(16);
  doc.setTextColor(31, 54, 137);
  doc.text("Skylark Drones - BI Copilot", 14, 18);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(title, 14, 25);
  doc.setDrawColor(220);
  doc.line(14, 29, 196, 29);
}

export function exportChatToPdf(conversationTitle: string, messages: ChatMessage[]) {
  const doc = new jsPDF();
  withHeader(doc, `Conversation: ${conversationTitle}`);
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text(`Generated ${new Date().toLocaleString("en-IN")}`, 14, 34);

  let y = 42;
  doc.setFontSize(10);
  for (const m of messages) {
    const label = m.role === "user" ? "You" : "Copilot";
    doc.setTextColor(m.role === "user" ? 39 : 15, m.role === "user" ? 67 : 23, m.role === "user" ? 173 : 42);
    doc.setFont("helvetica", "bold");
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    doc.text(`${label}:`, 14, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30);
    const lines = doc.splitTextToSize(m.content.replace(/\*\*/g, ""), 180);
    for (const line of lines) {
      if (y > 285) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 14, y);
      y += 5;
    }
    y += 4;
  }

  doc.save(`skylark-copilot-${sanitizeFilename(conversationTitle)}.pdf`);
}

export function exportDashboardToPdf(bundle: DashboardBundle) {
  const doc = new jsPDF();
  withHeader(doc, "Executive Dashboard Report");
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text(`Generated ${new Date(bundle.generatedAt).toLocaleString("en-IN")}`, 14, 34);

  autoTable(doc, {
    startY: 40,
    head: [["KPI", "Value", "Notes"]],
    body: bundle.kpis.map((k: KpiValue) => [k.label, formatKpiValue(k), k.helpText ?? ""]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [39, 67, 173] },
  });

  const afterKpiY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  autoTable(doc, {
    startY: afterKpiY,
    head: [["Sector", "Pipeline Value", "Collected", "Receivable", "Deals", "Work Orders"]],
    body: bundle.sectorDistribution.map((s) => [
      s.sector,
      formatCurrencyFull(s.pipelineValue),
      formatCurrencyFull(s.collected),
      formatCurrencyFull(s.receivable),
      s.dealCount.toString(),
      s.workOrderCount.toString(),
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [39, 67, 173] },
    didDrawPage: (data) => {
      if (data.pageNumber === 1) {
        doc.setFontSize(11);
        doc.setTextColor(31, 54, 137);
        doc.text("Sector Performance", 14, afterKpiY - 3);
      }
    },
  });

  const afterSectorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  autoTable(doc, {
    startY: afterSectorY,
    head: [["Largest Open Opportunities", "Sector", "Value", "Stage", "Win Probability"]],
    body: bundle.largestOpportunities
      .slice(0, 10)
      .map((d) => [d.dealName, d.sector ?? "-", formatCurrencyFull(d.value), d.stage, `${d.winProbabilityScore}/100`]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [39, 67, 173] },
  });

  doc.save(`skylark-dashboard-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportDashboardToExcel(bundle: DashboardBundle) {
  const wb = XLSX.utils.book_new();

  const kpiSheet = XLSX.utils.json_to_sheet(
    bundle.kpis.map((k) => ({ KPI: k.label, Value: formatKpiValue(k), Notes: k.helpText ?? "" }))
  );
  XLSX.utils.book_append_sheet(wb, kpiSheet, "KPIs");

  const sectorSheet = XLSX.utils.json_to_sheet(
    bundle.sectorDistribution.map((s) => ({
      Sector: s.sector,
      "Pipeline Value": s.pipelineValue,
      Collected: s.collected,
      Receivable: s.receivable,
      Deals: s.dealCount,
      "Work Orders": s.workOrderCount,
    }))
  );
  XLSX.utils.book_append_sheet(wb, sectorSheet, "Sector Performance");

  const oppSheet = XLSX.utils.json_to_sheet(
    bundle.largestOpportunities.map((d) => ({
      Deal: d.dealName,
      Sector: d.sector ?? "",
      Value: d.value,
      Stage: d.stage,
      "Win Probability": d.winProbabilityScore,
      "Days Open": d.daysOpen ?? "",
    }))
  );
  XLSX.utils.book_append_sheet(wb, oppSheet, "Largest Opportunities");

  const stuckSheet = XLSX.utils.json_to_sheet(
    bundle.stuckDeals.map((d) => ({
      Deal: d.dealName,
      Value: d.value,
      Stage: d.stage,
      "Days In Pipeline": d.daysInPipeline,
      Reason: d.reason,
    }))
  );
  XLSX.utils.book_append_sheet(wb, stuckSheet, "Stuck Deals");

  const dqSheet = XLSX.utils.json_to_sheet(
    bundle.dataQuality.fields.map((f) => ({
      Field: f.field,
      Board: f.boardName,
      "Missing Count": f.missingCount,
      "Total Records": f.totalRecords,
      "Completeness %": Math.round(f.completeness * 100),
      Severity: f.severity,
      "Recommended Fix": f.recommendedFix,
    }))
  );
  XLSX.utils.book_append_sheet(wb, dqSheet, "Data Quality");

  XLSX.writeFile(wb, `skylark-dashboard-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function sanitizeFilename(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) || "conversation";
}
