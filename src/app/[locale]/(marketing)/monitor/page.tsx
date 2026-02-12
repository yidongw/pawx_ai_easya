'use client';

import { MonitorColumn } from '@/components/monitor/MonitorColumn';
import { MonitorColumnDefault } from '@/components/monitor/MonitorColumnDefault';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { fetchApi } from '@/libs/api';
import { Env } from '@/libs/Env';
import { useAuthStore } from '@/store/authStore';
import { useMonitorColumnsStore } from '@/store/monitorColumnsStore';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export default function MonitorPage() {
  const { subscribeToUser, isConnected } = useWebSocket();
  const { columns, addColumn } = useMonitorColumnsStore();
  const { clientId } = useAuthStore();

  const handleAddColumn = async (username: string) => {
    if (columns.length >= 10) {
      return;
    }

    if (!isConnected) {
      toast.error('Not connected to server. Please try again.');
      return;
    }

    try {
      // Check subscription limit before subscribing
      const response = await fetchApi(`${Env.NEXT_PUBLIC_API_HOST}/api/v1/subscription/check-limit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          twitterUsername: username,
        }),
      });

      const result = await response.json();

      if (!result.data.canAddSubscription) {
        if (!result.data.twitterUserExists) {
          toast.error('Twitter user does not exist.');
          return;
        }

        // Subscription limit reached
        toast.error(`Subscription limit reached. You can only monitor ${result.data.subLimit} users.`);
        return;
      }

      // If we can subscribe, proceed with the subscription
      subscribeToUser(username);
      addColumn({
        id: uuidv4(),
        name: username,
        usernames: [username],
      });
    } catch (error) {
      console.error('Failed to check subscription limit:', error);
      toast.error('Failed to check subscription limit. Please try again.');
    }
  };

  return (
    <div className="flex flex-row h-[calc(100vh-84px)] w-full overflow-x-auto bg-gray-100 dark:bg-gray-500">
      {columns.map(column => (
        <div key={column.id} className="h-full flex flex-col">
          <MonitorColumn
            columnId={column.id}
            columnName={column.name}
            usernames={column.usernames}
            className="w-85"
          />
        </div>
      ))}
      <div className="h-full flex flex-col">
        <MonitorColumnDefault onAdd={handleAddColumn} />
      </div>
    </div>
  );
}
