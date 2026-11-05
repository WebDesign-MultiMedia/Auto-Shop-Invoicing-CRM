// Normalizes a staff login so "Owner@Shop.com " and "owner@shop.com" (or
// "(555) 010-0123" and "5550100123") match the same STAFF_ACCOUNTS entry.
// Returns null for anything that isn't an email or a 10-digit U.S. phone.
export function normalizeLogin(raw) {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value || value.length > 254) return null;

  if (value.includes("@")) {
    const email = value.toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
  }

  let digits = value.replace(/[\s().+-]/g, "");
  if (!/^\d+$/.test(digits)) return null;
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  return digits.length === 10 ? digits : null;
}
