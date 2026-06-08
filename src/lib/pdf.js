import { calculateQuote, displayName, money, shortDate, today } from "./utils.js";

const DEFAULT_PDF_LOGO = "./branding/auty-logo-light.jpg";

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

function sentenceList(items) {
  const clean = items.filter(Boolean);
  if (!clean.length) return "general decorating works";
  if (clean.length === 1) return clean[0];
  return `${clean.slice(0, -1).join(", ")} and ${clean.at(-1)}`;
}

function roomDescription(room) {
  const items = [];
  if (room.ceiling === "Yes") items.push("ceiling preparation and coating");
  if (room.jobType === "Painting" || room.jobType === "Combination") items.push("wall painting");
  if (room.jobType === "Wallpapering" || room.jobType === "Combination") items.push("wallpapering");
  if (room.skirtingBoards !== "No") items.push("skirting boards");
  if (room.architrave !== "No") items.push("architrave");
  if (room.doors !== "No") items.push("doors");

  const features = room.otherFeatures || {};
  const labels = {
    dadoRails: "dado rails",
    pictureRails: "picture rails",
    radiators: "radiators",
    windowSill: "window sill",
    banister: "banister",
    spindles: "spindles",
    stairsFeature: "stairs",
    floor: "floor",
    other: "additional features"
  };
  Object.entries(labels).forEach(([key, label]) => {
    if (features[key] && features[key] !== "No") items.push(label);
  });

  return `Includes ${sentenceList(items)}.`;
}

function shouldPrintWholeJobSpecifics(text = "") {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return !/:\s*(Painting|Wallpapering|Combination|Other) including/i.test(trimmed);
}

export async function generateWorkspacePdf({ kind, quote, invoice, data }) {
  const jsPDF = window.jspdf?.jsPDF;
  if (!jsPDF || !quote) throw new Error("PDF library unavailable");

  const client = data.clients.find((entry) => entry.clientId === quote.clientId);
  const calc = calculateQuote(quote, data.rooms, data.settings);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const usableWidth = pageWidth - margin * 2;
  let y = 18;

  const logoDataUrl = await toDataUrl(data.settings.logoUrl || DEFAULT_PDF_LOGO).catch(() => "");

  const ensureSpace = (height) => {
    if (y + height < pageHeight - 16) return;
    doc.addPage();
    y = 18;
  };

  const sectionTitle = (label) => {
    ensureSpace(8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(34, 48, 71);
    doc.text(label, margin, y);
    y += 6;
  };

  const paragraph = (text, options = {}) => {
    const split = doc.splitTextToSize(String(text || ""), options.width || usableWidth);
    const lineHeight = options.lineHeight || 4.6;
    ensureSpace(split.length * lineHeight + 2);
    doc.setFont("helvetica", options.bold ? "bold" : "normal");
    doc.setFontSize(options.size || 10);
    doc.setTextColor(...(options.colour || [24, 34, 48]));
    doc.text(split, options.x || margin, y);
    y += split.length * lineHeight + (options.gap || 2);
  };

  const infoCard = (title, lines, tone = [248, 245, 238]) => {
    const height = 12 + lines.length * 6.5;
    ensureSpace(height + 2);
    doc.setFillColor(...tone);
    doc.roundedRect(margin, y - 4, usableWidth, height, 4, 4, "F");
    paragraph(title, { bold: true, size: 11, gap: 3 });
    lines.forEach((line) => paragraph(line, { size: 9.5, gap: 2.5 }));
    y += 1;
  };

  doc.setFillColor(34, 48, 71);
  doc.roundedRect(margin, 12, usableWidth, 34, 5, 5, "F");
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "PNG", margin + 4, 17, 18, 18, undefined, "FAST");
    } catch {
      try {
        doc.addImage(logoDataUrl, "JPEG", margin + 4, 17, 18, 18, undefined, "FAST");
      } catch {
        // ignore broken logo formats and continue
      }
    }
  }
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text(data.settings.businessName || "AUTY Decorating", logoDataUrl ? margin + 28 : margin + 4, 24);
  doc.setFontSize(11);
  doc.setTextColor(240, 181, 82);
  doc.text(kind === "quote" ? `Quotation ${quote.quoteReference}` : `Invoice ${invoice.invoiceReference}`, logoDataUrl ? margin + 28 : margin + 4, 31);
  doc.setTextColor(231, 236, 242);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const businessMeta = [
    data.settings.businessTelephone,
    data.settings.businessEmail,
    data.settings.businessAddress
  ].filter(Boolean).join("  |  ");
  if (businessMeta) doc.text(doc.splitTextToSize(businessMeta, usableWidth - 76), pageWidth - margin - 72, 21);
  y = 54;

  infoCard("Client", [
    displayName(client),
    client?.address || "Address not set",
    [client?.telephone, client?.email].filter(Boolean).join(" | ") || "Contact details not set"
  ]);

  infoCard(kind === "quote" ? "Schedule" : "Invoice", kind === "quote"
    ? [
      `Quote date: ${shortDate(quote.quoteDate)}`,
      `Proposed start date: ${shortDate(quote.proposedStartDate)}`,
      `Estimated duration: ${calc.duration} day(s)`,
      `Estimated completion: ${shortDate(calc.completionDate)}`
    ]
    : [
      `Invoice date: ${shortDate(invoice.invoiceDate)}`,
      `Original quote: ${quote.quoteReference}`,
      `Payment due date: ${shortDate(invoice.paymentDueDate)}`,
      `Invoice status: ${invoice.invoiceStatus}`
    ], kind === "quote" ? [248, 245, 238] : [239, 247, 243]);

  sectionTitle("Room Breakdown");
  calc.rooms.forEach((room) => {
    const type = room.jobType === "Other" ? room.otherJobType || "Other" : room.jobType;
    const description = doc.splitTextToSize(roomDescription(room), usableWidth - 10);
    const rowHeight = Math.max(18, description.length * 4.4 + 12);
    ensureSpace(rowHeight + 2);
    doc.setFillColor(252, 250, 246);
    doc.roundedRect(margin, y - 3, usableWidth, rowHeight, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(24, 34, 48);
    doc.text(room.roomName || "Room", margin + 4, y + 2);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(82, 92, 106);
    doc.text(`${type} | ${room.estimatedDays} day(s) | ${money(room.finalRoomPrice)}`, margin + 4, y + 8);
    doc.text(description, margin + 4, y + 14);
    y += rowHeight + 3;
  });

  infoCard("Price Summary", [
    `Labour subtotal: ${money(calc.labourSubtotal)}`,
    `Materials total: ${money(calc.materialsTotal)}`,
    `Discount: ${money(calc.discountAmount)}`,
    `VAT: ${money(calc.vatAmount)}`,
    `Job total: ${money(calc.total)}`,
    `Deposit due now: ${money(calc.depositAmount)}`,
    `Remainder due on completion: ${money(calc.remainderAmount)}`
  ], [255, 248, 232]);

  if (shouldPrintWholeJobSpecifics(quote.wholeJobSpecifics)) {
    infoCard("Whole Job Specifics", doc.splitTextToSize(quote.wholeJobSpecifics, usableWidth - 10), [245, 247, 255]);
  }

  if (kind === "invoice" && invoice) {
    infoCard("Payment Terms", [
      `Deposit paid: ${money(invoice.depositPaid)}`,
      `Remaining balance: ${money(invoice.balanceDue)}`,
      data.settings.paymentDetails || "Payment details to be added."
    ], [245, 247, 255]);
    if (data.settings.paymentTerms) {
      sectionTitle("Terms");
      paragraph(data.settings.paymentTerms, { size: 9.5 });
    }
  } else {
    infoCard("Quotation Notes", [
      data.settings.quoteTerms || "This quotation is valid for 30 days.",
      data.settings.paymentTerms || "Deposit due now. Remaining balance due on completion.",
      data.settings.acceptanceNotes || "Please confirm acceptance before the proposed start date."
    ], [245, 247, 255]);
    sectionTitle("Acceptance");
    paragraph("Accepted by: ______________________________", { size: 10, bold: true });
    paragraph("Name / Signature", { size: 9, colour: [108, 117, 125] });
    paragraph("Date: ______________________________", { size: 10, bold: true });
  }

  doc.setDrawColor(220, 220, 220);
  doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(108, 117, 125);
  doc.text(`${data.settings.businessName || "AUTY Decorating"} | Generated ${shortDate(today())}`, margin, pageHeight - 9);

  doc.save(kind === "quote" ? `${quote.quoteReference}.pdf` : `${invoice.invoiceReference}.pdf`);
}
