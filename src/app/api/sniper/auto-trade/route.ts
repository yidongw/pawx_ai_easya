import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getWalletById, getWalletByTelegramUserId } from '@/libs/DB';
import { extract_CA } from '@/processor/extract_CA';
import { extract_ticker } from '@/processor/extractor';
import { swapBNBToToken } from '@/trade/trade_bsc';
import { swapSOLToTokenJupiter } from '@/trade/trade_sol';
import { searchTokens } from '@/utils/token_info';

type ChainOption = 'bsc' | 'solana' | 'both';
type SniperType = 'ca' | 'keywords' | 'both';

type SniperConfig = {
  accounts: string[];
  chain: ChainOption;
  type: SniperType;
  amount?: string;
  amountByChain?: {
    bsc?: string;
    solana?: string;
  };
  slippage: string;
  gasFee: string;
  updatedAt: string;
};

type ErrorReason = 'no_ca' | 'ca_not_found' | 'insufficient_usdc' | 'insufficient_sol_gas' | 'trade_failed';

type CsvToken = {
  name: string;
  symbol: string;
  ca: string;
  chain: string;
};

const OUTPUT_MAPPING_FILE = 'add_token.csv';

const getTokenMappingPath = () => {
  const envPath = process.env.TOKEN_MAPPING_CSV_PATH?.trim();
  if (envPath) {
    return envPath;
  }
  let current = process.cwd();
  for (let i = 0; i < 5; i++) {
    const candidate = path.resolve(current, 'token_mapping.csv');
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    current = path.resolve(current, '..');
  }
  return path.resolve(process.cwd(), 'token_mapping.csv');
};

const normalizeChain = (chain: string | null | undefined) => {
  if (!chain) {
    return null;
  }
  const normalized = chain.toLowerCase();
  if (normalized === 'bsc' || normalized === 'binance-smart-chain') {
    return 'bsc';
  }
  if (normalized === 'sol' || normalized === 'solana') {
    return 'solana';
  }
  return null;
};

const isChainAllowed = (selected: ChainOption, chain: 'bsc' | 'solana') => {
  if (selected === 'both') {
    return true;
  }
  return selected === chain;
};

const parseSlippageBps = (value: string) => {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return 100;
  }
  return Math.max(1, Math.round(parsed * 100));
};

const normalizeAmount = (value: string) => {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return '0.001';
  }
  return value;
};

const mapTradeError = (error: unknown): ErrorReason => {
  const message = String((error as Error | undefined)?.message ?? '').toLowerCase();
  if (message.includes('insufficient')) {
    if (message.includes('sol') || message.includes('lamport') || message.includes('fee') || message.includes('gas')) {
      return 'insufficient_sol_gas';
    }
    return 'insufficient_usdc';
  }
  if (message.includes('not found') || message.includes('invalid') || message.includes('missing') || message.includes('mint') || message.includes('address')) {
    return 'ca_not_found';
  }
  return 'trade_failed';
};

const searchTokenInCsv = (symbol: string): CsvToken[] => {
  const filePath = getTokenMappingPath();
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/).filter(Boolean);
  const rows = lines[0]?.toLowerCase().includes('symbol') ? lines.slice(1) : lines;
  const target = symbol.trim().toLowerCase();
  const parsedRows = rows
    .map((line) => {
      const [name, sym, ca, chain] = line.split(',').map(part => part.trim());
      if (!name || !sym || !ca || !chain) {
        return null;
      }
      return { name, symbol: sym, ca, chain };
    })
    .filter((row): row is CsvToken => Boolean(row));
  return parsedRows.filter(row => row.symbol.toLowerCase() === target);
};

const ensureOutputMappingFile = () => {
  const filePath = path.resolve(process.cwd(), OUTPUT_MAPPING_FILE);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, 'name,symbol,ca,chain\n', 'utf8');
  }
};

const saveTokenToMapping = async (name: string, symbol: string, ca: string, chain: string) => {
  ensureOutputMappingFile();
  const filePath = path.resolve(process.cwd(), OUTPUT_MAPPING_FILE);
  const row = `${name},${symbol},${ca},${chain}\n`;
  fs.appendFileSync(filePath, row, 'utf8');
};

const sendTradeMessageToTelegram = async (payload: {
  userId: string;
  ca: string;
  amount: string;
  hash: string;
  chain: 'bsc' | 'solana';
}) => {
  const botToken = process.env.BOT_TOKEN;
  if (!botToken) {
    return;
  }
  try {
    const chainLabel = payload.chain === 'bsc' ? 'BSC' : 'Solana';
    const amountUnit = payload.chain === 'bsc' ? 'BNB' : 'SOL';
    const text = [
      'Trade Successful',
      '',
      `CA: ${payload.ca}`,
      `Amount: ${payload.amount} ${amountUnit}`,
      'Transaction hash:',
      payload.hash,
      `Chain: ${chainLabel}`,
    ].join('\n');
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: payload.userId,
        text,
      }),
    });
  } catch (error) {
    console.log('telegram trade message failed', { error: (error as Error)?.message });
  }
};

export const POST = async (request: Request) => {
  const body = await request.json().catch(() => null);
  const text = body?.text as string | undefined;
  const config = body?.config as SniperConfig | undefined;
  const requestAmounts = body?.amounts as { bsc?: string; solana?: string } | undefined;
  const userId = body?.userId as string | undefined;

  if (!text || !config || !userId) {
    return NextResponse.json({ trades: [] }, { status: 400 });
  }

  const wallet = (await getWalletByTelegramUserId(userId)) ?? (await getWalletById(userId));

  if (!wallet) {
    return NextResponse.json({ trades: [] }, { status: 401 });
  }

  const slippageBps = parseSlippageBps(config.slippage);
  const amountByChain = {
    bsc: normalizeAmount(requestAmounts?.bsc ?? config.amountByChain?.bsc ?? config.amount ?? '0.001'),
    solana: normalizeAmount(requestAmounts?.solana ?? config.amountByChain?.solana ?? config.amount ?? '0.001'),
  };
  const tokenMappingPath = getTokenMappingPath();
  console.log('sniper request', {
    userId,
    chain: config.chain,
    type: config.type,
    amountByChain,
    slippageBps,
    textLength: text.length,
    tokenMappingPath,
    tokenMappingExists: fs.existsSync(tokenMappingPath),
  });
  const trades: Array<{ hash: string; chain: 'bsc' | 'solana' }> = [];
  let lastErrorReason: ErrorReason | null = null;

  const executeTrade = async (chain: 'bsc' | 'solana', ca: string) => {
    if (!isChainAllowed(config.chain, chain)) {
      return { success: false, reason: 'trade_failed' as ErrorReason };
    }
    const amount = amountByChain[chain];
    try {
      console.log('sniper execute', { chain, ca, amount, slippageBps });
      if (chain === 'bsc') {
        const result = await swapBNBToToken(ca, amount, slippageBps, wallet.evmPrivateKey);
        if (result?.hash) {
          console.log('sniper success', { chain, hash: result.hash });
          trades.push({ hash: result.hash, chain });
          await sendTradeMessageToTelegram({
            userId,
            ca,
            amount,
            hash: result.hash,
            chain,
          });
          return { success: true };
        }
      } else {
        const result = await swapSOLToTokenJupiter(ca, amount, slippageBps, wallet.solPrivateKey);
        if (result?.hash) {
          console.log('sniper success', { chain, hash: result.hash });
          trades.push({ hash: result.hash, chain });
          await sendTradeMessageToTelegram({
            userId,
            ca,
            amount,
            hash: result.hash,
            chain,
          });
          return { success: true };
        }
      }
      console.log('sniper no-hash', { chain, ca });
      return { success: false, reason: 'trade_failed' as ErrorReason };
    } catch (error) {
      console.log('sniper error', { chain, ca, message: (error as Error)?.message });
      return { success: false, reason: mapTradeError(error) };
    }
  };

  const caExtraction = extract_CA(text);
  const extraction = extract_ticker(text);

  const resolvedCA = caExtraction.CA ?? extraction.CA;
  const resolvedChain = caExtraction.chain ?? extraction.chain;

  console.log('sniper extraction', {
    hasCa: Boolean(resolvedCA),
    hasTicker: extraction.has_ticker,
    tickerCount: extraction.ticker.length,
  });

  if (resolvedCA) {
    if (config.type !== 'keywords') {
      const fallbackChain = resolvedCA.startsWith('0x') ? 'bsc' : 'solana';
      const chain = normalizeChain(resolvedChain) ?? fallbackChain;
      if (chain) {
        const result = await executeTrade(chain, resolvedCA);
        if (!result.success && result.reason) {
          lastErrorReason = result.reason;
        }
      } else {
        lastErrorReason = 'ca_not_found';
      }
    }
    const reason = trades.length === 0 ? lastErrorReason ?? 'trade_failed' : undefined;
    return NextResponse.json({ trades, reason, detectedCa: resolvedCA, detectedTickers: extraction.ticker });
  }

  if (!extraction.has_ticker || extraction.ticker.length === 0 || config.type === 'ca') {
    return NextResponse.json({ trades, reason: 'no_ca' as ErrorReason, detectedTickers: extraction.ticker });
  }

  for (const symbol of extraction.ticker) {
    const csvMatches = searchTokenInCsv(symbol);
    if (csvMatches.length > 0) {
      const match = csvMatches[0]!;
      const chain = normalizeChain(match.chain);
      if (chain) {
        const result = await executeTrade(chain, match.ca);
        if (!result.success && result.reason && !lastErrorReason) {
          lastErrorReason = result.reason;
        }
      } else if (!lastErrorReason) {
        lastErrorReason = 'ca_not_found';
      }
      continue;
    }

    const tokens = await searchTokens(symbol, undefined, 1);
    const targetToken = tokens[0];
    if (!targetToken) {
      continue;
    }

    const chain = normalizeChain(targetToken.chain);
    if (!chain) {
      if (!lastErrorReason) {
        lastErrorReason = 'ca_not_found';
      }
      continue;
    }

    const result = await executeTrade(chain, targetToken.token_id);
    if (result.success) {
      await saveTokenToMapping(targetToken.name, symbol, targetToken.token_id, targetToken.chain);
    } else if (result.reason && !lastErrorReason) {
      lastErrorReason = result.reason;
    }
  }

  const reason = trades.length === 0 ? lastErrorReason ?? 'ca_not_found' : undefined;
  return NextResponse.json({ trades, reason, detectedTickers: extraction.ticker });
};
