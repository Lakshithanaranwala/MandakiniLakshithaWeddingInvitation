import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from '../hooks/useReducedMotion';

// ─── Constants ────────────────────────────────────────────────────────────────

const DURATION        = 320;  // ms — sweet spot: fast enough to feel snappy, long enough to feel smooth
const EASING          = 'cubic-bezier(0.25, 1, 0.5, 1)'; // ease-out quint — natural deceleration
const WHEEL_THRESHOLD = 0.25; // 25% viewport height
const TOUCH_THRESHOLD = 0.12; // 12% viewport height — more responsive on mobile
const IDLE_MS         = 200;  // reset accumulated delta after idle

// ─── Context ─────────────────────────────────────────────────────────────────

interface SliderCtx { currentIndex: number; total: number; }
const SliderContext = createContext<SliderCtx>({ currentIndex: 0, total: 0 });
export function useSlider(): SliderCtx { return useContext(SliderContext); }

// ─── Progress rail ────────────────────────────────────────────────────────────

export function SliderProgressRail() {
  const { currentIndex, total } = useSlider();
  const progress = total > 1 ? currentIndex / (total - 1) : 0;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        width: '2px',
        height: '100vh',
        zIndex: 60,
        background: 'rgba(138, 163, 150, 0.15)',
      }}
    >
      <motion.div
        animate={{ scaleY: progress }}
        transition={{ duration: DURATION / 1000, ease: [0.25, 1, 0.5, 1] }}
        style={{
          width: '100%',
          height: '100%',
          background: 'var(--color-gold-500)',
          opacity: 0.7,
          transformOrigin: 'top',
          scaleY: 0,
        }}
      />
    </div>
  );
}

// ─── Slider ───────────────────────────────────────────────────────────────────

/**
 * Full-page CSS-transform slider.
 *
 * - Animates ONLY transform: translateY() — GPU composited, zero layout work.
 * - will-change: transform applied only to adjacent (about-to-animate) panels.
 * - Last section gets overflow-y: auto and is excluded from snap while scrolling
 *   internally; only snaps back when its internal scroll is at top.
 * - Reduced motion: instant switch, no transition.
 */
export function FullPageSlider({
  children,
  overlay,
}: {
  children: React.ReactNode[];
  overlay?: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  const total   = children.length;
  const lastIdx = total - 1;

  const [currentIndex, setCurrentIndex]   = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  // Refs — used inside event handlers to avoid stale closures
  const currentRef   = useRef(0);
  const lockRef      = useRef(false);
  const accumRef     = useRef(0);
  const idleRef      = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const touchStartY  = useRef(0);
  const lastPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function navigate(dir: 1 | -1) {
      if (lockRef.current) return;
      const next = currentRef.current + dir;
      if (next < 0 || next >= total) return;

      lockRef.current    = true;
      accumRef.current   = 0;
      currentRef.current = next;
      setCurrentIndex(next);
      setTransitioning(true);

      // Release lock and clear will-change after animation completes
      setTimeout(() => {
        lockRef.current = false;
        setTransitioning(false);
      }, DURATION + 50);
    }

    function isOnLast(): boolean {
      return currentRef.current === lastIdx;
    }

    function isLastAtTop(): boolean {
      return !lastPanelRef.current || lastPanelRef.current.scrollTop <= 2;
    }

    // ── Wheel (desktop) ───────────────────────────────────────────────────
    function onWheel(e: WheelEvent) {
      // On last section: only intercept upward scroll at top (snap back)
      if (isOnLast() && !(e.deltaY < 0 && isLastAtTop())) return;

      e.preventDefault();
      if (lockRef.current) return;

      accumRef.current += e.deltaY;
      clearTimeout(idleRef.current);
      idleRef.current = setTimeout(() => { accumRef.current = 0; }, IDLE_MS);

      const th = window.innerHeight * WHEEL_THRESHOLD;
      if (accumRef.current > th)       navigate(1);
      else if (accumRef.current < -th) navigate(-1);
    }

    // ── Touch (mobile) ────────────────────────────────────────────────────
    function onTouchStart(e: TouchEvent) {
      touchStartY.current = e.touches[0].clientY;
    }

    function onTouchMove(e: TouchEvent) {
      if (lockRef.current) return;
      if (isOnLast()) {
        const goingDown = e.touches[0].clientY > touchStartY.current;
        if (!(goingDown && isLastAtTop())) return; // let the section scroll
      }
      e.preventDefault(); // block native scroll — our transform handles it
    }

    function onTouchEnd(e: TouchEvent) {
      if (lockRef.current) return;
      const deltaY = touchStartY.current - e.changedTouches[0].clientY;
      const th     = window.innerHeight * TOUCH_THRESHOLD;
      if (isOnLast() && !(deltaY < 0 && isLastAtTop())) return;
      if (Math.abs(deltaY) > th) navigate(deltaY > 0 ? 1 : -1);
    }

    window.addEventListener('wheel',      onWheel,      { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true  });
    window.addEventListener('touchmove',  onTouchMove,  { passive: false });
    window.addEventListener('touchend',   onTouchEnd,   { passive: true  });

    return () => {
      window.removeEventListener('wheel',      onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove',  onTouchMove);
      window.removeEventListener('touchend',   onTouchEnd);
      clearTimeout(idleRef.current);
    };
  }, [total, lastIdx]);

  // CSS transition string — 'none' for reduced-motion users
  const transition = reduced
    ? 'none'
    : `transform ${DURATION}ms ${EASING}`;

  return (
    <SliderContext.Provider value={{ currentIndex, total }}>
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
        {children.map((child, i) => {
          const offset     = i - currentIndex;
          const isAdjacent = Math.abs(offset) <= 1; // only adjacent panels need GPU layer
          const isLast     = i === lastIdx;

          return (
            <div
              key={i}
              ref={isLast ? lastPanelRef : undefined}
              aria-hidden={offset !== 0 || undefined}
              style={{
                position: 'absolute',
                inset: 0,

                // ── The only animated property ─────────────────────────────
                transform: `translateY(${offset * 100}%)`,
                transition,

                // ── GPU layer — only during active transition ──────────────
                willChange: transitioning && isAdjacent ? 'transform' : 'auto',

                // ── Hide distant panels entirely (saves GPU memory) ────────
                visibility: isAdjacent ? 'visible' : 'hidden',

                // ── Last section scrolls internally ────────────────────────
                overflowY: isLast ? 'auto' : 'hidden',
                overflowX: 'hidden',
              }}
            >
              {child}
            </div>
          );
        })}
      </div>
      {overlay}
    </SliderContext.Provider>
  );
}
