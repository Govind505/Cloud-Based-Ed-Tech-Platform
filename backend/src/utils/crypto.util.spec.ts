import { encrypt, decrypt } from './crypto.util';

describe('Crypto Utilities (AES-128)', () => {
  const secretKey = 'cloudedtechchat1';

  it('should encrypt a plaintext string into a colon-separated IV and ciphertext', () => {
    const rawText = 'Welcome to study group!';
    const encrypted = encrypt(rawText, secretKey);

    expect(encrypted).toBeDefined();
    expect(encrypted).toContain(':');
    expect(encrypted).not.toBe(rawText);
  });

  it('should decrypt a valid ciphertext back to the original plaintext', () => {
    const rawText = 'Quantum computing notes';
    const encrypted = encrypt(rawText, secretKey);
    const decrypted = decrypt(encrypted, secretKey);

    expect(decrypted).toBe(rawText);
  });

  it('should return decryption error message if key is invalid', () => {
    const rawText = 'Secret data';
    const encrypted = encrypt(rawText, secretKey);
    const decryptedWithBadKey = decrypt(encrypted, 'wrongsecretkey12');

    expect(decryptedWithBadKey).toBe('[Decryption Error: Invalid Key or Corrupted Message]');
  });

  it('should handle empty input strings gracefully', () => {
    expect(encrypt('', secretKey)).toBe('');
    expect(decrypt('', secretKey)).toBe('');
  });
});
