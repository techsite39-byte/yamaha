import { useEffect, useRef, useState } from 'react';
import { getPhoneHref } from './businessConfig.js';
import { useBusinessSettings } from './useBusinessSettings.js';
import './YamahaServices.css';
import './YamahaServicesVideo.css';

const serviceVideos = ['/s1.mp4', '/s2.mp4', '/s3.mp4', '/s4.mp4', '/s5.mp4', '/s6.mp4'];

const coreServices = [
  {
    id: 'pms',
    title: 'Periodic Maintenance Service',
    badge: 'RECOMMENDED EVERY 3000 KM',
    description: 'Factory-scheduled service using genuine Yamalube oil, OEM oil filter replacement, spark plug inspection, air filter cleaning and comprehensive 30-point safety check.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    id: 'diagnostics',
    title: 'Engine & Fuel Injection Diagnostics',
    badge: 'YAMAHA DIAGNOSTIC TOOL',
    description: 'Computerized YDT scanning, ECU error code reading, fuel injector ultrasonic bath cleaning, throttle body synchronization and fuel pressure calibration.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    id: 'brakes',
    title: 'Brake & Suspension Overhaul',
    badge: 'MAXIMUM STOPPING POWER',
    description: 'Brake pad inspection and replacement, caliper slide pin lubrication, DOT4 hydraulic fluid bleed, front telescopic fork oil replacement and rear monocross pre-load tuning.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    id: 'chain',
    title: 'Drive Chain & Wheel Service',
    badge: 'SMOOTH POWER TRANSFER',
    description: 'Ultrasonic O-ring/X-ring chain cleaning, precision laser alignment, high-viscosity synthetic chain lube, tyre wear analysis and dynamic wheel balancing.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v6M12 15v6M3 12h6M15 12h6" />
      </svg>
    ),
  },
  {
    id: 'electrical',
    title: 'Electrical & Battery Care',
    badge: 'FACTORY HARNESS CHECK',
    description: 'Digital conductance battery load test, charging coil output verification, starter motor service, water-sealed connector waterproofing and full LED illumination test.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    id: 'express',
    title: 'Express Pre-Ride Safety Check',
    badge: '60-MINUTE SERVICE',
    description: 'Rapid turnaround service covering engine oil top-up/flush, control cables lubrication, tyre pressure calibration, headlight aiming, foam wash and spray wax polish.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
];

const serviceSteps = [
  {
    step: '01',
    title: 'Digital Job Card & Inspection',
    description: 'Transparent check-in with computerized vehicle history review, customer request logging and clear upfront estimates.',
  },
  {
    step: '02',
    title: 'Factory-Trained Diagnostics',
    description: 'Servicing executed by Yamaha certified technicians using genuine Yamaha Diagnostic Tools and precision workshop equipment.',
  },
  {
    step: '03',
    title: '100% Genuine Yamaha Spares',
    description: 'Exclusive use of authentic Yamaha genuine parts and Yamalube lubricants engineered precisely for your engine.',
  },
  {
    step: '04',
    title: 'Road Test & Quality Sign-Off',
    description: 'Every motorcycle undergoes rigorous supervisor inspection and a multi-point road test before final delivery.',
  },
];

function YamahaServices() {
  const { business } = useBusinessSettings();
  const [activeSlot, setActiveSlot] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [isMuted, setIsMuted] = useState(true);
  const [mediaError, setMediaError] = useState('');
  const videoRefs = useRef([]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Yamaha Motorcycle Service | Vathilai Motors';
    return () => {
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => {
      if (preference.matches) setIsPlaying(false);
    };
    updatePreference();
    preference.addEventListener?.('change', updatePreference);
    return () => preference.removeEventListener?.('change', updatePreference);
  }, []);

  useEffect(() => {
    const activeVideo = videoRefs.current[activeSlot];
    if (!activeVideo) return;
    if (!isPlaying) {
      activeVideo.pause();
      return;
    }
    activeVideo.muted = isMuted;
    const playPromise = activeVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Fallback for browser autoplay policies: enforce muted and retry
        if (!activeVideo.muted) {
          activeVideo.muted = true;
          setIsMuted(true);
          activeVideo.play().catch(() => setIsPlaying(false));
        } else {
          setIsPlaying(false);
        }
      });
    }
  }, [activeIndex, activeSlot, isPlaying, isMuted]);

  const togglePlayback = () => {
    setIsPlaying((prev) => !prev);
  };

  const toggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    const activeVideo = videoRefs.current[activeSlot];
    if (activeVideo) {
      activeVideo.muted = nextMuted;
    }
  };

  const handleVideoEnded = () => {
    const nextIndex = (activeIndex + 1) % serviceVideos.length;
    const nextSlot = 1 - activeSlot;
    const nextVideo = videoRefs.current[nextSlot];
    if (nextVideo) {
      try {
        nextVideo.currentTime = 0;
      } catch (_) {}
    }
    setActiveIndex(nextIndex);
    setActiveSlot(nextSlot);
  };

  const handleSelectVideo = (targetIndex) => {
    if (targetIndex === activeIndex) return;
    const nextSlot = 1 - activeSlot;
    const nextVideo = videoRefs.current[nextSlot];
    if (nextVideo) {
      nextVideo.src = serviceVideos[targetIndex];
      try {
        nextVideo.currentTime = 0;
      } catch (_) {}
      nextVideo.muted = isMuted;
      nextVideo.load();
    }
    setActiveIndex(targetIndex);
    setActiveSlot(nextSlot);
    setIsPlaying(true);
  };

  const scrollToContent = () => {
    const target = document.getElementById('service-intro') || document.getElementById('service-expertise');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <main className="yamaha-services">
      {/* 1. Full-Width Clean Video Hero (Autoplay, Unobstructed, Zero Text Overlay) */}
      <section className="service-video-hero" aria-label="Yamaha motorcycle service video showcase">
        {serviceVideos.slice(0, 2).map((_, slot) => {
          const isActive = slot === activeSlot;
          const videoIndex = isActive ? activeIndex : (activeIndex + 1) % serviceVideos.length;
          const source = serviceVideos[videoIndex];

          return (
            <video
              key={slot}
              ref={(element) => {
                videoRefs.current[slot] = element;
                if (element) {
                  element.muted = isMuted;
                  element.defaultMuted = true;
                }
              }}
              className={`service-video-hero__video${isActive ? ' is-active' : ''}`}
              src={source}
              autoPlay={isActive && isPlaying}
              muted={isMuted}
              playsInline
              loop={false}
              poster="/imgs/Yamaha%20R15M.webp"
              aria-hidden="true"
              tabIndex={-1}
              onEnded={handleVideoEnded}
              onError={() => setMediaError(source)}
            />
          );
        })}

        {/* Minimal Bottom Fade into Page Background */}
        <div className="service-video-hero__fade" aria-hidden="true" />

        {/* Floating Minimal Controls (Bottom-Right) */}
        <div className="service-video-hero__controls">
          <div className="service-video-hero__dots" role="tablist" aria-label="Service video playlist">
            {serviceVideos.map((_, idx) => (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={idx === activeIndex}
                aria-label={`Play service clip ${idx + 1} of ${serviceVideos.length}`}
                className={`service-video-hero__dot${idx === activeIndex ? ' is-active' : ''}`}
                onClick={() => handleSelectVideo(idx)}
              />
            ))}
          </div>

          <button
            className="service-video-hero__control"
            type="button"
            aria-label={isMuted ? 'Unmute video audio' : 'Mute video audio'}
            aria-pressed={!isMuted}
            onClick={toggleSound}
          >
            {isMuted ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" opacity="0.3" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
            <span>{isMuted ? 'AUDIO OFF' : 'AUDIO ON'}</span>
          </button>

          <button
            className="service-video-hero__control"
            type="button"
            aria-label={isPlaying ? 'Pause service video' : 'Play service video'}
            aria-pressed={isPlaying}
            onClick={togglePlayback}
          >
            {isPlaying ? (
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5v9m6-9v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            ) : (
              <svg viewBox="0 0 16 16" aria-hidden="true"><polygon points="5 3.5 13 8 5 12.5 5 3.5" fill="currentColor" /></svg>
            )}
            <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
          </button>
        </div>

        {/* Scroll Cue at Bottom Center */}
        <button
          className="service-video-hero__scroll-cue"
          type="button"
          onClick={scrollToContent}
          aria-label="Scroll down to workshop service details"
        >
          <span>WORKSHOP DETAILS</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </section>

      {/* 2. Service Intro Section (Positioned Cleanly BELOW Full Video) */}
      <section className="service-intro-section" id="service-intro" aria-label="Authorised service intro">
        <div className="service-container">
          <div className="service-intro-content">
            <p className="service-intro-eyebrow">
              <span aria-hidden="true" /> VATHILAI MOTORS · AUTHORISED YAMAHA SERVICE
            </p>
            <h1>PRECISION CARE.<br />UNCOMPROMISED PERFORMANCE.</h1>
            <p className="service-intro-subtitle">
              Factory-certified Yamaha technicians, genuine Yamalube lubricants and state-of-the-art diagnostic tooling engineered specifically for your machine.
            </p>

            <div className="service-intro-badges">
              <span className="service-intro-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Authorised Yamaha Workshop
              </span>
              <span className="service-intro-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                100% Genuine Yamalube Oils
              </span>
              <span className="service-intro-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Yamaha Certified Master Techs
              </span>
              <span className="service-intro-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Computerized Diagnostic Bays
              </span>
            </div>

            <div className="service-intro-actions">
              <a href="/book-now" className="service-btn service-btn--primary">
                BOOK A SERVICE VISIT <span aria-hidden="true">→</span>
              </a>
              <a href="#service-expertise" className="service-btn service-btn--outline">
                VIEW WORKSHOP SERVICES <span aria-hidden="true">↓</span>
              </a>
              <a href={getPhoneHref(business.phone)} className="service-btn service-btn--ghost">
                CALL DEALERSHIP: {business.phone}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Organized Services Content (#service-expertise) */}
      <section className="service-expertise-section" id="service-expertise" aria-label="Dealership services">
        <div className="service-container">
          <div className="service-section-header">
            <p className="service-eyebrow-tag">WORKSHOP CAPABILITIES</p>
            <h2>Expert Services for Every Yamaha</h2>
            <p className="service-section-sub">
              Every maintenance procedure strictly follows Yamaha Motor Co. global factory tolerances using OEM computerized tools and genuine parts.
            </p>
          </div>

          <div className="service-cards-grid">
            {coreServices.map((service) => (
              <article className="service-card" key={service.id}>
                <div className="service-card__icon-wrap" aria-hidden="true">
                  {service.icon}
                </div>
                <span className="service-card__badge">{service.badge}</span>
                <h3 className="service-card__title">{service.title}</h3>
                <p className="service-card__description">{service.description}</p>
                <a href={`/book-now?service=${service.id}`} className="service-card__cta">
                  <span>BOOK THIS SERVICE</span>
                  <span aria-hidden="true">→</span>
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Service Process (#service-process) */}
      <section className="service-process-section" id="service-process" aria-label="Our service process">
        <div className="service-container">
          <div className="service-section-header">
            <p className="service-eyebrow-tag">THE VATHILAI PROMISE</p>
            <h2>How We Care For Your Motorcycle</h2>
            <p className="service-section-sub">
              Transparent, accountable maintenance steps designed to maintain your warranty and factory riding dynamics.
            </p>
          </div>

          <div className="service-process-grid">
            {serviceSteps.map((step) => (
              <div className="service-process-step" key={step.step}>
                <span className="service-process-step__number">{step.step}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Workshop Facilities (#workshop) */}
      <section className="service-workshop-section" id="workshop" aria-label="Dealership workshop facilities">
        <div className="service-container">
          <div className="service-workshop-content">
            <div className="service-workshop-copy">
              <p className="service-eyebrow-tag">STATE-OF-THE-ART FACILITY</p>
              <h2>Advanced Dealership Workshop</h2>
              <p>
                Vathilai Motors features dedicated hydraulic motorcycle ramps, specialized engine diagnostic stations, ultrasonic cleaning baths, automated tyre changers, and dynamic wheel balancers.
              </p>
              <ul className="service-facility-list">
                <li><span>✓</span> Certified Master Technicians trained at Yamaha Technical Academy</li>
                <li><span>✓</span> 100% Genuine Yamalube mineral, semi-synthetic and full-synthetic oils</li>
                <li><span>✓</span> Clean, air-conditioned customer lounge with live workshop view</li>
                <li><span>✓</span> Express servicing bays with pre-booked appointment priority</li>
              </ul>
            </div>
            <div className="service-workshop-visual">
              <img
                src="/imgs/Yamaha%20TRACER%209%20GT.webp"
                alt="Yamaha motorcycle in service workshop"
                className="service-workshop-image"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 5. Booking & Contact CTA (#booking) */}
      <section className="service-cta-section" id="booking" aria-label="Schedule your service">
        <div className="service-container">
          <div className="service-cta-card">
            <h2>Ready to Experience Peak Yamaha Performance?</h2>
            <p>
              Schedule your periodic maintenance or diagnostic appointment online with Vathilai Motors. Quick booking confirmation and priority workshop bay allocation.
            </p>
            <div className="service-cta-actions">
              <a href="/book-now" className="service-btn service-btn--primary">
                SCHEDULE WORKSHOP VISIT <span aria-hidden="true">→</span>
              </a>
              <a href={getPhoneHref(business.phone)} className="service-btn service-btn--outline">
                CALL DEALERSHIP: {business.phone}
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default YamahaServices;
