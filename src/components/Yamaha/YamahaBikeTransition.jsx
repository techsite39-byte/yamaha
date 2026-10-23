import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './YamahaBikeTransition.css';
import { yamahaMotorcycles } from './yamahaMotorcycles.js';

gsap.registerPlugin(ScrollTrigger);

const motorcycles = yamahaMotorcycles.map(({ image, model }) => ({
  src: image,
  alt: `Yamaha ${model}`,
}));

const sequenceDuration = motorcycles.length + 0.2;
const transitionDuration = 0.44;

function getBikeState(activeIndex, imageIndex) {
  const imageScale = imageIndex === 5 ? 0.8 : 1;

  if (imageIndex === activeIndex) {
    return { xPercent: 0, y: 0, rotation: 0, scale: imageScale, autoAlpha: 1, zIndex: 3 };
  }

  const offset = imageIndex - activeIndex;
  if (Math.abs(offset) === 1) {
    return {
      xPercent: offset < 0 ? -38 : 38,
      y: 48,
      rotation: offset < 0 ? -3 : 3,
      scale: 0.58 * imageScale,
      autoAlpha: 0.24,
      zIndex: 1,
    };
  }

  if (activeIndex === 0 && imageIndex === 2) {
    return { xPercent: -47, y: 72, rotation: -5, scale: 0.44 * imageScale, autoAlpha: 0.12, zIndex: 0 };
  }
  if (activeIndex === motorcycles.length - 1 && imageIndex === motorcycles.length - 3) {
    return { xPercent: 47, y: 72, rotation: 5, scale: 0.44 * imageScale, autoAlpha: 0.12, zIndex: 0 };
  }

  return { xPercent: 0, y: 0, rotation: 0, scale: 0.5 * imageScale, autoAlpha: 0, zIndex: 0 };
}

function YamahaBikeTransition({ reducedMotion, activeIndex, onActiveChange, containerRef }) {
  const sectionRef = useRef(null);
  const imagesRef = useRef([]);

  useEffect(() => {
    const section = sectionRef.current?.closest('.yamaha-section02');
    const images = imagesRef.current.filter(Boolean);
    if (!section || images.length === 0) return undefined;

    const context = gsap.context(() => {
      gsap.set(images, { xPercent: 0, y: 0, rotation: 0, scale: 0.5, autoAlpha: 0, zIndex: 0 });
      images.forEach((image, index) => gsap.set(image, getBikeState(0, index)));
      const timeline = gsap.timeline();
      let currentIndex = 0;

      if (reducedMotion) {
        const progress = { value: 0 };
        timeline.to(progress, { value: 1, duration: sequenceDuration, ease: 'none' });
      } else {
        for (let index = 1; index < motorcycles.length; index += 1) {
          images.forEach((image, imageIndex) => {
            timeline.to(image, {
              ...getBikeState(index, imageIndex),
              duration: transitionDuration,
              ease: 'power1.inOut',
            }, index - transitionDuration / 2);
          });
        }

        images.slice(0, -1).forEach((image) => {
          timeline.to(image, {
            autoAlpha: 0,
            duration: 0.32,
            ease: 'none',
          }, sequenceDuration - 0.32);
        });
        timeline.to(images[images.length - 1], {
          y: () => window.innerHeight * 0.78,
          scale: 0.94,
          autoAlpha: 0,
          duration: 0.32,
          ease: 'none',
        }, sequenceDuration - 0.32);
      }

      const syncActiveBike = (self) => {
        const time = self.progress * sequenceDuration;
        const nextIndex = Math.min(motorcycles.length - 1, Math.floor(time + 1e-3));
        if (nextIndex === currentIndex) return;
        currentIndex = nextIndex;
        if (reducedMotion) {
          gsap.set(images, { autoAlpha: 0, xPercent: 0, y: 0, rotation: 0, scale: 1 });
          gsap.set(images[nextIndex], getBikeState(nextIndex, nextIndex));
        }
        onActiveChange(nextIndex);
      };

      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: () => `+=${window.innerHeight * sequenceDuration}`,
        pin: section,
        pinSpacing: true,
        anticipatePin: 1,
        scrub: true,
        animation: timeline,
        invalidateOnRefresh: true,
        onUpdate: syncActiveBike,
        onRefresh: syncActiveBike,
      });
    }, sectionRef);

    return () => context.revert();
  }, [onActiveChange, reducedMotion]);

  return (
    <div
      className="yamaha02-bike-sequence"
      aria-label={motorcycles[activeIndex].alt}
      ref={(node) => {
        sectionRef.current = node;
        if (typeof containerRef === 'function') containerRef(node);
        else if (containerRef) containerRef.current = node;
      }}
      role="img"
    >
      {motorcycles.map((motorcycle, index) => (
        <img
          key={motorcycle.src}
          ref={(image) => { imagesRef.current[index] = image; }}
          src={motorcycle.src}
          alt=""
          fetchpriority={index === activeIndex || index === Math.min(activeIndex + 1, motorcycles.length - 1) ? 'high' : 'low'}
          decoding="async"
          loading="eager"
        />
      ))}
    </div>
  );
}

export default YamahaBikeTransition;
