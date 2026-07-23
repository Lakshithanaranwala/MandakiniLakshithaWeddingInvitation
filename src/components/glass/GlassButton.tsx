import { motion } from 'motion/react';
import type { GlassVariant } from './GlassPanel';

interface GlassButtonProps {
  children: React.ReactNode;
  variant?: GlassVariant;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

export function GlassButton({
  children,
  variant = 'light',
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
}: GlassButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={[
        'glass',
        `glass--${variant}`,
        'glass--pill',
        'relative cursor-pointer select-none',
        'px-6 py-3',
        'text-sm tracking-[0.18em] uppercase',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
        className,
      ].filter(Boolean).join(' ')}
      style={{
        fontFamily: 'var(--font-ui)',
        color: variant === 'dark' ? 'var(--color-cream-50)' : 'var(--color-ink-900)',
        border: 'none',
        outline: 'none',
      }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      transition={{ duration: 0.12, ease: 'easeInOut' }}
    >
      {children}
    </motion.button>
  );
}
