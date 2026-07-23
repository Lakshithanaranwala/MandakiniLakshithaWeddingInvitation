import { GlassPanel } from '../glass/GlassPanel';
import { GlassButton } from '../glass/GlassButton';
import { Reveal } from '../motion/Reveal';

// Ceremony: 10:28 AM Sri Lanka time (confirmed)
const MAPS_URL =
  'https://www.google.com/maps/search/Mandakini+Club+House+Divulapitiya+Sri+Lanka';


function CardHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontFamily: 'var(--font-ui)',
        fontSize: '0.65rem',
        fontWeight: 500,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: 'var(--color-gold-500)',
        margin: '0 0 0.9rem',
        textAlign: 'center',
      }}
    >
      {children}
    </h3>
  );
}

function CardBody({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(1rem, 3.5vw, 1.2rem)',
        fontWeight: 400,
        color: 'var(--color-forest-900)',
        lineHeight: 1.65,
        textAlign: 'center',
      }}
    >
      {children}
    </div>
  );
}

function Divider() {
  return (
    <hr
      style={{
        border: 'none',
        borderTop: '1px solid rgba(138, 163, 150, 0.25)',
        margin: '0.9rem 0',
      }}
    />
  );
}
export function Details() {
  return (
    <section
      id="details"
      aria-label="Wedding details"
      style={{
        background: 'var(--color-cream-50)',
        minHeight: '100svh',
        position: 'relative',
        overflow: 'hidden',
        padding: 'clamp(3rem, 8vw, 5rem) clamp(1.5rem, 5vw, 3rem)',
        paddingBottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))',
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(1rem, 3vw, 1.5rem)',
        maxWidth: '560px',
        margin: '0 auto',
      }}
    >
      {/* Section heading */}
      <Reveal>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 8vw, 3.5rem)',
            fontWeight: 300,
            color: 'var(--color-forest-700)',
            margin: '0 0 0.5rem',
            lineHeight: 1.1,
            textAlign: 'center',
          }}
        >
          The Details
        </h2>
      </Reveal>

      {/* Card 1 — When */}
      <Reveal delay={0.1}>
        <GlassPanel
          variant="light"
          radius="panel"
          style={{ padding: 'clamp(1.5rem, 4vw, 2rem)' }}
        >
          <CardHeading>When</CardHeading>
          <CardBody>
            <p style={{ margin: '0 0 0.3em', fontWeight: 500 }}>
              Friday, 11 September 2026
            </p>
            <Divider />
            <p style={{ margin: 0 }}>
              <span
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.65rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--color-sage-400)',
                }}
              >
                Poruwa ceremony
              </span>
              <br />
              9:27 AM
            </p>
          </CardBody>

        </GlassPanel>
      </Reveal>

      {/* Card 2 — Where */}
      <Reveal delay={0.2}>
        <GlassPanel
          variant="light"
          radius="panel"
          style={{ padding: 'clamp(1.5rem, 4vw, 2rem)' }}
        >
          <CardHeading>Where</CardHeading>
          <CardBody>
            <p style={{ margin: '0 0 0.25em', fontWeight: 500 }}>
              Mandakini Club House
            </p>
            <p style={{ margin: 0, color: 'var(--color-sage-400)' }}>
              Divulapitiya, Sri Lanka
            </p>
          </CardBody>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <GlassButton
              variant="light"
              onClick={() => window.open(MAPS_URL, '_blank', 'noopener,noreferrer')}
              aria-label="Open venue in Google Maps"
            >
              Open in Maps
            </GlassButton>
          </div>
        </GlassPanel>
      </Reveal>

      {/* Footer botanical */}
      <div
        aria-hidden="true"
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '2rem 0 0',
          opacity: 0.18,
        }}
      >
        <svg width="200" height="80" viewBox="0 0 200 80" fill="none">
          <path d="M100 78 C80 50 30 40 10 10 C60 25 90 50 100 78Z" fill="#2E5248"/>
          <path d="M100 78 C120 50 170 40 190 10 C140 25 110 50 100 78Z" fill="#2E5248"/>
          <path d="M100 5 L100 78" stroke="#8AA396" strokeWidth="1" strokeLinecap="round"/>
        </svg>
      </div>
    </section>
  );
}
