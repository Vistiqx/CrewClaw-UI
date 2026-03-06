const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 30000;
const NAVIGATION_TIMEOUT = 10000;

// Comprehensive list of all pages in the application based on file structure
const ALL_PAGES = [
  // Core pages
  { path: '/', name: 'Dashboard', category: 'Core' },
  { path: '/businesses', name: 'Businesses', category: 'Organization' },
  { path: '/assistants', name: 'Assistants', category: 'Organization' },
  { path: '/assistants-rbac', name: 'Assistants RBAC', category: 'Organization' },
  { path: '/councils', name: 'Councils', category: 'Organization' },
  { path: '/teams', name: 'Teams', category: 'Organization' },
  
  // Execution pages
  { path: '/calendar', name: 'Calendar', category: 'Execution' },
  { path: '/projects', name: 'Projects', category: 'Execution' },
  { path: '/tasks', name: 'Tasks', category: 'Execution' },
  { path: '/pipelines', name: 'Pipelines', category: 'Execution' },
  { path: '/workflows', name: 'Workflows', category: 'Execution' },
  { path: '/cron-jobs', name: 'CRON Jobs', category: 'Execution' },
  { path: '/approvals', name: 'Approvals', category: 'Execution' },
  { path: '/agent-runs', name: 'Agent Runs', category: 'Execution' },
  { path: '/task-queue', name: 'Task Queue', category: 'Execution' },
  
  // Knowledge pages
  { path: '/memory', name: 'Memory', category: 'Knowledge' },
  { path: '/memory-inspector', name: 'Memory Inspector', category: 'Knowledge' },
  { path: '/knowledge-bases', name: 'Knowledge Bases', category: 'Knowledge' },
  { path: '/documents', name: 'Documents', category: 'Knowledge' },
  { path: '/embeddings-overview', name: 'Embeddings Overview', category: 'Knowledge' },
  { path: '/retention-policies', name: 'Retention Policies', category: 'Knowledge' },
  
  // Extensions pages
  { path: '/tools-registry', name: 'Tools Registry', category: 'Extensions' },
  { path: '/plugins', name: 'Plugins Registry', category: 'Extensions' },
  { path: '/commands', name: 'Commands Registry', category: 'Extensions' },
  { path: '/skills', name: 'Skills Registry', category: 'Extensions' },
  { path: '/model-registry', name: 'Model Registry', category: 'Extensions' },
  { path: '/prompt-templates', name: 'Prompt Templates', category: 'Extensions' },
  { path: '/model-routing-rules', name: 'Model Routing Rules', category: 'Extensions' },
  
  // Operations pages
  { path: '/scheduler', name: 'Scheduler', category: 'Operations' },
  { path: '/health', name: 'Health', category: 'Operations' },
  { path: '/analytics', name: 'Analytics', category: 'Operations' },
  { path: '/usage-metrics', name: 'Usage Metrics', category: 'Operations' },
  { path: '/cost-monitoring', name: 'Cost Monitoring', category: 'Operations' },
  { path: '/audit-logs', name: 'Audit Logs', category: 'Operations' },
  { path: '/error-tracking', name: 'Error Tracking', category: 'Operations' },
  
  // Security pages
  { path: '/access-control', name: 'Access Control', category: 'Security' },
  { path: '/secrets-vault', name: 'Secrets Vault', category: 'Security' },
  { path: '/api-keys', name: 'API Keys', category: 'Security' },
  { path: '/rate-limiting', name: 'Rate Limiting', category: 'Security' },
  
  // Integrations pages
  { path: '/integrations', name: 'Integrations', category: 'Integrations' },
  { path: '/webhooks', name: 'Webhooks', category: 'Integrations' },
  
  // Feedback pages
  { path: '/feedback', name: 'Feedback', category: 'Feedback' },
  { path: '/human-reviews', name: 'Human Reviews', category: 'Feedback' },
  
  // Testing pages
  { path: '/evaluation-runs', name: 'Evaluation Runs', category: 'Testing' },
  { path: '/benchmarks', name: 'Benchmarks', category: 'Testing' },
  { path: '/regression-tests', name: 'Regression Tests', category: 'Testing' },
  { path: '/red-team-logs', name: 'Red Team Logs', category: 'Testing' },
  { path: '/output-scoring', name: 'Output Scoring', category: 'Testing' },
  
  // System pages
  { path: '/settings', name: 'Settings', category: 'System' },
  { path: '/settings/network', name: 'Network Settings', category: 'System' },
  { path: '/credentials', name: 'Credentials', category: 'System' },
  { path: '/logs', name: 'Logs', category: 'System' },
  { path: '/feature-flags', name: 'Feature Flags', category: 'System' },
  { path: '/deployment-settings', name: 'Deployment Settings', category: 'System' },
  { path: '/system-versioning', name: 'System Versioning', category: 'System' },
  { path: '/backup-recovery', name: 'Backup & Recovery', category: 'System' },
  { path: '/environment-configuration', name: 'Environment Configuration', category: 'System' },
];

// Results storage
const results = {
  completed: [],
  partial: [],
  notStarted: [],
  errors: [],
  timestamp: new Date().toISOString(),
};

// Helper function to test a page
async function testPage(page, pageInfo) {
  const testResult = {
    path: pageInfo.path,
    name: pageInfo.name,
    category: pageInfo.category,
    status: 'unknown',
    issues: [],
    screenshot: null,
    loadTime: 0,
    hasContent: false,
    hasInteractiveElements: false,
    isPlaceholder: false,
  };

  try {
    const startTime = Date.now();
    
    // Navigate to the page
    const response = await page.goto(`${BASE_URL}${pageInfo.path}`, {
      timeout: NAVIGATION_TIMEOUT,
      waitUntil: 'networkidle',
    });
    
    testResult.loadTime = Date.now() - startTime;
    
    // Check if page loaded successfully
    if (!response) {
      testResult.status = 'error';
      testResult.issues.push('Page failed to load - no response');
      results.errors.push(testResult);
      return testResult;
    }
    
    if (response.status() >= 400) {
      testResult.status = 'error';
      testResult.issues.push(`HTTP ${response.status()} error`);
      results.errors.push(testResult);
      return testResult;
    }
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});
    
    // Analyze page content
    const pageAnalysis = await page.evaluate(() => {
      const analysis = {
        title: document.title,
        hasHeading: false,
        hasContent: false,
        hasDataTable: false,
        hasForm: false,
        hasButtons: false,
        hasCharts: false,
        hasPlaceholder: false,
        placeholderTexts: [],
        textContent: '',
      };
      
      // Check for meaningful headings
      const headings = document.querySelectorAll('h1, h2, h3');
      analysis.hasHeading = headings.length > 0;
      
      // Check for placeholder text
      const placeholderIndicators = [
        'coming soon',
        'under construction',
        'not implemented',
        'placeholder',
        'todo',
        'wip',
        'work in progress',
        'not available',
        'page not found',
        '404',
      ];
      
      const bodyText = document.body.innerText.toLowerCase();
      placeholderIndicators.forEach(indicator => {
        if (bodyText.includes(indicator)) {
          analysis.hasPlaceholder = true;
          analysis.placeholderTexts.push(indicator);
        }
      });
      
      // Check for actual content
      const contentElements = document.querySelectorAll('p, span, div');
      let meaningfulContent = 0;
      contentElements.forEach(el => {
        const text = el.innerText.trim();
        if (text.length > 20 && !el.closest('nav') && !el.closest('header')) {
          meaningfulContent++;
        }
      });
      analysis.hasContent = meaningfulContent > 3;
      
      // Check for data tables
      const tables = document.querySelectorAll('table');
      analysis.hasDataTable = tables.length > 0 && tables[0].querySelectorAll('tr').length > 1;
      
      // Check for forms
      const forms = document.querySelectorAll('form, input, select, textarea');
      analysis.hasForm = forms.length > 0;
      
      // Check for interactive buttons
      const buttons = document.querySelectorAll('button, [role="button"]');
      analysis.hasButtons = buttons.length > 0;
      
      // Check for charts
      const charts = document.querySelectorAll('svg, canvas');
      analysis.hasCharts = charts.length > 2;
      
      // Get a sample of text content
      analysis.textContent = document.body.innerText.substring(0, 500);
      
      return analysis;
    });
    
    testResult.hasContent = pageAnalysis.hasContent || pageAnalysis.hasDataTable || pageAnalysis.hasForm;
    testResult.hasInteractiveElements = pageAnalysis.hasButtons || pageAnalysis.hasForm;
    testResult.isPlaceholder = pageAnalysis.hasPlaceholder;
    
    // Determine page status
    if (pageAnalysis.hasPlaceholder) {
      testResult.status = 'not-started';
      testResult.issues.push(`Placeholder indicators found: ${pageAnalysis.placeholderTexts.join(', ')}`);
      results.notStarted.push(testResult);
    } else if (!pageAnalysis.hasContent && !pageAnalysis.hasDataTable && !pageAnalysis.hasForm) {
      // Check if it's just a navigation page or truly empty
      if (pageAnalysis.hasHeading && pageAnalysis.hasButtons) {
        testResult.status = 'partial';
        testResult.issues.push('Has heading and buttons but limited content');
        results.partial.push(testResult);
      } else {
        testResult.status = 'not-started';
        testResult.issues.push('Page appears empty or incomplete');
        results.notStarted.push(testResult);
      }
    } else {
      testResult.status = 'completed';
      results.completed.push(testResult);
    }
    
    // Take screenshot for failed/partial pages
    if (testResult.status !== 'completed') {
      const screenshotPath = `test-results/page-tests/${pageInfo.path.replace(/\//g, '_') || 'root'}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      testResult.screenshot = screenshotPath;
    }
    
  } catch (error) {
    testResult.status = 'error';
    testResult.issues.push(`Error: ${error.message}`);
    results.errors.push(testResult);
  }
  
  return testResult;
}

// Main test suite
test.describe('CrewClaw-UI Comprehensive Page Testing', () => {
  test.setTimeout(TEST_TIMEOUT * 2);
  
  test('should test all application pages', async ({ page }) => {
    console.log('\n========================================');
    console.log('CrewClaw-UI Page Testing Started');
    console.log('========================================\n');
    
    // Test each page
    for (const pageInfo of ALL_PAGES) {
      console.log(`Testing: ${pageInfo.name} (${pageInfo.path})`);
      await testPage(page, pageInfo);
    }
    
    // Generate report
    console.log('\n========================================');
    console.log('Testing Complete - Summary');
    console.log('========================================');
    console.log(`Completed Pages: ${results.completed.length}`);
    console.log(`Partial Pages: ${results.partial.length}`);
    console.log(`Not Started Pages: ${results.notStarted.length}`);
    console.log(`Error Pages: ${results.errors.length}`);
    console.log('========================================\n');
    
    // Save detailed results
    const reportPath = 'test-results/comprehensive-page-analysis.json';
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    
    console.log(`Detailed report saved to: ${reportPath}`);
    
    // Print incomplete pages
    if (results.notStarted.length > 0) {
      console.log('\n--- PAGES NOT STARTED ---');
      results.notStarted.forEach(p => {
        console.log(`❌ ${p.name} (${p.path})`);
        console.log(`   Issues: ${p.issues.join(', ')}`);
      });
    }
    
    if (results.partial.length > 0) {
      console.log('\n--- PARTIALLY COMPLETED PAGES ---');
      results.partial.forEach(p => {
        console.log(`⚠️  ${p.name} (${p.path})`);
        console.log(`   Issues: ${p.issues.join(', ')}`);
      });
    }
    
    if (results.errors.length > 0) {
      console.log('\n--- PAGES WITH ERRORS ---');
      results.errors.forEach(p => {
        console.log(`🚨 ${p.name} (${p.path})`);
        console.log(`   Error: ${p.issues.join(', ')}`);
      });
    }
    
    // Verify at least the dashboard loads
    expect(results.completed.length + results.partial.length).toBeGreaterThan(0);
  });
});
