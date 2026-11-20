import crypto from 'node:crypto';

/** Code TOTP (RFC 6238, 6 chiffres, 30 s) : ce que calcule l'application d'authentification. */
export function totp(secret: string, now = Date.now()): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const c of secret.replace(/=+$/, '').toUpperCase()) {
    const v = alphabet.indexOf(c);
    if (v >= 0) bits += v.toString(2).padStart(5, '0');
  }
  const bytes = Buffer.from((bits.match(/.{8}/g) ?? []).map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeUInt32BE(Math.floor(now / 1000 / 30), 4);
  const hash = crypto.createHmac('sha1', bytes).update(counter).digest();
  const offset = hash[hash.length - 1] & 0x0f;
  const num = (hash.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return String(num).padStart(6, '0');
}
