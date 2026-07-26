import { forwardRef, useImperativeHandle, useRef } from 'react';

export interface PullToRefreshHandle {
  update: (progress: number, triggered: boolean) => void;
  reset: () => void;
}

export const PullToRefreshIndicator = forwardRef<PullToRefreshHandle>((_, ref) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    update(progress: number, triggered: boolean) {
      const wrap = wrapRef.current;
      const icon = iconRef.current;
      if (!wrap || !icon) return;

      const p  = Math.min(progress, 1.15);
      const ty = -48 + p * 64;
      const opacity = Math.min(progress * 2.5, 1);

      wrap.style.transition = 'none';
      wrap.style.transform  = `translateX(-50%) translateY(${ty}px)`;
      wrap.style.opacity    = String(opacity);

      if (triggered) {
        if (icon.style.animationName !== 'ptr-spin') {
          icon.style.transform = 'rotate(0deg)';
          icon.style.animation = 'ptr-spin 0.7s linear infinite';
        }
      } else {
        icon.style.animation  = 'none';
        icon.style.transform  = `rotate(${Math.min(progress, 1) * 210}deg)`;
      }
    },

    reset() {
      const wrap = wrapRef.current;
      const icon = iconRef.current;
      if (!wrap || !icon) return;
      wrap.style.transition = 'transform 0.38s cubic-bezier(0.25,1,0.5,1), opacity 0.3s ease';
      wrap.style.transform  = 'translateX(-50%) translateY(-48px)';
      wrap.style.opacity    = '0';
      icon.style.animation  = 'none';
      icon.style.transform  = 'rotate(0deg)';
    },
  }));

  return (
    <>
      <style>{`@keyframes ptr-spin { to { transform: rotate(360deg); } }`}</style>
      <div
        ref={wrapRef}
        aria-hidden="true"
        style={{
          position:           'fixed',
          top:                '16px',
          left:               '50%',
          transform:          'translateX(-50%) translateY(-48px)',
          opacity:            0,
          zIndex:             9998,
          pointerEvents:      'none',
          width:              '40px',
          height:             '40px',
          borderRadius:       '50%',
          background:         'rgba(12, 22, 18, 0.75)',
          backdropFilter:     'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display:            'flex',
          alignItems:         'center',
          justifyContent:     'center',
          border:             '1px solid rgba(193, 154, 95, 0.35)',
          boxShadow:          '0 2px 16px rgba(0,0,0,0.4), 0 0 8px rgba(193,154,95,0.18)',
          willChange:         'transform, opacity',
        }}
      >
        <div
          ref={iconRef}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', willChange: 'transform' }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold-500)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </div>
      </div>
    </>
  );
});
