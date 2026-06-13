import autyHeaderLogo from "../../branding/auty-logo-horizontal.png";
import { calculateQuote, displayName, money, shortDate, today } from "./utils.js";

const DEFAULT_PDF_LOGO = autyHeaderLogo;

async function toDataUrl(url) {
  if (!url) return "";
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function compactText(doc, text, width, maxLines = 2) {
  const lines = doc.splitTextToSize(String(text || ""), width);
  if (lines.length <= maxLines) return lines;
  const clipped = lines.slice(0, maxLines);
  clipped[maxLines - 1] = `${clipped[maxLines - 1].replace(/[.\s]+$/, "")}...`;
  return clipped;
}

function addImage(doc, dataUrl, x, y, width, height) {
  if (!dataUrl) return;
  try {
    doc.addImage(dataUrl, "PNG", x, y, width, height, undefined, "FAST");
  } catch {
    try {
      doc.addImage(dataUrl, "JPEG", x, y, width, height, undefined, "FAST");
    } catch {
      // Keep the document usable if a custom logo cannot be decoded.
    }
  }
}

export async function generateWorkspacePdf({ kind, quote, invoice, data }) {
  if (!quote) throw new Error("PDF library unavailable");

  const { jsPDF } = await import("jspdf");
  const client = data.clients.find((entry) => entry.clientId === quote.clientId);
  const calc = calculateQuote(quote, data.rooms, data.settings);
  const isInvoice = kind === "invoice";
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const usableWidth = pageWidth - margin * 2;
  const decoratorName = data.settings.decoratorName || "Kurtis";
  const documentReference = isInvoice ? invoice.invoiceReference : quote.quoteReference;
  const logoDataUrl = await toDataUrl(data.settings.logoUrl || DEFAULT_PDF_LOGO).catch(() => "");

  const sectionLabel = (label, x, y) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(7, 113, 127);
    doc.text(label.toUpperCase(), x, y);
  };

  const fixedCard = ({ x, y, width, height, title, lines, lineLimits = [1, 2, 1], tone = [246, 250, 250], accent = [7, 113, 127] }) => {
    doc.setFillColor(...tone);
    doc.setDrawColor(224, 235, 236);
    doc.roundedRect(x, y, width, height, 4, 4, "FD");
    doc.setFillColor(...accent);
    doc.roundedRect(x, y, 2.2, height, 1.1, 1.1, "F");
    sectionLabel(title, x + 6, y + 6.5);
    let lineY = y + 12;
    lines.forEach((line, index) => {
      const split = compactText(doc, line, width - 12, lineLimits[index] || 1);
      doc.setFont("helvetica", index === 0 ? "bold" : "normal");
      doc.setFontSize(index === 0 ? 9.2 : 8.2);
      doc.setTextColor(index === 0 ? 41 : 83, index === 0 ? 62 : 101, index === 0 ? 72 : 112);
      doc.text(split, x + 6, lineY);
      lineY += split.length * 4.1 + 1.2;
    });
  };

  const priceRow = (label, value, y, options = {}) => {
    const { bold = false, total = false, colour = [41, 62, 72] } = options;
    if (total) {
      doc.setFillColor(7, 113, 127);
      doc.roundedRect(margin, y - 4.5, usableWidth, 10, 3, 3, "F");
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setTextColor(...colour);
      doc.setDrawColor(225, 233, 235);
      doc.line(margin, y + 3.2, pageWidth - margin, y + 3.2);
    }
    doc.setFont("helvetica", bold || total ? "bold" : "normal");
    doc.setFontSize(total ? 11.5 : 8.6);
    doc.text(label, margin + (total ? 4 : 1), y + (total ? 1 : 0));
    doc.text(money(value), pageWidth - margin - (total ? 4 : 1), y + (total ? 1 : 0), { align: "right" });
  };

  doc.setFillColor(41, 62, 72);
  doc.roundedRect(margin, 10, usableWidth, 31, 5, 5, "F");
  addImage(doc, logoDataUrl, margin + 4, 14, 42, 16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(17);
  doc.text(isInvoice ? "INVOICE" : "QUOTATION", pageWidth - margin - 4, 21, { align: "right" });
  doc.setFontSize(10);
  doc.setTextColor(237, 197, 109);
  doc.text(documentReference, pageWidth - margin - 4, 28, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(225, 235, 238);
  doc.text(data.settings.businessName || "AUTY Decorating", pageWidth - margin - 4, 35, { align: "right" });

  const cardGap = 4;
  const cardWidth = (usableWidth - cardGap) / 2;
  const clientContact = [client?.telephone, client?.email].filter(Boolean).join(" | ") || "Contact details not set";
  fixedCard({
    x: margin,
    y: 46,
    width: cardWidth,
    height: 35,
    title: "Prepared for",
    lines: [displayName(client), client?.address || "Address not set", clientContact]
  });
  fixedCard({
    x: margin + cardWidth + cardGap,
    y: 46,
    width: cardWidth,
    height: 31,
    title: isInvoice ? "Payment schedule" : "Project schedule",
    lines: isInvoice
      ? [`Invoice date: ${shortDate(invoice.invoiceDate)}`, `Payment due: ${shortDate(invoice.paymentDueDate)}`, `Status: ${invoice.invoiceStatus}`]
      : [`Quote date: ${shortDate(quote.quoteDate)}`, `Proposed start: ${shortDate(quote.proposedStartDate)}`, `Duration: ${calc.duration} day(s)`],
    tone: isInvoice ? [250, 246, 239] : [241, 249, 249],
    accent: isInvoice ? [200, 137, 51] : [79, 158, 168]
  });

  sectionLabel("Work breakdown", margin, 84);
  const tableTop = 88;
  const roomCount = Math.max(calc.rooms.length, 1);
  const pricingRows = 7;
  const pricingHeight = pricingRows * 6 + 14;
  const lowerSectionHeight = pricingHeight + 55;
  const availableTableHeight = pageHeight - 14 - tableTop - lowerSectionHeight;
  const rowHeight = Math.max(4.7, Math.min(8, (availableTableHeight - 7) / roomCount));
  const tableBottom = tableTop + 7 + roomCount * rowHeight;

  doc.setFillColor(231, 241, 242);
  doc.roundedRect(margin, tableTop, usableWidth, 7, 2.4, 2.4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.4);
  doc.setTextColor(41, 62, 72);
  doc.text("ROOM / WORK", margin + 3, tableTop + 4.7);
  doc.text("DAYS", pageWidth - margin - 35, tableTop + 4.7, { align: "right" });
  doc.text("PRICE", pageWidth - margin - 3, tableTop + 4.7, { align: "right" });

  const rooms = calc.rooms.length ? calc.rooms : [{ roomName: "Project works", jobType: "Decorating", estimatedDays: calc.duration, finalRoomPrice: calc.labourSubtotal }];
  rooms.forEach((room, index) => {
    const rowY = tableTop + 7 + index * rowHeight;
    if (index % 2 === 0) {
      doc.setFillColor(249, 251, 251);
      doc.rect(margin, rowY, usableWidth, rowHeight, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(rowHeight < 5.5 ? 6.6 : 7.6);
    doc.setTextColor(41, 62, 72);
    const workType = room.jobType === "Other" ? room.otherJobType || "Other" : room.jobType;
    const roomLabel = `${room.roomName || "Room"} - ${workType}`;
    doc.text(compactText(doc, roomLabel, usableWidth - 58, 1), margin + 3, rowY + rowHeight * 0.68);
    doc.text(String(room.estimatedDays || 0), pageWidth - margin - 35, rowY + rowHeight * 0.68, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(money(room.finalRoomPrice), pageWidth - margin - 3, rowY + rowHeight * 0.68, { align: "right" });
  });

  let priceY = tableBottom + 9;
  sectionLabel("Cost summary", margin, priceY);
  priceY += 6;
  const summaryRows = [
    ["Labour subtotal", calc.labourSubtotal],
    ["Materials", calc.materialsTotal],
    ["Discount", -calc.discountAmount],
    ["VAT", calc.vatAmount]
  ];
  summaryRows.forEach(([label, value]) => {
    priceRow(label, value, priceY);
    priceY += 6;
  });
  if (isInvoice) {
    priceRow("Deposit paid", invoice.depositPaid, priceY);
    priceY += 6;
    priceRow("Outstanding balance", invoice.balanceDue, priceY, { bold: true, colour: [201, 82, 82] });
  } else {
    priceRow("Deposit due", calc.depositAmount, priceY);
    priceY += 6;
    priceRow("Balance on completion", calc.remainderAmount, priceY, { bold: true });
  }
  priceY += 9;
  priceRow(isInvoice ? "FINAL INVOICE TOTAL" : "FINAL QUOTE TOTAL", calc.total, priceY, { total: true });

  const detailsY = priceY + 11;
  const paymentDate = isInvoice ? shortDate(invoice.paymentDueDate) : shortDate(quote.proposedStartDate);
  fixedCard({
    x: margin,
    y: detailsY,
    width: cardWidth,
    height: 31,
    title: isInvoice ? "Payment details" : "Terms",
    lines: isInvoice
      ? [`Payment due: ${paymentDate}`, data.settings.paymentDetails || "Bank transfer details to be added.", data.settings.paymentTerms || "Please pay by the due date shown."]
      : [`Proposed start: ${paymentDate}`, data.settings.quoteTerms || "Quotation valid for 30 days.", data.settings.paymentTerms || "Deposit due on acceptance."],
    lineLimits: [1, 2, 2],
    tone: [250, 246, 239],
    accent: [200, 137, 51]
  });
  fixedCard({
    x: margin + cardWidth + cardGap,
    y: detailsY,
    width: cardWidth,
    height: 35,
    title: "Thank you",
    lines: [
      "Thank you for choosing Auty Decorating.",
      "We appreciate your business and look forward to working with you.",
      `${decoratorName} | Auty Decorating`
    ],
    tone: [241, 249, 249],
    accent: [7, 113, 127]
  });

  doc.setDrawColor(219, 229, 231);
  doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(102, 118, 125);
  const footerLeft = [data.settings.businessTelephone, data.settings.businessEmail].filter(Boolean).join(" | ") || "AUTY Decorating";
  doc.text(footerLeft, margin, pageHeight - 7.5);
  doc.text(`Generated ${shortDate(today())} | Page 1 of 1`, pageWidth - margin, pageHeight - 7.5, { align: "right" });

  doc.save(isInvoice ? `${invoice.invoiceReference}.pdf` : `${quote.quoteReference}.pdf`);
  return doc;
}
