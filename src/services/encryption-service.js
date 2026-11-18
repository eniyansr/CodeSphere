/**
 * CodeSphere Pro — High-Level E2EE Encryption Service
 * 
 * Provides domain-specific encryption workflows:
 * - Notepad notes
 * - Classroom assignments
 * - Student submissions
 * - Exam questions & student attempts
 */

import { apiRequest } from './api-client.js';
import { getActiveVaultKeys } from '../crypto/key-vault.js';
import { createEncryptedEnvelope, decryptEncryptedEnvelope } from '../crypto/envelope-encryption.js';

export async function fetchUserPublicKeys(userId) {
  const data = await apiRequest(`/api/keys/${encodeURIComponent(userId)}`);
  return data.keys; // [{ key_type, public_key_jwk, fingerprint }]
}

// ─── Notepad Encryption Workflow ─────────────────────────────────────────────
export async function saveEncryptedNote(userId, noteText) {
  const activeKeys = getActiveVaultKeys();
  if (!activeKeys) {
    throw new Error('E2EE Vault is locked. Please log in or unlock your vault.');
  }

  // Recipient is the user themselves
  const recipientPublicKeys = [
    {
      recipientId: userId,
      publicKey: activeKeys.encryptionPair.publicKey
    }
  ];

  const envelope = await createEncryptedEnvelope({
    recordId: `note-${userId}`,
    ownerId: userId,
    contentType: 'note',
    plaintext: { text: noteText, updatedAt: Date.now() },
    senderSigningKeyPair: activeKeys.signingPair,
    recipientPublicKeys
  });

  await apiRequest('/api/objects/store', {
    method: 'POST',
    body: JSON.stringify({ envelope })
  });

  return envelope;
}

export async function loadEncryptedNote(userId) {
  const activeKeys = getActiveVaultKeys();
  if (!activeKeys) return null;

  try {
    const envelope = await apiRequest(`/api/objects/note-${encodeURIComponent(userId)}`);
    if (!envelope) return null;

    const decrypted = await decryptEncryptedEnvelope({
      envelope,
      recipientUserId: userId,
      recipientEncryptionPrivateKey: activeKeys.encryptionPair.privateKey
    });

    return decrypted.text;
  } catch (err) {
    console.warn('[E2EE] Note could not be loaded or is empty:', err.message);
    return null;
  }
}

// ─── Classroom Assignment Encryption Workflow ─────────────────────────────────
export async function publishEncryptedAssignment({
  classroomId,
  teacherId,
  title,
  instructions,
  deadline,
  studentUserIds = []
}) {
  const activeKeys = getActiveVaultKeys();
  if (!activeKeys) {
    throw new Error('Teacher E2EE Vault is locked.');
  }

  // 1. Gather public keys of all enrolled students + teacher
  const recipients = [
    {
      recipientId: teacherId,
      publicKey: activeKeys.encryptionPair.publicKey
    }
  ];

  for (const studentId of studentUserIds) {
    try {
      const keys = await fetchUserPublicKeys(studentId);
      const encKey = keys.find(k => k.key_type === 'encryption');
      if (encKey) {
        const importedKey = await window.crypto.subtle.importKey(
          'jwk',
          JSON.parse(encKey.public_key_jwk),
          { name: 'ECDH', namedCurve: 'P-256' },
          false,
          []
        );
        recipients.push({ recipientId: studentId, publicKey: importedKey });
      }
    } catch (e) {
      console.warn(`Could not resolve public key for student ${studentId}`, e);
    }
  }

  const recordId = `assign-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const envelope = await createEncryptedEnvelope({
    recordId,
    ownerId: teacherId,
    contentType: 'assignment',
    plaintext: { title, instructions, classroomId, deadline },
    senderSigningKeyPair: activeKeys.signingPair,
    recipientPublicKeys: recipients
  });

  // Store envelope & register assignment record
  const result = await apiRequest('/api/assignments/create', {
    method: 'POST',
    body: JSON.stringify({
      classroomId,
      title,
      deadline,
      envelope
    })
  });

  return result;
}

// ─── Student Submission Encryption Workflow ───────────────────────────────────
export async function submitEncryptedCode({
  assignmentId,
  studentId,
  teacherId,
  code,
  language
}) {
  const activeKeys = getActiveVaultKeys();
  if (!activeKeys) {
    throw new Error('Student E2EE Vault is locked.');
  }

  // 1. Resolve teacher's encryption public key
  const teacherKeys = await fetchUserPublicKeys(teacherId);
  const teacherEncKey = teacherKeys.find(k => k.key_type === 'encryption');
  if (!teacherEncKey) {
    throw new Error('Teacher encryption key is not published.');
  }

  const importedTeacherKey = await window.crypto.subtle.importKey(
    'jwk',
    JSON.parse(teacherEncKey.public_key_jwk),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // Authorized recipients: Student and Teacher
  const recipients = [
    { recipientId: studentId, publicKey: activeKeys.encryptionPair.publicKey },
    { recipientId: teacherId, publicKey: importedTeacherKey }
  ];

  const recordId = `sub-${assignmentId}-${studentId}-${Date.now()}`;
  const envelope = await createEncryptedEnvelope({
    recordId,
    ownerId: studentId,
    contentType: 'submission',
    plaintext: { code, language, submittedAt: Date.now() },
    senderSigningKeyPair: activeKeys.signingPair,
    recipientPublicKeys: recipients
  });

  const result = await apiRequest('/api/submissions/create', {
    method: 'POST',
    body: JSON.stringify({
      assignmentId,
      envelope
    })
  });

  return result;
}
