import "server-only";
import { assertDemoConfigSafe, isDemoMode } from "./demoMode";
import { getDemoInvoices } from "./demoData";
import { addDemoInvoice, findDemoInvoiceById, getDemoInvoicesForSession } from "./demoStore";

// Single place that reads/writes invoice rows. In DEMO_MODE everything
// comes from the fake dataset + per-session memory; SheetDB is never called.
// Callers are responsible for authorization (requireStaff) - except
// findReceiptById, which the public invoice page uses via a share token.

function sheetUrl() {
  const url = process.env.SHEETDB_API_URL;
  if (!url) throw new Error("Missing required environment variable on this deployment: SHEETDB_API_URL");
  return url;
}

export async function listReceipts({ sid } = {}) {
  assertDemoConfigSafe();
  if (isDemoMode()) {
    return [...getDemoInvoicesForSession(sid), ...getDemoInvoices()];
  }

  const res = await fetch(sheetUrl(), { method: "GET", cache: "no-store" });
  if (!res.ok) throw new Error(`SheetDB fetch failed (${res.status})`);
  return res.json();
}

export async function findReceiptById(invoiceId) {
  assertDemoConfigSafe();
  if (isDemoMode()) {
    return getDemoInvoices().find((row) => row.id === invoiceId) || findDemoInvoiceById(invoiceId);
  }
  const rows = await listReceipts();
  return rows.find((row) => row.id === invoiceId) || null;
}

export async function appendReceipt(row, { sid } = {}) {
  assertDemoConfigSafe();
  if (isDemoMode()) {
    addDemoInvoice(sid, row);
    return;
  }

  const res = await fetch(sheetUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [row] }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`SheetDB logging failed (${res.status}): ${errorText}`);
  }
}
