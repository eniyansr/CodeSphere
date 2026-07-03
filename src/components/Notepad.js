// CodeSphere Pro - Draggable Floating Lined Notepad Widget (React Edition)
import React, { useState, useRef, useEffect } from 'https://esm.sh/react@18.2.0';
import { html, useAppState } from '../state.js';

export function Notepad() {
  const { state, updateState } = useAppState();
  const [minimized, setMinimized] = useState(false);
  const [position, setPosition] = useState({ x: null, y: null });
  const [activeDrag, setActiveDrag] = useState(false);

  const notepadRef = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });

  if (!state.isLoggedIn || !state.notepadOpen) return '';

  const displayStyle = position.x !== null 
    ? `position: fixed; left: ${position.x}px; top: ${position.y}px; margin: 0;`
    : `position: fixed; right: 24px; bottom: 24px;`;

  const handleNotesChange = (e) => {
    updateState({ notepadNotes: e.target.value });
  };

  const handleSave = () => {
    const text = state.notepadNotes || '';
    if (!text.trim()) {
      alert('Cannot save empty notes.');
      return;
    }
    let filename = prompt('Enter filename to save:', 'codesphere_notes.txt');
    if (filename === null) return;
    if (!filename.trim()) filename = 'codesphere_notes.txt';
    if (!filename.endsWith('.txt')) filename += '.txt';

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear your scratchpad notes?')) {
      updateState({ notepadNotes: '' });
    }
  };

  const dragStart = (e) => {
    if (e.target.closest('button')) return;
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
      if (e.type === 'touchmove') {
        e.preventDefault();
      }

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

      newX = Math.max(0, Math.min(newX, viewportW - widgetW));
      newY = Math.max(0, Math.min(newY, viewportH - widgetH));

      setPosition({ x: newX, y: newY });
    };

    const dragEnd = () => {
      setActiveDrag(false);
    };

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

  return html`
    <div 
      ref=${notepadRef}
      id="codesphere-notepad-widget" 
      className=${`w-80 glass-panel border border-slate-700/60 rounded-2xl shadow-glass flex flex-col z-50 overflow-hidden group select-none transition-all duration-150 ${
        activeDrag ? 'shadow-glow-indigo scale-[1.01]' : ''
      }`}
      style=${`${displayStyle} transform: translate3d(0,0,0); height: ${minimized ? '44px' : '400px'};`}
    >
      <!-- Notepad Title Bar (Drag Handle) -->
      <div 
        onMouseDown=${dragStart}
        onTouchStart=${dragStart}
        className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 px-4 py-2.5 flex items-center justify-between border-b border-slate-800/80 cursor-move"
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <div className="w-4 h-4 rounded bg-indigo-500/20 flex items-center justify-center">
            <i data-lucide="notebook-pen" className="w-3 h-3 text-indigo-400"></i>
          </div>
          <span className="text-xs font-bold text-slate-200 tracking-wide">Scratchpad / Notepad</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick=${handleSave} title="Save as file" className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-indigo-400 transition">
            <i data-lucide="download" className="w-3.5 h-3.5"></i>
          </button>
          <button onClick=${handleClear} title="Clear notes" className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-rose-400 transition">
            <i data-lucide="trash-2" className="w-3 h-3"></i>
          </button>
          <button onClick=${() => setMinimized(!minimized)} title=${minimized ? 'Expand' : 'Collapse'} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition">
            <i data-lucide=${minimized ? 'maximize-2' : 'minimize-2'} className="w-3 h-3"></i>
          </button>
          <button onClick=${() => updateState({ notepadOpen: false })} title="Close notepad" className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-rose-400 transition">
            <i data-lucide="x" className="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>

      <!-- Spiral Binder Decoration -->
      ${!minimized && html`
        <div className="h-4 bg-slate-950/80 flex items-center justify-around px-6 border-b border-slate-900/60 relative z-10">
          ${Array(6).fill(0).map((_, i) => html`
            <div key=${i} className="w-2.5 h-6 rounded-full bg-gradient-to-b from-slate-400 via-slate-300 to-slate-500 border border-slate-600/40 shadow-inner -mt-1 relative z-20"></div>
          `)}
        </div>
      `}

      <!-- Notepad Body (Lined Paper sheet) -->
      <div 
        className="flex-grow flex flex-col relative overflow-hidden bg-sky-50/95 dark:bg-slate-900/95"
        style=${minimized ? { display: 'none' } : {}}
      >
        <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10 notepad-lines-bg"></div>
        <textarea 
          value=${state.notepadNotes || ''}
          onChange=${handleNotesChange}
          className="w-full h-full p-4 bg-transparent outline-none border-none resize-none font-mono text-xs leading-6 text-slate-800 dark:text-slate-200 placeholder-slate-400/80"
          placeholder="Type your notes or scratchpad code here..."
          spellCheck="false"
          style=${{ lineHeight: '24px', paddingTop: '12px' }}
        />
      </div>

      <!-- Styles local to notepad -->
      <style dangerouslySetInnerHTML=${{ __html: `
        .notepad-lines-bg {
          background: repeating-linear-gradient(
            transparent,
            transparent 23px,
            rgba(147, 197, 253, 0.6) 23px,
            rgba(147, 197, 253, 0.6) 24px
          );
        }
      ` }} />
    </div>
  `;
}
