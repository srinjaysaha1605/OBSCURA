import React, { useState } from 'react';
import { GalleryExhibition } from './components/GalleryExhibition';
import { LandingPage } from './components/LandingPage';

export default function App() {
  const [showLanding, setShowLanding] = useState(true);

  return (
    <>
      {showLanding && (
        <LandingPage onEnter={() => setShowLanding(false)} />
      )}
      <GalleryExhibition shouldPlayAudio={!showLanding} />
    </>
  );
}
