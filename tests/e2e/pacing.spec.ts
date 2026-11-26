import { expect, test, type Page } from '@playwright/test';
import { MODE_CONFIG } from '../../src/engine/engine';
import type { StageMode } from '../../src/engine/layers';
import { createTimeline } from '../../src/engine/timeline';
import { SCENES } from '../../src/scenes/registry';

// The Call is told one gesture at a time: a fast flick lands on the next stop, never further.
const index = SCENES.findIndex((s) => s.id === 'call');
const call = SCENES[index];
if (!call?.stops) throw new Error('The Call should have stops.');
const stops = call.stops;

const stopY = async (page: Page, i: number): Promise<number> => {
  const mode = ((await page.locator('[data-stage]').getAttribute('data-mode')) ??
    'fly') as StageMode;
  const start = createTimeline(SCENES, MODE_CONFIG[mode]).starts[index] ?? 0;
  return Math.round(start + call.dwell * (stops[i] ?? 0));
};

/**
 * A trackpad flick: a burst of wheel deltas and a fading tail, about 2000 px in all. Sent in
 * one go from the page: synthetic events are stamped when they are created, so a busy test
 * browser could otherwise stretch the flick into two gestures (real ones carry input time).
 */
const flick = (page: Page, dir = 1) =>
  page.evaluate((d) => {
    for (const delta of [80, 200, 320, 300, 260, 220, 180, 140, 100, 80, 60, 40, 20, 10]) {
      window.dispatchEvent(
        new WheelEvent('wheel', { deltaY: delta * d, cancelable: true, bubbles: true }),
      );
    }
  }, dir);

const scrollTop = (page: Page) => page.evaluate(() => Math.round(scrollY));

test.describe('pacing', () => {
  test.skip(({ isMobile }) => isMobile, 'the wheel is a desktop gesture');

  test('a long scroll into The Call stops at its first line', async ({ page }) => {
    await page.goto('/journey#call');
    await expect.poll(() => scrollTop(page)).toBeGreaterThan(0);
    await page.mouse.move(700, 450);
    await page.mouse.wheel(0, 1500);
    await expect.poll(() => scrollTop(page)).toBe(await stopY(page, 0));
  });

  test('one flick moves one line, in both directions', async ({ page }) => {
    await page.goto('/journey#call');
    const first = await stopY(page, 0);
    await expect
      .poll(() => page.evaluate((y) => (scrollTo(0, y), Math.round(scrollY)), first))
      .toBe(first);
    await flick(page);
    await expect.poll(() => scrollTop(page)).toBe(await stopY(page, 1));
    await page.waitForTimeout(300);
    await flick(page);
    await expect.poll(() => scrollTop(page)).toBe(await stopY(page, 2));
    await page.waitForTimeout(300);
    await flick(page, -1);
    await expect.poll(() => scrollTop(page)).toBe(await stopY(page, 1));
  });

  test('the arrow keys step through the lines too', async ({ page }) => {
    await page.goto('/journey#call');
    const first = await stopY(page, 0);
    await expect
      .poll(() => page.evaluate((y) => (scrollTo(0, y), Math.round(scrollY)), first))
      .toBe(first);
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => scrollTop(page)).toBe(await stopY(page, 1));
  });
});
