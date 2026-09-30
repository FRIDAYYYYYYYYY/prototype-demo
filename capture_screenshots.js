import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function capture() {
  const outputDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Launching browser...');
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (e) {
    console.log('Default chromium launch fallback to msedge channel:', e.message);
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  }

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 30000 });

  // Wait a bit for animations/charts/Leaflet maps to render
  await page.waitForTimeout(3500);

  // Full page screenshot
  const mainPath = path.join(outputDir, 'dashboard_full.png');
  await page.screenshot({ path: mainPath, fullPage: true });
  console.log('Saved full-page screenshot to:', mainPath);

  // Viewport screenshot
  const viewportPath = path.join(outputDir, 'dashboard_viewport.png');
  await page.screenshot({ path: viewportPath, fullPage: false });
  console.log('Saved viewport screenshot to:', viewportPath);

  // Also check if there are clickable tabs or junction charts to capture specifically
  const tabs = await page.$$('button, .tab-button, [role="tab"]');
  console.log(`Found ${tabs.length} interactive buttons/tabs.`);

  let tabIdx = 1;
  for (const tab of tabs) {
    try {
      const text = (await tab.innerText()).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
      if (text && text.length > 2 && text.length < 30) {
        await tab.click();
        await page.waitForTimeout(1500);
        const tabPath = path.join(outputDir, `tab_${tabIdx}_${text}.png`);
        await page.screenshot({ path: tabPath, fullPage: true });
        console.log(`Saved tab screenshot: ${tabPath}`);
        tabIdx++;
      }
    } catch (e) {
      // continue
    }
  }

  await browser.close();
  console.log('All screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
