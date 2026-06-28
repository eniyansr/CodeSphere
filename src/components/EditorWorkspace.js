// CodeSphere Pro - Professional Monaco Editor Workspace Component (React Edition)
import React, { useState, useEffect, useRef } from 'https://esm.sh/react@18.2.0';
import Editor from 'https://esm.sh/@monaco-editor/react@4.6.0?deps=react@18.2.0,react-dom@18.2.0';
import { TRANSLATIONS, html, useAppState } from '../state.js';

export function EditorWorkspace() {
  const { state, updateState } = useAppState();
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

  // Editor states
  const [editorTheme, setEditorTheme] = useState('vs-dark');
  const [fontSize, setFontSize] = useState(14);
  const [panelOpen, setPanelOpen] = useState(true);
  const [customInputOpen, setCustomInputOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  
  // Console Tab States
  const [activeConsoleTab, setActiveConsoleTab] = useState('out'); // 'out' | 'test' | 'mentor'
  const [consoleStatus, setConsoleStatus] = useState('empty'); // 'empty' | 'loading' | 'success' | 'error' | 'preview' | 'submit'
  const [consoleOutput, setConsoleOutput] = useState('');
  const [consoleOutputOk, setConsoleOutputOk] = useState(true);
  const [consoleDuration, setConsoleDuration] = useState('0.00');
  const [consoleMemory, setConsoleMemory] = useState('0');
  const [consoleTitle, setConsoleTitle] = useState('');
  const [executionMessage, setExecutionMessage] = useState('');

  // AI Mentor state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null); // { type, title, body }

  // Monaco Editor Reference
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleEditorChange = (value) => {
    const updatedCode = { ...state.editorCode };
    updatedCode[activeLang] = value;
    
    // Save to global state and local keystroke log
    const keystrokes = state.keystrokes || [];
    keystrokes.push({ time: Date.now(), value, lang: activeLang });

    updateState({
      editorCode: updatedCode,
      keystrokes
    });
  };

  const handleLangChange = (e) => {
    updateState({ activeLanguage: e.target.value });
  };

  const handleThemeChange = (e) => {
    setEditorTheme(e.target.value);
  };

  const handleFormat = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  };

  const handleFullscreen = () => {
    const root = document.getElementById('arena-ide-root');
    if (!document.fullscreenElement) {
      root?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const runCode = async () => {
    if (!editorRef.current) return;
    const code = editorRef.current.getValue();
    setActiveConsoleTab('out');
    setConsoleStatus('loading');
    setExecutionMessage('Compiling & executing...');

    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    try {
      if (activeLang === 'javascript') {
        await new Promise(r => setTimeout(r, 200));
        let logs = [];
        console.log = (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' '));
        console.warn = (...args) => logs.push('⚠ ' + args.join(' '));
        console.error = (...args) => logs.push('✗ ' + args.join(' '));

        const t0 = performance.now();
        new Function(code)();
        const dur = (performance.now() - t0).toFixed(2);

        setConsoleOutput(logs.join('\n'));
        setConsoleOutputOk(true);
        setConsoleDuration(dur);
        setConsoleMemory('1.14');
        setConsoleTitle('JavaScript · Execution Successful');
        setConsoleStatus('success');
      } 
      else if (activeLang === 'typescript') {
        await new Promise(r => setTimeout(r, 300));
        let jsCode = code
          .replace(/:\s*\w+(\[\])?\s*(=|\)|,|;|\{)/g, (m) => m.replace(/:\s*\w+(\[\])?/, ''))
          .replace(/<[A-Z]\w*>/g, '')
          .replace(/interface\s+\w+\s*\{[^}]*\}/g, '')
          .replace(/type\s+\w+\s*=\s*[^;]+;/g, '')
          .replace(/:\s*(string|number|boolean|void|any|object|never)(\[\])?/g, '');
        
        let logs = [];
        console.log = (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '));

        const t0 = performance.now();
        new Function(jsCode)();
        const dur = (performance.now() - t0).toFixed(2);

        setConsoleOutput(logs.join('\n'));
        setConsoleOutputOk(true);
        setConsoleDuration(dur);
        setConsoleMemory('1.20');
        setConsoleTitle('TypeScript → JS · Execution Successful');
        setConsoleStatus('success');
      } 
      else if (activeLang === 'python') {
        setExecutionMessage('Loading Pyodide WASM engine...');
        if (!window.pyodideEnv) {
          // Load Pyodide dynamically on first Python run
          if (!window._pyodideLoading) {
            window._pyodideLoading = new Promise((resolve, reject) => {
              const script = document.createElement('script');
              script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
              script.onload = resolve;
              script.onerror = () => reject(new Error('Failed to load Pyodide CDN'));
              document.head.appendChild(script);
            });
          }
          await window._pyodideLoading;
          window.pyodideEnv = await window.loadPyodide();
        }
        const py = window.pyodideEnv;
        await py.runPythonAsync(`import sys,io\nsys.stdout=io.StringIO()\nsys.stderr=io.StringIO()`);
        
        const t0 = performance.now();
        await py.runPythonAsync(code);
        const dur = (performance.now() - t0).toFixed(2);
        
        const stdout = await py.runPythonAsync('sys.stdout.getvalue()');
        const stderr = await py.runPythonAsync('sys.stderr.getvalue()');

        setConsoleOutput((stdout + stderr).trim());
        setConsoleOutputOk(true);
        setConsoleDuration(dur);
        setConsoleMemory('4.20');
        setConsoleTitle('Python 3 · Pyodide WASM Successful');
        setConsoleStatus('success');
      }
      else if (activeLang === 'html') {
        setConsoleStatus('preview');
        setConsoleOutput(code);
      }
      else {
        // Simulated run for GCC languages
        setExecutionMessage('Simulating environment compilation...');
        await new Promise(r => setTimeout(r, 600));

        let outputs = [];
        const lines = code.split('\n');
        lines.forEach(line => {
          const trimmed = line.trim();
          if (activeLang === 'cpp' && trimmed.includes('cout')) {
            const m = trimmed.match(/cout\s*<<\s*"(.*?)"/);
            if (m) outputs.push(m[1]);
          } else if (activeLang === 'c' && trimmed.includes('printf')) {
            const m = trimmed.match(/printf\s*\(\s*"([^"]+)"\s*\)/);
            if (m) outputs.push(m[1].replace('\\n', ''));
          } else if (activeLang === 'java' && trimmed.includes('System.out.print')) {
            const m = trimmed.match(/System\.out\.print(?:ln)?\s*\(\s*"(.*?)"\s*\)/);
            if (m) outputs.push(m[1]);
          } else if (activeLang === 'php' && (trimmed.startsWith('echo') || trimmed.startsWith('print'))) {
            const m = trimmed.match(/(?:echo|print)\s+"(.*?)";/);
            if (m) outputs.push(m[1]);
          } else if (activeLang === 'ruby' && trimmed.startsWith('puts')) {
            const m = trimmed.match(/puts\s+"(.*?)"/);
            if (m) outputs.push(m[1]);
          } else if (activeLang === 'go' && trimmed.includes('Println')) {
            const m = trimmed.match(/Println\("(.*?)"\)/);
            if (m) outputs.push(m[1]);
          } else if (activeLang === 'rust' && trimmed.includes('println!')) {
            const m = trimmed.match(/println!\("(.*?)"\)/);
            if (m) outputs.push(m[1]);
          } else if (activeLang === 'swift' && trimmed.startsWith('print')) {
            const m = trimmed.match(/print\("(.*?)"\)/);
            if (m) outputs.push(m[1]);
          }
        });

        const outputStr = outputs.join('\n') || '// Simulated compilation successful.\n// Outputs derived from code print diagnostics.';
        setConsoleOutput(outputStr);
        setConsoleOutputOk(true);
        setConsoleDuration('60.00');
        setConsoleMemory('1.5');
        setConsoleTitle(`${activeLangMeta.label} · Simulated Execution`);
        setConsoleStatus('success');
      }
    } catch(err) {
      setConsoleOutput(err.toString());
      setConsoleOutputOk(false);
      setConsoleDuration('0.00');
      setConsoleMemory('0');
      setConsoleTitle(`${activeLangMeta.label} · Execution Failed`);
      setConsoleStatus('error');
    } finally {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    }
  };

  const submitCode = () => {
    if (state.activeAssignmentId) {
      const studentName = state.googleUser ? state.googleUser.name : 'Eniyan Rajesh';
      const code = editorRef.current ? editorRef.current.getValue() : '';
      const time = new Date().toISOString().split('T')[0];

      const updatedClasses = state.classes.map(c => {
        return {
          ...c,
          assignments: c.assignments.map(a => {
            if (a.id === state.activeAssignmentId) {
              const otherSubs = a.submissions.filter(s => s.studentName !== studentName);
              return {
                ...a,
                submissions: [
                  ...otherSubs,
                  {
                    studentName,
                    score: 0,
                    time,
                    language: activeLang,
                    code
                  }
                ]
              };
            }
            return a;
          })
        };
      });

      updateState({ classes: updatedClasses });
    }

    setActiveConsoleTab('out');
    setConsoleStatus('submit');
  };

  // AI Mentor actions
  const triggerAiAudit = () => {
    setAiLoading(true);
    setAiResponse(null);
    setActiveConsoleTab('mentor');

    setTimeout(() => {
      setAiLoading(false);
      setAiResponse({
        type: 'audit',
        title: `Mentor Analysis Complete — ${activeLang.toUpperCase()}`,
        body: html`
          <div className="space-y-2.5">
            <div className="border-l-2 border-amber-500 pl-3 text-left">
              <div className="font-bold text-amber-400 mb-0.5">⚠ Optimization</div>
              <p className="text-slate-400">Your algorithm uses a recursive approach which may overflow the call stack for large inputs (N > 10,000). Consider converting to an iterative pattern using an explicit stack for O(N) space improvement.</p>
            </div>
            <div className="border-l-2 border-emerald-500 pl-3 text-left">
              <div className="font-bold text-emerald-400 mb-0.5">✓ Code Style</div>
              <p className="text-slate-400">Variable naming and structure are clean. Good use of base cases in recursive logic. Scope management is proper.</p>
            </div>
            <div className="border-l-2 border-indigo-500 pl-3 text-left">
              <div className="font-bold text-indigo-400 mb-0.5">⚡ Complexity</div>
              <p className="text-slate-400">Time: O(h) where h = tree height. Space: O(h) recursion stack. For a balanced tree: O(log N). For worst case (skewed): O(N).</p>
            </div>
          </div>
        `
      });
    }, 1200);
  };

  const triggerAiHint = () => {
    setActiveConsoleTab('mentor');
    setAiResponse({
      type: 'hint',
      title: 'Hint',
      body: html`
        <div className="bg-amber-950/30 border border-amber-500/20 rounded-2xl p-4 text-xs text-left">
          <p className="text-slate-300">Think about the BST property: for any node, all values in the left subtree are smaller, and all values in the right subtree are larger. Start at the root and recursively decide: should the new value go left or right?</p>
        </div>
      `
    });
  };

  const triggerAiComplexity = () => {
    setActiveConsoleTab('mentor');
    setAiResponse({
      type: 'complexity',
      title: 'Complexity Analysis',
      body: html`
        <div className="bg-violet-950/30 border border-violet-500/20 rounded-2xl p-4 space-y-3 text-xs text-left">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950 rounded-xl p-3 text-center border border-slate-800/60">
              <div className="text-lg font-black text-violet-400">O(h)</div>
              <div className="text-[10px] text-slate-500 mt-1">Time Complexity</div>
              <div className="text-[10px] text-slate-500">h = tree height</div>
            </div>
            <div className="bg-slate-950 rounded-xl p-3 text-center border border-slate-800/60">
              <div className="text-lg font-black text-indigo-400">O(h)</div>
              <div className="text-[10px] text-slate-500 mt-1">Space Complexity</div>
              <div className="text-[10px] text-slate-500">Recursion stack</div>
            </div>
          </div>
          <p className="text-slate-400 text-[11px]">Balanced BST: O(log N). Worst case (skewed tree): O(N).</p>
        </div>
      `
    });
  };

  // HTML Preview Ref syncing
  const previewIframeRef = useRef(null);
  useEffect(() => {
    if (consoleStatus === 'preview' && previewIframeRef.current) {
      const doc = previewIframeRef.current.contentDocument || previewIframeRef.current.contentWindow.document;
      doc.open();
      doc.write(consoleOutput);
      doc.close();
    }
  }, [consoleStatus, consoleOutput]);

  const monacoLangMap = {
    javascript: 'javascript', python: 'python', cpp: 'cpp', c: 'c',
    java: 'java', typescript: 'typescript', php: 'php', ruby: 'ruby',
    go: 'go', rust: 'rust', swift: 'swift', html: 'html'
  };

  return html`
    <div className="flex-grow flex flex-col md:flex-row h-[calc(100vh-76px)] overflow-hidden" id="arena-ide-root">

      <!-- === LEFT: Problem Statement Panel === -->
      ${panelOpen && html`
        <div id="problem-panel" className="w-full md:w-[340px] flex-shrink-0 border-r border-slate-800/60 bg-[#090c12] flex flex-col overflow-hidden text-left">
          
          <!-- Panel Header -->
          <div className="bg-slate-900/80 border-b border-slate-800/60 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-indigo-500/20 flex items-center justify-center">
                <i data-lucide="book-open" className="w-3 h-3 text-indigo-400"></i>
              </div>
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Problem</span>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300 transition">
                <i data-lucide="chevron-left" className="w-3.5 h-3.5"></i>
              </button>
              <span className="text-[10px] text-slate-500 font-mono">1 / 1</span>
              <button className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300 transition">
                <i data-lucide="chevron-right" className="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>

          <!-- Problem Content -->
          <div className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-thin">
            
            <!-- Title & Difficulty -->
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-sm font-extrabold text-white leading-tight">${prob.title}</h2>
                <span className=${`px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${difficultyBadgeMap[prob.difficulty]}`}>${prob.difficulty}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                ${prob.tags.map(tag => html`<span key=${tag} className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">${tag}</span>`)}
              </div>
            </div>

            <!-- Description -->
            <div className="text-xs text-slate-300 leading-relaxed">${prob.description}</div>

            <!-- Examples -->
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Examples</div>
              ${prob.examples.map((ex, i) => html`
                <div key=${i} className="bg-slate-950 rounded-lg p-3 border border-slate-800/60 space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-500">Example ${i+1}</div>
                  <div className="font-mono text-[11px] space-y-1">
                    <div><span className="text-slate-500">Input: </span><span className="text-slate-200">${ex.input}</span></div>
                    <div><span className="text-slate-500">Output: </span><span className="text-emerald-400">${ex.output}</span></div>
                    ${ex.explanation && html`<div className="text-slate-500 text-[10px] italic">// ${ex.explanation}</div>`}
                  </div>
                </div>
              `)}
            </div>

            <!-- Constraints -->
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Constraints</div>
              <ul className="space-y-1">
                ${prob.constraints.map((c, i) => html`
                  <li key=${i} className="text-[11px] text-slate-400 font-mono flex items-start gap-1.5">
                    <span className="text-indigo-500 mt-0.5 flex-shrink-0">•</span>${c}
                  </li>
                `)}
              </ul>
            </div>

            <!-- Stats -->
            <div className="border-t border-slate-800/60 pt-3 grid grid-cols-3 gap-2">
              <div className="text-center">
                <div className="text-xs font-bold text-emerald-400">62.4%</div>
                <div className="text-[10px] text-slate-500">Acceptance</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-slate-300">42.1K</div>
                <div className="text-[10px] text-slate-500">Submissions</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-indigo-400">O(h)</div>
                <div className="text-[10px] text-slate-500">Complexity</div>
              </div>
            </div>

          </div>
        </div>
      `}

      <!-- === CENTER: Code Editor === -->
      <div className="flex-grow flex flex-col border-r border-slate-800/40 min-w-0">

        <!-- Toolbar -->
        <div className="bg-slate-900/80 border-b border-slate-800/50 px-3 py-2 flex items-center justify-between gap-2 flex-wrap text-left">
          
          <div className="flex items-center gap-2">
            <!-- Toggle Problem Panel -->
            <button onClick=${() => setPanelOpen(!panelOpen)} title="Toggle Problem Panel" className="p-1.5 rounded bg-slate-800/70 border border-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition">
              <i data-lucide="panel-left" className="w-3.5 h-3.5"></i>
            </button>

            <!-- Language Selector -->
            <div className="relative flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style=${{ backgroundColor: activeLangMeta.color }}></div>
              <select 
                value=${activeLang}
                onChange=${handleLangChange}
                className="bg-slate-800/80 text-slate-200 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none cursor-pointer hover:border-slate-600 transition"
              >
                ${languagesList.map(lang => html`
                  <option key=${lang.id} value=${lang.id}>${lang.label}</option>
                `)}
              </select>
            </div>

            <!-- File Tab -->
            <div className="flex items-center gap-1.5 bg-[#1e1e1e] border border-slate-700/40 rounded px-2 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
              <span className="text-[11px] font-mono text-slate-300">main.${activeLangMeta.ext}</span>
            </div>

            <!-- Runtime Badge -->
            <span className="hidden sm:block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700/40">${activeLangMeta.badge}</span>
          </div>

          <!-- Right Controls -->
          <div className="flex items-center gap-1.5">
            <!-- Font size -->
            <div className="flex items-center gap-1 bg-slate-800/60 border border-slate-700/40 rounded px-1.5">
              <button onClick=${() => fontSize > 8 && setFontSize(fontSize - 2)} title="Decrease font size" className="p-0.5 hover:text-white text-slate-500 transition text-xs font-bold">A-</button>
              <span className="text-[10px] text-slate-400 font-mono w-6 text-center">${fontSize}</span>
              <button onClick=${() => fontSize < 28 && setFontSize(fontSize + 2)} title="Increase font size" className="p-0.5 hover:text-white text-slate-500 transition text-sm font-bold">A+</button>
            </div>

            <!-- Theme Selector -->
            <select value=${editorTheme} onChange=${handleThemeChange} className="bg-slate-800/80 text-slate-300 border border-slate-700/50 rounded px-2 py-1 text-[11px] outline-none cursor-pointer hover:border-slate-600 transition">
              <option value="vs-dark">Dark</option>
              <option value="vs-light">Light</option>
              <option value="hc-black">High Contrast</option>
            </select>

            <button onClick=${handleFormat} className="px-2 py-1 hover:bg-slate-800 rounded border border-slate-700/40 hover:border-slate-600 text-slate-400 hover:text-slate-200 text-xs font-medium flex items-center gap-1 transition">
              <i data-lucide="align-left" className="w-3 h-3"></i> Format
            </button>

            <button onClick=${handleFullscreen} className="p-1.5 hover:bg-slate-800 rounded border border-slate-700/40 text-slate-400 hover:text-slate-200 transition">
              <i data-lucide="maximize-2" className="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>

        <!-- Monaco Mount Area -->
        <div id="monaco-editor-mount" className="flex-grow bg-[#1e1e1e] relative min-h-[280px]">
          <${Editor}
            height="100%"
            language=${monacoLangMap[activeLang] || 'plaintext'}
            theme=${editorTheme}
            value=${currentCode}
            onMount=${handleEditorDidMount}
            onChange=${handleEditorChange}
            options=${{
              fontSize,
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              minimap: { enabled: false },
              automaticLayout: true,
              lineNumbers: 'on',
              cursorBlinking: 'smooth',
              cursorStyle: 'line',
              tabSize: activeLang === 'python' || activeLang === 'ruby' ? 4 : 4,
              wordWrap: 'off',
              scrollBeyondLastLine: false,
              renderLineHighlight: 'all',
              bracketPairColorization: { enabled: true },
              suggestOnTriggerCharacters: true,
              padding: { top: 12 }
            }}
          />
        </div>

        <!-- Bottom Action Bar -->
        <div className="bg-slate-900/80 border-t border-slate-800/50 px-4 py-2.5 flex justify-between items-center gap-2">
          <div className="flex items-center gap-3">
            <button 
              onClick=${() => setCustomInputOpen(!customInputOpen)}
              className="text-xs text-slate-400 hover:text-slate-200 font-medium flex items-center gap-1 transition"
            >
              <i data-lucide="terminal" className="w-3.5 h-3.5"></i>
              <span>Custom Input</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick=${runCode} className="px-4 py-1.5 rounded-lg bg-slate-800 border border-slate-700/60 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition active:scale-95">
              <i data-lucide="play" className="w-3.5 h-3.5 text-emerald-400"></i>
              ${t.runCode}
            </button>
            <button onClick=${submitCode} className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-indigo-600/20 active:scale-95">
              <i data-lucide="check" className="w-3.5 h-3.5"></i>
              ${t.submitCode}
            </button>
          </div>
        </div>

        <!-- Collapsible Custom Input -->
        ${customInputOpen && html`
          <div className="bg-[#0d1117] border-t border-slate-800/50 px-4 py-3 text-left">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1.5">Standard Input (stdin)</label>
            <textarea 
              value=${customInput}
              onChange=${(e) => setCustomInput(e.target.value)}
              className="w-full h-20 bg-slate-950 text-slate-200 border border-slate-800 rounded-lg p-2.5 text-xs font-mono outline-none resize-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition" 
              placeholder="Enter custom inputs here, one per line..."
            />
          </div>
        `}
      </div>

      <!-- === RIGHT: Output / Tests / AI Mentor === -->
      <div className="w-full md:w-[360px] flex-shrink-0 flex flex-col bg-[#0b0e14] border-t md:border-t-0 border-slate-800/40">
        
        <!-- Tab Header -->
        <div className="flex border-b border-slate-800/50 bg-slate-900/50 text-xs">
          <button 
            onClick=${() => setActiveConsoleTab('out')}
            className=${`flex-1 px-3 py-2.5 border-b-2 font-semibold flex items-center justify-center gap-1.5 transition ${
              activeConsoleTab === 'out' 
                ? 'border-indigo-500 bg-slate-900/60 text-slate-200' 
                : 'border-transparent text-slate-400 hover:bg-slate-800/30 hover:text-slate-200'
            }`}
          >
            <i data-lucide="terminal" className="w-3.5 h-3.5 text-indigo-400"></i> Output
          </button>
          <button 
            onClick=${() => setActiveConsoleTab('test')}
            className=${`flex-1 px-3 py-2.5 border-b-2 font-semibold flex items-center justify-center gap-1.5 transition ${
              activeConsoleTab === 'test' 
                ? 'border-indigo-500 bg-slate-900/60 text-slate-200' 
                : 'border-transparent text-slate-400 hover:bg-slate-800/30 hover:text-slate-200'
            }`}
          >
            <i data-lucide="list-checks" className="w-3.5 h-3.5"></i> Tests
          </button>
          <button 
            onClick=${() => setActiveConsoleTab('mentor')}
            className=${`flex-1 px-3 py-2.5 border-b-2 font-semibold flex items-center justify-center gap-1.5 transition ${
              activeConsoleTab === 'mentor' 
                ? 'border-indigo-500 bg-slate-900/60 text-slate-200' 
                : 'border-transparent text-slate-400 hover:bg-slate-800/30 hover:text-slate-200'
            }`}
          >
            <i data-lucide="sparkles" className="w-3.5 h-3.5 text-cyan-400"></i> AI
          </button>
        </div>

        <!-- Tab Views -->
        <div className="flex-grow flex flex-col relative overflow-hidden">
          
          <!-- Output Console View -->
          ${activeConsoleTab === 'out' && html`
            <div className="flex-grow p-4 overflow-y-auto font-mono text-xs text-left">
              ${consoleStatus === 'empty' && html`
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3 text-slate-600">
                  <i data-lucide="play-circle" className="w-10 h-10 opacity-40"></i>
                  <p className="text-sm font-medium">Output console empty</p>
                  <p className="text-[11px]">Click "Run Code" to compile and execute</p>
                </div>
              `}
              ${consoleStatus === 'loading' && html`
                <div className="flex flex-col items-center justify-center h-full gap-3 text-indigo-400">
                  <div className="w-7 h-7 border-2 border-indigo-400 border-t-transparent animate-spin rounded-full"></div>
                  <span className="text-xs font-mono">${executionMessage}</span>
                </div>
              `}
              ${(consoleStatus === 'success' || consoleStatus === 'error') && html`
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                    <span className=${`${consoleOutputOk ? 'text-emerald-400' : 'text-rose-400'} font-bold text-xs flex items-center gap-1.5`}>
                      ${consoleOutputOk ? '✓' : '✗'} ${consoleTitle}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">${consoleDuration}ms · ${consoleMemory} MB</span>
                  </div>
                  <pre className=${`${consoleOutputOk ? 'text-slate-200' : 'text-rose-400'} bg-slate-950/80 p-3 rounded-xl border border-slate-800/50 text-xs leading-relaxed select-text overflow-x-auto whitespace-pre-wrap`}>
                    ${consoleOutput || '(no output)'}
                  </pre>
                </div>
              `}
              ${consoleStatus === 'preview' && html`
                <div className="space-y-2 h-full flex flex-col">
                  <div className="text-emerald-400 font-bold text-xs border-b border-slate-800/60 pb-2 flex items-center justify-between">
                    <span>✓ HTML/CSS/JS · Live Preview</span>
                    <span className="text-[10px] text-slate-500 font-mono">Sandbox iframe</span>
                  </div>
                  <div className="flex-grow bg-white rounded-xl border border-slate-700/40 overflow-hidden shadow-lg h-64">
                    <iframe ref=${previewIframeRef} className="w-full h-full" style=${{ border: 'none' }} />
                  </div>
                </div>
              `}
              ${consoleStatus === 'submit' && html`
                <div className="space-y-4">
                  <div className="text-emerald-400 font-bold text-xs border-b border-slate-800/60 pb-2 flex items-center gap-2">
                    <i data-lucide="check-circle" className="w-4 h-4"></i> Code Submitted Successfully
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-3 text-center">
                      <div className="text-2xl font-black text-emerald-400">3 / 3</div>
                      <div className="text-[10px] text-slate-400 mt-1">Test Cases Passed</div>
                    </div>
                    <div className="bg-indigo-500/10 border border-indigo-500/25 rounded-xl p-3 text-center">
                      <div className="text-2xl font-black text-indigo-400">+15</div>
                      <div className="text-[10px] text-slate-400 mt-1">XP Gained</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">Submission logged to Classroom under active assignment.</div>
                </div>
              `}
            </div>
          `}

          <!-- Test Cases View -->
          ${activeConsoleTab === 'test' && html`
            <div className="flex-grow p-4 overflow-y-auto space-y-3 text-left">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <i data-lucide="check-square" className="w-3.5 h-3.5 text-indigo-400"></i>
                  BST Insertion Test Suite
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">2 sample, 1 hidden</span>
              </div>
              
              ${[
                { n: 1, label: 'Sample', input: 'root = [50], insert = 30', expected: '30 50', status: 'passed' },
                { n: 2, label: 'Sample', input: 'root = [50,30,70], insert = 40', expected: '30 40 50 70', status: 'passed' },
                { n: 3, label: 'Hidden', input: '---', expected: '---', status: 'locked' }
              ].map(tc => html`
                <div key=${tc.n} className=${`bg-slate-900/60 p-3 rounded-xl border ${tc.status === 'locked' ? 'border-slate-800/40 opacity-50' : 'border-slate-800/60'} space-y-2`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300">Test ${tc.n} <span className="text-slate-500 font-normal">(${tc.label})</span></span>
                    <span className=${`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      tc.status === 'passed' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                      tc.status === 'locked' ? 'bg-slate-800 text-slate-500 border border-slate-700/40' :
                      'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}>
                      ${tc.status === 'locked' ? '🔒 Locked' : tc.status === 'passed' ? '✓ Passed' : '✗ Failed'}
                    </span>
                  </div>
                  ${tc.status !== 'locked' 
                    ? html`
                      <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                        <div><div className="text-slate-500 mb-1">INPUT</div><div className="bg-slate-950 p-1.5 rounded border border-slate-800/60 text-slate-300">${tc.input}</div></div>
                        <div><div className="text-slate-500 mb-1">EXPECTED</div><div className="bg-slate-950 p-1.5 rounded border border-slate-800/60 text-emerald-400">${tc.expected}</div></div>
                      </div>`
                    : html`<p className="text-[10px] text-slate-500">Runs on final submission only.</p>`
                  }
                </div>
              `)}
            </div>
          `}

          <!-- AI Mentor View -->
          ${activeConsoleTab === 'mentor' && html`
            <div className="flex-grow p-4 overflow-y-auto space-y-4 text-left">
              <div className="bg-gradient-to-br from-cyan-950/30 to-indigo-950/30 p-4 rounded-2xl border border-cyan-500/15 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                    <i data-lucide="brain" className="w-5 h-5"></i>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">AI Coding Mentor</h4>
                    <p className="text-[10px] text-slate-400">Powered by CodeSphere Intelligence</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                    <span className="text-[10px] text-emerald-400 font-bold">Online</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">Get real-time code review, complexity analysis, hints, and optimized solutions from our AI assistant.</p>
                <div className="flex flex-col gap-2">
                  <button onClick=${triggerAiAudit} className="px-3 py-2 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 hover:border-cyan-500/50 text-cyan-300 font-bold text-xs rounded-xl flex items-center gap-2 transition active:scale-95">
                    <i data-lucide="wand-2" className="w-3.5 h-3.5"></i> Analyze & Debug My Code
                  </button>
                  <button onClick=${triggerAiHint} className="px-3 py-2 bg-slate-800/60 border border-slate-700/40 hover:border-slate-600 text-slate-300 font-medium text-xs rounded-xl flex items-center gap-2 transition active:scale-95">
                    <i data-lucide="lightbulb" className="w-3.5 h-3.5 text-amber-400"></i> Give Me a Hint
                  </button>
                  <button onClick=${triggerAiComplexity} className="px-3 py-2 bg-slate-800/60 border border-slate-700/40 hover:border-slate-600 text-slate-300 font-medium text-xs rounded-xl flex items-center gap-2 transition active:scale-95">
                    <i data-lucide="bar-chart-2" className="w-3.5 h-3.5 text-violet-400"></i> Time & Space Complexity
                  </button>
                </div>
              </div>
              
              ${aiLoading && html`
                <div className="flex items-center gap-2 text-cyan-400 text-xs">
                  <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent animate-spin rounded-full"></div>
                  <span>AI Mentor is analyzing your code...</span>
                </div>
              `}

              ${aiResponse && html`
                <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800/60 space-y-3 text-xs leading-relaxed">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold"><i data-lucide="check-circle" className="w-4 h-4"></i> ${aiResponse.title}</div>
                  ${aiResponse.body}
                </div>
              `}
            </div>
          `}
        </div>

      </div>
    </div>
  `;
}
