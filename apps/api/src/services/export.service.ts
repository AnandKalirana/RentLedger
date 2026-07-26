import PDFDocument from "pdfkit";
import { Response } from "express";
import { prisma } from "@/config/database";
import { ApiError } from "@/utils/ApiError";

const INK = "#101828";
const INK_SOFT = "#475467";
const LINE = "#D0D5DD";
const STAMP = "#0F6B4C";
const STAMP_SOFT = "#EAF3EF";
const PAGE_MARGIN = 50;

function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export async function streamTenantPaymentHistoryPdf(landlordId: string, tenantId: string, res: Response) {
  const tenant = await prisma.tenant.findFirst({
    where: { id: tenantId, landlordId },
    include: { payments: { orderBy: [{ billingYear: "desc" }, { billingMonth: "desc" }] } },
  });
  if (!tenant) throw ApiError.notFound("Tenant not found");

  const landlord = await prisma.landlord.findUniqueOrThrow({
    where: { id: landlordId },
    select: { fullName: true, businessName: true },
  });

  const doc = new PDFDocument({ size: "A4", margin: PAGE_MARGIN });
  const pageWidth = doc.page.width - PAGE_MARGIN * 2;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${tenant.fullName.replace(/[^a-z0-9]/gi, "_")}_payment_history.pdf"`
  );
  doc.pipe(res);

  // ---------------------------------------------------------------------
  // Header
  // ---------------------------------------------------------------------
  doc.fillColor(INK).fontSize(20).font("Helvetica-Bold").text(landlord.businessName || landlord.fullName);
  doc.fillColor(INK_SOFT).fontSize(11).font("Helvetica").text("Tenant payment history statement");

  doc.moveDown(0.8);
  doc
    .strokeColor(STAMP)
    .lineWidth(2)
    .moveTo(PAGE_MARGIN, doc.y)
    .lineTo(PAGE_MARGIN + pageWidth, doc.y)
    .stroke();
  doc.moveDown(1);

  // ---------------------------------------------------------------------
  // Tenant details — two-column label/value grid, boxed
  // ---------------------------------------------------------------------
  const detailsTop = doc.y;
  const detailsRows: [string, string][] = [
    ["Tenant name", tenant.fullName],
    ["Mobile", tenant.mobileNumber],
    ["Email", tenant.email ?? "\u2014"],
    ["Status", tenant.status],
    ["Monthly rent", formatCurrency(Number(tenant.monthlyRent))],
    ["Security deposit", formatCurrency(Number(tenant.securityDeposit))],
    ["Move-in date", formatDate(tenant.moveInDate)],
    ["Rent due day", `Day ${tenant.rentDueDay} of each month`],
  ];

  const colWidth = pageWidth / 2;
  const rowHeight = 30;
  doc.fontSize(9);
  detailsRows.forEach(([label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = PAGE_MARGIN + 12 + col * colWidth;
    const y = detailsTop + 10 + row * rowHeight;
    doc.fillColor(INK_SOFT).font("Helvetica").text(label, x, y, { width: colWidth - 24 });
    doc
      .fillColor(INK)
      .font("Helvetica-Bold")
      .text(value, x, y + 12, { width: colWidth - 24 });
  });

  const detailsHeight = Math.ceil(detailsRows.length / 2) * rowHeight + 20;
  doc.strokeColor(LINE).lineWidth(1).rect(PAGE_MARGIN, detailsTop, pageWidth, detailsHeight).stroke();

  doc.y = detailsTop + detailsHeight + 24;

  // ---------------------------------------------------------------------
  // Payment history table
  // ---------------------------------------------------------------------
  doc.fillColor(INK).fontSize(13).font("Helvetica-Bold").text("Payment history", PAGE_MARGIN, doc.y);
  doc.moveDown(0.6);

  const columns = [
    { label: "Period", width: pageWidth * 0.16, align: "left" as const },
    { label: "Amount", width: pageWidth * 0.2, align: "right" as const },
    { label: "Status", width: pageWidth * 0.18, align: "left" as const },
    { label: "Submitted", width: pageWidth * 0.23, align: "left" as const },
    { label: "Verified", width: pageWidth * 0.23, align: "left" as const },
  ];

  const tableLeft = PAGE_MARGIN;
  const headerHeight = 24;
  const dataRowHeight = 22;

  function columnX(index: number): number {
    return tableLeft + columns.slice(0, index).reduce((sum, c) => sum + c.width, 0);
  }

  function drawTableHeader(y: number): number {
    doc.rect(tableLeft, y, pageWidth, headerHeight).fill(STAMP_SOFT);
    doc.fillColor(STAMP).font("Helvetica-Bold").fontSize(9);
    columns.forEach((col, i) => {
      doc.text(col.label.toUpperCase(), columnX(i) + 8, y + 8, {
        width: col.width - 16,
        align: col.align,
      });
    });
    return y + headerHeight;
  }

  function ensureSpace(currentY: number, needed: number): number {
    if (currentY + needed > doc.page.height - PAGE_MARGIN) {
      doc.addPage();
      return drawTableHeader(PAGE_MARGIN);
    }
    return currentY;
  }

  let y = drawTableHeader(doc.y);

  if (tenant.payments.length === 0) {
    doc.strokeColor(LINE).lineWidth(1).rect(tableLeft, y, pageWidth, dataRowHeight).stroke();
    doc
      .fillColor(INK_SOFT)
      .font("Helvetica")
      .fontSize(9)
      .text("No payment records yet.", tableLeft + 8, y + 7, { width: pageWidth - 16 });
    y += dataRowHeight;
  } else {
    tenant.payments.forEach((payment, i) => {
      y = ensureSpace(y, dataRowHeight);
      if (i % 2 === 1) {
        doc.rect(tableLeft, y, pageWidth, dataRowHeight).fill("#FAFAF8");
      }

      const cells = [
        `${payment.billingMonth}/${payment.billingYear}`,
        formatCurrency(Number(payment.amount)),
        payment.status.charAt(0) + payment.status.slice(1).toLowerCase(),
        formatDate(payment.createdAt),
        payment.verifiedAt ? formatDate(payment.verifiedAt) : "\u2014",
      ];

      doc.fillColor(INK).font("Helvetica").fontSize(9);
      cells.forEach((cell, colIndex) => {
        doc.text(cell, columnX(colIndex) + 8, y + 7, {
          width: columns[colIndex].width - 16,
          align: columns[colIndex].align,
        });
      });

      doc
        .strokeColor(LINE)
        .lineWidth(0.5)
        .moveTo(tableLeft, y + dataRowHeight)
        .lineTo(tableLeft + pageWidth, y + dataRowHeight)
        .stroke();

      y += dataRowHeight;
    });
  }

  // Outer border around the whole table (header + all rows)
  const tableTop = y - dataRowHeight * tenant.payments.length - headerHeight;
  doc
    .strokeColor(LINE)
    .lineWidth(1)
    .rect(tableLeft, tableTop, pageWidth, y - tableTop)
    .stroke();

  doc.y = y + 24;
  doc
    .fillColor("#98A2B3")
    .fontSize(8)
    .font("Helvetica")
    .text(`Generated on ${formatDate(new Date())}`, PAGE_MARGIN, doc.y);

  doc.end();
}