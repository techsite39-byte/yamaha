# Website Technical Audit

**Audit date:** 2026-11-03  
**Scope:** Current working-tree source and configuration under the project root. This is a static code and asset inspection, not a production-host or infrastructure audit.

## 1. Executive Summary

This repository contains a client-rendered Yamaha motorcycle showcase built with React 18, JavaScript/JSX, Vite, and custom CSS. The current app has three implemented path variants: the home page (`/`), a service hero page (`/services`), and a motorcycle detail/configurator page (`/motorcycle-details?bike=...`). Navigation is implemented with the browser History API rather than a routing library.

**Currently implemented:** animated, responsive product pages; local image/video assets; client-side navigation; a data-driven list of seven motorcycles; scroll-linked canvas sequences; an image-based product configurator; reduced-motion handling for several animations; Vite static build configuration.

**Not found:** backend service, API routes, database, authentication/authorization, server-side form processing, hosting/deployment configuration, automated tests, lint/type-check scripts, sitemap, and robots.txt.

**Main risks / improvement opportunities:** a large public asset tree (about **1,444 MB** total; about **451 MB** excluding ZIP archives copied by the build plugin), stale Service navigation anchors after the page was reduced to a video hero, and a handful of unconnected or placeholder interactions. The Service hero now has a play/pause control and suppresses autoplay for reduced-motion preferences. Deployment platform and production security headers need manual verification.

The working tree was already dirty at inspection start, with edited and untracked Service-related files and six video files. This audit did not change those files; only this report is being added.

## 2. Complete Technology Stack

| Area | Finding | Classification | Evidence |
|---|---|---|---|
| UI framework | React 18.3.1 with React DOM 18.3.1; client-rendered SPA | Currently implemented | [package.json](./package.json), [src/main.jsx](./src/main.jsx) |
| Build/dev server | Vite; installed version 6.4.5; React plugin 4.7.0 | Currently implemented | [package.json](./package.json), [vite.config.js](./vite.config.js) |
| Languages | JavaScript (`.js`) and JSX (`.jsx`); no application TypeScript files were found | Currently implemented | [src/](./src/) |
| Markup and styles | One HTML shell; custom global and component CSS; no CSS framework found | Currently implemented | [index.html](./index.html), [src/styles.css](./src/styles.css), component CSS files |
| 3D/rendering libraries | Three.js, React Three Fiber, and Drei are dependencies; the sole Three.js scene component is not imported by the active app/component graph | Partially implemented / likely unused | [src/components/Yamaha/Yamaha3DScene.jsx](./src/components/Yamaha/Yamaha3DScene.jsx), [src/App.jsx](./src/App.jsx) |
| Animation | GSAP and its ScrollTrigger plugin are used for page/scroll animations | Currently implemented | [src/animations/yamahaScroll.js](./src/animations/yamahaScroll.js), page components |
| Smooth scrolling | Lenis is declared but there is no current source import | Not found in active source | [package.json](./package.json) |
| Backend/database | No server entry point, API route, ORM, database driver, schema, or database configuration was found | Not found | Repository root and [src/](./src/) |
| Hosting/deployment | No platform-specific deployment configuration was found. Vite can produce static output, but the actual host is unknown | Needs manual verification | [vite.config.js](./vite.config.js) |
| API architecture | No application API endpoints or HTTP client were found. `fetch()` calls load local frame assets | Not found for application APIs | [src/components/Yamaha/YamahaHeroSequence.jsx](./src/components/Yamaha/YamahaHeroSequence.jsx), [src/components/Yamaha/YamahaScrollFrames.jsx](./src/components/Yamaha/YamahaScrollFrames.jsx) |
| Authentication | No login, identity provider, token/session handling, or authorization checks found | Not found | Source inspection |
| Environment variables | No root `.env` files or `VITE_*`/`import.meta.env` references found | Not found in inspected workspace | [vite.config.js](./vite.config.js), [src/](./src/) |

### Application entry and navigation architecture

[src/main.jsx](./src/main.jsx) mounts `<App />` into `#root` using `createRoot` and React Strict Mode. [src/App.jsx](./src/App.jsx) selects views based on `window.location.pathname`, reads the optional `bike` query parameter, writes browser history entries, and listens for `popstate`. Unknown paths fall through to the home-page render. No React Router or equivalent is installed.

## 3. Frontend Architecture

- **Global shell:** [index.html](./index.html) supplies the root element, viewport/theme metadata, page title/description, and Google Fonts links. [src/styles.css](./src/styles.css) defines global typography, dark backgrounds, navigation/layout rules, and shared visual styles.
- **Shared navigation:** [YamahaHeader.jsx](./src/components/Yamaha/YamahaHeader.jsx) renders a fixed Yamaha header, desktop links, a responsive menu, route-aware active states, Escape-to-close behavior, and home/details/services actions.
- **Route-specific rendering:** [App.jsx](./src/App.jsx) shares the header and lazy-loads the Home, Service, and motorcycle details page components. The Service branch renders the header and video hero only.
- **Home page:** a cinematic sequence followed by featured model, discovery, frame sequence, browse-by-type, journey, popular models, “How It Works,” and footer sections.
- **Details page:** a model showcase with overview/specification tabs and category controls for wheels, body color, seat, accessories, and specifications.
- **State:** local React state/ref hooks; current model selection also travels in the query string and browser history state. No external state-management package or persistence layer was found.
- **Styling:** handwritten global and component CSS, with CSS custom properties, gradients, media queries, transitions, and bespoke class naming. No Tailwind, Bootstrap, CSS Modules, styled-components, or component-system dependency was found.

## 4. Backend Architecture

**Classification: Not found.** No backend framework, server process, server routes, middleware, API controllers, or service layer appears in the repository. Browser `fetch()` usage is for local static frame assets rather than business APIs. Consequently, no server request/response flow, API methods, or server error handling can be described from this codebase.

No file upload or booking submission endpoint exists in the inspected source. The currently rendered Service page has no form. The page’s old navigation still advertises booking/contact links, but the current Service hero does not contain booking sections.

## 5. Database Architecture

**Classification: Not found.** No database libraries, migration files, schemas, tables/collections, connection strings, or database environment settings were found. Motorcycle descriptions, feature lists, and specifications are static JavaScript data in [yamahaMotorcycles.js](./src/components/Yamaha/yamahaMotorcycles.js).

## 6. All Website Pages and Routes

| Page / URL | Purpose and available content | Components and interactions | Classification |
|---|---|---|---|
| `/` | Home/model discovery page. Hero; featured model and feature/category controls; motorcycle discovery panel; scroll-driven image sequence; browse-by-type cards; journey/features; popular bikes; “How It Works”; footer. | `YamahaHeader`, `YamahaIntro`, `YamahaHeroSequence`, `YamahaSection02`, `YamahaSection03`, `YamahaScrollFrames`, `YamahaSection05`, `YamahaJourneyHero`, `YamahaSection06`, `YamahaSection07`, `YamahaFooter`. Model selection is reflected in the detail link/history. | Currently implemented |
| `/services` | Service landing page, currently consisting of a full-viewport six-video hero only. Videos advance `s1` through `s6` and repeat. | `YamahaHeader`, `YamahaServices`. Muted inline autoplay, double-buffered video transition, play/pause and retry controls, reduced-motion handling. | Currently implemented |
| `/motorcycle-details?bike=<id>` | Selected motorcycle detail/configuration page. If `bike` is absent or not recognized, the data helper returns the default motorcycle. | `YamahaMotorcycleDetails`, lazy-loaded by `App.jsx`. Overview/specification tabs; category buttons; wheel color preference control (preference text only); disabled cart button; back action. | Currently implemented |
| Other paths | No explicit not-found page; unknown pathnames render the home-page fallback. | `App.jsx` route branching. | Partially implemented |

### Navigation connections and current route issues

- Home navigation opens `/`; details navigation opens `/motorcycle-details?bike=<id>`; Services opens `/services`.
- The details page’s back button returns through browser history when the app has recorded an origin; otherwise it falls back to the home performance section.
- The Service header and its menu still link to `#service-expertise`, `#service-process`, `#workshop`, and `#booking`. Those IDs are absent from the current hero-only Service DOM. These links therefore do not reach real sections.
- The Service header’s “BOOK SERVICE” and “CONTACT” links currently lead to that missing booking anchor.
- Home `YamahaSection05` has a “DISCOVER MORE” action targeting `.yamaha-section04`, but `YamahaSection04` is not mounted from `App.jsx`; that destination is absent on the rendered home page.
- `YamahaSection02`’s model CTA button has no click handler in its current implementation.

Evidence: [src/App.jsx](./src/App.jsx), [YamahaHeader.jsx](./src/components/Yamaha/YamahaHeader.jsx), [YamahaSection02.jsx](./src/components/Yamaha/YamahaSection02.jsx), [YamahaSection05.jsx](./src/components/Yamaha/YamahaSection05.jsx).

## 7. UI Design and Animation Technologies

### Visual design

- **Style:** cinematic/premium motorcycle presentation with dark backgrounds, high-contrast white text, blue highlights, large condensed headings, edge-to-edge imagery, and editorial section layouts.
- **Colors:** global values include dark `#080a0d`, near-white `#f4f5f6`, muted gray `#9299a2`, and blue `#1684e8`; sections add their own gradients and accent shades.
- **Typography:** Barlow Condensed for display/wordmark typography and Manrope for general UI/body text, loaded from Google Fonts in [index.html](./index.html). System fallbacks are present.
- **Responsive layout:** bespoke CSS breakpoints and `clamp()`, `min()`, and viewport units; the video hero uses `100svh` with a `100vh` fallback and `object-fit: cover`. No framework grid system is used.
- **UI elements:** CSS/inline-SVG decorative icons, buttons, product cards, tabs, configuration controls, navigation, and social links. No third-party icon package was found.

### Animation and interaction

- GSAP + ScrollTrigger power section reveals, pinned/parallax-style sections, and scroll-bound content transitions.
- [yamahaScroll.js](./src/animations/yamahaScroll.js) updates the home hero frame sequence from scroll progress and coordinates a camera-story helper.
- [YamahaIntro.jsx](./src/components/Yamaha/YamahaIntro.jsx) draws a 225-frame WebP intro to a canvas. [YamahaHeroSequence.jsx](./src/components/Yamaha/YamahaHeroSequence.jsx) draws a 300-frame WebP sequence to a canvas with queued loading and a bounded cache.
- [YamahaScrollFrames.jsx](./src/components/Yamaha/YamahaScrollFrames.jsx) draws a scroll-linked sequence from local PNG frames with bounded concurrency/cache.
- Some components check `prefers-reduced-motion` and disable or settle their GSAP effects. The Service video suppresses autoplay when reduced motion is requested; the user can still start it manually.

## 8. Installed Packages and Dependencies

Installed direct versions below were read from the local npm install; requested ranges are in [package.json](./package.json), and lockfile pins are in [package-lock.json](./package-lock.json).

### Runtime dependencies

| Package | Installed version | Purpose / observed use |
|---|---:|---|
| `react` | 18.3.1 | Component model, hooks, and rendering |
| `react-dom` | 18.3.1 | Mounts the React app |
| `gsap` | 3.15.0 | Animations and ScrollTrigger across home sections |
| `@react-three/fiber` | 8.18.0 | React renderer for Three.js; imported only by orphan `Yamaha3DScene.jsx` |
| `@react-three/drei` | 9.122.0 | Helpers for the Three.js scene; imported only by orphan `Yamaha3DScene.jsx` |
| `three` | 0.171.0 | 3D engine; imported only by orphan `Yamaha3DScene.jsx` |
| `lenis` | 1.3.27 | Smooth-scroll library; no current source import found |

### Development dependencies

| Package | Installed version | Purpose |
|---|---:|---|
| `vite` | 6.4.5 | Development server and production bundler |
| `@vitejs/plugin-react` | 4.7.0 | React support for Vite |

`package.json` overrides `hls.js` to `1.5.17`, but no HLS playback or direct application import was found. No UI component library, icon library, form-validation package, HTTP client, router, or state-management package is declared. Form-like input validation libraries are not present because the current pages have no active data-entry form.

**Likely unused / not in the active app graph:** `lenis`; the Three.js stack because `Yamaha3DScene.jsx` has no imports from other source files; `YamahaSection04.jsx` is also not imported by `App.jsx`. Confirm with bundle analysis before removing packages; nothing was removed during this audit.

The project has no test, lint, or type-check scripts in `package.json`. `npm audit --offline --json` returned zero listed advisories using locally available audit data. Offline data freshness is unknown, so this is not a current registry-backed vulnerability certification.

## 9. Images, Videos and Assets

### Observed public asset inventory

| Format | Count | Approximate size | Typical use / note |
|---|---:|---:|---|
| WebP | 532 | 110.9 MB | Home/logo frame sequences and model images |
| PNG | 241 | 196.7 MB | Scroll-frame sequence, backgrounds, and related artwork |
| MP4 | 6 | 25.1 MB | Service page video sequence |
| GLB | 3 | 118.7 MB | 3D model assets; no active source reference to these model URLs was found |
| ZIP | 5 | 992.7 MB | Source archives; excluded by the custom build copy step |

Counts and sizes come from the inspected `public/` directory; figures are rounded. The total is approximately **1,444 MB**. The build plugin copies non-ZIP public files recursively, giving an estimated copyable public payload of approximately **451 MB** before any host-side compression or caching.

Important locations:

- `public/imgs/`: eight Yamaha motorcycle/background images.
- `public/bikevid/`: 240 PNG frames; the scroll sequence requests a subset.
- `public/yamaha-logo-intro/`: 225 WebP frames for the logo intro.
- `public/yamahahero1/`: 300 WebP frames for the home hero sequence.
- `public/models/`: three GLB models and model ZIP archives.
- `public/s1.mp4` through `public/s6.mp4`: videos used by the Service page in order.

The source sequences use `Image`, `fetch`, `createImageBitmap`, and `<canvas>`; no image/video processing library is used in the runtime. Images in content cards use `loading="lazy"` and `decoding="async"` in several components. The Service page renders two video elements at a time for crossfading; the active clip is muted, inline, and autoplayed when motion is allowed. A play/pause control, reduced-motion suppression, near-end next-clip preloading, and a retry path for media errors are implemented.

**Branding and fonts:** Yamaha text/emblem treatment uses CSS and inline SVG. No standalone SVG icon directory or local font files were found. Google Fonts are fetched from `fonts.googleapis.com` / `fonts.gstatic.com`.

**Build behavior:** [vite.config.js](./vite.config.js) disables Vite’s default public copy and recursively copies public assets itself, skipping `.zip` files. This means unused non-archive files are still likely to be included in build output.

## 10. Performance Analysis

### Measurements

- `public/` inventory: approximately 1,444 MB overall; approximately 451 MB excluding ZIP files.
- Six MP4s together: approximately 25.1 MB.
- No production Core Web Vitals, Lighthouse score, network waterfall, or host response-time measurement was performed for this audit.

### Code-based observations

- **High payload risk:** 532 WebP and 241 PNG images plus three GLB files are in the recursively copied public tree. Unreferenced non-ZIP files are also copied.
- **Home hero:** 300 WebP frames total about 95.9 MB on disk. The implementation uses bounded concurrent loads and cache, but frame-driven interaction still creates decoding and network work on mobile.
- **Scroll frames:** 240 PNG frames total about 195.4 MB on disk; source code uses only a range and caps the in-memory cache/concurrency.
- **Service hero:** two video elements are used for crossfade. The next clip begins with metadata preload and is promoted to automatic preload near the current clip's end. The 25.1 MB total across all clips can contribute bandwidth over a full sequence; no separate mobile/low-bandwidth rendition was found.
- **Image loading:** several below-the-fold `<img>` elements specify lazy loading and async decoding. Canvas-frame sequences load independently and do their own cache management.
- **Code splitting:** motorcycle details is lazily imported in `App.jsx`; other page sections and their imports are part of the main app dependency graph.
- **Caching:** frame fetch calls request `cache: "force-cache"`; no explicit application service worker or cache policy was found. Production cache headers are host-dependent and need manual verification.
- **GPU/3D:** a Three.js scene component sets mobile DPR and demand rendering, but it is not connected to the active app graph.

## 11. SEO Analysis

| Item | Finding | Classification |
|---|---|---|
| Page title and description | Generic Yamaha title/description in `index.html`; Service component changes and restores title/description at runtime | Partially implemented |
| Viewport and theme color | Configured in `index.html` | Currently implemented |
| Route-specific metadata | Motorcycle detail route has no corresponding dynamic metadata update in inspected source | Partially implemented |
| Semantic headings/sections | Page sections use headings, `main`, `section`, and some accessible labels | Partially implemented |
| Open Graph / social card metadata | Not found | Not found |
| Canonical URL | Not found | Not found |
| Sitemap / robots.txt | Not found in project root/public | Not found |
| SSR/prerendering | Client-rendered SPA with a generic HTML shell; no SSR/static route prerendering config found | Not found |

Because routes are client-rendered and route titles mostly originate from the same HTML shell, search engines and link previews may not receive rich route-specific metadata without rendering JavaScript.

## 12. Security Analysis

### Findings

- **Exposed credentials:** No root `.env` files or obvious hard-coded credentials/API tokens were found in the inspected application/configuration. No secret values were read or printed. This is not a guarantee about ignored files, deployment settings, or external hosting.
- **Environment variable handling:** No `import.meta.env`/`VITE_*` use was found. `.gitignore` ignores `node_modules`, `.venv`, `dist`, and ZIP files, but does **not** explicitly ignore `.env*` files; add appropriate ignore rules if environment files are introduced.
- **Authentication/authorization:** No auth system or protected data/API exists in the repository.
- **API security/CORS:** No application API or CORS policy/configuration was found. Production response headers and origin policy require manual verification at the host.
- **Input validation:** The current active page set has no data-entry form. The `bike` query parameter is mapped to a fixed local model list with a default fallback.
- **File uploads:** No upload endpoint or upload UI was found.
- **External links:** Social links using `target="_blank"` include `rel="noreferrer"`.
- **Security headers:** No CSP, HSTS, or other production header configuration was found in the repository. Verify headers at the deployed host.
- **Dependency advisories:** Offline npm audit output listed zero advisories, but the cache’s freshness is unknown. A current online audit is still recommended.
- **Autoplay accessibility:** Service videos are hidden from assistive technology and now have a user-facing play/pause control; autoplay is suppressed when reduced motion is requested. This is primarily an accessibility/control concern, not evidence of exploitable code.

**Overall security classification:** no obvious application secrets or server-side attack surface were found in the inspected source; deployment-level security remains **Needs manual verification**.

## 13. Project Folder Structure

```text
/
├── index.html                 HTML shell, metadata, Google Font links
├── package.json               Scripts and direct dependencies
├── package-lock.json          Locked npm dependency graph
├── vite.config.js             React plugin and recursive public asset copy
├── README.md                  Minimal project readme
├── .gitignore                 Ignores dependencies, generated output, ZIP archives
├── public/
│   ├── imgs/                  Model/background images
│   ├── bikevid/               PNG scroll-animation frames
│   ├── yamaha-logo-intro/     WebP intro frames
│   ├── yamahahero1/           WebP hero sequence frames
│   ├── models/                GLB models and model ZIP archives
│   └── s1.mp4 ... s6.mp4      Service video sequence
├── scripts/
│   └── optimize-yamaha-frames.py  Pillow-based WebP frame conversion helper
└── src/
    ├── main.jsx               React entry point
    ├── App.jsx                Route state, shared header, page assembly
    ├── styles.css             Global design/layout CSS
    ├── animations/
    │   └── yamahaScroll.js    Scroll progress and camera GSAP helpers
    └── components/Yamaha/
        ├── YamahaHeader.jsx   Shared route-aware header/menu
        ├── YamahaFooter.jsx   Home footer
        ├── YamahaServices.jsx Service video hero
        ├── YamahaServicesVideo.css Service video layout/crossfade styles
        ├── YamahaMotorcycleDetails.jsx Details/configurator page
        ├── YamahaHeroSequence.jsx Canvas-driven WebP sequence
        ├── YamahaScrollFrames.jsx Canvas-driven PNG sequence
        ├── YamahaBikeTransition.jsx Animated bike/model transition
        ├── YamahaSection*.jsx Home content sections
        ├── YamahaJourneyHero.jsx Home journey section
        ├── Yamaha3DScene.jsx Unreferenced Three.js scene component
        ├── yamahaMotorcycles.js Static motorcycle data
        └── *.css                 Component styles
```

`node_modules/`, `.venv/`, and `dist/` may be present locally, but are ignored/generated or environment directories rather than application source. No backend, API, database, test, or deployment directory was found.

## 14. Issues and Potential Improvements

1. **High — public asset footprint:** reduce image/frame/model sizes, create responsive variants, and ensure the build does not publish unused assets. The inspected public payload is roughly 451 MB excluding ZIP archives.
2. **High — stale Service navigation:** update the Service header/menu destinations or restore matching sections; current section/book/contact anchors do not exist on the hero-only page.
3. **Medium — Service video delivery:** consider smaller mobile/low-bandwidth encodings or adaptive streaming if the hosting platform supports them; preserve the current sequence and source files.
4. **Medium — route completeness/SEO:** provide a not-found route and route-specific title/description, Open Graph, canonical, sitemap, and robots metadata as appropriate.
5. **Medium — placeholder data:** replace showroom address/email and generic social destinations with real approved business details before production.
6. **Medium — dead controls/destinations:** connect or remove the home featured-model CTA and the `.yamaha-section04` destination; clarify that cart/configuration controls are informational rather than functional.
7. **Low — dependency hygiene:** verify whether Lenis and the Three.js stack are needed; verify the orphan `Yamaha3DScene.jsx` and `YamahaSection04.jsx` before removing code or packages.
8. **Low — security operations:** ensure `.env*` is gitignored if introduced; configure and verify CSP, HSTS, MIME/cache policy, and other deployment headers on the real host.
9. **Quality tooling:** add repeatable lint, test, and bundle/asset-size checks if this project is expected to be maintained or deployed continuously.

## 15. Overall Technical Assessment

**Assessment:** a visually ambitious, front-end-only React/Vite showcase with bespoke design, animation, and static content. The client architecture is understandable and uses no unnecessary backend abstraction because none exists. The strongest implementation areas are local animated sequences, component-scoped presentation, responsive styling, and bounded image-frame caching.

The principal production concerns are the substantial static asset payload, the mismatch between the current Service hero and its retained navigation links, incomplete route/SEO metadata, and interactions that are placeholders or disconnected. Backend, hosting, production headers, deployment caching, and real-user performance remain **Needs manual verification**.

### Evidence and verification limits

- Package versions were read from installed packages and the lockfile.
- Public asset counts/sizes were measured from local files and rounded.
- Dependency audit was run in offline mode; advisory-data freshness is unknown.
- No files other than this report were created or edited by the audit.
