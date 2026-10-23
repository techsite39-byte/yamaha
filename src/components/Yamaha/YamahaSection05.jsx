import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './YamahaSection05.css';

gsap.registerPlugin(ScrollTrigger);

const categories = [
  {
    label: 'Adventure',
    icon: <path d="m3 17 6-8 4 5 3-4 5 7H3Zm5-8 1-3 2 3" />,
  },
  {
    label: 'Sport',
    icon: <><path d="m4 17 5-10 2 6 3-5 6 9" /><path d="M3 20h5m8 0h5" /></>,
  },
  {
    label: 'Roadster',
    icon: <><circle cx="12" cy="12" r="8" /><path d="M12 4v16M4 12h16M6.35 6.35l11.3 11.3m0-11.3-11.3 11.3" /></>,
  },
  {
    label: 'Touring',
    icon: <><circle cx="12" cy="12" r="8" /><path d="m14.8 9.2-2 4-4 2 2-4 4-2Z" /></>,
  },
  {
    label: 'Urban',
    icon: <><path d="M4 20V9h5v11M9 20V4h6v16m0-9h5v9M2 20h20" /><path d="M6 12h1m5-5h1m-1 4h1m-1 4h1m6 1h1" /></>,
  },
];

const tickerMessages = [
  'REVS YOUR HEART',
  'ENGINEERED TO MOVE YOU',
  'DISCOVER YAMAHA',
  'BUILT AROUND THE RIDER',
];

function YamahaSection05() {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const categoriesRef = useRef(null);
  const cardsRef = useRef(null);
  const [activeCategory, setActiveCategory] = useState('Sport');

  useEffect(() => {
    const context = gsap.context(() => {
      const categoryItems = categoriesRef.current
        ? Array.from(categoriesRef.current.children)
        : [];
      const cards = cardsRef.current
        ? Array.from(cardsRef.current.children)
        : [];

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set([headingRef.current, ...categoryItems, ...cards], {
          autoAlpha: 1,
          y: 0,
        });
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
        .fromTo(headingRef.current, { autoAlpha: 0, y: 12 }, {
          autoAlpha: 1,
          y: 0,
          duration: 0.55,
          ease: 'power2.out',
        })
        .fromTo(categoryItems, { autoAlpha: 0, y: 10 }, {
          autoAlpha: 1,
          y: 0,
          duration: 0.42,
          stagger: 0.07,
          ease: 'power2.out',
        }, '-=0.2')
        .fromTo(cards, { autoAlpha: 0, y: 18 }, {
          autoAlpha: 1,
          y: 0,
          duration: 0.58,
          stagger: 0.12,
          ease: 'power2.out',
        }, '-=0.12');
    }, sectionRef);

    return () => context.revert();
  }, []);

  const scrollTo = (selector) => {
    document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section
      ref={sectionRef}
      className="yamaha-section05"
      aria-label="Browse Yamaha by type"
    >
      <div className="yamaha05-shell">
        <header ref={headingRef} className="yamaha05-heading">
          <p className="yamaha05-kicker">FIND YOUR RIDING STYLE</p>
          <h2>Browse by Type</h2>
        </header>

        <div className="yamaha05-category-viewport">
          <div className="yamaha05-categories" ref={categoriesRef} role="group" aria-label="Motorcycle categories">
            {categories.map(({ label, icon }) => (
              <button
                className={`yamaha05-category${activeCategory === label ? ' is-active' : ''}`}
                key={label}
                type="button"
                aria-pressed={activeCategory === label}
                onClick={() => setActiveCategory(label)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {icon}
                </svg>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="yamaha05-cards" ref={cardsRef}>
          <article className="yamaha05-card yamaha05-card--explore">
            <div className="yamaha05-card-content">
              <span className="yamaha05-card-brand" aria-label="Yamaha">YAMAHA</span>
              <p className="yamaha05-card-eyebrow">FIND YOUR NEXT RIDE</p>
              <h3>Ready to Find<br />Your Yamaha?</h3>
              <p className="yamaha05-card-description">
                Explore the Yamaha lineup and discover a motorcycle that matches your riding style.
              </p>
              <button className="yamaha05-cta" type="button" onClick={() => scrollTo('#yamaha-performance')}>
                EXPLORE BIKES <span aria-hidden="true">↗</span>
              </button>
            </div>
            <img
              className="yamaha05-card-scene"
              src="/yamahahero1/ezgif-frame-060.png"
              alt=""
              loading="lazy"
              decoding="async"
            />
            <img
              className="yamaha05-card-motorcycle"
              src="/imgs/1.%20Yamaha%20YZF-R1.png"
              alt=""
              loading="lazy"
              decoding="async"
            />
          </article>

          <article className="yamaha05-card yamaha05-card--ownership">
            <div className="yamaha05-card-content">
              <span className="yamaha05-card-brand" aria-label="Yamaha">YAMAHA</span>
              <p className="yamaha05-card-eyebrow">YOUR NEXT CHAPTER</p>
              <h3>Make It Your<br />Yamaha</h3>
              <p className="yamaha05-card-description">
                Discover ownership resources, accessories, and support for your riding journey.
              </p>
              <button className="yamaha05-cta" type="button" onClick={() => scrollTo('.yamaha-section04')}>
                DISCOVER MORE <span aria-hidden="true">↗</span>
              </button>
            </div>
            <img
              className="yamaha05-card-scene"
              src="/yamahahero1/ezgif-frame-210.png"
              alt=""
              loading="lazy"
              decoding="async"
            />
            <img
              className="yamaha05-card-motorcycle yamaha05-card-motorcycle--adventure"
              src="/imgs/Yamaha%20T%C3%A9n%C3%A9r%C3%A9%20700.png"
              alt=""
              loading="lazy"
              decoding="async"
            />
          </article>
        </div>
      </div>

      <div className="yamaha05-ticker" aria-label="Yamaha brand messages">
        <div className="yamaha05-ticker-track" aria-hidden="true">
          {[...tickerMessages, ...tickerMessages].map((message, index) => (
            <span className="yamaha05-ticker-item" key={`${message}-${index}`}>
              {message}<i />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export default YamahaSection05;
