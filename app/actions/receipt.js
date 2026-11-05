"use server";

import { requireStaff } from "../lib/auth";
import { appendReceipt } from "../lib/data";
import { isDemoMode } from "../lib/demoMode";

// Every value placed into the email HTML goes through this, so form input
// like "<a href=...>" shows up as text instead of becoming live markup.
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function detailRow(label, value) {
  if (!value) return "";
  return `<tr>
              <td colspan="2" style="padding: 6px 0; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: 13px;">
                <span style="color: #64748b;">${label}:</span> <strong>${escapeHtml(value)}</strong>
              </td>
            </tr>`;
}

function detailPairRow(label1, value1, label2, value2) {
  if (!value1 && !value2) return "";
  return `<tr>
              <td style="padding: 6px 8px 6px 0; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: 13px; width: 50%;">
                <span style="color: #64748b;">${label1}:</span> ${value1 ? `<strong>${escapeHtml(value1)}</strong>` : ""}
              </td>
              <td style="padding: 6px 0 6px 8px; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: 13px; width: 50%;">
                <span style="color: #64748b;">${label2}:</span> ${value2 ? `<strong>${escapeHtml(value2)}</strong>` : ""}
              </td>
            </tr>`;
}

function airbagSection(pairs) {
  const items = pairs.filter(([, value]) => value);
  if (items.length === 0) return "";
  const listItems = items
    .map(
      ([label, value]) =>
        `<li style="padding: 2px 0;"><span style="color: #64748b;">${label}:</span> ${escapeHtml(value)}</li>`
    )
    .join("");
  return `<tr>
              <td colspan="2" style="padding: 10px 0 0;">
                <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; color: #0f172a;">Airbags</p>
                <ul style="margin: 0; padding-left: 18px; color: #334155; font-size: 13px;">
                  ${listItems}
                </ul>
              </td>
            </tr>`;
}

function buildReceiptEmailHtml({
  clientName,
  carDetails,
  vin,
  vehicleDetails,
  mileage,
  jobDetails,
  totalAmount,
  paymentMethod,
  id,
  dateCreated,
}) {
  const formattedDate = new Date(dateCreated).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const vd = vehicleDetails || {};
  const plantLocation = [vd.plantCity, vd.plantState, vd.plantCountry].filter(Boolean).join(", ");

  const specRows = [
    detailRow("Manufacturer", vd.manufacturer),
    detailRow("Vehicle Type", vd.vehicleType),
    detailRow("Body Class", vd.bodyClass),
    detailPairRow("Series", vd.series, "Trim", vd.trim),
    detailPairRow("GVWR", vd.gvwr, "Drive Type", vd.driveType),
    detailPairRow("Cylinders", vd.cylinders, "Primary Fuel Type", vd.primaryFuel),
    detailPairRow("Electrification Level", vd.electrificationLevel, "Secondary Fuel Type", vd.secondaryFuel),
    detailPairRow("Engine Model", vd.engineModel, "Engine Brake (HP)", vd.engineHp),
    detailPairRow("Engine Manufacturer", vd.engineManufacturer, "Displacement (L)", vd.displacement),
    detailPairRow("Transmission Speeds", vd.transmissionSpeeds, "Transmission Style", vd.transmissionStyle),
    detailRow("Plant Location", plantLocation),
    airbagSection([
      ["Front", vd.airbagFront],
      ["Knee", vd.airbagKnee],
      ["Side", vd.airbagSide],
      ["Curtain", vd.airbagCurtain],
      ["Seat Cushion", vd.airbagSeatCushion],
      ["Other Restraint Info", vd.otherRestraintInfo],
    ]),
  ].join("");

  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f1f5f9; padding: 24px 0; margin: 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <tr>
        <td style="background-color: #0f172a; padding: 20px 24px;">
          <p style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 700;">Your Auto Shop Receipt</p>
          <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13px;">Receipt #${escapeHtml(id)}</p>
        </td>
      </tr>
      <tr>
        <td style="background-color: #16a34a; padding: 16px 24px; text-align: center;">
          <p style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 800; letter-spacing: 0.5px;">
            TRANSACTION STATUS: PAID VIA ${escapeHtml(String(paymentMethod ?? "").toUpperCase())}
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding: 24px;">
          <p style="margin: 0 0 16px; color: #334155; font-size: 15px;">Hi ${escapeHtml(clientName)}, thank you for your visit! Here is a summary of your service:</p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px; color: #334155;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Vehicle</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${escapeHtml(carDetails)}</td>
            </tr>
            ${
              mileage
                ? `<tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Mileage</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${escapeHtml(mileage)}</td>
            </tr>`
                : ""
            }
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Service Performed</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${escapeHtml(jobDetails)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Payment Method</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${escapeHtml(paymentMethod)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Date</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${escapeHtml(formattedDate)}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0 0; color: #0f172a; font-size: 16px; font-weight: 800;">Total Paid</td>
              <td style="padding: 12px 0 0; text-align: right; color: #16a34a; font-size: 20px; font-weight: 800;">$${escapeHtml(totalAmount)}</td>
            </tr>
            ${
              vin
                ? `<tr>
              <td colspan="2" style="padding: 10px 0 0; color: #94a3b8; font-size: 12px; text-align: center;">VIN: ${escapeHtml(vin)}</td>
            </tr>`
                : ""
            }
          </table>
        </td>
      </tr>
      ${
        specRows
          ? `<tr>
        <td style="padding: 0 24px 24px;">
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #f1f5f9; padding: 10px 16px;">
              <p style="margin: 0; font-size: 12px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">Full Vehicle Specifications</p>
            </div>
            <div style="padding: 4px 16px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${specRows}
              </table>
            </div>
          </div>
        </td>
      </tr>`
          : ""
      }
      <tr>
        <td style="background-color: #f8fafc; padding: 16px 24px; text-align: center;">
          <p style="margin: 0; color: #94a3b8; font-size: 12px;">Thank you for choosing our shop. This receipt confirms your balance is fully paid.</p>
        </td>
      </tr>
    </table>
  </div>
  `;
}

export async function processReceiptAndNotify(receiptData) {
  // Outside the try: an unauthenticated call must fail, not be swallowed.
  const session = await requireStaff();

  try {
    const {
      clientName,
      clientPhone,
      clientEmail,
      carDetails,
      vin,
      vehicleDetails,
      mileage,
      jobDetails,
      totalAmount,
      paymentMethod,
    } = receiptData;

    const id = `RCT-${Date.now()}`;
    const dateCreated = new Date().toISOString();

    if (!clientEmail && !clientPhone) {
      throw new Error("Provide at least a customer email or phone number to send the receipt.");
    }

    const row = {
      id,
      clientName,
      clientPhone,
      clientEmail,
      carDetails,
      vin: vin || "",
      vehicleSpecifications: vehicleDetails ? JSON.stringify(vehicleDetails) : "",
      mileage,
      jobDetails,
      totalAmount,
      paymentMethod,
      paymentStatus: "PAID",
      dateCreated,
    };

    // --- Demo mode: keep the invoice in memory for this session only. ---
    // Nothing is sent to SheetDB or Resend.
    if (isDemoMode()) {
      await appendReceipt(row, { sid: session.sid });
      return {
        success: true,
        emailSent: false,
        demoNotice: clientEmail ? "Demo mode: email not sent." : null,
        id,
        dateCreated,
      };
    }

    const missingCoreVars = ["SHEETDB_API_URL"].filter((key) => !process.env[key]);
    if (clientEmail && !process.env.RESEND_API_KEY) {
      missingCoreVars.push("RESEND_API_KEY");
    }
    if (missingCoreVars.length > 0) {
      throw new Error(
        `Missing required environment variable(s) on this deployment: ${missingCoreVars.join(", ")}`
      );
    }

    // --- Step A: Bookkeeping (SheetDB) ---
    // Logging is the source of truth for accounting, so a failure here halts
    // the entire flow before any customer communication is sent.
    await appendReceipt(row);

    let emailSent = false;

    // --- Step B: Email Dispatch (Resend) ---
    if (clientEmail) {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Receipts <receipts@buffetluciasfiestamexicana.com>",
          to: clientEmail,
          subject: `Paid Receipt - ${carDetails}`,
          html: buildReceiptEmailHtml({
            clientName,
            carDetails,
            vin,
            vehicleDetails,
            mileage,
            jobDetails,
            totalAmount,
            paymentMethod,
            id,
            dateCreated,
          }),
        }),
      });

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        throw new Error(`Email dispatch failed (${emailResponse.status}): ${errorText}`);
      }
      emailSent = true;
    }

    // SMS is sent manually by shop staff via their own Messages app (see the
    // "Text Invoice" feature) - no automatic SMS dispatch happens here.

    return { success: true, emailSent, id, dateCreated };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
