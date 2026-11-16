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
  const flyerBikeRef = useRef(null);
  const centerSlotRef = useRef(null);
  const sideSlotsRef = useRef([]);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sideSlots = sideSlotsRef.current.filter(Boolean);
    const cardElement = cardRef.current;
    const sectionElement = sectionRef.current;
    const landingBike = landingBikeRef.current;
    const flyerBike = flyerBikeRef.current;

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
        landingBike.classList.add('is-landed');
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

      // 2. Destination Blue Featured Card entrance
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

      // 3. CONTINUOUS SCROLL-LINKED MOTORCYCLE TRANSITION
      // Smoothly animates Tracer 9 GT from Section 02 into Section 03's empty landing space
      const measureCoordinates = () => {
        const slotEl = centerSlotRef.current;
        const sourceBike = document.querySelector('.yamaha02-bike-sequence img:last-child');
        if (!sectionElement || !slotEl) return null;

        const secRect = sectionElement.getBoundingClientRect();
        const slotRect = slotEl.getBoundingClientRect();

        // Destination landing position inside Section 03
        const slotOffsetTop = slotRect.top - secRect.top;
        const slotOffsetLeft = slotRect.left - secRect.left;
        const landedTop = 74 + slotOffsetTop;
        const landedLeft = secRect.left + slotOffsetLeft;
        const landedWidth = slotRect.width || Math.min(window.innerWidth * 0.36, 440);
        const landedHeight = slotRect.height || Math.min(window.innerHeight * 0.38, 380);

        // Source position in Section 02
        let sourceLeft = window.innerWidth * 0.18;
        let sourceTop = 74 + (window.innerHeight - 74) * 0.05;
        let sourceWidth = window.innerWidth * 0.64;
        let sourceHeight = (window.innerHeight - 74) * 0.75;

        if (sourceBike) {
          const sRect = sourceBike.getBoundingClientRect();
          if (sRect.width > 0 && sRect.height > 0) {
            sourceLeft = sRect.left;
            sourceTop = sRect.top;
            sourceWidth = sRect.width;
            sourceHeight = sRect.height;
          }
        }

        return {
          source: { left: sourceLeft, top: sourceTop, width: sourceWidth, height: sourceHeight },
          target: { left: landedLeft, top: landedTop, width: landedWidth, height: landedHeight },
        };
      };

      let coords = measureCoordinates();

      const updateFlight = (progress) => {
        const flyer = flyerBike;
        const landing = landingBike;
        const sourceBike = document.querySelector('.yamaha02-bike-sequence img:last-child');
        if (!flyer || !landing) return;

        if (progress <= 0.02) {
          // Inside Section 02: Show source bike, hide flyer, landing slot remains completely empty
          gsap.set(flyer, { opacity: 0 });
          landing.classList.remove('is-landed');
          if (sourceBike) gsap.set(sourceBike, { opacity: 1 });
        } else if (progress >= 0.98) {
          // Fully arrived in Section 03: Hide flyer, show landing bike in center slot
          gsap.set(flyer, { opacity: 0 });
          landing.classList.add('is-landed');
          if (sourceBike) gsap.set(sourceBike, { opacity: 0 });
        } else {
          // Transition flight between Section 02 and Section 03
          if (sourceBike) gsap.set(sourceBike, { opacity: 0 });
          landing.classList.remove('is-landed');

          if (!coords) coords = measureCoordinates();
          if (coords) {
            const easeProgress = gsap.parseEase('power1.inOut')(progress);
            const curLeft = coords.source.left + (coords.target.left - coords.source.left) * easeProgress;
            const curTop = coords.source.top + (coords.target.top - coords.source.top) * easeProgress;
            const curWidth = coords.source.width + (coords.target.width - coords.source.width) * easeProgress;
            const curHeight = coords.source.height + (coords.target.height - coords.source.height) * easeProgress;

            gsap.set(flyer, {
              opacity: 1,
              left: curLeft,
              top: curTop,
              width: curWidth,
              height: curHeight,
            });
          }
        }
      };

      ScrollTrigger.create({
        trigger: sectionElement,
        start: 'top bottom', // Begins when Section 03 enters bottom of screen
        end: 'top top+=74',  // Settles when Section 03 reaches view below sticky header
        scrub: 1.0,          // Continuous bi-directional smooth scroll tracking
        invalidateOnRefresh: true,
        onRefresh: () => {
          coords = measureCoordinates();
        },
        onUpdate: (self) => {
          updateFlight(self.progress);
        },
      });

      // Initial check based on current scroll position
      const initialProgress = Math.min(
        1,
        Math.max(
          0,
          (window.innerHeight - sectionElement.getBoundingClientRect().top) / (window.innerHeight - 74)
        )
      );
      updateFlight(initialProgress);
    }, sectionRef);

    return () => {
      context.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} className="yamaha-section03" aria-label="Yamaha motorcycle discovery">
      {/* Flight Motorcycle: Active only during scroll transition between sections */}
      <img
        ref={flyerBikeRef}
        src={tracerBike.src}
        alt=""
        aria-hidden="true"
        className="yamaha-bike-scroll-flyer"
      />

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

            {/* Center Destination Slot: Reserved empty landing space for incoming TRACER 9 GT */}
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
