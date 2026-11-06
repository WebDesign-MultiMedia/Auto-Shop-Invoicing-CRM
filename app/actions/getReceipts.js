"use server";

import { requireStaff } from "../lib/auth";
import { listReceipts } from "../lib/data";

export async function getRecentReceipts({ limit = 4, search = "" } = {}) {
  // Outside the try: an unauthenticated call must fail, not return a result.
  const session = await requireStaff();

  try {
    const rows = await listReceipts({ sid: session.sid });

    // "#RCT-123" and "rct-123" should both match receipt RCT-123.
    const needle = String(search || "").trim().replace(/^#/, "").toLowerCase();

    const filtered = needle
      ? rows.filter((row) => {
          const haystack = `${row.id || ""} ${row.clientName || ""} ${row.carDetails || ""} ${row.vin || ""}`.toLowerCase();
          return haystack.includes(needle);
        })
      : rows;

    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.dateCreated || 0).getTime();
      const dateB = new Date(b.dateCreated || 0).getTime();
      return dateB - dateA;
    });

    return { success: true, receipts: limit ? sorted.slice(0, limit) : sorted };
  } catch (error) {
    return { success: false, error: error.message, receipts: [] };
  }
}
