import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './YamahaSection06.css';

gsap.registerPlugin(ScrollTrigger);

const motorcycles = [
  {
    category: 'SUPERSPORT',
    name: 'YZF-R Series',
    specification: 'Performance engineered',
    image: '/imgs/1.%20Yamaha%20YZF-R1.png',
  },
  {
    category: 'HYPER NAKED',
    name: 'MT Series',
    specification: 'Torque. Control. Attitude.',
    image: '/imgs/3.%20Yamaha%20MT-09.png',
  },
  {
    category: 'ADVENTURE',
    name: 'Ténéré Series',
    specification: 'Built to explore',
    image: '/imgs/Yamaha%20T%C3%A9n%C3%A9r%C3%A9%20700.png',
  },
  {
    category: 'SPORT TOURING',
    name: 'TRACER Series',
    specification: 'Performance meets distance',
    image: '/imgs/Yamaha%20TRACER%209%20GT.png',
  },
];

function YamahaSection06() {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const cardsRef = useRef(null);

  useEffect(() => {
    const context = gsap.context(() => {
      const cards = cardsRef.current
        ? Array.from(cardsRef.current.children)
        : [];

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set([headingRef.current, ...cards], { autoAlpha: 1, y: 0 });
        return;
      }

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 76%',
          toggleActions: 'play none none reverse',
        },
      });

      timeline
        .fromTo(headingRef.current, { autoAlpha: 0, y: 14 }, {
          autoAlpha: 1,
          y: 0,
          duration: 0.58,
          ease: 'power2.out',
        })
        .fromTo(cards, { autoAlpha: 0, y: 18 }, {
          autoAlpha: 1,
          y: 0,
          duration: 0.52,
          stagger: 0.1,
          ease: 'power2.out',
        }, '-=0.16');
    }, sectionRef);

    return () => context.revert();
  }, []);

  const exploreMotorcycles = () => {
    document.getElementById('yamaha-performance')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  return (
    <section
      ref={sectionRef}
      className="yamaha-section06"
      aria-label="Popular Yamaha motorcycles"
    >
      <div className="yamaha06-shell">
        <header ref={headingRef} className="yamaha06-heading">
          <p className="yamaha06-eyebrow">YAMAHA MOTORCYCLES</p>
          <h2>Popular Bikes</h2>
          <p className="yamaha06-subtitle">Discover the machines built for your next ride.</p>
        </header>

        <div className="yamaha06-grid" ref={cardsRef}>
          {motorcycles.map(({ category, name, specification, image }) => (
            <article className="yamaha06-card" key={category}>
              <div className="yamaha06-image-space">
                <img src={image} alt="" loading="lazy" decoding="async" />
              </div>
              <div className="yamaha06-card-info">
                <p className="yamaha06-card-category">{category}</p>
                <h3>{name}</h3>
                <div className="yamaha06-card-bottom">
                  <span>Explore model</span>
                  <button
                    className="yamaha06-action"
                    type="button"
                    aria-label={`Explore ${name}`}
                    onClick={exploreMotorcycles}
                  >
                    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="M4.25 10h11.5M10 4.25 15.75 10 10 15.75" />
                    </svg>
                  </button>
                </div>
                <p className="yamaha06-specification">{specification}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default YamahaSection06;
