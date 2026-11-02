import { expect, test } from '@playwright/test';

test('home has the application title and heading', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('CS-GAMUERS');
  await expect(page.getByRole('heading', { level: 1, name: 'CS-GAMUERS' })).toBeVisible();
});
