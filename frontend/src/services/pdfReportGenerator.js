/**
 * PDF Report Generator for Mainframe Ride Analytics
 * Uses jsPDF and jspdf-autotable to produce an enterprise-grade
 * audit and financial ledger report from the 80-byte mainframe dataset.
 */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Generates and triggers download of a formatted PDF report
 * 
 * @param {Array} trips - The filtered array of trip records currently shown
 * @param {Object} summary - Executive KPI metrics
 * @param {Object} activeFilters - Current filter values for report metadata
 */
export function generateRidesPdfReport(trips = [], summary = {}, activeFilters = {}) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const now = new Date();
  const formattedDate = now.toISOString().replace("T", " ").slice(0, 19) + " UTC";

  // Brand Colors
  const COLOR_PRIMARY = [2, 132, 199];      // #0284C7 (Mainframe Blue)
  const COLOR_DARK = [15, 23, 42];          // #0F172A (Deep Slate)
  const COLOR_MUTED = [100, 116, 139];      // #64748B
  const COLOR_LIGHT_BG = [248, 250, 252];   // #F8FAFC
  const COLOR_SUCCESS = [5, 150, 105];      // #059669
  const COLOR_DANGER = [220, 38, 38];       // #DC2626

  // ---------------------------------------------------------------------------
  // 1. TOP HEADER / TITLE BAR
  // ---------------------------------------------------------------------------
  doc.setFillColor(...COLOR_DARK);
  doc.rect(0, 0, pageWidth, 24, "F");

  // Accent Line under header
  doc.setFillColor(...COLOR_PRIMARY);
  doc.rect(0, 24, pageWidth, 1.5, "F");

  // System Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("NEW YORK CITY TAXI & LIMOUSINE COMMISSION", 14, 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(186, 230, 253);
  doc.text("MAINFRAME-BASED RIDE ANALYTICS & MASTER LEDGER AUDIT REPORT", 14, 17);

  // Top-Right Metadata
  doc.setFont("courier", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("RETURN CODE: RC=0000", pageWidth - 14, 10, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Generated: ${formattedDate} | LRECL=80, RECFM=FB`, pageWidth - 14, 17, { align: "right" });

  let currentY = 32;

  // ---------------------------------------------------------------------------
  // 2. ACTIVE FILTERS & METADATA BAR
  // ---------------------------------------------------------------------------
  const filterDesc = [];
  if (activeFilters.searchTerm) filterDesc.push(`Search: "${activeFilters.searchTerm}"`);
  if (activeFilters.statusFilter && activeFilters.statusFilter !== "ALL") filterDesc.push(`Status: ${activeFilters.statusFilter}`);
  if (activeFilters.pickupZone && activeFilters.pickupZone !== "ALL") filterDesc.push(`Pickup: ${activeFilters.pickupZone}`);
  if (activeFilters.dropoffZone && activeFilters.dropoffZone !== "ALL") filterDesc.push(`Dropoff: ${activeFilters.dropoffZone}`);
  if (activeFilters.driverFilter && activeFilters.driverFilter !== "ALL") filterDesc.push(`Driver: ${activeFilters.driverFilter}`);
  if (activeFilters.minFare || activeFilters.maxFare) {
    filterDesc.push(`Fare: $${activeFilters.minFare || "0"} - $${activeFilters.maxFare || "MAX"}`);
  }
  if (activeFilters.minDistance || activeFilters.maxDistance) {
    filterDesc.push(`Dist: ${activeFilters.minDistance || "0"} - ${activeFilters.maxDistance || "MAX"} mi`);
  }
  if (activeFilters.speedOnly) filterDesc.push(`High Speed (>60 MPH)`);

  const filterString = filterDesc.length > 0 ? filterDesc.join(" | ") : "All Attributes (No active filters applied)";

  doc.setFillColor(...COLOR_LIGHT_BG);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, pageWidth - 28, 11, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_DARK);
  doc.text("Active Scope:", 18, currentY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_MUTED);
  doc.text(filterString, 42, currentY + 7);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLOR_PRIMARY);
  doc.text(`Displaying ${trips.length} Rides`, pageWidth - 18, currentY + 7, { align: "right" });

  currentY += 16;

  // ---------------------------------------------------------------------------
  // 3. EXECUTIVE KPI CARDS / FINANCIAL SUMMARY BLOCK
  // ---------------------------------------------------------------------------
  const totalRides = trips.length;
  const totalRevenue = trips.reduce((sum, t) => sum + (Number(t.fare_usd) || 0), 0);
  const totalPayout = trips.reduce((sum, t) => sum + (Number(t.driver_payout_usd) || (Number(t.fare_usd) || 0) * 0.75), 0);
  const totalComm = trips.reduce((sum, t) => sum + (Number(t.platform_commission_usd) || (Number(t.fare_usd) || 0) * 0.25), 0);
  const avgDistance = totalRides > 0 ? (trips.reduce((sum, t) => sum + (Number(t.distance_miles) || 0), 0) / totalRides).toFixed(2) : "0.00";
  const avgSpeed = totalRides > 0 ? (trips.reduce((sum, t) => sum + (Number(t.speed_mph) || 0), 0) / totalRides).toFixed(1) : "0.0";
  const fraudCount = trips.filter(t => t.status && t.status.toLowerCase().includes("fraud")).length;

  const cardWidth = (pageWidth - 28 - 15) / 4;
  const cardHeight = 16;

  const kpis = [
    { label: "TOTAL GROSS FARE", val: `$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: `${totalRides} trips processed` },
    { label: "DRIVER PAYOUT (75%)", val: `$${totalPayout.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: "Disbursed to fleet" },
    { label: "PLATFORM FEE (25%)", val: `$${totalComm.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: "Net platform revenue" },
    { label: "FLEET AVERAGES", val: `${avgDistance} mi • ${avgSpeed} mph`, sub: fraudCount > 0 ? `${fraudCount} fraud flagged` : "0 fraud anomalies" },
  ];

  kpis.forEach((kpi, idx) => {
    const x = 14 + idx * (cardWidth + 5);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...COLOR_MUTED);
    doc.text(kpi.label, x + 4, currentY + 4.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...COLOR_DARK);
    doc.text(kpi.val, x + 4, currentY + 10.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...COLOR_MUTED);
    doc.text(kpi.sub, x + 4, currentY + 14.5);
  });

  currentY += cardHeight + 6;

  // ---------------------------------------------------------------------------
  // 4. MAIN DATA TABLE (AutoTable)
  // ---------------------------------------------------------------------------
  const tableHeaders = [
    [
      "Trip ID (PK)",
      "Driver ID",
      "Timestamp",
      "Pickup Zone",
      "Dropoff Zone",
      "Dist (mi)",
      "Fare ($)",
      "Payout (75%)",
      "Comm (25%)",
      "Duration",
      "Speed",
      "Status",
    ],
  ];

  const tableRows = trips.map((t) => {
    const fare = Number(t.fare_usd) || 0;
    const payout = Number(t.driver_payout_usd) || fare * 0.75;
    const comm = Number(t.platform_commission_usd) || fare * 0.25;
    const dist = Number(t.distance_miles) || 0;
    const dur = t.duration_mins ? `${t.duration_mins}m` : "N/A";
    const speed = t.speed_mph ? `${Number(t.speed_mph).toFixed(1)} mph` : "N/A";
    const status = t.status || "CLEAN";

    return [
      t.trip_id || "-",
      t.driver_id || "-",
      t.timestamp || "-",
      t.pickup_zone || `Zone ${t.pickup_zone_id || "-"}`,
      t.dropoff_zone || `Zone ${t.dropoff_zone_id || "-"}`,
      dist.toFixed(2),
      `$${fare.toFixed(2)}`,
      `$${payout.toFixed(2)}`,
      `$${comm.toFixed(2)}`,
      dur,
      speed,
      status,
    ];
  });

  autoTable(doc, {
    head: tableHeaders,
    body: tableRows,
    startY: currentY,
    margin: { left: 14, right: 14, bottom: 15 },
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 7.5,
      cellPadding: 2,
      textColor: COLOR_DARK,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      valign: "middle",
    },
    headStyles: {
      fillColor: COLOR_DARK,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { font: "courier", fontStyle: "bold", cellWidth: 20 },
      1: { font: "courier", cellWidth: 18 },
      2: { cellWidth: 25 },
      3: { cellWidth: 38 },
      4: { cellWidth: 38 },
      5: { halign: "right", cellWidth: 16 },
      6: { halign: "right", fontStyle: "bold", cellWidth: 16 },
      7: { halign: "right", cellWidth: 18 },
      8: { halign: "right", cellWidth: 18 },
      9: { halign: "center", cellWidth: 14 },
      10: { halign: "right", cellWidth: 17 },
      11: { halign: "center", fontStyle: "bold", cellWidth: 22 },
    },
    didParseCell: (data) => {
      // Highlight fraud status in red, completed in green
      if (data.column.index === 11 && data.section === "body") {
        const val = String(data.cell.raw).toLowerCase();
        if (val.includes("fraud") || val.includes("flag")) {
          data.cell.styles.textColor = COLOR_DANGER;
        } else {
          data.cell.styles.textColor = COLOR_SUCCESS;
        }
      }
    },
    didDrawPage: (data) => {
      // Page Footer on every page
      const pageNum = doc.internal.getNumberOfPages();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...COLOR_MUTED);

      // Left footer
      doc.text(
        "IBM z/OS Sequential Datasets (FILE3_MASTER_LEDGER.ps) — Certified Mainframe Batch Audit Output",
        14,
        pageHeight - 6
      );

      // Right footer
      doc.text(
        `Page ${data.pageNumber} of ${pageNum}`,
        pageWidth - 14,
        pageHeight - 6,
        { align: "right" }
      );
    },
  });

  // ---------------------------------------------------------------------------
  // 5. TRIGGER DOWNLOAD
  // ---------------------------------------------------------------------------
  const dateStr = now.toISOString().slice(0, 10);
  doc.save(`NYC_Taxi_Mainframe_Report_${dateStr}.pdf`);
}
