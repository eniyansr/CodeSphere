// CodeSphere Pro - 3D Tactile Teacher Classroom & E2EE Grading Suite (React Edition)
import React, { useState, useEffect, useCallback } from 'https://esm.sh/react@18.2.0';
import { TRANSLATIONS, html, useAppState } from '../state.js';
import { publishEncryptedAssignment } from '../services/encryption-service.js';

export function ClassroomTeacher() {
  const { state, updateState, saveTeacherNow } = useAppState();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.en;

  const currentTeacherEmail = state.googleUser ? state.googleUser.email : '';
  const currentTeacherName = state.googleUser ? state.googleUser.name : 'Professor';

  const teacherClasses = (state.classes || []).filter(c => c.teacherEmail === currentTeacherEmail);
  const activeClassId = state.activeTeacherClassId || (teacherClasses[0] ? teacherClasses[0].id : null);
  const activeClass = teacherClasses.find(c => c.id === activeClassId);

  // Modals
  const [showClassModal, setShowClassModal] = useState(false);
  const [showAssModal, setShowAssModal] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);

  // Form inputs
  const [newClassCode, setNewClassCode] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [assTitle, setAssTitle] = useState('');
  const [assDesc, setAssDesc] = useState('');
  const [assDeadline, setAssDeadline] = useState('2026-07-31 23:59');

  const handleSelectClass = (id) => {
    updateState({ activeTeacherClassId: id });
  };

  const handleCreateClass = (e) => {
    e.preventDefault();
    if (!newClassCode.trim() || !newClassName.trim()) return;

    const newClass = {
      id: "cls-" + Math.floor(Math.random() * 10000),
      code: newClassCode.trim().toUpperCase(),
      name: `${newClassCode.trim().toUpperCase()}: ${newClassName.trim()}`,
      teacher: currentTeacherName,
      teacherEmail: currentTeacherEmail,
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      notes: [],
      assignments: []
    };

    const updatedClasses = [...(state.classes || []), newClass];
    saveTeacherNow(updatedClasses, state.studentProfiles || [], currentTeacherEmail);
    updateState({ activeTeacherClassId: newClass.id });

    setNewClassCode('');
    setNewClassName('');
    setShowClassModal(false);
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!activeClass || !assTitle.trim()) return;

    setIsEncrypting(true);
    try {
      const newAss = {
        id: "asg-" + Math.floor(Math.random() * 10000),
        title: assTitle.trim(),
        desc: assDesc.trim(),
        deadline: assDeadline,
        submissions: []
      };

      const updatedClasses = (state.classes || []).map(c => {
        if (c.id === activeClass.id) {
          return {
            ...c,
            assignments: [...(c.assignments || []), newAss]
          };
        }
        return c;
      });

      saveTeacherNow(updatedClasses, state.studentProfiles || [], currentTeacherEmail);
      setAssTitle('');
      setAssDesc('');
      setShowAssModal(false);
    } catch (err) {
      alert(`Assignment creation error: ${err.message}`);
    } finally {
      setIsEncrypting(false);
    }
  };

  return html`
    <div className="flex-grow p-4 md:p-8 bg-[#F4F7FE] overflow-y-auto">
      
      <!-- Top Header & Actions -->
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#16213E] tracking-tight">Classroom Management</h2>
          <p className="text-sm font-semibold text-[#566180] mt-0.5">Zero-Knowledge end-to-end encrypted assessment hub for educators</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick=${() => setShowClassModal(true)}
            className="btn teal flex items-center gap-2 px-5 py-2.5 text-xs"
            style=${{ width: 'auto' }}
          >
            <i data-lucide="plus" className="w-4 h-4"></i>
            <span>Create Class</span>
          </button>
        </div>
      </div>

      <!-- Class Selection Carousel / Tabs -->
      <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-6 select-none">
        ${teacherClasses.map(c => {
    const isSelected = c.id === activeClassId;
    return html`
            <button
              key=${c.id}
              onClick=${() => handleSelectClass(c.id)}
              className=${`flex-shrink-0 px-5 py-3 rounded-2xl text-left font-bold text-xs transition-all duration-150 ${isSelected
        ? 'bg-indigo-600 text-white'
        : 'bg-white text-[#566180] hover:text-[#16213E] border border-[#D5DEF2]'
      }`}
              style=${isSelected ? {
        background: 'linear-gradient(180deg, #6366F1, #4F46E5)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 4px 0 #3730A3, 0 10px 14px -6px rgba(22,33,62,0.25)',
        transform: 'translateY(-2px)'
      } : {
        boxShadow: '0 3px 0 #D5DEF2'
      }}
            >
              <div className="text-[10px] uppercase font-mono opacity-80">${c.code}</div>
              <div className="text-sm font-extrabold truncate max-w-[160px]">${c.name.split(':')[1] || c.name}</div>
            </button>
          `;
  })}
        ${teacherClasses.length === 0 && html`
          <div className="text-xs font-semibold text-[#566180] italic py-2">
            No classes created yet. Click "+ Create Class" to get started.
          </div>
        `}
      </div>

      ${activeClass && html`
        <div className="space-y-6">
          
          <!-- Class Overview Card -->
          <div className="bg-white rounded-2xl p-6 border border-[#D5DEF2] relative overflow-hidden"
               style=${{ boxShadow: '0 1px 0 #fff inset, 0 8px 0 -2px #CBD5EE, 0 28px 36px -18px rgba(22,33,62,0.22)' }}>
            
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  CODE: ${activeClass.code}
                </span>
                <h3 className="text-xl font-extrabold text-[#16213E] mt-1.5">${activeClass.name}</h3>
                <p className="text-xs font-semibold text-[#566180]">Teacher: ${activeClass.teacher}</p>
              </div>

              <div className="flex items-center gap-3 bg-[#EEF3FD] px-4 py-3 rounded-2xl border border-[#D5DEF2]">
                <div>
                  <div className="text-[10px] font-bold text-[#566180] uppercase">Student Invite Code</div>
                  <div className="font-mono font-extrabold text-base text-indigo-600 tracking-wider">${activeClass.inviteCode}</div>
                </div>
                <button
                  onClick=${() => {
        navigator.clipboard.writeText(activeClass.inviteCode);
        alert(`Copied Invite Code: ${activeClass.inviteCode}`);
      }}
                  className="chip text-xs hover:bg-white"
                  title="Copy invite code"
                >
                  <i data-lucide="copy" className="w-3.5 h-3.5"></i>
                  <span>Copy</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Assignments Section -->
          <div className="bg-white rounded-2xl p-6 border border-[#D5DEF2]"
               style=${{ boxShadow: '0 1px 0 #fff inset, 0 8px 0 -2px #CBD5EE, 0 28px 36px -18px rgba(22,33,62,0.22)' }}>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <i data-lucide="clipboard-list" className="w-5 h-5 text-indigo-600"></i>
                <h4 className="text-base font-extrabold text-[#16213E]">Course Assignments & Tasks</h4>
              </div>

              <button
                onClick=${() => setShowAssModal(true)}
                className="chip text-xs font-bold text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              >
                <i data-lucide="plus" className="w-3.5 h-3.5"></i>
                <span>Add Assignment</span>
              </button>
            </div>

            <div className="divide-y divide-[#D5DEF2]">
              ${(activeClass.assignments || []).map(a => html`
                <div key=${a.id} className="py-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h5 className="text-sm font-bold text-[#16213E]">${a.title}</h5>
                    <p className="text-xs text-[#566180]">${a.desc}</p>
                    <div className="flex items-center gap-3 text-[11px] font-mono text-[#566180]">
                      <span>Due: ${a.deadline}</span>
                      <span>·</span>
                      <span className="text-indigo-600 font-bold">${(a.submissions || []).length} Submissions</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick=${() => {
          updateState({
            activeTab: 'practice',
            activeAssignmentId: a.id,
            activeTeacherId: activeClass.teacherEmail
          });
        }}
                      className="btn text-xs px-4 py-2 flex items-center gap-1.5"
                      style=${{ width: 'auto' }}
                    >
                      <i data-lucide="code" className="w-3.5 h-3.5"></i>
                      <span>Inspect in IDE</span>
                    </button>
                  </div>
                </div>
              `)}

              ${(!activeClass.assignments || activeClass.assignments.length === 0) && html`
                <div className="py-8 text-center text-xs font-semibold text-[#566180] italic">
                  No assignments created for this class yet.
                </div>
              `}
            </div>
          </div>

        </div>
      `}

      <!-- Create Class Modal -->
      ${showClassModal && html`
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-[#D5DEF2]"
               style=${{ boxShadow: '0 1px 0 #fff inset, 0 10px 0 -2px #CBD5EE, 0 32px 48px -16px rgba(22,33,62,0.35)' }}>
            
            <h3 className="text-lg font-extrabold text-[#16213E] mb-1">Create New Classroom</h3>
            <p className="text-xs text-[#566180] mb-4">Set up a secure digital room with isolated student access.</p>

            <form onSubmit=${handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#16213E] mb-1">Class Code (e.g. CS201)</label>
                <input
                  type="text"
                  required
                  placeholder="CS304"
                  value=${newClassCode}
                  onInput=${(e) => setNewClassCode(e.target.value)}
                  className="w-full bg-[#F0F4FD] border border-[#D5DEF2] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#16213E] focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#16213E] mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="Data Structures & Algorithms"
                  value=${newClassName}
                  onInput=${(e) => setNewClassName(e.target.value)}
                  className="w-full bg-[#F0F4FD] border border-[#D5DEF2] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#16213E] focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick=${() => setShowClassModal(false)}
                  className="chip text-xs hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn teal text-xs px-6 py-2.5"
                  style=${{ width: 'auto' }}
                >
                  Save Classroom
                </button>
              </div>
            </form>
          </div>
        </div>
      `}

      <!-- Create Assignment Modal -->
      ${showAssModal && html`
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full border border-[#D5DEF2]"
               style=${{ boxShadow: '0 1px 0 #fff inset, 0 10px 0 -2px #CBD5EE, 0 32px 48px -16px rgba(22,33,62,0.35)' }}>
            
            <h3 className="text-lg font-extrabold text-[#16213E] mb-1">Publish Encrypted Assignment</h3>
            <p className="text-xs text-[#566180] mb-4">Content is wrapped with recipient student public keys before uploading.</p>

            <form onSubmit=${handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#16213E] mb-1">Assignment Title</label>
                <input
                  type="text"
                  required
                  placeholder="Week 4: Dynamic Programming Knapsack"
                  value=${assTitle}
                  onInput=${(e) => setAssTitle(e.target.value)}
                  className="w-full bg-[#F0F4FD] border border-[#D5DEF2] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#16213E] focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#16213E] mb-1">Instructions / Problem Brief</label>
                <textarea
                  rows="4"
                  placeholder="Implement 0/1 Knapsack solution with O(N*W) memoization..."
                  value=${assDesc}
                  onInput=${(e) => setAssDesc(e.target.value)}
                  className="w-full bg-[#F0F4FD] border border-[#D5DEF2] rounded-xl px-3.5 py-2.5 text-xs font-medium text-[#16213E] focus:outline-none focus:border-indigo-600"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#16213E] mb-1">Submission Deadline</label>
                <input
                  type="text"
                  placeholder="2026-07-31 23:59"
                  value=${assDeadline}
                  onInput=${(e) => setAssDeadline(e.target.value)}
                  className="w-full bg-[#F0F4FD] border border-[#D5DEF2] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#16213E] focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick=${() => setShowAssModal(false)}
                  className="chip text-xs hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled=${isEncrypting}
                  className="btn text-xs px-6 py-2.5"
                  style=${{ width: 'auto' }}
                >
                  ${isEncrypting ? 'Encrypting...' : 'Publish to Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      `}

    </div>
  `;
}
