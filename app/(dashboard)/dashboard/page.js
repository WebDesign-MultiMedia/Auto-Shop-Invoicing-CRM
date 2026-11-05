import {
  fetchInvoices,
  aggregateRevenueByWeek,
  aggregateByServiceType,
  aggregateByPaymentMethod,
  aggregateAvgTicketByWeek,
} from "../../lib/dashboardData";
import { requireStaff } from "../../lib/auth";
import { isDemoMode } from "../../lib/demoMode";
import RevenueLineChart from "../../components/charts/RevenueLineChart";
import ServiceTypeChart from "../../components/charts/ServiceTypeChart";
import PaymentMethodDonut from "../../components/charts/PaymentMethodDonut";
import AvgTicketTrendChart from "../../components/charts/AvgTicketTrendChart";

export const dynamic = "force-dynamic";

const cardClass = "rounded-2xl border border-slate-800 bg-slate-800/40 p-5";

export default async function DashboardPage() {
  const session = await requireStaff({ redirectToLogin: true });
  const invoices = await fetchInvoices({ sid: session.sid });

  const revenueByWeek = aggregateRevenueByWeek(invoices);
  const byServiceType = aggregateByServiceType(invoices);
  const byPaymentMethod = aggregateByPaymentMethod(invoices);
  const avgTicketByWeek = aggregateAvgTicketByWeek(invoices);

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-slate-100">Operations Dashboard</h1>
        <p className="text-sm text-slate-500">
          {invoices.length} invoice{invoices.length === 1 ? "" : "s"} {isDemoMode() ? "(sample data)" : "logged to SheetDB"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={cardClass}>
          <h2 className="text-sm font-semibold text-slate-200">Revenue by Week</h2>
          <p className="mb-4 mt-0.5 text-xs text-slate-500">
            Total dollars invoiced per week — use this to spot busy vs. slow weeks and track growth over time.
          </p>
          <RevenueLineChart data={revenueByWeek} />
        </div>

        <div className={cardClass}>
          <h2 className="text-sm font-semibold text-slate-200">Revenue by Service Type</h2>
          <p className="mb-4 mt-0.5 text-xs text-slate-500">
            Which jobs bring in the most money — use this to see what services drive revenue so you know what to focus on.
          </p>
          <ServiceTypeChart data={byServiceType} />
        </div>

        <div className={cardClass}>
          <h2 className="text-sm font-semibold text-slate-200">Invoices by Payment Method</h2>
          <p className="mb-4 mt-0.5 text-xs text-slate-500">
            Split of paid invoices by how customers pay — use this to see the Cash vs. Zelle mix at a glance.
          </p>
          <PaymentMethodDonut data={byPaymentMethod} />
        </div>

        <div className={cardClass}>
          <h2 className="text-sm font-semibold text-slate-200">Average Ticket by Week</h2>
          <p className="mb-4 mt-0.5 text-xs text-slate-500">
            Average invoice amount per week — use this to see if you're trending toward bigger or smaller jobs over time.
          </p>
          <AvgTicketTrendChart data={avgTicketByWeek} />
        </div>
      </div>
    </div>
  );
}
