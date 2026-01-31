import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Static salt for key derivation - using app identifier
// This is acceptable since the secret itself should be high-entropy
const SCRYPT_SALT = Buffer.from("novelworld-ai-key-encryption-v1", "utf-8");
const SCRYPT_COST = 16384; // N parameter (2^14)
const SCRYPT_BLOCK_SIZE = 8; // r parameter
const SCRYPT_PARALLELIZATION = 1; // p parameter

// Cache derived keys to avoid re-deriving on every encryption/decryption
let cachedScryptKey: Buffer | null = null;
let cachedLegacyKey: Buffer | null = null;
let cachedSecretHash: string | null = null;

function getSecret(): string {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "API_KEY_ENCRYPTION_SECRET must be at least 32 characters. " +
      "Generate one with: openssl rand -base64 32"
    );
  }

  return secret;
}

/**
 * Get encryption key using scrypt derivation (new method).
 * Used for all new encryptions.
 */
function getEncryptionKey(): Buffer {
  const secret = getSecret();
  const secretHash = Buffer.from(secret).toString("base64").slice(0, 16);

  if (cachedScryptKey && cachedSecretHash === secretHash) {
    return cachedScryptKey;
  }

  // Derive key using scrypt for proper key stretching
  cachedScryptKey = scryptSync(secret, SCRYPT_SALT, KEY_LENGTH, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELIZATION,
  });
  cachedSecretHash = secretHash;
  // Also cache legacy key for fallback decryption
  cachedLegacyKey = Buffer.from(secret.slice(0, KEY_LENGTH), "utf-8");

  return cachedScryptKey;
}

/**
 * Get legacy encryption key (raw bytes from secret).
 * Used for backward-compatible decryption of existing data.
 */
function getLegacyEncryptionKey(): Buffer {
  const secret = getSecret();
  const secretHash = Buffer.from(secret).toString("base64").slice(0, 16);

  if (cachedLegacyKey && cachedSecretHash === secretHash) {
    return cachedLegacyKey;
  }

  // Ensure scrypt key is also cached
  getEncryptionKey();
  return cachedLegacyKey!;
}

export interface EncryptedData {
  encrypted: string; // base64 encoded ciphertext + auth tag
  iv: string; // base64 encoded IV
}

export function encryptApiKey(apiKey: string): EncryptedData {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(apiKey, "utf-8", "base64");
  encrypted += cipher.final("base64");

  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([Buffer.from(encrypted, "base64"), authTag]);

  return {
    encrypted: combined.toString("base64"),
    iv: iv.toString("base64"),
  };
}

export function decryptApiKey(encryptedData: EncryptedData): string {
  const iv = Buffer.from(encryptedData.iv, "base64");
  const combined = Buffer.from(encryptedData.encrypted, "base64");
  const authTag = combined.slice(-AUTH_TAG_LENGTH);
  const ciphertext = combined.slice(0, -AUTH_TAG_LENGTH);

  // Try scrypt-derived key first (new method)
  try {
    const key = getEncryptionKey();
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString("utf-8");
  } catch {
    // Fall back to legacy key for backward compatibility
    const legacyKey = getLegacyEncryptionKey();
    const decipher = createDecipheriv(ALGORITHM, legacyKey, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString("utf-8");
  }
}

/**
 * Encrypt API key with IV embedded in the output (single string format).
 * Format: base64(IV + ciphertext + authTag)
 * Use this for per-provider keys where we want a single column.
 */
export function encryptApiKeyEmbedded(apiKey: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(apiKey, "utf-8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Combine: IV (16 bytes) + ciphertext + authTag (16 bytes)
  const combined = Buffer.concat([iv, encrypted, authTag]);
  return combined.toString("base64");
}

/**
 * Decrypt API key that has IV embedded (single string format).
 * Expects: base64(IV + ciphertext + authTag)
 * Tries scrypt-derived key first, falls back to legacy key for backward compatibility.
 */
export function decryptApiKeyEmbedded(encryptedValue: string): string {
  const combined = Buffer.from(encryptedValue, "base64");

  // Extract parts: IV (first 16 bytes), authTag (last 16 bytes), ciphertext (middle)
  const iv = combined.slice(0, IV_LENGTH);
  const authTag = combined.slice(-AUTH_TAG_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH, -AUTH_TAG_LENGTH);

  // Try scrypt-derived key first (new method)
  try {
    const key = getEncryptionKey();
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString("utf-8");
  } catch {
    // Fall back to legacy key for backward compatibility
    const legacyKey = getLegacyEncryptionKey();
    const decipher = createDecipheriv(ALGORITHM, legacyKey, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString("utf-8");
  }
}

export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) return "********";
  return apiKey.slice(0, 4) + "********" + apiKey.slice(-4);
}
