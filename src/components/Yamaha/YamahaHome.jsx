import React, { useEffect } from 'react';
import YamahaScrollFrames from './YamahaScrollFrames.jsx';
import YamahaSection02 from './YamahaSection02.jsx';
import YamahaSection03 from './YamahaSection03.jsx';
import YamahaSection05 from './YamahaSection05.jsx';
import YamahaJourneyHero from './YamahaJourneyHero.jsx';
import YamahaSection06 from './YamahaSection06.jsx';
import YamahaSection07 from './YamahaSection07.jsx';
import YamahaFooter from './YamahaFooter.jsx';
import YamahaIntro from './YamahaIntro.jsx';
import YamahaHeroSlider from './YamahaHeroSlider.jsx';

function YamahaHome({ reducedMotion, selectedBikeId, onActiveBikeChange, onDealerContact }) {
  useEffect(() => {
    if (window.location.hash) {
      requestAnimationFrame(() => {
        document.querySelector(window.location.hash)?.scrollIntoView({ block: 'start' });
      });
    }
  }, []);

  const exploreMachine = () => {
    document.getElementById('yamaha-performance')?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <>
      {!reducedMotion && <YamahaIntro />}
      <main id="top">
        <YamahaHeroSlider onExplore={exploreMachine} />
        <YamahaSection02
          reducedMotion={reducedMotion}
          selectedBikeId={selectedBikeId}
          onActiveBikeChange={onActiveBikeChange}
        />
        <YamahaSection03 selectedBikeId={selectedBikeId} onDealerContact={onDealerContact} />
        <YamahaScrollFrames reducedMotion={reducedMotion} />
        <YamahaSection05 />
        <YamahaJourneyHero selectedBikeId={selectedBikeId} />
        <YamahaSection06 />
        <YamahaSection07 />
      </main>
      <YamahaFooter />
    </>
  );
}

export default YamahaHome;
