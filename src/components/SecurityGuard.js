// CodeSphere Pro - Security Lockdown Monitoring Guards (React Hook Edition)
// Guards are ONLY active during an explicit exam lockdown (state.isLockdownActive === true).
// All browser-blocking alerts are replaced with silent log entries or on-page toasts
// so normal browsing (DevTools, tab switching before an exam) is never interrupted.
import React, { useEffect, useRef } from 'https://esm.sh/react@18.2.0';

// ─── Lightweight toast (no alert() so the UI never freezes) ──────────────────
function showExamToast(message) {
  const existing = document.getElementById('cs-exam-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'cs-exam-toast';
  toast.style.cssText = [
    'position:fixed', 'top:1rem', 'left:50%', 'transform:translateX(-50%)',
    'background:#1e293b', 'color:#f8fafc', 'padding:.75rem 1.5rem',
    'border-radius:12px', 'font-family:system-ui,sans-serif', 'font-size:.9rem',
    'font-weight:600', 'box-shadow:0 8px 24px rgba(0,0,0,.35)',
    'border:1px solid #e5484d', 'z-index:999999',
    'max-width:90vw', 'text-align:center', 'pointer-events:none'
  ].join(';');
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

export function useSecurityGuards(state, updateState) {
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    // Helper: returns true only during an active proctored exam session
    const isExamActive = () =>
      stateRef.current.isLoggedIn && stateRef.current.isLockdownActive;

    const addLog = (event, details) => {
      const stamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const currentState = stateRef.current;
      const log = {
        timestamp: stamp,
        user: currentState.googleUser ? currentState.googleUser.name : 'Student',
        event,
        details,
        severity: 'warning'
      };
      updateState({ securityLogs: [log, ...currentState.securityLogs] });
    };

    // 1. Tab / window blur — only during exam lockdown
    const handleBlur = () => {
      if (!isExamActive()) return;
      const count = stateRef.current.warningsCount + 1;
      updateState({ warningsCount: count });
      addLog('Tab Switch Flag', 'Candidate navigated away from proctored exam workspace.');
      showExamToast(`⚠ Warning #${count}: Tab switches are logged during exams.`);
    };

    // 2. Clipboard — only during exam lockdown
    const handleCopy = (e) => {
      if (!isExamActive()) return;
      e.preventDefault();
      addLog('Clipboard Copy Blocked', 'Copy attempt during lockdown.');
      showExamToast('🔒 Copy is disabled during secure exams.');
    };

    const handlePaste = (e) => {
      if (!isExamActive()) return;
      e.preventDefault();
      addLog('Clipboard Paste Blocked', 'Paste attempt during lockdown.');
      showExamToast('🔒 Paste is disabled during secure exams.');
    };

    const handleCut = (e) => {
      if (!isExamActive()) return;
      e.preventDefault();
      addLog('Clipboard Cut Blocked', 'Cut attempt during lockdown.');
      showExamToast('🔒 Cut is disabled during secure exams.');
    };

    // 3. Right-click — only during exam lockdown
    const handleContextMenu = (e) => {
      if (!isExamActive()) return;
      e.preventDefault();
      addLog('Right Click Blocked', 'Context menu attempt during lockdown.');
    };

    // 4. Drag & Drop — only during exam lockdown
    const handleDragStart = (e) => { if (!isExamActive()) return; e.preventDefault(); };
    const handleDrop     = (e) => { if (!isExamActive()) return; e.preventDefault(); };

    // 5. Keyboard shortcuts — only during exam lockdown
    const handleKeyDown = (e) => {
      if (!isExamActive()) return;

      // Block Ctrl+C / Ctrl+V / Ctrl+X
      if ((e.ctrlKey || e.metaKey) && ['c', 'C', 'v', 'V', 'x', 'X'].includes(e.key)) {
        e.preventDefault();
        addLog('Hotkey Blocked', `${e.ctrlKey ? 'Ctrl' : 'Cmd'}+${e.key.toUpperCase()} during lockdown.`);
        showExamToast('🔒 Clipboard shortcuts are restricted during exams.');
        return;
      }

      // Block DevTools shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U)
      const isDevTools =
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['i','I','j','J','c','C'].includes(e.key)) ||
        (e.ctrlKey && ['u','U'].includes(e.key));

      if (isDevTools) {
        e.preventDefault();
        addLog('DevTools Blocked', 'Developer tools hotkey during lockdown.');
        showExamToast('🔒 Developer tools are locked during proctored sessions.');
      }
    };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('drop', handleDrop);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('drop', handleDrop);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [updateState]);
}
