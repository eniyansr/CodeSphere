// CodeSphere Pro - Admin Control Panel Component (React Edition)
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
    if (confirm("CAUTION: This will delete all customized classrooms, assignments, codes, and proctoring warnings and reset to defaults.\n\nProceed?")) {
      resetStore();
    }
  };

  return html`
    <div className="p-6 space-y-6 flex-grow overflow-y-auto">
      
      <!-- Top header -->
      <div className="flex justify-between items-center border-b border-slate-800/40 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <i data-lucide="shield-check" className="text-indigo-400 w-6 h-6"></i>
            Global Administrator Cockpit
          </h2>
          <p className="text-xs text-slate-400">Manage developer options, monitor server metrics, audit security intrusions, and reset state databases.</p>
        </div>
      </div>

      <!-- Server stats grid -->
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-950/40 p-4.5 rounded-2xl border border-slate-900 flex justify-between items-center">
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase">Docker Sandboxes</div>
            <div className="text-lg font-bold font-mono text-slate-200 mt-0.5">8 Instances</div>
          </div>
          <div className="text-indigo-400 text-xs font-semibold">Active</div>
        </div>

        <div className="bg-slate-950/40 p-4.5 rounded-2xl border border-slate-900 flex justify-between items-center">
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase">Average Run Latency</div>
            <div className="text-lg font-bold font-mono text-slate-200 mt-0.5">0.14 ms</div>
          </div>
          <div className="text-accent-cyan text-xs font-semibold">Optimal</div>
        </div>

        <div className="bg-slate-950/40 p-4.5 rounded-2xl border border-slate-900 flex justify-between items-center">
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase">CPU Server Load</div>
            <div className="text-lg font-bold font-mono text-slate-200 mt-0.5">1.8% Utilized</div>
          </div>
          <div className="text-accent-emerald text-xs font-semibold">Healthy</div>
        </div>

        <div className="bg-slate-950/40 p-4.5 rounded-2xl border border-slate-900 flex justify-between items-center">
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase">Compiler Sandboxes</div>
            <div className="text-lg font-bold font-mono text-slate-200 mt-0.5">K8S Isolation</div>
          </div>
          <div className="text-slate-500 text-xs font-semibold">Protected</div>
        </div>
      </div>

      <!-- Controls and Configuration Panel -->
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Left: Global Security Flags -->
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
            <i data-lucide="shield-alert" className="w-4 h-4 text-indigo-400"></i> Lockdown Configurations
          </h3>

          <div className="space-y-3.5 text-xs">
            
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/20 border border-slate-900">
              <div>
                <div className="font-bold text-slate-300">Disable Copy-Paste</div>
                <p className="text-[10px] text-slate-500">Blocks Ctrl+C, Ctrl+V, right-click, and drag/drop.</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-indigo-500 cursor-pointer" />
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/20 border border-slate-900">
              <div>
                <div className="font-bold text-slate-300">Tab Switching Detector</div>
                <p className="text-[10px] text-slate-500">Logs warnings if candidates leave active test tab.</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-indigo-500 cursor-pointer" />
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/20 border border-slate-900">
              <div>
                <div className="font-bold text-slate-300">Enforce Webcam Proctoring</div>
                <p className="text-[10px] text-slate-500">Requires camera feed activation to open exam.</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-indigo-500 cursor-pointer" />
            </div>

          </div>

          <div className="pt-4 border-t border-slate-900/60 flex justify-between items-center gap-2">
            <button onClick=${handleResetDb} className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-accent-rose border border-accent-rose/20 font-bold text-xs rounded-xl active:scale-95 transition flex items-center justify-center gap-1.5">
              <i data-lucide="refresh-cw" className="w-3.5 h-3.5"></i> Clear Storage & Reset DB
            </button>
          </div>
        </div>

        <!-- Right: Security Audit Logs with filter searches -->
        <div className="glass-panel p-5 rounded-2xl lg:col-span-2 space-y-4">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-900 pb-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <i data-lucide="scroll" className="w-4 h-4 text-indigo-400"></i> Platform Security Audits
            </h3>
            
            <input 
              type="text" 
              placeholder="Search events, users..." 
              value=${searchQuery}
              onChange=${(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950/80 text-xs px-3 py-1.5 rounded-lg border border-slate-800 focus:border-slate-700 outline-none text-slate-300 w-full sm:w-48 font-medium"
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            ${filteredLogs.map(log => html`
              <div key=${log.timestamp + '-' + log.user} className="bg-slate-950/30 p-2.5 rounded-xl border border-slate-900/60 flex items-center justify-between text-xs hover:border-slate-800 transition">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full ${log.severity === 'warning' ? 'bg-accent-rose' : 'bg-accent-cyan'} shadow-sm"></div>
                  <div className="font-mono text-slate-500 text-[10px]">${log.timestamp}</div>
                  <div className="font-bold text-slate-300 text-[11px]">${log.user}</div>
                  <div className="text-slate-400">${log.details}</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[8px] font-bold font-mono uppercase bg-slate-900 border border-slate-800 ${log.severity === 'warning' ? 'text-accent-rose border-rose-950' : 'text-accent-cyan border-cyan-950'}">
                  ${log.event}
                </span>
              </div>
            `)}
            ${filteredLogs.length === 0 && html`
              <div className="text-center py-8 text-slate-500 text-xs font-semibold">No audit logs matching search parameters.</div>
            `}
          </div>

        </div>

      </div>

    </div>
  `;
}
