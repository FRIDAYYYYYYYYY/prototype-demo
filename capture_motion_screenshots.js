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

  console.log('Launching browser at 1440x900...');
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (e) {
    console.log('Fallback to msedge:', e.message);
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  }

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();

  console.log('Opening http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // 1. Overview Hero Viewport Screenshot
  const overviewHeroPath = path.join(outputDir, 'motion_overview_hero_1440x900.png');
  await page.screenshot({ path: overviewHeroPath });
  console.log('Captured Overview hero:', overviewHeroPath);

  // 2. Scroll to Live Junction and capture
  const liveSection = page.locator('#live');
  if (await liveSection.count() > 0) {
    await liveSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    const livePath = path.join(outputDir, 'motion_live_junction_1440x900.png');
    await liveSection.screenshot({ path: livePath });
    console.log('Captured Live Junction:', livePath);
  }

  // 3. Scroll to Decision Core and capture Case 3 (Default)
  const decisionSection = page.locator('#decision');
  if (await decisionSection.count() > 0) {
    await decisionSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    const decisionCase3Path = path.join(outputDir, 'motion_decision_core_case3_1440x900.png');
    await decisionSection.screenshot({ path: decisionCase3Path });
    console.log('Captured Decision Core (Case 3):', decisionCase3Path);

    // Click Case 2 toggle
    const case2Btn = page.locator('button:has-text("CASE 2")');
    if (await case2Btn.count() > 0) {
      await case2Btn.click();
      await page.waitForTimeout(1000);
      const decisionCase2Path = path.join(outputDir, 'motion_decision_core_case2_1440x900.png');
      await decisionSection.screenshot({ path: decisionCase2Path });
      console.log('Captured Decision Core (Case 2):', decisionCase2Path);
    }
  }

  // 4. Capture ETA Forecast
  const etaCard = page.locator('.etaforecast');
  if (await etaCard.count() > 0) {
    await etaCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    const etaPath = path.join(outputDir, 'motion_eta_forecast_1440x900.png');
    await etaCard.screenshot({ path: etaPath });
    console.log('Captured ETA Forecast:', etaPath);
  }

  // 5. Full page capture
  const fullPath = path.join(outputDir, 'motion_full_page_1440x900.png');
  await page.screenshot({ path: fullPath, fullPage: true });
  console.log('Captured Full Page:', fullPath);

  await browser.close();
  console.log('All 1440x900 screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
