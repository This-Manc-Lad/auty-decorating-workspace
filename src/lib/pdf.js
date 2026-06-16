import autyHeaderLogo from "../../branding/auty-logo-horizontal.png";
import { calculateQuote, displayName, money, shortDate, today } from "./utils.js";

const DEFAULT_PDF_LOGO = autyHeaderLogo;
const TERMS_AND_CONDITIONS = [
  {
    title: "Quotation, Additional Costs and Payment Terms",
    paragraphs: [
      "All quotations provided by Auty Decorating are given as an estimate based on the information available at the time of assessment.",
      "While every effort is made to provide an accurate estimate, the final cost may change where the work is more complex than originally expected, where unforeseen issues arise, where additional preparation or remedial work is required, or where extra time, materials or labour are needed to complete the job properly.",
      "Examples may include, but are not limited to, hidden damage, poor surface condition, damp, flaking paint, uneven walls, additional filling, sanding, repairs, access issues, delays outside Auty Decorating's control, or any additional work requested by the customer after the quotation has been accepted.",
      "Wherever reasonably possible, Auty Decorating will inform the customer of any likely additional costs before carrying out further chargeable work. However, some issues may only become apparent once work has started.",
      "By accepting the quotation, instructing Auty Decorating to proceed, or allowing the work to begin, the customer confirms that they understand and accept that the quotation is an estimate and that the final invoice may vary where additional work, time, materials or unforeseen issues are involved."
    ]
  },
  {
    title: "Payment Terms",
    paragraphs: [
      "Final payment is due in full upon completion of the agreed work, unless otherwise agreed in writing.",
      "If final payment is not received within 7 days of the invoice date, Auty Decorating will issue one payment reminder free of charge.",
      "If a second payment reminder is required, Auty Decorating reserves the right to apply a £50 late payment and administration fee to cover the additional time and costs involved in chasing overdue payment.",
      "If payment remains outstanding after a third and final payment request, Auty Decorating reserves the right to begin formal debt recovery action, including legal proceedings where necessary. This may include recovery of the outstanding invoice amount, any applicable administration fees, court fees, interest and other reasonable costs permitted by law.",
      "If payment has not been made within 30 days of the final invoice date, Auty Decorating may treat the account as overdue and take further action without additional notice."
    ]
  },
  {
    title: "Acceptance of Terms",
    paragraphs: [
      "By accepting a quotation, estimate or booking from Auty Decorating, whether verbally, by message, by email, in writing, or by allowing work to commence, the customer agrees to these terms and conditions.",
      "Acceptance of a quotation forms an agreement between the customer and Auty Decorating for the agreed works, subject to the terms set out above."
    ]
  }
];

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

function addTermsPage(doc, { pageWidth, pageHeight, margin, logoDataUrl, data }) {
  doc.addPage();
  doc.setFillColor(246, 250, 250);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  doc.setFillColor(41, 62, 72);
  doc.roundedRect(margin, 10, pageWidth - margin * 2, 24, 5, 5, "F");
  addImage(doc, logoDataUrl, margin + 4, 14, 42, 14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.text("TERMS AND CONDITIONS", pageWidth - margin - 4, 20, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(225, 235, 238);
  doc.text(data.settings.businessName || "AUTY Decorating", pageWidth - margin - 4, 27, { align: "right" });

  const columnGap = 8;
  const columnWidth = (pageWidth - margin * 2 - columnGap) / 2;
  const columns = [margin, margin + columnWidth + columnGap];
  let column = 0;
  let y = 44;
  const bottom = pageHeight - 18;

  const nextColumn = () => {
    column += 1;
    y = 44;
    if (column > 1) {
      doc.addPage();
      doc.setFillColor(246, 250, 250);
      doc.rect(0, 0, pageWidth, pageHeight, "F");
      column = 0;
    }
  };

  TERMS_AND_CONDITIONS.forEach((section) => {
    const headingLines = doc.splitTextToSize(section.title, columnWidth);
    const sectionHeight = 5 + headingLines.length * 3 + section.paragraphs.reduce((sum, paragraph) => sum + doc.splitTextToSize(paragraph, columnWidth).length * 2.8 + 2.1, 0);
    if (y + sectionHeight > bottom) nextColumn();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.6);
    doc.setTextColor(7, 113, 127);
    doc.text(headingLines, columns[column], y);
    y += headingLines.length * 3.3 + 2.2;
    section.paragraphs.forEach((paragraph) => {
      const lines = doc.splitTextToSize(paragraph, columnWidth);
      if (y + lines.length * 2.8 > bottom) nextColumn();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.1);
      doc.setTextColor(60, 74, 83);
      doc.text(lines, columns[column], y, { lineHeightFactor: 1.08 });
      y += lines.length * 2.8 + 2.1;
    });
    y += 2.8;
  });

  doc.setDrawColor(219, 229, 231);
  doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(102, 118, 125);
  doc.text("Terms and conditions supplied by Auty Decorating", margin, pageHeight - 7.5);
  doc.text("Page 2 of 2", pageWidth - margin, pageHeight - 7.5, { align: "right" });
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
  doc.text(`Generated ${shortDate(today())} | Page 1 of 2`, pageWidth - margin, pageHeight - 7.5, { align: "right" });

  addTermsPage(doc, { pageWidth, pageHeight, margin, logoDataUrl, data });

  doc.save(isInvoice ? `${invoice.invoiceReference}.pdf` : `${quote.quoteReference}.pdf`);
  return doc;
}
