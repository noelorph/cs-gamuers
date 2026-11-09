// eslint-disable-next-line @typescript-eslint/no-unused-expressions -- Playwright CLI executes this function expression.
async (page) => {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const errors = [];
  const failedRequests = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('requestfailed', (request) => failedRequests.push(request.url()));
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const ids = await page.locator('.screen').evaluateAll((nodes) => nodes.map((node) => node.id));
  const select = async (id) => {
    await page.locator('#screen-picker').selectOption(id);
    await page.locator(`#${id}`).waitFor({ state: 'visible' });
  };
  const fits = async (name) => {
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name}: horizontal overflow`);
  };
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const id of ids) {
      await select(id);
      await fits(`${id} at ${width}`);
      assert(await page.locator('.screen:visible h1').count() === 1, `${id}: expected one page heading`);
      assert(await page.locator('.screen:visible input, .screen:visible textarea, .screen:visible select').evaluateAll((inputs) => inputs.every((input) => input.labels?.length > 0)), `${id}: unlabeled field`);
    }
  }
  await page.setViewportSize({ width: 320, height: 800 });
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  for (const id of ids) { await select(id); await fits(`${id} at 200% text`); }
  await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
  await select('pending');
  const originalName = await page.locator('#pending dd').first().textContent();
  await page.locator('#pending dd').first().evaluate((node) => { node.textContent = 'Longname'.repeat(25); });
  await fits('200-character unbroken name');
  await page.locator('#pending dd').first().evaluate((node, text) => { node.textContent = text; }, originalName);

  await select('sign-in');
  await page.locator('.screen:visible').getByLabel('Email (required)', { exact: true }).fill('fixture@example.org');
  await page.locator('.screen:visible').getByLabel('Password (required)', { exact: true }).fill('fictional passphrase');
  const show = page.getByRole('button', { name: 'Show password' });
  await show.focus();
  await page.keyboard.press('Enter');
  assert(await page.locator('#sign-in-login-password').getAttribute('type') === 'text', 'Password reveal');
  assert(await page.getByRole('button', { name: 'Hide password' }).evaluate((node) => getComputedStyle(node).outlineStyle !== 'none'), 'Visible focus');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.locator('#pending').waitFor({ state: 'visible' });
  assert(await page.locator('#sign-in-login-password').inputValue() === '', 'Password cleared on fixture navigation');

  await select('confirm-email');
  assert(await page.locator('#confirm-email').isVisible(), 'GET must remain confirmation fixture');
  await page.getByRole('link', { name: 'Confirm email', exact: true }).click();
  await page.locator('#email-verified').waitFor({ state: 'visible' });
  await select('correction');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  assert((await page.locator('#correction [data-save-result]').textContent()).includes('still needs correction'), 'Save must not imply resubmission');

  await select('review');
  await page.locator('#review-role').selectOption('Faculty');
  assert(await page.locator('#review .applicant:visible').count() === 1, 'Role filter');
  await page.locator('#review-status').selectOption('Rejected');
  await page.getByRole('button', { name: 'Reset filters' }).click();
  assert(await page.locator('#review .applicant:visible').count() === 2, 'Reset filters');
  await page.locator('.screen:visible').getByLabel('Approve application', { exact: true }).check();
  await page.getByRole('button', { name: 'Review decision', exact: true }).click();
  assert(await page.locator('#review [data-review-error]').isVisible(), 'External verification gate');
  await page.locator('.screen:visible').getByLabel('I compared the name and student number with the enrollment list.').check();
  await page.getByRole('button', { name: 'Review decision', exact: true }).click();
  const dialog = page.locator('#decision-dialog');
  assert(await dialog.isVisible(), 'Decision dialog');
  assert(await page.getByRole('button', { name: 'Cancel', exact: true }).evaluate((node) => node === document.activeElement), 'Safe initial focus');
  await page.locator('#review-status').evaluate((node) => node.focus());
  assert(await page.locator('#review-status').evaluate((node) => node !== document.activeElement), 'Dialog background inert');
  await page.keyboard.press('Escape');
  assert(!await dialog.isVisible(), 'Escape closes dialog');
  assert(await page.getByRole('button', { name: 'Review decision', exact: true }).evaluate((node) => node === document.activeElement), 'Focus returns');
  await page.locator('.screen:visible').getByLabel('Request correction', { exact: true }).check();
  await page.locator('#review-reason').fill('Please check the name.');
  await page.locator('.screen:visible').getByLabel('Approve application', { exact: true }).check();
  await page.locator('.screen:visible').getByLabel('Request correction', { exact: true }).check();
  assert(await page.locator('#review-reason').inputValue() === 'Please check the name.', 'Reason retained between choices');
  await page.locator('#review-reason').fill('Reason '.repeat(285).slice(0, 1995));
  await page.getByRole('button', { name: 'Review decision', exact: true }).click();
  await fits('Long reason dialog');
  assert(await dialog.evaluate((node) => node.getBoundingClientRect().width <= innerWidth - 30), 'Dialog fits viewport');
  await page.keyboard.press('Escape');
  await page.locator('#review-reason').fill('Please enter the full name shown on the enrollment list.');
  await page.getByRole('button', { name: 'Review decision', exact: true }).click();
  await page.locator('#decision-confirm').click();
  await page.locator('#review-saved').waitFor({ state: 'visible' });
  assert((await page.locator('#saved-outcome').textContent()).includes('needs correction'), 'Correct saved decision label');

  await select('faculty-review');
  assert(await page.locator('#faculty-review [data-filter]').count() === 1, 'Faculty has no role filter');
  assert(!await page.locator('#faculty-review').getByRole('link', { name: 'Reopen a rejection' }).count(), 'Faculty has no reopen link');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  assert(await page.locator('#menu-dialog').isVisible(), 'Mobile menu');
  await page.keyboard.press('Escape');
  assert(await page.getByRole('button', { name: 'Menu', exact: true }).evaluate((node) => node === document.activeElement), 'Menu focus returns');

  await page.locator('.screen:visible').getByLabel('Reject application', { exact: true }).check();
  await page.locator('#faculty-review-reason').fill('We could not verify current enrollment.');
  await page.getByRole('button', { name: 'Review decision', exact: true }).click();
  await page.locator('#decision-confirm').click();
  assert(await page.locator('#saved-outcome').textContent() === 'Application rejected.', 'Rejection outcome');
  assert((await page.locator('#saved-outcome').getAttribute('class')).includes('error'), 'Rejection status color');
  assert(!await page.locator('#saved-delivery').isVisible(), 'Faculty cannot see delivery metadata');
  await select('reopen');
  await page.locator('#reopen input[type=checkbox]').check();
  await page.locator('#reopen-reason').fill('The enrollment record was checked and the rejection was an error.');
  await page.getByRole('button', { name: 'Review reopening', exact: true }).click();
  assert(await dialog.isVisible(), 'Reopening requires confirmation');
  assert((await page.locator('#decision-copy').textContent()).includes('does not approve or reactivate'), 'Reopening consequence');
  await page.locator('#decision-confirm').click();
  assert((await page.locator('#saved-outcome').textContent()).includes('Pending review'), 'Reopening returns Pending');

  const captures = [ ['sign-in',1440], ['admin-sign-in',1440], ['student-signup',320], ['faculty-signup',1440], ['correction',320], ['review',1440], ['review',320] ];
  for (const [id,width] of captures) {
    await page.setViewportSize({ width, height: 1000 });
    await select(id);
    await page.locator('.screen:visible h1').evaluate((node) => node.blur());
    await page.screenshot({ path: `docs/design/authentication/reference-${id}-${width}.png`, fullPage: true });
  }
  assert(await page.evaluate(() => document.fonts.check('16px Inter')), 'Inter loaded');
  assert(errors.length === 0, `Page errors: ${errors.join(', ')}`);
  assert(failedRequests.length === 0, `Failed requests: ${failedRequests.join(', ')}`);
  return { screens: ids.length, widths: [320,768,1024,1440], enlargedText: '200% at 320px', screenshots: captures.length, errors, failedRequests, browserVersion: page.context().browser()?.version(), userAgent: await page.evaluate(() => navigator.userAgent) };
}
