import { useEffect, useId, useRef } from 'react';
import { IconButton } from './Button.jsx';

export default function Dialog({ title, eyebrow, busy, onClose, children, wide = false, drawer = false, className = '', closeLabel = 'Fechar' }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    dialog.showModal();
    // React tenta o autoFocus antes de o dialog estar visível. Aplicar após abrir.
    dialog.querySelector('[data-autofocus="true"]')?.focus({ preventScroll: true });
    return () => { dialog.close(); previousFocus?.focus?.(); };
  }, []);
  return <dialog ref={ref} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }} className={`app-dialog ${drawer ? 'dialog-drawer' : wide ? 'dialog-wide' : ''} ${className}`}>
    <div className="dialog-content"><div className="dialog-heading"><div>{eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}<h2 id={titleId}>{title}</h2></div><IconButton label={closeLabel} icon="close" onClick={onClose} disabled={busy} /></div>{children}</div>
  </dialog>;
}
