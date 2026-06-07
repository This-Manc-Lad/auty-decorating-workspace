import { MAX_PHOTO_SIZE_BYTES } from "./constants.js";
import { calculateQuote, number } from "./utils.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateClient(client, { requireAddress = false } = {}) {
  const errors = [];
  if (!client?.surname?.trim()) errors.push("Client surname is required.");
  if (!client?.telephone?.trim() && !client?.email?.trim()) errors.push("Add either a telephone number or an email address.");
  if (client?.email?.trim() && !EMAIL_RE.test(client.email.trim())) errors.push("Enter a valid email address.");
  if (requireAddress && !client?.address?.trim()) errors.push("Client address is required for quotations and invoices.");
  return errors;
}

export function validateRoom(room) {
  const errors = [];
  if (!room?.quoteId) errors.push("Create or select a quote before adding a room.");
  if (!room?.roomName && !room?.roomPreset) errors.push("Choose a room.");
  if (number(room?.estimatedDays) <= 0) errors.push("Room estimate time must be greater than zero.");
  if (number(room?.materialsCost) < 0) errors.push("Materials cost cannot be negative.");
  if (number(room?.overridePrice) < 0) errors.push("Override price cannot be negative.");
  return errors;
}

export function validateQuote(quote, rooms, settings) {
  const errors = [];
  const calc = calculateQuote(quote, rooms, settings);
  if (!quote?.clientId) errors.push("Every quote must be linked to a client.");
  if (!quote?.roomIds?.length) errors.push("Add at least one room before finalising a quote.");
  if (calc.total < 0) errors.push("Quote total cannot be negative.");
  if (calc.depositAmount > calc.total) errors.push("Deposit cannot be greater than the total quote.");
  if (quote?.proposedStartDate && calc.completionDate && calc.completionDate < quote.proposedStartDate) {
    errors.push("Estimated completion date cannot be before the proposed start date.");
  }
  return errors;
}

export function validateInvoice(invoice, quote, rooms, settings) {
  const errors = [];
  const calc = calculateQuote(quote, rooms, settings);
  if (!invoice?.invoiceDate) errors.push("Invoice date is required.");
  if (!invoice?.paymentDueDate) errors.push("Payment due date is required.");
  if (invoice?.invoiceDate && invoice?.paymentDueDate && invoice.paymentDueDate < invoice.invoiceDate) {
    errors.push("Payment due date cannot be before the invoice date.");
  }
  if (number(invoice?.depositPaid) > calc.total) errors.push("Deposit paid cannot be greater than the final job total.");
  return errors;
}

export function validatePhotoUpload(file, form) {
  const errors = [];
  if (!file) errors.push("Choose a photo to upload.");
  if (!form?.clientId || !form?.quoteId || !form?.roomId) errors.push("Choose client, quote and room before uploading.");
  if (file && !file.type.startsWith("image/")) errors.push("Only image files can be uploaded.");
  if (file && file.size > MAX_PHOTO_SIZE_BYTES) errors.push("Photo uploads are limited to 5 MB each.");
  return errors;
}

export function formatErrors(errors) {
  return errors.filter(Boolean).join(" ");
}

