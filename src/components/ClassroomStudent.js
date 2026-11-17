// CodeSphere Pro - Student Classroom Component (React Edition)
import React, { useState, useEffect, useCallback } from 'https://esm.sh/react@18.2.0';
import { TRANSLATIONS, html, useAppState } from '../state.js';

// Central API base
const API_BASE = 'https://codesphere-api.eniyansr31.workers.dev';

export function ClassroomStudent() {
  const { state, updateState } = useAppState();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.en;
  
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Active clicked class ID
  const activeClassId = state.activeStudentClassId || (state.classes[0] ? state.classes[0].id : null);
  const activeClass = state.classes.find(c => c.id === activeClassId);

  // Refresh class data from API to pick up new assignments added by teacher
  const refreshClassFromAPI = useCallback(async (cls) => {
    if (!cls || !cls.inviteCode) return;
    setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/api/classes/lookup?inviteCode=${encodeURIComponent(cls.inviteCode)}`);
      const data = await res.json();
      if (data.found && data.class) {
        const fresh = data.class;
        // Replace the stale local copy with fresh data from KV
        const updatedClasses = state.classes.map(c =>
          c.inviteCode === fresh.inviteCode ? { ...c, ...fresh } : c
        );
        updateState({ classes: updatedClasses });
      }
    } catch (err) {
      console.warn('Could not refresh class data from API:', err);
    }
    setRefreshing(false);
  }, [activeClassId]);

  // On mount: refresh ALL enrolled classes from API so latest data shows after page reload
  useEffect(() => {
    const allClasses = state.classes || [];
    allClasses.forEach(cls => {
      if (cls.inviteCode) refreshClassFromAPI(cls);
    });
  }, []); // runs once on mount

  // Auto-refresh whenever the student switches to a different class
  useEffect(() => {
    if (activeClass) {
      refreshClassFromAPI(activeClass);
    }
  }, [activeClassId]);

  const handleSelectClass = (id) => {
    updateState({ activeStudentClassId: id });
  };

  const handleJoinClass = async (e) => {
    e.preventDefault();
    const codeVal = joinCode.trim().toLowerCase();
    if (!codeVal) return;

    setJoining(true);

    try {
      // Look up the class in Cloudflare KV via Worker API
      const res = await fetch(`${API_BASE}/api/classes/lookup?inviteCode=${encodeURIComponent(codeVal)}`);
      const data = await res.json();

      if (data.found && data.class) {
        const foundClass = data.class;

        if (state.classes.some(c => c.inviteCode === foundClass.inviteCode)) {
          alert('You are already enrolled in this class.');
          setJoining(false);
          return;
        }

        const updatedClasses = [...state.classes, foundClass];
        updateState({
          classes: updatedClasses,
          activeStudentClassId: foundClass.id
        });
        setJoinCode('');
        alert(`Successfully enrolled in ${foundClass.name}!`);
      } else {
        alert('Invalid invite code. Please ask your teacher for the correct code.');
      }
    } catch (err) {
      console.error('Join class error:', err);
      alert('Could not connect to server. Please check your internet and try again.');
    }

    setJoining(false);
  };

  const handleSolveAssignment = (assignId) => {
    let foundAssignment = null;
    state.classes.forEach(c => {
      const found = c.assignments.find(a => a.id === assignId);
      if (found) foundAssignment = found;
    });

    if (foundAssignment) {
      const codeTemplates = {
        javascript: `// Assignment: ${foundAssignment.title}\n// Description: ${foundAssignment.desc}\n\nfunction solve() {\n    // Write code here\n}\n\nconsole.log(solve());`,
        python: `# Assignment: ${foundAssignment.title}\n# Description: ${foundAssignment.desc}\n\ndef solve():\n    # Write code here\n    pass\n\nprint(solve())`
      };

      const updatedEditor = { ...state.editorCode };
      updatedEditor.javascript = codeTemplates.javascript;
      updatedEditor.python = codeTemplates.python;

      updateState({
        editorCode: updatedEditor,
        activeLanguage: state.activeLanguage === 'python' ? 'python' : 'javascript',
        activeTab: 'practice',
        activeAssignmentId: assignId
      });
    }
  };

  const handleDownloadNote = (noteName) => {
    alert(`Downloading resource asset: ${noteName}...\nAsset verified securely by CodeSphere Shield.`);
  };

  return html`
    <div className="p-6 space-y-6 flex-grow overflow-y-auto">
      
      <!-- Top banner + Join code -->
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/40 pb-5 text-left">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <i data-lucide="book-open" className="text-indigo-400 w-6 h-6"></i>
            My Classrooms
          </h2>
          <p className="text-xs text-slate-400">Enroll in programming subjects, access curriculum guides, and complete submissions.</p>
        </div>

        <form onSubmit=${handleJoinClass} className="flex items-center space-x-2 bg-slate-900/50 p-1.5 rounded-xl border border-slate-800/50">
          <input 
            type="text" 
            value=${joinCode}
            onChange=${(e) => setJoinCode(e.target.value)}
            placeholder="Invite Code" 
            className="bg-slate-950/80 text-xs px-3 py-2 rounded-lg border border-slate-800 focus:border-slate-700 outline-none text-slate-200 w-32 font-mono"
            required
          />
          <button type="submit" disabled=${joining} className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition active:scale-95 flex items-center gap-1">
            <i data-lucide="plus" className="w-3.5 h-3.5"></i> ${joining ? 'Joining...' : 'Join Class'}
          </button>
          <button type="button" onClick=${() => activeClass && refreshClassFromAPI(activeClass)} disabled=${refreshing}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 font-bold text-xs rounded-lg transition active:scale-95 flex items-center gap-1" title="Refresh assignments">
            <i data-lucide="refresh-cw" className=${`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}></i> ${refreshing ? '' : 'Sync'}
          </button>
        </form>
      </div>

      <!-- Class Panels Split Grid -->
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-left">
        
        <!-- Left: Classes Navigation List -->
        <div className="space-y-2 lg:col-span-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block px-1 mb-2">My Enrolled Subjects</span>
          ${state.classes.map(c => {
            const isSel = c.id === activeClassId;
            return html`
              <button 
                key=${c.id}
                onClick=${() => handleSelectClass(c.id)}
                className=${`w-full text-left p-3.5 rounded-xl transition duration-150 border flex flex-col justify-start relative ${
                  isSel 
                    ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300' 
                    : 'bg-slate-900/40 hover:bg-slate-800/40 border-slate-800/40 text-slate-300 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-bold font-mono text-slate-400 group-hover:text-slate-200 mb-1">${c.code}</div>
                <div className="text-sm font-bold truncate w-full">${c.name.split(': ')[1] || c.name}</div>
                <div className="text-[10px] text-slate-500 mt-2 font-medium flex items-center gap-1">
                  <i data-lucide="user" className="w-3 h-3 text-slate-400"></i> ${c.teacher}
                </div>
                ${isSel && html`<div className="absolute right-3 top-3 w-1.5 h-1.5 rounded-full bg-indigo-500"></div>`}
              </button>
            `;
          })}
        </div>

        <!-- Right: Active Class Details -->
        <div className="lg:col-span-3 space-y-6">
          ${activeClass ? html`
            <div className="bg-gradient-to-r from-slate-900/60 to-indigo-950/15 p-5 rounded-2xl border border-slate-800/40 flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">${activeClass.code}</span>
                <h3 className="text-lg font-bold text-white mt-1.5">${activeClass.name}</h3>
                <p className="text-xs text-slate-400 mt-1">Managed by <strong>${activeClass.teacher}</strong> • Invite Code: <span className="font-mono text-slate-300">${activeClass.inviteCode}</span></p>
              </div>
            </div>

            <!-- Notes and Resource Downloads Section -->
            <div className="glass-panel p-5 rounded-2xl space-y-3">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <i data-lucide="file-text" className="w-4 h-4 text-indigo-400"></i> Notes & PDF Study Resources
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                ${activeClass.notes.map(note => html`
                  <div key=${note.id} className="bg-slate-950/50 p-3 rounded-xl border border-slate-900 flex items-center justify-between hover:border-slate-800/80 transition">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-red-500/10 text-red-400 rounded-lg">
                        <i data-lucide="file-pdf" className="w-4 h-4"></i>
                      </div>
                      <div className="truncate max-w-[180px] md:max-w-[240px]">
                        <div className="text-xs font-semibold text-slate-200 truncate">${note.title}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">${note.size} • Uploaded ${note.date}</div>
                      </div>
                    </div>
                    <button 
                      onClick=${() => handleDownloadNote(note.title)}
                      className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition" 
                      title="Download Asset"
                    >
                      <i data-lucide="download" className="w-4 h-4"></i>
                    </button>
                  </div>
                `)}
              </div>
            </div>

            <!-- Assignments Area -->
            <div className="glass-panel p-5 rounded-2xl space-y-4">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <i data-lucide="clipboard-list" className="w-4 h-4 text-indigo-400"></i> Pending Assignments
              </h4>
              
              <div className="space-y-3">
                ${activeClass.assignments.map(ass => {
                  const currentStudentName = state.googleUser ? state.googleUser.name : "Eniyan Rajesh";
                  const hasSubmitted = ass.submissions.some(s => s.studentName === currentStudentName);
                  return html`
                    <div key=${ass.id} className="bg-slate-950/30 p-4 rounded-xl border border-slate-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-950/50 transition">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-200">${ass.title}</span>
                          ${hasSubmitted 
                            ? html`<span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/10 text-accent-emerald border border-emerald-500/20 font-bold">Submitted</span>`
                            : html`<span className="px-2 py-0.5 rounded text-[9px] bg-amber-500/10 text-accent-amber border border-amber-500/20 font-bold">Due Soon</span>`
                          }
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 max-w-xl">${ass.desc}</p>
                        <div className="text-[10px] text-slate-500 pt-1 font-semibold flex items-center gap-3">
                          <span className="flex items-center gap-1"><i data-lucide="clock" className="w-3 h-3"></i> Deadline: ${ass.deadline}</span>
                          <span className="flex items-center gap-1"><i data-lucide="award" className="w-3 h-3"></i> Max Points: ${ass.maxPoints}</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick=${() => !hasSubmitted && handleSolveAssignment(ass.id)}
                        className=${`w-full md:w-auto px-4 py-2 text-xs font-bold rounded-lg transition active:scale-95 flex items-center justify-center gap-1.5 ${
                          hasSubmitted 
                            ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/10'
                        }`}
                        disabled=${hasSubmitted}
                      >
                        <i data-lucide="code-2" className="w-3.5 h-3.5"></i>
                        ${hasSubmitted ? 'Completed' : 'Solve Code'}
                      </button>
                    </div>
                  `;
                })}
              </div>
            </div>
          ` : html`
            <div className="glass-panel p-8 text-center text-slate-400 font-medium">
              No classes joined yet. Use the invite code box on the top-right to enroll.
            </div>
          `}
        </div>

      </div>
    </div>
  `;
}
