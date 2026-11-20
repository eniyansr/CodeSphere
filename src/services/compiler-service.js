/**
 * CodeSphere Pro – Client & Remote Execution Compiler Service
 *
 * Execution Hierarchy:
 * 1. JavaScript: Executed directly in-browser (zero network).
 * 2. Python:     Pyodide WASM client-side, falls back to Piston if WASM fails.
 * 3. HTML/CSS/JS: Rendered in a sandboxed iframe, no server.
 * 4. All other languages: Piston API (open, free, no key required).
 */

import { apiRequest } from './api-client.js';

// ─── Piston language IDs ──────────────────────────────────────────────────────
// Maps our internal language id → { language, version } for the Piston API.
// Verified against https://emkc.org/api/v2/piston/runtimes
const PISTON_LANGS = {
  cpp:        { language: 'c++',        version: '10.2.0' },
  c:          { language: 'c',          version: '10.2.0' },
  java:       { language: 'java',       version: '15.0.2' },
  typescript: { language: 'typescript', version: '5.0.3'  },
  go:         { language: 'go',         version: '1.16.2'  },
  rust:       { language: 'rust',       version: '1.50.0'  },
  php:        { language: 'php',        version: '8.2.3'   },
  swift:      { language: 'swift',      version: '5.3.3'   },
  kotlin:     { language: 'kotlin',     version: '1.8.20'  },
  ruby:       { language: 'ruby',       version: '3.0.1'   },
  csharp:     { language: 'csharp',     version: '6.12.0'  },
  python:     { language: 'python',     version: '3.10.0'  },
};

// ─── Default starter code per language (shown when editor is first opened) ───
export const STARTER_CODE = {
  javascript: `// JavaScript - V8 Sandbox
console.log("Hello from CodeSphere!");

function greet(name) {
  return \`Welcome, \${name}!\`;
}

console.log(greet("CodeSphere"));`,

  python: `# Python 3 - Pyodide WASM
greeting = "Hello from CodeSphere!"
version  = "Python 3"

print(f"Running: {version}")
print(greeting)

langs = ["Python", "JavaScript", "PHP", "Java"]
for lang in langs:
    print(f"Language: {lang}")`,

  cpp: `// C++ - GCC 12
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    string greeting = "Hello from CodeSphere!";
    cout << greeting << endl;

    vector<string> langs = {"C++", "Python", "Java"};
    for (const auto& l : langs)
        cout << "Language: " << l << endl;

    return 0;
}`,

  c: `// C - C17
#include <stdio.h>

int main() {
    printf("Hello from CodeSphere!\\n");
    printf("Running: C17\\n");

    char *langs[] = {"C", "Python", "Java"};
    for (int i = 0; i < 3; i++)
        printf("Language: %s\\n", langs[i]);

    return 0;
}`,

  java: `// Java - JVM 17
import java.util.*;

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from CodeSphere!");
        System.out.println("Running: Java 17");

        String[] langs = {"Java", "Python", "C++"};
        for (String l : langs)
            System.out.println("Language: " + l);
    }
}`,

  typescript: `// TypeScript 5.0
const greeting: string = "Hello from CodeSphere!";
const version: string = "TypeScript 5.0";

console.log(\`Running: \${version}\`);
console.log(greeting);

const langs: string[] = ["TypeScript", "JavaScript", "Python"];
langs.forEach(l => console.log(\`Language: \${l}\`));`,

  go: `// Go 1.21
package main

import "fmt"

func main() {
    greeting := "Hello from CodeSphere!"
    fmt.Println(greeting)
    fmt.Println("Running: Go 1.21")

    langs := []string{"Go", "Python", "Java"}
    for _, l := range langs {
        fmt.Printf("Language: %s\\n", l)
    }
}`,

  rust: `// Rust 1.75
fn main() {
    let greeting = "Hello from CodeSphere!";
    println!("{}", greeting);
    println!("Running: Rust 1.75");

    let langs = vec!["Rust", "Python", "C++"];
    for l in &langs {
        println!("Language: {}", l);
    }
}`,

  php: `<?php
// PHP 8.2
$greeting = "Hello from CodeSphere!";
$version  = "PHP 8.2";

echo $greeting . "\\n";
echo "Running: " . $version . "\\n";

$langs = ["Python", "JavaScript", "PHP", "Java"];
foreach ($langs as $lang) {
    echo "Language: " . $lang . "\\n";
}
?>`,

  swift: `// Swift 5.9
import Foundation

let greeting = "Hello from CodeSphere!"
let version  = "Swift 5.9"

print(greeting)
print("Running: \\(version)")

let langs = ["Swift", "Python", "Java"]
for l in langs {
    print("Language: \\(l)")
}`,

  kotlin: `// Kotlin 1.9
fun main() {
    val greeting = "Hello from CodeSphere!"
    val version  = "Kotlin 1.9"

    println(greeting)
    println("Running: $version")

    val langs = listOf("Kotlin", "Java", "Python")
    for (l in langs) println("Language: $l")
}`,

  ruby: `# Ruby 3.3
greeting = "Hello from CodeSphere!"
version  = "Ruby 3.3"

puts greeting
puts "Running: #{version}"

langs = ["Ruby", "Python", "JavaScript"]
langs.each { |l| puts "Language: #{l}" }`,

  csharp: `// C# .NET 8
using System;
using System.Collections.Generic;

class Program {
    static void Main() {
        string greeting = "Hello from CodeSphere!";
        Console.WriteLine(greeting);
        Console.WriteLine("Running: C# .NET 8");

        var langs = new List<string> { "C#", "Java", "Python" };
        foreach (var l in langs)
            Console.WriteLine($"Language: {l}");
    }
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

// ─── Piston executor ──────────────────────────────────────────────────────────
async function runViaPiston(lang, code, stdin = '') {
  const runtime = PISTON_LANGS[lang];
  if (!runtime) throw new Error(`Language "${lang}" is not supported.`);

  // Determine the correct file name so the runtime uses the right compiler/interpreter
  const EXT_MAP = {
    'c++': 'main.cpp', c: 'main.c', java: 'Main.java', go: 'main.go',
    rust: 'main.rs', typescript: 'index.ts', php: 'main.php',
    swift: 'main.swift', kotlin: 'main.kt', ruby: 'main.rb',
    csharp: 'Program.cs', python: 'main.py',
  };
  const filename = EXT_MAP[runtime.language] || `main.${lang}`;

  const payload = {
    language: runtime.language,
    version: runtime.version,
    files: [{ name: filename, content: code }],
    stdin,
    run_timeout: 10000,
    compile_timeout: 15000,
  };

  // Try direct Piston first, fall back through worker proxy
  const PISTON_URL = 'https://emkc.org/api/v2/piston/execute';
  let res, data;

  try {
    res = await fetch(PISTON_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Piston HTTP ${res.status}`);
    data = await res.json();
  } catch (directErr) {
    // Fall back to our Cloudflare worker proxy
    console.warn('[Compiler] Direct Piston failed, trying worker proxy:', directErr.message);
    data = await apiRequest('/api/run-code', {
      method: 'POST',
      body: JSON.stringify({ language: lang, code, stdin }),
    });
  }

  const runOutput   = (data.run   && (data.run.output   || data.run.stderr))   || '';
  const buildOutput = (data.compile && (data.compile.output || data.compile.stderr)) || '';
  const combined    = (buildOutput ? `[Compile]\n${buildOutput}\n` : '') + runOutput;

  return {
    success: !buildOutput || !data.compile?.code,
    output: combined.trim() || '(Program completed with no output)',
    engine: `Piston · ${runtime.language} ${runtime.version}`,
  };
}

// ─── Main entry point ─────────────────────────────────────────────────────────
export async function executeCode({ language, code, stdin = '' }) {
  const lang = (language || 'javascript').toLowerCase();
  const startTime = performance.now();
  const duration = () => ((performance.now() - startTime) / 1000).toFixed(2);

  // 1. JavaScript — in-browser sandbox (zero network)
  if (lang === 'javascript') {
    const logs = [];
    const fakeConsole = {
      log:   (...a) => logs.push(a.map(x => typeof x === 'object' ? JSON.stringify(x, null, 2) : String(x)).join(' ')),
      error: (...a) => logs.push('[ERROR] ' + a.map(String).join(' ')),
      warn:  (...a) => logs.push('[WARN] '  + a.map(String).join(' ')),
      info:  (...a) => logs.push('[INFO] '  + a.map(String).join(' ')),
    };
    try {
      // eslint-disable-next-line no-new-func
      new Function('console', code)(fakeConsole);
      return { success: true, output: logs.join('\n') || '(Program completed with no output)', duration: duration(), engine: 'Browser V8 Sandbox (Local)' };
    } catch (err) {
      return { success: false, output: `${err.name}: ${err.message}`, duration: duration(), engine: 'Browser V8 Sandbox (Local)' };
    }
  }

  // 2. HTML — render in sandboxed iframe
  if (lang === 'html') {
    const blob = new Blob([code], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    return { success: true, output: `[HTML Preview] Rendered in iframe.\nBlob URL: ${url}\nTip: The preview panel renders HTML live.`, duration: duration(), engine: 'Browser iframe (Local)', previewUrl: url };
  }

  // 3. Python — Pyodide WASM (falls back to Piston)
  if (lang === 'python') {
    try {
      const py = await getPyodide();
      let out = '';
      py.setStdin({ stdin: () => stdin });
      py.setStdout({ batched: (s) => { out += s + '\n'; } });
      py.setStderr({ batched: (s) => { out += '[ERR] ' + s + '\n'; } });
      await py.runPythonAsync(code);
      return { success: true, output: out.trim() || '(No output)', duration: duration(), engine: 'Pyodide WASM (Zero-Server)' };
    } catch (pyErr) {
      console.warn('[Compiler] Pyodide failed, falling back to Piston:', pyErr.message);
      try {
        const r = await runViaPiston('python', code, stdin);
        return { ...r, duration: duration() };
      } catch (pistonErr) {
        return { success: false, output: String(pyErr.message), duration: duration(), engine: 'Pyodide WASM (error)' };
      }
    }
  }

  // 4. All other languages via Piston
  try {
    const r = await runViaPiston(lang, code, stdin);
    return { ...r, duration: duration() };
  } catch (err) {
    return { success: false, output: `Compiler error: ${err.message}`, duration: duration(), engine: `Piston (${lang})` };
  }
}
