import { BadRequestException } from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const IV_LENGTH = 16;

export interface PaymentRedirectTokenPayload {
  bookingId: number;
  paymentId: number;
  status: number;
}

export function encryptObject(
  value: PaymentRedirectTokenPayload,
  secret: string,
): string {
  if (!secret) {
    throw new BadRequestException('Missing payment token secret');
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-cbc', createKey(secret), iv);
  const plaintext = JSON.stringify(value);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  return `${toBase64Url(iv)}:${toBase64Url(encrypted)}`;
}

export function decryptObject(
  token: string,
  secret: string,
): PaymentRedirectTokenPayload {
  if (!secret) {
    throw new BadRequestException('Missing payment token secret');
  }

  const [ivPart, encryptedPart] = token.split(':');

  if (!ivPart || !encryptedPart) {
    throw new BadRequestException('Invalid payment token');
  }

  try {
    const decipher = createDecipheriv(
      'aes-256-cbc',
      createKey(secret),
      fromBase64Url(ivPart),
    );
    const decrypted = Buffer.concat([
      decipher.update(fromBase64Url(encryptedPart)),
      decipher.final(),
    ]);
    const parsed = JSON.parse(decrypted.toString('utf8')) as unknown;

    return assertPaymentTokenPayload(parsed);
  } catch {
    throw new BadRequestException('Invalid payment token');
  }
}

function createKey(secret: string): Buffer {
  return createHash('sha256').update(secret).digest();
}

function toBase64Url(value: Buffer): string {
  return value
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(value: string): Buffer {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4);

  return Buffer.from(`${normalized}${padding}`, 'base64');
}

function assertPaymentTokenPayload(value: unknown): PaymentRedirectTokenPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException('Invalid payment token payload');
  }

  const payload = value as Record<string, unknown>;
  const bookingId = Number(payload.bookingId);
  const paymentId = Number(payload.paymentId);
  const status = Number(payload.status);

  if (
    !Number.isInteger(bookingId) ||
    bookingId <= 0 ||
    !Number.isInteger(paymentId) ||
    paymentId <= 0 ||
    !Number.isInteger(status)
  ) {
    throw new BadRequestException('Invalid payment token payload');
  }

  return { bookingId, paymentId, status };
}
