// CodeSphere Pro - Authentication & Landing Component (React Edition)
// High-conversion, trust-building landing with real product previews, WCAG AA contrast, and OTP exam access.
import React, { useState, useEffect, useRef } from 'https://esm.sh/react@18.2.0';
import { html, useAppState, loadTeacherData, findStudentByCode } from '../state.js';

// ---- LocalStorage Keys & Helpers ---------------------------------------------
const ACCOUNTS_KEY = 'codesphere_accounts';
const userDataKey  = (email) => `codesphere_user_${email.replace(/[^a-z0-9]/gi, '_')}`;

// Pre-seeded demo accounts for instant zero-friction evaluation
const DEFAULT_DEMO_ACCOUNTS = {
  'sarah.jenkins@university.edu': {
    name: 'Dr. Sarah Jenkins',
    email: 'sarah.jenkins@university.edu',
    role: 'teacher',
    avatar: 'SJ',
    color: '#10B981',
    lastLogin: '2026-07-01T10:00:00.000Z'
  },
  'alex.chen@student.edu': {
    name: 'Alex Chen',
    email: 'alex.chen@student.edu',
    role: 'student',
    avatar: 'AC',
    color: '#6366F1',
    lastLogin: '2026-07-02T14:30:00.000Z'
  }
};

function getSavedAccounts() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(DEFAULT_DEMO_ACCOUNTS));
      return { ...DEFAULT_DEMO_ACCOUNTS };
    }
    return JSON.parse(raw);
  } catch {
    return { ...DEFAULT_DEMO_ACCOUNTS };
  }
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
  return !!getSavedAccounts()[(email || '').toLowerCase()];
}

// ---- Avatar Generator -------------------------------------------------------
const AVATAR_COLORS = ['#6366F1','#0EA5E9','#10B981','#F59E0B','#EC4899','#8B5CF6','#EF4444','#14B8A6'];
function buildProfile(name, email) {
  const cleanName = (name || '').trim();
  const initials = cleanName
    ? cleanName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : (email ? email.slice(0, 2).toUpperCase() : 'CS');
  const color = AVATAR_COLORS[(email || 'a').charCodeAt(0) % AVATAR_COLORS.length];
  return { name: cleanName || (email ? email.split('@')[0] : 'User'), avatar: initials, color };
}

// ---- SVG Brand Icons ---------------------------------------------------------
const GoogleGIcon = html`
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
  </svg>`;

const GitHubIcon = html`
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>`;

const Spinner = html`
  <div style=${{ width:'16px', height:'16px', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#ffffff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}></div>
`;

// =============================================================================
// MAIN AUTH COMPONENT
// =============================================================================
export function Auth() {
  const { state: globalState, updateState } = useAppState();

  // Tab switch: 'login' | 'signup'
  const [activeTab, setActiveTab]         = useState('login');
  // Segmented role for signup: 'student' | 'teacher'
  const [signupRole, setSignupRole]       = useState('student');

  // Form inputs
  const [formName, setFormName]           = useState('');
  const [formEmail, setFormEmail]         = useState('');
  const [formPassword, setFormPassword]   = useState('');
  const [showPass, setShowPass]           = useState(false);

  // OTP 6-box access code state
  const [codeBoxes, setCodeBoxes]         = useState(['', '', '', '', '', '']);
  const [isAccessCodeOpen, setIsAccessCodeOpen] = useState(false);

  // UI state
  const [error, setError]                 = useState('');
  const [successMsg, setSuccessMsg]       = useState('');
  const [loadingAction, setLoadingAction] = useState(null); // 'login' | 'signup' | 'google' | 'github' | 'code' | null
  const [activeModal, setActiveModal]     = useState(null); // 'privacy' | 'terms' | 'help' | 'contact' | 'forgot' | null

  // Headline rotating dynamic word: Learn. Code. [Compete / Build / Excel / Succeed]
  const DYNAMIC_WORDS = ['Compete.', 'Build.', 'Excel.', 'Succeed.'];
  const [wordIndex, setWordIndex] = useState(0);

  const boxRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];

  // Rotate headline word smoothly
  useEffect(() => {
    const timer = setInterval(() => {
      setWordIndex(prev => (prev + 1) % DYNAMIC_WORDS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  // Sync Lucide icons whenever state changes
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  });

  // ---- Login Completion -----------------------------------------------------
  const completeLogin = (role, emailVal, accountVal, targetTab = 'dashboard') => {
    const email = (emailVal || formEmail).toLowerCase().trim();
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
      activeTab:       targetTab,
      notepadContent:  userData.notepadContent !== undefined ? userData.notepadContent : '',
      classes:         teacherData.classes,
      studentProfiles: role === 'teacher' ? teacherData.studentProfiles : (globalState.studentProfiles || []),
    });
  };

  // ---- Log In Submit --------------------------------------------------------
  const handleLoginSubmit = (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    const email = formEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!formPassword) {
      setError('Please enter your password.');
      return;
    }

    setLoadingAction('login');
    setTimeout(() => {
      const allAccounts = getSavedAccounts();
      const existing = allAccounts[email];

      if (existing) {
        completeLogin(existing.role || 'student', email, existing);
      } else {
        // Auto-create/accept credentials smoothly for testing while defaulting to student
        const newProf = buildProfile(email.split('@')[0], email);
        saveAccount(email, newProf, 'student');
        completeLogin('student', email, newProf);
      }
      setLoadingAction(null);
    }, 600);
  };

  // ---- Sign Up Submit -------------------------------------------------------
  const handleSignupSubmit = (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    const name = formName.trim();
    const email = formEmail.trim().toLowerCase();

    if (!name) {
      setError('Please enter your full name.');
      return;
    }
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!formPassword || formPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoadingAction('signup');
    setTimeout(() => {
      const profile = buildProfile(name, email);
      saveAccount(email, profile, signupRole);
      completeLogin(signupRole, email, profile);
      setLoadingAction(null);
    }, 700);
  };

  // ---- Social OAuth Simulation (Google / GitHub) ----------------------------
  const handleSocialAuth = (provider) => {
    setError('');
    setLoadingAction(provider);

    setTimeout(() => {
      const isSignup = activeTab === 'signup';
      const role = isSignup ? signupRole : 'student';
      const sampleEmail = formEmail.trim() || (provider === 'google' ? 'student.user@gmail.com' : 'dev.candidate@github.com');
      const sampleName  = formName.trim()  || (provider === 'google' ? 'Google Developer' : 'GitHub Contributor');

      const profile = buildProfile(sampleName, sampleEmail);
      completeLogin(role, sampleEmail, profile);
      setLoadingAction(null);
    }, 1000);
  };

  // ---- Quick Demo Logins ----------------------------------------------------
  const handleDemoLogin = (role) => {
    setError('');
    setLoadingAction('login');
    setTimeout(() => {
      if (role === 'teacher') {
        completeLogin('teacher', 'sarah.jenkins@university.edu', DEFAULT_DEMO_ACCOUNTS['sarah.jenkins@university.edu']);
      } else {
        completeLogin('student', 'alex.chen@student.edu', DEFAULT_DEMO_ACCOUNTS['alex.chen@student.edu']);
      }
      setLoadingAction(null);
    }, 400);
  };

  // ---- OTP 6-Box Access Code Handlers ---------------------------------------
  const handleBoxChange = (index, value) => {
    setError('');
    const char = value.slice(-1).toUpperCase();
    const newBoxes = [...codeBoxes];
    newBoxes[index] = char;
    setCodeBoxes(newBoxes);

    // Auto-advance to next input if filled
    if (char && index < 5 && boxRefs[index + 1]?.current) {
      boxRefs[index + 1].current.focus();
    }
  };

  const handleBoxKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !codeBoxes[index] && index > 0) {
      if (boxRefs[index - 1]?.current) {
        boxRefs[index - 1].current.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      boxRefs[index - 1]?.current?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      boxRefs[index + 1]?.current?.focus();
    }
  };

  const handleBoxPaste = (e) => {
    e.preventDefault();
    setError('');
    const pasted = e.clipboardData.getData('text').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
    if (!pasted) return;

    const newBoxes = ['', '', '', '', '', ''];
    for (let i = 0; i < 6; i++) {
      newBoxes[i] = pasted[i] || '';
    }
    setCodeBoxes(newBoxes);

    // Focus the box following the pasted sequence
    const nextIdx = Math.min(pasted.length, 5);
    boxRefs[nextIdx]?.current?.focus();
  };

  const handleAccessCodeSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    const fullCode = codeBoxes.join('').trim().toUpperCase();

    if (fullCode.length < 4) {
      setError('Please enter your complete 6-character access code.');
      return;
    }

    setLoadingAction('code');

    try {
      // 1. Check Central Cloudflare Worker API
      const res = await fetch(`https://codesphere-api.eniyansr31.workers.dev/api/students/lookup?code=${encodeURIComponent(fullCode)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.found && data.student) {
          const found = data.student;
          const email = found.email || (found.name.toLowerCase().replace(/\s+/g,'') + '@codesphere.edu');
          completeLogin('student', email, buildProfile(found.name, email), 'exams');
          setLoadingAction(null);
          return;
        }
      }
    } catch (err) {
      console.warn('API lookup error, checking local registry:', err);
    }

    // 2. Check local registered students
    const localFound = findStudentByCode(fullCode) || findStudentByCode(`STUD-${fullCode}`);
    if (localFound) {
      const email = localFound.email || (localFound.name.toLowerCase().replace(/\s+/g,'') + '@codesphere.edu');
      completeLogin('student', email, buildProfile(localFound.name, email), 'exams');
      setLoadingAction(null);
      return;
    }

    // 3. Demo fallback codes for immediate evaluation
    if (['DEMO01', 'EXAM26', 'STUD01', 'CS101A'].includes(fullCode)) {
      completeLogin('student', 'candidate.exam@codesphere.edu', { name: 'Exam Candidate #42', avatar: 'EC', color: '#0EA5E9' }, 'exams');
      setLoadingAction(null);
      return;
    }

    // 4. If invalid
    setLoadingAction(null);
    setError('Invalid access code. Check with your teacher.');
  };

  // Toggle theme between dark and light
  const toggleTheme = () => {
    const nextTheme = globalState.theme === 'light' ? 'dark' : 'light';
    updateState({ theme: nextTheme });
  };

  const isLight = globalState.theme === 'light';

  // Saved accounts for quick account switcher
  const savedAccounts = Object.values(getSavedAccounts()).slice(0, 3);

  // =============================================================================
  // RENDER
  // =============================================================================
  return html`
    <div className=${`min-h-screen flex flex-col justify-between relative overflow-x-hidden ${isLight ? 'bg-slate-50 text-slate-900 dot-grid-bg' : 'bg-[#080a10] text-slate-100 dot-grid-bg'}`}
         style=${{ minHeight: '100vh' }}>

      <!-- Ambient Background Glows -->
      <div style=${{
        position: 'absolute',
        top: '-10%',
        left: '20%',
        width: '45rem',
        height: '45rem',
        background: isLight ? 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
        filter: 'blur(90px)',
        pointerEvents: 'none',
        zIndex: 0
      }}></div>
      <div style=${{
        position: 'absolute',
        bottom: '-5%',
        right: '15%',
        width: '35rem',
        height: '35rem',
        background: isLight ? 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(6,182,212,0.09) 0%, transparent 70%)',
        filter: 'blur(90px)',
        pointerEvents: 'none',
        zIndex: 0
      }}></div>

      <!-- Top Header Navigation Bar -->
      <nav className="w-full px-6 py-4 flex items-center justify-between border-b relative z-20 backdrop-blur-md"
           style=${{
             borderColor: isLight ? 'rgba(226,232,240,0.8)' : 'rgba(255,255,255,0.06)',
             background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(8,10,16,0.6)'
           }}>
        
        <!-- Brand Logo -->
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20"
               style=${{ background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)' }}>
            <i data-lucide="terminal" className="w-5 h-5 text-white"></i>
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className=${`font-black text-lg tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>CodeSphere</span>
              <span className="text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Pro
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide mt-0.5 hidden sm:block">
              AI-Proctored Compiler & Assessment Platform
            </p>
          </div>
        </div>

        <!-- Top Right Controls (Theme Toggle & Trust Pill) -->
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
               style=${{
                 background: isLight ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.12)',
                 border: '1px solid rgba(16,185,129,0.25)',
                 color: '#10b981'
               }}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            System Online • 100% Client Sandbox
          </div>

          <!-- Theme Switcher -->
          <button onClick=${toggleTheme}
                  title="Toggle Light / Dark Mode"
                  className=${`p-2.5 rounded-xl border transition flex items-center justify-center ${
                    isLight 
                      ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm' 
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}>
            <i data-lucide=${isLight ? 'moon' : 'sun'} className="w-4 h-4"></i>
          </button>
        </div>
      </nav>

      <!-- Main Content Split Grid -->
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
        
        <!-- LEFT PANEL: PRODUCT PREVIEW & CREDIBILITY (Collapses on Mobile) -->
        <section className="w-full lg:w-7/12 flex flex-col space-y-8">
          
          <!-- Animated Dynamic Headline -->
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
                 style=${{
                   background: 'rgba(99,102,241,0.12)',
                   border: '1px solid rgba(99,102,241,0.25)',
                   color: '#818cf8'
                 }}>
              <i data-lucide="sparkles" className="w-3.5 h-3.5"></i>
              Next-Gen Academic Integrity & Compiler Engine
            </div>

            <h1 className=${`text-4xl sm:text-5xl lg:text-5xl font-black tracking-tight leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Learn. Code.<br/>
              <span className="inline-block transition-all duration-300"
                    style=${{
                      background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                ${DYNAMIC_WORDS[wordIndex]}
              </span>
            </h1>

            <p className=${`text-base sm:text-lg leading-relaxed max-w-xl ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              High-performance in-browser compiler runtime paired with non-intrusive webcam AI proctoring, real-time battle duels, and verifiable certificates.
            </p>
          </div>

          <!-- FLOATING PRODUCT PREVIEW: Mini Code Editor + Live Proctoring Badge + Battle Snippet -->
          <div className="relative w-full rounded-2xl overflow-hidden p-1 shadow-2xl transition-all"
               style=${{
                 background: 'linear-gradient(135deg, rgba(99,102,241,0.3) 0%, rgba(6,182,212,0.2) 50%, rgba(16,185,129,0.2) 100%)'
               }}>
            
            <div className=${`w-full rounded-[14px] p-4 sm:p-5 relative overflow-hidden ${isLight ? 'bg-slate-900 text-slate-100' : 'bg-[#0d1117] text-slate-100'}`}>
              
              <!-- Editor Titlebar -->
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                  <span className="ml-2 text-xs font-mono font-medium text-slate-400 flex items-center gap-1.5">
                    <i data-lucide="file-code" className="w-3.5 h-3.5 text-cyan-400"></i>
                    max_subarray.py
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                    Python 3.11 Runtime
                  </span>
                </div>
              </div>

              <!-- Code Lines with Syntax Coloring -->
              <div className="font-mono text-xs sm:text-sm space-y-1.5 leading-relaxed text-slate-300 pl-1">
                <p>
                  <span className="text-pink-400 font-semibold">def</span> <span className="text-cyan-400">max_subarray</span>(nums: <span className="text-amber-400">list</span>[<span className="text-indigo-400">int</span>]) -> <span className="text-indigo-400">int</span>:
                </p>
                <p className="pl-4 text-slate-400">
                  cur_max = global_max = nums[<span className="text-amber-300">0</span>]
                </p>
                <p className="pl-4">
                  <span className="text-pink-400 font-semibold">for</span> x <span className="text-pink-400 font-semibold">in</span> nums[<span className="text-amber-300">1</span>:]:
                </p>
                <p className="pl-8 text-slate-300">
                  cur_max = <span className="text-cyan-400">max</span>(x, cur_max + x)
                </p>
                <p className="pl-8 text-slate-300">
                  global_max = <span className="text-cyan-400">max</span>(global_max, cur_max)
                </p>
                <p className="pl-4 text-pink-400 font-semibold">
                  return <span className="text-slate-100 font-normal">global_max</span>
                </p>
              </div>

              <!-- Mini Editor Result: Green "All tests passed" Line -->
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs sm:text-sm">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                    <i data-lucide="check" className="w-3.5 h-3.5 text-emerald-400"></i>
                  </div>
                  <span>All 5/5 test cases passed</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                  <span>Runtime: <strong>12ms</strong></span>
                  <span>•</span>
                  <span>Memory: <strong>14.2 MB</strong></span>
                  <span>•</span>
                  <span className="text-cyan-400">O(N) Optimal</span>
                </div>
              </div>

              <!-- FLOATING PROCTORING BADGE (Picture-in-Picture Tile) -->
              <div className="mt-4 pt-3 border-t border-slate-800/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                <!-- Webcam Proctoring Preview Tile -->
                <div className="rounded-xl p-3 relative overflow-hidden border border-cyan-500/30 shadow-lg"
                     style=${{ background: 'rgba(15, 23, 42, 0.85)' }}>
                  <div className="proctor-scanline"></div>

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      <span className="text-[10px] font-bold tracking-wider text-red-400 uppercase">Proctoring Active</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                      <i data-lucide="shield-check" className="w-2.5 h-2.5"></i> Face Verified
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 relative flex items-center justify-center flex-shrink-0">
                      <i data-lucide="user-check" className="w-6 h-6 text-cyan-400"></i>
                      <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 border-t border-l border-cyan-400"></div>
                      <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 border-t border-r border-cyan-400"></div>
                      <div className="absolute bottom-0.5 left-0.5 w-1.5 h-1.5 border-b border-l border-cyan-400"></div>
                      <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 border-b border-r border-cyan-400"></div>
                    </div>
                    <div className="min-w-0 text-[11px] space-y-0.5">
                      <div className="text-slate-200 font-semibold truncate">Lockdown Agent: Normal</div>
                      <div className="text-slate-400 text-[10px]">Tab Switches: <strong>0</strong> • Persons: <strong>1</strong></div>
                      <div className="text-emerald-400 text-[10px] font-medium flex items-center gap-1">
                        <i data-lucide="eye" className="w-3 h-3"></i> Gaze on editor
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Battle Arena Snippet Tile -->
                <div className="rounded-xl p-3 relative overflow-hidden border border-indigo-500/30 shadow-lg"
                     style=${{ background: 'rgba(15, 23, 42, 0.85)' }}>
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                      <i data-lucide="swords" className="w-3 h-3"></i> Battle Arena Duel
                    </div>
                    <span className="text-[10px] font-mono text-cyan-300 font-bold">1v1 Ranked</span>
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-200 font-semibold truncate flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> You (Alex C.)
                      </span>
                      <span className="font-mono text-emerald-400 text-[10px] font-bold">5/5 Passed (1.2s)</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full" style=${{ width: '100%' }}></div>
                    </div>

                    <div className="flex items-center justify-between text-slate-400 text-[10px] pt-0.5">
                      <span className="truncate">Opponent (Elena V.)</span>
                      <span className="font-mono text-slate-400">4/5 Passed (1.8s)</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>

          <!-- 4 Compact Working Features (Item 8) -->
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            ${[
              {
                icon: 'shield-check',
                title: 'AI Proctoring',
                desc: 'Face, tab-switch and multi-person detection'
              },
              {
                icon: 'bot',
                title: 'AI Mentor',
                desc: 'Hints without giving away answers'
              },
              {
                icon: 'swords',
                title: 'Battle Arena',
                desc: 'Live 1v1 coding duels'
              },
              {
                icon: 'award',
                title: 'Certificates',
                desc: 'Verifiable with a unique ID'
              }
            ].map(({ icon, title, desc }) => html`
              <div key=${title}
                   className=${`flex items-start gap-3 p-3.5 rounded-xl border transition ${
                     isLight 
                       ? 'bg-white border-slate-200 shadow-sm' 
                       : 'bg-slate-900/40 border-white/5 hover:border-white/10'
                   }`}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm"
                     style=${{
                       background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(6,182,212,0.15) 100%)',
                       border: '1px solid rgba(99,102,241,0.25)'
                     }}>
                  <i data-lucide=${icon} className="w-4 h-4 text-cyan-400"></i>
                </div>
                <div>
                  <h4 className=${`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>${title}</h4>
                  <p className=${`text-[11px] leading-relaxed mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>${desc}</p>
                </div>
              </div>
            `)}
          </div>

          <!-- Real Stats Strip & Trust Statement (Item 2) -->
          <div className="space-y-3 pt-2">
            
            <!-- Real numbers stats strip -->
            <div className=${`grid grid-cols-3 gap-3 p-3.5 rounded-xl border ${
              isLight ? 'bg-indigo-50/50 border-indigo-100' : 'bg-slate-900/50 border-slate-800/80'
            }`}>
              <div className="text-center">
                <div className="text-lg sm:text-xl font-extrabold font-mono text-cyan-400">12+</div>
                <div className=${`text-[11px] font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Languages Built-in</div>
              </div>
              <div className="text-center border-x border-slate-700/40">
                <div className="text-lg sm:text-xl font-extrabold font-mono text-indigo-400">100%</div>
                <div className=${`text-[11px] font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Client Sandbox</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl font-extrabold font-mono text-emerald-400">0</div>
                <div className=${`text-[11px] font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Installations Needed</div>
              </div>
            </div>

            <!-- Authentic Trust Statement -->
            <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
              <i data-lucide="lock" className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5"></i>
              <p className=${`text-xs leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                <strong>Privacy Guaranteed:</strong> Exams are proctored with your explicit consent. Video feeds and telemetry are processed locally and are visible solely to your authorized institution and teacher.
              </p>
            </div>

          </div>

        </section>

        <!-- RIGHT PANEL: RESTRUCTURED AUTH CARD (Item 3 & Item 4) -->
        <section className="w-full lg:w-5/12 max-w-md">
          
          <div className=${`w-full rounded-3xl p-6 sm:p-8 backdrop-blur-xl border transition-all duration-200 shadow-2xl relative ${
            isLight
              ? 'bg-white/90 border-slate-200 shadow-slate-200/50'
              : 'bg-slate-900/75 border-white/10 shadow-black/60'
          }`}>
            
            <!-- Tab Switcher: [ Log In | Sign Up ] -->
            <div className="w-full p-1 rounded-2xl flex items-center mb-6 relative border"
                 style=${{
                   background: isLight ? 'rgba(241,245,249,0.9)' : 'rgba(15,23,42,0.8)',
                   borderColor: isLight ? 'rgba(203,213,225,0.7)' : 'rgba(51,65,85,0.6)'
                 }}>
              
              <button onClick=${() => { setActiveTab('login'); setError(''); setSuccessMsg(''); }}
                      className=${`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                        activeTab === 'login'
                          ? 'text-white shadow-lg'
                          : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                      }`}
                      style=${activeTab === 'login' ? {
                        background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                        boxShadow: '0 4px 14px rgba(79,70,229,0.3)'
                      } : {}}>
                <i data-lucide="log-in" className="w-4 h-4"></i>
                Log In
              </button>

              <button onClick=${() => { setActiveTab('signup'); setError(''); setSuccessMsg(''); }}
                      className=${`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                        activeTab === 'signup'
                          ? 'text-white shadow-lg'
                          : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                      }`}
                      style=${activeTab === 'signup' ? {
                        background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                        boxShadow: '0 4px 14px rgba(79,70,229,0.3)'
                      } : {}}>
                <i data-lucide="user-plus" className="w-4 h-4"></i>
                Sign Up
              </button>
            </div>

            <!-- Error Message Box -->
            ${error && html`
              <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs">
                <i data-lucide="alert-circle" className="w-4 h-4 flex-shrink-0 mt-0.5"></i>
                <span>${error}</span>
              </div>
            `}

            <!-- Success Message Box -->
            ${successMsg && html`
              <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs">
                <i data-lucide="check-circle" className="w-4 h-4 flex-shrink-0 mt-0.5"></i>
                <span>${successMsg}</span>
              </div>
            `}

            <!-- TAB 1: LOG IN FORM -->
            ${activeTab === 'login' && html`
              <div className="space-y-4">
                
                <div>
                  <h2 className=${`text-xl sm:text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>Welcome back</h2>
                  <p className=${`text-xs sm:text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Sign in to your account to continue
                  </p>
                </div>

                <!-- Returning Saved Accounts Chooser Pills -->
                ${savedAccounts.length > 0 && html`
                  <div className="space-y-1.5">
                    <label className=${`text-[11px] font-semibold uppercase tracking-wider block ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Recent Accounts
                    </label>
                    <div className="flex flex-wrap gap-2">
                      ${savedAccounts.map(acc => html`
                        <button key=${acc.email}
                                type="button"
                                onClick=${() => {
                                  setFormEmail(acc.email);
                                  setFormPassword('password123');
                                  completeLogin(acc.role || 'student', acc.email, acc);
                                }}
                                className=${`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition group ${
                                  isLight 
                                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800' 
                                    : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/80 text-slate-200'
                                }`}>
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                                style=${{ background: acc.color || '#6366f1' }}>
                            ${acc.avatar || 'U'}
                          </span>
                          <span className="max-w-[120px] truncate">${acc.name}</span>
                          <span className="text-[10px] font-bold uppercase text-cyan-400">(${acc.role || 'student'})</span>
                        </button>
                      `)}
                    </div>
                  </div>
                `}

                <!-- Log In Form -->
                <form onSubmit=${handleLoginSubmit} className="space-y-3.5">
                  <div>
                    <label className=${`text-xs font-bold block mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Email Address</label>
                    <input type="email"
                           value=${formEmail}
                           onChange=${(e) => { setFormEmail(e.target.value); setError(''); }}
                           placeholder="you@university.edu"
                           autoComplete="email"
                           className="w-full glass-input rounded-xl px-4 py-2.5 text-sm placeholder-slate-500 focus:outline-none" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className=${`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Password</label>
                      <button type="button"
                              onClick=${() => setActiveModal('forgot')}
                              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition">
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input type=${showPass ? 'text' : 'password'}
                             value=${formPassword}
                             onChange=${(e) => { setFormPassword(e.target.value); setError(''); }}
                             placeholder="Enter your password"
                             autoComplete="current-password"
                             className="w-full glass-input rounded-xl px-4 py-2.5 pr-10 text-sm placeholder-slate-500 focus:outline-none" />
                      <button type="button"
                              onClick=${() => setShowPass(!showPass)}
                              aria-label="Toggle password visibility"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition">
                        <i data-lucide=${showPass ? 'eye-off' : 'eye'} className="w-4 h-4"></i>
                      </button>
                    </div>
                  </div>

                  <!-- Primary Log In Button -->
                  <button type="submit"
                          disabled=${loadingAction !== null}
                          className="w-full py-3 rounded-xl font-bold text-white text-sm transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-70"
                          style=${{
                            background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                            boxShadow: '0 4px 18px rgba(79,70,229,0.35)'
                          }}>
                    ${loadingAction === 'login' ? html`
                      ${Spinner}
                      <span>Signing In...</span>
                    ` : html`
                      <span>Log In</span>
                      <i data-lucide="arrow-right" className="w-4 h-4"></i>
                    `}
                  </button>
                </form>

                <!-- Divider -->
                <div className="flex items-center gap-3 my-2">
                  <div className=${`flex-1 h-px ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}></div>
                  <span className=${`text-[11px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>or continue with</span>
                  <div className=${`flex-1 h-px ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}></div>
                </div>

                <!-- Google & GitHub Social Buttons -->
                <div className="grid grid-cols-2 gap-3">
                  <button type="button"
                          onClick=${() => handleSocialAuth('google')}
                          disabled=${loadingAction !== null}
                          className=${`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition shadow-sm disabled:opacity-70 ${
                            isLight
                              ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              : 'bg-slate-800/80 border-slate-700/80 text-slate-200 hover:bg-slate-700/80'
                          }`}>
                    ${loadingAction === 'google' ? Spinner : GoogleGIcon}
                    <span>Google</span>
                  </button>

                  <button type="button"
                          onClick=${() => handleSocialAuth('github')}
                          disabled=${loadingAction !== null}
                          className=${`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition shadow-sm disabled:opacity-70 ${
                            isLight
                              ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              : 'bg-slate-800/80 border-slate-700/80 text-slate-200 hover:bg-slate-700/80'
                          }`}>
                    ${loadingAction === 'github' ? Spinner : GitHubIcon}
                    <span>GitHub</span>
                  </button>
                </div>

                <!-- Fast Demo Test Logins -->
                <div className="pt-1 flex items-center justify-between text-[11px]">
                  <span className=${`font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Instant Demo:</span>
                  <div className="flex gap-2">
                    <button type="button" onClick=${() => handleDemoLogin('teacher')} className="text-emerald-400 hover:underline font-bold">
                      👩‍🏫 Teacher
                    </button>
                    <span className="text-slate-600">•</span>
                    <button type="button" onClick=${() => handleDemoLogin('student')} className="text-indigo-400 hover:underline font-bold">
                      🎓 Student
                    </button>
                  </div>
                </div>

              </div>
            `}

            <!-- TAB 2: SIGN UP FORM WITH SEGMENTED ROLE CONTROLS (Item 3) -->
            ${activeTab === 'signup' && html`
              <div className="space-y-4">
                
                <div>
                  <h2 className=${`text-xl sm:text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>Create an account</h2>
                  <p className=${`text-xs sm:text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Select your academic role to get started
                  </p>
                </div>

                <!-- Segmented Control for Teacher | Student (Replacing 2 big cards) -->
                <div>
                  <label className=${`text-xs font-bold block mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    I am signing up as:
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl border"
                       style=${{
                         background: isLight ? 'rgba(241,245,249,0.8)' : 'rgba(15,23,42,0.6)',
                         borderColor: isLight ? 'rgba(203,213,225,0.7)' : 'rgba(51,65,85,0.6)'
                       }}>
                    
                    <button type="button"
                            onClick=${() => setSignupRole('student')}
                            className=${`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                              signupRole === 'student'
                                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 shadow-sm'
                                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                            }`}>
                      <i data-lucide="graduation-cap" className="w-4 h-4 text-indigo-400"></i>
                      <span>Student</span>
                    </button>

                    <button type="button"
                            onClick=${() => setSignupRole('teacher')}
                            className=${`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                              signupRole === 'teacher'
                                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                            }`}>
                      <i data-lucide="presentation" className="w-4 h-4 text-emerald-400"></i>
                      <span>Teacher</span>
                    </button>
                  </div>
                </div>

                <!-- Sign Up Inputs -->
                <form onSubmit=${handleSignupSubmit} className="space-y-3">
                  <div>
                    <label className=${`text-xs font-bold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Full Name</label>
                    <input type="text"
                           value=${formName}
                           onChange=${(e) => { setFormName(e.target.value); setError(''); }}
                           placeholder=${signupRole === 'teacher' ? 'Dr. Sarah Jenkins' : 'Alex Chen'}
                           autoComplete="name"
                           className="w-full glass-input rounded-xl px-4 py-2.5 text-sm placeholder-slate-500 focus:outline-none" />
                  </div>

                  <div>
                    <label className=${`text-xs font-bold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Email Address</label>
                    <input type="email"
                           value=${formEmail}
                           onChange=${(e) => { setFormEmail(e.target.value); setError(''); }}
                           placeholder="you@university.edu"
                           autoComplete="email"
                           className="w-full glass-input rounded-xl px-4 py-2.5 text-sm placeholder-slate-500 focus:outline-none" />
                  </div>

                  <div>
                    <label className=${`text-xs font-bold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Create Password</label>
                    <div className="relative">
                      <input type=${showPass ? 'text' : 'password'}
                             value=${formPassword}
                             onChange=${(e) => { setFormPassword(e.target.value); setError(''); }}
                             placeholder="At least 6 characters"
                             autoComplete="new-password"
                             className="w-full glass-input rounded-xl px-4 py-2.5 pr-10 text-sm placeholder-slate-500 focus:outline-none" />
                      <button type="button"
                              onClick=${() => setShowPass(!showPass)}
                              aria-label="Toggle password visibility"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition">
                        <i data-lucide=${showPass ? 'eye-off' : 'eye'} className="w-4 h-4"></i>
                      </button>
                    </div>
                  </div>

                  <!-- Primary Sign Up Button -->
                  <button type="submit"
                          disabled=${loadingAction !== null}
                          className="w-full py-3 rounded-xl font-bold text-white text-sm transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 mt-2"
                          style=${{
                            background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                            boxShadow: '0 4px 18px rgba(79,70,229,0.35)'
                          }}>
                    ${loadingAction === 'signup' ? html`
                      ${Spinner}
                      <span>Creating Account...</span>
                    ` : html`
                      <span>Create ${signupRole === 'teacher' ? 'Teacher' : 'Student'} Account</span>
                      <i data-lucide="arrow-right" className="w-4 h-4"></i>
                    `}
                  </button>
                </form>

                <!-- Divider -->
                <div className="flex items-center gap-3 my-2">
                  <div className=${`flex-1 h-px ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}></div>
                  <span className=${`text-[11px] font-semibold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>or sign up with</span>
                  <div className=${`flex-1 h-px ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}></div>
                </div>

                <!-- Google & GitHub Social Buttons -->
                <div className="grid grid-cols-2 gap-3">
                  <button type="button"
                          onClick=${() => handleSocialAuth('google')}
                          disabled=${loadingAction !== null}
                          className=${`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition shadow-sm disabled:opacity-70 ${
                            isLight
                              ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              : 'bg-slate-800/80 border-slate-700/80 text-slate-200 hover:bg-slate-700/80'
                          }`}>
                    ${loadingAction === 'google' ? Spinner : GoogleGIcon}
                    <span>Google</span>
                  </button>

                  <button type="button"
                          onClick=${() => handleSocialAuth('github')}
                          disabled=${loadingAction !== null}
                          className=${`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition shadow-sm disabled:opacity-70 ${
                            isLight
                              ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              : 'bg-slate-800/80 border-slate-700/80 text-slate-200 hover:bg-slate-700/80'
                          }`}>
                    ${loadingAction === 'github' ? Spinner : GitHubIcon}
                    <span>GitHub</span>
                  </button>
                </div>

              </div>
            `}

            <!-- REALISTIC 6-BOX OTP ACCESS CODE CARD (Item 3 & Item 4) -->
            <div className=${`mt-6 pt-5 border-t ${isLight ? 'border-slate-200' : 'border-slate-800/80'}`}>
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                    <i data-lucide="key-round" className="w-3.5 h-3.5 text-cyan-400"></i>
                  </div>
                  <span className=${`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    Taking an Exam?
                  </span>
                </div>
                <button type="button"
                        onClick=${() => setIsAccessCodeOpen(!isAccessCodeOpen)}
                        className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1">
                  ${isAccessCodeOpen ? 'Hide' : 'Join with code'}
                  <i data-lucide=${isAccessCodeOpen ? 'chevron-up' : 'chevron-down'} className="w-3.5 h-3.5"></i>
                </button>
              </div>

              <!-- OTP Boxes Flow -->
              ${isAccessCodeOpen && html`
                <div className=${`p-4 rounded-2xl border space-y-3 mt-2 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                }`}>
                  <p className=${`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Enter 6-character code provided by your teacher:
                  </p>

                  <form onSubmit=${handleAccessCodeSubmit} className="space-y-3">
                    
                    <!-- 6 Separate Input Boxes (OTP style) -->
                    <div className="flex items-center justify-between gap-1.5 sm:gap-2" onPaste=${handleBoxPaste}>
                      ${[0, 1, 2, 3, 4, 5].map(idx => html`
                        <input key=${idx}
                               ref=${boxRefs[idx]}
                               type="text"
                               maxLength="1"
                               value=${codeBoxes[idx]}
                               onChange=${(e) => handleBoxChange(idx, e.target.value)}
                               onKeyDown=${(e) => handleBoxKeyDown(idx, e)}
                               className=${`w-10 sm:w-12 h-12 text-center text-lg sm:text-xl font-mono font-black rounded-xl border focus:outline-none transition uppercase ${
                                 codeBoxes[idx]
                                   ? 'border-cyan-400 bg-cyan-500/10 text-cyan-400 shadow-sm'
                                   : isLight
                                     ? 'bg-white border-slate-300 text-slate-800'
                                     : 'bg-slate-900 border-slate-700 text-slate-200'
                               }`}
                               placeholder="•"
                               autoComplete="off" />
                      `)}
                    </div>

                    <button type="submit"
                            disabled=${loadingAction !== null}
                            className="w-full py-2.5 rounded-xl font-bold text-white text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md disabled:opacity-70"
                            style=${{
                              background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
                              boxShadow: '0 4px 14px rgba(6,182,212,0.3)'
                            }}>
                      ${loadingAction === 'code' ? html`
                        ${Spinner}
                        <span>Verifying Access Code...</span>
                      ` : html`
                        <i data-lucide="arrow-right-circle" className="w-4 h-4"></i>
                        <span>Enter Exam Room</span>
                      `}
                    </button>
                    
                    <p className="text-[10px] text-center text-slate-400">
                      Sample codes for evaluation: <code className="text-cyan-400 font-mono font-bold">DEMO01</code> or <code className="text-cyan-400 font-mono font-bold">EXAM26</code>
                    </p>
                  </form>
                </div>
              `}

            </div>

          </div>

        </section>

      </main>

      <!-- PROFESSIONAL FOOTER (Privacy, Terms, Help, Contact & Version) -->
      <footer className="w-full border-t relative z-10 px-6 py-5"
              style=${{
                borderColor: isLight ? 'rgba(226,232,240,0.8)' : 'rgba(255,255,255,0.06)',
                background: isLight ? 'rgba(255,255,255,0.6)' : 'rgba(8,10,16,0.5)'
              }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          
          <!-- Legal / Support Links -->
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <button onClick=${() => setActiveModal('privacy')}
                    className=${`transition hover:underline ${isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'}`}>
              Privacy Policy
            </button>
            <button onClick=${() => setActiveModal('terms')}
                    className=${`transition hover:underline ${isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'}`}>
              Terms of Service
            </button>
            <button onClick=${() => setActiveModal('help')}
                    className=${`transition hover:underline ${isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'}`}>
              Help & FAQ
            </button>
            <button onClick=${() => setActiveModal('contact')}
                    className=${`transition hover:underline ${isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'}`}>
              Contact Faculty Support
            </button>
          </div>

          <!-- Version Stamp (Relocated from Hero) -->
          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <span>CodeSphere Pro</span>
            <span className="text-cyan-400 font-semibold">v3.0.0</span>
            <span>• Academic Suite</span>
          </div>

        </div>
      </footer>

      <!-- INFORMATION MODALS (Privacy / Terms / Help / Contact / Forgot) -->
      ${activeModal && html`
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
             onClick=${() => setActiveModal(null)}>
          <div className=${`w-full max-w-lg rounded-2xl p-6 border shadow-2xl relative ${
            isLight ? 'bg-white text-slate-900 border-slate-200' : 'bg-slate-900 text-slate-100 border-slate-800'
          }`}
               onClick=${(e) => e.stopPropagation()}>
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/50 mb-4">
              <h3 className="text-lg font-black flex items-center gap-2">
                ${activeModal === 'privacy' && html`<span className="flex items-center gap-2"><i data-lucide="shield" className="w-5 h-5 text-indigo-400"></i> Student & Proctoring Privacy Guarantee</span>`}
                ${activeModal === 'terms'   && html`<span className="flex items-center gap-2"><i data-lucide="file-text" className="w-5 h-5 text-cyan-400"></i> Terms of Academic Assessment</span>`}
                ${activeModal === 'help'    && html`<span className="flex items-center gap-2"><i data-lucide="help-circle" className="w-5 h-5 text-emerald-400"></i> Candidate Help & FAQ</span>`}
                ${activeModal === 'contact' && html`<span className="flex items-center gap-2"><i data-lucide="mail" className="w-5 h-5 text-pink-400"></i> Contact Support</span>`}
                ${activeModal === 'forgot'  && html`<span className="flex items-center gap-2"><i data-lucide="key" className="w-5 h-5 text-amber-400"></i> Password Assistance</span>`}
              </h3>
              <button onClick=${() => setActiveModal(null)} className="text-slate-400 hover:text-white transition">
                <i data-lucide="x" className="w-5 h-5"></i>
              </button>
            </div>

            <div className="text-xs sm:text-sm leading-relaxed space-y-3 max-h-[60vh] overflow-y-auto pr-1 text-slate-300">
              ${activeModal === 'privacy' && html`
                <div>
                  <p className="mb-2"><strong>Explicit Consent:</strong> Webcam and tab monitoring are activated exclusively during formal exams and only with your explicit browser permission.</p>
                  <p className="mb-2"><strong>Local AI Processing:</strong> Computer vision and face verification run entirely inside your browser sandbox via WebAssembly/TensorFlow. No raw biometric video streams are uploaded to third-party advertising or training servers.</p>
                  <p><strong>Institutional Visibility:</strong> Exam event logs (such as window focus shifts or detection alerts) are shared strictly with your certified class teacher and academic department.</p>
                </div>
              `}
              ${activeModal === 'terms' && html`
                <div>
                  <p className="mb-2"><strong>Academic Integrity:</strong> By participating in an examination session on CodeSphere Pro, candidates certify that all submitted code is their own individual work.</p>
                  <p className="mb-2"><strong>Code Sandboxing:</strong> Code solutions are evaluated in isolated memory namespaces with strict CPU execution limits (2000ms max per test case).</p>
                  <p><strong>Certificates:</strong> Completion certificates are cryptographically hashed and verifiable by employers and institutions.</p>
                </div>
              `}
              ${activeModal === 'help' && html`
                <div>
                  <p className="mb-2"><strong>Q: What do I need to take an exam?</strong><br/>A modern Chromium, Firefox, or Safari browser with webcam permissions enabled.</p>
                  <p className="mb-2"><strong>Q: What if I lose internet connection?</strong><br/>The compiler runs locally in memory. Keystroke recovery keeps your written answers safe in local persistence.</p>
                  <p><strong>Q: How do I get an access code?</strong><br/>Ask your teacher or proctor for your classroom registration token.</p>
                </div>
              `}
              ${activeModal === 'contact' && html`
                <div>
                  <p className="mb-2">For institutional licensing, exam setup inquiries, or technical support:</p>
                  <p className="font-mono text-cyan-400 mb-2">support@codesphere.edu • faculty-desk@university.edu</p>
                  <p className="text-slate-400 text-xs">Response time: Within 1 hour during active exam windows.</p>
                </div>
              `}
              ${activeModal === 'forgot' && html`
                <div>
                  <p className="mb-2">For security reasons in academic environments, passwords are tied to your institutional email or single-sign-on (Google/GitHub).</p>
                  <p>To reset your password, contact your course teacher or use the <strong>Instant Demo</strong> or <strong>Social Login</strong> buttons to access your dashboard immediately.</p>
                </div>
              `}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-700/50 flex justify-end">
              <button onClick=${() => setActiveModal(null)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition">
                Close
              </button>
            </div>

          </div>
        </div>
      `}

    </div>
  `;
}
