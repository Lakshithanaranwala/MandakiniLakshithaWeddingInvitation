import { motion } from 'motion/react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Shared scroll-reveal wrapper.
 * opacity 0→1, y 32→0, 700ms, --ease-glass.
 * Fires once when 30% of the element is in viewport.
 * Respects prefers-reduced-motion.
 */
export function Reveal({ children, delay = 0, className, style }: RevealProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      style={style}
      initial={reduced ? false : { opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
