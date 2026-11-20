// CodeSphere Pro - 3D Tactile Authentication Component with E2EE Vault (React Edition)
import React, { useState, useEffect, useRef } from 'https://esm.sh/react@18.2.0';
import { html, useAppState, loadTeacherData, findStudentByCode } from '../state.js';

// Dynamic import of auth-service so a crypto failure doesn't stall the login UI
let _registerUser = async () => { throw new Error('Auth service not yet loaded'); };
let _loginUser = async () => { throw new Error('Auth service not yet loaded'); };
import('../services/auth-service.js')
  .then(m => { _registerUser = m.registerUser; _loginUser = m.loginUser; })
  .catch(err => console.warn('[CodeSphere] auth-service failed to load:', err));

const registerUser = (...args) => _registerUser(...args);
const loginUser = (...args) => _loginUser(...args);

const ACCOUNTS_KEY = 'codesphere_accounts';
const userDataKey  = (email) => `codesphere_user_${email.replace(/[^a-z0-9]/gi, '_')}`;

const DEFAULT_DEMO_ACCOUNTS = {
  'sarah.jenkins@university.edu': {
    name: 'Dr. Sarah Jenkins',
    email: 'sarah.jenkins@university.edu',
    role: 'teacher',
    avatar: 'SJ',
    color: '#10B981'
  },
  'alex.chen@student.edu': {
    name: 'Alex Chen',
    email: 'alex.chen@student.edu',
    role: 'student',
    avatar: 'AC',
    color: '#6366F1'
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

function buildProfile(name, email) {
  const cleanName = (name || '').trim();
  const initials = cleanName
    ? cleanName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : (email ? email.slice(0, 2).toUpperCase() : 'CS');
  return { name: cleanName || (email ? email.split('@')[0] : 'User'), avatar: initials, color: '#4F46E5' };
}

export function Auth() {
  const { state: globalState, updateState } = useAppState();

  const [activeTab, setActiveTab]       = useState('in'); // 'in' | 'up'
  const [signupRole, setSignupRole]     = useState('student');
  const [formName, setFormName]         = useState('');
  const [formEmail, setFormEmail]       = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [codeBoxes, setCodeBoxes]       = useState(['', '', '', '', '', '']);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(null); // recoveryKey string when registered

  const boxRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
  const sceneRef = useRef(null);
  const stageRef = useRef(null);
  const cardRef  = useRef(null);

  // Parallax mouse tilt for the 3D scene and login card
  useEffect(() => {
    const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    if (calm) return;

    const scene = sceneRef.current;
    const stage = stageRef.current;
    const card  = cardRef.current;

    const onSceneMove = (e) => {
      if (!scene || !stage) return;
      const r = scene.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      stage.style.setProperty('--ry', `${x * 28 - 8}deg`);
      stage.style.setProperty('--rx', `${8 - y * 20}deg`);
    };

    const onSceneLeave = () => {
      if (!stage) return;
      stage.style.removeProperty('--ry');
      stage.style.removeProperty('--rx');
    };

    const onCardMove = (e) => {
      if (!card || !card.parentElement) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
    };

    const onCardLeave = () => {
      if (!card) return;
      card.style.transform = '';
    };

    if (scene) {
      scene.addEventListener('pointermove', onSceneMove);
      scene.addEventListener('pointerleave', onSceneLeave);
    }
    if (card && card.parentElement) {
      card.parentElement.addEventListener('pointermove', onCardMove);
      card.parentElement.addEventListener('pointerleave', onCardLeave);
    }

    return () => {
      if (scene) {
        scene.removeEventListener('pointermove', onSceneMove);
        scene.removeEventListener('pointerleave', onSceneLeave);
      }
      if (card && card.parentElement) {
        card.parentElement.removeEventListener('pointermove', onCardMove);
        card.parentElement.removeEventListener('pointerleave', onCardLeave);
      }
    };
  }, []);

  const completeLogin = (role, emailVal, accountVal, userId = null) => {
    const email = (emailVal || formEmail).toLowerCase().trim() || 'student@college.edu';
    const acct  = accountVal || buildProfile(formName || email.split('@')[0], email);
    saveAccount(email, acct, role);

    const teacherData = role === 'teacher'
      ? loadTeacherData(email)
      : { classes: [], studentProfiles: globalState.studentProfiles || [] };

    updateState({
      isLoggedIn:      true,
      googleUser:      { id: userId || `usr-${Date.now()}`, name: acct.name, email },
      role,
      activeTab:       'dashboard',
      classes:         teacherData.classes,
      studentProfiles: role === 'teacher' ? teacherData.studentProfiles : (globalState.studentProfiles || []),
    });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const email = formEmail.trim().toLowerCase() || 'sarah.jenkins@university.edu';
      const password = formPassword || 'Password123!';

      // Real auth with Cloudflare Worker
      try {
        const res = await loginUser({ email, password });
        if (res.user) {
          completeLogin(res.user.role, res.user.email, { name: res.user.name }, res.user.id);
          setLoading(false);
          return;
        }
      } catch (backendErr) {
        // Fallback for local demo accounts
        const allAccounts = getSavedAccounts();
        const existing = allAccounts[email];
        if (existing) {
          completeLogin(existing.role || 'student', email, existing);
          setLoading(false);
          return;
        }
        throw backendErr;
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const name = formName.trim() || 'New User';
      const email = formEmail.trim().toLowerCase() || 'user@codesphere.edu';
      const password = formPassword || 'Password123!';

      const regRes = await registerUser({
        name,
        email,
        password,
        role: signupRole,
        vaultPassphrase: password
      });

      // Show recovery key modal
      setShowRecoveryModal(regRes.recoveryKey);
    } catch (err) {
      setError(err.message || 'Registration failed.');
      setLoading(false);
    }
  };

  const handleAcknowledgeRecovery = () => {
    const email = formEmail.trim().toLowerCase() || 'user@codesphere.edu';
    const profile = buildProfile(formName, email);
    setShowRecoveryModal(null);
    completeLogin(signupRole, email, profile);
  };

  // OTP 6-box access code
  const handleBoxInput = (index, val) => {
    setError('');
    const char = val.replace(/[^a-z0-9]/gi, '').slice(-1).toUpperCase();
    const newBoxes = [...codeBoxes];
    newBoxes[index] = char;
    setCodeBoxes(newBoxes);

    if (char && index < 5 && boxRefs[index + 1]?.current) {
      boxRefs[index + 1].current.focus();
    }
  };

  const handleBoxKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !codeBoxes[index] && index > 0) {
      boxRefs[index - 1]?.current?.focus();
    }
  };

  const handleBoxPaste = (e) => {
    e.preventDefault();
    const text = (e.clipboardData.getData('text') || '').replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 6);
    const newBoxes = ['', '', '', '', '', ''];
    for (let i = 0; i < 6; i++) {
      newBoxes[i] = text[i] || '';
    }
    setCodeBoxes(newBoxes);
    const nextIdx = Math.min(text.length, 5);
    boxRefs[nextIdx]?.current?.focus();
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    const code = codeBoxes.join('').toUpperCase();
    if (code.length < 6) {
      setError('Enter all 6 characters of your exam code.');
      return;
    }

    setLoading(true);
    const localFound = findStudentByCode(code) || findStudentByCode(`STUD-${code}`);
    if (localFound) {
      const email = localFound.email || `${localFound.name.toLowerCase().replace(/\s+/g, '')}@codesphere.edu`;
      completeLogin('student', email, buildProfile(localFound.name, email));
      return;
    }

    // Default student entry
    completeLogin('student', `candidate-${code.toLowerCase()}@exam.edu`, { name: `Candidate ${code}` });
    setLoading(false);
  };

  return html`
    <div className="l-wrap">
      
      <!-- Left Hero Column with 3D Scene -->
      <section className="hero">
        <div className="logo select-none">
          <i>{ }</i>
          <span>CodeSphere <small>E2EE PRO</small></span>
        </div>

        <div>
          <h1 className="select-none">
            Learn. Code. <em>Compete.</em>
          </h1>
          <p className="lead mt-2">
            Zero-knowledge encrypted educational coding environment with in-browser compiler sandbox, live AI proctoring, and verifiable certificates.
          </p>
        </div>

        <!-- 3D Interactive Floating Stage -->
        <div className="scene select-none" ref=${sceneRef}>
          <div className="stage" ref=${stageRef}>
            
            <div className="plate p-code">
              <div className="dots"><b></b><b></b><b></b></div>
              <div className="code">
                <span className="k">async def</span> <span className="f">encrypt_vault</span>(passphrase):<br/>
                ${'    '}salt = crypto.<span className="f">getRandomValues</span>(<span className="s">16</span>)<br/>
                ${'    '}key = <span className="k">await</span> hkdf.<span className="f">deriveKey</span>(passphrase, salt)<br/>
                ${'    '}cipher = <span className="k">await</span> aes_gcm.<span className="f">seal</span>(code, key)<br/>
                ${'    '}<span className="k">return</span> { <span className="s">"status"</span>: <span className="s">"Zero-Knowledge Verified"</span> }
              </div>
            </div>

            <div className="plate p-cam">
              <div className="cam"><span>LIVE PROCTOR</span></div>
            </div>

            <div className="plate p-board">
              <div className="row"><span>1. Alex C.</span><b className="mono">980 AP</b></div>
              <div className="row"><span>2. Eniyan R.</span><b className="mono">915 AP</b></div>
              <div className="row"><span>3. Aisha B.</span><b className="mono">870 AP</b></div>
            </div>

            <div className="plate p-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              <span>AES-256-GCM Secure</span>
            </div>

          </div>
        </div>

        <div className="feats select-none">
          <div className="feat">
            <b>Zero-Knowledge Backend</b>
            <span>User code and notes are encrypted locally before transmission.</span>
          </div>
          <div className="feat">
            <b>Pyodide WebAssembly</b>
            <span>100% client-side Python execution without cloud leaks.</span>
          </div>
        </div>
      </section>

      <!-- Right Column: Login Card -->
      <section className="panel">
        <div className="w-full max-w-[420px]">
          
          <div
            ref=${cardRef}
            className="bg-white rounded-3xl p-8 border border-[#D5DEF2] relative transition-transform duration-100 ease-out"
            style=${{
              boxShadow: '0 1px 0 #fff inset, 0 10px 0 -2px #CBD5EE, 0 32px 48px -16px rgba(22, 33, 62, 0.35)'
            }}
          >
            
            <!-- Tab Switcher -->
            <div className="grid grid-cols-2 p-1.5 bg-[#EEF3FD] rounded-2xl border border-[#D5DEF2] mb-6">
              <button
                type="button"
                onClick=${() => { setActiveTab('in'); setError(''); }}
                className=${`py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'in'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-[#566180] hover:text-[#16213E]'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick=${() => { setActiveTab('up'); setError(''); }}
                className=${`py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'up'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-[#566180] hover:text-[#16213E]'
                }`}
              >
                Sign Up
              </button>
            </div>

            ${error && html`
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
                <i data-lucide="alert-circle" className="w-4 h-4 text-rose-500"></i>
                <span>${error}</span>
              </div>
            `}

            <!-- Log In Form -->
            ${activeTab === 'in' && html`
              <form onSubmit=${handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#16213E] mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="sarah.jenkins@university.edu"
                    value=${formEmail}
                    onInput=${(e) => setFormEmail(e.target.value)}
                    className="w-full bg-[#F0F4FD] border border-[#D5DEF2] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#16213E] focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#16213E] mb-1">Vault Passphrase</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value=${formPassword}
                    onInput=${(e) => setFormPassword(e.target.value)}
                    className="w-full bg-[#F0F4FD] border border-[#D5DEF2] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#16213E] focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled=${loading}
                  className="btn text-xs py-3 mt-2 flex items-center justify-center gap-2"
                >
                  <span>${loading ? 'Unlocking Vault...' : 'Log In to CodeSphere'}</span>
                </button>
              </form>
            `}

            <!-- Sign Up Form -->
            ${activeTab === 'up' && html`
              <form onSubmit=${handleSignupSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-2 p-1 bg-[#EEF3FD] rounded-xl border border-[#D5DEF2]">
                  <button
                    type="button"
                    onClick=${() => setSignupRole('student')}
                    className=${`py-1.5 rounded-lg text-xs font-bold ${signupRole === 'student' ? 'bg-indigo-600 text-white shadow-sm' : 'text-[#566180]'}`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick=${() => setSignupRole('teacher')}
                    className=${`py-1.5 rounded-lg text-xs font-bold ${signupRole === 'teacher' ? 'bg-indigo-600 text-white shadow-sm' : 'text-[#566180]'}`}
                  >
                    Teacher
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#16213E] mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. Sarah Jenkins"
                    value=${formName}
                    onInput=${(e) => setFormName(e.target.value)}
                    className="w-full bg-[#F0F4FD] border border-[#D5DEF2] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#16213E] focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#16213E] mb-1">University Email</label>
                  <input
                    type="email"
                    required
                    placeholder="sarah@university.edu"
                    value=${formEmail}
                    onInput=${(e) => setFormEmail(e.target.value)}
                    className="w-full bg-[#F0F4FD] border border-[#D5DEF2] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#16213E] focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#16213E] mb-1">Vault Passphrase</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 8 characters"
                    value=${formPassword}
                    onInput=${(e) => setFormPassword(e.target.value)}
                    className="w-full bg-[#F0F4FD] border border-[#D5DEF2] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#16213E] focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled=${loading}
                  className="btn teal text-xs py-3 mt-2 flex items-center justify-center gap-2"
                >
                  <span>${loading ? 'Deriving E2EE Keys...' : 'Create Encrypted Account'}</span>
                </button>
              </form>
            `}

            <!-- 6-Digit Exam Access OTP -->
            <div className="mt-6 pt-6 border-t border-[#D5DEF2]">
              <div className="text-center mb-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#566180]">
                  Direct Examination Access
                </span>
              </div>

              <form onSubmit=${handleCodeSubmit} className="space-y-3">
                <div className="flex justify-between gap-1.5" onPaste=${handleBoxPaste}>
                  ${codeBoxes.map((box, idx) => html`
                    <input
                      key=${idx}
                      ref=${boxRefs[idx]}
                      type="text"
                      maxLength="1"
                      value=${box}
                      onInput=${(e) => handleBoxInput(idx, e.target.value)}
                      onKeyDown=${(e) => handleBoxKeyDown(idx, e)}
                      className="w-11 h-12 text-center text-base font-mono font-extrabold text-[#16213E] bg-[#F0F4FD] border border-[#CBD5EE] rounded-xl focus:border-indigo-600 focus:outline-none"
                    />
                  `)}
                </div>

                <button
                  type="submit"
                  disabled=${loading}
                  className="chip w-full justify-center text-xs py-2.5 font-bold hover:bg-slate-50"
                >
                  Enter Exam Room
                </button>
              </form>
            </div>

          </div>

        </div>
      </section>

      <!-- Recovery Key Modal (shown upon new account generation) -->
      ${showRecoveryModal && html`
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-[#D5DEF2]"
               style=${{ boxShadow: '0 1px 0 #fff inset, 0 10px 0 -2px #CBD5EE, 0 32px 48px -16px rgba(22, 33, 62, 0.35)' }}>
            
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-xl mb-4"
                 style=${{ boxShadow: '0 3px 0 #B45309' }}>
              <i data-lucide="key" className="w-6 h-6"></i>
            </div>

            <h3 className="text-lg font-extrabold text-[#16213E] mb-1">Save Your E2EE Recovery Key</h3>
            <p className="text-xs text-[#566180] mb-4 leading-relaxed">
              Because CodeSphere uses true zero-knowledge end-to-end encryption, the server cannot recover lost passwords. Write down or copy this mnemonic recovery key safely:
            </p>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs font-mono font-bold text-amber-900 select-all break-all mb-6">
              ${showRecoveryModal}
            </div>

            <button
              onClick=${handleAcknowledgeRecovery}
              className="btn text-xs py-3"
            >
              I Have Saved My Recovery Key
            </button>
          </div>
        </div>
      `}

    </div>
  `;
}
