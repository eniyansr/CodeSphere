// CodeSphere Pro - 3D Tactile Coding Battle Arena (React Edition)
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
  const battleStatus = state.battleStatus || 'idle';

  const [isSearching, setIsSearching] = useState(false);
  const [battleTab, setBattleTab] = useState('output');
  const [logs, setLogs] = useState([]);
  const [runTestResults, setRunTestResults] = useState(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const activeProblem = (state.battleProblems && state.battleProblems[state.activeBattleProblem || 0]) || {
    title: "Two Sum",
    difficulty: "Easy",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    testCases: [{ id: 1 }, { id: 2 }, { id: 3 }]
  };

  const editorRef = useRef(null);

  const startMatch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      updateState({
        battleStatus: 'fighting',
        battleTimerSeconds: 600,
        battlePlayerProgress: 0,
        battleOpponentProgress: 0
      });
      setLogs([
        { text: 'Match found! Opponent: Elena Rostova (Grandmaster)', time: '10:00' },
        { text: 'Problem loaded: Two Sum. Good luck!', time: '10:00' }
      ]);
    }, 1800);
  };

  const handleRunTests = () => {
    setIsRunningTests(true);
    setTimeout(() => {
      setIsRunningTests(false);
      setRunTestResults({ passed: 3, total: 3 });
      updateState({ battlePlayerProgress: 100 });
      setLogs(prev => [
        ...prev,
        { text: 'All 3/3 test cases passed successfully!', time: formatTime(state.battleTimerSeconds || 500) }
      ]);
    }, 1200);
  };

  const handleSubmit = () => {
    if (confirm('🏆 VICTORY!\n\nAll test cases verified. You solved the challenge first!\n+35 Arena Points Earned.\n\nReturn to Arena Lobby?')) {
      updateState({
        battleStatus: 'idle',
        battlePlayerProgress: 0,
        battleOpponentProgress: 0
      });
    }
  };

  // Timer tick
  useEffect(() => {
    if (state.battleStatus !== 'fighting') return;

    const interval = setInterval(() => {
      const remaining = (state.battleTimerSeconds || 600) - 1;
      if (remaining <= 0) {
        clearInterval(interval);
        alert('Match ended in a draw.');
        updateState({ battleStatus: 'idle' });
      } else {
        updateState({ battleTimerSeconds: remaining });
        // Simulate opponent typing & progress
        if (remaining % 15 === 0 && (state.battleOpponentProgress || 0) < 80) {
          updateState({ battleOpponentProgress: (state.battleOpponentProgress || 0) + 20 });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state.battleStatus, state.battleTimerSeconds, state.battleOpponentProgress]);

  // View: Active Duel
  if (battleStatus === 'fighting') {
    return html`
      <div className="flex-grow flex flex-col min-h-0 bg-[#F4F7FE] p-4 md:p-6 overflow-hidden">
        
        <!-- Battle Top Header -->
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-[#D5DEF2] mb-4"
             style={{ boxShadow: '0 4px 0 #D5DEF2' }}>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-lg shadow-sm"
                 style={{ boxShadow: '0 2px 0 #B45309' }}>
              ⚡
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#16213E]">${activeProblem.title}</h3>
              <div className="text-[10px] font-mono font-bold text-amber-700">1v1 RANKED ARENA DUEL</div>
            </div>
          </div>

          <!-- Dual Progress Indicators -->
          <div className="flex items-center gap-6">
            <div className="w-40 text-left">
              <div className="flex justify-between text-[11px] font-bold text-[#16213E] mb-1">
                <span>You</span>
                <span className="font-mono text-indigo-600">${state.battlePlayerProgress || 0}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#E5EDFD] p-0.5">
                <div className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                     style={{ width: `${state.battlePlayerProgress || 0}%` }}></div>
              </div>
            </div>

            <div className="w-40 text-left">
              <div className="flex justify-between text-[11px] font-bold text-[#16213E] mb-1">
                <span>Elena R.</span>
                <span className="font-mono text-rose-600">${state.battleOpponentProgress || 0}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#E5EDFD] p-0.5">
                <div className="h-full rounded-full bg-rose-500 transition-all duration-300"
                     style={{ width: `${state.battleOpponentProgress || 0}%` }}></div>
              </div>
            </div>

            <div className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-mono font-extrabold text-sm"
                 style={{ boxShadow: '0 3px 0 #3730A3' }}>
              ${formatTime(state.battleTimerSeconds || 600)}
            </div>
          </div>
        </div>

        <!-- Battle IDE Workspace -->
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
          
          <!-- Left: Problem Description & Live Activity Log -->
          <div className="lg:col-span-4 flex flex-col gap-4 min-h-0">
            <div className="bg-white rounded-2xl p-5 border border-[#D5DEF2] flex-grow overflow-y-auto"
                 style={{ boxShadow: '0 1px 0 #fff inset, 0 8px 0 -2px #CBD5EE, 0 24px 32px -16px rgba(22,33,62,0.18)' }}>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                ${activeProblem.difficulty}
              </span>
              <h4 className="text-base font-extrabold text-[#16213E] mt-2 mb-2">${activeProblem.title}</h4>
              <p className="text-xs text-[#566180] leading-relaxed mb-4">${activeProblem.description}</p>
            </div>

            <!-- Activity Logs -->
            <div className="h-44 bg-white rounded-2xl p-4 border border-[#D5DEF2] overflow-y-auto font-mono text-xs text-[#566180] space-y-1.5"
                 style={{ boxShadow: '0 1px 0 #fff inset, 0 4px 0 #D5DEF2' }}>
              <div className="text-[10px] uppercase font-bold text-[#16213E] mb-1">Live Match Events</div>
              ${logs.map((l, i) => html`
                <div key=${i} className="text-[11px] leading-tight">
                  <span className="text-indigo-600 font-bold">[${l.time}]</span> ${l.text}
                </div>
              `)}
            </div>
          </div>

          <!-- Right: Monaco Editor + Action Buttons -->
          <div className="lg:col-span-8 flex flex-col min-h-0 gap-4">
            <div className="flex-grow bg-white rounded-2xl border border-[#D5DEF2] overflow-hidden flex flex-col"
                 style={{ boxShadow: '0 1px 0 #fff inset, 0 8px 0 -2px #CBD5EE, 0 24px 32px -16px rgba(22,33,62,0.18)' }}>
              
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#D5DEF2] bg-[#F8FAFD]">
                <span className="text-xs font-bold text-[#16213E]">solution.js</span>
                <span className="text-[10px] font-mono text-emerald-600 font-bold">Real-time Compiler Active</span>
              </div>

              <div className="flex-grow w-full h-full min-h-[360px]">
                <${Editor}
                  height="100%"
                  language="javascript"
                  theme="vs"
                  value="function twoSum(nums, target) {\n    // Implement your optimal solution here\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const diff = target - nums[i];\n        if (map.has(diff)) return [map.get(diff), i];\n        map.set(nums[i], i);\n    }\n    return [];\n}"
                  options={{ fontSize: 13, minimap: { enabled: false } }}
                />
              </div>
            </div>

            <!-- Bottom Action Keys -->
            <div className="flex items-center justify-end gap-3 p-3 bg-white rounded-2xl border border-[#D5DEF2]"
                 style={{ boxShadow: '0 3px 0 #D5DEF2' }}>
              <button
                onClick=${handleRunTests}
                disabled=${isRunningTests}
                className="chip text-xs font-bold"
              >
                <i data-lucide="play" className="w-3.5 h-3.5"></i>
                <span>${isRunningTests ? 'Evaluating...' : 'Run Test Cases'}</span>
              </button>

              <button
                onClick=${handleSubmit}
                className="btn teal text-xs px-6 py-2"
                style={{ width: 'auto' }}
              >
                Submit Solution
              </button>
            </div>
          </div>

        </div>

      </div>
    `;
  }

  // View: Battle Lobby
  return html`
    <div className="flex-grow p-4 md:p-8 bg-[#F4F7FE] overflow-y-auto">
      
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#16213E] tracking-tight">Coding Battle Arena</h2>
        <p className="text-sm font-semibold text-[#566180] mt-0.5">Real-time competitive algorithmic duels, ranked matchmaking, and live ELO progression</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- Left: Matchmaking Card -->
        <div className="lg:col-span-8 bg-white rounded-3xl p-8 border border-[#D5DEF2] flex flex-col justify-between"
             style={{ boxShadow: '0 1px 0 #fff inset, 0 10px 0 -2px #CBD5EE, 0 32px 48px -16px rgba(22,33,62,0.25)' }}>
          
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                SEASON 4 LIVE
              </span>
              <span className="text-xs font-bold text-emerald-600">● 1,280 Online Competitors</span>
            </div>

            <h3 className="text-2xl font-extrabold text-[#16213E] mb-3">1v1 Synchronous Code Duel</h3>
            <p className="text-xs text-[#566180] leading-relaxed max-w-xl mb-6">
              Face off against randomized challengers at your skill tier. Write, optimize, and submit passing solutions before your opponent.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-[#EEF3FD] p-4 rounded-2xl border border-[#D5DEF2] text-center">
                <div className="text-[10px] font-bold text-[#566180] uppercase">Format</div>
                <div className="text-sm font-extrabold text-[#16213E] mt-0.5">1v1 Speed Run</div>
              </div>
              <div className="bg-[#EEF3FD] p-4 rounded-2xl border border-[#D5DEF2] text-center">
                <div className="text-[10px] font-bold text-[#566180] uppercase">Duration</div>
                <div className="text-sm font-extrabold text-[#16213E] mt-0.5">10 Minutes</div>
              </div>
              <div className="bg-[#EEF3FD] p-4 rounded-2xl border border-[#D5DEF2] text-center">
                <div className="text-[10px] font-bold text-[#566180] uppercase">Reward</div>
                <div className="text-sm font-extrabold text-emerald-600 mt-0.5">+35 AP / Win</div>
              </div>
            </div>
          </div>

          <div>
            ${isSearching ? html`
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-center gap-3 text-indigo-700 font-bold text-xs animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping"></span>
                <span>Searching ranked queue for matching opponents...</span>
              </div>
            ` : html`
              <button
                onClick=${startMatch}
                className="btn text-sm py-4 flex items-center justify-center gap-2"
              >
                <i data-lucide="zap" className="w-5 h-5"></i>
                <span>Find Ranked Match</span>
              </button>
            `}
          </div>
        </div>

        <!-- Right: Profile & Arena Stats -->
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-[#D5DEF2] flex flex-col justify-between"
             style={{ boxShadow: '0 1px 0 #fff inset, 0 8px 0 -2px #CBD5EE, 0 28px 36px -18px rgba(22,33,62,0.2)' }}>
          
          <div>
            <h4 className="text-sm font-extrabold text-[#16213E] mb-4 uppercase tracking-wider">Duelist Profile</h4>
            
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg"
                   style={{ boxShadow: '0 3px 0 #3730A3' }}>
                ER
              </div>
              <div>
                <div className="text-base font-extrabold text-[#16213E]">Eniyan Rajesh</div>
                <div className="text-xs font-mono font-bold text-indigo-600">Diamond Tier · Division I</div>
              </div>
            </div>

            <div className="space-y-3 divide-y divide-[#D5DEF2] text-xs">
              <div className="flex justify-between pt-2">
                <span className="text-[#566180]">Arena Points (AP):</span>
                <span className="font-bold text-[#16213E]">915 AP</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-[#566180]">Global Rank:</span>
                <span className="font-bold text-amber-600">#2 Worldwide</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-[#566180]">Win Rate:</span>
                <span className="font-bold text-emerald-600">89% (24W / 3L)</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#D5DEF2] text-center text-[11px] font-mono text-[#566180]">
            Matchmaking rating verified by zero-knowledge leaderboard
          </div>
        </div>

      </div>

    </div>
  `;
}
