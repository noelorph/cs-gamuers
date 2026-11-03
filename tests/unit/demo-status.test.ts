// @vitest-environment node
import { expect, it } from 'vitest';

it('reports approval-notice delivery separately from consumed proof delivery', async () => {
  const modulePath = '../../scripts/demo-status.mjs';
  const { formatDemoStatus } = await import(modulePath);
  const account = { slot: 'faculty_1', email: 'synthetic@example.com' };
  for (const state of ['pending', 'failed', 'sent']) {
    const rows = [
      {
        slot: 'faculty_1',
        status: 'approved',
        active: true,
        identity_blocked: false,
        proof_complete: true,
        mail_state: 'discarded',
        approval_mail_state: state,
      },
    ];
    const output = formatDemoStatus(rows, [account]).join('\n');
    expect(output).toContain(`proof mail discarded; approval notice ${state}`);
    expect(output).not.toContain(account.email);
  }
});
