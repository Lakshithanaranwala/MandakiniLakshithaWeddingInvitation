import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, key);

export interface GuestRow {
  id: string;
  name: string;
  phone: string;
  seats: number;
  token: string;
  created_at: string;
}

export interface RsvpRow {
  id: string;
  guest_id: string | null;
  name: string;
  attendance: 'accept' | 'decline';
  guest_count: number | null;
  message: string | null;
  submitted_at: string;
}

export interface LinkViewRow {
  id: string;
  guest_id: string;
  viewed_at: string;
}
