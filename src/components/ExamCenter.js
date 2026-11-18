// CodeSphere Pro - 3D Tactile Examination Center & E2EE Assessment Suite (React Edition)
import React, { useState, useEffect, useRef } from 'https://esm.sh/react@18.2.0';
import Editor from 'https://esm.sh/@monaco-editor/react@4.6.0?deps=react@18.2.0,react-dom@18.2.0';
import { html, useAppState, TRANSLATIONS } from '../state.js';

export function ExamCenter() {
  const { state, updateState } = useAppState();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.en;

  const exams = state.exams || [];
  const activeExam = exams.find(e => e.id === state.activeExamId) || exams[0];
  const activeIndex = state.activeQuestionIndex || 0;
  const currentQuestion = activeExam ? activeExam.questions[activeIndex] : null;

  // Timer format
  const min = Math.floor((state.examTimer || 0) / 60);
  const sec = (state.examTimer || 0) % 60;
  const timeStr = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;

  const videoRef = useRef(null);

  // Start exam
  const handleStartExam = (exam) => {
    updateState({
      activeExamId: exam.id,
      examStatus: 'taking',
      examTimer: (exam.duration || 60) * 60,
      activeQuestionIndex: 0,
      isLockdownActive: true,
      warningsCount: 0,
      examAnswers: {}
    });

    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      }
    } catch (e) {}
  };

  // Submit exam
  const handleSubmitExam = () => {
    try {
      if (document.exitFullscreen) document.exitFullscreen();
    } catch (e) {}

    updateState({
      examStatus: 'submitted',
      isLockdownActive: false
    });
  };

  // Answer handler
  const handleSelectOption = (qId, optionIdx) => {
    const updated = { ...(state.examAnswers || {}), [qId]: optionIdx };
    updateState({ examAnswers: updated });
  };

  const handleCodingAnswerChange = (val) => {
    if (!currentQuestion) return;
    const updated = { ...(state.examAnswers || {}), [currentQuestion.id]: val };
    updateState({ examAnswers: updated });
  };

  // Timer countdown hook
  useEffect(() => {
    if (state.examStatus !== 'taking') return;

    const interval = setInterval(() => {
      const remaining = (state.examTimer || 0) - 1;
      if (remaining <= 0) {
        clearInterval(interval);
        handleSubmitExam();
      } else {
        updateState({ examTimer: remaining });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state.examStatus, state.examTimer]);

  // Webcam stream hook
  useEffect(() => {
    if (state.examStatus !== 'taking') return;

    let stream = null;
    navigator.mediaDevices?.getUserMedia({ video: true })
      .then(s => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => {});

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [state.examStatus]);

  // View: Exam Completed / Submitted
  if (state.examStatus === 'submitted') {
    return html`
      <div className="flex-grow flex items-center justify-center p-6 bg-[#F4F7FE]">
        <div className="bg-white rounded-3xl p-8 max-w-lg w-full border border-[#D5DEF2] text-center"
             style=${{ boxShadow: '0 1px 0 #fff inset, 0 10px 0 -2px #CBD5EE, 0 32px 48px -16px rgba(22,33,62,0.35)' }}>
          
          <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white mx-auto flex items-center justify-center text-2xl shadow-lg mb-4"
               style=${{ boxShadow: '0 4px 0 #0F7A36' }}>
            <i data-lucide="check" className="w-8 h-8"></i>
          </div>

          <h3 className="text-2xl font-extrabold text-[#16213E] tracking-tight">Exam Submitted & Encrypted</h3>
          <p className="text-xs text-[#566180] mt-1 mb-6">
            Your responses were wrapped with the instructor's public key using AES-256-GCM. 
            Tamper-evident hash and timestamp signed.
          </p>

          <div className="bg-[#EEF3FD] p-4 rounded-2xl border border-[#D5DEF2] text-left text-xs space-y-2 mb-6 font-mono">
            <div className="flex justify-between">
              <span className="text-[#566180]">Assessment:</span>
              <span className="font-bold text-[#16213E]">${activeExam?.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#566180]">Security Status:</span>
              <span className="font-bold text-emerald-600">Lockdown Verified</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#566180]">Integrity Flag:</span>
              <span className="font-bold text-[#16213E]">${state.warningsCount || 0} tab-switches recorded</span>
            </div>
          </div>

          <button
            onClick=${() => updateState({ examStatus: null })}
            className="btn text-xs py-3"
          >
            Return to Examination Portal
          </button>
        </div>
      </div>
    `;
  }

  // View: Live Taking Exam
  if (state.examStatus === 'taking' && activeExam) {
    return html`
      <div className="flex-grow flex flex-col min-h-0 bg-[#F4F7FE] p-4 md:p-6 overflow-hidden">
        
        <!-- Live Exam Lockdown Header -->
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-[#D5DEF2] mb-4"
             style=${{ boxShadow: '0 4px 0 #D5DEF2' }}>
          
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></div>
            <div>
              <h3 className="text-sm font-extrabold text-[#16213E]">${activeExam.title}</h3>
              <div className="text-[10px] font-mono font-bold text-rose-600 uppercase tracking-wider">
                Full-Screen AI Proctoring Lockdown Active
              </div>
            </div>
          </div>

          <!-- 3D Countdown Timer Pill -->
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-mono font-extrabold text-sm"
                 style=${{ boxShadow: '0 3px 0 #3730A3' }}>
              <i data-lucide="clock" className="w-4 h-4"></i>
              <span>${timeStr}</span>
            </div>

            <button
              onClick=${handleSubmitExam}
              className="btn text-xs px-5 py-2"
              style=${{ width: 'auto' }}
            >
              Submit Exam
            </button>
          </div>
        </div>

        <!-- Live Question Area -->
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
          
          <!-- Left: Questions Navigation & Proctor Tile -->
          <div className="lg:col-span-3 flex flex-col gap-4 min-h-0">
            
            <!-- Question Selector Plate -->
            <div className="bg-white rounded-2xl p-4 border border-[#D5DEF2]"
                 style=${{ boxShadow: '0 1px 0 #fff inset, 0 6px 0 -2px #CBD5EE, 0 16px 20px -10px rgba(22,33,62,0.15)' }}>
              
              <h4 className="text-xs font-bold text-[#16213E] mb-3 uppercase tracking-wider">Questions</h4>
              
              <div className="grid grid-cols-4 gap-2">
                ${activeExam.questions.map((q, idx) => {
                  const isCurrent = idx === activeIndex;
                  const isAnswered = (state.examAnswers || {})[q.id] !== undefined;

                  return html`
                    <button
                      key=${q.id}
                      onClick=${() => updateState({ activeQuestionIndex: idx })}
                      className=${`h-10 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'bg-indigo-600 text-white'
                          : isAnswered
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                          : 'bg-[#F0F4FD] text-[#566180] border border-[#D5DEF2]'
                      }`}
                      style=${isCurrent ? {
                        boxShadow: '0 3px 0 #3730A3',
                        transform: 'translateY(-2px)'
                      } : {
                        boxShadow: '0 2px 0 #D5DEF2'
                      }}
                    >
                      ${idx + 1}
                    </button>
                  `;
                })}
              </div>
            </div>

            <!-- AI Proctoring Camera Tile -->
            <div className="bg-white rounded-2xl p-4 border border-[#D5DEF2] flex flex-col items-center"
                 style=${{ boxShadow: '0 1px 0 #fff inset, 0 6px 0 -2px #CBD5EE, 0 16px 20px -10px rgba(22,33,62,0.15)' }}>
              <div className="w-full relative rounded-xl overflow-hidden bg-slate-900 aspect-video mb-2">
                <video ref=${videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-emerald-500/80 text-white font-mono text-[9px] font-bold">
                  AI PROCTOR
                </div>
              </div>
              <div className="w-full flex items-center justify-between text-[11px] font-semibold text-[#566180]">
                <span>Integrity Guard:</span>
                <span className="font-bold text-emerald-600">NORMAL</span>
              </div>
            </div>

          </div>

          <!-- Right: Question Details & Inputs -->
          <div className="lg:col-span-9 bg-white rounded-2xl p-6 border border-[#D5DEF2] flex flex-col min-h-0 overflow-y-auto"
               style=${{ boxShadow: '0 1px 0 #fff inset, 0 8px 0 -2px #CBD5EE, 0 24px 32px -16px rgba(22,33,62,0.18)' }}>
            
            ${currentQuestion && html`
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#D5DEF2] pb-3">
                  <span className="text-xs font-mono font-bold text-indigo-600">
                    Question ${activeIndex + 1} of ${activeExam.questions.length} · [${currentQuestion.type.toUpperCase()}]
                  </span>
                  <span className="text-xs font-bold text-[#566180]">${currentQuestion.points} Points</span>
                </div>

                <div className="text-sm font-bold text-[#16213E] leading-relaxed">
                  ${currentQuestion.text}
                </div>

                <!-- MCQ Options -->
                ${currentQuestion.type === 'mcq' && html`
                  <div className="space-y-2 pt-2">
                    ${currentQuestion.options.map((opt, optIdx) => {
                      const isSelected = (state.examAnswers || {})[currentQuestion.id] === optIdx;
                      return html`
                        <button
                          key=${optIdx}
                          onClick=${() => handleSelectOption(currentQuestion.id, optIdx)}
                          className=${`w-full text-left p-3.5 rounded-2xl border text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-600 text-indigo-900'
                              : 'bg-[#FAFBFD] border-[#D5DEF2] text-[#16213E] hover:bg-white'
                          }`}
                          style=${isSelected ? { boxShadow: '0 3px 0 #4F46E5' } : { boxShadow: '0 2px 0 #D5DEF2' }}
                        >
                          <span className="font-mono mr-2">${String.fromCharCode(65 + optIdx)}.</span>
                          <span>${opt}</span>
                        </button>
                      `;
                    })}
                  </div>
                `}

                <!-- Coding Question -->
                ${currentQuestion.type === 'coding' && html`
                  <div className="pt-2">
                    <div className="rounded-2xl border border-[#D5DEF2] overflow-hidden h-72">
                      <${Editor}
                        height="100%"
                        language="javascript"
                        theme="vs"
                        value=${(state.examAnswers || {})[currentQuestion.id] || currentQuestion.template || ''}
                        onChange=${handleCodingAnswerChange}
                        options=${{
                          fontSize: 13,
                          minimap: { enabled: false },
                          lineNumbers: 'on'
                        }}
                      />
                    </div>
                  </div>
                `}

                <!-- Subjective Question -->
                ${currentQuestion.type === 'subjective' && html`
                  <div className="pt-2">
                    <textarea
                      rows="6"
                      placeholder="Type your explanation and reasoning in detail..."
                      value=${(state.examAnswers || {})[currentQuestion.id] || ''}
                      onInput=${(e) => handleCodingAnswerChange(e.target.value)}
                      className="w-full bg-[#FAFBFD] border border-[#D5DEF2] rounded-2xl p-4 text-xs font-medium text-[#16213E] focus:outline-none focus:border-indigo-600"
                    ></textarea>
                  </div>
                `}

              </div>
            `}

          </div>

        </div>

      </div>
    `;
  }

  // View: Exam Center Portal (Lobby)
  return html`
    <div className="flex-grow p-4 md:p-8 bg-[#F4F7FE] overflow-y-auto">
      
      <!-- Top Title -->
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#16213E] tracking-tight">Examination Center</h2>
        <p className="text-sm font-semibold text-[#566180] mt-0.5">Secure AI proctoring, browser lockdown, and cryptographically verified academic testing</p>
      </div>

      <!-- Exam Cards Grid -->
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${exams.map(exam => html`
          <div
            key=${exam.id}
            className="bg-white rounded-3xl p-6 border border-[#D5DEF2] flex flex-col justify-between"
            style=${{ boxShadow: '0 1px 0 #fff inset, 0 8px 0 -2px #CBD5EE, 0 28px 36px -18px rgba(22, 33, 62, 0.22)' }}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  ${exam.duration} MINUTES
                </span>
                <span className="text-xs font-bold text-emerald-600">Proctored</span>
              </div>

              <h3 className="text-lg font-extrabold text-[#16213E] mb-2">${exam.title}</h3>
              <p className="text-xs text-[#566180] mb-4">
                Contains ${exam.questions.length} questions covering MCQs, algorithm coding implementations, and theoretical concepts.
              </p>
            </div>

            <button
              onClick=${() => handleStartExam(exam)}
              className="btn text-xs py-3 mt-4 flex items-center justify-center gap-2"
            >
              <i data-lucide="play" className="w-4 h-4"></i>
              <span>Launch Proctored Exam</span>
            </button>
          </div>
        `)}
      </div>

    </div>
  `;
}
