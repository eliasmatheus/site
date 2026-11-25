import { expect, test } from '@playwright/test';

test('home renders without horizontal scroll', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Meet Elias/);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});

test('work page shows positioning, projects, experience and contact', async ({ page }) => {
  await page.goto('/work');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  for (const name of ['Selected projects', 'Experience', 'Contact']) {
    await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();
  }
  await expect(page.getByRole('heading', { level: 3, name: 'Dental Intelligence' })).toBeVisible();
  // No placeholder brackets or empty links ever reach the page.
  await expect(page.locator('main')).not.toContainText('[');
  const hrefs = await page.locator('a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(hrefs.every((h) => h && h !== '#')).toBe(true);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});
