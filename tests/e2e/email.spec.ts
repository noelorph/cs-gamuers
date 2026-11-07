import { expect, test } from '@playwright/test';

for (const width of [1280, 320]) {
  test(`email confirmation GET is inert and fits ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    const mutations: string[] = [];
    page.on('request', (request) => {
      if (request.method() === 'POST') mutations.push(request.url());
    });
    await page.goto('/auth/email?challenge=' + 'a'.repeat(64));
    await expect(page.getByRole('heading', { name: 'Confirm your email' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Confirm email' })).toBeVisible();
    expect(mutations).toHaveLength(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false
    );
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    await page.getByRole('button', { name: 'Confirm email' }).focus();
    await expect(page.getByRole('button', { name: 'Confirm email' })).toBeFocused();
  });
}
test('missing or malformed email challenge has no confirmation action', async ({ page }) => {
  await page.goto('/auth/email?challenge=invalid');
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'This link is unavailable.'
  );
  await expect(page.getByRole('button', { name: 'Confirm email' })).toHaveCount(0);
});
