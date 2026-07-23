import { createContext, useContext } from 'react';

export interface Guest {
  id: string;
  name: string;
  seats: number;
}

interface GuestCtx {
  guest: Guest | null;
  loading: boolean;
  setName: (name: string) => void;
}

export const GuestContext = createContext<GuestCtx>({
  guest: null,
  loading: false,
  setName: () => {},
});

export function useGuest(): GuestCtx {
  return useContext(GuestContext);
}
