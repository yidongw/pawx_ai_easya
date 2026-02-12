// src/components/profileDetails/CombinedTabs.tsx
'use client';

import type { ProfileDetailsData } from '@/app/[locale]/(marketing)/profiles/[username]/types';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import React, { useState } from 'react';
import { Skeleton } from '../ui/skeleton';
import styles from './CombinedTabs.module.css';
import LeftColumnTabs, { LeftColumnContent, LeftColumnTabButtons, LeftColumnTabsSkeleton } from './LeftColumnTabs';
import RightColumnTabs, { RightColumnContent, RightColumnTabButtons, RightColumnTabsSkeleton } from './RightColumnTabs';

type LeftTabType = 'followings' | 'followers' | 'status' | '';
type RightTabType = 'contracts' | 'profile' | 'usernames' | '';
type TabGroup = 'left' | 'right';

type CombinedTabsProps = {
  followings: ProfileDetailsData['followings'];
  followers: ProfileDetailsData['followers'];
  statusHistory: ProfileDetailsData['statusHistory'];
  profileHistory: ProfileDetailsData['profileHistory'];
  pastUsernames: ProfileDetailsData['pastUsernames'];
  userCas: ProfileDetailsData['userCas'];
  locale: string;
  isKol: boolean;
};

const CombinedTabs: React.FC<CombinedTabsProps> = ({
  followings,
  followers,
  statusHistory,
  profileHistory,
  pastUsernames,
  userCas,
  locale,
  isKol,
}) => {
  // Initialize states
  const showFollowings = isKol;
  const initialLeftTab = showFollowings ? 'followings' : 'followers';
  const initialRightTab = userCas?.length
    ? 'contracts'
    : profileHistory?.length
      ? 'profile'
      : pastUsernames?.length
        ? 'usernames'
        : 'contracts';

  const [leftActiveTab, setLeftActiveTab] = useState<LeftTabType>(initialLeftTab);
  const [rightActiveTab, setRightActiveTab] = useState<RightTabType>(initialRightTab);
  const [lastClickedGroup, setLastClickedGroup] = useState<TabGroup>('left');

  const handleLeftTabChange = (tab: LeftTabType) => {
    setLeftActiveTab(tab);
    setLastClickedGroup('left');
  };

  const handleRightTabChange = (tab: RightTabType) => {
    setRightActiveTab(tab);
    setLastClickedGroup('right');
  };

  return (
    <>
      {/* Large screen layout - visible on md and above */}
      <div className="hidden md:flex flex-row gap-4">
        <div className="flex-2 w-full overflow-hidden">
          <LeftColumnTabs
            followings={followings}
            followers={followers}
            statusHistory={statusHistory}
            locale={locale}
            isKol={isKol}
            activeTab={leftActiveTab}
            onTabChange={handleLeftTabChange}
          />
        </div>
        <div className="flex-1 w-full overflow-hidden">
          <RightColumnTabs
            profileHistory={profileHistory}
            pastUsernames={pastUsernames}
            userCas={userCas}
            activeTab={rightActiveTab}
            onTabChange={handleRightTabChange}
          />
        </div>
      </div>

      {/* Small screen layout - visible below md */}
      <div className="md:hidden rounded-xl border border-gray-700 dark:border-gray-600 shadow-lg flex flex-col max-h-[calc(100vh-80px)]">
        <div className={cn(
          styles.scrollbox,
          'mb-4 border-b border-gray-700 dark:border-gray-600 shrink-0',
        )}
        >
          <div className="flex">
            <LeftColumnTabButtons
              showFollowings={showFollowings}
              hasStatusHistory={!!statusHistory}
              activeTab={lastClickedGroup === 'left' ? leftActiveTab : ''}
              onTabChange={handleLeftTabChange}
            />

            <RightColumnTabButtons
              userCas={userCas}
              profileHistory={profileHistory}
              pastUsernames={pastUsernames}
              activeTab={lastClickedGroup === 'right' ? rightActiveTab : ''}
              isActive={lastClickedGroup === 'right'}
              onTabChange={handleRightTabChange}
            />
          </div>
        </div>

        {/* Content section */}
        <div className="flex-1 min-h-0 overflow-auto">
          <ScrollArea>
            {lastClickedGroup === 'left'
              ? (
                  <LeftColumnContent
                    activeTab={leftActiveTab}
                    followings={followings}
                    followers={followers}
                    statusHistory={statusHistory}
                    locale={locale}
                    showFollowings={showFollowings}
                  />
                )
              : (
                  <RightColumnContent
                    activeTab={rightActiveTab}
                    profileHistory={profileHistory}
                    pastUsernames={pastUsernames}
                    userCas={userCas}
                  />
                )}
            <ScrollBar orientation="horizontal" />
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </div>
      </div>
    </>
  );
};

export const CombinedTabsSkeleton = () => {
  return (
    <>
      {/* Large screen skeleton - visible on md and above */}
      <div className="hidden md:flex flex-row gap-4">
        <div className="flex-2">
          <LeftColumnTabsSkeleton />
        </div>
        <div className="flex-1">
          <RightColumnTabsSkeleton />
        </div>
      </div>

      {/* Small screen skeleton - visible below md */}
      <div className="md:hidden rounded-xl border border-gray-700 dark:border-gray-600 shadow-lg">
        <div className="relative">
          {/* Left shadow indicator */}
          <div className="pointer-events-none absolute left-0 top-[1px] bottom-[1px] z-10 w-4 rounded-l-xl bg-gradient-to-r from-[rgba(0,0,0,0.1)] to-transparent dark:from-[rgba(0,0,0,0.2)]" />
          {/* Right shadow indicator */}
          <div className="pointer-events-none absolute right-0 top-[1px] bottom-[1px] z-10 w-4 rounded-r-xl bg-gradient-to-l from-[rgba(0,0,0,0.1)] to-transparent dark:from-[rgba(0,0,0,0.2)]" />

          <ScrollArea className="w-full">
            <div className="px-4">
              <div className="flex w-max py-4">
                {/* Left column tab buttons skeleton */}
                <div className="flex items-center">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-11 mr-4">
                      <Skeleton className="h-10 w-24 bg-gray-600 dark:bg-gray-700" />
                    </div>
                  ))}
                </div>
                {/* Right column tab buttons skeleton */}
                <div className="flex min-w-[240px]">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-11 w-[70px] mr-2 flex items-center justify-center gap-1">
                      <Skeleton className="h-[18px] w-[18px] bg-gray-600 dark:bg-gray-700 rounded" />
                      <Skeleton className="h-4 w-6 bg-gray-600 dark:bg-gray-700 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <ScrollBar orientation="horizontal" className="mt-2" />
          </ScrollArea>

          {/* Bottom border */}
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gray-700 dark:bg-gray-600" />
        </div>

        {/* Content skeleton */}
        <div>
          <Skeleton className="h-[200px] w-full mt-4 bg-gray-800 dark:bg-gray-700" />
        </div>
      </div>
    </>
  );
};

export default CombinedTabs;
