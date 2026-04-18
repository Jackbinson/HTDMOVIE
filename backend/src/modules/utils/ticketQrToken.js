const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const VERSION = 'v1';
const TOKEN_PREFIX = 'htdmovie-ticket';

const getSecretKey = () => {
  const secret =
    process.env.TICKET_QR_SECRET ||
    process.env.JWT_SECRET ||
    'htdmovie-default-ticket-secret';

  return crypto.createHash('sha256').update(secret).digest();
};

const toBase64Url = buffer =>
  Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const fromBase64Url = value => {
  const normalized = String(value)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const padding = normalized.length % 4;
  const padded = padding === 0 ? normalized : normalized + '='.repeat(4 - padding);
  return Buffer.from(padded, 'base64');
};

const encryptTicketQrPayload = ticketCode => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getSecretKey(), iv);
  const encrypted = Buffer.concat([cipher.update(ticketCode, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    TOKEN_PREFIX,
    VERSION,
    toBase64Url(iv),
    toBase64Url(authTag),
    toBase64Url(encrypted)
  ].join('.');
};

const decryptTicketQrPayload = payload => {
  const parts = String(payload || '').split('.');

  if (parts.length !== 5 || parts[0] !== TOKEN_PREFIX || parts[1] !== VERSION) {
    return null;
  }

  try {
    const iv = fromBase64Url(parts[2]);
    const authTag = fromBase64Url(parts[3]);
    const encrypted = fromBase64Url(parts[4]);
    const decipher = crypto.createDecipheriv(ALGORITHM, getSecretKey(), iv);

    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  } catch (error) {
    return null;
  }
};

const isEncryptedTicketQrPayload = value =>
  String(value || '').startsWith(`${TOKEN_PREFIX}.${VERSION}.`);

module.exports = {
  decryptTicketQrPayload,
  encryptTicketQrPayload,
  isEncryptedTicketQrPayload
};
