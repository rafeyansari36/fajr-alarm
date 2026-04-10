import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Bell, Info, Smartphone, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { requestNotificationPermission } from '../utils/alarm';

export default function Settings() {
  const { state, setLocation } = useApp();
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);

  useEffect(() => {
    setNotifEnabled(Notification.permission === 'granted');

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation(pos.coords.latitude, pos.coords.longitude),
      () => alert('Location access denied. Please enable it in your browser settings.')
    );
  };

  const handleNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotifEnabled(granted);
  };

  const handleInstall = async () => {
    if (installPrompt && 'prompt' in installPrompt) {
      (installPrompt as { prompt: () => void }).prompt();
    }
  };

  return (
    <div className="page-container" style={{ paddingTop: 20 }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.5px' }}>
          Settings
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
          Configure your alarm preferences
        </p>
      </motion.div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Location */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card"
          style={{ cursor: 'pointer' }}
          onClick={handleLocation}
        >
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(42, 157, 111, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <MapPin size={20} color="var(--primary-light)" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 600 }}>Location</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {state.location
                  ? `${state.location.lat.toFixed(4)}, ${state.location.lng.toFixed(4)}`
                  : 'Tap to enable for prayer times'}
              </p>
            </div>
            {state.location && (
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--accent-green)',
              }} />
            )}
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
          style={{ cursor: 'pointer' }}
          onClick={handleNotifications}
        >
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(196, 149, 58, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Bell size={20} color="var(--secondary)" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 600 }}>Notifications</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {notifEnabled ? 'Enabled' : 'Tap to enable alarm notifications'}
              </p>
            </div>
            {notifEnabled && (
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--accent-green)',
              }} />
            )}
          </div>
        </motion.div>

        {/* Install PWA */}
        {installPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card"
            style={{ cursor: 'pointer' }}
            onClick={handleInstall}
          >
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(42, 157, 111, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Smartphone size={20} color="var(--primary-light)" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 600 }}>Install App</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Add to home screen for best experience
                </p>
              </div>
              <ExternalLink size={16} color="var(--text-muted)" />
            </div>
          </motion.div>
        )}
      </div>

      {/* About section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{ marginTop: 32 }}
      >
        <div className="card" style={{
          background: 'rgba(196, 149, 58, 0.06)',
          border: '1px solid rgba(196, 149, 58, 0.15)',
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Info size={18} color="var(--secondary)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>How the Alarm Works</p>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <p style={{ marginBottom: 8 }}>
                  This app uses browser notifications and audio to wake you up. For the most reliable experience:
                </p>
                <ul style={{ paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <li>Install the app to your home screen</li>
                  <li>Keep the app open in the background</li>
                  <li>Enable notifications when prompted</li>
                  <li>Set your phone volume to maximum</li>
                  <li>Disable battery optimization for this app</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Technical limitations note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="card"
        style={{ marginTop: 12 }}
      >
        <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text-secondary)' }}>Note:</strong> PWA alarms rely on browser capabilities.
          On iOS, keep the app in foreground. On Android, the app works better when installed and battery
          optimization is disabled. For guaranteed reliability, consider using this alongside your phone's native alarm.
        </p>
      </motion.div>

      <div style={{
        textAlign: 'center',
        marginTop: 40,
        color: 'var(--text-muted)',
        fontSize: 12,
      }}>
        <p>Fajr Alarm v1.0</p>
        <p className="arabic-text" style={{ fontSize: 16, marginTop: 8, color: 'var(--secondary)' }}>
          اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ
        </p>
      </div>
    </div>
  );
}
