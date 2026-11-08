// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { assertNativeMailTestReady } from './helpers/mail-safety';
import { afterAll, describe, expect, it } from 'vitest';
import {
  actor,
  admin,
  anonymous,
  createFixture,
  cleanFixtures,
  fixturePassword,
  harness,
  reserveFixture,
  runId,
  signIn,
  testProjectRef,
} from './helpers/fixtures';

afterAll(cleanFixtures, 30000);

const projection = 'id,role,application_status,active';

describe('hosted account boundaries', () => {
  it('refuses harness calls from anonymous clients, incorrect markers, and unknown runs', async () => {
    expect(await harness('security')).toEqual({
      client_bridge_access: false,
      guard_can_write_auth: false,
      guard_login_or_bypass: false,
      client_guard_membership: false,
    });
    expect(
      Boolean(
        (
          await anonymous().rpc('test_account_fixture', {
            action: 'cleanup',
            run_id: runId,
            args: { project_ref: testProjectRef },
          })
        ).error
      )
    ).toBe(true);
    await expect(harness('reserve', { project_ref: 'different-project' })).rejects.toThrow(
      'Fixture'
    );
    const fixture = await createFixture();
    const { client } = await signIn(fixture);
    expect(
      Boolean(
        (
          await client.rpc('test_account_fixture', {
            action: 'state',
            run_id: runId,
            args: { project_ref: testProjectRef, account_id: fixture.id, status: 'approved' },
          })
        ).error
      )
    ).toBe(true);
    expect(
      Boolean(
        (
          await admin.rpc('test_account_fixture', {
            action: 'state',
            run_id: randomUUID(),
            args: { project_ref: testProjectRef, account_id: fixture.id, status: 'approved' },
          })
        ).error
      )
    ).toBe(true);
  });

  it('rejects wrong-domain reservations and unreserved native elevated creation', async () => {
    await expect(reserveFixture('student', 'example.com')).rejects.toThrow(
      'Fixture reserve failed'
    );
    const result = await admin.auth.admin.createUser({
      email: `fixture-${randomUUID()}@example.com`,
      password: fixturePassword,
      user_metadata: { role: 'administrator', full_name: 'Synthetic integration fixture' },
    });
    expect(Boolean(result.error)).toBe(true);
  });

  it('rejects public signup even with a valid reservation ID in editable metadata', async () => {
    assertNativeMailTestReady();
    const reservation = await reserveFixture();
    const result = await anonymous().auth.signUp({
      email: reservation.email,
      password: fixturePassword,
      options: {
        data: {
          account_reservation_id: reservation.reservationId,
          role: 'student',
          full_name: 'Synthetic integration fixture',
          student_number: reservation.studentNumber,
        },
      },
    });
    expect(Boolean(result.error)).toBe(true);
    // Admin creation avoids public email throttling and proves editable metadata cannot authorize creation.
    const native = await admin.auth.admin.createUser({
      email: reservation.email,
      password: fixturePassword,
      user_metadata: { account_reservation_id: reservation.reservationId, role: 'student' },
    });
    expect(native.error?.status).toBe(500);
  });

  it('rejects reservation identity mismatch and replay for a different address', async () => {
    const reservation = await reserveFixture();
    const mismatch = await admin.auth.admin.createUser({
      email: reservation.email,
      password: fixturePassword,
      app_metadata: { account_reservation_id: reservation.reservationId },
      user_metadata: { role: 'administrator' },
    });
    expect(Boolean(mismatch.error)).toBe(true);
    const fixture = await createFixture();
    const replay = await admin.auth.admin.createUser({
      email: reservation.email,
      password: fixturePassword,
      app_metadata: { account_reservation_id: fixture.reservationId },
    });
    expect(Boolean(replay.error)).toBe(true);
  });

  it.each(['pending', 'needs_correction', 'rejected', 'approved'])(
    'reserves normalized email and Student number across %s accounts',
    async (status) => {
      const fixture = await createFixture();
      await harness('state', { account_id: fixture.id, status, active: status !== 'approved' });
      await expect(
        harness('reserve', {
          email: fixture.email.toUpperCase(),
          role: 'student',
          student_number: randomUUID(),
        })
      ).rejects.toThrow();
      await expect(
        reserveFixture('student', 'caloocan.sti.edu.ph', fixture.studentNumber)
      ).rejects.toThrow();
    }
  );

  it.each(['student', 'faculty', 'program_head', 'administrator'])(
    'returns only live canonical %s metadata and prevents direct mutations',
    async (role) => {
      const fixture = await createFixture(role);
      const { client } = await signIn(fixture);
      expect(await actor(client)).toEqual([
        { id: fixture.id, role, application_status: 'pending', active: true },
      ]);
      expect((await client.from('accounts').select(projection)).data).toEqual([]);
      for (const change of [
        { role: 'administrator' },
        { application_status: 'approved' },
        { active: false },
        { full_name: 'Changed' },
      ]) {
        expect(
          Boolean((await client.from('accounts').update(change).eq('id', fixture.id)).error)
        ).toBe(true);
      }
      await harness('state', { account_id: fixture.id, status: 'approved' });
      expect((await client.from('accounts').select(projection)).data).toEqual([
        { id: fixture.id, role, application_status: 'approved', active: true },
      ]);
      expect(Boolean((await client.from('accounts').select('email')).error)).toBe(true);
    }
  );

  it('ignores forged user metadata and denies anonymous data access', async () => {
    const fixture = await createFixture();
    const { client } = await signIn(fixture);
    const update = await client.auth.updateUser({
      data: { role: 'administrator', application_status: 'approved', active: true },
    });
    expect(Boolean(update.error)).toBe(false);
    expect(await actor(client)).toEqual([
      { id: fixture.id, role: 'student', application_status: 'pending', active: true },
    ]);
    expect(Boolean((await anonymous().rpc('current_actor')).error)).toBe(true);
    expect(Boolean((await anonymous().from('accounts').select(projection)).error)).toBe(true);
  });

  it('denies deactivated accounts and deleted sessions with an otherwise valid signed token', async () => {
    const fixture = await createFixture();
    const { client } = await signIn(fixture);
    await harness('state', { account_id: fixture.id, status: 'approved', active: false });
    expect(await actor(client)).toEqual([]);
    await harness('state', { account_id: fixture.id, active: true });
    expect(await actor(client)).toEqual([]);
    const fresh = await signIn(fixture);
    expect((await actor(fresh.client)).length).toBe(1);
    await harness('remove_session', { account_id: fixture.id, session_id: fresh.sessionId });
    expect(await actor(fresh.client)).toEqual([]);
  });

  it('keeps cutoff revocation effective after refresh and permits a fresh password session', async () => {
    const fixture = await createFixture();
    await harness('state', { account_id: fixture.id, status: 'approved' });
    const { client, sessionId } = await signIn(fixture);
    await harness('cutoff', { account_id: fixture.id });
    expect(await actor(client)).toEqual([]);
    const refreshed = await client.auth.refreshSession();
    expect(Boolean(refreshed.error)).toBe(false);
    const claims = JSON.parse(
      Buffer.from(refreshed.data.session!.access_token.split('.')[1], 'base64url').toString()
    );
    expect(claims.session_id === sessionId).toBe(true);
    expect(await actor(client)).toEqual([]);
    expect((await actor((await signIn(fixture)).client)).length).toBe(1);
  });

  it.each(['magiclink', 'recovery'] as const)('denies native signed %s sessions', async (type) => {
    const fixture = await createFixture();
    await harness('state', { account_id: fixture.id, status: 'approved' });
    const link = await admin.auth.admin.generateLink({ type, email: fixture.email });
    expect(Boolean(link.error)).toBe(false);
    const client = anonymous();
    const verified = await client.auth.verifyOtp({
      token_hash: link.data.properties!.hashed_token,
      type,
    });
    expect(Boolean(verified.error)).toBe(false);
    expect(Boolean(verified.data.session)).toBe(true);
    expect(await actor(client)).toEqual([]);
  });

  it('creates a native invitation from the active reservation when released invitation history shares its email', async () => {
    const original = await createFixture('administrator');
    const replacementEmail = `fixture-${runId.slice(0, 8)}-${randomUUID().slice(0, 8)}@caloocan.sti.edu.ph`;
    const operation = await harness('identity_operation', {
      account_id: original.id,
      email: replacementEmail,
    });
    const replacement = await admin.auth.admin.updateUserById(original.id, {
      email: replacementEmail,
      app_metadata: { identity_operation_id: operation.operation_id },
    });
    expect(Boolean(replacement.error)).toBe(false);
    await harness('reserve', { email: original.email, role: 'program_head' });
    const invitation = await admin.auth.admin.generateLink({
      type: 'invite',
      email: original.email,
      options: { data: { full_name: 'Synthetic integration fixture' } },
    });
    expect(Boolean(invitation.error)).toBe(false);
    expect(invitation.data.user!.id === original.id).toBe(false);
    const account = await harness('inspect', { account_id: invitation.data.user!.id });
    expect(account.role).toBe('program_head');
    expect(account.status).toBe('pending');
  });

  it('supports reserved native invitation creation without granting application access', async () => {
    const reservation = await reserveFixture('administrator');
    const link = await admin.auth.admin.generateLink({
      type: 'invite',
      email: reservation.email,
      options: { data: { full_name: 'Synthetic integration fixture' } },
    });
    expect(Boolean(link.error)).toBe(false);
    const operation = await harness('operation', {
      account_id: link.data.user!.id,
      purpose: 'invitation_password',
    });
    expect(
      Boolean(
        (
          await admin.auth.admin.updateUserById(link.data.user!.id, {
            app_metadata: { password_operation_id: operation.operation_id },
          })
        ).error
      )
    ).toBe(false);
    const client = anonymous();
    const verified = await client.auth.verifyOtp({
      token_hash: link.data.properties!.hashed_token,
      type: 'invite',
    });
    expect(Boolean(verified.error)).toBe(false);
    expect(await actor(client)).toEqual([]);
    expect(
      (
        await harness('inspect', {
          account_id: link.data.user!.id,
          operation_id: operation.operation_id,
        })
      ).operation_state
    ).toBe('auth_applied');
  });

  it('denies native recovery sessions for initially unconfirmed accounts', async () => {
    const fixture = await createFixture('student', false);
    expect(
      Boolean((await admin.auth.admin.getUserById(fixture.id)).data.user?.email_confirmed_at)
    ).toBe(false);
    const link = await admin.auth.admin.generateLink({ type: 'recovery', email: fixture.email });
    expect(Boolean(link.error)).toBe(false);
    expect(
      Boolean((await admin.auth.admin.getUserById(fixture.id)).data.user?.email_confirmed_at)
    ).toBe(false);
    const client = anonymous();
    const result = await client.auth.verifyOtp({
      token_hash: link.data.properties!.hashed_token,
      type: 'recovery',
    });
    expect(
      Boolean(result.error),
      `Native recovery verification failed (${result.error?.code ?? 'no-code'}:${result.error?.status ?? 'no-status'})`
    ).toBe(false);
    expect(await actor(client)).toEqual([]);
  });

  it('rejects direct native password/email writes and accepts only the exact current verified password operation', async () => {
    const fixture = await createFixture();
    const { client } = await signIn(fixture);
    expect(
      Boolean((await client.auth.updateUser({ password: 'Unmarked replacement password' })).error)
    ).toBe(true);
    expect(
      Boolean(
        (
          await admin.auth.admin.updateUserById(fixture.id, {
            password: 'Unmarked replacement password',
          })
        ).error
      )
    ).toBe(true);
    expect(
      Boolean(
        (
          await admin.auth.admin.updateUserById(fixture.id, {
            email: `fixture-${randomUUID()}@caloocan.sti.edu.ph`,
          })
        ).error
      )
    ).toBe(true);
    const operation = await harness('operation', { account_id: fixture.id });
    const applied = await admin.auth.admin.updateUserById(fixture.id, {
      password: 'Authorized replacement password',
      app_metadata: { password_operation_id: operation.operation_id },
    });
    expect(Boolean(applied.error)).toBe(false);
    expect(
      (await harness('inspect', { account_id: fixture.id, operation_id: operation.operation_id }))
        .operation_state
    ).toBe('auth_applied');
    expect(await actor(client)).toEqual([]);
    expect(
      Boolean(
        (
          await admin.auth.admin.updateUserById(fixture.id, {
            password: 'Replayed replacement password',
            app_metadata: { password_operation_id: operation.operation_id },
          })
        ).error
      )
    ).toBe(true);
    expect(
      (await actor((await signIn(fixture, 'Authorized replacement password')).client)).length
    ).toBe(1);
  });

  it('fences cancelled and superseded password operations', async () => {
    const fixture = await createFixture();
    const cancelled = await harness('operation', { account_id: fixture.id });
    await harness('cancel_operation', {
      account_id: fixture.id,
      operation_id: cancelled.operation_id,
    });
    const superseded = await harness('operation', { account_id: fixture.id });
    await harness('operation', { account_id: fixture.id });
    for (const operation of [cancelled, superseded]) {
      expect(
        Boolean(
          (
            await admin.auth.admin.updateUserById(fixture.id, {
              password: 'Late replacement password',
              app_metadata: { password_operation_id: operation.operation_id },
            })
          ).error
        )
      ).toBe(true);
    }
    expect((await actor((await signIn(fixture)).client)).length).toBe(1);
  });

  it('rejects expired, unverified, and wrong-target operation markers', async () => {
    const fixture = await createFixture();
    const other = await createFixture();
    for (const args of [{ expired: true }, { verified: false }, { account_id: other.id }]) {
      const operation = await harness('operation', { account_id: fixture.id, ...args });
      expect(
        Boolean(
          (
            await admin.auth.admin.updateUserById(fixture.id, {
              password: 'Invalid operation password',
              app_metadata: { password_operation_id: operation.operation_id },
            })
          ).error
        )
      ).toBe(true);
    }
  });

  it.each(['student', 'faculty'])(
    'fences a verified %s email replacement and blocks access until completion',
    async (role) => {
      const fixture = await createFixture(role);
      const { client } = await signIn(fixture);
      const email = `fixture-${runId.slice(0, 8)}-${randomUUID().slice(0, 8)}@caloocan.sti.edu.ph`;
      const operation = await harness('identity_operation', { account_id: fixture.id, email });
      expect(await actor(client)).toEqual([]);
      expect(
        Boolean(
          (
            await admin.auth.admin.updateUserById(fixture.id, {
              email,
              app_metadata: { identity_operation_id: operation.operation_id },
            })
          ).error
        )
      ).toBe(false);
      const state = await harness('inspect', {
        account_id: fixture.id,
        operation_id: operation.operation_id,
      });
      expect(state.email === email).toBe(true);
      expect(state.operation_state).toBe('auth_applied');
      expect(state.status).toBe('pending');
      expect(state.role).toBe(role);
      expect(await actor(client)).toEqual([]);
    }
  );

  it('exercises native sign-in of a supported imported legacy hash without exempting writes', async () => {
    // Synthetic vector from macOS htpasswd -bnBC 4; never an application hashing path.
    const hash = '$2y$04$SKWat.2x7cY.1xAa0YU8zuZTZpqX55FBZV4C.QY30qVBFE4g6K5Cu';
    const fixture = await createFixture('student', true, hash);
    expect(
      (await actor((await signIn(fixture, 'Synthetic maintenance password')).client)).length
    ).toBe(1);
  });
});
