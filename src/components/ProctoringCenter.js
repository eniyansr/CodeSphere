// CodeSphere Pro - Teacher Live Proctoring Panel
import { updateState, TRANSLATIONS } from '../state.js';

export function ProctoringCenter(state) {
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.en;

  const mockActiveStudents = [
    { name: "Eniyan Rajesh", id: "stud-1", warnings: state.warningsCount, status: state.warningsCount > 2 ? "flagged" : state.warningsCount > 0 ? "warning" : "safe", avatar: "ER" },
    { name: "Pranav Kumar", id: "stud-2", warnings: 0, status: "safe", avatar: "PK" },
    { name: "Aisha Begum", id: "stud-3", warnings: 3, status: "flagged", avatar: "AB" },
    { name: "Sharath Chandra", id: "stud-4", warnings: 1, status: "warning", avatar: "SC" }
  ];

  return `
    <div class="p-6 space-y-6 flex-grow overflow-y-auto">
      
      <!-- Top header with heartbeat -->
      <div class="flex justify-between items-center border-b border-slate-800/40 pb-5">
        <div>
          <h2 class="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <i data-lucide="scan-eye" class="text-accent-rose w-6 h-6 animate-pulse"></i>
            Live AI Proctoring Center
          </h2>
          <p class="text-xs text-slate-400">Real-time supervision of active exam candidates. Monitoring eyes, tab switches, and objects.</p>
        </div>

        <div class="flex items-center space-x-2 bg-slate-900/40 border border-slate-800 px-3 py-1.5 rounded-xl">
          <span class="inline-block w-2.5 h-2.5 rounded-full bg-accent-rose radar-pulse"></span>
          <span class="text-xs font-mono font-bold text-accent-rose uppercase">SUPERVISING ACTIVE FEED</span>
        </div>
      </div>

      <!-- Proctoring Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        ${mockActiveStudents.map(student => {
          let statusColor = "bg-emerald-500/10 text-accent-emerald border-emerald-500/20";
          let statusText = "SECURE";
          if (student.status === 'warning') {
            statusColor = "bg-amber-500/10 text-accent-amber border-amber-500/20";
            statusText = "WARN SIGN";
          } else if (student.status === 'flagged') {
            statusColor = "bg-rose-500/10 text-accent-rose border-rose-500/20";
            statusText = "FLAGGED";
          }

          return `
            <div class="glass-panel p-4 rounded-2xl flex flex-col justify-between space-y-4 hover:border-slate-800/80 transition relative overflow-hidden">
              
              <!-- Indicator status bar -->
              <div class="flex justify-between items-center text-xs">
                <span class="font-bold text-slate-300 truncate max-w-[120px]">${student.name}</span>
                <span class="px-2 py-0.5 rounded text-[9px] font-bold font-mono border ${statusColor}">${statusText}</span>
              </div>

              <!-- Webcam grid card mock -->
              <div class="aspect-video w-full rounded-xl bg-slate-950 border border-slate-900/60 relative overflow-hidden flex flex-col items-center justify-center text-slate-600">
                <i data-lucide="video" class="w-8 h-8 opacity-20"></i>
                <div class="text-[9px] font-mono text-slate-500 mt-1 uppercase tracking-widest animate-pulse">Webcam Stream ${student.id}</div>
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
                <div class="absolute bottom-2 left-2 flex items-center space-x-1.5 text-[8px] font-mono font-bold bg-slate-900/90 text-slate-300 px-1.5 py-0.5 rounded border border-slate-800">
                  <span class="inline-block w-1.5 h-1.5 rounded-full ${student.warnings > 2 ? 'bg-accent-rose' : student.warnings > 0 ? 'bg-accent-amber' : 'bg-accent-emerald'}"></span>
                  <span>Face Verified</span>
                </div>
              </div>

              <!-- Statistics -->
              <div class="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-900 font-mono text-[10px]">
                <div class="flex justify-between text-slate-400">
                  <span>Tab Switches:</span>
                  <span class="font-bold text-slate-300">${student.warnings} attempts</span>
                </div>
                <div class="flex justify-between text-slate-400">
                  <span>Eye Tracking:</span>
                  <span class="font-bold text-slate-300">${student.warnings > 1 ? 'Suspicious' : 'Normal'}</span>
                </div>
              </div>

              <!-- Command buttons -->
              <div class="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                <button 
                  data-proctor-warn-student="${student.name}"
                  class="flex-grow py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold text-[10px] rounded-lg transition active:scale-95 flex items-center justify-center gap-1"
                >
                  <i data-lucide="alert-triangle" class="w-3 h-3 text-accent-amber"></i> Warn
                </button>
                <button 
                  data-proctor-force-submit="${student.name}"
                  class="flex-grow py-1.5 bg-accent-rose/10 hover:bg-accent-rose/20 text-accent-rose border border-accent-rose/20 font-bold text-[10px] rounded-lg transition active:scale-95 flex items-center justify-center gap-1"
                >
                  <i data-lucide="shield-alert" class="w-3 h-3 text-accent-rose"></i> Void Exam
                </button>
              </div>

            </div>
          `;
        }).join('')}
      </div>

      <!-- Live logs feed -->
      <div class="glass-panel p-5 rounded-3xl space-y-4">
        <h4 class="text-sm font-bold text-slate-200 flex items-center gap-1.5">
          <i data-lucide="scroll" class="w-4 h-4 text-indigo-400"></i> Active Security Intrusion Audit
        </h4>

        <div class="max-h-60 overflow-y-auto space-y-2" id="proctor-live-audit-logs">
          ${state.securityLogs.map(log => `
            <div class="bg-slate-950/30 p-2.5 rounded-xl border border-slate-900/60 flex items-center justify-between text-xs hover:border-slate-800 transition">
              <div class="flex items-center space-x-3">
                <div class="w-2 h-2 rounded-full ${log.severity === 'warning' ? 'bg-accent-rose' : 'bg-accent-cyan'} shadow-sm"></div>
                <div class="font-mono text-slate-500 text-[10px]">${log.timestamp}</div>
                <div class="font-bold text-slate-300 text-[11px]">${log.user}</div>
                <div class="text-slate-400">${log.details}</div>
              </div>
              <span class="px-2 py-0.5 rounded text-[8px] font-bold font-mono uppercase bg-slate-900 border border-slate-800 ${log.severity === 'warning' ? 'text-accent-rose border-rose-950' : 'text-accent-cyan border-cyan-950'}">
                ${log.event}
              </span>
            </div>
          `).join('')}
        </div>
      </div>

    </div>
  `;
}

export function bindProctoringCenterEvents(state) {
  // Warn button
  document.querySelectorAll('[data-proctor-warn-student]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const student = e.currentTarget.getAttribute('data-proctor-warn-student');
      alert(`Manual warning flag sent to ${student}. User screen is displaying alert pop-ups.`);
      
      const manualLog = {
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        user: student,
        event: "Manual Warn",
        details: "Invigilator issued manual warning for suspicious head posturing.",
        severity: 'warning'
      };

      updateState({
        warningsCount: student === "Eniyan Rajesh" ? state.warningsCount + 1 : state.warningsCount,
        securityLogs: [manualLog, ...state.securityLogs]
      });
    });
  });

  // Void exam
  document.querySelectorAll('[data-proctor-force-submit]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const student = e.currentTarget.getAttribute('data-proctor-force-submit');
      if (confirm(`CAUTION: Forcefully terminate and invalidate exam session for candidate ${student}?`)) {
        
        const manualLog = {
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          user: student,
          event: "Session Voided",
          details: "Invigilator voided session candidate for multiple policy violations.",
          severity: 'warning'
        };

        if (student === "Eniyan Rajesh") {
          updateState({
            examStatus: null,
            isLockdownActive: false,
            securityLogs: [manualLog, ...state.securityLogs]
          });
        } else {
          updateState({
            securityLogs: [manualLog, ...state.securityLogs]
          });
        }
        alert(`${student}'s secure session is terminated. Candidate logged out.`);
      }
    });
  });
}
