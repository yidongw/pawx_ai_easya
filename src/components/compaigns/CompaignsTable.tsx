'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useRouter } from '@/libs/i18nNavigation';
import React from 'react';
import NewCampaignDialog from './NewCampaignDialog';
import getStatusBadge from './StatusBadge';

// Define the types based on the API response
export type Campaign = {
  slug: string;
  name: string;
  keywords: string[];
  createdAt: string;
  endAt: string | null;
  status: string;
  rewardAmount: number | null;
  rewardTicker: string | null;
  rewardChain: string | null;
  rewardTokenAddress: string | null;
  tweetCount: number;
  userCount: number;
};

export type CampaignsData = Campaign[];

type CampaignsTableProps = {
  data: CampaignsData;
  onNewCampaign?: (campaign: {
    name: string;
    keywords: string[];
    rewardAmount: number | null;
    rewardTicker: 'SOL' | 'USDC' | null;
    code: string;
  }) => Promise<void>;
};

// Helper function to truncate keywords
const truncateKeyword = (keyword: string): string => {
  if (keyword.length <= 11) {
    return keyword;
  }
  return `${keyword.slice(0, 4)}...${keyword.slice(-4)}`;
};

// Clickable name component
const ClickableName = ({ slug }: { slug: string }) => {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(`/campaigns/${encodeURIComponent(slug)}`)}
      className="font-medium text-left hover:text-blue-600 hover:underline transition-colors cursor-pointer focus:outline-none focus:text-blue-600 focus:underline"
    >
      {slug}
    </button>
  );
};

export default function CampaignsTable({ data, onNewCampaign }: CampaignsTableProps) {
  // Define columns for the table
  const columns: ColumnDef<Campaign, unknown>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <ClickableName slug={row.original.slug} />,
    },
    {
      accessorKey: 'keywords',
      header: 'Keywords',
      cell: ({ row }) => (
        <div className="w-[180px]">
          <div className="flex flex-wrap gap-1">
            {row.original.keywords.map((keyword) => {
              const truncatedKeyword = truncateKeyword(keyword);
              const isKeywordTruncated = keyword.length > 11;

              return (
                <TooltipProvider key={keyword}>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <div>
                        <Badge variant="secondary" className="text-xs">
                          {truncatedKeyword}
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    {isKeywordTruncated && (
                      <TooltipContent>
                        <p>{keyword}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {row.original.createdAt
            ? new Date(row.original.createdAt).toLocaleDateString([], {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '-'}
        </div>
      ),
    },
    {
      accessorKey: 'endedAt',
      header: 'End At',
      cell: ({ row }) => (
        <div className="text-muted-foreground">
          {row.original.endAt
            ? new Date(row.original.endAt).toLocaleString([], {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '-'}
        </div>
      ),
    },
    {
      accessorKey: 'Status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status?.toLowerCase();

        if (!status) {
          return <div className="text-muted-foreground">-</div>;
        }

        return getStatusBadge(status);
      },
    },
    {
      accessorKey: 'reward',
      header: 'Reward',
      cell: ({ row }) => {
        if (!row.original.rewardAmount || !row.original.rewardTicker) {
          return <div className="text-muted-foreground">-</div>;
        }

        return (
          <div>
            {`${row.original.rewardAmount} ${row.original.rewardTicker}`}
          </div>
        );
      },
    },
    {
      accessorKey: 'tweetCount',
      header: 'Tweets',
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.tweetCount.toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: 'userCount',
      header: 'Users',
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.userCount.toLocaleString()}
        </div>
      ),
    },
  ];

  const handleNewCampaign = async (campaignData: {
    name: string;
    keywords: string[];
    rewardAmount: number | null;
    rewardTicker: 'SOL' | 'USDC' | null;
    code: string;
  }): Promise<void> => {
    if (onNewCampaign) {
      await onNewCampaign(campaignData);
    }
  };

  return (
    <div className="px-4 pb-4">
      <TooltipProvider>
        <DataTable
          columns={columns}
          data={data}
          maxHeight="calc(100vh - 200px)"
          showPagination
          rightElement={<NewCampaignDialog onSubmit={handleNewCampaign} />}
        />
      </TooltipProvider>
    </div>
  );
}
