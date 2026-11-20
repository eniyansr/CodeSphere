// CodeSphere Pro - Main Application Router & Entrypoint Module (React Edition)
// Uses dynamic imports + Error Boundary so a single broken module never stalls the whole app.
import React, { useEffect, useState, Component, Suspense } from 'https://esm.sh/react@18.2.0';
import ReactDOM from 'https://esm.sh/react-dom@18.2.0/client';
import { html, AppStateProvider, useAppState } from './state.js';

// ─── Lightweight Fallback Spinner ──────────────────────────────────────────────
function TabLoader() {
  return html`
    <div style="display:flex;align-items:center;justify-content:center;padding:4rem;color:#566180;font-family:monospace;font-size:0.9rem;">
      Loading module…
    </div>
  `;
}

// ─── Error Boundary (class-based, required by React) ──────────────────────────
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(err) {
    return { error: err };
  }
  render() {
    if (this.state.error) {
      return html`
        <div style="padding:2rem;font-family:monospace;color:#a00;background:#fff8f8;border:2px solid #fcc;border-radius:12px;margin:1rem;">
          <div style="font-weight:800;font-size:1.1rem;margin-bottom:.5rem">⚠ Module error</div>
          <div style="font-size:.9rem;word-break:break-all">${String(this.state.error.message || this.state.error)}</div>
          <div style="margin-top:.75rem;font-size:.8rem;color:#888">Open DevTools console (F12) for the full stack trace.</div>
        </div>
      `;
    }
    return this.props.children;
  }
}

// ─── Lazy Component Loader (dynamic import with graceful error) ───────────────
function useLazyModule(importFn, exportName) {
  const [Comp, setComp] = useState(null);
  useEffect(() => {
    importFn()
      .then(mod => setComp(() => mod[exportName]))
      .catch(err => {
        console.error(`[CodeSphere] Failed to load module (${exportName}):`, err);
        setComp(() => () => html`
          <div style="padding:2rem;font-family:monospace;color:#a00;background:#fff8f8;border:2px solid #fcc;border-radius:12px;margin:1rem;">
            <div style="font-weight:800;margin-bottom:.5rem">⚠ ${exportName} failed to load</div>
            <div style="font-size:.85rem">${String(err.message || err)}</div>
          </div>
        `);
      });
  }, []);
  return Comp;
}

// ─── Eagerly load Header, Sidebar, Auth, SecurityGuard (critical path) ─────────
// These are lightweight and must mount first. If they fail we want to know immediately.
let Header = () => null;
let Sidebar = () => null;
let Auth = () => null;
let Notepad = () => null;
let useSecurityGuards = () => {};

const coreModulesReady = Promise.all([
  import('./components/Header.js').then(m => { Header = m.Header; }),
  import('./components/Sidebar.js').then(m => { Sidebar = m.Sidebar; }),
  import('./components/Auth.js').then(m => { Auth = m.Auth; }),
  import('./components/Notepad.js').then(m => { Notepad = m.Notepad; }),
  import('./components/SecurityGuard.js').then(m => { useSecurityGuards = m.useSecurityGuards; }),
]);

// ─── MainApp Component ─────────────────────────────────────────────────────────
function MainApp() {
  const { state, updateState } = useAppState();
  const [coreReady, setCoreReady] = useState(false);

  // Wait for critical path modules
  useEffect(() => {
    coreModulesReady
      .then(() => setCoreReady(true))
      .catch(err => {
        console.error('[CodeSphere] Critical module load failure:', err);
        setCoreReady(true); // still show something
      });
  }, []);

  // Initialize Security Guards hook (safe to call with no-op until module ready)
  useSecurityGuards(state, updateState);

  useEffect(() => {
    if (!coreReady) return;
    // Hide the loader once React mounts successfully
    const loading = document.getElementById('app-loading');
    const container = document.getElementById('app-container');
    if (loading && container) {
      loading.style.display = 'none';
      container.classList.remove('hidden');
    }
  }, [coreReady]);

  // Sync Lucide icons after every render
  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  // Sync Theme
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(state.theme === 'dark' ? 'dark' : 'light');
  }, [state.theme]);

  // Sync Dynamic Page Title
  useEffect(() => {
    if (!state.isLoggedIn) {
      document.title = 'CodeSphere Pro | Sign in';
    } else {
      const tabName = state.activeTab
        ? state.activeTab.charAt(0).toUpperCase() + state.activeTab.slice(1)
        : 'Dashboard';
      document.title = `CodeSphere Pro | ${tabName}`;
    }
  }, [state.isLoggedIn, state.activeTab]);

  // Sync Accessibility
  useEffect(() => {
    const body = document.body;
    body.className = body.className.replace(/text-scale-\w+/g, '');
    body.classList.add(`text-scale-${state.fontSize}`);
    if (state.highContrast) body.classList.add('high-contrast');
    else body.classList.remove('high-contrast');
  }, [state.fontSize, state.highContrast]);

  if (!coreReady) return null;

  if (!state.isLoggedIn) {
    return html`<${ErrorBoundary}><${Auth} /></${ErrorBoundary}>`;
  }

  return html`
    <${ErrorBoundary}><${Header} /></${ErrorBoundary}>
    <div className="flex-grow flex flex-col md:flex-row">
      <${ErrorBoundary}><${Sidebar} /></${ErrorBoundary}>
      <main className="flex-grow flex flex-col min-w-0" id="main-content-view">
        <${ErrorBoundary}>
          <${TabRouter} tab=${state.activeTab} role=${state.role} />
        </${ErrorBoundary}>
      </main>
    </div>
    <${ErrorBoundary}><${Notepad} /></${ErrorBoundary}>
  `;
}

// ─── Tab Router — loads each module on demand ─────────────────────────────────
function TabRouter({ tab, role }) {
  const Dashboard = useLazyModule(() => import('./components/Dashboard.js'), 'Dashboard');
  const EditorWorkspace = useLazyModule(() => import('./components/EditorWorkspace.js'), 'EditorWorkspace');
  const ClassroomStudent = useLazyModule(() => import('./components/ClassroomStudent.js'), 'ClassroomStudent');
  const ClassroomTeacher = useLazyModule(() => import('./components/ClassroomTeacher.js'), 'ClassroomTeacher');
  const TeacherStudents = useLazyModule(() => import('./components/TeacherStudents.js'), 'TeacherStudents');
  const ExamCenter = useLazyModule(() => import('./components/ExamCenter.js'), 'ExamCenter');
  const ProctoringCenter = useLazyModule(() => import('./components/ProctoringCenter.js'), 'ProctoringCenter');
  const BattleArena = useLazyModule(() => import('./components/BattleArena.js'), 'BattleArena');
  const Certificates = useLazyModule(() => import('./components/Certificates.js'), 'Certificates');
  const Replay = useLazyModule(() => import('./components/Replay.js'), 'Replay');
  const AdminPanel = useLazyModule(() => import('./components/AdminPanel.js'), 'AdminPanel');
  const SecuritySettings = useLazyModule(() => import('./components/SecuritySettings.js'), 'SecuritySettings');

  if (tab === 'dashboard') return Dashboard ? html`<${Dashboard} />` : html`<${TabLoader} />`;
  if (tab === 'classroom') {
    if (role === 'teacher') return ClassroomTeacher ? html`<${ClassroomTeacher} />` : html`<${TabLoader} />`;
    return ClassroomStudent ? html`<${ClassroomStudent} />` : html`<${TabLoader} />`;
  }
  if (tab === 'exams') return ExamCenter ? html`<${ExamCenter} />` : html`<${TabLoader} />`;
  if (tab === 'practice') return EditorWorkspace ? html`<${EditorWorkspace} />` : html`<${TabLoader} />`;
  if (tab === 'battle') return BattleArena ? html`<${BattleArena} />` : html`<${TabLoader} />`;
  if (tab === 'certificates') return Certificates ? html`<${Certificates} />` : html`<${TabLoader} />`;
  if (tab === 'proctoring') return ProctoringCenter ? html`<${ProctoringCenter} />` : html`<${TabLoader} />`;
  if (tab === 'admin') return AdminPanel ? html`<${AdminPanel} />` : html`<${TabLoader} />`;
  if (tab === 'students') return TeacherStudents ? html`<${TeacherStudents} />` : html`<${TabLoader} />`;
  if (tab === 'replay_viewer') return Replay ? html`<${Replay} />` : html`<${TabLoader} />`;
  if (tab === 'security') return SecuritySettings ? html`<${SecuritySettings} />` : html`<${TabLoader} />`;

  return Dashboard ? html`<${Dashboard} />` : html`<${TabLoader} />`;
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
