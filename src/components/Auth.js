// CodeSphere Pro - Google OAuth 2.0 Authentication
// Flow: Landing → Sign Up (role → google form) | Login (chooser / email → password)
import React, { useState } from 'https://esm.sh/react@18.2.0';
import { html, useAppState, loadTeacherData, findStudentByCode } from '../state.js';

// ─── LocalStorage Helpers ──────────────────────────────────────────────────
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

// ─── Avatar Generator ──────────────────────────────────────────────────────
const AVATAR_COLORS = ['#6366F1','#0EA5E9','#10B981','#F59E0B','#EC4899','#8B5CF6','#EF4444','#14B8A6'];
function buildProfile(name, email) {
  const initials = name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U?';
  const color    = AVATAR_COLORS[email.charCodeAt(0) % AVATAR_COLORS.length];
  return { name: name.trim(), avatar: initials, color };
}

// ─── Google Icon Assets ────────────────────────────────────────────────────
const GoogleGIcon = html`
  <svg width="20" height="20" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
  </svg>`;

// ─── Shared Layout Wrappers ────────────────────────────────────────────────
const BgWrapper = ({ children }) => html`
  <div className="min-h-screen flex bg-[#080a10] relative overflow-hidden">
    <div className="absolute -top-40 -left-40 w-[32rem] h-[32rem] bg-indigo-600/8 rounded-full blur-3xl pointer-events-none"></div>
    <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-500/6 rounded-full blur-3xl pointer-events-none"></div>
    ${children}
  </div>`;

const SidePanel = () => html`
  <div className="hidden lg:flex w-5/12 flex-col justify-between p-12 bg-gradient-to-br from-[#0d1117] via-[#0f172a] to-[#1e1b4b] border-r border-slate-800/40 relative overflow-hidden">
    <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
    <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-cyan-500/8 rounded-full blur-3xl pointer-events-none"></div>

    <div className="flex items-center gap-3 z-10">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg">
        <i data-lucide="terminal" className="w-5 h-5 text-white"></i>
      </div>
      <div>
        <div className="text-white font-extrabold text-lg tracking-tight leading-none">CodeSphere</div>
        <div className="text-cyan-400 text-[10px] font-bold tracking-widest uppercase mt-0.5">Pro</div>
      </div>
    </div>

    <div className="z-10 space-y-6">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse inline-block"></span>
          AI-Powered Coding Platform
        </div>
        <h1 className="text-4xl font-black text-white leading-tight">
          Learn. Code.<br/>
          <span style=${{ background: 'linear-gradient(to right, #818cf8, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Compete.</span>
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          A secure, AI-proctored platform for competitive coding assessments and collaborative learning.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        ${['Live Proctoring', 'AI Mentor', '12 Languages', 'Battle Arena', 'Certificates'].map(f => html`
          <span key=${f} className="px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/40 text-[11px] text-slate-300 font-medium">${f}</span>
        `)}
      </div>
      <div className="grid grid-cols-2 gap-3 pt-2">
        ${[
          { icon: 'shield-check', label: 'AI Proctoring', sub: 'Real-time monitoring' },
          { icon: 'zap',          label: 'Instant Results', sub: 'Auto-graded tests' },
          { icon: 'users',        label: 'Classrooms', sub: 'Collaborative learning' },
          { icon: 'award',        label: 'Certificates', sub: 'Verified credentials' },
        ].map(({ icon, label, sub }) => html`
          <div key=${label} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
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

    <div className="z-10 border-l-2 border-indigo-500/40 pl-4">
      <p className="text-slate-400 text-xs italic">"Security and intelligence combined into one platform."</p>
      <p className="text-slate-500 text-[10px] mt-1">— CodeSphere Pro v3.0.0</p>
    </div>
  </div>`;

// ─── Main Auth Component ───────────────────────────────────────────────────
export function Auth() {
  const { state: globalState, updateState } = useAppState();

  // Steps: 'landing' | 'signup_role' | 'signup_form' | 'signup_code'
  //        | 'chooser' | 'login_email' | 'login_pass' | 'role'
  const [authStep, setAuthStep]           = useState('landing');
  const [mode, setMode]                   = useState('login');   // 'login' | 'signup'
  const [selectedRole, setSelectedRole]   = useState(null);      // 'teacher' | 'student'
  const [formName, setFormName]           = useState('');
  const [formEmail, setFormEmail]         = useState('');
  const [formPassword, setFormPassword]   = useState('');
  const [showPass, setShowPass]           = useState(false);
  const [studentCode, setStudentCode]     = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [error, setError]                 = useState('');
  const [oauthLoading, setOauthLoading]   = useState(false);

  // ── Complete Login ────────────────────────────────────────────────────────
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

  // ── Simulate Google OAuth popup ──────────────────────────────────────────
  const simulateGoogleOAuth = (intendedRole, signupName = '') => {
    setOauthLoading(true);
    setError('');
    setTimeout(() => {
      setOauthLoading(false);
      // In a real app, Google returns name+email; we simulate with the form inputs
      if (!formEmail.trim() || !formEmail.includes('@')) {
        setError('Please enter a valid email address.');
        return;
      }
      if (signupName && !signupName.trim()) {
        setError('Please enter your full name.');
        return;
      }
      completeLogin(intendedRole, formEmail, buildProfile(signupName || formEmail.split('@')[0], formEmail));
    }, 1400);
  };

  // ── Google OAuth button click on sign-up form ────────────────────────────
  const handleSignupGoogleClick = () => {
    if (!formName.trim()) { setError('Please enter your full name first.'); return; }
    if (!formEmail.trim() || !formEmail.includes('@')) { setError('Please enter a valid email.'); return; }
    if (isRegistered(formEmail) && mode === 'signup') {
      setError('An account with this email already exists. Please log in instead.');
      return;
    }
    simulateGoogleOAuth(selectedRole, formName);
  };

  // ── Student access code login ────────────────────────────────────────────
  const handleStudentCodeSubmit = (e) => {
    e.preventDefault();
    const code = studentCode.trim().toUpperCase();
    if (!code) return;
    const found = findStudentByCode(code);
    if (found) {
      const email    = found.email || `${found.name.toLowerCase().replace(/\s+/g, '')}@codesphere.edu`;
      const profile  = buildProfile(found.name, email);
      completeLogin('student', email, profile);
    } else {
      setError('Invalid Access Code. Please ask your teacher for your registration code.');
    }
  };

  // ── Returning user login flow ────────────────────────────────────────────
  const handleLoginEmailSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!formEmail.trim() || !formEmail.includes('@')) { setError('Enter a valid email.'); return; }
    if (!isRegistered(formEmail)) {
      setError("No account found. Please sign up first.");
      return;
    }
    const acct = getSavedAccounts()[formEmail.toLowerCase()];
    setSelectedAccount({ name: acct.name, avatar: acct.avatar, color: acct.color });
    setAuthStep('login_pass');
  };

  const handleLoginPassSubmit = (e) => {
    e.preventDefault();
    setError('');
    const saved = getSavedAccounts()[formEmail.toLowerCase()];
    if (saved?.role) {
      completeLogin(saved.role, formEmail, { name: saved.name, avatar: saved.avatar, color: saved.color });
    } else {
      setAuthStep('role');
    }
  };

  const handleChooserSelect = (email) => {
    const saved = getSavedAccounts()[email.toLowerCase()];
    const acct  = { name: saved.name, avatar: saved.avatar, color: saved.color };
    setFormEmail(email);
    setSelectedAccount(acct);
    if (saved?.role) {
      completeLogin(saved.role, email, acct);
    } else {
      setAuthStep('role');
    }
  };

  const goLanding = () => {
    setAuthStep('landing');
    setFormName(''); setFormEmail(''); setFormPassword('');
    setSelectedRole(null); setSelectedAccount(null);
    setError(''); setShowPass(false); setStudentCode('');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Landing Page — Sign Up / Login Toggle
  // ─────────────────────────────────────────────────────────────────────────
  if (authStep === 'landing') {
    return html`
      <${BgWrapper}>
        <${SidePanel}/>
        <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
          <div className="w-full max-w-sm space-y-8">
            <!-- Mobile logo -->
            <div className="flex items-center gap-2.5 lg:hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center">
                <i data-lucide="terminal" className="w-4 h-4 text-white"></i>
              </div>
              <span className="text-white font-extrabold text-base">CodeSphere <span className="text-cyan-400">Pro</span></span>
            </div>

            <!-- Tab Toggle: Sign Up / Login -->
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-1.5 flex gap-1">
              <button
                id="auth-tab-signup"
                onClick=${() => { setMode('signup'); setAuthStep('signup_role'); setError(''); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/20"
              >
                Sign Up
              </button>
              <button
                id="auth-tab-login"
                onClick=${() => {
                  setMode('login');
                  const all = getSavedAccounts();
                  setAuthStep(Object.keys(all).length > 0 ? 'chooser' : 'login_email');
                  setError('');
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 text-slate-400 hover:text-white hover:bg-slate-800/60"
              >
                Login
              </button>
            </div>

            <!-- Hero text -->
            <div className="space-y-1 text-left">
              <h2 className="text-2xl font-black text-white">Welcome to CodeSphere</h2>
              <p className="text-slate-400 text-sm">Join thousands of students and educators.</p>
            </div>

            <!-- Quick role cards -->
            <div className="space-y-3">
              <button
                id="landing-signup-teacher"
                onClick=${() => { setSelectedRole('teacher'); setAuthStep('signup_form'); setMode('signup'); setError(''); }}
                className="group w-full flex items-center gap-4 px-5 py-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/8 hover:bg-emerald-500/15 hover:border-emerald-400/50 transition duration-200"
              >
                <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                  <i data-lucide="presentation" className="w-5 h-5 text-emerald-400"></i>
                </div>
                <div className="text-left flex-1">
                  <div className="text-slate-100 font-bold text-sm">Sign up as Teacher</div>
                  <div className="text-slate-500 text-xs mt-0.5">Create classes, exams & proctor students</div>
                </div>
                <i data-lucide="arrow-right" className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition"></i>
              </button>

              <button
                id="landing-signup-student"
                onClick=${() => { setSelectedRole('student'); setAuthStep('signup_form'); setMode('signup'); setError(''); }}
                className="group w-full flex items-center gap-4 px-5 py-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/8 hover:bg-indigo-500/15 hover:border-indigo-400/50 transition duration-200"
              >
                <div className="w-11 h-11 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                  <i data-lucide="graduation-cap" className="w-5 h-5 text-indigo-400"></i>
                </div>
                <div className="text-left flex-1">
                  <div className="text-slate-100 font-bold text-sm">Sign up as Student</div>
                  <div className="text-slate-500 text-xs mt-0.5">Practice coding, join exams & earn certificates</div>
                </div>
                <i data-lucide="arrow-right" className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition"></i>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-800"></div>
              <span className="text-slate-600 text-xs">or student access code</span>
              <div className="flex-1 h-px bg-slate-800"></div>
            </div>

            <!-- Student access code quick entry -->
            <form onSubmit=${handleStudentCodeSubmit} className="space-y-3">
              <input
                type="text"
                id="student-access-code"
                value=${studentCode}
                onChange=${(e) => { setStudentCode(e.target.value); setError(''); }}
                className="w-full glass-input rounded-xl px-4 py-3 text-sm text-center font-mono font-bold tracking-widest text-cyan-400 uppercase placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/60"
                placeholder="STUD101"
                autoComplete="off"
              />
              ${error && html`<p className="text-red-400 text-xs text-center">${error}</p>`}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 transition font-bold text-white text-sm shadow-lg shadow-cyan-600/20"
              >
                Enter with Access Code
              </button>
            </form>

            <p className="text-center text-[11px] text-slate-600">
              Already have an account?${' '}
              <button
                onClick=${() => {
                  const all = getSavedAccounts();
                  setMode('login');
                  setAuthStep(Object.keys(all).length > 0 ? 'chooser' : 'login_email');
                  setError('');
                }}
                className="text-indigo-400 font-semibold hover:underline"
              >
                Log in
              </button>
            </p>
          </div>
        </div>
      </${BgWrapper}>`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Sign Up — Role Choice (if arrived via Google button on landing, not card)
  // ─────────────────────────────────────────────────────────────────────────
  if (authStep === 'signup_role') {
    return html`
      <${BgWrapper}>
        <${SidePanel}/>
        <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
          <div className="w-full max-w-sm space-y-6">
            <button onClick=${goLanding} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs font-semibold transition">
              <i data-lucide="arrow-left" className="w-3.5 h-3.5"></i> Back
            </button>
            <div>
              <h2 className="text-2xl font-black text-white">Create your account</h2>
              <p className="text-slate-400 text-sm mt-1">Choose your role to get started</p>
            </div>
            <div className="space-y-3">
              <button
                id="signup-role-teacher"
                onClick=${() => { setSelectedRole('teacher'); setAuthStep('signup_form'); }}
                className="group w-full flex items-center gap-4 px-5 py-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/8 hover:bg-emerald-500/15 hover:border-emerald-400/50 transition duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                  <i data-lucide="presentation" className="w-6 h-6 text-emerald-400"></i>
                </div>
                <div className="text-left flex-1">
                  <div className="text-slate-100 font-bold">I am a Teacher</div>
                  <div className="text-slate-500 text-xs mt-0.5">Manage classes, set exams, monitor students</div>
                </div>
                <i data-lucide="arrow-right" className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition"></i>
              </button>

              <button
                id="signup-role-student"
                onClick=${() => { setSelectedRole('student'); setAuthStep('signup_form'); }}
                className="group w-full flex items-center gap-4 px-5 py-5 rounded-2xl border border-indigo-500/30 bg-indigo-500/8 hover:bg-indigo-500/15 hover:border-indigo-400/50 transition duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                  <i data-lucide="graduation-cap" className="w-6 h-6 text-indigo-400"></i>
                </div>
                <div className="text-left flex-1">
                  <div className="text-slate-100 font-bold">I am a Student</div>
                  <div className="text-slate-500 text-xs mt-0.5">Practice, take exams, earn certificates</div>
                </div>
                <i data-lucide="arrow-right" className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition"></i>
              </button>
            </div>
            <p className="text-center text-[11px] text-slate-600">
              Already have an account?${' '}
              <button onClick=${() => { setMode('login'); setAuthStep('login_email'); }} className="text-indigo-400 font-semibold hover:underline">Log in</button>
            </p>
          </div>
        </div>
      </${BgWrapper}>`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Sign Up — Google OAuth Form
  // ─────────────────────────────────────────────────────────────────────────
  if (authStep === 'signup_form') {
    const isTeacher = selectedRole === 'teacher';
    const roleColor = isTeacher ? 'emerald' : 'indigo';
    const roleBadge = isTeacher
      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
      : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400';

    return html`
      <${BgWrapper}>
        <${SidePanel}/>
        <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
          <div className="w-full max-w-sm space-y-6">
            <button onClick=${() => setAuthStep('signup_role')} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs font-semibold transition">
              <i data-lucide="arrow-left" className="w-3.5 h-3.5"></i> Back
            </button>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-white">Create Account</h2>
                <span className=${`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleBadge} uppercase tracking-wider`}>
                  ${selectedRole}
                </span>
              </div>
              <p className="text-slate-400 text-sm">Sign up with Google to continue</p>
            </div>

            <!-- Sign up form -->
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold block">Full Name</label>
                <input
                  id="signup-name"
                  type="text"
                  value=${formName}
                  onChange=${(e) => { setFormName(e.target.value); setError(''); }}
                  className="w-full glass-input rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="John Doe"
                  autoComplete="name"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold block">Email Address</label>
                <input
                  id="signup-email"
                  type="email"
                  value=${formEmail}
                  onChange=${(e) => { setFormEmail(e.target.value); setError(''); }}
                  className="w-full glass-input rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              ${error && html`
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <i data-lucide="alert-circle" className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5"></i>
                  <p className="text-red-400 text-xs">${error}</p>
                </div>`}

              <!-- Google OAuth Button -->
              <button
                id="signup-google-btn"
                onClick=${handleSignupGoogleClick}
                disabled=${oauthLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white hover:bg-gray-50 active:bg-gray-100 rounded-xl border border-gray-200 shadow-sm transition duration-150 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                ${oauthLoading
                  ? html`<div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>`
                  : GoogleGIcon}
                <span className="text-gray-700 text-sm font-semibold">
                  ${oauthLoading ? 'Connecting to Google...' : 'Sign up with Google'}
                </span>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-800"></div>
                <span className="text-slate-600 text-xs">or</span>
                <div className="flex-1 h-px bg-slate-800"></div>
              </div>

              <!-- Manual password signup -->
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold block">Create Password</label>
                  <div className="relative">
                    <input
                      id="signup-password"
                      type=${showPass ? 'text' : 'password'}
                      value=${formPassword}
                      onChange=${(e) => setFormPassword(e.target.value)}
                      className="w-full glass-input rounded-xl px-4 py-3 pr-10 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      placeholder="Create a password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick=${() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      <i data-lucide=${showPass ? 'eye-off' : 'eye'} className="w-4 h-4"></i>
                    </button>
                  </div>
                </div>
                <button
                  id="signup-submit-btn"
                  onClick=${() => {
                    setError('');
                    if (!formName.trim()) { setError('Please enter your full name.'); return; }
                    if (!formEmail.trim() || !formEmail.includes('@')) { setError('Please enter a valid email.'); return; }
                    if (isRegistered(formEmail) && mode === 'signup') { setError('Account already exists. Please log in.'); return; }
                    if (!formPassword || formPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
                    completeLogin(selectedRole, formEmail, buildProfile(formName, formEmail));
                  }}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition font-bold text-white text-sm shadow-lg shadow-indigo-600/20"
                >
                  Create Account
                </button>
              </div>
            </div>

            <p className="text-center text-[11px] text-slate-600">
              By signing up, you agree to our
              <a href="#" className="text-indigo-400 hover:underline mx-1">Terms of Service</a>
              and
              <a href="#" className="text-indigo-400 hover:underline ml-1">Privacy Policy</a>.
            </p>

            <p className="text-center text-[11px] text-slate-600">
              Already have an account?${' '}
              <button onClick=${() => { setMode('login'); setAuthStep('login_email'); setError(''); }} className="text-indigo-400 font-semibold hover:underline">Log in</button>
            </p>
          </div>
        </div>
      </${BgWrapper}>`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Login — Saved Account Chooser
  // ─────────────────────────────────────────────────────────────────────────
  if (authStep === 'chooser') {
    const all     = getSavedAccounts();
    const entries = Object.values(all).sort((a, b) => new Date(b.lastLogin) - new Date(a.lastLogin));
    return html`
      <${BgWrapper}>
        <${SidePanel}/>
        <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
          <div className="w-full max-w-sm space-y-6">
            <button onClick=${goLanding} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs font-semibold transition">
              <i data-lucide="arrow-left" className="w-3.5 h-3.5"></i> Back
            </button>
            <div>
              <h2 className="text-2xl font-black text-white">Welcome back</h2>
              <p className="text-slate-400 text-sm mt-1">Choose your account to continue</p>
            </div>

            <div className="space-y-2">
              ${entries.map(acc => html`
                <button
                  key=${acc.email}
                  id=${`chooser-${acc.email}`}
                  onClick=${() => handleChooserSelect(acc.email)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-slate-800/60 bg-slate-900/40 hover:bg-slate-800/60 hover:border-slate-700/60 transition group"
                >
                  <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-md"
                       style=${{ background: acc.color }}>
                    ${acc.avatar}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-semibold text-slate-200 truncate">${acc.name}</div>
                    <div className="text-xs text-slate-500 truncate">${acc.email}</div>
                  </div>
                  <span className=${`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${
                    acc.role === 'teacher'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                  }`}>
                    ${acc.role || 'student'}
                  </span>
                  <i data-lucide="chevron-right" className="w-4 h-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition flex-shrink-0"></i>
                </button>
              `)}
            </div>

            <button
              id="chooser-use-another"
              onClick=${() => { setFormEmail(''); setAuthStep('login_email'); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-slate-800/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition text-sm font-medium"
            >
              <i data-lucide="plus" className="w-4 h-4"></i>
              Use another account
            </button>

            <p className="text-center text-[11px] text-slate-600">
              New here?${' '}
              <button onClick=${() => setAuthStep('signup_role')} className="text-indigo-400 font-semibold hover:underline">Create an account</button>
            </p>
          </div>
        </div>
      </${BgWrapper}>`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Login — Email Step
  // ─────────────────────────────────────────────────────────────────────────
  if (authStep === 'login_email') {
    return html`
      <${BgWrapper}>
        <${SidePanel}/>
        <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
          <div className="w-full max-w-sm space-y-6">
            <button onClick=${goLanding} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs font-semibold transition">
              <i data-lucide="arrow-left" className="w-3.5 h-3.5"></i> Back
            </button>
            <div>
              <h2 className="text-2xl font-black text-white">Log in</h2>
              <p className="text-slate-400 text-sm mt-1">to continue to CodeSphere Pro</p>
            </div>

            <!-- Google login -->
            <button
              id="login-google-btn"
              onClick=${() => {
                setError('');
                if (!formEmail.trim() || !formEmail.includes('@')) { setError('Enter your email first.'); return; }
                if (!isRegistered(formEmail)) { setError('No account found. Please sign up first.'); return; }
                const saved = getSavedAccounts()[formEmail.toLowerCase()];
                setSelectedAccount({ name: saved.name, avatar: saved.avatar, color: saved.color });
                setOauthLoading(true);
                setTimeout(() => { setOauthLoading(false); completeLogin(saved.role, formEmail, { name: saved.name, avatar: saved.avatar, color: saved.color }); }, 1200);
              }}
              disabled=${oauthLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 shadow-sm transition duration-150 active:scale-[0.99] disabled:opacity-60"
            >
              ${oauthLoading ? html`<div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>` : GoogleGIcon}
              <span className="text-gray-700 text-sm font-semibold">${oauthLoading ? 'Connecting...' : 'Continue with Google'}</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-800"></div>
              <span className="text-slate-600 text-xs">or</span>
              <div className="flex-1 h-px bg-slate-800"></div>
            </div>

            <form onSubmit=${handleLoginEmailSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold block">Email Address</label>
                <input
                  id="login-email"
                  type="email"
                  value=${formEmail}
                  onChange=${(e) => { setFormEmail(e.target.value); setError(''); }}
                  className="w-full glass-input rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              ${error && html`
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <i data-lucide="alert-circle" className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5"></i>
                  <p className="text-red-400 text-xs">${error}</p>
                </div>`}

              <button
                id="login-email-next"
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition font-bold text-white text-sm shadow-lg shadow-indigo-600/20"
              >
                Next
              </button>
            </form>

            <p className="text-center text-[11px] text-slate-600">
              Don't have an account?${' '}
              <button onClick=${() => setAuthStep('signup_role')} className="text-indigo-400 font-semibold hover:underline">Sign up</button>
            </p>
          </div>
        </div>
      </${BgWrapper}>`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Login — Password Step
  // ─────────────────────────────────────────────────────────────────────────
  if (authStep === 'login_pass') {
    return html`
      <${BgWrapper}>
        <${SidePanel}/>
        <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
          <div className="w-full max-w-sm space-y-6">
            <button onClick=${() => { setAuthStep('login_email'); setError(''); setShowPass(false); }} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs font-semibold transition">
              <i data-lucide="arrow-left" className="w-3.5 h-3.5"></i> Back
            </button>

            <!-- Account pill -->
            <div className="flex flex-col items-center gap-3 pt-2">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-xl"
                   style=${{ background: selectedAccount?.color || '#6366F1' }}>
                ${selectedAccount?.avatar || '??'}
              </div>
              <div className="text-center">
                <div className="text-slate-200 font-bold">${selectedAccount?.name}</div>
                <div className="text-slate-500 text-xs">${formEmail}</div>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-semibold">
                <i data-lucide="check-circle" className="w-3 h-3"></i>
                Account Found
              </div>
            </div>

            <form onSubmit=${handleLoginPassSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold block">Password</label>
                <div className="relative">
                  <input
                    id="login-password"
                    type=${showPass ? 'text' : 'password'}
                    value=${formPassword}
                    onChange=${(e) => { setFormPassword(e.target.value); setError(''); }}
                    className="w-full glass-input rounded-xl px-4 py-3 pr-10 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    autoFocus
                  />
                  <button type="button" onClick=${() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    <i data-lucide=${showPass ? 'eye-off' : 'eye'} className="w-4 h-4"></i>
                  </button>
                </div>
                <a href="#" className="text-indigo-400 text-xs hover:underline block mt-1">Forgot password?</a>
              </div>

              ${error && html`
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <i data-lucide="alert-circle" className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5"></i>
                  <p className="text-red-400 text-xs">${error}</p>
                </div>`}

              <button
                id="login-submit-btn"
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition font-bold text-white text-sm shadow-lg shadow-indigo-600/20"
              >
                Log In
              </button>
            </form>
          </div>
        </div>
      </${BgWrapper}>`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Role Selection (first-time login, no role saved)
  // ─────────────────────────────────────────────────────────────────────────
  if (authStep === 'role') {
    return html`
      <${BgWrapper}>
        <${SidePanel}/>
        <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
          <div className="w-full max-w-sm space-y-6">
            <div className="flex flex-col items-center gap-3 pt-2">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-xl"
                   style=${{ background: selectedAccount?.color || '#6366F1' }}>
                ${selectedAccount?.avatar || '??'}
              </div>
              <div className="text-center">
                <div className="text-slate-200 font-bold">${selectedAccount?.name}</div>
                <div className="text-slate-500 text-xs">${formEmail}</div>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-semibold">
                <i data-lucide="check-circle" className="w-3 h-3"></i>
                Google Account Verified
              </div>
            </div>
            <div>
              <h2 className="text-xl font-black text-white text-center">Select your role</h2>
              <p className="text-slate-400 text-sm text-center mt-1">How will you use CodeSphere Pro?</p>
            </div>
            <div className="space-y-3">
              <button id="role-teacher" onClick=${() => completeLogin('teacher', formEmail, selectedAccount)}
                className="group w-full flex items-center gap-4 px-5 py-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/8 hover:bg-emerald-500/15 hover:border-emerald-400/50 transition">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                  <i data-lucide="presentation" className="w-5 h-5 text-emerald-400"></i>
                </div>
                <div className="text-left flex-1">
                  <div className="text-slate-100 font-bold text-sm">Teacher Portal</div>
                  <div className="text-slate-500 text-xs mt-0.5">Manage classes, exams & proctoring</div>
                </div>
                <i data-lucide="arrow-right" className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition"></i>
              </button>
              <button id="role-student" onClick=${() => completeLogin('student', formEmail, selectedAccount)}
                className="group w-full flex items-center gap-4 px-5 py-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/8 hover:bg-indigo-500/15 hover:border-indigo-400/50 transition">
                <div className="w-11 h-11 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                  <i data-lucide="graduation-cap" className="w-5 h-5 text-indigo-400"></i>
                </div>
                <div className="text-left flex-1">
                  <div className="text-slate-100 font-bold text-sm">Student Portal</div>
                  <div className="text-slate-500 text-xs mt-0.5">Practice, exams & certificates</div>
                </div>
                <i data-lucide="arrow-right" className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition"></i>
              </button>
            </div>
            <button onClick=${goLanding} className="w-full text-xs text-slate-500 hover:text-slate-300 transition font-medium">
              ← Sign in with a different account
            </button>
          </div>
        </div>
      </${BgWrapper}>`;
  }

  return null;
}
