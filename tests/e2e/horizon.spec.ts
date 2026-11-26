import { expect, test, type Page } from '@playwright/test';
import { SCENES } from '../../src/scenes/registry';

const horizon = SCENES[0];
if (horizon?.id !== 'horizon') throw new Error('Horizon should open the journey.');
const dwell = horizon.dwell;
const scene = (page: Page) => page.locator('[data-scene="horizon"]');

/** Scroll to a point of the Horizon dwell (0 to 1). Horizon is the first scene. */
const at = async (page: Page, p: number) => {
  const y = Math.round(dwell * p);
  await expect
    .poll(() =>
      page.evaluate((top) => {
        window.scrollTo(0, top);
        // WebKit on CI can skip the scroll event for a programmatic jump; nudge the engine.
        window.dispatchEvent(new Event('scroll'));
        return Math.round(window.scrollY);
      }, y),
    )
    .toBe(y);
};

test.describe('horizon', () => {
  test('starts in the wormhole, then meets Elias at the black hole', async ({ page }) => {
    await page.goto('/journey');
    await expect(
      scene(page).getByRole('heading', { name: 'The long version starts far from here.' }),
    ).toBeVisible();
    await at(page, 0.35);
    await expect(scene(page).getByRole('heading', { level: 1, name: 'Meet Elias.' })).toBeVisible();
    // One line at a time: the wormhole line is switched off (it fades out, then hides; the
    // fade can stall in a background tab on CI, so check the switch, not the animation end).
    await expect(scene(page).locator('[data-beat="0"]')).not.toHaveAttribute('data-on');
    await expect(scene(page).locator('[data-beat="1"]')).toHaveAttribute('data-on', '');
  });

  test('the fall brings up the instruments and every alert', async ({ page }) => {
    await page.goto('/journey');
    await expect(scene(page).locator('[data-hud]')).toBeHidden();
    await at(page, 0.95);
    const hud = scene(page).locator('[data-hud]');
    await expect(hud).toBeVisible();
    await expect(hud.getByText('Signal lost')).toBeVisible();
    await expect(hud.locator('[data-hull]')).not.toHaveText('100%');
    await at(page, 0.97);
    await expect(
      scene(page).getByRole('heading', { name: 'Past this line, there is only forward.' }),
    ).toBeVisible();
  });

  test('the text paints before the shader, over a still wormhole, not the black hole', async ({
    page,
  }) => {
    await page.goto('/journey');
    // The black hole is a surprise for later: the opening is the wormhole.
    await expect(scene(page).locator('.still.worm')).toHaveCSS('opacity', '1');
    await expect(scene(page).locator('.still.hole')).toHaveCSS('opacity', '0');
    await expect(
      scene(page).getByRole('heading', { name: 'The long version starts far from here.' }),
    ).toBeVisible();
  });

  test('reduced motion never shakes the view', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('/journey');
    await at(page, 0.21);
    await at(page, 0.9);
    await page.waitForTimeout(300);
    const transform = await scene(page)
      .locator('[data-shake]')
      .evaluate((el) => (el as HTMLElement).style.transform);
    expect(transform).toBe('');
    await ctx.close();
  });
});
