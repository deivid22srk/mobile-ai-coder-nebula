#!/usr/bin/env node
/**
 * clean-caches.js
 *
 * Manually clears all caches that can make a `git pull` look like nothing
 * changed:
 *   1. web-ui/node_modules/.vite/         — Vite's dep-optimizer cache
 *   2. web-ui/.last-dev-run               — stamp file used to detect changes
 *   3. web-ui/.build-version              — forces regeneration
 *
 * Run with: `npm run clean`
 *
 * After running, `npm run dev` will re-bundle everything fresh.
 * Also recommended: hard-reload the browser (Ctrl+Shift+R or Cmd+Shift+R)
 * to clear the browser's HTTP cache.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WEB_UI = path.join(ROOT, 'web-ui');
const TARGETS = [
  path.join(WEB_UI, 'node_modules', '.vite'),
  path.join(WEB_UI, '.last-dev-run'),
  path.join(WEB_UI, '.build-version')
];

function log(msg) {
  console.log(`[clean] ${msg}`);
}

let cleared = 0;
let missing = 0;

for (const target of TARGETS) {
  if (fs.existsSync(target)) {
    try {
      fs.rmSync(target, { recursive: true, force: true });
      const rel = path.relative(ROOT, target);
      log(`Removed ${rel}`);
      cleared++;
    } catch (err) {
      console.error(`[clean] FAILED to remove ${target}: ${err.message}`);
    }
  } else {
    missing++;
  }
}

log(`Done — cleared ${cleared} cache(s), ${missing} already absent.`);
log(`Now run: npm run dev`);
log(`And in your browser: hard-reload with Ctrl+Shift+R (or Cmd+Shift+R on Mac).`);
