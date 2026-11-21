// CodeSphere Pro - 3D Tactile Sidebar Menu Component (React Edition)
import React from 'https://esm.sh/react@18.2.0';
import { TRANSLATIONS, html, useAppState } from '../state.js';

export function Sidebar() {
  const { state, updateState } = useAppState();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.en;

  // Menu items configured with icons matching the 3D tactile UI
  const menuConfig = {
    student: [
      { id: 'dashboard',    label: 'Dashboard',          icon: 'layout-grid' },
      { id: 'classroom',    label: 'Classroom',          icon: 'book-open' },
      { id: 'exams',        label: 'Live Class & Exam',  icon: 'video' },
      { id: 'practice',     label: 'Adaptive Arena',     icon: 'brain' },
      { id: 'battle',       label: 'Coding Battle',      icon: 'zap' },
      { id: 'proctoring',   label: 'AI Monitoring',      icon: 'shield-alert' },
      { id: 'certificates', label: 'Certificates',       icon: 'award' },
      { id: 'security',     label: 'Data & Privacy',     icon: 'shield-check' },
      { id: 'notepad',      label: 'Notepad',            icon: 'pencil' }
    ],
    teacher: [
      { id: 'dashboard',    label: 'Dashboard',          icon: 'layout-grid' },
      { id: 'classroom',    label: 'Classroom',          icon: 'book-open' },
      { id: 'students',     label: 'Students List',       icon: 'users' },
      { id: 'proctoring',   label: 'AI Monitoring',      icon: 'shield-alert' },
      { id: 'exams',        label: 'Live Class & Exam',  icon: 'video' },
      { id: 'security',     label: 'Data & Privacy',     icon: 'shield-check' },
      { id: 'notepad',      label: 'Notepad',            icon: 'pencil' }
    ],
    admin: [
      { id: 'admin',        label: 'Admin Control',       icon: 'shield-check' },
      { id: 'proctoring',   label: 'AI Monitoring',      icon: 'shield-alert' },
      { id: 'security',     label: 'Data & Privacy',     icon: 'shield-check' },
      { id: 'notepad',      label: 'Notepad',            icon: 'pencil' }
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
    <aside className="w-full md:w-[260px] flex-shrink-0 flex flex-col justify-between p-4 min-h-[auto] md:min-h-[calc(100vh-76px)] border-r transition-all duration-200 select-none"
           style=${{
             background: 'linear-gradient(180deg, #FFFFFF, #EEF3FD)',
             borderColor: '#D5DEF2',
             boxShadow: '8px 0 30px -18px rgba(22,33,62,0.28)'
           }}>
      
      <!-- Top Navigation Tabs List -->
      <div className="space-y-4 text-left">
        
        <!-- Online System Indicator -->
        <div className="flex items-center gap-2 px-2 pt-1 text-xs font-semibold text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500" style=${{ boxShadow: '0 0 0 4px #D3F3DE' }}></span>
          <span>System connected</span>
        </div>
        
        <!-- Navigation Buttons -->
        <nav className="flex flex-col gap-2" id="sidebar-nav">
          ${activeMenu.map(item => {
            const isActive = item.id === 'notepad' ? state.notepadOpen : state.activeTab === item.id;
            
            return html`
              <button 
                key=${item.id}
                onClick=${() => handleTabClick(item.id)}
                className=${`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[15px] font-bold text-left transition-all duration-150 relative cursor-pointer ${
                  isActive 
                    ? 'text-white' 
                    : 'text-[#566180] hover:text-[#16213E] hover:bg-white hover:translate-x-1'
                }`}
                style=${isActive ? {
                  background: 'linear-gradient(180deg, #6366F1, #4F46E5)',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 5px 0 #3730A3, 0 12px 16px -8px rgba(22,33,62,0.28)',
                  transform: 'translateY(-2px)'
                } : {
                  boxShadow: 'none'
                }}
              >
                <i data-lucide=${item.icon} className=${`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#566180]'}`}></i>
                <span className="truncate">${item.label}</span>
              </button>
            `;
          })}
        </nav>
      </div>

      <!-- Bottom Platform Quick Statistics & Lock status -->
      <div className="mt-8 pt-5 border-t border-[#D5DEF2] space-y-3">
        
        <!-- Secure Lockdown Bevel Box -->
        <div className="bg-white p-3.5 rounded-2xl border border-[#D5DEF2] text-xs font-semibold"
             style=${{ boxShadow: '0 4px 0 #D5DEF2' }}>
          <div className="flex justify-between items-center text-[#16213E] mb-2">
            <span>Secure lockdown</span>
            <em className="not-italic text-emerald-600 font-bold">Verified</em>
          </div>
          <i className="block h-2 rounded-full"
             style=${{
               background: 'linear-gradient(90deg, #34D399, #16A34A)',
               boxShadow: '0 2px 0 #0F7A36'
             }}></i>
        </div>

        <div className="text-[11px] text-center text-[#566180] font-mono tracking-wide">
          CodeSphere Pro v2.4.0 · E2EE
        </div>
      </div>

    </aside>
  `;
}
