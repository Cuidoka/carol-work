import { useLayoutEffect, useRef } from 'react';

export function useListMotion(ids) {
  const ref = useRef(null), previous = useRef(new Map());
  const key = ids.join(',');
  useLayoutEffect(() => {
    const container = ref.current;
    if (!container) return;
    const top = container.getBoundingClientRect().top;
    const items = [...container.querySelectorAll('[data-motion-id]')];
    const positions = new Map(items.map(item => [item.dataset.motionId, item.getBoundingClientRect().top - top]));
    const animations = [];
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach((item, index) => {
        if (!item.animate) return;
        const old = previous.current.get(item.dataset.motionId);
        const delta = old === undefined ? 6 : old - positions.get(item.dataset.motionId);
        if (old === undefined && index >= 12 || old !== undefined && Math.abs(delta) < 1) return;
        animations.push(item.animate(
          [{ transform: `translateY(${delta}px)`, opacity: old === undefined ? 0 : 1 }, { transform: 'translateY(0)', opacity: 1 }],
          { duration: 280, delay: old === undefined ? Math.min(index * 24, 144) : 0, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' }
        ));
      });
    }
    previous.current = positions;
    return () => animations.forEach(animation => animation.cancel());
  }, [key]);
  return ref;
}
