import "server-only";

// In-memory store for invoices created in DEMO_MODE. Nothing is persisted:
// entries live only in this server instance's memory, are scoped to the
// visitor's login session (other visitors never see them), are capped, and
// expire. On serverless they may vanish sooner when an instance recycles -
// that's fine for a demo.

const MAX_PER_SESSION = 25;
const MAX_SESSIONS = 500;
const TTL_MS = 12 * 60 * 60 * 1000;

const sessions = new Map(); // sid -> { rows, expiresAt }

function prune(now = Date.now()) {
  for (const [sid, entry] of sessions) {
    if (entry.expiresAt <= now) sessions.delete(sid);
  }
  while (sessions.size > MAX_SESSIONS) {
    sessions.delete(sessions.keys().next().value);
  }
}

export function addDemoInvoice(sid, row) {
  if (!sid) return;
  prune();
  const entry = sessions.get(sid) || { rows: [], expiresAt: Date.now() + TTL_MS };
  entry.rows = [row, ...entry.rows].slice(0, MAX_PER_SESSION);
  sessions.set(sid, entry);
}

export function getDemoInvoicesForSession(sid) {
  const entry = sid ? sessions.get(sid) : null;
  if (!entry || entry.expiresAt <= Date.now()) return [];
  return entry.rows;
}

// Used by the public /invoice/[token] page (no session there). The token
// is unguessable, so looking up by ID across sessions is safe.
export function findDemoInvoiceById(id) {
  for (const entry of sessions.values()) {
    if (entry.expiresAt <= Date.now()) continue;
    const row = entry.rows.find((r) => r.id === id);
    if (row) return row;
  }
  return null;
}
