// Web app manifest: name, icon, and colors used when staff add the app to
// their phone's home screen. Served at /manifest.webmanifest.
export default function manifest() {
  return {
    name: "Auto Shop Invoicing CRM",
    short_name: "Auto Shop CRM",
    description: "Receipts, customers, and invoices for the shop.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
