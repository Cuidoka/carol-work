import Icon from './Icon.jsx';

const variants = {
  primary: 'border-acid bg-acid text-forest hover:bg-[#cce65e]',
  secondary: 'border-line bg-white text-ink hover:bg-[#f0f3eb]',
  danger: 'border-red-700 bg-red-700 text-white hover:bg-red-800'
};
export function Button({ children, variant = 'secondary', icon, className = '', autoFocus, ...props }) {
  return <button type="button" autoFocus={autoFocus} data-autofocus={autoFocus ? 'true' : undefined} className={`interactive-button inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-semibold transition-colors disabled:cursor-default disabled:opacity-40 ${variants[variant]} ${className}`} {...props}>{icon && <Icon name={icon} size={16} />}{children}</button>;
}
export function IconButton({ label, icon, danger = false, className = '', ...props }) {
  return <button type="button" aria-label={label} title={label} className={`interactive-button inline-flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-[#edf2e5] disabled:opacity-25 ${danger ? 'text-[#99615b]' : 'text-[#748268]'} ${className}`} {...props}><Icon name={icon} size={16} /></button>;
}
