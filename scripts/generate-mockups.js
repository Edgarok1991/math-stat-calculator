/**
 * Генерация PNG-макетов для DESIGN_PROPOSALS.md
 * Запуск: npm run generate-mockups  (нужен sharp: npm install)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets');

const MOCKUPS = [
  ['mockup-academic.png', 'Академический', '#faf8f5', '#1e3a5f', '#2c1810'],
  ['mockup-terminal.png', 'Тёмный терминал', '#0d1117', '#161b22', '#3fb950'],
  ['mockup-minimal.png', 'Минимализм', '#fafafa', '#e5e5e5', '#0a0a0a'],
  ['mockup-warm.png', 'Тёплый / уютный', '#f5f0e8', '#e8ddd4', '#3d2c29'],
  ['mockup-neon.png', 'Неон / киберпанк', '#0a0a12', '#1a0a2e', '#ff00ff'],
  ['mockup-ocean.png', 'Океан', '#0c4a6e', '#0369a1', '#e0f2fe'],
  ['mockup-forest.png', 'Лес', '#14532d', '#166534', '#dcfce7'],
  ['mockup-sunset.png', 'Закат', '#7c2d12', '#ea580c', '#fef3c7'],
  ['mockup-paper.png', 'Бумага / тетрадь', '#fefce8', '#fef9c3', '#422006'],
  ['mockup-glass.png', 'Глассморфизм', '#1e3a5f', '#3b82f6', '#ffffff'],
  ['mockup-retro.png', 'Ретро 80-е', '#581c87', '#db2777', '#fde047'],
  ['mockup-luxury.png', 'Люкс / золото', '#1a1a1a', '#422006', '#d4af37'],
  ['mockup-pastel.png', 'Пастель', '#fce7f3', '#ddd6fe', '#831843'],
  ['mockup-monochrome.png', 'Монохром', '#171717', '#404040', '#fafafa'],
  ['mockup-mesh.png', 'Градиентная сетка', '#0f172a', '#4f46e5', '#a5b4fc'],
  ['mockup-nordic.png', 'Нордик', '#f1f5f9', '#cbd5e1', '#334155'],
  ['mockup-zen.png', 'Дзен', '#fafaf9', '#d6d3d1', '#44403c'],
  ['mockup-space.png', 'Космос', '#020617', '#1e1b4b', '#a78bfa'],
  ['mockup-artdeco.png', 'Ар-деко', '#1c1917', '#44403c', '#d4af37'],
  ['mockup-brutalist.png', 'Брутализм', '#e7e5e4', '#d6d3d1', '#0c0a09'],
  ['mockup-duotone.png', 'Duotone', '#312e81', '#7c3aed', '#fde68a'],
  ['mockup-playful.png', 'Игровой', '#fef08a', '#f472b6', '#7c2d12'],
  ['mockup-corporate.png', 'Корпоративный', '#f8fafc', '#cbd5e1', '#0f172a'],
  ['mockup-clay.png', 'Клейморфизм', '#fef3c7', '#fcd34d', '#78350f'],
  ['mockup-gradient-border.png', 'Градиентные рамки', '#0f172a', '#6366f1', '#f472b6'],
  ['mockup-steam.png', 'Стимпанк', '#422006', '#78350f', '#fcd34d'],
  ['mockup-candy.png', 'Конфетный', '#fce7f3', '#f9a8d4', '#db2777'],
  ['mockup-midnight.png', 'Полночь', '#050b14', '#0a1628', '#d4af37'],
  ['mockup-mint.png', 'Мята', '#ecfdf5', '#a7f3d0', '#065f46'],
  ['mockup-desert.png', 'Пустыня', '#fef3c7', '#f59e0b', '#78350f'],
  ['mockup-aurora.png', 'Северное сияние', '#022c22', '#064e3b', '#34d399'],
  ['mockup-newspaper.png', 'Газета', '#fafaf9', '#e7e5e4', '#1c1917'],
  ['mockup-holographic.png', 'Голографический', '#1e1b4b', '#6366f1', '#c4b5fd'],
  ['mockup-chalkboard.png', 'Школьная доска', '#14532d', '#166534', '#fef08a'],
  ['mockup-soft-gradient.png', 'Мягкий градиент', '#fdf4ff', '#e9d5ff', '#6b21a8'],
  ['mockup-matrix.png', 'Матрица', '#000000', '#003300', '#00ff41'],
  ['mockup-watercolor.png', 'Акварель', '#fef9fb', '#fce7f3', '#9d174d'],
  ['mockup-high-contrast.png', 'Высокий контраст', '#000000', '#ffffff', '#ffff00'],
  ['mockup-reef.png', 'Коралловый риф', '#0c4a6e', '#06b6d4', '#fef08a'],
  ['mockup-minimal-color.png', 'Минимальный цвет', '#fafafa', '#f4f4f5', '#71717a'],
];

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function svgFor([filename, title, c1, c2, accent]) {
  const t = escapeXml(title);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="675" fill="url(#bg)"/>
  <rect x="80" y="200" width="1040" height="275" rx="20" fill="rgba(255,255,255,0.08)" stroke="${accent}" stroke-width="2" opacity="0.9"/>
  <text x="600" y="130" font-family="system-ui,Segoe UI,sans-serif" font-size="38" font-weight="700" fill="${accent}" text-anchor="middle">${t}</text>
  <text x="600" y="360" font-family="system-ui,Segoe UI,sans-serif" font-size="22" fill="${accent}" text-anchor="middle" opacity="0.85">MathCalc — вариант оформления</text>
  <text x="600" y="420" font-family="ui-monospace,monospace" font-size="14" fill="${accent}" text-anchor="middle" opacity="0.6">${escapeXml(filename)}</text>
</svg>`;
}

async function main() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.error('Установите sharp: npm install sharp --save-dev');
    process.exit(1);
  }

  fs.mkdirSync(OUT, { recursive: true });

  for (const row of MOCKUPS) {
    const svg = svgFor(row);
    const outPath = path.join(OUT, row[0]);
    await sharp(Buffer.from(svg, 'utf8')).png().toFile(outPath);
    console.log('OK', row[0]);
  }

  console.log('\nГотово:', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
