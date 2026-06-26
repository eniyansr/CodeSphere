// CodeSphere Pro - Code Replay Keystroke Playback Component (React Edition)
import React, { useState, useEffect, useRef } from 'https://esm.sh/react@18.2.0';
import Editor from 'https://esm.sh/@monaco-editor/react';
import { html, useAppState, TRANSLATIONS } from '../state.js';

const MOCK_TYPING_SEQUENCE = [
  "class Node:",
  "class Node:\n    def __init__(self, val):",
  "class Node:\n    def __init__(self, val):\n        self.val = val\n        self.left = None",
  "class Node:\n    def __init__(self, val):\n        self.val = val\n        self.left = None\n        self.right = None",
  "class Node:\n    def __init__(self, val):\n        self.val = val\n        self.left = None\n        self.right = None\n\n# Helper insertion",
  "class Node:\n    def __init__(self, val):\n        self.val = val\n        self.left = None\n        self.right = None\n\n# Helper insertion\ndef insert(root, val):\n    if root is None:\n        return Node(val)",
  "class Node:\n    def __init__(self, val):\n        self.val = val\n        self.left = None\n        self.right = None\n\n# Helper insertion\ndef insert(root, val):\n    if root is None:\n        return Node(val)\n    if root.val < val:\n        root.right = insert(root.right, val)",
  "class Node:\n    def __init__(self, val):\n        self.val = val\n        self.left = None\n        self.right = None\n\n# Helper insertion\ndef insert(root, val):\n    if root is None:\n        return Node(val)\n    if root.val < val:\n        root.right = insert(root.right, val)\n    else:\n        root.left = insert(root.left, val)\n    return root",
  "class Node:\n    def __init__(self, val):\n        self.val = val\n        self.left = None\n        self.right = None\n\n# Helper insertion\ndef insert(root, val):\n    if root is None:\n        return Node(val)\n    if root.val < val:\n        root.right = insert(root.right, val)\n    else:\n        root.left = insert(root.left, val)\n    return root\n\n# TestBST run\nr = Node(50)\nr = insert(r, 30)\nprint('Inserted Node 30')",
  "class Node:\n    def __init__(self, val):\n        self.val = val\n        self.left = None\n        self.right = None\n\n# Helper insertion\ndef insert(root, val):\n    if root is None:\n        return Node(val)\n    if root.val < val:\n        root.right = insert(root.right, val)\n    else:\n        root.left = insert(root.left, val)\n    return root\n\n# TestBST run\nr = Node(50)\nr = insert(r, 30)\nr = insert(r, 70)\nprint('BST Built. Root val is:', r.val)"
];

export function Replay() {
  const { state, updateState } = useAppState();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.en;
  const student = state.replayTargetStudent || "Eniyan Rajesh";

  const timeline = (state.keystrokes && state.keystrokes.length > 5) 
    ? state.keystrokes.map(k => k.value) 
    : MOCK_TYPING_SEQUENCE;

  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    if (!isPlaying) return;

    const delay = 1000 / speed;
    const interval = setInterval(() => {
      setFrameIndex(prev => {
        if (prev >= timeline.length - 1) {
          clearInterval(interval);
          setIsPlaying(false);
          alert("Keystroke playback finalized. Session replay completed.");
          return prev;
        }
        return prev + 1;
      });
    }, delay);

    return () => clearInterval(interval);
  }, [isPlaying, speed, timeline.length]);

  const handlePrev = () => {
    setFrameIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setFrameIndex(prev => Math.min(timeline.length - 1, prev + 1));
  };

  const handlePlayToggle = () => {
    setIsPlaying(prev => !prev);
  };

  const handleSliderChange = (e) => {
    setFrameIndex(parseInt(e.target.value, 10));
  };

  const handleExit = () => {
    setIsPlaying(false);
    updateState({ activeTab: 'classroom' });
  };

  return html`
    <div className="p-6 space-y-6 flex-grow overflow-y-auto">
      
      <!-- Top header -->
      <div className="flex justify-between items-center border-b border-slate-800/40 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <i data-lucide="history" className="text-indigo-400 w-6 h-6 animate-pulse"></i>
            Code Keystroke Replay
          </h2>
          <p className="text-xs text-slate-400">Review step-by-step keystroke operations of candidate <strong>${student}</strong>.</p>
        </div>

        <button onClick=${handleExit} className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl transition">
          Exit Replay
        </button>
      </div>

      <!-- Playback Console Layout -->
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        <!-- Left: Playback controls panel -->
        <div className="glass-panel p-5 rounded-2xl lg:col-span-1 space-y-5">
          <h3 className="text-xs uppercase font-bold tracking-widest text-slate-500 border-b border-slate-800 pb-2">Player Cockpit</h3>
          
          <div className="space-y-4">
            <!-- Timeline details -->
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 font-mono text-[10px] space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Total Actions:</span>
                <span className="font-bold text-white">${timeline.length} changes</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Current State:</span>
                <span className="font-bold text-indigo-400">Frame ${frameIndex + 1}</span>
              </div>
            </div>

            <!-- Controls -->
            <div className="flex items-center justify-center space-x-3">
              <button onClick=${handlePrev} className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition active:scale-95">
                <i data-lucide="skip-back" className="w-4 h-4"></i>
              </button>
              <button onClick=${handlePlayToggle} className="p-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-600/10 transition active:scale-95">
                <i data-lucide=${isPlaying ? 'pause' : 'play'} className="w-5 h-5"></i>
              </button>
              <button onClick=${handleNext} className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition active:scale-95">
                <i data-lucide="skip-forward" className="w-4 h-4"></i>
              </button>
            </div>

            <!-- Timeline Scrubber -->
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Timeline Scrubber</label>
              <input 
                type="range" 
                min="0" 
                max=${timeline.length - 1} 
                value=${frameIndex} 
                onChange=${handleSliderChange}
                className="w-full accent-indigo-500 h-1 rounded bg-slate-800 outline-none cursor-pointer"
              />
            </div>

            <!-- Speed selector -->
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Playback Speed</label>
              <div className="grid grid-cols-3 gap-1">
                ${[1, 2, 4].map(s => html`
                  <button 
                    key=${s}
                    onClick=${() => setSpeed(s)}
                    className=${`py-1 rounded font-mono font-bold text-xs border transition
                    ${speed === s 
                      ? 'bg-indigo-500 border-indigo-500 text-white shadow' 
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'}`}
                  >
                    ${s}x
                  </button>
                `)}
              </div>
            </div>

          </div>
        </div>

        <!-- Right: Monaco Read-Only Workspace -->
        <div className="lg:col-span-3 border border-slate-800/80 rounded-2xl overflow-hidden min-h-[400px] flex flex-col">
          <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 text-xs flex justify-between items-center text-slate-400 font-semibold font-mono">
            <span>Code Workspace Playback Container</span>
            <span className="text-indigo-400">[Read-Only]</span>
          </div>
          <div className="flex-grow bg-[#1e1e1e] relative min-h-[350px]">
            <${Editor}
              height="100%"
              language="python"
              theme="vs-dark"
              value=${timeline[frameIndex] || ''}
              options=${{
                readOnly: true,
                minimap: { enabled: false },
                automaticLayout: true
              }}
            />
          </div>
        </div>

      </div>

    </div>
  `;
}
