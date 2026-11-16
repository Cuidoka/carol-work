import { useLayoutEffect, useRef } from 'react';

// Entrada curta de conteúdo, inspirada no padrão Animated Content do React Bits.
// Implementação própria com a API do navegador; conteúdo permanece visível sem animação.
export default function Reveal({ children, className = '', ...props }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !ref.current?.animate) return;
    const animation = ref.current.animate(
      [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 320, easing: 'cubic-bezier(.22,1,.36,1)' }
    );
    return () => animation.cancel();
  }, []);
  return <div ref={ref} className={className} {...props}>{children}</div>;
}
