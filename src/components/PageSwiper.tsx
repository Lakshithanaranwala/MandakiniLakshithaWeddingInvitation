import { createContext, useContext, useEffect, useRef, useState } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────

const SNAP_DISTANCE = 0.28;  // 28% of viewport height to trigger snap
const SNAP_VELOCITY = 0.35;  // px/ms — fast flick threshold
const RUBBER_BAND   = 0.20;  // 20% resistance at edges
const ANIM_MS       = 420;   // snap animation duration
const EASING        = 'cubic-bezier(0.25, 1, 0.5, 1)';

// ─── Context ─────────────────────────────────────────────────────────────────

interface SwiperCtx { currentIndex: number; total: number; }
const SwiperContext = createContext<SwiperCtx>({ currentIndex: 0, total: 0 });
export function useSwiper(): SwiperCtx { return useContext(SwiperContext); }

// ─── PageSwiper ───────────────────────────────────────────────────────────────

export function PageSwiper({
  children,
  overlay,
  disabled = false,
}: {
  children: React.ReactNode[];
  overlay?: React.ReactNode;
  disabled?: boolean;
}) {
  const total   = children.length;
  const lastIdx = total - 1;

  const [currentIndex, setCurrentIndex] = useState(0);

  // Refs — all mutable drag state lives here to avoid re-renders during drag
  const currentRef   = useRef(0);
  const animating    = useRef(false);
  const dragging     = useRef(false);
  const startY       = useRef(0);
  const lastY        = useRef(0);
  const lastT        = useRef(0);
  const vel          = useRef(0);    // px/ms, positive = finger moving down
  const delta        = useRef(0);    // current drag offset in px
  const stripRef     = useRef<HTMLDivElement>(null);
  const lastPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // ── DOM helpers ────────────────────────────────────────────────────────

    function applyTransform(index: number, offsetPx: number, animate: boolean) {
      const el = stripRef.current;
      if (!el) return;
      el.style.transition = animate ? `transform ${ANIM_MS}ms ${EASING}` : 'none';
      el.style.transform  = `translateY(calc(${-index} * 100vh + ${offsetPx}px))`;
    }

    function snapTo(nextIdx: number) {
      if (animating.current) return;
      animating.current = true;
      dragging.current  = false;
      delta.current     = 0;
      currentRef.current = nextIdx;
      applyTransform(nextIdx, 0, true);
      setCurrentIndex(nextIdx);
      setTimeout(() => { animating.current = false; }, ANIM_MS + 50);
    }

    // ── Drag start ─────────────────────────────────────────────────────────

    function onStart(clientY: number) {
      if (animating.current) return;
      dragging.current = true;
      startY.current   = clientY;
      lastY.current    = clientY;
      lastT.current    = performance.now();
      vel.current      = 0;
      delta.current    = 0;
      // Kill any ongoing transition for instant 1:1 response
      if (stripRef.current) stripRef.current.style.transition = 'none';
    }

    // ── Drag move ──────────────────────────────────────────────────────────

    function onMove(clientY: number) {
      if (!dragging.current) return;

      const now = performance.now();
      const dt  = now - lastT.current;
      if (dt > 0) vel.current = (clientY - lastY.current) / dt;
      lastY.current = clientY;
      lastT.current = now;

      let d = clientY - startY.current;

      // Rubber band at edges
      if (currentRef.current === 0 && d > 0) {
        d = d * RUBBER_BAND;
      } else if (currentRef.current === lastIdx && d < 0) {
        d = d * RUBBER_BAND;
      }

      delta.current = d;
      applyTransform(currentRef.current, d, false);
    }

    // ── Drag end ───────────────────────────────────────────────────────────

    function onEnd() {
      if (!dragging.current) return;
      dragging.current = false;

      const d  = delta.current;
      const v  = vel.current;
      const th = window.innerHeight * SNAP_DISTANCE;

      let dir = 0;

      // Distance threshold
      if (d < -th) dir = 1;   // dragged up → next page
      if (d >  th) dir = -1;  // dragged down → prev page

      // Velocity override (fast flick wins regardless of distance)
      if (v < -SNAP_VELOCITY) dir = 1;
      if (v >  SNAP_VELOCITY) dir = -1;

      const next = currentRef.current + dir;

      if (dir !== 0 && next >= 0 && next < total) {
        snapTo(next);
      } else {
        snapTo(currentRef.current); // snap back to current
      }
    }

    // ── Touch ──────────────────────────────────────────────────────────────

    function onTouchStart(e: TouchEvent) {
      if (disabled) return;
      // If on last page and it's scrolled down, let the section handle scroll
      if (
        currentRef.current === lastIdx &&
        lastPanelRef.current &&
        lastPanelRef.current.scrollTop > 2
      ) return;
      onStart(e.touches[0].clientY);
    }

    function onTouchMove(e: TouchEvent) {
      if (!dragging.current) return;
      e.preventDefault(); // block native scroll — we own the movement
      onMove(e.touches[0].clientY);
    }

    function onTouchEnd() { onEnd(); }

    // ── Mouse ──────────────────────────────────────────────────────────────

    function onMouseDown(e: MouseEvent) { if (disabled) return; onStart(e.clientY); }
    function onMouseMove(e: MouseEvent) { if (dragging.current) onMove(e.clientY); }
    function onMouseUp()  { if (dragging.current) onEnd(); }

    // ── Keyboard ───────────────────────────────────────────────────────────

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        snapTo(Math.min(lastIdx, currentRef.current + 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        snapTo(Math.max(0, currentRef.current - 1));
      }
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true  });
    window.addEventListener('touchmove',  onTouchMove,  { passive: false });
    window.addEventListener('touchend',   onTouchEnd,   { passive: true  });
    window.addEventListener('mousedown',  onMouseDown);
    window.addEventListener('mousemove',  onMouseMove);
    window.addEventListener('mouseup',    onMouseUp);
    window.addEventListener('keydown',    onKeyDown);

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove',  onTouchMove);
      window.removeEventListener('touchend',   onTouchEnd);
      window.removeEventListener('mousedown',  onMouseDown);
      window.removeEventListener('mousemove',  onMouseMove);
      window.removeEventListener('mouseup',    onMouseUp);
      window.removeEventListener('keydown',    onKeyDown);
    };
  }, [total, lastIdx, disabled]);

  return (
    <SwiperContext.Provider value={{ currentIndex, total }}>
      {/* Clipping viewport */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', userSelect: 'none', WebkitUserSelect: 'none' }}>
        {/* The strip — all pages stacked vertically, dragged as one unit */}
        <div
          ref={stripRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            willChange: 'transform',
            transform: 'translateY(0)',
          }}
        >
          {children.map((child, i) => (
            <div
              key={i}
              ref={i === lastIdx ? lastPanelRef : undefined}
              style={{
                width: '100%',
                height: '100vh',
                overflowY: i === lastIdx ? 'auto' : 'hidden',
                overflowX: 'hidden',
              }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Overlay — renders inside context so components can read currentIndex */}
      {overlay}
    </SwiperContext.Provider>
  );
}
