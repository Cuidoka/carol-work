import { useEffect, useRef } from 'react';
import { IconButton } from './Button.jsx';

export default function Dialog({ title, eyebrow, busy, onClose, children, wide = false, className = '', closeLabel = 'Fechar' }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    dialog.showModal();
    // React tenta o autoFocus antes de o dialog estar visível. Aplicar após abrir.
    dialog.querySelector('[data-autofocus="true"]')?.focus({ preventScroll: true });
    return () => { dialog.close(); previousFocus?.focus?.(); };
  }, []);
  return <dialog ref={ref} aria-labelledby="dialog-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }} className={`app-dialog fixed inset-0 m-auto max-h-[90dvh] ${wide ? 'w-[820px]' : 'w-[440px]'} max-w-[calc(100%_-_2rem)] overflow-y-auto rounded-2xl border border-line bg-white p-0 text-ink shadow-2xl ${className}`}>
    <div className="p-6 sm:p-7"><div className="mb-6 flex items-start justify-between gap-4"><div>{eyebrow && <p className="mb-2 text-[9px] font-bold tracking-[.18em] text-[#78866a]">{eyebrow}</p>}<h2 id="dialog-title" className="text-2xl font-semibold tracking-tight">{title}</h2></div><IconButton label={closeLabel} icon="close" onClick={onClose} disabled={busy} /></div>{children}</div>
  </dialog>;
}
