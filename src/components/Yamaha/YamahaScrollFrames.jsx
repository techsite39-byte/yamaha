import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './YamahaScrollFrames.css';

gsap.registerPlugin(ScrollTrigger);

const FIRST_FRAME_INDEX = 75;
const LAST_FRAME_INDEX = 204;
const INITIAL_FRAME_RADIUS = 2;
const CACHE_LIMIT = 6;
const framePath = (index) => `/bikevid/ezgif-frame-${String(index + 1).padStart(3, '0')}.webp`;

function decodeImageElement(url, signal) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    const cleanup = () => {
      image.onload = null;
      image.onerror = null;
      signal.removeEventListener('abort', abort);
    };
    const abort = () => {
      cleanup();
      image.src = '';
      reject(new DOMException('Frame load aborted', 'AbortError'));
    };

    image.onload = async () => {
      cleanup();
      try {
        if (typeof image.decode === 'function') await image.decode();
        resolve(image);
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => {
      cleanup();
      reject(new Error(`Unable to load frame: ${url}`));
    };

    if (signal.aborted) {
      abort();
      return;
    }
    signal.addEventListener('abort', abort, { once: true });
    image.src = url;
  });
}

async function decodeFrame(url, signal) {
  if (typeof createImageBitmap !== 'function') return decodeImageElement(url, signal);

  const response = await fetch(url, { cache: 'force-cache', signal });
  if (!response.ok) throw new Error(`Frame request failed (${response.status}): ${url}`);
  const image = await createImageBitmap(await response.blob());
  if (signal.aborted) {
    image.close();
    throw new DOMException('Frame load aborted', 'AbortError');
  }
  return image;
}

function releaseFrame(frame) {
  if (typeof frame.close === 'function') {
    frame.close();
  } else {
    frame.src = '';
  }
}

function YamahaScrollFrames({ reducedMotion }) {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const progressRef = useRef(null);
  const canvasReadyRef = useRef(false);
  const [canvasReady, setCanvasReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const canvasContext = canvas?.getContext('2d', { alpha: false, desynchronized: true });
    if (!canvas || !canvasContext) {
      console.error('Unable to initialize the Yamaha frame canvas.');
      return undefined;
    }
    canvasReadyRef.current = false;
    setCanvasReady(false);

    const cache = new Map();
    const pending = new Map();
    let queue = [];
    let activeLoads = 0;
    let targetIndex = FIRST_FRAME_INDEX;
    let lastDrawnIndex = -1;
    let lastTargetIndex = FIRST_FRAME_INDEX;
    let disposed = false;
    let drawFrameId = 0;
    let renderWidth = 0;
    let renderHeight = 0;

    const lowPowerDevice = (navigator.deviceMemory !== undefined && navigator.deviceMemory <= 4)
      || (navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency <= 4);
    const concurrency = lowPowerDevice ? 1 : 2;
    const cacheLimit = lowPowerDevice ? 4 : CACHE_LIMIT;
    const preloadRadius = reducedMotion ? 0 : INITIAL_FRAME_RADIUS;
    const initialFrameCount = reducedMotion ? 1 : INITIAL_FRAME_RADIUS + 1;
    const initialFramesSettled = new Set();
    let initialBufferReady = false;
    let latestProgress = 0;

    const touch = (index) => {
      const frame = cache.get(index);
      if (!frame) return null;
      cache.delete(index);
      cache.set(index, frame);
      return frame;
    };

    const draw = (index) => {
      const frame = touch(index);
      if (!frame || index === lastDrawnIndex || disposed) return;

      const width = renderWidth;
      const height = renderHeight;
      if (!width || !height) return;

      const sourceWidth = frame.width || frame.naturalWidth;
      const sourceHeight = frame.height || frame.naturalHeight;
      const maxWidth = width;
      const maxHeight = height;
      const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
      const drawWidth = sourceWidth * scale;
      const drawHeight = sourceHeight * scale;

      canvasContext.fillStyle = '#061a33';
      canvasContext.fillRect(0, 0, width, height);
      canvasContext.imageSmoothingEnabled = true;
      canvasContext.imageSmoothingQuality = 'high';
      canvasContext.drawImage(frame, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
      lastDrawnIndex = index;
      if (!canvasReadyRef.current) {
        canvasReadyRef.current = true;
        setCanvasReady(true);
      }
    };

    const resizeCanvas = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
      renderWidth = width;
      renderHeight = height;
      const maxPixels = 2_500_000;
      const maxDpr = lowPowerDevice ? 1.2 : 1.75;
      const dpr = Math.min(
        window.devicePixelRatio || 1,
        maxDpr,
        Math.sqrt(maxPixels / (width * height)),
      );
      const pixelWidth = Math.max(1, Math.round(width * dpr));
      const pixelHeight = Math.max(1, Math.round(height * dpr));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
        canvasContext.setTransform(dpr, 0, 0, dpr, 0, 0);
        lastDrawnIndex = -1;
        draw(targetIndex);
      }
    };

    const evictFrames = () => {
      while (cache.size > cacheLimit) {
        const oldestIndex = cache.keys().next().value;
        if (oldestIndex === targetIndex || oldestIndex === lastDrawnIndex) {
          const frame = cache.get(oldestIndex);
          cache.delete(oldestIndex);
          cache.set(oldestIndex, frame);
          if ([...cache.keys()].every((index) => index === targetIndex || index === lastDrawnIndex)) break;
          continue;
        }
        releaseFrame(cache.get(oldestIndex));
        cache.delete(oldestIndex);
      }
    };

    const settleInitialFrame = (index) => {
      if (index < FIRST_FRAME_INDEX || index >= FIRST_FRAME_INDEX + initialFrameCount) return;
      initialFramesSettled.add(index);
      if (!initialBufferReady && initialFramesSettled.size === initialFrameCount) {
        initialBufferReady = true;
        setProgress(latestProgress);
      }
    };

    const pumpQueue = () => {
      while (!disposed && activeLoads < concurrency && queue.length) {
        const index = queue.shift();
        if (cache.has(index) || pending.has(index)) continue;

        const controller = new AbortController();
        pending.set(index, controller);
        activeLoads += 1;
        decodeFrame(framePath(index), controller.signal)
          .then((frame) => {
            if (disposed || controller.signal.aborted) {
              releaseFrame(frame);
              return;
            }
            cache.set(index, frame);
            evictFrames();
            if (index === targetIndex) draw(index);
            settleInitialFrame(index);
          })
          .catch((error) => {
            if (!disposed && error.name !== 'AbortError') {
              console.error(`Unable to load Yamaha frame ${index + 1}.`, error);
              settleInitialFrame(index);
            }
          })
          .finally(() => {
            if (pending.get(index) === controller) pending.delete(index);
            activeLoads -= 1;
            if (
              !disposed
              && controller.signal.aborted
              && !cache.has(index)
              && Math.abs(index - targetIndex) <= preloadRadius
              && !queue.includes(index)
            ) {
              queue.push(index);
              queue.sort((a, b) => Math.abs(a - targetIndex) - Math.abs(b - targetIndex));
            }
            pumpQueue();
          });
      }
    };

    const requestFrames = (centerIndex) => {
      const direction = centerIndex >= lastTargetIndex ? 1 : -1;
      if (centerIndex !== lastTargetIndex) {
        lastTargetIndex = centerIndex;
      }
      pending.forEach((controller, index) => {
        if (index >= FIRST_FRAME_INDEX + initialFrameCount && Math.abs(index - centerIndex) > preloadRadius) {
          controller.abort();
        }
      });
      const priorities = [centerIndex];
      for (let distance = 1; distance <= preloadRadius; distance += 1) {
        const next = centerIndex + distance * direction;
        const previous = centerIndex - distance * direction;
        if (next >= FIRST_FRAME_INDEX && next <= LAST_FRAME_INDEX) priorities.push(next);
        if (previous >= FIRST_FRAME_INDEX && previous <= LAST_FRAME_INDEX) priorities.push(previous);
      }

      queue = queue.filter((index) => index >= FIRST_FRAME_INDEX
        && index <= LAST_FRAME_INDEX
        && Math.abs(index - centerIndex) <= preloadRadius);
      priorities.forEach((index) => {
        if (index >= FIRST_FRAME_INDEX
          && index <= LAST_FRAME_INDEX
          && !cache.has(index)
          && !pending.has(index)
          && !queue.includes(index)) {
          queue.push(index);
        }
      });
      queue.sort((a, b) => Math.abs(a - centerIndex) - Math.abs(b - centerIndex));
      pumpQueue();
    };

    const setProgress = (progress) => {
      latestProgress = progress;
      if (!initialBufferReady) return;
      targetIndex = FIRST_FRAME_INDEX
        + Math.round(progress * (LAST_FRAME_INDEX - FIRST_FRAME_INDEX));
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`;
      if (drawFrameId) window.cancelAnimationFrame(drawFrameId);
      drawFrameId = window.requestAnimationFrame(() => {
        drawFrameId = 0;
        draw(targetIndex);
      });
      requestFrames(targetIndex);
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas);
    requestFrames(FIRST_FRAME_INDEX);

    let gsapContext;
    if (!reducedMotion) {
      gsapContext = gsap.context(() => {
        ScrollTrigger.create({
          trigger: sectionRef.current,
          pin: stageRef.current,
          pinSpacing: true,
          start: 'top top',
          end: () => `+=${Math.round(window.innerHeight * (window.innerWidth <= 650 ? 1.8 : 2.25))}`,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: ({ progress }) => setProgress(progress),
          onRefresh: ({ progress }) => setProgress(progress),
        });
      }, sectionRef);
    }

    return () => {
      disposed = true;
      if (drawFrameId) window.cancelAnimationFrame(drawFrameId);
      resizeObserver.disconnect();
      gsapContext?.revert();
      pending.forEach((controller) => controller.abort());
      cache.forEach(releaseFrame);
      cache.clear();
      queue = [];
    };
  }, [reducedMotion]);

  return (
    <section ref={sectionRef} className="yamaha-scroll-frames" aria-label="Yamaha racing motorcycle frame sequence">
      <div ref={stageRef} className="yamaha-scroll-frames__stage">
        <img
          className={`yamaha-scroll-frames__poster${canvasReady ? ' is-hidden' : ''}`}
          src={framePath(FIRST_FRAME_INDEX)}
          width="1920"
          height="1080"
          alt=""
          aria-hidden="true"
          fetchpriority="high"
        />
        <canvas
          ref={canvasRef}
          className={`yamaha-scroll-frames__canvas${canvasReady ? ' is-ready' : ''}`}
          aria-hidden="true"
        />
        <div className="yamaha-scroll-frames__heading">
          <p className="yamaha-scroll-frames__eyebrow"><i /> YAMAHA / RACING DNA</p>
          <h2>PRECISION<br />IN MOTION.</h2>
        </div>
        <div className="yamaha-scroll-frames__footer" aria-hidden="true">
          <span>SCROLL TO EXPLORE</span>
          <span>YAMAHA MOTORCYCLES</span>
          <span>04 / 06</span>
        </div>
        <div ref={progressRef} className="yamaha-scroll-frames__progress" aria-hidden="true" />
      </div>
    </section>
  );
}

export default YamahaScrollFrames;
