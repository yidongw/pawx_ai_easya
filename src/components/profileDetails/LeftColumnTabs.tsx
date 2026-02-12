// src/components/profileDetails/LeftColumnTabs.tsx
'use client';

import type { ProfileDetailsData } from '@/app/[locale]/(marketing)/profiles/[username]/types';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import React from 'react';
import FollowersSection from './FollowersSection';
import FollowingsSection from './FollowingsSection';
import StatusHistorySection from './StatusHistorySection';

type TabType = 'followings' | 'followers' | 'status' | '';

const tabButtonStyle = (isActive: boolean): string => (
  `px-4 py-2 text-base cursor-pointer mr-4 border-b-4 ${
    isActive
      ? 'border-orange-500 text-black dark:text-white'
      : 'border-transparent text-gray-500 dark:text-gray-400'
  }`
);

// 1. Tab Buttons Component
export const LeftColumnTabButtons: React.FC<{
  showFollowings: boolean;
  hasStatusHistory: boolean;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}> = ({
  showFollowings,
  activeTab,
  onTabChange,
}) => (
  <>
    {showFollowings && (
      <button
        type="button"
        className={tabButtonStyle(activeTab === 'followings')}
        onClick={() => onTabChange('followings')}
      >
        Followings
      </button>
    )}
    <button
      type="button"
      className={tabButtonStyle(activeTab === 'followers')}
      onClick={() => onTabChange('followers')}
    >
      Key Followers
    </button>
    <button
      type="button"
      className={tabButtonStyle(activeTab === 'status')}
      onClick={() => onTabChange('status')}
    >
      Status History
    </button>
  </>
);

// 2. Content Component
export const LeftColumnContent: React.FC<{
  activeTab: TabType;
  followings: ProfileDetailsData['followings'];
  followers: ProfileDetailsData['followers'];
  statusHistory: ProfileDetailsData['statusHistory'];
  locale: string;
  showFollowings: boolean;
}> = ({
  activeTab,
  followings,
  followers,
  statusHistory,
  locale,
  showFollowings,
}) => {
  if (activeTab === 'followings' && showFollowings) {
    return <FollowingsSection followings={followings} locale={locale} />;
  }

  if (activeTab === 'followers') {
    return <FollowersSection followers={followers} locale={locale} />;
  }

  if (activeTab === 'status') {
    return <StatusHistorySection history={statusHistory} />;
  }

  return <div className="mb-4 text-gray-500 dark:text-gray-400 text-center">No content available</div>;
};

// 3. Skeleton Component
export const LeftColumnTabsSkeleton: React.FC = () => {
  return (
    <div className="rounded-xl border border-gray-700 dark:border-gray-600 shadow-lg">
      <div className="mb-4 border-b border-gray-700 dark:border-gray-600 flex items-center">
        <Skeleton className="h-10 w-24 mr-4 border-b-2 border-gray-600 dark:border-gray-500" />
        <Skeleton className="h-10 w-24 mr-4" />
        <Skeleton className="h-10 w-24 mr-4" />
      </div>
      <div>
        <Skeleton className="h-48 w-full mt-4 bg-gray-800 dark:bg-gray-700" />
      </div>
    </div>
  );
};

// 4. Main Component
type LeftColumnTabsProps = {
  followings: ProfileDetailsData['followings'];
  followers: ProfileDetailsData['followers'];
  statusHistory: ProfileDetailsData['statusHistory'];
  locale: string;
  isKol: boolean;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
};

const LeftColumnTabs: React.FC<LeftColumnTabsProps> = ({
  followings,
  followers,
  statusHistory,
  locale,
  isKol,
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="rounded-xl border border-gray-700 dark:border-gray-600 shadow-lg flex flex-col max-h-[calc(100vh-80px)]">
      <div className="mb-4 border-b border-gray-700 dark:border-gray-600 flex shrink-0">
        <LeftColumnTabButtons
          showFollowings={isKol}
          hasStatusHistory={!!statusHistory}
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        <ScrollArea>
          <LeftColumnContent
            showFollowings={isKol}
            activeTab={activeTab}
            followings={followings}
            followers={followers}
            statusHistory={statusHistory}
            locale={locale}
          />
          <ScrollBar orientation="horizontal" />
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>
    </div>
  );
};

export default LeftColumnTabs;
