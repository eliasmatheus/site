import { expect, test } from '@playwright/test';

test.describe('the first frame', () => {
  test('says who he is and offers both ways in', async ({ page }) => {
    await page.goto('/start');
    await expect(page.getByRole('heading', { level: 1, name: 'Elias Matheus' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'To the stars' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Start the journey' })).toHaveAttribute(
      'href',
      '/journey',
    );
    await expect(page.getByRole('link', { name: 'See the work →' })).toHaveAttribute('href', '/');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      ),
    ).toBe(false);
  });
});

test.describe('the first frame with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('Start goes straight to the journey', async ({ page }) => {
    await page.goto('/start');
    await page.getByRole('link', { name: 'Start the journey' }).click();
    await expect(page).toHaveURL(/\/journey$/);
  });
});
