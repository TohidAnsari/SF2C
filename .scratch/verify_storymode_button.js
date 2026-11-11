const path = require('path');
const fs = require('fs');

const globalNodePath = path.join(process.env.APPDATA, 'npm', 'node_modules');
if (!process.env.NODE_PATH) {
  process.env.NODE_PATH = globalNodePath;
  require('module').Module._initPaths();
}
const { chromium } = require('playwright');

const SCREENSHOT_DIR = path.resolve('C:/Users/Hp/.gemini/antigravity/brain/fee5147b-ed3b-4870-ac63-903955723b0f/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist']
  });

  const page = await browser.newPage({
    viewport: { width: 1100, height: 750 }
  });

  const filePath = 'file:///' + path.resolve(__dirname, '../index.html').replace(/\\/g, '/');
  console.log('Navigating to:', filePath);
  await page.goto(filePath);
  await page.waitForTimeout(1500);

  // Check app container bounds
  const appBox = await page.locator('#app').boundingBox();
  console.log('App Box:', appBox);

  // Check Fight Button bounds
  const fightBtn = page.locator('.lobby-fight-btn');
  const fightBox = await fightBtn.boundingBox();
  console.log('Lobby Fight Button Box:', fightBox);

  // Check Story Dock Button bounds
  const storyDockBtn = page.locator('.dock-btn-story');
  const storyDockBox = await storyDockBtn.boundingBox();
  console.log('Story Dock Button Box:', storyDockBox);

  // Check Secondary Modes bounds
  const secModes = page.locator('.secondary-modes-row');
  const secBox = await secModes.boundingBox();
  console.log('Secondary Modes Box:', secBox);

  // Verify Fight button is completely inside the #app frame
  if (!fightBox) throw new Error('Fight button not found in DOM!');
  if (fightBox.y + fightBox.height > appBox.y + appBox.height) {
    throw new Error(`Fight button overflows bottom: ${fightBox.y + fightBox.height} > ${appBox.y + appBox.height}`);
  }
  if (fightBox.x + fightBox.width > appBox.x + appBox.width) {
    throw new Error(`Fight button overflows right: ${fightBox.x + fightBox.width} > ${appBox.x + appBox.width}`);
  }

  // Capture lobby screenshot
  const screenshotPath = path.join(SCREENSHOT_DIR, 'lobby_storymode_buttons_verified.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`✓ Saved screenshot of Dojo Lobby with Story Mode buttons: ${screenshotPath}`);

  // Test clicking FIGHT button
  console.log('Clicking .lobby-fight-btn ...');
  await fightBtn.click();
  await page.waitForTimeout(800);

  const isTournamentActive = await page.evaluate(() => {
    const el = document.getElementById('screen-tournament');
    return el && el.classList.contains('active');
  });
  console.log('Is screen-tournament active after clicking FIGHT button:', isTournamentActive);
  if (!isTournamentActive) throw new Error('Clicking .lobby-fight-btn did not navigate to screen-tournament!');

  // Capture tournament ladder screenshot
  const tournamentShotPath = path.join(SCREENSHOT_DIR, 'tournament_screen_opened.png');
  await page.screenshot({ path: tournamentShotPath });
  console.log(`✓ Saved screenshot of Tournament screen: ${tournamentShotPath}`);

  // Return to dojo
  await page.evaluate(() => window.Game.showScreen('screen-main-menu'));
  await page.waitForTimeout(500);

  // Test clicking left dock STORY MODE button
  console.log('Clicking .dock-btn-story ...');
  await storyDockBtn.click();
  await page.waitForTimeout(800);

  const isTournamentActive2 = await page.evaluate(() => {
    const el = document.getElementById('screen-tournament');
    return el && el.classList.contains('active');
  });
  console.log('Is screen-tournament active after clicking STORY MODE dock button:', isTournamentActive2);
  if (!isTournamentActive2) throw new Error('Clicking .dock-btn-story did not navigate to screen-tournament!');

  console.log('\n======================================================');
  console.log('🎉 STORY MODE BUTTONS VERIFIED SUCCESSFULLY (100%)');
  console.log('======================================================\n');

  await browser.close();
})();

