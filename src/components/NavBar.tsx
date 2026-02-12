'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';
import { Activity, Compass, Megaphone, Target, Users } from 'lucide-react';
import Image from 'next/image';
import { NavLink } from './NavLink';
import { SearchInput } from './SearchInput';
import { StatusIndicator } from './StatusIndicator';
import { ThemeSwitcher } from './ThemeSwitcher';

export const NavBar = () => {
  const { toast } = useToast();
  const walletInfo = useAuthStore(state => state.walletInfo);
  const selectedChain = useAuthStore(state => state.selectedChain);
  const clearWalletInfo = useAuthStore(state => state.clearWalletInfo);
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

  const addressToShow = selectedChain === 'BSC'
    ? walletInfo?.evmAddress
    : walletInfo?.solAddress;

  const handleCopy = () => {
    if (!addressToShow) {
      return;
    }
    navigator.clipboard.writeText(addressToShow);
    toast({
      title: 'Copied',
      description: addressToShow,
    });
  };

  const handleDisconnect = () => {
    clearWalletInfo();
    toast({
      title: 'Disconnected',
      description: 'Wallet disconnected',
    });
  };

  return (
    <div className="sticky top-0 z-50 bg-gray-200 dark:bg-gray-900 p-4 border-b border-gray-200 dark:border-gray-800">
      <div className="mx-auto max-w-screen-lg flex items-center justify-between">
        <Image
          src="/pawx.jpg"
          alt="Foxhole Bot Logo"
          width={32}
          height={32}
        />
        <NavLink href="/" default>
          <Activity className="w-4 h-4" />
          <span className="hidden sm:inline">Profiles</span>
        </NavLink>

        <NavLink href="/discover">
          <Compass className="w-4 h-4" />
          <span className="hidden sm:inline">Discover</span>
        </NavLink>

        <NavLink href="/monitor">
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">Monitor</span>
        </NavLink>

        <NavLink href="/campaigns">
          <Megaphone className="w-4 h-4" />
          <span className="hidden sm:inline">Campaigns</span>
        </NavLink>

        <NavLink href="/sniper">
          <Target className="w-4 h-4" />
          <span className="hidden sm:inline">Sniper</span>
        </NavLink>

        <div className="flex items-center gap-4">
          <SearchInput />
          <ThemeSwitcher />
          <StatusIndicator />
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
                  onClick={handleCopy}
                >
                  Copy
                </Button>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="h-8 px-3"
                onClick={handleDisconnect}
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button asChild size="sm" className="h-8 px-3">
              <a href={botUrl} target="_blank" rel="noreferrer">
                Telegram Login
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
