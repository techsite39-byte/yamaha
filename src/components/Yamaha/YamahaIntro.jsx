import React, { useEffect, useRef, useState } from 'react';

const FRAME_COUNT = 225;
const FRAME_RATE = 30;
const FRAME_DURATION = 1000 / FRAME_RATE;
const INTRO_DURATION = FRAME_COUNT * FRAME_DURATION;
const EXIT_DURATION = 700;
const FAILSAFE_DURATION = 12000;

let introStartedAt = null;
let introCompleted = false;

function frameUrl(index) {
  return `/yamaha-logo-intro/ezgif-frame-${String(index + 1).padStart(3, '0')}.jpg`;
}

function YamahaIntro() {
  const canvasRef = useRef(null);
  const [visible, setVisible] = useState(() => !introCompleted);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (introCompleted) {
      setVisible(false);
      return undefined;
    }

    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { alpha: false });
    if (!canvas || !context) {
      console.warn('Yamaha intro could not initialize its animation canvas.');
      introCompleted = true;
      setVisible(false);
      return undefined;
    }

    let cancelled = false;
    let animationFrame = 0;
    let exitTimer = 0;
    let failsafeTimer = 0;
    let lastRequestedFrame = -1;
    let lastDrawnFrame = -1;
    let prefetchedThrough = -1;
    const frames = new Map();
    const activeImages = new Set();

    const finish = () => {
      if (cancelled || introCompleted) return;
      introCompleted = true;
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(failsafeTimer);
      setLeaving(true);
      exitTimer = window.setTimeout(() => setVisible(false), EXIT_DURATION);
    };

    const loadFrame = (index) => {
      const cached = frames.get(index);
      if (cached) return cached instanceof Promise ? cached : Promise.resolve(cached);

      const image = new Image();
      image.decoding = 'async';
      activeImages.add(image);

      const promise = new Promise((resolve, reject) => {
        image.onload = () => {
          activeImages.delete(image);
          image.onload = null;
          image.onerror = null;
          if (frames.get(index) === promise) frames.set(index, image);
          resolve(image);
        };
        image.onerror = () => {
          activeImages.delete(image);
          image.onload = null;
          image.onerror = null;
          frames.delete(index);
          reject(new Error(`Unable to load Yamaha intro frame ${index + 1}.`));
        };
        image.src = frameUrl(index);
      });

      frames.set(index, promise);
      return promise;
    };

    const drawFrame = (image, index, force = false) => {
      if (cancelled || (!force && index === lastDrawnFrame)) return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pixelWidth = Math.round(rect.width * dpr);
      const pixelHeight = Math.round(rect.height * dpr);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const gradient = context.createRadialGradient(
        rect.width / 2,
        rect.height / 2,
        0,
        rect.width / 2,
        rect.height / 2,
        Math.max(rect.width, rect.height) * 0.72,
      );
      gradient.addColorStop(0, '#073b70');
      gradient.addColorStop(1, '#03172f');
      context.fillStyle = gradient;
      context.fillRect(0, 0, rect.width, rect.height);

      const scale = Math.min(rect.width / image.naturalWidth, rect.height / image.naturalHeight);
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      context.globalCompositeOperation = 'screen';
      context.drawImage(image, (rect.width - width) / 2, (rect.height - height) / 2, width, height);
      context.globalCompositeOperation = 'source-over';
      lastDrawnFrame = index;
    };

    const handleFrameError = (error) => {
      if (cancelled) return;
      console.warn('Yamaha intro animation ended early:', error);
      finish();
    };

    const requestCurrentFrame = (index) => {
      if (index === lastRequestedFrame) return;
      lastRequestedFrame = index;
      loadFrame(index)
        .then((image) => drawFrame(image, index))
        .catch(handleFrameError);
    };

    const prefetchFrames = (index) => {
      const through = Math.min(FRAME_COUNT - 1, index + 4);
      for (let next = prefetchedThrough + 1; next <= through; next += 1) {
        loadFrame(next).catch(handleFrameError);
      }
      prefetchedThrough = Math.max(prefetchedThrough, through);

      for (const [frameIndex, frame] of frames) {
        if (frameIndex < index - 2 && !(frame instanceof Promise)) frames.delete(frameIndex);
      }
    };

    const resizeCanvas = () => {
      if (lastDrawnFrame < 0) return;
      const current = frames.get(lastDrawnFrame);
      if (current && !(current instanceof Promise)) drawFrame(current, lastDrawnFrame, true);
    };

    const animate = () => {
      if (cancelled || introStartedAt === null) return;
      const elapsed = performance.now() - introStartedAt;
      const index = Math.min(Math.floor(elapsed / FRAME_DURATION), FRAME_COUNT - 1);
      requestCurrentFrame(index);
      prefetchFrames(index);

      if (elapsed >= INTRO_DURATION && lastDrawnFrame === FRAME_COUNT - 1) {
        finish();
        return;
      }
      animationFrame = window.requestAnimationFrame(animate);
    };

    failsafeTimer = window.setTimeout(() => {
      console.warn('Yamaha intro animation timed out; revealing the hero.');
      finish();
    }, FAILSAFE_DURATION);

    loadFrame(0)
      .then((image) => {
        if (cancelled) return;
        if (introStartedAt === null) introStartedAt = performance.now();
        drawFrame(image, 0);
        prefetchFrames(0);
        animationFrame = window.requestAnimationFrame(animate);
      })
      .catch(handleFrameError);

    window.addEventListener('resize', resizeCanvas);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(exitTimer);
      window.clearTimeout(failsafeTimer);
      window.removeEventListener('resize', resizeCanvas);
      for (const image of activeImages) {
        image.onload = null;
        image.onerror = null;
        image.src = '';
      }
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`yamaha-intro${leaving ? ' yamaha-intro--leaving' : ''}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="yamaha-intro__canvas" />
    </div>
  );
}

export default YamahaIntro;
