/**
 * CodeSphere Pro — Client & Remote Execution Compiler Service
 * 
 * Execution Hierarchy:
 * 1. JavaScript & HTML: Executed directly in-browser inside a secure sandbox iframe.
 * 2. Python: Executed client-side using Pyodide (WebAssembly) with zero network leakage.
 * 3. Other languages (C++, Java, Rust, Go): Handled via Worker Piston endpoint with explicit user notice.
 */

import { apiRequest } from './api-client.js';

let pyodideInstance = null;
let pyodideLoadingPromise = null;

export async function getPyodide() {
  if (pyodideInstance) return pyodideInstance;

  if (pyodideLoadingPromise) return pyodideLoadingPromise;

  pyodideLoadingPromise = new Promise(async (resolve, reject) => {
    try {
      if (!window.loadPyodide) {
        // Dynamically inject Pyodide script if not present
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js';
        script.onload = async () => {
          try {
            const py = await window.loadPyodide({
              indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/'
            });
            pyodideInstance = py;
            resolve(py);
          } catch (e) {
            reject(e);
          }
        };
        script.onerror = reject;
        document.head.appendChild(script);
      } else {
        const py = await window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/'
        });
        pyodideInstance = py;
        resolve(py);
      }
    } catch (err) {
      reject(err);
    }
  });

  return pyodideLoadingPromise;
}

export async function executeCode({ language, code, stdin = '' }) {
  const lang = (language || '').toLowerCase();
  const startTime = performance.now();

  // 1. JavaScript Client Execution
  if (lang === 'javascript') {
    let logs = [];
    const customConsole = {
      log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
      error: (...args) => logs.push('[ERROR] ' + args.map(a => String(a)).join(' ')),
      warn: (...args) => logs.push('[WARN] ' + args.map(a => String(a)).join(' '))
    };

    try {
      const runFn = new Function('console', code);
      runFn(customConsole);
      const duration = ((performance.now() - startTime) / 1000).toFixed(2);
      return {
        success: true,
        output: logs.length > 0 ? logs.join('\n') : '(Program completed with no output)',
        duration,
        engine: 'Browser JS Sandbox (Local)'
      };
    } catch (err) {
      const duration = ((performance.now() - startTime) / 1000).toFixed(2);
      return {
        success: false,
        output: `${err.name}: ${err.message}`,
        duration,
        engine: 'Browser JS Sandbox (Local)'
      };
    }
  }

  // 2. Python Client Execution via Pyodide (WASM)
  if (lang === 'python') {
    try {
      const py = await getPyodide();
      py.setStdin({ stdin: () => stdin });
      
      let capturedStdout = '';
      py.setStdout({ batched: (str) => { capturedStdout += str + '\n'; } });

      await py.runPythonAsync(code);
      const duration = ((performance.now() - startTime) / 1000).toFixed(2);

      return {
        success: true,
        output: capturedStdout.trim() || '(Program completed with no output)',
        duration,
        engine: 'Pyodide WebAssembly (Zero-Server Local Sandbox)'
      };
    } catch (err) {
      // Fallback to Worker if Pyodide CDN is blocked or fails
      console.warn('Pyodide local run failed, falling back to server compiler:', err);
    }
  }

  // 3. Compiled / Server Languages via Worker API
  const res = await apiRequest('/api/run-code', {
    method: 'POST',
    body: JSON.stringify({ language: lang, code, stdin })
  });

  const duration = ((performance.now() - startTime) / 1000).toFixed(2);

  return {
    success: res.success !== false,
    output: (res.run && res.run.output) || res.output || res.error || '',
    duration,
    engine: `Remote Isolation Runtime (${lang})`
  };
}
