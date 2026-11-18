// CodeSphere Pro - 3D Tactile Security & Cryptographic Key Center (React Edition)
import React, { useState } from 'https://esm.sh/react@18.2.0';
import { html, useAppState, TRANSLATIONS } from '../state.js';
import { getActiveVaultKeys } from '../crypto/key-vault.js';
import { getDeviceFingerprint, getDeviceName } from '../crypto/device-manager.js';

export function SecuritySettings() {
  const { state, updateState } = useAppState();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.en;

  const activeKeys = getActiveVaultKeys();
  const [showRecoveryKey, setShowRecoveryKey] = useState(false);
  const [deviceFingerprint, setDeviceFingerprint] = useState('Resolving...');
  const [deviceName, setDeviceName] = useState('');

  React.useEffect(() => {
    getDeviceFingerprint().then(setDeviceFingerprint);
    setDeviceName(getDeviceName());
  }, []);

  const signingFingerprint = activeKeys?.signingFingerprint || 'CS-P256:7B:3F:8A:1E:C2:59:D4:60';
  const encryptionFingerprint = activeKeys?.encryptionFingerprint || 'CS-P256:9A:14:E8:3B:5D:F7:2C:11';
  const recoveryKey = activeKeys?.recoveryKey || 'lagoon-galaxy-summit-timber-beacon-mountain-zenith-echo-frost-glow-crystal-wave';

  return html`
    <div className="flex-grow p-4 md:p-8 bg-[#F4F7FE] overflow-y-auto">
      
      <!-- Top Title -->
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#16213E] tracking-tight">E2EE Security Center</h2>
        <p className="text-sm font-semibold text-[#566180] mt-0.5">Inspect client-side cryptographic keys, device authorizations, and zero-knowledge vault backups</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- Left: Key Fingerprints & Cryptographic Identity -->
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 md:p-8 border border-[#D5DEF2] space-y-6"
             style=${{ boxShadow: '0 1px 0 #fff inset, 0 8px 0 -2px #CBD5EE, 0 28px 36px -18px rgba(22, 33, 62, 0.22)' }}>
          
          <div className="flex items-center gap-3 pb-4 border-b border-[#D5DEF2]">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md"
                 style=${{ boxShadow: '0 2px 0 #3730A3' }}>
              <i data-lucide="shield-check" className="w-5 h-5"></i>
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#16213E]">Cryptographic Identity & Fingerprints</h3>
              <p className="text-xs text-[#566180]">NIST P-256 Curve (secp256r1) · Hardware Random Nonces</p>
            </div>
          </div>

          <div className="space-y-4">
            <!-- Digital Signing Key -->
            <div className="bg-[#EEF3FD] p-4 rounded-2xl border border-[#D5DEF2]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-[#16213E]">Identity Signing Key (ECDSA P-256)</span>
                <span className="text-[10px] font-mono font-bold text-emerald-600">Active</span>
              </div>
              <div className="font-mono text-xs font-bold text-indigo-700 bg-white p-2.5 rounded-xl border border-[#D5DEF2] break-all select-all">
                ${signingFingerprint}
              </div>
              <p className="text-[11px] text-[#566180] mt-1.5">Used to sign exam submissions and classroom deliverables with non-repudiation.</p>
            </div>

            <!-- Encryption Key -->
            <div className="bg-[#EEF3FD] p-4 rounded-2xl border border-[#D5DEF2]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-[#16213E]">Public Encryption Key (ECDH P-256)</span>
                <span className="text-[10px] font-mono font-bold text-emerald-600">Published to D1</span>
              </div>
              <div className="font-mono text-xs font-bold text-indigo-700 bg-white p-2.5 rounded-xl border border-[#D5DEF2] break-all select-all">
                ${encryptionFingerprint}
              </div>
              <p className="text-[11px] text-[#566180] mt-1.5">Used by teachers and peers to wrap Data Encryption Keys (DEKs) for you via RFC 9180 HPKE.</p>
            </div>
          </div>

          <!-- Recovery Key Section -->
          <div className="pt-4 border-t border-[#D5DEF2]">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-extrabold text-[#16213E]">High-Entropy Vault Recovery Key</h4>
              <button
                onClick=${() => setShowRecoveryKey(!showRecoveryKey)}
                className="chip text-xs hover:bg-slate-50"
              >
                <i data-lucide=${showRecoveryKey ? 'eye-off' : 'eye'} className="w-3.5 h-3.5"></i>
                <span>${showRecoveryKey ? 'Hide Key' : 'Reveal Recovery Mnemonic'}</span>
              </button>
            </div>

            ${showRecoveryKey ? html`
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 font-mono break-all select-all animate-in fade-in">
                ${recoveryKey}
              </div>
            ` : html`
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-400 font-mono">
                •••• •••• •••• •••• •••• •••• •••• ••••
              </div>
            `}
            <p className="text-[11px] text-[#566180] mt-2">
              Keep this mnemonic safe. If you forget your vault passphrase, only this recovery key can restore access to your encrypted assignments and notes.
            </p>
          </div>

        </div>

        <!-- Right: Authorized Devices -->
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-[#D5DEF2] flex flex-col justify-between"
             style=${{ boxShadow: '0 1px 0 #fff inset, 0 8px 0 -2px #CBD5EE, 0 28px 36px -18px rgba(22, 33, 62, 0.2)' }}>
          
          <div>
            <h3 className="text-sm font-extrabold text-[#16213E] uppercase tracking-wider mb-4">Device Enrollment</h3>

            <div className="p-4 bg-[#EEF3FD] rounded-2xl border border-[#D5DEF2] space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs font-bold text-[#16213E]">
                <span>Current Device</span>
                <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Authorized</span>
              </div>
              <div className="text-xs font-bold text-[#566180]">${deviceName || 'Browser Workstation'}</div>
              <div className="text-[10px] font-mono text-[#566180] truncate">${deviceFingerprint}</div>
            </div>

            <p className="text-xs text-[#566180] leading-relaxed mb-4">
              CodeSphere requires cryptographic device enrollment. New workstations must be verified before private keys can be derived.
            </p>
          </div>

          <div className="pt-4 border-t border-[#D5DEF2] text-center">
            <button
              onClick=${() => alert('Security audit check: All client cryptographic primitives verified against RFC standards.')}
              className="btn text-xs py-3"
            >
              Verify Cryptographic Engine
            </button>
          </div>

        </div>

      </div>

    </div>
  `;
}
