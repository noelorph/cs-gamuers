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
        subject: url ? 'Confirm your CS-GAMUERS email' : 'CS-GAMUERS application update',
        text: url
          ? `Confirm your email using this link on the demonstration network:\n\n${url}\n\nThis link expires 30 minutes after issue. Opening it does not accept it. If you did not expect this email, ignore it.`
          : job.kind === 'identity_changed'
            ? `Your application email was changed.\n\n${job.reason}\n\nIf you did not request this, contact an Administrator.`
            : `Your application ${job.kind === 'approved' ? 'was approved' : job.kind === 'needs_correction' ? 'needs correction' : job.kind === 'reopened' ? 'was reopened for review' : 'was rejected'}.\n\n${job.reason ?? ''}\n\nView the current status: ${origin}/auth/sign-in\n\nSign in with your own CS-GAMUERS password on the demonstration network.`,
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
