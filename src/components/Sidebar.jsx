import { LogOut, Moon, QrCode, Sun, X } from 'lucide-react';
import { PAGES } from '../data/pages';

export default function Sidebar({ active, onNavigate, unread, theme, onToggleTheme, onSignOut, user, open, onClose }) {
  const pages = PAGES.filter(page => !page.adminOnly || user.role === 'admin');
  const groups = [...new Set(pages.map(page => page.group || ''))];
  return <>
    <div className={`sp-scrim ${open ? 'open' : ''}`} onClick={onClose} aria-hidden="true" />
    <aside className={`sp-sidebar no-print ${open ? 'open' : ''}`} aria-label="Studio navigation">
      <div className="sp-sidebar-head">
        <button type="button" className="sp-brand" onClick={() => onNavigate('dashboard')}><span className="sp-brand-mark"><QrCode size={16} /></span>DQ.lk</button>
        <button type="button" className="btn btn-ghost btn-icon sp-close" aria-label="Close navigation" onClick={onClose}><X size={18} /></button>
      </div>
      <nav className="sp-nav">
        {groups.map(group => <div key={group || 'main'} className="sp-nav-group">
          {group && <p className="sp-nav-label">{group}</p>}
          {pages.filter(page => (page.group || '') === group).map(({ id, label, icon: Icon }) => <a key={id} href={`#/${id}`} className={`sp-nav-item ${active === id ? 'active' : ''}`} aria-current={active === id ? 'page' : undefined} onClick={event => { event.preventDefault(); onNavigate(id); }}>
            <Icon size={18} /><span>{label}</span>{id === 'inbox' && unread > 0 && <span className="sp-count" aria-label={`${unread} unread`}>{unread > 99 ? '99+' : unread}</span>}
          </a>)}
        </div>)}
      </nav>
      <div className="sp-sidebar-foot">
        <div className="sp-account"><span className="sp-account-avatar" aria-hidden="true">{user.name.slice(0, 1).toUpperCase()}</span><span className="sp-account-text"><strong>{user.name}</strong><span>{user.email}</span></span></div>
        <button type="button" className="sp-nav-item" onClick={onToggleTheme}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}<span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span></button>
        <button type="button" className="sp-nav-item" onClick={onSignOut}><LogOut size={18} /><span>Sign out</span></button>
      </div>
    </aside>
  </>;
}
