'use client';

import type { CampaignsData } from './CompaignsTable';
import { fetchApi } from '@/libs/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { toast } from 'sonner';
import CampaignsTable from './CompaignsTable';

// Fetcher function
async function fetchCampaignsData(): Promise<CampaignsData> {
  const endpoint = '/api/v1/campaigns';

  const response = await fetchApi(endpoint);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  try {
    const data = await response.json();
    return data;
  } catch (e) {
    console.error('Failed to parse campaigns data JSON:', e);
    throw new Error('Invalid data received from server.');
  }
}

// Create campaign function
async function createCampaign(campaignData: {
  name: string;
  keywords: string[];
  rewardAmount: number | null;
  rewardTicker: 'SOL' | 'USDC' | null;
  code: string;
}): Promise<void> {
  const endpoint = '/api/v1/campaigns';

  const response = await fetchApi(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: campaignData.name,
      keywords: campaignData.keywords,
      rewardAmount: campaignData.rewardAmount,
      rewardTicker: campaignData.rewardTicker,
      rewardChain: campaignData.rewardTicker ? 'solana' : null,
      rewardTokenAddress: campaignData.rewardTicker === 'SOL'
        ? 'So11111111111111111111111111111111111111112'
        : campaignData.rewardTicker === 'USDC'
          ? 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
          : null,
      code: campaignData.code,
    }),
  });

  if (!response.ok) {
    let errorMessage = 'Failed to create campaign';

    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // If we can't parse the error response, use status-based messages
      errorMessage = 'Something went wrong. Please try again.';
    }

    throw new Error(errorMessage);
  }
}

export default function Campaigns() {
  const queryClient = useQueryClient();

  const {
    data: campaignsData,
    isLoading,
    isError,
    error,
  } = useQuery<CampaignsData, Error>({
    queryKey: ['campaigns'],
    queryFn: fetchCampaignsData,
  });

  const handleNewCampaign = async (campaignData: {
    name: string;
    keywords: string[];
    rewardAmount: number | null;
    rewardTicker: 'SOL' | 'USDC' | null;
    code: string;
  }): Promise<void> => {
    try {
      await createCampaign(campaignData);
      toast.success('Campaign created successfully!');
      // Refetch campaigns data after successful creation
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create campaign';
      toast.error(errorMessage);
      throw error; // Re-throw to keep dialog open
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-[400px] bg-muted rounded" />
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="p-4 text-red-500">
        Error loading campaigns data:
        {' '}
        {error?.message || 'Unknown error'}
      </div>
    );
  }

  // Success state
  return (
    <div className="p-4">
      {campaignsData && (
        <CampaignsTable
          data={campaignsData}
          onNewCampaign={handleNewCampaign}
        />
      )}
    </div>
  );
}
