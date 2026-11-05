import "server-only";
import { listReceipts } from "./data";

const MAX_SERVICE_TYPES = 8;

function parseAmount(raw) {
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}

function startOfWeekMonday(dateInput) {
  const d = new Date(dateInput);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

// Callers must authorize first (the dashboard page calls requireStaff()).
export async function fetchInvoices({ sid } = {}) {
  return listReceipts({ sid });
}

export function aggregateRevenueByWeek(invoices) {
  const totalsByWeek = new Map();

  for (const invoice of invoices) {
    if (!invoice.dateCreated) continue;
    const weekStart = startOfWeekMonday(invoice.dateCreated).getTime();
    totalsByWeek.set(weekStart, (totalsByWeek.get(weekStart) || 0) + parseAmount(invoice.totalAmount));
  }

  return [...totalsByWeek.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([weekStart, total]) => ({ week: new Date(weekStart), total }));
}

// jobDetails is a freeform text field rather than a fixed category, so real
// data can produce many near-unique values. Cap the chart at the top N by
// revenue and roll the remainder into "Other" to keep it readable.
export function aggregateByServiceType(invoices) {
  const byType = new Map();

  for (const invoice of invoices) {
    const type = (invoice.jobDetails || "").trim() || "Unspecified";
    const entry = byType.get(type) || { type, revenue: 0, count: 0 };
    entry.revenue += parseAmount(invoice.totalAmount);
    entry.count += 1;
    byType.set(type, entry);
  }

  const sorted = [...byType.values()].sort((a, b) => b.revenue - a.revenue);

  if (sorted.length <= MAX_SERVICE_TYPES) return sorted;

  const top = sorted.slice(0, MAX_SERVICE_TYPES - 1);
  const rest = sorted.slice(MAX_SERVICE_TYPES - 1);
  const other = rest.reduce(
    (acc, entry) => ({
      type: "Other",
      revenue: acc.revenue + entry.revenue,
      count: acc.count + entry.count,
    }),
    { type: "Other", revenue: 0, count: 0 }
  );

  return [...top, other];
}

// paymentStatus is hardcoded to "PAID" on every record at write time, so it
// carries no variance. paymentMethod (Cash / Zelle) is the closest field
// that actually varies, so use it for the status-style breakdown.
export function aggregateByPaymentMethod(invoices) {
  const byMethod = new Map();

  for (const invoice of invoices) {
    const method = invoice.paymentMethod || "Unspecified";
    byMethod.set(method, (byMethod.get(method) || 0) + 1);
  }

  return [...byMethod.entries()].map(([status, count]) => ({ status, count }));
}

export function aggregateAvgTicketByWeek(invoices) {
  const totalsByWeek = new Map();

  for (const invoice of invoices) {
    if (!invoice.dateCreated) continue;
    const weekStart = startOfWeekMonday(invoice.dateCreated).getTime();
    const entry = totalsByWeek.get(weekStart) || { total: 0, count: 0 };
    entry.total += parseAmount(invoice.totalAmount);
    entry.count += 1;
    totalsByWeek.set(weekStart, entry);
  }

  return [...totalsByWeek.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([weekStart, { total, count }]) => ({
      week: new Date(weekStart),
      avg: count ? total / count : 0,
    }));
}
