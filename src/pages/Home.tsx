import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Clock, Trash2, Moon, Sun, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculatePrayerTimes, PRAYER_NAMES } from '../utils/prayer';
import { getNextAlarmInfo } from '../utils/alarm';
import AddAlarmModal from '../components/AddAlarmModal';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function Home() {
  const { state, toggleAlarm, deleteAlarm } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);

  const prayerTimes = useMemo(() => {
    if (state.location) {
      return calculatePrayerTimes(state.location.lat, state.location.lng);
    }
    return null;
  }, [state.location]);

  const nextAlarmIn = getNextAlarmInfo(state.alarms);

  const now = new Date();
  const hours = now.getHours();
  const isNight = hours < 6 || hours >= 18;
  const greeting = hours < 12 ? 'Good Morning' : hours < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="page-container" style={{ paddingTop: 20 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 24 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          {isNight ? <Moon size={18} color="var(--secondary)" /> : <Sun size={18} color="var(--secondary)" />}
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{greeting}</span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>
          Fajr Alarm
        </h1>
        <p className="arabic-text" style={{ fontSize: 18, color: 'var(--secondary)', marginTop: 4 }}>
          قُمْ فَصَلِّ
        </p>
      </motion.div>

      {/* Next Alarm Card */}
      {nextAlarmIn && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card"
          style={{
            marginBottom: 20,
            background: 'linear-gradient(135deg, var(--primary-dark), var(--bg-card))',
            border: '1px solid rgba(27, 107, 74, 0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                Next Alarm In
              </p>
              <p style={{ fontSize: 32, fontWeight: 700, color: 'var(--primary-light)', marginTop: 4 }}>
                {nextAlarmIn}
              </p>
            </div>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(42, 157, 111, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Clock size={24} color="var(--primary-light)" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Prayer Times Quick View */}
      {prayerTimes && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
          style={{ marginBottom: 20, padding: 16 }}
        >
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            Today's Prayer Times
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {PRAYER_NAMES.map(name => {
              const key = name.toLowerCase() as keyof typeof prayerTimes;
              return (
                <div key={name} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{name}</p>
                  <p style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>
                    {prayerTimes[key]}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Alarms List */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Alarms</h2>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowAddModal(true)}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Plus size={20} color="white" />
        </motion.button>
      </div>

      {state.alarms.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            textAlign: 'center',
            padding: '48px 20px',
            color: 'var(--text-muted)',
          }}
        >
          <Clock size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
          <p style={{ fontSize: 16 }}>No alarms set</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Tap + to add your first alarm</p>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AnimatePresence>
            {state.alarms.map((alarm, i) => (
              <motion.div
                key={alarm.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.05 }}
                className="card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  opacity: alarm.enabled ? 1 : 0.5,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 36, fontWeight: 300, letterSpacing: '-1px' }}>
                      {alarm.time}
                    </span>
                    {alarm.usePrayerTime && (
                      <span style={{
                        fontSize: 11,
                        background: 'rgba(42, 157, 111, 0.15)',
                        color: 'var(--primary-light)',
                        padding: '2px 8px',
                        borderRadius: 4,
                      }}>
                        {alarm.prayerName}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                    {alarm.label}
                  </p>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    {DAY_LABELS.map((label, dayIndex) => (
                      <span
                        key={dayIndex}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          fontWeight: 600,
                          background: alarm.days.includes(dayIndex) ? 'var(--primary)' : 'transparent',
                          color: alarm.days.includes(dayIndex) ? 'white' : 'var(--text-muted)',
                          border: alarm.days.includes(dayIndex) ? 'none' : '1px solid var(--border)',
                        }}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    onClick={() => deleteAlarm(alarm.id)}
                    style={{ background: 'none', padding: 8 }}
                  >
                    <Trash2 size={18} color="var(--text-muted)" />
                  </button>

                  <div
                    className={`toggle-switch ${alarm.enabled ? 'active' : ''}`}
                    onClick={() => toggleAlarm(alarm.id)}
                    style={{
                      position: 'relative',
                      width: 52,
                      height: 28,
                      background: alarm.enabled ? 'var(--primary)' : 'var(--bg-card)',
                      borderRadius: 14,
                      cursor: 'pointer',
                      transition: 'background 0.3s ease',
                      border: `1px solid ${alarm.enabled ? 'var(--primary-light)' : 'var(--border)'}`,
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: 2,
                      left: alarm.enabled ? 26 : 2,
                      width: 22,
                      height: 22,
                      background: 'white',
                      borderRadius: '50%',
                      transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }} />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Location prompt */}
      {!state.location && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
          style={{ marginTop: 20, cursor: 'pointer' }}
          onClick={() => {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const { latitude, longitude } = pos.coords;
                // Use setLocation from context
                const event = new CustomEvent('set-location', { detail: { lat: latitude, lng: longitude } });
                window.dispatchEvent(event);
              },
              () => alert('Please enable location access for accurate prayer times.')
            );
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600 }}>Enable Prayer Times</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Allow location access for accurate Fajr times
              </p>
            </div>
            <ChevronRight size={20} color="var(--text-muted)" />
          </div>
        </motion.div>
      )}

      <AddAlarmModal open={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
