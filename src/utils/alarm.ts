import { type Alarm, RINGTONES, type RingtoneId } from './storage';

let alarmTimeout: ReturnType<typeof setTimeout> | null = null;
let alarmCheckInterval: ReturnType<typeof setInterval> | null = null;
let keepAliveInterval: ReturnType<typeof setInterval> | null = null;

export type AlarmCallback = (alarm: Alarm) => void;

let onAlarmTrigger: AlarmCallback | null = null;
let alreadyTriggeredKey = '';

export function setAlarmCallback(cb: AlarmCallback) {
  onAlarmTrigger = cb;
}

function getNextAlarmTime(alarm: Alarm): Date | null {
  if (!alarm.enabled) return null;

  const now = new Date();
  const [hours, minutes] = alarm.time.split(':').map(Number);
  const today = now.getDay();

  for (let i = 0; i < 8; i++) {
    const targetDay = (today + i) % 7;
    if (alarm.days.length > 0 && !alarm.days.includes(targetDay)) continue;

    const target = new Date(now);
    target.setDate(target.getDate() + i);
    target.setHours(hours, minutes, 0, 0);

    if (target > now) return target;
  }
  return null;
}

export function scheduleAlarms(alarms: Alarm[]) {
  if (alarmTimeout) clearTimeout(alarmTimeout);
  if (alarmCheckInterval) clearInterval(alarmCheckInterval);

  let nextAlarm: { alarm: Alarm; time: Date } | null = null;

  for (const alarm of alarms) {
    const time = getNextAlarmTime(alarm);
    if (time && (!nextAlarm || time < nextAlarm.time)) {
      nextAlarm = { alarm, time };
    }
  }

  if (!nextAlarm) return;

  const msUntilAlarm = nextAlarm.time.getTime() - Date.now();

  if (msUntilAlarm <= 86400000) {
    alarmTimeout = setTimeout(() => {
      if (onAlarmTrigger) onAlarmTrigger(nextAlarm!.alarm);
    }, msUntilAlarm);
  }

  // Check every second as backup
  alarmCheckInterval = setInterval(() => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const triggerKey = `${currentTime}-${now.getDate()}`;

    // Don't re-trigger the same alarm in the same minute
    if (triggerKey === alreadyTriggeredKey) return;

    for (const alarm of alarms) {
      if (!alarm.enabled) continue;
      if (alarm.time !== currentTime) continue;

      const today = now.getDay();
      if (alarm.days.length > 0 && !alarm.days.includes(today)) continue;

      if (now.getSeconds() < 10) {
        alreadyTriggeredKey = triggerKey;
        if (onAlarmTrigger) onAlarmTrigger(alarm);
        // Also trigger via service worker for reliability
        triggerSWNotification(alarm);
        break;
      }
    }
  }, 1000);

  // Start background keep-alive
  startKeepAlive();
}

// --- Background keep-alive ---
// Plays a silent audio tone every 25s to prevent the browser from suspending the tab
function startKeepAlive() {
  if (keepAliveInterval) return;

  keepAliveInterval = setInterval(() => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.001; // inaudible
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
      setTimeout(() => ctx.close(), 100);
    } catch {}
  }, 25000);
}

// --- Service worker notification trigger ---
function triggerSWNotification(alarm: Alarm) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'ALARM_TRIGGER',
      message: `${alarm.label || 'Alarm'} - ${alarm.time}`,
    });
  }
}

// --- Ringtone player ---
export class RingtonePlayer {
  private audioCtx: AudioContext | null = null;
  private interval: ReturnType<typeof setInterval> | null = null;
  private vibrationInterval: ReturnType<typeof setInterval> | null = null;

  start(ringtoneId: RingtoneId, vibrate: boolean) {
    this.stop();

    const ringtone = RINGTONES.find(r => r.id === ringtoneId) || RINGTONES[0];
    this.audioCtx = new AudioContext();

    const playPattern = () => {
      if (!this.audioCtx) return;
      const now = this.audioCtx.currentTime;

      ringtone.pattern.forEach((freq, i) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);

        osc.frequency.value = freq;
        // Use triangle wave for adhan-like tones, square for urgent
        osc.type = ringtoneId === 'urgent-bell' || ringtoneId === 'digital-beep'
          ? 'square'
          : ringtoneId === 'adhan-fajr'
            ? 'triangle'
            : 'sine';

        const startTime = now + i * ringtone.tempo;
        const duration = ringtone.tempo * 0.9;

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.35, startTime + 0.02);
        gain.gain.setValueAtTime(0.35, startTime + duration * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    };

    playPattern();
    const patternDuration = ringtone.pattern.length * ringtone.tempo * 1000;
    this.interval = setInterval(playPattern, patternDuration + 800);

    // Vibration
    if (vibrate && 'vibrate' in navigator) {
      const vibratePattern = () => navigator.vibrate([300, 100, 300, 100, 500]);
      vibratePattern();
      this.vibrationInterval = setInterval(vibratePattern, 2000);
    }
  }

  preview(ringtoneId: RingtoneId) {
    this.stop();
    const ringtone = RINGTONES.find(r => r.id === ringtoneId) || RINGTONES[0];
    this.audioCtx = new AudioContext();
    const now = this.audioCtx.currentTime;

    ringtone.pattern.forEach((freq, i) => {
      const osc = this.audioCtx!.createOscillator();
      const gain = this.audioCtx!.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx!.destination);
      osc.frequency.value = freq;
      osc.type = ringtoneId === 'urgent-bell' || ringtoneId === 'digital-beep' ? 'square'
        : ringtoneId === 'adhan-fajr' ? 'triangle' : 'sine';

      const startTime = now + i * ringtone.tempo;
      const duration = ringtone.tempo * 0.9;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    });

    // Auto-close after preview
    const totalDuration = ringtone.pattern.length * ringtone.tempo * 1000 + 200;
    setTimeout(() => {
      if (this.audioCtx) { this.audioCtx.close(); this.audioCtx = null; }
    }, totalDuration);
  }

  stop() {
    if (this.interval) { clearInterval(this.interval); this.interval = null; }
    if (this.vibrationInterval) { clearInterval(this.vibrationInterval); this.vibrationInterval = null; }
    if (this.audioCtx) { this.audioCtx.close(); this.audioCtx = null; }
    if ('vibrate' in navigator) navigator.vibrate(0);
  }
}

export function getNextAlarmInfo(alarms: Alarm[]): string | null {
  let nearest: Date | null = null;

  for (const alarm of alarms) {
    const time = getNextAlarmTime(alarm);
    if (time && (!nearest || time < nearest)) {
      nearest = time;
    }
  }

  if (!nearest) return null;

  const diff = nearest.getTime() - Date.now();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function sendNotification(title: string, body: string) {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.svg',
      tag: 'fajr-alarm',
      requireInteraction: true,
    });
  }
  // Also send via SW for more reliable delivery
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'ALARM_TRIGGER',
      message: body,
    });
  }
}

export async function requestWakeLock(): Promise<WakeLockSentinel | null> {
  try {
    if ('wakeLock' in navigator) {
      return await navigator.wakeLock.request('screen');
    }
  } catch {}
  return null;
}
