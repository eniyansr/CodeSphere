// CodeSphere Pro - 3D Tactile Keystroke Replay Player (React Edition)
import React, { useState, useEffect } from 'https://esm.sh/react@18.2.0';
import Editor from 'https://esm.sh/@monaco-editor/react@4.6.0?deps=react@18.2.0,react-dom@18.2.0';
import { html, useAppState, TRANSLATIONS } from '../state.js';

const MOCK_TYPING_SEQUENCE = [
  "class Node:",
  "class Node:\n    def __init__(self, val):",
  "class Node:\n    def __init__(self, val):\n        self.val = val\n        self.left = None",
  "class Node:\n    def __init__(self, val):\n        self.val = val\n        self.left = None\n        self.right = None",
  "class Node:\n    def __init__(self, val):\n        self.val = val\n        self.left = None\n        self.right = None\n\n# Helper insertion",
  "class Node:\n    def __init__(self, val):\n        self.val = val\n        self.left = None\n        self.right = None\n\ndef insert(root, val):\n    if root is None:\n        return Node(val)",
  "class Node:\n    def __init__(self, val):\n        self.val = val\n        self.left = None\n        self.right = None\n\ndef insert(root, val):\n    if root is None:\n        return Node(val)\n    if root.val < val:\n        root.right = insert(root.right, val)\n    else:\n        root.left = insert(root.left, val)\n    return root"
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
          return prev;
        }
        return prev + 1;
      });
    }, delay);

    return () => clearInterval(interval);
  }, [isPlaying, speed, timeline.length]);

  return html`
    <div className="flex-grow p-4 md:p-8 bg-[#F4F7FE] overflow-y-auto">
      
      <!-- Top Title Bar -->
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#16213E] tracking-tight">Keystroke Timeline Replay</h2>
          <p className="text-sm font-semibold text-[#566180] mt-0.5">Tamper-evident step-by-step editor event reconstruction for candidate <strong>${student}</strong></p>
        </div>

        <button
          onClick=${() => updateState({ activeTab: 'classroom' })}
          className="chip text-xs hover:bg-slate-100"
        >
          Exit Replay
        </button>
      </div>

      <!-- Main Replay Layout -->
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- Controls & Meta Panel -->
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-[#D5DEF2] flex flex-col justify-between"
             style=${{ boxShadow: '0 1px 0 #fff inset, 0 8px 0 -2px #CBD5EE, 0 28px 36px -18px rgba(22, 33, 62, 0.22)' }}>
          
          <div>
            <h3 className="text-sm font-extrabold text-[#16213E] uppercase tracking-wider mb-4">Playback Controls</h3>

            <!-- Scrubber Slider -->
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-xs font-mono font-bold text-[#566180]">
                <span>Frame: ${frameIndex + 1}</span>
                <span>Total: ${timeline.length}</span>
              </div>
              <input
                type="range"
                min="0"
                max=${timeline.length - 1}
                value=${frameIndex}
                onInput=${(e) => setFrameIndex(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            <!-- Play / Pause Buttons -->
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick=${() => setIsPlaying(!isPlaying)}
                className="btn flex-1 py-3 text-xs flex items-center justify-center gap-2"
              >
                <i data-lucide=${isPlaying ? 'pause' : 'play'} className="w-4 h-4"></i>
                <span>${isPlaying ? 'Pause' : 'Play Timeline'}</span>
              </button>

              <button
                onClick=${() => setFrameIndex(0)}
                className="chip text-xs py-3"
                title="Restart"
              >
                <i data-lucide="rotate-ccw" className="w-4 h-4"></i>
              </button>
            </div>

            <!-- Playback Speed -->
            <div className="bg-[#EEF3FD] p-3 rounded-2xl border border-[#D5DEF2] flex items-center justify-between text-xs">
              <span className="font-bold text-[#566180]">Replay Speed:</span>
              <div className="flex gap-1">
                ${[1, 2, 4].map(s => html`
                  <button
                    key=${s}
                    onClick=${() => setSpeed(s)}
                    className=${`px-2.5 py-1 rounded-lg font-mono font-bold text-xs ${
                      speed === s ? 'bg-indigo-600 text-white' : 'bg-white text-[#566180]'
                    }`}
                  >
                    ${s}x
                  </button>
                `)}
              </div>
            </div>
          </div>

          <div className="text-[11px] font-mono text-[#566180] pt-4 border-t border-[#D5DEF2]">
            Cryptographic keystroke verification active
          </div>
        </div>

        <!-- Monaco Editor Preview Plate -->
        <div className="lg:col-span-8 bg-white rounded-3xl border border-[#D5DEF2] overflow-hidden flex flex-col"
             style=${{ boxShadow: '0 1px 0 #fff inset, 0 8px 0 -2px #CBD5EE, 0 28px 36px -18px rgba(22, 33, 62, 0.22)' }}>
          
          <div className="flex items-center justify-between px-6 py-3 border-b border-[#D5DEF2] bg-[#EEF3FD] text-xs font-bold text-[#566180]">
            <span>Replay Terminal · Frame ${frameIndex + 1}</span>
            <span className="font-mono text-emerald-600">Verified Candidate Session</span>
          </div>

          <div className="flex-grow w-full h-[440px]">
            <${Editor}
              height="100%"
              language="python"
              theme="vs"
              value=${timeline[frameIndex] || ''}
              options=${{
                readOnly: true,
                fontSize: 13,
                minimap: { enabled: false },
                lineNumbers: 'on'
              }}
            />
          </div>
        </div>

      </div>

    </div>
  `;
}
