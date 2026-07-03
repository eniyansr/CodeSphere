// CodeSphere Pro - Google OAuth 2.0 Authentication
// Flow: Landing -> Sign Up (role -> form) | Login (chooser / email -> password)
import React, { useState } from 'https://esm.sh/react@18.2.0';
import { html, useAppState, loadTeacherData, findStudentByCode } from '../state.js';

// ---- LocalStorage Helpers ---------------------------------------------------
const ACCOUNTS_KEY = 'codesphere_accounts';
const userDataKey  = (email) => `codesphere_user_${email.replace(/[^a-z0-9]/gi, '_')}`;

function getSavedAccounts() {
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '{}'); }
  catch { return {}; }
}

function saveAccount(email, profile, role) {
  const all = getSavedAccounts();
  all[email.toLowerCase()] = {
    ...(all[email.toLowerCase()] || {}),
    name: profile.name,
    avatar: profile.avatar,
    color: profile.color,
    email: email.toLowerCase(),
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

function isRegistered(email) {
  return !!getSavedAccounts()[email.toLowerCase()];
}

// ---- Avatar Generator -------------------------------------------------------
const AVATAR_COLORS = ['#6366F1','#0EA5E9','#10B981','#F59E0B','#EC4899','#8B5CF6','#EF4444','#14B8A6'];
function buildProfile(name, email) {
  const initials = (name || '').trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U?';
  const color    = AVATAR_COLORS[(email || 'a').charCodeAt(0) % AVATAR_COLORS.length];
  return { name: (name || '').trim() || email.split('@')[0], avatar: initials, color };
}

// ---- Google SVG Icon --------------------------------------------------------
const GoogleGIcon = html`
  <svg width="20" height="20" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
  </svg>`;

// ---- Spinner ----------------------------------------------------------------
const Spinner = html`<div style=${{ width:'20px',height:'20px',border:'2px solid #d1d5db',borderTopColor:'#3b82f6',borderRadius:'50%',animation:'spin 0.7s linear infinite' }}></div>`;

// ---- Shared side panel HTML (returned as a string of html template) ---------
function sidePanel() {
  return html`
    <div className="hidden lg:flex w-5/12 flex-col justify-between p-12 border-r border-slate-800/40 relative overflow-hidden"
         style=${{ background: 'linear-gradient(135deg,#0d1117 0%,#0f172a 50%,#1e1b4b 100%)' }}>
      <div style=${{ position:'absolute',top:'-8rem',left:'-8rem',width:'24rem',height:'24rem',background:'rgba(99,102,241,0.08)',borderRadius:'50%',filter:'blur(60px)',pointerEvents:'none' }}></div>
      <div style=${{ position:'absolute',bottom:'-6rem',right:'-6rem',width:'20rem',height:'20rem',background:'rgba(6,182,212,0.06)',borderRadius:'50%',filter:'blur(60px)',pointerEvents:'none' }}></div>

      <div className="flex items-center gap-3" style=${{ position:'relative',zIndex:10 }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
             style=${{ background:'linear-gradient(135deg,#4f46e5,#22d3ee)' }}>
          <i data-lucide="terminal" className="w-5 h-5 text-white"></i>
        </div>
        <div>
          <div className="text-white font-extrabold text-lg tracking-tight leading-none">CodeSphere</div>
          <div className="text-cyan-400 text-[10px] font-bold tracking-widest uppercase mt-0.5">Pro</div>
        </div>
      </div>

      <div className="space-y-6" style=${{ position:'relative',zIndex:10 }}>
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-indigo-400 text-[11px] font-semibold"
               style=${{ background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.2)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse inline-block"></span>
            AI-Powered Coding Platform
          </div>
          <h1 className="text-4xl font-black text-white leading-tight">
            Learn. Code.<br/>
            <span style=${{ background:'linear-gradient(to right,#818cf8,#22d3ee)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>
              Compete.
            </span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            A secure, AI-proctored platform for competitive coding assessments and collaborative learning.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          ${['Live Proctoring','AI Mentor','12 Languages','Battle Arena','Certificates'].map(f => html`
            <span key=${f} className="px-2.5 py-1 rounded-lg text-[11px] text-slate-300 font-medium"
                  style=${{ background:'rgba(30,41,59,0.6)',border:'1px solid rgba(51,65,85,0.4)' }}>${f}</span>
          `)}
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          ${[
            { icon:'shield-check', label:'AI Proctoring',   sub:'Real-time monitoring' },
            { icon:'zap',          label:'Instant Results', sub:'Auto-graded tests' },
            { icon:'users',        label:'Classrooms',      sub:'Collaborative learning' },
            { icon:'award',        label:'Certificates',    sub:'Verified credentials' },
          ].map(({ icon, label, sub }) => html`
            <div key=${label} className="flex items-start gap-2.5 p-3 rounded-xl"
                 style=${{ background:'rgba(30,41,59,0.4)',border:'1px solid rgba(51,65,85,0.3)' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                   style=${{ background:'rgba(99,102,241,0.15)',border:'1px solid rgba(99,102,241,0.2)' }}>
                <i data-lucide=${icon} className="w-3.5 h-3.5 text-indigo-400"></i>
              </div>
              <div>
                <div className="text-slate-200 text-xs font-semibold">${label}</div>
                <div className="text-slate-500 text-[10px]">${sub}</div>
              </div>
            </div>
          `)}
        </div>
      </div>

      <div className="pl-4" style=${{ position:'relative',zIndex:10,borderLeft:'2px solid rgba(99,102,241,0.4)' }}>
        <p className="text-slate-400 text-xs italic">"Security and intelligence combined into one platform."</p>
        <p className="text-slate-500 text-[10px] mt-1">— CodeSphere Pro v3.0.0</p>
      </div>
    </div>`;
}

// ---- Back button helper -----------------------------------------------------
function BackBtn({ onClick }) {
  return html`
    <button onClick=${onClick} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs font-semibold transition mb-2">
      <i data-lucide="arrow-left" className="w-3.5 h-3.5"></i> Back
    </button>`;
}

// ---- Error box helper --------------------------------------------------------
function ErrBox({ msg }) {
  if (!msg) return null;
  return html`
    <div className="flex items-start gap-2 p-3 rounded-xl" style=${{ background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)' }}>
      <i data-lucide="alert-circle" className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5"></i>
      <p className="text-red-400 text-xs">${msg}</p>
    </div>`;
}

// =============================================================================
// MAIN AUTH COMPONENT
// =============================================================================
export function Auth() {
  const { state: globalState, updateState } = useAppState();

  const [authStep, setAuthStep]           = useState('landing');
  const [selectedRole, setSelectedRole]   = useState(null);
  const [formName, setFormName]           = useState('');
  const [formEmail, setFormEmail]         = useState('');
  const [formPassword, setFormPassword]   = useState('');
  const [showPass, setShowPass]           = useState(false);
  const [studentCode, setStudentCode]     = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [error, setError]                 = useState('');
  const [oauthLoading, setOauthLoading]   = useState(false);

  // ---- Complete Login -------------------------------------------------------
  const completeLogin = (role, emailVal, accountVal) => {
    const email = (emailVal || formEmail).toLowerCase();
    const acct  = accountVal || buildProfile(formName || email.split('@')[0], email);
    saveAccount(email, acct, role);
    const userData    = getUserData(email);
    const teacherData = role === 'teacher'
      ? loadTeacherData(email)
      : { classes: [], studentProfiles: globalState.studentProfiles || [] };

    updateState({
      isLoggedIn:      true,
      googleUser:      { name: acct.name, email },
      role,
      activeTab:       'dashboard',
      notepadContent:  userData.notepadContent !== undefined ? userData.notepadContent : '',
      classes:         teacherData.classes,
      studentProfiles: role === 'teacher' ? teacherData.studentProfiles : (globalState.studentProfiles || []),
    });
  };

  // ---- Simulate Google OAuth -----------------------------------------------
  const simulateGoogleOAuth = (role) => {
    setError('');
    if (!formName.trim())                               { setError('Please enter your full name.'); return; }
    if (!formEmail.trim() || !formEmail.includes('@'))  { setError('Please enter a valid email address.'); return; }
    if (isRegistered(formEmail) && authStep === 'signup_form') {
      setError('An account with this email already exists. Please log in instead.');
      return;
    }
    setOauthLoading(true);
    setTimeout(() => {
      setOauthLoading(false);
      completeLogin(role, formEmail, buildProfile(formName, formEmail));
    }, 1400);
  };

  // ---- Student access code -------------------------------------------------
  const handleStudentCodeSubmit = (e) => {
    e.preventDefault();
    setError('');
    const code = studentCode.trim().toUpperCase();
    if (!code) return;
    const found = findStudentByCode(code);
    if (found) {
      const email   = found.email || (found.name.toLowerCase().replace(/\s+/g,'') + '@codesphere.edu');
      completeLogin('student', email, buildProfile(found.name, email));
    } else {
      setError('Invalid Access Code. Please ask your teacher for your registration code.');
    }
  };

  // ---- Login email submit ---------------------------------------------------
  const handleLoginEmailSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!formEmail.trim() || !formEmail.includes('@')) { setError('Enter a valid email address.'); return; }
    if (!isRegistered(formEmail)) { setError('No account found with this email. Please sign up first.'); return; }
    const saved = getSavedAccounts()[formEmail.toLowerCase()];
    setSelectedAccount({ name: saved.name, avatar: saved.avatar, color: saved.color });
    setAuthStep('login_pass');
  };

  // ---- Login Google quick --------------------------------------------------
  const handleLoginGoogle = () => {
    setError('');
    if (!formEmail.trim() || !formEmail.includes('@')) { setError('Enter your email first.'); return; }
    if (!isRegistered(formEmail)) { setError('No account found. Please sign up first.'); return; }
    const saved = getSavedAccounts()[formEmail.toLowerCase()];
    setSelectedAccount({ name: saved.name, avatar: saved.avatar, color: saved.color });
    setOauthLoading(true);
    setTimeout(() => {
      setOauthLoading(false);
      completeLogin(saved.role, formEmail, { name: saved.name, avatar: saved.avatar, color: saved.color });
    }, 1200);
  };

  // ---- Login password submit -----------------------------------------------
  const handleLoginPassSubmit = (e) => {
    e.preventDefault();
    setError('');
    const saved = getSavedAccounts()[formEmail.toLowerCase()];
    if (saved && saved.role) {
      completeLogin(saved.role, formEmail, { name: saved.name, avatar: saved.avatar, color: saved.color });
    } else {
      setAuthStep('role');
    }
  };

  // ---- Chooser select ------------------------------------------------------
  const handleChooserSelect = (email) => {
    const saved = getSavedAccounts()[email.toLowerCase()];
    const acct  = { name: saved.name, avatar: saved.avatar, color: saved.color };
    setFormEmail(email);
    setSelectedAccount(acct);
    if (saved && saved.role) {
      completeLogin(saved.role, email, acct);
    } else {
      setAuthStep('role');
    }
  };

  // ---- Reset to landing ---------------------------------------------------
  const goLanding = () => {
    setAuthStep('landing');
    setFormName(''); setFormEmail(''); setFormPassword('');
    setSelectedRole(null); setSelectedAccount(null);
    setError(''); setShowPass(false); setStudentCode('');
    setOauthLoading(false);
  };

  // ---- Common outer shell --------------------------------------------------
  const shell = (rightContent) => html`
    <div className="min-h-screen flex bg-[#080a10]" style=${{ position:'relative',overflow:'hidden' }}>
      <div style=${{ position:'absolute',top:'-10rem',left:'-10rem',width:'32rem',height:'32rem',background:'rgba(99,102,241,0.07)',borderRadius:'50%',filter:'blur(80px)',pointerEvents:'none' }}></div>
      <div style=${{ position:'absolute',bottom:'-8rem',right:'-8rem',width:'24rem',height:'24rem',background:'rgba(6,182,212,0.05)',borderRadius:'50%',filter:'blur(80px)',pointerEvents:'none' }}></div>
      ${sidePanel()}
      <div className="flex-1 flex items-center justify-center p-6" style=${{ position:'relative',zIndex:1 }}>
        <div className="w-full" style=${{ maxWidth:'360px' }}>
          ${rightContent}
        </div>
      </div>
    </div>`;

  // ==========================================================================
  // LANDING
  // ==========================================================================
  if (authStep === 'landing') {
    return shell(html`
      <div className="space-y-6">
        <!-- Mobile logo -->
        <div className="flex items-center gap-2.5 lg:hidden">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style=${{ background:'linear-gradient(135deg,#4f46e5,#22d3ee)' }}>
            <i data-lucide="terminal" className="w-4 h-4 text-white"></i>
          </div>
          <span className="text-white font-extrabold text-base">CodeSphere <span className="text-cyan-400">Pro</span></span>
        </div>

        <div>
          <h2 className="text-2xl font-black text-white">Welcome</h2>
          <p className="text-slate-400 text-sm mt-1">Create an account or sign in to continue</p>
        </div>

        <!-- Sign Up cards -->
        <div className="space-y-3">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Create Account</p>

          <button id="landing-teacher-signup"
            onClick=${() => { setSelectedRole('teacher'); setAuthStep('signup_form'); setError(''); }}
            className="group w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition duration-200"
            style=${{ border:'1px solid rgba(16,185,129,0.3)',background:'rgba(16,185,129,0.07)' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition group-hover:scale-105"
                 style=${{ background:'rgba(16,185,129,0.15)',border:'1px solid rgba(16,185,129,0.3)' }}>
              <i data-lucide="presentation" className="w-5 h-5 text-emerald-400"></i>
            </div>
            <div className="text-left flex-1">
              <div className="text-slate-100 font-bold text-sm">Sign up as Teacher</div>
              <div className="text-slate-500 text-xs mt-0.5">Create classes, exams and proctor students</div>
            </div>
            <i data-lucide="arrow-right" className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition"></i>
          </button>

          <button id="landing-student-signup"
            onClick=${() => { setSelectedRole('student'); setAuthStep('signup_form'); setError(''); }}
            className="group w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition duration-200"
            style=${{ border:'1px solid rgba(99,102,241,0.3)',background:'rgba(99,102,241,0.07)' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition group-hover:scale-105"
                 style=${{ background:'rgba(99,102,241,0.15)',border:'1px solid rgba(99,102,241,0.3)' }}>
              <i data-lucide="graduation-cap" className="w-5 h-5 text-indigo-400"></i>
            </div>
            <div className="text-left flex-1">
              <div className="text-slate-100 font-bold text-sm">Sign up as Student</div>
              <div className="text-slate-500 text-xs mt-0.5">Practice coding, join exams and earn certificates</div>
            </div>
            <i data-lucide="arrow-right" className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition"></i>
          </button>
        </div>

        <!-- Login link -->
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-800"></div>
          <span className="text-slate-600 text-xs">already have an account?</span>
          <div className="flex-1 h-px bg-slate-800"></div>
        </div>

        <button id="landing-login-btn"
          onClick=${() => {
            const all = getSavedAccounts();
            setError('');
            setAuthStep(Object.keys(all).length > 0 ? 'chooser' : 'login_email');
          }}
          className="w-full py-3 rounded-xl font-bold text-indigo-400 text-sm transition hover:text-white"
          style=${{ border:'1px solid rgba(99,102,241,0.3)',background:'rgba(99,102,241,0.07)' }}>
          Log In
        </button>

        <!-- Student access code -->
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-800"></div>
          <span className="text-slate-600 text-[10px] uppercase tracking-wider font-bold">or student access code</span>
          <div className="flex-1 h-px bg-slate-800"></div>
        </div>

        <form onSubmit=${handleStudentCodeSubmit} className="space-y-3">
          <input type="text" id="student-code"
            value=${studentCode}
            onChange=${(e) => { setStudentCode(e.target.value); setError(''); }}
            className="w-full glass-input rounded-xl px-4 py-3 text-sm text-center font-mono font-bold tracking-widest text-cyan-400 uppercase placeholder-slate-600 focus:outline-none"
            style=${{ border:'1px solid rgba(6,182,212,0.3)' }}
            placeholder="STUD101" autoComplete="off" />
          ${error ? html`<${ErrBox} msg=${error}/>` : null}
          <button type="submit"
            className="w-full py-3 rounded-xl font-bold text-white text-sm transition"
            style=${{ background:'linear-gradient(135deg,#0891b2,#06b6d4)',boxShadow:'0 4px 20px rgba(6,182,212,0.25)' }}>
            Enter with Access Code
          </button>
        </form>
      </div>
    `);
  }

  // ==========================================================================
  // SIGN UP FORM
  // ==========================================================================
  if (authStep === 'signup_form') {
    const isTeacher = selectedRole === 'teacher';
    return shell(html`
      <div className="space-y-5">
        <${BackBtn} onClick=${goLanding}/>

        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-black text-white">Create Account</h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                style=${{ background: isTeacher ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)',
                          border: isTeacher ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(99,102,241,0.3)',
                          color: isTeacher ? '#34d399' : '#818cf8' }}>
            ${selectedRole}
          </span>
        </div>
        <p className="text-slate-400 text-sm">Sign up with Google or create a password</p>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 font-semibold block mb-1">Full Name</label>
            <input id="signup-name" type="text" value=${formName}
              onChange=${(e) => { setFormName(e.target.value); setError(''); }}
              className="w-full glass-input rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:outline-none"
              placeholder="John Doe" autoComplete="name" />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-semibold block mb-1">Email Address</label>
            <input id="signup-email" type="email" value=${formEmail}
              onChange=${(e) => { setFormEmail(e.target.value); setError(''); }}
              className="w-full glass-input rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:outline-none"
              placeholder="you@example.com" autoComplete="email" />
          </div>

          ${error ? html`<${ErrBox} msg=${error}/>` : null}

          <!-- Google OAuth button -->
          <button id="signup-google" onClick=${() => simulateGoogleOAuth(selectedRole)}
            disabled=${oauthLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition shadow-sm disabled:opacity-60">
            ${oauthLoading ? Spinner : GoogleGIcon}
            <span className="text-gray-700 text-sm font-semibold">
              ${oauthLoading ? 'Connecting to Google...' : 'Sign up with Google'}
            </span>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-800"></div>
            <span className="text-slate-600 text-xs">or with password</span>
            <div className="flex-1 h-px bg-slate-800"></div>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-semibold block mb-1">Create Password</label>
            <div className="relative">
              <input id="signup-password" type=${showPass ? 'text' : 'password'} value=${formPassword}
                onChange=${(e) => setFormPassword(e.target.value)}
                className="w-full glass-input rounded-xl px-4 py-3 pr-10 text-sm placeholder-slate-600 focus:outline-none"
                placeholder="At least 6 characters" autoComplete="new-password" />
              <button type="button" onClick=${() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                <i data-lucide=${showPass ? 'eye-off' : 'eye'} className="w-4 h-4"></i>
              </button>
            </div>
          </div>

          <button id="signup-submit" onClick=${() => {
            setError('');
            if (!formName.trim()) { setError('Please enter your full name.'); return; }
            if (!formEmail.trim() || !formEmail.includes('@')) { setError('Please enter a valid email.'); return; }
            if (isRegistered(formEmail)) { setError('Account already exists. Please log in.'); return; }
            if (!formPassword || formPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
            completeLogin(selectedRole, formEmail, buildProfile(formName, formEmail));
          }}
            className="w-full py-3 rounded-xl font-bold text-white text-sm transition"
            style=${{ background:'linear-gradient(135deg,#4f46e5,#6366f1)',boxShadow:'0 4px 20px rgba(99,102,241,0.25)' }}>
            Create Account
          </button>
        </div>

        <p className="text-center text-[11px] text-slate-600">
          Already have an account?
          <button onClick=${() => { setError(''); setAuthStep('login_email'); }}
            className="text-indigo-400 font-semibold hover:underline ml-1">Log in</button>
        </p>
      </div>
    `);
  }

  // ==========================================================================
  // LOGIN — CHOOSER
  // ==========================================================================
  if (authStep === 'chooser') {
    const all     = getSavedAccounts();
    const entries = Object.values(all).sort((a, b) => new Date(b.lastLogin) - new Date(a.lastLogin));
    return shell(html`
      <div className="space-y-5">
        <${BackBtn} onClick=${goLanding}/>
        <div>
          <h2 className="text-2xl font-black text-white">Welcome back</h2>
          <p className="text-slate-400 text-sm mt-1">Choose your account to continue</p>
        </div>

        <div className="space-y-2">
          ${entries.map(acc => html`
            <button key=${acc.email} id=${'chooser-' + acc.email.replace(/[^a-z0-9]/gi,'_')}
              onClick=${() => handleChooserSelect(acc.email)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition group"
              style=${{ border:'1px solid rgba(51,65,85,0.6)',background:'rgba(15,23,42,0.4)' }}>
              <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                   style=${{ background: acc.color }}>
                ${acc.avatar}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-semibold text-slate-200 truncate">${acc.name}</div>
                <div className="text-xs text-slate-500 truncate">${acc.email}</div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style=${{ background: acc.role === 'teacher' ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)',
                              border: acc.role === 'teacher' ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(99,102,241,0.3)',
                              color: acc.role === 'teacher' ? '#34d399' : '#818cf8' }}>
                ${acc.role || 'student'}
              </span>
              <i data-lucide="chevron-right" className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition flex-shrink-0"></i>
            </button>
          `)}
        </div>

        <button id="chooser-other" onClick=${() => { setFormEmail(''); setError(''); setAuthStep('login_email'); }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-slate-400 hover:text-slate-200 transition text-sm font-medium"
          style=${{ border:'1px solid rgba(51,65,85,0.4)' }}>
          <i data-lucide="plus" className="w-4 h-4"></i>
          Use another account
        </button>

        <p className="text-center text-[11px] text-slate-600">
          New here?
          <button onClick=${() => { setError(''); setAuthStep('signup_form'); setSelectedRole('student'); }}
            className="text-indigo-400 font-semibold hover:underline ml-1">Create an account</button>
        </p>
      </div>
    `);
  }

  // ==========================================================================
  // LOGIN — EMAIL
  // ==========================================================================
  if (authStep === 'login_email') {
    return shell(html`
      <div className="space-y-5">
        <${BackBtn} onClick=${goLanding}/>
        <div>
          <h2 className="text-2xl font-black text-white">Log In</h2>
          <p className="text-slate-400 text-sm mt-1">to continue to CodeSphere Pro</p>
        </div>

        <div>
          <label className="text-xs text-slate-400 font-semibold block mb-1">Email Address</label>
          <input id="login-email" type="email" value=${formEmail}
            onChange=${(e) => { setFormEmail(e.target.value); setError(''); }}
            className="w-full glass-input rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:outline-none"
            placeholder="you@example.com" autoComplete="email" />
        </div>

        ${error ? html`<${ErrBox} msg=${error}/>` : null}

        <!-- Google login button -->
        <button id="login-google" onClick=${handleLoginGoogle} disabled=${oauthLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition shadow-sm disabled:opacity-60">
          ${oauthLoading ? Spinner : GoogleGIcon}
          <span className="text-gray-700 text-sm font-semibold">
            ${oauthLoading ? 'Connecting...' : 'Continue with Google'}
          </span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-800"></div>
          <span className="text-slate-600 text-xs">or</span>
          <div className="flex-1 h-px bg-slate-800"></div>
        </div>

        <form onSubmit=${handleLoginEmailSubmit}>
          <button id="login-email-next" type="submit"
            className="w-full py-3 rounded-xl font-bold text-white text-sm transition"
            style=${{ background:'linear-gradient(135deg,#4f46e5,#6366f1)',boxShadow:'0 4px 20px rgba(99,102,241,0.25)' }}>
            Next — Enter Password
          </button>
        </form>

        <p className="text-center text-[11px] text-slate-600">
          Don't have an account?
          <button onClick=${() => { setError(''); setAuthStep('signup_form'); setSelectedRole('student'); }}
            className="text-indigo-400 font-semibold hover:underline ml-1">Sign up</button>
        </p>
      </div>
    `);
  }

  // ==========================================================================
  // LOGIN — PASSWORD
  // ==========================================================================
  if (authStep === 'login_pass') {
    return shell(html`
      <div className="space-y-5">
        <${BackBtn} onClick=${() => { setAuthStep('login_email'); setError(''); setShowPass(false); }}/>

        <div className="flex flex-col items-center gap-3 py-2">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-xl"
               style=${{ background: selectedAccount ? selectedAccount.color : '#6366F1' }}>
            ${selectedAccount ? selectedAccount.avatar : '??'}
          </div>
          <div className="text-center">
            <div className="text-slate-200 font-bold">${selectedAccount ? selectedAccount.name : ''}</div>
            <div className="text-slate-500 text-xs">${formEmail}</div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-emerald-400 text-xs font-semibold"
               style=${{ background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.2)' }}>
            <i data-lucide="check-circle" className="w-3 h-3"></i>
            Account Found
          </div>
        </div>

        <form onSubmit=${handleLoginPassSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 font-semibold block mb-1">Password</label>
            <div className="relative">
              <input id="login-password" type=${showPass ? 'text' : 'password'} value=${formPassword}
                onChange=${(e) => { setFormPassword(e.target.value); setError(''); }}
                className="w-full glass-input rounded-xl px-4 py-3 pr-10 text-sm placeholder-slate-600 focus:outline-none"
                placeholder="Enter your password" autoComplete="current-password" autoFocus />
              <button type="button" onClick=${() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                <i data-lucide=${showPass ? 'eye-off' : 'eye'} className="w-4 h-4"></i>
              </button>
            </div>
            <a href="#" className="text-indigo-400 text-xs hover:underline mt-1 block">Forgot password?</a>
          </div>

          ${error ? html`<${ErrBox} msg=${error}/>` : null}

          <button id="login-submit" type="submit"
            className="w-full py-3 rounded-xl font-bold text-white text-sm transition"
            style=${{ background:'linear-gradient(135deg,#4f46e5,#6366f1)',boxShadow:'0 4px 20px rgba(99,102,241,0.25)' }}>
            Log In
          </button>
        </form>
      </div>
    `);
  }

  // ==========================================================================
  // ROLE SELECTION (first-time users with no saved role)
  // ==========================================================================
  if (authStep === 'role') {
    return shell(html`
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-xl"
               style=${{ background: selectedAccount ? selectedAccount.color : '#6366F1' }}>
            ${selectedAccount ? selectedAccount.avatar : '??'}
          </div>
          <div className="text-center">
            <div className="text-slate-200 font-bold">${selectedAccount ? selectedAccount.name : ''}</div>
            <div className="text-slate-500 text-xs">${formEmail}</div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-emerald-400 text-xs font-semibold"
               style=${{ background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.2)' }}>
            <i data-lucide="check-circle" className="w-3 h-3"></i>
            Google Account Verified
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-xl font-black text-white">Select your role</h2>
          <p className="text-slate-400 text-sm mt-1">How will you use CodeSphere Pro?</p>
        </div>

        <div className="space-y-3">
          <button id="role-teacher" onClick=${() => completeLogin('teacher', formEmail, selectedAccount)}
            className="group w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition"
            style=${{ border:'1px solid rgba(16,185,129,0.3)',background:'rgba(16,185,129,0.07)' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition group-hover:scale-105"
                 style=${{ background:'rgba(16,185,129,0.15)',border:'1px solid rgba(16,185,129,0.3)' }}>
              <i data-lucide="presentation" className="w-5 h-5 text-emerald-400"></i>
            </div>
            <div className="text-left flex-1">
              <div className="text-slate-100 font-bold text-sm">Teacher Portal</div>
              <div className="text-slate-500 text-xs mt-0.5">Manage classes, exams and proctoring</div>
            </div>
            <i data-lucide="arrow-right" className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition"></i>
          </button>

          <button id="role-student" onClick=${() => completeLogin('student', formEmail, selectedAccount)}
            className="group w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition"
            style=${{ border:'1px solid rgba(99,102,241,0.3)',background:'rgba(99,102,241,0.07)' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition group-hover:scale-105"
                 style=${{ background:'rgba(99,102,241,0.15)',border:'1px solid rgba(99,102,241,0.3)' }}>
              <i data-lucide="graduation-cap" className="w-5 h-5 text-indigo-400"></i>
            </div>
            <div className="text-left flex-1">
              <div className="text-slate-100 font-bold text-sm">Student Portal</div>
              <div className="text-slate-500 text-xs mt-0.5">Practice, exams and certificates</div>
            </div>
            <i data-lucide="arrow-right" className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition"></i>
          </button>
        </div>

        <button onClick=${goLanding} className="w-full text-xs text-slate-500 hover:text-slate-300 transition font-medium text-center">
          Sign in with a different account
        </button>
      </div>
    `);
  }

  return null;
}
