import type { Alarm } from './storage';

let alarmTimeout: ReturnType<typeof setTimeout> | null = null;
let alarmCheckInterval: ReturnType<typeof setInterval> | null = null;

export type AlarmCallback = (alarm: Alarm) => void;

let onAlarmTrigger: AlarmCallback | null = null;

export function setAlarmCallback(cb: AlarmCallback) {
  onAlarmTrigger = cb;
}

function getNextAlarmTime(alarm: Alarm): Date | null {
  if (!alarm.enabled) return null;

  const now = new Date();
  const [hours, minutes] = alarm.time.split(':').map(Number);
  const today = now.getDay();

  // Check today and next 7 days
  for (let i = 0; i < 8; i++) {
    const targetDay = (today + i) % 7;

    // If days array is empty, alarm rings every day
    if (alarm.days.length > 0 && !alarm.days.includes(targetDay)) continue;

    const target = new Date(now);
    target.setDate(target.getDate() + i);
    target.setHours(hours, minutes, 0, 0);

    if (target > now) return target;
  }
  return null;
}

export function scheduleAlarms(alarms: Alarm[]) {
  // Clear existing
  if (alarmTimeout) clearTimeout(alarmTimeout);
  if (alarmCheckInterval) clearInterval(alarmCheckInterval);

  // Find the next alarm
  let nextAlarm: { alarm: Alarm; time: Date } | null = null;

  for (const alarm of alarms) {
    const time = getNextAlarmTime(alarm);
    if (time && (!nextAlarm || time < nextAlarm.time)) {
      nextAlarm = { alarm, time };
    }
  }

  if (!nextAlarm) return;

  const msUntilAlarm = nextAlarm.time.getTime() - Date.now();

  // If alarm is within 24 hours, schedule it directly
  if (msUntilAlarm <= 86400000) {
    alarmTimeout = setTimeout(() => {
      if (onAlarmTrigger) onAlarmTrigger(nextAlarm!.alarm);
    }, msUntilAlarm);
  }

  // Check every minute for alarms (backup mechanism)
  alarmCheckInterval = setInterval(() => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    for (const alarm of alarms) {
      if (!alarm.enabled) continue;
      if (alarm.time !== currentTime) continue;

      const today = now.getDay();
      if (alarm.days.length > 0 && !alarm.days.includes(today)) continue;

      // Only trigger at the start of the minute
      if (now.getSeconds() < 5) {
        if (onAlarmTrigger) onAlarmTrigger(alarm);
        break;
      }
    }
  }, 1000);
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

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

// Send notification
export function sendNotification(title: string, body: string) {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'fajr-alarm',
      requireInteraction: true,
    });
  }
}

// Wake Lock API - keep screen on during alarm
export async function requestWakeLock(): Promise<WakeLockSentinel | null> {
  try {
    if ('wakeLock' in navigator) {
      return await navigator.wakeLock.request('screen');
    }
  } catch {}
  return null;
}
