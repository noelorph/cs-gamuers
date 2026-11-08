import { expect, test } from '@playwright/test';
for (const width of [1280, 320])
  for (const role of ['student', 'faculty']) {
    test(`${role} application labels, validation, keyboard and long content at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(`/auth/sign-up/${role}`);
      await expect(
        page.getByRole('heading', {
          name: `Apply as ${role === 'student' ? 'a Student' : 'Faculty'}`,
        })
      ).toBeVisible();
      await expect(page.getByLabel('Full name (required)')).toHaveAttribute('autocomplete', 'name');
      await expect(
        page.getByLabel(role === 'student' ? 'School email (required)' : 'Email (required)')
      ).toHaveAttribute('autocomplete', 'email');
      await expect(page.getByLabel('Password (required)', { exact: true })).toHaveAttribute(
        'autocomplete',
        'new-password'
      );
      await expect(page.getByLabel(/age|role/i)).toHaveCount(0);
      await page.keyboard.press('Tab');
      await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
      await page.getByLabel('Full name (required)').fill('Synthetic '.repeat(20));
      if (role === 'student')
        await page.getByLabel('Student number (required)').fill('00' + 'A'.repeat(47));
      await page
        .getByLabel(role === 'student' ? 'School email (required)' : 'Email (required)')
        .fill('synthetic-' + 'x'.repeat(160) + '@example.invalid');
      await page.getByLabel('Password (required)', { exact: true }).fill('short');
      await page.getByRole('button', { name: 'Show password' }).focus();
      await page.keyboard.press('Space');
      await expect(page.getByRole('button', { name: 'Hide password' })).toBeFocused();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      await expect(page.getByRole('main').getByRole('alert')).toBeFocused();
      await expect(page.getByRole('main').getByRole('alert')).toHaveCSS('outline-style', 'solid');
      await expect(page.getByRole('main').getByRole('alert').getByRole('link')).not.toHaveCount(0);
      await expect(page.getByLabel('Full name (required)')).toHaveValue('Synthetic '.repeat(20));
      await expect(page.getByLabel('Password (required)', { exact: true })).toHaveValue('');
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
        false
      );
    });
  }
test('direct verification request stays generic and validates email', async ({ page }) => {
  await page.goto('/auth/verify-email');
  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
  await page.getByRole('button', { name: 'Request a new link' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toBeFocused();
  await expect(page.getByRole('main').getByRole('alert')).toHaveCSS('outline-style', 'solid');
  await expect(page.getByLabel('Email (required)')).toHaveAttribute('aria-invalid', 'true');
});

test.describe('isolated protected email lifecycle', () => {
  test.skip(
    process.env.E2E_AUTH_PROJECT_REF !== 'ggiccvcrkydcimveyrfi',
    'Exact isolated TEST target required'
  );
  let fixtures: typeof import('../integration/helpers/fixtures');
  test.beforeAll(async () => {
    fixtures = await import('../integration/helpers/fixtures');
  });
  test.afterAll(async () => {
    if (fixtures) await fixtures.cleanFixtures();
  });
  async function inspect(id: string, action = 'inspect') {
    const result = await fixtures.admin.rpc('test_email_fixture', {
      action,
      run_id: fixtures.runId,
      args: { project_ref: fixtures.testProjectRef, account_id: id },
    });
    if (result.error) throw Error('Synthetic email fixture unavailable');
    return result.data;
  }
  async function generatedProof(role = 'program_head') {
    const f = await fixtures.reserveFixture(role);
    const generated = await fixtures.admin.auth.admin.generateLink({
      type: 'invite',
      email: f.email,
    });
    if (generated.error) throw Error('Synthetic native invitation unavailable');
    const id = generated.data.user.id;
    const queued = await fixtures.admin.rpc('queue_generated_auth_email', {
      target_id: id,
      recipient: f.email,
      native_type: 'invite',
      native_verifier: generated.data.properties.hashed_token,
    });
    if (queued.error) throw Error('Synthetic proof queue unavailable');
    return { ...f, id, proof: await inspect(id) };
  }
  for (const role of ['program_head', 'administrator'])
    test(`${role} invitation completes with optional employee number and correct password login`, async ({
      page,
    }) => {
      const f = await generatedProof(role);
      await page.goto('/auth/email?challenge=' + f.proof.challenge);
      expect((await inspect(f.id)).state).toBe('pending');
      await page.getByRole('button', { name: 'Confirm email' }).click();
      await expect(page.getByRole('heading', { name: 'Accept your invitation' })).toBeFocused();
      await expect(page.getByRole('main').getByText(f.email, { exact: true })).toBeVisible();
      await expect(page).toHaveURL(/\/auth\/email$/);
      if (role === 'program_head') {
        await page.setViewportSize({ width: 320, height: 800 });
        await page.screenshot({ path: '.playwright-cli/task3-invitation-320.png', fullPage: true });
      }
      await page.goto(role === 'administrator' ? '/admin' : '/program-head');
      await expect(page).toHaveURL(/sign-in/);
      await page.goBack();
      await expect(page).toHaveURL(/\/auth\/email$/);
      await expect(
        page.getByRole('heading', { name: 'Confirm your email', exact: true })
      ).toBeVisible();
      // A consumed address bar intentionally cannot carry the proof across navigation.
      await page.goto('/auth/email?challenge=' + f.proof.challenge);
      await page.getByRole('button', { name: 'Confirm email' }).click();
      await page.getByLabel('Full name (required)').fill('Synthetic invited holder');
      await page.getByLabel('New password (required)').fill(fixtures.fixturePassword);
      await page.getByLabel('Employee number (optional)').fill('001-STAFF');
      await page.getByRole('button', { name: 'Accept invitation' }).click();
      await expect(page.getByRole('heading', { name: 'Invitation accepted' })).toBeFocused();
      expect((await inspect(f.id)).employee_number).toBe('001-STAFF');
      await page
        .getByRole('main')
        .getByRole('link', {
          name: role === 'administrator' ? 'Administrator sign in' : 'Sign in',
          exact: true,
        })
        .click();
      await expect(page).toHaveURL(
        role === 'administrator' ? /\/admin\/sign-in$/ : /\/auth\/sign-in$/
      );
      await page.getByLabel('Email (required)').fill(f.email);
      await page.getByLabel('Password (required)', { exact: true }).fill(fixtures.fixturePassword);
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await expect(page).toHaveURL(role === 'administrator' ? /\/admin$/ : /\/program-head$/);
    });
  test('expired and superseded proofs show recovery guidance without granting a session', async ({
    page,
  }) => {
    const f = await generatedProof();
    expect(f.proof.lifetime_seconds).toBe(1800);
    await inspect(f.id, 'expire');
    await page.goto('/auth/email?challenge=' + f.proof.challenge);
    await page.getByRole('button', { name: 'Confirm email' }).click();
    await expect(page.getByRole('main').getByRole('alert')).toContainText(
      'expired or been replaced'
    );
    await expect(
      page.getByRole('main').getByRole('link', { name: 'Request a new verification link' })
    ).toBeVisible();
    await inspect(f.id, 'age_latest');
    const generated = await fixtures.admin.auth.admin.generateLink({
      type: 'invite',
      email: f.email,
    });
    if (generated.error) throw Error('Synthetic reissue unavailable');
    const queued = await fixtures.admin.rpc('queue_generated_auth_email', {
      target_id: f.id,
      recipient: f.email,
      native_type: 'invite',
      native_verifier: generated.data.properties.hashed_token,
    });
    expect(queued.error).toBeNull();
    await page.reload();
    await page.getByRole('button', { name: 'Confirm email' }).click();
    await expect(page.getByRole('main').getByRole('alert')).toContainText(
      'expired or been replaced'
    );
  });
  for (const role of ['student', 'faculty'])
    test(`native ${role} browser signup queues then confirms into pending application access`, async ({
      page,
    }) => {
      test.skip(
        process.env.TEST_NATIVE_REGISTRATION_MAIL !== '1',
        'Explicit native-mail acceptance run preserves shared provider quota'
      );
      const { randomUUID } = await import('node:crypto');
      const { mkdir } = await import('node:fs/promises');
      const { saveFixtureJournal } = await import('../integration/helpers/fixture-journal.mjs');
      await mkdir('tests/integration/.artifacts', { recursive: true });
      await saveFixtureJournal(`tests/integration/.artifacts/${fixtures.runId}.json`, {
        projectRef: fixtures.testProjectRef,
        runId: fixtures.runId,
        accountIds: [],
      });
      const email = `fixture-${fixtures.runId}-${randomUUID().slice(0, 8)}@${role === 'student' ? 'caloocan.sti.edu.ph' : 'example.org'}`;
      try {
        await page.goto(`/auth/sign-up/${role}`);
        await page.getByLabel('Full name (required)').fill('Synthetic browser applicant');
        if (role === 'student')
          await page.getByLabel('Student number (required)').fill('000' + randomUUID());
        await page
          .getByLabel(role === 'student' ? 'School email (required)' : 'Email (required)')
          .fill(email);
        await page
          .getByLabel('Password (required)', { exact: true })
          .fill(fixtures.fixturePassword);
        await page.getByRole('button', { name: 'Submit application' }).click();
        await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible({
          timeout: 20000,
        });
        await expect(page.getByRole('status')).toContainText('Verification email queued');
        const saved = await fixtures.harness('adopt_registration', { email });
        const p = await inspect(saved.account_id);
        expect(p.lifetime_seconds).toBe(1800);
        await page.goto('/auth/email?challenge=' + p.challenge);
        expect((await inspect(saved.account_id)).state).toBe('pending');
        await page.getByRole('button', { name: 'Confirm email' }).click();
        await expect(page.getByRole('main').getByRole('status')).toContainText(
          'still needs approval'
        );
        await expect(page).toHaveURL(/\/auth\/email$/);
        await page.goto(role === 'student' ? '/student' : '/faculty');
        await expect(page).toHaveURL(/\/auth\/sign-in$/);
        await page.getByLabel('Email (required)').fill(email);
        await page
          .getByLabel('Password (required)', { exact: true })
          .fill(fixtures.fixturePassword);
        await page.getByRole('button', { name: 'Sign in', exact: true }).click();
        await expect(page).toHaveURL(/\/auth\/status$/);
        await expect(page.getByRole('main')).toContainText('Pending');
      } finally {
        await fixtures.harness('adopt_registration', { email });
      }
    });
});
test('interrupted application retains nonsecret input, clears password and focuses retry guidance', async ({
  page,
}) => {
  await page.goto('/auth/sign-up/student');
  await page.getByRole('button', { name: 'Show password' }).click();
  await expect(page.getByRole('button', { name: 'Hide password' })).toBeVisible();
  await page.route('**/auth/sign-up/student', (route) =>
    route.request().method() === 'POST' ? route.abort() : route.continue()
  );
  await page.getByLabel('Full name (required)').fill('Synthetic interrupted applicant');
  await page.getByLabel('Student number (required)').fill('0001-INTERRUPTED');
  await page.getByLabel('School email (required)').fill('synthetic@caloocan.sti.edu.ph');
  await page.getByLabel('Password (required)', { exact: true }).fill('Synthetic passphrase');
  await page.getByRole('button', { name: 'Submit application' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('confirm the result');
  await expect(page.getByRole('main').getByRole('alert')).toBeFocused();
  await expect(page.getByLabel('Student number (required)')).toHaveValue('0001-INTERRUPTED');
  await expect(page.getByLabel('Password (required)', { exact: true })).toHaveValue('');
});
test('interrupted resend provides persistent generic recovery guidance', async ({ page }) => {
  await page.goto('/auth/verify-email');
  await page.route('**/auth/verify-email', (route) =>
    route.request().method() === 'POST' ? route.abort() : route.continue()
  );
  await page.getByLabel('Email (required)').fill('synthetic@example.invalid');
  await page.getByRole('button', { name: 'Request a new link' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('could not request');
  await expect(page.getByRole('main').getByRole('alert')).toBeFocused();
  await expect(page.getByLabel('Email (required)')).toHaveValue('synthetic@example.invalid');
  await expect(page.getByRole('button', { name: 'Request a new link' })).toBeEnabled();
});
