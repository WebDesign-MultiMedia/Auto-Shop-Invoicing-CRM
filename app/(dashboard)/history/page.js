"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getRecentReceipts } from "../../actions/getReceipts";
import VehicleSpecsCard from "../../components/VehicleSpecsCard";
import TextInvoiceModal from "../../components/TextInvoiceModal";
import { getInvoiceShareUrl } from "../../actions/shareInvoice";

const VIEW_MODES = [
  { id: "list", label: "List" },
  { id: "grid", label: "Grid" },
  { id: "detailed", label: "Detailed" },
];

const SORT_OPTIONS = [
  { id: "newest", label: "Newest first" },
  { id: "oldest", label: "Oldest first" },
  { id: "amount-desc", label: "Highest amount" },
  { id: "amount-asc", label: "Lowest amount" },
  { id: "name-asc", label: "Customer A–Z" },
  { id: "name-desc", label: "Customer Z–A" },
];

const DATE_RANGES = [
  { id: "all", label: "All time" },
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "month", label: "This month" },
  { id: "year", label: "This year" },
];

const DEFAULT_FILTERS = { sort: "newest", range: "all", payment: "all" };

function timeOf(receipt) {
  const t = new Date(receipt.dateCreated || 0).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function amountOf(receipt) {
  const n = parseFloat(String(receipt.totalAmount ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isNaN(n) ? 0 : n;
}

function rangeStart(range) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (range) {
    case "today":
      return startOfToday.getTime();
    case "7d":
      return startOfToday.getTime() - 6 * 86400000;
    case "30d":
      return startOfToday.getTime() - 29 * 86400000;
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    case "year":
      return new Date(now.getFullYear(), 0, 1).getTime();
    default:
      return null;
  }
}

const COMPARATORS = {
  newest: (a, b) => timeOf(b) - timeOf(a),
  oldest: (a, b) => timeOf(a) - timeOf(b),
  "amount-desc": (a, b) => amountOf(b) - amountOf(a) || timeOf(b) - timeOf(a),
  "amount-asc": (a, b) => amountOf(a) - amountOf(b) || timeOf(b) - timeOf(a),
  "name-asc": (a, b) => String(a.clientName || "").localeCompare(String(b.clientName || "")),
  "name-desc": (a, b) => String(b.clientName || "").localeCompare(String(a.clientName || "")),
};

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      >
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function parseVehicleDetails(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function Field({ label, value }) {
  if (!value) return null;
  return (
    <p>
      <span className="text-slate-500">{label}:</span>{" "}
      <span className="text-slate-200">{value}</span>
    </p>
  );
}

export default function HistoryPage() {
  const [query, setQuery] = useState("");
  const [receipts, setReceipts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [textInvoiceTarget, setTextInvoiceTarget] = useState(null);
  const activeTriggerRef = useRef(null);
  const [viewingInvoiceId, setViewingInvoiceId] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const paymentOptions = useMemo(() => {
    const methods = [...new Set(receipts.map((r) => r.paymentMethod).filter(Boolean))].sort();
    return [{ id: "all", label: "All methods" }, ...methods.map((m) => ({ id: m, label: m }))];
  }, [receipts]);

  const visibleReceipts = useMemo(() => {
    const start = rangeStart(filters.range);
    return receipts
      .filter((r) => start === null || timeOf(r) >= start)
      .filter((r) => filters.payment === "all" || r.paymentMethod === filters.payment)
      .sort(COMPARATORS[filters.sort] || COMPARATORS.newest);
  }, [receipts, filters]);

  const filtersActive =
    filters.sort !== DEFAULT_FILTERS.sort ||
    filters.range !== DEFAULT_FILTERS.range ||
    filters.payment !== DEFAULT_FILTERS.payment;

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  async function handleViewInvoice(invoiceId) {
    setViewingInvoiceId(invoiceId);
    const response = await getInvoiceShareUrl(invoiceId);
    setViewingInvoiceId(null);
    if (response.success) {
      window.open(response.url, "_blank", "noopener,noreferrer");
    }
  }

  function openTextInvoice(receipt, e) {
    activeTriggerRef.current = e.currentTarget;
    setTextInvoiceTarget(receipt);
  }

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const timeout = setTimeout(async () => {
      const response = await getRecentReceipts({ limit: null, search: query });
      if (cancelled) return;

      if (response.success) {
        setReceipts(response.receipts);
        setError("");
      } else {
        setError(response.error);
      }
      setIsLoading(false);
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-100">Receipt History</h1>
          <p className="text-sm text-slate-500">All paid receipts logged to SheetDB</p>
        </div>
        <div className="grid w-fit grid-cols-3 gap-1 rounded-lg bg-slate-900 p-1">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setViewMode(mode.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === mode.id
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mb-6">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
          <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by customer name, car, or VIN..."
          className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2.5 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="mb-6 rounded-xl border border-slate-800 bg-slate-800/30 p-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FilterSelect
            label="Sort by"
            value={filters.sort}
            onChange={(v) => updateFilter("sort", v)}
            options={SORT_OPTIONS}
          />
          <FilterSelect
            label="Date range"
            value={filters.range}
            onChange={(v) => updateFilter("range", v)}
            options={DATE_RANGES}
          />
          <FilterSelect
            label="Payment method"
            value={filters.payment}
            onChange={(v) => updateFilter("payment", v)}
            options={paymentOptions}
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {visibleReceipts.length} of {receipts.length} receipt{receipts.length === 1 ? "" : "s"}
          </span>
          {filtersActive && (
            <button
              type="button"
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="font-medium text-blue-400 transition hover:text-blue-300"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Loading...</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {!isLoading && !error && visibleReceipts.length === 0 && (
        <p className="text-sm text-slate-500">No matching receipts found.</p>
      )}

      {viewMode === "list" && (
        <div className="flex flex-col gap-2">
          {visibleReceipts.map((receipt) => {
            const formattedDate = receipt.dateCreated
              ? new Date(receipt.dateCreated).toLocaleDateString()
              : "";

            return (
              <div
                key={receipt.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-800/40 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-100">{receipt.clientName}</p>
                  <p className="truncate text-xs text-slate-500">
                    {receipt.carDetails}
                    {formattedDate ? ` · ${formattedDate}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {receipt.totalAmount && (
                    <span className="text-sm font-semibold text-green-400">${receipt.totalAmount}</span>
                  )}
                  <button
                    type="button"
                    title="View Invoice"
                    onClick={() => handleViewInvoice(receipt.id)}
                    disabled={viewingInvoiceId === receipt.id}
                    className="rounded p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    🔗
                  </button>
                  <button
                    type="button"
                    title="Text Invoice"
                    onClick={(e) => openTextInvoice(receipt, e)}
                    className="rounded p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                  >
                    💬
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === "grid" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visibleReceipts.map((receipt) => {
            const formattedDate = receipt.dateCreated
              ? new Date(receipt.dateCreated).toLocaleDateString()
              : "";

            return (
              <div
                key={receipt.id}
                className="flex flex-col items-center gap-1 rounded-xl border border-slate-800 bg-slate-800/40 p-3 text-center"
              >
                <p className="w-full truncate text-xs font-semibold text-slate-100">{receipt.clientName}</p>
                <p className="w-full truncate text-[11px] text-slate-500">{receipt.carDetails}</p>
                {receipt.totalAmount && (
                  <p className="text-sm font-bold text-green-400">${receipt.totalAmount}</p>
                )}
                <p className="text-[10px] text-slate-500">{formattedDate}</p>
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    title="View Invoice"
                    onClick={() => handleViewInvoice(receipt.id)}
                    disabled={viewingInvoiceId === receipt.id}
                    className="rounded p-1 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    🔗
                  </button>
                  <button
                    type="button"
                    title="Text Invoice"
                    onClick={(e) => openTextInvoice(receipt, e)}
                    className="rounded p-1 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                  >
                    💬
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === "detailed" && (
        <div className="flex flex-col gap-4">
          {visibleReceipts.map((receipt) => {
            const vehicleDetails = parseVehicleDetails(receipt.vehicleSpecifications);
            const formattedDate = receipt.dateCreated
              ? new Date(receipt.dateCreated).toLocaleString()
              : "";

            return (
              <div
                key={receipt.id}
                className="rounded-xl border border-slate-800 bg-slate-800/40 p-4 sm:p-5"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{receipt.clientName}</p>
                    <p className="text-xs text-slate-500">Receipt #{receipt.id}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-400">
                    {receipt.paymentStatus || "PAID"}
                  </span>
                </div>

                <div className="mb-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2">
                  <Field label="Customer Email" value={receipt.clientEmail} />
                  <Field label="Customer Phone" value={receipt.clientPhone} />
                  <Field label="Car Info" value={receipt.carDetails} />
                  <Field label="Car VIN" value={receipt.vin} />
                  <Field label="Car Mileage" value={receipt.mileage} />
                  <Field label="Payment Method" value={receipt.paymentMethod} />
                  <Field label="Total Amount" value={receipt.totalAmount ? `$${receipt.totalAmount}` : ""} />
                  <Field label="Date" value={formattedDate} />
                </div>

                <div className="mb-3 text-xs">
                  <p className="text-slate-500">Job / Service Details:</p>
                  <p className="mt-0.5 text-slate-200">{receipt.jobDetails}</p>
                </div>

                <VehicleSpecsCard vehicleDetails={vehicleDetails} />

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleViewInvoice(receipt.id)}
                    disabled={viewingInvoiceId === receipt.id}
                    className="rounded border border-slate-700 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {viewingInvoiceId === receipt.id ? "Opening..." : "🔗 View Invoice"}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => openTextInvoice(receipt, e)}
                    className="rounded border border-slate-700 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800"
                  >
                    💬 Text Invoice
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {textInvoiceTarget && (
        <TextInvoiceModal
          invoice={textInvoiceTarget}
          onClose={() => setTextInvoiceTarget(null)}
          triggerRef={activeTriggerRef}
        />
      )}
    </div>
  );
}
