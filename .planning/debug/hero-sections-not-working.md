---
status: resolved
trigger: "Investigate why the hero sections are not working in the Yamaha React app. Scope: live hero components, App route wiring, data-loading/fallback behavior, and recent media paths under public/imgs/archive, public/imgs, and public. Check browser-facing URLs and server data. Reproduce root-cause evidence with read-only commands. If a clear code fix is identified, apply it precisely and verify with npm build. Do not alter unrelated public or admin areas. Return exact root cause, changed files, and verification evidence."
created: 2026-11-23T09:45:17+05:30
updated: 2026-11-23T09:50:00+05:30
---

## Current Focus

scope_gate: The active planning state limits work to the admin dashboard and prohibits further public-site changes. Read-only diagnosis is complete; no public/admin source edits or build were made. A remediation requires explicit authorization to expand project scope.
bug_class: Bohrbug (deterministic asset/data/version mismatch)
hypothesis: Current source and production deployment/data are out of sync. The current image hero accepts server-provided `image` paths verbatim; production API points to legacy PNGs absent from the current public source, while the production JS is an older bundle. The modified service hero uses untracked WebM assets that are 404 in production.
test: Verify tracked/ignored artifact state and compare current source vs served bundle, while distinguishing presently live behavior from the current worktree’s next-deploy behavior.
expecting: If the API/media mismatch is real but current deployed bundle remains old and serves PNGs, report a deployment/data-version mismatch (not a currently reproduced homepage outage); if current code is deployed and asks for 404 paths, confirm that specific hero regression.
reasoning_checkpoint:
  candidate_causes:
    - "code: YamahaHeroSlider copies nonempty API `image` into `img.src` without an image-error fallback or legacy-path rewrite."
    - "data: live `/api/public/home-page` returns `/imgs/f1.png`–`f4.png`, unlike current fixture `/imgs/archive/f1.webp`–`f4.webp`."
    - "environment/deploy: live bundle hash differs from local built bundle; the six new `.webm` files are untracked and the live `.webm` URLs 404."
  and_gate: "yes for a clean release failure: source/data must reference media not included in that release's static bundle; current live deployment is older and still has the old PNGs."
next_action: Confirm which target runtime (current production vs a local/current-source deployment) exhibits the reported symptom and authorize a public-site scope exception before applying a fix.

## Symptoms

expected: Hero sections in the Yamaha React app should render their intended content and media.
actual: User reports hero sections are not working; exact visual/runtime behavior not yet described.
errors: Not provided.
reproduction: Not provided; inspect app routes and browser-facing asset/API URLs.
started: Not provided.

## Eliminated

## Evidence

- timestamp: 2026-11-23T09:45:17+05:30
  checked: .planning/STATE.md and initial git status
  found: Current phase is Phase 1 — Live Overview & Trust Gaps, marked human_needed; project decisions say admin dashboard only and no further public-site changes. Worktree already contains many modifications, including public hero/service files, server data, and numerous deleted public assets.
  implication: Preserve all existing worktree changes. Public-site diagnosis may proceed read-only, but do not modify hero source or assets unless scope is explicitly changed by the user.

- timestamp: 2026-11-23T09:45:17+05:30
  checked: .planning/debug/knowledge-base.md and project skill directories
  found: No knowledge base exists; neither .github/skills nor .agents/skills is present.
  implication: No prior resolved pattern or project skill rule applies; continue with source/path/data tracing.

- timestamp: 2026-11-23T09:45:17+05:30
  checked: App.jsx, current public tree, hero references, websiteContent.json, websiteSections.json
  found: App routes the default path (including `/`) to lazy YamahaHome and `/services` to YamahaServices. YamahaHome renders YamahaHeroSlider at the top. YamahaHeroSlider starts with four local slide defaults and asynchronously replaces them only when `/api/public/home-page` returns nonempty `homePage.slides`; its failed-request fallback is silent. The current `/api/public/home-page` fixture uses archive f1-f4 desktop/mobile paths. Although the recursive directory listing appeared empty, a subsequent explicit `Test-Path` returned true for each sampled archive image, plus `/imgs/yamaha-mt15-showcase.webp` and `/s1.webm`.
  implication: The missing-file hypothesis is unconfirmed and must be treated as potentially disproven; direct file metadata and browser-facing HTTP checks are required.

- timestamp: 2026-11-23T09:45:17+05:30
  checked: public listeners and URL-existence probe
  found: No local listener was bound to ports 3000, 4173, 5000, or 5173. Explicit Test-Path says all sampled local media paths exist.
  implication: A dev-server HTTP check requires starting a local process (not yet done); the configured remote API origin is the available browser-facing target for read-only GET checks.

- timestamp: 2026-11-23T09:45:17+05:30
  checked: archive metadata and git state
  found: public/imgs/archive/f1-f4.webp and f1m-f4m.webp exist with nonzero sizes (140,834–230,786 bytes); f1.webp is tracked and the archive itself has no reported worktree changes. The five removed public/imgs/f0-f4.png assets are separately user-worktree deletions.
  implication: Hero source paths are locally backed by present image files. The prior hypothesis that archive assets are absent is disproven; do not restore or alter unrelated deletions.

- timestamp: 2026-11-23T09:45:17+05:30
  checked: production API GET and representative website media GET
  found: `https://vathilai-motors-api.onrender.com/api/public/home-page` returns HTTP 200 and its first slides use `/imgs/f1.png`, `/imgs/f2.png`, `/imgs/f3.png` (response body shows old PNG paths). `https://www.vathilaimotors.com/imgs/archive/f1.webp` and `f1m.webp` return HTTP 200 image/webp. Direct API-host `/imgs/archive/f1.webp` returns 404, as expected for static media served by the website origin rather than the API origin.
  implication: Production API data differs from the current `server/data/homePage.json`, which references `/imgs/archive/f1.webp` and desktop/mobile WebPs. Need test whether old PNG paths still resolve on the browser domain before confirming impact.

- timestamp: 2026-11-23T09:45:17+05:30
  checked: production browser-facing slide and service media URLs
  found: Website-domain `/imgs/f1.png` through `/imgs/f4.png` all return HTTP 200 image/png; archive `/imgs/archive/f1.webp` through f4.webp also return HTTP 200. In contrast `/s1.webm` through `/s6.webm` all return HTTP 404. `/imgs/Yamaha%20R15M.webp` returns HTTP 200.
  implication: The stale production home-page records are not the cause of the image hero failure because their returned PNG paths currently resolve. The service-video hero media paths are missing from the deployed site; confirm the deployed JS references them before claiming live component impact.

- timestamp: 2026-11-23T09:45:17+05:30
  checked: production and local built JS bundles
  found: Production HTML loads `/assets/index-BDQ-IBTq.js`; local `dist/index.html` loads `/assets/index-DPuDSsc1.js`. They differ. Production JS lacks current `yamaha-image-hero` and `service-video-hero` markers, contains `/imgs/f1.png`, and does not contain `/s1.webm`; production currently serves `/imgs/f1.png` (200) and `/s1.mp4` (200). Local source `YamahaServices.jsx` instead references `.webm`; those six public files are untracked, though present locally and in existing dist.
  implication: Do not claim that the current live deployment is requesting the new `.webm` paths or that the current homepage PNG requests fail. Current production is running an older hero bundle and matching legacy media. Deploying the current worktree’s hero changes without the untracked WebMs would produce missing video media.

- timestamp: 2026-11-23T09:45:17+05:30
  checked: Git and build artifact state
  found: `public/imgs/f1.png` is tracked in HEAD but deleted in the current worktree; `public/s1.webm` through `s6.webm` are untracked; `dist/` is Git-ignored and currently contains copies of both the deleted PNGs and untracked WebMs. Vite uses `emptyOutDir: false` and copies from current `public/`.
  implication: Existing local `dist` is not reliable proof of a clean deployment artifact; it retains stale media absent from tracked/current public inputs. A clean deployment with current source can lack the API's old PNGs and the service hero's new WebMs.

- timestamp: 2026-11-23T09:45:17+05:30
  checked: App route wiring and static component fallback
  found: App maps `/` to YamahaHome (which mounts YamahaHeroSlider) and `/services` to YamahaServices. YamahaHeroSlider defaults to four archive WebPs and keeps them if fetch fails/returns no slides, but replaces them on any nonempty API payload and uses returned image paths verbatim. Current archive images are present locally and return HTTP 200 on the production website.
  implication: Route wiring and default image fallback are not the cause. The unvalidated successful API payload is the data-dependent failure path; confirm impact against the exact release's static assets.

- hypothesis: App route wiring sends the homepage to the wrong or missing hero component
  evidence: App default path renders YamahaHome with YamahaHeroSlider; `/services` renders YamahaServices.
  timestamp: 2026-11-23T09:45:17+05:30

- hypothesis: Hero archive assets absent from current worktree
  evidence: Direct Test-Path and Get-ChildItem confirmed all eight configured desktop/mobile WebP files exist and are nonempty.
  timestamp: 2026-11-23T09:45:17+05:30

## Resolution

root_cause: Current source, public media inputs, and remote hero data are version-skewed. The live homepage API returns legacy `/imgs/f1.png`–`f4.png`; the current public tree deletes these paths, and YamahaHeroSlider adopts API image paths without validating or falling back on image error. Separately, current YamahaServices requests `/s1.webm`–`/s6.webm`, which are untracked local files and 404 on the live site. The currently served production JavaScript is an older bundle that uses the legacy paths and does not request the new WebMs; thus an active production homepage failure was not reproduced, but a clean deployment of current source is missing compatible media inputs.
fix: Not applied. Project scope in .planning/STATE.md and .planning/PROJECT.md is admin-only and prohibits further public-site changes. Remediation direction: align/migrate persistent home-page media references with shipped assets (or retain compatible old assets and add a real image-error fallback); include service WebMs in deployable source or keep a served format/path. First establish which runtime is failing and authorize scope expansion.
verification: Read-only source, filesystem, Git, and HTTP checks only. Production home-page API GET returned 200 with legacy PNG paths; those PNG URLs currently return 200. Archive WebP URLs return 200. Production `/s1.webm`–`/s6.webm` return 404 while `/s1.mp4`–`/s6.mp4` return 200. Served bundle hash differs from local dist. No npm build run because no source fix was applied and the project scope blocks public changes.
files_changed:
  - .planning/debug/hero-sections-not-working.md (debug record only)
