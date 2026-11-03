import { readFile, writeFile, rename } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { validateManifest, resumeManifest } from './demo-manifest.mjs';
import { formatDemoStatus } from './demo-status.mjs';
import { operatorEnvironment, operatorClients, rpc } from './operator-env.mjs';
import { hiddenPassword } from './hidden-password.mjs';
import { validateAccountInput } from '../src/features/accounts/validation.ts';

const usage =
  'Usage: node scripts/prepare-demo.mjs bootstrap|applications|invite-head|approve|status --manifest <ignored-local-file> [--test]';
async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log(usage);
    return;
  }
  const command = args[0];
  const file = args[args.indexOf('--manifest') + 1];
  if (
    !['bootstrap', 'applications', 'invite-head', 'approve', 'status'].includes(command) ||
    !args.includes('--manifest') ||
    !file
  )
    throw Error(usage);
  const manifestPath = resolve(file);
  try {
    execFileSync('git', ['check-ignore', '--quiet', manifestPath], { stdio: 'ignore' });
  } catch {
    throw Error('Manifest must be an ignored local file.');
  }
  const accounts = validateManifest(JSON.parse(await readFile(manifestPath, 'utf8')));
  const env = operatorEnvironment(args.includes('--test'));
  const statePath = `${manifestPath}.state.local.json`;
  let prior;
  try {
    prior = JSON.parse(await readFile(statePath, 'utf8'));
  } catch (e) {
    if (e.code !== 'ENOENT') throw Error('Cannot read setup state.');
  }
  const state = resumeManifest(prior, env.ref, accounts);
  await writeFile(`${statePath}.tmp`, JSON.stringify(state), { mode: 0o600 });
  await rename(`${statePath}.tmp`, statePath);
  const { admin, user } = operatorClients(env);
  const binding = { project_ref: env.ref, manifest_hash: state.manifestHash };
  const status = () => rpc(admin, 'demo_setup_status', binding);
  await status();
  if (command === 'status') {
    for (const line of formatDemoStatus(await status(), accounts)) console.log(line);
    return;
  }
  if (!env.hookReady)
    throw Error(
      'Confirm actual hosted hook/1800-second settings, then set AUTH_MAIL_HOOK_VERIFIED_PROJECT_REF to the verified project locally before preparation.'
    );
  const administrator = accounts.find((a) => a.slot === 'administrator');
  const invite = async (reservation) => {
    await status();
    let nativeType = 'invite';
    if (reservation.account_id) {
      const lookup = await admin.auth.admin.getUserById(reservation.account_id);
      if (lookup.error || lookup.data.user?.email !== reservation.email)
        throw Error('Reserved native identity unavailable.');
      if (lookup.data.user.email_confirmed_at) nativeType = 'recovery';
    }
    const generated = await admin.auth.admin.generateLink({
      type: nativeType,
      email: reservation.email,
      options: {
        data: { full_name: reservation.full_name },
        redirectTo: `${env.origin}/auth/email`,
      },
    });
    if (
      generated.error ||
      !generated.data.properties ||
      !generated.data.user ||
      (reservation.account_id && generated.data.user.id !== reservation.account_id)
    )
      throw Error('Native invitation unavailable; resume the same manifest.');
    await status();
    await rpc(admin, 'queue_generated_auth_email', {
      target_id: generated.data.user.id,
      recipient: reservation.email,
      native_type: nativeType,
      native_verifier: generated.data.properties.hashed_token,
    });
    console.log('Invitation queued; delivery and holder acceptance are pending.');
  };
  if (command === 'bootstrap') {
    const existing = (await status()).find((r) => r.slot === 'administrator');
    if (existing?.status === 'approved') {
      console.log('Administrator already accepted; no new bootstrap invitation.');
      return;
    }
    const reserved = await rpc(admin, 'bootstrap_demo_administrator', {
      ...binding,
      email: administrator.email,
      full_name: administrator.fullName,
    });
    await invite(reserved);
    return;
  }
  const password = await hiddenPassword('Approved Administrator password');
  const signed = await user.auth.signInWithPassword({ email: administrator.email, password });
  if (signed.error) throw Error('Administrator sign-in failed.');
  const actor = await rpc(user, 'current_actor');
  if (
    actor.length !== 1 ||
    actor[0].role !== 'administrator' ||
    actor[0].application_status !== 'approved'
  )
    throw Error('Approved Administrator password session required.');
  try {
    if (command === 'invite-head') {
      const account = accounts.find((a) => a.slot === 'program_head');
      const existing = (await status()).find((r) => r.slot === 'program_head');
      if (existing?.status === 'approved') {
        console.log('Program Head already accepted.');
        return;
      }
      const reserved = await rpc(user, 'reserve_staff_invitation', {
        ...binding,
        email: account.email,
        full_name: account.fullName,
      });
      await invite(reserved);
    } else if (command === 'applications') {
      for (const account of accounts.filter((a) => ['student', 'faculty'].includes(a.role))) {
        if (!account.email) {
          console.log(`${account.slot}: email pending; no account created.`);
          continue;
        }
        await status();
        const reserved = await rpc(user, 'reserve_demo_application', {
          ...binding,
          slot: account.slot,
          email: account.email,
          full_name: account.fullName,
          student_number: account.studentNumber,
          employee_number: account.employeeNumber,
        });
        const existing = (await status()).find((r) => r.slot === account.slot);
        if (existing?.proof_complete) {
          console.log(`${account.slot}: proof already complete.`);
          continue;
        }
        if (!reserved.account_id) {
          const holderPassword = await hiddenPassword(`${account.slot} holder password`);
          const validation = validateAccountInput({ ...account, password: holderPassword });
          if ('errors' in validation)
            throw Error(
              'Holder identity/password validation failed; nothing created for this slot.'
            );
          await status();
          const created = await admin.auth.admin.createUser({
            email: account.email,
            password: validation.data.password,
            email_confirm: false,
            app_metadata: { account_reservation_id: reserved.reservation_id },
            user_metadata: {
              full_name: account.fullName,
              role: account.role,
              ...(account.studentNumber && { student_number: account.studentNumber }),
            },
          });
          if (created.error)
            throw Error(
              'Account creation uncertain; resume the original manifest to resolve the reserved account.'
            );
        }
        await status();
        const resend = await user.auth.resend({
          type: 'signup',
          email: account.email,
          options: { emailRedirectTo: `${env.origin}/auth/email` },
        });
        if (resend.error) throw Error('Verification request unavailable; wait before resuming.');
        console.log(
          `${account.slot}: verification queued; actual delivery and holder proof pending.`
        );
      }
    } else {
      for (const row of await status())
        if (
          row.account_id &&
          ['student_1', 'student_2', 'student_3', 'faculty_1', 'faculty_2'].includes(row.slot)
        ) {
          if (!row.proof_complete) {
            console.log(`${row.slot}: awaiting holder proof.`);
            continue;
          }
          await status();
          await rpc(user, 'approve_demo_application', {
            project_ref: env.ref,
            target_id: row.account_id,
            reason:
              'Controlled demonstration fixture; no school enrollment or employment evidence asserted.',
          });
          console.log(`${row.slot}: fixture approval recorded.`);
        }
    }
  } finally {
    await user.auth.signOut();
  }
}
main().catch(() => {
  console.error(
    'Preparation stopped. Check the original manifest/project, hosted Auth settings, and account status before retrying.'
  );
  process.exitCode = 1;
});
