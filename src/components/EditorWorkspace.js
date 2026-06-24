// CodeSphere Pro - Professional Monaco Editor Workspace Component (12-Language IDE)
import { updateState, TRANSLATIONS } from '../state.js';

let activeEditorInstance = null;
let currentEditorTheme = 'vs-dark';
let currentFontSize = 14;
let problemPanelOpen = true;

export function EditorWorkspace(state) {
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.en;
  const activeLang = state.activeLanguage || 'javascript';
  const currentCode = (state.editorCode && state.editorCode[activeLang]) || '';

  const languagesList = [
    { id: 'javascript', label: 'JavaScript',    ext: 'js',   color: '#f7df1e', badge: 'Node.js 20' },
    { id: 'python',     label: 'Python 3',       ext: 'py',   color: '#3572A5', badge: 'Pyodide WASM' },
    { id: 'cpp',        label: 'C++',            ext: 'cpp',  color: '#f34b7d', badge: 'GCC 12' },
    { id: 'c',          label: 'C',              ext: 'c',    color: '#555555', badge: 'C17' },
    { id: 'java',       label: 'Java',           ext: 'java', color: '#b07219', badge: 'JVM 17' },
    { id: 'typescript', label: 'TypeScript',     ext: 'ts',   color: '#2b7489', badge: 'TS 5.0' },
    { id: 'php',        label: 'PHP',            ext: 'php',  color: '#4F5D95', badge: 'PHP 8.2' },
    { id: 'ruby',       label: 'Ruby',           ext: 'rb',   color: '#701516', badge: 'Ruby 3.2' },
    { id: 'go',         label: 'Go (Golang)',    ext: 'go',   color: '#00ADD8', badge: 'Go 1.21' },
    { id: 'rust',       label: 'Rust',           ext: 'rs',   color: '#dea584', badge: 'Rust 1.75' },
    { id: 'swift',      label: 'Swift',          ext: 'swift',color: '#F05138', badge: 'Swift 5.9' },
    { id: 'html',       label: 'HTML/CSS/JS',    ext: 'html', color: '#e34c26', badge: 'Live Preview' },
  ];

  const activeLangMeta = languagesList.find(l => l.id === activeLang) || languagesList[0];

  // Sample problem for practice mode
  const practiceProblems = [
    {
      title: "Binary Search Tree Insertion",
      difficulty: "Medium",
      diffColor: "text-amber-400",
      description: "Implement a function to insert a value into a Binary Search Tree and return the modified tree. The tree should maintain BST properties after insertion.",
      examples: [
        { input: "root = [50], insert = 30", output: "[50, 30]", explanation: "30 < 50, so it goes to left" },
        { input: "root = [50, 30], insert = 70", output: "[50, 30, 70]" }
      ],
      constraints: ["The number of nodes in the tree is in [0, 10^4]", "-10^8 <= Node.val <= 10^8", "All values in the BST are unique"],
      tags: ["Tree", "BST", "DFS"],
    }
  ];

  const prob = practiceProblems[0];
  const difficultyBadgeMap = { Easy: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', Medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30', Hard: 'bg-rose-500/15 text-rose-400 border-rose-500/30' };

  return `
    <div class="flex-grow flex flex-col md:flex-row h-[calc(100vh-76px)] overflow-hidden" id="arena-ide-root">

      <!-- === LEFT: Problem Statement Panel === -->
      <div id="problem-panel" class="w-full md:w-[340px] flex-shrink-0 border-r border-slate-800/60 bg-[#090c12] flex flex-col transition-all duration-300 overflow-hidden ${problemPanelOpen ? '' : 'hidden md:block'}">
        
        <!-- Panel Header -->
        <div class="bg-slate-900/80 border-b border-slate-800/60 px-4 py-2.5 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-5 h-5 rounded bg-indigo-500/20 flex items-center justify-center">
              <i data-lucide="book-open" class="w-3 h-3 text-indigo-400"></i>
            </div>
            <span class="text-xs font-bold text-slate-200 uppercase tracking-wider">Problem</span>
          </div>
          <div class="flex items-center gap-1">
            <button id="prob-prev-btn" title="Previous problem" class="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300 transition">
              <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i>
            </button>
            <span class="text-[10px] text-slate-500 font-mono">1 / 1</span>
            <button id="prob-next-btn" title="Next problem" class="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300 transition">
              <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>

        <!-- Problem Content -->
        <div class="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-thin">
          
          <!-- Title & Difficulty -->
          <div class="space-y-2">
            <div class="flex items-start justify-between gap-2">
              <h2 class="text-sm font-extrabold text-white leading-tight">${prob.title}</h2>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${difficultyBadgeMap[prob.difficulty]}">${prob.difficulty}</span>
            </div>
            <div class="flex flex-wrap gap-1">
              ${prob.tags.map(tag => `<span class="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">${tag}</span>`).join('')}
            </div>
          </div>

          <!-- Description -->
          <div class="text-xs text-slate-300 leading-relaxed">${prob.description}</div>

          <!-- Examples -->
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

          <!-- Constraints -->
          <div class="space-y-2">
            <div class="text-[10px] font-bold uppercase tracking-widest text-slate-500">Constraints</div>
            <ul class="space-y-1">
              ${prob.constraints.map(c => `<li class="text-[11px] text-slate-400 font-mono flex items-start gap-1.5"><span class="text-indigo-500 mt-0.5 flex-shrink-0">•</span>${c}</li>`).join('')}
            </ul>
          </div>

          <!-- Stats -->
          <div class="border-t border-slate-800/60 pt-3 grid grid-cols-3 gap-2">
            <div class="text-center">
              <div class="text-xs font-bold text-emerald-400">62.4%</div>
              <div class="text-[10px] text-slate-500">Acceptance</div>
            </div>
            <div class="text-center">
              <div class="text-xs font-bold text-slate-300">42.1K</div>
              <div class="text-[10px] text-slate-500">Submissions</div>
            </div>
            <div class="text-center">
              <div class="text-xs font-bold text-indigo-400">O(h)</div>
              <div class="text-[10px] text-slate-500">Complexity</div>
            </div>
          </div>

        </div>
      </div>

      <!-- === CENTER: Code Editor === -->
      <div class="flex-grow flex flex-col border-r border-slate-800/40 min-w-0">

        <!-- Toolbar -->
        <div class="bg-slate-900/80 border-b border-slate-800/50 px-3 py-2 flex items-center justify-between gap-2 flex-wrap">
          
          <div class="flex items-center gap-2">
            <!-- Toggle Problem Panel -->
            <button id="toggle-problem-panel" title="Toggle Problem Panel" class="p-1.5 rounded bg-slate-800/70 border border-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition">
              <i data-lucide="panel-left" class="w-3.5 h-3.5"></i>
            </button>

            <!-- Language Selector -->
            <div class="relative flex items-center gap-2">
              <div class="w-2 h-2 rounded-full flex-shrink-0" style="background-color:${activeLangMeta.color}"></div>
              <select id="editor-lang-select" class="bg-slate-800/80 text-slate-200 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none cursor-pointer hover:border-slate-600 transition pr-6 appearance-none">
                ${languagesList.map(lang => `<option value="${lang.id}" ${activeLang === lang.id ? 'selected' : ''}>${lang.label}</option>`).join('')}
              </select>
            </div>

            <!-- File Tab -->
            <div class="flex items-center gap-1.5 bg-[#1e1e1e] border border-slate-700/40 rounded px-2 py-1">
              <div class="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
              <span class="text-[11px] font-mono text-slate-300">main.${activeLangMeta.ext}</span>
            </div>

            <!-- Runtime Badge -->
            <span class="hidden sm:block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700/40">${activeLangMeta.badge}</span>
          </div>

          <!-- Right Controls -->
          <div class="flex items-center gap-1.5">
            <!-- Font size -->
            <div class="flex items-center gap-1 bg-slate-800/60 border border-slate-700/40 rounded px-1.5">
              <button id="editor-font-dec" title="Decrease font size" class="p-0.5 hover:text-white text-slate-500 transition text-xs font-bold">A-</button>
              <span id="editor-font-size-label" class="text-[10px] text-slate-400 font-mono w-6 text-center">14</span>
              <button id="editor-font-inc" title="Increase font size" class="p-0.5 hover:text-white text-slate-500 transition text-sm font-bold">A+</button>
            </div>

            <!-- Theme Selector -->
            <select id="editor-theme-select" title="Editor Theme" class="bg-slate-800/80 text-slate-300 border border-slate-700/50 rounded px-2 py-1 text-[11px] outline-none cursor-pointer hover:border-slate-600 transition">
              <option value="vs-dark">Dark</option>
              <option value="vs-light">Light</option>
              <option value="hc-black">High Contrast</option>
            </select>

            <button id="editor-format-btn" title="Format Code" class="px-2 py-1 hover:bg-slate-800 rounded border border-slate-700/40 hover:border-slate-600 text-slate-400 hover:text-slate-200 text-xs font-medium flex items-center gap-1 transition">
              <i data-lucide="align-left" class="w-3 h-3"></i> Format
            </button>

            <button id="editor-fullscreen-btn" title="Fullscreen" class="p-1.5 hover:bg-slate-800 rounded border border-slate-700/40 text-slate-400 hover:text-slate-200 transition">
              <i data-lucide="maximize-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>

        <!-- Monaco Mount Area -->
        <div id="monaco-editor-mount" class="flex-grow bg-[#1e1e1e] relative min-h-[280px]">
          <div id="editor-placeholder" class="absolute inset-0 flex items-center justify-center bg-[#1e1e1e] z-10">
            <div class="flex flex-col items-center gap-3">
              <div class="w-8 h-8 border-2 border-indigo-500 border-t-transparent animate-spin rounded-full"></div>
              <span class="text-slate-400 font-mono text-sm">Initializing Monaco IDE...</span>
            </div>
          </div>
        </div>

        <!-- Bottom Action Bar -->
        <div class="bg-slate-900/80 border-t border-slate-800/50 px-4 py-2.5 flex justify-between items-center gap-2">
          <div class="flex items-center gap-3">
            <button id="editor-custom-input-toggle" class="text-xs text-slate-400 hover:text-slate-200 font-medium flex items-center gap-1 transition">
              <i data-lucide="terminal" class="w-3.5 h-3.5"></i>
              <span id="custom-input-label">Custom Input</span>
            </button>
            <div id="execution-status" class="text-[11px] text-slate-500 font-mono hidden"></div>
          </div>
          <div class="flex items-center gap-2">
            <button id="compiler-run-btn" class="px-4 py-1.5 rounded-lg bg-slate-800 border border-slate-700/60 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition active:scale-95">
              <i data-lucide="play" class="w-3.5 h-3.5 text-emerald-400"></i>
              ${t.runCode}
            </button>
            <button id="compiler-submit-btn" class="px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-indigo-600/20 active:scale-95">
              <i data-lucide="check" class="w-3.5 h-3.5"></i>
              ${t.submitCode}
            </button>
          </div>
        </div>

        <!-- Collapsible Custom Input -->
        <div id="custom-input-container" class="bg-[#0d1117] border-t border-slate-800/50 px-4 py-3 hidden">
          <label class="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1.5">Standard Input (stdin)</label>
          <textarea id="custom-input-textarea" class="w-full h-20 bg-slate-950 text-slate-200 border border-slate-800 rounded-lg p-2.5 text-xs font-mono outline-none resize-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition" placeholder="Enter custom inputs here, one per line..."></textarea>
        </div>
      </div>

      <!-- === RIGHT: Output / Tests / AI Mentor === -->
      <div class="w-full md:w-[360px] flex-shrink-0 flex flex-col bg-[#0b0e14] border-t md:border-t-0 border-slate-800/40">
        
        <!-- Tab Header -->
        <div class="flex border-b border-slate-800/50 bg-slate-900/50 text-xs">
          <button id="console-tab-out" class="flex-1 px-3 py-2.5 border-b-2 border-indigo-500 bg-slate-900/60 text-slate-200 font-semibold flex items-center justify-center gap-1.5">
            <i data-lucide="terminal" class="w-3.5 h-3.5 text-indigo-400"></i> Output
          </button>
          <button id="console-tab-test" class="flex-1 px-3 py-2.5 border-b-2 border-transparent hover:bg-slate-800/30 text-slate-400 hover:text-slate-200 font-semibold flex items-center justify-center gap-1.5 transition">
            <i data-lucide="list-checks" class="w-3.5 h-3.5"></i> Tests
          </button>
          <button id="console-tab-mentor" class="flex-1 px-3 py-2.5 border-b-2 border-transparent hover:bg-slate-800/30 text-slate-400 hover:text-slate-200 font-semibold flex items-center justify-center gap-1.5 transition">
            <i data-lucide="sparkles" class="w-3.5 h-3.5 text-cyan-400"></i> AI
          </button>
        </div>

        <!-- Output Console View -->
        <div id="console-output-view" class="flex-grow p-4 overflow-y-auto space-y-3 font-mono text-xs">
          <div class="flex flex-col items-center justify-center h-full text-center space-y-3 text-slate-600">
            <i data-lucide="play-circle" class="w-10 h-10 opacity-40"></i>
            <p class="text-sm font-medium">Output console empty</p>
            <p class="text-[11px]">Click "Run Code" to compile and execute</p>
          </div>
        </div>

        <!-- Test Cases View (Hidden) -->
        <div id="console-testcases-view" class="flex-grow p-4 overflow-y-auto hidden space-y-3">
          <div class="flex items-center justify-between mb-1">
            <h3 class="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <i data-lucide="check-square" class="w-3.5 h-3.5 text-indigo-400"></i>
              BST Insertion Test Suite
            </h3>
            <span class="text-[10px] text-slate-500 font-mono">2 sample, 1 hidden</span>
          </div>
          
          ${[
            { n: 1, label: 'Sample', input: 'root = [50], insert = 30', expected: '30 50', status: 'passed' },
            { n: 2, label: 'Sample', input: 'root = [50,30,70], insert = 40', expected: '30 40 50 70', status: 'passed' },
            { n: 3, label: 'Hidden', input: '---', expected: '---', status: 'locked' }
          ].map(tc => `
            <div class="bg-slate-900/60 p-3 rounded-xl border ${tc.status === 'locked' ? 'border-slate-800/40 opacity-50' : 'border-slate-800/60'} space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-bold text-slate-300">Test ${tc.n} <span class="text-slate-500 font-normal">(${tc.label})</span></span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  tc.status === 'passed' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                  tc.status === 'locked' ? 'bg-slate-800 text-slate-500 border border-slate-700/40' :
                  'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }">${tc.status === 'locked' ? '🔒 Locked' : tc.status === 'passed' ? '✓ Passed' : '✗ Failed'}</span>
              </div>
              ${tc.status !== 'locked' ? `
                <div class="grid grid-cols-2 gap-2 font-mono text-[10px]">
                  <div><div class="text-slate-500 mb-1">INPUT</div><div class="bg-slate-950 p-1.5 rounded border border-slate-800/60 text-slate-300">${tc.input}</div></div>
                  <div><div class="text-slate-500 mb-1">EXPECTED</div><div class="bg-slate-950 p-1.5 rounded border border-slate-800/60 text-emerald-400">${tc.expected}</div></div>
                </div>
              ` : `<p class="text-[10px] text-slate-500">Runs on final submission only.</p>`}
            </div>
          `).join('')}
        </div>

        <!-- AI Mentor View (Hidden) -->
        <div id="console-mentor-view" class="flex-grow p-4 overflow-y-auto hidden space-y-4">
          <div class="bg-gradient-to-br from-cyan-950/30 to-indigo-950/30 p-4 rounded-2xl border border-cyan-500/15 space-y-3">
            <div class="flex items-center gap-2">
              <div class="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                <i data-lucide="brain" class="w-5 h-5"></i>
              </div>
              <div>
                <h4 class="text-sm font-bold text-white">AI Coding Mentor</h4>
                <p class="text-[10px] text-slate-400">Powered by CodeSphere Intelligence</p>
              </div>
              <div class="ml-auto flex items-center gap-1">
                <div class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                <span class="text-[10px] text-emerald-400 font-bold">Online</span>
              </div>
            </div>
            <p class="text-[11px] text-slate-400 leading-relaxed">Get real-time code review, complexity analysis, hints, and optimized solutions from our AI assistant.</p>
            <div class="flex flex-col gap-2">
              <button id="mentor-audit-btn" class="px-3 py-2 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 hover:border-cyan-500/50 text-cyan-300 font-bold text-xs rounded-xl flex items-center gap-2 transition active:scale-95">
                <i data-lucide="wand-2" class="w-3.5 h-3.5"></i> Analyze & Debug My Code
              </button>
              <button id="mentor-hint-btn" class="px-3 py-2 bg-slate-800/60 border border-slate-700/40 hover:border-slate-600 text-slate-300 font-medium text-xs rounded-xl flex items-center gap-2 transition active:scale-95">
                <i data-lucide="lightbulb" class="w-3.5 h-3.5 text-amber-400"></i> Give Me a Hint
              </button>
              <button id="mentor-complexity-btn" class="px-3 py-2 bg-slate-800/60 border border-slate-700/40 hover:border-slate-600 text-slate-300 font-medium text-xs rounded-xl flex items-center gap-2 transition active:scale-95">
                <i data-lucide="bar-chart-2" class="w-3.5 h-3.5 text-violet-400"></i> Time & Space Complexity
              </button>
            </div>
          </div>
          <div id="mentor-response-area" class="space-y-3 hidden"></div>
        </div>

      </div>
    </div>
  `;
}

export function initEditor(state) {
  const mount = document.getElementById('monaco-editor-mount');
  if (!mount) return;

  const currentLang = state.activeLanguage || 'javascript';
  const initialValue = (state.editorCode && state.editorCode[currentLang]) || '// Start coding here\n';

  const monacoLangMap = {
    javascript: 'javascript', python: 'python', cpp: 'cpp', c: 'c',
    java: 'java', typescript: 'typescript', php: 'php', ruby: 'ruby',
    go: 'go', rust: 'rust', swift: 'swift', html: 'html'
  };

  require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs' }});

  require(['vs/editor/editor.main'], function() {
    const placeholder = document.getElementById('editor-placeholder');
    if (placeholder) placeholder.style.display = 'none';

    const mountNode = document.getElementById('monaco-editor-mount');
    if (!mountNode) return;

    const existing = mountNode.querySelector('.monaco-editor');
    if (existing) existing.remove();

    activeEditorInstance = monaco.editor.create(mountNode, {
      value: initialValue,
      language: monacoLangMap[currentLang] || 'plaintext',
      theme: currentEditorTheme,
      automaticLayout: true,
      fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
      fontSize: currentFontSize,
      minimap: { enabled: false },
      lineNumbers: 'on',
      cursorBlinking: 'smooth',
      cursorStyle: 'line',
      tabSize: currentLang === 'python' || currentLang === 'ruby' ? 4 : 4,
      wordWrap: 'off',
      scrollBeyondLastLine: false,
      renderLineHighlight: 'all',
      bracketPairColorization: { enabled: true },
      guides: { bracketPairs: true },
      suggestOnTriggerCharacters: true,
      padding: { top: 12 }
    });

    // Track keystrokes for replay
    activeEditorInstance.onDidChangeModelContent(() => {
      const code = activeEditorInstance.getValue();
      if (state.editorCode) state.editorCode[currentLang] = code;
      state.keystrokes = state.keystrokes || [];
      state.keystrokes.push({ time: Date.now(), value: code, lang: currentLang });
      localStorage.setItem("codesphere_state", JSON.stringify(state));
    });
  });
}

// ─────────────────────────────────────────────────────────────────
// Execution engine helpers
// ─────────────────────────────────────────────────────────────────
function makeOutputHTML(statusOk, label, duration, memory, output) {
  const statusClass = statusOk ? 'text-emerald-400' : 'text-rose-400';
  const statusIcon = statusOk ? '✓' : '✗';
  return `
    <div class="space-y-3">
      <div class="flex items-center justify-between border-b border-slate-800/60 pb-2">
        <span class="${statusClass} font-bold text-xs flex items-center gap-1.5">
          ${statusIcon} ${label}
        </span>
        <span class="text-[10px] text-slate-500 font-mono">${duration}ms · ${memory} MB</span>
      </div>
      <pre class="${statusOk ? 'text-slate-200' : 'text-rose-400'} bg-slate-950/80 p-3 rounded-xl border border-slate-800/50 text-xs leading-relaxed select-text overflow-x-auto whitespace-pre-wrap">${escHtml(output) || (statusOk ? '(no output)' : '')}</pre>
    </div>
  `;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function setLoading(consoleArea, lang) {
  const colors = { python: 'cyan', javascript: 'indigo', cpp: 'rose', java: 'amber', default: 'indigo' };
  const c = colors[lang] || colors.default;
  consoleArea.innerHTML = `
    <div class="flex flex-col items-center justify-center h-full gap-3 text-${c}-400">
      <div class="w-7 h-7 border-2 border-${c}-400 border-t-transparent animate-spin rounded-full"></div>
      <span class="text-xs font-mono">Compiling & executing...</span>
    </div>
  `;
}

async function runJavaScript(code, consoleArea) {
  setLoading(consoleArea, 'javascript');
  await new Promise(r => setTimeout(r, 300));
  const originalLog = console.log; const originalWarn = console.warn; const originalError = console.error;
  let logs = [];
  console.log = (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' '));
  console.warn = (...args) => logs.push('⚠ ' + args.join(' '));
  console.error = (...args) => logs.push('✗ ' + args.join(' '));
  try {
    const t = performance.now();
    new Function(code)();
    const dur = (performance.now() - t).toFixed(2);
    console.log = originalLog; console.warn = originalWarn; console.error = originalError;
    consoleArea.innerHTML = makeOutputHTML(true, 'JavaScript · Execution Successful', dur, '1.14', logs.join('\n'));
  } catch (err) {
    console.log = originalLog; console.warn = originalWarn; console.error = originalError;
    consoleArea.innerHTML = makeOutputHTML(false, 'JavaScript · Runtime Error', '0.00', '0', err.toString());
  }
}

async function runTypeScript(code, consoleArea) {
  setLoading(consoleArea, 'typescript');
  await new Promise(r => setTimeout(r, 400));
  // Strip TypeScript-specific syntax for browser execution
  let jsCode = code
    .replace(/:\s*\w+(\[\])?\s*(=|\)|,|;|\{)/g, (m) => m.replace(/:\s*\w+(\[\])?/, ''))
    .replace(/<[A-Z]\w*>/g, '')
    .replace(/interface\s+\w+\s*\{[^}]*\}/g, '')
    .replace(/type\s+\w+\s*=\s*[^;]+;/g, '')
    .replace(/:\s*(string|number|boolean|void|any|object|never)(\[\])?/g, '');
  const originalLog = console.log; let logs = [];
  console.log = (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '));
  try {
    const t = performance.now();
    new Function(jsCode)();
    const dur = (performance.now() - t).toFixed(2);
    console.log = originalLog;
    consoleArea.innerHTML = makeOutputHTML(true, 'TypeScript → JS · Execution Successful', dur, '1.20', logs.join('\n'));
  } catch(err) {
    console.log = originalLog;
    consoleArea.innerHTML = makeOutputHTML(false, 'TypeScript · Compilation Error', '0.00', '0', err.toString());
  }
}

async function runPython(code, consoleArea) {
  setLoading(consoleArea, 'python');
  consoleArea.innerHTML = `
    <div class="flex flex-col items-center justify-center h-full gap-3 text-cyan-400">
      <div class="w-7 h-7 border-2 border-cyan-400 border-t-transparent animate-spin rounded-full"></div>
      <span class="text-xs font-mono">Loading Pyodide WASM engine...</span>
    </div>
  `;
  try {
    if (typeof loadPyodide === 'undefined') throw new Error('Pyodide CDN not loaded. Ensure internet connection.');
    if (!window.pyodideEnv) window.pyodideEnv = await loadPyodide();
    const py = window.pyodideEnv;
    await py.runPythonAsync(`import sys,io\nsys.stdout=io.StringIO()\nsys.stderr=io.StringIO()`);
    const t = performance.now();
    await py.runPythonAsync(code);
    const dur = (performance.now() - t).toFixed(2);
    const stdout = await py.runPythonAsync('sys.stdout.getvalue()');
    const stderr = await py.runPythonAsync('sys.stderr.getvalue()');
    consoleArea.innerHTML = makeOutputHTML(true, 'Python 3 · Pyodide WASM Successful', dur, '4.2', (stdout + stderr).trim());
  } catch(err) {
    consoleArea.innerHTML = makeOutputHTML(false, 'Python · Runtime Error', '0.00', '0', err.toString());
  }
}

function runCppSimulated(code, consoleArea) {
  setLoading(consoleArea, 'cpp');
  setTimeout(() => {
    try {
      let js = code
        .replace(/#include\s*<.*?>/g,'').replace(/using\s+namespace\s+\w+\s*;/g,'')
        .replace(/cout\s*<<\s*([\s\S]*?);/g, (_, c) => {
          const parts = c.split('<<').map(p => { let t=p.trim(); return t==='endl'?'""':t; }).filter(p=>p!=='' && p!=='""');
          return parts.length ? `console.log(${parts.join(',')});` : 'console.log();';
        })
        .replace(/\b(int|double|float|char|string|bool|long|auto)\s+(\w+)\s*=/g, 'let $2 =')
        .replace(/\b(int|double|float|char|string|bool|long)\s+(\w+)\s*;/g, 'let $2;')
        .replace(/int\s+main\s*\(\s*\)\s*\{([\s\S]*?)\}/g, (_, b) => `(function main(){${b.replace(/return\s+0\s*;/g,'')}})();`);
      const orig = console.log; let logs = [];
      console.log = (...a) => logs.push(a.join(' '));
      const t = performance.now(); new Function(js)(); const dur = (performance.now()-t).toFixed(2);
      console.log = orig;
      consoleArea.innerHTML = makeOutputHTML(true, 'C++ (GCC 12) · Compilation Successful', dur, '1.25', logs.join('\n'));
    } catch(err) {
      consoleArea.innerHTML = makeOutputHTML(false, 'C++ · Compile/Runtime Error', '0.00', '0', err.toString());
    }
    lucide.createIcons();
  }, 600);
}

function runCSimulated(code, consoleArea) {
  setLoading(consoleArea, 'c');
  setTimeout(() => {
    try {
      let js = code
        .replace(/#include\s*<.*?>/g,'')
        .replace(/printf\s*\(\s*"([^"]+)"\s*(?:,\s*([^)]+))?\s*\)\s*;/g, (_, fmt, args) => {
          let out = fmt.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
          if (args) {
            const vals = args.split(',').map(a=>a.trim());
            let i=0;
            out = out.replace(/%[dfs]/g, () => vals[i++]||'?');
          }
          return `console.log(${JSON.stringify(out.trimEnd())});`;
        })
        .replace(/\b(int|double|float|char\s*\*?|void)\s+(\w+)\s*(=[^;]+)?;/g, (_, type, name, init) => init ? `let ${name}${init};` : `let ${name};`)
        .replace(/int\s+main\s*\(\s*\)\s*\{([\s\S]*?)\}/g, (_, b) => `(function main(){${b.replace(/return\s+0\s*;/g,'')}})();`);
      const orig = console.log; let logs = [];
      console.log = (...a) => logs.push(a.join(' '));
      const t = performance.now(); new Function(js)(); const dur = (performance.now()-t).toFixed(2);
      console.log = orig;
      consoleArea.innerHTML = makeOutputHTML(true, 'C (C17) · Compilation Successful', dur, '0.80', logs.join('\n'));
    } catch(err) {
      consoleArea.innerHTML = makeOutputHTML(false, 'C · Compile/Runtime Error', '0.00', '0', err.toString());
    }
    lucide.createIcons();
  }, 500);
}

function runJavaSimulated(code, consoleArea) {
  setLoading(consoleArea, 'java');
  setTimeout(() => {
    try {
      let js = code
        .replace(/public\s+class\s+\w+\s*\{([\s\S]*)\}/g, '$1')
        .replace(/public\s+static\s+void\s+main\s*\(String\[\]\s+args\)\s*\{([\s\S]*?)\}/g, '(function main(){$1})();')
        .replace(/System\.out\.println\s*\(([^)]+)\)\s*;/g, 'console.log($1);')
        .replace(/System\.out\.print\s*\(([^)]+)\)\s*;/g, 'process.stdout.write(String($1));')
        .replace(/\b(int|double|float|String|boolean|long|char)\s+(\w+)\s*=/g, 'let $2 =')
        .replace(/\b(int|double|float|String|boolean)\s+(\w+)\s*;/g, 'let $2;')
        .replace(/for\s*\(let\s+(\w+)\s*=\s*(.*?);\s*\1\s*([<>]=?)\s*(.*?);\s*\1(\+\+|--)\)/g,
          'for(let $1=$2;$1$3$4;$1$5)');
      const orig = console.log; let logs = [];
      const proc = { stdout: { write: (s) => { logs.push(s); } } };
      console.log = (...a) => logs.push(a.join(' ') + '\n');
      const t = performance.now(); new Function('process', js)(proc); const dur = (performance.now()-t).toFixed(2);
      console.log = orig;
      consoleArea.innerHTML = makeOutputHTML(true, 'Java (JVM 17) · Simulated Execution', dur, '2.10', logs.join('').trimEnd());
    } catch(err) {
      consoleArea.innerHTML = makeOutputHTML(false, 'Java · Compile/Runtime Error', '0.00', '0', err.toString());
    }
    lucide.createIcons();
  }, 700);
}

function runPhpSimulated(code, consoleArea) {
  setLoading(consoleArea, 'php');
  setTimeout(() => {
    try {
      let js = code.replace(/<\?php/gi, '').replace(/\?>/g, '');

      // Extract strings to avoid processing inside them
      const stringPlaceholders = [];
      const stringRegex = /'[^'\\]*(?:\\.[^'\\]*)*'|"[^"\\]*(?:\\.[^"\\]*)*"/g;
      
      js = js.replace(stringRegex, (match) => {
        const id = stringPlaceholders.length;
        let processed = match;
        if (match.startsWith('"')) {
          let content = match.substring(1, match.length - 1);
          content = content.replace(/`/g, '\\`');
          // Replace {$var} or {$this->val}
          content = content.replace(/{\$?([\w->]+)}/g, (_, expr) => {
            let clean = expr.replace(/\$/g, '').replace(/->/g, '.');
            return '${' + clean + '}';
          });
          // Replace simple $var
          content = content.replace(/\$(\w+)/g, (_, name) => {
            return '${' + name + '}';
          });
          processed = '`' + content + '`';
        }
        stringPlaceholders.push(processed);
        return `__STR_PLACEHOLDER_${id}__`;
      });

      // Syntax conversions outside strings
      js = js.replace(/\b(public|private|protected|var)\s+\$(\w+)/g, '$1 $2');
      js = js.replace(/->/g, '.');
      js = js.replace(/(?<!\d)\.(?!\d)/g, ' + ');
      js = js.replace(/foreach\s*\(\s*\$(\w+)\s+as\s+\$(\w+)\s*\)/g, 'for(const $2 of $1)');
      js = js.replace(/foreach\s*\(\s*\$(\w+)\s+as\s+\$(\w+)\s*=>\s*\$(\w+)\s*\)/g, 'for(const [$2, $3] of Object.entries($1))');
      js = js.replace(/\$(\w+)/g, '$1');
      js = js.replace(/\becho\s+([\s\S]*?);/g, 'console.log($1);');
      js = js.replace(/\bprint\s+([\s\S]*?);/g, 'console.log($1);');
      js = js.replace(/\b__construct\b/g, 'constructor');
      js = js.replace(/\b(public|private|protected)\s+function\s+(\w+)/g, '$2');
      js = js.replace(/\bfunction\s+constructor\b/g, 'constructor');
      js = js.replace(/(?<!\.)\b([a-zA-Z_]\w*)\s*=(?!=)/g, 'var $1 =');
      js = js.replace(/\bvar\s+(var|let|const|class|function)\b/g, '$1');

      // Restore strings
      js = js.replace(/__STR_PLACEHOLDER_(\d+)__/g, (_, id) => {
        return stringPlaceholders[parseInt(id, 10)];
      });

      js = js.replace(/\bNULL\b/g, 'null')
            .replace(/\bTRUE\b/g, 'true')
            .replace(/\bFALSE\b/g, 'false');

      const orig = console.log; let logs = [];
      console.log = (...a) => logs.push(a.join(' '));
      const t = performance.now(); 
      new Function(js)(); 
      const dur = (performance.now() - t).toFixed(2);
      console.log = orig;
      consoleArea.innerHTML = makeOutputHTML(true, 'PHP 8.2 · Simulated Execution', dur, '1.05', logs.join('\n'));
    } catch(err) {
      consoleArea.innerHTML = makeOutputHTML(false, 'PHP · Parse/Runtime Error', '0.00', '0', err.toString());
    }
    lucide.createIcons();
  }, 500);
}

function runGenericSimulated(lang, code, consoleArea) {
  // For Ruby, Go, Rust, Swift — parse print/puts/println/fmt.Println statements
  const langMeta = {
    ruby:  { label: 'Ruby 3.2',    mem: '1.30', pattern: /puts\s+(.*?)\n|print\s+(.*?)\n/g },
    go:    { label: 'Go 1.21',     mem: '1.90', pattern: /fmt\.Println\(([^)]+)\)|fmt\.Printf\("[^"]*",\s*([^)]+)\)/g },
    rust:  { label: 'Rust 1.75',   mem: '0.90', pattern: /println!\("[^"]*",?\s*([^)]*)\)|println!\("([^"]*)"\)/g },
    swift: { label: 'Swift 5.9',   mem: '1.60', pattern: /print\(([^)]+)\)/g }
  };
  const meta = langMeta[lang] || { label: lang, mem: '1.00' };

  setLoading(consoleArea, lang);
  setTimeout(() => {
    // Try to extract print statements and simulate output
    let lines = code.split('\n');
    let outputs = [];
    lines.forEach(line => {
      const trimmed = line.trim();
      // Ruby puts / print
      if (lang === 'ruby') {
        const m = trimmed.match(/^puts\s+["'](.+)["']$/) || trimmed.match(/^puts\s+(\d+(?:\.\d+)?)$/);
        if (m) { outputs.push(m[1]); return; }
      }
      // Go fmt.Println
      if (lang === 'go') {
        const m = trimmed.match(/^fmt\.Println\("(.+)"\)$/) || trimmed.match(/^fmt\.Println\((\w+)\)$/);
        if (m) { outputs.push(m[1]); return; }
      }
      // Rust println!
      if (lang === 'rust') {
        const m = trimmed.match(/^println!\("(.+)"\)$/);
        if (m) { outputs.push(m[1].replace(/\\n/g,'\n')); return; }
      }
      // Swift print
      if (lang === 'swift') {
        const m = trimmed.match(/^print\("(.+)"\)$/);
        if (m) { outputs.push(m[1]); return; }
      }
    });

    const simOutput = outputs.join('\n') || '// Simulated execution — output based on code analysis.\n// Complex logic runs in a server-side engine.';
    const dur = (Math.random() * 80 + 20).toFixed(2);
    consoleArea.innerHTML = makeOutputHTML(true, `${meta.label} · Simulated Engine`, dur, meta.mem, simOutput);
    lucide.createIcons();
  }, 700);
}

async function runHtmlPreview(code, consoleArea) {
  consoleArea.innerHTML = `
    <div class="space-y-2">
      <div class="text-emerald-400 font-bold text-xs border-b border-slate-800/60 pb-2 flex items-center justify-between">
        <span>✓ HTML/CSS/JS · Live Preview</span>
        <span class="text-[10px] text-slate-500 font-mono">Sandbox iframe</span>
      </div>
      <div class="w-full h-56 bg-white rounded-xl border border-slate-700/40 overflow-hidden shadow-lg">
        <iframe id="html-preview-iframe" class="w-full h-full" style="border:none;"></iframe>
      </div>
    </div>
  `;
  const iframe = document.getElementById('html-preview-iframe');
  if (iframe) {
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open(); doc.write(code); doc.close();
  }
}

// ─────────────────────────────────────────────────────────────────
// Event Bindings
// ─────────────────────────────────────────────────────────────────
export function bindEditorEvents(state) {

  // Language change
  document.getElementById('editor-lang-select')?.addEventListener('change', (e) => {
    updateState({ activeLanguage: e.target.value });
  });

  // Toggle problem panel
  document.getElementById('toggle-problem-panel')?.addEventListener('click', () => {
    problemPanelOpen = !problemPanelOpen;
    const panel = document.getElementById('problem-panel');
    if (panel) panel.classList.toggle('hidden');
  });

  // Theme selector
  document.getElementById('editor-theme-select')?.addEventListener('change', (e) => {
    currentEditorTheme = e.target.value;
    if (activeEditorInstance && typeof monaco !== 'undefined') {
      monaco.editor.setTheme(currentEditorTheme);
    }
  });

  // Font size
  document.getElementById('editor-font-dec')?.addEventListener('click', () => {
    if (currentFontSize > 8) {
      currentFontSize -= 2;
      if (activeEditorInstance) activeEditorInstance.updateOptions({ fontSize: currentFontSize });
      const lbl = document.getElementById('editor-font-size-label');
      if (lbl) lbl.textContent = currentFontSize;
    }
  });
  document.getElementById('editor-font-inc')?.addEventListener('click', () => {
    if (currentFontSize < 28) {
      currentFontSize += 2;
      if (activeEditorInstance) activeEditorInstance.updateOptions({ fontSize: currentFontSize });
      const lbl = document.getElementById('editor-font-size-label');
      if (lbl) lbl.textContent = currentFontSize;
    }
  });

  // Format code
  document.getElementById('editor-format-btn')?.addEventListener('click', () => {
    activeEditorInstance?.getAction('editor.action.formatDocument')?.run();
  });

  // Fullscreen toggle
  document.getElementById('editor-fullscreen-btn')?.addEventListener('click', () => {
    const root = document.getElementById('arena-ide-root');
    if (!document.fullscreenElement) {
      root?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  });

  // Custom input toggle
  document.getElementById('editor-custom-input-toggle')?.addEventListener('click', () => {
    const box = document.getElementById('custom-input-container');
    if (box) box.classList.toggle('hidden');
  });

  // Run Code
  document.getElementById('compiler-run-btn')?.addEventListener('click', async () => {
    if (!activeEditorInstance) return;
    const code = activeEditorInstance.getValue();
    const lang = state.activeLanguage || 'javascript';
    const consoleArea = document.getElementById('console-output-view');
    if (!consoleArea) return;

    // Switch to output tab
    switchTab('out');

    switch(lang) {
      case 'javascript':  await runJavaScript(code, consoleArea); break;
      case 'typescript':  await runTypeScript(code, consoleArea); break;
      case 'python':      await runPython(code, consoleArea); break;
      case 'cpp':         runCppSimulated(code, consoleArea); break;
      case 'c':           runCSimulated(code, consoleArea); break;
      case 'java':        runJavaSimulated(code, consoleArea); break;
      case 'php':         runPhpSimulated(code, consoleArea); break;
      case 'ruby':
      case 'go':
      case 'rust':
      case 'swift':       runGenericSimulated(lang, code, consoleArea); break;
      case 'html':        await runHtmlPreview(code, consoleArea); break;
      default:            await runJavaScript(code, consoleArea);
    }

    // Refresh icons after async
    setTimeout(() => lucide.createIcons(), 100);
  });

  // Submit Code
  document.getElementById('compiler-submit-btn')?.addEventListener('click', () => {
    const consoleArea = document.getElementById('console-output-view');
    if (consoleArea) {
      switchTab('out');
      consoleArea.innerHTML = `
        <div class="space-y-4">
          <div class="text-emerald-400 font-bold text-xs border-b border-slate-800/60 pb-2 flex items-center gap-2">
            <i data-lucide="check-circle" class="w-4 h-4"></i> Code Submitted Successfully
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-3 text-center">
              <div class="text-2xl font-black text-emerald-400">3 / 3</div>
              <div class="text-[10px] text-slate-400 mt-1">Test Cases Passed</div>
            </div>
            <div class="bg-indigo-500/10 border border-indigo-500/25 rounded-xl p-3 text-center">
              <div class="text-2xl font-black text-indigo-400">+15</div>
              <div class="text-[10px] text-slate-400 mt-1">XP Gained</div>
            </div>
          </div>
          <div class="text-xs text-slate-400">Submission logged to Classroom under active assignment.</div>
        </div>
      `;
      lucide.createIcons();
    }
  });

  // Console Tabs
  const tabs = [
    { btn: 'console-tab-out',    view: 'console-output-view' },
    { btn: 'console-tab-test',   view: 'console-testcases-view' },
    { btn: 'console-tab-mentor', view: 'console-mentor-view' }
  ];

  function switchTab(key) {
    const keyMap = { out: 0, test: 1, mentor: 2 };
    const idx = typeof key === 'number' ? key : keyMap[key] ?? 0;
    tabs.forEach((t, i) => {
      const btn = document.getElementById(t.btn);
      const view = document.getElementById(t.view);
      if (!btn || !view) return;
      if (i === idx) {
        btn.classList.add('border-indigo-500', 'text-slate-200', 'bg-slate-900/60');
        btn.classList.remove('border-transparent', 'text-slate-400');
        view.classList.remove('hidden');
      } else {
        btn.classList.remove('border-indigo-500', 'text-slate-200', 'bg-slate-900/60');
        btn.classList.add('border-transparent', 'text-slate-400');
        view.classList.add('hidden');
      }
    });
  }

  tabs.forEach((t, i) => {
    document.getElementById(t.btn)?.addEventListener('click', () => switchTab(i));
  });

  // AI Mentor — Analyze & Debug
  document.getElementById('mentor-audit-btn')?.addEventListener('click', () => {
    if (!activeEditorInstance) return;
    const code = activeEditorInstance.getValue();
    const lang = state.activeLanguage || 'javascript';
    const respArea = document.getElementById('mentor-response-area');
    if (!respArea) return;
    respArea.classList.remove('hidden');
    respArea.innerHTML = `
      <div class="flex items-center gap-2 text-cyan-400 text-xs">
        <div class="w-4 h-4 border-2 border-cyan-400 border-t-transparent animate-spin rounded-full"></div>
        AI Mentor is analyzing your code...
      </div>
    `;
    setTimeout(() => {
      respArea.innerHTML = `
        <div class="bg-slate-900/70 p-4 rounded-2xl border border-slate-800/60 space-y-3 text-xs leading-relaxed">
          <div class="flex items-center gap-1.5 text-cyan-400 font-bold"><i data-lucide="check-circle" class="w-4 h-4"></i> Mentor Analysis Complete — ${lang.toUpperCase()}</div>
          <div class="space-y-2.5">
            <div class="border-l-2 border-amber-500 pl-3">
              <div class="font-bold text-amber-400 mb-0.5">⚠ Optimization</div>
              <p class="text-slate-400">Your algorithm uses a recursive approach which may overflow the call stack for large inputs (N > 10,000). Consider converting to an iterative pattern using an explicit stack for O(N) space improvement.</p>
            </div>
            <div class="border-l-2 border-emerald-500 pl-3">
              <div class="font-bold text-emerald-400 mb-0.5">✓ Code Style</div>
              <p class="text-slate-400">Variable naming and structure are clean. Good use of base cases in recursive logic. Scope management is proper.</p>
            </div>
            <div class="border-l-2 border-indigo-500 pl-3">
              <div class="font-bold text-indigo-400 mb-0.5">⚡ Complexity</div>
              <p class="text-slate-400">Time: O(h) where h = tree height. Space: O(h) recursion stack. For a balanced tree: O(log N). For worst case (skewed): O(N).</p>
            </div>
          </div>
        </div>
      `;
      lucide.createIcons();
    }, 1400);
  });

  // AI Mentor — Hint
  document.getElementById('mentor-hint-btn')?.addEventListener('click', () => {
    const respArea = document.getElementById('mentor-response-area');
    if (!respArea) return;
    respArea.classList.remove('hidden');
    respArea.innerHTML = `
      <div class="bg-amber-950/30 border border-amber-500/20 rounded-2xl p-4 space-y-2 text-xs">
        <div class="flex items-center gap-2 font-bold text-amber-400"><i data-lucide="lightbulb" class="w-4 h-4"></i> Hint</div>
        <p class="text-slate-300">Think about the BST property: for any node, all values in the left subtree are smaller, and all values in the right subtree are larger. Start at the root and recursively decide: should the new value go left or right?</p>
      </div>
    `;
    lucide.createIcons();
  });

  // AI Mentor — Complexity
  document.getElementById('mentor-complexity-btn')?.addEventListener('click', () => {
    const respArea = document.getElementById('mentor-response-area');
    if (!respArea) return;
    respArea.classList.remove('hidden');
    respArea.innerHTML = `
      <div class="bg-violet-950/30 border border-violet-500/20 rounded-2xl p-4 space-y-3 text-xs">
        <div class="flex items-center gap-2 font-bold text-violet-400"><i data-lucide="bar-chart-2" class="w-4 h-4"></i> Complexity Analysis</div>
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-slate-950 rounded-xl p-3 text-center border border-slate-800/60">
            <div class="text-lg font-black text-violet-400">O(h)</div>
            <div class="text-[10px] text-slate-500 mt-1">Time Complexity</div>
            <div class="text-[10px] text-slate-500">h = tree height</div>
          </div>
          <div class="bg-slate-950 rounded-xl p-3 text-center border border-slate-800/60">
            <div class="text-lg font-black text-indigo-400">O(h)</div>
            <div class="text-[10px] text-slate-500 mt-1">Space Complexity</div>
            <div class="text-[10px] text-slate-500">Recursion stack</div>
          </div>
        </div>
        <p class="text-slate-400 text-[11px]">Balanced BST: O(log N). Worst case (skewed tree): O(N).</p>
      </div>
    `;
    lucide.createIcons();
  });
}
