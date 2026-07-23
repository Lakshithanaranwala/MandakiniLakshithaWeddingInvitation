import { useState } from 'react';
import { type Guest, resolveGuest } from '../lib/guests';

interface UseGuestReturn {
  guest: Guest | null;
  setName: (name: string) => void;
}

function parseFromURL(): Guest | null {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('c');
  const name = params.get('g');

  if (code) {
    const resolved = resolveGuest(code);
    if (resolved) return resolved;
  }

  if (name) {
    return { name: decodeURIComponent(name), seats: 2, side: 'both' };
  }

  return null;
}

export function useGuest(): UseGuestReturn {
  const [guest, setGuest] = useState<Guest | null>(parseFromURL);

  function setName(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;

    const next: Guest = {
      name: trimmed,
      seats: guest?.seats ?? 2,
      side: guest?.side ?? 'both',
    };
    setGuest(next);

    // Update URL without navigation so the link stays shareable
    const url = new URL(window.location.href);
    url.searchParams.set('g', trimmed);
    url.searchParams.delete('c');
    history.replaceState(null, '', url.toString());
  }

  return { guest, setName };
}
