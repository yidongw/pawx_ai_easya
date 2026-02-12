import { createContext, use } from 'react';

export type WebSocketContextType = {
  isConnected: boolean;
  isVerified: boolean;
  connectionError: string | null;
  verifyTurnstile: (type: 'turnstile_verify' | 'invisible_turnstile_verify', token: string) => void;
  subscribeToUser: (twitterUsername: string) => void;
  unsubscribeToUser: (twitterUsername: string) => void;
  connect: () => void;
};

export const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function useWebSocket() {
  const context = use(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
