"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  formatUSPhoneNumber,
  isValidUSPhoneNumber,
  normalizeUSPhoneNumber,
} from "../lib/phone";
import { buildInvoiceSmsMessage } from "../lib/invoiceMessage";
import { copyTextToClipboard, openManualSmsComposer } from "../lib/manualSms";
import { getInvoiceShareUrl } from "../actions/shareInvoice";
import { useDemoMode } from "./DemoMode";

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function formatInvoiceDate(dateValue) {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function TextInvoiceModal({ invoice, onClose, triggerRef }) {
  const isDemo = useDemoMode();
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const phoneErrorId = useId();

  const [phoneInput, setPhoneInput] = useState(invoice.clientPhone || "");
  const [phoneError, setPhoneError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [canShare, setCanShare] = useState(false);

  const [linkStatus, setLinkStatus] = useState("loading"); // loading | ready | error
  const [shareUrl, setShareUrl] = useState("");
  const [linkError, setLinkError] = useState("");
  const [message, setMessage] = useState("");
  const [messageEdited, setMessageEdited] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  async function generateLink() {
    setLinkStatus("loading");
    setLinkError("");
    const response = await getInvoiceShareUrl(invoice.id);
    if (response.success) {
      setShareUrl(response.url);
      setLinkStatus("ready");
      if (!messageEdited) {
        setMessage(
          buildInvoiceSmsMessage(
            { ...invoice, publicUrl: response.url },
            { name: invoice.clientName, phone: invoice.clientPhone },
            {}
          )
        );
      }
    } else {
      setLinkStatus("error");
      setLinkError(response.error || "Could not generate the invoice link.");
    }
  }

  useEffect(() => {
    generateLink();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    closeButtonRef.current?.focus();

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
        (el) => !el.disabled
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClose() {
    onClose();
    if (triggerRef && triggerRef.current) {
      triggerRef.current.focus();
    }
  }

  const linkReady = linkStatus === "ready" && !!shareUrl;

  async function handleCopyInvoiceLink() {
    if (!linkReady) return;
    const copied = await copyTextToClipboard(shareUrl);
    setStatusMessage(copied ? "Invoice link copied." : "Copy the link manually from the field above.");
  }

  async function handleCopyCompleteMessage() {
    if (!linkReady) return;
    const copied = await copyTextToClipboard(message);
    setStatusMessage(
      copied ? "Complete message copied." : "Copy the message manually, then open Messages."
    );
  }

  async function handleCopyMessageAndOpenMessages() {
    if (!linkReady) return;
    if (!isValidUSPhoneNumber(phoneInput)) {
      setPhoneError("Enter a valid U.S. phone number (10 digits, or 11 digits starting with 1).");
      return;
    }
    setPhoneError("");
    const normalized = normalizeUSPhoneNumber(phoneInput);

    if (isDemo) {
      setStatusMessage("Demo mode: SMS not sent.");
      return;
    }

    const copied = await copyTextToClipboard(message);
    setStatusMessage(
      copied
        ? "Message copied and Messages opened. Paste the message, review it, and press Send."
        : "Copy the message manually, then open Messages."
    );

    openManualSmsComposer(normalized);
  }

  async function handleShareInvoiceLink() {
    if (!linkReady || !canShare) return;
    if (isDemo) {
      setStatusMessage("Demo mode: SMS not sent.");
      return;
    }
    try {
      await navigator.share({
        title: invoice.id ? `Invoice ${invoice.id}` : "Invoice",
        text: message,
        url: shareUrl,
      });
    } catch (err) {
      // User cancelled the share sheet, or sharing failed silently - this is
      // not an app error, so no failure message is shown.
    }
  }

  const invoiceDateLabel = formatInvoiceDate(invoice.dateCreated);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="text-invoice-title"
        className="max-h-[95dvh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-4 sm:max-h-[90dvh] sm:max-w-xl sm:p-5 lg:max-w-2xl"
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 id="text-invoice-title" className="text-base font-semibold text-slate-900">
            💬 Text Invoice
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="shrink-0 rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            Close
          </button>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-x-6 gap-y-1 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-2">
          <p>
            <span className="text-slate-500">Customer:</span>{" "}
            <span className="font-medium text-slate-900">{invoice.clientName || "—"}</span>
          </p>
          <p>
            <span className="text-slate-500">Invoice #:</span>{" "}
            <span className="font-medium text-slate-900">{invoice.id || "—"}</span>
          </p>
          <p>
            <span className="text-slate-500">Total:</span>{" "}
            <span className="font-medium text-slate-900">
              {invoice.totalAmount ? `$${invoice.totalAmount}` : "—"}
            </span>
          </p>
          <p>
            <span className="text-slate-500">Date:</span>{" "}
            <span className="font-medium text-slate-900">{invoiceDateLabel || "—"}</span>
          </p>
          {invoice.dueDate && (
            <p>
              <span className="text-slate-500">Due:</span>{" "}
              <span className="font-medium text-slate-900">{invoice.dueDate}</span>
            </p>
          )}
        </div>

        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Public invoice link
          </label>
          {linkStatus === "loading" && (
            <p className="text-xs text-slate-500">Generating secure invoice link...</p>
          )}
          {linkStatus === "error" && (
            <div>
              <p role="alert" className="text-xs text-red-600">
                {linkError}
              </p>
              <button
                type="button"
                onClick={generateLink}
                className="mt-1 rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Try Again
              </button>
            </div>
          )}
          {linkReady && (
            <p className="break-all rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700">
              {shareUrl}
            </p>
          )}
        </div>

        <div className="mb-3">
          <label htmlFor="text-invoice-phone" className="mb-1 block text-sm font-medium text-slate-700">
            Customer mobile number
          </label>
          <input
            id="text-invoice-phone"
            type="tel"
            value={phoneInput}
            onChange={(e) => {
              setPhoneInput(e.target.value);
              if (phoneError) setPhoneError("");
            }}
            aria-invalid={phoneError ? "true" : "false"}
            aria-describedby={phoneError ? phoneErrorId : undefined}
            placeholder="(929) 246-3822"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          {isValidUSPhoneNumber(phoneInput) && (
            <p className="mt-1 text-xs text-slate-400">
              Will text: {formatUSPhoneNumber(phoneInput)}
            </p>
          )}
          {phoneError && (
            <p id={phoneErrorId} role="alert" className="mt-1 text-xs text-red-600">
              {phoneError}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label
            htmlFor="text-invoice-message"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Message preview (editable)
          </label>
          <textarea
            id="text-invoice-message"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setMessageEdited(true);
            }}
            disabled={!linkReady}
            className="min-h-[160px] w-full resize-y rounded border border-slate-300 px-3 py-2 text-sm leading-relaxed outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
            placeholder={linkReady ? "" : "Waiting for the invoice link..."}
          />
        </div>

        <p className="mb-3 text-[11px] text-slate-500">
          On iPhone, a website can&apos;t reliably prefill the Messages text field. For the smoothest
          experience there, use <strong>Share Invoice Link</strong> below - it hands the message and
          link directly to Messages via the native share sheet.
        </p>

        <div className="flex flex-col gap-2">
          <div>
            <button
              type="button"
              onClick={handleCopyMessageAndOpenMessages}
              disabled={!linkReady}
              className="w-full rounded bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              Copy Message &amp; Open Messages
            </button>
            <p className="mt-1 text-[11px] text-slate-500">
              Copies the complete invoice message (including the link) and opens your Messages
              app with the customer&apos;s phone number. Paste and press Send yourself.
            </p>
          </div>

          {canShare && (
            <div>
              <button
                type="button"
                onClick={handleShareInvoiceLink}
                disabled={!linkReady}
                className="w-full rounded border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Share Invoice Link
              </button>
              <p className="mt-1 text-[11px] text-slate-500">
                Opens your device&apos;s share menu so you can choose Messages or another
                application. Recommended on iPhone.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <button
                type="button"
                onClick={handleCopyInvoiceLink}
                disabled={!linkReady}
                className="w-full rounded border border-slate-300 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Copy Invoice Link
              </button>
              <p className="mt-1 text-[11px] text-slate-500">Copies only the public invoice URL.</p>
            </div>
            <div>
              <button
                type="button"
                onClick={handleCopyCompleteMessage}
                disabled={!linkReady}
                className="w-full rounded border border-slate-300 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Copy Complete Message
              </button>
              <p className="mt-1 text-[11px] text-slate-500">
                Copies the full message without opening another app.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-full rounded py-2 text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        </div>

        <p aria-live="polite" className="mt-3 min-h-[1rem] text-xs text-slate-600">
          {statusMessage}
        </p>

        <p className="mt-2 text-[11px] text-slate-400">
          This app cannot confirm whether the text was sent or the link was opened by the
          customer - it only opens your Messages app or share sheet. You must review and press
          Send yourself.
        </p>
      </div>
    </div>
  );
}
