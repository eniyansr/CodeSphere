// CodeSphere Pro - Teacher Students Directory & Management Component
import { TRANSLATIONS, updateState, saveTeacherData } from '../state.js';

export function TeacherStudents(state) {
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.en;
  const currentTeacherEmail = state.googleUser ? state.googleUser.email : '';
  
  const teacherStudents = (state.studentProfiles || []).filter(s => s.teacherEmail === currentTeacherEmail);

  return `
    <div class="p-6 space-y-6 flex-grow overflow-y-auto">
      
      <!-- Top header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/40 pb-5">
        <div>
          <h2 class="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <i data-lucide="users" class="text-indigo-400 w-6 h-6"></i>
            Student Roster & Directory
          </h2>
          <p class="text-xs text-slate-400">Manage student access profiles, monitor enrollment keys, and invite new students to your classes.</p>
        </div>

        <button id="register-student-btn" class="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/10 hover:opacity-95 active:scale-95 transition flex items-center gap-1.5">
          <i data-lucide="user-plus" class="w-4 h-4"></i> Register Student
        </button>
      </div>

      <!-- Quick Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-slate-950/40 p-4.5 rounded-2xl border border-slate-900 flex justify-between items-center">
          <div>
            <div class="text-[10px] text-slate-500 font-bold uppercase">Total Registered</div>
            <div class="text-lg font-bold font-mono text-slate-200 mt-0.5">${teacherStudents.length} Students</div>
          </div>
          <div class="text-indigo-400 bg-indigo-500/10 p-2 rounded-xl">
            <i data-lucide="users" class="w-4 h-4"></i>
          </div>
        </div>
        
        <div class="bg-slate-950/40 p-4.5 rounded-2xl border border-slate-900 flex justify-between items-center">
          <div>
            <div class="text-[10px] text-slate-500 font-bold uppercase">Access Keys Active</div>
            <div class="text-lg font-bold font-mono text-slate-200 mt-0.5">${teacherStudents.filter(s => s.code).length} Keys</div>
          </div>
          <div class="text-accent-cyan bg-cyan-500/10 p-2 rounded-xl">
            <i data-lucide="key-round" class="w-4 h-4"></i>
          </div>
        </div>

        <div class="bg-slate-950/40 p-4.5 rounded-2xl border border-slate-900 flex justify-between items-center">
          <div>
            <div class="text-[10px] text-slate-500 font-bold uppercase">Assigned Classroom Tracks</div>
            <div class="text-lg font-bold font-mono text-slate-200 mt-0.5">
              ${(state.classes || []).filter(c => c.teacherEmail === currentTeacherEmail).length} Classes
            </div>
          </div>
          <div class="text-accent-emerald bg-emerald-500/10 p-2 rounded-xl">
            <i data-lucide="folder-git" class="w-4 h-4"></i>
          </div>
        </div>
      </div>

      <!-- Filter Controls & Search -->
      <div class="bg-slate-900/40 p-4 rounded-xl border border-slate-800/30 flex flex-col md:flex-row justify-between items-center gap-4">
        <div class="relative w-full md:w-80">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <i data-lucide="search" class="w-4 h-4"></i>
          </span>
          <input 
            id="student-search-input" 
            type="text" 
            placeholder="Search students by name or email..." 
            class="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500/50 outline-none transition"
          >
        </div>
        <div class="text-xs text-slate-500">
          Showing <span id="student-count-display" class="text-slate-300 font-bold">${teacherStudents.length}</span> of ${teacherStudents.length} profiles
        </div>
      </div>

      <!-- Students Table Panel -->
      <div class="glass-panel p-5 rounded-2xl space-y-4">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="border-b border-slate-800/60 text-slate-400">
                <th class="py-3 font-semibold">Student Name</th>
                <th class="py-3 font-semibold">Email</th>
                <th class="py-3 font-semibold">Access Key</th>
                <th class="py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="students-table-body">
              ${teacherStudents.map(student => {
                const initials = student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                return `
                  <tr data-student-row class="border-b border-slate-900/60 hover:bg-slate-900/20 text-slate-300 transition duration-150">
                    <td class="py-3.5 font-bold flex items-center space-x-2.5">
                      <div class="w-7 h-7 rounded-full bg-indigo-600/10 text-[10px] flex items-center justify-center font-bold text-indigo-400 border border-indigo-500/20 shadow-inner">
                        ${initials}
                      </div>
                      <span class="student-name-text">${student.name}</span>
                    </td>
                    <td class="py-3.5 text-slate-400 student-email-text">${student.email}</td>
                    <td class="py-3.5">
                      <div class="flex items-center space-x-2">
                        <span class="font-mono text-xs text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 select-all">${student.code}</span>
                      </div>
                    </td>
                    <td class="py-3.5 text-right">
                      <div class="flex items-center justify-end space-x-2">
                        <button data-copy-student-code="${student.code}" class="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold transition active:scale-95 flex items-center gap-1">
                          <i data-lucide="copy" class="w-3 h-3"></i> Copy Key
                        </button>
                        <button data-delete-student-code="${student.code}" data-student-name="${student.name}" class="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-[10px] font-semibold transition active:scale-95 flex items-center gap-1">
                          <i data-lucide="trash-2" class="w-3 h-3"></i> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
              ${(!teacherStudents || teacherStudents.length === 0) ? `
                <tr id="empty-students-row">
                  <td colspan="4" class="py-12 text-center text-slate-500 font-medium">
                    <div class="flex flex-col items-center justify-center space-y-2">
                      <i data-lucide="users-2" class="w-8 h-8 text-slate-600"></i>
                      <span>No students registered yet. Click "Register Student" to get started.</span>
                    </div>
                  </td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Register Student Modal Dialog -->
      <div id="teacher-student-modal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" style="display:none">
        <div class="glass-panel w-full max-w-md rounded-2xl p-6 space-y-4">
          <div class="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 class="text-base font-bold text-white flex items-center gap-1.5">
              <i data-lucide="user-plus" class="w-5 h-5 text-indigo-400"></i> Register Student Profile
            </h3>
            <button id="teacher-student-modal-close" class="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
          
          <div class="space-y-3.5 text-xs">
            <div>
              <label class="block text-slate-400 font-semibold mb-1">Student's Full Name</label>
              <input id="teacher-stud-name-input" type="text" placeholder="e.g. John Doe" class="w-full glass-input p-2.5 rounded-xl text-slate-200 font-medium">
            </div>
            <div>
              <label class="block text-slate-400 font-semibold mb-1">Student's Email</label>
              <input id="teacher-stud-email-input" type="email" placeholder="e.g. john@gmail.com" class="w-full glass-input p-2.5 rounded-xl text-slate-200 font-medium">
            </div>
          </div>

          <div class="flex justify-end items-center gap-2 pt-2 border-t border-slate-800">
            <button id="teacher-student-modal-cancel" class="px-4 py-2 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-300 font-semibold text-xs rounded-xl">Cancel</button>
            <button id="teacher-student-modal-save" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/10">Generate Access Profile</button>
          </div>
        </div>
      </div>

    </div>
  `;
}

export function bindTeacherStudentsEvents(state) {
  const currentTeacherEmail = state.googleUser ? state.googleUser.email : '';
  const studModal = document.getElementById('teacher-student-modal');

  // Trigger Modal
  document.getElementById('register-student-btn')?.addEventListener('click', () => {
    if (studModal) studModal.style.display = 'flex';
  });
  document.getElementById('teacher-student-modal-close')?.addEventListener('click', () => {
    if (studModal) studModal.style.display = 'none';
  });
  document.getElementById('teacher-student-modal-cancel')?.addEventListener('click', () => {
    if (studModal) studModal.style.display = 'none';
  });

  // Save Student
  document.getElementById('teacher-student-modal-save')?.addEventListener('click', () => {
    const name = document.getElementById('teacher-stud-name-input')?.value?.trim();
    const email = document.getElementById('teacher-stud-email-input')?.value?.trim();
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
    
    // Save to isolated teacher storage
    saveTeacherData(currentTeacherEmail, state.classes || [], updatedProfiles);
    
    // Clear inputs and hide modal
    document.getElementById('teacher-stud-name-input').value = '';
    document.getElementById('teacher-stud-email-input').value = '';
    if (studModal) studModal.style.display = 'none';
    alert(`Student profile registered successfully!\nName: ${name}\nAccess Code: ${code}\nGive this code to the student to let them log in.`);
  });

  // Search filter handler (Dynamic row filtering)
  const searchInput = document.getElementById('student-search-input');
  searchInput?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const rows = document.querySelectorAll('[data-student-row]');
    let count = 0;
    
    rows.forEach(row => {
      const name = row.querySelector('.student-name-text')?.textContent.toLowerCase() || '';
      const email = row.querySelector('.student-email-text')?.textContent.toLowerCase() || '';
      
      if (name.includes(query) || email.includes(query)) {
        row.style.display = '';
        count++;
      } else {
        row.style.display = 'none';
      }
    });

    const displayCount = document.getElementById('student-count-display');
    if (displayCount) displayCount.textContent = count;
  });

  // Copy code handler
  document.querySelectorAll('[data-copy-student-code]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const code = e.currentTarget.getAttribute('data-copy-student-code');
      navigator.clipboard.writeText(code).then(() => {
        alert(`Access Code ${code} copied to clipboard!`);
      }).catch(err => {
        console.error("Clipboard copy failed: ", err);
        alert(`Access Code is: ${code}`);
      });
    });
  });

  // Delete student profile handler
  document.querySelectorAll('[data-delete-student-code]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const code = e.currentTarget.getAttribute('data-delete-student-code');
      const name = e.currentTarget.getAttribute('data-student-name');
      if (confirm(`Are you sure you want to delete the student profile for ${name}? This will revoke their access.`)) {
        const currentProfiles = state.studentProfiles || [];
        const updatedProfiles = currentProfiles.filter(s => s.code !== code);
        
        updateState({
          studentProfiles: updatedProfiles
        });
        saveTeacherData(currentTeacherEmail, state.classes || [], updatedProfiles);
        alert(`Student profile for ${name} removed.`);
      }
    });
  });
}
