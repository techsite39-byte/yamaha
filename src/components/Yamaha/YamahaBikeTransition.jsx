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
    const finalBike = images[images.length - 1];
    const nextSection = document.querySelector('.yamaha-section03');
    const centerSlot = nextSection?.querySelector('.yamaha03-bike-slot--center');
    const originalParent = finalBike.parentElement;
    let sourceRect = null;
    let crossingTrigger = null;
    let travelFinished = false;
    let handoffFrame = 0;

    const clearBikeTravel = () => {
      if (handoffFrame) {
        cancelAnimationFrame(handoffFrame);
        handoffFrame = 0;
      }
      nextSection?.classList.remove('is-bike-travelling');
      finalBike.classList.remove('yamaha02-bike-traveller');
      if (finalBike.parentElement !== originalParent) originalParent?.appendChild(finalBike);
      gsap.set(finalBike, { clearProps: 'position,left,top,right,bottom,width,height,objectFit,zIndex,x,y,xPercent,yPercent,rotation,scale,scaleX,scaleY,transformOrigin,autoAlpha' });
      sourceRect = null;
      travelFinished = false;
    };

    const updateBikeTravel = () => {
      if (!sourceRect || !nextSection || !centerSlot) return;

      const sectionRect = nextSection.getBoundingClientRect();
      if (travelFinished && sectionRect.top > 0) {
        document.body.appendChild(finalBike);
        travelFinished = false;
      }
      if (travelFinished) return;

      const slotRect = centerSlot.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const slotWidth = slotRect.width;
      const slotHeight = slotRect.height;
      const naturalWidth = finalBike.naturalWidth || sourceRect.width;
      const naturalHeight = finalBike.naturalHeight || sourceRect.height;
      const sourceFitScale = Math.min(sourceRect.width / naturalWidth, sourceRect.height / naturalHeight);
      const targetFitScale = Math.min(slotWidth / naturalWidth, slotHeight / naturalHeight);
      const targetScale = targetFitScale / sourceFitScale;
      const sourceCenterX = sourceRect.left + sourceRect.width / 2;
      const sourceCenterY = sourceRect.top + sourceRect.height / 2;
      const targetCenterX = slotRect.left + slotWidth / 2;
      const targetCenterY = slotRect.top + slotHeight / 2;
      let progress;
      let x;
      let y;
      let scale;

      if (sectionRect.top > 0) {
        progress = Math.min(1, Math.max(0, 1 - sectionRect.top / viewportHeight));
      } else {
        progress = 1;
      }

      x = (targetCenterX - sourceCenterX) * progress;
      y = (targetCenterY - sourceCenterY) * progress;
      scale = 1 + (targetScale - 1) * progress;

      gsap.set(finalBike, {
        position: 'fixed',
        left: sourceRect.left,
        top: sourceRect.top,
        right: 'auto',
        bottom: 'auto',
        width: sourceRect.width,
        height: sourceRect.height,
        objectFit: 'contain',
        zIndex: 2,
        x,
        y,
        xPercent: 0,
        yPercent: 0,
        rotation: 0,
        scale,
        transformOrigin: 'center center',
        autoAlpha: 1,
      });

      if (sectionRect.top <= 0) {
        centerSlot.appendChild(finalBike);
        gsap.set(finalBike, {
          position: 'absolute',
          left: 0,
          top: 0,
          right: 'auto',
          bottom: 'auto',
          width: '100%',
          height: '100%',
          x: 0,
          y: 0,
          xPercent: 0,
          yPercent: 0,
          rotation: 0,
          scale: 1,
          scaleX: 1,
          scaleY: 1,
          transformOrigin: 'center center',
          autoAlpha: 1,
        });
        travelFinished = true;
      }
    };

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
        timeline.to(finalBike, {
          y: () => window.innerHeight * 0.12,
          scale: 0.94,
          autoAlpha: 1,
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

      if (!reducedMotion && nextSection && centerSlot) {
        timeline.eventCallback('onComplete', () => {
          handoffFrame = requestAnimationFrame(() => {
            handoffFrame = 0;
            const rect = finalBike.getBoundingClientRect();
            sourceRect = {
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
            };
            document.body.appendChild(finalBike);
            finalBike.classList.add('yamaha02-bike-traveller');
            nextSection.classList.add('is-bike-travelling');
            updateBikeTravel();
          });
        });
        timeline.eventCallback('onReverseComplete', clearBikeTravel);
        crossingTrigger = ScrollTrigger.create({
          trigger: nextSection,
          start: 'top bottom',
          end: 'bottom top',
          onUpdate: updateBikeTravel,
          onRefresh: updateBikeTravel,
        });
      }
    }, sectionRef);

    return () => {
      crossingTrigger?.kill();
      clearBikeTravel();
      context.revert();
    };
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
