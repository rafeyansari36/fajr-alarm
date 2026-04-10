import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Camera, Volume2, X } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useApp } from '../context/AppContext';
import { RingtonePlayer, requestWakeLock, sendNotification } from '../utils/alarm';
import { verifyQRPayload } from '../utils/storage';

export default function AlarmRing() {
  const { state, activeAlarm, setActiveAlarm } = useApp();
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const playerRef = useRef(new RingtonePlayer());

  // Start alarm sound, vibration, wake lock, and notification
  useEffect(() => {
    if (!activeAlarm) return;

    sendNotification('Fajr Alarm', `${activeAlarm.label || 'Wake up!'} - ${activeAlarm.time}`);
    requestWakeLock().then(lock => { wakeLockRef.current = lock; });

    // Play the selected ringtone with vibration
    playerRef.current.start(
      activeAlarm.ringtone || 'adhan-fajr',
      activeAlarm.vibrate ?? true
    );

    return () => {
      playerRef.current.stop();
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
  }, [activeAlarm]);

  const handleScanSuccess = useCallback(async (decodedText: string) => {
    const valid = await verifyQRPayload(decodedText, state.qrSecret);
    if (valid) {
      setDismissed(true);
      playerRef.current.stop();
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
      setTimeout(() => {
        setActiveAlarm(null);
      }, 3000);
    } else {
      setScanError('Wrong QR code! Scan YOUR code from this device.');
      setTimeout(() => setScanError(''), 3000);
    }
  }, [state.qrSecret, setActiveAlarm]);

  const startScanning = useCallback(async () => {
    setScanning(true);
    setScanError('');

    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleScanSuccess,
        () => {}
      );
    } catch {
      setScanError('Camera access denied. Please allow camera permission.');
      setScanning(false);
    }
  }, [handleScanSuccess]);

  const stopScanning = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  if (!activeAlarm) return null;

  if (dismissed) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'var(--bg-dark)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          style={{
            width: 100, height: 100, borderRadius: '50%',
            background: 'rgba(46, 204, 113, 0.15)',
            border: '3px solid var(--accent-green)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ fontSize: 48 }}
          >
            &#x2713;
          </motion.span>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}
        >
          Alarm Dismissed!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="arabic-text"
          style={{ fontSize: 20, color: 'var(--secondary)' }}
        >
          الصَّلاَةُ خَيْرٌ مِنَ النَّوْمِ
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}
        >
          Prayer is better than sleep
        </motion.p>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'linear-gradient(180deg, #1a0a0a, #0A1628)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24, overflow: 'auto',
    }}>
      {/* Pulsing background rings */}
      {[1, 2, 3].map(i => (
        <motion.div
          key={i}
          animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.05, 0.1] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
          style={{
            position: 'absolute',
            width: 200 + i * 100, height: 200 + i * 100,
            borderRadius: '50%',
            border: '1px solid var(--accent-red)',
          }}
        />
      ))}

      {/* Alarm icon */}
      <motion.div
        animate={{ rotate: [-5, 5, -5] }}
        transition={{ duration: 0.3, repeat: Infinity }}
        style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(224, 77, 94, 0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 24, animation: 'glow-pulse 1.5s infinite',
        }}
      >
        <Volume2 size={36} color="var(--accent-red)" />
      </motion.div>

      {/* Time */}
      <motion.h1
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
        style={{ fontSize: 64, fontWeight: 200, letterSpacing: '-2px', marginBottom: 8 }}
      >
        {activeAlarm.time}
      </motion.h1>

      <p style={{ fontSize: 18, color: 'var(--text-secondary)', marginBottom: 8 }}>
        {activeAlarm.label || 'Alarm'}
      </p>

      {activeAlarm.usePrayerTime && (
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <p className="arabic-text" style={{ fontSize: 22, color: 'var(--secondary)' }}>
            حَيَّ عَلَى الصَّلَاة
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>
            "Come to prayer"
          </p>
        </div>
      )}

      {/* Scan QR instruction */}
      {!scanning ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginTop: 24 }}
        >
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
            Scan your QR code to dismiss the alarm
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={startScanning}
            className="btn btn-primary"
            style={{ padding: '16px 48px', fontSize: 16 }}
          >
            <Camera size={20} />
            Scan QR Code
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ width: '100%', maxWidth: 350 }}
        >
          <div
            id="qr-reader"
            style={{
              width: '100%', borderRadius: 'var(--radius)',
              overflow: 'hidden', marginBottom: 16,
            }}
          />
          <button
            onClick={stopScanning}
            className="btn btn-secondary btn-full"
            style={{ marginTop: 8 }}
          >
            <X size={18} />
            Close Camera
          </button>
        </motion.div>
      )}

      {/* Scan error */}
      {scanError && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            color: 'var(--accent-red)', fontSize: 14, marginTop: 16,
            textAlign: 'center', padding: '8px 16px',
            background: 'rgba(224, 77, 94, 0.1)', borderRadius: 8,
          }}
        >
          {scanError}
        </motion.p>
      )}
    </div>
  );
}
