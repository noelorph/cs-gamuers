// Run from the repository root: node docs/design/check-preview.mjs
// Checks design artifacts only; this is not an application acceptance suite.
import assert from 'node:assert/strict';
import { readFile, readdir, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const root = new URL('./', import.meta.url);
const pages = (await readdir(root)).filter((name) => name.endsWith('.html'));
assert.equal(pages.length, 9);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
await mkdir(new URL('./screenshots/', root), { recursive: true });
try {
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    for (const name of pages) {
      await page.goto(new URL(name, root).href);
      await page.locator('.reviewbar summary').click();
      await page.locator('.reviewbar summary').click();
      assert.equal(await page.locator('h1').count(), 1, name);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      assert.equal(overflow, false, `${name} overflows at ${width}`);
      const missingLabels = await page
        .locator('input,select,textarea')
        .evaluateAll((fields) => fields.filter((field) => !field.labels?.length).length);
      assert.equal(missingLabels, 0, `${name} unlabeled field`);
      if (width >= 1024) {
        const brand = await page.locator('.sidebar > .brand').boundingBox();
        const heading = await page.locator('h1').boundingBox();
        assert.ok(Math.abs(brand.y - heading.y) < 1, `${name} header alignment at ${width}`);
        await page.locator('main').evaluate((el) => {
          el.scrollTop = el.scrollHeight;
        });
        const after = await page.locator('.sidebar > .brand').boundingBox();
        assert.equal(after.y, brand.y, `${name} sidebar moved with content`);
        assert.equal(await page.evaluate(() => window.scrollY), 0);
        await page.locator('main').evaluate((el) => {
          el.scrollTop = 0;
        });
      }
      if (width === 320 || width === 1440) {
        await page.screenshot({
          path: fileURLToPath(
            new URL(`screenshots/${name.replace('.html', '')}-${width}.png`, root)
          ),
          fullPage: true,
        });
      }
    }
  }
  await page.setViewportSize({ width: 1366, height: 768 });
  for (const name of [
    'quiz.html',
    'quiz-result.html',
    'quiz-uncertain.html',
    'reports-small.html',
  ]) {
    await page.goto(new URL(name, root).href);
    assert.ok(
      await page.locator('main').evaluate((el) => el.scrollHeight <= el.clientHeight + 1),
      `${name} should fit a standard laptop viewport`
    );
  }
  await page.setViewportSize({ width: 1024, height: 480 });
  await page.goto(new URL('learning.html', root).href);
  assert.ok(
    await page.locator('main').evaluate((el) => el.scrollHeight > el.clientHeight),
    'Long content must remain scrollable in a short viewport'
  );
  const navigation = page.locator('.sidebar > .sidenav');
  assert.ok(await navigation.evaluate((el) => el.scrollHeight > el.clientHeight));
  const brandBefore = await page.locator('.sidebar > .brand').boundingBox();
  await navigation.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  assert.ok(await navigation.evaluate((el) => el.scrollTop > 0));
  assert.equal((await page.locator('.sidebar > .brand').boundingBox()).y, brandBefore.y);
  const identity = await page.locator('.identity').boundingBox();
  assert.ok(identity.y + identity.height <= 480, 'Account area remains visible on short screens');
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto(new URL('quiz.html', root).href);
  const trigger = page.locator('[data-menu]');
  await trigger.click();
  assert.equal(await page.locator('dialog').evaluate((el) => el.open), true);
  assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
  // Native modal dialogs may let Tab reach browser chrome; background page controls must remain inert.
  await trigger.evaluate((el) => el.focus());
  assert.equal(await page.evaluate(() => !!document.activeElement.closest('dialog')), true);
  await page.keyboard.press('Escape');
  await page.waitForFunction(
    () => document.querySelector('[data-menu]').getAttribute('aria-expanded') === 'false'
  );
  assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
  assert.equal(await trigger.evaluate((el) => el === document.activeElement), true);
  await page.getByLabel('It runs both branches every time.').check();
  assert.equal(await page.getByLabel('It runs both branches every time.').isChecked(), true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(new URL('quiz-error.html', root).href);
  await page.getByRole('link', { name: 'Retry saving · preview' }).click();
  assert.match(page.url(), /quiz\.html$/);
  // Text enlargement checks reflow independently of the viewport checks above.
  for (const name of pages) {
    await page.goto(new URL(name, root).href);
    await page.addStyleTag({ content: 'html { font-size: 200%; }' });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      `${name} at 200% text`
    );
  }
  const suppressed = await readFile(new URL('reports-small.html', root), 'utf8');
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    await page.goto(new URL('review.html', root).href);
    const mode = page.locator('#review-mode');
    const reason = page.locator('#reason');
    const action = page.locator('#review-submit');
    assert.equal(await mode.locator('option').count(), 4);
    assert.equal(await reason.isVisible(), false);
    assert.equal(await action.isVisible(), false);
    await mode.selectOption('changes');
    assert.equal(await reason.isVisible(), true);
    assert.equal(await reason.evaluate((el) => el.required), true);
    assert.equal(await action.isDisabled(), true, 'Stale submission blocks decisions');
    await page.locator('#refresh-submission').click();
    assert.equal(await action.isEnabled(), true);
    assert.equal(await reason.evaluate((el) => el.checkValidity()), false);
    await reason.fill('Clarify the distinction between conditions and loops.');
    await mode.selectOption('approve');
    assert.equal(await reason.isVisible(), false);
    assert.equal(await reason.isDisabled(), true);
    assert.equal(await action.textContent(), 'Approve publication');
    await action.click();
    assert.match(await page.locator('#review-feedback').textContent(), /No decision was saved/);
    await mode.selectOption('reject');
    assert.equal(await reason.isVisible(), true);
    assert.equal(
      await reason.inputValue(),
      'Clarify the distinction between conditions and loops.'
    );
    assert.equal(await action.textContent(), 'Reject submission');
    await mode.selectOption('review');
    assert.equal(await action.isVisible(), false);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false
    );
  }
  assert.doesNotMatch(suppressed, /62\.5|83\.3|5 of 8|3 ongoing/);
  const uncertain = await readFile(new URL('quiz-uncertain.html', root), 'utf8');
  assert.doesNotMatch(uncertain, /Retry saving|Submit quiz/);
  const result = await readFile(new URL('quiz-result.html', root), 'utf8');
  assert.match(result, /Quiz status: Passed/);
  assert.match(result, /60%/);
  assert.deepEqual(errors, []);
  console.log(
    'PASS: 9 previews × 4 widths; review selector and conditional reasons; stale-decision guard; laptop content fit; long-content overflow; aligned headers; stationary sidebar; short-window nav scroll; 200% text; labels; drawer focus/Escape; radio selection; retry preview; privacy and outcome fixtures.'
  );
} finally {
  await browser.close();
}
