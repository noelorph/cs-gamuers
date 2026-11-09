import { setTimeout } from 'node:timers/promises';
import nodemailer from 'nodemailer';
import { operatorEnvironment, operatorClients, smtpEnvironment, rpc } from './operator-env.mjs';
import { deliverBatch } from './mail-worker.mjs';

async function main() {
  if (process.argv.includes('--help')) {
    console.log(
      'Usage: node scripts/maintenance.mjs [--test] [--once]\nClaims at most 10 messages per pass, repeats every 60 seconds, and catches up at startup.'
    );
    return;
  }
  const env = operatorEnvironment(process.argv.includes('--test'));
  const { admin } = operatorClients(env);
  await rpc(admin, 'assert_demo_project', { project_ref: env.ref });
  const mail = smtpEnvironment();
  const transport = nodemailer.createTransport(mail.options);
  const controller = new AbortController();
  const stop = () => controller.abort();
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  try {
    do {
      try {
        await rpc(admin, 'assert_demo_project', { project_ref: env.ref });
        await rpc(admin, 'reconcile_auth_mail');
        const count = await deliverBatch(admin, transport, { origin: env.origin, from: mail.from });
        console.log(
          `Maintenance pass: ${count} delivery records processed; provider acceptance is not inbox receipt.`
        );
      } catch {
        console.error('Maintenance pass failed; durable queued work remains for retry.');
      }
      if (process.argv.includes('--once')) break;
      await setTimeout(60000, undefined, { signal: controller.signal }).catch(() => {});
    } while (!controller.signal.aborted);
  } finally {
    transport.close();
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
  }
}
main().catch(() => {
  console.error('Maintenance could not start. Check the protected project and SMTP configuration.');
  process.exitCode = 1;
});
