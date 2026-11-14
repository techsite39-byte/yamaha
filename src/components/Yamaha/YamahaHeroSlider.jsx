import React, { useEffect, useState } from 'react';
import './YamahaHeroSlider.css';

const SLIDES = [
  {
    src: '/imgs/f0.png',
    alt: 'Yamaha YZF-R1 flagship supersport motorcycle',
    eyebrow: 'YAMAHA SUPERSPORT',
    title: (
      <>
        Yamaha YZF-R1
        <br />
        Pure Supersport
      </>
    ),
    subtitle: 'MotoGP-Inspired Performance & Crossplane Power',
    placement: 'r1',
  },
  {
    src: '/imgs/f1.png',
    alt: 'Yamaha sport motorcycle and rider carving through snow',
    eyebrow: 'YAMAHA MOTORCYCLES',
    title: (
      <>
        Premium Yamaha
        <br />
        Motorcycles
      </>
    ),
    subtitle: 'Discover Your Next Ride',
    placement: 'first',
  },
  {
    src: '/imgs/f2.png',
    alt: 'Rider beside a blue Yamaha sport motorcycle',
    eyebrow: 'YAMAHA MOTORCYCLES',
    title: (
      <>
        Designed for
        <br />
        Performance
      </>
    ),
    subtitle: 'Experience the Power',
    placement: 'second',
  },
  {
    src: '/imgs/f3.png',
    alt: 'Rider with a blue Yamaha sport motorcycle in an urban setting',
    eyebrow: 'YAMAHA MOTORCYCLES',
    title: (
      <>
        Ride Beyond
        <br />
        Limits
      </>
    ),
    subtitle: 'Performance Meets Style',
    placement: 'third',
  },
  {
    src: '/imgs/f4.png',
    alt: 'Rider beside a blue Yamaha sport motorcycle in a modern studio',
    eyebrow: 'YAMAHA MOTORCYCLES',
    title: (
      <>
        Your Journey
        <br />
        Starts Here
      </>
    ),
    subtitle: 'Explore Our Collection',
    placement: 'fourth',
  },
];

function YamahaHeroSlider({ onExplore }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return undefined;
    const intervalId = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % SLIDES.length);
    }, 3000);
    return () => window.clearInterval(intervalId);
  }, [isPaused]);

  const showPrevious = () => {
    setActiveSlide((current) => (current - 1 + SLIDES.length) % SLIDES.length);
  };

  const showNext = () => {
    setActiveSlide((current) => (current + 1) % SLIDES.length);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      showPrevious();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      showNext();
    }
  };

  return (
    <section
      className="yamaha-image-hero"
      aria-label="Featured Yamaha motorcycles"
      aria-roledescription="carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="yamaha-image-hero__slides" aria-live="off">
        {SLIDES.map((slide, index) => {
          const isActive = index === activeSlide;
          return (
            <div
              className={`yamaha-image-hero__slide yamaha-image-hero__slide--${slide.placement}${isActive ? ' is-active' : ''}`}
              key={slide.src}
              aria-hidden={!isActive}
            >
              <img
                className="yamaha-image-hero__image"
                src={slide.src}
                alt={isActive ? slide.alt : ''}
                fetchPriority={index === 0 ? 'high' : 'auto'}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding={index === 0 ? 'sync' : 'async'}
                draggable="false"
              />
              <div className="yamaha-image-hero__copy">
                <p className="yamaha-image-hero__eyebrow">{slide.eyebrow || 'YAMAHA MOTORCYCLES'}</p>
                <h1>{slide.title}</h1>
                <p className="yamaha-image-hero__subtitle">{slide.subtitle}</p>
                <button
                  type="button"
                  className="yamaha-image-hero__cta"
                  onClick={onExplore}
                >
                  EXPLORE THE RANGE <span aria-hidden="true">↓</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="yamaha-image-hero__controls" aria-label="Hero slide controls">
        <button
          className="yamaha-image-hero__arrow"
          type="button"
          onClick={showPrevious}
          aria-label="Previous slide"
        >
          <span aria-hidden="true">←</span>
        </button>
        <div className="yamaha-image-hero__indicators">
          {SLIDES.map((slide, index) => (
            <button
              className={`yamaha-image-hero__indicator${index === activeSlide ? ' is-active' : ''}`}
              key={slide.src}
              type="button"
              onClick={() => setActiveSlide(index)}
              aria-label={`Show slide ${index + 1}`}
              aria-current={index === activeSlide ? 'true' : undefined}
            />
          ))}
        </div>
        <button
          className="yamaha-image-hero__arrow"
          type="button"
          onClick={showNext}
          aria-label="Next slide"
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}

export default YamahaHeroSlider;
