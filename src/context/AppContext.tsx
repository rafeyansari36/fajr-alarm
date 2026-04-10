import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { type AppState, type Alarm, loadState, saveState, generateSecret } from '../utils/storage';
import { scheduleAlarms, setAlarmCallback } from '../utils/alarm';

interface AppContextType {
  state: AppState;
  addAlarm: (alarm: Omit<Alarm, 'id'>) => void;
  updateAlarm: (id: string, updates: Partial<Alarm>) => void;
  deleteAlarm: (id: string) => void;
  toggleAlarm: (id: string) => void;
  setOnboardingComplete: () => void;
  setLocation: (lat: number, lng: number) => void;
  regenerateQR: () => void;
  activeAlarm: Alarm | null;
  setActiveAlarm: (alarm: Alarm | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const s = loadState();
    if (!s.qrSecret) s.qrSecret = generateSecret();
    return s;
  });
  const [activeAlarm, setActiveAlarm] = useState<Alarm | null>(null);

  useEffect(() => {
    saveState(state);
    scheduleAlarms(state.alarms);
  }, [state]);

  useEffect(() => {
    setAlarmCallback((alarm) => {
      setActiveAlarm(alarm);
    });
  }, []);

  const addAlarm = useCallback((alarm: Omit<Alarm, 'id'>) => {
    const id = crypto.randomUUID();
    setState(s => ({ ...s, alarms: [...s.alarms, { ...alarm, id }] }));
  }, []);

  const updateAlarm = useCallback((id: string, updates: Partial<Alarm>) => {
    setState(s => ({
      ...s,
      alarms: s.alarms.map(a => (a.id === id ? { ...a, ...updates } : a)),
    }));
  }, []);

  const deleteAlarm = useCallback((id: string) => {
    setState(s => ({ ...s, alarms: s.alarms.filter(a => a.id !== id) }));
  }, []);

  const toggleAlarm = useCallback((id: string) => {
    setState(s => ({
      ...s,
      alarms: s.alarms.map(a => (a.id === id ? { ...a, enabled: !a.enabled } : a)),
    }));
  }, []);

  const setOnboardingComplete = useCallback(() => {
    setState(s => ({ ...s, onboardingComplete: true }));
  }, []);

  const setLocation = useCallback((lat: number, lng: number) => {
    setState(s => ({ ...s, location: { lat, lng } }));
  }, []);

  const regenerateQR = useCallback(() => {
    setState(s => ({ ...s, qrSecret: generateSecret() }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        addAlarm,
        updateAlarm,
        deleteAlarm,
        toggleAlarm,
        setOnboardingComplete,
        setLocation,
        regenerateQR,
        activeAlarm,
        setActiveAlarm,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
