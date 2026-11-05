import "server-only";

// Simple fixed-window, in-memory login rate limiter.
//
// LIMITS ON SERVERLESS (Vercel): each function instance has its own memory,
// and instances are created/recycled at any time. So the effective limit is
// "5 attempts per 15 minutes per instance", and a cold start resets it. It
// slows down casual guessing but is not a hard guarantee against a
// distributed attacker. For a hard limit, back this with a shared store
// (e.g. Upstash Redis / Vercel KV) or enable Vercel Firewall rate limiting
// on POST /login.

export const MAX_ATTEMPTS = 5;
export const WINDOW_MS = 15 * 60 * 1000;
const MAX_KEYS = 5000;

const buckets = new Map();

function prune(now) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  // Hard cap so a flood of unique keys can't grow memory without bound.
  while (buckets.size > MAX_KEYS) {
    buckets.delete(buckets.keys().next().value);
  }
}

// Returns true if this attempt is allowed (and counts it).
export function consumeAttempt(key, now = Date.now()) {
  if (buckets.size > MAX_KEYS / 2) prune(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (bucket.count >= MAX_ATTEMPTS) return false;
  bucket.count += 1;
  return true;
}

export function resetAttempts(key) {
  buckets.delete(key);
}
