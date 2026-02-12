'use client';

import type { TwitterStatus, TwitterUser } from '@/types/twitter';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { fetchApi } from '@/libs/api';
import { Env } from '@/libs/Env';
import { useAuthStore } from '@/store/authStore';
import { useMonitorColumnsStore } from '@/store/monitorColumnsStore';
import { useProfileUpdatesStore } from '@/store/profileUpdatesStore';
import { useStatusUpdateStore } from '@/store/statusUpdateStore';
import { useTwitterUsersStore } from '@/store/twitterUsersStore';
import React from 'react';
import { toast } from 'sonner';
import { Tweet } from '../tweet/Tweet';
import { MonitorColumnNavBarMultiUser } from './MonitorColumnNavBarMultiUser';
import { ProfileChange } from './ProfileChange';

type MonitorColumnMultiUserProps = {
  columnId: string;
  columnName: string;
  usernames: string[];
  className?: string;
};

export const MonitorColumnMultiUser: React.FC<MonitorColumnMultiUserProps> = ({
  columnId,
  columnName,
  usernames,
  className,
}) => {
  const { columns, addUsernameToColumn, removeUsernameFromColumn } = useMonitorColumnsStore();
  const { users } = useTwitterUsersStore();
  const { updates: profileUpdates } = useProfileUpdatesStore();
  const { statuses: statusUpdates } = useStatusUpdateStore();
  const { subscribeToUser, unsubscribeToUser, isConnected } = useWebSocket();
  const { clientId } = useAuthStore();

  const handleAddUser = async (username: string) => {
    if (!isConnected) {
      toast.error('Not connected to server. Please try again.');
      return;
    }

    // Check if user is already in this column
    if (usernames.some(u => u.toLowerCase() === username.toLowerCase())) {
      toast.error('User is already in this column.');
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

      // Check if user is already subscribed in another column
      const isUserInOtherColumns = columns.some(col =>
        col.id !== columnId && col.usernames.some(u => u.toLowerCase() === username.toLowerCase()),
      );

      // Only subscribe if not already subscribed elsewhere
      if (!isUserInOtherColumns) {
        subscribeToUser(username);
      }

      // Add username to this column
      addUsernameToColumn(columnId, username);
      toast.success(`Added @${username} to column`);
    } catch (error) {
      console.error('Failed to add user:', error);
      toast.error('Failed to add user. Please try again.');
    }
  };

  const handleRemoveUser = (username: string) => {
    if (!isConnected) {
      toast.error('Not connected to server.');
      return;
    }

    // Check if other columns are subscribed to the same user
    const otherColumns = columns.filter(col => col.id !== columnId);
    const isUserInOtherColumns = otherColumns.some(col =>
      col.usernames.some(u => u.toLowerCase() === username.toLowerCase()),
    );

    // If this is the only column subscribed to this user, unsubscribe
    if (!isUserInOtherColumns) {
      unsubscribeToUser(username);
    }

    // Remove username from this column
    removeUsernameFromColumn(columnId, username);
    toast.success(`Removed @${username} from column`);
  };

  // Gather all statuses and profile updates for all usernames in this column
  const allStatuses: { type: 'status'; status: TwitterStatus; time: Date; id: string; twitterUser: TwitterUser }[] = [];
  const allProfileChanges: { type: 'profileChange'; change: { key: string; old: any; new: any; time: Date; username: string }; time: Date; id: string; twitterUser: TwitterUser }[] = [];

  usernames.forEach((username) => {
    // Find userId by username
    const user = Object.values(users).find(u => u.screenName.toLowerCase() === username.toLowerCase());
    if (!user) {
      return;
    }
    const userId = user.id;
    // Statuses
    const userStatuses = statusUpdates[userId] || [];
    userStatuses.forEach((status) => {
      allStatuses.push({ type: 'status', status, time: new Date(status.createdAt), id: status.id, twitterUser: user });
    });
    // Profile changes (now flat array)
    const userProfileUpdates = profileUpdates[userId] || [];
    userProfileUpdates.forEach((update) => {
      if (update.key !== 'lastTweetId' && update.key !== 'statusesCount') {
        allProfileChanges.push({
          type: 'profileChange',
          change: { key: update.key, old: update.old, new: update.new, time: update.time, username },
          time: new Date(update.time),
          id: update.key + update.new + new Date(update.time).toISOString() + username,
          twitterUser: user,
        });
      }
    });
  });

  // Combine and sort all updates by time descending
  const allUpdates = [...allStatuses, ...allProfileChanges].sort((a, b) => b.time.getTime() - a.time.getTime());

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-800 shadow overflow-hidden min-w-0 border-l-3 border-r-3 border-gray-200 dark:border-gray-700 ${className || ''}`}>
      <MonitorColumnNavBarMultiUser
        columnName={columnName}
        usernames={usernames}
        onAddUser={handleAddUser}
        onRemoveUser={handleRemoveUser}
      />
      <div className="flex-1 h-0 min-w-0 overflow-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
        <div className="min-w-0">
          {allUpdates.length === 0
            ? (
                <div className="text-gray-400 dark:text-gray-500 text-center p-4">
                  {usernames.length === 0
                    ? 'Add users to start monitoring'
                    : 'No updates yet'}
                </div>
              )
            : (
                allUpdates.map(update =>
                  update.type === 'status'
                    ? (
                        <div key={update.id} className="border-b-2 border-gray-200 dark:border-gray-700">
                          <Tweet tweet={update.status} twitterUser={update.twitterUser} />
                        </div>
                      )
                    : (
                        <div key={update.id} className="border-b-2 border-gray-200 dark:border-gray-700">
                          <ProfileChange change={update.change} user={update.twitterUser} />
                        </div>
                      ),
                )
              )}
        </div>
      </div>
    </div>
  );
};
