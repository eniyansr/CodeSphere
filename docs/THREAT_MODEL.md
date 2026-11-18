# CodeSphere Pro — Threat Model & Security Posture

## 1. System Adversaries & Trust Boundaries
1. **Compromised Backend / Cloudflare Infrastructure:**
   - *Threat:* Malicious actor or rogue worker inspecting database records in Cloudflare D1.
   - *Mitigation:* Zero-Knowledge storage. D1 holds only encrypted envelopes (`ciphertext`, `nonce`, `aad`, `signature`) and wrapped DEKs. The server does not possess the private keys required to decrypt user data.
2. **Man-In-The-Middle (MITM) & Replay Attacks:**
   - *Threat:* Tampering with payloads in transit or replaying old examination answers.
   - *Mitigation:* All envelopes are digitally signed using ECDSA P-256 with timestamped AAD. Any bit flip causes AES-GCM tag verification or ECDSA signature verification to fail immediately.
3. **Compromised Student Machine / Untrusted Environment:**
   - *Threat:* Running unauthorized background processes, multiple monitors, or tab switching during exams.
   - *Mitigation:* Examination Lockdown agent with fullscreen enforcement, focus tracking, clipboard restriction, and AI webcam proctoring.
4. **Third-Party Compiler Leakage:**
   - *Threat:* Remote code execution APIs logging source code.
   - *Mitigation:* Python execution runs 100% in-browser using Pyodide (WebAssembly), avoiding any network transmission. Compiled languages (C++, Java, Rust) explicitly alert the user prior to remote sandboxing.
