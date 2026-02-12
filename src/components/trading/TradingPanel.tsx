'use client';

import type { Address } from 'viem';
import { ERC20_Abi } from '@/abi/ERC20';
import { PANCAKESWAP_ROUTER_ADDRESS, PancakeSwapRouterABI, WBNB_ADDRESS } from '@/abi/PancakeSwapRouter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { usePrivateKeyStore } from '@/store/privateKeyStore';
import { useTokenStore } from '@/store/tokenStore';
import React, { useEffect, useMemo, useState } from 'react';
import { createPublicClient, createWalletClient, http, parseEther, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bsc } from 'viem/chains';

const maskPrivateKey = (key: string): string => {
  if (key.length <= 8) {
    return '*'.repeat(key.length);
  }
  return key.slice(0, 4) + '*'.repeat(key.length - 8) + key.slice(-4);
};

const getChainName = (chainId: number): string => {
  const chainNames: Record<number, string> = {
    1: 'Ethereum',
    56: 'BSC',
    137: 'Polygon',
    42161: 'Arbitrum',
    43114: 'Avalanche',
    10: 'Optimism',
    8453: 'Base',
    324: 'zkSync',
    250: 'Fantom',
    25: 'Cronos',
    100: 'Gnosis',
    1284: 'Moonbeam',
    1285: 'Moonriver',
    42220: 'Celo',
    // Add more chains as needed
  };
  return chainNames[chainId] || `Chain ${chainId}`;
};

export const TradingPanel: React.FC = () => {
  const { getSelectedToken } = useTokenStore();
  const selectedToken = getSelectedToken();
  const { encryptedKey, setPrivateKey } = usePrivateKeyStore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('buy');
  const [privateKeyInput, setPrivateKeyInput] = useState('');
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [isProcessing, setIsProcessing] = useState(false);

  // Create account and clients from private key
  const { account, walletClient, publicClient } = useMemo(() => {
    if (!encryptedKey || !encryptedKey.match(/^0x[0-9a-fA-F]{64}$/)) {
      return { account: null, walletClient: null, publicClient: null };
    }

    try {
      const acc = privateKeyToAccount(encryptedKey as `0x${string}`);
      const wallet = createWalletClient({
        account: acc,
        chain: bsc,
        transport: http(),
      });
      const pub = createPublicClient({
        chain: bsc,
        transport: http(),
      });
      return { account: acc, walletClient: wallet, publicClient: pub };
    } catch (error) {
      console.error('Failed to create wallet from private key:', error);
      return { account: null, walletClient: null, publicClient: null };
    }
  }, [encryptedKey]);

  // Load encrypted key on mount
  useEffect(() => {
    if (encryptedKey) {
      setPrivateKeyInput(maskPrivateKey(encryptedKey));
    }
  }, [encryptedKey]);

  const handlePrivateKeyChange = (value: string) => {
    setPrivateKeyInput(value);
    // Only save if it looks like a valid private key (0x + 64 hex chars)
    if (value.match(/^0x[0-9a-fA-F]{64}$/)) {
      setPrivateKey(value);
    }
  };

  const handleApprove = async () => {
    if (!selectedToken || !walletClient || !account || !publicClient) {
      toast({
        title: 'Missing Information',
        description: 'Please enter a valid private key',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const amountToApprove = parseUnits(amount, 18); // Assuming 18 decimals

      const hash = await walletClient.writeContract({
        address: selectedToken.token_address as Address,
        abi: ERC20_Abi.abi,
        functionName: 'approve',
        args: [PANCAKESWAP_ROUTER_ADDRESS, amountToApprove],
      });

      toast({
        title: 'Approval Submitted',
        description: 'Waiting for confirmation...',
      });

      // Wait for transaction receipt
      await publicClient.waitForTransactionReceipt({ hash });

      toast({
        title: 'Approval Successful',
        description: 'Token approved successfully!',
      });
    } catch (err) {
      toast({
        title: 'Approval Failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBuy = async () => {
    if (!selectedToken || !amount || !walletClient || !account || !publicClient) {
      toast({
        title: 'Missing Information',
        description: 'Please enter a valid private key and amount',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const amountIn = parseEther(amount);
      const slippagePercent = Number.parseFloat(slippage) / 100;
      const minAmountOut = BigInt(
        Math.floor(Number(amountIn) * (1 - slippagePercent)),
      );

      const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20); // 20 minutes

      const path = [WBNB_ADDRESS, selectedToken.token_address];

      const hash = await walletClient.writeContract({
        address: PANCAKESWAP_ROUTER_ADDRESS as Address,
        abi: PancakeSwapRouterABI.abi,
        functionName: 'swapExactETHForTokens',
        args: [minAmountOut, path, account.address, deadline],
        value: amountIn,
      });

      toast({
        title: 'Buy Transaction Submitted',
        description: 'Waiting for confirmation...',
      });

      // Wait for transaction receipt
      await publicClient.waitForTransactionReceipt({ hash });

      toast({
        title: 'Buy Successful',
        description: `Bought ${selectedToken.symbol} successfully!`,
      });

      // Clear amount after successful transaction
      setAmount('');
    } catch (err) {
      toast({
        title: 'Buy Failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSell = async () => {
    if (!selectedToken || !amount || !walletClient || !account || !publicClient) {
      toast({
        title: 'Missing Information',
        description: 'Please enter a valid private key and amount',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const amountIn = parseUnits(amount, 18); // Assuming 18 decimals
      const slippagePercent = Number.parseFloat(slippage) / 100;
      const minAmountOut = BigInt(
        Math.floor(Number(amountIn) * (1 - slippagePercent)),
      );

      const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20); // 20 minutes

      const path = [selectedToken.token_address, WBNB_ADDRESS];

      const hash = await walletClient.writeContract({
        address: PANCAKESWAP_ROUTER_ADDRESS as Address,
        abi: PancakeSwapRouterABI.abi,
        functionName: 'swapExactTokensForETH',
        args: [amountIn, minAmountOut, path, account.address, deadline],
      });

      toast({
        title: 'Sell Transaction Submitted',
        description: 'Waiting for confirmation...',
      });

      // Wait for transaction receipt
      await publicClient.waitForTransactionReceipt({ hash });

      toast({
        title: 'Sell Successful',
        description: `Sold ${selectedToken.symbol} successfully!`,
      });

      // Clear amount after successful transaction
      setAmount('');
    } catch (err) {
      toast({
        title: 'Sell Failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  if (!selectedToken) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-800 shadow overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b bg-slate-50 dark:bg-slate-900">
          <span className="font-semibold">Trading</span>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div className="text-gray-400 dark:text-gray-500 text-center">
            No token selected
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 shadow overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-slate-50 dark:bg-slate-900">
        <span className="font-semibold">Trading</span>
        {typeof selectedToken.risk_score === 'number' && (
          <Badge variant={selectedToken.risk_score < 30 ? 'default' : 'destructive'}>
            Risk:
            {' '}
            {selectedToken.risk_score}
          </Badge>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Token Info Card */}
        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{selectedToken.symbol}</h3>
              <Badge variant="outline">
                {getChainName(selectedToken.chainId)}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">{selectedToken.name}</p>
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500 mb-1">Contract Address</p>
              <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded block truncate">
                {selectedToken.token_address}
              </code>
            </div>
            {selectedToken.price_usd && (
              <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t">
                <div>
                  <span className="text-gray-500">Price:</span>
                  <span className="ml-2 font-semibold">
                    $
                    {selectedToken.price_usd}
                  </span>
                </div>
                {typeof selectedToken.liquidity_usd === 'number' && (
                  <div>
                    <span className="text-gray-500">Liquidity:</span>
                    <span className="ml-2 font-semibold">
                      {formatCurrency(selectedToken.liquidity_usd)}
                    </span>
                  </div>
                )}
                {typeof selectedToken.volume_24h === 'number' && (
                  <div>
                    <span className="text-gray-500">24h Volume:</span>
                    <span className="ml-2 font-semibold">
                      {formatCurrency(selectedToken.volume_24h)}
                    </span>
                  </div>
                )}
                {typeof selectedToken.txns_24h_total === 'number' && (
                  <div>
                    <span className="text-gray-500">24h Txns:</span>
                    <span className="ml-2 font-semibold">
                      {formatNumber(selectedToken.txns_24h_total)}
                    </span>
                  </div>
                )}
              </div>
            )}
            {selectedToken.dex_url && (
              <a
                href={selectedToken.dex_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline inline-block pt-2"
              >
                View on DEX Screener →
              </a>
            )}
          </div>
        </Card>

        {/* Private Key Input */}
        <Card className="p-4">
          <div className="space-y-2">
            <Label htmlFor="privateKey">Private Key (Masked)</Label>
            <Input
              id="privateKey"
              type="password"
              placeholder="0x..."
              value={privateKeyInput}
              onChange={e => handlePrivateKeyChange(e.target.value)}
              className="font-mono text-sm"
            />
            {account && (
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-500 mb-1">Wallet Address</p>
                <code className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded block truncate">
                  {account.address}
                </code>
              </div>
            )}
            <p className="text-xs text-gray-500">
              Your private key is encrypted and stored locally
            </p>
          </div>
        </Card>

        {/* Trading Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buy">Buy</TabsTrigger>
            <TabsTrigger value="sell">Sell</TabsTrigger>
          </TabsList>

          <TabsContent value="buy" className="space-y-4 mt-4">
            <Card className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="buyAmount">Amount (BNB)</Label>
                <Input
                  id="buyAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slippage">Slippage Tolerance (%)</Label>
                <Input
                  id="slippage"
                  type="number"
                  step="0.1"
                  placeholder="0.5"
                  value={slippage}
                  onChange={e => setSlippage(e.target.value)}
                />
              </div>
              <Button
                onClick={handleBuy}
                disabled={!amount || !account || isProcessing}
                className="w-full"
              >
                {isProcessing ? 'Processing...' : 'Buy Token'}
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="sell" className="space-y-4 mt-4">
            <Card className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sellAmount">
                  Amount (
                  {selectedToken.symbol}
                  )
                </Label>
                <Input
                  id="sellAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slippage">Slippage Tolerance (%)</Label>
                <Input
                  id="slippage"
                  type="number"
                  step="0.1"
                  placeholder="0.5"
                  value={slippage}
                  onChange={e => setSlippage(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Button
                  onClick={handleApprove}
                  disabled={!amount || !account || isProcessing}
                  variant="outline"
                  className="w-full"
                >
                  {isProcessing ? 'Processing...' : '1. Approve Token'}
                </Button>
                <Button
                  onClick={handleSell}
                  disabled={!amount || !account || isProcessing}
                  className="w-full"
                >
                  {isProcessing ? 'Processing...' : '2. Sell Token'}
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
};
