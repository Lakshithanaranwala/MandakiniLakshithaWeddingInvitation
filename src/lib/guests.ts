export interface Guest {
  name: string;
  seats: number;
  side: 'bride' | 'groom' | 'both';
}

/**
 * Short-code lookup table.
 * Add entries here as you generate WhatsApp links: ?c=<code>
 * Example link: https://your-domain.com/?c=akk01
 */
const GUESTS: Record<string, Guest> = {
  // Family
  fam01: { name: 'The Fernando Family', seats: 4, side: 'groom' },
  fam02: { name: 'The Perera Family',   seats: 4, side: 'bride' },

  // Sample individual codes — replace with real guest list
  nak01: { name: 'Nakshika',  seats: 1, side: 'bride' },
  las01: { name: 'Lasantha',  seats: 2, side: 'groom' },
};

export function resolveGuest(code: string): Guest | null {
  return GUESTS[code.toLowerCase()] ?? null;
}
