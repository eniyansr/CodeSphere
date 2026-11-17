/**
 * CodeSphere Pro — Cloudflare Worker (Backend API)
 *
 * Routes:
 *   GET  /api/health                    → Health check
 *   POST /api/run-code                  → Code execution via Piston API (free, no key needed)
 *   GET  /api/leaderboard               → Global leaderboard data
 *   POST /api/students/register         → Teacher registers a student (stores code centrally)
 *   GET  /api/students/lookup?code=     → Student looks up their access code
 *   DELETE /api/students/delete         → Teacher deletes a student by code
 *   POST /api/classes/register          → Teacher creates a class (stores invite code centrally)
 *   GET  /api/classes/lookup?inviteCode= → Student looks up a class by invite code
 *   DELETE /api/classes/delete          → Teacher deletes a class by invite code
 *
 * All other paths are served by Cloudflare Pages (static assets).
 */

// ─── CORS Headers ─────────────────────────────────────────────────────────────
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ─── Piston API (Free, open-source code execution) ────────────────────────────
const PISTON_API = 'https://emkc.org/api/v2/piston';

// Language aliases: CodeSphere language → Piston runtime
const PISTON_LANG_MAP = {
  javascript: { language: 'javascript', version: '18.15.0' },
  typescript: { language: 'typescript', version: '5.0.3' },
  python:     { language: 'python',     version: '3.10.0' },
  cpp:        { language: 'c++',        version: '10.2.0' },
  c:          { language: 'c',          version: '10.2.0' },
  java:       { language: 'java',       version: '15.0.2' },
  go:         { language: 'go',         version: '1.16.2' },
  rust:       { language: 'rust',       version: '1.50.0' },
  php:        { language: 'php',        version: '8.2.3'  },
  ruby:       { language: 'ruby',       version: '3.0.1'  },
  swift:      { language: 'swift',      version: '5.3.3'  },
};

// ─── Helper: JSON Response ─────────────────────────────────────────────────────
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

// ─── Helper: Error Response ────────────────────────────────────────────────────
function errorResponse(message, status = 400) {
  return jsonResponse({ success: false, error: message }, status);
}

// ─── Route: GET /api/health ────────────────────────────────────────────────────
function handleHealth() {
  return jsonResponse({
    success: true,
    service: 'CodeSphere Pro API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    status: 'operational',
    runtime: 'Cloudflare Workers',
  });
}

// ─── Route: POST /api/run-code ─────────────────────────────────────────────────
async function handleRunCode(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body');
  }

  const { language, code, stdin = '' } = body;

  if (!language || !code) {
    return errorResponse('Missing required fields: language, code');
  }

  const pistonLang = PISTON_LANG_MAP[language.toLowerCase()];
  if (!pistonLang) {
    return errorResponse(`Unsupported language: ${language}`);
  }

  const extMap = {
    javascript: 'js', typescript: 'ts', python: 'py',
    'c++': 'cpp', c: 'c', java: 'java',
    go: 'go', rust: 'rs', php: 'php', ruby: 'rb', swift: 'swift',
  };
  const ext = extMap[pistonLang.language] || 'txt';

  try {
    const pistonRes = await fetch(`${PISTON_API}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: pistonLang.language,
        version: pistonLang.version,
        files: [{ name: `main.${ext}`, content: code }],
        stdin,
        args: [],
        compile_timeout: 10000,
        run_timeout: 5000,
      }),
    });

    if (!pistonRes.ok) {
      return errorResponse('Code execution service temporarily unavailable.', 502);
    }

    const result = await pistonRes.json();
    const run = result.run || {};
    const compile = result.compile || {};

    return jsonResponse({
      success: true,
      language: pistonLang.language,
      version: pistonLang.version,
      output: run.output || '',
      stdout: run.stdout || '',
      stderr: run.stderr || '',
      compile_output: compile.output || '',
      exit_code: run.code ?? 0,
    });

  } catch (err) {
    return errorResponse('Failed to reach code execution service.', 503);
  }
}

// ─── Route: GET /api/leaderboard ──────────────────────────────────────────────
function handleLeaderboard() {
  const leaderboard = [
    { rank: 1, name: 'Pranav Kumar',    score: 980, accuracy: '94%', lang: 'C++' },
    { rank: 2, name: 'Eniyan Rajesh',   score: 915, accuracy: '89%', lang: 'Python' },
    { rank: 3, name: 'Aisha Begum',     score: 870, accuracy: '85%', lang: 'JavaScript' },
    { rank: 4, name: 'Devendra Naidu',  score: 820, accuracy: '83%', lang: 'Java' },
    { rank: 5, name: 'Sharath Chandra', score: 790, accuracy: '80%', lang: 'Go' },
  ];
  return jsonResponse({ success: true, leaderboard });
}

// ─── Route: POST /api/students/register ───────────────────────────────────────
// Stores student profile in KV so any browser can look them up by code
async function handleStudentRegister(request, env) {
  if (!env.CODESPHERE_KV) {
    return errorResponse('KV storage not configured on this worker.', 503);
  }

  let body;
  try { body = await request.json(); } catch {
    return errorResponse('Invalid JSON body');
  }

  const { name, email, code, teacherEmail } = body;
  if (!name || !email || !code || !teacherEmail) {
    return errorResponse('Missing fields: name, email, code, teacherEmail');
  }

  const student = { name, email, code: code.toUpperCase(), teacherEmail };

  // Store by code (for fast lookup)
  await env.CODESPHERE_KV.put(`student:code:${code.toUpperCase()}`, JSON.stringify(student));

  // Also maintain a list per teacher
  const teacherKey = `teacher:students:${teacherEmail.toLowerCase()}`;
  let teacherStudents = [];
  try {
    const raw = await env.CODESPHERE_KV.get(teacherKey);
    if (raw) teacherStudents = JSON.parse(raw);
  } catch {}

  // Remove old entry for this code if exists, then add new
  teacherStudents = teacherStudents.filter(s => s.code !== code.toUpperCase());
  teacherStudents.push(student);
  await env.CODESPHERE_KV.put(teacherKey, JSON.stringify(teacherStudents));

  return jsonResponse({ success: true, student });
}

// ─── Route: GET /api/students/lookup?code=STUD-XXXX ───────────────────────────
async function handleStudentLookup(url, env) {
  if (!env.CODESPHERE_KV) {
    return errorResponse('KV storage not configured on this worker.', 503);
  }

  const code = (url.searchParams.get('code') || '').trim().toUpperCase();
  if (!code) return errorResponse('Missing query param: code');

  const raw = await env.CODESPHERE_KV.get(`student:code:${code}`);
  if (!raw) {
    return jsonResponse({ success: false, found: false, student: null });
  }

  const student = JSON.parse(raw);
  return jsonResponse({ success: true, found: true, student });
}

// ─── Route: DELETE /api/students/delete ───────────────────────────────────────
async function handleStudentDelete(request, env) {
  if (!env.CODESPHERE_KV) {
    return errorResponse('KV storage not configured on this worker.', 503);
  }

  let body;
  try { body = await request.json(); } catch {
    return errorResponse('Invalid JSON body');
  }

  const { code, teacherEmail } = body;
  if (!code || !teacherEmail) return errorResponse('Missing fields: code, teacherEmail');

  const upperCode = code.toUpperCase();
  await env.CODESPHERE_KV.delete(`student:code:${upperCode}`);

  // Remove from teacher list too
  const teacherKey = `teacher:students:${teacherEmail.toLowerCase()}`;
  try {
    const raw = await env.CODESPHERE_KV.get(teacherKey);
    if (raw) {
      const list = JSON.parse(raw).filter(s => s.code !== upperCode);
      await env.CODESPHERE_KV.put(teacherKey, JSON.stringify(list));
    }
  } catch {}

  return jsonResponse({ success: true });
}

// ─── Route: POST /api/classes/register ───────────────────────────────────────
async function handleClassRegister(request, env) {
  if (!env.CODESPHERE_KV) return errorResponse('KV storage not configured.', 503);

  let body;
  try { body = await request.json(); } catch {
    return errorResponse('Invalid JSON body');
  }

  const { id, code, name, teacher, teacherEmail, inviteCode, notes, assignments } = body;
  if (!inviteCode || !teacherEmail || !name) {
    return errorResponse('Missing fields: inviteCode, teacherEmail, name');
  }

  const classData = { id, code, name, teacher, teacherEmail, inviteCode: inviteCode.toLowerCase(), notes: notes || [], assignments: assignments || [] };

  // Store by inviteCode for fast student lookup
  await env.CODESPHERE_KV.put(`class:invite:${inviteCode.toLowerCase()}`, JSON.stringify(classData));

  // Also keep teacher's class list
  const teacherKey = `teacher:classes:${teacherEmail.toLowerCase()}`;
  let teacherClasses = [];
  try {
    const raw = await env.CODESPHERE_KV.get(teacherKey);
    if (raw) teacherClasses = JSON.parse(raw);
  } catch {}
  teacherClasses = teacherClasses.filter(c => c.inviteCode !== inviteCode.toLowerCase());
  teacherClasses.push(classData);
  await env.CODESPHERE_KV.put(teacherKey, JSON.stringify(teacherClasses));

  return jsonResponse({ success: true, class: classData });
}

// ─── Route: GET /api/classes/lookup?inviteCode=XXXX ───────────────────────────
async function handleClassLookup(url, env) {
  if (!env.CODESPHERE_KV) return errorResponse('KV storage not configured.', 503);

  const inviteCode = (url.searchParams.get('inviteCode') || '').trim().toLowerCase();
  if (!inviteCode) return errorResponse('Missing query param: inviteCode');

  const raw = await env.CODESPHERE_KV.get(`class:invite:${inviteCode}`);
  if (!raw) {
    return jsonResponse({ success: false, found: false, class: null });
  }

  return jsonResponse({ success: true, found: true, class: JSON.parse(raw) });
}

// ─── Route: DELETE /api/classes/delete ───────────────────────────────────────
async function handleClassDelete(request, env) {
  if (!env.CODESPHERE_KV) return errorResponse('KV storage not configured.', 503);

  let body;
  try { body = await request.json(); } catch {
    return errorResponse('Invalid JSON body');
  }

  const { inviteCode, teacherEmail } = body;
  if (!inviteCode || !teacherEmail) return errorResponse('Missing fields: inviteCode, teacherEmail');

  await env.CODESPHERE_KV.delete(`class:invite:${inviteCode.toLowerCase()}`);

  const teacherKey = `teacher:classes:${teacherEmail.toLowerCase()}`;
  try {
    const raw = await env.CODESPHERE_KV.get(teacherKey);
    if (raw) {
      const list = JSON.parse(raw).filter(c => c.inviteCode !== inviteCode.toLowerCase());
      await env.CODESPHERE_KV.put(teacherKey, JSON.stringify(list));
    }
  } catch {}

  return jsonResponse({ success: true });
}

// ─── Route: GET /api/classes/list?teacherEmail=XXXX ───────────────────────────
async function handleClassList(url, env) {
  if (!env.CODESPHERE_KV) return errorResponse('KV storage not configured.', 503);

  const teacherEmail = (url.searchParams.get('teacherEmail') || '').trim().toLowerCase();
  if (!teacherEmail) return errorResponse('Missing query param: teacherEmail');

  const raw = await env.CODESPHERE_KV.get(`teacher:classes:${teacherEmail}`);
  if (!raw) {
    return jsonResponse({ success: true, classes: [] });
  }

  return jsonResponse({ success: true, classes: JSON.parse(raw) });
}

// ─── Route: GET /api/students/list?teacherEmail=XXXX ──────────────────────────
async function handleStudentList(url, env) {
  if (!env.CODESPHERE_KV) return errorResponse('KV storage not configured.', 503);

  const teacherEmail = (url.searchParams.get('teacherEmail') || '').trim().toLowerCase();
  if (!teacherEmail) return errorResponse('Missing query param: teacherEmail');

  const raw = await env.CODESPHERE_KV.get(`teacher:students:${teacherEmail}`);
  if (!raw) {
    return jsonResponse({ success: true, students: [] });
  }

  return jsonResponse({ success: true, students: JSON.parse(raw) });
}

// ─── Main Fetch Handler ────────────────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // ── API Routes ──────────────────────────────────────────────────────────────
    if (path.startsWith('/api/')) {

      if (path === '/api/health' && method === 'GET') {
        return handleHealth();
      }

      if (path === '/api/run-code' && method === 'POST') {
        return handleRunCode(request);
      }

      if (path === '/api/leaderboard' && method === 'GET') {
        return handleLeaderboard();
      }

      if (path === '/api/students/register' && method === 'POST') {
        return handleStudentRegister(request, env);
      }

      if (path === '/api/students/lookup' && method === 'GET') {
        return handleStudentLookup(url, env);
      }

      if (path === '/api/students/delete' && method === 'DELETE') {
        return handleStudentDelete(request, env);
      }

      if (path === '/api/classes/register' && method === 'POST') {
        return handleClassRegister(request, env);
      }

      if (path === '/api/classes/lookup' && method === 'GET') {
        return handleClassLookup(url, env);
      }

      if (path === '/api/classes/list' && method === 'GET') {
        return handleClassList(url, env);
      }

      if (path === '/api/students/list' && method === 'GET') {
        return handleStudentList(url, env);
      }

      if (path === '/api/classes/delete' && method === 'DELETE') {
        return handleClassDelete(request, env);
      }

      return errorResponse(`Unknown API route: ${method} ${path}`, 404);
    }

    return new Response('Not Found', { status: 404 });
  },
};
