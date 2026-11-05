"use server";

import { createShareToken } from "../lib/shareToken";
import { getPublicBaseUrl } from "../lib/baseUrl";
import { requireStaff } from "../lib/auth";
import { findReceiptById } from "../lib/data";

// Generates (or re-derives, since tokens are deterministic per invoice) the
// public share URL for an invoice. Confirms the invoice actually exists
// before minting a link for it. Staff only.
//
// The public read side (getPublicInvoiceByToken) lives in
// app/lib/publicInvoice.js, not here, so it is not exposed as a callable
// server action endpoint.
export async function getInvoiceShareUrl(invoiceId) {
  await requireStaff();

  try {
    if (!invoiceId) {
      throw new Error("Missing invoice ID.");
    }

    const receipt = await findReceiptById(invoiceId);
    if (!receipt) {
      throw new Error("Invoice not found.");
    }

    const token = createShareToken(invoiceId);
    const baseUrl = getPublicBaseUrl();

    return { success: true, url: `${baseUrl}/invoice/${token}` };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
