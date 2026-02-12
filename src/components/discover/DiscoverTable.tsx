'use client';

import type { ColumnDef, HeaderContext } from '@tanstack/react-table';
import { DataTable } from '@/components/DataTable';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChevronDown, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

// Define the types based on the API response
export type Following = {
  id: number;
  createdAt: string;
};

export type User = {
  id: string;
  name: string;
  screenName: string;
  location: string;
  description: string;
  website: string;
  followersCount: number;
  friendsCount: number;
  createdAt: string;
  statusesCount: number;
  profileBannerUrl: string;
  profileImageUrlHttps: string;
  isKol: boolean;
  kolFollowersCount: number;
  tags: string[];
  followingCounts?: {
    day1: number;
    day7: number;
    day15: number;
    day30: number;
  };
  isRecentlyRestored?: boolean;
};

export type DiscoverRecord = {
  following: Following;
  follower: User;
  followee: User;
};

export type DiscoverData = {
  records: DiscoverRecord[];
};

type SortField = 'time' | 'day1' | 'day7' | 'day30';

type DiscoverTableProps = {
  data: DiscoverData;
  activeSort: SortField;
  onSortChange: (field: SortField) => void;
};

type CustomHeaderProps = HeaderContext<DiscoverRecord, unknown> & {
  activeSort: SortField;
  onSortChange: (field: SortField) => void;
};

// Define columns for the table
const columns: ColumnDef<DiscoverRecord, unknown>[] = [
  {
    accessorKey: 'following.createdAt',
    header: (props: HeaderContext<DiscoverRecord, unknown>) => {
      const { activeSort, onSortChange } = props as CustomHeaderProps;

      return (
        <button
          className="flex items-center gap-1 cursor-pointer hover:opacity-80"
          onClick={() => onSortChange('time')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onSortChange('time');
            }
          }}
          type="button"
        >
          Time
          <ChevronDown
            className={`w-4 h-4 transition-colors ${
              activeSort === 'time' ? 'text-primary' : 'text-muted-foreground'
            }`}
          />
        </button>
      );
    },
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        {row.original.following?.createdAt
          ? new Date(row.original.following.createdAt).toLocaleString()
          : '-'}
      </div>
    ),
  },
  {
    accessorKey: 'follower',
    header: 'Follower',
    cell: ({ row }) => {
      if (!row.original.follower) {
        return <div className="text-muted-foreground">-</div>;
      }

      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Link href={`/profiles/${row.original.follower.screenName}`}>
              <div className="flex items-center gap-2 hover:opacity-80">
                <div
                  className="w-8 h-8 rounded-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${row.original.follower.profileImageUrlHttps})` }}
                />
                <div className="font-medium text-black dark:text-white hover:underline">
                  {row.original.follower.name}
                </div>
              </div>
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <div>
              <div className="font-medium">
                @
                {row.original.follower.screenName}
              </div>
              {row.original.follower.description && (
                <div className="text-sm text-muted-foreground mt-1">
                  {row.original.follower.description}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      );
    },
  },
  {
    accessorKey: 'followee',
    header: 'Followee',
    cell: ({ row }) => {
      if (!row.original.followee) {
        return <div className="text-muted-foreground">-</div>;
      }

      return (
        <div className="flex items-center gap-2">
          {row.original.followee.isRecentlyRestored && (
            <Tooltip delayDuration={0}>
              <TooltipTrigger>
                <RotateCcw className="w-4 h-4 text-yellow-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Recently restored account</p>
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Link href={`/profiles/${row.original.followee.screenName}`}>
                <div className="flex items-center gap-2 hover:opacity-80">
                  <div
                    className="w-8 h-8 rounded-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${row.original.followee.profileImageUrlHttps})` }}
                  />
                  <div className="font-medium text-black dark:text-white hover:underline">
                    {row.original.followee.name}
                  </div>
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <div>
                <div className="font-medium">
                  @
                  {row.original.followee.screenName}
                </div>
                {row.original.followee.description && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {row.original.followee.description}
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      );
    },
  },
  {
    accessorKey: 'followee.followingCounts.day1',
    header: (props: HeaderContext<DiscoverRecord, unknown>) => {
      const { activeSort, onSortChange } = props as CustomHeaderProps;
      return (
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                className="flex items-center gap-1 cursor-pointer hover:opacity-80 justify-end w-full"
                onClick={() => onSortChange('day1')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSortChange('day1');
                  }
                }}
                type="button"
              >
                Past 1 day
                <ChevronDown
                  className={`w-4 h-4 transition-colors ${
                    activeSort === 'day1' ? 'text-primary' : 'text-muted-foreground'
                  }`}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Number of influential followers gained in the last 24 hours</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
    cell: ({ row }) => (
      <div className="text-right">
        {`+${row.original.followee?.followingCounts?.day1?.toLocaleString()}`}
      </div>
    ),
  },
  {
    accessorKey: 'followee.followingCounts.day7',
    header: (props: HeaderContext<DiscoverRecord, unknown>) => {
      const { activeSort, onSortChange } = props as CustomHeaderProps;
      return (
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                className="flex items-center gap-1 cursor-pointer hover:opacity-80 justify-end w-full"
                onClick={() => onSortChange('day7')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSortChange('day7');
                  }
                }}
                type="button"
              >
                Past 7 days
                <ChevronDown
                  className={`w-4 h-4 transition-colors ${
                    activeSort === 'day7' ? 'text-primary' : 'text-muted-foreground'
                  }`}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Number of influential followers gained in the last 7 days</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
    cell: ({ row }) => (
      <div className="text-right">
        {`+${row.original.followee?.followingCounts?.day7?.toLocaleString()}`}
      </div>
    ),
  },
  {
    accessorKey: 'followee.followingCounts.day30',
    header: (props: HeaderContext<DiscoverRecord, unknown>) => {
      const { activeSort, onSortChange } = props as CustomHeaderProps;
      return (
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                className="flex items-center gap-1 cursor-pointer hover:opacity-80 justify-end w-full"
                onClick={() => onSortChange('day30')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSortChange('day30');
                  }
                }}
                type="button"
              >
                Past 30 days
                <ChevronDown
                  className={`w-4 h-4 transition-colors ${
                    activeSort === 'day30' ? 'text-primary' : 'text-muted-foreground'
                  }`}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Number of influential followers gained in the last 30 days</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
    cell: ({ row }) => (
      <div className="text-right">
        {`+${row.original.followee?.followingCounts?.day30?.toLocaleString()}`}
      </div>
    ),
  },
];

export default function DiscoverTable({ data, activeSort, onSortChange }: DiscoverTableProps) {
  return (
    <div className="px-4 pb-4">
      <TooltipProvider>
        <DataTable
          columns={columns.map(col => ({
            ...col,
            header: typeof col.header === 'function'
              ? (props: HeaderContext<DiscoverRecord, unknown>) =>
                  (col.header as (props: CustomHeaderProps) => React.ReactNode)({ ...props, activeSort, onSortChange })
              : col.header,
          })) as ColumnDef<DiscoverRecord, unknown>[]}
          data={data.records}
          maxHeight="calc(100vh - 200px)"
          showPagination
        />
      </TooltipProvider>
    </div>
  );
}
