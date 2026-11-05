// Clearly fake sample data for DEMO_MODE. Every person here is fictional:
// phone numbers use the reserved 555-01xx range, emails use @example.com,
// and VINs are randomly generated (valid format, not real vehicles).
//
// Generated with a fixed seed, so IDs and contents are identical on every
// server instance (share links keep working). Dates are spread over the
// ~6 months before today so the D3 charts always look current.

const INVOICE_COUNT = 140;
const DAYS_BACK = 182;

const FIRST_NAMES = [
  "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Jamie", "Avery", "Quinn", "Reese",
  "Dana", "Robin", "Skyler", "Drew", "Parker", "Rowan", "Sam", "Charlie", "Emerson", "Finley",
];
const LAST_NAMES = [
  "Sample", "Example", "Demo", "Testwell", "Placeholder", "Fictional", "Mockford", "Specimen",
  "Prototype", "Sandbox", "Pretend", "Notreal",
];

const VEHICLES = [
  { car: "2018 Honda Civic", manufacturer: "HONDA", body: "Sedan/Saloon", cylinders: "4", displacement: "2.0", fuel: "Gasoline", drive: "FWD" },
  { car: "2020 Toyota Camry", manufacturer: "TOYOTA", body: "Sedan/Saloon", cylinders: "4", displacement: "2.5", fuel: "Gasoline", drive: "FWD" },
  { car: "2017 Ford F-150", manufacturer: "FORD", body: "Pickup", cylinders: "6", displacement: "3.5", fuel: "Gasoline", drive: "4WD" },
  { car: "2019 Chevrolet Equinox", manufacturer: "GENERAL MOTORS", body: "Sport Utility Vehicle (SUV)", cylinders: "4", displacement: "1.5", fuel: "Gasoline", drive: "AWD" },
  { car: "2016 Nissan Altima", manufacturer: "NISSAN", body: "Sedan/Saloon", cylinders: "4", displacement: "2.5", fuel: "Gasoline", drive: "FWD" },
  { car: "2021 Toyota RAV4", manufacturer: "TOYOTA", body: "Sport Utility Vehicle (SUV)", cylinders: "4", displacement: "2.5", fuel: "Gasoline", drive: "AWD" },
  { car: "2015 Jeep Wrangler", manufacturer: "FCA US LLC", body: "Sport Utility Vehicle (SUV)", cylinders: "6", displacement: "3.6", fuel: "Gasoline", drive: "4WD" },
  { car: "2019 Hyundai Elantra", manufacturer: "HYUNDAI", body: "Sedan/Saloon", cylinders: "4", displacement: "2.0", fuel: "Gasoline", drive: "FWD" },
  { car: "2018 Subaru Outback", manufacturer: "SUBARU", body: "Wagon", cylinders: "4", displacement: "2.5", fuel: "Gasoline", drive: "AWD" },
  { car: "2022 Tesla Model 3", manufacturer: "TESLA", body: "Sedan/Saloon", cylinders: "", displacement: "", fuel: "Electric", drive: "RWD" },
];

// [service, min price, max price, relative frequency]
const SERVICES = [
  ["Oil Change & Filter", 45, 95, 10],
  ["Brake Pads Replacement", 180, 380, 6],
  ["Tire Rotation & Balance", 40, 90, 6],
  ["Battery Replacement", 140, 260, 4],
  ["Check Engine Diagnostic", 90, 160, 5],
  ["Alternator Replacement", 380, 720, 2],
  ["A/C Recharge", 120, 240, 3],
  ["Transmission Fluid Service", 150, 280, 2],
  ["Spark Plugs Replacement", 160, 340, 2],
  ["Suspension / Strut Repair", 450, 1100, 1],
];

// Deterministic PRNG (mulberry32).
function createRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

function pickWeighted(rng, list) {
  const total = list.reduce((sum, item) => sum + item[3], 0);
  let r = rng() * total;
  for (const item of list) {
    r -= item[3];
    if (r <= 0) return item;
  }
  return list[list.length - 1];
}

const VIN_CHARS = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789";
const VIN_VALUES = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9, S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9 };
const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

// Random 17-character VIN with a correct check digit (position 9).
function fakeVin(rng) {
  const chars = Array.from({ length: 17 }, () => pick(rng, VIN_CHARS));
  chars[8] = "0";
  const sum = chars.reduce((acc, ch, i) => {
    const value = /\d/.test(ch) ? Number(ch) : VIN_VALUES[ch];
    return acc + value * VIN_WEIGHTS[i];
  }, 0);
  const check = sum % 11;
  chars[8] = check === 10 ? "X" : String(check);
  return chars.join("");
}

function money(rng, min, max) {
  // Round to a realistic $5 increment.
  return (Math.round((min + rng() * (max - min)) / 5) * 5).toFixed(2);
}

function buildCustomers(rng) {
  const customers = [];
  for (let i = 0; i < 48; i++) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[(i * 7) % LAST_NAMES.length];
    const vehicle = pick(rng, VEHICLES);
    customers.push({
      clientName: `${first} ${last}`,
      clientPhone: `+1212555${String(100 + (i % 100)).padStart(4, "0")}`, // 555-0100..0199 (reserved fictional)
      clientEmail: rng() < 0.85 ? `${first}.${last}${i}@example.com`.toLowerCase() : "",
      vehicle,
      vin: rng() < 0.6 ? fakeVin(rng) : "",
    });
  }
  return customers;
}

function vehicleSpecs(vehicle) {
  return JSON.stringify({
    manufacturer: vehicle.manufacturer,
    bodyClass: vehicle.body,
    driveType: vehicle.drive,
    cylinders: vehicle.cylinders,
    displacement: vehicle.displacement,
    primaryFuel: vehicle.fuel,
  });
}

function generate() {
  const rng = createRng(20260705);
  const customers = buildCustomers(rng);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows = [];
  for (let i = 0; i < INVOICE_COUNT; i++) {
    // Skew toward recent dates slightly so the trend lines show growth.
    const daysAgo = Math.floor(Math.pow(rng(), 1.15) * DAYS_BACK);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(8 + Math.floor(rng() * 10), Math.floor(rng() * 60));

    const customer = pick(rng, customers);
    const [service, min, max] = pickWeighted(rng, SERVICES);

    rows.push({
      id: `RCT-DEMO-${String(i + 1).padStart(4, "0")}`,
      clientName: customer.clientName,
      clientPhone: customer.clientPhone,
      clientEmail: customer.clientEmail,
      carDetails: customer.vehicle.car,
      vin: customer.vin,
      vehicleSpecifications: customer.vin ? vehicleSpecs(customer.vehicle) : "",
      mileage: String(Math.floor(15 + rng() * 120) * 1000).replace(/\B(?=(\d{3})+(?!\d))/g, ","),
      jobDetails: service,
      totalAmount: money(rng, min, max),
      paymentMethod: rng() < 0.55 ? "Zelle" : "Cash",
      paymentStatus: "PAID",
      dateCreated: date.toISOString(),
    });
  }
  return rows;
}

let cached;
export function getDemoInvoices() {
  cached ||= generate();
  return cached;
}
