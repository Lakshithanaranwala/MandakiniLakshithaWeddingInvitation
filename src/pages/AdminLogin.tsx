import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, login } from '../lib/auth';
import { Navigate } from 'react-router-dom';

export function AdminLogin() {
  const navigate = useNavigate();

  if (isAuthenticated()) return <Navigate to="/admin" replace />;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (login(username, password)) {
      navigate('/admin');
    } else {
      setError('Incorrect username or password.');
    }
  }

  return (
    <div style={{
      minHeight: '100svh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-cream-50)',
      padding: '1.5rem',
    }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <p style={{
            fontFamily: 'var(--font-script)',
            fontSize: '2.2rem',
            color: 'var(--color-gold-500)',
            margin: '0 0 0.25rem',
          }}>
            Mandakini & Lakshitha
          </p>
          <p style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.6rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--color-sage-400)',
            margin: 0,
          }}>
            Wedding Admin
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              style={inputStyle}
            />
          </div>

          {error && (
            <p style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.82rem',
              color: '#c0392b',
              margin: 0,
            }}>
              {error}
            </p>
          )}

          <button type="submit" style={submitStyle}>
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-ui)',
  fontSize: '0.62rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--color-sage-400)',
  marginBottom: '0.4rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  fontFamily: 'var(--font-ui)',
  fontSize: '0.95rem',
  color: '#1a1a1a',
  background: 'white',
  border: '1px solid rgba(138, 163, 150, 0.4)',
  borderRadius: '12px',
  padding: '0.75rem 1rem',
  outline: 'none',
  boxSizing: 'border-box',
};

const submitStyle: React.CSSProperties = {
  width: '100%',
  fontFamily: 'var(--font-ui)',
  fontSize: '0.78rem',
  fontWeight: 500,
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  background: 'var(--color-forest-700)',
  color: 'white',
  border: 'none',
  borderRadius: '12px',
  padding: '0.9rem',
  cursor: 'pointer',
  marginTop: '0.5rem',
};
