import { expect, test, type Page } from '@playwright/test';
import { MODE_CONFIG } from '../../src/engine/engine';
import { createTimeline } from '../../src/engine/timeline';
import { SCENES } from '../../src/scenes/registry';

const [first, second] = SCENES;
if (!first || !second) throw new Error('The journey needs at least two scenes.');
/** Scroll (px) where the flight from the first scene to the second starts, per mode. */
const firstFlight = (mode: string | null): number => {
  const m = mode === 'stack' || mode === 'fade' ? mode : 'fly';
  return (createTimeline(SCENES, MODE_CONFIG[m]).starts[0] ?? 0) + first.dwell;
};

const active = (page: Page) => page.locator('[data-stage]').getAttribute('data-active');
const toEnd = async (page: Page) => {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(() => active(page)).toBe('to-be-continued');
};

test.describe('journey', () => {
  test('starts on the first scene with the header always visible', async ({ page }) => {
    await page.goto('/journey');
    await expect(
      page.getByRole('heading', { name: 'The long version starts far from here.' }),
    ).toBeVisible();
    await expect.poll(() => active(page)).toBe(first.id);
    await expect(page.getByRole('link', { name: 'Work →' }).first()).toBeVisible();
    await expect(page.getByText('QUESTS 0/2')).toBeVisible();
  });

  test('scrolling flies to the next scene and updates the hash', async ({ page }) => {
    await page.goto('/journey');
    await toEnd(page);
    await expect(page.getByRole('heading', { name: 'Next stop: the first job.' })).toBeVisible();
    await expect(page).toHaveURL(/#to-be-continued$/);
    // The first scene is gone and cannot be focused or clicked.
    await expect(page.locator(`[data-scene="${first.id}"]`)).toHaveCSS('visibility', 'hidden');
  });

  test('the resting scene has no 3D transform and takes clicks', async ({ page }) => {
    await page.goto('/journey');
    await toEnd(page);
    const end = page.locator('[data-scene="to-be-continued"]');
    await expect(end).toHaveCSS('transform', 'none');
    await expect(end).toHaveCSS('pointer-events', 'auto');
    await end.getByRole('link', { name: 'Work →' }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('the scene waiting in depth never paints over the current one', async ({ page }) => {
    await page.goto('/journey');
    const mode = await page.locator('[data-stage]').getAttribute('data-mode');
    await page.evaluate((y) => window.scrollTo(0, y), firstFlight(mode) - 100);
    await expect.poll(() => active(page)).toBe(first.id);
    const topmost = await page.evaluate(() => {
      const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
      return el?.closest('[data-scene]')?.getAttribute('data-scene');
    });
    expect(topmost).toBe(first.id);
  });

  test('a hidden scene leaves nothing on screen', async ({ page }) => {
    for (const s of SCENES) {
      await page.goto(`/journey#${s.id}`);
      await expect.poll(() => active(page)).toBe(s.id);
      // A child with visibility: visible would show through a hidden layer.
      const leaks = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('[data-scene]')]
          .filter((l) => getComputedStyle(l).visibility === 'hidden')
          .flatMap((l) =>
            [...l.querySelectorAll('*')]
              .filter((n) => getComputedStyle(n).visibility === 'visible')
              .map((n) => `${l.dataset['scene']}: ${n.className || n.tagName}`),
          ),
      );
      expect(leaks).toEqual([]);
    }
  });

  test('an anchor opens the journey on that scene', async ({ page }) => {
    await page.goto('/journey#to-be-continued');
    await expect.poll(() => active(page)).toBe('to-be-continued');
  });

  test('every point of the flight shows a scene (no empty frame)', async ({ page }) => {
    await page.goto('/journey');
    const mode = await page.locator('[data-stage]').getAttribute('data-mode');
    const travel = mode === 'fly' ? 1000 : 600;
    for (let u = 0; u <= 1; u += 0.125) {
      await page.evaluate((y) => window.scrollTo(0, y), firstFlight(mode) + u * travel);
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
    await page.goto('/journey');
    await expect(page.locator('[data-stage]')).toHaveAttribute(
      'data-mode',
      isMobile ? 'stack' : 'fly',
    );
  });

  test('reduced motion only fades', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('/journey');
    await expect(page.locator('[data-stage]')).toHaveAttribute('data-mode', 'fade');
    await page.evaluate((y) => window.scrollTo(0, y), firstFlight('fade') + 200);
    for (const id of [first.id, second.id]) {
      await expect(page.locator(`[data-scene="${id}"]`)).toHaveCSS('transform', 'none');
    }
    await ctx.close();
  });
});

test('without JavaScript every scene is readable in order', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/journey');
  await expect(page.getByRole('heading', { level: 1, name: 'Meet Elias.' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Past this line, there is only forward.' }),
  ).toBeVisible();
  await page.getByRole('heading', { name: 'Next stop: the first job.' }).scrollIntoViewIfNeeded();
  await expect(page.getByRole('heading', { name: 'Next stop: the first job.' })).toBeVisible();
  await ctx.close();
});
