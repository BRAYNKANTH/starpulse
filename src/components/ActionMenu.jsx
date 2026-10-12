import { useEffect, useId, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

// A "⋯" button that opens a short list of actions. Arrow keys move between items; Escape closes and returns focus.
export default function ActionMenu({ label, actions }) {
  const [open, setOpen] = useState(false);
  const button = useRef(null), list = useRef(null);
  const id = useId();
  const items = actions.filter(Boolean);

  useEffect(() => {
    if (!open) return;
    list.current?.querySelector('[role="menuitem"]:not(:disabled)')?.focus();
    const close = event => { if (!list.current?.contains(event.target) && !button.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  const onKeyDown = event => {
    const enabled = [...list.current.querySelectorAll('[role="menuitem"]:not(:disabled)')];
    const index = enabled.indexOf(document.activeElement);
    if (event.key === 'Escape' || event.key === 'Tab') { setOpen(false); if (event.key === 'Escape') button.current.focus(); }
    else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      enabled[(index + (event.key === 'ArrowDown' ? 1 : -1) + enabled.length) % enabled.length]?.focus();
    } else if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); enabled[event.key === 'Home' ? 0 : enabled.length - 1]?.focus(); }
  };
  const run = action => { setOpen(false); button.current.focus(); action.onSelect(); };

  return <div className="action-menu">
    <button ref={button} type="button" className="btn btn-ghost btn-icon btn-sm" aria-label={label} title={label} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen(!open)}>
      <MoreHorizontal size={18} aria-hidden="true" />
    </button>
    {open && <div ref={list} id={id} role="menu" aria-label={label} className="action-menu-list" onKeyDown={onKeyDown}>
      {items.map(action => <button key={action.label} type="button" role="menuitem" tabIndex={-1} className={action.danger ? 'danger' : ''} disabled={action.disabled} onClick={() => run(action)}>
        {action.icon && <action.icon size={15} aria-hidden="true" />}{action.label}
      </button>)}
    </div>}
  </div>;
}
