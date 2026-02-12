import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type AuthState = {
  token: string | null;
  clientId: string;
  walletInfo: WalletInfo | null;
  selectedChain: 'BSC' | 'SOLANA';
  setToken: (token: string | null) => void;
  setClientId: (clientId: string) => void;
  setWalletInfo: (walletInfo: WalletInfo | null) => void;
  setSelectedChain: (chain: 'BSC' | 'SOLANA') => void;
  clearWalletInfo: () => void;
};

export type WalletInfo = {
  userId: string;
  evmAddress: string;
  solAddress: string;
};

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      token: null,
      clientId: uuidv4(), // Initial clientId will be generated if not found in storage
      walletInfo: null,
      selectedChain: 'BSC',
      setToken: token => set({ token }),
      setClientId: clientId => set({ clientId }),
      setWalletInfo: walletInfo => set({ walletInfo }),
      setSelectedChain: chain => set({ selectedChain: chain }),
      clearWalletInfo: () => set({ walletInfo: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        clientId: state.clientId,
        token: state.token,
        walletInfo: state.walletInfo,
        selectedChain: state.selectedChain,
      }),
    },
  ),
);
