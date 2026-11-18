// CodeSphere Pro - 3D Tactile Practice Arena & Monaco Workspace (React Edition)
import React, { useState, useEffect, useRef } from 'https://esm.sh/react@18.2.0';
import Editor from 'https://esm.sh/@monaco-editor/react@4.6.0?deps=react@18.2.0,react-dom@18.2.0';
import { TRANSLATIONS, html, useAppState } from '../state.js';
import { executeCode } from '../services/compiler-service.js';
import { submitEncryptedCode } from '../services/encryption-service.js';

export function EditorWorkspace() {
  const { state, updateState } = useAppState();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.en;
  const activeLang = state.activeLanguage || 'javascript';
  const currentCode = (state.editorCode && state.editorCode[activeLang]) || '';

  const languagesList = [
    { id: 'javascript', label: 'JavaScript',    badge: 'V8 Sandbox' },
    { id: 'python',     label: 'Python 3',       badge: 'Pyodide WASM' },
    { id: 'cpp',        label: 'C++',            badge: 'GCC 12' },
    { id: 'c',          label: 'C',              badge: 'C17' },
    { id: 'java',       label: 'Java',           badge: 'JVM 17' },
    { id: 'typescript', label: 'TypeScript',     badge: 'TS 5.0' },
    { id: 'go',         label: 'Go',             badge: 'Go 1.21' },
    { id: 'rust',       label: 'Rust',           badge: 'Rust 1.75' },
    { id: 'html',       label: 'HTML/CSS/JS',    badge: 'Live Preview' }
  ];

  const activeLangMeta = languagesList.find(l => l.id === activeLang) || languagesList[0];

  const practiceProblem = {
    title: "Binary Search Tree Insertion",
    difficulty: "Medium",
    description: "Implement a function to insert a value into a Binary Search Tree and return the modified tree. The tree must maintain BST invariants (left < root < right).",
    examples: [
      { input: "root = [50], val = 30", output: "[50, 30]", explanation: "30 < 50, so it inserts as the left child." },
      { input: "root = [50, 30], val = 70", output: "[50, 30, 70]", explanation: "70 > 50, so it inserts as the right child." }
    ],
    constraints: [
      "The number of nodes in the tree is in the range [0, 10^4].",
      "-10^8 <= Node.val <= 10^8",
      "All values in the BST are unique."
    ],
    tags: ["Binary Tree", "Recursion", "BST", "Algorithms"]
  };

  const [editorTheme, setEditorTheme] = useState('vs'); // Light by default to match 3D theme
  const [panelOpen, setPanelOpen] = useState(true);
  const [activeConsoleTab, setActiveConsoleTab] = useState('out'); // 'out' | 'test' | 'mentor'
  const [consoleStatus, setConsoleStatus] = useState('empty'); // 'empty' | 'loading' | 'success' | 'error'
  const [consoleOutput, setConsoleOutput] = useState('');
  const [consoleDuration, setConsoleDuration] = useState('0.00');
  const [executionEngine, setExecutionEngine] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState(null);

  const editorRef = useRef(null);

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleEditorChange = (value) => {
    const updatedCode = { ...state.editorCode };
    updatedCode[activeLang] = value;
    const keystrokes = state.keystrokes || [];
    keystrokes.push({ time: Date.now(), value, lang: activeLang });
    updateState({ editorCode: updatedCode, keystrokes });
  };

  const handleLangChange = (e) => {
    updateState({ activeLanguage: e.target.value });
  };

  const handleFormat = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  };

  const runCode = async () => {
    if (!editorRef.current) return;
    const code = editorRef.current.getValue();
    setActiveConsoleTab('out');
    setConsoleStatus('loading');
    setConsoleOutput('Compiling and running in sandbox...');

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

  const handleSubmit = async () => {
    if (!editorRef.current) return;
    const code = editorRef.current.getValue();

    if (!state.activeAssignmentId) {
      alert('You are in Practice Mode. Switch to a Classroom Assignment to record official graded submissions.');
      return;
    }

    setIsSubmitting(true);
    try {
      const uid = (state.googleUser && state.googleUser.id) || 'student-1';
      const teacherId = state.activeTeacherId || 'teacher-1';

      await submitEncryptedCode({
        assignmentId: state.activeAssignmentId,
        studentId: uid,
        teacherId,
        code,
        language: activeLang
      });

      setSubmissionFeedback('Assignment encrypted with Teacher public key and submitted successfully!');
      setTimeout(() => setSubmissionFeedback(null), 4000);
    } catch (err) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return html`
    <div id="arena-ide-root" className="flex-grow flex flex-col min-h-0 bg-[#F4F7FE] p-4 md:p-6 overflow-hidden">
      
      <!-- Top Action Bar -->
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 p-3.5 bg-white rounded-2xl border border-[#D5DEF2]"
           style=${{ boxShadow: '0 4px 0 #D5DEF2, 0 12px 18px -8px rgba(22,33,62,0.1)' }}>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#566180]">Runtime:</span>
            <select
              value=${activeLang}
              onChange=${handleLangChange}
              className="bg-[#F0F4FD] border border-[#CBD5EE] text-[#16213E] font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
            >
              ${languagesList.map(l => html`
                <option key=${l.id} value=${l.id}>${l.label} (${l.badge})</option>
              `)}
            </select>
          </div>

          <div className="hidden sm:flex items-center gap-2 border-l border-[#D5DEF2] pl-3">
            <button
              onClick=${() => setEditorTheme(editorTheme === 'vs' ? 'vs-dark' : 'vs')}
              className="chip text-xs"
              title="Toggle editor light/dark mode"
            >
              <i data-lucide=${editorTheme === 'vs' ? 'moon' : 'sun'} className="w-3.5 h-3.5"></i>
              <span>${editorTheme === 'vs' ? 'Dark' : 'Light'}</span>
            </button>
            <button onClick=${handleFormat} className="chip text-xs" title="Prettify code">
              <i data-lucide="align-left" className="w-3.5 h-3.5"></i>
              <span>Format</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick=${runCode}
            disabled=${consoleStatus === 'loading'}
            className="btn teal flex items-center justify-center gap-2 px-5 py-2 text-xs"
            style=${{ width: 'auto' }}
          >
            <i data-lucide="play" className="w-3.5 h-3.5"></i>
            <span>${consoleStatus === 'loading' ? 'Running...' : 'Run Code'}</span>
          </button>

          <button
            onClick=${handleSubmit}
            disabled=${isSubmitting}
            className="btn flex items-center justify-center gap-2 px-5 py-2 text-xs"
            style=${{ width: 'auto' }}
          >
            <i data-lucide="shield-check" className="w-3.5 h-3.5"></i>
            <span>${isSubmitting ? 'Encrypting...' : 'E2EE Submit'}</span>
          </button>
        </div>
      </div>

      ${submissionFeedback && html`
        <div className="mb-3 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <i data-lucide="check-circle" className="w-4 h-4 text-emerald-600"></i>
          <span>${submissionFeedback}</span>
        </div>
      `}

      <!-- Main Workspace Split Area -->
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        
        <!-- Left: Problem Description Panel -->
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#D5DEF2] flex flex-col min-h-0 overflow-hidden"
             style=${{ boxShadow: '0 1px 0 #fff inset, 0 8px 0 -2px #CBD5EE, 0 24px 32px -16px rgba(22,33,62,0.18)' }}>
          
          <div className="p-4 border-b border-[#D5DEF2] bg-[#F8FAFD] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-[#16213E]">${practiceProblem.title}</h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                ${practiceProblem.difficulty}
              </span>
            </div>
          </div>

          <div className="p-4 overflow-y-auto space-y-4 text-xs leading-relaxed text-[#566180]">
            <div>
              <h4 className="font-bold text-[#16213E] mb-1">Description</h4>
              <p>${practiceProblem.description}</p>
            </div>

            <div>
              <h4 className="font-bold text-[#16213E] mb-2">Examples</h4>
              ${practiceProblem.examples.map((ex, idx) => html`
                <div key=${idx} className="bg-[#F0F4FD] p-2.5 rounded-xl border border-[#D5DEF2] mb-2 font-mono text-[11px]">
                  <div><strong className="text-[#16213E]">Input:</strong> ${ex.input}</div>
                  <div><strong className="text-[#16213E]">Output:</strong> ${ex.output}</div>
                  ${ex.explanation && html`<div className="text-[#566180] mt-1 italic">${ex.explanation}</div>`}
                </div>
              `)}
            </div>

            <div>
              <h4 className="font-bold text-[#16213E] mb-1">Constraints</h4>
              <ul className="list-disc pl-4 space-y-1 font-mono text-[11px]">
                ${practiceProblem.constraints.map((c, i) => html`<li key=${i}>${c}</li>`)}
              </ul>
            </div>

            <div className="pt-2 flex flex-wrap gap-1.5">
              ${practiceProblem.tags.map(t => html`
                <span key=${t} className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold text-[10px] border border-indigo-100">
                  #${t}
                </span>
              `)}
            </div>
          </div>
        </div>

        <!-- Right: Editor & Console Split View -->
        <div className="lg:col-span-8 flex flex-col min-h-0 gap-4">
          
          <!-- Monaco Code Editor Box -->
          <div className="flex-grow bg-white rounded-2xl border border-[#D5DEF2] overflow-hidden flex flex-col relative"
               style=${{
                 boxShadow: '0 1px 0 #fff inset, 0 8px 0 -2px #CBD5EE, 0 24px 32px -16px rgba(22,33,62,0.18)',
                 minHeight: '380px'
               }}>
            
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#D5DEF2] bg-[#F8FAFD] text-xs font-bold text-[#566180]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                <span>main.${activeLang === 'python' ? 'py' : activeLang === 'cpp' ? 'cpp' : activeLang === 'java' ? 'java' : 'js'}</span>
              </div>
              <span className="font-mono text-[11px] text-[#566180]">UTF-8 · Zero-Leakage Workspace</span>
            </div>

            <div className="flex-grow w-full h-full min-h-[340px]">
              <${Editor}
                height="100%"
                language=${activeLang === 'cpp' ? 'cpp' : activeLang === 'html' ? 'html' : activeLang === 'python' ? 'python' : 'javascript'}
                theme=${editorTheme}
                value=${currentCode}
                onChange=${handleEditorChange}
                onMount=${handleEditorDidMount}
                options=${{
                  fontSize: 14,
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

          <!-- Bottom: 3D Console Output Drawer -->
          <div className="h-48 flex-shrink-0 bg-white rounded-2xl border border-[#D5DEF2] flex flex-col overflow-hidden"
               style=${{ boxShadow: '0 1px 0 #fff inset, 0 6px 0 -2px #CBD5EE, 0 16px 24px -12px rgba(22,33,62,0.14)' }}>
            
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#D5DEF2] bg-[#EEF3FD]">
              <div className="flex items-center gap-4 text-xs font-bold">
                <button
                  onClick=${() => setActiveConsoleTab('out')}
                  className=${`flex items-center gap-1.5 pb-1 border-b-2 transition-all ${
                    activeConsoleTab === 'out' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-[#566180]'
                  }`}
                >
                  <i data-lucide="terminal" className="w-3.5 h-3.5"></i>
                  <span>Console Output</span>
                </button>
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
                <pre className="whitespace-pre-wrap">${consoleOutput || 'Click "Run Code" above to execute and view compiler logs here.'}</pre>
              `}
            </div>
          </div>

        </div>

      </div>

    </div>
  `;
}
