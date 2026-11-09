import { emitKeypressEvents } from 'node:readline';
export async function hiddenPassword(label) {
  if (!process.stdin.isTTY || !process.stdout.isTTY)
    throw Error('A local terminal is required for holder-entered passwords.');
  process.stdout.write(`${label}: `);
  emitKeypressEvents(process.stdin);
  const wasRaw = process.stdin.isRaw;
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise((resolve, reject) => {
    let value = '';
    const finish = (cancelled) => {
      process.stdin.removeListener('keypress', onKey);
      process.stdin.setRawMode(wasRaw);
      process.stdin.pause();
      process.stdout.write('\n');
      if (cancelled) reject(Error('Password entry cancelled.'));
      else resolve(value);
      value = '';
    };
    const onKey = (str, key) => {
      if (key?.ctrl && key.name === 'c') finish(true);
      else if (key?.name === 'return') finish(false);
      else if (key?.name === 'backspace') value = [...value].slice(0, -1).join('');
      else if (str && !key?.ctrl && !key?.meta) value += str;
    };
    process.stdin.on('keypress', onKey);
  });
}
