import { NextResponse } from 'next/server';

export const GET = async () => {
  const botToken = process.env.BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: 'BOT_TOKEN not configured' }, { status: 500 });
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`, {
    method: 'GET',
  });
  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to load bot info' }, { status: 500 });
  }

  const data = await response.json();
  const username = data?.result?.username;
  if (!username) {
    return NextResponse.json({ error: 'Missing bot username' }, { status: 500 });
  }

  return NextResponse.json({ username });
};
