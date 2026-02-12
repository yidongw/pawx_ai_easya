import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Flatter ProfileUpdate type with key
export type ProfileUpdate = { key: string; old: any; new: any; time: Date };

type ProfileUpdatesState = {
  updates: Record<string, ProfileUpdate[]>;
  addProfileUpdates: (userId: string, changes: Record<string, { old: any; new: any }>) => void;
  clearProfileUpdates: (userId: string) => void;
  clearAllProfileUpdates: () => void;
};

export const useProfileUpdatesStore = create<ProfileUpdatesState>()(
  persist(
    set => ({
      updates: {},
      addProfileUpdates: (userId, changes) => set((state: ProfileUpdatesState) => {
        const userUpdates = state.updates[userId] || [];
        let newUserUpdates = [...userUpdates];
        Object.entries(changes).forEach(([key, value]) => {
          if (key === 'lastTweetId' || key === 'statusesCount') {
            return;
          }
          // Remove any existing update with the same key and new value
          newUserUpdates = newUserUpdates.filter(u => !(u.key === key && u.new === value.new));
          // Add the new update to the front
          newUserUpdates = [
            { key, old: value.old, new: value.new, time: new Date() },
            ...newUserUpdates,
          ];
        });
        return {
          updates: {
            ...state.updates,
            [userId]: newUserUpdates,
          },
        };
      }),
      clearProfileUpdates: userId => set((state) => {
        const updates = { ...state.updates };
        delete updates[userId];
        return { updates };
      }),
      clearAllProfileUpdates: () => set({ updates: {} }),
    }),
    {
      name: 'profile-updates-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({ updates: state.updates }),
    },
  ),
);
