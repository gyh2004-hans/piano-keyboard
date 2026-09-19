import { test, expect } from '@playwright/test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const pageUrl = pathToFileURL(fileURLToPath(new URL('../examples/generated-app/index.html', import.meta.url))).href;

test.use({ viewport: { width: 1440, height: 960 }, channel: process.platform === 'win32' ? 'msedge' : undefined });

test('reference output demonstrates the desktop keyboard-piano contract', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pageUrl);

  await expect(page.locator('.layout')).toHaveCSS('display', 'grid');
  await expect(page.locator('#computerKeyboard .computer-key')).toHaveCount(19);
  await expect(page.locator('[data-mode]')).toHaveCount(6);
  await expect(page.locator('#piano61 .piano-key')).toHaveCount(61);
  await expect(page.locator('#queue')).toHaveAttribute('data-queue-format', 'letters');
  await expect(page.locator('#queue')).not.toContainText(/[A-G][#b]?\d/);

  const prompt = page.locator('#promptMain');
  const chordHeight = await prompt.evaluate(el => el.getBoundingClientRect().height);
  await page.evaluate(() => window.PianoDemo.showRest());
  expect(await prompt.evaluate(el => el.getBoundingClientRect().height)).toBe(chordHeight);
  await page.evaluate(() => window.PianoDemo.showWaiting());
  expect(await prompt.evaluate(el => el.getBoundingClientRect().height)).toBe(chordHeight);

  await page.locator('#practiceToggle').click();
  const codes = await page.evaluate(() => window.PianoDemo.currentCodes());
  for (const code of codes) await page.keyboard.down(code);
  await expect(page.locator('#progressText')).toContainText('1 /');
  expect(await page.evaluate(() => window.PianoDemo.backingStarts())).toBeGreaterThan(0);
  for (const code of codes) await page.keyboard.up(code);

  await page.locator('#metronomeToggle').click();
  await expect(page.locator('#metronome')).toHaveClass(/running/);
  await page.locator('#metronomeToggle').click();
  await expect(page.locator('#metronome')).not.toHaveClass(/running/);
  expect(errors).toEqual([]);
});

test('free play maps every letter and demonstration advances without user keys', async ({ page }) => {
  await page.goto(pageUrl);
  await page.locator('[data-mode="free"]').click();
  await expect(page.locator('#computerKeyboard .computer-key.target-key')).toHaveCount(19);
  expect(await page.evaluate(() => window.PianoDemo.currentCodes())).toHaveLength(19);

  await page.locator('[data-mode="demo"]').click();
  await page.locator('#practiceToggle').click();
  await expect(page.locator('#progressText')).not.toContainText('0 /', { timeout: 2000 });
});
