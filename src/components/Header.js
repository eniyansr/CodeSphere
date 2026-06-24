// CodeSphere Pro - Top Navigation Header Component
import { TRANSLATIONS, updateState, state } from '../state.js';
import { resetAuth } from './Auth.js';

export function Header(state) {
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

  const fontSizes = ['sm', 'base', 'lg', 'xl'];

  return `
    <header class="glass-panel sticky top-0 z-40 px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/40">
      
      <!-- Logo and Lockdown Warning -->
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-cyan flex items-center justify-center shadow-lg shadow-brand-500/20">
          <i data-lucide="terminal" class="w-5 h-5 text-white"></i>
        </div>
        <div>
          <h1 class="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            CodeSphere <span class="text-accent-cyan font-semibold text-xs tracking-wider uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">Pro</span>
          </h1>
          <p class="text-xs text-slate-400 font-medium flex items-center gap-1">
            <span class="inline-block w-2 h-2 rounded-full bg-accent-emerald animate-pulse"></span>
            ${t.statusConnected}
          </p>
        </div>
        
        ${state.isLockdownActive ? `
          <div class="ml-4 px-3 py-1.5 rounded-lg bg-accent-rose/10 border border-accent-rose/30 flex items-center space-x-2 animate-pulse">
            <i data-lucide="shield-alert" class="w-4 h-4 text-accent-rose"></i>
            <span class="text-xs font-bold text-accent-rose tracking-wider uppercase">${t.securityLockdown}</span>
          </div>
        ` : ''}
      </div>

      <!-- Settings & Controls Section -->
      <div class="flex flex-wrap items-center gap-4">
        
        <!-- Portal Role Badge (Read Only) -->
        <div class="flex items-center space-x-2 bg-slate-900/50 px-3.5 py-1.5 rounded-xl border border-slate-800/40 text-slate-200">
          <i data-lucide="shield-check" class="w-4 h-4 text-indigo-400"></i>
          <span class="text-xs font-bold uppercase tracking-wider">
            ${state.role === 'student' ? t.student : state.role === 'teacher' ? t.teacher : t.adminRole} Portal
          </span>
        </div>

        <!-- Floating Notepad Toggle -->
        <button 
          id="header-notepad-toggle" 
          class="p-2 rounded-xl border transition-all duration-150 flex items-center gap-1.5 text-sm font-medium
          ${state.notepadOpen 
            ? 'bg-indigo-500 text-white border-indigo-500 shadow-glow-indigo' 
            : 'bg-slate-900/50 text-slate-300 border-slate-800/40 hover:bg-slate-800 hover:text-white'}"
        >
          <i data-lucide="notebook-pen" class="w-4 h-4"></i>
          <span class="hidden md:inline">Notepad</span>
        </button>

        <!-- Language Translations Selector -->
        <div class="flex items-center bg-slate-900/50 p-1 rounded-xl border border-slate-800/40">
          <select id="header-lang-select" class="bg-slate-800 text-sm font-medium text-slate-300 rounded-lg px-2 py-1 outline-none cursor-pointer border border-slate-700/50 hover:bg-slate-700/50 transition duration-150">
            <option value="en" ${state.language === 'en' ? 'selected' : ''}>English</option>
            <option value="ta" ${state.language === 'ta' ? 'selected' : ''}>தமிழ்</option>
            <option value="hi" ${state.language === 'hi' ? 'selected' : ''}>हिन्दी</option>
            <option value="te" ${state.language === 'te' ? 'selected' : ''}>తెలుగు</option>
            <option value="ml" ${state.language === 'ml' ? 'selected' : ''}>മലയാളം</option>
            <option value="kn" ${state.language === 'kn' ? 'selected' : ''}>ಕನ್ನಡ</option>
          </select>
        </div>

        <!-- Accessibility Font Scaling -->
        <div class="flex items-center space-x-1 bg-slate-900/50 p-1 rounded-xl border border-slate-800/40">
          <i data-lucide="type" class="w-4 h-4 text-slate-400 mx-1"></i>
          ${fontSizes.map(size => `
            <button 
              data-size-btn="${size}" 
              class="w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-all duration-150 
              ${state.fontSize === size ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}"
            >
              ${size.toUpperCase()}
            </button>
          `).join('')}
        </div>

        <!-- Accessibility Contrast Toggle -->
        <button 
          id="header-contrast-toggle" 
          class="p-2 rounded-xl border transition-all duration-150 flex items-center gap-1.5 text-sm font-medium
          ${state.highContrast 
            ? 'bg-white text-black border-white' 
            : 'bg-slate-900/50 text-slate-300 border-slate-800/40 hover:bg-slate-800 hover:text-white'}"
        >
          <i data-lucide="eye" class="w-4 h-4"></i>
          <span>${t.contrast}</span>
        </button>

        <!-- Current User Account Details & Google Logout -->
        <div class="flex items-center space-x-3 border-l border-slate-800/80 pl-4">
          <div class="flex items-center space-x-2">
            <div class="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <span class="text-xs font-bold text-indigo-400">
                ${state.googleUser ? state.googleUser.name.split(' ').map(n => n[0]).join('') : (state.role === 'student' ? 'ER' : 'SJ')}
              </span>
            </div>
            <div class="hidden sm:block">
              <div class="text-xs font-semibold text-slate-200">
                ${state.googleUser ? state.googleUser.name : (state.role === 'student' ? 'Eniyan Rajesh' : 'Dr. Sarah Jenkins')}
              </div>
              <div class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                ${state.role}
              </div>
            </div>
          </div>
          
          <button 
            id="header-logout-btn" 
            class="p-2 rounded-xl border border-slate-800/40 bg-slate-900/50 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-all duration-150 flex items-center justify-center"
            title="Sign out of Google"
          >
            <i data-lucide="log-out" class="w-4 h-4"></i>
          </button>
        </div>

      </div>
    </header>
  `;
}

// Bind Header Events dynamically after drawing
export function bindHeaderEvents() {
  document.getElementById('header-notepad-toggle')?.addEventListener('click', () => {
    updateState({ notepadOpen: !state.notepadOpen });
  });

  document.getElementById('header-logout-btn')?.addEventListener('click', () => {
    resetAuth();
  });

  document.getElementById('header-lang-select')?.addEventListener('change', (e) => {
    updateState({ language: e.target.value });
  });

  document.getElementById('header-contrast-toggle')?.addEventListener('click', () => {
    const highContrast = !state.highContrast;
    updateState({ highContrast });
  });

  document.querySelectorAll('[data-size-btn]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const size = e.currentTarget.getAttribute('data-size-btn');
      updateState({ fontSize: size });
    });
  });
}
