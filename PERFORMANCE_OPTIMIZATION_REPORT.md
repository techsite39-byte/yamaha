# Yamaha Website Performance Optimization Report

**Date:** 2026-11-03  
**Scope:** Performance improvements to the existing React/Vite website. Visual assets, page content, routes, branding, and user-facing behavior were preserved. No dependencies were installed and no source video files were modified.

## Executive Summary

- Converted the 130 PNG frames used by the home-page scroll sequence to lossless WebP. Pixel-by-pixel comparison confirmed the derivatives are identical to the source frames. The converted set is 44.1% smaller.
- Changed production asset copying to omit only those 130 PNGs when their WebP replacements are present. Original source PNGs remain in `public`.
- Split the Home and Service page code into lazy route chunks. Details was already lazy-loaded. This reduces JavaScript loaded for non-Home routes; the Home route still loads its own page chunk.
- Improved Service video loading and playback with metadata-first loading, near-end next-clip preloading, pause/play, reduced-motion autoplay suppression, and a visible retry path for media errors.
- The final production build passes. Production-preview checks verified all six video URLs, route rendering, sequence order and wraparound, pause/reduced-motion behavior, and no horizontal overflow at tested viewport widths.
- The optimized production output is **389.63 MiB**, compared with a pre-change measurement of approximately **451.7 MiB**. The build remains asset-heavy. Lighthouse, real-device, network-throttled, and Core Web Vitals measurements were not performed.

## Files Changed

| File(s) | Change |
|---|---|
| `src/App.jsx` | Lazy-load Home and Service route components while retaining the existing route behavior and loading fallback. |
| `src/components/Yamaha/YamahaHome.jsx` | Extract the existing Home composition and scroll setup into the Home route chunk. |
| `src/components/Yamaha/YamahaScrollFrames.jsx` | Request the WebP derivative for the active scroll-frame sequence. |
| `src/components/Yamaha/YamahaServices.jsx` | Limit media loading to the active and next clip, preload the next clip near the end, and add pause/play, reduced-motion, and retry handling. |
| `src/components/Yamaha/YamahaServicesVideo.css` | Style the video controls and error feedback without changing the hero layout. |
| `vite.config.js` | In production output only, omit a sequence PNG when its same-name WebP exists; other public files continue to be copied. |
| `public/bikevid/ezgif-frame-076.webp`–`public/bikevid/ezgif-frame-205.webp` | Add 130 lossless WebP derivatives. The original PNG files remain in the source tree. |
| `WEBSITE_TECHNICAL_AUDIT.md` | Correct Service-video and route-loading findings made outdated by these changes. |

No package manifest, lockfile, backend, API, database, environment variable, or MP4 source file was changed.

## Measured Results

### Image and production asset sizes

| Measurement | Before | After | Difference |
|---|---:|---:|---:|
| Converted 130-frame sequence | 147,676,116 bytes (source PNGs) | 82,548,800 bytes (WebP) | 65,127,316 bytes smaller (44.1%) |
| Full production `dist` output | About 451.7 MiB | 389.63 MiB (408,560,295 bytes) | About 62.1 MiB smaller (13.8%) |
| Frame assets in `dist` | 240 PNGs | 110 PNGs + 130 WebPs | Only the 130 replaced PNGs are omitted from production output |

The original PNGs are retained in `public/bikevid`; only the production copy step omits the 130 files with verified WebP replacements. The other 110 PNG frames remain in the build output.

### JavaScript and CSS build output

The baseline build recorded a 320.26 KB JavaScript entry (109.70 KB gzip) and a 93.29 KB CSS entry (18.59 KB gzip). Final Vite output:

| Chunk | JavaScript | Gzip | CSS | Gzip |
|---|---:|---:|---:|---:|
| App entry | 156.04 KB | 50.41 KB | 42.70 KB | 9.40 KB |
| Home route | 161.86 KB | 59.05 KB | 25.20 KB | 5.45 KB |
| Service route | 4.40 KB | 1.74 KB | 26.69 KB | 5.85 KB |
| Details route | 6.01 KB | 1.94 KB | 10.56 KB | 2.80 KB |
| All emitted chunks, summed | 328.31 KB | 113.14 KB | 105.15 KB | 23.50 KB |

The Home route combines the app-entry and Home-route chunks (about 317.90 KB JavaScript, 109.46 KB gzip), so route splitting should not be read as a material reduction in the Home route's total JavaScript. It does keep Home-specific code out of the entry used by other routes. The individual CSS/JS gzip figures are Vite's per-file values; summed values are approximate due to rounding and are not measurements of compressed HTTP responses.

### Videos

The six source videos total **26,279,819 bytes (about 25.06 MiB)**. All six corresponding URLs returned HTTP 200 from the production preview, and the copied build files match the source file sizes. The videos themselves were not recompressed or replaced.

## Implemented Optimizations

### Home animation frames

- Replaced the scroll component's requested PNG paths with lossless WebP equivalents for frames 076–205.
- Verified all 130 converted frames pixel-by-pixel and preserved their dimensions.
- Kept original PNG source assets in place; no potentially unused or non-sequence assets were deleted.
- Kept the existing scroll range, frame ordering, animation behavior, and other page content.

### Route loading

- Loaded Home and Service components through `React.lazy`; the existing Details route remains lazy-loaded.
- Extracted the pre-existing Home page composition and scroll setup without intentionally changing its content or sequence.
- Kept the existing application entry and navigation behavior.

### Service videos

- Continued to use two video elements for the crossfade, with only the active clip playing and the next clip eligible for preload.
- Use metadata preload by default; promote the next clip to automatic preload near the active clip's end.
- Provide an accessible play/pause button and suppress autoplay when `prefers-reduced-motion` is active. The user can still start playback manually.
- Display an error message and retry button if a video fails to load or start.
- Keep muted, inline playback and the exact `s1 → s2 → s3 → s4 → s5 → s6 → s1` loop.

## Verification

- **Production build:** `npm.cmd run build` — passed with Vite 6.4.5; 60 modules transformed.
- **Whitespace check:** `git diff --check` — passed. Git emitted only a line-ending notice for the pre-existing `src/styles.css`.
- **Production preview routes:** `/`, `/services`, and `/motorcycle-details?bike=mt-09` rendered. The browser reported no page errors on the Home and Details smoke checks.
- **Static media paths:** all six `/s1.mp4`–`/s6.mp4` files and the optimized WebP frame path returned HTTP 200.
- **Video behavior:** production browser test observed `s1`, `s2`, `s3`, `s4`, `s5`, `s6` in order and verified the next clip wrapped to `s1`. Pause stopped playback.
- **Reduced motion:** after enabling the reduced-motion preference and reloading, playback remained paused and the active clip used metadata preload. The play control remains available.
- **Responsive sizing:** production preview at widths 375, 768, 1024, and 1440 pixels had matching document and viewport widths, with no horizontal overflow. The full-height video hero filled each tested viewport.
- **Automated scripts:** `npm run` exposes `dev`, `build`, and `preview`; no test, lint, or type-check script is configured.

These are build, browser-preview, and asset-size checks, not a Lighthouse run or measurements of real-user performance.

## Remaining Risks and Approval Candidates

- **Large video payload:** all six MP4s total about 25.06 MiB. A mobile-specific encode, adaptive streaming, or CDN delivery could further reduce transfer, but would require approved media variants and hosting support. The current files were intentionally left unchanged.
- **Large overall public output:** `dist` remains about 389.63 MiB. Other image/model assets and the remaining PNG frames were not removed or recompressed because their usage or acceptable visual trade-offs were not verified.
- **Potential cleanup candidates, not removed:** the declared `lenis` dependency and the `Yamaha3DScene.jsx` / `YamahaSection04.jsx` components were previously observed as possible unused items. Verify references and approve before removal. Some model/3D assets may also merit a usage audit.
- **Unmeasured:** no Lighthouse/Core Web Vitals run, production-host/CDN test, real Android/iPhone test, or constrained-network test was performed. No claim is made about measured load-time, frame-rate, or battery improvements.
- **Loading policy trade-off:** next-video preloading improves transition readiness but may transfer part of the upcoming clip before it becomes active. Its exact network cost depends on browser buffering and was not measured under throttling.

No candidate dependency, component, or source asset was deleted as part of this work.
