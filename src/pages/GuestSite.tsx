import { useEffect, useState } from 'react';
import { PageSwiper }  from '../components/PageSwiper';
import { Splash }      from '../components/sections/Splash';
import { SaveTheDate } from '../components/sections/SaveTheDate';
import { Invitation }  from '../components/sections/Invitation';
import { Details }     from '../components/sections/Details';
import { RsvpDock }    from '../components/rsvp/RsvpDock';
import { RsvpSheet }   from '../components/rsvp/RsvpSheet';
import { GuestContext, type Guest } from '../hooks/useGuest';
import { supabase } from '../lib/supabase';

function GuestProvider({ children }: { children: React.ReactNode }) {
  const [guest, setGuest]   = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('guest');
    if (!token) { setLoading(false); return; }

    supabase
      .from('guests')
      .select('id, name, seats')
      .eq('token', token)
      .single()
      .then(({ data }) => {
        if (data) {
          setGuest({ id: data.id, name: data.name, seats: data.seats });
          // Record this page view
          supabase.from('link_views').insert({ guest_id: data.id }).then();
        }
        setLoading(false);
      });
  }, []);

  function setName(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setGuest((prev) => ({ id: prev?.id ?? '', name: trimmed, seats: prev?.seats ?? 2 }));
  }

  return (
    <GuestContext.Provider value={{ guest, loading, setName }}>
      {children}
    </GuestContext.Provider>
  );
}

export function GuestSite() {
  const [rsvpOpen, setRsvpOpen] = useState(false);

  return (
    <GuestProvider>
      <PageSwiper
        disabled={rsvpOpen}
        overlay={
          <>
            <RsvpDock onOpen={() => setRsvpOpen(true)} sheetOpen={rsvpOpen} />
            <RsvpSheet isOpen={rsvpOpen} onClose={() => setRsvpOpen(false)} />
          </>
        }
      >
        {[
          <Splash      key="splash"     />,
          <SaveTheDate key="std"        />,
          <Invitation  key="invitation" />,
          <Details     key="details"    />,
        ]}
      </PageSwiper>
    </GuestProvider>
  );
}
