// src/components/profileDetails/RightColumnTabs.tsx
'use client';

import type { ProfileDetailsData } from '@/app/[locale]/(marketing)/profiles/[username]/types';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Coins, History, Users } from 'lucide-react';
import React from 'react';
import PastUsernamesSection from './PastUsernamesSection';
import ProfileHistorySection from './ProfileHistorySection';
import UserCasSection from './UserCasSection';

type TabType = 'contracts' | 'profile' | 'usernames' | '';

const tabButtonStyle = (isActive: boolean): string => (
  `p-2 w-[70px] flex items-center justify-center gap-2 cursor-pointer mr-2 border-b-4 transition-all duration-200 ${
    isActive
      ? 'border-orange-500 text-black dark:text-white'
      : 'border-transparent text-gray-500 dark:text-gray-400'
  }`
);

const badgeStyle = 'bg-gray-600 dark:bg-gray-700 text-gray-200 dark:text-gray-300 rounded-full px-2 py-0.5 text-xs ml-1 align-middle';

// 1. Tab Buttons Component
export const RightColumnTabButtons: React.FC<{
  userCas: ProfileDetailsData['userCas'];
  profileHistory: ProfileDetailsData['profileHistory'];
  pastUsernames: ProfileDetailsData['pastUsernames'];
  activeTab: TabType;
  isActive?: boolean;
  onTabChange: (tab: TabType) => void;
}> = ({
  userCas,
  profileHistory,
  pastUsernames,
  activeTab,
  isActive = true,
  onTabChange,
}) => (
  <TooltipProvider delayDuration={0}>
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={tabButtonStyle(isActive && activeTab === 'contracts')}
          onClick={() => onTabChange('contracts')}
        >
          <Coins size={18} />
          <span className={badgeStyle}>{userCas?.length || 0}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent>Token Contracts</TooltipContent>
    </Tooltip>

    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={tabButtonStyle(isActive && activeTab === 'profile')}
          onClick={() => onTabChange('profile')}
        >
          <History size={18} />
          <span className={badgeStyle}>{profileHistory?.length || 0}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent>Profile Updates</TooltipContent>
    </Tooltip>

    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={tabButtonStyle(isActive && activeTab === 'usernames')}
          onClick={() => onTabChange('usernames')}
        >
          <Users size={18} />
          <span className={badgeStyle}>{pastUsernames?.length || 0}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent>Past Usernames</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

// 2. Content Component
export const RightColumnContent: React.FC<{
  activeTab: TabType;
  profileHistory: ProfileDetailsData['profileHistory'];
  pastUsernames: ProfileDetailsData['pastUsernames'];
  userCas: ProfileDetailsData['userCas'];
}> = ({
  activeTab,
  profileHistory,
  pastUsernames,
  userCas,
}) => {
  if (activeTab === 'contracts') {
    return <UserCasSection cas={userCas} />;
  }

  if (activeTab === 'profile') {
    return <ProfileHistorySection history={profileHistory} />;
  }

  if (activeTab === 'usernames') {
    return <PastUsernamesSection usernames={pastUsernames} />;
  }

  return <div className="mb-4 text-gray-500 dark:text-gray-400 text-center">No content available</div>;
};

// 3. Skeleton Component
export const RightColumnTabsSkeleton: React.FC = () => {
  return (
    <div className="rounded-xl border border-gray-700 dark:border-gray-600 shadow-lg">
      <div className="mb-4 border-b border-gray-700 dark:border-gray-600 flex min-w-[240px]">
        <div className="h-11 w-[70px] mr-2 flex items-center justify-center gap-1 rounded-t-md border-b-2 border-gray-600 dark:border-gray-500">
          <Skeleton className="h-[18px] w-[18px] bg-gray-600 dark:bg-gray-700 rounded" />
          <Skeleton className="h-4 w-6 bg-gray-600 dark:bg-gray-700 rounded-full" />
        </div>
        <div className="h-11 w-[70px] mr-2 flex items-center justify-center gap-1 rounded-t-md">
          <Skeleton className="h-[18px] w-[18px] bg-gray-600 dark:bg-gray-700 rounded" />
          <Skeleton className="h-4 w-6 bg-gray-600 dark:bg-gray-700 rounded-full" />
        </div>
        <div className="h-11 w-[70px] mr-2 flex items-center justify-center gap-1 rounded-t-md">
          <Skeleton className="h-[18px] w-[18px] bg-gray-600 dark:bg-gray-700 rounded" />
          <Skeleton className="h-4 w-6 bg-gray-600 dark:bg-gray-700 rounded-full" />
        </div>
      </div>
      <div>
        <Skeleton className="h-[150px] w-full mt-4 bg-gray-800 dark:bg-gray-700" />
      </div>
    </div>
  );
};

// 4. Main Component
type RightColumnTabsProps = {
  profileHistory: ProfileDetailsData['profileHistory'];
  pastUsernames: ProfileDetailsData['pastUsernames'];
  userCas: ProfileDetailsData['userCas'];
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
};

const RightColumnTabs: React.FC<RightColumnTabsProps> = ({
  profileHistory,
  pastUsernames,
  userCas,
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="rounded-xl border border-gray-700 dark:border-gray-600 shadow-lg flex flex-col max-h-[calc(100vh-80px)]">
      <div className="mb-4 border-b border-gray-700 dark:border-gray-600 flex shrink-0">
        <RightColumnTabButtons
          userCas={userCas}
          profileHistory={profileHistory}
          pastUsernames={pastUsernames}
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        <ScrollArea>
          <RightColumnContent
            activeTab={activeTab}
            profileHistory={profileHistory}
            pastUsernames={pastUsernames}
            userCas={userCas}
          />
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>
    </div>
  );
};

export default RightColumnTabs;
