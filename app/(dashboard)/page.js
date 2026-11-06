"use client";

import { useRef, useState } from "react";
import { processReceiptAndNotify } from "../actions/receipt";
import VinScannerModal from "../components/VinScannerModal";
import RecentReceiptsPanel from "../components/RecentReceiptsPanel";
import VehicleSpecsCard from "../components/VehicleSpecsCard";
import TextInvoiceModal from "../components/TextInvoiceModal";
import { useDemoMode } from "../components/DemoMode";
import { SERVICE_CATALOG, formatPrice, serviceLine } from "../lib/serviceCatalog";

const DEMO_DATA = {
  clientName: "Jane Smith",
  clientEmail: "jane@example.com",
  clientPhone: "+15550192831",
  carDetails: "2019 Toyota RAV4",
  vin: "1HGCM82633A004352",
  vehicleDetails: {
    manufacturer: "TOYOTA MOTOR MANUFACTURING",
    vehicleType: "MULTIPURPOSE PASSENGER VEHICLE (MPV)",
    bodyClass: "Sport Utility Vehicle (SUV)",
    series: "XLE",
    trim: "XLE Premium",
    driveType: "AWD",
    gvwr: "Class 1D: 5,001 - 6,000 lb",
    cylinders: "4",
    displacement: "2.5",
    engineModel: "2AR-FE",
    engineManufacturer: "Toyota",
    engineHp: "203",
    electrificationLevel: "",
    primaryFuel: "Gasoline",
    secondaryFuel: "",
    transmissionSpeeds: "8",
    transmissionStyle: "Automatic",
    plantCity: "Georgetown",
    plantState: "Kentucky",
    plantCountry: "United States (USA)",
    airbagFront: "1st Row (Driver and Passenger)",
    airbagKnee: "",
    airbagSide: "1st Row (Driver and Passenger)",
    airbagCurtain: "All Rows",
    airbagSeatCushion: "",
    otherRestraintInfo: "Seat Belt (Rear center position).",
  },
  mileage: "42,300",
  jobDetails: "Alternator Replacement & Battery Maintenance",
  totalAmount: "420.00",
  paymentMethod: "Zelle",
};

const EMPTY_FORM = {
  clientName: "",
  clientEmail: "",
  clientPhone: "",
  carDetails: "",
  vin: "",
  vehicleDetails: null,
  mileage: "",
  jobDetails: "",
  totalAmount: "",
  paymentMethod: "Cash",
};

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";
const labelClass = "mb-1 block text-sm font-medium text-slate-300";

export default function Home() {
  const isDemo = useDemoMode();
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastInvoice, setLastInvoice] = useState(null);
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const textInvoiceTriggerRef = useRef(null);

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  // A service counts as picked while its line is in the Job / Service Details box,
  // so deleting the line by hand also un-picks it.
  const jobLines = form.jobDetails.split("\n").map((line) => line.trim());
  const pickedServices = SERVICE_CATALOG.filter((s) => jobLines.includes(serviceLine(s)));
  const pickedTotal = pickedServices.reduce((sum, s) => sum + s.price, 0);

  function toggleService(service) {
    setForm((prev) => {
      const line = serviceLine(service);
      const lines = prev.jobDetails.split("\n");
      const isPicked = lines.some((l) => l.trim() === line);
      const currentTotal = parseFloat(prev.totalAmount) || 0;

      const nextLines = isPicked
        ? lines.filter((l) => l.trim() !== line)
        : [...lines.filter((l) => l.trim() !== ""), line];
      const nextTotal = Math.max(0, currentTotal + (isPicked ? -service.price : service.price));

      return {
        ...prev,
        jobDetails: nextLines.join("\n"),
        totalAmount: nextTotal > 0 ? nextTotal.toFixed(2) : "",
      };
    });
  }

  function loadDemoData() {
    setForm(DEMO_DATA);
    setResult(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (isSubmitting) return;

    if (!form.clientEmail && !form.clientPhone) {
      setResult({
        success: false,
        error: "Provide at least a customer email or phone number.",
      });
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    const response = await processReceiptAndNotify(form);

    setResult(response);
    setIsSubmitting(false);

    if (response.success) {
      setLastInvoice({ ...form, id: response.id, dateCreated: response.dateCreated });
      setForm(EMPTY_FORM);
      setRefreshKey((key) => key + 1);
    }
  }

  return (
    <div className="flex min-h-full flex-col lg:h-full lg:flex-row">
      <div className="no-scrollbar flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-3xl xl:max-w-4xl">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-bold text-slate-100">
                Auto Shop Invoicing CRM
              </h1>
              <p className="text-sm text-slate-500">Internal tool — front desk use only</p>
            </div>
            <span className="w-fit rounded-full bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300">
              {todayLabel}
            </span>
          </div>

          {isDemo && (
            <button
              type="button"
              onClick={loadDemoData}
              className="mb-6 w-full rounded-lg border border-dashed border-blue-500/40 bg-blue-500/10 px-4 py-2.5 text-sm font-semibold text-blue-400 transition hover:bg-blue-500/20"
            >
              ⚡ Load Demo Data
            </button>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-[280px_1fr]">
            {/* Vehicle preview card + full specs */}
            <div className="flex flex-col gap-4 self-start">
              <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-5">
                <div className="flex h-28 items-center justify-center rounded-xl bg-white/10 text-5xl">
                  🚗
                </div>
                <div>
                  <p className="text-xs font-medium text-blue-100">Vehicle</p>
                  <p className="text-base font-bold text-white">
                    {form.carDetails || "No vehicle info yet"}
                  </p>
                  {form.vin && <p className="mt-1 text-xs text-blue-100">VIN: {form.vin}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="mt-auto w-full rounded-lg bg-white/15 py-2 text-sm font-semibold text-white transition hover:bg-white/25"
                >
                  Scan VIN (optional)
                </button>
              </div>

              <VehicleSpecsCard vin={form.vin} vehicleDetails={form.vehicleDetails} />
            </div>

            {/* Details panel */}
            <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-800/40 p-5">
              <div>
                <label className={labelClass}>Customer Name</label>
                <input
                  type="text"
                  name="clientName"
                  value={form.clientName}
                  onChange={handleChange}
                  required
                  placeholder="John Doe"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    Email <span className="font-normal text-slate-500">(optional)</span>
                  </label>
                  <input
                    type="email"
                    name="clientEmail"
                    value={form.clientEmail}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Phone Number <span className="font-normal text-slate-500">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    name="clientPhone"
                    value={form.clientPhone}
                    onChange={handleChange}
                    placeholder="+15555550100"
                    className={inputClass}
                  />
                </div>
              </div>
              <p className="-mt-2 text-xs text-slate-500">
                Provide at least one of email or phone so the receipt has somewhere to go.
              </p>

              <div>
                <label className={labelClass}>Car Info (Year / Make / Model)</label>
                <input
                  type="text"
                  name="carDetails"
                  value={form.carDetails}
                  onChange={handleChange}
                  required
                  placeholder="2019 Toyota RAV4"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Mileage <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <input
                  type="text"
                  name="mileage"
                  value={form.mileage}
                  onChange={handleChange}
                  placeholder="42,300"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Job / Service Details</label>
                <div className="mb-2 rounded-lg border border-slate-800 bg-slate-900/60 p-2">
                  <div className="mb-2 flex items-center justify-between px-1 text-xs">
                    <span className="text-slate-500">Quick add services</span>
                    {pickedServices.length > 0 && (
                      <span className="font-medium text-blue-400">
                        {pickedServices.length} selected · {formatPrice(pickedTotal)}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-1.5">
                    {SERVICE_CATALOG.map((service) => {
                      const isPicked = pickedServices.includes(service);
                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => toggleService(service)}
                          aria-pressed={isPicked}
                          className={`flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-left text-xs transition ${
                            isPicked
                              ? "border-blue-500 bg-blue-600/20 text-blue-100"
                              : "border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800"
                          }`}
                        >
                          <span className="flex min-w-0 items-center gap-1.5">
                            <span
                              aria-hidden="true"
                              className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border text-[9px] leading-none ${
                                isPicked ? "border-blue-400 bg-blue-500 text-white" : "border-slate-600"
                              }`}
                            >
                              {isPicked ? "✓" : ""}
                            </span>
                            <span className="leading-snug">{service.name}</span>
                          </span>
                          <span className={`shrink-0 font-semibold ${isPicked ? "text-blue-200" : "text-green-400"}`}>
                            {formatPrice(service.price)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <textarea
                  name="jobDetails"
                  value={form.jobDetails}
                  onChange={handleChange}
                  required
                  rows={Math.max(3, pickedServices.length + 1)}
                  placeholder="Pick services above or type the job details here"
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className={labelClass}>Total Amount ($)</label>
                <input
                  type="number"
                  name="totalAmount"
                  value={form.totalAmount}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="420.00"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-900 p-1">
                  {["Cash", "Zelle"].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, paymentMethod: method }))}
                      className={`rounded-md py-2 text-sm font-semibold transition ${
                        form.paymentMethod === method
                          ? "bg-blue-600 text-white shadow"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-900"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sending Receipt...
                  </span>
                ) : (
                  "Generate & Send Paid Receipt"
                )}
              </button>

              {result?.success && (
                <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-400">
                  <p>
                    ✅ Receipt logged
                    {result.emailSent ? " and emailed to the customer." : "."}
                  </p>
                  {result.demoNotice && (
                    <p role="status" className="mt-1 text-xs font-medium text-amber-300">
                      {result.demoNotice}
                    </p>
                  )}
                  {lastInvoice && (
                    <button
                      ref={textInvoiceTriggerRef}
                      type="button"
                      onClick={() => setIsTextModalOpen(true)}
                      className="mt-2 w-full rounded-lg bg-slate-900/40 py-2 text-xs font-semibold text-green-300 transition hover:bg-slate-900/60"
                    >
                      💬 Text Invoice
                    </button>
                  )}
                </div>
              )}

              {result && !result.success && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400">
                  ❌ Failed to send receipt: {result.error}
                </div>
              )}
            </div>
          </form>
        </div>
      </div>

      <RecentReceiptsPanel refreshKey={refreshKey} />

      {isScannerOpen && (
        <VinScannerModal
          onVehicleFound={({ carDetails, vin, vehicleDetails }) => {
            setForm((prev) => ({ ...prev, carDetails, vin, vehicleDetails }));
            setIsScannerOpen(false);
          }}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

      {isTextModalOpen && lastInvoice && (
        <TextInvoiceModal
          invoice={lastInvoice}
          onClose={() => setIsTextModalOpen(false)}
          triggerRef={textInvoiceTriggerRef}
        />
      )}
    </div>
  );
}
