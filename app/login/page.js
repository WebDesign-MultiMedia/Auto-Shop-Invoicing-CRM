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
  const next = safeNextPath(searchParams?.next) || "";
  if (await readSession()) redirect(next || "/dashboard");

  const isDemo = isDemoMode();
  // Optional, demo only: publishable demo credentials shown to visitors.
  const demoHint = isDemo ? process.env.DEMO_LOGIN_HINT || "" : "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      {isDemo && <DemoBanner />}
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 text-xl">🔧</div>
          <div>
            <h1 className="text-lg font-bold text-slate-100">Auto Shop Invoicing CRM</h1>
            <p className="text-sm text-slate-500">Staff login</p>
          </div>
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
