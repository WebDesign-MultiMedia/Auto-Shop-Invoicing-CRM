import { getPublicInvoiceByToken } from "../../lib/publicInvoice";
import { getVehicleSpecFields } from "../../lib/vehicleSpecFields";
import PrintButton from "./PrintButton";

export async function generateMetadata({ params }) {
  const { token } = await params;
  const result = await getPublicInvoiceByToken(token);
  const title = result.success ? `Invoice ${result.invoice.id}` : "Invoice";

  return {
    title,
    description: "View your paid invoice.",
    robots: { index: false, follow: false, nocache: true },
  };
}

function NotFoundCard({ message }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
        <p className="mb-2 text-lg font-semibold text-slate-900">Invoice Not Available</p>
        <p className="text-sm text-slate-600">{message}</p>
      </div>
    </main>
  );
}

export default async function PublicInvoicePage({ params }) {
  const { token } = await params;
  const result = await getPublicInvoiceByToken(token);

  if (!result.success) {
    return (
      <NotFoundCard message="This invoice link is no longer available. Please contact the sender for a new copy." />
    );
  }

  const invoice = result.invoice;
  const formattedDate = invoice.dateCreated
    ? new Date(invoice.dateCreated).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
    : "";

  const { specs, airbags } = getVehicleSpecFields(invoice.vehicleDetails);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
        <div className="flex items-center justify-between print:hidden">
          <h1 className="text-lg font-bold text-slate-900">Your Invoice</h1>
          <PrintButton />
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 print:shadow-none print:ring-0">
          <div className="bg-slate-900 px-6 py-5">
            <h2 className="text-lg font-bold text-white">Your Auto Shop Receipt</h2>
            <p className="mt-1 text-xs text-slate-400">Receipt #{invoice.id}</p>
          </div>

          <div className="bg-green-600 px-6 py-4 text-center">
            <p className="text-base font-extrabold tracking-wide text-white">
              TRANSACTION STATUS: PAID VIA {invoice.paymentMethod ? invoice.paymentMethod.toUpperCase() : "—"}
            </p>
          </div>

          <div className="p-6">
            <p className="mb-4 text-sm text-slate-700">
              Hi {invoice.clientName || "there"}, here is a summary of your service:
            </p>

            <table className="w-full text-sm text-slate-700">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="py-2 text-slate-500">Vehicle</td>
                  <td className="py-2 text-right font-semibold">{invoice.carDetails || "—"}</td>
                </tr>
                {invoice.mileage && (
                  <tr className="border-b border-slate-200">
                    <td className="py-2 text-slate-500">Mileage</td>
                    <td className="py-2 text-right font-semibold">{invoice.mileage}</td>
                  </tr>
                )}
                <tr className="border-b border-slate-200">
                  <td className="py-2 text-slate-500">Service Performed</td>
                  <td className="whitespace-pre-line py-2 text-right font-semibold">{invoice.jobDetails || "—"}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-2 text-slate-500">Payment Method</td>
                  <td className="py-2 text-right font-semibold">{invoice.paymentMethod || "—"}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-2 text-slate-500">Date</td>
                  <td className="py-2 text-right font-semibold">{formattedDate || "—"}</td>
                </tr>
                <tr>
                  <td className="pt-3 text-base font-extrabold text-slate-900">Total Paid</td>
                  <td className="pt-3 text-right text-xl font-extrabold text-green-600">
                    ${invoice.totalAmount || "0.00"}
                  </td>
                </tr>
              </tbody>
            </table>

            {invoice.vin && (
              <p className="mt-3 text-center text-xs text-slate-400">VIN: {invoice.vin}</p>
            )}
          </div>

          {(specs.length > 0 || airbags.length > 0) && (
            <div className="px-6 pb-6">
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <div className="bg-slate-50 px-4 py-2.5">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-900">
                    Full Vehicle Specifications
                  </p>
                </div>
                <div className="space-y-1 p-4 text-xs text-slate-700">
                  {specs.map(([label, value]) => (
                    <p key={label}>
                      <span className="text-slate-500">{label}:</span> {value}
                    </p>
                  ))}
                  {airbags.length > 0 && (
                    <div className="mt-3 border-t border-slate-200 pt-2">
                      <p className="mb-1 font-semibold text-slate-900">Airbags</p>
                      <ul className="list-disc space-y-0.5 pl-4">
                        {airbags.map(([label, value]) => (
                          <li key={label}>
                            <span className="text-slate-500">{label}:</span> {value}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-50 px-6 py-4 text-center">
            <p className="text-xs text-slate-400">
              Thank you for choosing our shop. This receipt confirms your balance is fully paid.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 print:hidden">
          This is a secure, read-only view of your invoice.
        </p>
      </div>
    </main>
  );
}
