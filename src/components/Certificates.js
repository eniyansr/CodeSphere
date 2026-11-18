// CodeSphere Pro - 3D Tactile Skill Certificates Module (React Edition)
import React, { useState } from 'https://esm.sh/react@18.2.0';
import { html, useAppState, TRANSLATIONS } from '../state.js';

export function Certificates() {
  const { state, updateState } = useAppState();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.en;

  const mockCerts = [
    {
      id: "cert-201",
      course: "CS-101: Fundamentals of Computer Science",
      date: "2026-06-20",
      score: "95%",
      uuid: "CSP-8820-9178-AB30",
      signature: "ECDSA-P256-SHA256:4a8b...9f2c"
    },
    {
      id: "cert-202",
      course: "DSA-202: Data Structures & Algorithms",
      date: "2026-06-22",
      score: "90%",
      uuid: "CSP-7820-1928-XY22",
      signature: "ECDSA-P256-SHA256:8b3e...1c7d"
    }
  ];

  const viewCertId = state.activeCertificateId || null;
  const targetCert = mockCerts.find(c => c.id === viewCertId);

  const handleOpenCert = (certId) => {
    updateState({ activeCertificateId: certId });
  };

  const handleCloseCert = () => {
    updateState({ activeCertificateId: null });
  };

  return html`
    <div className="flex-grow p-4 md:p-8 bg-[#F4F7FE] overflow-y-auto">
      
      <!-- Top Title -->
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#16213E] tracking-tight">Verified Skill Certificates</h2>
        <p className="text-sm font-semibold text-[#566180] mt-0.5">Claim, export, or print cryptographically signed academic credentials</p>
      </div>

      <!-- Certificate Grid -->
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${mockCerts.map(cert => html`
          <div
            key=${cert.id}
            className="bg-white rounded-3xl p-6 border border-[#D5DEF2] flex flex-col justify-between"
            style=${{ boxShadow: '0 1px 0 #fff inset, 0 8px 0 -2px #CBD5EE, 0 28px 36px -18px rgba(22, 33, 62, 0.22)' }}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  DIGITALLY SIGNED
                </span>
                <span className="font-mono text-xs font-bold text-indigo-600">${cert.uuid}</span>
              </div>

              <h3 className="text-base font-extrabold text-[#16213E] mb-2">${cert.course}</h3>
              <p className="text-xs text-[#566180] mb-4">
                Completed on ${cert.date} with evaluation score of ${cert.score}. Verified with ECDSA P-256 digital signature.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#D5DEF2]">
              <span className="text-[11px] font-mono text-[#566180] truncate max-w-[180px]">${cert.signature}</span>
              <button
                onClick=${() => handleOpenCert(cert.id)}
                className="chip text-xs font-bold text-indigo-600 hover:bg-indigo-50"
              >
                <i data-lucide="eye" className="w-3.5 h-3.5"></i>
                <span>View Certificate</span>
              </button>
            </div>
          </div>
        `)}
      </div>

      <!-- Certificate Full View Modal -->
      ${targetCert && html`
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full border-4 border-indigo-600 text-center relative select-text"
               style=${{ boxShadow: '0 1px 0 #fff inset, 0 10px 0 -2px #3730A3, 0 32px 48px -16px rgba(22,33,62,0.35)' }}>
            
            <button
              onClick=${handleCloseCert}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
            >
              <i data-lucide="x" className="w-4 h-4"></i>
            </button>

            <div className="text-[10px] font-mono font-bold tracking-widest text-indigo-600 uppercase mb-2">
              CodeSphere Academic Credential
            </div>

            <h2 className="text-2xl font-serif font-black text-[#16213E] mb-1">CERTIFICATE OF EXCELLENCE</h2>
            <div className="w-20 h-0.5 bg-indigo-600 mx-auto mb-6"></div>

            <p className="text-xs text-[#566180] italic">This certifies that</p>
            <h3 className="text-xl font-extrabold text-[#16213E] my-2">
              ${((state.googleUser && state.googleUser.name) || 'Eniyan Rajesh').toUpperCase()}
            </h3>

            <p className="text-xs text-[#566180] max-w-md mx-auto leading-relaxed mb-4">
              has demonstrated technical proficiency and successfully completed all proctored assessment requirements for
            </p>

            <div className="text-sm font-bold font-mono text-indigo-900 bg-indigo-50 py-2 px-4 rounded-xl border border-indigo-200 inline-block mb-6">
              ${targetCert.course}
            </div>

            <div className="flex justify-between items-end border-t border-[#D5DEF2] pt-6 text-xs text-left">
              <div>
                <div className="font-bold text-[#16213E]">CodeSphere Verification Authority</div>
                <div className="font-mono text-[10px] text-[#566180]">${targetCert.uuid}</div>
              </div>

              <div className="text-right">
                <button
                  onClick=${() => window.print()}
                  className="btn text-xs px-4 py-2"
                  style=${{ width: 'auto' }}
                >
                  Print / Export PDF
                </button>
              </div>
            </div>

          </div>
        </div>
      `}

    </div>
  `;
}
