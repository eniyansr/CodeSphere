// CodeSphere Pro - Coding Battle Arena Component (React Edition)
import React, { useState, useEffect, useRef } from 'https://esm.sh/react@18.2.0';
import Editor from 'https://esm.sh/@monaco-editor/react@4.6.0?deps=react@18.2.0,react-dom@18.2.0';
import { TRANSLATIONS, html, useAppState } from '../state.js';

const BATTLE_LANGUAGES = [
  { id: 'javascript', label: 'JavaScript',  ext: 'js',    color: '#f7df1e' },
  { id: 'python',     label: 'Python 3',    ext: 'py',    color: '#3572A5' },
  { id: 'cpp',        label: 'C++',         ext: 'cpp',   color: '#f34b7d' },
  { id: 'c',          label: 'C',           ext: 'c',     color: '#555555' },
  { id: 'java',       label: 'Java',        ext: 'java',  color: '#b07219' },
  { id: 'typescript', label: 'TypeScript',  ext: 'ts',    color: '#2b7489' },
  { id: 'go',         label: 'Go',          ext: 'go',    color: '#00ADD8' },
  { id: 'rust',       label: 'Rust',        ext: 'rs',    color: '#dea584' },
  { id: 'ruby',       label: 'Ruby',        ext: 'rb',    color: '#701516' },
  { id: 'swift',      label: 'Swift',       ext: 'swift', color: '#F05138' },
];

const monacoLangMap = {
  javascript: 'javascript', python: 'python', cpp: 'cpp', c: 'c',
  java: 'java', typescript: 'typescript', php: 'php', ruby: 'ruby',
  go: 'go', rust: 'rust', swift: 'swift'
};

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function BattleArena() {
  const { state, updateState } = useAppState();
  const battleStatus = state.battleStatus || 'idle';

  const [isSearching, setIsSearching] = useState(false);
  const [battleTab, setBattleTab] = useState('output');
  const [logs, setLogs] = useState([]);
  const [runTestResults, setRunTestResults] = useState(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const stateRef = useRef(state);
  stateRef.current = state;

  const editorRef = useRef(null);
  const logsEndRef = useRef(null);

  const endBattle = (reason) => {
    let title, message, apChange;
    if (reason === 'player_won') {
      title = '🏆 Victory!';
      message = 'Congratulations! You solved the problem first and won this coding duel!';
      apChange = '+30 Arena Points earned!';
    } else if (reason === 'opponent_won') {
      title = '💀 Defeated!';
      message = 'Your opponent solved the problem first. Keep practicing — you\'ll win next time!';
      apChange = '-10 Arena Points lost.';
    } else if (reason === 'timeout') {
      title = '⏰ Time\'s Up!';
      message = 'The match ended in a draw — neither player solved the problem in time.';
      apChange = 'No AP change.';
    } else {
      title = 'Match Forfeited';
      message = 'You forfeited the match.';
      apChange = '-15 Arena Points lost.';
    }

    setTimeout(() => {
      if (confirm(`${title}\n\n${message}\n\n${apChange}\n\nReturn to Battle Lobby?`)) {
        updateState({
          battleStatus: 'idle',
          battlePlayerProgress: 0,
          battleOpponentProgress: 0,
          battleTimerSeconds: 600
        });
      }
    }, 500);
  };

  useEffect(() => {
    if (state.battleStatus !== 'fighting') return;

    // Reset logs and results
    const initialSecs = stateRef.current.battleTimerSeconds ?? 600;
    setLogs([
      { text: 'Battle started. Good luck!', color: 'slate', time: formatTime(initialSecs) },
      { text: `Opponent Pranav K. loaded ${stateRef.current.arenaLanguage || 'JavaScript'}`, color: 'slate', time: formatTime(initialSecs) }
    ]);
    setRunTestResults(null);
    setBattleTab('output');

    // Timer Interval
    const timerInterval = setInterval(() => {
      const currentTimer = stateRef.current.battleTimerSeconds - 1;
      if (currentTimer <= 0) {
        clearInterval(timerInterval);
        endBattle('timeout');
      } else {
        updateState({ battleTimerSeconds: currentTimer });
      }
    }, 1000);

    // Opponent Progress Interval
    const opponentInterval = setInterval(() => {
      if (stateRef.current.battleStatus !== 'fighting') return;
      const delta = Math.floor(Math.random() * 12) + 3;
      const current = (stateRef.current.battleOpponentProgress || 0) + delta;
      const capped = Math.min(current, 100);
      
      updateState({ battleOpponentProgress: capped });

      // Log opponent events
      const opponentTime = formatTime(stateRef.current.battleTimerSeconds || 600);
      if (capped > 30 && current - delta <= 30) {
        setLogs(prev => [...prev, { text: 'Pranav K. passed Test Case 1! 🔥', color: 'rose', time: opponentTime }]);
      }
      if (capped > 70 && current - delta <= 70) {
        setLogs(prev => [...prev, { text: 'Pranav K. passed Test Case 2! ⚡', color: 'rose', time: opponentTime }]);
      }

      if (capped >= 100) {
        clearInterval(opponentInterval);
        clearInterval(timerInterval);
        endBattle('opponent_won');
      }
    }, 4000);

    return () => {
      clearInterval(timerInterval);
      clearInterval(opponentInterval);
    };
  }, [state.battleStatus]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleMatchmake = () => {
    setIsSearching(true);
    const problems = state.battleProblems || [];
    const probIdx = Math.floor(Math.random() * Math.max(problems.length, 1));

    setTimeout(() => {
      const startProgress = Math.floor(Math.random() * 20);
      updateState({
        battleStatus: 'fighting',
        battleOpponentProgress: startProgress,
        battlePlayerProgress: 0,
        activeBattleProblem: probIdx,
        battleTimerSeconds: 600
      });
      setIsSearching(false);
    }, 1800);
  };

  const handleLangSelect = (langId) => {
    updateState({ arenaLanguage: langId });
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleFormat = () => {
    editorRef.current?.getAction('editor.action.formatDocument')?.run();
  };

  const handleReset = (initialCode) => {
    if (confirm('Reset code to the problem template?')) {
      editorRef.current?.setValue(initialCode);
    }
  };

  const handleRun = async (prob, visibleTests) => {
    if (!editorRef.current) return;
    setBattleTab('output');
    setIsRunningTests(true);
    
    const runTime = formatTime(stateRef.current.battleTimerSeconds || 600);
    setLogs(prev => [...prev, { text: 'Running test cases...', color: 'slate', time: runTime }]);

    await new Promise(r => setTimeout(r, 800));

    // Simulate test execution
    let passed = 0;
    const testResults = visibleTests.map(tc => {
      const tcPassed = Math.random() > 0.5;
      if (tcPassed) passed++;
      return { id: tc.id, input: tc.input, expected: tc.expected, passed: tcPassed };
    });

    setRunTestResults(testResults);
    setIsRunningTests(false);

    const progress = Math.round((passed / Math.max(visibleTests.length, 1)) * 70);
    updateState({ battlePlayerProgress: Math.min(progress, 95) });

    const finishTime = formatTime(stateRef.current.battleTimerSeconds || 600);
    setLogs(prev => [...prev, { text: `Ran ${visibleTests.length} tests — ${passed}/${visibleTests.length} passed`, color: passed > 0 ? 'indigo' : 'rose', time: finishTime }]);
    setBattleTab('tests');
  };

  const handleSubmit = () => {
    if (!editorRef.current) return;
    updateState({ battlePlayerProgress: 100 });
    const submitTime = formatTime(stateRef.current.battleTimerSeconds || 600);
    setLogs(prev => [...prev, { text: 'Solution submitted! Validating all test cases...', color: 'emerald', time: submitTime }]);
    setTimeout(() => endBattle('player_won'), 1000);
  };

  const handleForfeit = () => {
    if (confirm('Forfeit this match? Your Arena Points rating will decrease.')) {
      endBattle('forfeit');
    }
  };

  if (battleStatus === 'fighting') {
    const opponentProgress = state.battleOpponentProgress || 0;
    const playerProgress = state.battlePlayerProgress || 0;
    const arenaLang = state.arenaLanguage || 'javascript';
    const problems = state.battleProblems || [];
    const probIdx = state.activeBattleProblem || 0;
    const prob = problems[probIdx] || {
      title: 'Two Sum',
      difficulty: 'Easy',
      description: 'Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.',
      examples: [{ input: 'nums=[2,7,11,15], target=9', output: '[0,1]' }],
      testCases: [
        { id: 1, input: '[2,7,11,15], 9', expected: '[0,1]', hidden: false },
        { id: 2, input: '[3,2,4], 6', expected: '[1,2]', hidden: false }
      ],
      constraints: ['2 <= nums.length <= 10^4']
    };

    const timerSecs = state.battleTimerSeconds ?? 600;
    const langMeta = BATTLE_LANGUAGES.find(l => l.id === arenaLang) || BATTLE_LANGUAGES[0];
    const initialCode = (prob.templates && prob.templates[arenaLang]) || `// Solve: ${prob.title}\n// Language: ${langMeta.label}\n\n`;

    const colorMap = { rose: 'text-rose-400', indigo: 'text-indigo-400', emerald: 'text-emerald-400', slate: 'text-slate-400', amber: 'text-amber-400' };

    const visibleTests = (prob.testCases || []).filter(tc => !tc.hidden);

    return html`
      <div className="flex-grow flex flex-col h-[calc(100vh-76px)] overflow-hidden bg-[#05060b]" id="battle-ide-root">

        <!-- Battle Top Bar -->
        <div className="bg-slate-900/90 border-b border-slate-800/70 px-4 py-2 flex items-center gap-3 flex-wrap">
          
          <!-- VS Info -->
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 font-black text-[10px] flex items-center justify-center border border-indigo-500/30">ER</div>
              <span className="text-xs font-bold text-slate-200">Eniyan R.</span>
            </div>
            <div className="px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-400 font-black text-[10px]">VS</div>
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-400 font-black text-[10px] flex items-center justify-center border border-rose-500/30">PK</div>
              <span className="text-xs font-bold text-slate-200">Pranav K.</span>
            </div>
          </div>

          <!-- Problem Title -->
          <div className="hidden md:flex items-center gap-2 flex-grow justify-center">
            <span className="text-xs text-slate-500">Problem:</span>
            <span className="text-xs font-bold text-white">${prob.title}</span>
            <span className=${`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
              prob.difficulty === 'Easy' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
              prob.difficulty === 'Medium' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
              'bg-rose-500/15 text-rose-400 border-rose-500/30'
            }`}>${prob.difficulty || 'Easy'}</span>
          </div>

          <!-- Timer & Language -->
          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 rounded-lg border border-slate-700/50">
              <i data-lucide="timer" className="w-3 h-3 text-rose-400"></i>
              <span id="battle-timer" className="text-xs font-black font-mono text-rose-400">${formatTime(timerSecs)}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 rounded-lg border border-slate-700/50">
              <div className="w-2 h-2 rounded-full" style="background:${langMeta.color}"></div>
              <span className="text-xs font-semibold text-slate-300">${langMeta.label}</span>
            </div>
          </div>
        </div>

        <!-- Main Split Layout -->
        <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">

          <!-- LEFT: Problem + IDE -->
          <div className="flex-grow flex flex-col min-w-0 overflow-hidden">

            <!-- Sub-split: Problem Panel (left) + Editor (right) on large screens -->
            <div className="flex-grow flex flex-col md:flex-row overflow-hidden">

              <!-- Problem Panel -->
              <div className="w-full md:w-[300px] flex-shrink-0 border-r border-slate-800/60 bg-[#090c12] flex flex-col overflow-hidden">
                <div className="bg-slate-900/70 border-b border-slate-800/60 px-3 py-2 flex items-center gap-2">
                  <i data-lucide="book-open" className="w-3.5 h-3.5 text-indigo-400"></i>
                  <span className="text-xs font-bold text-slate-200">Problem Statement</span>
                </div>
                <div className="flex-grow overflow-y-auto p-4 space-y-4 text-xs">
                  
                  <div>
                    <h2 className="font-black text-white text-sm">${prob.title}</h2>
                    <p className="text-slate-400 leading-relaxed mt-2">${prob.description}</p>
                  </div>

                  ${prob.examples && html`
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Examples</div>
                      ${prob.examples.map((ex, i) => html`
                        <div key=${i} className="bg-slate-950 rounded-lg p-3 border border-slate-800/60 space-y-1.5">
                          <div className="text-[10px] font-bold text-slate-500">Example ${i+1}</div>
                          <div className="font-mono text-[11px] space-y-1">
                            <div><span class="text-slate-500">Input: </span><span class="text-slate-200">${ex.input}</span></div>
                            <div><span class="text-slate-500">Output: </span><span class="text-emerald-400">${ex.output}</span></div>
                            ${ex.explanation && html`<div className="text-slate-500 text-[10px] italic">// ${ex.explanation}</div>`}
                          </div>
                        </div>
                      `)}
                    </div>
                  `}

                  ${prob.constraints && html`
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Constraints</div>
                      ${prob.constraints.map((c, idx) => html`<div key=${idx} className="text-[11px] text-slate-400 font-mono flex items-start gap-1.5"><span className="text-indigo-500">•</span>${c}</div>`)}
                    </div>
                  `}

                  <!-- Battle Test Cases -->
                  <div className="space-y-2 border-t border-slate-800/60 pt-3">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Test Cases</div>
                    ${(prob.testCases || []).map(tc => html`
                      <div key=${tc.id} className="bg-slate-950 rounded-lg p-2.5 border border-slate-800/60 font-mono text-[10px] space-y-1">
                        <div className="text-slate-500 font-bold">Test ${tc.id} ${tc.hidden ? '🔒' : ''}</div>
                        ${!tc.hidden ? html`
                          <div><span class="text-slate-500">In: </span><span class="text-slate-300">${tc.input}</span></div>
                          <div><span class="text-slate-500">Out: </span><span class="text-emerald-400">${tc.expected}</span></div>
                        ` : html`<div className="text-slate-600 italic">Hidden — runs on final submit</div>`}
                      </div>
                    `)}
                  </div>

                </div>
              </div>

              <!-- Editor Area -->
              <div className="flex-grow flex flex-col min-w-0">
                
                <!-- Editor Toolbar -->
                <div className="bg-slate-900/80 border-b border-slate-800/50 px-3 py-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-[#1e1e1e] border border-slate-700/40 rounded px-2 py-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div>
                      <span className="text-[11px] font-mono text-slate-300">solution.${langMeta.ext}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick=${handleFormat} className="px-2 py-1 hover:bg-slate-800 rounded border border-slate-700/40 text-slate-400 hover:text-slate-200 text-[11px] font-medium flex items-center gap-1 transition">
                      <i data-lucide="align-left" className="w-3 h-3"></i> Format
                    </button>
                    <button onClick=${() => handleReset(initialCode)} className="px-2 py-1 hover:bg-slate-800 rounded border border-slate-700/40 text-slate-400 hover:text-rose-400 text-[11px] font-medium flex items-center gap-1 transition">
                      <i data-lucide="trash-2" className="w-3 h-3"></i> Reset
                    </button>
                  </div>
                </div>

                <!-- Monaco Editor Mount -->
                <div id="battle-editor-mount" className="flex-grow bg-[#1e1e1e] relative min-h-[200px]">
                  <${Editor}
                    height="100%"
                    language=${monacoLangMap[arenaLang] || 'javascript'}
                    theme="vs-dark"
                    value=${initialCode}
                    onMount=${handleEditorDidMount}
                    options=${{
                      minimap: { enabled: false },
                      automaticLayout: true,
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 13,
                      lineNumbers: 'on',
                      cursorBlinking: 'smooth',
                      scrollBeyondLastLine: false,
                      padding: { top: 10 }
                    }}
                  />
                </div>

                <!-- Editor Action Bar -->
                <div className="bg-slate-900/80 border-t border-slate-800/50 px-4 py-2.5 flex justify-between items-center">
                  <div className="text-[11px] text-slate-500 font-mono" id="battle-status-text">Ready to code</div>
                  <div className="flex items-center gap-2">
                    <button onClick=${() => handleRun(prob, visibleTests)} className="px-4 py-1.5 rounded-lg bg-slate-800 border border-slate-700/60 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition active:scale-95">
                      <i data-lucide="play" className="w-3.5 h-3.5 text-emerald-400"></i> Run & Test
                    </button>
                    <button onClick=${handleSubmit} className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-600/20 transition active:scale-95">
                      <i data-lucide="check" className="w-3.5 h-3.5"></i> Submit Solution
                    </button>
                  </div>
                </div>

                <!-- Battle Output Panel -->
                <div id="battle-output-panel" className="bg-[#0b0e14] border-t border-slate-800/60" style="height:160px;overflow-y:auto;">
                  <div className="flex border-b border-slate-800/50">
                    <button onClick=${() => setBattleTab('output')} className=${`px-4 py-2 text-[11px] font-semibold border-b-2 ${battleTab === 'output' ? 'border-rose-500 text-slate-200' : 'border-transparent text-slate-500'} flex items-center gap-1`}>
                      <i data-lucide="terminal" className="w-3 h-3 text-rose-400"></i> Output
                    </button>
                    <button onClick=${() => setBattleTab('tests')} className=${`px-4 py-2 text-[11px] font-semibold border-b-2 ${battleTab === 'tests' ? 'border-rose-500 text-slate-200' : 'border-transparent text-slate-500'} flex items-center gap-1 transition`}>
                      <i data-lucide="list-checks" className="w-3 h-3"></i> Tests
                    </button>
                  </div>

                  ${battleTab === 'output' ? html`
                    <div id="battle-output-view" className="p-3 font-mono text-xs text-slate-400">
                      ${isRunningTests ? html`
                        <div className="flex items-center gap-2 text-indigo-400">
                          <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent animate-spin rounded-full"></div>
                          Running tests...
                        </div>
                      ` : runTestResults ? html`
                        <div className="space-y-1">
                          ${runTestResults.map(tr => html`
                            <div key=${tr.id} className="flex items-center gap-2 py-0.5">
                              <span className=${tr.passed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                ${tr.passed ? '✓' : '✗'}
                              </span>
                              <span>Test ${tr.id}: ${tr.input}</span>
                              <span className="ml-auto text-slate-500">→ ${tr.expected}</span>
                            </div>
                          `)}
                        </div>
                      ` : html`
                        <span className="italic text-slate-500">Click "Run & Test" to execute against sample test cases.</span>
                      `}
                    </div>
                  ` : html`
                    <div id="battle-tests-view" className="p-3 space-y-2">
                      ${visibleTests.map(tc => {
                        const tr = runTestResults?.find(r => r.id === tc.id);
                        return html`
                          <div key=${tc.id} className="flex items-center justify-between bg-slate-900/60 rounded-lg px-3 py-2 border border-slate-800/50">
                            <span className="text-[11px] font-mono text-slate-400">Test ${tc.id}: <span className="text-slate-500">${tc.input}</span></span>
                            <span className=${`text-[10px] font-bold ${tr ? (tr.passed ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-600'}`}>
                              ${tr ? (tr.passed ? '✓ Passed' : '✗ Failed') : '⏳ Pending'}
                            </span>
                          </div>
                        `;
                      })}
                    </div>
                  `}
                </div>

              </div>
            </div>
          </div>

          <!-- RIGHT: Battle Sidebar -->
          <div className="w-full lg:w-[260px] flex-shrink-0 flex flex-col bg-[#080b11] border-t lg:border-t-0 lg:border-l border-slate-900/70 overflow-hidden">
            
            <!-- Progress Cards -->
            <div className="p-4 space-y-3 border-b border-slate-900/60">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Duel Progress</div>
              
              <!-- Player Progress -->
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div class="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-black text-[9px] flex items-center justify-center border border-indigo-500/30">ER</div>
                    <span className="text-[11px] font-bold text-slate-200">You</span>
                  </div>
                  <span id="player-progress-pct" className="text-[11px] font-mono font-bold text-indigo-400">${playerProgress}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-900">
                  <div id="player-progress-bar" className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full shadow-glow-indigo transition-all duration-700" style="width:${playerProgress}%"></div>
                </div>
              </div>

              <!-- Opponent Progress -->
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div class="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 font-black text-[9px] flex items-center justify-center border border-rose-500/30">PK</div>
                    <span className="text-[11px] font-bold text-slate-200">Pranav K.</span>
                  </div>
                  <span id="opponent-progress-pct" className="text-[11px] font-mono font-bold text-rose-400">${opponentProgress}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-900">
                  <div id="opponent-progress-bar" className="bg-gradient-to-r from-rose-500 to-orange-500 h-2 rounded-full transition-all duration-700" style="width:${opponentProgress}%"></div>
                </div>
              </div>
            </div>

            <!-- Battle Activity Log -->
            <div className="flex-grow p-4 overflow-y-auto space-y-2" id="battle-log-container">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Live Activity</div>
              <div id="battle-logs" className="space-y-1.5 font-mono text-[10px] text-slate-400">
                ${logs.map((log, idx) => html`
                  <div key=${idx} className=${colorMap[log.color] || 'text-slate-400'}>
                    [${log.time}] ${log.text}
                  </div>
                `)}
                <div ref=${logsEndRef} />
              </div>
            </div>

            <!-- Forfeit Button -->
            <div className="p-4 border-t border-slate-900/60">
              <button onClick=${handleForfeit} className="w-full py-2 bg-slate-900 border border-slate-800 hover:bg-rose-950/20 hover:border-rose-900/50 text-slate-500 hover:text-rose-400 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5">
                <i data-lucide="flag" className="w-3.5 h-3.5"></i> Forfeit Match
              </button>
            </div>

          </div>
        </div>
      </div>
    `;
  }

  // LOBBY VIEW
  const arenaLang = state.arenaLanguage || 'javascript';
  const topThree = (state.leaderboard || []).slice(0, 5);

  return html`
    <div className="flex-grow overflow-y-auto p-6 max-w-5xl mx-auto w-full space-y-6">

      <!-- Hero Banner -->
      <div className="relative rounded-3xl overflow-hidden border border-indigo-500/20 bg-gradient-to-br from-indigo-950/80 via-[#0b0e14] to-rose-950/40 p-8">
        <!-- Background glow orbs -->
        <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full bg-rose-600/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <!-- Icon -->
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-rose-500 flex items-center justify-center shadow-2xl shadow-indigo-500/30 flex-shrink-0">
            <i data-lucide="swords" className="w-10 h-10 text-white"></i>
          </div>

          <div className="flex-grow text-center md:text-left">
            <h1 class="text-3xl font-black text-white tracking-tight">Coding Battle Arena</h1>
            <p className="text-slate-400 text-sm mt-1 max-w-lg">Compete in real-time 1v1 coding duels. Solve algorithmic problems faster than your opponent to earn Arena Points.</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <i data-lucide="clock" className="w-3.5 h-3.5 text-indigo-400"></i> 10 min per match
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <i data-lucide="code-2" className="w-3.5 h-3.5 text-emerald-400"></i> 10 languages
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <i data-lucide="zap" className="w-3.5 h-3.5 text-amber-400"></i> Live AI proctored
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        <!-- Match Setup -->
        <div className="md:col-span-2 bg-slate-900/60 rounded-2xl border border-slate-800/60 p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <i data-lucide="settings-2" className="w-4 h-4 text-indigo-400"></i> Match Setup
          </h3>

          <!-- Language Selector -->
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Your Language</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2" id="arena-lang-grid">
              ${BATTLE_LANGUAGES.map(lang => html`
                <button 
                  key=${lang.id}
                  onClick=${() => handleLangSelect(lang.id)}
                  className=${`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition text-center ${arenaLang === lang.id
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                    : 'border-slate-800 hover:border-slate-600 bg-slate-900/40 text-slate-400 hover:text-slate-200'}`}
                >
                  <div className="w-3 h-3 rounded-full" style="background:${lang.color}"></div>
                  <span className="text-[10px] font-bold">${lang.label}</span>
                </button>
              `)}
            </div>
          </div>

          <!-- Match Type -->
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Match Type</label>
            <div className="flex gap-2">
              <button className="match-type-btn flex-1 py-2 rounded-xl border border-indigo-500 bg-indigo-500/10 text-indigo-300 text-xs font-bold">
                <i data-lucide="trophy" className="w-3.5 h-3.5 inline mr-1"></i> Ranked
              </button>
              <button className="match-type-btn flex-1 py-2 rounded-xl border border-slate-800 hover:border-slate-600 text-slate-400 text-xs font-bold transition">
                <i data-lucide="gamepad-2" className="w-3.5 h-3.5 inline mr-1"></i> Casual
              </button>
            </div>
          </div>

          <!-- Matchmake Button -->
          <button 
            disabled=${isSearching}
            onClick=${handleMatchmake}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-sm rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            ${isSearching ? html`
              <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
              <span>Searching for opponent...</span>
            ` : html`
              <i data-lucide="swords" className="w-4 h-4"></i>
              <span>Find Match Now</span>
            `}
          </button>

          <!-- Stats Row -->
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-800/60">
            <div className="text-center">
              <div className="text-lg font-black text-indigo-400">8</div>
              <div className="text-[10px] text-slate-500">Wins</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-black text-rose-400">3</div>
              <div className="text-[10px] text-slate-500">Losses</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-black text-amber-400">915</div>
              <div className="text-[10px] text-slate-500">Arena Points</div>
            </div>
          </div>
        </div>

        <!-- Leaderboard Side Panel -->
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800/60 p-4 space-y-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
            <i data-lucide="trophy" className="w-3.5 h-3.5 text-amber-400"></i> Top Arena Players
          </h3>
          <div className="space-y-2">
            ${topThree.map((p, idx) => html`
              <div key=${idx} className=${`flex items-center gap-2.5 p-2 rounded-xl ${idx === 0 ? 'bg-amber-500/10 border border-amber-500/20' : idx === 1 ? 'bg-slate-800/50' : 'bg-slate-900/40'}`}>
                <div className=${`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 ${idx === 0 ? 'bg-amber-400 text-amber-900' : idx === 1 ? 'bg-slate-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                  ${idx+1}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="text-xs font-bold text-slate-200 truncate">${p.name}</div>
                  <div className="text-[10px] text-slate-500">${p.lang}</div>
                </div>
                <div className="font-mono text-xs font-bold text-indigo-400">${p.score}</div>
              </div>
            `)}
          </div>
          
          <!-- Active Players -->
          <div className="border-t border-slate-800/60 pt-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span><strong class="text-emerald-400">42 players</strong> searching for matches</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Recent Battles -->
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800/60 p-4 space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <i data-lucide="history" className="w-3.5 h-3.5 text-slate-400"></i> Recent Battles
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-400">
            <thead>
              <tr className="border-b border-slate-800/60">
                <th className="text-left py-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">Problem</th>
                <th className="text-left py-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">Opponent</th>
                <th className="text-left py-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">Language</th>
                <th className="text-left py-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">Result</th>
                <th className="text-left py-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">AP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              ${[
                { id: 1, prob: 'Two Sum', opp: 'Pranav K.', lang: 'JavaScript', result: 'WIN', ap: '+30', color: 'text-emerald-400' },
                { id: 2, prob: 'Reverse String', opp: 'Aisha B.', lang: 'Python', result: 'WIN', ap: '+25', color: 'text-emerald-400' },
                { id: 3, prob: 'FizzBuzz', opp: 'Devendra N.', lang: 'C++', result: 'LOSS', ap: '-15', color: 'text-rose-400' },
              ].map(b => html`
                <tr key=${b.id} className="hover:bg-slate-800/20 transition">
                  <td className="py-2 font-semibold text-slate-300">${b.prob}</td>
                  <td className="py-2">${b.opp}</td>
                  <td className="py-2 font-mono">${b.lang}</td>
                  <td className="py-2"><span className=${`px-2 py-0.5 rounded-full text-[10px] font-bold ${b.result === 'WIN' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'}`}>${b.result}</span></td>
                  <td className=${`py-2 font-mono font-bold ${b.color}`}>${b.ap}</td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
}
