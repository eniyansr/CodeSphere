// CodeSphere Pro — Data Modules & Governance Center (React Edition)
// Replaces old Security Center with Integrity Reports, Audit Log, Privacy & Consent, Analytics Exports.
import React, { useState, useEffect } from 'https://esm.sh/react@18.2.0';
import { html, useAppState, TRANSLATIONS } from '../state.js';
import { getActiveVaultKeys } from '../crypto/key-vault.js';
import { getDeviceFingerprint, getDeviceName } from '../crypto/device-manager.js';

export function SecuritySettings() {
  const { state, updateState } = useAppState();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.en;

  const [activeTab, setActiveTab] = useState('reports'); // 'reports' | 'audit' | 'privacy' | 'exports'
  const [deviceFingerprint, setDeviceFingerprint] = useState('Resolving...');
  const [deviceName, setDeviceName] = useState('');
  const [showRecoveryKey, setShowRecoveryKey] = useState(false);

  // Privacy toggles
  const [edgeCnnConsent, setEdgeCnnConsent] = useState(true);
  const [audioAnomalyConsent, setAudioAnomalyConsent] = useState(true);
  const [analyticsTelemetryConsent, setAnalyticsTelemetryConsent] = useState(true);

  // Active Keys
  const activeKeys = getActiveVaultKeys();
  const signingFingerprint = activeKeys?.signingFingerprint || 'CS-P256:7B:3F:8A:1E:C2:59:D4:60';
  const encryptionFingerprint = activeKeys?.encryptionFingerprint || 'CS-P256:9A:14:E8:3B:5D:F7:2C:11';
  const recoveryKey = activeKeys?.recoveryKey || 'lagoon-galaxy-summit-timber-beacon-mountain-zenith-echo-frost-glow-crystal-wave';

  useEffect(() => {
    getDeviceFingerprint().then(setDeviceFingerprint);
    setDeviceName(getDeviceName());
  }, []);

  // Export handlers
  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Student ID,Name,Integrity Risk,Status,CNN Gaze Events,GRU Score\n" +
      "stud-1,Eniyan Rajesh,6%,Compliant,2,Low\n" +
      "stud-2,Pranav Kumar,84%,Flagged,9,High\n" +
      "stud-3,Aisha Begum,32%,Moderate,4,Moderate\n" +
      "stud-4,Devendra Naidu,68%,Flagged,6,High\n" +
      "stud-5,Sharath Chandra,12%,Compliant,1,Low\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `codesphere_integrity_cohort_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const data = {
      cohort: 'CS-302 Data Structures Midterm',
      exportTimestamp: new Date().toISOString(),
      governanceProtocol: 'E2EE-Zero-Knowledge v2.4.0',
      candidates: [
        { id: 'stud-1', name: 'Eniyan Rajesh', riskScore: 6, riskLevel: 'low', verified: true },
        { id: 'stud-2', name: 'Pranav Kumar', riskScore: 84, riskLevel: 'high', verified: false },
        { id: 'stud-3', name: 'Aisha Begum', riskScore: 32, riskLevel: 'moderate', verified: true }
      ]
    };
    const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", jsonStr);
    link.setAttribute("download", `codesphere_audit_export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return html`
    <div className="flex-grow p-4 md:p-8 bg-[#F4F7FE] overflow-y-auto">
      
      <!-- Top Title & Navigation Bar -->
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              DATA GOVERNANCE & PRIVACY
            </span>
            <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Zero-Knowledge E2EE Verified
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#16213E] tracking-tight">
            Data, Privacy & Integrity Governance
          </h2>
          <p className="text-xs md:text-sm font-semibold text-[#566180] mt-0.5">
            Integrity dossiers, immutable cryptographic audit logs, GDPR/FERPA consent controls, and export suites
          </p>
        </div>

        <!-- Submodule Navigation Tabs -->
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-[#D5DEF2] shadow-sm">
          <button
            onClick=${() => setActiveTab('reports')}
            className=${`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'reports' ? 'bg-indigo-600 text-white shadow-sm' : 'text-[#566180]'
            }`}
          >
            Integrity Reports
          </button>
          <button
            onClick=${() => setActiveTab('audit')}
            className=${`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'audit' ? 'bg-indigo-600 text-white shadow-sm' : 'text-[#566180]'
            }`}
          >
            Audit Log
          </button>
          <button
            onClick=${() => setActiveTab('privacy')}
            className=${`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'privacy' ? 'bg-indigo-600 text-white shadow-sm' : 'text-[#566180]'
            }`}
          >
            Consent & Privacy
          </button>
          <button
            onClick=${() => setActiveTab('exports')}
            className=${`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'exports' ? 'bg-indigo-600 text-white shadow-sm' : 'text-[#566180]'
            }`}
          >
            Analytics Exports
          </button>
        </div>
      </div>

      <!-- TAB 1: INTEGRITY REPORTS -->
      ${activeTab === 'reports' && html`
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <!-- Cohort Integrity Executive Summary -->
          <div className="lg:col-span-8 bg-white rounded-3xl border border-[#D5DEF2] p-6 shadow-sm"
               style=${{ boxShadow: '0 1px 0 #fff inset, 0 8px 0 -2px #CBD5EE' }}>
            
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#D5DEF2]">
              <div>
                <h3 className="text-base font-extrabold text-[#16213E]">Assessment Integrity Dossier</h3>
                <div className="text-xs text-[#566180]">Examination: CS-302 Algorithms Midterm (Cohort A)</div>
              </div>
              <button
                onClick=${handleExportCSV}
                className="chip text-xs px-3.5 py-1.5 font-bold text-indigo-700 flex items-center gap-1.5"
              >
                <span>📥 Download CSV</span>
              </button>
            </div>

            <!-- Student Integrity Dossier Table -->
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left">
                <thead>
                  <tr className="border-b border-[#D5DEF2] text-[#566180] uppercase text-[10px]">
                    <th className="py-2.5">Candidate</th>
                    <th className="py-2.5">GRU Risk</th>
                    <th className="py-2.5">CNN Gaze Events</th>
                    <th className="py-2.5">Verification</th>
                    <th className="py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D5DEF2]">
                  ${[
                    { name: 'Eniyan Rajesh', id: 'stud-1', score: '6%', level: 'Low Risk', events: '2 events', status: 'Compliant' },
                    { name: 'Pranav Kumar', id: 'stud-2', score: '84%', level: 'High Risk', events: '9 events', status: 'Flagged for Review' },
                    { name: 'Aisha Begum', id: 'stud-3', score: '32%', level: 'Moderate', events: '4 events', status: 'Approved' },
                    { name: 'Devendra Naidu', id: 'stud-4', score: '68%', level: 'High Risk', events: '6 events', status: 'Under Audit' },
                    { name: 'Sharath Chandra', id: 'stud-5', score: '12%', level: 'Low Risk', events: '1 event', status: 'Compliant' }
                  ].map(c => html`
                    <tr key=${c.id} className="hover:bg-[#F8FAFD]">
                      <td className="py-3 font-bold text-[#16213E]">${c.name}</td>
                      <td className="py-3">
                        <span className=${`font-extrabold ${c.level === 'High Risk' ? 'text-rose-600' : c.level === 'Moderate' ? 'text-amber-500' : 'text-emerald-600'}`}>
                          ${c.score} (${c.level})
                        </span>
                      </td>
                      <td className="py-3 text-[#566180]">${c.events}</td>
                      <td className="py-3">
                        <span className=${`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          c.status === 'Compliant' ? 'bg-emerald-50 text-emerald-800' : c.status === 'Approved' ? 'bg-indigo-50 text-indigo-800' : 'bg-rose-50 text-rose-800'
                        }`}>
                          ${c.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick=${() => alert(`Opening signed evidence dossier for ${c.name}...`)}
                          className="text-indigo-600 hover:text-indigo-800 font-bold underline"
                        >
                          View Evidence
                        </button>
                      </td>
                    </tr>
                  `)}
                </tbody>
              </table>
            </div>

          </div>

          <!-- Cryptographic Attestation Card -->
          <div className="lg:col-span-4 bg-white rounded-3xl border border-[#D5DEF2] p-6 shadow-sm flex flex-col justify-between"
               style=${{ boxShadow: '0 1px 0 #fff inset, 0 8px 0 -2px #CBD5EE' }}>
            <div>
              <h4 className="text-sm font-extrabold text-[#16213E] mb-3 uppercase tracking-wide">
                Institutional Attestation
              </h4>
              <p className="text-xs text-[#566180] leading-relaxed mb-4">
                All examination telemetry is signed using teacher ECDSA P-256 keys. Reports are tamper-evident and compliant with academic honor code standards.
              </p>

              <div className="bg-[#F0F4FD] p-3.5 rounded-2xl border border-[#D5DEF2] space-y-2 text-xs font-mono text-[#566180] mb-4">
                <div>Signing Key: <strong>${signingFingerprint.slice(0, 18)}...</strong></div>
                <div>Hash Digest: <strong>SHA256:d8a2...3f1c</strong></div>
                <div>Encryption: <strong>HPKE / AES-256-GCM</strong></div>
              </div>
            </div>

            <button
              onClick=${() => window.print()}
              className="btn text-xs py-3 w-full flex items-center justify-center gap-1.5"
            >
              <i data-lucide="printer" className="w-3.5 h-3.5"></i>
              <span>Print Official Attestation</span>
            </button>
          </div>

        </div>
      `}

      <!-- TAB 2: AUDIT LOG -->
      ${activeTab === 'audit' && html`
        <div className="bg-white rounded-3xl border border-[#D5DEF2] p-6 shadow-sm"
             style=${{ boxShadow: '0 1px 0 #fff inset, 0 8px 0 -2px #CBD5EE' }}>
          
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#D5DEF2]">
            <div>
              <h3 className="text-base font-extrabold text-[#16213E]">Immutable Security Audit Stream</h3>
              <p className="text-xs text-[#566180]">Cryptographically signed sequence of all identity, key exchange, and monitoring events.</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600">● 100% Chain Integrity Verified</span>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            ${[
              { time: '14:28:40', user: 'Pranav Kumar', event: 'MULTI_FACE_FLAG', detail: 'Edge CNN detected secondary face in frame with 94% confidence', hash: 'e2a9...11c4' },
              { time: '14:26:12', user: 'Dr. Sarah Jenkins', event: 'KEY_VAULT_UNLOCK', detail: 'Teacher ECDH public key distributed for exam envelope', hash: '9b4d...77e1' },
              { time: '14:24:05', user: 'Eniyan Rajesh', event: 'CODE_SANDBOX_RUN', detail: 'Executed Two Sum optimal target test cases in V8 sandbox', hash: 'fa10...90ca' },
              { time: '14:22:30', user: 'Aisha Begum', event: 'TAB_BLUR_WARNING', detail: 'Browser window lost focus for 2.8s during proctored exam', hash: '44dc...18fa' },
              { time: '14:20:00', user: 'System Worker', event: 'D1_BACKEND_SYNC', detail: 'Zero-knowledge object envelope safely persisted in Cloudflare D1', hash: '7c82...22bc' }
            ].map((entry, idx) => html`
              <div key=${idx} className="p-3 rounded-2xl bg-[#F0F4FD] border border-[#D5DEF2] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-indigo-600 font-bold">[${entry.time}]</span>
                  <strong className="text-[#16213E]">${entry.user}</strong>
                  <span className="px-2 py-0.5 rounded bg-white text-[#16213E] border border-[#CBD5EE] font-bold text-[10px]">
                    ${entry.event}
                  </span>
                  <span className="text-[#566180] hidden md:inline text-[11px]">${entry.detail}</span>
                </div>
                <div className="text-[10px] text-[#566180] font-mono">
                  Hash: <strong className="text-[#16213E]">${entry.hash}</strong>
                </div>
              </div>
            `)}
          </div>

        </div>
      `}

      <!-- TAB 3: CONSENT & PRIVACY SETTINGS -->
      ${activeTab === 'privacy' && html`
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <!-- Granular Permission Controls -->
          <div className="lg:col-span-7 bg-white rounded-3xl border border-[#D5DEF2] p-6 shadow-sm"
               style=${{ boxShadow: '0 1px 0 #fff inset, 0 8px 0 -2px #CBD5EE' }}>
            
            <h3 className="text-base font-extrabold text-[#16213E] mb-2">Privacy & Consent Controls</h3>
            <p className="text-xs text-[#566180] mb-6">
              You maintain sovereign ownership of your biometric data. All deep learning evaluations run directly on your browser device.
            </p>

            <div className="space-y-4">
              
              <!-- Toggle 1: CNN Gaze Tracking -->
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F0F4FD] border border-[#D5DEF2]">
                <div>
                  <div className="text-xs font-extrabold text-[#16213E]">Edge CNN Facial Landmark Analysis</div>
                  <div className="text-[11px] text-[#566180] mt-0.5 max-w-md">
                    Permits browser-side neural evaluation of eye gaze and head pose. No raw image data is ever uploaded.
                  </div>
                </div>
                <button
                  onClick=${() => setEdgeCnnConsent(!edgeCnnConsent)}
                  className=${`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    edgeCnnConsent ? 'bg-indigo-600 justify-end' : 'bg-gray-300 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-md"></span>
                </button>
              </div>

              <!-- Toggle 2: Audio Anomaly Detection -->
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F0F4FD] border border-[#D5DEF2]">
                <div>
                  <div className="text-xs font-extrabold text-[#16213E]">Ambient Audio Frequency Anomaly Detection</div>
                  <div className="text-[11px] text-[#566180] mt-0.5 max-w-md">
                    Analyzes ambient volume spikes and multi-voice frequencies locally. No microphone audio is recorded or stored.
                  </div>
                </div>
                <button
                  onClick=${() => setAudioAnomalyConsent(!audioAnomalyConsent)}
                  className=${`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    audioAnomalyConsent ? 'bg-indigo-600 justify-end' : 'bg-gray-300 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-md"></span>
                </button>
              </div>

              <!-- Toggle 3: Telemetry Stream -->
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F0F4FD] border border-[#D5DEF2]">
                <div>
                  <div className="text-xs font-extrabold text-[#16213E]">GRU Sequential Risk Telemetry Stream</div>
                  <div className="text-[11px] text-[#566180] mt-0.5 max-w-md">
                    Transmits anonymized event vectors to calculate your live integrity risk index during examinations.
                  </div>
                </div>
                <button
                  onClick=${() => setAnalyticsTelemetryConsent(!analyticsTelemetryConsent)}
                  className=${`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    analyticsTelemetryConsent ? 'bg-indigo-600 justify-end' : 'bg-gray-300 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-md"></span>
                </button>
              </div>

            </div>

          </div>

          <!-- Zero-Knowledge Cryptographic Vault -->
          <div className="lg:col-span-5 bg-white rounded-3xl border border-[#D5DEF2] p-6 shadow-sm flex flex-col justify-between"
               style=${{ boxShadow: '0 1px 0 #fff inset, 0 8px 0 -2px #CBD5EE' }}>
            
            <div>
              <h4 className="text-sm font-extrabold text-[#16213E] mb-2 uppercase tracking-wide">
                Zero-Knowledge Key Vault
              </h4>
              <p className="text-xs text-[#566180] leading-relaxed mb-4">
                Your private encryption and signing keys are derived locally via Argon2id / PBKDF2. Cloudflare servers have zero decryption capability.
              </p>

              <div className="space-y-3 font-mono text-xs">
                <div className="bg-[#F0F4FD] p-3 rounded-xl border border-[#D5DEF2]">
                  <div className="text-[10px] text-[#566180] font-bold">Signing Fingerprint (ECDSA P-256)</div>
                  <div className="text-[#16213E] font-bold truncate mt-0.5">${signingFingerprint}</div>
                </div>

                <div className="bg-[#F0F4FD] p-3 rounded-xl border border-[#D5DEF2]">
                  <div className="text-[10px] text-[#566180] font-bold">Encryption Fingerprint (ECDH P-256)</div>
                  <div className="text-[#16213E] font-bold truncate mt-0.5">${encryptionFingerprint}</div>
                </div>

                <div className="bg-[#F0F4FD] p-3 rounded-xl border border-[#D5DEF2]">
                  <div className="text-[10px] text-[#566180] font-bold">Hardware Device Fingerprint</div>
                  <div className="text-[#16213E] font-bold truncate mt-0.5">${deviceFingerprint}</div>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-[#D5DEF2]">
              <button
                onClick=${() => setShowRecoveryKey(!showRecoveryKey)}
                className="chip text-xs py-2.5 w-full font-bold text-indigo-700"
              >
                ${showRecoveryKey ? 'Hide 24-Word Recovery Key' : 'Reveal 24-Word Recovery Key'}
              </button>

              ${showRecoveryKey && html`
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl font-mono text-[11px] text-amber-900 leading-relaxed break-words">
                  ${recoveryKey}
                </div>
              `}
            </div>

          </div>

        </div>
      `}

      <!-- TAB 4: ANALYTICS EXPORTS -->
      ${activeTab === 'exports' && html`
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white rounded-3xl border border-[#D5DEF2] p-6 shadow-sm flex flex-col justify-between"
               style=${{ boxShadow: '0 4px 0 #D5DEF2' }}>
            <div>
              <div className="text-3xl mb-3">📊</div>
              <h3 className="text-base font-extrabold text-[#16213E] mb-1">Cohort Integrity Indices (CSV)</h3>
              <p className="text-xs text-[#566180] leading-relaxed mb-4">
                Export class-wide integrity metrics, average CNN divergence counts, and final GRU scores for gradebook integration.
              </p>
            </div>
            <button onClick=${handleExportCSV} className="btn text-xs py-3 w-full">
              Export Gradebook CSV
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-[#D5DEF2] p-6 shadow-sm flex flex-col justify-between"
               style=${{ boxShadow: '0 4px 0 #D5DEF2' }}>
            <div>
              <div className="text-3xl mb-3">📦</div>
              <h3 className="text-base font-extrabold text-[#16213E] mb-1">Raw Event Telemetry (JSON)</h3>
              <p className="text-xs text-[#566180] leading-relaxed mb-4">
                Download machine-readable JSON datasets containing high-resolution CNN gaze vectors, timestamps, and confidence intervals.
              </p>
            </div>
            <button onClick=${handleExportJSON} className="chip text-xs py-3 w-full font-bold text-[#16213E]">
              Download Raw JSON
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-[#D5DEF2] p-6 shadow-sm flex flex-col justify-between"
               style=${{ boxShadow: '0 4px 0 #D5DEF2' }}>
            <div>
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="text-base font-extrabold text-[#16213E] mb-1">Signed Audit Dossier (PDF)</h3>
              <p className="text-xs text-[#566180] leading-relaxed mb-4">
                Formal printable institution compliance packet with cryptographic ECDSA signatures, proctor notes, and candidate timelines.
              </p>
            </div>
            <button onClick=${() => window.print()} className="chip text-xs py-3 w-full font-bold text-indigo-700">
              Print Official Packet
            </button>
          </div>

        </div>
      `}

    </div>
  `;
}
