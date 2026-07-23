import { useEffect, useRef } from 'react';

const THRESHOLD       = 0.25; // 25% of viewport height — wheel (desktop)
const TOUCH_THRESHOLD = 0.12; // 12% of viewport height — swipe (mobile), more responsive
const LOCK_MS   = 950;  // lock duration matches smooth-scroll animation
const IDLE_MS   = 200;  // reset accumulated wheel delta after this many ms idle

/**
 * Full-page snapping for sections 0..n-1.
 * The LAST section is exempt: once landed there, normal scroll/swipe is restored.
 * Scrolling/swiping up from the very top of the last section snaps back to the previous one.
 *
 * Handles both mouse wheel (desktop) and touch swipe (mobile).
 *
 * @param sectionIds  Ordered list of section element IDs
 * @param disabled    Pass true to suspend (e.g. when RSVP sheet is open)
 */
export function useFullPageScroll(sectionIds: readonly string[], disabled = false) {
  const idxRef       = useRef(0);
  const lockRef      = useRef(false);
  const accumRef     = useRef(0);
  const timerRef     = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const touchStartY  = useRef(0);

  useEffect(() => {
    if (disabled) return;

    const lastIdx = sectionIds.length - 1;

    function getSections(): HTMLElement[] {
      return (sectionIds as readonly string[])
        .map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => el !== null);
    }

    function isLastSection() {
      return idxRef.current === lastIdx;
    }

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

      lockRef.current  = true;
      accumRef.current = 0;
      idxRef.current   = next;

      sections[next].scrollIntoView({ behavior: 'smooth', block: 'start' });

      setTimeout(() => { lockRef.current = false; }, LOCK_MS);
    }

    /* ── Mouse wheel ────────────────────────────────────────────────────── */

    function onWheel(e: WheelEvent) {
      const threshold = window.innerHeight * THRESHOLD;

      if (isLastSection()) {
        // Only intercept upward scroll when at the very top of the last section
        if (!(e.deltaY < 0 && isAtTopOfLast())) return;
      }

      e.preventDefault();
      if (lockRef.current) return;

      accumRef.current += e.deltaY;

      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => { accumRef.current = 0; }, IDLE_MS);

      if (accumRef.current > threshold)       navigate(1);
      else if (accumRef.current < -threshold) navigate(-1);
    }

    /* ── Touch swipe ────────────────────────────────────────────────────── */

    function onTouchStart(e: TouchEvent) {
      touchStartY.current = e.touches[0].clientY;
    }

    function onTouchMove(e: TouchEvent) {
      if (lockRef.current) return;

      if (isLastSection()) {
        // On last section, only block native scroll when swiping down at the top
        // (to allow snap-back to Invitation)
        const swipingDown = e.touches[0].clientY > touchStartY.current;
        if (!(swipingDown && isAtTopOfLast())) return;
      }

      // Prevent native scroll so our snap animation is the only movement
      e.preventDefault();
    }

    function onTouchEnd(e: TouchEvent) {
      if (lockRef.current) return;

      const endY    = e.changedTouches[0].clientY;
      const deltaY  = touchStartY.current - endY; // positive = swiped up = go forward
      const threshold = window.innerHeight * TOUCH_THRESHOLD;

      if (isLastSection()) {
        if (!(deltaY < 0 && isAtTopOfLast())) return;
      }

      if (Math.abs(deltaY) > threshold) {
        navigate(deltaY > 0 ? 1 : -1);
      }
    }

    /* ── Keep idxRef in sync (page-load, direct links, resize) ─────────── */

    function syncIndex() {
      if (lockRef.current) return;
      const sections = getSections();
      const scrollY  = window.scrollY;
      let closest = 0;
      let minDist = Infinity;
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
      window.removeEventListener('wheel',      onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove',  onTouchMove);
      window.removeEventListener('touchend',   onTouchEnd);
      window.removeEventListener('scroll',     syncIndex);
      clearTimeout(timerRef.current);
    };
  }, [sectionIds, disabled]);
}
