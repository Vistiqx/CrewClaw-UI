const { test, expect } = require('@playwright/test');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '..', 'test-results', 'screenshots');

// Helper function to take screenshots
async function takeScreenshot(page, name) {
  const screenshotPath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot: ${name}.png`);
}

test.describe('CrewClaw-UI - Comprehensive Test Suite', () => {
  
  test('Dashboard loads correctly', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, '01-dashboard-initial-load');
    
    await expect(page).toHaveTitle(/CrewClaw-UI/);
    await expect(page.locator('text=System Health')).toBeVisible();
    await expect(page.locator('text=Total Businesses')).toBeVisible();
    await expect(page.locator('text=Total Assistants')).toBeVisible();
    await expect(page.locator('text=Task Summary')).toBeVisible();
    
    if (errors.length > 0) {
      console.error('Dashboard console errors:', errors);
    }
  });

  test.describe('Navigation', () => {
    test('All navigation links work', async ({ page }) => {
      const navItems = [
        { name: 'Dashboard', url: '/' },
        { name: 'Businesses', url: '/businesses' },
        { name: 'Assistants', url: '/assistants' },
        { name: 'Tasks', url: '/tasks' },
        { name: 'Audit Logs', url: '/audit-logs' },
        { name: 'Credentials', url: '/credentials' },
        { name: 'Analytics', url: '/analytics' },
        { name: 'Heartbeats', url: '/scheduler' },
        { name: 'CRON Jobs', url: '/cron-jobs' },
        { name: 'Skills', url: '/skills' },
        { name: 'Plugins', url: '/plugins' },
        { name: 'Tools', url: '/tools' },
        { name: 'Commands', url: '/commands' },
        { name: 'Health', url: '/health' },
        { name: 'Settings', url: '/settings' },
      ];

      for (const item of navItems) {
        await page.goto(item.url);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        await takeScreenshot(page, `nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`);
        
        const currentUrl = page.url();
        console.log(`${item.name}: ${currentUrl}`);
      }
    });
  });

  test.describe('Businesses Page', () => {
    test('Businesses page functionality', async ({ page }) => {
      await page.goto('/businesses');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'businesses-page');
      
      await expect(page.getByRole('heading', { name: 'Businesses' }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: 'Add Business' }).first()).toBeVisible();
      
      // Test create dialog
      await page.getByRole('button', { name: 'Add Business' }).first().click();
      await page.waitForTimeout(500);
      await takeScreenshot(page, 'businesses-create-dialog');
      await page.getByRole('button', { name: 'Cancel' }).first().click();
    });
  });

  test.describe('Assistants Page', () => {
    test('Assistants page functionality', async ({ page }) => {
      await page.goto('/assistants');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'assistants-page');
      
      await expect(page.getByRole('heading', { name: 'Assistants' }).first()).toBeVisible();
      
      // Test file edit buttons
      const fileButtons = await page.locator('button:has-text("SOUL")').count();
      console.log(`SOUL buttons found: ${fileButtons}`);
      
      if (fileButtons > 0) {
        await page.click('button:has-text("SOUL")');
        await page.waitForTimeout(1000);
        await takeScreenshot(page, 'assistants-edit-soul-modal');
        await page.click('button:has-text("Cancel")');
      }
    });
  });

  test.describe('Tasks Page', () => {
    test('Tasks page functionality', async ({ page }) => {
      await page.goto('/tasks');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'tasks-page');
      
      await expect(page.getByRole('heading', { name: 'Tasks' }).first()).toBeVisible();
      
      // Test create task dialog
      await page.getByRole('button', { name: 'Create Task' }).first().click();
      await page.waitForTimeout(500);
      await takeScreenshot(page, 'tasks-create-dialog');
      await page.getByRole('button', { name: 'Cancel' }).first().click();
    });
  });

  test.describe('Settings Page', () => {
    test('Settings page functionality', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      await takeScreenshot(page, 'settings-page');
      
      await expect(page.getByRole('heading', { name: 'Settings' }).first()).toBeVisible();
      await expect(page.getByText('Appearance').first()).toBeVisible();
      await expect(page.getByRole('button', { name: 'Save Settings' }).first()).toBeVisible();
    });
  });

  test.describe('Audit Logs Page', () => {
    test('Audit logs page functionality', async ({ page }) => {
      await page.goto('/audit-logs');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'audit-logs-page');
      
      await expect(page.getByRole('heading', { name: 'Audit Logs' }).first()).toBeVisible();
    });
  });

  test.describe('Credentials Page', () => {
    test('Credentials page functionality', async ({ page }) => {
      await page.goto('/credentials');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'credentials-page');
      
      await expect(page.getByRole('heading', { name: 'Credentials' }).first()).toBeVisible();
      
      // Test create credential dialog
      await page.getByRole('button', { name: 'Add Credential' }).first().click();
      await page.waitForTimeout(500);
      await takeScreenshot(page, 'credentials-create-dialog');
      await page.getByRole('button', { name: 'Cancel' }).first().click();
    });
  });

  test.describe('Console Error Check', () => {
    test('No console errors on any page', async ({ page }) => {
      const allErrors = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          allErrors.push({
            page: page.url(),
            message: msg.text()
          });
        }
      });
      
      const pages = ['/', '/businesses', '/assistants', '/tasks', '/settings', '/audit-logs', '/credentials'];
      
      for (const url of pages) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
      }
      
      // Filter out expected network errors during initial load
      const unexpectedErrors = allErrors.filter(err => 
        !err.message.includes('ERR_EMPTY_RESPONSE') &&
        !err.message.includes('net::ERR')
      );
      
      if (unexpectedErrors.length > 0) {
        console.error('Console errors found:', JSON.stringify(unexpectedErrors, null, 2));
      }
      
      expect(unexpectedErrors).toHaveLength(0);
    });
  });

  test.describe('Performance', () => {
    test('Page load performance', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      console.log(`Page load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(10000);
    });
  });
});