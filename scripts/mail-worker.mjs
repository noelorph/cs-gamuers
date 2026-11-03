import { rpc } from './operator-env.mjs';

export async function deliverBatch(client, transport, { origin, from }) {
  const jobs = await rpc(client, 'claim_mail_work', { batch_size: 10 });
  for (const job of jobs) {
    const current = await rpc(client, 'prepare_mail_work', {
      work_id: job.id,
      claim_id: job.lease_id,
    });
    if (!current) continue;
    let delivered = false;
    if (job.challenge && Date.parse(job.expires_at) <= Date.now()) {
      await rpc(client, 'reconcile_auth_mail');
      continue;
    }
    const url = job.challenge
      ? `${origin}/auth/email?challenge=${encodeURIComponent(job.challenge)}`
      : null;
    try {
      const result = await transport.sendMail({
        from,
        to: job.recipient,
        messageId: `<${job.id}@cs-gamuers.local>`,
        subject:
          job.kind === 'approved' ? 'CS-GAMUERS account ready' : 'Confirm your CS-GAMUERS email',
        text: url
          ? `Confirm your email using this link on the demonstration network:\n\n${url}\n\nThis link expires 30 minutes after issue. Opening it does not accept it. If you did not expect this email, ignore it.`
          : 'Your demonstration account decision has been saved. Sign in with your own password on the demonstration network.',
        disableFileAccess: true,
        disableUrlAccess: true,
      });
      delivered = Array.isArray(result.accepted) && result.accepted.includes(job.recipient);
    } catch {
      /* Delivery retries are recorded independently of account decisions. */
    }
    await rpc(client, 'finish_mail_work', { work_id: job.id, claim_id: job.lease_id, delivered });
  }
  return jobs.length;
}
