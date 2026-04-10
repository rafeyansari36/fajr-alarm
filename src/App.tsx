import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import QRCode from './pages/QRCode';
import Settings from './pages/Settings';
import AlarmRing from './pages/AlarmRing';
import BottomNav from './components/BottomNav';
import { useEffect } from 'react';
import './index.css';

function LocationListener() {
  const { setLocation } = useApp();

  useEffect(() => {
    const handler = (e: CustomEvent<{ lat: number; lng: number }>) => {
      setLocation(e.detail.lat, e.detail.lng);
    };
    window.addEventListener('set-location', handler as EventListener);
    return () => window.removeEventListener('set-location', handler as EventListener);
  }, [setLocation]);

  return null;
}

function AppContent() {
  const { state, activeAlarm } = useApp();

  if (activeAlarm) return <AlarmRing />;
  if (!state.onboardingComplete) return <Onboarding />;

  return (
    <>
      <div className="geo-pattern" />
      <div className="ambient-glow top" />
      <div className="ambient-glow bottom" />
      <LocationListener />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/qr" element={<QRCode />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      <BottomNav />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </BrowserRouter>
  );
}
