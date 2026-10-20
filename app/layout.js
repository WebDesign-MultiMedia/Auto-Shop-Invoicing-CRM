import "./globals.css";

export const metadata = {
  title: "Auto Shop Invoicing CRM",
  description:
    "Client-owned invoicing and CRM for an auto repair shop — VIN scanning, PDF receipts via email/SMS, customer history, and a daily revenue dashboard.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-100">{children}</body>
    </html>
  );
}
