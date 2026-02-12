import type { FollowerEntry } from '@/app/[locale]/(marketing)/profiles/[username]/types';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/DataTable';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import React from 'react';

const FollowersSection: React.FC<{ followers: FollowerEntry[]; locale: string }> = ({ followers, locale }) => {
  const columns: ColumnDef<FollowerEntry>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Time',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : '-'}
        </div>
      ),
    },
    {
      accessorKey: 'followerProfileImageUrl',
      header: 'Profile',
      cell: ({ row }) => (
        (row.original.followerProfileImageUrl && row.original.followerProfileImageUrl !== 'undefined')
          ? (
              <div
                className="w-8 h-8 rounded-full bg-cover bg-center"
                style={{ backgroundImage: `url(${row.original.followerProfileImageUrl})` }}
              />
            )
          : (
              <div className="w-8 h-8 rounded-full bg-muted" />
            )
      ),
    },
    {
      accessorKey: 'followerScreenName',
      header: 'Name',
      cell: ({ row }) => (
        row.original.followerScreenName
          ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <a
                    href={`/${locale}/profiles/${row.original.followerScreenName}`}
                    className="text-black dark:text-white hover:underline"
                  >
                    {row.original.followerName || row.original.followerId}
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <div>
                    <div className="font-medium">
                      @
                      {row.original.followerScreenName}
                    </div>
                    {row.original.followerDescription && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {row.original.followerDescription}
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            )
          : (
              <span className="text-black dark:text-white">
                {row.original.followerName || row.original.followerId}
              </span>
            )
      ),
    },
    {
      accessorKey: 'kolFollowersCount',
      header: () => <div className="text-right">Inf. Followers</div>,
      cell: ({ row }) => (
        <div className="text-right text-black dark:text-white">
          {row.original.kolFollowersCount ? row.original.kolFollowersCount.toLocaleString() : '-'}
        </div>
      ),
    },
    {
      accessorKey: 'followerFollowers',
      header: () => <div className="text-right">@ Followers</div>,
      cell: ({ row }) => (
        <div className="text-right text-black dark:text-white">
          {row.original.followeeFollowers ? row.original.followeeFollowers.toLocaleString() : '-'}
        </div>
      ),
    },
    {
      accessorKey: 'followerKeyFollowers',
      header: () => <div className="text-right">@ Inf. Followers</div>,
      cell: ({ row }) => (
        <div className="text-right text-black dark:text-white">
          {row.original.followeeKeyFollowers ? row.original.followeeKeyFollowers.toLocaleString() : '-'}
        </div>
      ),
    },
  ];

  return (
    <div className="px-4 pb-4">
      <TooltipProvider>
        <DataTable
          columns={columns}
          data={followers}
          showPagination={false}
        />
      </TooltipProvider>
    </div>
  );
};

export default FollowersSection;
