import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import React, { useEffect, useState } from 'react';

function formatTime(date: Date | string | undefined) {
  if (!date) {
    return '';
  }
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Within 24 hours, show relative time
  if (diffDays < 1) {
    if (diffMinutes < 1) {
      return `${diffSeconds}s`;
    } else if (diffHours < 1) {
      return `${diffMinutes}m`;
    } else {
      return `${diffHours}h`;
    }
  } else {
    // Show date only for older tweets
    return d.toLocaleDateString();
  }
}

function getExactTime(date: Date | string | undefined) {
  if (!date) {
    return '';
  }
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString();
}

type CountdownTimerProps = {
  date: Date | string | undefined;
  className?: string;
};

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ date, className = '' }) => {
  const [timeString, setTimeString] = useState(() => formatTime(date));

  useEffect(() => {
    if (!date) {
      return;
    }

    // Update immediately
    setTimeString(formatTime(date));

    // Set up interval to update every second for recent times, every minute for older times
    const updateInterval = () => {
      const d = typeof date === 'string' ? new Date(date) : date;
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      // Update every second if less than 1 hour, every minute if less than 24 hours, otherwise no need to update
      if (diffMinutes < 60) {
        return 1000; // 1 second
      } else if (diffMinutes < 24 * 60) {
        return 60 * 1000; // 1 minute
      } else {
        return null; // No need to update for dates older than 24 hours
      }
    };

    const interval = updateInterval();
    if (interval) {
      const timer = setInterval(() => {
        setTimeString(formatTime(date));
      }, interval);

      return () => clearInterval(timer);
    }

    return () => {}; // Return empty cleanup function for cases where no interval is set
  }, [date]);

  if (!date) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={className}>
            {timeString}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getExactTime(date)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
