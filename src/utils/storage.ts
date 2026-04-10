export interface Alarm {
  id: string;
  time: string; // HH:MM format
  label: string;
  enabled: boolean;
  days: number[]; // 0=Sun, 1=Mon, ... 6=Sat
  usePrayerTime: boolean;
  prayerName?: string;
}

export interface AppState {
  alarms: Alarm[];
  qrSecret: string;
  onboardingComplete: boolean;
  location?: { lat: number; lng: number };
}

const STORAGE_KEY = 'fajr_alarm_state';

const defaultState: AppState = {
  alarms: [],
  qrSecret: '',
  onboardingComplete: false,
};

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultState, ...JSON.parse(raw) };
  } catch {}
  return { ...defaultState };
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function generateSecret(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// Generate a stable device fingerprint from browser properties
function getDeviceFingerprint(): string {
  const parts = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency || 0,
  ];
  return parts.join('|');
}

// HMAC-SHA256 using Web Crypto API
async function hmacSHA256(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
  return Array.from(new Uint8Array(signature), b => b.toString(16).padStart(2, '0')).join('');
}

// Build a signed QR payload that is unique to this device + user secret
export async function buildQRPayload(qrSecret: string): Promise<string> {
  const fingerprint = getDeviceFingerprint();
  const message = `fajr-alarm:${fingerprint}`;
  const signature = await hmacSHA256(qrSecret, message);
  return JSON.stringify({ v: 2, sig: signature, uid: qrSecret.slice(0, 8) });
}

// Verify a scanned QR code against the current device + secret
export async function verifyQRPayload(scannedText: string, qrSecret: string): Promise<boolean> {
  // Support legacy format
  if (scannedText === `fajr-alarm:${qrSecret}`) return true;

  try {
    const payload = JSON.parse(scannedText);
    if (payload.v !== 2 || payload.uid !== qrSecret.slice(0, 8)) return false;

    const fingerprint = getDeviceFingerprint();
    const message = `fajr-alarm:${fingerprint}`;
    const expectedSig = await hmacSHA256(qrSecret, message);
    return payload.sig === expectedSig;
  } catch {
    return false;
  }
}
