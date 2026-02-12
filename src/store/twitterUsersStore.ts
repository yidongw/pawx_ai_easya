import type { TwitterUser } from '@/types/twitter';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type TwitterUsersState = {
  users: Record<string, TwitterUser>;
  setUser: (user: TwitterUser) => void;
  removeUser: (userId: string) => void;
  clearUsers: () => void;
};

export const useTwitterUsersStore = create<TwitterUsersState>()(
  persist(
    set => ({
      users: {},
      setUser: user =>
        set(state => ({
          users: {
            ...state.users,
            [user.id]: user,
          },
        })),
      removeUser: userId =>
        set((state) => {
          const { [userId]: _, ...rest } = state.users;
          return { users: rest };
        }),
      clearUsers: () => set({ users: {} }),
    }),
    {
      name: 'twitter-users-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        users: state.users,
      }),
    },
  ),
);
