import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { GlassPanel } from '../glass/GlassPanel';
import { Reveal } from '../motion/Reveal';
import { useGuest } from '../../hooks/useGuest';

export function Invitation() {
  const { guest, loading, setName } = useGuest();
  const [inputValue, setInputValue]   = useState('');
  const [nameVisible, setNameVisible] = useState(false);
  const nameRef = useRef<HTMLParagraphElement>(null);

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
        paddingTop: 0,
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
          style={{ padding: 'clamp(2rem, 6vw, 3rem) clamp(1.75rem, 5vw, 2.5rem)', textAlign: 'center' }}
        >
          {/* Dear line */}
          <p style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'clamp(0.65rem, 2.2vw, 0.75rem)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--color-sage-400)',
            margin: '0 0 0.6rem',
          }}>
            Dear
          </p>

          {/* Guest name — large & highlighted */}
          {displayName ? (
            <motion.p
              ref={nameRef}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className={['gold-underline', nameVisible ? 'gold-underline--drawn' : ''].join(' ')}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2rem, 9vw, 3rem)',
                fontWeight: 600,
                fontStyle: 'normal',
                letterSpacing: '0.04em',
                color: 'var(--color-forest-700)',
                margin: '0 0 1.5rem',
                lineHeight: 1.15,
              }}
            >
              {displayName}
            </motion.p>
          ) : (
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 9vw, 3rem)',
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: 'rgba(138,163,150,0.45)',
              margin: '0 0 1.5rem',
              lineHeight: 1.15,
            }}>
              Friend
            </p>
          )}

          {/* Divider */}
          <div style={{
            width: 'clamp(2.5rem, 10vw, 4rem)',
            height: '1px',
            background: 'var(--color-gold-500)',
            opacity: 0.4,
            margin: '0 auto 1.5rem',
          }} />

          {/* Body text */}
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.05rem, 4vw, 1.25rem)',
            fontWeight: 400,
            fontStyle: 'italic',
            color: 'var(--color-forest-900)',
            lineHeight: 1.75,
          }}>
            <p style={{ margin: '0 0 0.9em' }}>
              Together with our families, we invite you to share in the joy of our wedding.
            </p>
            <p style={{ margin: 0 }}>
              Your presence is the greatest gift.
            </p>
          </div>

          {/* Reserved seats note */}
          {guest && guest.seats > 1 && (
            <p style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.82rem',
              fontStyle: 'normal',
              letterSpacing: '0.06em',
              color: 'var(--color-sage-400)',
              margin: '1.4rem 0 0',
              borderTop: '1px solid rgba(138, 163, 150, 0.25)',
              paddingTop: '1.1rem',
            }}>
              We&rsquo;ve reserved {guest.seats} seats for you.
            </p>
          )}

          {/* No-param fallback: name input (hidden while loading token) */}
          {!displayName && !loading && (
            <div style={{ marginTop: '1.5rem' }}>
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
                    textAlign: 'left',
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
          <p style={{
            fontFamily: 'var(--font-script)',
            fontSize: 'clamp(1.5rem, 5.5vw, 2.2rem)',
            color: 'var(--color-gold-500)',
            margin: '1.8rem 0 0',
            lineHeight: 1,
          }}>
            Mandakini &amp; Lakshitha
          </p>
        </GlassPanel>
      </Reveal>
    </section>
  );
}
