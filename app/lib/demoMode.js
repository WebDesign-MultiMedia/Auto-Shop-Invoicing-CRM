// DEMO_MODE=true serves fake data only and never touches SheetDB or Resend.
// (next.config.js repeats the safety check below so a misconfigured demo
// deployment fails at build/start, not just at first request.)

export function isDemoMode() {
  return process.env.DEMO_MODE === "true";
}

export function assertDemoConfigSafe() {
  if (isDemoMode() && process.env.SHEETDB_API_URL) {
    const message =
      "Refusing to run: DEMO_MODE=true but SHEETDB_API_URL is also set. " +
      "The demo deployment must never point at real shop data. Remove SHEETDB_API_URL from this environment.";
    console.error(`[demo] ${message}`);
    throw new Error(message);
  }
}
