import type { FollowingEntry } from '@/app/[locale]/(marketing)/profiles/[username]/types';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/DataTable';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import React from 'react';

const FollowingsSection: React.FC<{ followings: FollowingEntry[]; locale: string }> = ({ followings, locale }) => {
  const columns: ColumnDef<FollowingEntry>[] = [
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
      accessorKey: 'followeeProfileImageUrl',
      header: 'Profile',
      cell: ({ row }) => (
        (row.original.followeeProfileImageUrl && row.original.followeeProfileImageUrl !== 'undefined')
          ? (
              <div
                className="w-8 h-8 rounded-full bg-cover bg-center"
                style={{ backgroundImage: `url(${row.original.followeeProfileImageUrl})` }}
              />
            )
          : (
              <div className="w-8 h-8 rounded-full bg-muted" />
            )
      ),
    },
    {
      accessorKey: 'followeeScreenName',
      header: 'Name',
      cell: ({ row }) => (
        row.original.followeeScreenName
          ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <a
                    href={`/${locale}/profiles/${row.original.followeeScreenName}`}
                    className="text-black dark:text-white hover:underline"
                  >
                    {row.original.followeeName || row.original.followeeId}
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <div>
                    <div className="font-medium">
                      @
                      {row.original.followeeScreenName}
                    </div>
                    {row.original.followeeDescription && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {row.original.followeeDescription}
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            )
          : (
              <span className="text-black dark:text-white">
                {row.original.followeeName || row.original.followeeId}
              </span>
            )
      ),
    },
    {
      accessorKey: 'followeeFollowers',
      header: () => <div className="text-right">@ Followers</div>, // Add text-right class
      cell: ({ row }) => (
        <div className="text-right text-black dark:text-white">
          {row.original.followeeFollowers ? row.original.followeeFollowers.toLocaleString() : '-'}
        </div>
      ),
    },
    {
      accessorKey: 'followeeKeyFollowers',
      header: () => <div className="text-right">@ Inf. Followers</div>, // Add text-right class
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
          data={followings}
          showPagination={false}
        />
      </TooltipProvider>
    </div>
  );
};

export default FollowingsSection;
