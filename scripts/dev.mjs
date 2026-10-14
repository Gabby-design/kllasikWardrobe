// scripts/dev.mjs
// Launches Next.js dev server alongside continuous live-sync daemon
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('[Klasik Dev] Starting local dev server with auto-sync daemon...');

// 1. Spawn live-sync watcher daemon in background
const syncWatcher = spawn(process.execPath, [path.join(rootDir, 'scripts', 'sync-live.mjs'), 'watch'], {
  cwd: rootDir,
  stdio: 'inherit'
});

// 2. Spawn Next.js dev server
const nextDev = spawn('npx', ['next', 'dev'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true
});

function cleanup() {
  try {
    syncWatcher.kill('SIGTERM');
  } catch {}
  try {
    nextDev.kill('SIGTERM');
  } catch {}
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

nextDev.on('close', (code) => {
  cleanup();
});
