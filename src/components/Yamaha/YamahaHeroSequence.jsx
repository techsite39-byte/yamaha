import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

const FRAME_COUNT = 300;
const INITIAL_FRAME_COUNT = 3;
const frameName = (index) => `ezgif-frame-${String(index + 1).padStart(3, '0')}.png`;

function decodeWithImageElement(url, signal) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    const cleanup = () => {
      image.onload = null;
      image.onerror = null;
      signal?.removeEventListener('abort', abort);
    };
    const abort = () => {
      cleanup();
      image.src = '';
      reject(new DOMException('Hero frame load aborted', 'AbortError'));
    };
    image.onload = () => {
      cleanup();
      resolve(image);
    };
    image.onerror = () => {
      cleanup();
      reject(new Error('Unable to decode hero frame'));
    };
    if (signal?.aborted) {
      abort();
      return;
    }
    signal?.addEventListener('abort', abort, { once: true });
    image.src = url;
  });
}

function decodeImage(url, signal) {
  if (typeof createImageBitmap === 'function') {
    return fetch(url, { cache: 'force-cache', signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Frame request failed (${response.status})`);
        return response.blob();
      })
      .then((blob) => {
        if (signal.aborted) throw new DOMException('Hero frame load aborted', 'AbortError');
        return createImageBitmap(blob);
      })
      .catch((error) => {
        if (signal.aborted) throw error;
        return decodeWithImageElement(url, signal);
      });
  }
  return decodeWithImageElement(url, signal);
}

const YamahaHeroSequence = forwardRef(function YamahaHeroSequence({ reducedMotion }, ref) {
  const canvasRef = useRef(null);
  const currentFrameRef = useRef(0);
  const targetFrameRef = useRef(0);
  const drawRef = useRef(() => {});
  const setProgressRef = useRef(() => {});
  const [firstFrameReady, setFirstFrameReady] = useState(false);
  const [initialFramesReady, setInitialFramesReady] = useState(0);
  const [failed, setFailed] = useState(false);

  useImperativeHandle(ref, () => ({ setProgress: (progress) => setProgressRef.current(progress) }), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { alpha: false, desynchronized: true });
    if (!canvas || !context) {
      setFailed(true);
      return undefined;
    }

    const cache = new Map();
    const pending = new Map();
    const queue = [];
    const initialLoaded = new Set();
    const concurrency = 3;
    const cacheLimit = (navigator.deviceMemory || 4) <= 4 ? 8 : 14;
    const retryAfter = new Map();
    const retryTimers = new Map();
    let activeLoads = 0;
    let direction = 1;
    let disposed = false;
    let sequenceReady = false;
    let lastDrawnFrame = -1;

    const basePath = '/yamahahero1/';
    const initialFrameCount = reducedMotion ? 1 : INITIAL_FRAME_COUNT;
    const release = (frame) => frame?.close?.();
    const touchFrame = (index) => {
      const frame = cache.get(index);
      if (!frame) return null;
      cache.delete(index);
      cache.set(index, frame);
      return frame;
    };

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2, 3840 / rect.width, 2160 / rect.height);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        lastDrawnFrame = -1;
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawClosestFrame(Math.round(currentFrameRef.current));
    };

    const draw = (frame, index, force = false) => {
      if (!frame || !canvas.isConnected) return;
      if (!force && index === lastDrawnFrame) return;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) return;
      context.fillStyle = '#080a0d';
      context.fillRect(0, 0, width, height);
      const sourceWidth = frame.width || frame.naturalWidth;
      const sourceHeight = frame.height || frame.naturalHeight;
      const scale = Math.max(width / sourceWidth, height / sourceHeight);
      const drawWidth = sourceWidth * scale;
      const drawHeight = sourceHeight * scale;
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(frame, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
      lastDrawnFrame = index;
    };
    drawRef.current = draw;

    const drawClosestFrame = (requestedIndex) => {
      let closestIndex = -1;
      let closestDistance = Infinity;
      for (const [index] of cache) {
        const distance = Math.abs(index - requestedIndex);
        if (distance < closestDistance) {
          closestIndex = index;
          closestDistance = distance;
        }
      }
      if (closestIndex >= 0 && closestIndex !== lastDrawnFrame) {
        draw(touchFrame(closestIndex), closestIndex);
      }
    };

    const evict = () => {
      while (cache.size > cacheLimit) {
        const [index, frame] = cache.entries().next().value;
        if (index === lastDrawnFrame && cache.size > 1) {
          cache.delete(index);
          cache.set(index, frame);
          continue;
        }
        cache.delete(index);
        release(frame);
      }
    };

    const enqueue = (index, priority) => {
      if (cache.has(index) || pending.has(index)) return;
      if ((retryAfter.get(index) || 0) > Date.now()) return;
      queue.push({ index, priority });
    };

    const scheduleRetry = (index) => {
      retryAfter.set(index, Date.now() + 2000);
      if (index === 0) setFailed(true);
      const existingTimer = retryTimers.get(index);
      if (existingTimer) window.clearTimeout(existingTimer);
      retryTimers.set(index, window.setTimeout(() => {
        retryTimers.delete(index);
        retryAfter.delete(index);
        if (index === 0 || Math.abs(index - Math.round(targetFrameRef.current)) <= 12) {
          enqueue(index, 0);
          pumpQueue();
        }
      }, 2000));
    };

    const pumpQueue = () => {
      while (!disposed && activeLoads < concurrency) {
        queue.sort((a, b) => a.priority - b.priority);
        const queued = queue.shift();
        if (!queued) return;
        const index = queued.index;
        if (cache.has(index) || pending.has(index)) continue;

        const controller = new AbortController();
        pending.set(index, controller);
        activeLoads += 1;
        let timedOut = false;
        const timeout = window.setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, 10000);
        decodeImage(`${basePath}${frameName(index)}`, controller.signal)
          .then((frame) => {
            if (!frame) return;
            if (disposed || controller.signal.aborted) {
              release(frame);
              if (timedOut) scheduleRetry(index);
              return;
            }
            retryAfter.delete(index);
            cache.set(index, frame);
            if (!sequenceReady) {
              sequenceReady = true;
              setFirstFrameReady(true);
            }
            setFailed(false);
            if (index < initialFrameCount && !initialLoaded.has(index)) {
              initialLoaded.add(index);
              setInitialFramesReady(initialLoaded.size);
            }
            const requestedIndex = Math.round(currentFrameRef.current);
            drawClosestFrame(requestedIndex);
            evict();
          })
          .catch((error) => {
            if (disposed) return;
            if (error.name === 'AbortError') {
              if (timedOut) scheduleRetry(index);
              return;
            }
            scheduleRetry(index);
          })
          .finally(() => {
            window.clearTimeout(timeout);
            if (pending.get(index) === controller) pending.delete(index);
            activeLoads -= 1;
            pumpQueue();
          });
      }
    };

    const prioritize = (target) => {
      const center = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(target)));
      for (const [index, controller] of pending) {
        if (Math.abs(index - center) > 14) controller.abort();
      }
      const urgent = [];
      for (let step = 0; step <= 12; step += 1) {
        const forward = center + direction * step;
        const backward = center - direction * step;
        if (forward >= 0 && forward < FRAME_COUNT) urgent.push(forward);
        if (step > 0 && backward >= 0 && backward < FRAME_COUNT) urgent.push(backward);
      }
      const queuedIndexes = new Set();
      const prioritizedQueue = [];
      for (let priority = 0; priority < urgent.length; priority += 1) {
        const index = urgent[priority];
        if (cache.has(index) || pending.has(index) || queuedIndexes.has(index)) continue;
        queuedIndexes.add(index);
        prioritizedQueue.push({ index, priority });
      }
      queue.splice(0, queue.length, ...prioritizedQueue);
      pumpQueue();
    };

    let animationFrame = 0;
    let previousAnimationTime = 0;
    const animate = (time) => {
      const difference = targetFrameRef.current - currentFrameRef.current;
      const delta = previousAnimationTime ? Math.min(time - previousAnimationTime, 64) : 0;
      const interpolation = Math.min(0.75, 1 - Math.exp(-delta / 55) + Math.abs(difference) * 0.004);
      currentFrameRef.current += difference * interpolation;
      previousAnimationTime = time;
      if (Math.abs(difference) < 0.01) currentFrameRef.current = targetFrameRef.current;
      drawClosestFrame(Math.round(currentFrameRef.current));
      animationFrame = requestAnimationFrame(animate);
    };
    if (!reducedMotion) animationFrame = requestAnimationFrame(animate);

    setProgressRef.current = (progress) => {
      const normalized = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
      const nextFrame = normalized * (FRAME_COUNT - 1);
      const previousRounded = Math.round(targetFrameRef.current);
      if (nextFrame !== targetFrameRef.current) direction = nextFrame > targetFrameRef.current ? 1 : -1;
      targetFrameRef.current = nextFrame;
      if (Math.round(nextFrame) !== previousRounded) prioritize(Math.round(nextFrame));
    };

    for (let index = 0; index < initialFrameCount; index += 1) enqueue(index, index);
    pumpQueue();
    resizeCanvas();

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(canvas);
    window.addEventListener('orientationchange', resizeCanvas, { passive: true });
    window.addEventListener('resize', resizeCanvas, { passive: true });

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      for (const timer of retryTimers.values()) window.clearTimeout(timer);
      for (const controller of pending.values()) controller.abort();
      observer.disconnect();
      window.removeEventListener('orientationchange', resizeCanvas);
      window.removeEventListener('resize', resizeCanvas);
      for (const frame of cache.values()) release(frame);
      cache.clear();
      pending.clear();
      queue.length = 0;
      setProgressRef.current = () => {};
      drawRef.current = () => {};
    };
  }, [reducedMotion]);

  return (
    <div className="yamaha-sequence" data-frame-ready={firstFrameReady}>
      <canvas ref={canvasRef} aria-label="Yamaha cinematic motorcycle sequence" role="img" />
      <div className={`sequence-loading ${firstFrameReady ? 'is-ready' : ''}`} aria-live="polite" aria-hidden={firstFrameReady}>
        <span className="sequence-brand">YAMAHA</span>
        <span>{failed ? 'SEQUENCE UNAVAILABLE' : 'LOADING EXPERIENCE'}</span>
        <i><b style={{ transform: `scaleX(${initialFramesReady / (reducedMotion ? 1 : INITIAL_FRAME_COUNT)})` }} /></i>
      </div>
    </div>
  );
});

export default YamahaHeroSequence;
