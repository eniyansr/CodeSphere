// CodeSphere Pro - Unified Dashboard Component (React Edition)
import React, { useEffect, useRef } from 'https://esm.sh/react@18.2.0';
import { TRANSLATIONS, html, useAppState } from '../state.js';

export function Dashboard() {
  const { state, updateState } = useAppState();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.en;
  
  const chartCanvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // Dynamic Chart Initialization
  useEffect(() => {
    if (!chartCanvasRef.current) return;

    // Destroy old chart
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    const ctx = chartCanvasRef.current.getContext('2d');

    if (state.role === 'teacher') {
      const currentTeacherEmail = state.googleUser ? state.googleUser.email : '';
      if (!currentTeacherEmail) return;
      const teacherClasses = (state.classes || []).filter(c => c.teacherEmail === currentTeacherEmail);

      const langCounts = {};
      teacherClasses.forEach(c => {
        c.assignments.forEach(a => {
          if (a.submissions) {
            a.submissions.forEach(s => {
              const lang = s.language ? s.language.toLowerCase() : 'javascript';
              langCounts[lang] = (langCounts[lang] || 0) + 1;
            });
          }
        });
      });

      const labels = Object.keys(langCounts).length > 0 
        ? Object.keys(langCounts).map(l => l.toUpperCase()) 
        : ['No Submissions'];
      const data = Object.values(langCounts).length > 0 
        ? Object.values(langCounts) 
        : [1];
      const bgColors = Object.keys(langCounts).length > 0 
        ? Object.keys(langCounts).map(l => {
            if (l === 'javascript') return 'rgba(99, 102, 241, 0.65)';
            if (l === 'python') return 'rgba(6, 182, 212, 0.65)';
            if (l === 'cpp') return 'rgba(244, 63, 94, 0.65)';
            return 'rgba(16, 185, 129, 0.65)';
          }) 
        : ['rgba(148, 163, 184, 0.15)'];

      chartInstanceRef.current = new window.Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: bgColors,
            borderColor: 'rgba(255, 255, 255, 0.05)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11 } }
            }
          }
        }
      });
    } else {
      // Student chart
      chartInstanceRef.current = new window.Chart(ctx, {
        type: 'line',
        data: {
          labels: ['June 5', 'June 10', 'June 15', 'June 20', 'June 23'],
          datasets: [{
            label: 'Grade Score Accuracy (%)',
            data: [75, 80, 85, 95, 90],
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.08)',
            fill: true,
            tension: 0.35,
            borderWidth: 2.5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              grid: { color: 'rgba(255,255,255,0.03)' },
              ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 10 } }
            },
            x: {
              grid: { color: 'rgba(255,255,255,0.03)' },
              ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 10 } }
            }
          },
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [state.role, state.classes, state.googleUser, state.language]);

  const handleSolvePuzzle = (pName) => {
    const templates = {
      "Two Sum": `function twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const diff = target - nums[i];\n        if (map.has(diff)) return [map.get(diff), i];\n        map.set(nums[i], i);\n    }\n    return [];\n}`,
      "Reverse Linked List": `// Reversing linked list in python\ndef reverseList(head):\n    prev = None\n    curr = head\n    while curr:\n        nxt = curr.next\n        curr.next = prev\n        prev = curr\n        curr = nxt\n    return prev`,
      "Median of Two Sorted Arrays": `// Hard challenge template`,
      "Longest Palindromic Substring": `// Longest Palindromic Substring template`
    };

    const updatedCode = { ...state.editorCode };
    if (pName.includes("Reverse")) {
      updatedCode.python = templates[pName];
      updateState({
        editorCode: updatedCode,
        activeLanguage: 'python',
        activeTab: 'practice'
      });
    } else {
      updatedCode.javascript = templates[pName];
      updateState({
        editorCode: updatedCode,
        activeLanguage: 'javascript',
        activeTab: 'practice'
      });
    }
  };

  if (state.role === 'teacher') {
    return renderTeacherDashboard();
  }

  return renderStudentDashboard();

  // Helper renderers
  function renderStudentDashboard() {
    const practicePuzzles = [
      { id: "puzzle-1", title: "Two Sum", difficulty: "Easy", solved: true, accuracy: "94%" },
      { id: "puzzle-2", title: "Reverse Linked List", difficulty: "Easy", solved: false, accuracy: "89%" },
      { id: "puzzle-3", title: "Median of Two Sorted Arrays", difficulty: "Hard", solved: false, accuracy: "22%" },
      { id: "puzzle-4", title: "Longest Palindromic Substring", difficulty: "Medium", solved: false, accuracy: "45%" }
    ];

    return html`
      <div className="p-6 space-y-6 flex-grow overflow-y-auto">
        <!-- Top header message -->
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/40 pb-5 text-left">
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Welcome back, ${state.googleUser ? state.googleUser.name : 'Eniyan Rajesh'}!
            </h2>
            <p className="text-xs text-slate-400">Track study metrics, verify certification tracks, and continue your assessment queues.</p>
          </div>
          
          <div className="flex items-center space-x-2 font-mono text-xs text-slate-400 bg-slate-900/60 px-3.5 py-2 rounded-xl border border-slate-800/50">
            <i data-lucide="award" className="w-4 h-4 text-indigo-400"></i>
            <span>Arena Rating: <strong className="text-indigo-300">915 AP (#2)</strong></span>
          </div>
        </div>

        <!-- Quick Metrics Grid -->
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          <div className="glass-panel p-4.5 rounded-2xl border-l-4 border-indigo-500 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Assignments Solved</span>
              <div className="text-xl font-bold font-mono text-slate-200">1 / 3 Tasks</div>
            </div>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg"><i data-lucide="check-square" className="w-5 h-5"></i></div>
          </div>

          <div className="glass-panel p-4.5 rounded-2xl border-l-4 border-accent-cyan flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Coding Accuracy</span>
              <div className="text-xl font-bold font-mono text-accent-cyan">89% Average</div>
            </div>
            <div className="p-2 bg-cyan-500/10 text-accent-cyan rounded-lg"><i data-lucide="target" className="w-5 h-5"></i></div>
          </div>

          <div className="glass-panel p-4.5 rounded-2xl border-l-4 border-accent-emerald flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Earned Certs</span>
              <div className="text-xl font-bold font-mono text-accent-emerald">2 Certificates</div>
            </div>
            <div className="p-2 bg-emerald-500/10 text-accent-emerald rounded-lg"><i data-lucide="award" className="w-5 h-5"></i></div>
          </div>

          <div className="glass-panel p-4.5 rounded-2xl border-l-4 border-accent-rose flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Security Status</span>
              <div className="text-xl font-bold font-mono text-accent-emerald">Verified Safe</div>
            </div>
            <div className="p-2 bg-rose-500/10 text-accent-rose rounded-lg"><i data-lucide="shield" className="w-5 h-5"></i></div>
          </div>
        </div>

        <!-- Graph and details split grid -->
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
          
          <!-- Left: Progress Chart canvas -->
          <div className="glass-panel p-5 rounded-2xl lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <i data-lucide="bar-chart-3" className="w-4 h-4 text-indigo-400"></i> Performance Diagnostics Trends
            </h3>
            <div className="relative w-full h-64">
              <canvas ref=${chartCanvasRef}></canvas>
            </div>
          </div>

          <!-- Right: Strength & Weak Areas -->
          <div className="glass-panel p-5 rounded-2xl space-y-4 flex flex-col justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <i data-lucide="brain" className="w-4 h-4 text-indigo-400"></i> Skill Diagnostic Index
            </h3>
            
            <div className="space-y-3 flex-grow font-semibold">
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>JavaScript Core Algorithms</span>
                  <span className="text-accent-cyan font-bold">92% (Advanced)</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 border border-slate-800/40">
                  <div className="bg-accent-cyan h-1.5 rounded-full" style=${{ width: '92%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Python Scripting & recursion</span>
                  <span className="text-indigo-400 font-bold">85% (Proficient)</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 border border-slate-800/40">
                  <div className="bg-indigo-500 h-1.5 rounded-full" style=${{ width: '85%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>SQL Server Schema queries</span>
                  <span className="text-accent-emerald font-bold">78% (Intermediate)</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 border border-slate-800/40">
                  <div className="bg-accent-emerald h-1.5 rounded-full" style=${{ width: '78%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>C++ Low Level Pointers</span>
                  <span className="text-accent-amber font-bold">60% (Developing)</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 border border-slate-800/40">
                  <div className="bg-accent-amber h-1.5 rounded-full" style=${{ width: '60%' }}></div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-950 flex justify-between text-[10px] text-slate-500 font-bold">
              <span>Primary Competency: JavaScript</span>
              <span>Focus Area: C++ memory</span>
            </div>
          </div>
        </div>

        <!-- Practice items grid -->
        <div className="glass-panel p-5 rounded-2xl space-y-4 text-left">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
            <i data-lucide="code-2" className="w-4 h-4 text-indigo-400"></i> Sandbox Practice Arena
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            ${practicePuzzles.map(p => html`
              <div key=${p.id} className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 hover:border-slate-800 transition flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className=${`px-2 py-0.5 rounded text-[8px] font-bold font-mono ${
                      p.difficulty === 'Easy' ? 'bg-emerald-500/10 text-accent-emerald border border-emerald-500/15' : p.difficulty === 'Medium' ? 'bg-amber-500/10 text-accent-amber border border-amber-500/15' : 'bg-rose-500/10 text-accent-rose border border-rose-500/15'
                    }`}>
                      ${p.difficulty}
                    </span>
                    ${p.solved && html`<span className="text-accent-emerald text-[10px] font-bold flex items-center gap-0.5"><i data-lucide="check" className="w-3.5 h-3.5"></i> Solved</span>`}
                  </div>
                  <h4 className="text-xs font-bold text-slate-300 truncate mt-1.5">${p.title}</h4>
                </div>

                <button 
                  onClick=${() => handleSolvePuzzle(p.title)}
                  className="w-full py-2 hover:bg-slate-800/80 rounded-lg text-slate-400 hover:text-slate-200 text-[10px] font-bold border border-slate-900 hover:border-slate-700/60 transition flex items-center justify-center gap-1"
                >
                  <i data-lucide="code-2" className="w-3.5 h-3.5"></i> Code Challenge
                </button>
              </div>
            `)}
          </div>
        </div>
      </div>
    `;
  }

  function renderTeacherDashboard() {
    const currentTeacherEmail = state.googleUser ? state.googleUser.email : '';
    const teacherClasses = (state.classes || []).filter(c => c.teacherEmail === currentTeacherEmail);
    const teacherStudents = (state.studentProfiles || []).filter(s => s.teacherEmail === currentTeacherEmail);

    const totalStudents = teacherStudents.length;
    let totalSubmissionsCount = 0;
    let totalPercent = 0;
    let submissionsCount = 0;
    
    teacherClasses.forEach(c => {
      c.assignments.forEach(a => {
        totalSubmissionsCount += (a.submissions ? a.submissions.length : 0);
        const maxPoints = a.maxPoints || 100;
        if (a.submissions) {
          a.submissions.forEach(s => {
            totalPercent += (s.score / maxPoints) * 100;
            submissionsCount++;
          });
        }
      });
    });
    
    const avgPercentage = submissionsCount > 0 ? (totalPercent / submissionsCount).toFixed(1) : "0.0";

    const classScores = teacherClasses.map(c => {
      let classPercent = 0;
      let classSubCount = 0;
      c.assignments.forEach(a => {
        const maxPoints = a.maxPoints || 100;
        if (a.submissions) {
          a.submissions.forEach(s => {
            classPercent += (s.score / maxPoints) * 100;
            classSubCount++;
          });
        }
      });
      const avg = classSubCount > 0 ? Math.round(classPercent / classSubCount) : 0;
      return {
        code: c.code,
        name: c.name.split(': ')[1] || c.name,
        avg: avg
      };
    });

    let highestClassCode = "None";
    let highestClassAvg = -1;
    classScores.forEach(cs => {
      if (cs.avg > highestClassAvg) {
        highestClassAvg = cs.avg;
        highestClassCode = cs.code;
      }
    });

    return html`
      <div className="p-6 space-y-6 flex-grow overflow-y-auto">
        <!-- Top header message -->
        <div className="flex justify-between items-center border-b border-slate-800/40 pb-5 text-left">
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Supervising Classroom Analytics
            </h2>
            <p className="text-xs text-slate-400">Audit class sizes, track evaluation indices, and analyze programming compiler languages metrics.</p>
          </div>
        </div>

        <!-- Quick Metrics Grid -->
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          <div className="glass-panel p-4.5 rounded-2xl border-l-4 border-indigo-500 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Supervised Students</span>
              <div className="text-xl font-bold font-mono text-slate-200">${totalStudents} Enrolled</div>
            </div>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg"><i data-lucide="users" className="w-5 h-5"></i></div>
          </div>

          <div className="glass-panel p-4.5 rounded-2xl border-l-4 border-accent-cyan flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Class Pass Ratio</span>
              <div className="text-xl font-bold font-mono text-accent-cyan">${avgPercentage}% Percentage</div>
            </div>
            <div className="p-2 bg-cyan-500/10 text-accent-cyan rounded-lg"><i data-lucide="trending-up" className="w-5 h-5"></i></div>
          </div>

          <div className="glass-panel p-4.5 rounded-2xl border-l-4 border-accent-emerald flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tasks Submitted</span>
              <div className="text-xl font-bold font-mono text-accent-emerald">${totalSubmissionsCount} Total Solutions</div>
            </div>
            <div className="p-2 bg-emerald-500/10 text-accent-emerald rounded-lg"><i data-lucide="file-check-2" className="w-5 h-5"></i></div>
          </div>

          <div className="glass-panel p-4.5 rounded-2xl border-l-4 border-accent-rose flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Security Events Logged</span>
              <div className="text-xl font-bold font-mono text-accent-rose">${state.securityLogs.length} Warnings</div>
            </div>
            <div className="p-2 bg-rose-500/10 text-accent-rose rounded-lg"><i data-lucide="shield-alert" className="w-5 h-5"></i></div>
          </div>
        </div>

        <!-- Graph and details split grid -->
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
          
          <!-- Left: Progress Chart canvas -->
          <div className="glass-panel p-5 rounded-2xl lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <i data-lucide="bar-chart-3" className="w-4 h-4 text-indigo-400"></i> Compiler Languages Allocation & Usage Index
            </h3>
            <div className="relative w-full h-64">
              <canvas ref=${chartCanvasRef}></canvas>
            </div>
          </div>

          <!-- Right: Syllabus tracker -->
          <div className="glass-panel p-5 rounded-2xl space-y-4 flex flex-col justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <i data-lucide="compass" className="w-4 h-4 text-indigo-400"></i> Course Curriculum Marks
            </h3>
            
            <div className="space-y-3.5 flex-grow font-semibold">
              ${classScores.map(cs => html`
                <div key=${cs.code}>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>${cs.code} (${cs.name})</span>
                    <span className="text-indigo-400 font-bold">${cs.avg}% Avg Score</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 border border-slate-800/40">
                    <div className="bg-indigo-500 h-1.5 rounded-full" style=${{ width: `${cs.avg}%` }}></div>
                  </div>
                </div>
              `)}
              ${classScores.length === 0 && html`
                <div className="text-xs text-slate-500 font-medium text-center py-8">No supervised classes created yet.</div>
              `}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-950 flex justify-between text-[10px] text-slate-500 font-bold">
              <span>Highest Class: ${highestClassCode}</span>
              <span>Total Classes: ${teacherClasses.length}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
