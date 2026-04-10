// Simplified prayer time calculation using basic astronomical formulas
// For production, consider using the Aladhan API or adhan-js library

interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

function formatTime(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function calculatePrayerTimes(
  lat: number,
  lng: number,
  date: Date = new Date()
): PrayerTimes {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );

  // Sun declination
  const declination = -23.45 * Math.cos(toRad((360 / 365) * (dayOfYear + 10)));
  const decRad = toRad(declination);
  const latRad = toRad(lat);

  // Equation of time (approximate)
  const B = toRad((360 / 365) * (dayOfYear - 81));
  const EoT = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);

  // Solar noon
  const timezone = -date.getTimezoneOffset() / 60;
  const solarNoon = 12 - lng / 15 + timezone - EoT / 60;

  // Hour angle for given altitude
  function hourAngle(altitude: number): number {
    const cosH =
      (Math.sin(toRad(altitude)) - Math.sin(latRad) * Math.sin(decRad)) /
      (Math.cos(latRad) * Math.cos(decRad));
    if (cosH > 1) return 0;
    if (cosH < -1) return 12;
    return toDeg(Math.acos(cosH)) / 15;
  }

  const sunriseHA = hourAngle(-0.833);
  const fajrHA = hourAngle(-18); // 18 degrees below horizon
  const ishaHA = hourAngle(-17); // 17 degrees below horizon

  // Asr: shadow length = object length + shadow at noon
  const asrAngle = toDeg(
    Math.atan(1 / (1 + Math.tan(Math.abs(latRad - decRad))))
  );
  const asrHA = hourAngle(asrAngle);

  return {
    fajr: formatTime(solarNoon - fajrHA),
    sunrise: formatTime(solarNoon - sunriseHA),
    dhuhr: formatTime(solarNoon + 0.0167), // slight offset after solar noon
    asr: formatTime(solarNoon + asrHA),
    maghrib: formatTime(solarNoon + sunriseHA),
    isha: formatTime(solarNoon + ishaHA),
  };
}

export function getPrayerTimeByName(
  name: string,
  lat: number,
  lng: number
): string {
  const times = calculatePrayerTimes(lat, lng);
  const key = name.toLowerCase() as keyof PrayerTimes;
  return times[key] || '05:00';
}

export const PRAYER_NAMES = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
