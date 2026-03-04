const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'http://192.168.239.197:3000';
const SCREENSHOT_DIR = path.join(__dirname, 'test-results', 'manual-screenshots');

async function takeScreenshot(page, name) {
  const screenshotPath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot: ${name}.png`);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 }
  });

  const results = [];

  try {
    console.log('Starting manual page verification...\n');

    // Test Dashboard
    console.log('1. Testing Dashboard...');
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '01-dashboard');
    results.push({ page: 'Dashboard', status: 'Loaded', screenshot: '01-dashboard.png' });

    // Test Businesses
    console.log('2. Testing Businesses...');
    await page.goto(`${BASE_URL}/businesses`);
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '02-businesses');
    results.push({ page: 'Businesses', status: 'Loaded', screenshot: '02-businesses.png' });

    // Click Add Business
    await page.click('text=Add Business');
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '03-businesses-create-dialog');
    await page.click('text=Cancel');
    await page.waitForTimeout(500);

    // Test Assistants
    console.log('3. Testing Assistants...');
    await page.goto(`${BASE_URL}/assistants`);
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '04-assistants');
    results.push({ page: 'Assistants', status: 'Loaded', screenshot: '04-assistants.png' });

    // Click SOUL edit button
    const soulButton = await page.locator('button:has-text("SOUL")').first();
    if (await soulButton.isVisible().catch(() => false)) {
      await soulButton.click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, '05-assistants-edit-modal');
      await page.click('button:has-text("Cancel")');
      await page.waitForTimeout(500);
    }

    // Test Tasks
    console.log('4. Testing Tasks...');
    await page.goto(`${BASE_URL}/tasks`);
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '06-tasks');
    results.push({ page: 'Tasks', status: 'Loaded', screenshot: '06-tasks.png' });

    // Test Create Task
    await page.click('text=Create Task');
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '07-tasks-create-dialog');
    await page.click('text=Cancel');
    await page.waitForTimeout(500);

    // Test Settings
    console.log('5. Testing Settings...');
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '08-settings');
    results.push({ page: 'Settings', status: 'Loaded', screenshot: '08-settings.png' });

    // Test Audit Logs
    console.log('6. Testing Audit Logs...');
    await page.goto(`${BASE_URL}/audit-logs`);
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '09-audit-logs');
    results.push({ page: 'Audit Logs', status: 'Loaded', screenshot: '09-audit-logs.png' });

    // Test Credentials
    console.log('7. Testing Credentials...');
    await page.goto(`${BASE_URL}/credentials`);
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '10-credentials');
    results.push({ page: 'Credentials', status: 'Loaded', screenshot: '10-credentials.png' });

    // Test new pages
    console.log('8. Testing CRON Jobs...');
    await page.goto(`${BASE_URL}/cron-jobs`);
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '11-cron-jobs');
    results.push({ page: 'CRON Jobs', status: 'Loaded', screenshot: '11-cron-jobs.png' });

    console.log('9. Testing Skills...');
    await page.goto(`${BASE_URL}/skills`);
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '12-skills');
    results.push({ page: 'Skills', status: 'Loaded', screenshot: '12-skills.png' });

    console.log('10. Testing Plugins...');
    await page.goto(`${BASE_URL}/plugins`);
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '13-plugins');
    results.push({ page: 'Plugins', status: 'Loaded', screenshot: '13-plugins.png' });

    console.log('11. Testing Tools...');
    await page.goto(`${BASE_URL}/tools`);
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '14-tools');
    results.push({ page: 'Tools', status: 'Loaded', screenshot: '14-tools.png' });

    console.log('12. Testing Commands...');
    await page.goto(`${BASE_URL}/commands`);
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '15-commands');
    results.push({ page: 'Commands', status: 'Loaded', screenshot: '15-commands.png' });

    console.log('13. Testing Health...');
    await page.goto(`${BASE_URL}/health`);
    await page.waitForTimeout(3000);
    await takeScreenshot(page, '16-health');
    results.push({ page: 'Health', status: 'Loaded', screenshot: '16-health.png' });

    console.log('14. Testing Heartbeats...');
    await page.goto(`${BASE_URL}/scheduler`);
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '17-heartbeats');
    results.push({ page: 'Heartbeats', status: 'Loaded', screenshot: '17-heartbeats.png' });

    console.log('\n=== TEST RESULTS ===');
    console.log(JSON.stringify(results, null, 2));

  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await browser.close();
    console.log('\nTesting complete. Screenshots saved to:', SCREENSHOT_DIR);
  }
})();