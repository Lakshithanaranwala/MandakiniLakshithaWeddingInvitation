import { useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'motion/react';
import { GlassPanel } from '../glass/GlassPanel';
import { useCountdown } from '../../hooks/useCountdown';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ─── Countdown digit flip ───────────────────────────────────────────────── */

function pad(n: number): string { return String(n).padStart(2, '0'); }
function digits(n: number): [string, string] { const s = pad(n); return [s[0], s[1]]; }

function AnimatedDigit({ value }: { value: string }) {
  const reduced = useReducedMotion();
  if (reduced) return <span style={{ display: 'inline-block' }}>{value}</span>;
  return (
    <span style={{ display: 'inline-block', position: 'relative', overflow: 'hidden', height: '1.15em', verticalAlign: 'bottom' }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ duration: 0.32, ease: EASE }}
          style={{ display: 'inline-block', lineHeight: 1.15 }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function CountdownTile({ value, label, delay, inView }: {
  value: number; label: string; delay: number; inView: boolean;
}) {
  const reduced = useReducedMotion();
  const [d1, d2] = digits(value);
  return (
    <motion.div
      style={{ flex: 1 }}
      initial={reduced ? false : { opacity: 0, y: 24 }}
      animate={reduced ? {} : { opacity: inView ? 1 : 0, y: inView ? 0 : 24 }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      <GlassPanel
        variant="light"
        radius="panel"
        style={{ padding: 'clamp(0.35rem, 1.2vw, 0.6rem) clamp(0.25rem, 1vw, 0.5rem)', textAlign: 'center' }}
      >
        <span
          aria-live="polite"
          aria-label={`${value} ${label}`}
          style={{
            display: 'flex',
            justifyContent: 'center',
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.1rem, 4.5vw, 1.8rem)',
            fontWeight: 300,
            color: 'var(--color-forest-900)',
            lineHeight: 1,
          }}
        >
          <AnimatedDigit value={d1} />
          <AnimatedDigit value={d2} />
        </span>
        <span
          aria-hidden="true"
          style={{
            display: 'block',
            marginTop: '0.2em',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.48rem',
            fontWeight: 400,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--color-sage-400)',
          }}
        >
          {label}
        </span>
      </GlassPanel>
    </motion.div>
  );
}

/* ─── Section ────────────────────────────────────────────────────────────── */

export function SaveTheDate() {
  const { days, hours, minutes, seconds, phase } = useCountdown();
  const reduced   = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  // once: false — animation replays every time you snap to this section
  const inView = useInView(sectionRef, { once: false, amount: 0.4 });

  function fadeUp(delay: number) {
    return {
      initial: reduced ? false as const : { opacity: 0, y: 36 },
      animate: reduced ? {} : { opacity: inView ? 1 : 0, y: inView ? 0 : 36 },
      transition: { duration: 0.75, delay, ease: EASE },
    };
  }

  return (
    <section
      ref={sectionRef}
      id="save-the-date"
      aria-label="Save the date"
      style={{
        position: 'relative',
        height: '100svh',
        minHeight: '100dvh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      {/* Background */}
      <img
        src="/images/savethedate-bg.png"
        alt=""
        role="presentation"
        fetchPriority="low"
        decoding="async"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center top',
          display: 'block',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(0.6rem, 2vw, 1rem)',
          padding: '0 clamp(1.5rem, 5vw, 2.5rem)',
          marginTop: 'clamp(8rem, 28vh, 16rem)',
        }}
      >
        {/* Save the Date heading */}
        <motion.h2 {...fadeUp(0.05)} style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2rem, 9vw, 4rem)',
          fontWeight: 600,
          color: 'var(--color-forest-700)',
          margin: 0,
          textAlign: 'center',
          lineHeight: 1.05,
          letterSpacing: '-0.01em',
        }}>
          Save the Date
        </motion.h2>

        {/* Gold rule — draws left→right */}
        <motion.div
          initial={reduced ? false : { scaleX: 0, opacity: 0 }}
          animate={reduced ? {} : { scaleX: inView ? 1 : 0, opacity: inView ? 0.6 : 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: EASE }}
          style={{
            width: 'clamp(2.5rem, 10vw, 5rem)',
            height: '1px',
            background: 'var(--color-gold-500)',
            transformOrigin: 'center',
          }}
        />

        {/* Date numerals */}
        <motion.p {...fadeUp(0.35)} style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.8rem, 7vw, 3.2rem)',
          fontWeight: 600,
          color: 'var(--color-forest-900)',
          margin: 0,
          letterSpacing: '0.08em',
          textAlign: 'center',
        }}>
          2026
          <span style={{ color: 'var(--color-gold-500)', opacity: 0.75, margin: '0 0.3em' }}>:</span>
          09
          <span style={{ color: 'var(--color-gold-500)', opacity: 0.75, margin: '0 0.3em' }}>:</span>
          11
        </motion.p>

        {/* Countdown tiles — each tile staggers independently */}
        <div style={{ width: '90%', maxWidth: '340px', marginTop: '0.25rem' }}>
          {phase === 'upcoming' && (
            <div style={{ display: 'flex', gap: 'clamp(0.35rem, 1.5vw, 0.65rem)' }}>
              <CountdownTile value={days}    label="Days"  delay={0.50} inView={inView} />
              <CountdownTile value={hours}   label="Hours" delay={0.62} inView={inView} />
              <CountdownTile value={minutes} label="Mins"  delay={0.74} inView={inView} />
              <CountdownTile value={seconds} label="Secs"  delay={0.86} inView={inView} />
            </div>
          )}
          {phase === 'today' && (
            <motion.p {...fadeUp(0.5)} style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.6rem, 7vw, 2.8rem)',
              fontWeight: 300,
              color: 'var(--color-forest-700)',
              margin: 0,
              textAlign: 'center',
            }}>
              Today&rsquo;s the day
            </motion.p>
          )}
          {phase === 'past' && (
            <motion.p {...fadeUp(0.5)} style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.1rem, 4.5vw, 1.8rem)',
              fontWeight: 300,
              color: 'var(--color-forest-700)',
              margin: 0,
              textAlign: 'center',
            }}>
              Thank you for celebrating with us.
            </motion.p>
          )}
        </div>

        {/* Venue micro-label */}
        <motion.p {...fadeUp(1.0)} style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.65rem',
          fontWeight: 400,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--color-sage-400)',
          margin: 0,
          textAlign: 'center',
        }}>
          
        </motion.p>
      </div>
    </section>
  );
}
