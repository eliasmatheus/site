import { expect, test, type Page } from '@playwright/test';

const active = (page: Page) => page.locator('[data-stage]').getAttribute('data-active');
const toEnd = async (page: Page) => {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(() => active(page)).toBe('to-be-continued');
};

test.describe('journey', () => {
  test('starts on the first scene with the header always visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Then came the desert.' })).toBeVisible();
    await expect.poll(() => active(page)).toBe('desert');
    await expect(page.getByRole('link', { name: 'Work →' }).first()).toBeVisible();
    await expect(page.getByText('QUESTS 0/3')).toBeVisible();
  });

  test('scrolling flies to the next scene and updates the hash', async ({ page }) => {
    await page.goto('/');
    await toEnd(page);
    await expect(page.getByRole('heading', { name: 'Next stop: the first job.' })).toBeVisible();
    await expect(page).toHaveURL(/#to-be-continued$/);
    // The desert is gone and cannot be focused or clicked.
    await expect(page.locator('[data-scene="desert"]')).toHaveCSS('visibility', 'hidden');
  });

  test('the resting scene has no 3D transform and takes clicks', async ({ page }) => {
    await page.goto('/');
    await toEnd(page);
    const end = page.locator('[data-scene="to-be-continued"]');
    await expect(end).toHaveCSS('transform', 'none');
    await expect(end).toHaveCSS('pointer-events', 'auto');
    await end.getByRole('link', { name: 'Work →' }).click();
    await expect(page).toHaveURL(/\/work$/);
  });

  test('the scene waiting in depth never paints over the current one', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, 1400));
    const topmost = await page.evaluate(() => {
      const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
      return el?.closest('[data-scene]')?.getAttribute('data-scene');
    });
    expect(topmost).toBe('desert');
  });

  test('an anchor opens the journey on that scene', async ({ page }) => {
    await page.goto('/#to-be-continued');
    await expect.poll(() => active(page)).toBe('to-be-continued');
  });

  test('every point of the flight shows a scene (no empty frame)', async ({ page }) => {
    await page.goto('/');
    const travel =
      (await page.locator('[data-stage]').getAttribute('data-mode')) === 'fly' ? 1000 : 600;
    for (let u = 0; u <= 1; u += 0.125) {
      await page.evaluate((y) => window.scrollTo(0, y), 1500 + u * travel);
      await expect
        .poll(() =>
          page.evaluate(() =>
            [...document.querySelectorAll<HTMLElement>('[data-scene]')].some(
              (el) =>
                getComputedStyle(el).visibility === 'visible' &&
                Number(getComputedStyle(el).opacity) > 0.2,
            ),
          ),
        )
        .toBe(true);
    }
  });
});

test.describe('staging modes', () => {
  test('desktop flies, mobile stacks', async ({ page, isMobile }) => {
    await page.goto('/');
    await expect(page.locator('[data-stage]')).toHaveAttribute(
      'data-mode',
      isMobile ? 'stack' : 'fly',
    );
  });

  test('reduced motion only fades', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('/');
    await expect(page.locator('[data-stage]')).toHaveAttribute('data-mode', 'fade');
    await page.evaluate(() => window.scrollTo(0, 1500 + 200));
    for (const id of ['desert', 'to-be-continued']) {
      await expect(page.locator(`[data-scene="${id}"]`)).toHaveCSS('transform', 'none');
    }
    await ctx.close();
  });
});

test('without JavaScript every scene is readable in order', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Then came the desert.' })).toBeVisible();
  await page.getByRole('heading', { name: 'Next stop: the first job.' }).scrollIntoViewIfNeeded();
  await expect(page.getByRole('heading', { name: 'Next stop: the first job.' })).toBeVisible();
  await ctx.close();
});
