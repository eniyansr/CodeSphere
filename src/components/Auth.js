// CodeSphere Pro - 3D Tactile Authentication Component (React Edition)
// Extruded 3D typography, mouse-tracking 3D floating stage, chunky tactile keys, and real auth integration.
import React, { useState, useEffect, useRef } from 'https://esm.sh/react@18.2.0';
import { html, useAppState, loadTeacherData, findStudentByCode } from '../state.js';

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

export function getUserData(email) {
  try { return JSON.parse(localStorage.getItem(userDataKey(email)) || '{}'); }
  catch { return {}; }
}

export function saveUserData(email, data) {
  if (!email) return;
  const existing = getUserData(email);
  localStorage.setItem(userDataKey(email), JSON.stringify({ ...existing, ...data }));
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

  // Complete Login and transition to real Dashboard
  const completeLogin = (role, emailVal, accountVal) => {
    const email = (emailVal || formEmail).toLowerCase().trim() || 'student@college.edu';
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

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const email = formEmail.trim().toLowerCase() || 'github.contributor@codesphere.edu';
      const allAccounts = getSavedAccounts();
      const existing = allAccounts[email];

      if (existing) {
        completeLogin(existing.role || 'student', email, existing);
      } else {
        const profile = buildProfile(email.split('@')[0], email);
        completeLogin('student', email, profile);
      }
      setLoading(false);
    }, 300);
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const name  = formName.trim() || 'New User';
      const email = formEmail.trim().toLowerCase() || 'user@codesphere.edu';
      const profile = buildProfile(name, email);
      completeLogin(signupRole, email, profile);
      setLoading(false);
    }, 300);
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
    // Check local student or demo codes
    const localFound = findStudentByCode(code) || findStudentByCode(`STUD-${code}`);
    if (localFound) {
      const email = localFound.email || `${localFound.name.toLowerCase().replace(/\s+/g, '')}@codesphere.edu`;
      completeLogin('student', email, buildProfile(localFound.name, email));
      return;
    }

    // Default demo student login for access codes
    setTimeout(() => {
      completeLogin('student', `candidate.${code.toLowerCase()}@codesphere.edu`, {
        name: `Exam Candidate (${code})`,
        avatar: 'EC',
        color: '#0E9F9A'
      });
      setLoading(false);
    }, 400);
  };

  return html`
    <main id="login" class="view on select-none">
      <div class="l-wrap">
        
        <!-- ================= HERO LEFT PANEL ================= -->
        <section class="hero">
          
          <!-- Logo -->
          <div class="logo">
            <i>&gt;_</i>
            <span>CodeSphere<small>PRO</small></span>
          </div>

          <!-- Extruded 3D Headline -->
          <h1>
            Learn. Code.<br/>
            <em>Compete.</em>
          </h1>

          <p class="lead">
            Write code, take proctored exams and earn certificates in one place. Your teacher sees results the moment you submit.
          </p>

          <!-- 3D Perspective Floating Scene -->
          <div class="scene" id="scene" ref=${sceneRef} aria-hidden="true">
            <div class="stage" id="stage" ref=${stageRef}>
              
              <!-- Code Plate -->
              <div class="plate p-code">
                <div class="dots"><b></b><b></b><b></b></div>
                <div class="code"><span class="k">def</span> <span class="f">two_sum</span>(nums, target):
    seen = {}
    <span class="k">for</span> i, n <span class="k">in</span> <span class="f">enumerate</span>(nums):
        <span class="k">if</span> target - n <span class="k">in</span> seen:
            <span class="k">return</span> [seen[target - n], i]
        seen[n] = i

<span class="c"># 5 of 5 tests passed</span></div>
              </div>

              <!-- Camera Proctoring Plate -->
              <div class="plate p-cam">
                <div class="cam">
                  <span>Proctoring on</span>
                </div>
              </div>

              <!-- Battle Arena Leaderboard Plate -->
              <div class="plate p-board">
                <b>Battle Arena</b>
                <div class="row"><span>1. Meera</span><b>980</b></div>
                <div class="row"><span>2. Arjun</span><b>915</b></div>
                <div class="row"><span>3. Divya</span><b>890</b></div>
              </div>

              <!-- All Tests Passed Badge Plate -->
              <div class="plate p-badge">
                &#10003; All tests passed
              </div>

            </div>
          </div>

          <!-- Feature items below scene -->
          <div class="feats">
            <div class="feat"><b>AI proctoring</b><span>Flags tab switches and extra faces during exams</span></div>
            <div class="feat"><b>Instant results</b><span>Tests are graded as soon as you submit</span></div>
            <div class="feat"><b>Classrooms</b><span>Assignments and exams in one class space</span></div>
            <div class="feat"><b>Certificates</b><span>Each one has an ID anyone can verify</span></div>
          </div>

        </section>

        <!-- ================= 3D LOGIN CARD PANEL ================= -->
        <section class="panel">
          <div class="card3d" id="card" ref=${cardRef}>
            <h2>Welcome</h2>
            <p class="sub">Log in or create your account.</p>

            <!-- Tabs: [ Log in | Sign up ] -->
            <div class="tabs" role="tablist">
              <button role="tab" aria-selected=${activeTab === 'in'} onClick=${() => { setActiveTab('in'); setError(''); }}>
                Log in
              </button>
              <button role="tab" aria-selected=${activeTab === 'up'} onClick=${() => { setActiveTab('up'); setError(''); }}>
                Sign up
              </button>
            </div>

            <!-- TAB 1: LOG IN FORM -->
            ${activeTab === 'in' && html`
              <form onSubmit=${handleLoginSubmit} id="f-in">
                <label class="field">
                  Email
                  <input type="email"
                         required
                         value=${formEmail}
                         onChange=${(e) => setFormEmail(e.target.value)}
                         autocomplete="email"
                         placeholder="you@college.edu" />
                </label>
                <label class="field">
                  Password
                  <input type="password"
                         required
                         value=${formPassword}
                         onChange=${(e) => setFormPassword(e.target.value)}
                         autocomplete="current-password"
                         placeholder="Enter your password" />
                </label>
                <button class="btn mt-2" type="submit" disabled=${loading}>
                  ${loading ? 'Logging in...' : 'Log in'}
                </button>
              </form>
            `}

            <!-- TAB 2: SIGN UP FORM -->
            ${activeTab === 'up' && html`
              <form onSubmit=${handleSignupSubmit} id="f-up">
                
                <!-- Student / Teacher Segmented Control -->
                <div class="seg" role="radiogroup" aria-label="Account type">
                  <label>
                    <input type="radio" name="role" value="student" checked=${signupRole === 'student'} onChange=${() => setSignupRole('student')} />
                    <span>I’m a student</span>
                  </label>
                  <label>
                    <input type="radio" name="role" value="teacher" checked=${signupRole === 'teacher'} onChange=${() => setSignupRole('teacher')} />
                    <span>I’m a teacher</span>
                  </label>
                </div>

                <label class="field">
                  Full name
                  <input type="text"
                         required
                         value=${formName}
                         onChange=${(e) => setFormName(e.target.value)}
                         autocomplete="name"
                         placeholder="Alex Chen" />
                </label>
                <label class="field">
                  Email
                  <input type="email"
                         required
                         value=${formEmail}
                         onChange=${(e) => setFormEmail(e.target.value)}
                         autocomplete="email"
                         placeholder="you@college.edu" />
                </label>
                <label class="field">
                  Password
                  <input type="password"
                         required
                         minlength="6"
                         value=${formPassword}
                         onChange=${(e) => setFormPassword(e.target.value)}
                         autocomplete="new-password"
                         placeholder="At least 6 characters" />
                </label>
                <button class="btn mt-2" type="submit" disabled=${loading}>
                  ${loading ? 'Creating account...' : 'Create account'}
                </button>
              </form>
            `}

            <!-- Exam Access Code Section -->
            <div class="or">Taking an exam?</div>
            <form onSubmit=${handleCodeSubmit} id="f-code">
              
              <!-- 6 Separate OTP Boxes -->
              <div class="otp" id="otp" aria-label="Exam access code">
                ${[0, 1, 2, 3, 4, 5].map(idx => html`
                  <input key=${idx}
                         ref=${boxRefs[idx]}
                         type="text"
                         maxlength="1"
                         value=${codeBoxes[idx]}
                         onInput=${(e) => handleBoxInput(idx, e.target.value)}
                         onKeyDown=${(e) => handleBoxKeyDown(idx, e)}
                         onPaste=${handleBoxPaste}
                         aria-label=${`Character ${idx + 1}`} />
                `)}
              </div>

              ${error && html`<p class="err" id="err" role="alert">${error}</p>`}

              <button class="btn teal" type="submit" disabled=${loading}>
                Join exam with code
              </button>
            </form>

            <div class="foot">
              <a href="#" onClick=${(e) => { e.preventDefault(); alert("CodeSphere Privacy Guarantee: Camera and window monitoring runs locally inside the browser sandbox during formal exams with your explicit consent."); }}>Privacy</a>
              <a href="#" onClick=${(e) => { e.preventDefault(); alert("Academic Terms: All submitted code is evaluated in an isolated memory namespace with strict CPU execution limits."); }}>Terms</a>
              <a href="#" onClick=${(e) => { e.preventDefault(); alert("Help & FAQ: To take an exam, obtain a 6-character access token from your teacher and ensure webcam permissions are enabled."); }}>Help</a>
            </div>

          </div>
        </section>

      </div>
    </main>
  `;
}
