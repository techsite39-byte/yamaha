import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './YamahaSection07.css';

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    number: '01',
    title: 'Choose Your Yamaha',
    description: 'Explore the Yamaha motorcycle lineup and find the model that matches your riding style.',
    icon: <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m15.5 15.5 4.2 4.2" /></>,
  },
  {
    number: '02',
    title: 'Configure Your Ride',
    description: 'Discover model specifications, features, colors, and available accessories.',
    icon: <><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="9" cy="6" r="2" /><circle cx="15" cy="12" r="2" /><circle cx="8" cy="18" r="2" /></>,
  },
  {
    number: '03',
    title: 'Delivery to Your Door',
    description: 'Get ready for your next ride with a smooth and convenient delivery experience.',
    icon: <><path d="M3 7h11v10H3zM14 10h4l3 3v4h-7z" /><circle cx="7" cy="18" r="1.8" /><circle cx="18" cy="18" r="1.8" /></>,
  },
  {
    number: '04',
    title: 'Yamaha Aftercare',
    description: 'Enjoy ongoing maintenance, genuine parts, and dependable service support.',
    icon: <><path d="M12 3 5 6v5c0 4.5 2.8 8.1 7 10 4.2-1.9 7-5.5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
  },
];

function YamahaSection07() {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const stepsRef = useRef(null);
  const motorcycleRef = useRef(null);

  useEffect(() => {
    const context = gsap.context(() => {
      const stepItems = stepsRef.current
        ? Array.from(stepsRef.current.querySelectorAll('.yamaha07-step'))
        : [];

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set([headingRef.current, ...stepItems, motorcycleRef.current], { autoAlpha: 1, y: 0 });
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
        .fromTo(stepItems, { autoAlpha: 0, y: 12 }, {
          autoAlpha: 1,
          y: 0,
          duration: 0.46,
          stagger: 0.09,
          ease: 'power2.out',
        }, '-=0.14')
        .fromTo(motorcycleRef.current, { autoAlpha: 0, y: 18 }, {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          ease: 'power2.out',
        }, '-=0.32');
    }, sectionRef);

    return () => context.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="yamaha-section07"
      aria-label="How the Yamaha experience works"
    >
      <div className="yamaha07-shell">
        <header ref={headingRef} className="yamaha07-heading">
          <p className="yamaha07-eyebrow">THE YAMAHA EXPERIENCE</p>
          <h2>How It Works</h2>
        </header>

        <div className="yamaha07-layout" ref={stepsRef}>
          <div className="yamaha07-step-column">
            {steps.slice(0, 2).map(({ number, title, description, icon }) => (
              <article className="yamaha07-step" key={number}>
                <div className="yamaha07-step-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    {icon}
                  </svg>
                </div>
                <p className="yamaha07-step-number">{number}</p>
                <h3>{title}</h3>
                <p className="yamaha07-step-description">{description}</p>
              </article>
            ))}
          </div>

          <div className="yamaha07-center-space">
            <img
              ref={motorcycleRef}
              className="yamaha07-motorcycle"
              src="/imgs/3.%20Yamaha%20MT-09.png"
              alt="Yamaha MT-09 motorcycle"
              loading="lazy"
              decoding="async"
            />
          </div>

          <div className="yamaha07-step-column">
            {steps.slice(2).map(({ number, title, description, icon }) => (
              <article className="yamaha07-step" key={number}>
                <div className="yamaha07-step-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    {icon}
                  </svg>
                </div>
                <p className="yamaha07-step-number">{number}</p>
                <h3>{title}</h3>
                <p className="yamaha07-step-description">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
      <div className="yamaha07-bottom-accent" aria-hidden="true" />
    </section>
  );
}

export default YamahaSection07;
