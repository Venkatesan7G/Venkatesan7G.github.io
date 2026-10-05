/* Optional local check + social image. Needs Playwright:  npm i -D playwright && npx playwright install chromium
   Usage:  node tools/shot.mjs          -> writes og.png (1200x630) and tools/full.png (full page) */
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.goto(pathToFileURL(path.join(root, 'index.html')).href);
await p.waitForTimeout(2500);
await p.screenshot({ path: path.join(root, 'og.png') });
await p.setViewportSize({ width: 900, height: 900 });
await p.waitForTimeout(500);
await p.screenshot({ path: path.join(root, 'tools/full.png'), fullPage: true });
await b.close();
console.log('wrote og.png and tools/full.png');
