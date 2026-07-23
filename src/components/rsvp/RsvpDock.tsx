import { motion, useScroll, useTransform } from 'motion/react';
import { GlassPanel } from '../glass/GlassPanel';

interface RsvpDockProps {
  onOpen: () => void;
}

export function RsvpDock({ onOpen }: RsvpDockProps) {
  const { scrollY } = useScroll();
  // Fade the dock in after the user scrolls 80px
  const opacity = useTransform(scrollY, [60, 100], [0, 1]);
  const y       = useTransform(scrollY, [60, 100], [12, 0]);

  return (
    <motion.div
      style={{
        position: 'fixed',
        bottom: 'max(1.25rem, env(safe-area-inset-bottom, 1.25rem))',
        left: '50%',
        x: '-50%',
        width: '88%',
        maxWidth: '400px',
        zIndex: 40,
        opacity,
        y,
        pointerEvents: 'auto',
      }}
    >
      <GlassPanel
        variant="gold"
        radius="pill"
        style={{ padding: 0 }}
      >
        <motion.button
          type="button"
          onClick={onOpen}
          aria-label="Open RSVP form"
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.12, ease: 'easeInOut' }}
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '1rem 2rem',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.8rem',
            fontWeight: 500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--color-ink-900)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M1 3.5h12M1 7h12M1 10.5h7"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
          RSVP now
        </motion.button>
      </GlassPanel>
    </motion.div>
  );
}
