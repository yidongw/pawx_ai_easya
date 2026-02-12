import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type TokenData = {
  token_address: string;
  name: string;
  symbol: string;
  chainId: number;
  // Additional fields for future extension
  pair_address?: string;
  dex?: string;
  price_usd?: string;
  liquidity_usd?: number;
  volume_24h?: number;
  txns_24h_total?: number;
  risk_score?: number;
  dex_url?: string;
};

type TokenState = {
  tokens: Record<string, TokenData>; // key: chainId-ca
  selectedTokenKey: string | null;
  setSelectedToken: (token: TokenData) => void;
  setSelectedTokenByKey: (key: string) => void;
  getSelectedToken: () => TokenData | null;
  updateToken: (token: TokenData) => void;
  clearSelection: () => void;
};

// Default tokens
const DEFAULT_MACROHARD: TokenData = {
  token_address: '0x4444536331BAD0C0b9C1D7Dc74b00632926de675',
  pair_address: '0x72f698D628Bd5a4e867C99A6680613b7425cE1C9',
  name: 'Macrohard',
  symbol: 'MACROHARD',
  chainId: 56, // BSC
  dex: 'pancakeswap',
  price_usd: '0.004133',
  liquidity_usd: 899144.79,
  volume_24h: 3525645.58,
  txns_24h_total: 7479,
  risk_score: 9,
  dex_url: 'https://dexscreener.com/bsc/0x72f698d628bd5a4e867c99a6680613b7425ce1c9',
};

const DEFAULT_WBNB: TokenData = {
  token_address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  name: 'Wrapped BNB',
  symbol: 'WBNB',
  chainId: 56,
  dex: 'pancakeswap',
  price_usd: '635.24',
  liquidity_usd: 2500000000,
  volume_24h: 850000000,
  txns_24h_total: 125000,
  risk_score: 5,
  dex_url: 'https://dexscreener.com/bsc/0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
};

const DEFAULT_CAKE: TokenData = {
  token_address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
  name: 'PancakeSwap Token',
  symbol: 'CAKE',
  chainId: 56,
  dex: 'pancakeswap',
  price_usd: '2.45',
  liquidity_usd: 180000000,
  volume_24h: 45000000,
  txns_24h_total: 35000,
  risk_score: 8,
  dex_url: 'https://dexscreener.com/bsc/0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82',
};

const DEFAULT_USDT_BSC: TokenData = {
  token_address: '0x55d398326f99059fF775485246999027B3197955',
  name: 'Tether USD',
  symbol: 'USDT',
  chainId: 56,
  dex: 'pancakeswap',
  price_usd: '1.00',
  liquidity_usd: 1200000000,
  volume_24h: 520000000,
  txns_24h_total: 95000,
  risk_score: 5,
  dex_url: 'https://dexscreener.com/bsc/0x55d398326f99059ff775485246999027b3197955',
};

const DEFAULT_BUSD: TokenData = {
  token_address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
  name: 'Binance USD',
  symbol: 'BUSD',
  chainId: 56,
  dex: 'pancakeswap',
  price_usd: '1.00',
  liquidity_usd: 950000000,
  volume_24h: 380000000,
  txns_24h_total: 78000,
  risk_score: 5,
  dex_url: 'https://dexscreener.com/bsc/0xe9e7cea3dedca5984780bafc599bd69add087d56',
};

const DEFAULT_SAFEMOON: TokenData = {
  token_address: '0x42981d0bfbAf196529376EE702F2a9Eb9092fcB5',
  name: 'SafeMoon',
  symbol: 'SFM',
  chainId: 56,
  dex: 'pancakeswap',
  price_usd: '0.000245',
  liquidity_usd: 25000000,
  volume_24h: 8500000,
  txns_24h_total: 12000,
  risk_score: 45,
  dex_url: 'https://dexscreener.com/bsc/0x42981d0bfbaf196529376ee702f2a9eb9092fcb5',
};

const DEFAULT_BABYDOGE: TokenData = {
  token_address: '0xc748673057861a797275CD8A068AbB95A902e8de',
  name: 'Baby Doge Coin',
  symbol: 'BABYDOGE',
  chainId: 56,
  dex: 'pancakeswap',
  price_usd: '0.0000000018',
  liquidity_usd: 18000000,
  volume_24h: 6200000,
  txns_24h_total: 9500,
  risk_score: 38,
  dex_url: 'https://dexscreener.com/bsc/0xc748673057861a797275cd8a068abb95a902e8de',
};

const DEFAULT_WETH_ETH: TokenData = {
  token_address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  name: 'Wrapped Ether',
  symbol: 'WETH',
  chainId: 1, // Ethereum
  dex: 'uniswap',
  price_usd: '3450.82',
  liquidity_usd: 5200000000,
  volume_24h: 1200000000,
  txns_24h_total: 185000,
  risk_score: 5,
  dex_url: 'https://dexscreener.com/ethereum/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
};

const DEFAULT_PEPE: TokenData = {
  token_address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
  name: 'Pepe',
  symbol: 'PEPE',
  chainId: 1, // Ethereum
  dex: 'uniswap',
  price_usd: '0.00000125',
  liquidity_usd: 320000000,
  volume_24h: 95000000,
  txns_24h_total: 42000,
  risk_score: 25,
  dex_url: 'https://dexscreener.com/ethereum/0x6982508145454ce325ddbe47a25d4ec3d2311933',
};

const DEFAULT_SHIB: TokenData = {
  token_address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
  name: 'Shiba Inu',
  symbol: 'SHIB',
  chainId: 1, // Ethereum
  dex: 'uniswap',
  price_usd: '0.00000875',
  liquidity_usd: 450000000,
  volume_24h: 125000000,
  txns_24h_total: 58000,
  risk_score: 18,
  dex_url: 'https://dexscreener.com/ethereum/0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce',
};

const DEFAULT_TOKENS: Record<string, TokenData> = {
  // BSC Tokens
  '56-0x4444536331BAD0C0b9C1D7Dc74b00632926de675': DEFAULT_MACROHARD,
  '56-0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c': DEFAULT_WBNB,
  '56-0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82': DEFAULT_CAKE,
  '56-0x55d398326f99059fF775485246999027B3197955': DEFAULT_USDT_BSC,
  '56-0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56': DEFAULT_BUSD,
  '56-0x42981d0bfbAf196529376EE702F2a9Eb9092fcB5': DEFAULT_SAFEMOON,
  '56-0xc748673057861a797275CD8A068AbB95A902e8de': DEFAULT_BABYDOGE,
  // Ethereum Tokens
  '1-0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': DEFAULT_WETH_ETH,
  '1-0x6982508145454Ce325dDbE47a25d4ec3d2311933': DEFAULT_PEPE,
  '1-0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE': DEFAULT_SHIB,
};

export const useTokenStore = create<TokenState>()(
  persist(
    (set, get) => ({
      tokens: DEFAULT_TOKENS,
      selectedTokenKey: '56-0x4444536331BAD0C0b9C1D7Dc74b00632926de675', // Default to MACROHARD
      setSelectedToken: (token: TokenData) => {
        const key = `${token.chainId}-${token.token_address}`;
        set(state => ({
          tokens: {
            ...state.tokens,
            [key]: token,
          },
          selectedTokenKey: key,
        }));
      },
      setSelectedTokenByKey: (key: string) => {
        set({ selectedTokenKey: key });
      },
      getSelectedToken: () => {
        const state = get();
        if (!state.selectedTokenKey) {
          return null;
        }
        return state.tokens[state.selectedTokenKey] || null;
      },
      updateToken: (token: TokenData) => {
        const key = `${token.chainId}-${token.token_address}`;
        set(state => ({
          tokens: {
            ...state.tokens,
            [key]: token,
          },
        }));
      },
      clearSelection: () => {
        set({ selectedTokenKey: null });
      },
    }),
    {
      name: 'token-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
