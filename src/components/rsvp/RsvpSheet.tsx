import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { GlassPanel } from '../glass/GlassPanel';
import { GlassButton } from '../glass/GlassButton';
import { useGuest } from '../../hooks/useGuest';
import { supabase } from '../../lib/supabase';

type Attendance = 'accept' | 'decline' | null;
type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

interface RsvpSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RsvpSheet({ isOpen, onClose }: RsvpSheetProps) {
  const { guest } = useGuest();

  const [name,       setName]       = useState(guest?.name ?? '');
  const [attendance, setAttendance] = useState<Attendance>(null);
  const [guestCount, setGuestCount] = useState(1);
  const [message,    setMessage]    = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');

  const sheetRef     = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLInputElement>(null);

  // Sync name when guest resolves
  useEffect(() => {
    if (guest?.name && !name) setName(guest.name);
  }, [guest?.name]);

  // Scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('scroll-locked');
    } else {
      document.body.classList.remove('scroll-locked');
    }
    return () => document.body.classList.remove('scroll-locked');
  }, [isOpen]);

  // Focus trap & Esc to close
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return; }

      if (e.key === 'Tab' && sheetRef.current) {
        const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
          'input, textarea, button, select, [tabindex]:not([tabindex="-1"])'
        );
        const list  = Array.from(focusable).filter((el) => !el.hasAttribute('disabled'));
        const first = list[0];
        const last  = list[list.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const maxGuests = guest?.seats ?? 6;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!attendance) return;
    setSubmitState('submitting');

    try {
      const { error } = await supabase.from('rsvps').insert({
        guest_id:    guest?.id   || null,
        name,
        attendance,
        guest_count: attendance === 'accept' ? guestCount : null,
        message:     message.trim() || null,
      });
      if (error) throw error;
      setSubmitState('success');
    } catch {
      setSubmitState('error');
    }
  }

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Scrim */}
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(22, 39, 31, 0.4)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 49,
            }}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label="RSVP form"
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={(_e, info) => {
              if (info.velocity.y > 400 || info.offset.y > 160) onClose();
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 50,
              maxHeight: '92vh',
              overflowY: 'auto',
              borderRadius: '28px 28px 0 0',
              touchAction: 'pan-y',
            }}
          >
            <GlassPanel
              variant="light"
              radius="panel"
              style={{
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                padding: '0 0 calc(2rem + env(safe-area-inset-bottom, 0px))',
                minHeight: '50vh',
              }}
            >
              {/* Drag handle */}
              <div
                aria-hidden="true"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '0.75rem 0 0.5rem',
                }}
              >
                <div
                  style={{
                    width: '2.5rem',
                    height: '4px',
                    borderRadius: '9999px',
                    background: 'rgba(138, 163, 150, 0.45)',
                  }}
                />
              </div>

              <div style={{ padding: '0.5rem 1.75rem 0' }}>
                <AnimatePresence mode="wait">
                  {submitState === 'success' ? (
                    <SuccessView key="success" attendance={attendance} onClose={onClose} />
                  ) : (
                    <motion.form
                      key="form"
                      onSubmit={handleSubmit}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
                    >
                      <h2
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 'clamp(1.6rem, 6vw, 2.2rem)',
                          fontWeight: 300,
                          color: 'var(--color-forest-900)',
                          margin: '0 0 0.25rem',
                        }}
                      >
                        Will you join us?
                      </h2>

                      {/* Name */}
                      <FieldGroup label="Your name">
                        <input
                          ref={firstFocusRef}
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          placeholder="Full name"
                          style={inputStyle}
                        />
                      </FieldGroup>

                      {/* Attendance toggle */}
                      <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                        <legend style={legendStyle}>Attendance</legend>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          <AttendanceToggle
                            label="Joyfully accept"
                            selected={attendance === 'accept'}
                            onSelect={() => setAttendance('accept')}
                          />
                          <AttendanceToggle
                            label="Regretfully decline"
                            selected={attendance === 'decline'}
                            onSelect={() => setAttendance('decline')}
                          />
                        </div>
                      </fieldset>

                      {/* Guest count */}
                      {attendance === 'accept' && (
                        <FieldGroup label={`Number of guests (max ${maxGuests})`}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button
                              type="button"
                              aria-label="Decrease guest count"
                              onClick={() => setGuestCount((c) => Math.max(1, c - 1))}
                              style={stepperButtonStyle}
                            >
                              −
                            </button>
                            <span
                              aria-live="polite"
                              style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '1.5rem',
                                color: 'var(--color-forest-900)',
                                minWidth: '1.5rem',
                                textAlign: 'center',
                              }}
                            >
                              {guestCount}
                            </span>
                            <button
                              type="button"
                              aria-label="Increase guest count"
                              onClick={() => setGuestCount((c) => Math.min(maxGuests, c + 1))}
                              style={stepperButtonStyle}
                            >
                              +
                            </button>
                          </div>
                        </FieldGroup>
                      )}

                      {/* Message */}
                      <FieldGroup label="Message to the couple (optional)">
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="A note for Mandakini & Lakshitha…"
                          rows={3}
                          style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
                        />
                      </FieldGroup>

                      {/* Error */}
                      {submitState === 'error' && (
                        <p
                          role="alert"
                          style={{
                            fontFamily: 'var(--font-ui)',
                            fontSize: '0.85rem',
                            color: '#c0392b',
                            margin: 0,
                          }}
                        >
                          Couldn&rsquo;t send that. Check your connection and try again.
                        </p>
                      )}

                      {/* Submit */}
                      <GlassButton
                        type="submit"
                        variant="dark"
                        disabled={!attendance || submitState === 'submitting'}
                        className="w-full"
                      >
                        {submitState === 'submitting' ? 'Sending…' : 'Send RSVP'}
                      </GlassButton>

                      {submitState === 'error' && (
                        <GlassButton
                          type="submit"
                          variant="light"
                          onClick={() => setSubmitState('idle')}
                        >
                          Try again
                        </GlassButton>
                      )}
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </GlassPanel>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <label style={legendStyle}>{label}</label>
      {children}
    </div>
  );
}

function AttendanceToggle({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      whileTap={{ scale: 0.97 }}
      className={['glass', selected ? 'glass--dark' : 'glass--light', 'glass--panel'].join(' ')}
      style={{
        flex: 1,
        padding: '0.9rem 0.5rem',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.75rem',
        fontWeight: selected ? 500 : 400,
        letterSpacing: '0.05em',
        color: selected ? 'var(--color-cream-50)' : 'var(--color-forest-700)',
        border: selected ? '1px solid rgba(255,255,255,0.32)' : '1px solid rgba(138, 163, 150, 0.3)',
        cursor: 'pointer',
        transition: 'color 200ms, background 200ms',
        textAlign: 'center',
      }}
    >
      {label}
    </motion.button>
  );
}

function SuccessView({ attendance, onClose }: { attendance: Attendance; onClose: () => void }) {
  const accepted = attendance === 'accept';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '2rem 0 1rem',
        gap: '1.25rem',
      }}
    >
      {/* Drawn check mark */}
      <motion.svg
        width="56"
        height="56"
        viewBox="0 0 56 56"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="28" cy="28" r="27" stroke="var(--color-gold-500)" strokeWidth="1.5" />
        <motion.path
          d="M16 28L24 36L40 20"
          stroke="var(--color-gold-500)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </motion.svg>

      <div>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.4rem, 5vw, 1.8rem)',
            fontWeight: 300,
            color: 'var(--color-forest-900)',
            margin: '0 0 0.5em',
          }}
        >
          {accepted ? 'We can\u2019t wait to see you.' : 'We\u2019ll miss you dearly.'}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.85rem',
            color: 'var(--color-sage-400)',
            margin: 0,
            letterSpacing: '0.05em',
          }}
        >
          {accepted
            ? 'Your RSVP has been received.'
            : 'Thank you for letting us know.'}
        </p>
      </div>

      <GlassButton variant="light" onClick={onClose}>
        Close
      </GlassButton>
    </motion.div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--font-ui)',
  fontSize: '0.95rem',
  color: 'var(--color-ink-900)',
  background: 'rgba(250, 247, 242, 0.6)',
  border: '1px solid rgba(138, 163, 150, 0.35)',
  borderRadius: '14px',
  padding: '0.75rem 1rem',
  outline: 'none',
  width: '100%',
};

const legendStyle: React.CSSProperties = {
  fontFamily: 'var(--font-ui)',
  fontSize: '0.65rem',
  fontWeight: 400,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--color-sage-400)',
  display: 'block',
  marginBottom: '0.4rem',
};

const stepperButtonStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.4rem',
  color: 'var(--color-forest-700)',
  background: 'rgba(138, 163, 150, 0.15)',
  border: '1px solid rgba(138, 163, 150, 0.3)',
  borderRadius: '50%',
  width: '2.2rem',
  height: '2.2rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 1,
};
