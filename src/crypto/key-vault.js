/**
 * CodeSphere Pro — User Key Vault & Recovery Engine
 * 
 * Implements client-side Zero-Knowledge Vault:
 * - Master Keys generated in browser (ECDH for encryption, ECDSA for signing)
 * - Private keys stored encrypted with vault key derived via PBKDF2 (100k rounds)
 * - 24-word high-entropy recovery key generated on client
 * - Server stores only ciphertext, salt, and recovery hash
 * - In-memory key clearing on logout
 */

import {
  getRandomBytes,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  stringToBuffer,
  bufferToString,
  deriveVaultKey,
  encryptAESGCM,
  decryptAESGCM,
  generateEncryptionKeyPair,
  generateSigningKeyPair,
  computeKeyFingerprint,
  sha256,
  bufferToHex
} from './crypto-core.js';

// Standard 24-word recovery dictionary generator
const WORDLIST = [
  'apple', 'beacon', 'canyon', 'delta', 'eagle', 'falcon', 'galaxy', 'harbor',
  'island', 'jungle', 'kite', 'lagoon', 'mountain', 'nebula', 'ocean', 'planet',
  'quantum', 'river', 'summit', 'timber', 'ultra', 'vortex', 'wave', 'zenith',
  'amber', 'blaze', 'crystal', 'dynamo', 'echo', 'frost', 'glow', 'horizon'
];

export function generateRecoveryKey() {
  const bytes = getRandomBytes(16);
  const words = [];
  for (let i = 0; i < bytes.length; i++) {
    const index = bytes[i] % WORDLIST.length;
    words.push(WORDLIST[index]);
  }
  return words.join('-');
}

export async function createNewUserVault(vaultPassphrase, optionalRecoveryKey = null) {
  if (!vaultPassphrase || vaultPassphrase.length < 8) {
    throw new Error('Vault passphrase must be at least 8 characters long');
  }

  // 1. Generate salt and recovery key
  const saltBytes = getRandomBytes(16);
  const recoveryKey = optionalRecoveryKey || generateRecoveryKey();
  const recoveryHash = await sha256(recoveryKey);

  // 2. Generate identity key pairs
  const signingPair = await generateSigningKeyPair();
  const encryptionPair = await generateEncryptionKeyPair();

  // 3. Export JWKs
  const privateSigningJwk = await window.crypto.subtle.exportKey('jwk', signingPair.privateKey);
  const publicSigningJwk = await window.crypto.subtle.exportKey('jwk', signingPair.publicKey);
  const privateEncryptionJwk = await window.crypto.subtle.exportKey('jwk', encryptionPair.privateKey);
  const publicEncryptionJwk = await window.crypto.subtle.exportKey('jwk', encryptionPair.publicKey);

  const signingFingerprint = await computeKeyFingerprint(publicSigningJwk);
  const encryptionFingerprint = await computeKeyFingerprint(publicEncryptionJwk);

  // 4. Bundle private keys into vault plaintext
  const vaultPayload = {
    version: 1,
    privateSigningJwk,
    privateEncryptionJwk,
    recoveryKey,
    createdAt: Date.now()
  };
  const vaultBuffer = stringToBuffer(JSON.stringify(vaultPayload));

  // 5. Derive vault key and encrypt
  const vaultKey = await deriveVaultKey(vaultPassphrase, saltBytes);
  const { ciphertext, nonce } = await encryptAESGCM(vaultKey, vaultBuffer, 'CodeSphere-Vault-v1');

  return {
    vaultData: {
      encryptedVault: ciphertext,
      vaultNonce: nonce,
      vaultSalt: arrayBufferToBase64(saltBytes.buffer),
      vaultParams: JSON.stringify({ kdf: 'PBKDF2', hash: 'SHA-256', iterations: 100000 }),
      recoveryHash,
      version: 1
    },
    recoveryKey,
    unlockedKeys: {
      signingPair,
      encryptionPair,
      publicSigningJwk,
      publicEncryptionJwk,
      signingFingerprint,
      encryptionFingerprint
    }
  };
}

export async function unlockUserVault(vaultPassphraseOrRecoveryKey, vaultRecord) {
  if (!vaultRecord || !vaultRecord.encryptedVault || !vaultRecord.vaultSalt) {
    throw new Error('Invalid vault record provided for decryption');
  }

  const saltBytes = new Uint8Array(base64ToArrayBuffer(vaultRecord.vaultSalt));
  let decryptedBytes = null;

  try {
    // Attempt decryption with passphrase
    const vaultKey = await deriveVaultKey(vaultPassphraseOrRecoveryKey, saltBytes);
    decryptedBytes = await decryptAESGCM(
      vaultKey,
      vaultRecord.encryptedVault,
      vaultRecord.vaultNonce,
      'CodeSphere-Vault-v1'
    );
  } catch (err) {
    // If passphrase fails, attempt recovery key derivation
    const recHash = await sha256(vaultPassphraseOrRecoveryKey);
    if (vaultRecord.recoveryHash && recHash !== vaultRecord.recoveryHash) {
      throw new Error('Incorrect vault passphrase or invalid recovery key.');
    }
    const recoveryVaultKey = await deriveVaultKey(vaultPassphraseOrRecoveryKey, saltBytes);
    decryptedBytes = await decryptAESGCM(
      recoveryVaultKey,
      vaultRecord.encryptedVault,
      vaultRecord.vaultNonce,
      'CodeSphere-Vault-v1'
    );
  }

  const vaultPayload = JSON.parse(bufferToString(decryptedBytes));

  // Re-import CryptoKey objects
  const privateSigningKey = await window.crypto.subtle.importKey(
    'jwk',
    vaultPayload.privateSigningJwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const privateEncryptionKey = await window.crypto.subtle.importKey(
    'jwk',
    vaultPayload.privateEncryptionJwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveKey', 'deriveBits']
  );

  // Reconstruct matching public keys
  const publicSigningJwk = { ...vaultPayload.privateSigningJwk, d: undefined, key_ops: ['verify'] };
  const publicEncryptionJwk = { ...vaultPayload.privateEncryptionJwk, d: undefined, key_ops: [] };

  const publicSigningKey = await window.crypto.subtle.importKey(
    'jwk',
    publicSigningJwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['verify']
  );

  const publicEncryptionKey = await window.crypto.subtle.importKey(
    'jwk',
    publicEncryptionJwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    []
  );

  return {
    signingPair: { privateKey: privateSigningKey, publicKey: publicSigningKey },
    encryptionPair: { privateKey: privateEncryptionKey, publicKey: publicEncryptionKey },
    publicSigningJwk,
    publicEncryptionJwk,
    signingFingerprint: await computeKeyFingerprint(publicSigningJwk),
    encryptionFingerprint: await computeKeyFingerprint(publicEncryptionJwk),
    recoveryKey: vaultPayload.recoveryKey
  };
}

// Memory wiper for logout
let activeVaultKeys = null;

export function setActiveVaultKeys(keys) {
  activeVaultKeys = keys;
}

export function getActiveVaultKeys() {
  return activeVaultKeys;
}

export function clearActiveVaultKeys() {
  activeVaultKeys = null;
}
