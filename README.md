# Auto Shop Invoicing CRM

Client-owned invoicing and CRM for an auto repair shop — VIN scanning, PDF receipts via email/SMS, customer history, and a daily revenue dashboard.

**Live demo:** https://auto-shop-invoicing-crm.vercel.app

## Features

- **VIN scanning** - scan a VIN barcode with the device camera to fill in vehicle details and specs.
- **Receipt generation** - create paid receipts with customer, vehicle, mileage, service, and payment info.
- **PDF receipts by email/SMS** - receipts are emailed automatically, or shared by text as a secure link to a printable invoice page the customer can save as a PDF.
- **Receipt history** - every receipt is logged to SheetDB and browsable from the History page.
- **Returning-customer lookup** - search past receipts by customer name, car, or VIN.
- **Daily totals dashboard** - revenue, average ticket, payment methods, and service mix charts.
- **Demo data loader** - one click fills the form with sample data for testing and demos.

## Tech Stack

- React (Next.js)
- Tailwind CSS
- SheetDB
- Vercel

## Local Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Create a `.env.local` file in the project root with these variables:
   - `SHEETDB_API_URL`
   - `RESEND_API_KEY`
   - `INVOICE_SHARE_SECRET`
   - `NEXT_PUBLIC_APP_URL`
3. Start the dev server:
   ```
   npm run dev
   ```
   Then open http://localhost:3000.

## Why I Built It

I built this for a real auto repair shop client as a client-owned alternative to
subscription shop-management software. The shop keeps its own data and pays no
monthly subscription fees.

## Public Invoice Links and Manual SMS Sharing

Every invoice now has a secure, publicly accessible, read-only web page - and Twilio
is still not used anywhere. The application **does not automatically send SMS**.

### How it works

1. From the invoice form (after a successful receipt), the Recent Receipts panel, or
   the History list, click **Text Invoice**.
2. The app generates (or re-derives, if one already exists) a secure public link for
   that exact invoice and shows it in the modal, along with an editable message
   preview that includes the link.
3. **On iPhone**, the recommended option is **Share Invoice Link** - it hands the
   message and link directly to Messages (or Mail, WhatsApp, etc.) via the native
   share sheet, since a website can't reliably prefill the Messages text field on iOS.
   **Copy Message & Open Messages** is the fallback: it copies the complete message to
   the clipboard and opens Messages with the customer's number filled in, but you must
   paste the message yourself.
4. The employee reviews the message and **personally presses Send** in Messages (or
   confirms the share). The message is sent from the employee's own cellphone number
   and carrier plan - never from a shop-owned SMS number or third-party provider.
5. The customer taps the link and sees the complete invoice - vehicle info, service
   details, full pricing, payment status - on a public, read-only page they can print
   or save as a PDF via their browser's print dialog. No login required, and it works
   on a completely different device than the one that created the invoice.

Because the app has no way to detect whether the customer actually opened Messages,
pressed Send, or tapped the link, **nothing is ever marked "Sent" automatically**. A
separate "Mark as Sent" action would need to be explicitly triggered by staff if that
tracking is ever added.

### How the public links work (no database required)

The public URL is `/invoice/{token}`, where `{token}` is not a receipt number or any
other guessable identifier - it's an AES-256-GCM encrypted reference to the invoice,
generated and verified using a server-only secret (`INVOICE_SHARE_SECRET`). This means:

- The token reveals nothing about the invoice (no ID, customer name, or phone number
  is visible or derivable from it).
- No separate database or storage service is needed to track share links - the public
  page decrypts the token server-side to find the invoice, then reads it fresh from
  the existing SheetDB sheet, the same source of truth used everywhere else in the app.
- The same invoice always produces the same link (the encryption is deterministic per
  invoice), so clicking "Text Invoice" again re-uses the existing link instead of
  minting unlimited duplicates.

**Revoking a specific link isn't currently supported** - the tradeoff of not needing a
database. If a link needs to be invalidated, the only option is rotating
`INVOICE_SHARE_SECRET` (see below), which invalidates every previously issued link at
once, not just one. Per-invoice revoke could be added later with a small amount of
additional storage if it's ever needed.

### What's excluded from the public page

The public invoice page shows exactly what the emailed receipt already shows the
customer (vehicle, service, mileage, VIN, payment info, full vehicle specifications) -
nothing more. It never shows the customer's email or phone number as page content
(only used as delivery channels elsewhere in the app, not displayed here), dashboard
navigation, edit/delete controls, other customers' invoices, or any internal/database
metadata. The page also sends `noindex, nofollow` so it can never appear in search
results.

### Required environment variables

- `INVOICE_SHARE_SECRET` - a long random secret used to encrypt/decrypt share tokens.
  Generate one with:
  ```
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  This must stay identical across deploys - changing it invalidates every link ever
  issued.
- `NEXT_PUBLIC_APP_URL` - your production domain (e.g. `https://auto-shop-invoicing-crm.vercel.app`),
  with no trailing slash. Set this in Vercel's **Production** environment variables so
  generated links always use your real domain instead of a preview deployment's URL.
  If unset, links fall back to whatever host served the request.

Both must be added in Vercel's dashboard (Project → Settings → Environment Variables)
for production use, in addition to your local `.env.local`.
