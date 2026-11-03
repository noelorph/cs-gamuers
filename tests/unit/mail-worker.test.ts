// @vitest-environment node
import { expect, it } from 'vitest';
it('uses stable Message-ID, opaque application URLs and reports delivery failure only', async () => {
  const path = '../../scripts/mail-worker.mjs';
  const worker = await import(path).catch(() => null);
  expect(worker?.deliverBatch).toBeTypeOf('function');
  if (!worker) return;
  const calls: { name: string; args: unknown }[] = [];
  const sent: Record<string, string>[] = [];
  const client = {
    rpc: async (name: string, args: unknown) => {
      calls.push({ name, args });
      return {
        data:
          name === 'claim_mail_work'
            ? [
                {
                  id: 'one',
                  lease_id: 'lease',
                  recipient: 'fixture@example.com',
                  kind: 'verification',
                  challenge: 'a'.repeat(64),
                  expires_at: new Date(Date.now() + 60000).toISOString(),
                },
              ]
            : name === 'prepare_mail_work'
              ? true
              : null,
        error: null,
      };
    },
  };
  const transport = {
    sendMail: async (message: Record<string, string>) => {
      sent.push(message);
      throw Error('private provider response');
    },
  };
  await worker.deliverBatch(client, transport, {
    origin: 'https://demo.example',
    from: 'sender@example.com',
  });
  expect(sent[0].text).toContain('/auth/email?challenge=');
  expect(sent[0].messageId).toBe('<one@cs-gamuers.local>');
  expect(calls.at(-1)).toEqual({
    name: 'finish_mail_work',
    args: { work_id: 'one', claim_id: 'lease', delivered: false },
  });
  expect(calls.map((c) => c.name)).not.toContain('approve_demo_application');
});
it('revalidates each waiting job after another send and skips superseded work', async () => {
  const { deliverBatch } = await import('../../scripts/mail-worker.mjs');
  let releaseFirst: () => void = () => {};
  let firstStarted: () => void = () => {};
  const started = new Promise<void>((resolve) => {
    firstStarted = resolve;
  });
  const waiting = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });
  let secondCurrent = true;
  const sent: string[] = [];
  const validated: string[] = [];
  const client = {
    rpc: async (name: string, args: { work_id: string }) => ({
      error: null,
      data:
        name === 'claim_mail_work'
          ? ['first', 'second'].map((id) => ({
              id,
              lease_id: id,
              recipient: `${id}@example.com`,
              kind: 'approved',
            }))
          : name === 'prepare_mail_work'
            ? (validated.push(args.work_id), args.work_id === 'first' || secondCurrent)
            : null,
    }),
  };
  const transport = {
    sendMail: async (message: { to: string }) => {
      sent.push(message.to);
      if (message.to === 'first@example.com') {
        firstStarted();
        await waiting;
      }
      return { accepted: [message.to] };
    },
  };
  const work = deliverBatch(client, transport, {
    origin: 'https://demo.example',
    from: 'sender@example.com',
  });
  await started;
  secondCurrent = false;
  releaseFirst();
  await work;
  expect(sent).toEqual(['first@example.com']);
  expect(validated).toEqual(['first', 'second']);
});
