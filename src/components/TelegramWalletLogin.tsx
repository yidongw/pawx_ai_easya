'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function TelegramWalletLogin() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const walletInfo = useAuthStore(state => state.walletInfo);
  const selectedChain = useAuthStore(state => state.selectedChain);
  const setWalletInfo = useAuthStore(state => state.setWalletInfo);
  const setSelectedChain = useAuthStore(state => state.setSelectedChain);
  const clearWalletInfo = useAuthStore(state => state.clearWalletInfo);
  const [isLoading, setIsLoading] = useState(false);
  const hasAutoLogin = useRef(false);
  const botUrl = 'https://t.me/pawx_trading_bot?start=login';
  const formatAddress = (address?: string) => {
    if (!address) {
      return 'Not logged in';
    }
    if (address.length <= 12) {
      return address;
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const performLogin = useCallback(async (payload: Record<string, any>) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/tg-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || 'Login failed');
      }
      const data = await response.json();
      const resolvedUserId = String(payload.user_id ?? payload.id ?? data.userId ?? data.id ?? '');
      setWalletInfo({
        userId: resolvedUserId,
        evmAddress: data.evmAddress,
        solAddress: data.solAddress,
      });
      toast({
        title: 'Login Successful',
        description: 'BSC and Solana wallets created',
      });
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error?.message || 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (hasAutoLogin.current) {
      return;
    }
    const params = Object.fromEntries(searchParams.entries());
    if (!params.user_id && !params.id) {
      return;
    }
    hasAutoLogin.current = true;
    performLogin(params);
    router.replace('/sniper');
  }, [performLogin, router, searchParams]);

  useEffect(() => {
    if (!walletInfo) {
      hasAutoLogin.current = false;
    }
  }, [walletInfo]);

  const handleDisconnect = () => {
    clearWalletInfo();
    router.replace('/sniper');
    toast({
      title: 'Disconnected',
      description: 'Wallet disconnected',
    });
  };

  const addressToShow = selectedChain === 'BSC'
    ? walletInfo?.evmAddress
    : walletInfo?.solAddress;

  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white/90 p-5 shadow-sm dark:border-gray-600 dark:bg-gray-700/80">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-[220px] items-center">
          {walletInfo ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 rounded-full border border-gray-200 bg-white/80 px-4 py-2 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-800/60">
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-600 dark:text-gray-100">
                  {selectedChain}
                </span>
                <span className="font-medium text-gray-700 dark:text-gray-100">
                  {formatAddress(addressToShow)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  disabled={!walletInfo || isLoading}
                  onClick={() => {
                    const address = addressToShow;
                    if (!address) {
                      return;
                    }
                    navigator.clipboard.writeText(address);
                    toast({
                      title: 'Copied',
                      description: address,
                    });
                  }}
                >
                  Copy
                </Button>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="h-9 px-3"
                onClick={handleDisconnect}
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button asChild size="sm" className="h-9 px-3">
              <a href={botUrl} target="_blank" rel="noreferrer">
                Telegram Login
              </a>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={selectedChain}
            onValueChange={value => setSelectedChain(value as 'BSC' | 'SOLANA')}
          >
            <SelectTrigger className="h-10 w-[180px]">
              <SelectValue placeholder="Select Chain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BSC">BSC</SelectItem>
              <SelectItem value="SOLANA">Solana</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-5 grid gap-4 rounded-xl border border-gray-200 bg-white/80 p-4 text-sm text-gray-700 shadow-sm dark:border-gray-600 dark:bg-gray-800/60 dark:text-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
            Chain
          </span>
          <span className="font-semibold">{selectedChain}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
            Wallet Address
          </span>
          <span className="break-all font-medium text-right">
            {addressToShow || 'Not logged in'}
          </span>
        </div>
      </div>
    </div>
  );
}
