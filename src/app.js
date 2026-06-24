// CodeSphere Pro - Main Application Router & Entrypoint Module
import { state, subscribe } from './state.js';
import { Header, bindHeaderEvents } from './components/Header.js';
import { Sidebar, bindSidebarEvents } from './components/Sidebar.js';
import { Dashboard, initDashboardCharts, bindDashboardEvents } from './components/Dashboard.js';
import { EditorWorkspace, initEditor, bindEditorEvents } from './components/EditorWorkspace.js';
import { ClassroomStudent, bindClassroomStudentEvents } from './components/ClassroomStudent.js';
import { ClassroomTeacher, bindClassroomTeacherEvents } from './components/ClassroomTeacher.js';
import { ExamCenter, bindExamCenterEvents } from './components/ExamCenter.js';
import { ProctoringCenter, bindProctoringCenterEvents } from './components/ProctoringCenter.js';
import { BattleArena, bindBattleArenaEvents } from './components/BattleArena.js';
import { Certificates, bindCertificatesEvents } from './components/Certificates.js';
import { Replay, bindReplayEvents } from './components/Replay.js';
import { AdminPanel, bindAdminPanelEvents } from './components/AdminPanel.js';
import { setupSecurityGuards } from './components/SecurityGuard.js';
import { Auth, bindAuthEvents } from './components/Auth.js';
import { Notepad, bindNotepadEvents } from './components/Notepad.js';

function renderApp(state) {
  const body = document.body;

  // Apply Accessibility Font Sizing class
  body.className = body.className.replace(/text-scale-\w+/g, '');
  body.classList.add(`text-scale-${state.fontSize}`);

  // Apply High Contrast accessibility settings
  if (state.highContrast) {
    body.classList.add('high-contrast');
  } else {
    body.classList.remove('high-contrast');
  }

  const container = document.getElementById('app-container');
  if (!container) return;

  // Render Google Login / Role Selection if not logged in
  if (!state.isLoggedIn) {
    container.innerHTML = Auth(state);
    lucide.createIcons();
    bindAuthEvents();
    return;
  }

  const headerHTML = Header(state);
  const sidebarHTML = Sidebar(state);
  
  // Select main inner viewport
  let viewHTML = '';
  const tab = state.activeTab;

  if (tab === 'dashboard') {
    viewHTML = Dashboard(state);
  } else if (tab === 'classroom') {
    viewHTML = state.role === 'teacher' ? ClassroomTeacher(state) : ClassroomStudent(state);
  } else if (tab === 'exams') {
    viewHTML = ExamCenter(state);
  } else if (tab === 'practice') {
    viewHTML = EditorWorkspace(state);
  } else if (tab === 'battle') {
    viewHTML = BattleArena(state);
  } else if (tab === 'certificates') {
    viewHTML = Certificates(state);
  } else if (tab === 'proctoring') {
    viewHTML = ProctoringCenter(state);
  } else if (tab === 'admin') {
    viewHTML = AdminPanel(state);
  } else if (tab === 'replay_viewer') {
    viewHTML = Replay(state);
  }

  container.innerHTML = `
    ${headerHTML}
    <div class="flex-grow flex flex-col md:flex-row">
      ${sidebarHTML}
      <main class="flex-grow flex flex-col min-w-0" id="main-content-view">
        ${viewHTML}
      </main>
    </div>
    ${Notepad(state)}
  `;

  // Draw Vectors Icons
  lucide.createIcons();

  // Bind Listeners
  bindHeaderEvents();
  bindSidebarEvents();
  bindNotepadEvents(state);

  if (tab === 'dashboard') {
    initDashboardCharts(state);
    bindDashboardEvents(state);
  } else if (tab === 'classroom') {
    if (state.role === 'teacher') {
      bindClassroomTeacherEvents(state);
    } else {
      bindClassroomStudentEvents(state);
    }
  } else if (tab === 'exams') {
    bindExamCenterEvents(state);
  } else if (tab === 'practice') {
    initEditor(state);
    bindEditorEvents(state);
  } else if (tab === 'battle') {
    bindBattleArenaEvents(state);
  } else if (tab === 'certificates') {
    bindCertificatesEvents(state);
  } else if (tab === 'proctoring') {
    bindProctoringCenterEvents(state);
  } else if (tab === 'admin') {
    bindAdminPanelEvents(state);
  } else if (tab === 'replay_viewer') {
    bindReplayEvents(state);
  }
}

// Global initialization
function init() {
  const loading = document.getElementById('app-loading');
  const container = document.getElementById('app-container');

  // Load state and startup
  setTimeout(() => {
    if (loading && container) {
      loading.style.display = 'none';
      container.classList.remove('hidden');
    }
    setupSecurityGuards();
    renderApp(state);
  }, 1000);

  // Subscribe state modifications to trigger dynamic re-render
  subscribe((updatedState) => {
    renderApp(updatedState);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

