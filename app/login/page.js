import { redirect } from "next/navigation";
import { readSession } from "../lib/auth";
import { isDemoMode } from "../lib/demoMode";
import { safeNextPath } from "../lib/routeRules";
import { DemoBanner } from "../components/DemoMode";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "Staff Login - Auto Shop Invoicing CRM",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }) {
  const next = safeNextPath((await searchParams)?.next) || "";
  if (await readSession()) redirect(next || "/");

  const isDemo = isDemoMode();
  // Optional, demo only: publishable demo credentials shown to visitors.
  const demoHint = isDemo ? process.env.DEMO_LOGIN_HINT || "" : "";

  return (
    <main className={`dark-surface flex h-dvh items-center justify-center overflow-hidden overscroll-none bg-slate-900 p-4 ${isDemoMode() ? "pt-10 lg:pt-4" : ""}`}>
      {isDemo && <DemoBanner />}
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
            <CarIcon className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100">Auto Shop Invoicing CRM</h1>
            <p className="text-sm text-slate-500">Staff login</p>
          </div>
          <ul className="mt-1 flex items-center justify-center gap-2 text-xs text-slate-400">
            <li className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-800/60 px-2.5 py-1">
              <WrenchIcon className="h-3.5 w-3.5 text-blue-400" />
              Repairs
            </li>
            <li className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-800/60 px-2.5 py-1">
              <UsersIcon className="h-3.5 w-3.5 text-blue-400" />
              Customers
            </li>
            <li className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-800/60 px-2.5 py-1">
              <InvoiceIcon className="h-3.5 w-3.5 text-blue-400" />
              Invoices
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-5">
          <LoginForm next={next} />
        </div>

        {demoHint && (
          <p className="mt-4 rounded-lg border border-dashed border-blue-500/40 bg-blue-500/10 px-4 py-2.5 text-center text-xs text-blue-300">
            {demoHint}
          </p>
        )}
      </div>
    </main>
  );
}

function Icon({ className, children }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function CarIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="M5 17H3v-5l2-5h14l2 5v5h-2" />
      <path d="M3 12h18" />
      <circle cx="7.5" cy="17" r="2" />
      <circle cx="16.5" cy="17" r="2" />
      <path d="M9.5 17h5" />
    </Icon>
  );
}

function WrenchIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </Icon>
  );
}

function UsersIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Icon>
  );
}

function InvoiceIcon({ className }) {
  return (
    <Icon className={className}>
      <path d="M4 2v20l3-2 3 2 2-2 2 2 3-2 3 2V2l-3 2-3-2-2 2-2-2-3 2-3-2z" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </Icon>
  );
}
