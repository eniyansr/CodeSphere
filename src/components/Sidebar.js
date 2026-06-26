// CodeSphere Pro - Sidebar Menu Component (React Edition)
import React from 'https://esm.sh/react@18.2.0';
import { TRANSLATIONS, html, useAppState } from '../state.js';

export function Sidebar() {
  const { state, updateState } = useAppState();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.en;

  const menuConfig = {
    student: [
      { id: 'dashboard', label: t.dashboard, icon: 'layout-dashboard' },
      { id: 'classroom', label: t.classroom, icon: 'book-open' },
      { id: 'exams', label: t.exams, icon: 'clipboard-check' },
      { id: 'practice', label: t.practice, icon: 'code-2' },
      { id: 'battle', label: t.battle, icon: 'zap' },
      { id: 'certificates', label: t.certificates, icon: 'award' },
      { id: 'notepad', label: t.notepad || 'Notepad', icon: 'notebook-pen' }
    ],
    teacher: [
      { id: 'dashboard', label: t.dashboard, icon: 'layout-dashboard' },
      { id: 'classroom', label: t.classroom, icon: 'book-open' },
      { id: 'students', label: t.students || 'Students List', icon: 'users' },
      { id: 'proctoring', label: t.proctoring, icon: 'eye' },
      { id: 'notepad', label: t.notepad || 'Notepad', icon: 'notebook-pen' }
    ],
    admin: [
      { id: 'admin', label: t.admin, icon: 'shield-check' },
      { id: 'notepad', label: t.notepad || 'Notepad', icon: 'notebook-pen' }
    ]
  };

  const activeMenu = menuConfig[state.role] || menuConfig.student;

  const handleTabClick = (tabId) => {
    if (tabId === 'notepad') {
      updateState({ notepadOpen: !state.notepadOpen });
    } else {
      updateState({ activeTab: tabId });
    }
  };

  return html`
    <aside className="glass-panel w-full md:w-64 flex-shrink-0 flex flex-col justify-between border-r border-slate-800/40 p-4 min-h-[auto] md:min-h-[calc(100vh-76px)]">
      
      <!-- Top Navigation Tabs List -->
      <div className="space-y-6 text-left">
        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-3">
          Navigation
        </div>
        
        <nav className="space-y-1" id="sidebar-nav">
          ${activeMenu.map(item => {
            const isActive = item.id === 'notepad' ? state.notepadOpen : state.activeTab === item.id;
            return html`
              <button 
                key=${item.id}
                onClick=${() => handleTabClick(item.id)}
                className=${`w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-150 relative group ${
                  isActive 
                    ? 'bg-indigo-500/10 text-indigo-400 border-l-4 border-indigo-500' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <i data-lucide=${item.icon} className=${`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'}`}></i>
                <span>${item.label}</span>
                ${isActive && html`<span className="absolute right-3 top-3 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-glow-indigo"></span>`}
              </button>
            `;
          })}
        </nav>
      </div>

      <!-- Bottom Platform Quick Statistics -->
      <div className="mt-8 pt-6 border-t border-slate-800/40 space-y-4">
        <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/30 text-xs">
          <div className="flex justify-between items-center text-slate-400 mb-1.5 font-medium">
            <span>Secure Lockdown:</span>
            <span className="font-bold text-accent-emerald">Verified</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1">
            <div className="bg-accent-emerald h-1 rounded-full" style=${{ width: '100%' }}></div>
          </div>
        </div>

        <div className="text-[10px] text-center text-slate-500 font-semibold uppercase tracking-wider">
          CodeSphere Pro v2.4.0
        </div>
      </div>

    </aside>
  `;
}
