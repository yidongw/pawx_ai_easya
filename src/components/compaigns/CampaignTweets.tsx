'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Heart, Lightbulb } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

// Types for tweets
export type CampaignTweet = {
  id: string;
  text: string;
  entities: {
    hashtags: any[];
    symbols: any[];
    urls: Array<{
      display_url: string;
      expanded_url: string;
      indices: number[];
      url: string;
    }>;
    user_mentions: Array<{
      id_str: string;
      indices: number[];
      name: string;
      screen_name: string;
    }>;
  };
  medias?: Array<{
    id_str: string;
    type: string;
    media_url_https: string;
    url: string;
    sizes: any;
  }>;
  favoriteCount: number;
  bookmarkCount: number;
  viewCount: number;
  quoteCount: number;
  replyCount: number;
  retweetCount: number;
  fullText: string;
  createdAt: string;
  analysis?: {
    sentiment?: number;
    originality?: number;
  };
  user: {
    id: string;
    name: string;
    screenName: string;
    description: string;
    location: string;
    website: string;
    followersCount: number;
    friendsCount: number;
    profileImageUrlHttps: string;
    profileBannerUrl: string;
    kolFollowersCount: number;
  };
};

export type CampaignTweetsData = CampaignTweet[];

type CampaignTweetsProps = {
  data: CampaignTweetsData;
  isLoading?: boolean;
  isError?: boolean;
};

export default function CampaignTweets({
  data,
  isLoading = false,
  isError = false,
}: CampaignTweetsProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 h-[590px] p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 bg-muted rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-32" />
              <div className="h-16 bg-muted rounded" />
              <div className="flex gap-4">
                <div className="h-3 bg-muted rounded w-12" />
                <div className="h-3 bg-muted rounded w-12" />
                <div className="h-3 bg-muted rounded w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="text-red-500 text-center py-8 h-32 flex items-center justify-center">
        Failed to load tweets
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-8 h-32 flex items-center justify-center">
        No tweets yet
      </div>
    );
  }

  return (
    <div className="space-y-4 h-[590px] overflow-y-auto p-4">
      {data.map(tweet => (
        <div key={tweet.id} className="border-b border-border pb-4 last:border-b-0">
          <div className="flex items-start gap-3">
            <Image
              src={tweet.user.profileImageUrlHttps || '/default-avatar.png'}
              alt={tweet.user.name}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-1">
                <span className="font-medium text-sm truncate">
                  {tweet.user.name}
                </span>
                <span className="text-muted-foreground text-sm">
                  @
                  {tweet.user.screenName}
                </span>
                <span className="text-muted-foreground text-sm">·</span>
                <span className="text-muted-foreground text-sm">
                  {new Date(tweet.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm mb-2 whitespace-pre-wrap">{tweet.text}</p>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="text-xs">
                  {(tweet.favoriteCount || 0).toLocaleString()}
                  {' '}
                  likes
                </span>
                <span className="text-xs">
                  {(tweet.retweetCount || 0).toLocaleString()}
                  {' '}
                  retweets
                </span>
                <span className="text-xs">
                  {(tweet.replyCount || 0).toLocaleString()}
                  {' '}
                  replies
                </span>
                {tweet.analysis?.sentiment !== undefined && (
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <span className="text-xs flex items-center gap-1">
                          <Heart className="w-3 h-3 text-red-500" />
                          {tweet.analysis.sentiment}
                          %
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Sentiment Score</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {tweet.analysis?.originality !== undefined && (
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <span className="text-xs flex items-center gap-1">
                          <Lightbulb className="w-3 h-3 text-yellow-500" />
                          {tweet.analysis.originality}
                          %
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Originality Score</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
