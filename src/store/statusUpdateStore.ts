import type { Token, TwitterStatus } from '@/types/twitter';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type StatusUpdateState = {
  statuses: Record<string, TwitterStatus[]>;
  addStatusUpdate: (userId: string, status: TwitterStatus) => void;
  addTokenToStatus: (statusId: string, token: Token) => void;
  clearStatusUpdates: (userId: string) => void;
  clearAllStatusUpdates: () => void;
};

export const useStatusUpdateStore = create<StatusUpdateState>()(
  persist(
    set => ({
      statuses: {},
      addStatusUpdate: (userId, status) => set((state) => {
        const arr = state.statuses[userId] || [];
        if (arr.some(s => s.id === status.id)) {
          return {};
        }
        return {
          statuses: {
            ...state.statuses,
            [userId]: [status, ...arr],
          },
        };
      }),
      addTokenToStatus: (statusId, token) => set((state) => {
        const updatedStatuses = { ...state.statuses };
        let statusFound = false;

        // Find the status across all users and add the token
        Object.keys(updatedStatuses).forEach((userId) => {
          const userStatuses = updatedStatuses[userId];
          if (!userStatuses) {
            return;
          }

          updatedStatuses[userId] = userStatuses.map((status) => {
            if (status.id === statusId) {
              statusFound = true;
              const existingTokens = status.tokens || [];
              // Check if token already exists (by ca)
              const tokenExists = existingTokens.some(t => t.ca === token.ca);
              if (tokenExists) {
                // Update existing token
                return {
                  ...status,
                  tokens: existingTokens.map(t =>
                    t.ca === token.ca ? token : t,
                  ),
                };
              }
              // Add new token
              return {
                ...status,
                tokens: [...existingTokens, token],
              };
            }
            return status;
          });
        });

        return statusFound ? { statuses: updatedStatuses } : {};
      }),
      clearStatusUpdates: userId => set((state) => {
        const statuses = { ...state.statuses };
        delete statuses[userId];
        return { statuses };
      }),
      clearAllStatusUpdates: () => set({ statuses: {} }),
    }),
    {
      name: 'status-updates-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({ statuses: state.statuses }),
    },
  ),
);
