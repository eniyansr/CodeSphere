// CodeSphere Pro - Security Lockdown Monitoring Guards (React Hook Edition)
import React, { useEffect, useRef } from 'https://esm.sh/react@18.2.0';

export function useSecurityGuards(state, updateState) {
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    // 1. Tab Focus Blurs Monitoring
    const handleBlur = () => {
      const currentState = stateRef.current;
      if (!currentState.isLockdownActive) return;

      // Trigger tab-swap policy warning
      const stamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const newLog = {
        timestamp: stamp,
        user: currentState.googleUser ? currentState.googleUser.name : "Student",
        event: "Tab Switch Flag",
        details: "Candidate navigated away from proctored exam workspace tab.",
        severity: "warning"
      };

      const count = currentState.warningsCount + 1;
      
      // Alert warnings overlay
      alert(`SECURITY WARNING #${count}:\n- Leaving the secure exam window violates code assessment rules.\n- Tab switches are logged for teacher/invigilator audits.`);

      updateState({
        warningsCount: count,
        securityLogs: [newLog, ...currentState.securityLogs]
      });
    };

    // 2. Clipboard Controls Blocking
    const handleCopy = (e) => {
      const currentState = stateRef.current;
      if (!currentState.isLockdownActive) return;
      e.preventDefault();
      logClipboardAction("Clipboard Copy Blocked");
      alert("CLIPBOARD LOCKDOWN: Copy operations are restricted during secure exams.");
    };

    const handlePaste = (e) => {
      e.preventDefault();
      logClipboardAction("Clipboard Paste Blocked");
      alert("CLIPBOARD LOCKDOWN: Paste operations are restricted on this secure website.");
    };

    const handleCut = (e) => {
      const currentState = stateRef.current;
      if (!currentState.isLockdownActive) return;
      e.preventDefault();
      alert("CLIPBOARD LOCKDOWN: Cut operations are restricted during secure exams.");
    };

    // 3. Right Click context menus blocker
    const handleContextMenu = (e) => {
      const currentState = stateRef.current;
      if (!currentState.isLockdownActive) return;
      e.preventDefault();
      logClipboardAction("Right Click Blocked");
      alert("INSPECTION SHIELD: Context menus are disabled in lockdown mode.");
    };

    // 4. Drag & Drop blocking
    const handleDragStart = (e) => {
      const currentState = stateRef.current;
      if (!currentState.isLockdownActive) return;
      e.preventDefault();
    };
    const handleDrop = (e) => {
      const currentState = stateRef.current;
      if (!currentState.isLockdownActive) return;
      e.preventDefault();
    };

    // 5. Keydown controls blocker (Developer Tools, Screenshots, copy/paste shortcuts)
    const handleKeyDown = (e) => {
      const currentState = stateRef.current;
      // Block Ctrl+V / Cmd+V globally
      if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        logClipboardAction("Ctrl+V Paste Combination Blocked");
        alert("CLIPBOARD LOCKDOWN: Paste operations (Ctrl+V) are restricted on this secure website.");
        return;
      }

      if (!currentState.isLockdownActive) return;

      // Block F12, Ctrl+Shift+I, Ctrl+Shift+C (inspectors)
      const isInspect = (e.key === 'F12') || 
                        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'C' || e.key === 'c' || e.key === 'J' || e.key === 'j')) ||
                        (e.ctrlKey && (e.key === 'U' || e.key === 'u')); // View Source

      if (isInspect) {
        e.preventDefault();
        logClipboardAction("Developer Tools Blocked");
        alert("SECURITY SHIELD: Developer tools access is locked in proctored session.");
      }
    };

    const logClipboardAction = (eventTitle) => {
      const currentState = stateRef.current;
      const stamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const clipLog = {
        timestamp: stamp,
        user: currentState.googleUser ? currentState.googleUser.name : "Student",
        event: "Security Block",
        details: `Restricted key/context attempt triggered: ${eventTitle}`,
        severity: "warning"
      };

      updateState({
        securityLogs: [clipLog, ...currentState.securityLogs]
      });
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
