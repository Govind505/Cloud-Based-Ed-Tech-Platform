import * as crypto from 'crypto';

const ALGORITHM = 'aes-128-cbc';
const IV_LENGTH = 16;

export function encrypt(text: string, secretKey: string): string {
  if (!text) return '';
  const key = crypto.createHash('sha256').update(secretKey).digest().slice(0, 16);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(ciphertext: string, secretKey: string): string {
  if (!ciphertext) return '';
  try {
    const textParts = ciphertext.split(':');
    const iv = Buffer.from(textParts.shift() || '', 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const key = crypto.createHash('sha256').update(secretKey).digest().slice(0, 16);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText as any, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    return '[Decryption Error: Invalid Key or Corrupted Message]';
  }
}
