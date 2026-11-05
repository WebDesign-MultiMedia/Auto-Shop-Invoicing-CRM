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
      className="pointer-events-none fixed right-3 top-3 z-30 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-slate-950 shadow"
    >
      Demo - sample data
    </div>
  );
}
