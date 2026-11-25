import { expect, test, type Page } from '@playwright/test';
import { SCENES } from '../../src/scenes/registry';

const prologue = SCENES.find((s) => s.id === 'prologue');
if (!prologue) throw new Error('No prologue in the registry.');
const dwell = prologue.dwell;
const scene = (page: Page) => page.locator('[data-scene="prologue"]');

/** Scroll to a point of the Prologue dwell (0 to 1). The Prologue is the first scene. */
const at = async (page: Page, p: number) => {
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(dwell * p));
};

/** Look up from the viewfinder until the sun goes down. */
const toCamera = async (page: Page) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await at(page, 0.75);
  await expect(scene(page)).toHaveAttribute('data-phase', '2');
};

test.describe('prologue', () => {
  test('arrives through the viewfinder, perfectly exposed', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Meet Elias.' })).toBeVisible();
    await expect(scene(page).locator('[data-ev]')).toHaveText('±0.0 EV');
    await scene(page).getByRole('link', { name: 'In a hurry? See the work' }).click();
    await expect(page).toHaveURL(/\/work$/);
  });

  test('the camera is not reachable while looking through the viewfinder', async ({ page }) => {
    await page.goto('/');
    await expect(scene(page).locator('[data-cam-ui]')).toHaveJSProperty('inert', true);
  });

  test('the sun goes down and AUTO fixes the exposure (quest +1)', async ({ page }) => {
    await toCamera(page);
    const status = scene(page).locator('[data-status]');
    await expect(status).toHaveText('UNDEREXPOSED · -3.0 EV');
    await expect(page.getByText('QUESTS 0/3')).toBeVisible();
    await scene(page).getByRole('button', { name: 'AUTO' }).click();
    await expect(status).toHaveText('PERFECT · ±0.0 EV');
    await expect(page.getByText('QUESTS 1/3')).toBeVisible();
    await expect(scene(page).getByRole('link', { name: "GOOD LIGHT. LET'S GO ↓" })).toBeVisible();
  });

  test('dials turn with the arrow buttons and the keyboard', async ({ page }) => {
    await toCamera(page);
    const iso = scene(page).getByRole('slider', { name: 'ISO' });
    await expect(iso).toHaveAttribute('aria-valuetext', '400');
    await scene(page).getByRole('button', { name: 'Increase iso' }).click();
    await expect(iso).toHaveAttribute('aria-valuetext', '800');
    await iso.focus();
    await page.keyboard.press('ArrowRight');
    await expect(iso).toHaveAttribute('aria-valuetext', '1600');
    const shutter = scene(page).getByRole('slider', { name: 'SHUTTER' });
    await shutter.focus();
    await page.keyboard.press('ArrowRight');
    await expect(shutter).toHaveAttribute('aria-valuetext', '1/125');
    // ISO 1600 and 1/125 is exactly AUTO: the quest is done by hand too.
    await expect(scene(page).locator('[data-status]')).toHaveText('PERFECT · ±0.0 EV');
    await expect(page.getByText('QUESTS 1/3')).toBeVisible();
  });

  test('exposure only touches the image, never the camera', async ({ page }) => {
    await toCamera(page);
    for (let i = 0; i < 5; i++) {
      await scene(page).getByRole('button', { name: 'Increase iso' }).click();
    }
    await expect(scene(page).locator('[data-status]')).toContainText('OVEREXPOSED');
    for (const sel of ['.camera', '.copy', '.meter-panel', '[data-cam-ui]']) {
      await expect(scene(page).locator(sel).first()).toHaveCSS('filter', 'none');
    }
    await expect(scene(page).locator('.body')).toHaveCSS('opacity', '1');
  });

  test('the camera fits a phone without horizontal scroll', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile layout');
    await toCamera(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
    // Every control is inside the screen and at least 44 px.
    const boxes = await scene(page)
      .locator('[data-cam-ui] button')
      .evaluateAll((bs) => bs.map((b) => b.getBoundingClientRect().toJSON() as DOMRect));
    for (const b of boxes) {
      expect(b.left).toBeGreaterThanOrEqual(0);
      expect(b.right).toBeLessThanOrEqual(390);
      expect(b.bottom).toBeLessThanOrEqual(844);
      expect(Math.min(b.width, b.height)).toBeGreaterThanOrEqual(44);
    }
  });

  test('reduced motion keeps the quest usable', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('/');
    await at(page, 0.75);
    await expect(scene(page)).toHaveAttribute('data-phase', '2');
    await expect(scene(page)).toHaveCSS('transform', 'none');
    await scene(page).getByRole('button', { name: 'AUTO' }).click();
    await expect(scene(page).locator('[data-status]')).toHaveText('PERFECT · ±0.0 EV');
    await ctx.close();
  });
});
