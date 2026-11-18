// CodeSphere Pro - 3D Tactile Global Administrator Cockpit (React Edition)
import React, { useState } from 'https://esm.sh/react@18.2.0';
import { html, useAppState, TRANSLATIONS } from '../state.js';

export function AdminPanel() {
  const { state, updateState, resetStore } = useAppState();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.en;

  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = (state.securityLogs || []).filter(log => 
    log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.details.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleResetDb = () => {
    if (confirm("CAUTION: This will clear local application caches and reset to initial state.\n\nProceed?")) {
      resetStore();
    }
  };

  return html`
    <div className="flex-grow p-4 md:p-8 bg-[#F4F7FE] overflow-y-auto">
      
      <!-- Top Title -->
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#16213E] tracking-tight">Admin & Security Cockpit</h2>
          <p className="text-sm font-semibold text-[#566180] mt-0.5">Platform telemetry, Cloudflare D1 state, zero-knowledge audit logs, and system health</p>
        </div>

        <button
          onClick=${handleResetDb}
          className="chip text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
        >
          <i data-lucide="refresh-cw" className="w-3.5 h-3.5"></i>
          <span>Reset Platform Cache</span>
        </button>
      </div>

      <!-- System Metric Cards -->
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-[#D5DEF2]"
             style=${{ boxShadow: '0 4px 0 #D5DEF2' }}>
          <div className="text-[10px] uppercase font-bold text-[#566180]">Cloudflare Runtime</div>
          <div className="text-xl font-extrabold text-[#16213E] mt-1">Workers & D1</div>
          <div className="text-xs font-mono font-bold text-emerald-600 mt-0.5">Connected (Edge)</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D5DEF2]"
             style=${{ boxShadow: '0 4px 0 #D5DEF2' }}>
          <div className="text-[10px] uppercase font-bold text-[#566180]">Cryptographic Standard</div>
          <div className="text-xl font-extrabold text-[#16213E] mt-1">RFC 9180 HPKE</div>
          <div className="text-xs font-mono font-bold text-indigo-600 mt-0.5">AES-256-GCM + P-256</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D5DEF2]"
             style=${{ boxShadow: '0 4px 0 #D5DEF2' }}>
          <div className="text-[10px] uppercase font-bold text-[#566180]">Zero-Knowledge Storage</div>
          <div className="text-xl font-extrabold text-[#16213E] mt-1">Strict Isolation</div>
          <div className="text-xs font-mono font-bold text-emerald-600 mt-0.5">Zero Plaintext on Host</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D5DEF2]"
             style=${{ boxShadow: '0 4px 0 #D5DEF2' }}>
          <div className="text-[10px] uppercase font-bold text-[#566180]">Client Execution</div>
          <div className="text-xl font-extrabold text-[#16213E] mt-1">Pyodide WASM</div>
          <div className="text-xs font-mono font-bold text-emerald-600 mt-0.5">100% In-Browser</div>
        </div>
      </div>

      <!-- Audit Logs Table Plate -->
      <div className="bg-white rounded-3xl p-6 border border-[#D5DEF2]"
           style=${{ boxShadow: '0 1px 0 #fff inset, 0 8px 0 -2px #CBD5EE, 0 28px 36px -18px rgba(22, 33, 62, 0.22)' }}>
        
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h3 className="text-base font-extrabold text-[#16213E]">Security & Proctoring Audit Trail</h3>
          <input
            type="text"
            placeholder="Search audit events..."
            value=${searchQuery}
            onInput=${(e) => setSearchQuery(e.target.value)}
            className="bg-[#F0F4FD] border border-[#D5DEF2] rounded-xl px-3.5 py-1.5 text-xs font-bold text-[#16213E] focus:outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EEF3FD] border-b border-[#D5DEF2] text-[#566180] font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D5DEF2] font-mono text-[11px] text-[#16213E]">
              ${filteredLogs.map((log, idx) => html`
                <tr key=${idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 text-[#566180]">${log.timestamp}</td>
                  <td className="py-3 px-4 font-bold">${log.user}</td>
                  <td className="py-3 px-4 text-indigo-600 font-bold">${log.event}</td>
                  <td className="py-3 px-4">${log.details}</td>
                  <td className="py-3 px-4">
                    <span className=${`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                      log.severity === 'critical'
                        ? 'bg-rose-100 text-rose-800'
                        : log.severity === 'warning'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      ${log.severity}
                    </span>
                  </td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
}
