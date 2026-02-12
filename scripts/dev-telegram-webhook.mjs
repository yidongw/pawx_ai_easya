import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const envPath = path.resolve(process.cwd(), '.env');

const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }
    const cleaned = trimmed.startsWith('export ') ? trimmed.slice(7) : trimmed;
    const index = cleaned.indexOf('=');
    if (index === -1) {
      return;
    }
    const key = cleaned.slice(0, index).trim();
    let value = cleaned.slice(index + 1).trim();
    if (!key) {
      return;
    }
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    value = value.replace(/\r/g, '');
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
};

loadEnvFile(envPath);
const env = process.env;

const updateEnvValue = (content, key, value) => {
  const line = `${key}="${value}"`;
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    return content.replace(regex, line);
  }
  const suffix = content.endsWith('\n') ? '' : '\n';
  return `${content}${suffix}${line}\n`;
};

const waitForNgrokUrl = async () => {
  for (let i = 0; i < 30; i += 1) {
    try {
      const response = await fetch('http://127.0.0.1:4040/api/tunnels');
      const data = await response.json();
      const httpsTunnel = data?.tunnels?.find((tunnel) => tunnel.public_url?.startsWith('https://'));
      if (httpsTunnel?.public_url) {
        return httpsTunnel.public_url;
      }
    } catch {
    }
    await delay(1000);
  }
  return null;
};

const startNgrok = () => new Promise((resolve) => {
  try {
    const proc = spawn('ngrok', ['http', '3000', '--log=stdout'], {
      stdio: 'ignore',
      detached: true,
    });
    proc.on('error', () => resolve(false));
    proc.unref();
    resolve(true);
  } catch {
    resolve(false);
  }
});

const botToken = env.BOT_TOKEN;
if (!botToken) {
  process.stdout.write('BOT_TOKEN not configured\n');
  process.exit(0);
}

let baseUrl = env.TELEGRAM_WEBHOOK_BASE_URL || env.NEXT_PUBLIC_APP_URL;
const shouldAutostart = env.NGROK_AUTOSTART !== 'false';

if (shouldAutostart) {
  const started = await startNgrok();
  if (!started) {
    if (!baseUrl) {
      process.stdout.write('ngrok not found. Install ngrok or set TELEGRAM_WEBHOOK_BASE_URL\n');
      process.exit(0);
    }
  } else {
    const ngrokUrl = await waitForNgrokUrl();
    if (ngrokUrl) {
      baseUrl = ngrokUrl;
    }
  }
}

if (!baseUrl) {
  process.stdout.write('Missing TELEGRAM_WEBHOOK_BASE_URL or NEXT_PUBLIC_APP_URL\n');
  process.exit(0);
}

const normalizedBase = baseUrl.replace(/\/$/, '');
const webhookUrl = `${normalizedBase}/api/telegram/webhook`;

const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: webhookUrl,
    allowed_updates: ['message'],
    drop_pending_updates: true,
  }),
});
const data = await response.json();

if (fs.existsSync(envPath)) {
  const current = fs.readFileSync(envPath, 'utf8');
  let updated = updateEnvValue(current, 'NEXT_PUBLIC_APP_URL', normalizedBase);
  updated = updateEnvValue(updated, 'TELEGRAM_WEBHOOK_BASE_URL', normalizedBase);
  fs.writeFileSync(envPath, updated, 'utf8');
}

process.stdout.write(`${JSON.stringify({ webhookUrl, data })}\n`);
