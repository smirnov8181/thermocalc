import { ShieldIcon, ShareIcon } from '../data/icons';

export default function Header({ isDark, onToggleTheme, onShare }) {
  return (
    <header className="header">
      <a href="#" className="logo" onClick={e => e.preventDefault()}>
        <div className="logo-icon"><ShieldIcon /></div>
        <span className="logo-text">ThermoCalc</span>
        <span className="logo-badge">MVP</span>
      </a>
      <div className="header-actions">
        <button className="btn btn-ghost btn-icon" data-tooltip="Поделиться" onClick={onShare}>
          <ShareIcon />
        </button>
        <div
          className="theme-toggle"
          onClick={onToggleTheme}
          data-tooltip={isDark ? 'Светлая тема' : 'Тёмная тема'}
        />
      </div>
    </header>
  );
}
