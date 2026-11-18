/**
 * CodeSphere Pro — Device Manager & Fingerprint Utility
 */

import { sha256 } from './crypto-core.js';

export async function getDeviceFingerprint() {
  const userAgent = navigator.userAgent || 'UnknownAgent';
  const language = navigator.language || 'en';
  const screenRes = `${window.screen.width}x${window.screen.height}`;
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;

  const rawFingerprint = `${userAgent}|${language}|${screenRes}|${hardwareConcurrency}`;
  const hash = await sha256(rawFingerprint);
  return `CS-DEV-${hash.slice(0, 12).toUpperCase()}`;
}

export function getDeviceName() {
  const ua = navigator.userAgent;
  let os = 'Unknown Device';
  if (ua.indexOf('Win') !== -1) os = 'Windows PC';
  else if (ua.indexOf('Mac') !== -1) os = 'macOS Workstation';
  else if (ua.indexOf('Linux') !== -1) os = 'Linux Machine';
  else if (ua.indexOf('Android') !== -1) os = 'Android Mobile';
  else if (ua.indexOf('like Mac') !== -1) os = 'iOS Device';

  let browser = 'Browser';
  if (ua.indexOf('Chrome') !== -1) browser = 'Chrome';
  else if (ua.indexOf('Firefox') !== -1) browser = 'Firefox';
  else if (ua.indexOf('Safari') !== -1) browser = 'Safari';
  else if (ua.indexOf('Edge') !== -1) browser = 'Edge';

  return `${os} (${browser})`;
}
