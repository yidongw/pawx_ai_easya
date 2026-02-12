'use client';

import { Turnstile } from '@marsidev/react-turnstile';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

type TurnstileChallengeProps = {
  siteKey: string;
  onError?: () => void;
  size?: 'normal' | 'invisible';
  validateToken: (token: string) => Promise<void>;
  refreshInterval?: number; // in milliseconds
};

export default function TurnstileChallenge({
  siteKey,
  onError,
  size = 'normal',
  validateToken,
  refreshInterval,
}: TurnstileChallengeProps) {
  const [refreshKey, setRefreshKey] = useState(() => uuidv4());
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (!refreshInterval) {
      return;
    }

    const interval = setInterval(() => {
      setRefreshKey(uuidv4());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const handleExpired = () => {
    setRefreshKey(uuidv4());
  };

  const handleError = () => {
    setRefreshKey(uuidv4());
    onError?.();
  };

  const handleToken = async (token: string) => {
    setIsValidating(true);
    try {
      await validateToken(token);
    } catch {
      handleExpired();
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <Turnstile
        id={refreshKey}
        siteKey={siteKey}
        onSuccess={(token) => {
          if (token) {
            handleToken(token);
          }
        }}
        onError={handleError}
        onExpire={handleExpired}
        options={{
          theme: 'auto',
          size,
        }}
      />
      {isValidating && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Validating...
        </p>
      )}
    </div>
  );
}
