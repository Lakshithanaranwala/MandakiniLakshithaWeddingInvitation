import { useEffect, useState } from 'react';

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  phase: 'upcoming' | 'today' | 'past';
}

// ⚑ CONFIRM: ceremony time is 10:30 AM Sri Lanka (UTC+05:30)
const TARGET = new Date('2026-09-11T10:30:00+05:30');
const DAY_AFTER = new Date('2026-09-12T00:00:00+05:30');

function compute(): CountdownState {
  const now = Date.now();
  const targetMs = TARGET.getTime();

  if (now >= DAY_AFTER.getTime()) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, phase: 'past' };
  }

  if (now >= targetMs) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, phase: 'today' };
  }

  const delta = Math.max(0, targetMs - now);
  const totalSeconds = Math.floor(delta / 1000);
  const days    = Math.floor(totalSeconds / 86400);
  const hours   = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, phase: 'upcoming' };
}

export function useCountdown(): CountdownState {
  const [state, setState] = useState<CountdownState>(compute);

  useEffect(() => {
    const id = setInterval(() => setState(compute()), 1000);
    return () => clearInterval(id);
  }, []);

  return state;
}
