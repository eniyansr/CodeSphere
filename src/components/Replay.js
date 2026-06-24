// CodeSphere Pro - Code Replay Keystroke Playback Component
import { updateState, TRANSLATIONS } from '../state.js';

let replayInterval = null;
let activeReplayEditor = null;

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

export function Replay(state) {
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.en;
  const student = state.replayTargetStudent || "Eniyan Rajesh";

  // Use recorded keystrokes or default mock typing history
  const activeTimeline = (state.keystrokes && state.keystrokes.length > 5) 
    ? state.keystrokes.map(k => k.value) 
    : MOCK_TYPING_SEQUENCE;

  const currentFrameIdx = state.replayFrameIndex || 0;

  return `
    <div class="p-6 space-y-6 flex-grow overflow-y-auto">
      
      <!-- Top header -->
      <div class="flex justify-between items-center border-b border-slate-800/40 pb-5">
        <div>
          <h2 class="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <i data-lucide="history" class="text-indigo-400 w-6 h-6 animate-pulse"></i>
            Code Keystroke Replay
          </h2>
          <p class="text-xs text-slate-400">Review step-by-step keystroke operations of candidate <strong>${student}</strong>.</p>
        </div>

        <button id="replay-exit-btn" class="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl transition">
          Exit Replay
        </button>
      </div>

      <!-- Playback Console Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        <!-- Left: Playback controls panel -->
        <div class="glass-panel p-5 rounded-2xl lg:col-span-1 space-y-5">
          <h3 class="text-xs uppercase font-bold tracking-widest text-slate-500 border-b border-slate-800 pb-2">Player Cockpit</h3>
          
          <div class="space-y-4">
            <!-- Timeline details -->
            <div class="bg-slate-950 p-3 rounded-xl border border-slate-900 font-mono text-[10px] space-y-2">
              <div class="flex justify-between text-slate-400">
                <span>Total Actions:</span>
                <span class="font-bold text-white">${activeTimeline.length} changes</span>
              </div>
              <div class="flex justify-between text-slate-400">
                <span>Current State:</span>
                <span class="font-bold text-indigo-400">Frame ${currentFrameIdx + 1}</span>
              </div>
            </div>

            <!-- Controls -->
            <div class="flex items-center justify-center space-x-3">
              <button id="replay-btn-prev" class="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition active:scale-95">
                <i data-lucide="skip-back" class="w-4 h-4"></i>
              </button>
              <button id="replay-btn-play" class="p-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-600/10 transition active:scale-95">
                <i id="replay-play-icon" data-lucide="play" class="w-5 h-5"></i>
              </button>
              <button id="replay-btn-next" class="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition active:scale-95">
                <i data-lucide="skip-forward" class="w-4 h-4"></i>
              </button>
            </div>

            <!-- Timeline Scrubber -->
            <div class="space-y-1.5">
              <label class="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Timeline Scrubber</label>
              <input 
                id="replay-slider" 
                type="range" 
                min="0" 
                max="${activeTimeline.length - 1}" 
                value="${currentFrameIdx}" 
                class="w-full accent-indigo-500 h-1 rounded bg-slate-800 outline-none cursor-pointer"
              >
            </div>

            <!-- Speed selector -->
            <div class="space-y-1.5">
              <label class="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Playback Speed</label>
              <div class="grid grid-cols-3 gap-1">
                ${[1, 2, 4].map(s => `
                  <button 
                    data-replay-speed="${s}" 
                    class="py-1 rounded font-mono font-bold text-xs border transition
                    ${(state.replaySpeed || 1) === s 
                      ? 'bg-indigo-500 border-indigo-500 text-white shadow' 
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'}"
                  >
                    ${s}x
                  </button>
                `).join('')}
              </div>
            </div>

          </div>
        </div>

        <!-- Right: Monaco Read-Only Workspace -->
        <div class="lg:col-span-3 border border-slate-800/80 rounded-2xl overflow-hidden min-h-[400px] flex flex-col">
          <div class="bg-slate-900 px-4 py-2 border-b border-slate-800 text-xs flex justify-between items-center text-slate-400 font-semibold font-mono">
            <span>Code Workspace Playback Container</span>
            <span class="text-indigo-400">[Read-Only]</span>
          </div>
          <div id="monaco-replay-mount" class="flex-grow bg-[#1e1e1e] relative min-h-[350px]"></div>
        </div>

      </div>

    </div>
  `;
}

export function bindReplayEvents(state) {
  const activeTimeline = (state.keystrokes && state.keystrokes.length > 5) 
    ? state.keystrokes.map(k => k.value) 
    : MOCK_TYPING_SEQUENCE;

  const currentFrameIdx = state.replayFrameIndex || 0;

  // Mount read-only Monaco editor
  require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs' }});
  require(['vs/editor/editor.main'], function() {
    const mount = document.getElementById('monaco-replay-mount');
    if (!mount) return;
    const existing = mount.querySelector('.monaco-editor');
    if (existing) existing.remove();

    activeReplayEditor = monaco.editor.create(mount, {
      value: activeTimeline[currentFrameIdx],
      language: 'python',
      theme: 'vs-dark',
      automaticLayout: true,
      readOnly: true,
      minimap: { enabled: false }
    });
  });

  // Slider change
  document.getElementById('replay-slider')?.addEventListener('input', (e) => {
    const index = parseInt(e.target.value);
    updateFrame(state, index, activeTimeline);
  });

  // Next frame
  document.getElementById('replay-btn-next')?.addEventListener('click', () => {
    const nextIdx = Math.min(activeTimeline.length - 1, currentFrameIdx + 1);
    updateFrame(state, nextIdx, activeTimeline);
  });

  // Prev frame
  document.getElementById('replay-btn-prev')?.addEventListener('click', () => {
    const prevIdx = Math.max(0, currentFrameIdx - 1);
    updateFrame(state, prevIdx, activeTimeline);
  });

  // Exit Replay
  document.getElementById('replay-exit-btn')?.addEventListener('click', () => {
    clearInterval(replayInterval);
    updateState({ activeTab: 'classroom' });
  });

  // Speed controls
  document.querySelectorAll('[data-replay-speed]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const speed = parseInt(e.currentTarget.getAttribute('data-replay-speed'));
      updateState({ replaySpeed: speed });
      
      // If playing, restart interval with new speed
      const playIcon = document.getElementById('replay-play-icon');
      if (playIcon && playIcon.getAttribute('data-lucide') === 'pause') {
        startPlayback(state, activeTimeline);
      }
    });
  });

  // Play / Pause trigger
  document.getElementById('replay-btn-play')?.addEventListener('click', () => {
    const btn = document.getElementById('replay-btn-play');
    const playIcon = document.getElementById('replay-play-icon');
    
    if (!playIcon) return;

    const isPlaying = playIcon.getAttribute('data-lucide') === 'pause';

    if (isPlaying) {
      // Pause
      clearInterval(replayInterval);
      playIcon.setAttribute('data-lucide', 'play');
      lucide.createIcons();
    } else {
      // Play
      playIcon.setAttribute('data-lucide', 'pause');
      lucide.createIcons();
      startPlayback(state, activeTimeline);
    }
  });
}

function updateFrame(state, idx, timeline) {
  state.replayFrameIndex = idx;
  
  // Update Monaco value directly
  if (activeReplayEditor) {
    activeReplayEditor.setValue(timeline[idx]);
  }

  // Update slider and counter values quietly to avoid complete viewport flash
  const slider = document.getElementById('replay-slider');
  if (slider) slider.value = idx;
  
  const label = document.querySelector('.bg-slate-950 span.font-bold.text-indigo-400');
  if (label) label.textContent = `Frame ${idx + 1}`;
}

function startPlayback(state, timeline) {
  clearInterval(replayInterval);

  const speed = state.replaySpeed || 1;
  const msDelay = 1000 / speed;

  replayInterval = setInterval(() => {
    const current = state.replayFrameIndex || 0;
    if (current >= timeline.length - 1) {
      clearInterval(replayInterval);
      const playIcon = document.getElementById('replay-play-icon');
      if (playIcon) {
        playIcon.setAttribute('data-lucide', 'play');
        lucide.createIcons();
      }
      alert("Keystroke playback finalized. Session replay completed.");
    } else {
      updateFrame(state, current + 1, timeline);
    }
  }, msDelay);
}
