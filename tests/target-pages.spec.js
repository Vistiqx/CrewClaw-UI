const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://192.168.239.197:3000';

const TARGET_PAGES = [
  { path: '/councils', name: 'Councils' },
  { path: '/teams', name: 'Teams' },
  { path: '/assistants-rbac', name: 'Assistants RBAC' },
  { path: '/api-keys', name: 'API Keys' },
  { path: '/model-registry', name: 'Model Registry' },
  { path: '/model-routing-rules', name: 'Model Routing Rules' },
  { path: '/workflows', name: 'Workflows' },
  { path: '/pipelines', name: 'Pipelines' },
  { path: '/approvals', name: 'Approvals' },
  { path: '/secrets-vault', name: 'Secrets Vault' },
];

test.describe('CrewClaw Target Pages', () => {
  for (const page of TARGET_PAGES) {
    test(`${page.name} page loads without placeholders`, async ({ page: pwPage }) => {
      await pwPage.goto(`${BASE_URL}${page.path}`);
      
      // Wait for page to load
      await pwPage.waitForLoadState('networkidle');
      
      // Check page title exists
      const title = await pwPage.title();
      expect(title).toBeTruthy();
      
      // Check for meaningful content (not placeholder)
      const bodyText = await pwPage.locator('body').innerText();
      
      // Assert no placeholder language
      expect(bodyText.toLowerCase()).not.toContain('under construction');
      expect(bodyText.toLowerCase()).not.toContain('coming soon');
      expect(bodyText.toLowerCase()).not.toContain('placeholder');
      expect(bodyText.toLowerCase()).not.toContain('not implemented');
      
      // Check for actual UI elements
      const hasHeading = await pwPage.locator('h1, h2').count() > 0;
      expect(hasHeading).toBe(true);
      
      // Check for interactive elements (buttons, tables, or cards)
      const hasInteractive = await pwPage.locator('button, table, [role="button"]').count() > 0;
      expect(hasInteractive).toBe(true);
      
      console.log(`✅ ${page.name}: Loaded successfully with realistic UI`);
    });
  }
});
