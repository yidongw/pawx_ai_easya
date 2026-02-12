'use client';

import { useWebSocket } from '@/contexts/WebSocketContext';

import { fetchApi } from '@/libs/api';
import { Env } from '@/libs/Env';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';
import TurnstileChallenge from './TurnstileChallenge';

type TurnstileProtectionProps = {
  invisibleSiteKey: string;
  managedSiteKey: string;
  children: React.ReactNode;
};

export default function TurnstileProtection({ invisibleSiteKey, managedSiteKey, children }: TurnstileProtectionProps) {
  const { token, setToken } = useAuthStore();
  const { isConnected, isVerified, verifyTurnstile } = useWebSocket();

  // ByPass Security Check
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !token) {
      setToken('dev-token-bypass');
    }
  }, [token, setToken]);

  const validateInvisibleToken = async (token: string) => {
    verifyTurnstile('invisible_turnstile_verify', token);
  };

  const validateWithApi = async (token: string) => {
    const response = await fetchApi(`${Env.NEXT_PUBLIC_API_HOST}/api/v1/turnstile/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
    const data = await response.json();
    if (data.success) {
      setToken(data.token);
    } else {
      throw new Error('Validation failed');
    }
  };

  const validateManagedToken = async (token: string) => {
    if (isVerified) {
      await validateWithApi(token);
    } else {
      verifyTurnstile('turnstile_verify', token);
    }
  };

  return (
    <>
      {/* Always render invisible turnstile */}
      <div className="hidden">
        <TurnstileChallenge
          siteKey={invisibleSiteKey}
          size="invisible"
          validateToken={validateInvisibleToken}
          refreshInterval={isConnected ? 5000 : 0}
        />
      </div>

      {/* Show managed turnstile when needed */}
      {(!isVerified || !token) && (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
            <h1 className="mb-6 text-center text-2xl font-bold">Security Check</h1>
            <p className="mb-6 text-center text-muted-foreground">
              Please complete the security challenge to continue.
            </p>
            <TurnstileChallenge
              siteKey={managedSiteKey}
              size="normal"
              validateToken={validateManagedToken}
            />
          </div>
        </div>
      )}

      {/* Show children only when verified and managed turnstile is not shown */}
      {token && isVerified && <>{children}</>}
    </>
  );
}
