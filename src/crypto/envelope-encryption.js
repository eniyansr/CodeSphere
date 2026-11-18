/**
 * CodeSphere Pro — Envelope Encryption Engine (RFC 9180 HPKE / Hybrid Mode)
 *
 * Implements per-record envelope encryption:
 * 1. Generates fresh random 256-bit DEK per record
 * 2. Generates fresh 96-bit nonce
 * 3. Builds authenticated additional data (AAD) binding record ID, owner, content type, version
 * 4. Encrypts plaintext with AES-256-GCM
 * 5. Wraps DEK for all authorized recipients using ECDH + HKDF
 * 6. Digitally signs envelope metadata & ciphertext with ECDSA P-256
 */

import {
  generateDEK,
  exportDEK,
  encryptAESGCM,
  decryptAESGCM,
  wrapKeyForRecipient,
  unwrapKeyForRecipient,
  signData,
  verifySignature,
  stringToBuffer,
  bufferToString,
  computeKeyFingerprint
} from './crypto-core.js';

export async function createEncryptedEnvelope({
  recordId,
  ownerId,
  contentType,
  plaintext,
  senderSigningKeyPair,
  recipientPublicKeys = [] // [{ recipientId, publicKey }]
}) {
  if (!recordId || !ownerId || !contentType) {
    throw new Error('Missing envelope header metadata (recordId, ownerId, contentType)');
  }

  // 1. Convert plaintext to Uint8Array
  const plaintextStr = typeof plaintext === 'string' ? plaintext : JSON.stringify(plaintext);
  const plaintextBytes = stringToBuffer(plaintextStr);

  // 2. Generate a fresh 256-bit DEK
  const dek = await generateDEK();
  const rawDEK = await exportDEK(dek);

  // 3. Construct Authenticated Additional Data (AAD)
  const aadObj = {
    version: 1,
    recordId,
    ownerId,
    contentType,
    timestamp: Date.now()
  };
  const aadStr = JSON.stringify(aadObj);

  // 4. Encrypt plaintext with AES-256-GCM
  const { ciphertext, nonce } = await encryptAESGCM(dek, plaintextBytes, aadStr);

  // 5. Wrap the DEK for each recipient
  const wrappedRecipients = [];
  for (const recipient of recipientPublicKeys) {
    if (!recipient.publicKey) continue;
    const wrapped = await wrapKeyForRecipient(recipient.publicKey, rawDEK);
    wrappedRecipients.push({
      recipientId: recipient.recipientId,
      ephemeralPublicKey: wrapped.ephemeralPublicKey,
      wrapNonce: wrapped.wrapNonce,
      wrappedKey: wrapped.wrappedKey
    });
  }

  // 6. Sign envelope payload with sender's ECDSA signing key
  const signaturePayload = stringToBuffer(`${recordId}:${ownerId}:${contentType}:${nonce}:${ciphertext}:${aadStr}`);
  const signature = await signData(senderSigningKeyPair.privateKey, signaturePayload);

  // Export sender public key JWK & fingerprint
  const senderPublicJwk = await window.crypto.subtle.exportKey('jwk', senderSigningKeyPair.publicKey);
  const senderFingerprint = await computeKeyFingerprint(senderPublicJwk);

  return {
    version: 1,
    recordId,
    ownerId,
    contentType,
    nonce,
    ciphertext,
    aad: aadStr,
    recipients: wrappedRecipients,
    signature,
    senderPublicKey: senderPublicJwk,
    senderFingerprint,
    createdAt: Date.now()
  };
}

export async function decryptEncryptedEnvelope({
  envelope,
  recipientUserId,
  recipientEncryptionPrivateKey,
  senderSigningPublicKey = null
}) {
  if (!envelope || !envelope.ciphertext || !envelope.nonce) {
    throw new Error('Malformed or corrupted encrypted envelope');
  }

  // 1. Signature Verification (if sender public key provided)
  const pubKeyToVerify = senderSigningPublicKey || (envelope.senderPublicKey ? await window.crypto.subtle.importKey(
    'jwk',
    envelope.senderPublicKey,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['verify']
  ) : null);

  if (pubKeyToVerify && envelope.signature) {
    const signaturePayload = stringToBuffer(`${envelope.recordId}:${envelope.ownerId}:${envelope.contentType}:${envelope.nonce}:${envelope.ciphertext}:${envelope.aad}`);
    const isValid = await verifySignature(pubKeyToVerify, envelope.signature, signaturePayload);
    if (!isValid) {
      throw new Error('Digital signature verification failed! Possible ciphertext tampering or sender spoofing.');
    }
  }

  // 2. Locate recipient's wrapped DEK
  const recipientEntry = (envelope.recipients || []).find(r => r.recipientId === recipientUserId);
  if (!recipientEntry) {
    throw new Error(`Current user (${recipientUserId}) is not an authorized recipient for this encrypted object.`);
  }

  // 3. Unwrap DEK using ECDH + HKDF
  const dek = await unwrapKeyForRecipient(
    recipientEncryptionPrivateKey,
    recipientEntry.ephemeralPublicKey,
    recipientEntry.wrappedKey,
    recipientEntry.wrapNonce
  );

  // 4. Decrypt ciphertext using DEK
  const decryptedBytes = await decryptAESGCM(dek, envelope.ciphertext, envelope.nonce, envelope.aad);
  const decryptedStr = bufferToString(decryptedBytes);

  try {
    return JSON.parse(decryptedStr);
  } catch {
    return decryptedStr;
  }
}
