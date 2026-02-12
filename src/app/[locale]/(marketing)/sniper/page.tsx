'use client';

import { Button } from '@/components/ui/button';
import TelegramWalletLogin from '@/components/TelegramWalletLogin';
import { useAuthStore } from '@/store/authStore';
import { useStatusUpdateStore } from '@/store/statusUpdateStore';
import { useTwitterUsersStore } from '@/store/twitterUsersStore';
import tweetsData from '../../../../../tweets.json';
import { BarChart2, Bookmark, Heart, MessageCircle, Quote, Repeat2 } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

type TweetItem = {
  user: {
    name: string;
    screenName: string;
    profileImageUrlHttps: string;
  };
  text: string;
  stats: {
    favoriteCount: number;
    retweetCount: number;
    bookmarkCount: number;
    viewCount: number;
    quoteCount: number;
    replyCount: number;
  };
  dates: {
    createdAt: string;
    updatedAt: string;
  };
};

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

type Transaction = {
  hash: string;
  chain: 'bsc' | 'solana';
  amount: string;
  timestamp: string;
  account: string;
  tweetText: string;
};

type ErrorReason = 'no_ca' | 'ca_not_found' | 'insufficient_usdc' | 'insufficient_sol_gas' | 'trade_failed';

type AutoTradeResponse = {
  trades?: Array<{ hash: string; chain: Transaction['chain'] }>;
  reason?: ErrorReason;
  detectedCa?: string;
  detectedTickers?: string[];
};

const targetUsers = [
  'cz_binance',
  'heyibinance',
  'nake13',
  'gogo_allen15',
  'DonaldTrump',
  'jiangplus',
  'alan_ywang',
  'pawx_ai',
  '1dot2',
  'elonmusk',
  'p3shoemaker',
  'brockjelmore',
  'cbd1913',
  'allenpaper0915',
];

const formatCount = (count?: number) => {
  if (!count) {
    return '0';
  }
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return count.toString();
};

export default function SniperPage() {
  const staticTweets = tweetsData as TweetItem[];
  const { statuses } = useStatusUpdateStore();
  const { users } = useTwitterUsersStore();
  const liveTweets = useMemo(() => {
    const seen = new Set<string>();
    const items: TweetItem[] = [];
    Object.values(statuses).forEach((userStatuses) => {
      userStatuses.forEach((status) => {
        const statusId = status.id ? String(status.id) : '';
        if (!statusId || seen.has(statusId)) {
          return;
        }
        seen.add(statusId);
        const user = users[status.userId] ?? status.user;
        const screenName = user?.screenName || status.userId;
        const createdAtDate = status.createdAt ? new Date(status.createdAt) : null;
        const createdAtValue = createdAtDate && !Number.isNaN(createdAtDate.getTime())
          ? createdAtDate.toISOString()
          : new Date().toISOString();
        const updatedAtDate = status.updatedAt ? new Date(status.updatedAt) : null;
        const updatedAtValue = updatedAtDate && !Number.isNaN(updatedAtDate.getTime())
          ? updatedAtDate.toISOString()
          : createdAtValue;
        items.push({
          user: {
            name: user?.name || screenName,
            screenName: user?.screenName || screenName,
            profileImageUrlHttps: user?.profileImageUrlHttps || '',
          },
          text: status.fullText || status.text || '',
          stats: {
            favoriteCount: status.favoriteCount ?? 0,
            retweetCount: status.retweetCount ?? 0,
            bookmarkCount: status.bookmarkCount ?? 0,
            viewCount: status.viewCount ?? 0,
            quoteCount: status.quoteCount ?? 0,
            replyCount: status.replyCount ?? 0,
          },
          dates: {
            createdAt: createdAtValue,
            updatedAt: updatedAtValue,
          },
        });
      });
    });
    return items;
  }, [statuses, users]);
  const tweets = liveTweets.length > 0 ? liveTweets : staticTweets;

  const availableAccounts = useMemo(() => {
    const accountMap = new Map<string, { screenName: string; name: string; profileImageUrl: string }>();
    targetUsers.forEach((screenName) => {
      accountMap.set(screenName, {
        screenName,
        name: screenName,
        profileImageUrl: '',
      });
    });
    tweets.forEach((tweet) => {
      const { screenName, name, profileImageUrlHttps } = tweet.user;
      if (targetUsers.includes(screenName)) {
        accountMap.set(screenName, {
          screenName,
          name,
          profileImageUrl: profileImageUrlHttps,
        });
      }
    });

    return targetUsers
      .map(user => accountMap.get(user)!)
      .filter(Boolean);
  }, [tweets]);

  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(
    () => availableAccounts.map(account => account.screenName),
  );
  const [monitorAccounts, setMonitorAccounts] = useState<string[]>(
    () => availableAccounts.map(account => account.screenName),
  );
  const [sniperType, setSniperType] = useState<SniperType>('ca');
  const [chainOption, setChainOption] = useState<ChainOption>('bsc');
  const [snipeAmountBsc, setSnipeAmountBsc] = useState('0.05');
  const [snipeAmountSol, setSnipeAmountSol] = useState('0.5');
  const [slippage, setSlippage] = useState('1');
  const [gasFee, setGasFee] = useState('0.5');
  const [activeTab, setActiveTab] = useState<'configuration' | 'saved' | 'transactions'>('configuration');
  const [savedConfig, setSavedConfig] = useState<SniperConfig | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSniping, setIsSniping] = useState(false);
  const processedTweetKeys = useRef<Set<string>>(new Set());
  const transactionSaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const walletInfo = useAuthStore(state => state.walletInfo);

  useEffect(() => {
    const stored = localStorage.getItem('sniper-transactions');
    if (!stored) {
      return;
    }
    try {
      const parsed = JSON.parse(stored) as Transaction[];
      if (Array.isArray(parsed)) {
        setTransactions(parsed);
      }
    } catch {
      setTransactions([]);
    }
  }, []);

  useEffect(() => {
    if (transactionSaveTimeout.current) {
      clearTimeout(transactionSaveTimeout.current);
    }
    transactionSaveTimeout.current = setTimeout(() => {
      localStorage.setItem('sniper-transactions', JSON.stringify(transactions));
    }, 500);
    return () => {
      if (transactionSaveTimeout.current) {
        clearTimeout(transactionSaveTimeout.current);
        transactionSaveTimeout.current = null;
      }
    };
  }, [transactions]);

  const filteredTweets = useMemo(() => {
    return tweets
      .filter(tweet => selectedAccounts.includes(tweet.user.screenName))
      .sort((a, b) => new Date(b.dates.createdAt).getTime() - new Date(a.dates.createdAt).getTime());
  }, [tweets, selectedAccounts]);

  const handleToggle = (screenName: string) => {
    setSelectedAccounts(prev => (
      prev.includes(screenName)
        ? prev.filter(item => item !== screenName)
        : [...prev, screenName]
    ));
  };

  const handleSelectAll = () => {
    setSelectedAccounts(availableAccounts.map(account => account.screenName));
  };

  const handleClearAll = () => {
    setSelectedAccounts([]);
  };

  const handleMonitorToggle = (screenName: string) => {
    setMonitorAccounts(prev => (
      prev.includes(screenName)
        ? prev.filter(item => item !== screenName)
        : [...prev, screenName]
    ));
  };

  const handleMonitorSelectAll = () => {
    setMonitorAccounts(availableAccounts.map(account => account.screenName));
  };

  const handleMonitorClearAll = () => {
    setMonitorAccounts([]);
  };

  const handleSaveMonitor = () => {
    const nextConfig: SniperConfig = {
      accounts: monitorAccounts,
      chain: chainOption,
      type: sniperType,
      amount: chainOption === 'solana' ? snipeAmountSol : snipeAmountBsc,
      amountByChain: {
        bsc: snipeAmountBsc,
        solana: snipeAmountSol,
      },
      slippage,
      gasFee,
      updatedAt: new Date().toISOString(),
    };
    setSavedConfig(nextConfig);
    setActiveTab('saved');
  };

  const handleEditMonitor = () => {
    if (!savedConfig) {
      setActiveTab('configuration');
      return;
    }
    setMonitorAccounts(savedConfig.accounts);
    setChainOption(savedConfig.chain);
    setSniperType(savedConfig.type);
    const savedBscAmount = savedConfig.amountByChain?.bsc ?? savedConfig.amount ?? snipeAmountBsc;
    const savedSolAmount = savedConfig.amountByChain?.solana ?? savedConfig.amount ?? snipeAmountSol;
    setSnipeAmountBsc(savedBscAmount);
    setSnipeAmountSol(savedSolAmount);
    setSlippage(savedConfig.slippage);
    setGasFee(savedConfig.gasFee);
    setActiveTab('configuration');
  };

  const getExplorerUrl = (chain: Transaction['chain'], hash: string) => {
    if (chain === 'bsc') {
      return `https://bscscan.com/tx/${hash}`;
    }
    return `https://solscan.io/tx/${hash}`;
  };

  const formatHash = (hash: string) => {
    if (hash.length <= 12) {
      return hash;
    }
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const getFailureMessage = (reason?: ErrorReason) => {
    switch (reason) {
      case 'no_ca':
        return 'SNIPE failed: No contract address found.';
      case 'ca_not_found':
        return 'SNIPE failed: Contract address not found or invalid.';
      case 'insufficient_usdc':
        return 'SNIPE failed: Insufficient USDC balance.';
      case 'insufficient_sol_gas':
        return 'SNIPE failed: Insufficient SOL for gas fee.';
      case 'trade_failed':
      default:
        return 'SNIPE failed: Trade failed. Please try again.';
    }
  };

  useEffect(() => {
    if (!savedConfig) {
      return;
    }
    processedTweetKeys.current = new Set();
  }, [savedConfig?.updatedAt]);

  useEffect(() => {
    if (!savedConfig || !walletInfo?.userId) {
      return;
    }
    const cutoff = new Date(savedConfig.updatedAt).getTime();
    const targetTweets = tweets
      .filter(tweet => savedConfig.accounts.includes(tweet.user.screenName))
      .filter(tweet => Number.isFinite(new Date(tweet.dates.createdAt).getTime()) && new Date(tweet.dates.createdAt).getTime() >= cutoff)
      .sort((a, b) => new Date(a.dates.createdAt).getTime() - new Date(b.dates.createdAt).getTime());

    if (targetTweets.length === 0) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      setIsSniping(true);
      for (const tweet of targetTweets) {
        if (cancelled) {
          return;
        }
        const key = `${tweet.user.screenName}-${tweet.dates.createdAt}-${tweet.text}`;
        if (processedTweetKeys.current.has(key)) {
          continue;
        }
        processedTweetKeys.current.add(key);
        toast.message(`Detected tweet from @${tweet.user.screenName}`);
        const response = await fetch('/api/sniper/auto-trade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: tweet.text,
            amounts: {
              bsc: savedConfig.amountByChain?.bsc ?? savedConfig.amount,
              solana: savedConfig.amountByChain?.solana ?? savedConfig.amount,
            },
            config: savedConfig,
            userId: walletInfo.userId,
          }),
        });
        if (!response.ok) {
          toast.error('SNIPE failed to start. Please try again.');
          continue;
        }
        const data = (await response.json()) as AutoTradeResponse;
        const detectedTickers = Array.isArray(data?.detectedTickers) ? data.detectedTickers : [];
        if (data?.detectedCa) {
          toast.message(`Starting SNIPE for CA: ${data.detectedCa}`);
        } else if (detectedTickers.length > 0) {
          toast.message(`Starting SNIPE for Keywords: ${detectedTickers.join(', ')}`);
        }
        const trades = Array.isArray(data?.trades) ? data.trades : [];
        if (trades.length === 0) {
          toast.error(getFailureMessage(data?.reason));
          continue;
        }
        trades.forEach(trade => {
          toast.success(`SNIPE completed successfully! Transaction hash: ${trade.hash}`);
        });
        setTransactions(prev => [
          ...trades.map(trade => ({
            hash: trade.hash,
            chain: trade.chain,
            amount: trade.chain === 'bsc'
              ? (savedConfig.amountByChain?.bsc ?? savedConfig.amount ?? '')
              : (savedConfig.amountByChain?.solana ?? savedConfig.amount ?? ''),
            timestamp: new Date().toISOString(),
            account: tweet.user.screenName,
            tweetText: tweet.text,
          })),
          ...prev,
        ]);
      }
      if (!cancelled) {
        setIsSniping(false);
      }
    };

    run();

    return () => {
      cancelled = true;
      setIsSniping(false);
    };
  }, [savedConfig, tweets, walletInfo?.userId]);

  return (
    <div className="min-h-[calc(100vh-84px)] w-full bg-gray-100 dark:bg-gray-500">
      <div className="mx-auto max-w-screen-xl space-y-6 p-6">
        <TelegramWalletLogin />
        {isSniping && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 shadow-sm dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-100">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex size-3 rounded-full bg-blue-500 animate-pulse" />
              <span className="font-semibold">Sniping in progress</span>
              <span className="text-xs text-blue-600 dark:text-blue-200">Monitoring tweets and executing trades.</span>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white/90 p-6 shadow-sm dark:border-gray-600 dark:bg-gray-700/80">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex size-2.5 items-center justify-center rounded-full border-2 border-blue-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Sniper Monitor</h2>
            </div>
            <div className="flex w-full max-w-lg items-center rounded-full bg-gray-100 p-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              <button
                type="button"
                onClick={() => setActiveTab('configuration')}
                className={`flex-1 rounded-full px-3 py-2 text-center transition ${activeTab === 'configuration' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100' : 'hover:text-gray-900 dark:hover:text-gray-100'}`}
              >
                Configuration
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('saved')}
                className={`flex-1 rounded-full px-3 py-2 text-center transition ${activeTab === 'saved' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100' : 'hover:text-gray-900 dark:hover:text-gray-100'}`}
              >
                Saved
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('transactions')}
                className={`flex-1 rounded-full px-3 py-2 text-center transition ${activeTab === 'transactions' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100' : 'hover:text-gray-900 dark:hover:text-gray-100'}`}
              >
                Transactions
              </button>
            </div>
          </div>

          {activeTab === 'configuration' ? (
            <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-600 dark:bg-gray-800/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    <span className="text-blue-500">⚡</span>
                    Monitor Accounts
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-300">
                    <button type="button" className="hover:text-gray-900 dark:hover:text-gray-100" onClick={handleMonitorSelectAll}>
                      Select All
                    </button>
                    <span className="h-3 w-px bg-gray-300 dark:bg-gray-600" />
                    <button type="button" className="hover:text-gray-900 dark:hover:text-gray-100" onClick={handleMonitorClearAll}>
                      Clear
                    </button>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {availableAccounts.map(account => (
                    <label
                      key={`monitor-${account.screenName}`}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 transition ${monitorAccounts.includes(account.screenName) ? 'border-blue-200 bg-blue-50 dark:border-blue-500/40 dark:bg-blue-500/10' : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-600 dark:bg-gray-800/60'}`}
                    >
                      <input
                        type="checkbox"
                        checked={monitorAccounts.includes(account.screenName)}
                        onChange={() => handleMonitorToggle(account.screenName)}
                        className="size-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                      />
                      <Image
                        src={account.profileImageUrl || '/default-avatar.png'}
                        alt={account.name}
                        width={32}
                        height={32}
                        className="size-8 rounded-full"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{account.name}</p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-300">@{account.screenName}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-300">
                  {monitorAccounts.length}
                  {' '}
                  account(s) selected
                </p>
              </div>

              <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-600 dark:bg-gray-800/60">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Sniper Type</div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { value: 'ca', label: 'CAs Only', description: 'Monitor contract addresses' },
                    { value: 'keywords', label: 'Keywords Only', description: 'Monitor keywords' },
                    { value: 'both', label: 'CA & Keywords', description: 'Monitor both' },
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSniperType(option.value as SniperType)}
                      className={`rounded-xl border px-3 py-3 text-left text-xs transition ${sniperType === option.value ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200' : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:text-gray-300'}`}
                    >
                      <div className="text-sm font-semibold">{option.label}</div>
                      <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{option.description}</div>
                    </button>
                  ))}
                </div>

                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Chain</div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { value: 'bsc', label: 'BSC', description: 'Monitor BSC chain' },
                    { value: 'solana', label: 'Solana', description: 'Monitor Solana chain' },
                    { value: 'both', label: 'BSC & Solana', description: 'Monitor both chains' },
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setChainOption(option.value as ChainOption)}
                      className={`rounded-xl border px-3 py-3 text-left text-xs transition ${chainOption === option.value ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200' : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:text-gray-300'}`}
                    >
                      <div className="text-sm font-semibold">{option.label}</div>
                      <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{option.description}</div>
                    </button>
                  ))}
                </div>
                {chainOption !== 'solana' && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Snipe Amount (BSC)</label>
                    <div className="mt-2 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-900/40 dark:text-gray-100">
                      <input
                        value={snipeAmountBsc}
                        onChange={event => setSnipeAmountBsc(event.target.value)}
                        className="w-full bg-transparent outline-none"
                      />
                      <span className="text-xs font-semibold text-blue-500">BNB</span>
                    </div>
                  </div>
                )}
                {chainOption !== 'bsc' && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Snipe Amount (Solana)</label>
                    <div className="mt-2 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-900/40 dark:text-gray-100">
                      <input
                        value={snipeAmountSol}
                        onChange={event => setSnipeAmountSol(event.target.value)}
                        className="w-full bg-transparent outline-none"
                      />
                      <span className="text-xs font-semibold text-blue-500">SOL</span>
                    </div>
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Slippage Tolerance</label>
                    <div className="mt-2 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-900/40 dark:text-gray-100">
                      <input
                        value={slippage}
                        onChange={event => setSlippage(event.target.value)}
                        className="w-full bg-transparent outline-none"
                      />
                      <span className="text-xs text-gray-500">%</span>
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">Suggested: 0.5% - 3%</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Gas Fee Limit</label>
                    <div className="mt-2 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm dark:border-gray-600 dark:bg-gray-900/40 dark:text-gray-100">
                      <input
                        value={gasFee}
                        onChange={event => setGasFee(event.target.value)}
                        className="w-full bg-transparent outline-none"
                      />
                      <span className="text-xs text-gray-500">USDC</span>
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">Suggested: 0.3 - 1 USDC</p>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2">
                <Button className="w-full bg-blue-500 text-white hover:bg-blue-600" onClick={handleSaveMonitor}>
                  {walletInfo?.userId ? 'Update & Save' : 'Please Login First'}
                </Button>
              </div>
            </div>
          ) : activeTab === 'saved' ? (
            <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-600 dark:bg-gray-800/60">
              {savedConfig ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Active Configuration</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-300">
                        Last updated:
                        {' '}
                        {new Date(savedConfig.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleEditMonitor}>
                      Edit
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-300">
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${isSniping ? 'bg-blue-50 text-blue-600 ring-2 ring-blue-200 dark:bg-blue-500/20 dark:text-blue-200 dark:ring-blue-500/30' : 'bg-gray-100 text-gray-500 dark:bg-gray-700/60 dark:text-gray-300'}`}>
                      <span className={`inline-flex size-2 rounded-full ${isSniping ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`} />
                      {isSniping ? 'Sniping active' : 'Sniping idle'}
                    </span>
                    <span>
                      {savedConfig.accounts.length}
                      {' '}
                      account(s) monitored
                    </span>
                  </div>
                  <div className="grid gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-900/40 dark:text-gray-200 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase text-gray-400">Sniper Type</p>
                      <p className="mt-1 font-semibold">
                        {savedConfig.type === 'ca' ? 'CAs Only' : savedConfig.type === 'keywords' ? 'Keywords Only' : 'CA & Keywords'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-400">Chain</p>
                      <p className="mt-1 font-semibold">
                        {savedConfig.chain === 'bsc' ? 'BSC' : savedConfig.chain === 'solana' ? 'Solana' : 'BSC & Solana'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-400">Monitored Accounts</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {savedConfig.accounts.map(account => (
                          <span key={`saved-${account}`} className="rounded-full bg-white px-3 py-1 text-xs text-gray-700 shadow-sm dark:bg-gray-800 dark:text-gray-200">
                            @
                            {account}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-400">Amount</p>
                      {savedConfig.chain === 'both' ? (
                        <div className="mt-2 space-y-2 text-sm font-semibold text-blue-500">
                          <div>
                            BNB:
                            {' '}
                            {savedConfig.amountByChain?.bsc ?? savedConfig.amount ?? '-'}
                          </div>
                          <div>
                            SOL:
                            {' '}
                            {savedConfig.amountByChain?.solana ?? savedConfig.amount ?? '-'}
                          </div>
                        </div>
                      ) : (
                        <p className="mt-1 text-lg font-semibold text-blue-500">
                          {savedConfig.chain === 'bsc'
                            ? (savedConfig.amountByChain?.bsc ?? savedConfig.amount ?? '-')
                            : (savedConfig.amountByChain?.solana ?? savedConfig.amount ?? '-')}
                          {' '}
                          {savedConfig.chain === 'bsc' ? 'BNB' : 'SOL'}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-400">Slippage</p>
                      <p className="mt-1 font-semibold">
                        {savedConfig.slippage}
                        %
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-400">Gas Fee Limit</p>
                      <p className="mt-1 font-semibold">
                        {savedConfig.gasFee}
                        {' '}
                        USDC
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white/70 p-10 text-center text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-800/60 dark:text-gray-300">
                  No saved configuration yet. Create one in Configuration.
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-600 dark:bg-gray-800/60">
              {transactions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white/70 p-10 text-center text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-800/60 dark:text-gray-300">
                  No transactions yet. Successful snipes will appear here.
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((txn, index) => {
                    const accountTweet = tweets.find(tweet => tweet.user.screenName === txn.account);
                    const accountImage = accountTweet?.user.profileImageUrlHttps || '/default-avatar.png';
                    return (
                      <div key={`${txn.hash}-${index}`} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 shadow-sm dark:border-gray-600 dark:bg-gray-900/40 dark:text-gray-200">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            {txn.chain === 'bsc' ? (
                              <Image src="/BNB.png" alt="BNB" width={16} height={16} className="shrink-0" />
                            ) : (
                              <Image src="/SOL.png" alt="SOL" width={16} height={16} className="shrink-0" />
                            )}
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${txn.chain === 'bsc' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-200' : 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-200'}`}>
                              {txn.chain === 'bsc' ? 'BSC' : 'Solana'}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-300">
                              {new Date(txn.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-300">
                            <span className="uppercase tracking-wide text-gray-400">Amount</span>
                            <span className="font-semibold text-gray-700 dark:text-gray-100">
                              {txn.amount}
                              {' '}
                              {txn.chain === 'bsc' ? 'BNB' : 'SOL'}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
                          <div className="flex min-w-[180px] items-center gap-3">
                            <Image src={accountImage} alt={txn.account} width={32} height={32} className="size-8 rounded-full" />
                            <div className="text-xs text-gray-500 dark:text-gray-300">
                              @
                              <span className="font-semibold text-gray-700 dark:text-gray-100">{txn.account}</span>
                            </div>
                          </div>
                          <div className="flex flex-1 flex-col gap-2 text-xs text-gray-500 dark:text-gray-300">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-gray-600 dark:bg-gray-700 dark:text-gray-200">TX</span>
                              <a
                                href={getExplorerUrl(txn.chain, txn.hash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-blue-600 hover:underline dark:text-blue-300"
                              >
                                {formatHash(txn.hash)}
                              </a>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-gray-600 dark:bg-gray-700 dark:text-gray-200">Tweet</span>
                              <span className="text-gray-600 dark:text-gray-200">{txn.tweetText}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white/90 shadow-sm dark:border-gray-600 dark:bg-gray-700/80">
          <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-gray-600 dark:bg-gray-800/80">
            <div className="flex items-center gap-3">
              <Image src="/X.jpg" alt="X" width={22} height={22} className="shrink-0" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tweet Feed</h2>
              </div>
            </div>
          </header>

          <div className="flex flex-col gap-6 p-6 lg:flex-row">
            <aside className="w-full shrink-0 rounded-xl border border-gray-200 bg-white/70 p-4 shadow-sm dark:border-gray-600 dark:bg-gray-800/60 lg:w-72">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Filter Accounts</h3>
                <span className="text-xs text-gray-500 dark:text-gray-300">
                  Selected
                  {' '}
                  {selectedAccounts.length}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" className="h-7 px-2" onClick={handleSelectAll}>
                  Select All
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleClearAll}>
                  Clear
                </Button>
              </div>
              <div className="mt-4 space-y-3">
                {availableAccounts.map(account => (
                  <label
                    key={account.screenName}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-2 py-2 transition hover:border-gray-200 hover:bg-gray-50 dark:hover:border-gray-600 dark:hover:bg-gray-700/60"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAccounts.includes(account.screenName)}
                      onChange={() => handleToggle(account.screenName)}
                      className="size-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                    />
                    <Image
                      src={account.profileImageUrl || '/default-avatar.png'}
                      alt={account.name}
                      width={36}
                      height={36}
                      className="size-9 rounded-full"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                        {account.name}
                      </p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-300">
                        @
                        {account.screenName}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </aside>

            <section className="flex-1 space-y-4">
              {filteredTweets.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white/70 p-12 text-center text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-800/60 dark:text-gray-300">
                  Select at least one account to view tweets
                </div>
              ) : (
                filteredTweets.map((tweet, index) => (
                  <article
                    key={`${tweet.user.screenName}-${tweet.dates.createdAt}-${index}`}
                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-600 dark:bg-gray-800/60"
                  >
                    <div className="flex items-start gap-3">
                      <Image
                        src={tweet.user.profileImageUrlHttps || '/default-avatar.png'}
                        alt={tweet.user.name}
                        width={44}
                        height={44}
                        className="size-11 rounded-full"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {tweet.user.name}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-300">
                            @
                            {tweet.user.screenName}
                          </span>
                          <span className="text-xs text-gray-400">·</span>
                          <span className="text-xs text-gray-400">
                            {new Date(tweet.dates.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-100">
                          {tweet.text}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-300">
                          <span className="flex items-center gap-1">
                            <MessageCircle className="size-4" />
                            {formatCount(tweet.stats.replyCount)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Repeat2 className="size-4" />
                            {formatCount(tweet.stats.retweetCount)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="size-4" />
                            {formatCount(tweet.stats.favoriteCount)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Bookmark className="size-4" />
                            {formatCount(tweet.stats.bookmarkCount)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Quote className="size-4" />
                            {formatCount(tweet.stats.quoteCount)}
                          </span>
                          <span className="flex items-center gap-1">
                            <BarChart2 className="size-4" />
                            {formatCount(tweet.stats.viewCount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
