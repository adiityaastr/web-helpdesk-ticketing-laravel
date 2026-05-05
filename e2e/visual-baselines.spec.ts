import { test, expect } from './fixtures/auth';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Visual regression baseline capture tests
 * Captures screenshots of major pages for visual comparison
 */

const BASELINE_DIR = '.sisyphus/evidence/visual-baselines';

// Ensure baseline directory exists
if (!fs.existsSync(BASELINE_DIR)) {
  fs.mkdirSync(BASELINE_DIR, { recursive: true });
}

test.describe('Visual Baseline Capture', () => {
  
  test('capture: login page', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({
      path: path.join(BASELINE_DIR, '01-login.png'),
      fullPage: true
    });
  });
  
  test('capture: admin dashboard', async ({ loginAsAdmin }) => {
    const page = await loginAsAdmin();
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({
      path: path.join(BASELINE_DIR, '02-admin-dashboard.png'),
      fullPage: true
    });
  });
  
  test('capture: admin tickets list', async ({ loginAsAdmin }) => {
    const page = await loginAsAdmin();
    await page.goto('/admin/tickets');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({
      path: path.join(BASELINE_DIR, '03-admin-tickets.png'),
      fullPage: true
    });
  });
  
  test('capture: admin users management', async ({ loginAsAdmin }) => {
    const page = await loginAsAdmin();
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({
      path: path.join(BASELINE_DIR, '04-admin-users.png'),
      fullPage: true
    });
  });
  
  test('capture: customer portal dashboard', async ({ loginAsUser }) => {
    const page = await loginAsUser();
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({
      path: path.join(BASELINE_DIR, '05-customer-dashboard.png'),
      fullPage: true
    });
  });
  
  test('capture: customer tickets page', async ({ loginAsUser }) => {
    const page = await loginAsUser();
    await page.goto('/portal/tickets');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({
      path: path.join(BASELINE_DIR, '06-customer-tickets.png'),
      fullPage: true
    });
  });
  
  test('capture: customer create ticket', async ({ loginAsUser }) => {
    const page = await loginAsUser();
    await page.goto('/portal/tickets/create');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({
      path: path.join(BASELINE_DIR, '07-customer-create-ticket.png'),
      fullPage: true
    });
  });
  
  test('capture: staff dashboard', async ({ loginAsStaff }) => {
    const page = await loginAsStaff();
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({
      path: path.join(BASELINE_DIR, '08-staff-dashboard.png'),
      fullPage: true
    });
  });
  
});
