import crypto from 'crypto';

const DEFAULT_SESSION_SECRET = 'c8d9e7a6b5f41324567890abcdef1234567890abcdef1234567890abcdef1234';
const DEFAULT_PASSPHRASES = ['klasik2026', 'kllasik2026'];

export function getAdminSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (secret && secret.trim()) {
    return secret.trim();
  }
  return DEFAULT_SESSION_SECRET;
}

export function getAdminPassphrase() {
  const passphrase = process.env.ADMIN_PASSPHRASE;
  if (passphrase && passphrase.trim()) {
    return passphrase.trim();
  }
  return DEFAULT_PASSPHRASES[0];
}

export function verifyAdminPassphrase(input) {
  if (!input || typeof input !== 'string') return false;
  const configured = getAdminPassphrase();
  const trimmed = input.trim();
  return trimmed === configured || DEFAULT_PASSPHRASES.includes(trimmed);
}

export function createAdminSessionToken() {
  const secret = getAdminSessionSecret();
  const payload = JSON.stringify({
    role: 'admin',
    iat: Date.now(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  const base64Payload = Buffer.from(payload, 'utf8').toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(base64Payload).digest('base64url');
  return `${base64Payload}.${signature}`;
}

export function verifyAdminSessionToken(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [base64Payload, signature] = parts;

  try {
    const secret = getAdminSessionSecret();
    const expectedSignature = crypto.createHmac('sha256', secret).update(base64Payload).digest('base64url');

    const sigBuf = Buffer.from(signature, 'utf8');
    const expBuf = Buffer.from(expectedSignature, 'utf8');

    if (sigBuf.length !== expBuf.length) return false;
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return false;

    const payloadJson = Buffer.from(base64Payload, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson);

    if (payload.role !== 'admin') return false;
    if (typeof payload.exp === 'number' && Date.now() > payload.exp) return false;

    return true;
  } catch {
    return false;
  }
}
