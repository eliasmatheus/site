import { expect, test } from '@playwright/test';

const noHorizontalScroll = (page: import('@playwright/test').Page) =>
  page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

test('the journey renders without horizontal scroll', async ({ page }) => {
  await page.goto('/journey');
  await expect(page).toHaveTitle(/Meet Elias/);
  expect(await noHorizontalScroll(page)).toBe(false);
});

test.describe('landing', () => {
  test('shows who, what, where and how to reach me', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: /Elias Matheus/ })).toBeVisible();
    for (const name of ['About', 'Experience', 'Projects']) {
      await expect(page.getByRole('heading', { level: 2, name })).toBeAttached();
    }
    await expect(
      page.getByRole('heading', { level: 3, name: 'Dental Intelligence' }),
    ).toBeAttached();
    // The email is plain, selectable text, not only a link label.
    await expect(page.getByText('eliasmatheus@hotmail.com')).toBeVisible();
    await expect(page.locator('main')).not.toContainText('[');
    const hrefs = await page
      .locator('a')
      .evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    expect(hrefs.every((h) => h && h !== '#')).toBe(true);
    expect(await noHorizontalScroll(page)).toBe(false);
  });

  test('the door at the end opens the journey', async ({ page }) => {
    await page.goto('/');
    const door = page.getByRole('link', { name: 'Begin the journey ↓' });
    await door.scrollIntoViewIfNeeded();
    await door.click();
    await expect(page).toHaveURL(/\/journey$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Meet Elias.' })).toBeVisible();
  });

  test('the old work page lands here', async ({ page }) => {
    await page.goto('/work');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1, name: /Elias Matheus/ })).toBeVisible();
  });
});

test.describe('landing without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('keeps the whole record', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 3, name: 'Cocreare' })).toBeAttached();
    await expect(page.getByRole('heading', { level: 3, name: 'Open Finance MCP' })).toBeAttached();
    await expect(page.getByRole('link', { name: 'Begin the journey ↓' })).toBeAttached();
  });
});

test.describe('landing with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the satellite stands still', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.orbit .sat')).toHaveCSS('animation-name', 'none');
  });
});
