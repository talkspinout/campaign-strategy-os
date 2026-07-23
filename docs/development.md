# Development workflow

## Prerequisites

- Git
- Node.js 18 or newer
- npm
- A Chromium-based browser for UI verification

## Setup and commands

```bash
npm ci
npm run dev
npm run verify:data
npm run build
```

The production build is written to `dist/`.

## Change workflow

1. Confirm the requested scope and inspect `git status`.
2. Create a focused branch instead of working directly on `main`.
3. Update implementation, migration logic, and tests as one change when persisted data is affected.
4. Run data verification and the production build.
5. For UI changes, test the affected workflow at approximately 1440 px and 390 px widths.
6. Review the diff for accidental source material, analytics changes, and data-loss risks.
7. Commit with the reason for the change and the checks that passed.

## Data compatibility

- Current project files use schema v3.
- Existing project JSON and browser autosaves are user data; compatibility regressions are release-blocking.
- A template identifier rename requires an alias or migration and a regression test.
- Unknown or malformed cards should be recovered when possible rather than silently discarded.

## Browser and deployment

This repository is the web application. Do not change GitHub Pages, analytics, or public deployment behavior without an explicit request. Verify analytics-related effects do not fire repeatedly during ordinary card edits.
