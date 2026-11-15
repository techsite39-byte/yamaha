import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './YamahaMT15Showcase.css';

gsap.registerPlugin(ScrollTrigger);

const keyHighlights = [
  {
    number: '155 cc',
    label: 'LIQUID-COOLED VVA',
    detail: '4-valve SOHC engine delivering high-revving performance across the entire powerband.',
  },
  {
    number: '18.4 PS',
    label: 'PEAK HORSEPOWER',
    detail: 'Class-leading power at 10,000 RPM engineered for explosive urban and highway acceleration.',
  },
  {
    number: '14.1 Nm',
    label: 'STREET TORQUE',
    detail: 'Immediate low-end torque response at 7,500 RPM for unmatched street agility.',
  },
  {
    number: 'USD FORKS',
    label: 'GOLD SUSPENSION',
    detail: 'Inverted front forks delivering razor-sharp precision and superior braking stability.',
  },
];

const designPillars = [
  {
    tag: 'AGILE',
    title: 'Deltabox Frame & Mass Forward',
    desc: 'Lightweight chassis geometry gives razor-sharp cornering agility and high-speed confidence.',
  },
  {
    tag: 'POWERFUL',
    title: 'Variable Valve Actuation',
    desc: 'Seamless transition between low-rpm grunt and high-rpm surge without sacrificing efficiency.',
  },
  {
    tag: 'UNSTOPPABLE',
    title: 'Dual-Channel ABS & TCS',
    desc: 'Advanced electronic traction control and dual disc ABS ensure complete control in all conditions.',
  },
];

function YamahaMT15Showcase({ onDealerContact, onBookNow }) {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const posterRef = useRef(null);
  const specsRef = useRef(null);
  const narrativeRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      gsap.set(
        [
          headerRef.current,
          posterRef.current,
          specsRef.current,
          narrativeRef.current,
          ctaRef.current,
        ].filter(Boolean),
        { autoAlpha: 1, y: 0 }
      );
      return undefined;
    }

    const context = gsap.context(() => {
      // 1. Header Entrance
      gsap.fromTo(
        headerRef.current,
        { autoAlpha: 0, y: -24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // 2. Poster Hero Reveal with subtle scale bloom
      gsap.fromTo(
        posterRef.current,
        { autoAlpha: 0, scale: 0.96, y: 24 },
        {
          autoAlpha: 1,
          scale: 1,
          y: 0,
          duration: 0.85,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // 3. Specs and Pillars staggered
      const specItems = specsRef.current ? Array.from(specsRef.current.children) : [];
      if (specItems.length > 0) {
        gsap.fromTo(
          specItems,
          { autoAlpha: 0, y: 20 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: specsRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      // 4. Narrative & CTA buttons entrance
      gsap.fromTo(
        [narrativeRef.current, ctaRef.current].filter(Boolean),
        { autoAlpha: 0, y: 16 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.65,
          stagger: 0.12,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: narrativeRef.current,
            start: 'top 88%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, sectionRef);

    return () => context.revert();
  }, []);

  const handleDetailsClick = (event) => {
    if (onDealerContact) {
      event.preventDefault();
      onDealerContact('mt-15-v2');
    }
  };

  const handleBookingClick = (event) => {
    if (onBookNow) {
      event.preventDefault();
      onBookNow('mt-15-v2');
    }
  };

  return (
    <section
      ref={sectionRef}
      id="yamaha-mt15-showcase"
      className="yamaha-mt15"
      aria-label="Yamaha MT-15 Dare to Challenge Showcase"
    >
      {/* Background ambient lighting */}
      <div className="yamaha-mt15__glow-top" aria-hidden="true" />
      <div className="yamaha-mt15__glow-bottom" aria-hidden="true" />
      <div className="yamaha-mt15__grid-lines" aria-hidden="true" />

      <div className="yamaha-mt15__container">
        {/* =========================================================
            HEADER: Y A M A H A  /  DARE TO CHALLENGE
            ========================================================= */}
        <header ref={headerRef} className="yamaha-mt15__header">
          <div className="yamaha-mt15__brand-eyebrow">
            <svg
              className="yamaha-mt15__emblem"
              viewBox="0 0 48 48"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="1.8" />
              <path
                d="M13 9.5 24 28 35 9.5M13 9.5v13.4c0 6.9 4.8 11.6 11 11.6s11-4.7 11-11.6V9.5M24 28V7.5M9.5 18.5h29"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="yamaha-mt15__brand-wordmark">Y A M A H A</span>
          </div>

          <div className="yamaha-mt15__tagline-row">
            <span className="yamaha-mt15__tagline-dash" aria-hidden="true" />
            <h2 className="yamaha-mt15__tagline">DARE TO CHALLENGE</h2>
            <span className="yamaha-mt15__tagline-dash" aria-hidden="true" />
          </div>

          <p className="yamaha-mt15__sub-kicker">THE DARK SIDE OF JAPAN &bull; HYPER NAKED DNA</p>
        </header>

        {/* =========================================================
            HERO SHOWCASE: DUAL-COLUMN CINEMATIC PRESENTATION
            Left: The authentic reference poster featuring the 3 detail panels & hero bike
            Right: Interactive telemetry, performance specs & booking hub
            ========================================================= */}
        <div className="yamaha-mt15__showcase-grid">
          {/* POSTER HERO CARD */}
          <div ref={posterRef} className="yamaha-mt15__poster-card">
            <div className="yamaha-mt15__poster-frame">
              <img
                src="/imgs/yamaha-mt15-showcase.jpg"
                alt="Yamaha MT-15 Dare to Challenge - Front, Tank, Tail Details and Full Hyper Naked Motorcycle"
                className="yamaha-mt15__poster-img"
                loading="eager"
                decoding="async"
              />
              <div className="yamaha-mt15__poster-overlay" aria-hidden="true">
                <span className="yamaha-mt15__badge-live">HYPER NAKED 2.0</span>
                <span className="yamaha-mt15__badge-color">CYAN STORM METALLIC</span>
              </div>
            </div>
          </div>

          {/* INTERACTIVE EXPERIENCE & PERFORMANCE HUB */}
          <div className="yamaha-mt15__info-card">
            <div className="yamaha-mt15__badge-group">
              <span className="yamaha-mt15__badge yamaha-mt15__badge--cyan">STREET AGILITY</span>
              <span className="yamaha-mt15__badge yamaha-mt15__badge--dark">DELTABOX CHASSIS</span>
              <span className="yamaha-mt15__badge yamaha-mt15__badge--gold">USD GOLD FORKS</span>
            </div>

            <div className="yamaha-mt15__model-title-wrap">
              <h3 className="yamaha-mt15__model-title">MT-15</h3>
              <span className="yamaha-mt15__model-v2">VER 2.0</span>
            </div>

            <p ref={narrativeRef} className="yamaha-mt15__description">
              The Yamaha MT-15 is built for those who live to stand out. With its aggressive design,
              agile handling, and responsive performance, every ride is an adrenaline rush.
              Lightweight. Powerful. Unstoppable.
            </p>

            {/* THREE CORE PILLARS FROM REFERENCE */}
            <div className="yamaha-mt15__pillars-bar" aria-label="Core Performance Pillars">
              <span className="yamaha-mt15__pillar-item">
                <strong className="yamaha-mt15__pillar-word">AGILE</strong>
                <small className="yamaha-mt15__pillar-sub">141 kg Kerb Weight</small>
              </span>
              <span className="yamaha-mt15__pillar-sep" aria-hidden="true">|</span>
              <span className="yamaha-mt15__pillar-item">
                <strong className="yamaha-mt15__pillar-word">POWERFUL</strong>
                <small className="yamaha-mt15__pillar-sub">18.4 PS @ 10,000 RPM</small>
              </span>
              <span className="yamaha-mt15__pillar-sep" aria-hidden="true">|</span>
              <span className="yamaha-mt15__pillar-item">
                <strong className="yamaha-mt15__pillar-word">UNSTOPPABLE</strong>
                <small className="yamaha-mt15__pillar-sub">Dual-Channel ABS</small>
              </span>
            </div>

            {/* KEY PERFORMANCE HIGHLIGHTS GRID */}
            <div ref={specsRef} className="yamaha-mt15__specs-grid" aria-label="MT-15 Key Specifications">
              {keyHighlights.map(({ number, label, detail }) => (
                <div key={label} className="yamaha-mt15__spec-card">
                  <span className="yamaha-mt15__spec-num">{number}</span>
                  <span className="yamaha-mt15__spec-label">{label}</span>
                  <p className="yamaha-mt15__spec-detail">{detail}</p>
                </div>
              ))}
            </div>

            {/* ACTION CTA BUTTONS */}
            <div ref={ctaRef} className="yamaha-mt15__actions">
              <a
                href="/book-us?bike=mt-15-v2"
                onClick={handleBookingClick}
                className="yamaha-mt15__btn yamaha-mt15__btn--primary"
                aria-label="Book test ride for Yamaha MT-15"
              >
                <span>BOOK TEST RIDE</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </a>

              <a
                href="/motorcycle-details?bike=mt-15-v2"
                onClick={handleDetailsClick}
                className="yamaha-mt15__btn yamaha-mt15__btn--secondary"
                aria-label="Explore full Yamaha MT-15 specifications"
              >
                <span>EXPLORE SPECS & 360°</span>
                <span className="yamaha-mt15__btn-arrow" aria-hidden="true">↗</span>
              </a>

              <a
                href="tel:08144445566"
                className="yamaha-mt15__btn yamaha-mt15__btn--ghost"
                aria-label="Call Vathilai Motors regarding MT-15"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span>DEALER CALL: 081444 45566</span>
              </a>
            </div>
          </div>
        </div>

        {/* =========================================================
            BOTTOM THREE DESIGN HIGHLIGHT CARDS
            (Reflecting the 3 vertical panels: Front / Tank / Tail)
            ========================================================= */}
        <div className="yamaha-mt15__bottom-pillars">
          {designPillars.map(({ tag, title, desc }) => (
            <div key={tag} className="yamaha-mt15__pillar-card">
              <div className="yamaha-mt15__pillar-card-head">
                <span className="yamaha-mt15__pillar-card-tag">{tag}</span>
                <span className="yamaha-mt15__pillar-card-dot" aria-hidden="true" />
              </div>
              <h4 className="yamaha-mt15__pillar-card-title">{title}</h4>
              <p className="yamaha-mt15__pillar-card-desc">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default YamahaMT15Showcase;
