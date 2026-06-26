// CodeSphere Pro - verified Skill Certificates Viewer Component (React Edition)
import React from 'https://esm.sh/react@18.2.0';
import { html, useAppState, TRANSLATIONS } from '../state.js';

export function Certificates() {
  const { state, updateState } = useAppState();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.en;

  const mockCerts = [
    { id: "cert-201", course: "CS-101: Fundamentals of Computer Science", date: "2026-06-20", score: "95%", uuid: "CSP-8820-9178-AB30" },
    { id: "cert-202", course: "DSA-202: Data Structures & Algorithms", date: "2026-06-22", score: "90%", uuid: "CSP-7820-1928-XY22" }
  ];

  const viewCertId = state.activeCertificateId || null;
  const targetCert = mockCerts.find(c => c.id === viewCertId);

  const handleOpenCert = (certId) => {
    updateState({ activeCertificateId: certId });
  };

  const handleCloseCert = () => {
    updateState({ activeCertificateId: null });
  };

  const handlePrint = () => {
    window.print();
  };

  return html`
    <div className="p-6 space-y-6 flex-grow overflow-y-auto">
      
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <i data-lucide="award" className="text-indigo-400 w-6 h-6"></i>
          Verified Skill Certificates
        </h2>
        <p className="text-xs text-slate-400">Claim, export, or print cryptographic verified certificates earned from course assessment thresholds.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${mockCerts.map(cert => html`
          <div key=${cert.id} className="glass-panel p-6 rounded-2xl flex items-center justify-between hover:border-indigo-500/30 transition">
            <div className="space-y-1">
              <div className="text-xs font-mono text-indigo-400 font-bold">${cert.uuid}</div>
              <h3 className="text-sm font-bold text-slate-200">${cert.course}</h3>
              <div className="text-[10px] text-slate-500 font-semibold mt-1">Gained on ${cert.date} • Accuracy: ${cert.score}</div>
            </div>
            
            <button 
              onClick=${() => handleOpenCert(cert.id)}
              className="px-3.5 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 font-bold text-xs rounded-xl transition flex items-center gap-1"
            >
              <i data-lucide="eye" className="w-3.5 h-3.5"></i> View
            </button>
          </div>
        `)}
      </div>

      <!-- Certificate Overlay Modal -->
      ${targetCert && html`
        <div id="cert-modal" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white text-slate-900 rounded-3xl p-8 border-8 border-double border-indigo-900 shadow-2xl relative flex flex-col justify-between space-y-6 select-text overflow-y-auto max-h-[90vh]">
            
            <!-- Close button -->
            <button onClick=${handleCloseCert} className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition print:hidden">
              <i data-lucide="x" className="w-4 h-4"></i>
            </button>

            <!-- Certificate design body -->
            <div className="text-center space-y-4">
              <div className="text-[11px] font-mono tracking-widest text-indigo-600 uppercase font-extrabold">Official Verification Record</div>
              
              <h1 className="text-2xl font-serif font-bold text-indigo-950 tracking-wider">CERTIFICATE OF COMPLETION</h1>
              
              <div className="w-24 h-0.5 bg-indigo-900 mx-auto my-2"></div>
              
              <p className="text-xs text-slate-500 italic mt-4">This document officially certifies that</p>
              
              <h2 className="text-2xl font-bold font-sans text-slate-800 tracking-tight my-2">
                ${(state.googleUser ? state.googleUser.name : (state.role === 'student' ? 'Eniyan Rajesh' : 'Dr. Sarah Jenkins')).toUpperCase()}
              </h2>
              
              <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                has successfully resolved all secure programming tasks and passed the final proctored examination for the subject
              </p>
              
              <h3 className="text-base font-bold text-indigo-900 tracking-wide my-3 font-mono">${targetCert.course}</h3>
              
              <p className="text-xs text-slate-500">
                conducted on <strong className="text-slate-700">${targetCert.date}</strong> with an evaluation accuracy of <strong class="text-slate-700">${targetCert.score}</strong>.
              </p>
            </div>

            <!-- Signature and Stamp block -->
            <div className="flex justify-between items-end pt-8 border-t border-slate-200 text-xs">
              <div className="text-left space-y-1">
                <div className="font-serif italic text-slate-800 font-bold">Dr. Sarah Jenkins</div>
                <div className="w-24 h-px bg-slate-400"></div>
                <div className="text-[10px] text-slate-500">Subject Invigilator</div>
              </div>
              
              <!-- Cryptographic Stamp -->
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-full border-4 border-dashed border-indigo-600 mx-auto flex items-center justify-center text-[9px] font-bold text-indigo-600 rotate-12">
                  SECURE
                </div>
                <div className="text-[9px] font-mono text-slate-400">ID: ${targetCert.uuid}</div>
              </div>

              <div className="text-right space-y-1">
                <div className="font-serif italic text-slate-800 font-bold">CodeSphere Board</div>
                <div className="w-24 h-px bg-slate-400"></div>
                <div className="text-[10px] text-slate-500">System Director</div>
              </div>
            </div>

            <!-- Modal Print footer -->
            <div className="flex justify-end items-center gap-2 pt-4 border-t border-slate-100 print:hidden">
              <button onClick=${handlePrint} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/10 active:scale-95 transition flex items-center gap-1.5">
                <i data-lucide="printer" className="w-3.5 h-3.5"></i>
                Print Document
              </button>
            </div>

          </div>
        </div>
      `}

    </div>
  `;
}
