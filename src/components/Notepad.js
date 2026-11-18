// CodeSphere Pro - 3D Tactile Floating Lined Notepad Widget with E2EE (React Edition)
import React, { useState, useRef, useEffect } from 'https://esm.sh/react@18.2.0';
import { html, useAppState } from '../state.js';
import { saveEncryptedNote, loadEncryptedNote } from '../services/encryption-service.js';

export function Notepad() {
  const { state, updateState } = useAppState();
  const [minimized, setMinimized] = useState(false);
  const [position, setPosition] = useState({ x: null, y: null });
  const [activeDrag, setActiveDrag] = useState(false);
  const [encryptStatus, setEncryptStatus] = useState('saved'); // 'saved' | 'saving' | 'error'

  const notepadRef = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });
  const saveTimeout = useRef(null);

  const displayStyle = position.x !== null 
    ? { position: 'fixed', left: `${position.x}px`, top: `${position.y}px`, margin: 0, zIndex: 9999 }
    : { position: 'fixed', right: '28px', bottom: '28px', zIndex: 9999 };

  // Load existing encrypted note on mount
  useEffect(() => {
    if (state.googleUser && state.googleUser.id) {
      loadEncryptedNote(state.googleUser.id).then(note => {
        if (note !== null && note !== undefined) {
          updateState({ notepadNotes: note });
        }
      });
    }
  }, [state.googleUser]);

  const handleNotesChange = (e) => {
    const text = e.target.value;
    updateState({ notepadNotes: text });
    setEncryptStatus('saving');

    // Debounced automatic E2EE encryption to D1
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      try {
        const uid = (state.googleUser && state.googleUser.id) || 'local-user';
        await saveEncryptedNote(uid, text);
        setEncryptStatus('saved');
      } catch (err) {
        setEncryptStatus('error');
      }
    }, 1200);
  };

  const handleSaveExport = () => {
    const text = state.notepadNotes || '';
    if (!text.trim()) {
      alert('Cannot export empty scratchpad.');
      return;
    }
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `codesphere_encrypted_notes_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear your scratchpad notes?')) {
      updateState({ notepadNotes: '' });
      const uid = (state.googleUser && state.googleUser.id) || 'local-user';
      saveEncryptedNote(uid, '');
    }
  };

  const dragStart = (e) => {
    if (e.target.closest('button') || e.target.closest('textarea')) return;
    setActiveDrag(true);

    const rect = notepadRef.current.getBoundingClientRect();
    initialPos.current = { x: rect.left, y: rect.top };

    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    startPos.current = { x: clientX, y: clientY };
  };

  useEffect(() => {
    if (!activeDrag) return;

    const dragMove = (e) => {
      if (e.type === 'touchmove') e.preventDefault();

      const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
      const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

      const dx = clientX - startPos.current.x;
      const dy = clientY - startPos.current.y;

      let newX = initialPos.current.x + dx;
      let newY = initialPos.current.y + dy;

      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;
      const widgetW = notepadRef.current.offsetWidth;
      const widgetH = notepadRef.current.offsetHeight;

      newX = Math.max(10, Math.min(newX, viewportW - widgetW - 10));
      newY = Math.max(10, Math.min(newY, viewportH - widgetH - 10));

      setPosition({ x: newX, y: newY });
    };

    const dragEnd = () => setActiveDrag(false);

    document.addEventListener('mousemove', dragMove);
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchmove', dragMove, { passive: false });
    document.addEventListener('touchend', dragEnd);

    return () => {
      document.removeEventListener('mousemove', dragMove);
      document.removeEventListener('mouseup', dragEnd);
      document.removeEventListener('touchmove', dragMove);
      document.removeEventListener('touchend', dragEnd);
    };
  }, [activeDrag]);

  if (!state.notepadOpen) return null;

  return html`
    <div
      ref=${notepadRef}
      style=${{
        ...displayStyle,
        background: '#FFFFFF',
        borderRadius: '24px',
        border: '1px solid #D5DEF2',
        boxShadow: '0 1px 0 #fff inset, 0 10px 0 -2px #CBD5EE, 0 32px 48px -16px rgba(22, 33, 62, 0.35)',
        width: '380px',
        color: '#16213E'
      }}
      className="flex flex-col select-none overflow-hidden transition-all duration-150 animate-in fade-in"
    >
      <!-- Header Bar with Drag Handle -->
      <div
        onMouseDown=${dragStart}
        onTouchStart=${dragStart}
        className="flex items-center justify-between px-4 py-3 bg-[#EEF3FD] border-b border-[#D5DEF2] cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm"
               style=${{ boxShadow: '0 2px 0 #3730A3' }}>
            <i data-lucide="lock" className="w-4 h-4"></i>
          </div>
          <div>
            <h4 className="text-sm font-bold leading-tight">E2EE Scratchpad</h4>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-600 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>${encryptStatus === 'saving' ? 'Encrypting & Saving...' : 'AES-256-GCM Locked'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick=${() => setMinimized(!minimized)}
            className="w-7 h-7 rounded-lg hover:bg-white text-[#566180] flex items-center justify-center transition-colors"
            title=${minimized ? 'Expand' : 'Minimize'}
          >
            <i data-lucide=${minimized ? 'maximize-2' : 'minus'} className="w-3.5 h-3.5"></i>
          </button>
          <button
            onClick=${() => updateState({ notepadOpen: false })}
            className="w-7 h-7 rounded-lg hover:bg-rose-50 text-rose-500 flex items-center justify-center transition-colors"
            title="Close"
          >
            <i data-lucide="x" className="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>

      <!-- Notepad Content -->
      ${!minimized && html`
        <div className="p-4 flex flex-col gap-3">
          <div className="relative rounded-2xl border border-[#D5DEF2] overflow-hidden"
               style=${{
                 background: '#FAFBFD',
                 backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #E2E8F5 28px)',
                 boxShadow: 'inset 0 2px 4px rgba(22, 33, 62, 0.04)'
               }}>
            <textarea
              value=${state.notepadNotes || ''}
              onInput=${handleNotesChange}
              placeholder="Write personal algorithms, exam scratch code, or notes. Content is locally encrypted with your private key before transmission..."
              rows="9"
              className="w-full bg-transparent p-3.5 text-xs font-mono text-[#16213E] focus:outline-none resize-none leading-7"
            ></textarea>
          </div>

          <!-- Bottom Actions -->
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              onClick=${handleClear}
              className="chip text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
              title="Clear scratchpad"
            >
              <i data-lucide="trash-2" className="w-3.5 h-3.5"></i>
              <span>Clear</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick=${handleSaveExport}
                className="chip text-xs text-[#16213E] hover:bg-slate-50"
                title="Export as plaintext file"
              >
                <i data-lucide="download" className="w-3.5 h-3.5"></i>
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      `}
    </div>
  `;
}
