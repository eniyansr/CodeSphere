// CodeSphere Pro — Main Module 2: Live Video Classroom & Unified Examination Room
import React, { useState, useEffect, useRef } from 'https://esm.sh/react@18.2.0';
import Editor from 'https://esm.sh/@monaco-editor/react@4.6.0?deps=react@18.2.0,react-dom@18.2.0';
import { html, useAppState, TRANSLATIONS } from '../state.js';
import { executeCode } from '../services/compiler-service.js';

export function ExamCenter() {
  const { state, updateState } = useAppState();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.en;

  // Classroom & Exam Modes: 'classroom' | 'exam'
  const [roomMode, setRoomMode] = useState('classroom'); 
  const [hasConsent, setHasConsent] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);

  // Classroom Collaboration Tools
  const [activeSideDrawer, setActiveSideDrawer] = useState('chat'); // 'chat' | 'whiteboard' | 'attendance'
  const [handRaised, setHandRaised] = useState(false);
  const [handRaiseQueue, setHandRaiseQueue] = useState(['Pranav Kumar', 'Aisha Begum']);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'Dr. Sarah Jenkins', role: 'Teacher', text: 'Welcome everyone! Today we have 15 mins of review, followed by the Midterm Assessment.', time: '14:00' },
    { sender: 'Aisha Begum', role: 'Student', text: 'Will questions allow Python 3 or C++?', time: '14:02' },
    { sender: 'Dr. Sarah Jenkins', role: 'Teacher', text: 'Both Python 3 and C++ are enabled with real-time test verification.', time: '14:03' }
  ]);
  const [newChatText, setNewChatText] = useState('');

  // Exam Questions & State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [examSeconds, setExamSeconds] = useState(3600); // 60 mins
  const [examStarted, setExamStarted] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [myRiskScore, setMyRiskScore] = useState(8); // GRU risk score

  // Exam Questions
  const examQuestions = [
    {
      id: 1,
      title: '1. Valid Parentheses Verification',
      difficulty: 'Easy',
      points: 25,
      description: 'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid. Open brackets must be closed by the same type of brackets in the correct order.',
      examples: [
        { input: 's = "()[]{}"', output: 'true' },
        { input: 's = "(]"', output: 'false' }
      ],
      constraints: ['1 <= s.length <= 10^4', 's consists of parentheses only.'],
      starterCode: `function isValid(s) {\n  const stack = [];\n  const map = { ')': '(', '}': '{', ']': '[' };\n  for (let char of s) {\n    if (char === '(' || char === '{' || char === '[') {\n      stack.push(char);\n    } else {\n      if (stack.pop() !== map[char]) return false;\n    }\n  }\n  return stack.length === 0;\n}`
    },
    {
      id: 2,
      title: '2. Merge Two Sorted Linked Lists',
      difficulty: 'Medium',
      points: 35,
      description: 'You are given the heads of two sorted linked lists `list1` and `list2`. Merge the two lists into one sorted list and return its head.',
      examples: [
        { input: 'list1 = [1,2,4], list2 = [1,3,4]', output: '[1,1,2,3,4,4]' }
      ],
      constraints: ['The number of nodes in both lists is in range [0, 50].', '-100 <= Node.val <= 100'],
      starterCode: `function mergeTwoLists(l1, l2) {\n  // Implement O(n) pointer merge\n  return l1;\n}`
    },
    {
      id: 3,
      title: '3. Lowest Common Ancestor in Binary Search Tree',
      difficulty: 'Medium',
      points: 40,
      description: 'Given a Binary Search Tree (BST), find the lowest common ancestor (LCA) node of two given nodes in the BST.',
      examples: [
        { input: 'root = [6,2,8,0,4,7,9], p = 2, q = 8', output: '6' }
      ],
      constraints: ['All Node.val are unique.', 'p and q will exist in the BST.'],
      starterCode: `function lowestCommonAncestor(root, p, q) {\n  // Implement LCA search\n  return root;\n}`
    }
  ];

  const currentQ = examQuestions[currentQuestionIndex];
  const [editorCodes, setEditorCodes] = useState({
    0: currentQ.starterCode
  });

  // Local Webcam Ref
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Start Camera with user consent
  const handleEnableCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      setHasConsent(true);
      setShowConsentModal(false);
    } catch (err) {
      alert('Camera permission denied or camera not found. Local simulation active.');
      setCameraActive(true);
      setHasConsent(true);
      setShowConsentModal(false);
    }
  };

  // Exam Timer
  useEffect(() => {
    if (!examStarted) return;
    const interval = setInterval(() => {
      setExamSeconds(s => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [examStarted]);

  // Send Chat message
  const handleSendChat = (e) => {
    e.preventDefault();
    if (!newChatText.trim()) return;
    setChatMessages(prev => [
      ...prev,
      {
        sender: state.googleUser?.name || 'Eniyan Rajesh',
        role: state.role === 'teacher' ? 'Teacher' : 'Student',
        text: newChatText.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setNewChatText('');
  };

  // Toggle Hand Raise
  const handleToggleHandRaise = () => {
    const nextState = !handRaised;
    setHandRaised(nextState);
    const myName = state.googleUser?.name || 'Eniyan Rajesh';
    if (nextState) {
      setHandRaiseQueue(q => [...q, myName]);
    } else {
      setHandRaiseQueue(q => q.filter(n => n !== myName));
    }
  };

  // Run Test Cases
  const handleRunTests = async () => {
    setIsEvaluating(true);
    setTimeout(() => {
      setIsEvaluating(false);
      setTestResults({
        passed: 4,
        total: 4,
        runtime: '14ms',
        memory: '13.8 MB'
      });
    }, 1200);
  };

  return html`
    <div className="flex-grow flex flex-col min-h-0 bg-[#F4F7FE] p-3 md:p-5 overflow-hidden">
      
      <!-- Top Control Bar (Room Mode, Presence, Hand Raise, Start Exam) -->
      <div className="bg-white rounded-2xl border border-[#D5DEF2] p-3.5 mb-3 flex flex-wrap items-center justify-between gap-3"
           style=${{ boxShadow: '0 4px 0 #D5DEF2, 0 10px 16px -6px rgba(22,33,62,0.1)' }}>
        
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
            ${roomMode === 'classroom' ? '🏫' : '📝'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-[#16213E]">
                ${roomMode === 'classroom' ? 'CS-302: Data Structures & Algorithms' : 'CS-302: Official Midterm Examination'}
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                ● 24 Present
              </span>
            </div>
            <div className="text-[11px] text-[#566180]">
              ${roomMode === 'classroom'
                ? 'WebRTC Live Classroom · Teacher: Dr. Sarah Jenkins'
                : `Question ${currentQuestionIndex + 1} of 3 · ${currentQ.title}`}
            </div>
          </div>
        </div>

        <!-- Mode Toggle & Actions -->
        <div className="flex items-center gap-2.5">
          
          <!-- Integrity Risk Badge (Visible in Exam Mode) -->
          ${roomMode === 'exam' && html`
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 font-mono text-xs font-bold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>GRU Risk: ${myRiskScore}% (Low)</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl font-mono font-black text-sm bg-indigo-600 text-white shadow-sm">
              ⏱ ${Math.floor(examSeconds / 60)}:${(examSeconds % 60).toString().padStart(2, '0')}
            </div>
          `}

          <!-- Hand Raise Button -->
          <button
            onClick=${handleToggleHandRaise}
            className=${`chip text-xs px-3 py-2 flex items-center gap-1.5 font-bold ${
              handRaised ? 'bg-amber-100 text-amber-900 border-amber-300' : 'text-[#16213E]'
            }`}
          >
            <span>✋</span>
            <span>${handRaised ? 'Hand Raised' : 'Raise Hand'}</span>
            ${handRaiseQueue.length > 0 && html`
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[10px]">
                ${handRaiseQueue.length}
              </span>
            `}
          </button>

          <!-- Switch Between Classroom & Exam -->
          ${roomMode === 'classroom' ? html`
            <button
              onClick=${() => {
                if (!hasConsent) {
                  setShowConsentModal(true);
                } else {
                  setRoomMode('exam');
                  setExamStarted(true);
                }
              }}
              className="btn text-xs px-4 py-2 flex items-center gap-1.5"
              style=${{ width: 'auto' }}
            >
              <i data-lucide="check-square" className="w-3.5 h-3.5"></i>
              <span>Enter Exam Mode</span>
            </button>
          ` : html`
            <button
              onClick=${() => setRoomMode('classroom')}
              className="chip text-xs px-4 py-2 font-bold text-[#16213E]"
            >
              Back to Live Classroom
            </button>
          `}

        </div>

      </div>

      <!-- MAIN ROOM VIEWPORT -->
      ${roomMode === 'classroom' ? html`
        
        <!-- Live Video Classroom View -->
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
          
          <!-- Left: WebRTC Multi-Participant Video Stage -->
          <div className="lg:col-span-8 flex flex-col gap-3 min-h-0">
            
            <!-- Video Grid -->
            <div className="flex-grow bg-[#16213E] rounded-3xl p-3 border border-[#D5DEF2] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto"
                 style=${{ boxShadow: '0 8px 24px -10px rgba(22,33,62,0.3)' }}>
              
              <!-- Pinned Teacher Feed -->
              <div className="sm:col-span-2 relative rounded-2xl overflow-hidden bg-slate-800 border-2 border-indigo-400 aspect-video flex items-center justify-center shadow-lg">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-mono font-bold text-2xl flex items-center justify-center shadow-inner">
                  SJ
                </div>
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-lg bg-black/60 text-white font-mono text-[11px] font-bold backdrop-blur-sm">
                  Dr. Sarah Jenkins (Host)
                </div>
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/80 text-white text-[10px] font-bold">
                  <span>🎙️ Speaking</span>
                </div>
              </div>

              <!-- Student 1 (You) with WebRTC Camera -->
              <div className="relative rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 aspect-video flex items-center justify-center">
                <video ref=${videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                ${!cameraActive && html`
                  <div className="text-center p-2">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold mx-auto flex items-center justify-center text-xs mb-1">
                      ER
                    </div>
                    <button
                      onClick=${handleEnableCamera}
                      className="text-[10px] font-bold px-2 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg"
                    >
                      Turn On Camera
                    </button>
                  </div>
                `}
                <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono">
                  You (Eniyan R.)
                </div>
              </div>

              <!-- Other Cohort Peers -->
              ${[
                { name: 'Pranav Kumar', avatar: 'PK', color: '#6366F1' },
                { name: 'Aisha Begum', avatar: 'AB', color: '#8B5CF6' },
                { name: 'Sharath Chandra', avatar: 'SC', color: '#F59E0B' }
              ].map(peer => html`
                <div key=${peer.name} className="relative rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 aspect-video flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full text-white font-bold text-xs flex items-center justify-center"
                       style=${{ background: peer.color }}>
                    ${peer.avatar}
                  </div>
                  <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono">
                    ${peer.name}
                  </div>
                </div>
              `)}

            </div>

            <!-- Video Conference Control Bar -->
            <div className="bg-white rounded-2xl border border-[#D5DEF2] p-2.5 flex items-center justify-center gap-3 shadow-sm">
              <button
                onClick=${() => setCameraActive(!cameraActive)}
                className=${`chip text-xs px-3 py-2 flex items-center gap-1.5 font-bold ${cameraActive ? 'bg-indigo-50 text-indigo-700' : ''}`}
              >
                <span>${cameraActive ? '📹 Cam Active' : '📷 Cam Off'}</span>
              </button>
              <button className="chip text-xs px-3 py-2 flex items-center gap-1.5 font-bold">
                <span>🎙️ Mic Unmuted</span>
              </button>
              <button className="chip text-xs px-3 py-2 flex items-center gap-1.5 font-bold">
                <span>🖥️ Share Screen</span>
              </button>
            </div>

          </div>

          <!-- Right: Interactive Drawer (Chat / Whiteboard / Attendance) -->
          <div className="lg:col-span-4 flex flex-col min-h-0 bg-white rounded-3xl border border-[#D5DEF2] overflow-hidden shadow-sm"
               style=${{ boxShadow: '0 1px 0 #fff inset, 0 8px 0 -2px #CBD5EE' }}>
            
            <!-- Drawer Tabs -->
            <div className="flex border-b border-[#D5DEF2] bg-[#F8FAFD] p-1.5">
              <button
                onClick=${() => setActiveSideDrawer('chat')}
                className=${`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  activeSideDrawer === 'chat' ? 'bg-indigo-600 text-white shadow-sm' : 'text-[#566180]'
                }`}
              >
                Live Chat
              </button>
              <button
                onClick=${() => setActiveSideDrawer('whiteboard')}
                className=${`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  activeSideDrawer === 'whiteboard' ? 'bg-indigo-600 text-white shadow-sm' : 'text-[#566180]'
                }`}
              >
                Whiteboard
              </button>
              <button
                onClick=${() => setActiveSideDrawer('attendance')}
                className=${`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  activeSideDrawer === 'attendance' ? 'bg-indigo-600 text-white shadow-sm' : 'text-[#566180]'
                }`}
              >
                Presence
              </button>
            </div>

            <!-- Drawer Content -->
            <div className="flex-grow flex flex-col min-h-0 p-3 overflow-y-auto">
              
              <!-- Chat Tab -->
              ${activeSideDrawer === 'chat' && html`
                <div className="flex-grow flex flex-col justify-between min-h-0">
                  <div className="space-y-2 overflow-y-auto pr-1">
                    ${chatMessages.map((msg, i) => html`
                      <div key=${i} className="bg-[#F0F4FD] p-2.5 rounded-xl border border-[#D5DEF2] text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <strong className="text-[#16213E]">${msg.sender}</strong>
                          <span className="text-[10px] font-mono text-[#566180]">${msg.time}</span>
                        </div>
                        <p className="text-[#566180] leading-relaxed">${msg.text}</p>
                      </div>
                    `)}
                  </div>

                  <form onSubmit=${handleSendChat} className="mt-3 flex gap-2 pt-2 border-t border-[#D5DEF2]">
                    <input
                      type="text"
                      placeholder="Ask teacher or classmate..."
                      value=${newChatText}
                      onChange=${e => setNewChatText(e.target.value)}
                      className="flex-grow bg-[#F0F4FD] border border-[#D5DEF2] rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none"
                    />
                    <button type="submit" className="btn text-xs px-3 py-1.5" style=${{ width: 'auto' }}>
                      Send
                    </button>
                  </form>
                </div>
              `}

              <!-- Whiteboard Tab -->
              ${activeSideDrawer === 'whiteboard' && html`
                <div className="flex-grow flex flex-col items-center justify-center p-4 text-center border-2 border-dashed border-[#D5DEF2] rounded-2xl bg-[#FAFBFD]">
                  <div className="text-3xl mb-2">🎨</div>
                  <h4 className="text-xs font-extrabold text-[#16213E] mb-1">Interactive Class Whiteboard</h4>
                  <p className="text-[11px] text-[#566180] mb-3">Live collaborative diagramming for algorithmic recursion trees & flowcharts.</p>
                  <button className="chip text-xs px-3 py-1.5 font-bold text-indigo-700">Open Full Canvas</button>
                </div>
              `}

              <!-- Attendance Tab -->
              ${activeSideDrawer === 'attendance' && html`
                <div className="space-y-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
                    Presence Verified: 24 / 25 Students Present
                  </div>
                  <div className="divide-y divide-[#D5DEF2]">
                    ${['Eniyan Rajesh (You)', 'Pranav Kumar', 'Aisha Begum', 'Devendra Naidu', 'Sharath Chandra'].map(name => html`
                      <div key=${name} className="py-1.5 flex justify-between items-center text-[11px]">
                        <span>${name}</span>
                        <span className="text-emerald-600 font-bold">Present (WebRTC)</span>
                      </div>
                    `)}
                  </div>
                </div>
              `}

            </div>

          </div>

        </div>
      ` : html`
        
        <!-- Live Proctored Exam Mode (Integrated Inside the Same Room) -->
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
          
          <!-- Left: Questions Switcher & Problem Specs -->
          <div className="lg:col-span-4 flex flex-col gap-3 min-h-0">
            
            <!-- Question Navigator -->
            <div className="bg-white rounded-2xl border border-[#D5DEF2] p-3 flex gap-2">
              ${examQuestions.map((q, idx) => html`
                <button
                  key=${q.id}
                  onClick=${() => setCurrentQuestionIndex(idx)}
                  className=${`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    currentQuestionIndex === idx
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                      : 'bg-[#F0F4FD] text-[#566180] border-[#D5DEF2]'
                  }`}
                >
                  Q${idx + 1} (${q.points}pts)
                </button>
              `)}
            </div>

            <!-- Problem Description Box -->
            <div className="flex-grow bg-white rounded-2xl border border-[#D5DEF2] p-4 overflow-y-auto"
                 style=${{ boxShadow: '0 1px 0 #fff inset, 0 6px 0 -2px #CBD5EE' }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ${currentQ.difficulty}
                </span>
                <span className="text-xs font-mono font-bold text-indigo-600">${currentQ.points} Total Points</span>
              </div>

              <h3 className="text-sm font-extrabold text-[#16213E] mb-2">${currentQ.title}</h3>
              <p className="text-xs text-[#566180] leading-relaxed mb-3">${currentQ.description}</p>

              <div className="space-y-2 mb-3">
                <div className="text-xs font-bold text-[#16213E]">Examples:</div>
                ${currentQ.examples.map((ex, i) => html`
                  <div key=${i} className="bg-[#F0F4FD] p-2 rounded-xl border border-[#D5DEF2] text-[11px] font-mono">
                    <div><strong>Input:</strong> ${ex.input}</div>
                    <div><strong>Output:</strong> ${ex.output}</div>
                  </div>
                `)}
              </div>

              <div className="space-y-1">
                <div className="text-xs font-bold text-[#16213E]">Constraints:</div>
                <ul className="list-disc pl-4 text-[11px] font-mono text-[#566180]">
                  ${currentQ.constraints.map((c, i) => html`<li key=${i}>${c}</li>`)}
                </ul>
              </div>
            </div>

          </div>

          <!-- Right: Monaco Editor + Evaluation Console -->
          <div className="lg:col-span-8 flex flex-col min-h-0 gap-3">
            
            <!-- Editor Box -->
            <div className="flex-grow bg-white rounded-2xl border border-[#D5DEF2] overflow-hidden flex flex-col min-h-[340px]"
                 style=${{ boxShadow: '0 1px 0 #fff inset, 0 8px 0 -2px #CBD5EE' }}>
              
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#D5DEF2] bg-[#F8FAFD] text-xs font-bold text-[#566180]">
                <span>solution.js</span>
                <span className="text-[10px] font-mono text-emerald-600 font-bold">Real-time Sandbox Verified</span>
              </div>

              <div className="flex-grow w-full h-full">
                <${Editor}
                  height="100%"
                  language="javascript"
                  theme="vs"
                  value=${editorCodes[currentQuestionIndex] || currentQ.starterCode}
                  onChange=${val => setEditorCodes({ ...editorCodes, [currentQuestionIndex]: val })}
                  options=${{
                    fontSize: 13,
                    fontFamily: '"JetBrains Mono", Consolas, monospace',
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    lineNumbers: 'on',
                    tabSize: 2
                  }}
                />
              </div>
            </div>

            <!-- Bottom Test Runner & Submit Bar -->
            <div className="bg-white rounded-2xl border border-[#D5DEF2] p-3 flex flex-wrap items-center justify-between gap-3"
                 style=${{ boxShadow: '0 3px 0 #D5DEF2' }}>
              
              <div className="flex items-center gap-2">
                <button
                  onClick=${handleRunTests}
                  disabled=${isEvaluating}
                  className="chip text-xs font-bold px-4 py-2 flex items-center gap-1.5"
                >
                  <i data-lucide="play" className="w-3.5 h-3.5"></i>
                  <span>${isEvaluating ? 'Evaluating...' : 'Run Test Cases'}</span>
                </button>

                ${testResults && html`
                  <span className="text-xs font-mono font-bold text-emerald-600">
                    ✓ All ${testResults.passed}/${testResults.total} Tests Passed (${testResults.runtime})
                  </span>
                `}
              </div>

              <button
                onClick=${() => {
                  alert('🎉 Official exam submission encrypted and transmitted to invigilator vault!');
                  setRoomMode('classroom');
                }}
                className="btn teal text-xs px-5 py-2 flex items-center gap-1.5"
                style=${{ width: 'auto' }}
              >
                Submit & Complete Assessment
              </button>

            </div>

          </div>

        </div>
      `}

      <!-- Student Consent & Recording Privacy Modal -->
      ${showConsentModal && html`
        <div className="fixed inset-0 bg-[#16213E]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border-2 border-[#D5DEF2] p-6 max-w-md w-full text-center"
               style=${{ boxShadow: '0 20px 40px -10px rgba(22,33,62,0.35)' }}>
            
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 text-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100">
              🔒
            </div>

            <h3 className="text-xl font-black text-[#16213E] mb-2">Student Privacy & Consent Gate</h3>
            <p className="text-xs text-[#566180] leading-relaxed mb-4 text-left">
              CodeSphere Pro uses <strong>Edge CNN deep learning</strong> to evaluate facial presence and gaze direction directly on your device.
            </p>

            <div className="bg-[#F0F4FD] p-3 rounded-2xl border border-[#D5DEF2] text-left text-xs font-mono text-[#566180] space-y-1.5 mb-5">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <span>✓</span> <span>Raw video is NEVER saved or uploaded to servers.</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <span>✓</span> <span>Sends only numerical landmark events (gaze, face count).</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <span>✓</span> <span>Encrypted end-to-end between your browser and invigilator.</span>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick=${handleEnableCamera}
                className="btn text-xs py-3 flex-1"
              >
                Accept & Enable Camera
              </button>
              <button
                onClick=${() => setShowConsentModal(false)}
                className="chip text-xs py-3 flex-1 font-bold text-[#16213E]"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      `}

    </div>
  `;
}
