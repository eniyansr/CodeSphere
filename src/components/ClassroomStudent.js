// CodeSphere Pro - Student Classroom Component
import { updateState, TRANSLATIONS } from '../state.js';

export function ClassroomStudent(state) {
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.en;
  
  // Local state helper for active clicked class inside student view
  const activeClassId = state.activeStudentClassId || (state.classes[0] ? state.classes[0].id : null);

  const activeClass = state.classes.find(c => c.id === activeClassId);

  return `
    <div class="p-6 space-y-6 flex-grow overflow-y-auto">
      
      <!-- Top banner + Join code -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/40 pb-5">
        <div>
          <h2 class="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <i data-lucide="book-open" class="text-indigo-400 w-6 h-6"></i>
            My Classrooms
          </h2>
          <p class="text-xs text-slate-400">Enroll in programming subjects, access curriculum guides, and complete submissions.</p>
        </div>

        <div class="flex items-center space-x-2 bg-slate-900/50 p-1.5 rounded-xl border border-slate-800/50">
          <input id="student-join-input" type="text" placeholder="Invite Code" class="bg-slate-950/80 text-xs px-3 py-2 rounded-lg border border-slate-800 focus:border-slate-700 outline-none text-slate-200 w-32 font-mono">
          <button id="student-join-btn" class="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition active:scale-95 flex items-center gap-1">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i> Join Class
          </button>
        </div>
      </div>

      <!-- Class Panels Split Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        <!-- Left: Classes Navigation List -->
        <div class="space-y-2 lg:col-span-1">
          <span class="text-[10px] uppercase font-bold tracking-wider text-slate-500 block px-1 mb-2">My Enrolled Subjects</span>
          ${state.classes.map(c => {
            const isSel = c.id === activeClassId;
            return `
              <button 
                data-class-select-id="${c.id}"
                class="w-full text-left p-3.5 rounded-xl transition duration-150 border flex flex-col justify-start relative
                ${isSel 
                  ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300' 
                  : 'bg-slate-900/40 hover:bg-slate-800/40 border-slate-800/40 text-slate-300 hover:text-slate-200'}"
              >
                <div class="text-xs font-bold font-mono text-slate-400 group-hover:text-slate-200 mb-1">${c.code}</div>
                <div class="text-sm font-bold truncate w-full">${c.name.split(': ')[1] || c.name}</div>
                <div class="text-[10px] text-slate-500 mt-2 font-medium flex items-center gap-1">
                  <i data-lucide="user" class="w-3 h-3"></i> ${c.teacher}
                </div>
                ${isSel ? `<div class="absolute right-3 top-3 w-1.5 h-1.5 rounded-full bg-indigo-500"></div>` : ''}
              </button>
            `;
          }).join('')}
        </div>

        <!-- Right: Active Class Details -->
        <div class="lg:col-span-3 space-y-6">
          ${activeClass ? `
            
            <div class="bg-gradient-to-r from-slate-900/60 to-indigo-950/15 p-5 rounded-2xl border border-slate-800/40 flex items-center justify-between">
              <div>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">${activeClass.code}</span>
                <h3 class="text-lg font-bold text-white mt-1.5">${activeClass.name}</h3>
                <p class="text-xs text-slate-400 mt-1">Managed by <strong>${activeClass.teacher}</strong> • Invite Code: <span class="font-mono text-slate-300">${activeClass.inviteCode}</span></p>
              </div>
            </div>

            <!-- Notes and Resource Downloads Section -->
            <div class="glass-panel p-5 rounded-2xl space-y-3">
              <h4 class="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <i data-lucide="file-text" class="w-4 h-4 text-indigo-400"></i> Notes & PDF Study Resources
              </h4>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                ${activeClass.notes.map(note => `
                  <div class="bg-slate-950/50 p-3 rounded-xl border border-slate-900 flex items-center justify-between hover:border-slate-800/80 transition">
                    <div class="flex items-center space-x-3">
                      <div class="p-2 bg-red-500/10 text-red-400 rounded-lg">
                        <i data-lucide="file-pdf" class="w-4 h-4"></i>
                      </div>
                      <div class="truncate max-w-[180px] md:max-w-[240px]">
                        <div class="text-xs font-semibold text-slate-200 truncate">${note.title}</div>
                        <div class="text-[10px] text-slate-500 mt-0.5">${note.size} • Uploaded ${note.date}</div>
                      </div>
                    </div>
                    <button data-download-note="${note.title}" class="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition" title="Download Asset">
                      <i data-lucide="download" class="w-4 h-4"></i>
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Assignments Area -->
            <div class="glass-panel p-5 rounded-2xl space-y-4">
              <h4 class="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <i data-lucide="clipboard-list" class="w-4 h-4 text-indigo-400"></i> Pending Assignments
              </h4>
              
              <div class="space-y-3">
                ${activeClass.assignments.map(ass => {
                  const hasSubmitted = ass.submissions.some(s => s.studentName === "Eniyan Rajesh");
                  return `
                    <div class="bg-slate-950/30 p-4 rounded-xl border border-slate-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-950/50 transition">
                      <div class="space-y-1">
                        <div class="flex items-center gap-2">
                          <span class="text-xs font-bold text-slate-200">${ass.title}</span>
                          ${hasSubmitted 
                            ? `<span class="px-2 py-0.5 rounded text-[9px] bg-emerald-500/10 text-accent-emerald border border-emerald-500/20 font-bold">Submitted</span>`
                            : `<span class="px-2 py-0.5 rounded text-[9px] bg-amber-500/10 text-accent-amber border border-amber-500/20 font-bold">Due Soon</span>`
                          }
                        </div>
                        <p class="text-xs text-slate-400 line-clamp-2 max-w-xl">${ass.desc}</p>
                        <div class="text-[10px] text-slate-500 pt-1 font-semibold flex items-center gap-3">
                          <span class="flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i> Deadline: ${ass.deadline}</span>
                          <span class="flex items-center gap-1"><i data-lucide="award" class="w-3 h-3"></i> Max Points: ${ass.maxPoints}</span>
                        </div>
                      </div>
                      
                      <button 
                        data-solve-assignment-id="${ass.id}" 
                        class="w-full md:w-auto px-4 py-2 text-xs font-bold rounded-lg transition active:scale-95 flex items-center justify-center gap-1.5
                        ${hasSubmitted 
                          ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/10'}"
                        ${hasSubmitted ? 'disabled' : ''}
                      >
                        <i data-lucide="code-2" class="w-3.5 h-3.5"></i>
                        ${hasSubmitted ? 'Completed' : 'Solve Code'}
                      </button>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

          ` : `
            <div class="glass-panel p-8 text-center text-slate-400 font-medium">
              No classes joined yet. Use the invite code box on the top-right to enroll.
            </div>
          `}
        </div>

      </div>

    </div>
  `;
}

export function bindClassroomStudentEvents(state) {
  // Select Class
  document.querySelectorAll('[data-class-select-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const classId = e.currentTarget.getAttribute('data-class-select-id');
      updateState({ activeStudentClassId: classId });
    });
  });

  // Join class
  document.getElementById('student-join-btn')?.addEventListener('click', () => {
    const input = document.getElementById('student-join-input');
    const inviteCode = input?.value.trim().toLowerCase();
    if (!inviteCode) return;

    if (inviteCode === 'new123') {
      const newClass = {
        id: "cls-303",
        code: "PY303",
        name: "PY-303: Advanced Python & AI Paradigms",
        teacher: "Dr. Grace Hopper",
        inviteCode: "new123",
        notes: [
          { id: "note-4", title: "PyTorch Deep Learning Intro.pdf", size: "4.8 MB", date: "2026-06-22" }
        ],
        assignments: [
          {
            id: "assign-301",
            title: "Recurrent Neural Networks Logic",
            desc: "Simulate a basic feedforward neuron structure and activate outputs using the Sigmoid trigger.",
            deadline: "2026-07-20 23:00",
            maxPoints: 100,
            submissions: []
          }
        ]
      };

      // Check if already joined
      if (state.classes.some(c => c.id === newClass.id)) {
        alert("You are already enrolled in this class.");
        return;
      }

      const updatedClasses = [...state.classes, newClass];
      updateState({ 
        classes: updatedClasses,
        activeStudentClassId: newClass.id
      });
      alert(`Successfully enrolled in ${newClass.name}!`);
    } else {
      alert("Invalid invite code. Try 'new123' to enroll in Grace Hopper's Python class.");
    }
  });

  // Solve Assignment
  document.querySelectorAll('[data-solve-assignment-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const assignId = e.currentTarget.getAttribute('data-solve-assignment-id');
      
      // Find assignment text
      let foundAssignment = null;
      state.classes.forEach(c => {
        const found = c.assignments.find(a => a.id === assignId);
        if (found) foundAssignment = found;
      });

      if (foundAssignment) {
        // Load target details into code editor state and swap tab
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
          activeTab: 'practice'
        });
      }
    });
  });

  // Mock download note
  document.querySelectorAll('[data-download-note]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const noteName = e.currentTarget.getAttribute('data-download-note');
      alert(`Downloading resource asset: ${noteName}...\nAsset verified securely by CodeSphere Shield.`);
    });
  });
}
