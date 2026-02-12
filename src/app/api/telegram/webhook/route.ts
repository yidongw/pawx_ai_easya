import { createWallet, getWalletByTelegramUserId } from '@/libs/DB';
import { Wallet } from 'ethers';
import { Keypair } from '@solana/web3.js';
import { NextResponse } from 'next/server';

type TelegramMessage = {
  message?: {
    text?: string;
    chat?: { id?: number | string };
    from?: { id?: number | string };
  };
};

export const POST = async (request: Request) => {
  const botToken = process.env.BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: 'BOT_TOKEN not configured' }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as TelegramMessage | null;
  const text = body?.message?.text;
  if (!text || !text.startsWith('/start')) {
    return NextResponse.json({ ok: true });
  }

  const chatId = body?.message?.chat?.id ?? body?.message?.from?.id;
  if (!chatId) {
    return NextResponse.json({ ok: true });
  }

  const userId = String(chatId);
  const sendMessage = async (textMessage: string) => {
    try {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: textMessage,
        }),
      });
    } catch (error) {
      console.error('Telegram sendMessage failed', error);
    }
  };

  try {
    let evmAddress: string;
    let solAddress: string;

    const existing = await getWalletByTelegramUserId(userId);
    if (existing) {
      evmAddress = existing.evmAddress;
      solAddress = existing.solAddress;
    } else {
      const evmWallet = Wallet.createRandom();
      const solKeypair = Keypair.generate();
      evmAddress = evmWallet.address;
      solAddress = solKeypair.publicKey.toBase58();

      await createWallet({
        telegramUserId: userId,
        evmAddress,
        solAddress,
        evmPrivateKey: evmWallet.privateKey,
        solPrivateKey: Buffer.from(solKeypair.secretKey).toString('hex'),
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const loginUrl = `${appUrl}/sniper?user_id=${encodeURIComponent(userId)}`;

    await sendMessage('Login Successful');
    await sendMessage(`BSC Address: ${evmAddress}`);
    await sendMessage(`Solana Address: ${solAddress}`);
    await sendMessage(`Login link: ${loginUrl}`);
  } catch (error) {
    console.error('Telegram webhook failed', error);
    await sendMessage('Webhook error. Please try again later.');
  }

  return NextResponse.json({ ok: true });
};
