import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function mountYamahaScroll({ heroRef, progressRef, framePlayerRef, reducedMotion }) {
  const container = heroRef.current;
  if (!container) return () => {};

  const update = () => {
    const rect = container.getBoundingClientRect();
    const scrollRange = rect.height - window.innerHeight;
    const progress = reducedMotion || scrollRange <= 0
      ? 0
      : Math.min(1, Math.max(0, -rect.top / scrollRange));
    framePlayerRef.current?.setProgress(progress);
    if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`;
  };

  let refreshTimer = 0;
  const refreshAfterResize = () => {
    update();
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => {
      refreshTimer = 0;
      ScrollTrigger.refresh();
    }, 150);
  };

  const observer = new ResizeObserver(update);
  observer.observe(container);
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', refreshAfterResize, { passive: true });
  window.addEventListener('orientationchange', refreshAfterResize, { passive: true });
  update();

  return () => {
    observer.disconnect();
    window.removeEventListener('scroll', update);
    window.removeEventListener('resize', refreshAfterResize);
    window.removeEventListener('orientationchange', refreshAfterResize);
    window.clearTimeout(refreshTimer);
  };
}

export function mountStoryCamera({ cameraRef, motorcycleRef, rimLightRef, reducedMotion }) {
  const context = gsap.context(() => {
    if (reducedMotion) return;
    const states = [
      { position: [4.8, 2.6, 7.3], target: [0, 1, 0], scale: 1, x: 0, yaw: -0.14, light: 8 },
      { position: [1.9, 1.45, 2.8], target: [0, 0.9, 0], scale: 1.12, x: 0, yaw: -0.08, light: 19 },
      { position: [3.8, 1.9, 3.8], target: [0, 1, 0], scale: 1.07, x: -0.12, yaw: 0.05, light: 16 },
      { position: [1.75, 0.9, 2.8], target: [1.1, 0.6, 0], scale: 1.08, x: 0.1, yaw: 0.12, light: 21 },
      { position: [4.1, 2.4, 6.4], target: [0, 1, 0], scale: 1.02, x: 0, yaw: 0, light: 14 },
      { position: [5, 2.7, 7.2], target: [0, 1, 0], scale: 1, x: 0, yaw: -0.05, light: 11 },
      { position: [4.8, 2.6, 7.3], target: [0, 1, 0], scale: 1, x: 0, yaw: -0.14, light: 10 },
    ];
    const proxy = { step: 0 };
    const trigger = { trigger: '.yamaha-showroom', start: 'top top', end: 'bottom bottom', scrub: 1.4 };
    gsap.to(proxy, {
      step: states.length - 1,
      ease: 'none',
      scrollTrigger: {
        ...trigger,
        onUpdate: (self) => {
          const step = self.progress * (states.length - 1);
          const index = Math.min(Math.floor(step), states.length - 2);
          const mix = step - index;
          const from = states[index];
          const to = states[index + 1];
          cameraRef.current.camera.position.set(
            from.position[0] + (to.position[0] - from.position[0]) * mix,
            from.position[1] + (to.position[1] - from.position[1]) * mix,
            from.position[2] + (to.position[2] - from.position[2]) * mix,
          );
          cameraRef.current.camera.lookAt(
            from.target[0] + (to.target[0] - from.target[0]) * mix,
            from.target[1] + (to.target[1] - from.target[1]) * mix,
            from.target[2] + (to.target[2] - from.target[2]) * mix,
          );
          const next = (key) => from[key] + (to[key] - from[key]) * mix;
          if (motorcycleRef.current) {
            motorcycleRef.current.position.x = next('x');
            motorcycleRef.current.scale.setScalar(next('scale'));
            motorcycleRef.current.rotation.y = next('yaw');
          }
          if (rimLightRef.current) rimLightRef.current.intensity = next('light');
          cameraRef.current.invalidate();
          const progressBar = document.querySelector('.yamaha-showroom-progress i b');
          if (progressBar) progressBar.style.transform = `scaleY(${self.progress})`;
        },
      },
    });
  });
  return () => context.revert();
}
