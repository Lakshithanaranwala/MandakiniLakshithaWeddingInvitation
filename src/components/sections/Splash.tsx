import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import type { Transition } from 'motion/react';
import { Petals } from '../motion/Petals';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ─── Animation variants ─────────────────────────────────────────────────── */

const nameVariant = (delay: number) => ({
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 1.0, delay, ease: EASE } satisfies Transition,
  },
});

const ampersandVariant = {
  hidden: { opacity: 0, scale: 0.85 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.7, delay: 0.95, ease: EASE } satisfies Transition,
  },
};

const lineVariant = {
  hidden: { scaleX: 0, opacity: 0 },
  show: {
    scaleX: 1,
    opacity: 1,
    transition: { duration: 0.9, delay: 1.5, ease: EASE } satisfies Transition,
  },
};

const subtitleVariant = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: 1.9 } satisfies Transition,
  },
};

const chevronVariant = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.5, delay: 2.4 } satisfies Transition,
  },
};

export function Splash() {
  const reduced    = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  // Subtle parallax — cap at 60px, never animating blur/filter
  const photoY = useTransform(scrollYProgress, [0, 1], ['0px', '60px']);

  return (
    <section
      ref={sectionRef}
      id="splash"
      aria-label="Mandakini and Lakshitha"
      style={{
        position: 'relative',
        height: '100svh',
        minHeight: '100dvh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      {/* ── Background photo ─────────────────────────────────────────────── */}
      <motion.div
        style={{
          position: 'absolute',
          inset: '-5%',
          y: reduced ? 0 : photoY,
        }}
      >
        <motion.div
          initial={reduced ? false : { scale: 1.07, opacity: 0.9 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2.2, ease: EASE }}
          style={{ width: '100%', height: '100%' }}
        >
          {/* No avif/webp sources yet — add them once images are converted */}
          <img
            src="/images/splash.png"
            alt="Mandakini and Lakshitha"
            fetchPriority="high"
            decoding="async"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 20%',
              display: 'block',
            }}
          />
        </motion.div>
      </motion.div>

      {/* ── Layered overlay ───────────────────────────────────────────────── */}
      {/* Top vignette — subtle, preserves sky */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(22, 39, 31, 0.05) 0%, transparent 45%)',
          zIndex: 1,
        }}
      />
      {/* Centre scrim — darkens the mid-section behind the text */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 90% 60% at 50% 55%, rgba(22, 39, 31, 0.22) 0%, rgba(75, 91, 83, 0) 70%, transparent 100%)',
          zIndex: 1,
        }}
      />

      {/* ── Ambient petals ────────────────────────────────────────────────── */}
      {!reduced && <Petals />}

      {/* ── Text block — pinned to bottom ────────────────────────────────── */}
      <motion.div
        initial="hidden"
        animate="show"
        style={{
          position: 'relative',
          zIndex: 3,
          padding: 'clamp(2rem, 6vw, 3.5rem) clamp(1.75rem, 6vw, 3rem)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0,
          paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom, 2.5rem))',
        }}
      >
        {/* "We're getting married" — appears first above names */}
        <motion.p
          variants={reduced ? undefined : subtitleVariant}
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'clamp(0.6rem, 2.2vw, 0.72rem)',
            fontWeight: 400,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'rgba(232, 223, 211, 0.75)',
            margin: '0 0 clamp(1rem, 3vw, 1.5rem)',
          }}
        >
          We&rsquo;re getting married
        </motion.p>

        {/* Name: Mandakini */}
        <motion.h1
          variants={reduced ? undefined : nameVariant(0.4)}
          style={{
            fontFamily: 'var(--font-script)',
            fontSize: 'clamp(3.2rem, 15vw, 7.5rem)',
            fontWeight: 400,
            color: 'var(--color-cream-50)',
            margin: 0,
            lineHeight: 1.0,
            letterSpacing: '0.01em',
            textShadow: '0 2px 24px rgba(22,39,31,0.35)',
          }}
        >
          Mandakini
        </motion.h1>

        {/* Ampersand */}
        <motion.p
          variants={reduced ? undefined : ampersandVariant}
          aria-hidden="true"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.6rem, 5.5vw, 3.2rem)',
            fontWeight: 300,
            fontStyle: 'italic',
            color: 'var(--color-gold-500)',
            margin: '0.1em 0 0.05em',
            lineHeight: 1,
            opacity: 0.9,
          }}
        >
          &amp;
        </motion.p>

        {/* Name: Lakshitha */}
        <motion.p
          variants={reduced ? undefined : nameVariant(1.25)}
          style={{
            fontFamily: 'var(--font-script)',
            fontSize: 'clamp(3.2rem, 15vw, 7.5rem)',
            fontWeight: 400,
            color: 'var(--color-cream-50)',
            margin: 0,
            lineHeight: 1.0,
            letterSpacing: '0.01em',
            textShadow: '0 2px 24px rgba(22,39,31,0.35)',
          }}
        >
          Lakshitha
        </motion.p>

        {/* Gold rule */}
        <motion.div
          variants={reduced ? undefined : lineVariant}
          style={{
            width: 'clamp(3rem, 12vw, 6rem)',
            height: '1px',
            background: 'var(--color-gold-500)',
            margin: 'clamp(1rem, 2.5vw, 1.4rem) 0',
            transformOrigin: 'center',
            opacity: 0.7,
          }}
        />

        {/* Date */}
        <motion.p
          variants={reduced ? undefined : subtitleVariant}
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'clamp(0.6rem, 2vw, 0.7rem)',
            fontWeight: 400,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: 'rgba(232, 223, 211, 0.65)',
            margin: '0 0 clamp(1.2rem, 3.5vw, 2rem)',
          }}
        >
          11 · September · 2026
        </motion.p>

        {/* Scroll chevron */}
        <motion.div
          variants={reduced ? undefined : chevronVariant}
          aria-hidden="true"
          animate={reduced ? {} : { y: [0, 8, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 2.8 }}
        >
          <svg width="18" height="10" viewBox="0 0 18 10" fill="none" aria-hidden="true">
            <path
              d="M1 1L9 9L17 1"
              stroke="rgba(232, 223, 211, 0.5)"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  );
}
