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
it.each(['needs_correction', 'rejected', 'reopened'])(
  'delivers %s with the saved reason without repeating the decision',
  async (kind) => {
    const { deliverBatch } = await import('../../scripts/mail-worker.mjs');
    const sent: { text: string; subject: string }[] = [];
    const calls: string[] = [];
    const client = {
      rpc: async (name: string) => {
        calls.push(name);
        return {
          error: null,
          data:
            name === 'claim_mail_work'
              ? [
                  {
                    id: 'decision',
                    lease_id: 'claim',
                    recipient: 'fixture@example.invalid',
                    kind,
                    reason: 'Correct the enrollment name.\nKeep leading zeros.',
                  },
                ]
              : name === 'prepare_mail_work'
                ? true
                : null,
        };
      },
    };
    await deliverBatch(
      client,
      {
        sendMail: async (message: { text: string; subject: string }) => {
          sent.push(message);
          return { accepted: ['fixture@example.invalid'] };
        },
      },
      { origin: 'https://demo.example', from: 'sender@example.invalid' }
    );
    expect(sent[0].text).toContain('Correct the enrollment name.\nKeep leading zeros.');
    expect(sent[0].text).toContain('/auth/sign-in');
    expect(sent[0].subject).toContain('application');
    expect(calls).toEqual(['claim_mail_work', 'prepare_mail_work', 'finish_mail_work']);
  }
);
it('sends the old-address identity notice without calling it an application rejection', async () => {
  const { deliverBatch } = await import('../../scripts/mail-worker.mjs');
  let text = '';
  const client = {
    rpc: async (name: string) => ({
      error: null,
      data:
        name === 'claim_mail_work'
          ? [
              {
                id: 'identity',
                lease_id: 'lease',
                recipient: 'old@example.invalid',
                kind: 'identity_changed',
                reason: 'The email on your CS-GAMUERS application was changed.',
              },
            ]
          : name === 'prepare_mail_work'
            ? true
            : null,
    }),
  };
  await deliverBatch(
    client,
    {
      sendMail: async (message: { text: string }) => {
        text = message.text;
        return { accepted: ['old@example.invalid'] };
      },
    },
    { origin: 'https://demo.example', from: 'fixture@example.invalid' }
  );
  expect(text).toContain('email was changed');
  expect(text).not.toContain('was rejected');
});
