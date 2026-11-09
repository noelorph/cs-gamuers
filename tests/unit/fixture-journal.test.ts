// @vitest-environment node
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it, vi } from 'vitest';

const { interrupt } = vi.hoisted(() => ({ interrupt: { beforeRename: true } }));
vi.mock('node:fs/promises', async (importOriginal) => {
  const fs = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...fs,
    rename: async (...args: Parameters<typeof fs.rename>) => {
      if (interrupt.beforeRename) throw Error('Synthetic interruption before rename');
      return fs.rename(...args);
    },
  };
});
it('retains the exact-ID journal on interrupted replacement and atomically resumes with mode 0600', async () => {
  const modulePath = '../integration/helpers/fixture-journal.mjs';
  const { saveFixtureJournal } = await import(modulePath);
  const dir = await mkdtemp(join(tmpdir(), 'fixture-journal-'));
  const file = join(dir, 'run.json');
  const original = { accountIds: ['original-synthetic-id'] };
  const merged = { accountIds: [...original.accountIds, 'new-synthetic-id'] };
  try {
    await writeFile(file, JSON.stringify(original), { mode: 0o600 });
    await expect(saveFixtureJournal(file, merged)).rejects.toThrow('Synthetic interruption');
    expect(JSON.parse(await readFile(file, 'utf8'))).toEqual(original);
    for (const entry of await readdir(dir))
      expect((await stat(join(dir, entry))).mode & 0o777).toBe(0o600);
    interrupt.beforeRename = false;
    await saveFixtureJournal(file, merged);
    expect(JSON.parse(await readFile(file, 'utf8'))).toEqual(merged);
    expect((await stat(file)).mode & 0o777).toBe(0o600);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
