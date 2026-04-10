import { NavLink } from 'react-router-dom';
import { Clock, QrCode, Settings } from 'lucide-react';

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
        <Clock size={22} />
        <span>Alarms</span>
      </NavLink>
      <NavLink to="/qr" className={({ isActive }) => isActive ? 'active' : ''}>
        <QrCode size={22} />
        <span>QR Code</span>
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>
        <Settings size={22} />
        <span>Settings</span>
      </NavLink>
    </nav>
  );
}
