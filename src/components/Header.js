// CodeSphere Pro - Top Navigation Header Component (React Edition)
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
    <header className="glass-panel sticky top-0 z-40 px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/40">
      
      <!-- Logo and Lockdown Warning -->
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-cyan flex items-center justify-center shadow-lg shadow-brand-500/20">
          <i data-lucide="terminal" className="w-5 h-5 text-white"></i>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            CodeSphere <span className="text-accent-cyan font-semibold text-xs tracking-wider uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">Pro</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-accent-emerald animate-pulse"></span>
            ${t.statusConnected}
          </p>
        </div>
        
        ${state.isLockdownActive && html`
          <div className="ml-4 px-3 py-1.5 rounded-lg bg-accent-rose/10 border border-accent-rose/30 flex items-center space-x-2 animate-pulse">
            <i data-lucide="shield-alert" className="w-4 h-4 text-accent-rose"></i>
            <span className="text-xs font-bold text-accent-rose tracking-wider uppercase">${t.securityLockdown}</span>
          </div>
        `}
      </div>

      <!-- Settings & Controls Section -->
      <div className="flex flex-wrap items-center gap-4">
        
        <!-- Portal Role Badge (Read Only) -->
        <div className="flex items-center space-x-2 bg-slate-900/50 px-3.5 py-1.5 rounded-xl border border-slate-800/40 text-slate-200">
          <i data-lucide="shield-check" className="w-4 h-4 text-indigo-400"></i>
          <span className="text-xs font-bold uppercase tracking-wider">
            ${state.role === 'student' ? t.student : state.role === 'teacher' ? t.teacher : t.adminRole} Portal
          </span>
        </div>

        <!-- Floating Notepad Toggle -->
        <button 
          onClick=${() => updateState({ notepadOpen: !state.notepadOpen })}
          className=${`p-2 rounded-xl border transition-all duration-150 flex items-center gap-1.5 text-sm font-medium ${
            state.notepadOpen 
              ? 'bg-indigo-500 text-white border-indigo-500 shadow-glow-indigo' 
              : 'bg-slate-900/50 text-slate-300 border-slate-800/40 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <i data-lucide="notebook-pen" className="w-4 h-4"></i>
          <span className="hidden md:inline">Notepad</span>
        </button>

        <!-- Language Translations Selector -->
        <div className="flex items-center bg-slate-900/50 p-1 rounded-xl border border-slate-800/40">
          <select 
            value=${state.language}
            onChange=${handleLangChange}
            className="bg-slate-800 text-sm font-medium text-slate-300 rounded-lg px-2 py-1 outline-none cursor-pointer border border-slate-700/50 hover:bg-slate-700/50 transition duration-150"
          >
            <option value="en">English</option>
            <option value="ta">தமிழ்</option>
            <option value="hi">हिन्दी</option>
            <option value="te">తెలుగు</option>
            <option value="ml">മലയാളം</option>
            <option value="kn">ಕನ್ನಡ</option>
          </select>
        </div>

        <!-- Accessibility Font Scaling -->
        <div className="flex items-center space-x-1 bg-slate-900/50 p-1 rounded-xl border border-slate-800/40">
          <i data-lucide="type" className="w-4 h-4 text-slate-400 mx-1"></i>
          ${fontSizes.map(size => html`
            <button 
              key=${size}
              onClick=${() => handleFontChange(size)}
              className=${`w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-all duration-150 ${
                state.fontSize === size ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              ${size.toUpperCase()}
            </button>
          `)}
        </div>

        <!-- Accessibility Contrast Toggle -->
        <button 
          onClick=${toggleContrast}
          className=${`p-2 rounded-xl border transition-all duration-150 flex items-center gap-1.5 text-sm font-medium ${
            state.highContrast 
              ? 'bg-white text-black border-white' 
              : 'bg-slate-900/50 text-slate-300 border-slate-800/40 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <i data-lucide="eye" className="w-4 h-4"></i>
          <span>${t.contrast}</span>
        </button>

        <!-- Account Details -->
        <div className="flex items-center space-x-3 border-l border-slate-800/80 pl-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <span className="text-xs font-bold text-indigo-400">
                ${state.googleUser ? state.googleUser.name.split(' ').map(n => n[0]).join('') : (state.role === 'student' ? 'ER' : 'SJ')}
              </span>
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-200 leading-tight">
                ${state.googleUser ? state.googleUser.name : (state.role === 'student' ? 'Eniyan Rajesh' : 'Dr. Sarah Jenkins')}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold leading-none mt-0.5">
                ${state.role}
              </div>
            </div>
          </div>
          
          <button 
            onClick=${handleLogout}
            className="p-2 rounded-xl border border-slate-800/40 bg-slate-900/50 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-all duration-150 flex items-center justify-center"
            title="Sign out of Google"
          >
            <i data-lucide="log-out" className="w-4 h-4"></i>
          </button>
        </div>

      </div>
    </header>
  `;
}
