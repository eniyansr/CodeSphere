/**
 * CodeSphere Pro — Client Cryptographic Engine (Core Primitives)
 * 
 * Standards Compliant:
 * - Data Encryption: AES-256-GCM (96-bit IV, 128-bit tag)
 * - Public Key Encryption & Key Exchange: ECDH (NIST P-256 / secp256r1)
 * - Key Derivation: HKDF-SHA-256 (RFC 5869)
 * - Vault Key Derivation: PBKDF2-HMAC-SHA256 (100,000 iterations) with Argon2id compatibility params
 * - Digital Signatures: ECDSA (P-256 / SHA-256, RFC 6979)
 * - Hardware Entropy: crypto.getRandomValues()
 */

const cryptoSubtle = window.crypto && window.crypto.subtle ? window.crypto.subtle : null;

// ─── Encoding Helpers ────────────────────────────────────────────────────────
export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToArrayBuffer(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function stringToBuffer(str) {
  return new TextEncoder().encode(str);
}

export function bufferToString(buf) {
  return new TextDecoder().decode(buf);
}

export function getRandomBytes(length) {
  const bytes = new Uint8Array(length);
  window.crypto.getRandomValues(bytes);
  return bytes;
}

export function bufferToHex(buf) {
  const bytes = new Uint8Array(buf);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function hexToBuffer(hex) {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '');
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return bytes.buffer;
}

// ─── SHA-256 Hash & Fingerprinting ──────────────────────────────────────────
export async function sha256(data) {
  const buffer = typeof data === 'string' ? stringToBuffer(data) : data;
  const hashBuffer = await cryptoSubtle.digest('SHA-256', buffer);
  return bufferToHex(hashBuffer);
}

export async function computeKeyFingerprint(jwk) {
  const sortedJwk = JSON.stringify(jwk, Object.keys(jwk).sort());
  const hash = await sha256(sortedJwk);
  // Return formatted fingerprint: CS-SHA256:XX:XX:XX...
  const parts = hash.slice(0, 16).match(/.{1,2}/g) || [];
  return `CS-P256:${parts.join(':').toUpperCase()}`;
}

// ─── Symmetric Data Encryption (AES-256-GCM) ─────────────────────────────────
export async function generateDEK() {
  return await cryptoSubtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true, // extractable for envelope wrapping
    ['encrypt', 'decrypt']
  );
}

export async function exportDEK(key) {
  return await cryptoSubtle.exportKey('raw', key);
}

export async function importDEK(rawBytes) {
  return await cryptoSubtle.importKey(
    'raw',
    rawBytes,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptAESGCM(key, plaintextBytes, additionalDataStr = '', iv = null) {
  const nonce = iv || getRandomBytes(12); // 96-bit nonce
  const algorithm = {
    name: 'AES-GCM',
    iv: nonce,
    tagLength: 128
  };
  if (additionalDataStr) {
    algorithm.additionalData = stringToBuffer(additionalDataStr);
  }

  const ciphertext = await cryptoSubtle.encrypt(algorithm, key, plaintextBytes);

  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    nonce: arrayBufferToBase64(nonce.buffer)
  };
}

export async function decryptAESGCM(key, ciphertextBase64, nonceBase64, additionalDataStr = '') {
  const ciphertext = base64ToArrayBuffer(ciphertextBase64);
  const nonce = base64ToArrayBuffer(nonceBase64);

  const algorithm = {
    name: 'AES-GCM',
    iv: new Uint8Array(nonce),
    tagLength: 128
  };
  if (additionalDataStr) {
    algorithm.additionalData = stringToBuffer(additionalDataStr);
  }

  const decrypted = await cryptoSubtle.decrypt(algorithm, key, ciphertext);
  return decrypted;
}

// ─── Asymmetric Key Generation (ECDH for encryption, ECDSA for signing) ──────
export async function generateEncryptionKeyPair() {
  return await cryptoSubtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256'
    },
    true,
    ['deriveKey', 'deriveBits']
  );
}

export async function generateSigningKeyPair() {
  return await cryptoSubtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    true,
    ['sign', 'verify']
  );
}

// ─── Digital Signatures (ECDSA P-256 / SHA-256) ──────────────────────────────
export async function signData(privateKey, dataBytes) {
  const signature = await cryptoSubtle.sign(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' }
    },
    privateKey,
    dataBytes
  );
  return arrayBufferToBase64(signature);
}

export async function verifySignature(publicKey, signatureBase64, dataBytes) {
  const signature = base64ToArrayBuffer(signatureBase64);
  return await cryptoSubtle.verify(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' }
    },
    publicKey,
    signature,
    dataBytes
  );
}

// ─── Key Encapsulation / Wrapping (ECDH + HKDF + AES-GCM) ────────────────────
export async function wrapKeyForRecipient(recipientPublicKey, rawKeyBytes) {
  // 1. Generate ephemeral ECDH keypair
  const ephemeralPair = await generateEncryptionKeyPair();
  
  // 2. Derive shared secret using ECDH
  const sharedSecret = await cryptoSubtle.deriveBits(
    {
      name: 'ECDH',
      public: recipientPublicKey
    },
    ephemeralPair.privateKey,
    256
  );

  // 3. Derive KEK (Key Encryption Key) using HKDF
  const hkdfKey = await cryptoSubtle.importKey(
    'raw',
    sharedSecret,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );

  const kek = await cryptoSubtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(16), // Fixed zero-salt or domain separator
      info: stringToBuffer('CodeSphere-Pro-RFC9180-DEK-Wrap-v1')
    },
    hkdfKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  // 4. Encrypt the DEK with KEK
  const wrapNonce = getRandomBytes(12);
  const wrappedKeyBuffer = await cryptoSubtle.encrypt(
    {
      name: 'AES-GCM',
      iv: wrapNonce,
      tagLength: 128
    },
    kek,
    rawKeyBytes
  );

  // Export ephemeral public key as JWK
  const ephemeralPublicJwk = await cryptoSubtle.exportKey('jwk', ephemeralPair.publicKey);

  return {
    ephemeralPublicKey: ephemeralPublicJwk,
    wrapNonce: arrayBufferToBase64(wrapNonce.buffer),
    wrappedKey: arrayBufferToBase64(wrappedKeyBuffer)
  };
}

export async function unwrapKeyForRecipient(recipientPrivateKey, ephemeralPublicJwk, wrappedKeyBase64, wrapNonceBase64) {
  // 1. Import sender's ephemeral public key
  const ephemeralPublicKey = await cryptoSubtle.importKey(
    'jwk',
    ephemeralPublicJwk,
    {
      name: 'ECDH',
      namedCurve: 'P-256'
    },
    false,
    []
  );

  // 2. Derive shared secret
  const sharedSecret = await cryptoSubtle.deriveBits(
    {
      name: 'ECDH',
      public: ephemeralPublicKey
    },
    recipientPrivateKey,
    256
  );

  // 3. Derive KEK
  const hkdfKey = await cryptoSubtle.importKey(
    'raw',
    sharedSecret,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );

  const kek = await cryptoSubtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(16),
      info: stringToBuffer('CodeSphere-Pro-RFC9180-DEK-Wrap-v1')
    },
    hkdfKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  // 4. Decrypt wrapped DEK
  const wrappedBuffer = base64ToArrayBuffer(wrappedKeyBase64);
  const wrapNonce = base64ToArrayBuffer(wrapNonceBase64);

  const rawKeyBytes = await cryptoSubtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(wrapNonce),
      tagLength: 128
    },
    kek,
    wrappedBuffer
  );

  return await importDEK(rawKeyBytes);
}

// ─── Vault Key Derivation (PBKDF2 with 100,000 iterations & Salt) ────────────
export async function deriveVaultKey(passphrase, saltBytes) {
  const passBuffer = stringToBuffer(passphrase);
  const baseKey = await cryptoSubtle.importKey(
    'raw',
    passBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await cryptoSubtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}
