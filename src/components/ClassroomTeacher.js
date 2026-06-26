// CodeSphere Pro - Teacher Classroom & Grading Component
import { updateState, TRANSLATIONS, saveTeacherData } from '../state.js';

// Helper: save teacher-specific data after every class/student update
function saveTeacherNow(stateRef, teacherEmail) {
  saveTeacherData(
    teacherEmail,
    stateRef.classes || [],
    stateRef.studentProfiles || []
  );
}

export function ClassroomTeacher(state) {
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.en;
  
  // Get active teacher details
  const currentTeacherEmail = state.googleUser ? state.googleUser.email : '';
  const currentTeacherName = state.googleUser ? state.googleUser.name : 'Teacher';
  
  // Filter classes and student profiles belonging to the current teacher
  const teacherClasses = (state.classes || []).filter(c => c.teacherEmail === currentTeacherEmail);
  const teacherStudents = (state.studentProfiles || []).filter(s => s.teacherEmail === currentTeacherEmail);

  const activeClassId = state.activeTeacherClassId || (teacherClasses[0] ? teacherClasses[0].id : null);
  const activeClass = teacherClasses.find(c => c.id === activeClassId);

  return `
    <div class="p-6 space-y-6 flex-grow overflow-y-auto">
      
      <!-- Header controls -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/40 pb-5">
        <div>
          <h2 class="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <i data-lucide="folder-git" class="text-indigo-400 w-6 h-6"></i>
            Teacher Dashboard & Grading
          </h2>
          <p class="text-xs text-slate-400">Add syllabus tracks, create custom tests, review student responses, and grade solutions.</p>
        </div>

        <button id="teacher-create-class-btn" class="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/10 hover:opacity-95 active:scale-95 transition flex items-center gap-1.5">
          <i data-lucide="plus-circle" class="w-4 h-4"></i> Create Class
        </button>
      </div>

      <!-- Main Layout Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        <!-- Classes listing left -->
        <div class="space-y-2 lg:col-span-1">
          <span class="text-[10px] uppercase font-bold tracking-wider text-slate-500 block px-1 mb-2">My Supervised Classes</span>
          ${teacherClasses.map(c => {
            const isSel = c.id === activeClassId;
            return `
              <button 
                data-teacher-class-id="${c.id}"
                class="w-full text-left p-3.5 rounded-xl transition duration-150 border flex flex-col justify-start relative
                ${isSel 
                  ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300' 
                  : 'bg-slate-900/40 hover:bg-slate-800/40 border-slate-800/40 text-slate-300 hover:text-slate-200'}"
              >
                <div class="text-xs font-bold font-mono text-slate-400 mb-1">${c.code}</div>
                <div class="text-sm font-bold truncate w-full">${c.name.split(': ')[1] || c.name}</div>
                <div class="text-[10px] text-slate-500 mt-2 font-medium flex justify-between items-center w-full">
                  <span class="flex items-center gap-1"><i data-lucide="users" class="w-3 h-3"></i> ${teacherStudents.length} Students</span>
                  <span class="font-mono text-indigo-400/80 bg-indigo-500/5 px-1.5 py-0.5 rounded border border-indigo-500/10">${c.inviteCode}</span>
                </div>
                ${isSel ? `<div class="absolute right-3 top-3 w-1.5 h-1.5 rounded-full bg-indigo-500"></div>` : ''}
              </button>
            `;
          }).join('')}
        </div>

        <!-- Class manager right -->
        <div class="lg:col-span-3 space-y-6">
          ${activeClass ? `
            
            <!-- Class Overview Panel -->
            <div class="bg-gradient-to-r from-slate-900/60 to-indigo-950/15 p-5 rounded-2xl border border-slate-800/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">${activeClass.code}</span>
                <h3 class="text-lg font-bold text-white mt-1.5">${activeClass.name}</h3>
                <p class="text-xs text-slate-400 mt-1">Invitation Share Code: <span class="font-mono text-slate-200 font-bold bg-slate-800 px-2 py-0.5 rounded border border-slate-700/40 select-all">${activeClass.inviteCode}</span></p>
              </div>

              <div class="flex items-center space-x-2">
                <button id="teacher-add-assignment-btn" class="px-3.5 py-2 bg-slate-800 border border-slate-700/60 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition active:scale-95 flex items-center gap-1">
                  <i data-lucide="file-plus" class="w-3.5 h-3.5 text-accent-cyan"></i> Add Assignment
                </button>
              </div>
            </div>

            <!-- Student Submissions Matrix -->
            <div class="glass-panel p-5 rounded-2xl space-y-4">
              <h4 class="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <i data-lucide="check-square" class="w-4 h-4 text-indigo-400"></i> Code Submissions & Grading
              </h4>

              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr class="border-b border-slate-800/60 text-slate-400">
                      <th class="py-3 font-semibold">Student Name</th>
                      <th class="py-3 font-semibold">Assignment Title</th>
                      <th class="py-3 font-semibold">Language</th>
                      <th class="py-3 font-semibold">Submitted Date</th>
                      <th class="py-3 font-semibold">Score / Max</th>
                      <th class="py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${activeClass.assignments.flatMap(ass => 
                      ass.submissions.map(sub => `
                        <tr class="border-b border-slate-900/60 hover:bg-slate-900/20 text-slate-300">
                          <td class="py-3.5 font-bold flex items-center space-x-2">
                            <div class="w-6 h-6 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-bold text-indigo-400 border border-slate-700/40">ER</div>
                            <span>${sub.studentName}</span>
                          </td>
                          <td class="py-3.5 font-medium">${ass.title}</td>
                          <td class="py-3.5 font-mono text-slate-400 uppercase">${sub.language}</td>
                          <td class="py-3.5 text-slate-500">${sub.time}</td>
                          <td class="py-3.5">
                            <input 
                              type="number" 
                              data-grade-submission-id="${ass.id}"
                              data-student-name="${sub.studentName}"
                              value="${sub.score}" 
                              max="${ass.maxPoints}"
                              class="bg-slate-950/80 w-12 px-1.5 py-1 text-center font-mono font-bold text-accent-emerald border border-slate-800 rounded focus:border-slate-700 outline-none"
                            >
                            <span class="text-slate-500 font-semibold">/ ${ass.maxPoints}</span>
                          </td>
                          <td class="py-3.5 text-right">
                            <div class="flex items-center justify-end space-x-2">
                              <button 
                                data-replay-assignment-id="${ass.id}" 
                                data-replay-student="${sub.studentName}"
                                class="px-2.5 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg font-bold flex items-center gap-1 transition"
                                title="Replay Keystroke Log"
                              >
                                <i data-lucide="history" class="w-3.5 h-3.5"></i> Replay
                              </button>
                            </div>
                          </td>
                        </tr>
                      `)
                    ).join('')}
                    ${activeClass.assignments.every(ass => ass.submissions.length === 0) ? `
                      <tr>
                        <td colspan="6" class="py-8 text-center text-slate-500 font-medium">No student submissions logged yet.</td>
                      </tr>
                    ` : ''}
                  </tbody>
              </div>
            </div>

            <!-- Student Roster & Access Codes -->
            <div class="glass-panel p-5 rounded-2xl space-y-4">
              <div class="flex justify-between items-center border-b border-slate-800/60 pb-3">
                <h4 class="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                  <i data-lucide="users" class="w-4 h-4 text-indigo-400"></i> Student Roster & Access Codes
                </h4>
                <button id="teacher-add-student-btn" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition active:scale-95 flex items-center gap-1">
                  <i data-lucide="user-plus" class="w-3.5 h-3.5"></i> Register Student
                </button>
              </div>
              
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr class="border-b border-slate-800/60 text-slate-400">
                      <th class="py-2.5 font-semibold">Student Name</th>
                      <th class="py-2.5 font-semibold">Email</th>
                      <th class="py-2.5 font-semibold">Access Code</th>
                      <th class="py-2.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${teacherStudents.map(student => `
                      <tr class="border-b border-slate-900/60 hover:bg-slate-900/20 text-slate-300">
                        <td class="py-3 font-bold flex items-center space-x-2">
                          <div class="w-6 h-6 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-bold text-indigo-400 border border-slate-700/40">
                            ${student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <span>${student.name}</span>
                        </td>
                        <td class="py-3 text-slate-400">${student.email}</td>
                        <td class="py-3">
                          <span class="font-mono text-xs text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 select-all">${student.code}</span>
                        </td>
                        <td class="py-3 text-right">
                          <button data-copy-code="${student.code}" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-semibold transition active:scale-95">
                            Copy Code
                          </button>
                        </td>
                      </tr>
                    `).join('')}
                    ${(!teacherStudents || teacherStudents.length === 0) ? `
                      <tr>
                        <td colspan="4" class="py-6 text-center text-slate-500 font-medium">No students registered yet. Click "Register Student" to generate access codes.</td>
                      </tr>
                    ` : ''}
                  </tbody>
                </table>
              </div>
            </div>
          ` : `
            <div class="glass-panel p-8 text-center text-slate-400 font-medium">
              No classrooms created. Click "Create Class" on the top right to start a subject block.
            </div>
          `}
        </div>

      </div>

      <!-- Create Assignment Modal Overlay Dialog (Inlined/Toggleable by script) -->
      <div id="assignment-modal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" style="display:none">
        <div class="glass-panel w-full max-w-lg rounded-2xl p-6 space-y-4">
          <div class="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 class="text-base font-bold text-white flex items-center gap-1.5">
              <i data-lucide="file-plus" class="w-5 h-5 text-indigo-400"></i> Add New Coding Assignment
            </h3>
            <button id="assignment-modal-close" class="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
          
          <div class="space-y-3.5 text-xs">
            <div>
              <label class="block text-slate-400 font-semibold mb-1">Assignment Title</label>
              <input id="ass-title-input" type="text" placeholder="e.g., Reverse Linked List" class="w-full glass-input p-2.5 rounded-xl text-slate-200 font-medium">
            </div>
            <div>
              <label class="block text-slate-400 font-semibold mb-1">Description & Requirements</label>
              <textarea id="ass-desc-input" rows="4" placeholder="Detail parameters, inputs, outputs, and edge conditions..." class="w-full glass-input p-2.5 rounded-xl text-slate-200 font-medium resize-none"></textarea>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-slate-400 font-semibold mb-1">Due Date</label>
                <input id="ass-deadline-input" type="text" placeholder="YYYY-MM-DD HH:MM" class="w-full glass-input p-2.5 rounded-xl text-slate-200 font-medium font-mono">
              </div>
              <div>
                <label class="block text-slate-400 font-semibold mb-1">Max Score</label>
                <input id="ass-points-input" type="number" value="100" class="w-full glass-input p-2.5 rounded-xl text-slate-200 font-medium font-mono">
              </div>
            </div>
          </div>

          <div class="flex justify-end items-center gap-2 pt-2 border-t border-slate-800">
            <button id="assignment-modal-cancel" class="px-4 py-2 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-300 font-semibold text-xs rounded-xl">Cancel</button>
            <button id="assignment-modal-save" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/10">Publish Task</button>
          </div>
        </div>
      </div>

      <!-- Create Classroom Modal Dialog -->
      <div id="classroom-modal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" style="display:none">
        <div class="glass-panel w-full max-w-md rounded-2xl p-6 space-y-4">
          <div class="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 class="text-base font-bold text-white flex items-center gap-1.5">
              <i data-lucide="plus-circle" class="w-5 h-5 text-indigo-400"></i> Create A New Subject Class
            </h3>
            <button id="classroom-modal-close" class="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
          
          <div class="space-y-3.5 text-xs">
            <div>
              <label class="block text-slate-400 font-semibold mb-1">Subject Code</label>
              <input id="class-code-input" type="text" placeholder="e.g. CS202" class="w-full glass-input p-2.5 rounded-xl text-slate-200 font-medium font-mono">
            </div>
            <div>
              <label class="block text-slate-400 font-semibold mb-1">Classroom Name</label>
              <input id="class-name-input" type="text" placeholder="e.g. CS-202: Advanced Coding Architectures" class="w-full glass-input p-2.5 rounded-xl text-slate-200 font-medium">
            </div>
          </div>

          <div class="flex justify-end items-center gap-2 pt-2 border-t border-slate-800">
            <button id="classroom-modal-cancel" class="px-4 py-2 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-300 font-semibold text-xs rounded-xl">Cancel</button>
            <button id="classroom-modal-save" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/10">Build Classroom</button>
          </div>
        </div>
      </div>

      <!-- Register Student Modal Dialog -->
      <div id="student-modal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" style="display:none">
        <div class="glass-panel w-full max-w-md rounded-2xl p-6 space-y-4">
          <div class="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 class="text-base font-bold text-white flex items-center gap-1.5">
              <i data-lucide="user-plus" class="w-5 h-5 text-indigo-400"></i> Register Student Profile
            </h3>
            <button id="student-modal-close" class="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
          
          <div class="space-y-3.5 text-xs">
            <div>
              <label class="block text-slate-400 font-semibold mb-1">Student's Full Name</label>
              <input id="stud-name-input" type="text" placeholder="e.g. John Doe" class="w-full glass-input p-2.5 rounded-xl text-slate-200 font-medium">
            </div>
            <div>
              <label class="block text-slate-400 font-semibold mb-1">Student's Email</label>
              <input id="stud-email-input" type="email" placeholder="e.g. john@gmail.com" class="w-full glass-input p-2.5 rounded-xl text-slate-200 font-medium">
            </div>
          </div>

          <div class="flex justify-end items-center gap-2 pt-2 border-t border-slate-800">
            <button id="student-modal-cancel" class="px-4 py-2 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-300 font-semibold text-xs rounded-xl">Cancel</button>
            <button id="student-modal-save" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/10">Generate Access Profile</button>
          </div>
        </div>
      </div>

    </div>
  `;
}

export function bindClassroomTeacherEvents(state) {
  const currentTeacherEmail = state.googleUser ? state.googleUser.email : '';
  const currentTeacherName = state.googleUser ? state.googleUser.name : 'Teacher';

  // Select Class
  document.querySelectorAll('[data-teacher-class-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const classId = e.currentTarget.getAttribute('data-teacher-class-id');
      updateState({ activeTeacherClassId: classId });
    });
  });

  // Modal selectors
  const assModal = document.getElementById('assignment-modal');
  const classModal = document.getElementById('classroom-modal');

  // Trigger Class Modal
  document.getElementById('teacher-create-class-btn')?.addEventListener('click', () => {
    if (classModal) classModal.style.display = 'flex';
  });
  document.getElementById('classroom-modal-close')?.addEventListener('click', () => {
    if (classModal) classModal.style.display = 'none';
  });
  document.getElementById('classroom-modal-cancel')?.addEventListener('click', () => {
    if (classModal) classModal.style.display = 'none';
  });

  // Save Class
  document.getElementById('classroom-modal-save')?.addEventListener('click', () => {
    const code = document.getElementById('class-code-input')?.value.trim();
    const name = document.getElementById('class-name-input')?.value.trim();
    if (!code || !name) return;

    const newClass = {
      id: "cls-" + Math.floor(Math.random() * 1000),
      code,
      name: `${code}: ${name}`,
      teacher: currentTeacherName,
      teacherEmail: currentTeacherEmail,
      inviteCode: Math.random().toString(36).substring(2, 9),
      notes: [],
      assignments: []
    };

    updateState({
      classes: [...state.classes, newClass],
      activeTeacherClassId: newClass.id
    });
    saveTeacherNow({ classes: [...state.classes, newClass], studentProfiles: state.studentProfiles || [] }, currentTeacherEmail);
    if (classModal) classModal.style.display = 'none';
    alert(`Classroom ${code} built successfully!`);
  });

  // Trigger Assignment Modal
  document.getElementById('teacher-add-assignment-btn')?.addEventListener('click', () => {
    if (assModal) assModal.style.display = 'flex';
  });
  document.getElementById('assignment-modal-close')?.addEventListener('click', () => {
    if (assModal) assModal.style.display = 'none';
  });
  document.getElementById('assignment-modal-cancel')?.addEventListener('click', () => {
    if (assModal) assModal.style.display = 'none';
  });

  // Save Assignment
  document.getElementById('assignment-modal-save')?.addEventListener('click', () => {
    const title = document.getElementById('ass-title-input')?.value.trim();
    const desc = document.getElementById('ass-desc-input')?.value.trim();
    const deadline = document.getElementById('ass-deadline-input')?.value.trim() || '2026-07-31 23:59';
    const points = parseInt(document.getElementById('ass-points-input')?.value) || 100;
    
    if (!title || !desc) return;

    const teacherClasses = state.classes.filter(c => c.teacherEmail === currentTeacherEmail);
    const activeClassId = state.activeTeacherClassId || teacherClasses[0]?.id;
    if (!activeClassId) return;

    const updatedClasses = state.classes.map(c => {
      if (c.id === activeClassId) {
        return {
          ...c,
          assignments: [
            ...c.assignments,
            {
              id: "assign-" + Math.floor(Math.random() * 1000),
              title,
              desc,
              deadline,
              maxPoints: points,
              submissions: []
            }
          ]
        };
      }
      return c;
    });

    updateState({ classes: updatedClasses });
    saveTeacherNow({ classes: updatedClasses, studentProfiles: state.studentProfiles || [] }, currentTeacherEmail);
    if (assModal) assModal.style.display = 'none';
    alert("Coding Assignment published to subject track!");
  });

  // Handle Score Updates
  document.querySelectorAll('[data-grade-submission-id]').forEach(input => {
    input.addEventListener('change', (e) => {
      const assId = e.target.getAttribute('data-grade-submission-id');
      const student = e.target.getAttribute('data-student-name');
      const newScore = parseInt(e.target.value) || 0;

      const updatedClasses = state.classes.map(c => {
        return {
          ...c,
          assignments: c.assignments.map(a => {
            if (a.id === assId) {
              return {
                ...a,
                submissions: a.submissions.map(s => {
                  if (s.studentName === student) {
                    return { ...s, score: newScore };
                  }
                  return s;
                })
              };
            }
            return a;
          })
        };
      });

      updateState({ classes: updatedClasses });
      saveTeacherNow({ classes: updatedClasses, studentProfiles: state.studentProfiles || [] }, currentTeacherEmail);
    });
  });

  // Launch Replay keystrokes
  document.querySelectorAll('[data-replay-assignment-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const assId = e.currentTarget.getAttribute('data-replay-assignment-id');
      const student = e.currentTarget.getAttribute('data-replay-student');

      // Swap tab to code replay simulator
      updateState({ 
        activeTab: 'replay_viewer', // special route
        replayTargetAssignmentId: assId,
        replayTargetStudent: student
      });
    });
  });

  // Student registration modal trigger
  const studModal = document.getElementById('student-modal');
  document.getElementById('teacher-add-student-btn')?.addEventListener('click', () => {
    if (studModal) studModal.style.display = 'flex';
  });
  document.getElementById('student-modal-close')?.addEventListener('click', () => {
    if (studModal) studModal.style.display = 'none';
  });
  document.getElementById('student-modal-cancel')?.addEventListener('click', () => {
    if (studModal) studModal.style.display = 'none';
  });

  // Save new student profile & generate unique code
  document.getElementById('student-modal-save')?.addEventListener('click', () => {
    const name = document.getElementById('stud-name-input')?.value?.trim();
    const email = document.getElementById('stud-email-input')?.value?.trim();
    if (!name || !email) {
      alert("Please fill in both name and email.");
      return;
    }

    // Generate unique student access code (e.g. STUD-8A4F)
    const randomHex = Math.floor(0x1000 + Math.random() * 0x8fff).toString(16).toUpperCase();
    const code = `STUD-${randomHex}`;

    const newStudent = { name, email, code, teacherEmail: currentTeacherEmail };
    const currentProfiles = state.studentProfiles || [];
    const updatedProfiles = [...currentProfiles, newStudent];

    updateState({
      studentProfiles: updatedProfiles
    });
    saveTeacherNow({ classes: state.classes || [], studentProfiles: updatedProfiles }, currentTeacherEmail);

    // Clear inputs and close modal
    document.getElementById('stud-name-input').value = '';
    document.getElementById('stud-email-input').value = '';
    if (studModal) studModal.style.display = 'none';

    alert(`Student profile registered successfully!\nName: ${name}\nAccess Code: ${code}\nGive this code to the student to let them log in.`);
  });

  // Copy code handler
  document.querySelectorAll('[data-copy-code]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const code = e.currentTarget.getAttribute('data-copy-code');
      navigator.clipboard.writeText(code).then(() => {
        alert(`Access Code ${code} copied to clipboard!`);
      }).catch(err => {
        console.error("Clipboard copy failed: ", err);
        alert(`Access Code is: ${code}`);
      });
    });
  });
}
