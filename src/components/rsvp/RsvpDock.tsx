import { motion, AnimatePresence } from 'motion/react';
import { GlassPanel } from '../glass/GlassPanel';
import { useSwiper }  from '../PageSwiper';

interface RsvpDockProps {
  onOpen: () => void;
}

export function RsvpDock({ onOpen }: RsvpDockProps) {
  const { currentIndex } = useSwiper();
  const visible = currentIndex > 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
          style={{
            position: 'fixed',
            bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))',
            left: '50%',
            x: '-50%',
            width: '88%',
            maxWidth: '400px',
            zIndex: 200,
          }}
        >
          <GlassPanel variant="gold" radius="pill" style={{ padding: 0 }}>
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
      )}
    </AnimatePresence>
  );
}
