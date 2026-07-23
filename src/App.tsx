import { useState } from 'react';
import { FullPageSlider, SliderProgressRail } from './components/FullPageSlider';
import { Splash }      from './components/sections/Splash';
import { SaveTheDate } from './components/sections/SaveTheDate';
import { Invitation }  from './components/sections/Invitation';
import { Details }     from './components/sections/Details';
import { RsvpDock }    from './components/rsvp/RsvpDock';
import { RsvpSheet }   from './components/rsvp/RsvpSheet';

export default function App() {
  const [rsvpOpen, setRsvpOpen] = useState(false);

  return (
    <>
      <FullPageSlider>
        {[
          <Splash      key="splash"    />,
          <SaveTheDate key="std"       />,
          <Invitation  key="invitation"/>,
          <Details     key="details"   />,
        ]}
      </FullPageSlider>

      <SliderProgressRail />
      <RsvpDock  onOpen={() => setRsvpOpen(true)} />
      <RsvpSheet isOpen={rsvpOpen} onClose={() => setRsvpOpen(false)} />
    </>
  );
}
