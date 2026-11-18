// CodeSphere Pro - 3D Tactile Student Roster & Key Directory (React Edition)
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
    if (!studName.trim() || !studEmail.trim()) return;

    const randomHex = Math.floor(0x1000 + Math.random() * 0x8fff).toString(16).toUpperCase();
    const code = `STUD-${randomHex}`;

    const newStudent = {
      name: studName.trim(),
      email: studEmail.trim(),
      code,
      teacherEmail: currentTeacherEmail
    };

    const updated = [...(state.studentProfiles || []), newStudent];
    saveTeacherNow(state.classes || [], updated, currentTeacherEmail);

    setStudName('');
    setStudEmail('');
    setShowModal(false);
  };

  const handleDelete = (code) => {
    if (confirm('Revoke access credentials for this student?')) {
      const updated = (state.studentProfiles || []).filter(s => s.code !== code);
      saveTeacherNow(state.classes || [], updated, currentTeacherEmail);
    }
  };

  return html`
    <div className="flex-grow p-4 md:p-8 bg-[#F4F7FE] overflow-y-auto">
      
      <!-- Top Title Bar -->
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#16213E] tracking-tight">Student Roster & Directory</h2>
          <p className="text-sm font-semibold text-[#566180] mt-0.5">Manage enrolled student keys, provision one-time OTP access, and monitor student accounts</p>
        </div>

        <button
          onClick=${() => setShowModal(true)}
          className="btn teal flex items-center gap-2 px-5 py-2.5 text-xs"
          style=${{ width: 'auto' }}
        >
          <i data-lucide="user-plus" className="w-4 h-4"></i>
          <span>Enroll Student</span>
        </button>
      </div>

      <!-- Search & Filters -->
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search students by name or university email..."
          value=${searchQuery}
          onInput=${(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md bg-white border border-[#D5DEF2] rounded-2xl px-4 py-2.5 text-xs font-bold text-[#16213E] focus:outline-none focus:border-indigo-600"
          style=${{ boxShadow: '0 3px 0 #D5DEF2' }}
        />
      </div>

      <!-- Students Table Plate -->
      <div className="bg-white rounded-3xl border border-[#D5DEF2] overflow-hidden"
           style=${{ boxShadow: '0 1px 0 #fff inset, 0 8px 0 -2px #CBD5EE, 0 28px 36px -18px rgba(22,33,62,0.22)' }}>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#EEF3FD] border-b border-[#D5DEF2] text-[#566180] font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Student Name</th>
                <th className="py-3.5 px-6">Email Address</th>
                <th className="py-3.5 px-6">Access Code</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D5DEF2] text-[#16213E]">
              ${filteredStudents.map(s => html`
                <tr key=${s.code} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 font-bold flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                      ${s.name.charAt(0)}
                    </div>
                    <span>${s.name}</span>
                  </td>
                  <td className="py-4 px-6 font-mono text-[#566180]">${s.email}</td>
                  <td className="py-4 px-6">
                    <span className="font-mono font-bold px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
                      ${s.code}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick=${() => handleDelete(s.code)}
                      className="chip text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                      title="Revoke access"
                    >
                      <i data-lucide="trash-2" className="w-3.5 h-3.5"></i>
                      <span>Revoke</span>
                    </button>
                  </td>
                </tr>
              `)}

              ${filteredStudents.length === 0 && html`
                <tr>
                  <td colSpan="4" className="py-8 text-center text-xs font-semibold text-[#566180] italic">
                    No student access profiles registered yet. Click "Enroll Student" above.
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>

      </div>

      <!-- Enroll Modal -->
      ${showModal && html`
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-[#D5DEF2]"
               style=${{ boxShadow: '0 1px 0 #fff inset, 0 10px 0 -2px #CBD5EE, 0 32px 48px -16px rgba(22,33,62,0.35)' }}>
            
            <h3 className="text-lg font-extrabold text-[#16213E] mb-1">Enroll New Student</h3>
            <p className="text-xs text-[#566180] mb-4">Generates an instant 6-digit access code for secure student sign-in.</p>

            <form onSubmit=${handleRegisterStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#16213E] mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Alex Chen"
                  value=${studName}
                  onInput=${(e) => setStudName(e.target.value)}
                  className="w-full bg-[#F0F4FD] border border-[#D5DEF2] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#16213E] focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#16213E] mb-1">Student University Email</label>
                <input
                  type="email"
                  required
                  placeholder="alex.chen@university.edu"
                  value=${studEmail}
                  onInput=${(e) => setStudEmail(e.target.value)}
                  className="w-full bg-[#F0F4FD] border border-[#D5DEF2] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#16213E] focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick=${() => setShowModal(false)}
                  className="chip text-xs hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn teal text-xs px-6 py-2.5"
                  style=${{ width: 'auto' }}
                >
                  Generate Access Key
                </button>
              </div>
            </form>
          </div>
        </div>
      `}

    </div>
  `;
}
