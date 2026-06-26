// CodeSphere Pro - Teacher Classroom & Grading Component (React Edition)
import React, { useState } from 'https://esm.sh/react@18.2.0';
import { TRANSLATIONS, html, useAppState } from '../state.js';

export function ClassroomTeacher() {
  const { state, updateState, saveTeacherNow } = useAppState();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.en;

  // Active user details
  const currentTeacherEmail = state.googleUser ? state.googleUser.email : '';
  const currentTeacherName = state.googleUser ? state.googleUser.name : 'Teacher';

  // Filter classes & student profiles belonging to this teacher
  const teacherClasses = (state.classes || []).filter(c => c.teacherEmail === currentTeacherEmail);
  const teacherStudents = (state.studentProfiles || []).filter(s => s.teacherEmail === currentTeacherEmail);

  // Active class ID
  const activeClassId = state.activeTeacherClassId || (teacherClasses[0] ? teacherClasses[0].id : null);
  const activeClass = teacherClasses.find(c => c.id === activeClassId);

  // Modals visibility state
  const [showClassModal, setShowClassModal] = useState(false);
  const [showAssModal, setShowAssModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);

  // Classroom Modal fields
  const [newClassCode, setNewClassCode] = useState('');
  const [newClassName, setNewClassName] = useState('');

  // Assignment Modal fields
  const [assTitle, setAssTitle] = useState('');
  const [assDesc, setAssDesc] = useState('');
  const [assDeadline, setAssDeadline] = useState('2026-07-31 23:59');
  const [assPoints, setAssPoints] = useState(100);

  // Student Modal fields
  const [studName, setStudName] = useState('');
  const [studEmail, setStudEmail] = useState('');

  const handleSelectClass = (id) => {
    updateState({ activeTeacherClassId: id });
  };

  const handleCreateClass = (e) => {
    e.preventDefault();
    if (!newClassCode.trim() || !newClassName.trim()) return;

    const code = newClassCode.trim();
    const name = newClassName.trim();

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

    const updatedClasses = [...state.classes, newClass];
    saveTeacherNow(updatedClasses, state.studentProfiles || [], currentTeacherEmail);
    updateState({ activeTeacherClassId: newClass.id });

    // Reset inputs & close modal
    setNewClassCode('');
    setNewClassName('');
    setShowClassModal(false);
    alert(`Classroom ${code} built successfully!`);
  };

  const handleCreateAssignment = (e) => {
    e.preventDefault();
    if (!assTitle.trim() || !assDesc.trim()) return;

    const title = assTitle.trim();
    const desc = assDesc.trim();
    const points = parseInt(assPoints) || 100;

    const targetClassId = activeClassId || teacherClasses[0]?.id;
    if (!targetClassId) return;

    const updatedClasses = state.classes.map(c => {
      if (c.id === targetClassId) {
        return {
          ...c,
          assignments: [
            ...c.assignments,
            {
              id: "assign-" + Math.floor(Math.random() * 1000),
              title,
              desc,
              deadline: assDeadline,
              maxPoints: points,
              submissions: []
            }
          ]
        };
      }
      return c;
    });

    saveTeacherNow(updatedClasses, state.studentProfiles || [], currentTeacherEmail);

    // Reset inputs & close modal
    setAssTitle('');
    setAssDesc('');
    setAssDeadline('2026-07-31 23:59');
    setAssPoints(100);
    setShowAssModal(false);
    alert("Coding Assignment published to subject track!");
  };

  const handleCreateStudent = (e) => {
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

    // Reset inputs & close modal
    setStudName('');
    setStudEmail('');
    setShowStudentModal(false);

    alert(`Student profile registered successfully!\nName: ${name}\nAccess Code: ${code}\nGive this code to the student to let them log in.`);
  };

  const handleScoreChange = (assId, studentName, val) => {
    const newScore = parseInt(val) || 0;

    const updatedClasses = state.classes.map(c => {
      return {
        ...c,
        assignments: c.assignments.map(a => {
          if (a.id === assId) {
            return {
              ...a,
              submissions: a.submissions.map(s => {
                if (s.studentName === studentName) {
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

    saveTeacherNow(updatedClasses, state.studentProfiles || [], currentTeacherEmail);
  };

  const handleReplayClick = (assId, studentName) => {
    updateState({
      activeTab: 'replay_viewer',
      replayTargetAssignmentId: assId,
      replayTargetStudent: studentName
    });
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      alert(`Access Code ${code} copied to clipboard!`);
    }).catch(err => {
      console.error("Clipboard copy failed: ", err);
      alert(`Access Code is: ${code}`);
    });
  };

  return html`
    <div className="p-6 space-y-6 flex-grow overflow-y-auto">
      
      <!-- Header controls -->
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/40 pb-5 text-left">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <i data-lucide="folder-git" className="text-indigo-400 w-6 h-6"></i>
            Teacher Dashboard & Grading
          </h2>
          <p className="text-xs text-slate-400">Add syllabus tracks, create custom tests, review student responses, and grade solutions.</p>
        </div>

        <button 
          onClick=${() => setShowClassModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/10 hover:opacity-95 active:scale-95 transition flex items-center gap-1.5"
        >
          <i data-lucide="plus-circle" className="w-4 h-4"></i> Create Class
        </button>
      </div>

      <!-- Main Layout Grid -->
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-left">
        
        <!-- Classes listing left -->
        <div className="space-y-2 lg:col-span-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block px-1 mb-2">My Supervised Classes</span>
          ${teacherClasses.map(c => {
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
                <div className="text-xs font-bold font-mono text-slate-400 mb-1">${c.code}</div>
                <div className="text-sm font-bold truncate w-full">${c.name.split(': ')[1] || c.name}</div>
                <div className="text-[10px] text-slate-500 mt-2 font-medium flex justify-between items-center w-full">
                  <span className="flex items-center gap-1"><i data-lucide="users" className="w-3 h-3 text-slate-400"></i> ${teacherStudents.length} Students</span>
                  <span className="font-mono text-indigo-400/80 bg-indigo-500/5 px-1.5 py-0.5 rounded border border-indigo-500/10">${c.inviteCode}</span>
                </div>
                ${isSel && html`<div className="absolute right-3 top-3 w-1.5 h-1.5 rounded-full bg-indigo-500"></div>`}
              </button>
            `;
          })}
        </div>

        <!-- Class manager right -->
        <div className="lg:col-span-3 space-y-6">
          ${activeClass ? html`
            <!-- Class Overview Panel -->
            <div className="bg-gradient-to-r from-slate-900/60 to-indigo-950/15 p-5 rounded-2xl border border-slate-800/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">${activeClass.code}</span>
                <h3 className="text-lg font-bold text-white mt-1.5">${activeClass.name}</h3>
                <p className="text-xs text-slate-400 mt-1">Invitation Share Code: <span className="font-mono text-slate-200 font-bold bg-slate-800 px-2 py-0.5 rounded border border-slate-700/40 select-all">${activeClass.inviteCode}</span></p>
              </div>

              <div className="flex items-center space-x-2">
                <button 
                  onClick=${() => setShowAssModal(true)}
                  className="px-3.5 py-2 bg-slate-800 border border-slate-700/60 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition active:scale-95 flex items-center gap-1"
                >
                  <i data-lucide="file-plus" className="w-3.5 h-3.5 text-accent-cyan"></i> Add Assignment
                </button>
              </div>
            </div>

            <!-- Student Submissions Matrix -->
            <div className="glass-panel p-5 rounded-2xl space-y-4">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <i data-lucide="check-square" className="w-4 h-4 text-indigo-400"></i> Code Submissions & Grading
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800/60 text-slate-400">
                      <th className="py-3 font-semibold">Student Name</th>
                      <th className="py-3 font-semibold">Assignment Title</th>
                      <th className="py-3 font-semibold">Language</th>
                      <th className="py-3 font-semibold">Submitted Date</th>
                      <th className="py-3 font-semibold">Score / Max</th>
                      <th className="py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${activeClass.assignments.flatMap(ass => 
                      ass.submissions.map(sub => html`
                        <tr key=${`${ass.id}-${sub.studentName}`} className="border-b border-slate-900/60 hover:bg-slate-900/20 text-slate-300">
                          <td className="py-3.5 font-bold flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-bold text-indigo-400 border border-slate-700/40">
                              ${sub.studentName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <span>${sub.studentName}</span>
                          </td>
                          <td className="py-3.5 font-medium">${ass.title}</td>
                          <td className="py-3.5 font-mono text-slate-400 uppercase">${sub.language}</td>
                          <td className="py-3.5 text-slate-500">${sub.time}</td>
                          <td className="py-3.5">
                            <input 
                              type="number" 
                              value=${sub.score} 
                              onChange=${(e) => handleScoreChange(ass.id, sub.studentName, e.target.value)}
                              max=${ass.maxPoints}
                              className="bg-slate-950/80 w-12 px-1.5 py-1 text-center font-mono font-bold text-accent-emerald border border-slate-800 rounded focus:border-slate-700 outline-none"
                            />
                            <span className="text-slate-500 font-semibold">/ ${ass.maxPoints}</span>
                          </td>
                          <td className="py-3.5 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button 
                                onClick=${() => handleReplayClick(ass.id, sub.studentName)}
                                className="px-2.5 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg font-bold flex items-center gap-1 transition"
                                title="Replay Keystroke Log"
                              >
                                <i data-lucide="history" className="w-3.5 h-3.5"></i> Replay
                              </button>
                            </div>
                          </td>
                        </tr>
                      `)
                    )}
                    ${activeClass.assignments.every(ass => ass.submissions.length === 0) && html`
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-500 font-medium">No student submissions logged yet.</td>
                      </tr>
                    `}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Student Roster & Access Codes -->
            <div className="glass-panel p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                  <i data-lucide="users" className="w-4 h-4 text-indigo-400"></i> Student Roster & Access Codes
                </h4>
                <button 
                  onClick=${() => setShowStudentModal(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition active:scale-95 flex items-center gap-1"
                >
                  <i data-lucide="user-plus" className="w-3.5 h-3.5"></i> Register Student
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800/60 text-slate-400">
                      <th className="py-2.5 font-semibold">Student Name</th>
                      <th className="py-2.5 font-semibold">Email</th>
                      <th className="py-2.5 font-semibold">Access Code</th>
                      <th className="py-2.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${teacherStudents.map(student => html`
                      <tr key=${student.code} className="border-b border-slate-900/60 hover:bg-slate-900/20 text-slate-300">
                        <td className="py-3 font-bold flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-bold text-indigo-400 border border-slate-700/40">
                            ${student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <span>${student.name}</span>
                        </td>
                        <td className="py-3 text-slate-400">${student.email}</td>
                        <td className="py-3">
                          <span className="font-mono text-xs text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 select-all">${student.code}</span>
                        </td>
                        <td className="py-3 text-right">
                          <button 
                            onClick=${() => handleCopyCode(student.code)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-semibold transition active:scale-95"
                          >
                            Copy Code
                          </button>
                        </td>
                      </tr>
                    `)}
                    ${(!teacherStudents || teacherStudents.length === 0) && html`
                      <tr>
                        <td colSpan="4" className="py-6 text-center text-slate-500 font-medium">No students registered yet. Click "Register Student" to generate access codes.</td>
                      </tr>
                    `}
                  </tbody>
                </table>
              </div>
            </div>
          ` : html`
            <div className="glass-panel p-8 text-center text-slate-400 font-medium">
              No classrooms created. Click "Create Class" on the top right to start a subject block.
            </div>
          `}
        </div>

      </div>

      <!-- Create Assignment Modal Overlay Dialog -->
      ${showAssModal && html`
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <i data-lucide="file-plus" className="w-5 h-5 text-indigo-400"></i> Add New Coding Assignment
              </h3>
              <button onClick=${() => setShowAssModal(false)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200">
                <i data-lucide="x" className="w-4 h-4"></i>
              </button>
            </div>
            
            <form onSubmit=${handleCreateAssignment} className="space-y-3.5 text-xs text-left">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Assignment Title</label>
                <input 
                  type="text" 
                  value=${assTitle}
                  onChange=${(e) => setAssTitle(e.target.value)}
                  placeholder="e.g., Reverse Linked List" 
                  className="w-full glass-input p-2.5 rounded-xl text-slate-200 font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description & Requirements</label>
                <textarea 
                  rows="4" 
                  value=${assDesc}
                  onChange=${(e) => setAssDesc(e.target.value)}
                  placeholder="Detail parameters, inputs, outputs, and edge conditions..." 
                  className="w-full glass-input p-2.5 rounded-xl text-slate-200 font-medium resize-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Due Date</label>
                  <input 
                    type="text" 
                    value=${assDeadline}
                    onChange=${(e) => setAssDeadline(e.target.value)}
                    placeholder="YYYY-MM-DD HH:MM" 
                    className="w-full glass-input p-2.5 rounded-xl text-slate-200 font-medium font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Max Score</label>
                  <input 
                    type="number" 
                    value=${assPoints}
                    onChange=${(e) => setAssPoints(e.target.value)}
                    className="w-full glass-input p-2.5 rounded-xl text-slate-200 font-medium font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end items-center gap-2 pt-2 border-t border-slate-800">
                <button type="button" onClick=${() => setShowAssModal(false)} className="px-4 py-2 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-300 font-semibold text-xs rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/10">Publish Task</button>
              </div>
            </form>
          </div>
        </div>
      `}

      <!-- Create Classroom Modal Dialog -->
      ${showClassModal && html`
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <i data-lucide="plus-circle" className="w-5 h-5 text-indigo-400"></i> Create A New Subject Class
              </h3>
              <button onClick=${() => setShowClassModal(false)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200">
                <i data-lucide="x" className="w-4 h-4"></i>
              </button>
            </div>
            
            <form onSubmit=${handleCreateClass} className="space-y-3.5 text-xs text-left">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Subject Code</label>
                <input 
                  type="text" 
                  value=${newClassCode}
                  onChange=${(e) => setNewClassCode(e.target.value)}
                  placeholder="e.g. CS202" 
                  className="w-full glass-input p-2.5 rounded-xl text-slate-200 font-medium font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Classroom Name</label>
                <input 
                  type="text" 
                  value=${newClassName}
                  onChange=${(e) => setNewClassName(e.target.value)}
                  placeholder="e.g. CS-202: Advanced Coding Architectures" 
                  className="w-full glass-input p-2.5 rounded-xl text-slate-200 font-medium"
                  required
                />
              </div>

              <div className="flex justify-end items-center gap-2 pt-2 border-t border-slate-800">
                <button type="button" onClick=${() => setShowClassModal(false)} className="px-4 py-2 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-300 font-semibold text-xs rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/10">Build Classroom</button>
              </div>
            </form>
          </div>
        </div>
      `}

      <!-- Register Student Modal Dialog -->
      ${showStudentModal && html`
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <i data-lucide="user-plus" className="w-5 h-5 text-indigo-400"></i> Register Student Profile
              </h3>
              <button onClick=${() => setShowStudentModal(false)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200">
                <i data-lucide="x" className="w-4 h-4"></i>
              </button>
            </div>
            
            <form onSubmit=${handleCreateStudent} className="space-y-3.5 text-xs text-left">
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
                <button type="button" onClick=${() => setShowStudentModal(false)} className="px-4 py-2 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-300 font-semibold text-xs rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/10">Generate Access Profile</button>
              </div>
            </form>
          </div>
        </div>
      `}

    </div>
  `;
}
