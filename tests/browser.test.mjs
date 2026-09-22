import { test, expect } from '@playwright/test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const pageUrl = pathToFileURL(fileURLToPath(new URL('../examples/generated-app/index.html', import.meta.url))).href;
test.use({ viewport: { width: 2560, height: 1440 }, channel: process.platform === 'win32' ? 'msedge' : undefined });

async function visibleSets(page, selector = '.computer-key.target') {
  return page.evaluate(selector => ({
    flow: [...document.querySelectorAll('.flow-group.current .flow-letter')].map(el => el.textContent.trim().toUpperCase()).sort(),
    keyboard: [...document.querySelectorAll(selector)].map(el => el.querySelector('strong').textContent.trim().toUpperCase()).sort()
  }), selector);
}

test('reference output exposes the v2 desktop composition', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pageUrl);

  await expect(page.locator('#computerKeyboard .computer-key')).toHaveCount(45);
  await expect(page.locator('#computerKeyboard .computer-key.standard')).toHaveCount(35);
  await expect(page.locator('#piano61 .piano-key')).toHaveCount(61);
  await expect(page.locator('.song-card')).toHaveCount(8);
  await expect(page.locator('[data-mode]')).toHaveCount(6);

  const geometry = await page.evaluate(() => {
    const flow = document.querySelector('#noteFlow').getBoundingClientRect();
    const keyboard = document.querySelector('#computerKeyboard').getBoundingClientRect();
    const piano = document.querySelector('#piano61').getBoundingClientRect();
    const rail = document.querySelector('#songRail').getBoundingClientRect();
    const fullyVisible = [...document.querySelectorAll('.song-card')].filter(card => {
      const box = card.getBoundingClientRect();
      return box.top >= rail.top && box.bottom <= rail.bottom + .5;
    }).length;
    return { ordered: flow.bottom <= keyboard.top && keyboard.bottom <= piano.top, fullyVisible, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth };
  });
  expect(geometry).toEqual({ ordered: true, fullyVisible: 6, overflow: false });
  expect(errors).toEqual([]);
});

test('practice flow and keyboard use one prompt and free release has no penalty', async ({ page }) => {
  await page.goto(pageUrl);
  await page.locator('#practiceToggle').click();
  expect(await visibleSets(page)).toEqual(expect.objectContaining({ flow: expect.any(Array) }));
  const before = await visibleSets(page);
  expect(before.keyboard).toEqual(before.flow);
  expect(before.flow.length).toBeGreaterThan(0);

  const codes = await page.evaluate(() => window.PianoDemo.currentCodes());
  for (const code of codes) await page.keyboard.down(code);
  await expect(page.locator('#completed')).toHaveText('1');
  for (const code of codes) await page.keyboard.up(code);

  const stats = await page.evaluate(() => window.PianoDemo.stats());
  expect(stats.mistakes).toBe(0);
  expect(stats.correctGroups).toBe(1);
  const after = await visibleSets(page);
  expect(after.keyboard).toEqual(after.flow);
});

test('demonstration keeps accompaniment audible but out of visible prompts', async ({ page }) => {
  await page.goto(pageUrl);
  await page.locator('[data-mode="demo"]').click();
  await page.locator('#practiceToggle').click();
  await expect.poll(() => page.evaluate(() => window.PianoDemo.backingStarts())).toBeGreaterThan(0);
  const sets = await visibleSets(page, '.computer-key.demo-note');
  expect(sets.keyboard).toEqual(sets.flow);
  expect(sets.flow.length).toBeGreaterThan(0);
  expect(await page.locator('.computer-key.demo-note').count()).toBe(sets.flow.length);
});

test('song rail scrolls without looping and responsive widths do not overflow', async ({ page }) => {
  await page.goto(pageUrl);
  const rail = page.locator('#songRail');
  await rail.hover();
  await page.mouse.wheel(0, 500);
  await expect.poll(() => rail.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
  const end = await rail.evaluate(el => ({ top: el.scrollTop, max: el.scrollHeight - el.clientHeight }));
  expect(end.top).toBeLessThanOrEqual(end.max);

  for (const width of [2560, 1920, 1366, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
});
