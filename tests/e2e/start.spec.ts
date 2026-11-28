import { expect, test } from '@playwright/test';

const active = (page: import('@playwright/test').Page) =>
  page.locator('[data-stage]').getAttribute('data-active');

test.describe('the first frame', () => {
  test('opens the journey: who he is and both ways in', async ({ page }) => {
    await page.goto('/journey');
    await expect.poll(() => active(page)).toBe('start');
    const scene = page.locator('[data-scene="start"]');
    await expect(scene.getByRole('heading', { name: 'Elias Matheus' })).toBeVisible();
    await expect(scene.getByRole('heading', { name: 'To the stars' })).toBeVisible();
    await expect(scene.getByRole('link', { name: 'Start the journey' })).toHaveAttribute(
      'href',
      '#horizon',
    );
    await expect(scene.getByRole('link', { name: 'See the work →' })).toHaveAttribute('href', '/');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      ),
    ).toBe(false);
  });

  test('its old address opens the journey', async ({ page }) => {
    await page.goto('/start');
    await expect(page).toHaveURL(/\/journey$/);
  });
});

test.describe('the first frame with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('Start goes straight on to Saturn', async ({ page }) => {
    await page.goto('/journey');
    await page.getByRole('link', { name: 'Start the journey' }).click();
    await expect.poll(() => active(page)).toBe('horizon');
    await expect(page).toHaveURL(/#horizon$/);
  });
});
