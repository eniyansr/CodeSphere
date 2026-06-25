// CodeSphere Pro - Google OAuth-Style Sign-in with Saved Accounts
import { state, updateState, loadTeacherData, findStudentByCode } from '../state.js';

// ── Auth flow steps ───────────────────────────────────────────────────────────
// 'landing' | 'chooser' | 'email' | 'password' | 'role'
let authStep = 'landing';
let enteredEmail = '';
let selectedAccount = null;   // { name, avatar, color }

// ── localStorage helpers ──────────────────────────────────────────────────────
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

// ── Account resolution ────────────────────────────────────────────────────────
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

// ── Shared SVG helpers ────────────────────────────────────────────────────────
const GoogleLogoSVG = `
  <svg width="75" height="24" viewBox="0 0 75 24" xmlns="http://www.w3.org/2000/svg">
    <text x="0"  y="20" font-family="'Product Sans',Arial,sans-serif" font-size="22" font-weight="400" fill="#4285F4">G</text>
    <text x="16" y="20" font-family="'Product Sans',Arial,sans-serif" font-size="22" font-weight="400" fill="#EA4335">o</text>
    <text x="30" y="20" font-family="'Product Sans',Arial,sans-serif" font-size="22" font-weight="400" fill="#FBBC05">o</text>
    <text x="44" y="20" font-family="'Product Sans',Arial,sans-serif" font-size="22" font-weight="400" fill="#4285F4">g</text>
    <text x="56" y="20" font-family="'Product Sans',Arial,sans-serif" font-size="22" font-weight="400" fill="#34A853">l</text>
    <text x="63" y="20" font-family="'Product Sans',Arial,sans-serif" font-size="22" font-weight="400" fill="#EA4335">e</text>
  </svg>`;

const GoogleGIcon = `
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
  </svg>`;

function googleCardWrap(inner) {
  return `
    <div class="min-h-screen flex items-center justify-center bg-[#080a10] p-4">
      <div class="w-full max-w-sm">
        <div class="bg-white rounded-2xl shadow-2xl overflow-hidden">
          ${inner}
        </div>
        <p class="text-center text-[10px] text-slate-600 mt-4">
          <a href="#" class="hover:underline text-slate-500">Privacy Policy</a>
          &nbsp;&middot;&nbsp;
          <a href="#" class="hover:underline text-slate-500">Terms of Service</a>
        </p>
      </div>
    </div>`;
}

// ── Step 1 — Landing ──────────────────────────────────────────────────────────
function renderLanding() {
  return `
    <div class="min-h-screen flex bg-[#080a10]">
      <div class="hidden lg:flex w-5/12 flex-col justify-between p-12 bg-gradient-to-br from-[#0d1117] via-[#0f172a] to-[#1e1b4b] border-r border-slate-800/40 relative overflow-hidden">
        <div class="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-24 -right-24 w-80 h-80 bg-cyan-500/8 rounded-full blur-3xl pointer-events-none"></div>
        <div class="flex items-center gap-3 z-10">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg">
            <i data-lucide="terminal" class="w-5 h-5 text-white"></i>
          </div>
          <div>
            <div class="text-white font-extrabold text-lg tracking-tight leading-none">CodeSphere</div>
            <div class="text-cyan-400 text-[10px] font-bold tracking-widest uppercase">Pro</div>
          </div>
        </div>
        <div class="z-10 space-y-6">
          <div class="space-y-3">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-semibold">
              <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse inline-block"></span>
              AI-Powered Coding Platform
            </div>
            <h1 class="text-4xl font-black text-white leading-tight">Learn. Code.<br/><span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Compete.</span></h1>
            <p class="text-slate-400 text-sm leading-relaxed">A secure, AI-proctored platform for competitive coding assessments and collaborative learning.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            ${['Live Proctoring','AI Mentor','12 Languages','Battle Arena','Certificates'].map(f =>
              `<span class="px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/40 text-[11px] text-slate-300 font-medium">${f}</span>`
            ).join('')}
          </div>
        </div>
        <div class="z-10 border-l-2 border-indigo-500/40 pl-4">
          <p class="text-slate-400 text-xs italic">"Security and intelligence combined into one platform."</p>
          <p class="text-slate-500 text-[10px] mt-1">— CodeSphere Pro v2.4.0</p>
        </div>
      </div>
      <div class="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div class="w-full max-w-sm space-y-8">
          <div class="flex items-center gap-2.5 lg:hidden mb-2">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center">
              <i data-lucide="terminal" class="w-4 h-4 text-white"></i>
            </div>
            <span class="text-white font-extrabold text-base">CodeSphere <span class="text-cyan-400">Pro</span></span>
          </div>
          <div class="space-y-1.5">
            <h2 class="text-2xl font-black text-white">Sign in</h2>
            <p class="text-slate-400 text-sm">to continue to CodeSphere Pro</p>
          </div>
          <div class="space-y-4">
            <button id="auth-google-btn"
              class="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 active:bg-gray-100 rounded-xl border border-gray-200 shadow-sm transition duration-150 active:scale-[0.99]">
              ${GoogleGIcon}
              <span class="text-gray-700 text-sm font-semibold">Continue with Google</span>
            </button>
            <div class="flex items-center gap-3">
              <div class="flex-1 h-px bg-slate-800"></div>
              <span class="text-slate-600 text-xs">or</span>
              <div class="flex-1 h-px bg-slate-800"></div>
            </div>
            <form id="auth-email-form" class="space-y-3">
              <div class="space-y-1">
                <label class="text-xs text-slate-400 font-semibold block" for="auth-email-input">Email address</label>
                <input id="auth-email-input" type="email"
                  class="w-full glass-input rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/60"
                  placeholder="you@example.com" required autocomplete="email"/>
              </div>
              <button type="submit"
                class="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] transition font-semibold text-white text-sm shadow-lg shadow-indigo-600/20">
                Continue
              </button>
            </form>

            <div class="flex items-center gap-3 pt-2">
              <div class="flex-1 h-px bg-slate-800"></div>
              <span class="text-slate-600 text-[10px] uppercase tracking-wider font-bold">Or Student Access Code</span>
              <div class="flex-1 h-px bg-slate-800"></div>
            </div>
            <form id="auth-student-code-form" class="space-y-3">
              <div class="space-y-1">
                <label class="text-xs text-slate-400 font-semibold block" for="auth-student-code-input">Access Code</label>
                <input id="auth-student-code-input" type="text"
                  class="w-full glass-input rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/60 text-center font-mono font-bold tracking-widest text-cyan-400 uppercase"
                  placeholder="e.g. STUD101" required autocomplete="off"/>
              </div>
              <button type="submit"
                class="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-[0.99] transition font-bold text-white text-sm shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-1.5">
                Enter Student Portal
              </button>
            </form>
          </div>
          <p class="text-center text-[11px] text-slate-600">
            Protected by <span class="text-indigo-400 font-semibold">CodeSphere Security</span>
            &mdash; All sessions are encrypted and proctored.
          </p>
        </div>
      </div>
    </div>`;
}

// ── Step 2 — Account Chooser ──────────────────────────────────────────────────
function renderChooser() {
  const all     = getSavedAccounts();
  const entries = Object.values(all).sort((a, b) => new Date(b.lastLogin) - new Date(a.lastLogin));

  const rows = entries.map(acc => `
    <button class="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left border-b border-gray-100 last:border-0 group"
      data-chooser-email="${acc.email}">
      <div class="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-sm"
           style="background:${acc.color}">${acc.avatar}</div>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium text-gray-800 truncate">${acc.name}</div>
        <div class="text-[11px] text-gray-500 truncate">${acc.email}</div>
      </div>
      <span class="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0
        ${acc.role === 'teacher'
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}">
        ${acc.role || 'student'}
      </span>
      <svg class="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
      </svg>
    </button>`).join('');

  return googleCardWrap(`
    <div class="px-8 pt-8 pb-4">
      <div class="flex justify-center mb-5">${GoogleLogoSVG}</div>
      <h2 class="text-gray-800 text-2xl font-normal text-center mb-1">Choose an account</h2>
      <p class="text-gray-500 text-sm text-center">to continue to <span class="font-medium text-gray-700">CodeSphere Pro</span></p>
    </div>
    <div class="divide-y divide-gray-100 max-h-72 overflow-y-auto" id="chooser-account-list">
      ${rows}
    </div>
    <div class="px-4 py-3 border-t border-gray-100">
      <button id="chooser-use-other"
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition text-left">
        <div class="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center bg-gray-100">
          <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
        </div>
        <span class="text-sm text-blue-600 font-medium">Use another account</span>
      </button>
    </div>`);
}

// ── Step 3 — Email Entry ──────────────────────────────────────────────────────
function renderEmailStep() {
  return googleCardWrap(`
    <div class="px-8 pt-8 pb-5">
      <div class="flex justify-center mb-5">${GoogleLogoSVG}</div>
      <h2 class="text-gray-800 text-2xl font-normal text-center mb-1">Sign in</h2>
      <p class="text-gray-500 text-sm text-center">to continue to <span class="font-medium text-gray-700">CodeSphere Pro</span></p>
    </div>
    <div class="px-8 pb-8 space-y-4">
      <form id="auth-google-email-form">
        <div class="relative border border-gray-300 rounded-sm focus-within:border-blue-600 focus-within:border-2 transition-all">
          <input id="auth-gmail-input" type="email"
            class="w-full px-3 pt-5 pb-1.5 text-gray-900 text-sm bg-transparent outline-none peer"
            placeholder=" " value="${enteredEmail}" autocomplete="email" required/>
          <label class="absolute left-3 top-3.5 text-gray-400 text-xs pointer-events-none transition-all
            peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm
            peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-blue-600">Email or phone</label>
        </div>
        <p class="text-xs text-gray-500 mt-3 leading-relaxed">
          Not your computer? Use a Private Window to sign in.
          <a href="#" class="text-blue-600 hover:underline">Learn more about using Guest mode</a>
        </p>
        <div class="flex justify-between items-center mt-8">
          <a href="#" id="auth-email-back" class="text-blue-600 text-sm font-semibold hover:bg-blue-50 px-3 py-2 rounded transition">Create account</a>
          <button type="submit" class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition">Next</button>
        </div>
      </form>
    </div>`);
}

// ── Step 4 — Password ─────────────────────────────────────────────────────────
function renderPassword() {
  const acc = selectedAccount;
  return googleCardWrap(`
    <div class="px-8 pt-8 pb-5">
      <div class="flex justify-center mb-5">${GoogleLogoSVG}</div>
      <div class="flex items-center justify-center mb-4">
        <div class="flex items-center gap-2 border border-gray-300 rounded-full px-3 py-1.5 cursor-pointer hover:bg-gray-50 transition" id="auth-back-to-email">
          <div class="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
               style="background:${acc ? acc.color : '#4F46E5'}">${acc ? acc.avatar : '?'}</div>
          <span class="text-gray-700 text-xs font-medium">${enteredEmail}</span>
          <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      </div>
      <h2 class="text-gray-800 text-2xl font-normal text-center mb-1">Welcome</h2>
      ${acc ? `<p class="text-gray-600 text-sm text-center">${acc.name}</p>` : ''}
    </div>
    <div class="px-8 pb-8 space-y-4">
      <form id="auth-password-form">
        <div class="relative border border-gray-300 rounded-sm focus-within:border-blue-600 focus-within:border-2 transition-all">
          <input id="google-pwd" type="password"
            class="w-full px-3 pt-5 pb-1.5 text-gray-900 text-sm bg-transparent outline-none peer"
            placeholder=" " required/>
          <label class="absolute left-3 top-3.5 text-gray-400 text-xs pointer-events-none transition-all
            peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm
            peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-blue-600">Enter your password</label>
        </div>
        <div class="mt-3">
          <a href="#" class="text-blue-600 text-sm hover:underline">Forgot password?</a>
        </div>
        <div class="flex justify-between items-center mt-8">
          <a href="#" id="auth-more-options" class="text-blue-600 text-sm font-semibold hover:bg-blue-50 px-3 py-2 rounded transition">More options</a>
          <button type="submit" class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition">Next</button>
        </div>
      </form>
    </div>`);
}

// ── Step 5 — Role Selection ───────────────────────────────────────────────────
function renderRoleSelection() {
  const acc      = selectedAccount;
  const saved    = getSavedAccounts()[enteredEmail.toLowerCase()];
  const lastRole = saved ? saved.role : null;

  return `
    <div class="min-h-screen flex items-center justify-center bg-[#080a10] p-4">
      <div class="w-full max-w-lg space-y-5">
        <div class="bg-white rounded-2xl shadow-xl px-8 py-7 text-center space-y-3">
          <div class="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-lg font-bold text-white shadow-lg"
               style="background:${acc ? acc.color : '#4F46E5'}">${acc ? acc.avatar : '??'}</div>
          <div>
            <h2 class="text-gray-800 text-xl font-semibold">${acc ? acc.name : 'User'}</h2>
            <p class="text-gray-500 text-sm">${enteredEmail}</p>
          </div>
          <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 rounded-full text-green-700 text-xs font-semibold">
            <svg class="w-3 h-3 fill-current" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            Google Account Verified
          </div>
        </div>
        <div class="bg-slate-900/80 border border-slate-800/60 rounded-2xl p-6 glass-panel space-y-4">
          <div class="text-center">
            <h3 class="text-white font-extrabold text-lg">Teacher Portal</h3>
            <p class="text-slate-400 text-xs mt-1">Enter your teacher workspace to manage classes, proctoring &amp; student analytics.</p>
          </div>
          <div class="pt-1">
            <button id="role-choose-teacher"
              class="group w-full flex flex-col items-start p-5 rounded-xl border border-emerald-500/60 bg-emerald-500/10
                hover:bg-emerald-500/15 hover:border-emerald-500/70 transition duration-200 text-left relative">
              <div class="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <i data-lucide="presentation" class="w-4 h-4 text-emerald-400"></i>
              </div>
              <div class="text-sm font-bold text-slate-200 group-hover:text-emerald-400 transition">Enter Teacher Portal</div>
              <p class="text-[11px] text-slate-500 leading-normal mt-1">Classes, proctoring &amp; student analytics</p>
              <div class="mt-3 text-[11px] font-bold text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition">
                Enter <i data-lucide="arrow-right" class="w-3 h-3"></i>
              </div>
            </button>
          </div>
          <div class="text-center pt-1">
            <button id="role-back-auth" class="text-xs text-slate-500 hover:text-slate-300 transition font-medium">
              ← Sign in with a different account
            </button>
          </div>
        </div>
      </div>
    </div>`;
}

// ── Auth Entry ────────────────────────────────────────────────────────────────
export function Auth(state) {
  switch (authStep) {
    case 'chooser':  return renderChooser();
    case 'email':    return renderEmailStep();
    case 'password': return renderPassword();
    case 'role':     return renderRoleSelection();
    default:         return renderLanding();
  }
}

// ── Complete Login ────────────────────────────────────────────────────────────
function completeLogin(role) {
  saveAccount(enteredEmail, selectedAccount, role);
  const userData = getUserData(enteredEmail);

  // Load teacher-specific classes & student profiles from isolated storage
  const teacherData = role === 'teacher' ? loadTeacherData(enteredEmail) : { classes: [], studentProfiles: state.studentProfiles || [] };

  updateState({
    isLoggedIn:     true,
    googleUser:     { name: selectedAccount?.name || enteredEmail, email: enteredEmail },
    role,
    activeTab:      'dashboard',
    notepadContent: userData.notepadContent !== undefined ? userData.notepadContent : '',
    classes:        teacherData.classes,
    studentProfiles: role === 'teacher' ? teacherData.studentProfiles : (state.studentProfiles || []),
  });
}

// ── Event Binding ─────────────────────────────────────────────────────────────
export function bindAuthEvents() {

  // Landing: Continue with Google
  document.getElementById('auth-google-btn')?.addEventListener('click', () => {
    const all = getSavedAccounts();
    authStep  = Object.keys(all).length > 0 ? 'chooser' : 'email';
    updateState({});
  });

  // Landing: typed email form
  document.getElementById('auth-email-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = document.getElementById('auth-email-input')?.value?.trim();
    if (!val) return;
    enteredEmail    = val.toLowerCase();
    selectedAccount = resolveAccount(enteredEmail);
    authStep        = 'password';
    updateState({});
  });

  // Landing: student access code form submit
  document.getElementById('auth-student-code-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const codeVal = document.getElementById('auth-student-code-input')?.value?.trim()?.toUpperCase();
    if (!codeVal) return;

    // Search across all teacher storage keys for the student
    const foundStudent = findStudentByCode(codeVal);

    if (foundStudent) {
      const studentEmail = foundStudent.email || `${foundStudent.name.toLowerCase().replace(/\s+/g, '')}@codesphere.edu`;
      saveAccount(studentEmail, {
        name: foundStudent.name,
        avatar: foundStudent.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
        color: '#4F46E5'
      }, 'student');

      updateState({
        isLoggedIn: true,
        googleUser: { name: foundStudent.name, email: studentEmail },
        role: 'student',
        activeTab: 'dashboard',
      });
    } else {
      alert("Invalid Access Code. Please ask your teacher for your student registration code.");
    }
  });

  // Chooser: click saved account — skip role screen if role already saved
  document.getElementById('chooser-account-list')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-chooser-email]');
    if (!btn) return;
    const email  = btn.getAttribute('data-chooser-email');
    enteredEmail    = email;
    selectedAccount = resolveAccount(email);
    const saved = getSavedAccounts()[email.toLowerCase()];
    if (saved && saved.role) {
      // Already has a role — log in directly, no role screen
      completeLogin(saved.role);
    } else {
      authStep = 'role';
      updateState({});
    }
  });

  // Chooser: Use another account
  document.getElementById('chooser-use-other')?.addEventListener('click', () => {
    authStep = 'email';
    updateState({});
  });

  // Email step: Next
  document.getElementById('auth-google-email-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = document.getElementById('auth-gmail-input')?.value?.trim();
    if (!val) return;
    enteredEmail    = val.toLowerCase();
    selectedAccount = resolveAccount(enteredEmail);
    authStep        = 'password';
    updateState({});
  });

  // Email step: back
  document.getElementById('auth-email-back')?.addEventListener('click', (e) => {
    e.preventDefault();
    authStep = 'landing';
    updateState({});
  });

  // Password: back to email pill
  document.getElementById('auth-back-to-email')?.addEventListener('click', () => {
    authStep = 'email';
    updateState({});
  });

  // Password: submit — skip role screen if account already has a saved role
  document.getElementById('auth-password-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const saved = getSavedAccounts()[enteredEmail.toLowerCase()];
    if (saved && saved.role) {
      completeLogin(saved.role);
    } else {
      authStep = 'role';
      updateState({});
    }
  });

  // Role: back
  document.getElementById('role-back-auth')?.addEventListener('click', () => {
    const all = getSavedAccounts();
    authStep        = Object.keys(all).length > 0 ? 'chooser' : 'landing';
    enteredEmail    = '';
    selectedAccount = null;
    updateState({});
  });

  // Role: Teacher
  document.getElementById('role-choose-teacher')?.addEventListener('click', () => {
    completeLogin('teacher');
  });
}

// ── Reset on Logout ───────────────────────────────────────────────────────────
export function resetAuth() {
  authStep        = 'landing';
  enteredEmail    = '';
  selectedAccount = null;
  updateState({
    isLoggedIn:      false,
    googleUser:      null,
    role:            'teacher',
    activeTab:       'dashboard',
    classes:         [],
    studentProfiles: [],
  });
}
