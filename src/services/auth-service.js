/**
 * CodeSphere Pro — Authentication & Identity Service
 */

import { apiRequest, setAuthToken } from './api-client.js';
import { createNewUserVault, unlockUserVault, setActiveVaultKeys, clearActiveVaultKeys } from '../crypto/key-vault.js';
import { getDeviceFingerprint, getDeviceName } from '../crypto/device-manager.js';

export async function registerUser({ name, email, password, role, vaultPassphrase }) {
  // 1. Create client-side E2EE Vault
  const vaultPass = vaultPassphrase || password;
  const vaultResult = await createNewUserVault(vaultPass);

  const deviceFingerprint = await getDeviceFingerprint();
  const deviceName = getDeviceName();

  // 2. Transmit registration payload to backend
  // Note: Only public keys and ciphertext vault are transmitted!
  const payload = {
    name,
    email,
    password,
    role,
    vault: vaultResult.vaultData,
    publicKeys: {
      signing: vaultResult.unlockedKeys.publicSigningJwk,
      encryption: vaultResult.unlockedKeys.publicEncryptionJwk,
      signingFingerprint: vaultResult.unlockedKeys.signingFingerprint,
      encryptionFingerprint: vaultResult.unlockedKeys.encryptionFingerprint
    },
    device: {
      name: deviceName,
      fingerprint: deviceFingerprint
    }
  };

  const response = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  if (response.token) {
    setAuthToken(response.token);
  }

  // Set active keys in memory
  setActiveVaultKeys(vaultResult.unlockedKeys);

  return {
    user: response.user,
    recoveryKey: vaultResult.recoveryKey,
    token: response.token
  };
}

export async function loginUser({ email, password, vaultPassphrase }) {
  const deviceFingerprint = await getDeviceFingerprint();

  // 1. Authenticate with backend
  const response = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, deviceFingerprint })
  });

  if (response.token) {
    setAuthToken(response.token);
  }

  // 2. Unlock E2EE Vault
  const vaultPass = vaultPassphrase || password;
  if (response.vault) {
    const unlocked = await unlockUserVault(vaultPass, response.vault);
    setActiveVaultKeys(unlocked);
  }

  return response;
}

export async function checkSession() {
  try {
    const response = await apiRequest('/api/auth/session');
    return response;
  } catch {
    return null;
  }
}

export async function logoutUser() {
  try {
    await apiRequest('/api/auth/logout', { method: 'POST' });
  } catch (e) {
    // Ignore error on network failure
  }
  setAuthToken(null);
  clearActiveVaultKeys();
}
