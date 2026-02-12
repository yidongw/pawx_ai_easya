import { createWallet, getWalletByTelegramUserId } from '@/libs/DB';
import { NextResponse } from 'next/server';
import { Wallet } from 'ethers';
import { Keypair } from '@solana/web3.js';
import { createHash, createHmac } from 'crypto';

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const user_id = String(body?.user_id ?? body?.id ?? '');
    if (!user_id) {
      return NextResponse.json({ error: 'Missing telegram user_id' }, { status: 400 });
    }

    const botToken = process.env.BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: 'BOT_TOKEN not configured' }, { status: 500 });
    }

    const hash = body?.hash;
    if (hash) {
      const dataCheckString = Object.keys(body)
        .filter(key => key !== 'hash' && body[key] !== undefined && body[key] !== null)
        .sort()
        .map(key => `${key}=${body[key]}`)
        .join('\n');
      const secret = createHash('sha256').update(botToken).digest();
      const calculatedHash = createHmac('sha256', secret).update(dataCheckString).digest('hex');
      if (calculatedHash !== hash) {
        return NextResponse.json({ error: 'Invalid telegram auth' }, { status: 401 });
      }
    }

    const existing = await getWalletByTelegramUserId(user_id);
    if (existing) {
      const w = existing;
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: user_id,
          text: `Login Successful\nBSC Address: ${w.evmAddress}\nSolana Address: ${w.solAddress}`,
        }),
      }).catch(() => {});

      return NextResponse.json({
        id: w.id,
        evmAddress: w.evmAddress,
        solAddress: w.solAddress,
      });
    }

    const evmWallet = Wallet.createRandom();
    const solKeypair = Keypair.generate();

    const evmAddress = evmWallet.address;
    const evmPrivateKey = evmWallet.privateKey;

    const solAddress = solKeypair.publicKey.toBase58();
    const solPrivateKey = Buffer.from(solKeypair.secretKey).toString('hex');

    const saved = await createWallet({
      telegramUserId: user_id,
      evmAddress,
      solAddress,
      evmPrivateKey,
      solPrivateKey,
    });

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: user_id,
        text: `Login Successful\nBSC Address: ${evmAddress}\nSolana Address: ${solAddress}`,
      }),
    }).catch(() => {});

    return NextResponse.json({
      id: saved.id,
      evmAddress,
      solAddress,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
};
