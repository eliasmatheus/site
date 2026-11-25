import { expect, test } from '@playwright/test';

test('home renders without horizontal scroll', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Meet Elias/);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});

test('work page is reachable', async ({ page }) => {
  await page.goto('/work');
  await expect(page.getByRole('heading', { level: 1, name: 'Work' })).toBeVisible();
});
