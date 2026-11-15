import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const sideBikes = [
  {
    name: 'YZF-R7',
    src: '/imgs/2.%20Yamaha%20YZF-R7.webp',
    alt: 'Yamaha YZF-R7',
    position: 'left',
  },
  {
    name: 'MT-09',
    src: '/imgs/3.%20Yamaha%20MT-09.webp',
    alt: 'Yamaha MT-09',
    position: 'right',
  },
];

const tracerBike = {
  name: 'TRACER 9 GT',
  src: '/imgs/Yamaha%20TRACER%209%20GT.webp',
  alt: 'Yamaha TRACER 9 GT',
};

function getTravelTransitionOffsets(slotEl) {
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;

  let startX = Math.round(vw * 0.12);
  if (slotEl) {
    const slotRect = slotEl.getBoundingClientRect();
    const slotCenterX = slotRect.left + slotRect.width / 2;
    if (slotCenterX > 0) {
      startX = Math.round((vw * 0.5) - slotCenterX);
    }
  }

  const startY = -Math.round(vh * (vw <= 720 ? 0.55 : 0.72));
  const startScale = vw <= 720 ? 1.2 : 1.35;

  return { x: startX, y: startY, scale: startScale };
}

function YamahaSection03({ selectedBikeId = 'yzf-r1', onDealerContact }) {
  const sectionRef = useRef(null);
  const showcaseRef = useRef(null);
  const cardRef = useRef(null);
  const travelBikeRef = useRef(null);
  const centerSlotRef = useRef(null);
  const sideSlotsRef = useRef([]);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sideSlots = sideSlotsRef.current.filter(Boolean);
    const bikeElement = travelBikeRef.current;
    const cardElement = cardRef.current;
    const sectionElement = sectionRef.current;

    if (!sectionElement || !bikeElement || !cardElement) return undefined;

    const context = gsap.context(() => {
      if (reducedMotion) {
        gsap.set([showcaseRef.current, cardElement, bikeElement, ...sideSlots], {
          autoAlpha: 1,
          x: 0,
          y: 0,
          scale: 1,
          opacity: 1,
        });
        return;
      }

      // 1. Lineup side slots entrance (YZF-R7 left, MT-09 right)
      gsap.fromTo(
        sideSlots,
        { opacity: 0, y: 26 },
        {
          opacity: 1,
          y: 0,
          duration: 0.72,
          ease: 'power2.out',
          stagger: 0.1,
          scrollTrigger: {
            trigger: sectionElement,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // 2. Destination Card entrance
      gsap.fromTo(
        cardElement,
        { opacity: 0, x: 24, y: 16 },
        {
          opacity: 1,
          x: 0,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionElement,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // 3. ONE Continuous Motorcycle Visual Element:
      // Tracer 9 GT smoothly travels from upper showcase position into Section 03 center destination slot
      gsap.fromTo(
        bikeElement,
        {
          x: () => getTravelTransitionOffsets(centerSlotRef.current).x,
          y: () => getTravelTransitionOffsets(centerSlotRef.current).y,
          scale: () => getTravelTransitionOffsets(centerSlotRef.current).scale,
          opacity: 1,
        },
        {
          x: 0,
          y: 0,
          scale: 1,
          opacity: 1,
          ease: 'power1.out',
          scrollTrigger: {
            trigger: sectionElement,
            start: 'top bottom', // Starts the moment Section 03 enters bottom of screen
            end: 'top top+=60',  // Completes when Section 03 settles in primary view
            scrub: 1.2,          // Continuous smooth scroll tracking both down and up
            invalidateOnRefresh: true,
            onEnter: () => sectionElement.classList.add('is-bike-travelling'),
            onLeave: () => sectionElement.classList.remove('is-bike-travelling'),
            onEnterBack: () => sectionElement.classList.add('is-bike-travelling'),
            onLeaveBack: () => sectionElement.classList.remove('is-bike-travelling'),
          },
        }
      );
    }, sectionRef);

    return () => {
      context.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} className="yamaha-section03" aria-label="Yamaha motorcycle discovery">
      <div className="yamaha03-shell">
        <div ref={showcaseRef} className="yamaha03-showcase">
          {/* Background 3-bike showcase lineup (YZF-R7, TRACER 9 GT destination, MT-09) */}
          <div className="yamaha03-bike-line" aria-hidden="true">
            {/* Left Slot: YZF-R7 */}
            <div
              ref={(node) => { sideSlotsRef.current[0] = node; }}
              className="yamaha03-bike-slot yamaha03-bike-slot--left"
            >
              <img
                src={sideBikes[0].src}
                alt={sideBikes[0].alt}
                loading="lazy"
                decoding="async"
              />
            </div>

            {/* Center Destination Slot: Receives TRACER 9 GT from upper showcase */}
            <div
              ref={centerSlotRef}
              className="yamaha03-bike-slot yamaha03-bike-slot--center"
            >
              <img
                ref={travelBikeRef}
                src={tracerBike.src}
                alt={tracerBike.alt}
                loading="eager"
                decoding="async"
                className="yamaha03-travel-bike"
              />
            </div>

            {/* Right Slot: MT-09 */}
            <div
              ref={(node) => { sideSlotsRef.current[1] = node; }}
              className="yamaha03-bike-slot yamaha03-bike-slot--right"
            >
              <img
                src={sideBikes[1].src}
                alt={sideBikes[1].alt}
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>

          {/* Destination Blue Featured Bike Card: Preserved original design */}
          <aside ref={cardRef} className="yamaha03-card" aria-label="Yamaha featured model information">
            <div className="yamaha03-card-heading">
              <span className="yamaha03-card-new">NEW</span>
              <p className="yamaha03-card-kicker">SUPERSPORT / RACE-BRED</p>
            </div>

            <h3>YZF-R1</h3>

            <div className="yamaha03-card-image">
              <img
                src="/imgs/1.%20Yamaha%20YZF-R1.webp"
                alt="Yamaha YZF-R1"
                loading="eager"
                decoding="async"
                className="yamaha03-card-bike-img"
              />
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
