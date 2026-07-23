import { GlassPanel } from '../glass/GlassPanel';

interface RsvpDockProps {
  onOpen: () => void;
}

export function RsvpDock({ onOpen }: RsvpDockProps) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '88%',
        maxWidth: '400px',
        zIndex: 200,
      }}
    >
      <GlassPanel variant="gold" radius="pill" style={{ padding: 0 }}>
        <button
          type="button"
          onClick={onOpen}
          aria-label="Open RSVP form"
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
        </button>
      </GlassPanel>
    </div>
  );
}
