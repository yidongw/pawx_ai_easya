import { NextResponse } from 'next/server';

export const GET = async (request: Request) => {
  const botToken = process.env.BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: 'BOT_TOKEN not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const urlParam = searchParams.get('url');
  const appUrl = urlParam || process.env.TELEGRAM_WEBHOOK_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return NextResponse.json({ error: 'Missing webhook url' }, { status: 400 });
  }

  const webhookUrl = `${appUrl.replace(/\/$/, '')}/api/telegram/webhook`;
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
  const note = /localhost/.test(appUrl)
    ? 'Telegram requires a public HTTPS endpoint. Use ngrok/Cloudflare Tunnel and pass ?url=https://<public-domain>'
    : undefined;
  return NextResponse.json({ webhookUrl, data, note });
};
