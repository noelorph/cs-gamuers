export function formatDemoStatus(rows, accounts) {
  const ready = rows.filter(
    (row) =>
      row.status === 'approved' &&
      row.active === true &&
      row.identity_blocked === false &&
      row.proof_complete
  ).length;
  return [
    `${ready}/7 accounts approved with completed proof; ${accounts.filter((a) => !a.email).length} email slot pending.`,
    ...accounts.map((account) => {
      const row = rows.find((r) => r.slot === account.slot);
      return `${account.slot}: ${row?.status ?? 'not prepared'}; proof mail ${row?.mail_state ?? 'not queued'}; approval notice ${row?.approval_mail_state ?? 'not queued'}`;
    }),
  ];
}
