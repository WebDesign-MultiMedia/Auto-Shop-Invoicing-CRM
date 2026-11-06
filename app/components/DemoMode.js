"use client";

import { createContext, useContext } from "react";

const DemoModeContext = createContext(false);

export function DemoModeProvider({ isDemo, children }) {
  return <DemoModeContext.Provider value={!!isDemo}>{children}</DemoModeContext.Provider>;
}

export function useDemoMode() {
  return useContext(DemoModeContext);
}

export function DemoBanner() {
  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 top-0 z-30 bg-amber-400 py-1 text-center text-xs font-bold text-slate-950 lg:inset-x-auto lg:right-3 lg:top-3 lg:rounded-full lg:px-3 lg:shadow"
    >
      Demo - sample data
    </div>
  );
}
