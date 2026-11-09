import { writeFile, rename } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

export async function saveFixtureJournal(file, state) {
  const temporary = `${file}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(state), { mode: 0o600, flag: 'wx' });
  await rename(temporary, file);
}
