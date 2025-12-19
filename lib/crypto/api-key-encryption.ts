/**
 * API Key Encryption Utility
 *
 * Uses AES-GCM encryption via Web Crypto API (Edge-compatible).
 * Keys are encrypted with a derived key from ENCRYPTION_MASTER_KEY + userId.
 */

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12 // 96 bits for GCM
const SALT_LENGTH = 16

/**
 * Derive an encryption key from the master key and user ID
 */
async function deriveKey(userId: string): Promise<CryptoKey> {
  const masterKey = process.env.ENCRYPTION_MASTER_KEY
  if (!masterKey) {
    throw new Error('ENCRYPTION_MASTER_KEY environment variable is not set')
  }

  // Import master key as raw key material
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(masterKey),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  // Derive a unique key for this user using PBKDF2
  const salt = encoder.encode(`roleplai-${userId}`)
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt an API key for storage
 *
 * @param plaintext - The raw API key to encrypt
 * @param userId - The user ID (used to derive a unique encryption key)
 * @returns Base64-encoded ciphertext (format: iv:ciphertext)
 */
export async function encryptApiKey(plaintext: string, userId: string): Promise<string> {
  const key = await deriveKey(userId)
  const encoder = new TextEncoder()

  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))

  // Encrypt the plaintext
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoder.encode(plaintext)
  )

  // Combine IV and ciphertext, encode as base64
  const combined = new Uint8Array(iv.length + ciphertext.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), iv.length)

  return btoa(String.fromCharCode(...combined))
}

/**
 * Decrypt a stored API key
 *
 * @param ciphertext - Base64-encoded ciphertext from encryptApiKey
 * @param userId - The user ID (must match the one used for encryption)
 * @returns The decrypted API key
 */
export async function decryptApiKey(ciphertext: string, userId: string): Promise<string> {
  const key = await deriveKey(userId)
  const decoder = new TextDecoder()

  // Decode base64 and extract IV and ciphertext
  const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0))
  const iv = combined.slice(0, IV_LENGTH)
  const encryptedData = combined.slice(IV_LENGTH)

  // Decrypt
  const plaintext = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    encryptedData
  )

  return decoder.decode(plaintext)
}

/**
 * Check if encryption is properly configured
 */
export function isEncryptionConfigured(): boolean {
  return !!process.env.ENCRYPTION_MASTER_KEY
}

/**
 * Validate that a master key meets minimum security requirements
 */
export function validateMasterKey(masterKey: string): { valid: boolean; error?: string } {
  if (!masterKey) {
    return { valid: false, error: 'Master key is required' }
  }
  if (masterKey.length < 32) {
    return { valid: false, error: 'Master key must be at least 32 characters' }
  }
  return { valid: true }
}
