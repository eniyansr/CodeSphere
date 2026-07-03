// CodeSphere Pro - Google OAuth-Style Sign-in with Saved Accounts (React Edition)
import React, { useState } from 'https://esm.sh/react@18.2.0';
import { html, useAppState, loadTeacherData, findStudentByCode } from '../state.js';

// LocalStorage helpers
const ACCOUNTS_KEY = 'codesphere_accounts';
const userDataKey  = (email) => `codesphere_user_${email.replace(/[^a-z0-9]/gi, '_')}`;

function getSavedAccounts() {
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '{}'); }
  catch { return {}; }
}

function saveAccount(email, profile, role) {
  const all = getSavedAccounts();
  all[email] = {
    ...(all[email] || {}),
    name: profile.name,
    avatar: profile.avatar,
    color: profile.color,
    email,
    role,
    lastLogin: new Date().toISOString()
  };
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(all));
}

export function getUserData(email) {
  try { return JSON.parse(localStorage.getItem(userDataKey(email)) || '{}'); }
  catch { return {}; }
}

export function saveUserData(email, data) {
  if (!email) return;
  const existing = getUserData(email);
  localStorage.setItem(userDataKey(email), JSON.stringify({ ...existing, ...data }));
}

// Account seeds for quick login / demo accounts
const ACCOUNT_SEED = {
  'eniyan.rajesh@gmail.com':      { name: 'Eniyan Rajesh',     avatar: 'ER', color: '#4F46E5' },
  'sarah.jenkins@codesphere.edu': { name: 'Dr. Sarah Jenkins', avatar: 'SJ', color: '#059669' },
  'admin@codesphere.edu':         { name: 'Systems Admin',     avatar: 'AD', color: '#DC2626' },
};

function resolveAccount(email) {
  const saved = getSavedAccounts()[email.toLowerCase()];
  if (saved) return { name: saved.name, avatar: saved.avatar, color: saved.color };
  const seed  = ACCOUNT_SEED[email.toLowerCase()];
  if (seed)  return seed;
  const initials = email.split('@')[0].slice(0, 2).toUpperCase();
  const colors   = ['#6366F1','#0EA5E9','#10B981','#F59E0B','#EC4899','#8B5CF6'];
  const color    = colors[email.charCodeAt(0) % colors.length];
  return { name: email.split('@')[0], avatar: initials, color };
}

// Google SVG elements
const GoogleLogoSVG = html`
  <svg width="75" height="24" viewBox="0 0 75 24" xmlns="http://www.w3.org/2000/svg">
    <text x="0"  y="20" fontFamily="'Product Sans',Arial,sans-serif" fontSize="22" fontWeight="400" fill="#4285F4">G</text>
    <text x="16" y="20" fontFamily="'Product Sans',Arial,sans-serif" fontSize="22" fontWeight="400" fill="#EA4335">o</text>
    <text x="30" y="20" fontFamily="'Product Sans',Arial,sans-serif" fontSize="22" fontWeight="400" fill="#FBBC05">o</text>
    <text x="44" y="20" fontFamily="'Product Sans',Arial,sans-serif" fontSize="22" fontWeight="400" fill="#4285F4">g</text>
    <text x="56" y="20" fontFamily="'Product Sans',Arial,sans-serif" fontSize="22" fontWeight="400" fill="#34A853">l</text>
    <text x="63" y="20" fontFamily="'Product Sans',Arial,sans-serif" fontSize="22" fontWeight="400" fill="#EA4335">e</text>
  </svg>`;

const GoogleGIcon = html`
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
  </svg>`;

export function Auth() {
  const { state: globalState, updateState } = useAppState();
  const [authStep, setAuthStep] = useState('landing'); // 'landing' | 'chooser' | 'email' | 'password' | 'role'
  const [enteredEmail, setEnteredEmail] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [studentCode, setStudentCode] = useState('');

  const completeLogin = (role, emailVal = enteredEmail, accountVal = selectedAccount) => {
    saveAccount(emailVal, accountVal, role);
    const userData = getUserData(emailVal);
    const teacherData = role === 'teacher' ? loadTeacherData(emailVal) : { classes: [], studentProfiles: globalState.studentProfiles || [] };

    updateState({
      isLoggedIn: true,
      googleUser: { name: accountVal?.name || emailVal, email: emailVal },
      role,
      activeTab: 'dashboard',
      notepadContent: userData.notepadContent !== undefined ? userData.notepadContent : '',
      classes: teacherData.classes,
      studentProfiles: role === 'teacher' ? teacherData.studentProfiles : (globalState.studentProfiles || []),
    });
  };

  const handleLandingGoogleClick = () => {
    const all = getSavedAccounts();
    if (Object.keys(all).length > 0) {
      setAuthStep('chooser');
    } else {
      setAuthStep('email');
    }
  };

  const handleLandingEmailSubmit = (e) => {
    e.preventDefault();
    if (!enteredEmail.trim()) return;
    const resolved = resolveAccount(enteredEmail);
    setSelectedAccount(resolved);
    setAuthStep('password');
  };

  const handleLandingStudentCodeSubmit = (e) => {
    e.preventDefault();
    const codeVal = studentCode.trim().toUpperCase();
    if (!codeVal) return;

    const foundStudent = findStudentByCode(codeVal);

    if (foundStudent) {
      const studentEmail = foundStudent.email || `${foundStudent.name.toLowerCase().replace(/\s+/g, '')}@codesphere.edu`;
      const resolved = {
        name: foundStudent.name,
        avatar: foundStudent.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
        color: '#4F46E5'
      };
      completeLogin('student', studentEmail, resolved);
    } else {
      alert("Invalid Access Code. Please ask your teacher for your student registration code.");
    }
  };

  const handleChooserAccountSelect = (email) => {
    const resolved = resolveAccount(email);
    setEnteredEmail(email);
    setSelectedAccount(resolved);
    const saved = getSavedAccounts()[email.toLowerCase()];
    if (saved && saved.role) {
      completeLogin(saved.role, email, resolved);
    } else {
      setAuthStep('role');
    }
  };

  const handleEmailStepSubmit = (e) => {
    e.preventDefault();
    if (!enteredEmail.trim()) return;
    const resolved = resolveAccount(enteredEmail);
    setSelectedAccount(resolved);
    setAuthStep('password');
  };

  const handlePasswordStepSubmit = (e) => {
    e.preventDefault();
    const saved = getSavedAccounts()[enteredEmail.toLowerCase()];
    if (saved && saved.role) {
      completeLogin(saved.role);
    } else {
      setAuthStep('role');
    }
  };

  const wrapCard = (innerContent) => {
    return html`
      <div className="min-h-screen flex items-center justify-center bg-[#080a10] p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            ${innerContent}
          </div>
          <p className="text-center text-[10px] text-slate-600 mt-4">
            <a href="#" className="hover:underline text-slate-500">Privacy Policy</a>
            ${'\u00A0'}&middot;${'\u00A0'}
            <a href="#" className="hover:underline text-slate-500">Terms of Service</a>
          </p>
        </div>
      </div>
    `;
  };

  // Rendering conditional steps
  if (authStep === 'chooser') {
    const all = getSavedAccounts();
    const entries = Object.values(all).sort((a, b) => new Date(b.lastLogin) - new Date(a.lastLogin));
    return wrapCard(html`
      <div className="px-8 pt-8 pb-4">
        <div className="flex justify-center mb-5">${GoogleLogoSVG}</div>
        <h2 className="text-gray-800 text-2xl font-normal text-center mb-1">Choose an account</h2>
        <p className="text-gray-500 text-sm text-center">to continue to <span className="font-medium text-gray-700">CodeSphere Pro</span></p>
      </div>
      <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
        ${entries.map(acc => html`
          <button 
            key=${acc.email}
            onClick=${() => handleChooserAccountSelect(acc.email)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left border-b border-gray-100 last:border-0 group"
          >
            <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-sm"
                 style=${{ background: acc.color }}>${acc.avatar}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800 truncate">${acc.name}</div>
              <div className="text-[11px] text-gray-500 truncate">${acc.email}</div>
            </div>
            <span className=${`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
              acc.role === 'teacher'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
            }`}>
              ${acc.role || 'student'}
            </span>
            <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        `)}
      </div>
      <div className="px-4 py-3 border-t border-gray-100">
        <button 
          onClick=${() => setAuthStep('email')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition text-left"
        >
          <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center bg-gray-100">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
            </svg>
          </div>
          <span className="text-sm text-blue-600 font-medium">Use another account</span>
        </button>
      </div>
    `);
  }

  if (authStep === 'email') {
    return wrapCard(html`
      <div className="px-8 pt-8 pb-5">
        <div className="flex justify-center mb-5">${GoogleLogoSVG}</div>
        <h2 className="text-gray-800 text-2xl font-normal text-center mb-1">Sign in</h2>
        <p className="text-gray-500 text-sm text-center">to continue to <span className="font-medium text-gray-700">CodeSphere Pro</span></p>
      </div>
      <div className="px-8 pb-8 space-y-4">
        <form onSubmit=${handleEmailStepSubmit}>
          <div className="relative border border-gray-300 rounded-sm focus-within:border-blue-600 focus-within:border-2 transition-all">
            <input 
              type="email"
              value=${enteredEmail}
              onChange=${(e) => setEnteredEmail(e.target.value)}
              className="w-full px-3 pt-5 pb-1.5 text-gray-900 text-sm bg-transparent outline-none peer"
              placeholder=" " 
              autoComplete="email" 
              required
            />
            <label className="absolute left-3 top-3.5 text-gray-400 text-xs pointer-events-none transition-all
              peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm
              peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-blue-600">Email or phone</label>
          </div>
          <p className="text-xs text-gray-500 mt-3 leading-relaxed">
            Not your computer? Use a Private Window to sign in.
            <a href="#" className="text-blue-600 hover:underline">Learn more about using Guest mode</a>
          </p>
          <div className="flex justify-between items-center mt-8">
            <a 
              href="#" 
              onClick=${(e) => { e.preventDefault(); setAuthStep('landing'); }}
              className="text-blue-600 text-sm font-semibold hover:bg-blue-50 px-3 py-2 rounded transition"
            >
              Back
            </a>
            <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition">Next</button>
          </div>
        </form>
      </div>
    `);
  }

  if (authStep === 'password') {
    return wrapCard(html`
      <div className="px-8 pt-8 pb-5">
        <div className="flex justify-center mb-5">${GoogleLogoSVG}</div>
        <div className="flex items-center justify-center mb-4">
          <div 
            onClick=${() => setAuthStep('email')}
            className="flex items-center gap-2 border border-gray-300 rounded-full px-3 py-1.5 cursor-pointer hover:bg-gray-50 transition"
          >
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                 style=${{ background: selectedAccount ? selectedAccount.color : '#4F46E5' }}>
              ${selectedAccount ? selectedAccount.avatar : '?'}
            </div>
            <span className="text-gray-700 text-xs font-medium">${enteredEmail}</span>
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </div>
        </div>
        <h2 className="text-gray-800 text-2xl font-normal text-center mb-1">Welcome</h2>
        ${selectedAccount && html`<p className="text-gray-600 text-sm text-center">${selectedAccount.name}</p>`}
      </div>
      <div className="px-8 pb-8 space-y-4">
        <form onSubmit=${handlePasswordStepSubmit}>
          <div className="relative border border-gray-300 rounded-sm focus-within:border-blue-600 focus-within:border-2 transition-all">
            <input 
              type="password"
              className="w-full px-3 pt-5 pb-1.5 text-gray-900 text-sm bg-transparent outline-none peer"
              placeholder=" " 
              required
            />
            <label className="absolute left-3 top-3.5 text-gray-400 text-xs pointer-events-none transition-all
              peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm
              peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-blue-600">Enter your password</label>
          </div>
          <div className="mt-3">
            <a href="#" className="text-blue-600 text-sm hover:underline">Forgot password?</a>
          </div>
          <div className="flex justify-between items-center mt-8">
            <a href="#" className="text-blue-600 text-sm font-semibold hover:bg-blue-50 px-3 py-2 rounded transition">More options</a>
            <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition">Next</button>
          </div>
        </form>
      </div>
    `);
  }

  if (authStep === 'role') {
    return html`
      <div className="min-h-screen flex items-center justify-center bg-[#080a10] p-4">
        <div className="w-full max-w-lg space-y-5">
          <div className="bg-white rounded-2xl shadow-xl px-8 py-7 text-center space-y-3">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-lg font-bold text-white shadow-lg"
                 style=${{ background: selectedAccount ? selectedAccount.color : '#4F46E5' }}>
              ${selectedAccount ? selectedAccount.avatar : '??'}
            </div>
            <div>
              <h2 className="text-gray-800 text-xl font-semibold">${selectedAccount ? selectedAccount.name : 'User'}</h2>
              <p className="text-gray-500 text-sm">${enteredEmail}</p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 rounded-full text-green-700 text-xs font-semibold">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              Google Account Verified
            </div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800/60 rounded-2xl p-6 glass-panel space-y-4">
            <div className="text-center">
              <h3 className="text-white font-extrabold text-lg">Teacher Portal</h3>
              <p className="text-slate-400 text-xs mt-1">Enter your teacher workspace to manage classes, proctoring &amp; student analytics.</p>
            </div>
            <div className="pt-1">
              <button 
                onClick=${() => completeLogin('teacher')}
                className="group w-full flex flex-col items-start p-5 rounded-xl border border-emerald-500/60 bg-emerald-500/10 hover:bg-emerald-500/15 hover:border-emerald-500/70 transition duration-200 text-left relative"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                  <i data-lucide="presentation" className="w-4 h-4 text-emerald-400"></i>
                </div>
                <div className="text-sm font-bold text-slate-200 group-hover:text-emerald-400 transition">Enter Teacher Portal</div>
                <p className="text-[11px] text-slate-500 leading-normal mt-1">Classes, proctoring &amp; student analytics</p>
                <div className="mt-3 text-[11px] font-bold text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition">
                  Enter <i data-lucide="arrow-right" className="w-3 h-3"></i>
                </div>
              </button>
            </div>
            <div className="text-center pt-1">
              <button 
                onClick=${() => {
                  const all = getSavedAccounts();
                  setAuthStep(Object.keys(all).length > 0 ? 'chooser' : 'landing');
                  setEnteredEmail('');
                  setSelectedAccount(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-300 transition font-medium"
              >
                ← Sign in with a different account
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Landing Step
  return html`
    <div className="min-h-screen flex bg-[#080a10]">
      <div className="hidden lg:flex w-5/12 flex-col justify-between p-12 bg-gradient-to-br from-[#0d1117] via-[#0f172a] to-[#1e1b4b] border-r border-slate-800/40 relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-cyan-500/8 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex items-center gap-3 z-10 text-left">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg">
            <i data-lucide="terminal" className="w-5 h-5 text-white"></i>
          </div>
          <div>
            <div className="text-white font-extrabold text-lg tracking-tight leading-none">CodeSphere</div>
            <div className="text-cyan-400 text-[10px] font-bold tracking-widest uppercase mt-0.5">Pro</div>
          </div>
        </div>
        
        <div className="z-10 space-y-6 text-left">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse inline-block"></span>
              AI-Powered Coding Platform
            </div>
            <h1 className="text-4xl font-black text-white leading-tight">Learn. Code.<br/><span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Compete.</span></h1>
            <p className="text-slate-400 text-sm leading-relaxed">A secure, AI-proctored platform for competitive coding assessments and collaborative learning.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            ${['Live Proctoring', 'AI Mentor', '12 Languages', 'Battle Arena', 'Certificates'].map(f => html`
              <span key=${f} className="px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/40 text-[11px] text-slate-300 font-medium">${f}</span>
            `)}
          </div>
        </div>
        
        <div className="z-10 border-l-2 border-indigo-500/40 pl-4 text-left">
          <p className="text-slate-400 text-xs italic">"Security and intelligence combined into one platform."</p>
          <p className="text-slate-500 text-[10px] mt-1">— CodeSphere Pro v2.4.0</p>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex items-center gap-2.5 lg:hidden mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center">
              <i data-lucide="terminal" className="w-4 h-4 text-white"></i>
            </div>
            <span className="text-white font-extrabold text-base">CodeSphere <span className="text-cyan-400">Pro</span></span>
          </div>
          
          <div className="space-y-1.5 text-left">
            <h2 className="text-2xl font-black text-white">Sign in</h2>
            <p className="text-slate-400 text-sm">to continue to CodeSphere Pro</p>
          </div>
          
          <div className="space-y-4">
            <button 
              onClick=${handleLandingGoogleClick}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 active:bg-gray-100 rounded-xl border border-gray-200 shadow-sm transition duration-150 active:scale-[0.99]"
            >
              ${GoogleGIcon}
              <span className="text-gray-700 text-sm font-semibold">Continue with Google</span>
            </button>
            
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-800"></div>
              <span className="text-slate-600 text-xs">or</span>
              <div className="flex-1 h-px bg-slate-800"></div>
            </div>
            
            <form onSubmit=${handleLandingEmailSubmit} className="space-y-3">
              <div className="space-y-1 text-left">
                <label className="text-xs text-slate-400 font-semibold block mb-1">Email address</label>
                <input 
                  type="email"
                  value=${enteredEmail}
                  onChange=${(e) => setEnteredEmail(e.target.value)}
                  className="w-full glass-input rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/60"
                  placeholder="you@example.com" 
                  required 
                  autoComplete="email"
                />
              </div>
              <button 
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] transition font-semibold text-white text-sm shadow-lg shadow-indigo-600/20"
              >
                Continue
              </button>
            </form>

            <div className="flex items-center gap-3 pt-2">
              <div className="flex-1 h-px bg-slate-800"></div>
              <span className="text-slate-600 text-[10px] uppercase tracking-wider font-bold">Or Student Access Code</span>
              <div className="flex-1 h-px bg-slate-800"></div>
            </div>
            
            <form onSubmit=${handleLandingStudentCodeSubmit} className="space-y-3">
              <div className="space-y-1 text-left">
                <label className="text-xs text-slate-400 font-semibold block mb-1">Access Code</label>
                <input 
                  type="text"
                  value=${studentCode}
                  onChange=${(e) => setStudentCode(e.target.value)}
                  className="w-full glass-input rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/60 text-center font-mono font-bold tracking-widest text-cyan-400 uppercase"
                  placeholder="e.g. STUD101" 
                  required 
                  autoComplete="off"
                />
              </div>
              <button 
                type="submit"
                className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-[0.99] transition font-bold text-white text-sm shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-1.5"
              >
                Enter Student Portal
              </button>
            </form>
          </div>
          
          <p className="text-center text-[11px] text-slate-600">
            Protected by <span className="text-indigo-400 font-semibold">CodeSphere Security</span>
            ${'\u00A0'}&mdash; All sessions are encrypted and proctored.
          </p>
        </div>
      </div>
    </div>
  `;
}
