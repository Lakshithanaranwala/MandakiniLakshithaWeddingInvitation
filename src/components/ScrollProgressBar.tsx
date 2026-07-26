import { motion, AnimatePresence } from 'motion/react';
import { useSwiper } from './PageSwiper';

export function ScrollProgressBar() {
  const { currentIndex, total } = useSwiper();

  const progress = total > 1 ? currentIndex / (total - 1) : 0;
  const visible  = currentIndex > 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="progress-track"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        >
          <motion.div
            animate={{ scaleX: progress }}
            transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
            style={{
              height: '100%',
              background: 'var(--color-gold-500)',
              transformOrigin: 'left',
              boxShadow: '0 0 8px 3px var(--color-gold-500), 0 0 2px 1px rgba(255, 215, 100, 0.6)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
