// CodeSphere Pro - Examination Center & Security Lockdown Module
import { updateState, TRANSLATIONS } from '../state.js';
import { initEditor } from './EditorWorkspace.js';

let timerInterval = null;

export function ExamCenter(state) {
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.en;
  
  if (state.examStatus === 'taking') {
    return renderExamWindow(state);
  }

  if (state.examStatus === 'submitted') {
    return renderExamResults(state);
  }

  // General Exams Center Dashboard Listing
  return `
    <div class="p-6 space-y-6 flex-grow overflow-y-auto">
      <div>
        <h2 class="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <i data-lucide="clipboard-check" class="text-indigo-400 w-6 h-6"></i>
          Exam Assessment Center
        </h2>
        <p class="text-xs text-slate-400">Join verified exams under proctored lockdown. Ensure camera access is configured.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${state.exams.map(exam => `
          <div class="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-4 hover:border-slate-700/60 transition">
            <div class="space-y-2">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-accent-rose border border-rose-500/20 uppercase">Proctored Lockdown</span>
              <h3 class="text-base font-bold text-slate-200">${exam.title}</h3>
              <div class="flex items-center space-x-4 text-xs text-slate-400 font-semibold pt-1">
                <span class="flex items-center gap-1"><i data-lucide="clock" class="w-3.5 h-3.5"></i> ${exam.duration} Minutes</span>
                <span class="flex items-center gap-1"><i data-lucide="help-circle" class="w-3.5 h-3.5"></i> ${exam.questions.length} Questions</span>
              </div>
            </div>

            <div class="pt-4 border-t border-slate-800/60 flex items-center justify-between">
              <span class="text-[11px] text-slate-500 font-semibold">Ends: ${exam.deadline}</span>
              <button 
                data-start-exam-id="${exam.id}"
                class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/10 active:scale-95 transition flex items-center gap-1.5"
              >
                <i data-lucide="shield-alert" class="w-3.5 h-3.5"></i>
                Start Secure Exam
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderExamWindow(state) {
  const activeExam = state.exams.find(e => e.id === state.activeExamId);
  if (!activeExam) return '';

  const activeIndex = state.activeQuestionIndex || 0;
  const currentQuestion = activeExam.questions[activeIndex];

  // Formatting remaining time
  const min = Math.floor(state.examTimer / 60);
  const sec = state.examTimer % 60;
  const timeStr = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;

  // Proctor feedback text simulation
  let proctorMsg = "Monitoring eyes and position...";
  let proctorColor = "text-accent-emerald";
  if (state.warningsCount > 0) {
    proctorMsg = `Suspicious Activity detected! Count: ${state.warningsCount}`;
    proctorColor = "text-accent-rose";
  }

  return `
    <div class="flex-grow flex flex-col md:flex-row h-[calc(100vh-76px)] overflow-hidden bg-[#05060b]">
      
      <!-- Left Column: Proctor Feed, Timer, & Navigator -->
      <div class="w-full md:w-80 flex-shrink-0 border-r border-slate-900 bg-slate-950/40 p-4 flex flex-col justify-between overflow-y-auto space-y-4">
        
        <!-- Timer block -->
        <div class="glass-panel p-4 rounded-2xl border-rose-500/20 text-center space-y-1">
          <div class="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Time Remaining</div>
          <div class="text-3xl font-mono font-extrabold text-accent-rose drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]">${timeStr}</div>
        </div>

        <!-- AI Proctor Feed Block -->
        <div class="glass-panel p-3.5 rounded-2xl space-y-3 relative overflow-hidden">
          <div class="flex justify-between items-center text-xs border-b border-slate-800 pb-2">
            <span class="font-bold text-slate-300 flex items-center gap-1.5">
              <i data-lucide="eye" class="w-4 h-4 text-rose-500 animate-pulse"></i>
              AI Eye-Tracker Feed
            </span>
            <span class="text-[9px] font-mono ${proctorColor} font-bold animate-pulse">Active</span>
          </div>

          <!-- Video simulation panel -->
          <div class="aspect-video w-full rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center relative overflow-hidden">
            <video id="proctor-video-element" class="absolute inset-0 w-full h-full object-cover opacity-60 scale-x-[-1]" autoplay muted playsinline></video>
            
            <!-- Simulated bounding boxes -->
            <div id="proctor-box-face" class="absolute w-24 h-24 border-2 border-accent-emerald rounded-lg pointer-events-none hidden flex flex-col justify-between p-1">
              <span class="text-[8px] bg-accent-emerald text-slate-950 font-bold px-1 rounded self-start">Eniyan R.</span>
            </div>
            <div id="proctor-box-eyes" class="absolute w-16 h-6 border border-accent-cyan rounded pointer-events-none hidden">
              <div class="absolute -top-3 left-0 right-0 text-center text-[7px] text-accent-cyan font-mono">TRACKING</div>
            </div>

            <!-- Webcam Denied / Off fallback visual -->
            <div id="proctor-webcam-fallback" class="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-500 p-4 text-center">
              <i data-lucide="video-off" class="w-8 h-8 mb-1.5"></i>
              <div class="text-[10px] font-semibold">Webcam Stream Sandbox</div>
              <div class="text-[8px] text-slate-600 mt-1">Starting simulated detector engine...</div>
            </div>
          </div>

          <!-- Log description -->
          <div class="text-[10px] font-semibold text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-900">
            <div class="flex justify-between">
              <span>Status:</span>
              <span class="${proctorColor} font-mono uppercase">${proctorMsg}</span>
            </div>
          </div>
        </div>

        <!-- Question Navigator Grid -->
        <div class="space-y-2 flex-grow">
          <span class="text-[10px] uppercase font-bold tracking-wider text-slate-500 block px-1">Questions Navigator</span>
          <div class="grid grid-cols-4 gap-2">
            ${activeExam.questions.map((q, idx) => {
              const isCurrent = idx === activeIndex;
              const hasAns = state.examAnswers[q.id] !== undefined;
              return `
                <button 
                  data-exam-question-goto="${idx}"
                  class="w-full h-10 rounded-xl border text-xs font-bold transition flex items-center justify-center
                  ${isCurrent 
                    ? 'bg-indigo-500 border-indigo-500 text-white' 
                    : hasAns 
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
                      : 'bg-slate-900/50 border-slate-800/40 text-slate-400 hover:bg-slate-800'}"
                >
                  ${idx + 1}
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Finish exam -->
        <button id="exam-finish-btn" class="w-full py-2.5 bg-gradient-to-r from-accent-rose to-red-600 hover:opacity-95 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-rose-600/10 flex items-center justify-center gap-1.5 transition active:scale-95">
          <i data-lucide="shield-off" class="w-4 h-4"></i> Submit Exam
        </button>

      </div>

      <!-- Right Column: Question Body & Active Answer Area -->
      <div class="flex-grow p-6 flex flex-col justify-between overflow-y-auto space-y-6">
        
        <!-- Question title bar -->
        <div class="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <span class="text-[10px] uppercase font-bold text-indigo-400">Question ${activeIndex + 1} of ${activeExam.questions.length}</span>
            <h3 class="text-base font-bold text-white mt-1">${currentQuestion.type === 'mcq' ? 'Multiple Choice Question' : currentQuestion.type === 'coding' ? 'Coding Challenge' : 'Subjective Essay Question'}</h3>
          </div>
          <span class="text-xs font-bold text-accent-cyan bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">${currentQuestion.points} Points</span>
        </div>

        <!-- Question description -->
        <div class="bg-slate-900/30 p-4 rounded-xl border border-slate-900 text-sm leading-relaxed text-slate-300">
          ${currentQuestion.text}
        </div>

        <!-- Inputs / Answers selector -->
        <div class="flex-grow flex flex-col justify-start">
          ${currentQuestion.type === 'mcq' ? `
            
            <!-- MCQ Option cards -->
            <div class="grid grid-cols-1 gap-3 pt-2">
              ${currentQuestion.options.map((opt, oIdx) => {
                const isSelected = state.examAnswers[currentQuestion.id] === oIdx;
                return `
                  <button 
                    data-exam-mcq-option="${oIdx}"
                    class="w-full text-left p-4 rounded-xl border text-xs font-bold transition flex items-center space-x-3
                    ${isSelected 
                      ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300' 
                      : 'bg-slate-900/40 hover:bg-slate-900/70 border-slate-800/40 text-slate-300'}"
                  >
                    <div class="w-5 h-5 rounded-full border flex items-center justify-center font-bold font-mono
                      ${isSelected ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-700 text-slate-500'}">
                      ${String.fromCharCode(65 + oIdx)}
                    </div>
                    <span>${opt}</span>
                  </button>
                `;
              }).join('')}
            </div>

          ` : currentQuestion.type === 'coding' ? `
            
            <!-- Inline Coding Editor -->
            <div class="flex-grow flex flex-col border border-slate-800 rounded-xl overflow-hidden min-h-[350px]">
              <div class="bg-slate-900 px-4 py-2 border-b border-slate-800 text-xs flex justify-between items-center">
                <span class="font-bold text-slate-400 flex items-center gap-1"><i data-lucide="code-2" class="w-3.5 h-3.5 text-indigo-400"></i> compiler.js</span>
                <span class="text-[10px] text-slate-500 uppercase font-mono">Environment: JS Runtime</span>
              </div>
              <div id="monaco-editor-mount" class="flex-grow bg-[#1e1e1e] relative min-h-[280px]"></div>
            </div>

          ` : `
            
            <!-- Subjective Answer Text Area -->
            <div class="space-y-2 pt-2">
              <label class="text-xs text-slate-400 font-semibold uppercase block">Write your solution explanation below:</label>
              <textarea 
                id="exam-subjective-textarea" 
                rows="8" 
                class="w-full glass-input p-4 rounded-2xl text-xs font-mono leading-relaxed" 
                placeholder="Type comprehensive response here..."
              >${state.examAnswers[currentQuestion.id] || ''}</textarea>
            </div>

          `}
        </div>

        <!-- Navigator Bottom Buttons -->
        <div class="flex justify-between items-center border-t border-slate-800 pt-4">
          <button 
            id="exam-question-prev" 
            class="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl transition active:scale-95 disabled:opacity-40"
            ${activeIndex === 0 ? 'disabled' : ''}
          >
            Previous
          </button>
          <button 
            id="exam-question-next" 
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/10 transition active:scale-95"
          >
            ${activeIndex === activeExam.questions.length - 1 ? 'Save & Complete' : 'Next'}
          </button>
        </div>

      </div>

    </div>
  `;
}

function renderExamResults(state) {
  const activeExam = state.exams.find(e => e.id === state.activeExamId);
  if (!activeExam) return '';

  // Auto-evaluation logic mock
  let scoreGained = 0;
  let totalScore = 0;
  
  activeExam.questions.forEach(q => {
    totalScore += q.points;
    if (q.type === 'mcq') {
      if (state.examAnswers[q.id] === q.correctIndex) {
        scoreGained += q.points;
      }
    } else if (q.type === 'coding') {
      // Simulate that they got the coding task correct if they answered anything
      if (state.examAnswers[q.id] && state.examAnswers[q.id].length > 10) {
        scoreGained += q.points;
      }
    } else {
      // Subjective gets manual grading mock (gives 80% automatically)
      if (state.examAnswers[q.id] && state.examAnswers[q.id].length > 15) {
        scoreGained += Math.round(q.points * 0.85);
      }
    }
  });

  const percentage = Math.round((scoreGained / totalScore) * 100);
  const isPassed = percentage >= 50;

  return `
    <div class="p-6 space-y-6 flex-grow overflow-y-auto max-w-2xl mx-auto flex flex-col justify-center">
      
      <div class="glass-panel p-8 rounded-3xl border border-slate-800 text-center space-y-6">
        
        <div class="w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-lg
          ${isPassed ? 'bg-emerald-500/10 text-accent-emerald shadow-emerald-500/10' : 'bg-rose-500/10 text-accent-rose shadow-rose-500/10'}">
          <i data-lucide="${isPassed ? 'check-circle-2' : 'x-circle'}" class="w-8 h-8"></i>
        </div>

        <div class="space-y-1.5">
          <h2 class="text-2xl font-extrabold text-white">Exam Submission Acknowledged</h2>
          <p class="text-xs text-slate-400">Lockdown security constraints successfully detached. Final evaluation reports computed.</p>
        </div>

        <!-- Grade Card Grid -->
        <div class="grid grid-cols-3 gap-4 pt-2">
          <div class="bg-slate-950 p-4 rounded-xl border border-slate-900">
            <div class="text-[10px] text-slate-500 font-bold uppercase">Points Earned</div>
            <div class="text-xl font-mono font-bold text-white mt-1">${scoreGained} / ${totalScore}</div>
          </div>
          <div class="bg-slate-950 p-4 rounded-xl border border-slate-900">
            <div class="text-[10px] text-slate-500 font-bold uppercase">Accuracy Score</div>
            <div class="text-xl font-mono font-bold text-accent-cyan mt-1">${percentage}%</div>
          </div>
          <div class="bg-slate-950 p-4 rounded-xl border border-slate-900">
            <div class="text-[10px] text-slate-500 font-bold uppercase">Security Verdict</div>
            <div class="text-xl font-mono font-bold text-accent-emerald mt-1">Clear</div>
          </div>
        </div>

        <div class="pt-4 flex justify-center space-x-3">
          <button id="exam-result-return-btn" class="px-5 py-2.5 bg-slate-800 border border-slate-700/60 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition active:scale-95">
            Return to Dashboard
          </button>
          ${isPassed ? `
            <button id="exam-result-cert-btn" class="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/10 transition active:scale-95 flex items-center gap-1.5">
              <i data-lucide="award" class="w-3.5 h-3.5"></i> Claim Skill Certificate
            </button>
          ` : ''}
        </div>

      </div>

    </div>
  `;
}

// Binds Exam interactions
export function bindExamCenterEvents(state) {
  if (state.examStatus === 'taking') {
    const activeExam = state.exams.find(e => e.id === state.activeExamId);
    if (!activeExam) return;
    const activeIndex = state.activeQuestionIndex || 0;
    const currentQuestion = activeExam.questions[activeIndex];

    // MCQ select
    document.querySelectorAll('[data-exam-mcq-option]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const optionIdx = parseInt(e.currentTarget.getAttribute('data-exam-mcq-option'));
        const updatedAnswers = { ...state.examAnswers };
        updatedAnswers[currentQuestion.id] = optionIdx;
        updateState({ examAnswers: updatedAnswers });
      });
    });

    // Subjective text change
    const textarea = document.getElementById('exam-subjective-textarea');
    textarea?.addEventListener('input', (e) => {
      state.examAnswers[currentQuestion.id] = e.target.value;
      // Save quietly
      localStorage.setItem("codesphere_state", JSON.stringify(state));
    });

    // Code editor mounting inside exam
    if (currentQuestion.type === 'coding') {
      const codeKey = `exam_code_${currentQuestion.id}`;
      // Initialize with template if not answered
      if (!state.examAnswers[currentQuestion.id]) {
        state.examAnswers[currentQuestion.id] = currentQuestion.template;
      }
      
      // We will temporarily mount Monaco inside exam workspace
      require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs' }});
      require(['vs/editor/editor.main'], function() {
        const mountNode = document.getElementById('monaco-editor-mount');
        if (!mountNode) return;
        
        // Remove existing
        const existing = mountNode.querySelector('.monaco-editor');
        if (existing) existing.remove();

        const examEditor = monaco.editor.create(mountNode, {
          value: state.examAnswers[currentQuestion.id],
          language: 'javascript',
          theme: 'vs-dark',
          automaticLayout: true,
          minimap: { enabled: false }
        });

        examEditor.onDidChangeModelContent(() => {
          state.examAnswers[currentQuestion.id] = examEditor.getValue();
          localStorage.setItem("codesphere_state", JSON.stringify(state));
        });
      });
    }

    // Question navigator goto
    document.querySelectorAll('[data-exam-question-goto]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-exam-question-goto'));
        updateState({ activeQuestionIndex: idx });
      });
    });

    // Question next / save
    document.getElementById('exam-question-next')?.addEventListener('click', () => {
      if (activeIndex === activeExam.questions.length - 1) {
        submitExam(state);
      } else {
        updateState({ activeQuestionIndex: activeIndex + 1 });
      }
    });

    // Question prev
    document.getElementById('exam-question-prev')?.addEventListener('click', () => {
      if (activeIndex > 0) {
        updateState({ activeQuestionIndex: activeIndex - 1 });
      }
    });

    // Manual Submit Exam
    document.getElementById('exam-finish-btn')?.addEventListener('click', () => {
      if (confirm("Are you sure you want to finalize and submit this exam session?")) {
        submitExam(state);
      }
    });

    // Simulate Webcam AI tracking
    startProctorWebcamSimulation(state);

    return;
  }

  if (state.examStatus === 'submitted') {
    document.getElementById('exam-result-return-btn')?.addEventListener('click', () => {
      updateState({ examStatus: null, activeTab: 'dashboard' });
    });
    
    document.getElementById('exam-result-cert-btn')?.addEventListener('click', () => {
      updateState({ examStatus: null, activeTab: 'certificates' });
    });
    return;
  }

  // Dashboard buttons
  document.querySelectorAll('[data-start-exam-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const examId = e.currentTarget.getAttribute('data-start-exam-id');
      const exam = state.exams.find(ex => ex.id === examId);
      if (!exam) return;

      if (confirm(`WARNING: Entering secure lockdown exam mode for ${exam.title}.\n- Copy-paste is disabled.\n- Context menu is disabled.\n- Switching windows or leaving tabs will trigger warnings.\n- The AI Eye-Tracker webcam proctor must remain active.\n\nDo you want to proceed?`)) {
        
        // Enter Fullscreen
        try {
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
          }
        } catch (e) {
          console.error("Fullscreen blocked", e);
        }

        // Initialize state fields
        updateState({
          examStatus: 'taking',
          activeExamId: examId,
          activeQuestionIndex: 0,
          examTimer: exam.duration * 60, // in seconds
          examAnswers: {},
          isLockdownActive: true,
          warningsCount: 0
        });

        // Trigger background seconds decrement timer
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
          const currentTimer = state.examTimer - 1;
          if (currentTimer <= 0) {
            clearInterval(timerInterval);
            submitExam(state);
          } else {
            // Update timer quietly in DOM to prevent full re-render flickering
            state.examTimer = currentTimer;
            const timerLabel = document.querySelector('.text-accent-rose');
            if (timerLabel) {
              const min = Math.floor(currentTimer / 60);
              const sec = currentTimer % 60;
              timerLabel.textContent = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
            }
          }
        }, 1000);
      }
    });
  });
}

function submitExam(state) {
  clearInterval(timerInterval);
  
  // Log security closure
  const submitLog = {
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    user: "Eniyan Rajesh",
    event: "Exam Submission",
    details: `Exam: "${state.exams.find(e => e.id === state.activeExamId)?.title}". Total warnings: ${state.warningsCount}.`,
    severity: state.warningsCount > 2 ? 'warning' : 'info'
  };

  // Exit Fullscreen
  try {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  } catch (e) {
    console.error(e);
  }

  updateState({
    examStatus: 'submitted',
    isLockdownActive: false,
    securityLogs: [submitLog, ...state.securityLogs]
  });
}

// Simulate active Face/Eye outline tracking in browser
function startProctorWebcamSimulation(state) {
  const video = document.getElementById('proctor-video-element');
  const fallback = document.getElementById('proctor-webcam-fallback');
  const faceBox = document.getElementById('proctor-box-face');
  const eyeBox = document.getElementById('proctor-box-eyes');

  if (!video || !fallback) return;

  // Request actual camera stream (WebRTC)
  navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } })
    .then(stream => {
      video.srcObject = stream;
      fallback.classList.add('hidden');
      faceBox?.classList.remove('hidden');
      eyeBox?.classList.remove('hidden');

      // Randomly animate detection bounding boxes in real-time
      let boundsInterval = setInterval(() => {
        if (state.examStatus !== 'taking') {
          clearInterval(boundsInterval);
          // stop webcam tracks
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        // Random drift coords mimicking tracking face offsets
        const left = 70 + Math.random() * 20;
        const top = 30 + Math.random() * 15;
        if (faceBox) {
          faceBox.style.left = `${left}px`;
          faceBox.style.top = `${top}px`;
        }

        if (eyeBox) {
          eyeBox.style.left = `${left + 15}px`;
          eyeBox.style.top = `${top + 20}px`;
        }

        // Randomly simulate eye looking away warning logs (10% chance)
        if (Math.random() < 0.08) {
          // Trigger proctoring incident log
          const triggers = ["Looking Away: Warning", "Phone Detected", "Suspicious Movement"];
          const trigger = triggers[Math.floor(Math.random() * triggers.length)];
          
          const log = {
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
            user: "Eniyan Rajesh",
            event: "AI Proctor Flags",
            details: `Automated detection: ${trigger}`,
            severity: 'warning'
          };
          
          updateState({
            warningsCount: state.warningsCount + 1,
            securityLogs: [log, ...state.securityLogs]
          });
        }

      }, 2000);
    })
    .catch(err => {
      console.warn("Camera blocked or unavailable, launching full graphical visual mockup", err);
      // Fallback: draw animated placeholder bounding boxes on a beautiful canvas
      fallback.innerHTML = `
        <div class="w-full text-center space-y-2">
          <div class="relative w-12 h-12 mx-auto flex items-center justify-center">
            <span class="absolute inset-0 rounded-full border-2 border-indigo-500/40 animate-ping"></span>
            <i data-lucide="scan-eye" class="w-6 h-6 text-indigo-400"></i>
          </div>
          <span class="text-[10px] text-indigo-400 font-bold block animate-pulse">EYE ENGINE STANDBY</span>
          <span class="text-[8px] text-slate-500 block">Webcam Blocked. Running visual mock simulation grid.</span>
        </div>
      `;
      lucide.createIcons();
    });
}
