# Odd One Out Daily

A mobile-first visual puzzle PWA built with React, TypeScript, and Vite. Every daily challenge contains five deterministic rounds; each round has exactly one odd shape. The app works entirely in the browser—no accounts, backend, database, paid API, analytics, or external game assets.

## Features

- **Same daily puzzles for everyone:** puzzle layout and odd answer are generated from a versioned FNV-1a date seed using a deterministic xorshift generator. Dates use UTC, so different devices reproduce the same daily puzzle.
- **Five timed rounds:** 4×4, 4×4, 5×5, 5×5, and 6×6 shape grids. Each round changes exactly one attribute (color, rotation, size, or symbol) on one tile. The round generator selects the odd tile once and all other tiles share the same properties.
- **Score and progress:** 100 points for a correct answer, −20 for each wrong tap or missed round (score floors at zero); elapsed time, errors, correct finds, streak, daily personal best, and the last 100 run records.
- **Unlimited practice mode:** create a fresh puzzle set without changing the daily streak or daily personal best.
- **Share:** share a reproducible challenge URL (`?day=YYYY-MM-DD`), share result text via Web Share where supported, and download a generated SVG result card. Browsers without sharing support fall back to copying the link/text.
- **Offline-ready PWA:** lightweight service worker caches the application shell and same-origin assets after first load. The manifest and app icons are generated local SVG/PNG assets.
- **English and Arabic:** switch language in the header; Arabic sets the document direction to RTL.
- **Accessibility:** semantic buttons, keyboard focus indicators, live feedback, reduced-motion support, and large touch targets.
- **Local-only by design:** all player data is in `localStorage`. There are no global rankings or cross-device sync.

## Requirements

- Node.js 22 or later; Node.js 24 LTS is recommended. The included GitHub Actions workflow uses Node.js 24.
- npm.

## Run locally

```bash
npm install
npm run dev
```

Vite prints a local URL, typically `http://localhost:5173/`.

## Run tests and build

```bash
npm test
npm run typecheck
npm run build
npm run preview
```

The tests cover daily seed consistency, unique odd-tile generation, date validation, practice seeds, scoring and edge cases, local bests, and daily streak handling. `npm run build` creates the production app in `dist/`.

## Deploy to GitHub Pages

The repository includes `.github/workflows/deploy.yml`; it installs dependencies, runs tests, builds the app, and deploys `dist/` to Pages. Vite uses relative asset paths (`base: './'`), which supports GitHub's project-page URL as well as a root deployment.

1. Create a new GitHub repository named **`odd-one-out-daily`** (or use another name; the workflow does not hard-code the repository name).
2. Push this project's contents to the repository's `main` branch. For example:

   ```bash
   git init
   git add .
   git commit -m "Build Odd One Out Daily PWA"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/odd-one-out-daily.git
   git push -u origin main
   ```

3. On GitHub, open **Settings → Pages**. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. Open the repository's **Actions** tab and let **Deploy Odd One Out Daily to GitHub Pages** finish. The green deployment step links to the public URL. For a project repository, the URL normally looks like `https://YOUR-USERNAME.github.io/odd-one-out-daily/`.
5. For future updates, push commits to `main`; the workflow redeploys automatically. You can also run it manually from **Actions → Deploy Odd One Out Daily to GitHub Pages → Run workflow**.

The PWA service worker requires HTTPS in production; GitHub Pages provides HTTPS. To verify installation/offline caching, open the deployed URL once, use the browser's install/add-to-home-screen command if available, and then reload the app after disconnecting.

## Daily challenge URLs

The app uses `?day=YYYY-MM-DD` as its share token. A recipient opens the same date key and receives the same generated set of five puzzles. Invalid dates are ignored and the current UTC date is used. Historical share links remain reproducible. Completing an old shared challenge does not alter the active daily streak.

## Scoring and history details

- Each successful round awards 100 points.
- Each wrong tap or timed-out round counts as a mistake and subtracts 20 points.
- A score cannot be negative.
- Daily personal best compares score first and fastest completion time second.
- The streak increments once per UTC date for consecutive daily completions; replaying the same day's puzzle does not increment it a second time.
- Practice runs appear in recent history but do not change daily streaks or personal best.
- The latest 100 runs are stored on the current browser/device. Clearing browser site data clears that history.

## Project structure

```text
src/
  App.tsx                 Application screens and interactions
  components/ShapeTile.tsx SVG tile shapes
  game/engine.ts           Seeded puzzle generator and scoring
  game/storage.ts          Local history, streak, preferences, best score
  game/i18n.ts             English and Arabic strings
  styles.css               Responsive design and motion preferences
public/
  icon.svg                 Vector application icon source
  icon-192.png             Install icon (192×192)
  icon-512.png             Install icon (512×512)
  apple-touch-icon.png     iOS home-screen icon
  manifest.webmanifest     PWA metadata
  sw.js                    Dependency-free offline cache
 tests/                    Vitest tests for generator/scoring/storage rules
.github/workflows/         Automated test, build, and Pages deployment
```

## Privacy and limitations

No personal data leaves the device. Streaks and history are browser-local and do not synchronize between devices. There is deliberately no global ranking because there is no server. The Web Share API and app installation prompts depend on browser/OS support; copy and download fallbacks are provided.

## Troubleshooting

- If offline launch does not work on the very first visit, keep the page open until the service worker finishes installing; the built HTML, JavaScript, stylesheet, manifest, and local icons are precached during installation.
- If a device does not show an install prompt, use its browser menu's **Install app** or **Add to Home Screen** option. Install prompts are browser-controlled and are not available on every platform.
- To reset local progress, clear this site's local storage in your browser's site settings. There is no server-side account or recovery mechanism.
