const blessed = require('blessed');
const { spawn, execSync } = require('child_process');
const { existsSync } = require('fs');
const { resolve } = require('path');
const http = require('http');

const PROJECT_DIR = __dirname;
const PORT = process.env.PORT || 3000;

const screen = blessed.screen({
  smartCSR: true,
  title: '*coder — TUI Launcher',
  bg: '#0a0a0b',
  cursor: { artificial: true, blink: true, shape: 'underline', color: '#c4622d' },
});

let serverProcess = null;

function checkDepsInstalled() {
  return existsSync(resolve(PROJECT_DIR, 'node_modules'));
}

function checkServerRunning() {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${PORT}`, (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => { req.destroy(); resolve(false); });
  });
}

const box = blessed.box({
  top: 0, left: 0, width: '100%', height: '100%',
  bg: '#0a0a0b',
});

const headerBar = blessed.box({
  parent: box,
  top: 0, left: 0, width: '100%', height: 5,
  bg: '#121214',
  border: { type: 'line', fg: '#27272a', bottom: true },
  style: { border: { bottom: { fg: '#27272a' } } },
});

const logoAsterisk = blessed.text({
  parent: headerBar,
  top: 0, left: 2, height: 3,
  content: '*',
  style: { fg: '#c4622d', bold: true },
  tags: true,
  align: 'left',
  valign: 'middle',
});

const logoText = blessed.text({
  parent: headerBar,
  top: 0, left: 5, height: 3,
  content: 'coder',
  style: { fg: '#fafafa', bold: true },
  tags: true,
  align: 'left',
  valign: 'middle',
});

const subtitleText = blessed.text({
  parent: headerBar,
  top: 2, left: 2, height: 1,
  content: 'mobile AI agent — TUI Launcher',
  style: { fg: '#71717a' },
  tags: true,
});

const statusIndicator = blessed.box({
  parent: headerBar,
  top: 0, right: 2, height: 3, width: 16,
  align: 'center',
  valign: 'middle',
  style: { fg: '#71717a' },
  content: ' ● IDLE',
});

const separatorLine = blessed.text({
  parent: box,
  top: 5, left: 0, width: '100%', height: 1,
  content: '',
  style: { fg: '#27272a' },
  tags: true,
});

const mainArea = blessed.box({
  parent: box,
  top: 6, left: 0, width: '100%', height: '100%-11',
  bg: '#0a0a0b',
});

const menuBox = blessed.box({
  parent: mainArea,
  top: 1, left: 'center', width: 50, height: 12,
  bg: '#121214',
  border: { type: 'line', fg: '#27272a' },
  style: {
    border: { fg: '#27272a' },
    bg: '#121214',
  },
  shadow: true,
});

const menuTitle = blessed.text({
  parent: menuBox,
  top: 1, left: 2, height: 1,
  content: 'MENU',
  style: { fg: '#71717a', bold: true },
  tags: true,
});

const btnStartServer = blessed.button({
  parent: menuBox,
  top: 3, left: 2, height: 1, right: 2,
  content: ' ▶  Start Server',
  align: 'left',
  valign: 'middle',
  bg: '#121214',
  fg: '#a1a1aa',
  hoverBg: '#1f1f23',
  focusBg: '#1f1f23',
  style: {
    fg: '#a1a1aa',
    bg: '#121214',
    focus: { fg: '#fafafa', bg: '#1f1f23' },
    hover: { fg: '#fafafa', bg: '#1f1f23' },
  },
  mouse: true,
  keys: true,
  shrink: true,
  padding: { left: 2, right: 2 },
});

const btnCheckUpdates = blessed.button({
  parent: menuBox,
  top: 5, left: 2, height: 1, right: 2,
  content: ' ◖  Check for Updates',
  align: 'left',
  valign: 'middle',
  bg: '#121214',
  fg: '#a1a1aa',
  hoverBg: '#1f1f23',
  focusBg: '#1f1f23',
  style: {
    fg: '#a1a1aa',
    bg: '#121214',
    focus: { fg: '#fafafa', bg: '#1f1f23' },
    hover: { fg: '#fafafa', bg: '#1f1f23' },
  },
  mouse: true,
  keys: true,
  shrink: true,
  padding: { left: 2, right: 2 },
});

const btnInstallDeps = blessed.button({
  parent: menuBox,
  top: 7, left: 2, height: 1, right: 2,
  content: ' ⚡  Install Dependencies',
  align: 'left',
  valign: 'middle',
  bg: '#121214',
  fg: '#a1a1aa',
  hoverBg: '#1f1f23',
  focusBg: '#1f1f23',
  style: {
    fg: '#a1a1aa',
    bg: '#121214',
    focus: { fg: '#fafafa', bg: '#1f1f23' },
    hover: { fg: '#fafafa', bg: '#1f1f23' },
  },
  mouse: true,
  keys: true,
  shrink: true,
  padding: { left: 2, right: 2 },
});

const btnExit = blessed.button({
  parent: menuBox,
  top: 9, left: 2, height: 1, right: 2,
  content: ' ✕  Exit',
  align: 'left',
  valign: 'middle',
  bg: '#121214',
  fg: '#a1a1aa',
  hoverBg: '#1f1f23',
  focusBg: '#1f1f23',
  style: {
    fg: '#a1a1aa',
    bg: '#121214',
    focus: { fg: '#fafafa', bg: '#1f1f23' },
    hover: { fg: '#fafafa', bg: '#1f1f23' },
  },
  mouse: true,
  keys: true,
  shrink: true,
  padding: { left: 2, right: 2 },
});

const logBox = blessed.box({
  parent: box,
  bottom: 2, left: 0, width: '100%', height: 8,
  bg: '#0a0a0b',
});

const logBorder = blessed.box({
  parent: logBox,
  top: 0, left: 0, width: '100%', height: '100%',
  bg: '#0d0d0f',
  border: { type: 'line', fg: '#27272a' },
  style: {
    border: { fg: '#27272a' },
    bg: '#0d0d0f',
  },
});

const logTitle = blessed.text({
  parent: logBox,
  top: 0, left: 2, height: 1,
  content: ' Output ',
  style: { fg: '#71717a', bold: true },
  tags: true,
  bg: '#0a0a0b',
});

const logContent = blessed.log({
  parent: logBox,
  top: 1, left: 1, right: 1, bottom: 1,
  bg: '#0d0d0f',
  fg: '#a1a1aa',
  scrollable: true,
  alwaysScroll: true,
  scrollbar: {
    ch: ' ',
    track: { bg: '#121214' },
    style: { bg: '#27272a' },
  },
  style: {
    fg: '#a1a1aa',
    bg: '#0d0d0f',
  },
  tags: true,
});

const helpText = blessed.text({
  parent: box,
  bottom: 1, left: 1, height: 1,
  content: ' {#71717a}Tab/Arrows{/} navigate  {#71717a}Enter{/} select  {#71717a}Q{/} quit',
  style: { fg: '#71717a' },
  tags: true,
});

const buttons = [btnStartServer, btnCheckUpdates, btnInstallDeps, btnExit];
let currentIndex = 0;

function updateButtonStyles() {
  buttons.forEach((btn, i) => {
    if (i === currentIndex) {
      btn.style.fg = '#c4622d';
      btn.style.bg = '#1f1f23';
      btn.left = 1;
    } else {
      btn.style.fg = '#a1a1aa';
      btn.style.bg = '#121214';
      btn.left = 2;
    }
  });
  screen.render();
}

function log(msg, color = '#a1a1aa') {
  logContent.add(`{${color}-fg}${msg}{/}`);
  screen.render();
}

function logSuccess(msg) {
  log(`✓ ${msg}`, '#22c55e');
}

function logError(msg) {
  log(`✗ ${msg}`, '#ef4444');
}

function logWarn(msg) {
  log(`⚠ ${msg}`, '#f59e0b');
}

function logInfo(msg) {
  log(`● ${msg}`, '#a1a1aa');
}

function setStatus(text, color = '#71717a') {
  statusIndicator.setContent(` ${text}`);
  statusIndicator.style.fg = color;
  screen.render();
}

function focusCurrent() {
  buttons[currentIndex].focus();
}

function isServerRunning() {
  return serverProcess !== null;
}

function startServer() {
  if (isServerRunning()) {
    logWarn('Server is already running.');
    return;
  }

  logInfo('Starting server...');
  setStatus('● STARTING', '#f59e0b');

  btnStartServer.setContent(' ●  Starting...');
  btnStartServer.style.fg = '#f59e0b';

  const proc = spawn('node', ['server.js'], {
    cwd: PROJECT_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  serverProcess = proc;

  let hasOutput = false;
  let stderrBuffer = '';

  proc.stdout.on('data', (data) => {
    hasOutput = true;
    const text = data.toString();
    text.split('\n').forEach((l) => {
      if (l.trim()) log(`  ${l.trim()}`, '#a1a1aa');
    });
    if (/listen/gi.test(text)) {
      setStatus('● RUNNING', '#22c55e');
      logSuccess(`Server running on http://localhost:${PORT}`);
      btnStartServer.setContent(' ■  Stop Server');
      btnStartServer.style.fg = '#ef4444';
    }
  });

  proc.stderr.on('data', (data) => {
    stderrBuffer += data.toString();
    data.toString().split('\n').forEach((l) => {
      if (l.trim()) log(`  ${l.trim()}`, '#ef4444');
    });
  });

  proc.on('error', (err) => {
    if (serverProcess !== proc) return;
    logError(`Failed to start: ${err.message}`);
    cleanup();
  });

  proc.on('close', (code) => {
    if (serverProcess !== proc) return;
    if (!hasOutput && stderrBuffer) {
      logError(`Server failed (exit ${code}):`);
      if (/Cannot find module/.test(stderrBuffer)) {
        logError('Dependencies missing! Install them first.');
      }
    } else if (code !== null && code !== 0) {
      logWarn(`Server exited with code ${code}`);
    }
    cleanup();
  });

  function cleanup() {
    serverProcess = null;
    setStatus('● STOPPED', '#ef4444');
    btnStartServer.setContent(' ▶  Start Server');
    btnStartServer.style.fg = '#a1a1aa';
  }
}

function stopServer() {
  if (!serverProcess) {
    logWarn('No server running.');
    return;
  }
  logInfo('Stopping server...');
  serverProcess.kill('SIGTERM');
  setTimeout(() => {
    if (serverProcess) {
      serverProcess.kill('SIGKILL');
      serverProcess = null;
    }
  }, 3000);
  setStatus('● STOPPED', '#ef4444');
}

async function checkUpdates() {
  logInfo('Checking for updates...');
  setStatus('● CHECKING', '#f59e0b');

  try {
    const result = execSync('git fetch origin main 2>&1 && git log HEAD..origin/main --oneline', {
      cwd: PROJECT_DIR,
      timeout: 15000,
    }).toString().trim();

    if (!result) {
      logSuccess('Already up to date.');
      setStatus('● UPDATED', '#22c55e');
    } else {
      const count = result.split('\n').length;
      logWarn(`${count} update(s) available:`);
      result.split('\n').forEach((l) => log(`  ${l}`, '#f59e0b'));

      const { execSync: pull } = require('child_process');
      logInfo('Pulling latest changes...');
      pull('git pull origin main', { cwd: PROJECT_DIR });
      logSuccess('Repository updated!');
      setStatus('● UPDATED', '#22c55e');
    }
  } catch (e) {
    logError(`Update check failed: ${e.message}`);
    setStatus('● ERROR', '#ef4444');
  }
}

function installDeps() {
  if (checkDepsInstalled()) {
    logWarn('Dependencies already installed. Run "npm install" to reinstall.');
    return;
  }

  logInfo('Installing dependencies (npm install)...');
  setStatus('● INSTALLING', '#f59e0b');

  const child = spawn('npm', ['install'], {
    cwd: PROJECT_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach((l) => {
      if (l.trim()) log(`  ${l.trim()}`, '#a1a1aa');
    });
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach((l) => {
      if (l.trim()) log(`  ${l.trim()}`, '#ef4444');
    });
  });

  child.on('close', (code) => {
    if (code === 0) {
      logSuccess('Dependencies installed successfully!');
      setStatus('● READY', '#22c55e');
    } else {
      logError(`npm install failed with code ${code}`);
      setStatus('● ERROR', '#ef4444');
    }
  });
}

// Setup keyboard navigation
screen.key(['q', 'Q'], () => {
  if (isServerRunning()) {
    stopServer();
  }
  process.exit(0);
});

screen.key(['up', 'k'], () => {
  currentIndex = (currentIndex - 1 + buttons.length) % buttons.length;
  updateButtonStyles();
  focusCurrent();
});

screen.key(['down', 'j', 'tab'], () => {
  currentIndex = (currentIndex + 1) % buttons.length;
  updateButtonStyles();
  focusCurrent();
});

// Enter is handled by blessed button 'press' events — do not duplicate here

// Mouse click handlers
btnStartServer.on('press', () => {
  if (isServerRunning()) {
    stopServer();
  } else {
    if (!checkDepsInstalled()) {
      logWarn('Dependencies not installed! Install them first.');
      return;
    }
    startServer();
  }
});

btnCheckUpdates.on('press', () => checkUpdates());

btnInstallDeps.on('press', () => installDeps());

btnExit.on('press', () => {
  if (isServerRunning()) stopServer();
  process.exit(0);
});

// Initial render
(async () => {
  const depsInstalled = checkDepsInstalled();
  const running = await checkServerRunning();

  if (depsInstalled) {
    btnInstallDeps.setContent(' ✔  Dependencies Installed');
    btnInstallDeps.style.fg = '#22c55e';
    btnInstallDeps.style.bg = '#121214';
    btnInstallDeps.setLabel('');
    logSuccess('Dependencies found.');
  } else {
    btnInstallDeps.setContent(' ⚡  Install Dependencies');
    btnInstallDeps.style.fg = '#f59e0b';
    logWarn('Run npm install to install dependencies.');
  }

  if (running) {
    btnStartServer.setContent(' ■  Stop Server');
    btnStartServer.style.fg = '#ef4444';
    setStatus('● RUNNING', '#22c55e');
    logInfo(`Server detected on http://localhost:${PORT}`);
  } else {
    btnStartServer.setContent(' ▶  Start Server');
    btnStartServer.style.fg = '#a1a1aa';
    setStatus('● IDLE', '#71717a');
  }

  updateButtonStyles();
  focusCurrent();
  screen.render();
})();

// Render
screen.append(box);
screen.render();
