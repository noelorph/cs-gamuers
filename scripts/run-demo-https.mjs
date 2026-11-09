import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { resolve } from 'node:path';

process.loadEnvFile('.env.local');

const origin = process.env.APP_ORIGIN;
const wifiAddress = networkInterfaces().en0?.find((address) => address.family === 'IPv4')?.address;
const caddy = resolve('.playwright-cli/tools/caddy');
const ca = resolve('.playwright-cli/caddy/data/caddy/pki/authorities/local/root.crt');

if (!wifiAddress || origin !== `https://${wifiAddress}`)
  throw Error(`Set APP_ORIGIN in .env.local to https://${wifiAddress || '<Wi-Fi address>'}.`);
if (!process.env.LOCAL_PROXY_SECRET || process.env.LOCAL_PROXY_SECRET.length < 32)
  throw Error('LOCAL_PROXY_SECRET must contain at least 32 characters.');
if (!existsSync(caddy) || !existsSync(ca))
  throw Error('The local Caddy binary and retained certificate authority are required.');
if (process.argv.includes('--check')) {
  console.log(`Ready for ${origin}; Caddy certificate authority retained.`);
  process.exit(0);
}

const build = spawnSync('npm', ['run', 'build'], { stdio: 'inherit' });
if (build.status !== 0) process.exit(build.status || 1);

const app = spawn(
  resolve('node_modules/.bin/next'),
  ['start', '--hostname', '127.0.0.1', '--port', '3100'],
  {
    stdio: 'inherit',
  }
);
const proxy = spawn(caddy, ['run', '--config', 'Caddyfile', '--adapter', 'caddyfile'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    XDG_DATA_HOME: resolve('.playwright-cli/caddy/data'),
    XDG_CONFIG_HOME: resolve('.playwright-cli/caddy/config'),
  },
});

let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  app.kill('SIGTERM');
  proxy.kill('SIGTERM');
  process.exitCode = code;
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
app.on('exit', (code) => stop(code || 1));
proxy.on('exit', (code) => stop(code || 1));
app.on('error', () => stop(1));
proxy.on('error', () => stop(1));
console.log(`Starting ${origin} (Next on 127.0.0.1:3100). Press Ctrl+C to stop.`);
