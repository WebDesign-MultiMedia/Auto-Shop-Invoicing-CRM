import Sidebar from "../components/Sidebar";
import { DemoBanner, DemoModeProvider } from "../components/DemoMode";
import { requireStaff } from "../lib/auth";
import { isDemoMode } from "../lib/demoMode";

// Server-side session check for every staff page (in addition to
// middleware.js). Must never be statically prerendered.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }) {
  await requireStaff({ redirectToLogin: true });
  const isDemo = isDemoMode();

  return (
    <DemoModeProvider isDemo={isDemo}>
      {isDemo && <DemoBanner />}
      <div className={`flex min-h-screen flex-col bg-slate-900 lg:h-screen lg:flex-row ${isDemo ? "pt-6 lg:pt-0" : ""}`}>
        <Sidebar />
        <div className="flex-1 overflow-y-auto pb-20 lg:pb-0">{children}</div>
      </div>
    </DemoModeProvider>
  );
}
