import { test as base, expect, Page } from '@playwright/test';

/**
 * Authentication fixtures for Helpdesk Ticketing E2E tests
 * Provides helpers for logging in as different user types
 */

export interface AuthFixtures {
  /** Login as admin user */
  loginAsAdmin: () => Promise<Page>;
  /** Login as staff user */
  loginAsStaff: () => Promise<Page>;
  /** Login as customer/user */
  loginAsUser: () => Promise<Page>;
  /** Login with custom credentials */
  login: (email: string, password: string) => Promise<Page>;
}

export const test = base.extend<AuthFixtures>({
  // Base page fixture is already provided by Playwright
  
  login: async ({ page }, use) => {
    const loginFn = async (email: string, password: string) => {
      await page.goto('/login');
      
      // Wait for login form
      await page.waitForSelector('input[name="email"]');
      
      // Fill in credentials
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for navigation to complete
      await page.waitForLoadState('networkidle');
      
      return page;
    };
    
    await use(loginFn);
  },
  
  loginAsAdmin: async ({ login }, use) => {
    await use(async () => login('admin@helpdesk.com', 'password'));
  },
  
  loginAsStaff: async ({ login }, use) => {
    await use(async () => login('staff@helpdesk.com', 'password'));
  },
  
  loginAsUser: async ({ login }, use) => {
    await use(async () => login('user@helpdesk.com', 'password'));
  },
});

export { expect } from '@playwright/test';
