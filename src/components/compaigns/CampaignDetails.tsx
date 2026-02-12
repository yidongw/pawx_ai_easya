'use client';

import type { CampaignTweet } from './CampaignTweets';
import type { Campaign } from './CompaignsTable';
import type { CampaignUser } from './ParticipantsTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchApi } from '@/libs/api';
import { useRouter } from '@/libs/i18nNavigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, DollarSign, Hash, RefreshCw, Target, TrendingDown, TrendingUp, Users } from 'lucide-react';
import React from 'react';
import CampaignTweets from './CampaignTweets';
import ParticipantsTable from './ParticipantsTable';
import getStatusBadge from './StatusBadge';

type CampaignDetailsProps = {
  campaignName: string;
};

// Fetcher functions
async function fetchCampaignInfo(campaignName: string): Promise<Campaign> {
  const endpoint = `/api/v1/campaigns/${encodeURIComponent(campaignName)}`;
  const response = await fetchApi(endpoint);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

async function fetchCampaignUsers(campaignName: string): Promise<CampaignUser[]> {
  const endpoint = `/api/v1/campaigns/${encodeURIComponent(campaignName)}/users`;
  const response = await fetchApi(endpoint);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

async function fetchCampaignTweets(campaignName: string): Promise<CampaignTweet[]> {
  const endpoint = `/api/v1/campaigns/${encodeURIComponent(campaignName)}/tweets`;
  const response = await fetchApi(endpoint);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export default function CampaignDetails({ campaignName }: CampaignDetailsProps) {
  const router = useRouter();

  const {
    data: campaign,
    isLoading: campaignLoading,
    isError: campaignError,
    error: campaignErrorMessage,
  } = useQuery<Campaign, Error>({
    queryKey: ['campaign-info', campaignName],
    queryFn: () => fetchCampaignInfo(campaignName),
  });

  const {
    data: users = [],
    isLoading: usersLoading,
    isError: usersError,
  } = useQuery<CampaignUser[], Error>({
    queryKey: ['campaign-users', campaignName],
    queryFn: () => fetchCampaignUsers(campaignName),
  });

  const {
    data: tweets = [],
    isLoading: tweetsLoading,
    isError: tweetsError,
    refetch: refetchTweets,
  } = useQuery<CampaignTweet[], Error>({
    queryKey: ['campaign-tweets', campaignName],
    queryFn: () => fetchCampaignTweets(campaignName),
  });

  // Loading state
  if (campaignLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-muted rounded" />
            <div className="h-96 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (campaignError) {
    return (
      <div className="p-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 mb-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campaigns
        </button>
        <div className="text-red-500">
          Error loading campaign details:
          {' '}
          {campaignErrorMessage?.message || 'Unknown error'}
        </div>
      </div>
    );
  }

  if (!campaign) {
    return null;
  }

  return (
    <div className="p-4 space-y-6">
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Campaigns
      </button>

      {/* Campaign Details - Full Width on Top */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              <span className="capitalize">{campaign.name}</span>
              {getStatusBadge(campaign.status)}
            </CardTitle>
            {campaign.rewardAmount && campaign.rewardTicker && (
              <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-lg border">
                <DollarSign className="w-4 h-4 text-yellow-600" />
                <span className="font-semibold text-yellow-700 dark:text-yellow-400">
                  {campaign.rewardAmount}
                  {' '}
                  {campaign.rewardTicker}
                </span>
                {campaign.rewardChain && (
                  <span className="text-sm text-muted-foreground">
                    on
                    {' '}
                    {campaign.rewardChain}
                  </span>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Keywords, Timeline, and Activity - All in One Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Keywords */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Hash className="w-4 h-4" />
                Keywords
              </h3>
              <div className="flex flex-wrap gap-2">
                {campaign.keywords.map(keyword => (
                  <Badge key={keyword} variant="secondary" className="text-sm">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="flex flex-col h-20">
              <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Timeline
              </h3>
              <div className="space-y-1 text-sm flex-1">
                <div>
                  <span className="text-muted-foreground">Started: </span>
                  <span className="font-medium">
                    {campaign.createdAt
                      ? new Date(campaign.createdAt).toLocaleString([], {
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Ends: </span>
                  <span className="font-medium">
                    {campaign.endAt
                      ? new Date(campaign.endAt).toLocaleString([], {
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Activity */}
            <div className="flex flex-col h-20">
              <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                Activity
              </h3>
              <div className="space-y-1 text-sm flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Tweets:</span>
                  <span className="font-bold">{campaign.tweetCount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Participants:</span>
                  <span className="font-bold">{campaign.userCount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bulls vs Bears Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-700 dark:text-green-400">Bulls Say</h3>
              </div>
              <p className="text-sm text-green-600 dark:text-green-300">
                Positive sentiment and bullish opinions about this campaign will appear here.
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-red-700 dark:text-red-400">Bears Say</h3>
              </div>
              <p className="text-sm text-red-600 dark:text-red-300">
                Negative sentiment and bearish opinions about this campaign will appear here.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Section: Participants and Tweets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Top Participants */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Top Participants
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ParticipantsTable
              data={users}
              isLoading={usersLoading}
              isError={usersError}
            />
          </CardContent>
        </Card>

        {/* Right: Recent Tweets */}
        <Card className="h-fit">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Recent Tweets
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchTweets()}
                disabled={tweetsLoading}
                className="flex items-center gap-1 h-6 px-2 text-xs"
              >
                <RefreshCw className={`w-4 h-4 ${tweetsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <CampaignTweets
              data={tweets}
              isLoading={tweetsLoading}
              isError={tweetsError}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
