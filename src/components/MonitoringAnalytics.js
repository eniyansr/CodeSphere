// CodeSphere Pro — Main Module 1: Deep Learning Monitoring & Analytics (React Edition)
import React, { useState, useEffect } from 'https://esm.sh/react@18.2.0';
import { html, useAppState, TRANSLATIONS } from '../state.js';
import { INITIAL_STUDENT_INTEGRITY } from '../services/ai-monitoring-service.js';

export function MonitoringAnalytics() {
  const { state, updateState } = useAppState();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.en;

  const [students, setStudents] = useState(INITIAL_STUDENT_INTEGRITY);
  const [selectedStudent, setSelectedStudent] = useState(INITIAL_STUDENT_INTEGRITY[1]); // Pranav Kumar (High risk)
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'high' | 'flagged'
  const [viewMode, setViewMode] = useState('live'); // 'live' | 'dossier' | 'heatmap'
  const [timelineIndex, setTimelineIndex] = useState(45); // Current minute in scrubber
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Filter students based on current tab
  const filteredStudents = students.filter(s => {
    if (filterMode === 'high') return s.riskScore >= 60;
    if (filterMode === 'flagged') return s.eventsCount >= 4;
    return true;
  });

  // Simulated live event ingestion
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setStudents(prev => prev.map(s => {
        // Subtle drift in risk scores to emulate live GRU inference
        if (Math.random() < 0.25) {
          const delta = Math.floor(Math.random() * 5) - 2;
          const nextScore = Math.max(2, Math.min(98, s.riskScore + delta));
          return {
            ...s,
            riskScore: nextScore,
            riskLevel: nextScore >= 60 ? 'high' : nextScore >= 25 ? 'moderate' : 'low'
          };
        }
        return s;
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleIssueWarning = (student) => {
    alert(`🚨 Official invigilator alert transmitted to ${student.name}. Candidate notified of high integrity risk.`);
    const warningEv = {
      time: new Date().toLocaleTimeString(),
      type: 'INVIGILATOR_WARNING',
      desc: 'Teacher transmitted live compliance warning',
      conf: '100%',
      duration: 'Manual',
      severity: 'warning'
    };
    setStudents(prev => prev.map(s => s.id === student.id ? {
      ...s,
      eventsCount: s.eventsCount + 1,
      recentEvents: [warningEv, ...s.recentEvents]
    } : s));
  };

  return html`
    <div className="flex-grow p-4 md:p-8 bg-[#F4F7FE] overflow-y-auto">
      
      <!-- Top Title & Architecture Banner -->
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              DEEP LEARNING PROCTORING
            </span>
            <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              CNN (Edge) + GRU (Server)
            </span>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Pipeline Active
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#16213E] tracking-tight">
            Monitoring & Integrity Analytics
          </h2>
          <p className="text-xs md:text-sm font-semibold text-[#566180] mt-0.5">
            Browser CNN extracts gaze & face events · Server GRU evaluates continuous temporal risk trajectory
          </p>
        </div>

        <!-- View Mode Switcher -->
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-[#D5DEF2] shadow-sm">
          <button
            onClick=${() => setViewMode('live')}
            className=${`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'live' ? 'bg-indigo-600 text-white shadow-sm' : 'text-[#566180] hover:text-[#16213E]'
            }`}
          >
            Live Monitor
          </button>
          <button
            onClick=${() => setViewMode('heatmap')}
            className=${`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'heatmap' ? 'bg-indigo-600 text-white shadow-sm' : 'text-[#566180] hover:text-[#16213E]'
            }`}
          >
            Class Heatmap
          </button>
          <button
            onClick=${() => setViewMode('dossier')}
            className=${`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'dossier' ? 'bg-indigo-600 text-white shadow-sm' : 'text-[#566180] hover:text-[#16213E]'
            }`}
          >
            Forensic Report
          </button>
        </div>
      </div>

      <!-- Cohort Summary Metrics (3D tactile styling) -->
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        
        <div className="bg-white p-4 rounded-2xl border border-[#D5DEF2] shadow-sm"
             style=${{ boxShadow: '0 4px 0 #D5DEF2' }}>
          <div className="text-[10px] uppercase font-bold text-[#566180]">Active Candidates</div>
          <div className="text-2xl font-black text-[#16213E] mt-1">24 Students</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">100% Video Streams Connected</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#D5DEF2] shadow-sm"
             style=${{ boxShadow: '0 4px 0 #D5DEF2' }}>
          <div className="text-[10px] uppercase font-bold text-[#566180]">Low Risk (Compliant)</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">19 Candidates</div>
          <div className="text-[11px] text-[#566180] font-semibold mt-0.5">Score under 25%</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#D5DEF2] shadow-sm"
             style=${{ boxShadow: '0 4px 0 #D5DEF2' }}>
          <div className="text-[10px] uppercase font-bold text-[#566180]">Moderate Divergence</div>
          <div className="text-2xl font-black text-amber-500 mt-1">3 Candidates</div>
          <div className="text-[11px] text-[#566180] font-semibold mt-0.5">Score 25% – 59%</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#D5DEF2] shadow-sm"
             style=${{ boxShadow: '0 4px 0 #D5DEF2' }}>
          <div className="text-[10px] uppercase font-bold text-[#566180]">High Risk (Flagged)</div>
          <div className="text-2xl font-black text-rose-600 mt-1">2 Candidates</div>
          <div className="text-[11px] text-rose-600 font-semibold mt-0.5">Requires immediate review</div>
        </div>

      </div>

      <!-- Main Supervision Split -->
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- Left: Class Candidate Tiles (Heatmap / Live Grid) -->
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          <div className="bg-white rounded-3xl border border-[#D5DEF2] p-5 shadow-sm"
               style=${{ boxShadow: '0 1px 0 #fff inset, 0 8px 0 -2px #CBD5EE' }}>
            
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#D5DEF2]">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-[#16213E]">Class Candidates</h3>
                <span className="text-[11px] font-mono text-[#566180]">(${filteredStudents.length} Visible)</span>
              </div>

              <!-- Filter Buttons -->
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <button
                  onClick=${() => setFilterMode('all')}
                  className=${`px-2.5 py-1 rounded-lg border text-[11px] ${
                    filterMode === 'all' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-gray-50 border-gray-200 text-[#566180]'
                  }`}
                >
                  All
                </button>
                <button
                  onClick=${() => setFilterMode('high')}
                  className=${`px-2.5 py-1 rounded-lg border text-[11px] ${
                    filterMode === 'high' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-gray-50 border-gray-200 text-[#566180]'
                  }`}
                >
                  High Risk
                </button>
                <button
                  onClick=${() => setFilterMode('flagged')}
                  className=${`px-2.5 py-1 rounded-lg border text-[11px] ${
                    filterMode === 'flagged' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-gray-50 border-gray-200 text-[#566180]'
                  }`}
                >
                  Multi-Flagged
                </button>
              </div>
            </div>

            <!-- Student Grid -->
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              ${filteredStudents.map(student => {
                const isSelected = selectedStudent.id === student.id;
                const badgeColor = student.riskLevel === 'high' ? '#E11D48' : student.riskLevel === 'moderate' ? '#F59E0B' : '#10B981';
                const badgeBg = student.riskLevel === 'high' ? '#FFE4E6' : student.riskLevel === 'moderate' ? '#FEF3C7' : '#D1FAE5';

                return html`
                  <div
                    key=${student.id}
                    onClick=${() => setSelectedStudent(student)}
                    className=${`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected ? 'border-indigo-600 bg-[#F0F4FD] shadow-md -translate-y-0.5' : 'border-[#D5DEF2] bg-white hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl text-white font-mono font-bold text-xs flex items-center justify-center shadow-sm"
                             style=${{
                               background: student.riskLevel === 'high' ? '#E11D48' : '#4F46E5'
                             }}>
                          ${student.avatar}
                        </div>
                        <div>
                          <div className="text-xs font-extrabold text-[#16213E]">${student.name}</div>
                          <div className="text-[10px] font-mono text-[#566180]">
                            ${student.cameraActive ? '🎥 Camera ON' : '⚠️ Cam Offline'}
                          </div>
                        </div>
                      </div>

                      <!-- Live Risk Badge -->
                      <div className="px-2 py-0.5 rounded-lg font-mono font-extrabold text-[11px]"
                           style=${{ background: badgeBg, color: badgeColor }}>
                        ${student.riskScore}% ${student.riskLevel.toUpperCase()}
                      </div>
                    </div>

                    <!-- Mini Sparkline Trajectory -->
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-[#566180]">
                        <span>Gaze: <strong className=${student.gazeState === 'focused' ? 'text-emerald-600' : 'text-rose-600'}>${student.gazeState}</strong></span>
                        <span>Faces: <strong>${student.facesDetected}</strong></span>
                        <span>Events: <strong>${student.eventsCount}</strong></span>
                      </div>
                      
                      <!-- Risk Bar -->
                      <div className="h-1.5 w-full bg-[#E5EDFD] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style=${{
                            width: `${student.riskScore}%`,
                            background: badgeColor
                          }}
                        ></div>
                      </div>
                    </div>

                  </div>
                `;
              })}
            </div>

          </div>

          <!-- Heatmap View: 60-Minute Cohort Risk Timeline Matrix -->
          ${viewMode === 'heatmap' && html`
            <div className="bg-white rounded-3xl border border-[#D5DEF2] p-5 shadow-sm"
                 style=${{ boxShadow: '0 1px 0 #fff inset, 0 6px 0 -2px #CBD5EE' }}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-[#16213E] uppercase tracking-wide">
                  Cohort Temporal Heatmap (60-Minute Exam Window)
                </h4>
                <span className="text-[10px] font-mono text-[#566180]">Interval: 10-Minute Buckets</span>
              </div>

              <div className="space-y-2 font-mono text-xs">
                ${students.map(s => html`
                  <div key=${s.id} className="flex items-center gap-3">
                    <span className="w-28 truncate text-[11px] font-bold text-[#16213E]">${s.name}</span>
                    <div className="flex-grow grid grid-cols-6 gap-1 h-5">
                      ${[0, 10, 20, 30, 40, 50].map(bucket => {
                        const val = Math.min(100, Math.round(s.riskScore * (0.4 + (bucket / 100))));
                        const bg = val > 60 ? '#FDA4AF' : val > 30 ? '#FDE68A' : '#A7F3D0';
                        return html`
                          <div
                            key=${bucket}
                            className="rounded-md transition-colors flex items-center justify-center text-[9px] font-bold text-[#16213E]"
                            style=${{ background: bg }}
                            title=${`Minute ${bucket}: Risk ${val}%`}
                          >
                            ${val}%
                          </div>
                        `;
                      })}
                    </div>
                  </div>
                `)}
              </div>
            </div>
          `}

        </div>

        <!-- Right: Forensic Deep Dive & Evidence Inspector for Selected Student -->
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          <div className="bg-white rounded-3xl border border-[#D5DEF2] p-5 shadow-sm flex flex-col justify-between"
               style=${{ boxShadow: '0 1px 0 #fff inset, 0 8px 0 -2px #CBD5EE' }}>
            
            <!-- Student Header Dossier -->
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#D5DEF2]">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white font-mono font-bold text-sm flex items-center justify-center shadow-md">
                    ${selectedStudent.avatar}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#16213E]">${selectedStudent.name}</h3>
                    <div className="text-[11px] font-mono text-[#566180]">Candidate ID: ${selectedStudent.id} · Student</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-[#566180]">GRU Risk Index</div>
                  <div className=${`text-xl font-black ${
                    selectedStudent.riskLevel === 'high' ? 'text-rose-600' : selectedStudent.riskLevel === 'moderate' ? 'text-amber-500' : 'text-emerald-600'
                  }`}>
                    ${selectedStudent.riskScore}%
                  </div>
                </div>
              </div>

              <!-- Temporal Risk Timeline Scrubber -->
              <div className="bg-[#F0F4FD] p-3 rounded-2xl border border-[#D5DEF2] mb-4">
                <div className="flex justify-between items-center text-xs font-bold text-[#16213E] mb-1">
                  <span>GRU Temporal Risk Timeline</span>
                  <span className="font-mono text-indigo-700">Minute: ${timelineIndex} / 60</span>
                </div>
                
                <!-- Range Slider Scrubber -->
                <input
                  type="range"
                  min="0"
                  max="60"
                  value=${timelineIndex}
                  onChange=${e => setTimelineIndex(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-[#CBD5EE] rounded-lg"
                />

                <div className="flex justify-between text-[10px] font-mono text-[#566180] mt-1">
                  <span>Start (00:00)</span>
                  <span>Mid-Exam (30:00)</span>
                  <span>Submission (60:00)</span>
                </div>
              </div>

              <!-- Anomaly Event Stream (CNN outputs) -->
              <div className="space-y-2 mb-4">
                <div className="text-xs font-bold text-[#16213E] uppercase tracking-wide flex items-center justify-between">
                  <span>Edge CNN Telemetry Stream</span>
                  <span className="text-[10px] font-mono text-emerald-600 font-bold">Zero-Video Payload</span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  ${selectedStudent.recentEvents.map((ev, i) => html`
                    <div
                      key=${i}
                      className=${`p-2.5 rounded-xl border text-xs font-mono ${
                        ev.severity === 'critical'
                          ? 'bg-rose-50 border-rose-200 text-rose-900'
                          : ev.severity === 'warning'
                          ? 'bg-amber-50 border-amber-200 text-amber-900'
                          : 'bg-[#F8FAFD] border-[#D5DEF2] text-[#16213E]'
                      }`}
                    >
                      <div className="flex justify-between font-bold mb-0.5">
                        <span className="text-indigo-600">[${ev.time}] ${ev.type}</span>
                        <span>${ev.conf} Conf</span>
                      </div>
                      <div className="text-[11px] text-[#566180]">${ev.desc}</div>
                      <div className="text-[10px] text-right font-bold mt-1 text-[#566180]">
                        Duration: ${ev.duration}
                      </div>
                    </div>
                  `)}
                </div>
              </div>

            </div>

            <!-- Invigilator Actions -->
            <div className="pt-3 border-t border-[#D5DEF2] flex gap-2">
              <button
                onClick=${() => handleIssueWarning(selectedStudent)}
                className="btn text-xs py-2.5 flex-1 flex items-center justify-center gap-1.5"
              >
                <i data-lucide="shield-alert" className="w-3.5 h-3.5"></i>
                <span>Issue Warning</span>
              </button>
              <button
                onClick=${() => alert(`Audit report downloaded for ${selectedStudent.name}.`)}
                className="chip text-xs py-2.5 flex-1 font-bold text-[#16213E]"
              >
                Export Dossier
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  `;
}
