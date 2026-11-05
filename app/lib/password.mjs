// Password hashing shared by the app (app/lib/auth.js) and the CLI
// (scripts/hash-password.js). Plain ESM with only Node built-ins, so both
// Next.js and a bare `node` script can import it.
//
// Stored format: "<salt hex>:<scrypt hash hex>"

import crypto from "node:crypto";

const SALT_BYTES = 16;
const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

function scrypt(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, KEY_LENGTH, SCRYPT_OPTIONS, (err, key) =>
      err ? reject(err) : resolve(key)
    );
  });
}

export async function hashPassword(password) {
  if (typeof password !== "string" || password.length === 0) {
    throw new Error("Password must be a non-empty string.");
  }
  const salt = crypto.randomBytes(SALT_BYTES);
  const hash = await scrypt(password, salt);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

function parseStored(stored) {
  if (typeof stored !== "string") return null;
  const parts = stored.split(":");
  if (parts.length !== 2) return null;
  const [saltHex, hashHex] = parts;
  if (!/^[0-9a-f]+$/i.test(saltHex) || !/^[0-9a-f]+$/i.test(hashHex)) return null;
  if (saltHex.length < 16 || hashHex.length !== KEY_LENGTH * 2) return null;
  return { salt: Buffer.from(saltHex, "hex"), hash: Buffer.from(hashHex, "hex") };
}

export function isWellFormedHash(stored) {
  return parseStored(stored) !== null;
}

// Returns true only for a correct password against a well-formed hash.
// Malformed input returns false (never throws).
export async function verifyPassword(password, stored) {
  if (typeof password !== "string") return false;
  const parsed = parseStored(stored);
  if (!parsed) return false;
  try {
    const candidate = await scrypt(password, parsed.salt);
    return crypto.timingSafeEqual(candidate, parsed.hash);
  } catch {
    return false;
  }
}
