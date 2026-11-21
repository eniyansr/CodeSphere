/**
 * CodeSphere Pro — Edge Deep Learning Monitoring & Sequential Risk Service
 * 
 * Architecture:
 * 1. Edge CNN (Browser): Analyzes camera frames locally to emit lightweight symbolic events:
 *    - GAZE_DEVIATION: Eyes/face diverted from central editor zone
 *    - MULTI_FACE: More than one face detected in the webcam view
 *    - NO_FACE: Candidate absent from frame
 *    - TAB_UNFOCUSED: Candidate switched windows or split-screened
 *    - ANOMALY_AUDIO: Background voice or suspicious audio frequency detected
 * 
 * 2. Sequential Risk Model (GRU Temporal Evaluator):
 *    - Evaluates chronological cluster density of events over a rolling sliding window.
 *    - Computes a dynamic integrity risk index (0% - 100%).
 *    - Transient glitches decay quickly; synchronized multi-factor anomalies spike risk steeply.
 * 
 * 3. Privacy Guarantee:
 *    - NEVER sends raw camera video or audio frames to any server.
 *    - Emits ONLY anonymized numerical event vectors: { timestamp, type, confidence, durationMs }.
 */

// ─── Default simulated student integrity states for classroom supervision ───
export const INITIAL_STUDENT_INTEGRITY = [
  {
    id: 'stud-1',
    name: 'Eniyan Rajesh',
    avatar: 'ER',
    role: 'Student',
    cameraActive: true,
    audioActive: true,
    riskScore: 6,
    riskLevel: 'low', // 'low' | 'moderate' | 'high'
    gazeState: 'focused', // 'focused' | 'diverted' | 'absent'
    facesDetected: 1,
    eventsCount: 2,
    timeline: [
      { t: 0, score: 0 },
      { t: 15, score: 4 },
      { t: 30, score: 6 },
      { t: 45, score: 6 }
    ],
    recentEvents: [
      { time: '14:22:10', type: 'GAZE_DIVERGENCE', desc: 'Brief glance off-screen (left)', conf: '88%', duration: '1.2s', severity: 'benign' },
      { time: '14:24:45', type: 'TAB_FOCUS', desc: 'Returned focus to Monaco IDE window', conf: '100%', duration: '0.4s', severity: 'benign' }
    ]
  },
  {
    id: 'stud-2',
    name: 'Pranav Kumar',
    avatar: 'PK',
    role: 'Student',
    cameraActive: true,
    audioActive: true,
    riskScore: 84,
    riskLevel: 'high',
    gazeState: 'diverted',
    facesDetected: 2,
    eventsCount: 9,
    timeline: [
      { t: 0, score: 5 },
      { t: 15, score: 18 },
      { t: 30, score: 52 },
      { t: 45, score: 84 }
    ],
    recentEvents: [
      { time: '14:26:01', type: 'MULTI_FACE', desc: 'Secondary face detected in camera viewport', conf: '94%', duration: '4.8s', severity: 'critical' },
      { time: '14:25:12', type: 'AUDIO_VOICE', desc: 'Background conversation frequency detected', conf: '87%', duration: '3.1s', severity: 'warning' },
      { time: '14:23:40', type: 'GAZE_DIVERGENCE', desc: 'Repeated downward gaze towards mobile phone region', conf: '91%', duration: '6.4s', severity: 'warning' }
    ]
  },
  {
    id: 'stud-3',
    name: 'Aisha Begum',
    avatar: 'AB',
    role: 'Student',
    cameraActive: true,
    audioActive: false,
    riskScore: 32,
    riskLevel: 'moderate',
    gazeState: 'focused',
    facesDetected: 1,
    eventsCount: 4,
    timeline: [
      { t: 0, score: 2 },
      { t: 15, score: 8 },
      { t: 30, score: 36 },
      { t: 45, score: 32 }
    ],
    recentEvents: [
      { time: '14:21:18', type: 'TAB_UNFOCUSED', desc: 'Browser window blur flagged', conf: '100%', duration: '2.8s', severity: 'warning' },
      { time: '14:19:02', type: 'GAZE_DIVERGENCE', desc: 'Gaze diverted right for extended period', conf: '86%', duration: '3.5s', severity: 'benign' }
    ]
  },
  {
    id: 'stud-4',
    name: 'Devendra Naidu',
    avatar: 'DN',
    role: 'Student',
    cameraActive: false,
    audioActive: true,
    riskScore: 68,
    riskLevel: 'high',
    gazeState: 'absent',
    facesDetected: 0,
    eventsCount: 6,
    timeline: [
      { t: 0, score: 0 },
      { t: 15, score: 24 },
      { t: 30, score: 48 },
      { t: 45, score: 68 }
    ],
    recentEvents: [
      { time: '14:27:30', type: 'NO_FACE', desc: 'Candidate absent from video stream', conf: '98%', duration: '14.2s', severity: 'critical' },
      { time: '14:26:10', type: 'CAMERA_OBSCURED', desc: 'Camera video feed obstructed or dark', conf: '92%', duration: '8.0s', severity: 'warning' }
    ]
  },
  {
    id: 'stud-5',
    name: 'Sharath Chandra',
    avatar: 'SC',
    role: 'Student',
    cameraActive: true,
    audioActive: true,
    riskScore: 12,
    riskLevel: 'low',
    gazeState: 'focused',
    facesDetected: 1,
    eventsCount: 1,
    timeline: [
      { t: 0, score: 2 },
      { t: 15, score: 4 },
      { t: 30, score: 10 },
      { t: 45, score: 12 }
    ],
    recentEvents: [
      { time: '14:25:50', type: 'GAZE_DIVERGENCE', desc: 'Gaze momentarily off-screen', conf: '79%', duration: '0.8s', severity: 'benign' }
    ]
  }
];

// ─── GRU Sequential Risk Calculation Simulator ───────────────────────────────
export function computeGRURiskScore(eventHistory) {
  if (!eventHistory || eventHistory.length === 0) return 0;

  // Weightings based on temporal anomaly classification
  const weights = {
    MULTI_FACE: 35,
    NO_FACE: 25,
    TAB_UNFOCUSED: 15,
    AUDIO_VOICE: 12,
    GAZE_DIVERGENCE: 8
  };

  let rawScore = 0;
  const now = Date.now();

  eventHistory.forEach(ev => {
    const ageSeconds = Math.max(1, (now - (ev.timestamp || now)) / 1000);
    // Exponential decay: events in the last 60s count heaviest
    const decay = Math.exp(-ageSeconds / 180);
    const w = weights[ev.type] || 5;
    rawScore += w * decay;
  });

  return Math.min(100, Math.round(rawScore));
}

// ─── Browser Camera & Local Inference Engine ─────────────────────────────────
export class EdgeCNNMonitor {
  constructor({ onEvent, onRiskUpdate, videoElement }) {
    this.onEvent = onEvent || (() => {});
    this.onRiskUpdate = onRiskUpdate || (() => {});
    this.videoElement = videoElement || null;
    this.stream = null;
    this.active = false;
    this.events = [];
    this.intervalId = null;
  }

  async startCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, frameRate: 15 },
        audio: false
      });
      if (this.videoElement) {
        this.videoElement.srcObject = this.stream;
        this.videoElement.play();
      }
      this.active = true;
      this.startEdgeInferenceLoop();
      return { success: true };
    } catch (err) {
      console.warn('[EdgeCNNMonitor] Camera access not granted or unavailable:', err);
      return { success: false, error: err.message };
    }
  }

  startEdgeInferenceLoop() {
    // Edge inference tick (simulates CNN landmark evaluation every 4 seconds)
    this.intervalId = setInterval(() => {
      if (!this.active) return;

      // Simulated edge detection probabilities
      const rand = Math.random();
      if (rand < 0.12) {
        const ev = {
          type: 'GAZE_DIVERGENCE',
          desc: 'Gaze deviation detected away from primary editor',
          conf: `${Math.round(80 + Math.random() * 18)}%`,
          duration: `${(1 + Math.random() * 2).toFixed(1)}s`,
          severity: 'benign',
          timestamp: Date.now()
        };
        this.recordEvent(ev);
      }
    }, 4000);
  }

  recordEvent(event) {
    this.events.unshift(event);
    this.onEvent(event);
    const newRisk = computeGRURiskScore(this.events);
    this.onRiskUpdate(newRisk);
  }

  stop() {
    this.active = false;
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }
}
