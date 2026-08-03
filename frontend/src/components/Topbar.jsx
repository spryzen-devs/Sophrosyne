import { Bell, Menu } from 'lucide-react';
import './Topbar.css';

/**
 * Top navigation bar
 * @param {Object} props
 * @param {string} props.title - current page title
 * @param {boolean} props.hasAlerts - show red dot on bell
 * @param {Function} props.onMenuClick - hamburger menu click handler
 */
export default function Topbar({ title, hasAlerts = false, onMenuClick }) {
  return (
    <header className="topbar">
      <div className="topbar__left">
        <button className="topbar__hamburger" onClick={onMenuClick} aria-label="Toggle menu">
          <Menu size={22} />
        </button>
        <h1 className="topbar__title">{title}</h1>
      </div>
      <div className="topbar__right">
        <button className="topbar__bell" aria-label="Notifications">
          <Bell size={20} />
          {hasAlerts && <span className="topbar__bell-dot" />}
        </button>
      </div>
    </header>
  );
}
