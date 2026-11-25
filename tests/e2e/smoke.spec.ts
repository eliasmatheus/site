import { expect, test } from '@playwright/test';

test('home renders without horizontal scroll', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Elias Matheus/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});
