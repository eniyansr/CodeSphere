// CodeSphere Pro - Teacher Students Directory & Management Component (React Edition)
import React, { useState } from 'https://esm.sh/react@18.2.0';
import { TRANSLATIONS, html, useAppState } from '../state.js';

export function TeacherStudents() {
  const { state, updateState, saveTeacherNow } = useAppState();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.en;
  const currentTeacherEmail = state.googleUser ? state.googleUser.email : '';
  
  const [showModal, setShowModal] = useState(false);
  const [studName, setStudName] = useState('');
  const [studEmail, setStudEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const teacherStudents = (state.studentProfiles || []).filter(s => s.teacherEmail === currentTeacherEmail);
  const filteredStudents = teacherStudents.filter(student => {
    const query = searchQuery.toLowerCase().trim();
    return student.name.toLowerCase().includes(query) || student.email.toLowerCase().includes(query);
  });

  const handleRegisterStudent = (e) => {
    e.preventDefault();
    if (!studName.trim() || !studEmail.trim()) {
      alert("Please fill in both name and email.");
      return;
    }

    const name = studName.trim();
    const email = studEmail.trim();
    const randomHex = Math.floor(0x1000 + Math.random() * 0x8fff).toString(16).toUpperCase();
    const code = `STUD-${randomHex}`;

    const newStudent = { name, email, code, teacherEmail: currentTeacherEmail };
    const updatedProfiles = [...(state.studentProfiles || []), newStudent];

    saveTeacherNow(state.classes || [], updatedProfiles, currentTeacherEmail);

    setStudName('');
    setStudEmail('');
    setShowModal(false);
    alert(`Student profile registered successfully!\nName: ${name}\nAccess Code: ${code}\nGive this code to the student to let them log in.`);
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      alert(`Access Code ${code} copied to clipboard!`);
    }).catch(err => {
      console.error("Clipboard copy failed: ", err);
      alert(`Access Code is: ${code}`);
    });
  };

  const handleDeleteStudent = (code, name) => {
    if (confirm(`Are you sure you want to delete the student profile for ${name}? This will revoke their access.`)) {
      const updatedProfiles = (state.studentProfiles || []).filter(s => s.code !== code);
      saveTeacherNow(state.classes || [], updatedProfiles, currentTeacherEmail);
      alert(`Student profile for ${name} removed.`);
    }
  };

  return html`
    <div className="p-6 space-y-6 flex-grow overflow-y-auto">
      
      <!-- Top header -->
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/40 pb-5 text-left">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <i data-lucide="users" className="text-indigo-400 w-6 h-6"></i>
            Student Roster & Directory
          </h2>
          <p className="text-xs text-slate-400">Manage student access profiles, monitor enrollment keys, and invite new students to your classes.</p>
        </div>

        <button 
          onClick=${() => setShowModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/10 hover:opacity-95 active:scale-95 transition flex items-center gap-1.5"
        >
          <i data-lucide="user-plus" className="w-4 h-4"></i> Register Student
        </button>
      </div>

      <!-- Quick Metrics -->
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
        <div className="bg-slate-950/40 p-4.5 rounded-2xl border border-slate-900 flex justify-between items-center">
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase">Total Registered</div>
            <div className="text-lg font-bold font-mono text-slate-200 mt-0.5">${teacherStudents.length} Students</div>
          </div>
          <div className="text-indigo-400 bg-indigo-500/10 p-2 rounded-xl">
            <i data-lucide="users" className="w-4 h-4"></i>
          </div>
        </div>
        
        <div className="bg-slate-950/40 p-4.5 rounded-2xl border border-slate-900 flex justify-between items-center">
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase">Access Keys Active</div>
            <div className="text-lg font-bold font-mono text-slate-200 mt-0.5">${teacherStudents.filter(s => s.code).length} Keys</div>
          </div>
          <div className="text-accent-cyan bg-cyan-500/10 p-2 rounded-xl">
            <i data-lucide="key-round" className="w-4 h-4"></i>
          </div>
        </div>

        <div class="bg-slate-950/40 p-4.5 rounded-2xl border border-slate-900 flex justify-between items-center">
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase">Assigned Classroom Tracks</div>
            <div className="text-lg font-bold font-mono text-slate-200 mt-0.5">
              ${(state.classes || []).filter(c => c.teacherEmail === currentTeacherEmail).length} Classes
            </div>
          </div>
          <div className="text-accent-emerald bg-emerald-500/10 p-2 rounded-xl">
            <i data-lucide="folder-git" className="w-4 h-4"></i>
          </div>
        </div>
      </div>

      <!-- Filter Controls & Search -->
      <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/30 flex flex-col md:flex-row justify-between items-center gap-4 text-left">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <i data-lucide="search" className="w-4 h-4"></i>
          </span>
          <input 
            type="text" 
            value=${searchQuery}
            onChange=${(e) => setSearchQuery(e.target.value)}
            placeholder="Search students by name or email..." 
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500/50 outline-none transition"
          />
        </div>
        <div className="text-xs text-slate-500">
          Showing <span className="text-slate-300 font-bold">${filteredStudents.length}</span> of ${teacherStudents.length} profiles
        </div>
      </div>

      <!-- Students Table Panel -->
      <div className="glass-panel p-5 rounded-2xl space-y-4 text-left">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800/60 text-slate-400">
                <th className="py-3 font-semibold">Student Name</th>
                <th className="py-3 font-semibold">Email</th>
                <th className="py-3 font-semibold">Access Key</th>
                <th className="py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filteredStudents.map(student => {
                const initials = student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                return html`
                  <tr key=${student.code} className="border-b border-slate-900/60 hover:bg-slate-900/20 text-slate-300 transition duration-150">
                    <td className="py-3.5 font-bold flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-full bg-indigo-600/10 text-[10px] flex items-center justify-center font-bold text-indigo-400 border border-indigo-500/20 shadow-inner">
                        ${initials}
                      </div>
                      <span>${student.name}</span>
                    </td>
                    <td className="py-3.5 text-slate-400">${student.email}</td>
                    <td className="py-3.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 select-all">${student.code}</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick=${() => handleCopyCode(student.code)} className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold transition active:scale-95 flex items-center gap-1">
                          <i data-lucide="copy" className="w-3 h-3"></i> Copy Key
                        </button>
                        <button onClick=${() => handleDeleteStudent(student.code, student.name)} className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-[10px] font-semibold transition active:scale-95 flex items-center gap-1">
                          <i data-lucide="trash-2" className="w-3 h-3"></i> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              })}
              ${filteredStudents.length === 0 && html`
                <tr>
                  <td colSpan="4" className="py-12 text-center text-slate-500 font-medium">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <i data-lucide="users-2" className="w-8 h-8 text-slate-600"></i>
                      <span>No students found.</span>
                    </div>
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Register Student Modal Dialog -->
      ${showModal && html`
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <i data-lucide="user-plus" className="w-5 h-5 text-indigo-400"></i> Register Student Profile
              </h3>
              <button onClick=${() => setShowModal(false)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200">
                <i data-lucide="x" className="w-4 h-4"></i>
              </button>
            </div>
            
            <form onSubmit=${handleRegisterStudent} className="space-y-3.5 text-xs text-left">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Student's Full Name</label>
                <input 
                  type="text" 
                  value=${studName}
                  onChange=${(e) => setStudName(e.target.value)}
                  placeholder="e.g. John Doe" 
                  className="w-full glass-input p-2.5 rounded-xl text-slate-200 font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Student's Email</label>
                <input 
                  type="email" 
                  value=${studEmail}
                  onChange=${(e) => setStudEmail(e.target.value)}
                  placeholder="e.g. john@gmail.com" 
                  className="w-full glass-input p-2.5 rounded-xl text-slate-200 font-medium"
                  required
                />
              </div>

              <div className="flex justify-end items-center gap-2 pt-2 border-t border-slate-800">
                <button type="button" onClick=${() => setShowModal(false)} className="px-4 py-2 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-300 font-semibold text-xs rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/10">Generate Access Profile</button>
              </div>
            </form>
          </div>
        </div>
      `}

    </div>
  `;
}
