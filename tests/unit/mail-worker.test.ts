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
