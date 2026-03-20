#!/usr/bin/env node
/**
 * Автоматический деплой в Git при изменении файлов.
 * Запуск: npm run auto-deploy
 * 
 * Отслеживает изменения в src/, public/, и конфигах.
 * Дебаунс 10 сек — коммит только после паузы в редактировании.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const WATCH_PATTERNS = [
  path.join(ROOT, 'src/**/*'),
  path.join(ROOT, 'public/**/*'),
  path.join(ROOT, '*.{json,md,ts,js}'),
  path.join(ROOT, '*.config.{js,ts,mjs}'),
];
const DEBOUNCE_MS = 10000; // 10 секунд после последнего изменения
const IGNORE = /node_modules|\.next|\.git/;

let debounceTimer = null;
let pending = false;

function runDeploy() {
  if (pending) return;
  pending = true;
  console.log('\n📦 Изменения обнаружены → коммит и push...\n');
  
  const deploy = spawn('npm', ['run', 'deploy', '--', 'chore: auto-deploy'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true,
  });
  
  deploy.on('close', (code) => {
    pending = false;
    if (code === 0) {
      console.log('\n✅ Автодеплой завершён.\n');
    }
  });
}

function scheduleDeploy(filePath) {
  if (IGNORE.test(filePath)) return;
  
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    runDeploy();
  }, DEBOUNCE_MS);
  
  const rel = path.relative(ROOT, filePath);
  console.log(`  📝 ${rel}`);
}

// Используем chokidar если установлен, иначе fs.watch (менее надёжный)
function startWatching() {
  try {
    const chokidar = require('chokidar');
    const watcher = chokidar.watch(
      ['src', 'public', '*.json', '*.md', '*.config.js', '*.config.ts', '*.config.mjs'],
      {
        cwd: ROOT,
        ignored: ['node_modules', '.next', '.git'],
        persistent: true,
      }
    );
    
    watcher.on('change', (p) => scheduleDeploy(path.join(ROOT, p)));
    watcher.on('add', (p) => scheduleDeploy(path.join(ROOT, p)));
    
    console.log('👀 Отслеживание изменений (автодеплой в Git каждые 10 сек после правок)\n');
    return;
  } catch (_) {
    // chokidar не установлен
  }
  
  // Fallback: простой fs.watch для src/
  const srcDir = path.join(ROOT, 'src');
  if (fs.existsSync(srcDir)) {
    fs.watch(srcDir, { recursive: true }, (_, filename) => {
      if (filename) scheduleDeploy(path.join(srcDir, filename));
    });
    console.log('👀 Отслеживание src/ (установите chokidar для полного покрытия)\n');
  }
}

startWatching();
