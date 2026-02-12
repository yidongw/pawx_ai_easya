'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { usePathname } from 'next/navigation';

export const StatusIndicator = () => {
  const { isConnected, connect } = useWebSocket();
  const pathname = usePathname();
  const isMonitorPage = pathname === '/monitor' || pathname === '/sniper';

  // Don't render if not on monitor page
  if (!isMonitorPage) {
    return null;
  }

  const handleClick = () => {
    if (!isConnected) {
      connect();
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClick}
            // disabled={isConnected}
            className="flex items-center gap-2"
            aria-label={isConnected ? 'WebSocket is connected' : 'Click to connect WebSocket'}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isConnected ? 'Connected' : 'Disconnected. Click to connect'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
