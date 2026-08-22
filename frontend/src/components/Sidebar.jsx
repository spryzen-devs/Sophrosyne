import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Cpu,
  Bell,
  Activity,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getInitials } from '../utils/formatters';
import { formatEnum } from '../utils/formatters';
import './Sidebar.css';

const iconMap = {
  LayoutDashboard,
  Users,
  Cpu,
  Bell,
  Activity,
};

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/patients', label: 'Patients', icon: 'Users' },
  { path: '/devices', label: 'Devices', icon: 'Cpu' },
  { path: '/alerts', label: 'Alerts', icon: 'Bell' },
  { path: '/live-monitor', label: 'Live Monitor', icon: 'Activity' },
];

/**
 * Sidebar navigation component
 * @param {Object} props
 * @param {boolean} props.open - mobile sidebar open state
 * @param {Function} props.onClose - close mobile sidebar
 */
export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();

  return (
    <>
      <div
        className={`sidebar-overlay ${open ? 'sidebar-overlay--visible' : ''}`}
        onClick={onClose}
      />
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <span className="sidebar__brand-icon">
            <Activity size={24} strokeWidth={2.5} />
          </span>
          <span className="sidebar__brand-name">SENTINEL</span>
        </div>

        <nav className="sidebar__nav">
          {navItems
            .filter((item) => {
              if (item.path === '/devices' && user?.role === 'DOCTOR') {
                return false;
              }
              return true;
            })
            .map((item) => {
              const Icon = iconMap[item.icon];
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`
                  }
                  onClick={onClose}
                >
                  <span className="sidebar__nav-icon">
                    <Icon size={20} />
                  </span>
                  <span className="sidebar__nav-label">{item.label}</span>
                </NavLink>
              );
            })}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar">
              {getInitials(user?.fullName)}
            </div>
            <div className="sidebar__user-info">
              <div className="sidebar__user-name">{user?.fullName}</div>
              <div className="sidebar__user-role">{formatEnum(user?.role)}</div>
            </div>
          </div>
          <button className="sidebar__logout" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
