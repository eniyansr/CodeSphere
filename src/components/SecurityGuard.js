// CodeSphere Pro - Security Lockdown Monitoring Guards
import { updateState, state } from '../state.js';

export function setupSecurityGuards() {
  
  // 1. Tab Focus Blurs Monitoring
  window.addEventListener('blur', () => {
    if (!state.isLockdownActive) return;

    // Trigger tab-swap policy warning
    const stamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const newLog = {
      timestamp: stamp,
      user: "Eniyan Rajesh",
      event: "Tab Switch Flag",
      details: "Candidate navigated away from proctored exam workspace tab.",
      severity: "warning"
    };

    const count = state.warningsCount + 1;
    
    // Alert warnings overlay
    alert(`SECURITY WARNING #${count}:\n- Leaving the secure exam window violates code assessment rules.\n- Tab switches are logged for teacher/invigilator audits.`);

    updateState({
      warningsCount: count,
      securityLogs: [newLog, ...state.securityLogs]
    });
  });

  // 2. Clipboard Controls Blocking
  document.addEventListener('copy', (e) => {
    if (!state.isLockdownActive) return;
    e.preventDefault();
    logClipboardAction("Clipboard Copy Blocked");
    alert("CLIPBOARD LOCKDOWN: Copy operations are restricted during secure exams.");
  });

  document.addEventListener('paste', (e) => {
    e.preventDefault();
    logClipboardAction("Clipboard Paste Blocked");
    alert("CLIPBOARD LOCKDOWN: Paste operations are restricted on this secure website.");
  });

  document.addEventListener('cut', (e) => {
    if (!state.isLockdownActive) return;
    e.preventDefault();
    alert("CLIPBOARD LOCKDOWN: Cut operations are restricted during secure exams.");
  });

  // 3. Right Click context menus blocker
  document.addEventListener('contextmenu', (e) => {
    if (!state.isLockdownActive) return;
    e.preventDefault();
    logClipboardAction("Right Click Blocked");
    alert("INSPECTION SHIELD: Context menus are disabled in lockdown mode.");
  });

  // 4. Drag & Drop blocking
  document.addEventListener('dragstart', (e) => {
    if (!state.isLockdownActive) return;
    e.preventDefault();
  });
  document.addEventListener('drop', (e) => {
    if (!state.isLockdownActive) return;
    e.preventDefault();
  });

  // 5. Keydown controls blocker (Developer Tools, Screenshots, copy/paste shortcuts)
  document.addEventListener('keydown', (e) => {
    // Block Ctrl+V / Cmd+V globally
    if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
      e.preventDefault();
      logClipboardAction("Ctrl+V Paste Combination Blocked");
      alert("CLIPBOARD LOCKDOWN: Paste operations (Ctrl+V) are restricted on this secure website.");
      return;
    }

    if (!state.isLockdownActive) return;

    // Block F12, Ctrl+Shift+I, Ctrl+Shift+C (inspectors)
    const isInspect = (e.key === 'F12') || 
                      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'C' || e.key === 'c' || e.key === 'J' || e.key === 'j')) ||
                      (e.ctrlKey && (e.key === 'U' || e.key === 'u')); // View Source

    if (isInspect) {
      e.preventDefault();
      logClipboardAction("Developer Tools Blocked");
      alert("SECURITY SHIELD: Developer tools access is locked in proctored session.");
    }
  });
}

function logClipboardAction(eventTitle) {
  const stamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const clipLog = {
    timestamp: stamp,
    user: "Eniyan Rajesh",
    event: "Security Block",
    details: `Restricted key/context attempt triggered: ${eventTitle}`,
    severity: "warning"
  };

  updateState({
    securityLogs: [clipLog, ...state.securityLogs]
  });
}
