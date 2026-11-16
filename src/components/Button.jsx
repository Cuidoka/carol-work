import Icon from './Icon.jsx';

const variants = {
  primary: 'button-primary',
  secondary: 'button-secondary',
  danger: 'button-danger',
  quiet: 'button-quiet'
};
export function Button({ children, variant = 'secondary', icon, className = '', autoFocus, ...props }) {
  return <button type="button" autoFocus={autoFocus} data-autofocus={autoFocus ? 'true' : undefined} className={`button ${variants[variant]} ${className}`} {...props}>{icon && <Icon name={icon} size={16} />}{children}</button>;
}
export function IconButton({ label, icon, danger = false, className = '', ...props }) {
  return <button type="button" aria-label={label} title={label} className={`icon-button ${danger ? 'text-danger' : ''} ${className}`} {...props}><Icon name={icon} size={16} /></button>;
}
