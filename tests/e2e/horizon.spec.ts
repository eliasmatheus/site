import { expect, test, type Page } from '@playwright/test';
import { MODE_CONFIG } from '../../src/engine/engine';
import type { StageMode } from '../../src/engine/layers';
import { createTimeline } from '../../src/engine/timeline';
import { SCENES } from '../../src/scenes/registry';
import { atQ, MOUTH_AT } from '../../src/scenes/horizon/beats';

const index = SCENES.findIndex((s) => s.id === 'horizon');
const horizon = SCENES[index];
if (!horizon) throw new Error('The journey should go through Horizon.');
const dwell = horizon.dwell;
const scene = (page: Page) => page.locator('[data-scene="horizon"]');

/** Scroll to a point of the Horizon dwell (0 to 1). It comes right after the first frame. */
const at = async (page: Page, p: number) => {
  const mode = ((await page.locator('[data-stage]').getAttribute('data-mode')) ??
    'fly') as StageMode;
  const start = createTimeline(SCENES, MODE_CONFIG[mode]).starts[index] ?? 0;
  const y = Math.round(start + dwell * p);
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
  test('starts at the ringed planet, then meets Elias at the black hole', async ({ page }) => {
    await page.goto('/journey#horizon');
    await expect(
      scene(page).getByRole('heading', { name: 'The long version starts far from here.' }),
    ).toBeVisible();
    await at(page, atQ(0.35));
    await expect(scene(page).getByRole('heading', { level: 1, name: 'Meet Elias.' })).toBeVisible();
    // One line at a time: the wormhole line is switched off (it fades out, then hides; the
    // fade can stall in a background tab on CI, so check the switch, not the animation end).
    await expect(scene(page).locator('[data-beat="0"]')).not.toHaveAttribute('data-on');
    await expect(scene(page).locator('[data-beat="1"]')).toHaveAttribute('data-on', '');
  });

  test('the fall brings up the instruments and every alert', async ({ page }) => {
    await page.goto('/journey#horizon');
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

  test('the text paints before the shader, over a still ringed planet, not the black hole', async ({
    page,
  }) => {
    await page.goto('/journey#horizon');
    // The black hole is a surprise for later: the opening is the ringed planet.
    await expect(scene(page).locator('.still.planet')).toHaveCSS('opacity', '1');
    await expect(scene(page).locator('.still.hole')).toHaveCSS('opacity', '0');
    await expect(
      scene(page).getByRole('heading', { name: 'The long version starts far from here.' }),
    ).toBeVisible();
  });

  test('reduced motion never shakes the view', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('/journey#horizon');
    await at(page, MOUTH_AT + 0.03);
    await at(page, 0.9);
    await page.waitForTimeout(300);
    const transform = await scene(page)
      .locator('[data-shake]')
      .evaluate((el) => (el as HTMLElement).style.transform);
    expect(transform).toBe('');
    await ctx.close();
  });
});
