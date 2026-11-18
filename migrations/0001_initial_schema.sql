-- CodeSphere Pro - Cloudflare D1 Relational Schema (SQLite STRICT)
-- Migration: 0001_initial_schema.sql
-- Zero-Knowledge E2EE Architecture & Academic Assessment Platform

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student', 'teacher', 'admin')),
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- 2. User Sessions (Server-side authenticated sessions)
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. User Devices (Multi-device authorization & E2EE enrollment)
CREATE TABLE IF NOT EXISTS user_devices (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    device_name TEXT NOT NULL,
    device_fingerprint TEXT NOT NULL,
    approved INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. User Public Keys (Public Key Directory for ECDH/ECDSA)
CREATE TABLE IF NOT EXISTS user_public_keys (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    key_type TEXT NOT NULL CHECK(key_type IN ('encryption', 'signing')),
    public_key_jwk TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. User Key Vaults (Encrypted Private Keys - Zero-Knowledge Storage)
-- The server NEVER holds the vault decryption key
CREATE TABLE IF NOT EXISTS user_key_vaults (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL UNIQUE,
    encrypted_vault TEXT NOT NULL,
    vault_salt TEXT NOT NULL,
    vault_params TEXT NOT NULL,
    recovery_hash TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Classrooms Table
CREATE TABLE IF NOT EXISTS classrooms (
    id TEXT PRIMARY KEY NOT NULL,
    teacher_id TEXT NOT NULL,
    title TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    invite_code TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    description TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. Classroom Members Table
CREATE TABLE IF NOT EXISTS classroom_members (
    id TEXT PRIMARY KEY NOT NULL,
    classroom_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student', 'teacher', 'ta')),
    joined_at INTEGER NOT NULL,
    UNIQUE(classroom_id, user_id),
    FOREIGN KEY(classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. Encrypted Objects Table (Generic E2EE Envelope Storage)
-- Stored on Cloudflare D1; readable only by authorized recipients possessing matching private keys
CREATE TABLE IF NOT EXISTS encrypted_objects (
    id TEXT PRIMARY KEY NOT NULL,
    owner_id TEXT NOT NULL,
    content_type TEXT NOT NULL, -- 'note', 'assignment', 'submission', 'exam_question', 'exam_answer', 'feedback'
    record_id TEXT NOT NULL,
    nonce TEXT NOT NULL,
    ciphertext TEXT NOT NULL,
    aad TEXT NOT NULL,
    signature TEXT NOT NULL,
    sender_key_id TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 9. Encrypted Object Recipients (Per-recipient wrapped DEK using ECDH / HPKE)
CREATE TABLE IF NOT EXISTS encrypted_object_recipients (
    id TEXT PRIMARY KEY NOT NULL,
    object_id TEXT NOT NULL,
    recipient_id TEXT NOT NULL,
    ephemeral_public_key TEXT NOT NULL,
    wrapped_dek TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE(object_id, recipient_id),
    FOREIGN KEY(object_id) REFERENCES encrypted_objects(id) ON DELETE CASCADE,
    FOREIGN KEY(recipient_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 10. Assignments Table
CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY NOT NULL,
    classroom_id TEXT NOT NULL,
    teacher_id TEXT NOT NULL,
    title TEXT NOT NULL,
    deadline INTEGER,
    object_id TEXT, -- References encrypted_objects for assignment details/testcases
    created_at INTEGER NOT NULL,
    FOREIGN KEY(classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
    FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(object_id) REFERENCES encrypted_objects(id) ON DELETE SET NULL
);

-- 11. Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY NOT NULL,
    assignment_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    object_id TEXT NOT NULL, -- References encrypted_objects for encrypted code payload
    score REAL,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted', 'graded', 'returned')),
    submitted_at INTEGER NOT NULL,
    FOREIGN KEY(assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(object_id) REFERENCES encrypted_objects(id) ON DELETE CASCADE
);

-- 12. Examinations Table
CREATE TABLE IF NOT EXISTS examinations (
    id TEXT PRIMARY KEY NOT NULL,
    teacher_id TEXT NOT NULL,
    title TEXT NOT NULL,
    duration INTEGER NOT NULL, -- In minutes
    deadline INTEGER,
    status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('draft', 'published', 'closed')),
    object_id TEXT, -- Encrypted exam questions envelope
    created_at INTEGER NOT NULL,
    FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(object_id) REFERENCES encrypted_objects(id) ON DELETE SET NULL
);

-- 13. Examination Attempts Table
CREATE TABLE IF NOT EXISTS examination_attempts (
    id TEXT PRIMARY KEY NOT NULL,
    exam_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    object_id TEXT NOT NULL, -- Encrypted exam answers envelope
    score REAL,
    warnings_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK(status IN ('in_progress', 'submitted', 'evaluated')),
    started_at INTEGER NOT NULL,
    submitted_at INTEGER,
    FOREIGN KEY(exam_id) REFERENCES examinations(id) ON DELETE CASCADE,
    FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(object_id) REFERENCES encrypted_objects(id) ON DELETE CASCADE
);

-- 14. Certificates Table (Digitally Signed Academic Credentials)
CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY NOT NULL,
    certificate_number TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    course_name TEXT NOT NULL,
    score REAL NOT NULL,
    issuer_public_key TEXT NOT NULL,
    signature TEXT NOT NULL,
    issued_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 15. Battle Rooms Table
CREATE TABLE IF NOT EXISTS battle_rooms (
    id TEXT PRIMARY KEY NOT NULL,
    problem_id TEXT NOT NULL,
    host_user_id TEXT NOT NULL,
    guest_user_id TEXT,
    winner_user_id TEXT,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK(status IN ('waiting', 'in_progress', 'completed')),
    created_at INTEGER NOT NULL,
    FOREIGN KEY(host_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 16. Replay Sessions Table
CREATE TABLE IF NOT EXISTS replay_sessions (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    language TEXT NOT NULL,
    events_json TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 17. Security Events & Audit Logs (Tamper-evident logs)
CREATE TABLE IF NOT EXISTS security_events (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT,
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK(severity IN ('info', 'warning', 'critical')),
    details TEXT NOT NULL,
    ip_address TEXT,
    created_at INTEGER NOT NULL
);

-- Indices for rapid query performance
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_pubkeys_user ON user_public_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_vaults_user ON user_key_vaults(user_id);
CREATE INDEX IF NOT EXISTS idx_classroom_members_user ON classroom_members(user_id);
CREATE INDEX IF NOT EXISTS idx_classroom_members_class ON classroom_members(classroom_id);
CREATE INDEX IF NOT EXISTS idx_enc_recipients ON encrypted_object_recipients(recipient_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assign ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student ON examination_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);
