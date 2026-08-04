import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, type GuestRow, type RsvpRow, type LinkViewRow } from '../lib/supabase';
import { logout } from '../lib/auth';

const SITE_URL = 'https://mandakini-lakshitha-wedding-invitat.vercel.app';

function buildWhatsAppUrl(guest: GuestRow): string {
  const link = `${SITE_URL}/?guest=${guest.token}`;
  const msg = [
    `Dear ${guest.name},`,
    ``,
    `Together with our families, we joyfully invite you to witness the start of our new journey.`,
    `Your presence will make our special day truly unforgettable.`,
    `Friday, 11 September 2026`,
    `Mandakini Club House, Divulapitiya, Sri Lanka`,
    ``,
    `Your invitation:`,
    link,
    ``,
    `We would truly appreciate it if you could kindly RSVP by 21st August, 2026 on the invitation `,
    ``,
    `With love,`,
    `Mandakini & Lakshitha`
  ].join('\n');
  const phone = guest.phone.replace(/\D/g, '');
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

export function AdminDashboard() {
  const navigate = useNavigate();

  const [guests,  setGuests]  = useState<GuestRow[]>([]);
  const [rsvps,   setRsvps]   = useState<RsvpRow[]>([]);
  const [views,   setViews]   = useState<LinkViewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState<string | null>(null);
  const [filter,     setFilter]     = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');
  const [activeTab,  setActiveTab]  = useState<'guests' | 'rsvps'>('guests');

  // Guest detail modal
  const [selectedGuest,    setSelectedGuest]    = useState<GuestRow | null>(null);
  const [showRsvpForm,     setShowRsvpForm]     = useState(false);
  const [manualAttendance, setManualAttendance] = useState<'accept' | 'decline'>('accept');
  const [manualSeatCount,  setManualSeatCount]  = useState(1);
  const [manualMessage,    setManualMessage]    = useState('');
  const [manualPassword,   setManualPassword]   = useState('');
  const [manualError,      setManualError]      = useState('');
  const [manualSaving,     setManualSaving]     = useState(false);

  // RSVP detail modal
  const [selectedRsvp,    setSelectedRsvp]    = useState<RsvpRow | null>(null);
  const [editGuestCount,  setEditGuestCount]  = useState<number>(1);
  const [saving,          setSaving]          = useState(false);

  // Delete guest confirmation
  const [deleteGuestTarget,   setDeleteGuestTarget]   = useState<GuestRow | null>(null);
  const [deleteGuestPassword, setDeleteGuestPassword] = useState('');
  const [deleteGuestError,    setDeleteGuestError]    = useState('');
  const [deletingGuest,       setDeletingGuest]       = useState(false);

  // Delete RSVP confirmation
  const [deleteRsvpTarget,   setDeleteRsvpTarget]   = useState<RsvpRow | null>(null);
  const [deleteRsvpPassword, setDeleteRsvpPassword] = useState('');
  const [deleteRsvpError,    setDeleteRsvpError]    = useState('');
  const [deletingRsvp,       setDeletingRsvp]       = useState(false);

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
    const [{ data: g }, { data: r }, { data: v }] = await Promise.all([
      supabase.from('guests').select('*').order('created_at', { ascending: false }),
      supabase.from('rsvps').select('*').order('submitted_at', { ascending: false }),
      supabase.from('link_views').select('*'),
    ]);
    setGuests(g ?? []);
    setRsvps(r ?? []);
    setViews(v ?? []);
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

  async function confirmDeleteGuest() {
    if (!deleteGuestTarget) return;
    if (deleteGuestPassword !== import.meta.env.VITE_ADMIN_PASSWORD) {
      setDeleteGuestError('Incorrect password.');
      return;
    }
    setDeletingGuest(true);
    await supabase.from('guests').delete().eq('id', deleteGuestTarget.id);
    setDeletingGuest(false);
    setDeleteGuestTarget(null);
    setDeleteGuestPassword('');
    setDeleteGuestError('');
    load();
  }

  async function confirmDeleteRsvp() {
    if (!deleteRsvpTarget) return;
    if (deleteRsvpPassword !== import.meta.env.VITE_ADMIN_PASSWORD) {
      setDeleteRsvpError('Incorrect password.');
      return;
    }
    setDeletingRsvp(true);
    await supabase.from('rsvps').delete().eq('id', deleteRsvpTarget.id);
    setDeletingRsvp(false);
    setDeleteRsvpTarget(null);
    setDeleteRsvpPassword('');
    setDeleteRsvpError('');
    load();
  }

  function openGuestModal(g: GuestRow) {
    const existingRsvp = rsvpByGuest.get(g.id);
    setSelectedGuest(g);
    setShowRsvpForm(false);
    setManualAttendance(existingRsvp?.attendance ?? 'accept');
    setManualSeatCount(existingRsvp?.guest_count ?? g.seats);
    setManualMessage(existingRsvp?.message ?? '');
    setManualPassword('');
    setManualError('');
  }

  async function submitManualRsvp() {
    if (!selectedGuest) return;
    if (manualPassword !== import.meta.env.VITE_ADMIN_PASSWORD) {
      setManualError('Incorrect password.');
      return;
    }
    setManualSaving(true);
    const existingRsvp = rsvpByGuest.get(selectedGuest.id);
    const payload = {
      guest_id:    selectedGuest.id,
      name:        selectedGuest.name,
      attendance:  manualAttendance,
      guest_count: manualAttendance === 'accept' ? manualSeatCount : null,
      message:     manualMessage.trim() || null,
      submitted_at: new Date().toISOString(),
    };
    if (existingRsvp) {
      await supabase.from('rsvps').update(payload).eq('id', existingRsvp.id);
    } else {
      await supabase.from('rsvps').insert(payload);
    }
    setManualSaving(false);
    setSelectedGuest(null);
    setShowRsvpForm(false);
    load();
  }

  function openRsvpModal(r: RsvpRow) {
    setSelectedRsvp(r);
    setEditGuestCount(r.guest_count ?? 1);
  }

  function closeRsvpModal() {
    setSelectedRsvp(null);
    setSaving(false);
  }

  async function saveGuestCount() {
    if (!selectedRsvp) return;
    setSaving(true);
    await supabase.from('rsvps').update({ guest_count: editGuestCount }).eq('id', selectedRsvp.id);
    setSaving(false);
    closeRsvpModal();
    load();
  }

  async function hardReset() {
    const validPass = import.meta.env.VITE_ADMIN_PASSWORD;
    if (resetPassword !== validPass) {
      setResetError('Incorrect password.');
      return;
    }
    setResetting(true);
    await supabase.from('link_views').delete().neq('id', '00000000-0000-0000-0000-000000000000');
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
  const guestById   = new Map(guests.map((g) => [g.id, g]));
  const accepted       = rsvps.filter((r) => r.attendance === 'accept').length;
  const declined       = rsvps.filter((r) => r.attendance === 'decline').length;
  const pending        = guests.length - rsvpByGuest.size;
  const confirmedSeats = rsvps
    .filter((r) => r.attendance === 'accept')
    .reduce((sum, r) => sum + (r.guest_count ?? 1), 0);
  const declinedSeats = rsvps
    .filter((r) => r.attendance === 'decline')
    .reduce((sum, r) => sum + (r.guest_id ? (guestById.get(r.guest_id)?.seats ?? 0) : 0), 0);

  // Per-guest view stats
  const viewsByGuest = new Map<string, { count: number; lastSeen: string }>();
  for (const v of views) {
    const existing = viewsByGuest.get(v.guest_id);
    if (!existing) {
      viewsByGuest.set(v.guest_id, { count: 1, lastSeen: v.viewed_at });
    } else {
      existing.count++;
      if (v.viewed_at > existing.lastSeen) existing.lastSeen = v.viewed_at;
    }
  }

  // Filtered guest list
  const filteredGuests = guests.filter((g) => {
    const rsvp = rsvpByGuest.get(g.id);
    if (filter === 'pending')  return !rsvp;
    if (filter === 'accepted') return rsvp?.attendance === 'accept';
    if (filter === 'declined') return rsvp?.attendance === 'decline';
    return true;
  });

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
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '0.75rem',
          marginBottom: '1.75rem',
        }}>
          {([
            { label: 'Invited',  value: guests.length,  color: 'var(--color-forest-700)', key: 'all'      },
            { label: 'Pending',  value: pending,         color: '#9a7b00',                key: 'pending'  },
            { label: 'Accepted', value: accepted,        color: '#2e7d32',                key: 'accepted' },
            { label: 'Declined', value: declined,        color: '#b71c1c',                key: 'declined' },
            { label: 'Seats confirmed', value: confirmedSeats, color: '#1565c0',          key: null       },
            { label: 'Seats declined', value: declinedSeats,  color: '#b71c1c',           key: null       },
          ] as const).map((s) => {
            const active = s.key !== null && filter === s.key;
            return (
              <button
                key={s.label}
                onClick={() => s.key !== null && setFilter(s.key)}
                style={{
                  background: active ? s.color : 'white',
                  borderRadius: '14px',
                  padding: '1rem 0.75rem',
                  textAlign: 'center',
                  boxShadow: active ? `0 4px 12px ${s.color}40` : '0 1px 4px rgba(0,0,0,0.06)',
                  border: active ? `2px solid ${s.color}` : '2px solid transparent',
                  cursor: s.key !== null ? 'pointer' : 'default',
                  transition: 'all 180ms ease',
                  width: '100%',
                }}
              >
                <p style={{ margin: '0 0 0.2rem', fontFamily: 'var(--font-display)', fontSize: '2rem', color: active ? 'white' : s.color, lineHeight: 1 }}>
                  {loading ? '–' : s.value}
                </p>
                <p style={{ margin: 0, fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: active ? 'rgba(255,255,255,0.8)' : '#aaa' }}>
                  {s.label}
                </p>
              </button>
            );
          })}
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {([
            { key: 'guests', label: `All Guests (${guests.length})` },
            { key: 'rsvps',  label: `RSVP Responses (${rsvps.length})` },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.72rem',
                fontWeight: activeTab === tab.key ? 600 : 400,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                background: activeTab === tab.key ? 'var(--color-forest-700)' : 'white',
                color: activeTab === tab.key ? 'white' : '#888',
                border: activeTab === tab.key ? '2px solid var(--color-forest-700)' : '2px solid #e8e4de',
                borderRadius: '10px',
                padding: '0.6rem 1.25rem',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Add Guest ── */}
        {activeTab === 'guests' && <section style={cardStyle}>
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
        </section>}

        {/* ── Guest List ── */}
        {activeTab === 'guests' && <section style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem' }}>
            <h2 style={{ ...sectionHeading, margin: 0 }}>
              {filter === 'all' ? 'All Guests' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              {' '}({filteredGuests.length})
            </h2>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                style={{ fontFamily: 'var(--font-ui)', fontSize: '0.65rem', letterSpacing: '0.1em', background: 'none', border: 'none', color: 'var(--color-sage-400)', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Clear filter
              </button>
            )}
          </div>
          {loading ? (
            <p style={emptyStyle}>Loading…</p>
          ) : guests.length === 0 ? (
            <p style={emptyStyle}>No guests yet. Add one above.</p>
          ) : filteredGuests.length === 0 ? (
            <p style={emptyStyle}>No {filter} guests.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    {['Name', 'Phone', 'Seats', 'RSVP status', 'Views', 'Last opened', 'Actions'].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredGuests.map((g, i) => {
                    const rsvp = rsvpByGuest.get(g.id);
                    return (
                      <tr key={g.id} onClick={() => openGuestModal(g)} style={{ background: i % 2 === 0 ? 'white' : '#faf8f4', cursor: 'pointer' }}>
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
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          {viewsByGuest.get(g.id)
                            ? <span style={{ fontWeight: 500, color: '#1565c0' }}>{viewsByGuest.get(g.id)!.count}</span>
                            : <span style={{ color: '#ccc' }}>0</span>
                          }
                        </td>
                        <td style={{ ...tdStyle, fontSize: '0.75rem', color: '#888', whiteSpace: 'nowrap' }}>
                          {viewsByGuest.get(g.id)
                            ? new Date(viewsByGuest.get(g.id)!.lastSeen).toLocaleString('en-GB', {
                                day: 'numeric', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })
                            : <span style={{ color: '#ccc' }}>—</span>
                          }
                        </td>
                        <td style={{ ...tdStyle, whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
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
                            onClick={() => { setDeleteGuestTarget(g); setDeleteGuestPassword(''); setDeleteGuestError(''); }}
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
        </section>}

        {/* ── RSVP Responses ── */}
        {activeTab === 'rsvps' && <section style={cardStyle}>
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
                    {['Name', 'Attendance', 'Allocated', 'Confirmed', 'Message', 'Date', ''].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rsvps.map((r, i) => (
                    <tr
                      key={r.id}
                      onClick={() => openRsvpModal(r)}
                      style={{ background: i % 2 === 0 ? 'white' : '#faf8f4', cursor: 'pointer' }}
                    >
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
                      <td style={{ ...tdStyle, textAlign: 'center', color: '#888' }}>
                        {guestById.get(r.guest_id ?? '')?.seats ?? '—'}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        {r.attendance === 'accept' ? (
                          (() => {
                            const allocated = guestById.get(r.guest_id ?? '')?.seats;
                            const confirmed = r.guest_count ?? 1;
                            const under = allocated !== undefined && confirmed < allocated;
                            return (
                              <span style={{ color: under ? '#b71c1c' : '#2e7d32', fontWeight: under ? 600 : 400 }}>
                                {confirmed}{under ? ' ⚠' : ''}
                              </span>
                            );
                          })()
                        ) : '—'}
                      </td>
                      <td style={{ ...tdStyle, maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#666' }}>
                        {r.message || <span style={{ color: '#ccc' }}>—</span>}
                      </td>
                      <td style={{ ...tdStyle, color: '#aaa', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {new Date(r.submitted_at).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => { setDeleteRsvpTarget(r); setDeleteRsvpPassword(''); setDeleteRsvpError(''); }}
                          style={delBtn}
                          aria-label={`Remove RSVP from ${r.name}`}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>}

      </main>

      {/* ── Guest Detail Modal ── */}
      {selectedGuest && (() => {
        const g = selectedGuest;
        const rsvp = rsvpByGuest.get(g.id);
        const viewInfo = viewsByGuest.get(g.id);
        const link = `${SITE_URL}/?guest=${g.token}`;
        return (
          <div
            onClick={() => { setSelectedGuest(null); setShowRsvpForm(false); }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 999,
              padding: '1.5rem',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white',
                borderRadius: '18px',
                padding: '2rem',
                width: '100%',
                maxWidth: '440px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-ui)', fontSize: '1.1rem', fontWeight: 700, color: '#222', margin: '0 0 0.35rem' }}>
                    {g.name}
                  </h2>
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
                      {rsvp.attendance === 'accept' ? `Accepted · ${rsvp.guest_count ?? 1} seat${(rsvp.guest_count ?? 1) !== 1 ? 's' : ''}` : 'Declined'}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: '#bbb', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Pending</span>
                  )}
                </div>
                <button onClick={() => { setSelectedGuest(null); setShowRsvpForm(false); }} style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: '#bbb', cursor: 'pointer', lineHeight: 1, padding: '0 0.2rem' }}>×</button>
              </div>

              {/* Details grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <p style={modalLabel}>Phone</p>
                  <p style={modalValue}>{g.phone}</p>
                </div>
                <div>
                  <p style={modalLabel}>Allocated seats</p>
                  <p style={modalValue}>{g.seats}</p>
                </div>
                <div>
                  <p style={modalLabel}>Page views</p>
                  <p style={{ ...modalValue, color: viewInfo ? '#1565c0' : '#bbb' }}>{viewInfo ? viewInfo.count : '0'}</p>
                </div>
                <div>
                  <p style={modalLabel}>Last opened</p>
                  <p style={{ ...modalValue, fontSize: '0.82rem', color: viewInfo ? '#555' : '#bbb' }}>
                    {viewInfo
                      ? new Date(viewInfo.lastSeen).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </p>
                </div>
                <div>
                  <p style={modalLabel}>Added on</p>
                  <p style={{ ...modalValue, fontSize: '0.82rem', color: '#555' }}>
                    {new Date(g.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                {rsvp?.message && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p style={modalLabel}>Message</p>
                    <p style={{ ...modalValue, color: '#555', lineHeight: 1.5, whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>{rsvp.message}</p>
                  </div>
                )}
              </div>

              {/* Invitation link */}
              <div style={{ background: '#f8f6f2', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.72rem', color: '#888', margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {link}
                </p>
                <button
                  onClick={() => copyLink(g.token)}
                  style={{ ...copyBtn, background: copied === g.token ? '#e8f5e9' : '#e8e4de', color: copied === g.token ? '#2e7d32' : '#555', flexShrink: 0 }}
                >
                  {copied === g.token ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {/* Manual RSVP form */}
              {showRsvpForm ? (
                <div style={{ borderTop: '1px solid #f0ece6', paddingTop: '1.25rem', marginTop: '0.25rem' }}>
                  <p style={{ ...modalLabel, marginBottom: '0.85rem' }}>Manual RSVP</p>

                  {/* Attendance toggle */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    {(['accept', 'decline'] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setManualAttendance(opt)}
                        style={{
                          flex: 1,
                          fontFamily: 'var(--font-ui)',
                          fontSize: '0.72rem',
                          fontWeight: 500,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          border: '2px solid',
                          borderRadius: '8px',
                          padding: '0.55rem',
                          cursor: 'pointer',
                          borderColor: manualAttendance === opt
                            ? (opt === 'accept' ? '#2e7d32' : '#b71c1c')
                            : '#e8e4de',
                          background: manualAttendance === opt
                            ? (opt === 'accept' ? '#e8f5e9' : '#fdecea')
                            : 'white',
                          color: manualAttendance === opt
                            ? (opt === 'accept' ? '#2e7d32' : '#b71c1c')
                            : '#aaa',
                        }}
                      >
                        {opt === 'accept' ? 'Accept' : 'Decline'}
                      </button>
                    ))}
                  </div>

                  {/* Seat count — only when accepting */}
                  {manualAttendance === 'accept' && (
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={labelStyle}>Confirmed seats</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.35rem' }}>
                        <button onClick={() => setManualSeatCount((n) => Math.max(1, n - 1))} style={stepBtn}>−</button>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: '#222', minWidth: '2rem', textAlign: 'center', lineHeight: 1 }}>
                          {manualSeatCount}
                        </span>
                        <button onClick={() => setManualSeatCount((n) => n + 1)} style={stepBtn}>+</button>
                      </div>
                    </div>
                  )}

                  {/* Message */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={labelStyle}>Message (optional)</label>
                    <textarea
                      value={manualMessage}
                      onChange={(e) => setManualMessage(e.target.value)}
                      placeholder="Any notes from the guest…"
                      rows={2}
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                  </div>

                  {/* Password */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={labelStyle}>Admin password</label>
                    <input
                      type="password"
                      value={manualPassword}
                      onChange={(e) => { setManualPassword(e.target.value); setManualError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && submitManualRsvp()}
                      placeholder="Enter your password"
                      style={inputStyle}
                    />
                  </div>

                  {manualError && (
                    <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.82rem', color: '#b71c1c', margin: '0 0 0.75rem' }}>{manualError}</p>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={() => { setShowRsvpForm(false); setManualError(''); }}
                      style={{ flex: 1, fontFamily: 'var(--font-ui)', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', background: '#f0ece6', color: '#555', border: 'none', borderRadius: '10px', padding: '0.75rem', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitManualRsvp}
                      disabled={manualSaving}
                      style={{ flex: 1, fontFamily: 'var(--font-ui)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'var(--color-forest-700)', color: 'white', border: 'none', borderRadius: '10px', padding: '0.75rem', cursor: manualSaving ? 'not-allowed' : 'pointer', opacity: manualSaving ? 0.7 : 1 }}
                    >
                      {manualSaving ? 'Saving…' : (rsvp ? 'Update RSVP' : 'Submit RSVP')}
                    </button>
                  </div>
                </div>
              ) : (
                /* Actions */
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <a
                    href={buildWhatsAppUrl(g)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ flex: 1, ...waBtn, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', padding: '0.75rem', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}
                  >
                    WhatsApp
                  </a>
                  <button
                    onClick={() => setShowRsvpForm(true)}
                    style={{ flex: 1, fontFamily: 'var(--font-ui)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'var(--color-forest-700)', color: 'white', border: 'none', borderRadius: '10px', padding: '0.75rem', cursor: 'pointer' }}
                  >
                    {rsvp ? 'Edit RSVP' : 'RSVP'}
                  </button>
                  <button
                    onClick={() => setSelectedGuest(null)}
                    style={{ flex: 1, fontFamily: 'var(--font-ui)', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', background: '#f0ece6', color: '#555', border: 'none', borderRadius: '10px', padding: '0.75rem', cursor: 'pointer' }}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── RSVP Detail Modal ── */}
      {selectedRsvp && (
        <div
          onClick={closeRsvpModal}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '1.5rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '18px',
              padding: '2rem',
              width: '100%',
              maxWidth: '420px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-ui)', fontSize: '1.1rem', fontWeight: 700, color: '#222', margin: '0 0 0.25rem' }}>
                  {selectedRsvp.name}
                </h2>
                <span style={{
                  display: 'inline-block',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '999px',
                  fontSize: '0.68rem',
                  fontWeight: 500,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  background: selectedRsvp.attendance === 'accept' ? '#e8f5e9' : '#fdecea',
                  color:      selectedRsvp.attendance === 'accept' ? '#2e7d32' : '#b71c1c',
                }}>
                  {selectedRsvp.attendance === 'accept' ? 'Accepted' : 'Declined'}
                </span>
              </div>
              <button onClick={closeRsvpModal} style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: '#bbb', cursor: 'pointer', lineHeight: 1, padding: '0 0.2rem' }}>×</button>
            </div>

            {/* Details grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <p style={modalLabel}>Allocated seats</p>
                <p style={modalValue}>{guestById.get(selectedRsvp.guest_id ?? '')?.seats ?? '—'}</p>
              </div>
              <div>
                <p style={modalLabel}>Submitted</p>
                <p style={modalValue}>
                  {new Date(selectedRsvp.submitted_at).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </p>
              </div>
              {selectedRsvp.message && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <p style={modalLabel}>Message</p>
                  <p style={{ ...modalValue, color: '#555', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{selectedRsvp.message}</p>
                </div>
              )}
            </div>

            {/* Edit confirmed seats — only for accepted */}
            {selectedRsvp.attendance === 'accept' && (
              <div style={{ background: '#f8f6f2', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
                <label style={labelStyle}>Confirmed seat count</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.35rem' }}>
                  <button
                    onClick={() => setEditGuestCount((n) => Math.max(1, n - 1))}
                    style={{ ...stepBtn }}
                  >−</button>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: '#222', minWidth: '2rem', textAlign: 'center', lineHeight: 1 }}>
                    {editGuestCount}
                  </span>
                  <button
                    onClick={() => setEditGuestCount((n) => n + 1)}
                    style={{ ...stepBtn }}
                  >+</button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={closeRsvpModal} style={{
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
              }}>
                Cancel
              </button>
              {selectedRsvp.attendance === 'accept' && (
                <button onClick={saveGuestCount} disabled={saving} style={{
                  flex: 1,
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  background: 'var(--color-forest-700)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Guest Confirmation Modal ── */}
      {deleteGuestTarget && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
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
            <h2 style={{ fontFamily: 'var(--font-ui)', fontSize: '1rem', fontWeight: 600, color: '#b71c1c', margin: '0 0 0.5rem' }}>
              Remove Guest
            </h2>
            <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.85rem', color: '#666', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
              Remove <strong>{deleteGuestTarget.name}</strong> from the guest list? Enter your password to confirm.
            </p>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={deleteGuestPassword}
              onChange={(e) => { setDeleteGuestPassword(e.target.value); setDeleteGuestError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && confirmDeleteGuest()}
              autoFocus
              placeholder="Enter your password"
              style={{ ...inputStyle, marginBottom: '0.75rem' }}
            />
            {deleteGuestError && (
              <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.82rem', color: '#b71c1c', margin: '0 0 0.75rem' }}>
                {deleteGuestError}
              </p>
            )}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => { setDeleteGuestTarget(null); setDeleteGuestPassword(''); setDeleteGuestError(''); }}
                style={{ flex: 1, fontFamily: 'var(--font-ui)', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', background: '#f0ece6', color: '#555', border: 'none', borderRadius: '10px', padding: '0.75rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteGuest}
                disabled={deletingGuest}
                style={{ flex: 1, fontFamily: 'var(--font-ui)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', background: '#b71c1c', color: 'white', border: 'none', borderRadius: '10px', padding: '0.75rem', cursor: deletingGuest ? 'not-allowed' : 'pointer', opacity: deletingGuest ? 0.7 : 1 }}
              >
                {deletingGuest ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete RSVP Confirmation Modal ── */}
      {deleteRsvpTarget && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
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
            <h2 style={{ fontFamily: 'var(--font-ui)', fontSize: '1rem', fontWeight: 600, color: '#b71c1c', margin: '0 0 0.5rem' }}>
              Remove RSVP
            </h2>
            <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.85rem', color: '#666', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
              Remove the RSVP response from <strong>{deleteRsvpTarget.name}</strong>? Enter your password to confirm.
            </p>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={deleteRsvpPassword}
              onChange={(e) => { setDeleteRsvpPassword(e.target.value); setDeleteRsvpError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && confirmDeleteRsvp()}
              autoFocus
              placeholder="Enter your password"
              style={{ ...inputStyle, marginBottom: '0.75rem' }}
            />
            {deleteRsvpError && (
              <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.82rem', color: '#b71c1c', margin: '0 0 0.75rem' }}>
                {deleteRsvpError}
              </p>
            )}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => { setDeleteRsvpTarget(null); setDeleteRsvpPassword(''); setDeleteRsvpError(''); }}
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
                onClick={confirmDeleteRsvp}
                disabled={deletingRsvp}
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
                  cursor: deletingRsvp ? 'not-allowed' : 'pointer',
                  opacity: deletingRsvp ? 0.7 : 1,
                }}
              >
                {deletingRsvp ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

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

const modalLabel: React.CSSProperties = {
  fontFamily: 'var(--font-ui)',
  fontSize: '0.58rem',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: '#aaa',
  margin: '0 0 0.25rem',
};

const modalValue: React.CSSProperties = {
  fontFamily: 'var(--font-ui)',
  fontSize: '0.9rem',
  color: '#222',
  margin: 0,
  fontWeight: 500,
};

const stepBtn: React.CSSProperties = {
  fontFamily: 'var(--font-ui)',
  fontSize: '1.2rem',
  fontWeight: 600,
  background: 'white',
  color: 'var(--color-forest-700)',
  border: '1px solid rgba(138,163,150,0.4)',
  borderRadius: '8px',
  width: '2.2rem',
  height: '2.2rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 1,
};
