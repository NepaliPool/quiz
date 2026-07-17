import { randomInt } from "node:crypto";

/** Unambiguous uppercase alphabet (no 0/O, 1/I/L). */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function buildAccessCodePrefix(slug: string) {
  const cleaned = slug
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);

  return cleaned || "CODE";
}

export function generateAccessCode(prefix: string) {
  let suffix = "";

  for (let index = 0; index < 10; index += 1) {
    suffix += ALPHABET[randomInt(ALPHABET.length)];
  }

  return `${prefix}-${suffix}`;
}

export function generateUniqueAccessCodes(prefix: string, quantity: number) {
  const codes = new Set<string>();

  while (codes.size < quantity) {
    codes.add(generateAccessCode(prefix));
  }

  return [...codes];
}

/** Treat YYYY-MM-DD as end of that UTC day. */
export function parseExpiresAtEndOfDay(value?: string | null) {
  if (!value) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
}
