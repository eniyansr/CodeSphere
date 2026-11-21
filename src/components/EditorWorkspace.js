// CodeSphere Pro — Adaptive Practice Arena with Sequential RNN Skill Predictor (React Edition)
import React, { useState, useEffect, useRef } from 'https://esm.sh/react@18.2.0';
import Editor from 'https://esm.sh/@monaco-editor/react@4.6.0?deps=react@18.2.0,react-dom@18.2.0';
import { TRANSLATIONS, html, useAppState } from '../state.js';
import { executeCode, STARTER_CODE } from '../services/compiler-service.js';

export function EditorWorkspace() {
  const { state, updateState } = useAppState();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.en;
  const activeLang = state.activeLanguage || 'javascript';
  const currentCode = (state.editorCode && state.editorCode[activeLang]) || '';

  // ─── Supported Verified Compiler Runtimes ───────────────────────────────────
  const languagesList = [
    { id: 'javascript', label: 'JavaScript',   badge: 'V8 Sandbox',      ext: 'js',   monaco: 'javascript' },
    { id: 'python',     label: 'Python 3',      badge: 'Pyodide WASM',    ext: 'py',   monaco: 'python'      },
    { id: 'php',        label: 'PHP',           badge: 'PHP 8.3',         ext: 'php',  monaco: 'php'         },
    { id: 'cpp',        label: 'C++',           badge: 'GCC 14',          ext: 'cpp',  monaco: 'cpp'         },
    { id: 'c',          label: 'C',             badge: 'C17',             ext: 'c',    monaco: 'c'           },
    { id: 'java',       label: 'Java',          badge: 'OpenJDK 22',      ext: 'java', monaco: 'java'        },
    { id: 'typescript', label: 'TypeScript',    badge: 'TS 5.6',          ext: 'ts',   monaco: 'typescript'  },
    { id: 'rust',       label: 'Rust',          badge: 'Rust 1.82',       ext: 'rs',   monaco: 'rust'        },
    { id: 'ruby',       label: 'Ruby',          badge: 'Ruby 4.0',        ext: 'rb',   monaco: 'ruby'        },
    { id: 'csharp',     label: 'C#',            badge: 'Mono .NET',       ext: 'cs',   monaco: 'csharp'      },
    { id: 'swift',      label: 'Swift',         badge: 'Swift 6.0',       ext: 'swift',monaco: 'swift'       },
    { id: 'html',       label: 'HTML/CSS/JS',   badge: 'Live Preview',    ext: 'html', monaco: 'html'        },
  ];

  const activeLangMeta = languagesList.find(l => l.id === activeLang) || languagesList[0];

  // ─── Adaptive RNN Knowledge & Competency Model ──────────────────────────────
  const skillDomains = [
    { domain: 'Arrays & Hashing', score: 88, status: 'Mastered', color: '#10B981' },
    { domain: 'Recursion & Stacks', score: 58, status: 'Developing', color: '#F59E0B' },
    { domain: 'Binary Trees & Graphs', score: 34, status: 'Weakest (RNN Target)', color: '#E11D48' },
    { domain: 'Dynamic Programming', score: 46, status: 'Developing', color: '#6366F1' }
  ];

  // Adaptive Curriculum Path
  const adaptiveProblems = [
    {
      id: 'bst-insert',
      title: '1. Binary Search Tree Insertion',
      difficulty: 'Medium',
      domain: 'Binary Trees',
      description: 'Implement a function to insert a value into a Binary Search Tree and return the modified tree. The tree must strictly preserve BST invariants (left < root < right).',
      examples: [
        { input: 'root = [50], val = 30', output: '[50, 30]', explanation: '30 < 50, so it inserts as the left child.' },
        { input: 'root = [50, 30], val = 70', output: '[50, 30, 70]', explanation: '70 > 50, so it inserts as the right child.' }
      ],
      constraints: ['Nodes in range [0, 10^4]', '-10^8 <= val <= 10^8', 'All values in BST are unique.'],
      tags: ['Binary Tree', 'Recursion', 'BST Invariants'],
      rnnRecommendation: false
    },
    {
      id: 'lca-bst',
      title: '2. Lowest Common Ancestor in BST',
      difficulty: 'Medium',
      domain: 'Binary Trees',
      description: 'Given a binary search tree (BST), find the lowest common ancestor (LCA) node of two given nodes in the BST. According to the definition of LCA on Wikipedia: "The lowest common ancestor is defined between two nodes p and q as the lowest node in T that has both p and q as descendants."',
      examples: [
        { input: 'root = [6,2,8,0,4,7,9], p = 2, q = 8', output: '6', explanation: 'The LCA of nodes 2 and 8 is 6.' }
      ],
      constraints: ['Number of nodes in tree is in range [2, 10^5].', '-10^9 <= Node.val <= 10^9', 'p and q are different and exist in BST.'],
      tags: ['Tree Traversal', 'BST Ancestry', 'RNN Recommended'],
      rnnRecommendation: true // Target problem picked by RNN
    },
    {
      id: 'balance-bst',
      title: '3. Balance an Unbalanced BST',
      difficulty: 'Hard',
      domain: 'Binary Trees',
      description: 'Given the root of a binary search tree, return a balanced binary search tree with the same node values. If there is more than one answer, return any of them.',
      examples: [
        { input: 'root = [1,null,2,null,3,null,4]', output: '[2,1,3,null,null,null,4]' }
      ],
      constraints: ['Number of nodes in tree is in range [1, 10^4].', '1 <= Node.val <= 10^5'],
      tags: ['Inorder Traversal', 'Tree Balancing', 'Next Tier'],
      rnnRecommendation: false
    }
  ];

  const [selectedProblemIndex, setSelectedProblemIndex] = useState(0);
  const activeProblem = adaptiveProblems[selectedProblemIndex];

  // Editor and Console State
  const [editorTheme, setEditorTheme] = useState('vs');
  const [activeConsoleTab, setActiveConsoleTab] = useState('out');
  const [consoleStatus, setConsoleStatus] = useState('empty');
  const [consoleOutput, setConsoleOutput] = useState('');
  const [consoleDuration, setConsoleDuration] = useState('0.00');
  const [executionEngine, setExecutionEngine] = useState('');
  const [showSkillRadar, setShowSkillRadar] = useState(false);

  const editorRef = useRef(null);

  // Initialize starter code on language switch
  useEffect(() => {
    if (!state.editorCode || !state.editorCode[activeLang]) {
      const updatedCode = { ...(state.editorCode || {}) };
      updatedCode[activeLang] = STARTER_CODE[activeLang] || `// ${activeLang}\n// Start coding here`;
      updateState({ editorCode: updatedCode });
    }
  }, [activeLang]);

  const handleEditorChange = (value) => {
    const updatedCode = { ...(state.editorCode || {}) };
    updatedCode[activeLang] = value;
    updateState({ editorCode: updatedCode });
  };

  const runCode = async () => {
    if (!editorRef.current) return;
    const code = editorRef.current.getValue();
    setActiveConsoleTab('out');
    setConsoleStatus('loading');
    setConsoleOutput('Executing in verified isolation sandbox...');

    try {
      const res = await executeCode({ language: activeLang, code });
      setConsoleOutput(res.output);
      setConsoleDuration(res.duration);
      setExecutionEngine(res.engine);
      setConsoleStatus(res.success ? 'success' : 'error');
    } catch (err) {
      setConsoleOutput(err.message || 'Execution error');
      setConsoleStatus('error');
    }
  };

  return html`
    <div id="arena-ide-root" className="flex-grow flex flex-col min-h-0 bg-[#F4F7FE] p-3 md:p-5 overflow-hidden">
      
      <!-- Top Action Bar with RNN Skill Suggestion Banner -->
      <div className="bg-white rounded-2xl border border-[#D5DEF2] p-3.5 mb-3 flex flex-wrap items-center justify-between gap-3"
           style=${{ boxShadow: '0 4px 0 #D5DEF2, 0 10px 16px -6px rgba(22,33,62,0.1)' }}>
        
        <div className="flex items-center gap-3">
          
          <!-- Runtime Selector -->
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#566180]">Runtime:</span>
            <select
              value=${activeLang}
              onChange=${e => updateState({ activeLanguage: e.target.value })}
              className="bg-[#F0F4FD] border border-[#CBD5EE] text-[#16213E] font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
            >
              ${languagesList.map(l => html`
                <option key=${l.id} value=${l.id}>${l.label} (${l.badge})</option>
              `)}
            </select>
          </div>

          <!-- Skill Radar Toggle -->
          <button
            onClick=${() => setShowSkillRadar(!showSkillRadar)}
            className=${`chip text-xs px-3 py-1.5 flex items-center gap-1.5 font-bold ${
              showSkillRadar ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'text-[#16213E]'
            }`}
          >
            <span>🧠</span>
            <span>RNN Skill Radar</span>
          </button>

          <!-- Light/Dark Monaco Toggle -->
          <button
            onClick=${() => setEditorTheme(editorTheme === 'vs' ? 'vs-dark' : 'vs')}
            className="chip text-xs px-2.5 py-1.5 hidden sm:flex items-center gap-1"
            title="Toggle theme"
          >
            <i data-lucide=${editorTheme === 'vs' ? 'moon' : 'sun'} className="w-3.5 h-3.5"></i>
            <span>${editorTheme === 'vs' ? 'Dark' : 'Light'}</span>
          </button>

        </div>

        <!-- Action Buttons -->
        <div className="flex items-center gap-2.5">
          <button
            onClick=${runCode}
            disabled=${consoleStatus === 'loading'}
            className="btn teal flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold"
            style=${{ width: 'auto' }}
          >
            <i data-lucide="play" className="w-3.5 h-3.5"></i>
            <span>${consoleStatus === 'loading' ? 'Running...' : 'Run Code'}</span>
          </button>
        </div>

      </div>

      <!-- Adaptive RNN Skill Matrix Dropdown/Drawer -->
      ${showSkillRadar && html`
        <div className="bg-white rounded-2xl border-2 border-indigo-200 p-4 mb-3 shadow-md animate-in slide-in-from-top-2 duration-150">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                SEQUENTIAL RNN WEAKNESS PREDICTOR
              </span>
              <span className="text-xs font-bold text-[#16213E]">
                Target: Binary Trees & Graphs (34% Proficiency)
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-600 font-bold">
              Dynamic Curriculum Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            ${skillDomains.map(d => html`
              <div key=${d.domain} className="bg-[#F0F4FD] p-2.5 rounded-xl border border-[#D5DEF2] text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-[#16213E]">${d.domain}</span>
                  <span className="font-mono font-bold" style=${{ color: d.color }}>${d.score}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#E5EDFD] rounded-full overflow-hidden mb-1">
                  <div className="h-full rounded-full" style=${{ width: `${d.score}%`, background: d.color }}></div>
                </div>
                <div className="text-[10px] text-[#566180] font-semibold">${d.status}</div>
              </div>
            `)}
          </div>
        </div>
      `}

      <!-- Adaptive Path Problem Switcher -->
      <div className="bg-white rounded-2xl border border-[#D5DEF2] p-2 mb-3 flex items-center gap-2 overflow-x-auto shadow-sm">
        <span className="text-[11px] font-mono font-bold text-[#566180] px-2 flex-shrink-0">
          Adaptive Sequence:
        </span>
        ${adaptiveProblems.map((prob, idx) => html`
          <button
            key=${prob.id}
            onClick=${() => setSelectedProblemIndex(idx)}
            className=${`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
              selectedProblemIndex === idx
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-[#F0F4FD] text-[#566180] hover:text-[#16213E]'
            }`}
          >
            <span>${prob.title}</span>
            ${prob.rnnRecommendation && html`
              <span className="text-[9px] font-mono font-black uppercase px-1 py-0.2 rounded bg-rose-500 text-white">
                RNN Pick
              </span>
            `}
          </button>
        `)}
      </div>

      <!-- Main Workspace Split Area -->
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
        
        <!-- Left: Problem Description Panel -->
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#D5DEF2] flex flex-col min-h-0 overflow-hidden"
             style=${{ boxShadow: '0 1px 0 #fff inset, 0 8px 0 -2px #CBD5EE' }}>
          
          <div className="p-3.5 border-b border-[#D5DEF2] bg-[#F8FAFD] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-extrabold text-[#16213E]">${activeProblem.title}</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                ${activeProblem.difficulty}
              </span>
            </div>
          </div>

          <div className="p-4 overflow-y-auto space-y-3.5 text-xs text-[#566180] leading-relaxed">
            <div>
              <h4 className="font-bold text-[#16213E] mb-1">Description</h4>
              <p>${activeProblem.description}</p>
            </div>

            <div>
              <h4 className="font-bold text-[#16213E] mb-2">Examples</h4>
              ${activeProblem.examples.map((ex, idx) => html`
                <div key=${idx} className="bg-[#F0F4FD] p-2.5 rounded-xl border border-[#D5DEF2] mb-2 font-mono text-[11px]">
                  <div><strong className="text-[#16213E]">Input:</strong> ${ex.input}</div>
                  <div><strong className="text-[#16213E]">Output:</strong> ${ex.output}</div>
                  ${ex.explanation && html`<div className="text-[#566180] mt-1 italic">${ex.explanation}</div>`}
                </div>
              `)}
            </div>

            <div>
              <h4 className="font-bold text-[#16213E] mb-1">Constraints</h4>
              <ul className="list-disc pl-4 space-y-0.5 font-mono text-[11px]">
                ${activeProblem.constraints.map((c, i) => html`<li key=${i}>${c}</li>`)}
              </ul>
            </div>

            <div className="pt-2 flex flex-wrap gap-1.5">
              ${activeProblem.tags.map(t => html`
                <span key=${t} className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold text-[10px] border border-indigo-100">
                  #${t}
                </span>
              `)}
            </div>
          </div>
        </div>

        <!-- Right: Editor & Console Split View -->
        <div className="lg:col-span-8 flex flex-col min-h-0 gap-3">
          
          <!-- Monaco Code Editor Box -->
          <div className="flex-grow bg-white rounded-2xl border border-[#D5DEF2] overflow-hidden flex flex-col min-h-[340px]"
               style=${{ boxShadow: '0 1px 0 #fff inset, 0 8px 0 -2px #CBD5EE' }}>
            
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#D5DEF2] bg-[#F8FAFD] text-xs font-bold text-[#566180]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                <span>main.${activeLangMeta.ext}</span>
              </div>
              <span className="font-mono text-[11px] text-[#566180]">
                ${activeLangMeta.label} · Isolated Compiler
              </span>
            </div>

            <div className="flex-grow w-full h-full">
              <${Editor}
                height="100%"
                language=${activeLangMeta.monaco}
                theme=${editorTheme}
                value=${currentCode}
                onChange=${handleEditorChange}
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

          <!-- Bottom: Console Output Drawer -->
          <div className="h-44 flex-shrink-0 bg-white rounded-2xl border border-[#D5DEF2] flex flex-col overflow-hidden"
               style=${{ boxShadow: '0 1px 0 #fff inset, 0 4px 0 #CBD5EE' }}>
            
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#D5DEF2] bg-[#EEF3FD]">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-700">
                <i data-lucide="terminal" className="w-3.5 h-3.5"></i>
                <span>Console Output</span>
              </div>

              <div className="flex items-center gap-3 text-[11px] font-mono text-[#566180]">
                ${executionEngine && html`<span>Engine: ${executionEngine}</span>`}
                ${consoleDuration && html`<span>Time: ${consoleDuration}s</span>`}
              </div>
            </div>

            <div className="flex-grow p-3 bg-[#FAFBFD] overflow-y-auto font-mono text-xs text-[#16213E] select-text">
              ${consoleStatus === 'loading' && html`
                <div className="flex items-center gap-2 text-indigo-600 font-bold">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                  <span>Executing code in isolated environment...</span>
                </div>
              `}
              ${consoleStatus !== 'loading' && html`
                <pre className="whitespace-pre-wrap">${consoleOutput || 'Click "Run Code" above to execute and view logs here.'}</pre>
              `}
            </div>
          </div>

        </div>

      </div>

    </div>
  `;
}
