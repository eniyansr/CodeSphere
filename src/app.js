// CodeSphere Pro - Main Application Router & Entrypoint Module (React Edition)
import React, { useEffect } from 'https://esm.sh/react@18.2.0';
import ReactDOM from 'https://esm.sh/react-dom@18.2.0/client';
import { html, AppStateProvider, useAppState } from './state.js';
import { Header } from './components/Header.js';
import { Sidebar } from './components/Sidebar.js';
import { Dashboard } from './components/Dashboard.js';
import { EditorWorkspace } from './components/EditorWorkspace.js';
import { ClassroomStudent } from './components/ClassroomStudent.js';
import { ClassroomTeacher } from './components/ClassroomTeacher.js';
import { TeacherStudents } from './components/TeacherStudents.js';
import { ExamCenter } from './components/ExamCenter.js';
import { ProctoringCenter } from './components/ProctoringCenter.js';
import { BattleArena } from './components/BattleArena.js';
import { Certificates } from './components/Certificates.js';
import { Replay } from './components/Replay.js';
import { AdminPanel } from './components/AdminPanel.js';
import { useSecurityGuards } from './components/SecurityGuard.js';
import { Auth } from './components/Auth.js';
import { Notepad } from './components/Notepad.js';

function MainApp() {
  const { state, updateState } = useAppState();

  // Initialize Security Guards hook
  useSecurityGuards(state, updateState);

  useEffect(() => {
    // Hide the loader once React mounts successfully
    const loading = document.getElementById('app-loading');
    const container = document.getElementById('app-container');
    if (loading && container) {
      loading.style.display = 'none';
      container.classList.remove('hidden');
    }
  }, []);

  // Sync Lucide icons after every render
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  });

  // Sync Accessibility Classrooms
  useEffect(() => {
    const body = document.body;
    body.className = body.className.replace(/text-scale-\w+/g, '');
    body.classList.add(`text-scale-${state.fontSize}`);

    if (state.highContrast) {
      body.classList.add('high-contrast');
    } else {
      body.classList.remove('high-contrast');
    }
  }, [state.fontSize, state.highContrast]);

  if (!state.isLoggedIn) {
    return html`
      <${Auth} />
    `;
  }

  let viewComponent = null;
  const tab = state.activeTab;

  if (tab === 'dashboard') {
    viewComponent = html`<${Dashboard} />`;
  } else if (tab === 'classroom') {
    viewComponent = state.role === 'teacher' ? html`<${ClassroomTeacher} />` : html`<${ClassroomStudent} />`;
  } else if (tab === 'exams') {
    viewComponent = html`<${ExamCenter} />`;
  } else if (tab === 'practice') {
    viewComponent = html`<${EditorWorkspace} />`;
  } else if (tab === 'battle') {
    viewComponent = html`<${BattleArena} />`;
  } else if (tab === 'certificates') {
    viewComponent = html`<${Certificates} />`;
  } else if (tab === 'proctoring') {
    viewComponent = html`<${ProctoringCenter} />`;
  } else if (tab === 'admin') {
    viewComponent = html`<${AdminPanel} />`;
  } else if (tab === 'students') {
    viewComponent = html`<${TeacherStudents} />`;
  } else if (tab === 'replay_viewer') {
    viewComponent = html`<${Replay} />`;
  }

  return html`
    <${Header} />
    <div className="flex-grow flex flex-col md:flex-row">
      <${Sidebar} />
      <main className="flex-grow flex flex-col min-w-0" id="main-content-view">
        ${viewComponent}
      </main>
    </div>
    <${Notepad} />
  `;
}

function Root() {
  return html`
    <${AppStateProvider}>
      <${MainApp} />
    </${AppStateProvider}>
  `;
}

const root = ReactDOM.createRoot(document.getElementById('app-container'));
root.render(html`<${Root} />`);
