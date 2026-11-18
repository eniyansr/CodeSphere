// CodeSphere Pro - 3D Tactile Live AI Proctoring Supervision Center (React Edition)
import React from 'https://esm.sh/react@18.2.0';
import { html, useAppState, TRANSLATIONS } from '../state.js';

export function ProctoringCenter() {
  const { state, updateState } = useAppState();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.en;

  const mockActiveStudents = [
    { name: "Eniyan Rajesh", id: "stud-1", warnings: state.warningsCount || 0, status: (state.warningsCount || 0) > 2 ? "flagged" : (state.warningsCount || 0) > 0 ? "warning" : "safe", avatar: "ER" },
    { name: "Pranav Kumar", id: "stud-2", warnings: 0, status: "safe", avatar: "PK" },
    { name: "Aisha Begum", id: "stud-3", warnings: 3, status: "flagged", avatar: "AB" },
    { name: "Sharath Chandra", id: "stud-4", warnings: 1, status: "warning", avatar: "SC" }
  ];

  const handleWarn = (studentName) => {
    alert(`Manual warning flag transmitted to candidate ${studentName}.`);
    const log = {
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      user: studentName,
      event: "Invigilator Warning",
      details: "Manual warning issued for gaze divergence or background voices.",
      severity: 'warning'
    };
    updateState({
      warningsCount: studentName === "Eniyan Rajesh" ? (state.warningsCount || 0) + 1 : (state.warningsCount || 0),
      securityLogs: [log, ...(state.securityLogs || [])]
    });
  };

  const handleVoid = (studentName) => {
    if (confirm(`Terminate and void session for candidate ${studentName}?`)) {
      const log = {
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        user: studentName,
        event: "Session Voided",
        details: "Invigilator invalidated session due to recurring violations.",
        severity: 'critical'
      };
      updateState({
        securityLogs: [log, ...(state.securityLogs || [])]
      });
      alert(`Candidate ${studentName}'s exam session was voided.`);
    }
  };

  return html`
    <div className="flex-grow p-4 md:p-8 bg-[#F4F7FE] overflow-y-auto">
      
      <!-- Top Title Bar -->
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#16213E] tracking-tight">AI Proctoring Center</h2>
          <p className="text-sm font-semibold text-[#566180] mt-0.5">Real-time candidate telemetry, automated gaze tracking, and remote exam invigilation</p>
        </div>

        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-[#D5DEF2]"
             style=${{ boxShadow: '0 3px 0 #D5DEF2' }}>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-mono font-bold text-emerald-700">SUPERVISION ACTIVE</span>
        </div>
      </div>

      <!-- Candidate Feeds Grid -->
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        ${mockActiveStudents.map(student => {
          const isFlagged = student.status === 'flagged';
          const isWarn = student.status === 'warning';

          return html`
            <div
              key=${student.id}
              className="bg-white rounded-3xl p-5 border border-[#D5DEF2] flex flex-col justify-between"
              style=${{ boxShadow: '0 1px 0 #fff inset, 0 8px 0 -2px #CBD5EE, 0 24px 32px -16px rgba(22, 33, 62, 0.2)' }}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-extrabold text-[#16213E]">${student.name}</span>
                  <span className=${`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    isFlagged
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : isWarn
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    ${isFlagged ? 'FLAGGED' : isWarn ? 'WARNING' : 'SECURE'}
                  </span>
                </div>

                <!-- Simulated Camera Tile -->
                <div className="w-full aspect-video rounded-2xl bg-gradient-to-br from-[#DDE6FB] to-[#C7D5F7] relative flex items-center justify-center mb-4 overflow-hidden border border-[#D5DEF2]">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center font-bold text-sm text-indigo-700 shadow-md">
                    ${student.avatar}
                  </div>
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-white/90 text-[10px] font-mono font-bold text-[#16213E]">
                    Cam 0${student.id.slice(-1)}
                  </div>
                </div>

                <div className="text-xs font-mono text-[#566180] mb-4 space-y-1">
                  <div>Warnings: <strong className=${student.warnings > 0 ? 'text-rose-600' : 'text-emerald-600'}>${student.warnings}</strong></div>
                  <div>Gaze Vector: <strong className="text-[#16213E]">Centered</strong></div>
                </div>
              </div>

              <!-- Action buttons -->
              <div className="flex items-center gap-2 pt-3 border-t border-[#D5DEF2]">
                <button
                  onClick=${() => handleWarn(student.name)}
                  className="chip text-[11px] flex-1 text-amber-700 border-amber-200 hover:bg-amber-50"
                >
                  Warn
                </button>
                <button
                  onClick=${() => handleVoid(student.name)}
                  className="chip text-[11px] flex-1 text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  Void
                </button>
              </div>
            </div>
          `;
        })}
      </div>

    </div>
  `;
}
