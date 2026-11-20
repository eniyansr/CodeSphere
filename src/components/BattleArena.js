// CodeSphere Pro — 3D Tactile Coding Battle Arena & Live 1v1 Duel Rooms (React Edition)
import React, { useState, useEffect, useRef } from 'https://esm.sh/react@18.2.0';
import Editor from 'https://esm.sh/@monaco-editor/react@4.6.0?deps=react@18.2.0,react-dom@18.2.0';
import { html, useAppState, TRANSLATIONS } from '../state.js';

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function BattleArena() {
  const { state, updateState } = useAppState();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.en;

  // Arena Modes: 'lobby' | 'searching' | 'match' | 'result'
  const [arenaMode, setArenaMode] = useState('lobby'); // 'lobby' | 'match'
  const [selectedSubMode, setSelectedSubMode] = useState('duel'); // 'duel' | 'bughunt' | 'blitz' | 'class'
  const [isSearching, setIsSearching] = useState(false);
  const [searchStep, setSearchStep] = useState('');

  // Match State
  const [matchSeconds, setMatchSeconds] = useState(600); // 10 minutes
  const [playerTestsPassed, setPlayerTestsPassed] = useState(0);
  const [opponentTestsPassed, setOpponentTestsPassed] = useState(0);
  const totalTestCases = 5;

  const [playerStatus, setPlayerStatus] = useState('Coding...');
  const [opponentStatus, setOpponentStatus] = useState('Reading problem...');
  const [matchLogs, setMatchLogs] = useState([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [matchResult, setMatchResult] = useState(null); // { outcome: 'win'|'loss'|'draw', apChange: 18, timeTaken: '2m 14s' }

  // Opponent Details
  const [opponent, setOpponent] = useState({
    name: 'Elena Rostova',
    handle: '@elena_code',
    rank: 'Gold I',
    rating: 940,
    avatar: 'ER',
    avatarBg: '#E11D48'
  });

  // Current Problem
  const problem = {
    title: 'Two Sum (Optimal Target Search)',
    difficulty: 'Medium',
    category: 'Hash Tables · Dynamic Arrays',
    description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. Each input has exactly one valid solution, and you may not use the same element twice. Aim for O(n) linear runtime.',
    examples: [
      { input: 'nums = [2, 7, 11, 15], target = 9', output: '[0, 1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
      { input: 'nums = [3, 2, 4], target = 6', output: '[1, 2]', explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].' },
      { input: 'nums = [3, 3], target = 6', output: '[0, 1]', explanation: 'nums[0] + nums[1] == 6.' }
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.'
    ],
    starterCode: `function twoSum(nums, target) {
  // Write your optimal O(n) solution here
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }
    seen.set(nums[i], i);
  }
  return [];
}`
  };

  const [editorCode, setEditorCode] = useState(problem.starterCode);
  const editorRef = useRef(null);

  // ─── Start Match Search ──────────────────────────────────────────────────────
  const handleFindMatch = (mode = 'duel') => {
    setSelectedSubMode(mode);
    setIsSearching(true);
    setSearchStep('Connecting to regional matchmaking queue...');

    setTimeout(() => {
      setSearchStep('Found matching candidate in Gold II division...');
    }, 1200);

    setTimeout(() => {
      setSearchStep('Initializing Zero-Knowledge proctoring sandbox...');
    }, 2400);

    setTimeout(() => {
      setIsSearching(false);
      setArenaMode('match');
      setMatchSeconds(600);
      setPlayerTestsPassed(0);
      setOpponentTestsPassed(0);
      setPlayerStatus('Coding...');
      setOpponentStatus('Analyzing specifications...');
      setTestResults(null);
      setMatchResult(null);
      setMatchLogs([
        { time: '10:00', text: 'Match started! 1v1 Ranked Duel against Elena Rostova (@elena_code).' },
        { time: '10:00', text: 'Fair play active: Anti-cheat lockdown shield enabled.' }
      ]);
    }, 3400);
  };

  // ─── Match Timer & Simulated Opponent AI ─────────────────────────────────────
  useEffect(() => {
    if (arenaMode !== 'match' || matchResult) return;

    const timer = setInterval(() => {
      setMatchSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          concludeMatch('draw');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [arenaMode, matchResult]);

  // Simulated live opponent behaviour
  useEffect(() => {
    if (arenaMode !== 'match' || matchResult) return;

    const opponentInterval = setInterval(() => {
      setOpponentTestsPassed(prev => {
        if (prev >= totalTestCases) return prev;
        // 35% chance to advance a test case
        if (Math.random() < 0.35) {
          const nextVal = prev + 1;
          setOpponentStatus(`${nextVal}/${totalTestCases} passed`);
          setMatchLogs(l => [
            { time: formatTime(matchSeconds), text: `Elena passed test case #${nextVal} (${nextVal}/${totalTestCases})!` },
            ...l
          ]);
          if (nextVal >= totalTestCases) {
            concludeMatch('loss');
          }
          return nextVal;
        } else {
          const states = ['Typing algorithm...', 'Refactoring loop...', 'Running local tests...'];
          setOpponentStatus(states[Math.floor(Math.random() * states.length)]);
          return prev;
        }
      });
    }, 7000);

    return () => clearInterval(opponentInterval);
  }, [arenaMode, matchResult, matchSeconds]);

  // ─── Run Test Cases ──────────────────────────────────────────────────────────
  const handleRunTests = () => {
    setIsRunningTests(true);
    setPlayerStatus('Running test suite...');

    setTimeout(() => {
      setIsRunningTests(false);
      const passed = Math.min(totalTestCases, playerTestsPassed + 2);
      setPlayerTestsPassed(passed);
      setPlayerStatus(`${passed}/${totalTestCases} passed`);

      setTestResults({
        total: totalTestCases,
        passed,
        cases: [
          { name: 'Example 1: [2,7,11,15], target=9', status: 'pass', time: '12ms' },
          { name: 'Example 2: [3,2,4], target=6', status: 'pass', time: '9ms' },
          { name: 'Example 3: [3,3], target=6', status: passed >= 3 ? 'pass' : 'fail', time: '11ms' },
          { name: 'Hidden 4: Large array (10,000 items)', status: passed >= 4 ? 'pass' : 'fail', time: '22ms' },
          { name: 'Hidden 5: Negative integers target', status: passed >= 5 ? 'pass' : 'fail', time: '14ms' }
        ]
      });

      setMatchLogs(l => [
        { time: formatTime(matchSeconds), text: `You ran tests: ${passed}/${totalTestCases} passed!` },
        ...l
      ]);

      if (passed >= totalTestCases) {
        concludeMatch('win');
      }
    }, 1200);
  };

  // ─── Conclude Match ──────────────────────────────────────────────────────────
  const concludeMatch = (outcome) => {
    const elapsed = 600 - matchSeconds;
    const timeTaken = `${Math.floor(elapsed / 60)}m ${(elapsed % 60).toString().padStart(2, '0')}s`;
    const apChange = outcome === 'win' ? 18 : outcome === 'loss' ? -12 : 2;

    setMatchResult({
      outcome,
      apChange,
      timeTaken,
      playerPassed: playerTestsPassed,
      opponentPassed: opponentTestsPassed
    });

    // Update global rating in state if won
    if (outcome === 'win') {
      const currentAP = state.arenaPoints || 915;
      updateState({ arenaPoints: currentAP + apChange });
    }
  };

  // Calculate Tug-of-War percentage (50% = center)
  // Each player test pushes by +10%, opponent pushes by -10%
  const tugOfWarBalance = Math.min(95, Math.max(5, 50 + (playerTestsPassed - opponentTestsPassed) * 10));

  // ─── RENDER: Match View ──────────────────────────────────────────────────────
  if (arenaMode === 'match') {
    return html`
      <div className="flex-grow flex flex-col min-h-0 bg-[#F4F7FE] p-3 md:p-5 overflow-hidden">
        
        <!-- Live Match Header & Tug-of-War Bar -->
        <div className="bg-white rounded-2xl border border-[#D5DEF2] p-4 mb-3 flex flex-col gap-3"
             style=${{ boxShadow: '0 4px 0 #D5DEF2, 0 12px 20px -8px rgba(22,33,62,0.1)' }}>
          
          <!-- Top Stats Bar -->
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-mono font-bold text-[#16213E] uppercase tracking-wider">
                Ranked Duel 1v1 · ${selectedSubMode.toUpperCase()}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                🔒 Fair Play Anti-Cheat Shield Active
              </span>
            </div>

            <!-- Timer -->
            <div className="flex items-center gap-2">
              <div className="px-3.5 py-1.5 rounded-xl font-mono font-black text-sm text-white"
                   style=${{
                     background: matchSeconds < 120 ? '#E11D48' : '#4F46E5',
                     boxShadow: '0 2px 0 rgba(0,0,0,0.2)'
                   }}>
                ⏱ ${formatTime(matchSeconds)}
              </div>
              <button
                onClick=${() => { if (confirm('Surrender this duel? This will count as a loss (-12 AP).')) concludeMatch('loss'); }}
                className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
              >
                Surrender
              </button>
            </div>
          </div>

          <!-- Tug-of-War Esports Bar -->
          <div className="bg-[#EEF3FD] rounded-xl p-3 border border-[#D5DEF2]">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              
              <!-- Player Card (Left) -->
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-sm">
                  ${(state.googleUser?.name || 'You').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-[#16213E] font-extrabold flex items-center gap-1.5">
                    <span>${state.googleUser?.name || 'You'}</span>
                    <span className="text-[10px] font-mono text-indigo-600">(${state.arenaPoints || 915} AP)</span>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-600 font-bold">${playerStatus}</div>
                </div>
              </div>

              <!-- Tug-of-War Score Indicator -->
              <div className="text-center font-mono">
                <span className="text-xs font-extrabold text-[#16213E]">
                  ${playerTestsPassed} <span className="text-[#566180]">vs</span> ${opponentTestsPassed}
                </span>
                <div className="text-[10px] font-bold text-[#566180]">
                  ${playerTestsPassed > opponentTestsPassed
                    ? `+${playerTestsPassed - opponentTestsPassed} Ahead`
                    : playerTestsPassed < opponentTestsPassed
                    ? `Opponent +${opponentTestsPassed - playerTestsPassed} Ahead`
                    : 'Tied 50/50'}
                </div>
              </div>

              <!-- Opponent Card (Right) -->
              <div className="flex items-center gap-2.5 text-right">
                <div>
                  <div className="text-[#16213E] font-extrabold flex items-center gap-1.5 justify-end">
                    <span className="text-[10px] font-mono text-rose-600">(${opponent.rating} AP)</span>
                    <span>${opponent.name}</span>
                  </div>
                  <div className="text-[11px] font-mono text-rose-600 font-bold">${opponentStatus}</div>
                </div>
                <div className="w-8 h-8 rounded-lg text-white font-mono font-bold text-xs flex items-center justify-center shadow-sm"
                     style=${{ background: opponent.avatarBg }}>
                  ${opponent.avatar}
                </div>
              </div>
            </div>

            <!-- The Physical Tug-of-War Bar -->
            <div className="h-3.5 w-full bg-white rounded-full overflow-hidden p-0.5 border border-[#CBD5EE] relative shadow-inner">
              <!-- Center Marker -->
              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-[#16213E] z-10 opacity-30"></div>
              
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style=${{
                  width: `${tugOfWarBalance}%`,
                  background: 'linear-gradient(90deg, #4F46E5 0%, #0E9F9A 100%)',
                  boxShadow: '0 0 10px rgba(79,70,229,0.5)'
                }}
              ></div>
            </div>
          </div>

        </div>

        <!-- Main Duel Workspace Grid -->
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
          
          <!-- Left: Problem Description & Live Activity Log -->
          <div className="lg:col-span-4 flex flex-col gap-3 min-h-0">
            
            <!-- Problem Description Card -->
            <div className="flex-grow bg-white rounded-2xl border border-[#D5DEF2] p-4 overflow-y-auto"
                 style=${{ boxShadow: '0 1px 0 #fff inset, 0 6px 0 -2px #CBD5EE' }}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  ${problem.difficulty}
                </span>
                <span className="text-[10px] font-mono text-[#566180] font-semibold">${problem.category}</span>
              </div>

              <h3 className="text-sm font-extrabold text-[#16213E] mb-2">${problem.title}</h3>
              <p className="text-xs text-[#566180] leading-relaxed mb-3">${problem.description}</p>

              <div className="space-y-2 mb-3">
                <div className="text-xs font-bold text-[#16213E]">Examples:</div>
                ${problem.examples.map((ex, i) => html`
                  <div key=${i} className="bg-[#F0F4FD] p-2 rounded-xl border border-[#D5DEF2] text-[11px] font-mono">
                    <div><strong className="text-[#16213E]">Input:</strong> ${ex.input}</div>
                    <div><strong className="text-[#16213E]">Output:</strong> ${ex.output}</div>
                  </div>
                `)}
              </div>

              <div className="space-y-1">
                <div className="text-xs font-bold text-[#16213E]">Constraints:</div>
                <ul className="list-disc pl-4 text-[11px] font-mono text-[#566180] space-y-0.5">
                  ${problem.constraints.map((c, i) => html`<li key=${i}>${c}</li>`)}
                </ul>
              </div>
            </div>

            <!-- Live Match Feed Logs -->
            <div className="h-36 bg-white rounded-2xl border border-[#D5DEF2] p-3 overflow-y-auto font-mono text-xs text-[#566180] space-y-1 flex-shrink-0"
                 style=${{ boxShadow: '0 3px 0 #D5DEF2' }}>
              <div className="text-[10px] font-bold text-[#16213E] uppercase tracking-wide pb-1 border-b border-[#D5DEF2]">
                Duel Activity Feed
              </div>
              ${matchLogs.map((log, idx) => html`
                <div key=${idx} className="text-[11px] leading-tight">
                  <span className="text-indigo-600 font-bold">[${log.time}]</span> ${log.text}
                </div>
              `)}
            </div>

          </div>

          <!-- Right: Monaco Code Editor + Test Console -->
          <div className="lg:col-span-8 flex flex-col min-h-0 gap-3">
            
            <!-- Code Editor Box -->
            <div className="flex-grow bg-white rounded-2xl border border-[#D5DEF2] overflow-hidden flex flex-col min-h-[340px]"
                 style=${{ boxShadow: '0 1px 0 #fff inset, 0 8px 0 -2px #CBD5EE, 0 20px 28px -14px rgba(22,33,62,0.15)' }}>
              
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#D5DEF2] bg-[#F8FAFD] text-xs font-bold text-[#566180]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  <span>solution.js</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-600 font-bold">JavaScript (V8 Sandbox)</span>
              </div>

              <div className="flex-grow w-full h-full">
                <${Editor}
                  height="100%"
                  language="javascript"
                  theme="vs"
                  value=${editorCode}
                  onChange=${val => setEditorCode(val)}
                  onMount=${ed => { editorRef.current = ed; }}
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

            <!-- Test Cases Evaluation & Action Row -->
            <div className="bg-white rounded-2xl border border-[#D5DEF2] p-3 flex flex-wrap items-center justify-between gap-3"
                 style=${{ boxShadow: '0 3px 0 #D5DEF2' }}>
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#16213E]">Test Cases:</span>
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
                  ${[1, 2, 3, 4, 5].map(num => html`
                    <span
                      key=${num}
                      className=${`px-2 py-0.5 rounded-lg border text-[11px] ${
                        num <= playerTestsPassed
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}
                    >
                      #${num} ${num <= playerTestsPassed ? '✓' : '—'}
                    </span>
                  `)}
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick=${handleRunTests}
                  disabled=${isRunningTests}
                  className="chip text-xs font-bold px-4 py-2 flex items-center gap-1.5"
                >
                  <i data-lucide="play" className="w-3.5 h-3.5"></i>
                  <span>${isRunningTests ? 'Evaluating...' : 'Run Test Cases'}</span>
                </button>

                <button
                  onClick=${() => {
                    if (playerTestsPassed >= totalTestCases) {
                      concludeMatch('win');
                    } else {
                      handleRunTests();
                    }
                  }}
                  disabled=${isRunningTests}
                  className="btn teal text-xs px-5 py-2 flex items-center gap-1.5"
                  style=${{ width: 'auto' }}
                >
                  <i data-lucide="check-circle" className="w-3.5 h-3.5"></i>
                  <span>Submit Solution</span>
                </button>
              </div>

            </div>

          </div>

        </div>

        <!-- End of Match Result Card Overlay -->
        ${matchResult && html`
          <div className="fixed inset-0 bg-[#16213E]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border-2 border-[#D5DEF2] p-6 max-w-md w-full text-center animate-in zoom-in-95 duration-200"
                 style=${{ boxShadow: '0 20px 40px -10px rgba(22,33,62,0.35)' }}>
              
              <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-4 shadow-lg"
                   style=${{
                     background: matchResult.outcome === 'win'
                       ? 'linear-gradient(145deg, #10B981, #059669)'
                       : matchResult.outcome === 'loss'
                       ? 'linear-gradient(145deg, #F43F5E, #E11D48)'
                       : 'linear-gradient(145deg, #F59E0B, #D97706)'
                   }}>
                ${matchResult.outcome === 'win' ? '🏆' : matchResult.outcome === 'loss' ? '💀' : '🤝'}
              </div>

              <h3 className="text-2xl font-black text-[#16213E] mb-1">
                ${matchResult.outcome === 'win' ? 'VICTORY!' : matchResult.outcome === 'loss' ? 'DEFEAT' : 'DRAW MATCH'}
              </h3>
              <p className="text-xs font-semibold text-[#566180] mb-5">
                ${matchResult.outcome === 'win'
                  ? 'All test cases verified! You defeated your opponent in the speed race.'
                  : matchResult.outcome === 'loss'
                  ? 'Your opponent passed all test cases first. Keep practicing!'
                  : 'Time expired before all test cases could be verified.'}
              </p>

              <!-- Rating Change Badge -->
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl mb-6 font-mono font-black text-sm"
                   style=${{
                     background: matchResult.apChange > 0 ? '#D1FAE5' : '#FFE4E6',
                     color: matchResult.apChange > 0 ? '#065F46' : '#9F1239',
                     border: `1px solid ${matchResult.apChange > 0 ? '#A7F3D0' : '#FECDD3'}`
                   }}>
                <span>Rating: ${matchResult.apChange > 0 ? `+${matchResult.apChange} AP` : `${matchResult.apChange} AP`}</span>
                <span>· New Total: ${(state.arenaPoints || 915) + matchResult.apChange} AP</span>
              </div>

              <!-- Match Stats Comparison -->
              <div className="grid grid-cols-2 gap-3 mb-6 text-xs font-mono">
                <div className="bg-[#F0F4FD] p-3 rounded-xl border border-[#D5DEF2] text-left">
                  <div className="text-[10px] uppercase text-[#566180] font-bold">Your Time</div>
                  <div className="text-sm font-extrabold text-[#16213E] mt-0.5">${matchResult.timeTaken}</div>
                  <div className="text-[11px] text-emerald-600 font-bold">${playerTestsPassed}/${totalTestCases} Tests</div>
                </div>
                <div className="bg-[#F0F4FD] p-3 rounded-xl border border-[#D5DEF2] text-left">
                  <div className="text-[10px] uppercase text-[#566180] font-bold">Opponent</div>
                  <div className="text-sm font-extrabold text-[#16213E] mt-0.5">${opponent.name}</div>
                  <div className="text-[11px] text-rose-600 font-bold">${opponentTestsPassed}/${totalTestCases} Tests</div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div className="flex gap-3">
                <button
                  onClick=${() => handleFindMatch(selectedSubMode)}
                  className="btn flex-1 text-xs py-3 flex items-center justify-center gap-1.5"
                >
                  <i data-lucide="zap" className="w-4 h-4"></i>
                  <span>Rematch / Next</span>
                </button>
                <button
                  onClick=${() => setArenaMode('lobby')}
                  className="chip flex-1 text-xs py-3 font-bold text-[#16213E]"
                >
                  Return to Lobby
                </button>
              </div>

            </div>
          </div>
        `}

      </div>
    `;
  }

  // ─── RENDER: Arena Lobby View ────────────────────────────────────────────────
  return html`
    <div className="flex-grow p-4 md:p-8 bg-[#F4F7FE] overflow-y-auto">
      
      <!-- Top Title & Rating Banner -->
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              SEASON 4 ARENA
            </span>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              14 Duels Live Now
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#16213E] tracking-tight">Coding Battle Arena</h2>
          <p className="text-xs md:text-sm font-semibold text-[#566180] mt-0.5">
            Real-time 1v1 speed duels with interactive Tug-of-War race tracking and ELO progression
          </p>
        </div>

        <!-- Rating Card Banner -->
        <div className="bg-white rounded-2xl border border-[#D5DEF2] p-4 flex items-center gap-4 shadow-sm"
             style=${{ boxShadow: '0 4px 0 #D5DEF2' }}>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black text-lg flex items-center justify-center shadow-md">
            ⚡
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-[#566180]">Your Arena Rank</div>
            <div className="text-base font-black text-[#16213E]">
              ${state.arenaPoints || 915} AP <span className="text-xs font-bold text-amber-600">· Gold II</span>
            </div>
            <div className="text-[10px] text-emerald-600 font-bold">Top 5% Global · Division I</div>
          </div>
          <button
            onClick=${() => handleFindMatch('duel')}
            disabled=${isSearching}
            className="btn text-xs px-5 py-2.5 ml-2"
            style=${{ width: 'auto' }}
          >
            ${isSearching ? 'Searching...' : 'Find Match'}
          </button>
        </div>
      </div>

      <!-- Mode Cards Grid (3D tactile styling) -->
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        <!-- 1. Quick Duel (1v1) -->
        <div className="bg-white rounded-2xl border border-[#D5DEF2] p-5 flex flex-col justify-between transition-all hover:-translate-y-1"
             style=${{ boxShadow: '0 1px 0 #fff inset, 0 6px 0 -2px #CBD5EE, 0 16px 24px -12px rgba(22,33,62,0.12)' }}>
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl mb-3 border border-indigo-100">
              ⚔️
            </div>
            <h3 className="text-base font-extrabold text-[#16213E] mb-1">Quick Duel (1v1)</h3>
            <p className="text-xs text-[#566180] leading-relaxed mb-4">
              Ranked speed race with live Tug-of-War progress bar and fair play proctoring shield.
            </p>
          </div>
          <button
            onClick=${() => handleFindMatch('duel')}
            disabled=${isSearching}
            className="btn text-xs py-2.5"
          >
            Start Ranked Duel
          </button>
        </div>

        <!-- 2. Bug Hunt -->
        <div className="bg-white rounded-2xl border border-[#D5DEF2] p-5 flex flex-col justify-between transition-all hover:-translate-y-1"
             style=${{ boxShadow: '0 1px 0 #fff inset, 0 6px 0 -2px #CBD5EE, 0 16px 24px -12px rgba(22,33,62,0.12)' }}>
          <div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl mb-3 border border-rose-100">
              🐛
            </div>
            <h3 className="text-base font-extrabold text-[#16213E] mb-1">Bug Hunt</h3>
            <p className="text-xs text-[#566180] leading-relaxed mb-4">
              Both players receive the same broken program. The first to find and fix all bugs wins!
            </p>
          </div>
          <button
            onClick=${() => handleFindMatch('bughunt')}
            disabled=${isSearching}
            className="chip font-bold text-xs py-2.5 text-[#16213E] border-[#CBD5EE]"
          >
            Hunt Bugs
          </button>
        </div>

        <!-- 3. Blitz 3x3 -->
        <div className="bg-white rounded-2xl border border-[#D5DEF2] p-5 flex flex-col justify-between transition-all hover:-translate-y-1"
             style=${{ boxShadow: '0 1px 0 #fff inset, 0 6px 0 -2px #CBD5EE, 0 16px 24px -12px rgba(22,33,62,0.12)' }}>
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl mb-3 border border-amber-100">
              ⚡
            </div>
            <h3 className="text-base font-extrabold text-[#16213E] mb-1">Blitz 3x3</h3>
            <p className="text-xs text-[#566180] leading-relaxed mb-4">
              Three mini algorithmic puzzles in 10 minutes. Highest cumulative points takes the win.
            </p>
          </div>
          <button
            onClick=${() => handleFindMatch('blitz')}
            disabled=${isSearching}
            className="chip font-bold text-xs py-2.5 text-[#16213E] border-[#CBD5EE]"
          >
            Play Blitz
          </button>
        </div>

        <!-- 4. Class vs Class -->
        <div className="bg-white rounded-2xl border border-[#D5DEF2] p-5 flex flex-col justify-between transition-all hover:-translate-y-1"
             style=${{ boxShadow: '0 1px 0 #fff inset, 0 6px 0 -2px #CBD5EE, 0 16px 24px -12px rgba(22,33,62,0.12)' }}>
          <div>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-xl mb-3 border border-teal-100">
              🏫
            </div>
            <h3 className="text-base font-extrabold text-[#16213E] mb-1">Class vs Class</h3>
            <p className="text-xs text-[#566180] leading-relaxed mb-4">
              Team competition. Every problem you solve adds points to your classroom leaderboard.
            </p>
          </div>
          <button
            onClick=${() => handleFindMatch('class')}
            disabled=${isSearching}
            className="chip font-bold text-xs py-2.5 text-[#16213E] border-[#CBD5EE]"
          >
            Join Team Battle
          </button>
        </div>

      </div>

      <!-- Match Searching Overlay / Banner -->
      ${isSearching && html`
        <div className="bg-white rounded-3xl border-2 border-indigo-300 p-8 mb-8 text-center animate-pulse"
             style=${{ boxShadow: '0 10px 25px -5px rgba(79,70,229,0.2)' }}>
          <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-black text-[#16213E] mb-1">Searching Ranked Matchmaking Queue...</h3>
          <p className="text-xs font-mono font-bold text-indigo-600">${searchStep}</p>
        </div>
      `}

      <!-- Bottom Split: Daily Duel & Leaderboard -->
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- Left: Daily Duel & Habit Card -->
        <div className="lg:col-span-6 bg-white rounded-3xl border border-[#D5DEF2] p-6 flex flex-col justify-between"
             style=${{ boxShadow: '0 1px 0 #fff inset, 0 8px 0 -2px #CBD5EE' }}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                DAILY DUEL CHALLENGE
              </span>
              <span className="text-xs font-bold text-[#566180]">Streak: 🔥 5 Days</span>
            </div>

            <h3 className="text-lg font-extrabold text-[#16213E] mb-2">Longest Substring Without Repeating Characters</h3>
            <p className="text-xs text-[#566180] leading-relaxed mb-4">
              Solve today's curated algorithmic challenge to earn +25 bonus AP and unlock the Season 4 Speedster certificate badge.
            </p>

            <div className="flex items-center gap-4 text-xs font-mono text-[#566180] mb-4">
              <span>Difficulty: <strong className="text-amber-600">Medium</strong></span>
              <span>Reward: <strong className="text-emerald-600">+25 AP</strong></span>
              <span>Resets in: <strong>4h 22m</strong></span>
            </div>
          </div>

          <button
            onClick=${() => handleFindMatch('duel')}
            className="btn teal text-xs py-3"
          >
            Launch Daily Duel Challenge
          </button>
        </div>

        <!-- Right: Weekly Top Players Leaderboard -->
        <div className="lg:col-span-6 bg-white rounded-3xl border border-[#D5DEF2] p-6"
             style=${{ boxShadow: '0 1px 0 #fff inset, 0 8px 0 -2px #CBD5EE' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-[#16213E] uppercase tracking-wider">Top Competitors This Week</h3>
            <span className="text-[11px] font-mono text-indigo-600 font-bold">Season 4 Leaderboard</span>
          </div>

          <div className="space-y-2.5">
            ${[
              { rank: 1, name: 'Pranav Kumar', rating: '980 AP', league: 'Diamond I', winrate: '94%', color: '#6366F1' },
              { rank: 2, name: 'Eniyan Rajesh (You)', rating: `${state.arenaPoints || 915} AP`, league: 'Gold II', winrate: '89%', color: '#0E9F9A' },
              { rank: 3, name: 'Elena Rostova', rating: '940 AP', league: 'Gold I', winrate: '88%', color: '#E11D48' },
              { rank: 4, name: 'Aisha Begum', rating: '870 AP', league: 'Gold III', winrate: '85%', color: '#8B5CF6' },
              { rank: 5, name: 'Sharath Chandra', rating: '790 AP', league: 'Silver I', winrate: '80%', color: '#F59E0B' }
            ].map(user => html`
              <div key=${user.rank} className="flex items-center justify-between p-2.5 rounded-xl bg-[#F0F4FD] border border-[#D5DEF2] text-xs font-mono">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-xs text-[#566180] w-4">#${user.rank}</span>
                  <span className="font-extrabold text-[#16213E]">${user.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-amber-700">${user.league}</span>
                  <span className="font-extrabold text-indigo-700">${user.rating}</span>
                  <span className="text-emerald-700 font-semibold">${user.winrate}</span>
                </div>
              </div>
            `)}
          </div>
        </div>

      </div>

    </div>
  `;
}
