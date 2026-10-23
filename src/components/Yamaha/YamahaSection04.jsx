import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './YamahaSection04.css';

gsap.registerPlugin(ScrollTrigger);

const motorcycles = {
  main: {
    src: '/imgs/Yamaha%20TRACER%209%20GT.png',
    alt: 'Yamaha TRACER 9 GT',
  },
  sides: [
    {
      src: '/imgs/2.%20Yamaha%20YZF-R7.png',
      alt: 'Yamaha YZF-R7',
      className: 'yamaha04-bike--left',
    },
    {
      src: '/imgs/Yamaha%20T%C3%A9n%C3%A9r%C3%A9%20700.png',
      alt: 'Yamaha Ténéré 700',
      className: 'yamaha04-bike--right',
    },
  ],
};

const tickerMessages = [
  'DISCOVER YAMAHA PERFORMANCE',
  'PRECISION IN EVERY DETAIL',
  'REVS YOUR HEART',
  'ENGINEERED TO MOVE YOU',
  'BUILT AROUND THE RIDER',
];

function YamahaSection04() {
  const sectionRef = useRef(null);
  const bikesRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    const context = gsap.context(() => {
      const bikes = bikesRef.current
        ? Array.from(bikesRef.current.children)
        : [];

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set([...bikes, cardRef.current], { autoAlpha: 1, x: 0, y: 0 });
        return;
      }

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 72%',
          toggleActions: 'play none none reverse',
        },
      });

      timeline
        .fromTo(bikes, { autoAlpha: 0, y: 24 }, {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.1,
          ease: 'power2.out',
        })
        .fromTo(cardRef.current, { autoAlpha: 0, x: 18 }, {
          autoAlpha: 1,
          x: 0,
          duration: 0.55,
          ease: 'power2.out',
        }, '-=0.42');
    }, sectionRef);

    return () => context.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="yamaha-section04"
      aria-label="Yamaha TRACER 9 GT showcase"
    >
      <div className="yamaha04-shell">
        <div ref={bikesRef} className="yamaha04-bikes" aria-label="Yamaha motorcycle lineup">
          {motorcycles.sides.map((bike) => (
            <img
              className={`yamaha04-bike ${bike.className}`}
              key={bike.src}
              src={bike.src}
              alt={bike.alt}
              loading="lazy"
              decoding="async"
            />
          ))}
          <img
            className="yamaha04-bike yamaha04-bike--main"
            src={motorcycles.main.src}
            alt={motorcycles.main.alt}
            loading="lazy"
            decoding="async"
          />
        </div>

        <aside ref={cardRef} className="yamaha04-model-card" aria-label="TRACER 9 GT model details">
          <p className="yamaha04-card-category">SPORT TOURING</p>
          <h2>TRACER 9 GT</h2>
          <p className="yamaha04-card-intro">Long-distance comfort. Sport performance.</p>
          <div className="yamaha04-card-specs">
            <div><span>ENGINE</span><strong>See official specifications</strong></div>
            <div><span>TORQUE</span><strong>See official specifications</strong></div>
            <div><span>WEIGHT</span><strong>See official specifications</strong></div>
          </div>
          <img
            className="yamaha04-card-bike"
            src={motorcycles.main.src}
            alt=""
            loading="lazy"
            decoding="async"
          />
          <div className="yamaha04-card-bottom">
            <p><span>PRICE</span><strong>Contact your Yamaha dealer</strong></p>
            <a href="#yamaha-performance" aria-label="Explore Yamaha motorcycles">↗</a>
          </div>
        </aside>
      </div>

      <div className="yamaha04-ticker" aria-label="Yamaha brand messages">
        <div className="yamaha04-ticker-track">
          {[...tickerMessages, ...tickerMessages].map((message, index) => (
            <span className="yamaha04-ticker-item" key={`${message}-${index}`}>
              {message}
              <i aria-hidden="true">›</i>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export default YamahaSection04;
