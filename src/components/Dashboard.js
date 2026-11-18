// CodeSphere Pro - 3D Tactile Dashboard Component (React Edition)
// Interactive 3D tilt cards, SVG performance trend, animated skill bars, and one-click challenge launcher.
import React, { useEffect, useRef } from 'https://esm.sh/react@18.2.0';
import { TRANSLATIONS, html, useAppState } from '../state.js';

export function Dashboard() {
  const { state, updateState } = useAppState();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.en;

  // Mouse tilt effect for 3D cards
  useEffect(() => {
    const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    if (calm) return;

    const cards = document.querySelectorAll('[data-tilt]');
    const cleanups = [];

    cards.forEach(el => {
      const max = +el.dataset.tilt || 8;
      const onMove = (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `rotateY(${x * max}deg) rotateX(${-y * max}deg) translateY(-4px)`;
      };
      const onLeave = () => {
        el.style.transform = '';
      };
      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerleave', onLeave);
      cleanups.push(() => {
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerleave', onLeave);
      });
    });

    return () => cleanups.forEach(c => c());
  });

  // Handle Practice problem challenge launch
  const handleLaunchChallenge = (pName) => {
    const templates = {
      "Two Sum": `// CodeSphere - Two Sum Challenge\nfunction twoSum(nums, target) {\n    const seen = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (seen.has(complement)) {\n            return [seen.get(complement), i];\n        }\n        seen.set(nums[i], i);\n    }\n    return [];\n}\nconsole.log("Two Sum Test:", twoSum([2, 7, 11, 15], 9));\n`,
      "Reverse Linked List": `# CodeSphere - Reverse Linked List Challenge\nclass ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\ndef reverseList(head):\n    prev = None\n    curr = head\n    while curr:\n        next_node = curr.next\n        curr.next = prev\n        prev = curr\n        curr = next_node\n    return prev\n\nprint("Reverse Linked List loaded successfully!")\n`,
      "Median of Two Sorted Arrays": `// CodeSphere - Median of Two Sorted Arrays (Hard)\nfunction findMedianSortedArrays(nums1, nums2) {\n    const merged = [...nums1, ...nums2].sort((a, b) => a - b);\n    const mid = Math.floor(merged.length / 2);\n    return merged.length % 2 !== 0 ? merged[mid] : (merged[mid - 1] + merged[mid]) / 2;\n}\nconsole.log("Median:", findMedianSortedArrays([1, 3], [2]));\n`,
      "Longest Palindromic Substring": `// CodeSphere - Longest Palindromic Substring\nfunction longestPalindrome(s) {\n    if (!s || s.length <= 1) return s;\n    let start = 0, maxLength = 1;\n    function expand(left, right) {\n        while (left >= 0 && right < s.length && s[left] === s[right]) {\n            const len = right - left + 1;\n            if (len > maxLength) { start = left; maxLength = len; }\n            left--; right++;\n        }\n    }\n    for (let i = 0; i < s.length; i++) {\n        expand(i, i);\n        expand(i, i + 1);\n    }\n    return s.substring(start, start + maxLength);\n}\nconsole.log("Palindrome:", longestPalindrome("babad"));\n`
    };

    const updatedCode = { ...state.editorCode };
    if (pName.includes("Reverse")) {
      updatedCode.python = templates[pName] || templates["Reverse Linked List"];
      updateState({
        editorCode: updatedCode,
        activeLanguage: 'python',
        activeTab: 'practice'
      });
    } else {
      updatedCode.javascript = templates[pName] || templates["Two Sum"];
      updateState({
        editorCode: updatedCode,
        activeLanguage: 'javascript',
        activeTab: 'practice'
      });
    }
  };

  const studentName = state.googleUser ? state.googleUser.name : 'GitHub Contributor';

  // ===========================================================================
  // TEACHER DASHBOARD
  // ===========================================================================
  if (state.role === 'teacher') {
    const currentTeacherEmail = state.googleUser ? state.googleUser.email : '';
    const teacherClasses = (state.classes || []).filter(c => c.teacherEmail === currentTeacherEmail);
    const totalStudents = teacherClasses.reduce((acc, c) => acc + (c.enrolledStudents ? c.enrolledStudents.length : 0), 0);
    const totalSubmissions = teacherClasses.reduce((acc, c) => {
      return acc + (c.assignments || []).reduce((subAcc, a) => subAcc + (a.submissions ? a.submissions.length : 0), 0);
    }, 0);

    return html`
      <div className="p-6 md:p-8 space-y-6 flex-grow overflow-y-auto select-none" style=${{ background: 'transparent' }}>
        
        <!-- Header -->
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#D5DEF2]">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#16213E] tracking-tight">
              Classroom & Examination Analytics
            </h2>
            <p className="text-sm text-[#566180] mt-0.5">Audit student performance, proctoring alerts, and automated compiler testing queues.</p>
          </div>
          <div className="rating">
            <span>Faculty ID: <b className="mono font-bold text-[#4F46E5]">${currentTeacherEmail || 'Dr. Sarah Jenkins'}</b></span>
          </div>
        </div>

        <!-- 4 Stat Cards (3D Tilt) -->
        <div className="stats scene3d">
          <div className="stat tilt" data-tilt="6">
            <span className="ic">&#10003;</span>
            <small>Active Classrooms</small>
            <strong className="mono">${teacherClasses.length} Classes</strong>
          </div>
          <div className="stat t tilt" data-tilt="6">
            <span className="ic">&#9678;</span>
            <small>Supervised Students</small>
            <strong className="mono">${totalStudents} Enrolled</strong>
          </div>
          <div className="stat a tilt" data-tilt="6">
            <span className="ic">&#9733;</span>
            <small>Submitted Solutions</small>
            <strong className="mono">${totalSubmissions} Graded</strong>
          </div>
          <div className="stat g tilt" data-tilt="6">
            <span className="ic">&#9919;</span>
            <small>Security Proctoring</small>
            <strong className="mono">0 Critical Flags</strong>
          </div>
        </div>

        <!-- Management Split Grid -->
        <div className="grid2 scene3d">
          
          <!-- Classrooms list -->
          <div className="box tilt" data-tilt="4">
            <h3>Supervised Classes</h3>
            <div className="space-y-3 mt-3">
              ${teacherClasses.map(c => html`
                <div key=${c.id || c.code} className="flex justify-between items-center p-3 rounded-xl bg-[#F7F9FE] border border-[#D5DEF2]">
                  <div>
                    <div className="font-bold text-[#16213E] text-sm">${c.name}</div>
                    <div className="text-xs text-[#566180]">Code: <span className="font-mono font-bold text-[#0E9F9A]">${c.code}</span> • ${c.enrolledStudents ? c.enrolledStudents.length : 0} Students</div>
                  </div>
                  <button onClick=${() => updateState({ activeTab: 'classroom' })} className="chip text-xs">
                    View
                  </button>
                </div>
              `)}
              ${teacherClasses.length === 0 && html`
                <div className="text-center py-6 text-sm text-[#566180]">
                  No classes created yet. Click "Classroom" on the sidebar to create one.
                </div>
              `}
            </div>
          </div>

          <!-- Quick Action panel -->
          <div className="box tilt" data-tilt="4">
            <h3>Faculty Actions</h3>
            <div className="space-y-3 mt-3">
              <button onClick=${() => updateState({ activeTab: 'classroom' })} className="btn text-sm">
                + Create New Classroom
              </button>
              <button onClick=${() => updateState({ activeTab: 'proctoring' })} className="btn teal text-sm">
                Open Live Proctoring Radar
              </button>
              <button onClick=${() => updateState({ activeTab: 'students' })} className="chip w-full justify-center text-sm py-2.5">
                Generate Student Access Keys
              </button>
            </div>
          </div>

        </div>

      </div>
    `;
  }

  // ===========================================================================
  // STUDENT DASHBOARD (Matches User's 3D Light Prototype)
  // ===========================================================================
  return html`
    <div className="p-6 md:p-8 space-y-6 flex-grow overflow-y-auto select-none" style=${{ background: 'transparent' }}>
      
      <!-- Top Welcome Header & Rating -->
      <div className="head">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#16213E] tracking-tight">
            Welcome back, ${studentName}!
          </h2>
          <p className="text-sm text-[#566180] mt-0.5">
            Track your progress, check your certificates and continue your assessments.
          </p>
        </div>
        <div className="rating">
          Arena rating: <b className="mono font-bold text-[#4F46E5]">915 AP (#2)</b>
        </div>
      </div>

      <!-- 4 Stats Cards with 3D Tilt -->
      <div className="stats scene3d">
        
        <div className="stat tilt" data-tilt="8">
          <span className="ic">&#10003;</span>
          <small>Assignments solved</small>
          <strong className="mono">1 / 3 tasks</strong>
        </div>

        <div className="stat t tilt" data-tilt="8">
          <span className="ic">&#9678;</span>
          <small>Coding accuracy</small>
          <strong className="mono">89% average</strong>
        </div>

        <div className="stat a tilt" data-tilt="8">
          <span className="ic">&#9733;</span>
          <small>Earned certificates</small>
          <strong className="mono">2 certificates</strong>
        </div>

        <div className="stat g tilt" data-tilt="8">
          <span className="ic">&#9919;</span>
          <small>Security status</small>
          <strong className="mono">Verified safe</strong>
        </div>

      </div>

      <!-- Performance Chart & Skill Levels Split Grid -->
      <div className="grid2 scene3d">
        
        <!-- Performance Trend SVG Chart -->
        <div className="box tilt" data-tilt="3">
          <h3>Performance trend</h3>
          <svg className="chart" viewBox="0 0 680 290" role="img" aria-label="Score rose from 75 on June 5 to a peak of 95 on June 20, then 90 on June 23">
            <defs>
              <linearGradient id="ar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#4F46E5" stop-opacity=".35"/>
                <stop offset="1" stop-color="#4F46E5" stop-opacity="0"/>
              </linearGradient>
              <filter id="sh" x="-10%" y="-10%" width="120%" height="140%">
                <feDropShadow dx="0" dy="10" stdDeviation="6" flood-color="#3730A3" flood-opacity=".35"/>
              </filter>
            </defs>
            <g stroke="#D5DEF2">
              <line x1="40" x2="640" y1="30" y2="30"/>
              <line x1="40" x2="640" y1="80" y2="80"/>
              <line x1="40" x2="640" y1="130" y2="130"/>
              <line x1="40" x2="640" y1="180" y2="180"/>
              <line x1="40" x2="640" y1="230" y2="230"/>
            </g>
            <g text-anchor="end" fill="#566180">
              <text x="30" y="34">95</text>
              <text x="30" y="84">90</text>
              <text x="30" y="134">85</text>
              <text x="30" y="184">80</text>
              <text x="30" y="234">75</text>
            </g>
            <path d="M40 230 C110 205,150 190,201 180 S300 150,362 130 S470 30,524 30 S590 70,620 80 L620 230 L40 230Z" fill="url(#ar)"/>
            <path d="M40 230 C110 205,150 190,201 180 S300 150,362 130 S470 30,524 30 S590 70,620 80" fill="none" stroke="#4F46E5" stroke-width="5" stroke-linecap="round" filter="url(#sh)"/>
            <g fill="#fff" stroke="#4F46E5" stroke-width="4">
              <circle cx="40" cy="230" r="7"/>
              <circle cx="201" cy="180" r="7"/>
              <circle cx="362" cy="130" r="7"/>
              <circle cx="524" cy="30" r="9"/>
              <circle cx="620" cy="80" r="7"/>
            </g>
            <g text-anchor="middle" fill="#566180">
              <text x="40" y="258">June 5</text>
              <text x="201" y="258">June 10</text>
              <text x="362" y="258">June 15</text>
              <text x="524" y="258">June 20</text>
              <text x="620" y="258">June 23</text>
            </g>
          </svg>
        </div>

        <!-- Skill Levels with Glossy Inset Bars -->
        <div className="box tilt" data-tilt="3">
          <h3>Skill levels</h3>
          
          <div className="skill" style=${{ '--c': '#0E9F9A' }}>
            <div><span>JavaScript core algorithms</span><span className="font-bold text-[#0E9F9A]">92% Advanced</span></div>
            <div className="bar"><i style=${{ width: '92%' }}></i></div>
          </div>

          <div className="skill" style=${{ '--c': '#4F46E5' }}>
            <div><span>Python scripting and recursion</span><span className="font-bold text-[#4F46E5]">85% Proficient</span></div>
            <div className="bar"><i style=${{ width: '85%' }}></i></div>
          </div>

          <div className="skill" style=${{ '--c': '#16A34A' }}>
            <div><span>SQL Server schema queries</span><span className="font-bold text-[#16A34A]">78% Intermediate</span></div>
            <div className="bar"><i style=${{ width: '78%' }}></i></div>
          </div>

          <div className="skill" style=${{ '--c': '#F59E0B' }}>
            <div><span>C++ low-level pointers</span><span className="font-bold text-[#F59E0B]">60% Developing</span></div>
            <div className="bar"><i style=${{ width: '60%' }}></i></div>
          </div>

          <div className="focus">
            <span>Strongest: <strong className="text-[#0E9F9A]">JavaScript</strong></span>
            <span>Work on: <strong className="text-[#F59E0B]">C++ memory</strong></span>
          </div>
        </div>

      </div>

      <!-- Practice Arena Module Launchers -->
      <div className="box">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-base text-[#16213E]">Practice arena</h3>
          <button onClick=${() => updateState({ activeTab: 'practice' })} className="chip text-xs">
            Open Full Compiler
          </button>
        </div>

        <div className="arena scene3d">
          
          <article className="prob tilt" data-tilt="8">
            <header>
              <span className="tag easy">Easy</span>
              <span className="solved">&#10003; Solved</span>
            </header>
            <h4>Two Sum</h4>
            <button className="btn" onClick=${() => handleLaunchChallenge('Two Sum')}>
              Open challenge
            </button>
          </article>

          <article className="prob tilt" data-tilt="8">
            <header>
              <span className="tag easy">Easy</span>
            </header>
            <h4>Reverse Linked List</h4>
            <button className="btn" onClick=${() => handleLaunchChallenge('Reverse Linked List')}>
              Open challenge
            </button>
          </article>

          <article className="prob tilt" data-tilt="8">
            <header>
              <span className="tag hard">Hard</span>
            </header>
            <h4>Median of Two Sorted Arrays</h4>
            <button className="btn" onClick=${() => handleLaunchChallenge('Median of Two Sorted Arrays')}>
              Open challenge
            </button>
          </article>

          <article className="prob tilt" data-tilt="8">
            <header>
              <span className="tag medium">Medium</span>
            </header>
            <h4>Longest Palindromic Substring</h4>
            <button className="btn" onClick=${() => handleLaunchChallenge('Longest Palindromic Substring')}>
              Open challenge
            </button>
          </article>

        </div>
      </div>

    </div>
  `;
}
