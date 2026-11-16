import { useEffect, useId, useRef, useState } from 'react';
import Icon from './Icon.jsx';

export default function ActionMenu({ label, disabled, actions }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null), trigger = useRef(null), panel = useRef(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector('button:not(:disabled)')?.focus();
    function outside(event) { if (!ref.current?.contains(event.target)) setOpen(false); }
    function escape(event) {
      if (event.key !== 'Escape') return;
      event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus();
    }
    document.addEventListener('pointerdown', outside);
    const current = ref.current;
    current?.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); current?.removeEventListener('keydown', escape); };
  }, [open]);
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);
  return <div className="action-menu" ref={ref} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <button ref={trigger} type="button" className="icon-button" aria-label={label} aria-expanded={open} aria-controls={open ? id : undefined} disabled={disabled} onClick={() => setOpen(current => !current)}><Icon name="more" /></button>
    {open && <div ref={panel} id={id} className="action-popover" aria-label={label}>{actions.map(action => <button key={action.label} type="button" className={action.danger ? 'text-danger' : ''} disabled={disabled || action.disabled} onClick={() => { setOpen(false); trigger.current?.focus(); action.onClick(); }}>{action.icon && <Icon name={action.icon} size={15} />}{action.label}</button>)}</div>}
  </div>;
}
