// Safety check: a demo deployment must never be pointed at the shop's real
// data. Runs on `next build`, `next dev`, and `next start`, so a
// misconfigured demo fails immediately instead of serving real customers.
// (app/lib/demoMode.js repeats this check at request time.)
if (process.env.DEMO_MODE === "true" && process.env.SHEETDB_API_URL) {
  const message =
    "Refusing to start: DEMO_MODE=true but SHEETDB_API_URL is also set. " +
    "Remove SHEETDB_API_URL from the demo environment.";
  console.error(`[demo] ${message}`);
  throw new Error(message);
}

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // camera=(self) keeps the VIN scanner working; everything else is off.
    value: "camera=(self), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
