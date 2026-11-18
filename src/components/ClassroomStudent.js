// CodeSphere Pro - 3D Tactile Student Classroom Component (React Edition)
import React, { useState, useEffect } from 'https://esm.sh/react@18.2.0';
import { TRANSLATIONS, html, useAppState } from '../state.js';

export function ClassroomStudent() {
  const { state, updateState } = useAppState();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.en;
  
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  const studentClasses = state.classes || [];
  const activeClassId = state.activeStudentClassId || (studentClasses[0] ? studentClasses[0].id : null);
  const activeClass = studentClasses.find(c => c.id === activeClassId);

  const handleJoinClass = async (e) => {
    e.preventDefault();
    const codeVal = joinCode.trim().toUpperCase();
    if (!codeVal) return;

    setJoining(true);
    // Look up class by invite code in existing classes or simulate
    const existing = studentClasses.find(c => c.inviteCode && c.inviteCode.toUpperCase() === codeVal);
    if (existing) {
      alert('You are already enrolled in this class.');
      setJoining(false);
      return;
    }

    // Enrolled class placeholder
    const enrolled = {
      id: "cls-" + Math.floor(Math.random() * 10000),
      code: "CS-INVITED",
      name: `Joined Course (${codeVal})`,
      teacher: "Dr. Professor",
      teacherEmail: "professor@university.edu",
      inviteCode: codeVal,
      assignments: [
        {
          id: "asg-demo-1",
          title: "Introduction to Dynamic Programming",
          desc: "Solve the Fibonacci and Climbing Stairs problems using O(1) space memoization.",
          deadline: "2026-08-15 23:59",
          submissions: []
        }
      ]
    };

    const updated = [...studentClasses, enrolled];
    updateState({ classes: updated, activeStudentClassId: enrolled.id });
    setJoinCode('');
    setJoining(false);
    alert(`Enrolled successfully in class ${codeVal}!`);
  };

  const handleLaunchAssignment = (assignment, teacherEmail) => {
    updateState({
      activeTab: 'practice',
      activeAssignmentId: assignment.id,
      activeTeacherId: teacherEmail
    });
  };

  return html`
    <div className="flex-grow p-4 md:p-8 bg-[#F4F7FE] overflow-y-auto">
      
      <!-- Top Title Bar -->
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#16213E] tracking-tight">Student Classroom</h2>
          <p className="text-sm font-semibold text-[#566180] mt-0.5">Access enrolled courses, inspect assignments, and submit encrypted code</p>
        </div>

        <!-- Join Class Bevel Input Form -->
        <form onSubmit=${handleJoinClass} className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-[#D5DEF2]"
              style=${{ boxShadow: '0 4px 0 #D5DEF2' }}>
          <input
            type="text"
            required
            placeholder="INVITE CODE"
            value=${joinCode}
            onInput=${(e) => setJoinCode(e.target.value)}
            className="bg-[#F0F4FD] px-3.5 py-2 rounded-xl text-xs font-mono font-bold text-[#16213E] uppercase tracking-wider focus:outline-none w-32 md:w-36"
          />
          <button
            type="submit"
            disabled=${joining}
            className="btn teal text-xs px-4 py-2 font-bold flex items-center gap-1.5"
            style=${{ width: 'auto' }}
          >
            <i data-lucide="plus-circle" className="w-3.5 h-3.5"></i>
            <span>${joining ? 'Joining...' : 'Join'}</span>
          </button>
        </form>
      </div>

      <!-- Enrolled Classes Ribbon -->
      <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-6 select-none">
        ${studentClasses.map(c => {
          const isSelected = c.id === activeClassId;
          return html`
            <button
              key=${c.id}
              onClick=${() => updateState({ activeStudentClassId: c.id })}
              className=${`flex-shrink-0 px-5 py-3 rounded-2xl text-left font-bold text-xs transition-all duration-150 ${
                isSelected ? 'bg-indigo-600 text-white' : 'bg-white text-[#566180] hover:text-[#16213E] border border-[#D5DEF2]'
              }`}
              style=${isSelected ? {
                background: 'linear-gradient(180deg, #6366F1, #4F46E5)',
                boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 4px 0 #3730A3, 0 10px 14px -6px rgba(22,33,62,0.25)',
                transform: 'translateY(-2px)'
              } : {
                boxShadow: '0 3px 0 #D5DEF2'
              }}
            >
              <div className="text-[10px] uppercase font-mono opacity-80">${c.code || 'COURSE'}</div>
              <div className="text-sm font-extrabold truncate max-w-[170px]">${c.name}</div>
            </button>
          `;
        })}
        ${studentClasses.length === 0 && html`
          <div className="text-xs font-semibold text-[#566180] italic py-2">
            You are not enrolled in any classes yet. Enter an invite code from your instructor above.
          </div>
        `}
      </div>

      ${activeClass && html`
        <div className="space-y-6">
          
          <!-- Class Hero Banner -->
          <div className="bg-white rounded-2xl p-6 border border-[#D5DEF2]"
               style=${{ boxShadow: '0 1px 0 #fff inset, 0 8px 0 -2px #CBD5EE, 0 28px 36px -18px rgba(22,33,62,0.22)' }}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ENROLLED
                </span>
                <h3 className="text-xl font-extrabold text-[#16213E] mt-1.5">${activeClass.name}</h3>
                <p className="text-xs font-semibold text-[#566180]">Instructor: ${activeClass.teacher}</p>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold text-[#566180]">E2EE Submission Protection</div>
                <div className="text-xs font-mono font-bold text-indigo-600 mt-0.5">ECDH + AES-256-GCM Active</div>
              </div>
            </div>
          </div>

          <!-- Assignments List -->
          <div className="bg-white rounded-2xl p-6 border border-[#D5DEF2]"
               style=${{ boxShadow: '0 1px 0 #fff inset, 0 8px 0 -2px #CBD5EE, 0 28px 36px -18px rgba(22,33,62,0.22)' }}>
            
            <div className="flex items-center gap-2 mb-4">
              <i data-lucide="clipboard-check" className="w-5 h-5 text-indigo-600"></i>
              <h4 className="text-base font-extrabold text-[#16213E]">Assigned Homework & Exercises</h4>
            </div>

            <div className="divide-y divide-[#D5DEF2]">
              ${(activeClass.assignments || []).map(a => html`
                <div key=${a.id} className="py-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h5 className="text-sm font-bold text-[#16213E]">${a.title}</h5>
                    <p className="text-xs text-[#566180] max-w-xl">${a.desc}</p>
                    <div className="flex items-center gap-3 text-[11px] font-mono text-[#566180]">
                      <span className="text-rose-600 font-bold">Deadline: ${a.deadline}</span>
                    </div>
                  </div>

                  <button
                    onClick=${() => handleLaunchAssignment(a, activeClass.teacherEmail)}
                    className="btn text-xs px-5 py-2.5 flex items-center gap-1.5"
                    style=${{ width: 'auto' }}
                  >
                    <i data-lucide="code-2" className="w-3.5 h-3.5"></i>
                    <span>Solve in Practice Arena</span>
                  </button>
                </div>
              `)}

              ${(!activeClass.assignments || activeClass.assignments.length === 0) && html`
                <div className="py-8 text-center text-xs font-semibold text-[#566180] italic">
                  No active assignments currently published for this course.
                </div>
              `}
            </div>
          </div>

        </div>
      `}

    </div>
  `;
}
