import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Volume2, Vibrate } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PRAYER_NAMES, getPrayerTimeByName } from '../utils/prayer';
import { RINGTONES, type RingtoneId, type Alarm } from '../utils/storage';
import { RingtonePlayer } from '../utils/alarm';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Props {
  open: boolean;
  onClose: () => void;
  editAlarm?: Alarm | null;
}

export default function AddAlarmModal({ open, onClose, editAlarm }: Props) {
  const { state, addAlarm, updateAlarm } = useApp();
  const playerRef = useRef(new RingtonePlayer());

  const [time, setTime] = useState('05:00');
  const [label, setLabel] = useState('Fajr Prayer');
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [usePrayerTime, setUsePrayerTime] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState('Fajr');
  const [ringtone, setRingtone] = useState<RingtoneId>('adhan-fajr');
  const [vibrate, setVibrate] = useState(true);

  const isEdit = !!editAlarm;

  // Populate fields when editing
  useEffect(() => {
    if (editAlarm) {
      setTime(editAlarm.time);
      setLabel(editAlarm.label);
      setDays(editAlarm.days);
      setUsePrayerTime(editAlarm.usePrayerTime);
      setSelectedPrayer(editAlarm.prayerName || 'Fajr');
      setRingtone(editAlarm.ringtone || 'adhan-fajr');
      setVibrate(editAlarm.vibrate ?? true);
    } else {
      setTime('05:00');
      setLabel('Fajr Prayer');
      setDays([0, 1, 2, 3, 4, 5, 6]);
      setUsePrayerTime(false);
      setSelectedPrayer('Fajr');
      setRingtone('adhan-fajr');
      setVibrate(true);
    }
  }, [editAlarm, open]);

  // Stop preview on close
  useEffect(() => {
    if (!open) playerRef.current.stop();
  }, [open]);

  const toggleDay = (day: number) => {
    setDays(d => d.includes(day) ? d.filter(x => x !== day) : [...d, day]);
  };

  const handleSave = () => {
    let alarmTime = time;
    if (usePrayerTime && state.location) {
      alarmTime = getPrayerTimeByName(selectedPrayer, state.location.lat, state.location.lng);
    }

    const alarmData = {
      time: alarmTime,
      label,
      enabled: editAlarm?.enabled ?? true,
      days,
      usePrayerTime,
      prayerName: usePrayerTime ? selectedPrayer : undefined,
      ringtone,
      vibrate,
    };

    if (isEdit && editAlarm) {
      updateAlarm(editAlarm.id, alarmData);
    } else {
      addAlarm(alarmData);
    }

    playerRef.current.stop();
    onClose();
  };

  const handlePreview = (id: RingtoneId) => {
    setRingtone(id);
    playerRef.current.preview(id);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { playerRef.current.stop(); onClose(); }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 200,
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'var(--bg-card)',
              borderTopLeftRadius: 'var(--radius-lg)',
              borderTopRightRadius: 'var(--radius-lg)',
              padding: '24px 20px calc(40px + env(safe-area-inset-bottom))',
              zIndex: 201,
              maxHeight: '85vh',
              overflowY: 'auto',
              paddingBottom: 100,
            }}
          >
            {/* Handle bar */}
            <div style={{
              width: 40, height: 4, borderRadius: 2,
              background: 'var(--text-muted)', margin: '0 auto 20px', opacity: 0.3,
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>{isEdit ? 'Edit Alarm' : 'New Alarm'}</h2>
              <button onClick={() => { playerRef.current.stop(); onClose(); }} style={{ background: 'none', padding: 4 }}>
                <X size={24} color="var(--text-muted)" />
              </button>
            </div>

            {/* Prayer Time Toggle */}
            {state.location && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <label style={{ fontSize: 14, fontWeight: 500 }}>Use Prayer Time</label>
                  <div
                    onClick={() => setUsePrayerTime(!usePrayerTime)}
                    style={{
                      position: 'relative', width: 52, height: 28,
                      background: usePrayerTime ? 'var(--primary)' : 'var(--bg-dark)',
                      borderRadius: 14, cursor: 'pointer', transition: 'background 0.3s ease',
                      border: `1px solid ${usePrayerTime ? 'var(--primary-light)' : 'var(--border)'}`,
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 2, left: usePrayerTime ? 26 : 2,
                      width: 22, height: 22, background: 'white', borderRadius: '50%',
                      transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }} />
                  </div>
                </div>

                {usePrayerTime && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
                  >
                    {PRAYER_NAMES.map(name => (
                      <button
                        key={name}
                        onClick={() => { setSelectedPrayer(name); setLabel(`${name} Prayer`); }}
                        style={{
                          padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                          background: selectedPrayer === name ? 'var(--primary)' : 'var(--bg-dark)',
                          color: selectedPrayer === name ? 'white' : 'var(--text-secondary)',
                          border: `1px solid ${selectedPrayer === name ? 'var(--primary-light)' : 'var(--border)'}`,
                          transition: 'all 0.2s',
                        }}
                      >
                        {name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            )}

            {/* Time Picker */}
            {!usePrayerTime && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 8 }}>Time</label>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'var(--bg-dark)', borderRadius: 12, padding: '12px 16px',
                  border: '1px solid var(--border)',
                }}>
                  <Clock size={18} color="var(--text-muted)" />
                  <input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    style={{
                      background: 'none', border: 'none', color: 'var(--text-primary)',
                      fontSize: 24, fontWeight: 300, width: '100%', letterSpacing: '-1px',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Label */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 8 }}>Label</label>
              <input
                type="text"
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="Alarm label"
                style={{
                  width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '12px 16px', color: 'var(--text-primary)', fontSize: 15,
                }}
              />
            </div>

            {/* Days */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 8 }}>Repeat</label>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                {DAY_LABELS.map((dayLabel, i) => (
                  <button
                    key={i}
                    onClick={() => toggleDay(i)}
                    style={{
                      width: 40, height: 40, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 600,
                      background: days.includes(i) ? 'var(--primary)' : 'var(--bg-dark)',
                      color: days.includes(i) ? 'white' : 'var(--text-muted)',
                      border: `1px solid ${days.includes(i) ? 'var(--primary-light)' : 'var(--border)'}`,
                      transition: 'all 0.2s',
                    }}
                  >
                    {dayLabel}
                  </button>
                ))}
              </div>
            </div>

            {/* Ringtone Selector */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Volume2 size={16} /> Ringtone
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {RINGTONES.map(r => (
                  <button
                    key={r.id}
                    onClick={() => handlePreview(r.id)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 14px', borderRadius: 10, fontSize: 14,
                      background: ringtone === r.id ? 'rgba(42, 157, 111, 0.15)' : 'var(--bg-dark)',
                      color: ringtone === r.id ? 'var(--primary-light)' : 'var(--text-secondary)',
                      border: `1px solid ${ringtone === r.id ? 'var(--primary-light)' : 'var(--border)'}`,
                      transition: 'all 0.2s', textAlign: 'left',
                    }}
                  >
                    <span style={{ fontWeight: ringtone === r.id ? 600 : 400 }}>{r.name}</span>
                    {ringtone === r.id && (
                      <span style={{ fontSize: 11, opacity: 0.7 }}>tap to preview</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Vibration Toggle */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Vibrate size={16} /> Vibration
                </label>
                <div
                  onClick={() => setVibrate(!vibrate)}
                  style={{
                    position: 'relative', width: 52, height: 28,
                    background: vibrate ? 'var(--primary)' : 'var(--bg-dark)',
                    borderRadius: 14, cursor: 'pointer', transition: 'background 0.3s ease',
                    border: `1px solid ${vibrate ? 'var(--primary-light)' : 'var(--border)'}`,
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 2, left: vibrate ? 26 : 2,
                    width: 22, height: 22, background: 'white', borderRadius: '50%',
                    transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }} />
                </div>
              </div>
            </div>

            {/* Save button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              className="btn btn-primary btn-full"
              style={{ padding: 16, fontSize: 16 }}
            >
              {isEdit ? 'Update Alarm' : 'Save Alarm'}
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
