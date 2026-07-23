import { useEffect, useState } from 'react';

export function useReducedMotion(): boolean {
  const mq = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

  const [reduced, setReduced] = useState(mq?.matches ?? false);

  useEffect(() => {
    if (!mq) return;
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [mq]);

  return reduced;
}
