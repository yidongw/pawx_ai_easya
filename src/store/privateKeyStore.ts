import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type PrivateKeyState = {
  encryptedKey: string | null;
  setPrivateKey: (key: string) => void;
  clearPrivateKey: () => void;
};

export const usePrivateKeyStore = create<PrivateKeyState>()(
  persist(
    set => ({
      encryptedKey: null,
      setPrivateKey: key => set({ encryptedKey: key }),
      clearPrivateKey: () => set({ encryptedKey: null }),
    }),
    {
      name: 'private-key-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
