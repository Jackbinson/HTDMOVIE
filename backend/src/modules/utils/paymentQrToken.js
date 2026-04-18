const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const VERSION = 'V1';
const TOKEN_PREFIX = 'HTDPAY';

const getSecretKey = () => {
  const secret =
    process.env.PAYMENT_QR_SECRET ||
    process.env.TICKET_QR_SECRET ||
    process.env.JWT_SECRET ||
    'htdmovie-default-payment-secret';

  return crypto.createHash('sha256').update(secret).digest();
};

const normalizeHex = value => String(value || '').trim().toLowerCase();

const encryptPaymentQrPayload = bookingId => {
  const payload = JSON.stringify({
    bookingId: Number(bookingId)
  });
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getSecretKey(), iv);
  const encrypted = Buffer.concat([cipher.update(payload, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    TOKEN_PREFIX,
    VERSION,
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted.toString('hex')
  ].join('.');
};

const isEncryptedPaymentQrPayload = value =>
  String(value || '')
    .trim()
    .toUpperCase()
    .startsWith(`${TOKEN_PREFIX}.${VERSION}.`);

const decryptPaymentQrPayload = payload => {
  const parts = String(payload || '').trim().split('.');

  if (parts.length !== 5) {
    return null;
  }

  const [prefix, version, ivHex, authTagHex, encryptedHex] = parts;

  if (prefix.toUpperCase() !== TOKEN_PREFIX || version.toUpperCase() !== VERSION) {
    return null;
  }

  try {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      getSecretKey(),
      Buffer.from(normalizeHex(ivHex), 'hex')
    );

    decipher.setAuthTag(Buffer.from(normalizeHex(authTagHex), 'hex'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(normalizeHex(encryptedHex), 'hex')),
      decipher.final()
    ]).toString('utf8');

    const parsed = JSON.parse(decrypted);
    const bookingId = Number(parsed?.bookingId);

    return Number.isInteger(bookingId) && bookingId > 0 ? bookingId : null;
  } catch (error) {
    return null;
  }
};

module.exports = {
  decryptPaymentQrPayload,
  encryptPaymentQrPayload,
  isEncryptedPaymentQrPayload
};
