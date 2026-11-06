// Common jobs shown as quick picks on the new-receipt form.
// Edit names and prices here to match the shop's rates.
export const SERVICE_CATALOG = [
  { id: "oil-conventional", name: "Oil Change (Conventional)", price: 49.99 },
  { id: "oil-synthetic", name: "Oil Change (Full Synthetic)", price: 79.99 },
  { id: "tire-rotation", name: "Tire Rotation", price: 29.99 },
  { id: "alignment", name: "Wheel Alignment", price: 99.99 },
  { id: "brakes-front", name: "Front Brake Pads", price: 189.99 },
  { id: "brakes-rear", name: "Rear Brake Pads", price: 179.99 },
  { id: "battery", name: "Battery Replacement", price: 189.99 },
  { id: "alternator", name: "Alternator Replacement", price: 399.99 },
  { id: "diagnostic", name: "Engine Diagnostic", price: 99.99 },
  { id: "spark-plugs", name: "Spark Plug Replacement", price: 149.99 },
  { id: "coolant", name: "Coolant Flush", price: 129.99 },
  { id: "transmission", name: "Transmission Fluid Service", price: 179.99 },
  { id: "ac-recharge", name: "A/C Recharge", price: 149.99 },
  { id: "air-filter", name: "Engine Air Filter", price: 39.99 },
];

export function formatPrice(price) {
  return `$${Number(price).toFixed(2)}`;
}

// The line written into the Job / Service Details box for a picked service.
export function serviceLine(service) {
  return `${service.name} - ${formatPrice(service.price)}`;
}
