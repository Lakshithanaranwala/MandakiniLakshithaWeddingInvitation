import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, type GuestRow, type RsvpRow } from '../lib/supabase';
import { logout } from '../lib/auth';

const SITE_URL = 'https://mandakini-lakshitha-wedding-invitat.vercel.app';

function buildWhatsAppUrl(guest: GuestRow): string {
  const link = `${SITE_URL}/?guest=${guest.token}`;
  const msg = [
    `Dear ${guest.name},`,
    ``,
    `With joyful hearts, we warmly invite you to celebrate one of the most special days of our lives as we begin our new chapter together. Your presence would make our wedding celebration even more meaningful.`,
    ``,
    `View your invitation & RSVP here:`,
    link,
    ``,
    `With love,`,
    `Mandakini & Lakshitha`
  ].join('\n');
  const phone = guest.phone.replace(/\D/g, '');
  const url   = new URL(`https://wa.me/${phone}`);
  url.searchParams.set('text', msg);
  return url.toString();
}

export function AdminDashboard() {
  const navigate = useNavigate();

  const [guests,  setGuests]  = useState<GuestRow[]>([]);
  const [rsvps,   setRsvps]   = useState<RsvpRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState<string | null>(null);

  // Hard reset
  const [resetOpen,     setResetOpen]     = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetError,    setResetError]    = useState('');
  const [resetting,     setResetting]     = useState(false);

  // Add guest form state
  const [newName,  setNewName]  = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newSeats, setNewSeats] = useState(2);
  const [adding,   setAdding]   = useState(false);

  async function load() {
    const [{ data: g }, { data: r }] = await Promise.all([
      supabase.from('guests').select('*').order('created_at', { ascending: false }),
      supabase.from('rsvps').select('*').order('submitted_at', { ascending: false }),
    ]);
    setGuests(g ?? []);
    setRsvps(r ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addGuest(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;
    setAdding(true);
    await supabase.from('guests').insert({
      name:  newName.trim(),
      phone: newPhone.trim(),
      seats: newSeats,
    });
    setNewName('');
    setNewPhone('');
    setNewSeats(2);
    setAdding(false);
    load();
  }

  async function deleteGuest(id: string, name: string) {
    if (!confirm(`Remove ${name} from the guest list?`)) return;
    await supabase.from('guests').delete().eq('id', id);
    load();
  }

  async function hardReset() {
    const validPass = import.meta.env.VITE_ADMIN_PASSWORD;
    if (resetPassword !== validPass) {
      setResetError('Incorrect password.');
      return;
    }
    setResetting(true);
    await supabase.from('rsvps').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('guests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    setResetting(false);
    setResetOpen(false);
    setResetPassword('');
    setResetError('');
    load();
  }

  function copyLink(token: string) {
    const link = `${SITE_URL}/?guest=${token}`;
    navigator.clipboard.writeText(link);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleLogout() {
    logout();
    navigate('/admin/login');
  }

  // Stats
  const rsvpByGuest = new Map(rsvps.map((r) => [r.guest_id, r]));
  const accepted = rsvps.filter((r) => r.attendance === 'accept').length;
  const declined = rsvps.filter((r) => r.attendance === 'decline').length;
  const pending  = guests.length - rsvpByGuest.size;

  return (
    <div style={{ minHeight: '100svh', background: '#f4f1ec', fontFamily: 'var(--font-ui)' }}>

      {/* ── Header ── */}
      <header style={{
        background: 'var(--color-forest-700)',
        padding: '1rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
      }}>
        <div>
          <p style={{ margin: 0, fontFamily: 'var(--font-script)', fontSize: '1.5rem', color: 'var(--color-gold-500)', lineHeight: 1.2 }}>
            Mandakini & Lakshitha
          </p>
          <p style={{ margin: 0, fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
            Wedding Admin
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => { setResetOpen(true); setResetPassword(''); setResetError(''); }} style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.68rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            background: 'rgba(220,53,53,0.18)',
            color: '#ff8a80',
            border: '1px solid rgba(220,53,53,0.35)',
            borderRadius: '8px',
            padding: '0.45rem 0.9rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}>
            Hard reset
          </button>
          <button onClick={handleLogout} style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.68rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            background: 'rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.85)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: '8px',
            padding: '0.45rem 0.9rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}>
            Sign out
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '1.5rem 1rem 5rem' }}>

        {/* ── Stats ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.75rem',
          marginBottom: '1.75rem',
        }}>
          {[
            { label: 'Invited',  value: guests.length, color: 'var(--color-forest-700)' },
            { label: 'Pending',  value: pending,        color: '#9a7b00' },
            { label: 'Accepted', value: accepted,       color: '#2e7d32' },
            { label: 'Declined', value: declined,       color: '#b71c1c' },
          ].map((s) => (
            <div key={s.label} style={{
              background: 'white',
              borderRadius: '14px',
              padding: '1rem 0.75rem',
              textAlign: 'center',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}>
              <p style={{ margin: '0 0 0.2rem', fontFamily: 'var(--font-display)', fontSize: '2rem', color: s.color, lineHeight: 1 }}>
                {loading ? '–' : s.value}
              </p>
              <p style={{ margin: 0, fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#aaa' }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Add Guest ── */}
        <section style={cardStyle}>
          <h2 style={sectionHeading}>Add Guest</h2>
          <form onSubmit={addGuest} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '2 1 160px' }}>
              <label style={labelStyle}>Full name</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Priya Fernando"
                required
                style={inputStyle}
              />
            </div>
            <div style={{ flex: '2 1 150px' }}>
              <label style={labelStyle}>Phone (WhatsApp)</label>
              <input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+94 77 123 4567"
                required
                style={inputStyle}
              />
            </div>
            <div style={{ flex: '0 1 90px' }}>
              <label style={labelStyle}>Seats</label>
              <input
                type="number"
                min={1}
                max={20}
                value={newSeats}
                onChange={(e) => setNewSeats(Number(e.target.value))}
                style={inputStyle}
              />
            </div>
            <button type="submit" disabled={adding} style={addBtnStyle}>
              {adding ? 'Adding…' : '+ Add'}
            </button>
          </form>
        </section>

        {/* ── Guest List ── */}
        <section style={cardStyle}>
          <h2 style={sectionHeading}>Guest List ({guests.length})</h2>
          {loading ? (
            <p style={emptyStyle}>Loading…</p>
          ) : guests.length === 0 ? (
            <p style={emptyStyle}>No guests yet. Add one above.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    {['Name', 'Phone', 'Seats', 'RSVP status', 'Actions'].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {guests.map((g, i) => {
                    const rsvp = rsvpByGuest.get(g.id);
                    return (
                      <tr key={g.id} style={{ background: i % 2 === 0 ? 'white' : '#faf8f4' }}>
                        <td style={tdStyle}><strong>{g.name}</strong></td>
                        <td style={{ ...tdStyle, color: '#888' }}>{g.phone}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>{g.seats}</td>
                        <td style={tdStyle}>
                          {rsvp ? (
                            <span style={{
                              display: 'inline-block',
                              padding: '0.2rem 0.65rem',
                              borderRadius: '999px',
                              fontSize: '0.68rem',
                              fontWeight: 500,
                              letterSpacing: '0.06em',
                              textTransform: 'uppercase',
                              background: rsvp.attendance === 'accept' ? '#e8f5e9' : '#fdecea',
                              color:      rsvp.attendance === 'accept' ? '#2e7d32' : '#b71c1c',
                            }}>
                              {rsvp.attendance === 'accept' ? `Accepted · ${rsvp.guest_count ?? 1}` : 'Declined'}
                            </span>
                          ) : (
                            <span style={{ color: '#ccc', fontSize: '0.75rem' }}>Pending</span>
                          )}
                        </td>
                        <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                          <a
                            href={buildWhatsAppUrl(g)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ ...waBtn, textDecoration: 'none', display: 'inline-block' }}
                          >
                            WhatsApp
                          </a>
                          <button
                            onClick={() => copyLink(g.token)}
                            style={{ ...copyBtn, background: copied === g.token ? '#e8f5e9' : '#f0ece6', color: copied === g.token ? '#2e7d32' : '#555' }}
                          >
                            {copied === g.token ? 'Copied!' : 'Copy link'}
                          </button>
                          <button
                            onClick={() => deleteGuest(g.id, g.name)}
                            style={delBtn}
                            aria-label={`Remove ${g.name}`}
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── RSVP Responses ── */}
        <section style={cardStyle}>
          <h2 style={sectionHeading}>RSVP Responses ({rsvps.length})</h2>
          {loading ? (
            <p style={emptyStyle}>Loading…</p>
          ) : rsvps.length === 0 ? (
            <p style={emptyStyle}>No responses yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    {['Name', 'Attendance', 'Guests', 'Message', 'Date'].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rsvps.map((r, i) => (
                    <tr key={r.id} style={{ background: i % 2 === 0 ? 'white' : '#faf8f4' }}>
                      <td style={tdStyle}><strong>{r.name}</strong></td>
                      <td style={tdStyle}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.65rem',
                          borderRadius: '999px',
                          fontSize: '0.68rem',
                          fontWeight: 500,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          background: r.attendance === 'accept' ? '#e8f5e9' : '#fdecea',
                          color:      r.attendance === 'accept' ? '#2e7d32' : '#b71c1c',
                        }}>
                          {r.attendance === 'accept' ? 'Accepted' : 'Declined'}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{r.guest_count ?? '—'}</td>
                      <td style={{ ...tdStyle, maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#666' }}>
                        {r.message || <span style={{ color: '#ccc' }}>—</span>}
                      </td>
                      <td style={{ ...tdStyle, color: '#aaa', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {new Date(r.submitted_at).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </main>

      {/* ── Hard Reset Modal ── */}
      {resetOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '1.5rem',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '18px',
            padding: '2rem',
            width: '100%',
            maxWidth: '380px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <h2 style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '1rem',
              fontWeight: 600,
              color: '#b71c1c',
              margin: '0 0 0.5rem',
            }}>
              Hard Reset
            </h2>
            <p style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.85rem',
              color: '#666',
              margin: '0 0 1.5rem',
              lineHeight: 1.5,
            }}>
              This will permanently delete <strong>all guests and RSVP responses</strong>. This cannot be undone. Enter your password to confirm.
            </p>

            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={resetPassword}
              onChange={(e) => { setResetPassword(e.target.value); setResetError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && hardReset()}
              autoFocus
              placeholder="Enter your password"
              style={{ ...inputStyle, marginBottom: '0.75rem' }}
            />

            {resetError && (
              <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.82rem', color: '#b71c1c', margin: '0 0 0.75rem' }}>
                {resetError}
              </p>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => { setResetOpen(false); setResetPassword(''); setResetError(''); }}
                style={{
                  flex: 1,
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.78rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  background: '#f0ece6',
                  color: '#555',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={hardReset}
                disabled={resetting}
                style={{
                  flex: 1,
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  background: '#b71c1c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  cursor: resetting ? 'not-allowed' : 'pointer',
                  opacity: resetting ? 0.7 : 1,
                }}
              >
                {resetting ? 'Deleting…' : 'Delete all'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: '16px',
  padding: '1.5rem',
  marginBottom: '1.25rem',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};

const sectionHeading: React.CSSProperties = {
  fontFamily: 'var(--font-ui)',
  fontSize: '0.62rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'var(--color-sage-400)',
  margin: '0 0 1.1rem',
  fontWeight: 500,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-ui)',
  fontSize: '0.6rem',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: '#aaa',
  marginBottom: '0.35rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  fontFamily: 'var(--font-ui)',
  fontSize: '0.9rem',
  color: '#222',
  background: '#f8f6f2',
  border: '1px solid rgba(138,163,150,0.3)',
  borderRadius: '10px',
  padding: '0.65rem 0.85rem',
  outline: 'none',
  boxSizing: 'border-box',
};

const addBtnStyle: React.CSSProperties = {
  fontFamily: 'var(--font-ui)',
  fontSize: '0.72rem',
  fontWeight: 500,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  background: 'var(--color-forest-700)',
  color: 'white',
  border: 'none',
  borderRadius: '10px',
  padding: '0.65rem 1.25rem',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  alignSelf: 'flex-end',
};

const thStyle: React.CSSProperties = {
  fontFamily: 'var(--font-ui)',
  fontSize: '0.58rem',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: '#bbb',
  fontWeight: 500,
  padding: '0.5rem 0.85rem',
  textAlign: 'left',
  borderBottom: '2px solid #f0ece6',
};

const tdStyle: React.CSSProperties = {
  padding: '0.75rem 0.85rem',
  borderBottom: '1px solid #f4f1ec',
  color: '#333',
  verticalAlign: 'middle',
};

const emptyStyle: React.CSSProperties = {
  fontFamily: 'var(--font-ui)',
  fontSize: '0.85rem',
  color: '#bbb',
  margin: 0,
};

const waBtn: React.CSSProperties = {
  fontFamily: 'var(--font-ui)',
  fontSize: '0.65rem',
  fontWeight: 500,
  background: '#25d366',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  padding: '0.32rem 0.65rem',
  cursor: 'pointer',
  marginRight: '0.4rem',
};

const copyBtn: React.CSSProperties = {
  fontFamily: 'var(--font-ui)',
  fontSize: '0.65rem',
  fontWeight: 500,
  border: 'none',
  borderRadius: '6px',
  padding: '0.32rem 0.65rem',
  cursor: 'pointer',
  marginRight: '0.4rem',
  transition: 'background 200ms, color 200ms',
};

const delBtn: React.CSSProperties = {
  fontFamily: 'var(--font-ui)',
  fontSize: '1rem',
  background: 'none',
  color: '#e53935',
  border: 'none',
  cursor: 'pointer',
  padding: '0.2rem 0.4rem',
  borderRadius: '4px',
  lineHeight: 1,
};
