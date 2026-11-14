---
last_mapped_commit: f6c9a5d8e0135d046e50ff8948baa688d88d5df7
last_mapped_at: 2026-11-14
---
﻿# Codebase Structure

**Analysis Date:** 2026-11-14

## Directory Layout

```text
[yamaha]/
├── .planning/                     # project planning artifacts and mapping outputs
├── public/                       # static assets, uploads, videos, and dealership media
├── scripts/                      # helper scripts for project operations
├── server/                       # backend API, storage logic, and admin stores
│   ├── data/                     # JSON persistence fallback for admin records and catalogs
│   ├── adminStores.js            # generic store abstraction for Mongo/file storage
│   └── index.js                  # Express app, auth, route definitions, validation
├── src/                          # React single-page application
│   ├── components/               # feature-specific UI modules
│   │   ├── Admin/                # admin portal screen collection
│   │   └── Yamaha/               # public-facing marketing, catalog, and booking screens
│   ├── App.jsx                  # route orchestration and page selection
│   ├── main.jsx                 # app bootstrap and initial catalog hydration
│   ├── styles.css               # global styling foundation
│   └── ...
├── .gitignore                    # repository ignore rules
├── index.html                    # Vite HTML entry point
├── package.json                  # Node scripts and dependencies
├── vite.config.js                # Vite config + backend proxy/middleware
├── README.md                     # project setup and operational notes
├── ADMIN_*.md                   # feature and quality audit reports
├── PERFORMANCE_OPTIMIZATION_REPORT.md
├── WEBSITE_TECHNICAL_AUDIT.md
├── dist/                         # production bundle output (generated)
├── node_modules/                 # installed dependencies (generated)
├── package-lock.json             # lockfile
└── public/                      # static front-end media
```

## Directory Purposes

**`src/`:**
- Purpose: Frontend application shell and React components.
- Contains: Route logic, marketing pages, admin UI, styles, and data helpers.
- Key files: `src/App.jsx`, `src/main.jsx`, `src/styles.css`

**`src/components/Yamaha/`:**
- Purpose: Public sales and marketing content for the Yamaha dealership experience.
- Contains: Animated sections, product detail pages, booking flow, landing pages, and shared config.
- Key files: `src/components/Yamaha/YamahaHome.jsx`, `src/components/Yamaha/YamahaBikeCatalog.jsx`, `src/components/Yamaha/YamahaBookingPage.jsx`, `src/components/Yamaha/yamahaMotorcycles.js`

**`src/components/Admin/`:**
- Purpose: Administrative CRUD, analytics, content management, media library, and settings console.
- Contains: Dashboard views, API clients, demo mode helpers, and navigation metadata.
- Key files: `src/components/Admin/YamahaAdmin.jsx`, `src/components/Admin/YamahaAdminSections.jsx`, `src/components/Admin/adminApi.js`, `src/components/Admin/adminNavigation.js`

**`server/`:**
- Purpose: Express backend, authorization, validation, persistence, and static file serving.
- Contains: REST endpoints, middleware, store wrappers, and saved JSON databases.
- Key files: `server/index.js`, `server/adminStores.js`, `server/data/`

**`public/`:**
- Purpose: Static files that are served as browser assets and uploaded media content.
- Contains: Images, web assets, bike media, and dealership content.
- Key files: `public/` image folders and bundled site assets

**`scripts/`:**
- Purpose: Project scripts and helper pipeline tasks.
- Contains: Operational files for maintenance and local tooling.
- Key files: `scripts/`

## Key File Locations

**Entry Points:**
- `src/main.jsx`: React bootstrap for the browser app.
- `src/App.jsx`: Route selection and public/admin view composition.
- `server/index.js`: Node/Express application entry point.
- `vite.config.js`: Vite dev/build setup and backend proxy definition.

**Configuration:**
- `package.json`: Dependency list and NPM scripts such as `dev`, `dev:api`, `build`, and `start`.
- `vite.config.js`: Server proxy and asset copy behavior.
- `README.md`: Local setup and deployment instructions.

**Core Logic:**
- `src/components/Yamaha/yamahaMotorcycles.js`: Shared motorcycle data source and replacement logic.
- `src/components/Yamaha/yamahaCatalogueUtils.js`: ID/slug matching and price/configurator helpers.
- `src/components/Yamaha/businessConfig.js`: Business contact metadata and URL helpers.
- `server/index.js`: All public and admin endpoints, validation, and persistence orchestration.
- `server/adminStores.js`: Persistence abstraction across JSON and MongoDB.

**Testing:**
- Not detected in the repository structure; no dedicated test runner or spec files were found under the app source tree.

## Naming Conventions

**Files:**
- React component files are PascalCase and end in `.jsx` (for example `YamahaHeader.jsx`, `YamahaBikeCatalog.jsx`).
- Shared helpers and API modules use camelCase and end in `.js` (for example `adminApi.js`, `yamahaCatalogueUtils.js`).
- Server modules and config files use lowercase or descriptive names (for example `index.js`, `adminStores.js`, `vite.config.js`).

**Directories:**
- Feature directories are by domain, not by layer: `Yamaha/` and `Admin/` under `src/components/`.
- Storage directories are named by responsibility: `server/data/`, `public/`, `scripts/`.

## Where to Add New Code

**New public feature:**
- Primary code: `src/components/Yamaha/`
- Shared data: `src/components/Yamaha/yamahaMotorcycles.js` and `src/components/Yamaha/yamahaCatalogueUtils.js`
- Route composition: `src/App.jsx`

**New admin module:**
- Implementation: `src/components/Admin/`
- API wiring: `src/components/Admin/adminApi.js` and `server/index.js`
- Store logic: `server/adminStores.js`

**New backend endpoint:**
- Route definition: `server/index.js`
- Persistence access: `server/adminStores.js`
- Validation: `server/index.js` helper functions such as `validateBookingInput()`

**Utilities and shared helpers:**
- UI helpers: `src/components/Yamaha/` or `src/components/Admin/`
- Server/utilities: `server/`

## Special Directories

**`public/`:**
- Purpose: Static media and uploaded files served to the browser.
- Generated: No; it is a checked-in working media directory.
- Committed: Yes.

**`server/data/`:**
- Purpose: Local JSON persistence fallback for catalog and admin collections.
- Generated: It may be created at runtime when the database is not configured.
- Committed: Usually not committed, but present as a working runtime directory when needed.

**`dist/`:**
- Purpose: Production build output generated by Vite.
- Generated: Yes.
- Committed: No.

**`node_modules/`:**
- Purpose: Installed dependency tree for the project.
- Generated: Yes.
- Committed: No.

---

*Structure analysis: 2026-11-14*
