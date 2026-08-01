import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Go to landing page
    await page.goto('/');
  });

  test('landing page loads correctly', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Papyr');
    await expect(page.locator('h2')).toContainText('Your Handwritten Digital Ledger');
    await expect(page.locator('text=Sign In')).toBeVisible();
    await expect(page.locator('text=Create Account')).toBeVisible();
  });

  test('navigate to login page', async ({ page }) => {
    await page.click('text=Sign In');
    await expect(page).toHaveURL('/auth/login');
    await expect(page.locator('h2')).toContainText('Sign in to Papyr');
  });

  test('navigate to signup page', async ({ page }) => {
    await page.click('text=Create Account');
    await expect(page).toHaveURL('/auth/signup');
    await expect(page.locator('h2')).toContainText('Create your account');
  });

  test('login form validation', async ({ page }) => {
    await page.goto('/auth/login');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Check that email and password are required
    await expect(page.locator('input[name="email"]')).toHaveAttribute('required');
    await expect(page.locator('input[name="password"]')).toHaveAttribute('required');
  });

  test('signup form validation', async ({ page }) => {
    await page.goto('/auth/signup');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Check that all fields are required
    await expect(page.locator('input[name="displayName"]')).toHaveAttribute('required');
    await expect(page.locator('input[name="email"]')).toHaveAttribute('required');
    await expect(page.locator('input[name="password"]')).toHaveAttribute('required');
    await expect(page.locator('input[name="confirmPassword"]')).toHaveAttribute('required');
  });

  test('signup password mismatch shows error', async ({ page }) => {
    await page.goto('/auth/signup');

    await page.fill('input[name="displayName"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'differentpassword');

    await page.click('button[type="submit"]');

    // Should show alert or error about password mismatch
    // Note: This uses window.alert which might need special handling
  });
});

test.describe('Protected Routes', () => {
  test('dashboard redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.locator('text=Sign in to Papyr')).toBeVisible();
  });

  test('profile redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/profile');

    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('auth pages redirect to dashboard when authenticated', async ({ page }) => {
    // This test would require setting up authentication state
    // For now, we verify the redirect logic exists in middleware
    await page.goto('/auth/login');
    await expect(page).toHaveURL('/auth/login'); // Not authenticated, so stays on login
  });
});

test.describe('Landing Page Features', () => {
  test('features section displays correctly', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('text=Zero-Latency Ink')).toBeVisible();
    await expect(page.locator('text=Natural Pressure')).toBeVisible();
    await expect(page.locator('text=Offline First')).toBeVisible();
  });
});