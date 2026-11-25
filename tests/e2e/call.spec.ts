import { expect, test, type Page } from '@playwright/test';
import { MODE_CONFIG } from '../../src/engine/engine';
import type { StageMode } from '../../src/engine/layers';
import { createTimeline } from '../../src/engine/timeline';
import { SCENES } from '../../src/scenes/registry';

const index = SCENES.findIndex((s) => s.id === 'call');
const dwell = SCENES[index]?.dwell ?? 0;
const scene = (page: Page) => page.locator('[data-scene="call"]');

/** Scroll to a point of The Call's dwell (0 to 1) in the page's current staging mode. */
const at = async (page: Page, p: number) => {
  const mode = ((await page.locator('[data-stage]').getAttribute('data-mode')) ??
    'fly') as StageMode;
  const start = createTimeline(SCENES, MODE_CONFIG[mode]).starts[index] ?? 0;
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(start + dwell * p));
  await expect.poll(() => page.locator('[data-stage]').getAttribute('data-active')).toBe('call');
  // Let the engine paint the new position before reading the scene's state.
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );
};

test.describe('the call', () => {
  test('boots, then plays the montage one skill at a time', async ({ page }) => {
    await page.goto('/');
    await at(page, 0.08);
    await expect(scene(page)).toHaveAttribute('data-beat', 'boot');
    await expect(scene(page).getByText('Dad brought home our first computer.')).toBeVisible();
    await at(page, 0.2);
    await expect(scene(page)).toHaveAttribute('data-beat', 'montage');
    await expect(scene(page).locator('.chip[data-on]')).toHaveCount(1);
    await at(page, 0.69);
    await expect(scene(page).locator('.chip[data-on]')).toHaveCount(7);
  });

  test('every point of the scene shows a picture and a line', async ({ page }) => {
    await page.goto('/');
    for (let p = 0; p <= 1; p += 1 / 30) {
      await at(page, p);
      await expect(scene(page).locator('.line[data-on]')).toHaveCount(1);
      const beat = await scene(page).getAttribute('data-beat');
      if (beat === 'boot' || beat === 'montage') {
        await expect(scene(page).locator('.vig[data-on]')).toHaveCount(1);
      } else {
        await expect(scene(page).locator(beat === 'choice' ? '.cards' : '.floppy')).toBeVisible();
      }
    }
  });

  test('everything points to computers, and he picks civil engineering', async ({ page }) => {
    await page.goto('/');
    await at(page, 0.76);
    await expect(scene(page).locator('[data-card="cs"]')).toHaveAttribute('data-over', 'cs');
    await expect(scene(page)).not.toHaveAttribute('data-chosen', '');
    await at(page, 0.86);
    await expect(scene(page)).toHaveAttribute('data-chosen', '');
    await expect(scene(page).locator('[data-card="civil"]')).toHaveAttribute('data-picked', '');
    await expect(scene(page).getByText('Code and design never crossed my mind.')).toBeVisible();
    await at(page, 0.97);
    await expect(scene(page).getByText('Saved for later.')).toBeVisible();
  });

  test('no brand names, anywhere in the scene', async ({ page }) => {
    await page.goto('/');
    const text = await scene(page).evaluate((el) =>
      [
        el.textContent,
        ...[...el.querySelectorAll('*')].flatMap((n) => [...n.attributes].map((a) => a.value)),
      ].join(' '),
    );
    for (const brand of [
      'Top Gear',
      'Nintendo',
      'Photoshop',
      'Cheat Engine',
      'eMule',
      'Sims',
      'Intel',
    ]) {
      expect(text).not.toContain(brand);
    }
  });

  test('on a phone the line and the picture never overlap', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile layout');
    await page.goto('/');
    for (const p of [0.05, 0.3, 0.6, 0.8, 0.95]) {
      await at(page, p);
      const [stage, dialog, skills] = await Promise.all(
        ['.stage-area', '.dialog', '.skills'].map((sel) =>
          scene(page)
            .locator(sel)
            .evaluate((el) => el.getBoundingClientRect().toJSON() as DOMRect),
        ),
      );
      if (!stage || !dialog || !skills) throw new Error('layout boxes missing');
      expect(stage.bottom).toBeLessThanOrEqual(skills.top + 1);
      expect(skills.bottom).toBeLessThanOrEqual(dialog.top + 1);
      expect(dialog.bottom).toBeLessThanOrEqual(844);
    }
  });

  test('reduced motion shows the choice already made', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('/');
    await at(page, 0.71);
    await expect(scene(page)).toHaveAttribute('data-beat', 'choice');
    await expect(scene(page)).toHaveAttribute('data-chosen', '');
    await ctx.close();
  });
});
