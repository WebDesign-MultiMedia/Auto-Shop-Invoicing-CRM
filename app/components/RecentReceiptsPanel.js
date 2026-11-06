"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getRecentReceipts } from "../actions/getReceipts";
import TextInvoiceModal from "./TextInvoiceModal";
import { getInvoiceShareUrl } from "../actions/shareInvoice";

function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Detail({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-3">
      <span className="shrink-0 text-slate-500">{label}</span>
      <span className="min-w-0 break-words text-right text-slate-200">{value}</span>
    </div>
  );
}

export default function RecentReceiptsPanel({ refreshKey }) {
  const [receipts, setReceipts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [textInvoiceTarget, setTextInvoiceTarget] = useState(null);
  const activeTriggerRef = useRef(null);
  const [expandedId, setExpandedId] = useState(null);
  const [viewingInvoiceId, setViewingInvoiceId] = useState(null);

  async function handleViewInvoice(invoiceId) {
    setViewingInvoiceId(invoiceId);
    const response = await getInvoiceShareUrl(invoiceId);
    setViewingInvoiceId(null);
    if (response.success) {
      window.open(response.url, "_blank", "noopener,noreferrer");
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      const response = await getRecentReceipts({ limit: 4 });
      if (cancelled) return;

      if (response.success) {
        setReceipts(response.receipts);
        setError("");
      } else {
        setError(response.error);
      }
      setIsLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <div className="flex w-full flex-col border-t border-slate-800 bg-slate-950 p-4 sm:p-5 lg:h-full lg:w-80 lg:border-l lg:border-t-0">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-100">Recent Receipts</h2>
      </div>

      {isLoading && <p className="text-xs text-slate-500">Loading...</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
      {!isLoading && !error && receipts.length === 0 && (
        <p className="text-xs text-slate-500">No receipts yet.</p>
      )}

      <div className="flex flex-col gap-3">
        {receipts.map((receipt) => {
          const isOpen = expandedId === receipt.id;
          const panelId = `recent-receipt-${receipt.id}`;
          return (
          <div
            key={receipt.id}
            className={`rounded-xl border bg-slate-900 p-3 transition ${
              isOpen ? "border-blue-500/50" : "border-slate-800"
            }`}
          >
            <button
              type="button"
              onClick={() => setExpandedId(isOpen ? null : receipt.id)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              title={isOpen ? "Hide details" : "Show details"}
              className="-m-1 mb-1 block w-[calc(100%+0.5rem)] rounded-lg p-1 text-left transition hover:bg-slate-800/60"
            >
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                  {initials(receipt.clientName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-100">
                    {receipt.clientName || "Unknown"}
                  </p>
                  <p className="truncate text-xs text-slate-500">{receipt.carDetails}</p>
                </div>
                <span className="shrink-0 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-400">
                  PAID
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-90" : ""}`}
                  >
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                  {receipt.paymentMethod}
                </span>
                <span className="font-semibold text-slate-200">${receipt.totalAmount}</span>
              </div>
            </button>

            {isOpen && (
              <div id={panelId} className="mb-2 mt-2 flex flex-col gap-1.5 border-t border-slate-800 pt-2 text-xs">
                <Detail label="Receipt #" value={receipt.id} />
                <Detail
                  label="Date"
                  value={receipt.dateCreated ? new Date(receipt.dateCreated).toLocaleString() : ""}
                />
                <Detail label="Email" value={receipt.clientEmail} />
                <Detail label="Phone" value={receipt.clientPhone} />
                <Detail label="VIN" value={receipt.vin} />
                <Detail label="Mileage" value={receipt.mileage} />
                {receipt.jobDetails && (
                  <div className="mt-1">
                    <p className="text-slate-500">Job / Service Details</p>
                    <p className="mt-0.5 whitespace-pre-line text-slate-200">{receipt.jobDetails}</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleViewInvoice(receipt.id)}
                  disabled={viewingInvoiceId === receipt.id}
                  className="mt-1 w-full rounded border border-slate-700 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {viewingInvoiceId === receipt.id ? "Opening..." : "🔗 View Invoice"}
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={(e) => {
                activeTriggerRef.current = e.currentTarget;
                setTextInvoiceTarget(receipt);
              }}
              className="w-full rounded border border-slate-700 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800"
            >
              💬 Text Invoice
            </button>
          </div>
          );
        })}
      </div>

      <Link
        href="/history"
        className="mt-4 w-full rounded-lg bg-blue-600 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        View history
      </Link>

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
