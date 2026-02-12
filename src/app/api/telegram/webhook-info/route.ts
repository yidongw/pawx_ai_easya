import { NextResponse } from 'next/server';

export const GET = async () => {
  const botToken = process.env.BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: 'BOT_TOKEN not configured' }, { status: 500 });
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`, {
    method: 'GET',
  });
  const data = await response.json();
  return NextResponse.json(data);
};
