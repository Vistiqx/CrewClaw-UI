const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  try {
    console.log('Testing file edit modal...');
    await page.goto('http://192.168.239.197:3000/assistants');
    await page.waitForTimeout(3000);
    
    // Click SOUL button
    await page.click('button:has-text("SOUL")');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'test-results/file-edit-modal.png', fullPage: true });
    console.log('Screenshot saved: test-results/file-edit-modal.png');
    
    // Check if EasyMDE loaded
    const hasEditor = await page.locator('.EasyMDEContainer').isVisible().catch(() => false);
    const hasContent = await page.locator('text=Test SOUL File').isVisible().catch(() => false);
    
    console.log(`EasyMDE editor visible: ${hasEditor}`);
    console.log(`Content loaded: ${hasContent}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();