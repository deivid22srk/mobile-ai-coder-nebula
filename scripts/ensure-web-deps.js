#!/usr/bin/env node
/**
 * ensure-web-deps.js
 *
 * Three responsibilities, in order:
 *   1. Install web-ui/node_modules if missing (idempotent — skips when present).
 *   2. Detect when web-ui/src/ has changed since the last `npm run dev` and
 *      clear Vite's dep-optimizer cache (web-ui/node_modules/.vite/) so the
 *      next dev server start re-bundles fresh source.
 *   3. Stamp a build-version file (web-ui/.build-version) with the current
 *      git SHA + timestamp, so the UI can surface "you're running version X"
 *      and the user can confirm a `git pull` actually took effect.
 *
 * Wired as `postinstall` (so a fresh `npm install` at repo root also installs
 * web-ui deps) and `predev` (so `npm run dev` self-heals and clears stale
 * caches).
 *
 * Cross-platform: pure Node, no shell features required (works on Termux too).
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const WEB_UI = path.join(ROOT, 'web-ui');
const WEB_UI_NODE_MODULES = path.join(WEB_UI, 'node_modules');
const VITE_BIN = path.join(WEB_UI_NODE_MODULES, '.bin', 'vite');
const REACT_PKG = path.join(WEB_UI_NODE_MODULES, 'react');
const PLUGIN_REACT = path.join(WEB_UI_NODE_MODULES, '@vitejs', 'plugin-react');
const VITE_CACHE = path.join(WEB_UI_NODE_MODULES, '.vite');
const SRC_DIR = path.join(WEB_UI, 'src');
const BUILD_VERSION_FILE = path.join(WEB_UI, '.build-version');
const STAMP_FILE = path.join(WEB_UI, '.last-dev-run');

function log(msg) {
  console.log(`[setup] ${msg}`);
}

function warn(msg) {
  console.warn(`[setup] WARNING: ${msg}`);
}

function isWebUiInstalled() {
  return (
    fs.existsSync(VITE_BIN) &&
    fs.existsSync(REACT_PKG) &&
    fs.existsSync(PLUGIN_REACT)
  );
}

function getLatestMtime(dir, maxDepth = 5, depth = 0) {
  if (!fs.existsSync(dir) || depth > maxDepth) return 0;
  let latest = 0;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (_) {
    return 0;
  }
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    try {
      const stat = fs.statSync(full);
      if (stat.isFile()) {
        if (stat.mtimeMs > latest) latest = stat.mtimeMs;
      } else if (entry.isDirectory()) {
        const subLatest = getLatestMtime(full, maxDepth, depth + 1);
        if (subLatest > latest) latest = subLatest;
      }
    } catch (_) {
      // ignore
    }
  }
  return latest;
}

function getGitSha() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch (_) {
    return 'unknown';
  }
}

function getGitCommitTime() {
  try {
    return execSync('git log -1 --format=%cI', { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch (_) {
    return new Date().toISOString();
  }
}

function writeBuildVersion() {
  const sha = getGitSha();
  const commitTime = getGitCommitTime();
  const content = JSON.stringify({
    sha,
    commitTime,
    buildTime: new Date().toISOString(),
    nodeVersion: process.version,
    platform: `${os.platform()}/${os.arch()}`
  }, null, 2);
  try {
    fs.writeFileSync(BUILD_VERSION_FILE, content, 'utf8');
  } catch (_) {
    // ignore — non-fatal
  }
}

/**
 * Decide whether to clear Vite's optimizer cache.
 * Triggers:
 *   - .vite/ cache doesn't exist yet (no need to "clear" but make sure parent dir is OK)
 *   - Last dev run stamp is missing (first run after install)
 *   - Any file under web-ui/src/ is newer than the last dev run stamp
 *   - Git HEAD changed since last run (cheap SHA check)
 */
function maybeClearViteCache() {
  if (!fs.existsSync(VITE_CACHE)) {
    // Nothing to clear — Vite will create it fresh on first start.
    return false;
  }

  let shouldClear = false;
  let reason = '';

  // Reason 1: no previous run stamp → first dev after install, but cache
  // exists, so it might be stale from a previous repo state.
  if (!fs.existsSync(STAMP_FILE)) {
    shouldClear = true;
    reason = 'no previous run stamp';
  } else {
    // Read previous stamp
    let prev = null;
    try {
      prev = JSON.parse(fs.readFileSync(STAMP_FILE, 'utf8'));
    } catch (_) {
      shouldClear = true;
      reason = 'stamp file unreadable';
    }

    if (prev) {
      // Reason 2: git SHA changed since last run
      const currentSha = getGitSha();
      if (currentSha !== 'unknown' && prev.sha && prev.sha !== currentSha) {
        shouldClear = true;
        reason = `git HEAD changed (${prev.sha} → ${currentSha})`;
      } else {
        // Reason 3: source files newer than last run
        const srcLatest = getLatestMtime(SRC_DIR);
        const rootPkgMtime = (() => {
          try { return fs.statSync(path.join(WEB_UI, 'package.json')).mtimeMs; } catch (_) { return 0; }
        })();
        const configFileMtime = (() => {
          try { return fs.statSync(path.join(WEB_UI, 'vite.config.ts')).mtimeMs; } catch (_) { return 0; }
        })();
        const newestChange = Math.max(srcLatest, rootPkgMtime, configFileMtime);
        if (newestChange > prev.timestamp) {
          shouldClear = true;
          reason = `source files updated since last run (${new Date(newestChange).toISOString()})`;
        }
      }
    }
  }

  if (shouldClear) {
    try {
      // Delete .vite directory recursively
      fs.rmSync(VITE_CACHE, { recursive: true, force: true });
      log(`Cleared Vite optimizer cache (${reason}).`);
      return true;
    } catch (err) {
      warn(`Failed to clear Vite cache: ${err.message}`);
      warn(`You can clear it manually: rm -rf web-ui/node_modules/.vite`);
      return false;
    }
  }
  return false;
}

function writeStamp() {
  const stamp = JSON.stringify({
    sha: getGitSha(),
    timestamp: Date.now(),
    iso: new Date().toISOString()
  }, null, 2);
  try {
    fs.writeFileSync(STAMP_FILE, stamp, 'utf8');
  } catch (_) {
    // non-fatal
  }
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

  // Step 1: install deps if missing
  if (!isWebUiInstalled()) {
    log('Installing web-ui dependencies (one-time setup)...');
    try {
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
  } else {
    log('web-ui dependencies already installed, skipping install.');
  }

  // Step 2: clear Vite cache if source changed since last run
  const cleared = maybeClearViteCache();
  if (!cleared) {
    log('Vite cache is up-to-date, no clear needed.');
  }

  // Step 3: write build-version file (for UI to display)
  writeBuildVersion();

  // Step 4: write stamp file (for next run comparison)
  writeStamp();

  const sha = getGitSha();
  log(`Ready — git HEAD: ${sha}`);
}

main();
