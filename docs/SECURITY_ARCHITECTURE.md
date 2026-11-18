# CodeSphere Pro — End-to-End Encryption Security Architecture

## 1. Overview
CodeSphere Pro implements client-side End-to-End Encryption (E2EE) ensuring that all sensitive user content (code drafts, assignments, student submissions, exam answers, feedback, and scratch notes) is encrypted on the user's device and remains confidential even from the Cloudflare host and database administrators.

## 2. Cryptographic Primitives
| Operation | Algorithm / Standard | Parameters |
| :--- | :--- | :--- |
| **Data Encryption** | AES-GCM (NIST SP 800-38D) | 256-bit Key, 96-bit Random Nonce, 128-bit Auth Tag |
| **Key Encapsulation** | Hybrid Public Key Encryption (RFC 9180 HPKE / ECDH) | NIST P-256 (secp256r1) |
| **Key Derivation** | HKDF (RFC 5869) | SHA-256 Hash |
| **Vault Key Derivation** | PBKDF2-HMAC-SHA256 (RFC 8018) | 100,000 Iterations + 128-bit Salt |
| **Digital Signatures** | ECDSA (RFC 6979) | NIST P-256 + SHA-256 |
| **Entropy Source** | Web Crypto API | `crypto.getRandomValues()` |

## 3. Envelope Encryption Protocol
For every confidential payload:
1. **DEK Generation:** Browser generates a fresh, random 256-bit symmetric Data Encryption Key (DEK).
2. **Nonce Creation:** Browser generates a fresh, unique 96-bit nonce using hardware entropy.
3. **AAD Binding:** Authenticated Additional Data binds `recordId`, `ownerId`, `contentType`, and `version` to the ciphertext.
4. **Payload Encryption:** Plaintext is sealed with `AES-256-GCM`.
5. **Recipient Wrapping:** For each authorized recipient device (e.g. Teacher and Student), the DEK is encapsulated using an ephemeral ECDH keypair and HKDF.
6. **Digital Signing:** The sender signs the entire envelope with their ECDSA private key.
7. **Storage:** Only the sealed ciphertext and wrapped DEK entries are sent to Cloudflare D1.

## 4. Key Vault & Recovery
- **Zero-Knowledge Vault:** Private signing and encryption keys are generated entirely in the client browser and sealed with a derived Vault Key. The Cloudflare backend receives only the encrypted vault ciphertext.
- **Recovery Mnemonic:** A client-generated 24-word high-entropy recovery phrase allows vault restoration in case the passphrase is lost. The server stores only the SHA-256 hash of the recovery key for verification.
