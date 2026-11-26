import { expect, test, type Page } from '@playwright/test';
import { MODE_CONFIG } from '../../src/engine/engine';
import type { StageMode } from '../../src/engine/layers';
import { createTimeline } from '../../src/engine/timeline';
import { SCENES } from '../../src/scenes/registry';

const index = SCENES.findIndex((s) => s.id === 'the-fall');
const dwell = SCENES[index]?.dwell ?? 0;
const scene = (page: Page) => page.locator('[data-scene="the-fall"]');

/** Scroll to a point of The fall's dwell (0 to 1). */
const at = async (page: Page, p: number) => {
  const mode = ((await page.locator('[data-stage]').getAttribute('data-mode')) ??
    'fly') as StageMode;
  const start = createTimeline(SCENES, MODE_CONFIG[mode]).starts[index] ?? 0;
  const y = Math.round(start + dwell * p);
  await expect
    .poll(() =>
      page.evaluate((top) => {
        window.scrollTo(0, top);
        window.dispatchEvent(new Event('scroll'));
        return Math.round(window.scrollY);
      }, y),
    )
    .toBe(y);
  await expect
    .poll(() => page.locator('[data-stage]').getAttribute('data-active'), { timeout: 10_000 })
    .toBe('the-fall');
};

test.describe('the fall', () => {
  test('comes right after the black hole', () => {
    expect(SCENES[0]?.id).toBe('horizon');
    expect(SCENES[1]?.id).toBe('the-fall');
    expect(SCENES[2]?.id).toBe('call');
  });

  test('opens on its title, over a still shaft before any 3D loads', async ({ page }) => {
    await page.goto('/journey');
    await at(page, 0.07);
    await expect(scene(page).locator('.still')).toBeVisible();
    await expect(
      scene(page).getByRole('heading', { name: 'Here, the past is a place you can visit.' }),
    ).toBeVisible();
  });

  test('names each moment seen through a gap, newest first', async ({ page }) => {
    await page.goto('/journey');
    const labels = [
      '2020 · print(‘Olá, Mundo!’)',
      '2019 to 2020 · The desert',
      '2012 to 2020 · Structures',
      '2011 · The choice',
      'Late 90s · The first computer',
    ];
    for (const [i, p] of [0.24, 0.39, 0.54, 0.69, 0.79].entries()) {
      await at(page, p);
      await expect(scene(page).locator('[data-glimpse]')).toHaveAttribute('data-on', '');
      await expect(scene(page).locator('[data-glimpse-text]')).toHaveText(labels[i] ?? '');
    }
  });

  test('through the last gap, an old computer with a save file to continue', async ({ page }) => {
    await page.goto('/journey');
    await at(page, 0.985);
    const retro = scene(page).locator('[data-retro]');
    await expect(retro).toHaveAttribute('data-open', '');
    await expect(retro.getByText('SAVE FILE · LATE 90S')).toBeVisible();
    await expect(retro.getByText('CONTINUE', { exact: true })).toBeVisible();
  });

  test('the lattice draws once the visitor moves', async ({ page, isMobile }) => {
    test.skip(isMobile, 'pointer');
    await page.goto('/journey');
    await at(page, 0.3);
    await page.mouse.move(600, 400);
    await page.mouse.move(700, 450);
    // On a software GPU (as on the CI machines) the still shaft stays: no 3D to stall the page.
    const software = await page.evaluate(() => {
      const gl = document.createElement('canvas').getContext('webgl');
      const info = gl?.getExtension('WEBGL_debug_renderer_info');
      const name = info ? String(gl?.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
      return /swiftshader|llvmpipe|softpipe|software/i.test(name);
    });
    await expect(scene(page)).toHaveAttribute(software ? 'data-still' : 'data-ready', '', {
      timeout: 20_000,
    });
  });
});
