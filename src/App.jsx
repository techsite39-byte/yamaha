import React, { useCallback, useEffect, useRef, useState } from 'react';
import { mountYamahaScroll } from './animations/yamahaScroll.js';
import YamahaHeroSequence from './components/Yamaha/YamahaHeroSequence.jsx';
import YamahaSection02 from './components/Yamaha/YamahaSection02.jsx';
import YamahaSection03 from './components/Yamaha/YamahaSection03.jsx';
import YamahaSection05 from './components/Yamaha/YamahaSection05.jsx';
import YamahaJourneyHero from './components/Yamaha/YamahaJourneyHero.jsx';
import YamahaSection06 from './components/Yamaha/YamahaSection06.jsx';
import YamahaSection07 from './components/Yamaha/YamahaSection07.jsx';
import YamahaFooter from './components/Yamaha/YamahaFooter.jsx';
import YamahaMotorcycleDetails from './components/Yamaha/YamahaMotorcycleDetails.jsx';
import YamahaIntro from './components/Yamaha/YamahaIntro.jsx';
import YamahaHeader from './components/Yamaha/YamahaHeader.jsx';
import { defaultYamahaMotorcycle, getYamahaMotorcycle } from './components/Yamaha/yamahaMotorcycles.js';

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);
  return reduced;
}

function App() {
  const reducedMotion = useReducedMotion();
  const [route, setRoute] = useState(() => window.location.pathname);
  const [selectedBikeId, setSelectedBikeId] = useState(() => {
    const bikeId = new URLSearchParams(window.location.search).get('bike');
    return bikeId
      ? getYamahaMotorcycle(bikeId).id
      : getYamahaMotorcycle(window.history.state?.selectedBikeId).id;
  });
  const heroRef = useRef(null);
  const progressRef = useRef(null);
  const framePlayerRef = useRef(null);
  const [headerVariant, setHeaderVariant] = useState('transparent');

  useEffect(() => {
    const hero = heroRef.current;
    if (route !== '/' || !hero) return undefined;

    const updateHeader = () => {
      setHeaderVariant(hero.getBoundingClientRect().bottom <= 1 ? 'static' : 'transparent');
    };

    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
    window.addEventListener('resize', updateHeader);
    return () => {
      window.removeEventListener('scroll', updateHeader);
      window.removeEventListener('resize', updateHeader);
    };
  }, [route]);

  useEffect(() => {
    const handlePopState = () => {
      setRoute(window.location.pathname);
      const bikeId = new URLSearchParams(window.location.search).get('bike');
      const selectedId = bikeId ?? window.history.state?.selectedBikeId;
      setSelectedBikeId(selectedId ? getYamahaMotorcycle(selectedId).id : defaultYamahaMotorcycle.id);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (route !== '/') return undefined;
    const cleanup = mountYamahaScroll({ heroRef, progressRef, framePlayerRef, reducedMotion });
    if (window.location.hash) {
      requestAnimationFrame(() => {
        document.querySelector(window.location.hash)?.scrollIntoView({ block: 'start' });
      });
    }
    return cleanup;
  }, [reducedMotion, route]);

  const navigateToDetails = (bikeId) => {
    const motorcycle = getYamahaMotorcycle(bikeId);
    const path = `/motorcycle-details?bike=${encodeURIComponent(motorcycle.id)}`;
    window.history.pushState({ fromHome: route === '/' }, '', path);
    setSelectedBikeId(motorcycle.id);
    setRoute('/motorcycle-details');
    window.scrollTo(0, 0);
  };

  const navigateToHome = (hash) => {
    window.history.pushState({}, '', `/${hash}`);
    setRoute('/');
  };

  const handleActiveBikeChange = useCallback((bikeId) => {
    setSelectedBikeId(bikeId);
    if (route === '/') {
      window.history.replaceState(
        { ...window.history.state, selectedBikeId: bikeId },
        '',
        window.location.href,
      );
    }
  }, [route]);

  const navigateBack = () => {
    if (window.history.state?.fromHome) {
      window.history.back();
      return;
    }
    navigateToHome('#yamaha-performance');
  };

  if (route === '/motorcycle-details') {
    return (
      <YamahaMotorcycleDetails
        motorcycle={getYamahaMotorcycle(selectedBikeId)}
        onBack={navigateBack}
        onContact={() => navigateToHome('#yamaha-footer')}
      />
    );
  }

  const exploreMachine = () => {
    document.getElementById('yamaha-performance')?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  };

  return <>
    {!reducedMotion && <YamahaIntro />}
    <YamahaHeader variant={headerVariant} reducedMotion={reducedMotion} />

    <main id="top">
      <section ref={heroRef} className="cinematic-stage yamaha-hero" aria-label="Yamaha cinematic introduction">
        <div className="yamaha-hero__sticky">
          <YamahaHeroSequence ref={framePlayerRef} reducedMotion={reducedMotion} />
          <div className="yamaha-hero__vignette" aria-hidden="true" />
          <div className="yamaha-hero__caption"><span>RACING DNA / ROAD REFINED</span><span>01 — 06</span></div>
          <div className="yamaha-hero__copy">
            <p className="eyebrow"><i /> ENGINEERED TO MOVE YOU</p>
            <h1>THE ART OF<br /><em>PERFORMANCE.</em></h1>
            <button className="text-cta" onClick={exploreMachine}>EXPLORE THE MACHINE <span>↓</span></button>
          </div>
          <aside className="yamaha-hero__brand">YAMAHA MOTORCYCLES <span>—</span> PERFORMANCE REDEFINED</aside>
          <div className="yamaha-hero__footer">
            <span>SCROLL TO EXPERIENCE</span>
            <div className="yamaha-hero__scroll-line"><i ref={progressRef} /></div>
            <span>01 / 06</span>
          </div>
        </div>
      </section>
      <YamahaSection02
        reducedMotion={reducedMotion}
        selectedBikeId={selectedBikeId}
        onActiveBikeChange={handleActiveBikeChange}
      />
      <YamahaSection03 selectedBikeId={selectedBikeId} onDealerContact={navigateToDetails} />
      <YamahaSection05 />
      <YamahaJourneyHero selectedBikeId={selectedBikeId} />
      <YamahaSection06 />
      <YamahaSection07 />
    </main>
    <YamahaFooter />
  </>;
}

export default App;
