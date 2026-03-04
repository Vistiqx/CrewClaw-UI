const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 }
  });

  // Enable console logging
  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));

  try {
    console.log('Testing Assistants page...');
    await page.goto('http://192.168.239.197:3000/assistants');
    await page.waitForTimeout(5000); // Wait for data to load
    
    const screenshotPath = path.join(__dirname, 'test-results', 'assistants-debug.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot saved: ${screenshotPath}`);
    
    // Check for elements
    const hasAssistants = await page.locator('text=ABC-chief-of-staff-1').isVisible().catch(() => false);
    const hasNoData = await page.locator('text=No assistants found').isVisible().catch(() => false);
    const hasLoading = await page.locator('text=Loading...').isVisible().catch(() => false);
    
    console.log(`Has assistants: ${hasAssistants}`);
    console.log(`No data message: ${hasNoData}`);
    console.log(`Loading: ${hasLoading}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();