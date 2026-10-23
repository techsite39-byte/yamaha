import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const motorcycles = [
  {
    name: 'YZF-R7',
    src: '/imgs/2.%20Yamaha%20YZF-R7.png',
    alt: 'Yamaha YZF-R7',
    position: 'left',
  },
  {
    name: 'YZF-R1',
    src: '/imgs/1.%20Yamaha%20YZF-R1.png',
    alt: 'Yamaha YZF-R1',
    position: 'center',
  },
  {
    name: 'MT-09',
    src: '/imgs/3.%20Yamaha%20MT-09.png',
    alt: 'Yamaha MT-09',
    position: 'right',
  },
];

function YamahaSection03({ selectedBikeId = 'yzf-r1', onDealerContact }) {
  const sectionRef = useRef(null);
  const showcaseRef = useRef(null);
  const cardRef = useRef(null);
  const slotsRef = useRef([]);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const context = gsap.context(() => {
      const slots = slotsRef.current.filter(Boolean);
      if (reducedMotion) {
        gsap.set([showcaseRef.current, cardRef.current, ...slots], {
          autoAlpha: 1,
          x: 0,
          y: 0,
          opacity: 1,
        });
        return;
      }

      gsap.fromTo(slots, { opacity: 0, y: 26 }, {
        opacity: 1,
        y: 0,
        duration: 0.72,
        ease: 'power2.out',
        stagger: 0.12,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
        },
      });

      gsap.fromTo(cardRef.current, { opacity: 0, x: 26, y: 12 }, {
        opacity: 1,
        x: 0,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
        },
      });
    }, sectionRef);

    return () => context.revert();
  }, []);

  return (
    <section ref={sectionRef} className="yamaha-section03" aria-label="Yamaha motorcycle discovery">
      <div className="yamaha03-shell">
        <div className="yamaha03-header-spacer" aria-hidden="true" />

        <div ref={showcaseRef} className="yamaha03-showcase">
          <div className="yamaha03-bike-line" aria-hidden="true">
            {motorcycles.map((motorcycle, index) => (
              <div
                ref={(node) => { slotsRef.current[index] = node; }}
                className={`yamaha03-bike-slot yamaha03-bike-slot--${motorcycle.position}`}
                key={motorcycle.name}
              >
                <img
                  src={motorcycle.src}
                  alt={motorcycle.alt}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ))}
          </div>

          <aside ref={cardRef} className="yamaha03-card" aria-label="Yamaha featured model information">
            <div className="yamaha03-card-heading">
              <span className="yamaha03-card-new">NEW</span>
              <p className="yamaha03-card-kicker">SUPERSPORT / RACE-BRED</p>
            </div>
            <h3>YZF-R1</h3>
            <div className="yamaha03-card-image">
              <img src={motorcycles[1].src} alt="" loading="lazy" decoding="async" />
            </div>
            <div className="yamaha03-card-specs" aria-label="YZF-R1 highlights">
              <div><span>ENGINE CHARACTER</span><strong>Race character</strong></div>
              <div><span>RIDER CONTROL</span><strong>Focused response</strong></div>
              <div><span>YAMAHA DNA</span><strong>Supersport DNA</strong></div>
            </div>
            <div className="yamaha03-card-bottom">
              <p><span>PRICE</span><strong>Contact your Yamaha dealer</strong></p>
              <a
                href={`/motorcycle-details?bike=${encodeURIComponent(selectedBikeId)}`}
                className="yamaha03-card-action"
                aria-label="Contact your Yamaha dealer"
                onClick={(event) => {
                  event.preventDefault();
                  onDealerContact?.(selectedBikeId);
                }}
              >
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default YamahaSection03;
