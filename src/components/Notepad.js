// CodeSphere Pro - Draggable Floating Lined Notepad Widget
import { updateState, saveState } from '../state.js';

let isMinimized = false;
let notepadPosition = { x: null, y: null }; // Will default to bottom-right if null

export function Notepad(state) {
  if (!state.isLoggedIn || !state.notepadOpen) return '';

  const notes = state.notepadNotes || '';
  const displayStyle = notepadPosition.x !== null 
    ? `position: fixed; left: ${notepadPosition.x}px; top: ${notepadPosition.y}px; margin: 0;`
    : `position: fixed; right: 24px; bottom: 24px;`;

  return `
    <div 
      id="codesphere-notepad-widget" 
      class="w-80 glass-panel border border-slate-700/60 rounded-2xl shadow-glass flex flex-col z-50 overflow-hidden group select-none transition-all duration-150"
      style="${displayStyle} transform: translate3d(0,0,0); height: ${isMinimized ? '44px' : '400px'};"
    >
      
      <!-- Notepad Title Bar (Drag Handle) -->
      <div 
        id="notepad-drag-header" 
        class="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 px-4 py-2.5 flex items-center justify-between border-b border-slate-800/80 cursor-move"
      >
        <div class="flex items-center gap-2 pointer-events-none">
          <div class="w-4 h-4 rounded bg-indigo-500/20 flex items-center justify-center">
            <i data-lucide="notebook-pen" class="w-3 h-3 text-indigo-400"></i>
          </div>
          <span class="text-xs font-bold text-slate-200 tracking-wide">Scratchpad / Notepad</span>
        </div>
        <div class="flex items-center gap-1.5">
          <button id="notepad-save-btn" title="Save as file" class="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-indigo-400 transition">
            <i data-lucide="download" class="w-3.5 h-3.5"></i>
          </button>
          <button id="notepad-clear-btn" title="Clear notes" class="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-rose-400 transition">
            <i data-lucide="trash-2" class="w-3 h-3"></i>
          </button>
          <button id="notepad-minimize-btn" title="${isMinimized ? 'Expand' : 'Collapse'}" class="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition">
            <i data-lucide="${isMinimized ? 'maximize-2' : 'minimize-2'}" class="w-3 h-3"></i>
          </button>
          <button id="notepad-close-btn" title="Close notepad" class="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-rose-400 transition">
            <i data-lucide="x" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>

      <!-- Spiral Binder Decoration (Only visible when expanded) -->
      ${!isMinimized ? `
        <div class="h-4 bg-slate-950/80 flex items-center justify-around px-6 border-b border-slate-900/60 relative z-10">
          ${Array(6).fill(0).map(() => `
            <!-- Spirals kapsul decoration -->
            <div class="w-2.5 h-6 rounded-full bg-gradient-to-b from-slate-400 via-slate-300 to-slate-500 border border-slate-600/40 shadow-inner -mt-1 relative z-20"></div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Notepad Body (Lined Paper sheet) -->
      <div 
        id="notepad-body"
        class="flex-grow flex flex-col relative overflow-hidden bg-sky-50/95 dark:bg-slate-900/95"
        style="${isMinimized ? 'display: none;' : ''}"
      >
        <!-- Lined Paper Lines Background Pattern -->
        <div class="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10 notepad-lines-bg"></div>
        
        <!-- Textarea input -->
        <textarea 
          id="notepad-textarea"
          class="w-full h-full p-4 bg-transparent outline-none border-none resize-none font-mono text-xs leading-6 text-slate-800 dark:text-slate-200 placeholder-slate-400/80"
          placeholder="Type your notes or scratchpad code here..."
          spellcheck="false"
        >${notes}</textarea>

      </div>
      
    </div>

    <!-- Custom CSS for the lined paper pattern -->
    <style>
      .notepad-lines-bg {
        background: repeating-linear-gradient(
          transparent,
          transparent 23px,
          rgba(147, 197, 253, 0.6) 23px,
          rgba(147, 197, 253, 0.6) 24px
        );
      }
      #notepad-textarea {
        line-height: 24px;
        padding-top: 12px;
      }
    </style>
  `;
}

export function bindNotepadEvents(state) {
  const notepad = document.getElementById('codesphere-notepad-widget');
  const header = document.getElementById('notepad-drag-header');
  const textarea = document.getElementById('notepad-textarea');

  if (!notepad) return;

  // 1. Textarea Autosave (Mutates state directly to prevent full app re-render which causes loss of focus/cursor)
  textarea?.addEventListener('input', (e) => {
    state.notepadNotes = e.target.value;
    saveState();
  });

  // Save as File
  document.getElementById('notepad-save-btn')?.addEventListener('click', () => {
    const text = textarea ? textarea.value : (state.notepadNotes || '');
    if (!text.trim()) {
      alert('Cannot save empty notes.');
      return;
    }
    let filename = prompt('Enter filename to save:', 'codesphere_notes.txt');
    if (filename === null) return; // User cancelled
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
  });

  // 2. Clear Button
  document.getElementById('notepad-clear-btn')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear your scratchpad notes?')) {
      updateState({ notepadNotes: '' });
    }
  });

  // 3. Minimize Button
  document.getElementById('notepad-minimize-btn')?.addEventListener('click', () => {
    isMinimized = !isMinimized;
    updateState({}); // Trigger re-render to minimized height
  });

  // 4. Close Button
  document.getElementById('notepad-close-btn')?.addEventListener('click', () => {
    updateState({ notepadOpen: false });
  });

  // 5. Draggable Window Behavior
  let activeDrag = false;
  let startX = 0, startY = 0;
  let initialX = 0, initialY = 0;

  header?.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', dragMove);
  document.addEventListener('mouseup', dragEnd);

  header?.addEventListener('touchstart', dragStart, { passive: true });
  document.addEventListener('touchmove', dragMove, { passive: false });
  document.addEventListener('touchend', dragEnd);

  function dragStart(e) {
    if (e.target.closest('button')) return; // Avoid drag on button clicks
    activeDrag = true;

    // Get current fixed bounding rect
    const rect = notepad.getBoundingClientRect();
    initialX = rect.left;
    initialY = rect.top;

    if (e.type === 'touchstart') {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    } else {
      startX = e.clientX;
      startY = e.clientY;
    }
    
    notepad.classList.add('shadow-glow-indigo', 'scale-[1.01]');
  }

  function dragMove(e) {
    if (!activeDrag) return;

    if (e.type === 'touchmove') {
      e.preventDefault(); // Prevent scroll while dragging
    }

    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

    const dx = clientX - startX;
    const dy = clientY - startY;

    let newX = initialX + dx;
    let newY = initialY + dy;

    // Bound inside viewport
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const widgetW = notepad.offsetWidth;
    const widgetH = notepad.offsetHeight;

    newX = Math.max(0, Math.min(newX, viewportW - widgetW));
    newY = Math.max(0, Math.min(newY, viewportH - widgetH));

    notepadPosition = { x: newX, y: newY };
    
    notepad.style.left = `${newX}px`;
    notepad.style.top = `${newY}px`;
    notepad.style.right = 'auto';
    notepad.style.bottom = 'auto';
  }

  function dragEnd() {
    if (!activeDrag) return;
    activeDrag = false;
    notepad.classList.remove('shadow-glow-indigo', 'scale-[1.01]');
  }
}
