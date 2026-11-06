import "./globals.css";

export const metadata = {
  title: "Auto Shop Invoicing CRM",
  description:
    "Client-owned invoicing and CRM for an auto repair shop — VIN scanning, PDF receipts via email/SMS, customer history, and a daily revenue dashboard.",
  // Home-screen app on iPhone: name under the icon and a dark status bar.
  appleWebApp: {
    capable: true,
    title: "Auto Shop CRM",
    statusBarStyle: "black",
  },
};

export const viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
