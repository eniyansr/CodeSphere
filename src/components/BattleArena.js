// CodeSphere Pro - Coding Battle Arena Component (Full IDE Edition)
import { updateState, TRANSLATIONS } from '../state.js';

let battleEditorInstance = null;
let battleTimerInterval = null;
let battleTimerSeconds = 600; // 10 minutes default

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

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function BattleArena(state) {
  const battleStatus = state.battleStatus || 'idle';

  if (battleStatus === 'fighting') {
    return renderActiveBattle(state);
  }

  return renderLobby(state);
}

// ─────────────────────────────────────────────────────────────────
// LOBBY VIEW
// ─────────────────────────────────────────────────────────────────
function renderLobby(state) {
  const arenaLang = state.arenaLanguage || 'javascript';
  const topThree = (state.leaderboard || []).slice(0, 5);

  return `
    <div class="flex-grow overflow-y-auto p-6 max-w-5xl mx-auto w-full space-y-6">

      <!-- Hero Banner -->
      <div class="relative rounded-3xl overflow-hidden border border-indigo-500/20 bg-gradient-to-br from-indigo-950/80 via-[#0b0e14] to-rose-950/40 p-8">
        <!-- Background glow orbs -->
        <div class="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none"></div>
        <div class="absolute bottom-0 right-1/4 w-48 h-48 rounded-full bg-rose-600/10 blur-3xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <!-- Icon -->
          <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-rose-500 flex items-center justify-center shadow-2xl shadow-indigo-500/30 flex-shrink-0">
            <i data-lucide="swords" class="w-10 h-10 text-white"></i>
          </div>

          <div class="flex-grow text-center md:text-left">
            <h1 class="text-3xl font-black text-white tracking-tight">Coding Battle Arena</h1>
            <p class="text-slate-400 text-sm mt-1 max-w-lg">Compete in real-time 1v1 coding duels. Solve algorithmic problems faster than your opponent to earn Arena Points.</p>
            <div class="flex flex-wrap justify-center md:justify-start gap-3 mt-3">
              <div class="flex items-center gap-1.5 text-xs text-slate-400">
                <i data-lucide="clock" class="w-3.5 h-3.5 text-indigo-400"></i> 10 min per match
              </div>
              <div class="flex items-center gap-1.5 text-xs text-slate-400">
                <i data-lucide="code-2" class="w-3.5 h-3.5 text-emerald-400"></i> 10 languages
              </div>
              <div class="flex items-center gap-1.5 text-xs text-slate-400">
                <i data-lucide="zap" class="w-3.5 h-3.5 text-amber-400"></i> Live AI proctored
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">

        <!-- Match Setup -->
        <div class="md:col-span-2 bg-slate-900/60 rounded-2xl border border-slate-800/60 p-5 space-y-4">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <i data-lucide="settings-2" class="w-4 h-4 text-indigo-400"></i> Match Setup
          </h3>

          <!-- Language Selector -->
          <div class="space-y-2">
            <label class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Your Language</label>
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-2" id="arena-lang-grid">
              ${BATTLE_LANGUAGES.map(lang => `
                <button data-lang="${lang.id}" class="arena-lang-btn flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition text-center ${arenaLang === lang.id
                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                  : 'border-slate-800 hover:border-slate-600 bg-slate-900/40 text-slate-400 hover:text-slate-200'}">
                  <div class="w-3 h-3 rounded-full" style="background:${lang.color}"></div>
                  <span class="text-[10px] font-bold">${lang.label}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Match Type -->
          <div class="space-y-2">
            <label class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Match Type</label>
            <div class="flex gap-2">
              <button class="match-type-btn flex-1 py-2 rounded-xl border border-indigo-500 bg-indigo-500/10 text-indigo-300 text-xs font-bold" data-type="ranked">
                <i data-lucide="trophy" class="w-3.5 h-3.5 inline mr-1"></i> Ranked
              </button>
              <button class="match-type-btn flex-1 py-2 rounded-xl border border-slate-800 hover:border-slate-600 text-slate-400 text-xs font-bold transition" data-type="casual">
                <i data-lucide="gamepad-2" class="w-3.5 h-3.5 inline mr-1"></i> Casual
              </button>
            </div>
          </div>

          <!-- Matchmake Button -->
          <button id="arena-matchmake-btn" class="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-sm rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition active:scale-95">
            <i data-lucide="swords" class="w-4 h-4"></i> Find Match Now
          </button>

          <!-- Stats Row -->
          <div class="grid grid-cols-3 gap-3 pt-2 border-t border-slate-800/60">
            <div class="text-center">
              <div class="text-lg font-black text-indigo-400">8</div>
              <div class="text-[10px] text-slate-500">Wins</div>
            </div>
            <div class="text-center">
              <div class="text-lg font-black text-rose-400">3</div>
              <div class="text-[10px] text-slate-500">Losses</div>
            </div>
            <div class="text-center">
              <div class="text-lg font-black text-amber-400">915</div>
              <div class="text-[10px] text-slate-500">Arena Points</div>
            </div>
          </div>
        </div>

        <!-- Leaderboard Side Panel -->
        <div class="bg-slate-900/60 rounded-2xl border border-slate-800/60 p-4 space-y-3">
          <h3 class="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
            <i data-lucide="trophy" class="w-3.5 h-3.5 text-amber-400"></i> Top Arena Players
          </h3>
          <div class="space-y-2">
            ${topThree.map((p, idx) => `
              <div class="flex items-center gap-2.5 p-2 rounded-xl ${idx === 0 ? 'bg-amber-500/10 border border-amber-500/20' : idx === 1 ? 'bg-slate-800/50' : 'bg-slate-900/40'}">
                <div class="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0 ${idx === 0 ? 'bg-amber-400 text-amber-900' : idx === 1 ? 'bg-slate-600 text-white' : 'bg-slate-700 text-slate-300'}">
                  ${idx+1}
                </div>
                <div class="flex-grow min-w-0">
                  <div class="text-xs font-bold text-slate-200 truncate">${p.name}</div>
                  <div class="text-[10px] text-slate-500">${p.lang}</div>
                </div>
                <div class="font-mono text-xs font-bold text-indigo-400">${p.score}</div>
              </div>
            `).join('')}
          </div>
          
          <!-- Active Players -->
          <div class="border-t border-slate-800/60 pt-3">
            <div class="flex items-center gap-2 text-xs text-slate-400">
              <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span><strong class="text-emerald-400">42 players</strong> searching for matches</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Recent Battles -->
      <div class="bg-slate-900/60 rounded-2xl border border-slate-800/60 p-4 space-y-3">
        <h3 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <i data-lucide="history" class="w-3.5 h-3.5 text-slate-400"></i> Recent Battles
        </h3>
        <div class="overflow-x-auto">
          <table class="w-full text-xs text-slate-400">
            <thead>
              <tr class="border-b border-slate-800/60">
                <th class="text-left py-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">Problem</th>
                <th class="text-left py-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">Opponent</th>
                <th class="text-left py-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">Language</th>
                <th class="text-left py-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">Result</th>
                <th class="text-left py-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">AP</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/40">
              ${[
                { prob: 'Two Sum', opp: 'Pranav K.', lang: 'JavaScript', result: 'WIN', ap: '+30', color: 'text-emerald-400' },
                { prob: 'Reverse String', opp: 'Aisha B.', lang: 'Python', result: 'WIN', ap: '+25', color: 'text-emerald-400' },
                { prob: 'FizzBuzz', opp: 'Devendra N.', lang: 'C++', result: 'LOSS', ap: '-15', color: 'text-rose-400' },
              ].map(b => `
                <tr class="hover:bg-slate-800/20 transition">
                  <td class="py-2 font-semibold text-slate-300">${b.prob}</td>
                  <td class="py-2">${b.opp}</td>
                  <td class="py-2 font-mono">${b.lang}</td>
                  <td class="py-2"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${b.result === 'WIN' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'}">${b.result}</span></td>
                  <td class="py-2 font-mono font-bold ${b.color}">${b.ap}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────
// ACTIVE BATTLE VIEW — Full IDE
// ─────────────────────────────────────────────────────────────────
function renderActiveBattle(state) {
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

  return `
    <div class="flex-grow flex flex-col h-[calc(100vh-76px)] overflow-hidden" id="battle-ide-root">

      <!-- Battle Top Bar -->
      <div class="bg-slate-900/90 border-b border-slate-800/70 px-4 py-2 flex items-center gap-3 flex-wrap">
        
        <!-- VS Info -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <div class="flex items-center gap-1.5">
            <div class="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 font-black text-[10px] flex items-center justify-center border border-indigo-500/30">ER</div>
            <span class="text-xs font-bold text-slate-200">Eniyan R.</span>
          </div>
          <div class="px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-400 font-black text-[10px]">VS</div>
          <div class="flex items-center gap-1.5">
            <div class="w-7 h-7 rounded-full bg-rose-500/20 text-rose-400 font-black text-[10px] flex items-center justify-center border border-rose-500/30">PK</div>
            <span class="text-xs font-bold text-slate-200">Pranav K.</span>
          </div>
        </div>

        <!-- Problem Title -->
        <div class="hidden md:flex items-center gap-2 flex-grow justify-center">
          <span class="text-xs text-slate-500">Problem:</span>
          <span class="text-xs font-bold text-white">${prob.title}</span>
          <span class="px-1.5 py-0.5 rounded text-[10px] font-bold border ${
            prob.difficulty === 'Easy' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
            prob.difficulty === 'Medium' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
            'bg-rose-500/15 text-rose-400 border-rose-500/30'
          }">${prob.difficulty || 'Easy'}</span>
        </div>

        <!-- Timer & Language -->
        <div class="flex items-center gap-2 ml-auto flex-shrink-0">
          <div class="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 rounded-lg border border-slate-700/50">
            <i data-lucide="timer" class="w-3 h-3 text-rose-400"></i>
            <span id="battle-timer" class="text-xs font-black font-mono text-rose-400">${formatTime(timerSecs)}</span>
          </div>
          <div class="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 rounded-lg border border-slate-700/50">
            <div class="w-2 h-2 rounded-full" style="background:${langMeta.color}"></div>
            <span class="text-xs font-semibold text-slate-300">${langMeta.label}</span>
          </div>
        </div>
      </div>

      <!-- Main Split Layout -->
      <div class="flex-grow flex flex-col lg:flex-row overflow-hidden">

        <!-- LEFT: Problem + IDE -->
        <div class="flex-grow flex flex-col min-w-0 overflow-hidden">

          <!-- Sub-split: Problem Panel (left) + Editor (right) on large screens -->
          <div class="flex-grow flex flex-col md:flex-row overflow-hidden">

            <!-- Problem Panel -->
            <div class="w-full md:w-[300px] flex-shrink-0 border-r border-slate-800/60 bg-[#090c12] flex flex-col overflow-hidden">
              <div class="bg-slate-900/70 border-b border-slate-800/60 px-3 py-2 flex items-center gap-2">
                <i data-lucide="book-open" class="w-3.5 h-3.5 text-indigo-400"></i>
                <span class="text-xs font-bold text-slate-200">Problem Statement</span>
              </div>
              <div class="flex-grow overflow-y-auto p-4 space-y-4 text-xs">
                
                <div>
                  <h2 class="font-black text-white text-sm">${prob.title}</h2>
                  <p class="text-slate-400 leading-relaxed mt-2">${prob.description}</p>
                </div>

                ${prob.examples ? `
                  <div class="space-y-2">
                    <div class="text-[10px] font-bold uppercase tracking-widest text-slate-500">Examples</div>
                    ${prob.examples.map((ex, i) => `
                      <div class="bg-slate-950 rounded-lg p-3 border border-slate-800/60 space-y-1.5">
                        <div class="text-[10px] font-bold text-slate-500">Example ${i+1}</div>
                        <div class="font-mono text-[11px] space-y-1">
                          <div><span class="text-slate-500">Input: </span><span class="text-slate-200">${ex.input}</span></div>
                          <div><span class="text-slate-500">Output: </span><span class="text-emerald-400">${ex.output}</span></div>
                          ${ex.explanation ? `<div class="text-slate-500 text-[10px] italic">// ${ex.explanation}</div>` : ''}
                        </div>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}

                ${prob.constraints ? `
                  <div class="space-y-1.5">
                    <div class="text-[10px] font-bold uppercase tracking-widest text-slate-500">Constraints</div>
                    ${prob.constraints.map(c => `<div class="text-[11px] text-slate-400 font-mono flex items-start gap-1.5"><span class="text-indigo-500">•</span>${c}</div>`).join('')}
                  </div>
                ` : ''}

                <!-- Battle Test Cases -->
                <div class="space-y-2 border-t border-slate-800/60 pt-3">
                  <div class="text-[10px] font-bold uppercase tracking-widest text-slate-500">Test Cases</div>
                  ${(prob.testCases || []).map(tc => `
                    <div class="bg-slate-950 rounded-lg p-2.5 border border-slate-800/60 font-mono text-[10px] space-y-1">
                      <div class="text-slate-500 font-bold">Test ${tc.id} ${tc.hidden ? '🔒' : ''}</div>
                      ${!tc.hidden ? `
                        <div><span class="text-slate-500">In: </span><span class="text-slate-300">${tc.input}</span></div>
                        <div><span class="text-slate-500">Out: </span><span class="text-emerald-400">${tc.expected}</span></div>
                      ` : '<div class="text-slate-600 italic">Hidden — runs on final submit</div>'}
                    </div>
                  `).join('')}
                </div>

              </div>
            </div>

            <!-- Editor Area -->
            <div class="flex-grow flex flex-col min-w-0">
              
              <!-- Editor Toolbar -->
              <div class="bg-slate-900/80 border-b border-slate-800/50 px-3 py-2 flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <div class="flex items-center gap-1.5 bg-[#1e1e1e] border border-slate-700/40 rounded px-2 py-1">
                    <div class="w-1.5 h-1.5 rounded-full bg-rose-400"></div>
                    <span class="text-[11px] font-mono text-slate-300">solution.${langMeta.ext}</span>
                  </div>
                </div>
                <div class="flex items-center gap-1.5">
                  <button id="battle-format-btn" class="px-2 py-1 hover:bg-slate-800 rounded border border-slate-700/40 text-slate-400 hover:text-slate-200 text-[11px] font-medium flex items-center gap-1 transition">
                    <i data-lucide="align-left" class="w-3 h-3"></i> Format
                  </button>
                  <button id="battle-clear-btn" class="px-2 py-1 hover:bg-slate-800 rounded border border-slate-700/40 text-slate-400 hover:text-rose-400 text-[11px] font-medium flex items-center gap-1 transition">
                    <i data-lucide="trash-2" class="w-3 h-3"></i> Reset
                  </button>
                </div>
              </div>

              <!-- Monaco Editor Mount -->
              <div id="battle-editor-mount" class="flex-grow bg-[#1e1e1e] relative min-h-[200px]" data-initial-code="${encodeURIComponent(initialCode)}" data-lang="${arenaLang}">
                <div id="battle-editor-placeholder" class="absolute inset-0 flex items-center justify-center bg-[#1e1e1e] z-10">
                  <div class="flex flex-col items-center gap-3">
                    <div class="w-7 h-7 border-2 border-rose-500 border-t-transparent animate-spin rounded-full"></div>
                    <span class="text-slate-400 font-mono text-sm">Loading Battle Editor...</span>
                  </div>
                </div>
              </div>

              <!-- Editor Action Bar -->
              <div class="bg-slate-900/80 border-t border-slate-800/50 px-4 py-2.5 flex justify-between items-center">
                <div class="text-[11px] text-slate-500 font-mono" id="battle-status-text">Ready to code</div>
                <div class="flex items-center gap-2">
                  <button id="battle-run-btn" class="px-4 py-1.5 rounded-lg bg-slate-800 border border-slate-700/60 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition active:scale-95">
                    <i data-lucide="play" class="w-3.5 h-3.5 text-emerald-400"></i> Run & Test
                  </button>
                  <button id="battle-submit-btn" class="px-4 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-600/20 transition active:scale-95">
                    <i data-lucide="check" class="w-3.5 h-3.5"></i> Submit Solution
                  </button>
                </div>
              </div>

              <!-- Battle Output Panel -->
              <div id="battle-output-panel" class="bg-[#0b0e14] border-t border-slate-800/60" style="height:160px;overflow-y:auto;">
                <div class="flex border-b border-slate-800/50">
                  <button id="battle-tab-output" class="px-4 py-2 text-[11px] font-semibold border-b-2 border-rose-500 text-slate-200 flex items-center gap-1">
                    <i data-lucide="terminal" class="w-3 h-3 text-rose-400"></i> Output
                  </button>
                  <button id="battle-tab-tests" class="px-4 py-2 text-[11px] font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-300 flex items-center gap-1 transition">
                    <i data-lucide="list-checks" class="w-3 h-3"></i> Tests
                  </button>
                </div>
                <div id="battle-output-view" class="p-3 font-mono text-xs text-slate-400 italic">
                  Click "Run & Test" to execute against sample test cases.
                </div>
                <div id="battle-tests-view" class="p-3 hidden space-y-2">
                  ${(prob.testCases || []).filter(tc => !tc.hidden).map(tc => `
                    <div class="flex items-center justify-between bg-slate-900/60 rounded-lg px-3 py-2 border border-slate-800/50" id="battle-tc-row-${tc.id}">
                      <span class="text-[11px] font-mono text-slate-400">Test ${tc.id}: <span class="text-slate-500">${tc.input}</span></span>
                      <span id="battle-tc-status-${tc.id}" class="text-[10px] font-bold text-slate-600">⏳ Pending</span>
                    </div>
                  `).join('')}
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- RIGHT: Battle Sidebar -->
        <div class="w-full lg:w-[260px] flex-shrink-0 flex flex-col bg-[#080b11] border-t lg:border-t-0 lg:border-l border-slate-900/70 overflow-hidden">
          
          <!-- Progress Cards -->
          <div class="p-4 space-y-3 border-b border-slate-900/60">
            <div class="text-[10px] font-bold uppercase tracking-widest text-slate-500">Duel Progress</div>
            
            <!-- Player Progress -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <div class="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-black text-[9px] flex items-center justify-center border border-indigo-500/30">ER</div>
                  <span class="text-[11px] font-bold text-slate-200">You</span>
                </div>
                <span id="player-progress-pct" class="text-[11px] font-mono font-bold text-indigo-400">${playerProgress}%</span>
              </div>
              <div class="w-full bg-slate-950 rounded-full h-2 border border-slate-900">
                <div id="player-progress-bar" class="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full shadow-glow-indigo transition-all duration-700" style="width:${playerProgress}%"></div>
              </div>
            </div>

            <!-- Opponent Progress -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <div class="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 font-black text-[9px] flex items-center justify-center border border-rose-500/30">PK</div>
                  <span class="text-[11px] font-bold text-slate-200">Pranav K.</span>
                </div>
                <span id="opponent-progress-pct" class="text-[11px] font-mono font-bold text-rose-400">${opponentProgress}%</span>
              </div>
              <div class="w-full bg-slate-950 rounded-full h-2 border border-slate-900">
                <div id="opponent-progress-bar" class="bg-gradient-to-r from-rose-500 to-orange-500 h-2 rounded-full transition-all duration-700" style="width:${opponentProgress}%"></div>
              </div>
            </div>
          </div>

          <!-- Battle Activity Log -->
          <div class="flex-grow p-4 overflow-y-auto space-y-2" id="battle-log-container">
            <div class="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Live Activity</div>
            <div id="battle-logs" class="space-y-1.5 font-mono text-[10px] text-slate-400">
              <div class="text-slate-500">[${formatTime(timerSecs)}] Battle started. Good luck!</div>
              <div class="text-slate-500">[${formatTime(timerSecs)}] Opponent Pranav K. loaded ${state.arenaLanguage || 'JavaScript'}</div>
            </div>
          </div>

          <!-- Forfeit Button -->
          <div class="p-4 border-t border-slate-900/60">
            <button id="battle-exit-btn" class="w-full py-2 bg-slate-900 border border-slate-800 hover:bg-rose-950/20 hover:border-rose-900/50 text-slate-500 hover:text-rose-400 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5">
              <i data-lucide="flag" class="w-3.5 h-3.5"></i> Forfeit Match
            </button>
          </div>

        </div>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────
// EVENT BINDINGS
// ─────────────────────────────────────────────────────────────────
export function bindBattleArenaEvents(state) {
  const status = state.battleStatus || 'idle';

  if (status === 'fighting') {
    bindActiveBattleEvents(state);
    return;
  }

  bindLobbyEvents(state);
}

function bindLobbyEvents(state) {
  // Language selection
  document.querySelectorAll('.arena-lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      updateState({ arenaLanguage: lang });
    });
  });

  // Match type toggle
  document.querySelectorAll('.match-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.match-type-btn').forEach(b => {
        b.classList.remove('border-indigo-500', 'bg-indigo-500/10', 'text-indigo-300');
        b.classList.add('border-slate-800', 'text-slate-400');
      });
      btn.classList.add('border-indigo-500', 'bg-indigo-500/10', 'text-indigo-300');
      btn.classList.remove('border-slate-800', 'text-slate-400');
    });
  });

  // Matchmaking
  document.getElementById('arena-matchmake-btn')?.addEventListener('click', () => {
    const btn = document.getElementById('arena-matchmake-btn');
    if (!btn) return;
    btn.innerHTML = `<div class="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div> Searching for opponent...`;
    btn.disabled = true;
    btn.classList.add('opacity-75', 'cursor-not-allowed');

    // Random problem selection
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
    }, 1800);
  });
}

function bindActiveBattleEvents(state) {
  const arenaLang = state.arenaLanguage || 'javascript';
  const problems = state.battleProblems || [];
  const prob = problems[state.activeBattleProblem || 0] || {};
  const initialCode = (prob.templates && prob.templates[arenaLang]) || `// Solve: ${prob.title || 'Problem'}\n`;

  // Mount Battle Monaco Editor
  const mountNode = document.getElementById('battle-editor-mount');
  if (mountNode) {
    require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs' }});
    require(['vs/editor/editor.main'], function() {
      const placeholder = document.getElementById('battle-editor-placeholder');
      if (placeholder) placeholder.style.display = 'none';

      const existing = mountNode.querySelector('.monaco-editor');
      if (existing) existing.remove();

      const monacoLangMap = {
        javascript: 'javascript', python: 'python', cpp: 'cpp', c: 'c',
        java: 'java', typescript: 'typescript', php: 'php', ruby: 'ruby',
        go: 'go', rust: 'rust', swift: 'swift'
      };

      battleEditorInstance = monaco.editor.create(mountNode, {
        value: initialCode,
        language: monacoLangMap[arenaLang] || 'javascript',
        theme: 'vs-dark',
        automaticLayout: true,
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 13,
        minimap: { enabled: false },
        lineNumbers: 'on',
        cursorBlinking: 'smooth',
        scrollBeyondLastLine: false,
        padding: { top: 10 }
      });
    });
  }

  // ── Battle Timer ──
  battleTimerSeconds = state.battleTimerSeconds ?? 600;
  if (battleTimerInterval) clearInterval(battleTimerInterval);
  
  battleTimerInterval = setInterval(() => {
    battleTimerSeconds--;
    state.battleTimerSeconds = battleTimerSeconds;

    const timerEl = document.getElementById('battle-timer');
    if (timerEl) {
      timerEl.textContent = formatTime(battleTimerSeconds);
      if (battleTimerSeconds <= 60) {
        timerEl.classList.add('text-rose-400');
        timerEl.classList.remove('text-slate-300');
      }
    }

    if (battleTimerSeconds <= 0) {
      clearInterval(battleTimerInterval);
      endBattle(state, 'timeout');
    }
  }, 1000);

  // ── Opponent AI Progress ──
  let opponentTimer = setInterval(() => {
    if (state.battleStatus !== 'fighting') { clearInterval(opponentTimer); return; }
    const delta = Math.floor(Math.random() * 12) + 3;
    const current = (state.battleOpponentProgress || 0) + delta;
    const capped = Math.min(current, 100);
    
    updateState({ battleOpponentProgress: capped });
    
    // Live update bars without full re-render
    const bar = document.getElementById('opponent-progress-bar');
    const pct = document.getElementById('opponent-progress-pct');
    if (bar) bar.style.width = capped + '%';
    if (pct) pct.textContent = capped + '%';

    // Log opponent events
    if (capped > 30 && current - delta <= 30) addBattleLog('Pranav K. passed Test Case 1! 🔥', 'rose');
    if (capped > 70 && current - delta <= 70) addBattleLog('Pranav K. passed Test Case 2! ⚡', 'rose');

    if (capped >= 100) {
      clearInterval(opponentTimer);
      clearInterval(battleTimerInterval);
      endBattle(state, 'opponent_won');
    }
  }, 4000);

  // ── Format Button ──
  document.getElementById('battle-format-btn')?.addEventListener('click', () => {
    battleEditorInstance?.getAction('editor.action.formatDocument')?.run();
  });

  // ── Reset Code ──
  document.getElementById('battle-clear-btn')?.addEventListener('click', () => {
    if (confirm('Reset code to the problem template?')) {
      battleEditorInstance?.setValue(initialCode);
    }
  });

  // ── Output Tabs ──
  function switchBattleTab(tab) {
    ['output', 'tests'].forEach(t => {
      const btn = document.getElementById(`battle-tab-${t}`);
      const view = document.getElementById(`battle-${t}-view`);
      if (!btn || !view) return;
      if (t === tab) {
        btn.classList.add('border-rose-500', 'text-slate-200');
        btn.classList.remove('border-transparent', 'text-slate-500');
        view.classList.remove('hidden');
      } else {
        btn.classList.remove('border-rose-500', 'text-slate-200');
        btn.classList.add('border-transparent', 'text-slate-500');
        view.classList.add('hidden');
      }
    });
  }

  document.getElementById('battle-tab-output')?.addEventListener('click', () => switchBattleTab('output'));
  document.getElementById('battle-tab-tests')?.addEventListener('click', () => switchBattleTab('tests'));

  // ── Run & Test Button ──
  document.getElementById('battle-run-btn')?.addEventListener('click', async () => {
    if (!battleEditorInstance) return;
    const code = battleEditorInstance.getValue();
    const lang = arenaLang;
    const outputView = document.getElementById('battle-output-view');
    
    switchBattleTab('output');
    addBattleLog('Running test cases...', 'slate');

    if (outputView) {
      outputView.innerHTML = `<div class="flex items-center gap-2 text-indigo-400"><div class="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent animate-spin rounded-full"></div> Running tests...</div>`;
    }

    await new Promise(r => setTimeout(r, 800));

    // Simulate test execution
    let passed = 0;
    const testCases = prob.testCases || [];
    const visibleTests = testCases.filter(tc => !tc.hidden);
    
    if (outputView) {
      outputView.innerHTML = '';
      visibleTests.forEach(tc => {
        // 50% chance of passing each test
        const tcPassed = Math.random() > 0.5;
        if (tcPassed) passed++;
        const statusEl = document.getElementById(`battle-tc-status-${tc.id}`);
        if (statusEl) {
          statusEl.textContent = tcPassed ? '✓ Passed' : '✗ Failed';
          statusEl.className = `text-[10px] font-bold ${tcPassed ? 'text-emerald-400' : 'text-rose-400'}`;
        }
        const row = `<div class="flex items-center gap-2 py-1"><span class="${tcPassed ? 'text-emerald-400' : 'text-rose-400'} font-bold">${tcPassed ? '✓' : '✗'}</span><span>Test ${tc.id}: ${tc.input}</span><span class="ml-auto text-slate-500">→ ${tc.expected}</span></div>`;
        outputView.innerHTML += row;
      });
    }

    const progress = Math.round((passed / Math.max(visibleTests.length, 1)) * 70);
    updateState({ battlePlayerProgress: Math.min(progress, 95) });
    
    const bar = document.getElementById('player-progress-bar');
    const pct = document.getElementById('player-progress-pct');
    if (bar) bar.style.width = progress + '%';
    if (pct) pct.textContent = progress + '%';

    addBattleLog(`Ran ${visibleTests.length} tests — ${passed}/${visibleTests.length} passed`, passed > 0 ? 'indigo' : 'rose');
    switchBattleTab('tests');
  });

  // ── Submit Solution ──
  document.getElementById('battle-submit-btn')?.addEventListener('click', () => {
    if (!battleEditorInstance) return;
    clearInterval(opponentTimer);
    clearInterval(battleTimerInterval);
    updateState({ battlePlayerProgress: 100 });
    const bar = document.getElementById('player-progress-bar');
    const pct = document.getElementById('player-progress-pct');
    if (bar) bar.style.width = '100%';
    if (pct) pct.textContent = '100%';
    addBattleLog('Solution submitted! Validating all test cases...', 'emerald');
    setTimeout(() => endBattle(state, 'player_won'), 1000);
  });

  // ── Forfeit ──
  document.getElementById('battle-exit-btn')?.addEventListener('click', () => {
    if (confirm('Forfeit this match? Your Arena Points rating will decrease.')) {
      clearInterval(opponentTimer);
      clearInterval(battleTimerInterval);
      endBattle(state, 'forfeit');
    }
  });
}

function addBattleLog(message, color = 'slate') {
  const logsEl = document.getElementById('battle-logs');
  if (!logsEl) return;
  const colorMap = { rose: 'text-rose-400', indigo: 'text-indigo-400', emerald: 'text-emerald-400', slate: 'text-slate-400', amber: 'text-amber-400' };
  const entry = document.createElement('div');
  entry.className = colorMap[color] || 'text-slate-400';
  entry.textContent = `[${formatTime(battleTimerSeconds)}] ${message}`;
  logsEl.appendChild(entry);
  const container = document.getElementById('battle-log-container');
  if (container) container.scrollTop = container.scrollHeight;
}

function endBattle(state, reason) {
  if (battleTimerInterval) { clearInterval(battleTimerInterval); battleTimerInterval = null; }

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
}
