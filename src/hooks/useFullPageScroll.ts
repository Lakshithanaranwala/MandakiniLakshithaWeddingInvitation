import { useEffect, useRef } from 'react';

const THRESHOLD       = 0.25; // 25% of viewport height — wheel (desktop)
const TOUCH_THRESHOLD = 0.12; // 12% of viewport height — swipe (mobile)
const DURATION        = 600;  // ms — animation duration
const IDLE_MS         = 200;  // reset accumulated wheel delta after idle

/**
 * easeInOutSine: the smoothest ease-in-out, derived from a cosine curve.
 * Perfectly symmetric, no sharp acceleration — feels completely natural.
 */
function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

/** Cancel-able RAF-based scroll animation */
function smoothScrollTo(targetY: number, onDone: () => void): () => void {
  const startY   = window.scrollY;
  const distance = targetY - startY;
  const startTime = performance.now();
  let rafId: number;

  function step(now: number) {
    const elapsed  = now - startTime;
    const progress = Math.min(elapsed / DURATION, 1);
    window.scrollTo(0, startY + distance * easeInOutSine(progress));

    if (progress < 1) {
      rafId = requestAnimationFrame(step);
    } else {
      onDone();
    }
  }

  rafId = requestAnimationFrame(step);
  return () => cancelAnimationFrame(rafId);
}

/**
 * Full-page snapping for sections 0..n-1.
 * The LAST section is exempt: once landed, normal scroll/swipe is restored.
 * Swiping/scrolling up from the very top of the last section snaps back.
 */
export function useFullPageScroll(sectionIds: readonly string[], disabled = false) {
  const idxRef      = useRef(0);
  const lockRef     = useRef(false);
  const accumRef    = useRef(0);
  const timerRef    = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cancelAnim  = useRef<(() => void) | undefined>(undefined);
  const touchStartY = useRef(0);

  useEffect(() => {
    if (disabled) return;

    const lastIdx = sectionIds.length - 1;

    function getSections(): HTMLElement[] {
      return (sectionIds as readonly string[])
        .map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => el !== null);
    }

    function isLastSection() { return idxRef.current === lastIdx; }

    function isAtTopOfLast(): boolean {
      const sections = getSections();
      const lastEl   = sections[lastIdx];
      return !!lastEl && window.scrollY <= lastEl.offsetTop + 4;
    }

    function navigate(dir: 1 | -1) {
      if (lockRef.current) return;
      const sections = getSections();
      const next = idxRef.current + dir;
      if (next < 0 || next >= sections.length) return;

      // Cancel any in-progress animation before starting a new one
      cancelAnim.current?.();

      lockRef.current  = true;
      accumRef.current = 0;
      idxRef.current   = next;

      const targetY = sections[next].offsetTop;

      cancelAnim.current = smoothScrollTo(targetY, () => {
        lockRef.current = false;
        cancelAnim.current = undefined;
      });
    }

    /* ── Mouse wheel ──────────────────────────────────────────────────────── */

    function onWheel(e: WheelEvent) {
      if (isLastSection()) {
        if (!(e.deltaY < 0 && isAtTopOfLast())) return;
      }

      e.preventDefault();
      if (lockRef.current) return;

      accumRef.current += e.deltaY;
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => { accumRef.current = 0; }, IDLE_MS);

      const threshold = window.innerHeight * THRESHOLD;
      if (accumRef.current > threshold)       navigate(1);
      else if (accumRef.current < -threshold) navigate(-1);
    }

    /* ── Touch swipe ──────────────────────────────────────────────────────── */

    function onTouchStart(e: TouchEvent) {
      touchStartY.current = e.touches[0].clientY;
    }

    function onTouchMove(e: TouchEvent) {
      if (lockRef.current) return;
      if (isLastSection()) {
        const swipingDown = e.touches[0].clientY > touchStartY.current;
        if (!(swipingDown && isAtTopOfLast())) return;
      }
      e.preventDefault();
    }

    function onTouchEnd(e: TouchEvent) {
      if (lockRef.current) return;
      const endY      = e.changedTouches[0].clientY;
      const deltaY    = touchStartY.current - endY;
      const threshold = window.innerHeight * TOUCH_THRESHOLD;

      if (isLastSection()) {
        if (!(deltaY < 0 && isAtTopOfLast())) return;
      }

      if (Math.abs(deltaY) > threshold) {
        navigate(deltaY > 0 ? 1 : -1);
      }
    }

    /* ── Keep idxRef in sync ──────────────────────────────────────────────── */

    function syncIndex() {
      if (lockRef.current) return;
      const sections = getSections();
      const scrollY  = window.scrollY;
      let closest = 0, minDist = Infinity;
      sections.forEach((s, i) => {
        const d = Math.abs(s.offsetTop - scrollY);
        if (d < minDist) { minDist = d; closest = i; }
      });
      idxRef.current = closest;
    }

    window.addEventListener('wheel',      onWheel,      { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true  });
    window.addEventListener('touchmove',  onTouchMove,  { passive: false });
    window.addEventListener('touchend',   onTouchEnd,   { passive: true  });
    window.addEventListener('scroll',     syncIndex,    { passive: true  });

    return () => {
      cancelAnim.current?.();
      window.removeEventListener('wheel',      onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove',  onTouchMove);
      window.removeEventListener('touchend',   onTouchEnd);
      window.removeEventListener('scroll',     syncIndex);
      clearTimeout(timerRef.current);
    };
  }, [sectionIds, disabled]);
}
