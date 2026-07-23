import { useState } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { Splash }       from './components/sections/Splash';
import { SaveTheDate }  from './components/sections/SaveTheDate';
import { Invitation }   from './components/sections/Invitation';
import { Details }      from './components/sections/Details';
import { RsvpDock }     from './components/rsvp/RsvpDock';
import { RsvpSheet }    from './components/rsvp/RsvpSheet';
import { useFullPageScroll } from './hooks/useFullPageScroll';

const SECTION_IDS = ['splash', 'save-the-date', 'invitation', 'details'] as const;

function ProgressRail() {
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, { stiffness: 260, damping: 30 });

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        width: '2px',
        height: '100vh',
        zIndex: 60,
        background: 'rgba(138, 163, 150, 0.15)',
        transformOrigin: 'top',
      }}
    >
      <motion.div
        style={{
          width: '100%',
          height: '100%',
          background: 'var(--color-gold-500)',
          scaleY,
          transformOrigin: 'top',
          opacity: 0.7,
        }}
      />
    </div>
  );
}

export default function App() {
  const [rsvpOpen, setRsvpOpen] = useState(false);

  // Suspend snap scroll while RSVP sheet is open so it doesn't fight the drag
  useFullPageScroll(SECTION_IDS, rsvpOpen);

  return (
    <>
      <ProgressRail />

      <main>
        <Splash />
        <SaveTheDate />
        <Invitation />
        <Details />
      </main>

      <RsvpDock onOpen={() => setRsvpOpen(true)} />
      <RsvpSheet isOpen={rsvpOpen} onClose={() => setRsvpOpen(false)} />
    </>
  );
}
