// CodeSphere Pro - Main Application Router & Entrypoint (React 18 + HTM)
// Architecture: static imports for hook-bearing modules; dynamic for heavy/crypto modules.
import React, { useEffect, useState, Component } from 'https://esm.sh/react@18.2.0';
import ReactDOM from 'https://esm.sh/react-dom@18.2.0/client';
import { html, AppStateProvider, useAppState } from './state.js';

// ─── Static imports (must be stable because they contain hooks) ───────────────
import { Header } from './components/Header.js';
import { Sidebar } from './components/Sidebar.js';
import { useSecurityGuards } from './components/SecurityGuard.js';

// ─── Error Boundary (class-based, required by React for componentDidCatch) ────
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(err) { return { error: err }; }
  componentDidCatch(err, info) { console.error('[CodeSphere] Error boundary caught:', err, info); }
  render() {
    if (this.state.error) {
      return html`
        <div style=${{padding:'2rem',fontFamily:'monospace',color:'#a00',background:'#fff8f8',border:'2px solid #fcc',borderRadius:'12px',margin:'1rem'}}>
          <div style=${{fontWeight:800,fontSize:'1.1rem',marginBottom:'.5rem'}}>⚠ Module error: ${this.props.name || ''}</div>
          <div style=${{fontSize:'.9rem',wordBreak:'break-all'}}>${String(this.state.error.message || this.state.error)}</div>
          <div style=${{marginTop:'.75rem',fontSize:'.8rem',color:'#888'}}>Open DevTools console (F12) for the full stack trace.</div>
        </div>
      `;
    }
    return this.props.children;
  }
}

// ─── Spinner shown while a lazy tab module loads ───────────────────────────────
function TabLoader() {
  return html`
    <div style=${{display:'flex',alignItems:'center',justifyContent:'center',padding:'4rem',
      color:'#566180',fontFamily:'monospace',fontSize:'0.9rem',gap:'0.5rem'}}>
      <span style=${{display:'inline-block',width:'1rem',height:'1rem',borderRadius:'50%',
        border:'2px solid #c7d2fe',borderTopColor:'#4f46e5',animation:'spin 0.8s linear infinite'}}></span>
      Loading module…
    </div>
  `;
}

// ─── Generic async module loader ──────────────────────────────────────────────
// Loads a module once; subsequent calls for the same key reuse the promise.
const _moduleCache = {};
function loadModule(path, exportName) {
  const key = path + '#' + exportName;
  if (!_moduleCache[key]) {
    _moduleCache[key] = import(path)
      .then(m => ({ ok: true, Comp: m[exportName] }))
      .catch(err => {
        console.error('[CodeSphere] Failed to load', path, err);
        const msg = String(err.message || err);
        return { ok: false, Comp: () => html`
          <div style=${{padding:'2rem',fontFamily:'monospace',color:'#a00',background:'#fff8f8',
            border:'2px solid #fcc',borderRadius:'12px',margin:'1rem'}}>
            <div style=${{fontWeight:800,marginBottom:'.5rem'}}>⚠ ${exportName} failed to load</div>
            <div style=${{fontSize:'.85rem',wordBreak:'break-all'}}>${msg}</div>
          </div>
        `};
      });
  }
  return _moduleCache[key];
}

// ─── Hook: resolves one lazy component ────────────────────────────────────────
function useLazy(path, exportName) {
  const [result, setResult] = useState(null);
  useEffect(() => {
    let alive = true;
    loadModule(path, exportName).then(r => { if (alive) setResult(r); });
    return () => { alive = false; };
  }, [path, exportName]);
  return result ? result.Comp : null;
}

// ─── Auth is loaded dynamically but Auth itself calls NO React hooks at top level ──
// (the crypto services are dynamically imported inside Auth.js already)
function AuthShell() {
  const Auth = useLazy('./components/Auth.js', 'Auth');
  if (!Auth) return html`<${TabLoader} />`;
  return html`<${ErrorBoundary} name="Auth"><${Auth} /></${ErrorBoundary}>`;
}

// ─── Notepad is loaded dynamically ────────────────────────────────────────────
function NotepadShell() {
  const Notepad = useLazy('./components/Notepad.js', 'Notepad');
  if (!Notepad) return null;
  return html`<${ErrorBoundary} name="Notepad"><${Notepad} /></${ErrorBoundary}>`;
}

// ─── Tab Router — each tab's module is loaded on first navigation ─────────────
function TabRouter({ tab, role }) {
  // All hooks called unconditionally — same count every render (Rules of Hooks)
  const Dashboard       = useLazy('./components/Dashboard.js',       'Dashboard');
  const EditorWorkspace = useLazy('./components/EditorWorkspace.js',  'EditorWorkspace');
  const ClassroomStudent= useLazy('./components/ClassroomStudent.js', 'ClassroomStudent');
  const ClassroomTeacher= useLazy('./components/ClassroomTeacher.js', 'ClassroomTeacher');
  const TeacherStudents = useLazy('./components/TeacherStudents.js',  'TeacherStudents');
  const ExamCenter      = useLazy('./components/ExamCenter.js',       'ExamCenter');
  const ProctoringCenter= useLazy('./components/ProctoringCenter.js', 'ProctoringCenter');
  const BattleArena     = useLazy('./components/BattleArena.js',      'BattleArena');
  const Certificates    = useLazy('./components/Certificates.js',     'Certificates');
  const Replay          = useLazy('./components/Replay.js',           'Replay');
  const AdminPanel      = useLazy('./components/AdminPanel.js',       'AdminPanel');
  const SecuritySettings= useLazy('./components/SecuritySettings.js', 'SecuritySettings');

  const show = (Comp, name) => Comp
    ? html`<${ErrorBoundary} name=${name}><${Comp} /></${ErrorBoundary}>`
    : html`<${TabLoader} />`;

  if (tab === 'classroom') {
    return role === 'teacher' ? show(ClassroomTeacher, 'ClassroomTeacher') : show(ClassroomStudent, 'ClassroomStudent');
  }
  if (tab === 'exams')        return show(ExamCenter,       'ExamCenter');
  if (tab === 'practice')     return show(EditorWorkspace,  'EditorWorkspace');
  if (tab === 'battle')       return show(BattleArena,      'BattleArena');
  if (tab === 'certificates') return show(Certificates,     'Certificates');
  if (tab === 'proctoring')   return show(ProctoringCenter, 'ProctoringCenter');
  if (tab === 'admin')        return show(AdminPanel,        'AdminPanel');
  if (tab === 'students')     return show(TeacherStudents,   'TeacherStudents');
  if (tab === 'replay_viewer')return show(Replay,            'Replay');
  if (tab === 'security')     return show(SecuritySettings,  'SecuritySettings');
  // default: dashboard
  return show(Dashboard, 'Dashboard');
}

// ─── Main App ─────────────────────────────────────────────────────────────────
function MainApp() {
  const { state, updateState } = useAppState();

  // useSecurityGuards is a static import — hook count is always stable
  useSecurityGuards(state, updateState);

  // Hide loading overlay on first mount
  useEffect(() => {
    const loading = document.getElementById('app-loading');
    const container = document.getElementById('app-container');
    if (loading && container) {
      loading.style.display = 'none';
      container.classList.remove('hidden');
    }
  }, []);

  // Sync Lucide icons after every render
  useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

  // Sync Theme
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(state.theme === 'dark' ? 'dark' : 'light');
  }, [state.theme]);

  // Sync Page Title
  useEffect(() => {
    if (!state.isLoggedIn) {
      document.title = 'CodeSphere Pro | Sign in';
    } else {
      const name = state.activeTab
        ? state.activeTab.charAt(0).toUpperCase() + state.activeTab.slice(1)
        : 'Dashboard';
      document.title = `CodeSphere Pro | ${name}`;
    }
  }, [state.isLoggedIn, state.activeTab]);

  // Sync Accessibility
  useEffect(() => {
    const body = document.body;
    body.className = body.className.replace(/text-scale-\w+/g, '');
    body.classList.add(`text-scale-${state.fontSize}`);
    body.classList.toggle('high-contrast', !!state.highContrast);
  }, [state.fontSize, state.highContrast]);

  if (!state.isLoggedIn) {
    return html`<${AuthShell} />`;
  }

  return html`
    <${ErrorBoundary} name="Header"><${Header} /></${ErrorBoundary}>
    <div className="flex-grow flex flex-col md:flex-row">
      <${ErrorBoundary} name="Sidebar"><${Sidebar} /></${ErrorBoundary}>
      <main className="flex-grow flex flex-col min-w-0" id="main-content-view">
        <${TabRouter} tab=${state.activeTab} role=${state.role} />
      </main>
    </div>
    <${NotepadShell} />
  `;
}

// ─── Root ──────────────────────────────────────────────────────────────────────
function Root() {
  return html`
    <${AppStateProvider}>
      <${MainApp} />
    </${AppStateProvider}>
  `;
}

const root = ReactDOM.createRoot(document.getElementById('app-container'));
root.render(html`<${Root} />`);
