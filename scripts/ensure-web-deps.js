#!/usr/bin/env node
/**
 * ensure-web-deps.js
 *
 * Runs `npm install` inside web-ui/ if its node_modules is missing or incomplete.
 * Idempotent — skips installation when web-ui/node_modules/vite already exists.
 *
 * This is wired as both `postinstall` (so a fresh `npm install` at repo root
 * also installs web-ui deps) and `predev` (so `npm run dev` self-heals if
 * someone deleted web-ui/node_modules).
 *
 * Cross-platform: pure Node, no shell features required (works on Termux too).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const WEB_UI = path.join(ROOT, 'web-ui');
const WEB_UI_NODE_MODULES = path.join(WEB_UI, 'node_modules');
const VITE_BIN = path.join(WEB_UI_NODE_MODULES, '.bin', 'vite');
const REACT_PKG = path.join(WEB_UI_NODE_MODULES, 'react');
const PLUGIN_REACT = path.join(WEB_UI_NODE_MODULES, '@vitejs', 'plugin-react');

function log(msg) {
  // Visible prefix so it's clear in `concurrently` output
  console.log(`[setup] ${msg}`);
}

function isWebUiInstalled() {
  // Heuristic: check for vite binary, react, and @vitejs/plugin-react
  // All three are required for `vite.config.ts` to load successfully.
  return (
    fs.existsSync(VITE_BIN) &&
    fs.existsSync(REACT_PKG) &&
    fs.existsSync(PLUGIN_REACT)
  );
}

function main() {
  if (!fs.existsSync(WEB_UI)) {
    console.error(`[setup] ERROR: web-ui/ directory not found at ${WEB_UI}`);
    process.exit(1);
  }

  if (!fs.existsSync(path.join(WEB_UI, 'package.json'))) {
    console.error(`[setup] ERROR: web-ui/package.json not found`);
    process.exit(1);
  }

  if (isWebUiInstalled()) {
    log('web-ui dependencies already installed, skipping.');
    return;
  }

  log('Installing web-ui dependencies (one-time setup)...');
  try {
    // Use --no-audit --no-fund for speed; --prefix works cross-platform
    execSync('npm install --prefix web-ui --no-audit --no-fund', {
      cwd: ROOT,
      stdio: 'inherit'
    });
    log('web-ui dependencies installed successfully.');
  } catch (err) {
    console.error(`[setup] FAILED to install web-ui dependencies: ${err.message}`);
    console.error(`[setup] You can try manually: cd web-ui && npm install`);
    process.exit(1);
  }
}

main();
