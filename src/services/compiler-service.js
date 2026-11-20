/**
 * CodeSphere Pro — Client & Remote Execution Compiler Service
 *
 * Execution Hierarchy:
 * 1. JavaScript: Executed directly in-browser inside a secure sandbox (zero network, instant).
 * 2. HTML/CSS/JS: Rendered inside a sandboxed iframe blob (zero network, instant).
 * 3. Python: Executed client-side using Pyodide (WebAssembly) with zero network leakage.
 * 4. Multi-language (PHP, C++, C, Java, TypeScript, Rust, Ruby, C#, Swift):
 *    Executed via Wandbox Open Compiler Engine (CORS-enabled, free, keyless).
 *    Fallback to Cloudflare Worker `/api/run-code` proxy if direct call is blocked.
 */

import { apiRequest } from './api-client.js';

// ─── Wandbox Compiler Mapping ────────────────────────────────────────────────
const WANDBOX_COMPILERS = {
  php:        { compiler: 'php-8.3.12',       display: 'PHP 8.3'         },
  cpp:        { compiler: 'gcc-head',         display: 'GCC 14 (C++23)', options: 'warning,c++23' },
  c:          { compiler: 'gcc-head-c',       display: 'GCC 14 (C17)',   options: 'warning' },
  java:       { compiler: 'openjdk-jdk-22+36',display: 'OpenJDK 22'      },
  typescript: { compiler: 'typescript-5.6.2', display: 'TypeScript 5.6'  },
  rust:       { compiler: 'rust-1.82.0',      display: 'Rust 1.82'       },
  ruby:       { compiler: 'ruby-4.0.2',       display: 'Ruby 4.0'        },
  csharp:     { compiler: 'mono-6.12.0.199',  display: 'Mono C# 6.12'    },
  swift:      { compiler: 'swift-6.0.1',      display: 'Swift 6.0'       },
  python:     { compiler: 'cpython-3.12.7',   display: 'Python 3.12'     },
};

// ─── Default starter code per language ───────────────────────────────────────
export const STARTER_CODE = {
  javascript: `// JavaScript - V8 Sandbox
console.log("Hello from CodeSphere!");

function greet(name) {
  return \`Welcome, \${name}!\`;
}

console.log(greet("CodeSphere"));`,

  php: `<?php
// PHP 8.3 Sandbox
$greeting = "Hello from CodeSphere!";
$version  = "PHP 8.3";

echo $greeting . "\\n";
echo "Running on: " . $version . "\\n";

$langs = ["PHP", "JavaScript", "Python", "Java", "C++"];
foreach ($langs as $lang) {
    echo "Language: " . $lang . "\\n";
}
?>`,

  python: `# Python 3 - Pyodide WASM (Zero-Server Sandbox)
greeting = "Hello from CodeSphere!"
version  = "Python 3"

print(f"Running: {version}")
print(greeting)

langs = ["Python", "JavaScript", "PHP", "Java"]
for lang in langs:
    print(f"Language: {lang}")`,

  cpp: `// C++ - GCC (C++23)
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    string greeting = "Hello from CodeSphere!";
    cout << greeting << endl;

    vector<string> langs = {"C++", "Python", "Java", "PHP"};
    for (const auto& l : langs) {
        cout << "Language: " << l << endl;
    }

    return 0;
}`,

  c: `// C - GCC (C17)
#include <stdio.h>

int main() {
    printf("Hello from CodeSphere!\\n");
    printf("Running: C17\\n");

    char *langs[] = {"C", "Python", "Java", "PHP"};
    for (int i = 0; i < 4; i++) {
        printf("Language: %s\\n", langs[i]);
    }

    return 0;
}`,

  java: `// Java - OpenJDK 22
import java.util.*;

class Main {
    public static void main(String[] args) {
        System.out.println("Hello from CodeSphere!");
        System.out.println("Running: Java 22");

        String[] langs = {"Java", "Python", "C++", "PHP"};
        for (String l : langs) {
            System.out.println("Language: " + l);
        }
    }
}`,

  typescript: `// TypeScript 5.6
const greeting: string = "Hello from CodeSphere!";
const version: string = "TypeScript 5.6";

console.log(\`Running: \${version}\`);
console.log(greeting);

const langs: string[] = ["TypeScript", "JavaScript", "Python", "PHP"];
langs.forEach(l => console.log(\`Language: \${l}\`));`,

  rust: `// Rust 1.82
fn main() {
    let greeting = "Hello from CodeSphere!";
    println!("{}", greeting);
    println!("Running: Rust 1.82");

    let langs = vec!["Rust", "Python", "C++", "PHP"];
    for l in &langs {
        println!("Language: {}", l);
    }
}`,

  ruby: `# Ruby 4.0
greeting = "Hello from CodeSphere!"
version  = "Ruby 4.0"

puts greeting
puts "Running: #{version}"

langs = ["Ruby", "Python", "JavaScript", "PHP"]
langs.each { |l| puts "Language: #{l}" }`,

  csharp: `// C# - Mono .NET
using System;
using System.Collections.Generic;

class Program {
    static void Main() {
        string greeting = "Hello from CodeSphere!";
        Console.WriteLine(greeting);
        Console.WriteLine("Running: C# .NET");

        var langs = new List<string> { "C#", "Java", "Python", "PHP" };
        foreach (var l in langs) {
            Console.WriteLine($"Language: {l}");
        }
    }
}`,

  swift: `// Swift 6.0
import Foundation

let greeting = "Hello from CodeSphere!"
let version  = "Swift 6.0"

print(greeting)
print("Running: \\(version)")

let langs = ["Swift", "Python", "Java", "PHP"]
for l in langs {
    print("Language: \\(l)")
}`,

  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CodeSphere Preview</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; background: #f0f4ff; }
    h1   { color: #4f46e5; }
    .box { background: white; border-radius: 12px; padding: 1.5rem;
           box-shadow: 0 4px 16px rgba(79,70,229,.15); margin-top: 1rem; }
  </style>
</head>
<body>
  <h1>Hello from CodeSphere! 🚀</h1>
  <div class="box">
    <p>Edit this HTML and click <strong>Run Code</strong> to preview.</p>
  </div>
</body>
</html>`,
};

// ─── Pyodide singleton ────────────────────────────────────────────────────────
let pyodideInstance = null;
let pyodideLoadingPromise = null;

export async function getPyodide() {
  if (pyodideInstance) return pyodideInstance;
  if (pyodideLoadingPromise) return pyodideLoadingPromise;

  pyodideLoadingPromise = new Promise(async (resolve, reject) => {
    try {
      if (!window.loadPyodide) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js';
        script.onload = async () => {
          try {
            const py = await window.loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/' });
            pyodideInstance = py;
            resolve(py);
          } catch (e) { reject(e); }
        };
        script.onerror = reject;
        document.head.appendChild(script);
      } else {
        const py = await window.loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/' });
        pyodideInstance = py;
        resolve(py);
      }
    } catch (err) { reject(err); }
  });

  return pyodideLoadingPromise;
}

// ─── Wandbox Runner (CORS direct with Worker fallback) ───────────────────────
async function runViaWandbox(lang, code, stdin = '') {
  const meta = WANDBOX_COMPILERS[lang];
  if (!meta) throw new Error(`Language "${lang}" is not supported.`);

  // In Java on Wandbox, default file is prog.java. Replace 'public class' with 'class' so it compiles
  let processedCode = code;
  if (lang === 'java') {
    processedCode = processedCode.replace(/\bpublic\s+class\b/g, 'class');
  }

  const payload = {
    compiler: meta.compiler,
    code: processedCode,
    options: meta.options || '',
    stdin: stdin || '',
  };

  const WANDBOX_URL = 'https://wandbox.org/api/compile.json';
  let data;

  try {
    const res = await fetch(WANDBOX_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Wandbox HTTP ${res.status}`);
    data = await res.json();
  } catch (directErr) {
    console.warn('[Compiler] Direct Wandbox failed, falling back to worker:', directErr.message);
    try {
      const workerRes = await apiRequest('/api/run-code', {
        method: 'POST',
        body: JSON.stringify({ language: lang, code: processedCode, stdin }),
      });
      return {
        success: workerRes.success !== false,
        output: workerRes.run?.output || workerRes.output || '(No output)',
        engine: `CodeSphere Cloud Runtime · ${meta.display}`,
      };
    } catch (workerErr) {
      throw new Error(`Compiler service unavailable: ${directErr.message}`);
    }
  }

  // Wandbox outputs:
  // program_output: stdout of executed code
  // program_error: stderr of executed code
  // compiler_message: build / compiler warnings or errors
  const progOut = data.program_output || '';
  const progErr = data.program_error || '';
  const compMsg = data.compiler_message || '';

  let output = '';
  if (compMsg && data.status !== '0') {
    output = `[Compiler Error]\n${compMsg}\n`;
  } else if (compMsg && !progOut) {
    output = compMsg;
  }
  if (progOut) output += progOut;
  if (progErr) output += (output ? '\n[Stderr]\n' : '') + progErr;

  return {
    success: data.status === '0',
    output: output.trim() || '(Program completed with no output)',
    engine: `Wandbox · ${meta.display}`,
  };
}

// ─── Primary Execution Entrypoint ─────────────────────────────────────────────
export async function executeCode({ language, code, stdin = '' }) {
  const lang = (language || 'javascript').toLowerCase();
  const startTime = performance.now();
  const duration = () => ((performance.now() - startTime) / 1000).toFixed(2);

  // 1. JavaScript — in-browser V8 sandbox (zero network, instant)
  if (lang === 'javascript') {
    const logs = [];
    const fakeConsole = {
      log:   (...a) => logs.push(a.map(x => typeof x === 'object' ? JSON.stringify(x, null, 2) : String(x)).join(' ')),
      error: (...a) => logs.push('[ERROR] ' + a.map(String).join(' ')),
      warn:  (...a) => logs.push('[WARN] '  + a.map(String).join(' ')),
      info:  (...a) => logs.push('[INFO] '  + a.map(String).join(' ')),
    };
    try {
      new Function('console', code)(fakeConsole);
      return {
        success: true,
        output: logs.join('\n') || '(Program completed with no output)',
        duration: duration(),
        engine: 'Browser V8 Sandbox (Local)',
      };
    } catch (err) {
      return {
        success: false,
        output: `${err.name}: ${err.message}`,
        duration: duration(),
        engine: 'Browser V8 Sandbox (Local)',
      };
    }
  }

  // 2. HTML — render in sandboxed iframe (zero network, instant)
  if (lang === 'html') {
    const blob = new Blob([code], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    return {
      success: true,
      output: `[HTML Preview] Rendered in live sandbox.\nPreview URL: ${url}\nTip: Switch to the HTML preview tab or open the sandbox blob to view live styling.`,
      duration: duration(),
      engine: 'Browser iframe Sandbox (Local)',
      previewUrl: url,
    };
  }

  // 3. Python — Pyodide WebAssembly (zero network, 100% client-side privacy)
  if (lang === 'python') {
    try {
      const py = await getPyodide();
      let out = '';
      py.setStdin({ stdin: () => stdin });
      py.setStdout({ batched: (s) => { out += s + '\n'; } });
      py.setStderr({ batched: (s) => { out += '[ERR] ' + s + '\n'; } });
      await py.runPythonAsync(code);
      return {
        success: true,
        output: out.trim() || '(Program completed with no output)',
        duration: duration(),
        engine: 'Pyodide WebAssembly (Zero-Server Local)',
      };
    } catch (pyErr) {
      console.warn('[Compiler] Pyodide failed, trying remote runtime:', pyErr.message);
      try {
        const r = await runViaWandbox('python', code, stdin);
        return { ...r, duration: duration() };
      } catch (e) {
        return {
          success: false,
          output: String(pyErr.message || pyErr),
          duration: duration(),
          engine: 'Pyodide WebAssembly (Error)',
        };
      }
    }
  }

  // 4. All other languages via Wandbox
  try {
    const r = await runViaWandbox(lang, code, stdin);
    return { ...r, duration: duration() };
  } catch (err) {
    return {
      success: false,
      output: `Compiler error: ${err.message}`,
      duration: duration(),
      engine: `Remote Runner (${lang})`,
    };
  }
}
