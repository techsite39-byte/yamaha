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

function YamahaSection03({ selectedBikeId = 'yzf-r1', onDealerContact }) {
  const sectionRef = useRef(null);
  const showcaseRef = useRef(null);
  const cardRef = useRef(null);
  const landingBikeRef = useRef(null);
  const centerSlotRef = useRef(null);
  const sideSlotsRef = useRef([]);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sideSlots = sideSlotsRef.current.filter(Boolean);
    const cardElement = cardRef.current;
    const sectionElement = sectionRef.current;
    const landingBike = landingBikeRef.current;

    if (!sectionElement || !landingBike || !cardElement) return undefined;

    const context = gsap.context(() => {
      if (reducedMotion) {
        gsap.set([showcaseRef.current, cardElement, landingBike, ...sideSlots], {
          autoAlpha: 1,
          x: 0,
          y: 0,
          scale: 1,
          opacity: 1,
        });
        const sourceBike = document.querySelector('.yamaha02-bike-sequence img:last-child');
        if (sourceBike) gsap.set(sourceBike, { autoAlpha: 1 });
        return;
      }

      // 1. Lineup side slots entrance (YZF-R7 left, MT-09 right)
      gsap.fromTo(
        sideSlots,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          ease: 'power2.out',
          stagger: 0.1,
          scrollTrigger: {
            trigger: sectionElement,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // 2. Destination Blue Featured Card entrance
      gsap.fromTo(
        cardElement,
        { opacity: 0, x: 24, y: 16 },
        {
          opacity: 1,
          x: 0,
          y: 0,
          duration: 0.75,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionElement,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // 3. CONTINUOUS SCROLL-LINKED MOTORCYCLE TRANSITION
      // Smoothly travels Tracer 9 GT from Section 02 dark hero into Section 03 center showcase
      const getCenterCoordinates = (element) => {
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + window.scrollY + rect.height / 2,
          width: rect.width,
          height: rect.height,
        };
      };

      const measureTransition = () => {
        if (!landingBike || !centerSlotRef.current || !sectionElement) return null;

        // Temporarily reset transform on landingBike to measure true layout position
        gsap.set(landingBike, { x: 0, y: 0, scale: 1 });

        const targetCoords = getCenterCoordinates(landingBike);
        const sourceBike = document.querySelector('.yamaha02-bike-sequence img:last-child');
        let sourceCoords = getCenterCoordinates(sourceBike);

        if (!sourceCoords || sourceCoords.width === 0) {
          const s2Display = document.querySelector('.yamaha02-display-area');
          if (s2Display) {
            sourceCoords = getCenterCoordinates(s2Display);
          }
        }

        if (!targetCoords || !sourceCoords) return null;

        const deltaX = sourceCoords.x - targetCoords.x;
        const deltaY = sourceCoords.y - targetCoords.y;
        const initScale = targetCoords.width > 0 ? (sourceCoords.width / targetCoords.width) : 1.25;

        return { deltaX, deltaY, initScale };
      };

      let metrics = measureTransition();

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: sectionElement,
          start: 'top bottom',
          end: 'top top+=74',
          scrub: 0.8,
          invalidateOnRefresh: true,
          onRefresh: () => {
            metrics = measureTransition();
          },
          onUpdate: (self) => {
            const sourceBike = document.querySelector('.yamaha02-bike-sequence img:last-child');
            if (self.progress <= 0.02) {
              if (sourceBike) gsap.set(sourceBike, { autoAlpha: 1 });
              gsap.set(landingBike, { autoAlpha: 0 });
            } else {
              if (sourceBike) gsap.set(sourceBike, { autoAlpha: 0 });
              gsap.set(landingBike, { autoAlpha: 1 });
            }
          },
        },
      });

      timeline.fromTo(
        landingBike,
        {
          x: () => metrics?.deltaX ?? 0,
          y: () => metrics?.deltaY ?? -420,
          scale: () => metrics?.initScale ?? 1.25,
          transformOrigin: 'center center',
        },
        {
          x: 0,
          y: 0,
          scale: 1,
          ease: 'power1.inOut',
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

            {/* Center Destination Slot: Reserved landing space for incoming TRACER 9 GT */}
            <div
              ref={centerSlotRef}
              className="yamaha03-bike-slot yamaha03-bike-slot--center"
            >
              <img
                ref={landingBikeRef}
                src={tracerBike.src}
                alt={tracerBike.alt}
                loading="eager"
                decoding="async"
                className="yamaha03-landing-bike"
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
