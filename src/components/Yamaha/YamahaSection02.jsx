import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import YamahaBikeTransition from './YamahaBikeTransition.jsx';
import { yamahaMotorcycles } from './yamahaMotorcycles.js';

gsap.registerPlugin(ScrollTrigger);

function YamahaSection02({ reducedMotion, selectedBikeId, onActiveBikeChange }) {
  const sectionRef = useRef(null);
  const copyRef = useRef(null);
  const headlineRef = useRef(null);
  const descriptionRef = useRef(null);
  const ctaRef = useRef(null);
  const featureRowsRef = useRef(null);
  const productNavRef = useRef(null);
  const sceneMotionRef = useRef(null);
  const categoryRef = useRef(null);
  const secondaryLinkRef = useRef(null);
  const previousIndexRef = useRef(0);
  const [activeFeature, setActiveFeature] = useState(0);
  const [activeIndex, setActiveIndex] = useState(() => {
    const selectedIndex = yamahaMotorcycles.findIndex(({ id }) => id === selectedBikeId);
    return selectedIndex >= 0 ? selectedIndex : 0;
  });
  const [activeCategory, setActiveCategory] = useState('DESIGN');
  const motorcycle = yamahaMotorcycles[activeIndex];
  const features = motorcycle.features;
  const categories = ['DESIGN', 'ENGINEERING', 'PERFORMANCE', 'TECHNOLOGY', 'ACCESSORIES'];
  const specificationIcons = [
    'M4 14a8 8 0 1 1 16 0M12 12l4-4M7 17h10',
    'M5 5h14v14H5zM8 9h8M8 13h5',
    'M12 3v18M5 8l7-5 7 5M5 16l7 5 7-5',
    'M4 19V5m0 14h16M7 15l4-4 3 2 6-7',
  ];
  useEffect(() => {
    onActiveBikeChange?.(motorcycle.id);
  }, [motorcycle.id, onActiveBikeChange]);

  useEffect(() => {
    if (previousIndexRef.current === activeIndex) return;
    previousIndexRef.current = activeIndex;
    setActiveFeature(0);
    if (reducedMotion) return;
    gsap.fromTo(
      [
        categoryRef.current,
        headlineRef.current,
        descriptionRef.current,
        ctaRef.current,
        secondaryLinkRef.current,
        ...Array.from(featureRowsRef.current?.children ?? []),
      ],
      { autoAlpha: 0, y: 10 },
      { autoAlpha: 1, y: 0, duration: 0.28, stagger: 0.025, ease: 'power1.out', overwrite: true },
    );
  }, [activeIndex, reducedMotion]);

  useEffect(() => {
    const context = gsap.context(() => {
      const featureRows = Array.from(featureRowsRef.current.children);
      const scene = sceneMotionRef.current;
      if (reducedMotion) {
        gsap.set([copyRef.current, headlineRef.current, descriptionRef.current, ctaRef.current, secondaryLinkRef.current, ...featureRows, productNavRef.current, scene], { autoAlpha: 1, x: 0, y: 0, scale: 1 });
        return;
      }
      const timeline = gsap.timeline({ scrollTrigger: { trigger: sectionRef.current, start: 'top 82%', end: 'bottom 72%', scrub: 1.1 } });
      timeline.fromTo(copyRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.22 }, 0)
        .fromTo(headlineRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.18 }, 0.08)
        .fromTo(descriptionRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.18 }, 0.2)
        .fromTo(ctaRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.16 }, 0.32)
        .fromTo(featureRows, { opacity: 0, x: 10 }, { opacity: 1, x: 0, duration: 0.18, stagger: 0.07 }, 0.24)
        .fromTo(productNavRef.current, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.18 }, 0.46)
        .fromTo(scene, { autoAlpha: 0, y: 20, scale: 0.98 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: 'none' }, 0);
    }, sectionRef);
    return () => context.revert();
  }, [reducedMotion]);

  return <section ref={sectionRef} id="yamaha-performance" className="yamaha-section02" aria-label="Featured Yamaha motorcycle">
    <div className="yamaha02-atmosphere" aria-hidden="true" />
    <div className="yamaha02-floor" aria-hidden="true" />
    <div className="yamaha02-showcase">
      <div className="yamaha02-copy" ref={copyRef}>
        <p className="eyebrow" ref={categoryRef}><i /> {motorcycle.category}</p>
        <h2 ref={headlineRef}>{motorcycle.heading[0]}<br />{motorcycle.heading[1]}</h2>
        <p className="yamaha02-description" ref={descriptionRef}>{motorcycle.description}</p>
        <button className="yamaha02-cta" ref={ctaRef} type="button">{motorcycle.cta} <span>→</span></button>
        <button className="yamaha02-accessories" ref={secondaryLinkRef} type="button" onClick={() => setActiveCategory('ACCESSORIES')}>VIEW ACCESSORIES</button>
        <p className="yamaha02-signature">{motorcycle.signature.map((item, index) => <React.Fragment key={item}>{index > 0 && <> <i>·</i> </>}{item}</React.Fragment>)}</p>
      </div>

    <div className="yamaha02-display-area" role="region" aria-label="Yamaha motorcycle product showcase">
      <YamahaBikeTransition
        reducedMotion={reducedMotion}
        activeIndex={activeIndex}
        onActiveChange={setActiveIndex}
        containerRef={sceneMotionRef}
      />
    </div>

      <nav className="yamaha02-features" aria-label="Motorcycle features">
        <div className="yamaha02-feature-list" ref={featureRowsRef}>
          {features.map((feature, index) => <button
            className={`yamaha02-feature ${activeFeature === index ? 'is-active' : ''}`}
            key={feature.title}
            type="button"
            aria-pressed={activeFeature === index}
            onClick={() => setActiveFeature(index)}
          >
            <span className="yamaha02-feature-index">0{index + 1}</span>
            <span className="yamaha02-feature-copy"><strong>{feature.title}</strong><small>{feature.description}</small></span>
            <span className="yamaha02-feature-arrow" aria-hidden="true">↗</span>
          </button>)}
        </div>
      </nav>

      <div className="yamaha02-spec-strip" aria-label={`${motorcycle.heading.join(' ')} highlights`}>
        {motorcycle.specifications.map((specification, index) => (
          <div className="yamaha02-spec-item" key={specification}>
            <span className="yamaha02-spec-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d={specificationIcons[index]} />
              </svg>
            </span>
            <span className="yamaha02-spec-copy">
              <strong>{['ENGINE CHARACTER', 'RIDE RESPONSE', 'RIDER CONTROL', 'YAMAHA DNA'][index]}</strong>
              <small>{specification}</small>
            </span>
          </div>
        ))}
      </div>

      <nav className="yamaha02-product-nav" aria-label="Product categories" ref={productNavRef}>
        {categories.map((category) => <button
          className={activeCategory === category ? 'is-active' : ''}
          key={category}
          type="button"
          aria-pressed={activeCategory === category}
          onClick={() => setActiveCategory(category)}
        >{category}</button>)}
      </nav>
    </div>
  </section>;
}

export default YamahaSection02;
