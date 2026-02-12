import type { TwitterStatus, UserUpdateMessage } from '@/types/twitter';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useTwitterUsersStore } from './twitterUsersStore';

type UserUpdate = {
  userId: string;
  changes: Record<string, { old: any; new: any }>;
  status: TwitterStatus;
  timestamp: Date;
};

type UserUpdatesState = {
  updates: Record<string, UserUpdate[]>;
  addUpdate: (update: UserUpdateMessage['data']) => void;
  clearUpdates: (userId: string) => void;
  clearAllUpdates: () => void;
};

const MAX_UPDATES_PER_USER = 20;

export const useUserUpdatesStore = create<UserUpdatesState>()(
  persist(
    set => ({
      updates: {},
      addUpdate: update =>
        set((state) => {
          const userId = update.twitterUser.id;
          const newUpdate: UserUpdate = {
            userId,
            changes: update.changes,
            status: update.status,
            timestamp: new Date(),
          };

          // Update the user in the Twitter users store
          useTwitterUsersStore.getState().setUser(update.twitterUser);

          const currentUpdates = state.updates[userId] || [];
          const updatedList = [newUpdate, ...currentUpdates].slice(0, MAX_UPDATES_PER_USER);

          return {
            updates: {
              ...state.updates,
              [userId]: updatedList,
            },
          };
        }),
      clearUpdates: userId =>
        set(state => ({
          updates: {
            ...state.updates,
            [userId]: [],
          },
        })),
      clearAllUpdates: () => set({ updates: {} }),
    }),
    {
      name: 'user-updates-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        updates: state.updates,
      }),
    },
  ),
);
