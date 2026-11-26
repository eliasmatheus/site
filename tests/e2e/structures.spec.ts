import { expect, test, type Page } from '@playwright/test';
import { MODE_CONFIG } from '../../src/engine/engine';
import type { StageMode } from '../../src/engine/layers';
import { createTimeline } from '../../src/engine/timeline';
import { SCENES } from '../../src/scenes/registry';

const index = SCENES.findIndex((s) => s.id === 'structures');
const dwell = SCENES[index]?.dwell ?? 0;
const scene = (page: Page) => page.locator('[data-scene="structures"]');

/** Scroll to a point of the Structures dwell (0 to 1) in the page's staging mode. */
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
  await expect
    .poll(() => page.locator('[data-stage]').getAttribute('data-active'))
    .toBe('structures');
};

const toQuest = async (page: Page) => {
  await page.goto('/journey');
  await at(page, 0.5);
  await expect(scene(page)).toHaveAttribute('data-state', 'fail');
};

test.describe('structures', () => {
  test('everything holds, then the plans change and the footing fails', async ({ page }) => {
    await page.goto('/journey');
    await at(page, 0.1);
    await expect(scene(page)).toHaveAttribute('data-state', 'original');
    await expect(
      scene(page).getByRole('heading', { name: 'One of the churches, in 3D.' }),
    ).toBeVisible();
    await at(page, 0.5);
    await expect(scene(page)).toHaveAttribute('data-state', 'fail');
    await expect(
      scene(page).getByRole('heading', { name: 'Then the plans changed.' }),
    ).toBeVisible();
    await expect(scene(page).locator('[data-step-text]')).toContainText('Step 1');
  });

  test('the quest can be solved with the keyboard only', async ({ page }) => {
    await toQuest(page);
    const depth = scene(page).getByRole('slider', { name: /DEPTH/ });
    const width = scene(page).getByRole('slider', { name: /WIDTH/ });
    // 1.50 m to 2.74 m deep, then 1.60 m down to 1.18 m wide (0.02 m per key).
    await depth.focus();
    for (let i = 0; i < 62; i++) await page.keyboard.press('ArrowRight');
    await width.focus();
    for (let i = 0; i < 21; i++) await page.keyboard.press('ArrowLeft');
    await expect(scene(page)).toHaveAttribute('data-state', 'ok');
    await expect(page.getByText('QUESTS 1/3')).toBeVisible();
    await expect(scene(page).locator('[data-kicker]')).toHaveText('QUEST COMPLETE · +25 XP');
  });

  test('the guide walks through widen, deepen and shrink', async ({ page }) => {
    await toQuest(page);
    const width = scene(page).getByRole('slider', { name: /WIDTH/ });
    const depth = scene(page).getByRole('slider', { name: /DEPTH/ });
    await width.fill('2.2');
    await expect(scene(page).locator('[data-step-text]')).toContainText('Step 2');
    await depth.fill('2.7');
    await expect(scene(page).locator('[data-step-text]')).toContainText('Step 3');
  });

  test('"Show me" lands on the sweet spot with a tap', async ({ page }) => {
    await toQuest(page);
    await scene(page).getByRole('button', { name: 'SHOW ME THE SWEET SPOT' }).click();
    await expect(scene(page)).toHaveAttribute('data-state', 'ok');
    await expect(page.getByText('QUESTS 1/3')).toBeVisible();
  });

  test('three.js only loads once the previous scene starts', async ({ page }) => {
    const chunks: string[] = [];
    page.on('request', (r) => {
      if (/model3d/.test(r.url())) chunks.push(r.url());
    });
    await page.goto('/journey');
    await page.waitForLoadState('networkidle');
    expect(chunks).toEqual([]);
    await page.goto('/journey#call');
    await expect.poll(() => chunks.length).toBeGreaterThan(0);
  });

  test('without WebGL the cross-section stays and the quest still works', async ({ page }) => {
    await page.addInitScript(() => {
      const get = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        type: string,
        ...rest: unknown[]
      ) {
        return /webgl/.test(type)
          ? null
          : (get as (...a: unknown[]) => unknown).call(this, type, ...rest);
      } as typeof get;
    });
    await toQuest(page);
    await expect(scene(page)).not.toHaveAttribute('data-3d', '');
    await expect(scene(page).locator('[data-section]')).toBeVisible();
    await scene(page).getByRole('button', { name: 'SHOW ME THE SWEET SPOT' }).click();
    await expect(scene(page)).toHaveAttribute('data-state', 'ok');
  });

  test('on a phone no panel covers another', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile layout');
    await toQuest(page);
    await scene(page).getByRole('button', { name: 'SOIL' }).click();
    const box = (sel: string) =>
      scene(page)
        .locator(sel)
        .first()
        .evaluate((el) => el.getBoundingClientRect().toJSON() as DOMRect);
    const [copy, visual, sheet] = await Promise.all(['.copy', '.visual', '.sheet'].map(box));
    if (!copy || !visual || !sheet) throw new Error('layout boxes missing');
    expect(copy.bottom).toBeLessThanOrEqual(visual.top + 1);
    expect(visual.bottom).toBeLessThanOrEqual(sheet.top + 1);
    expect(sheet.bottom).toBeLessThanOrEqual(844 + 1);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });
});
