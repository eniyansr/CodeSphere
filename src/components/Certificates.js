// CodeSphere Pro - verified Skill Certificates Viewer Component
import { updateState, TRANSLATIONS } from '../state.js';

export function Certificates(state) {
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.en;

  const mockCerts = [
    { id: "cert-201", course: "CS-101: Fundamentals of Computer Science", date: "2026-06-20", score: "95%", uuid: "CSP-8820-9178-AB30" },
    { id: "cert-202", course: "DSA-202: Data Structures & Algorithms", date: "2026-06-22", score: "90%", uuid: "CSP-7820-1928-XY22" }
  ];

  const viewCertId = state.activeCertificateId || null;
  const targetCert = mockCerts.find(c => c.id === viewCertId);

  return `
    <div class="p-6 space-y-6 flex-grow overflow-y-auto">
      
      <div>
        <h2 class="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <i data-lucide="award" class="text-indigo-400 w-6 h-6"></i>
          Verified Skill Certificates
        </h2>
        <p class="text-xs text-slate-400">Claim, export, or print cryptographic verified certificates earned from course assessment thresholds.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${mockCerts.map(cert => `
          <div class="glass-panel p-6 rounded-2xl flex items-center justify-between hover:border-indigo-500/30 transition">
            <div class="space-y-1">
              <div class="text-xs font-mono text-indigo-400 font-bold">${cert.uuid}</div>
              <h3 class="text-sm font-bold text-slate-200">${cert.course}</h3>
              <div class="text-[10px] text-slate-500 font-semibold mt-1">Gained on ${cert.date} • Accuracy: ${cert.score}</div>
            </div>
            
            <button 
              data-open-certificate-id="${cert.id}"
              class="px-3.5 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 font-bold text-xs rounded-xl transition flex items-center gap-1"
            >
              <i data-lucide="eye" class="w-3.5 h-3.5"></i> View
            </button>
          </div>
        `).join('')}
      </div>

      <!-- Certificate Overlay Modal -->
      ${targetCert ? `
        <div id="cert-modal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div class="w-full max-w-2xl bg-white text-slate-900 rounded-3xl p-8 border-8 border-double border-indigo-900 shadow-2xl relative flex flex-col justify-between space-y-6 select-text overflow-y-auto max-h-[90vh]">
            
            <!-- Close button -->
            <button id="cert-modal-close" class="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition print:hidden">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>

            <!-- Certificate design body -->
            <div class="text-center space-y-4">
              <div class="text-[11px] font-mono tracking-widest text-indigo-600 uppercase font-extrabold">Official Verification Record</div>
              
              <h1 class="text-2xl font-serif font-bold text-indigo-950 tracking-wider">CERTIFICATE OF COMPLETION</h1>
              
              <div class="w-24 h-0.5 bg-indigo-900 mx-auto my-2"></div>
              
              <p class="text-xs text-slate-500 italic mt-4">This document officially certifies that</p>
              
              <h2 class="text-2xl font-bold font-sans text-slate-800 tracking-tight my-2">ENIYAN RAJESH</h2>
              
              <p class="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                has successfully resolved all secure programming tasks and passed the final proctored examination for the subject
              </p>
              
              <h3 class="text-base font-bold text-indigo-900 tracking-wide my-3 font-mono">${targetCert.course}</h3>
              
              <p class="text-xs text-slate-500">
                conducted on <strong class="text-slate-700">${targetCert.date}</strong> with an evaluation accuracy of <strong class="text-slate-700">${targetCert.score}</strong>.
              </p>
            </div>

            <!-- Signature and Stamp block -->
            <div class="flex justify-between items-end pt-8 border-t border-slate-200 text-xs">
              <div class="text-left space-y-1">
                <div class="font-serif italic text-slate-800 font-bold">Dr. Sarah Jenkins</div>
                <div class="w-24 h-px bg-slate-400"></div>
                <div class="text-[10px] text-slate-500">Subject Invigilator</div>
              </div>
              
              <!-- Cryptographic Stamp -->
              <div class="text-center space-y-1">
                <div class="w-12 h-12 rounded-full border-4 border-dashed border-indigo-600 mx-auto flex items-center justify-center text-[9px] font-bold text-indigo-600 rotate-12">
                  SECURE
                </div>
                <div class="text-[9px] font-mono text-slate-400">ID: ${targetCert.uuid}</div>
              </div>

              <div class="text-right space-y-1">
                <div class="font-serif italic text-slate-800 font-bold">CodeSphere Board</div>
                <div class="w-24 h-px bg-slate-400"></div>
                <div class="text-[10px] text-slate-500">System Director</div>
              </div>
            </div>

            <!-- Modal Print footer -->
            <div class="flex justify-end items-center gap-2 pt-4 border-t border-slate-100 print:hidden">
              <button id="cert-modal-print-btn" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/10 active:scale-95 transition flex items-center gap-1.5">
                <i data-lucide="printer" class="w-3.5 h-3.5"></i>
                Print Document
              </button>
            </div>

          </div>
        </div>
      ` : ''}

    </div>
  `;
}

export function bindCertificatesEvents(state) {
  // Open certificate
  document.querySelectorAll('[data-open-certificate-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const certId = e.currentTarget.getAttribute('data-open-certificate-id');
      updateState({ activeCertificateId: certId });
    });
  });

  // Close certificate
  document.getElementById('cert-modal-close')?.addEventListener('click', () => {
    updateState({ activeCertificateId: null });
  });

  // Print certificate
  document.getElementById('cert-modal-print-btn')?.addEventListener('click', () => {
    window.print();
  });
}
