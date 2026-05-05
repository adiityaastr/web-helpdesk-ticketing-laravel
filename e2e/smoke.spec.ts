import { test, expect } from './fixtures/auth';

/**
 * Smoke tests for Helpdesk Ticketing application
 * Basic navigation and page load tests
 */

test.describe('Smoke Tests', () => {
  
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Page should load without errors
    await expect(page).toHaveTitle(/Helpdesk|Login|Welcome/i);
  });
  
  test('login page is accessible', async ({ page }) => {
    await page.goto('/login');
    
    // Should see login form elements
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
  
  test('admin can login and access dashboard', async ({ loginAsAdmin }) => {
    const page = await loginAsAdmin();
    
    // Should be redirected to dashboard after login
    await expect(page).toHaveURL(/\/admin\/dashboard|dashboard/);
    
    // Dashboard should have expected content
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });
  
  test('customer can login and access portal', async ({ loginAsUser }) => {
    const page = await loginAsUser();
    
    // Should be redirected to customer portal
    await expect(page).toHaveURL(/\/portal\/dashboard|portal/);
    
    // Portal should have expected content
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });
  
  test('staff can login and access admin panel', async ({ loginAsStaff }) => {
    const page = await loginAsStaff();
    
    // Should be redirected to admin dashboard
    await expect(page).toHaveURL(/\/admin\/dashboard|dashboard/);
    
    // Should see admin-specific content
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });
  
  test('navigation to tickets page works', async ({ loginAsAdmin }) => {
    const page = await loginAsAdmin();
    
    // Navigate to tickets
    await page.goto('/admin/tickets');
    
    // Page should load
    await expect(page.locator('text=Ticket|Tiket')).toBeVisible();
  });
  
  test('invalid login shows error', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in wrong credentials
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=invalid|error|gagal|salah', { ignoreCase: true })).toBeVisible();
  });
  
});
