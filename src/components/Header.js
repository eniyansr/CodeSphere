// CodeSphere Pro - 3D Tactile Top Navigation Header Component (React Edition)
import React from 'https://esm.sh/react@18.2.0';
import { TRANSLATIONS, html, useAppState } from '../state.js';

export function Header() {
  const { state, updateState } = useAppState();
  const t = TRANSLATIONS[state.language] || TRANSLATIONS.en;

  const handleLangChange = (e) => {
    updateState({ language: e.target.value });
  };

  const toggleContrast = () => {
    updateState({ highContrast: !state.highContrast });
  };

  const handleFontChange = (size) => {
    updateState({ fontSize: size });
  };

  const handleLogout = () => {
    updateState({
      isLoggedIn: false,
      googleUser: null,
      role: 'student',
      activeTab: 'dashboard',
      classes: [],
      studentProfiles: []
    });
  };

  const fontSizes = ['sm', 'base', 'lg', 'xl'];

  return html`
    <header className="sticky top-0 z-40 px-6 py-3 flex flex-wrap items-center justify-between gap-4 border-b select-none"
            style=${{
              background: '#FFFFFF',
              borderColor: '#D5DEF2',
              boxShadow: '0 4px 14px -6px rgba(22,33,62,0.1)'
            }}>
      
      <!-- Brand Logo -->
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-mono font-bold text-lg"
             style=${{
               background: 'linear-gradient(145deg, #818CF8, #4F46E5)',
               boxShadow: '0 3px 0 #3730A3, 0 10px 14px -6px rgba(22,33,62,0.25)',
               transform: 'rotate(-5deg)'
             }}>
          &gt;_
        </div>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-[#16213E] flex items-center gap-1.5 leading-none">
            CodeSphere <span className="text-[10px] font-bold uppercase text-[#4F46E5] bg-[#E4E6FF] px-1.5 py-0.5 rounded-md">Pro</span>
          </h1>
          <p className="text-[11px] text-[#566180] font-medium flex items-center gap-1.5 mt-0.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            ${t.statusConnected}
          </p>
        </div>
        
        ${state.isLockdownActive && html`
          <div className="ml-3 px-3 py-1 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center space-x-1.5 animate-pulse text-xs font-bold">
            <i data-lucide="shield-alert" className="w-3.5 h-3.5"></i>
            <span>${t.securityLockdown}</span>
          </div>
        `}
      </div>

      <!-- Settings & Controls Section -->
      <div className="flex flex-wrap items-center gap-3">
        
        <!-- Portal Role Badge -->
        <div className="flex items-center space-x-1.5 bg-[#EEF3FD] px-3 py-1.5 rounded-xl border border-[#D5DEF2] text-[#16213E] text-xs font-bold uppercase tracking-wider"
             style=${{ boxShadow: '0 2px 0 #D5DEF2' }}>
          <i data-lucide="shield-check" className="w-3.5 h-3.5 text-indigo-600"></i>
          <span>
            ${state.role === 'student' ? t.student : state.role === 'teacher' ? t.teacher : t.adminRole} Portal
          </span>
        </div>

        <!-- Floating Notepad Toggle (3D Chip) -->
        <button 
          onClick=${() => updateState({ notepadOpen: !state.notepadOpen })}
          className=${`chip px-3 py-1.5 rounded-xl border transition-all duration-150 flex items-center gap-1.5 text-xs font-bold ${
            state.notepadOpen 
              ? 'bg-indigo-600 text-white border-indigo-600' 
              : 'bg-white text-[#566180] border-[#D5DEF2] hover:text-[#16213E]'
          }`}
          style=${{
            boxShadow: state.notepadOpen ? '0 3px 0 #3730A3' : '0 3px 0 #D5DEF2'
          }}
        >
          <i data-lucide="notebook-pen" className="w-3.5 h-3.5"></i>
          <span>Notepad</span>
        </button>

        <!-- Language Translations Selector -->
        <div className="relative">
          <select 
            value=${state.language}
            onChange=${handleLangChange}
            className="appearance-none bg-white text-xs font-bold text-[#16213E] rounded-xl px-3 py-1.5 pr-7 outline-none cursor-pointer border border-[#D5DEF2]"
            style=${{ boxShadow: '0 3px 0 #D5DEF2' }}
          >
            <option value="en">English</option>
            <option value="ta">தமிழ்</option>
            <option value="hi">हिन्दी</option>
            <option value="te">తెలుగు</option>
            <option value="ml">മലയാളം</option>
            <option value="kn">ಕನ್ನಡ</option>
          </select>
          <i data-lucide="chevron-down" className="w-3 h-3 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
        </div>

        <!-- Accessibility Font Scaling (SM / BASE / LG / XL) -->
        <div className="flex items-center space-x-1 bg-[#E3EAF8] p-1 rounded-xl border border-[#D5DEF2]">
          ${fontSizes.map(size => html`
            <button 
              key=${size}
              onClick=${() => handleFontChange(size)}
              className=${`px-2 py-0.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                state.fontSize === size 
                  ? 'bg-white text-[#4F46E5]' 
                  : 'text-[#566180] hover:text-[#16213E]'
              }`}
              style=${state.fontSize === size ? { boxShadow: '0 2px 0 #C3CEE8' } : {}}
            >
              ${size.toUpperCase()}
            </button>
          `)}
        </div>

        <!-- Accessibility Contrast Toggle -->
        <button 
          onClick=${toggleContrast}
          className=${`chip px-3 py-1.5 rounded-xl border transition-all duration-150 flex items-center gap-1.5 text-xs font-bold ${
            state.highContrast 
              ? 'bg-black text-white border-black' 
              : 'bg-white text-[#566180] border-[#D5DEF2] hover:text-[#16213E]'
          }`}
          style=${{ boxShadow: state.highContrast ? '0 3px 0 #333' : '0 3px 0 #D5DEF2' }}
        >
          <i data-lucide="eye" className="w-3.5 h-3.5"></i>
          <span>${t.contrast}</span>
        </button>

        <!-- Account Details & Logout -->
        <div className="flex items-center space-x-3 border-l border-[#D5DEF2] pl-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                 style=${{
                   background: 'linear-gradient(145deg, #818CF8, #4F46E5)',
                   boxShadow: '0 2px 0 #3730A3'
                 }}>
              ${state.googleUser ? state.googleUser.name.split(' ').map(n => n[0]).join('').slice(0, 2) : (state.role === 'student' ? 'GC' : 'SJ')}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-[#16213E] leading-tight">
                ${state.googleUser ? state.googleUser.name : (state.role === 'student' ? 'GitHub Contributor' : 'Dr. Sarah Jenkins')}
              </div>
              <div className="text-[10px] text-[#566180] uppercase tracking-wider font-semibold leading-none mt-0.5">
                ${state.role}
              </div>
            </div>
          </div>
          
          <button 
            onClick=${handleLogout}
            className="chip p-1.5 rounded-xl border border-[#D5DEF2] bg-white text-[#566180] hover:text-red-600 transition flex items-center justify-center"
            title="Log out"
            style=${{ boxShadow: '0 3px 0 #D5DEF2' }}
          >
            <i data-lucide="log-out" className="w-4 h-4"></i>
          </button>
        </div>

      </div>
    </header>
  `;
}
