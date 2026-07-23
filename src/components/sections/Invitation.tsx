import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { GlassPanel } from '../glass/GlassPanel';
import { Reveal } from '../motion/Reveal';
import { useGuest } from '../../hooks/useGuest';

export function Invitation() {
  const { guest, setName } = useGuest();
  const [inputValue, setInputValue]   = useState('');
  const [nameVisible, setNameVisible] = useState(false);
  const nameRef = useRef<HTMLSpanElement>(null);

  // Trigger the gold underline once name is in view
  useEffect(() => {
    const el = nameRef.current;
    if (!el || !guest?.name) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Small delay so the fade-in completes first
          setTimeout(() => setNameVisible(true), 300);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [guest?.name]);

  const displayName = guest?.name ?? null;

  return (
    <section
      id="invitation"
      aria-label="Invitation"
      style={{
        height: '100svh',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        
        justifyContent: 'center',
        paddingTop: 'clamp(15rem, 15vh, 8rem)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Full-viewport background photo */}
      <img
        src="/images/invitation-bg.png"
        alt=""
        role="presentation"
        loading="lazy"
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

      {/* Bottom scrim so the glass card stays readable over the sandy fade */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, transparent 45%, rgba(250,242,230,0.55) 75%, rgba(250,242,230,0.85) 100%)',
          zIndex: 1,
        }}
      />

      <Reveal style={{
        width: '100%',
        maxWidth: '500px',
        zIndex: 2,
        padding: '0 clamp(1.25rem, 5vw, 2rem)',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))',
      }}>
        <GlassPanel
          variant="light"
          radius="panel"
          style={{ padding: 'clamp(2rem, 6vw, 3rem) clamp(1.75rem, 5vw, 2.5rem)' }}
        >
          {/* Greeting */}
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1rem, 4vw, 1.3rem)',
              fontWeight: 400,
              fontStyle: 'italic',
              color: 'var(--color-forest-900)',
              lineHeight: 1.7,
            }}
          >
            <p style={{ margin: '0 0 1.2em' }}>
              Dear{' '}
              {displayName ? (
                <motion.span
                  ref={nameRef}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className={['gold-underline', nameVisible ? 'gold-underline--drawn' : ''].join(' ')}
                  style={{ color: 'var(--color-gold-500)', fontStyle: 'normal' }}
                >
                  {displayName}
                </motion.span>
              ) : (
                <span style={{ color: 'var(--color-sage-400)', fontStyle: 'normal' }}>Friend</span>
              )}
              ,
            </p>

            <p style={{ margin: '0 0 1em' }}>
              Together with our families, we invite you to share in the joy of our wedding.
            </p>

            <p style={{ margin: '0 0 1.2em' }}>
              Your presence is the greatest gift.
            </p>

            {guest && guest.seats > 1 && (
              <p
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.85rem',
                  fontStyle: 'normal',
                  letterSpacing: '0.05em',
                  color: 'var(--color-sage-400)',
                  margin: '0 0 1em',
                  borderTop: '1px solid rgba(138, 163, 150, 0.3)',
                  paddingTop: '1em',
                }}
              >
                We&rsquo;ve reserved {guest.seats} seats for you.
              </p>
            )}
          </div>

          {/* No-param fallback: name input */}
          {!displayName && (
            <div style={{ marginTop: '1.5rem' }}>
              <label
                htmlFor="guest-name-input"
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.65rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--color-sage-400)',
                  marginBottom: '0.5rem',
                }}
              >
                Your name
              </label>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <input
                  id="guest-name-input"
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && setName(inputValue)}
                  placeholder="Enter your name"
                  style={{
                    flex: 1,
                    fontFamily: 'var(--font-ui)',
                    fontSize: '0.95rem',
                    color: 'var(--color-ink-900)',
                    background: 'rgba(250, 247, 242, 0.6)',
                    border: '1px solid rgba(138, 163, 150, 0.4)',
                    borderRadius: '12px',
                    padding: '0.65rem 0.9rem',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setName(inputValue)}
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: '0.65rem',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    background: 'var(--color-gold-500)',
                    color: 'var(--color-cream-50)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0.65rem 1rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Set
                </button>
              </div>
            </div>
          )}

          {/* Signature */}
          <p
            style={{
              fontFamily: 'var(--font-script)',
              fontSize: 'clamp(1.4rem, 5vw, 2rem)',
              color: 'var(--color-gold-500)',
              margin: '1.8rem 0 0',
              textAlign: 'right',
              lineHeight: 1,
            }}
          >
            Mandakini &amp; Lakshitha
          </p>
        </GlassPanel>
      </Reveal>
    </section>
  );
}
