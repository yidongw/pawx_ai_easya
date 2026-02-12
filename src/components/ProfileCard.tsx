'use client'; // Add 'use client' for useState and event handlers

import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { Calendar, Globe, MapPin } from 'lucide-react';
import Link from 'next/link'; // Import Link
// Keep server import if used for initial props/translations
import React from 'react';

// Define the profile data type - moved from page.tsx
export type ProfileData = {
  id: string;
  name: string;
  screenName: string;
  location?: string; // Optional
  description: string;
  website?: string; // Optional
  followersCount: number;
  friendsCount: number;
  createdAt: string; // Keep as string for now, format in component
  statusesCount: number;
  profileBannerUrl?: string;
  profileImageUrlHttps: string;
  isKol: boolean;
  kolFollowersCount: number;
  tags: string[]; // Keep in type, but won't display
};

type ProfileCardProps = {
  profile: ProfileData;
  locale: string; // Pass locale if needed for translations within card
};

// Helper to make URLs in text clickable
const linkifyDescription = (text: string) => {
  const urlPattern = /(?:https?|ftp):\/\/[-\w+&@#/%?=~|!:,.;]*[-\w+&@#/%=~|]/gi;

  let lastIndex = 0;
  const parts = [];
  let match = urlPattern.exec(text);

  while (match !== null) {
    // Add the text before the URL
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Add the URL as a link
    parts.push(
      <a
        key={match.index}
        href={match[0]}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#1da1f2', textDecoration: 'none' }}
        onClick={e => e.stopPropagation()} // Prevent card link navigation when clicking external link
        onMouseEnter={(e) => {
          e.currentTarget.style.textDecoration = 'underline';
        }} // Add hover underline
        onMouseLeave={(e) => {
          e.currentTarget.style.textDecoration = 'none';
        }} // Remove hover underline
      >
        {match[0]}
      </a>,
    );

    lastIndex = urlPattern.lastIndex;
    match = urlPattern.exec(text);
  }

  // Add any remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
};

export default function ProfileCard({ profile, locale }: ProfileCardProps) {
  const bannerHeight = '140px';
  const profileImageSize = '70px';

  return (
    <div
      key={profile.id}
      className="w-full relative overflow-hidden rounded-xl border border-gray-700 dark:border-gray-600 shadow-lg transition-all duration-200"
    >
      <div className="relative" style={{ height: bannerHeight }}>
        {/* Banner with mask */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: (profile.profileBannerUrl && profile.profileBannerUrl !== 'undefined')
              ? `url(${profile.profileBannerUrl})`
              : `url('/assets/images/default-banner.jpeg')`,
            maskImage: `linear-gradient(to bottom,
              black 0%,
              black 40%,
              rgba(0, 0, 0, 0.95) 50%,
              rgba(0, 0, 0, 0.9) 60%,
              rgba(0, 0, 0, 0.8) 70%,
              rgba(0, 0, 0, 0.6) 80%,
              rgba(0, 0, 0, 0.4) 85%,
              rgba(0, 0, 0, 0.2) 90%,
              rgba(0, 0, 0, 0.1) 95%,
              transparent 100%
            )`,
            WebkitMaskImage: `linear-gradient(to bottom,
              black 0%,
              black 40%,
              rgba(0, 0, 0, 0.95) 50%,
              rgba(0, 0, 0, 0.9) 60%,
              rgba(0, 0, 0, 0.8) 70%,
              rgba(0, 0, 0, 0.6) 80%,
              rgba(0, 0, 0, 0.4) 85%,
              rgba(0, 0, 0, 0.2) 90%,
              rgba(0, 0, 0, 0.1) 95%,
              transparent 100%
            )`,
          }}
        />

        {/* Profile Image */}
        <div
          className="absolute left-5 -bottom-7 z-10 rounded-full border-3 border-white shadow-md bg-cover bg-center"
          style={{
            width: profileImageSize,
            height: profileImageSize,
            backgroundImage: `url(${profile.profileImageUrlHttps})`,
          }}
          role="img"
          aria-label={`${profile.name}'s profile picture`}
        />
      </div>

      <div
        className="relative p-5"
        style={{ paddingLeft: `calc(${profileImageSize} + 40px)` }}
      >
        {/* Header Section */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 w-full">
          <div className="flex flex-wrap items-center gap-2 min-w-[100px]">
            <Link
              href={`/${locale}/profiles/${profile.screenName}`}
              className="text-black dark:text-white hover:underline"
            >
              <h2 className="m-0 text-xl font-bold break-words inline">
                {profile.name}
              </h2>
            </Link>

            <Link
              href={`/${locale}/profiles/${profile.screenName}`}
              className="text-muted-foreground text-sm hover:underline"
            >
              @
              {profile.screenName}
            </Link>
          </div>

          {profile.isKol && (
            <span className="px-3 py-1 rounded-full text-sm font-bold whitespace-normal break-words bg-amber-400 dark:bg-amber-500 text-black dark:text-white min-w-[80px] text-center">
              Influencer
            </span>
          )}
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
          {profile.location && (
            <span className="flex items-center gap-1">
              <MapPin size={14} />
              {profile.location}
            </span>
          )}
          {profile.website && (
            <span className="flex items-center gap-1">
              <Globe size={14} />
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 dark:text-blue-400 hover:underline"
                onClick={e => e.stopPropagation()}
              >
                {profile.website.replace(/^https?:\/\//, '')}
              </a>
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar size={14} />
            Joined
            {' '}
            {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
          </span>
        </div>

        {/* Description */}
        <p className="leading-6 !mt-0 !mb-3 text-black dark:text-white break-words">
          {linkifyDescription(profile.description)}
        </p>

        {/* Stats */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <strong className="text-black dark:text-white">{profile.followersCount.toLocaleString()}</strong>
            Followers
          </span>
          <span className="flex items-center gap-1">
            <strong className="text-black dark:text-white">{profile.friendsCount.toLocaleString()}</strong>
            Following
          </span>
          <span className="flex items-center gap-1 text-amber-500 dark:text-amber-400">
            <strong>{profile.kolFollowersCount.toLocaleString()}</strong>
            Influencer Followers
          </span>
        </div>
      </div>
    </div>
  );
}

export function ProfileCardSkeleton() {
  const bannerHeight = '140px';
  const profileImageSize = '70px';

  return (
    <div className="w-full relative overflow-hidden rounded-xl border border-gray-700 dark:border-gray-600 shadow-lg bg-white dark:bg-gray-900">
      {/* Banner Skeleton */}
      <Skeleton
        className="w-full relative bg-gray-200 dark:bg-gray-800"
        style={{ height: bannerHeight }}
      />

      {/* Profile Image Skeleton */}
      <Skeleton
        className="absolute left-5 rounded-full border-3 border-white dark:border-gray-900 z-10 bg-gray-300 dark:bg-gray-700"
        style={{
          width: profileImageSize,
          height: profileImageSize,
          bottom: `calc(100% - ${bannerHeight} - ${Number.parseInt(profileImageSize, 10) / 2 + 15}px)`,
          transform: 'translateY(30%)',
        }}
      />

      <div
        className="relative p-5"
        style={{ paddingLeft: `calc(${profileImageSize} + 40px)` }}
      >
        {/* Header Section Skeleton */}
        <div className="flex flex-wrap items-center gap-2 mb-3 w-full">
          {/* Name and Handle Skeleton */}
          <div className="flex flex-col gap-1.5 min-w-[200px]">
            <Skeleton className="h-5 w-[180px] bg-gray-200 dark:bg-gray-800" />
            <Skeleton className="h-3.5 w-[120px] bg-gray-200 dark:bg-gray-800" />
          </div>
          {/* Badge Skeleton */}
          <Skeleton className="h-6 w-[140px] rounded-full bg-gray-200 dark:bg-gray-800 flex-shrink-0" />
        </div>

        {/* Meta Info Skeleton (Location, Website, Joined) */}
        <div className="flex flex-wrap gap-3 mb-3">
          <Skeleton className="h-4 w-1/4 bg-gray-200 dark:bg-gray-800" />
          <Skeleton className="h-4 w-[30%] bg-gray-200 dark:bg-gray-800" />
          <Skeleton className="h-4 w-[35%] bg-gray-200 dark:bg-gray-800" />
        </div>

        {/* Description Skeleton */}
        <div className="mb-4 flex flex-col gap-2">
          <Skeleton className="h-3.5 w-[95%] bg-gray-200 dark:bg-gray-800" />
          <Skeleton className="h-3.5 w-[90%] bg-gray-200 dark:bg-gray-800" />
          <Skeleton className="h-3.5 w-[80%] bg-gray-200 dark:bg-gray-800" />
        </div>

        {/* Stats Skeleton */}
        <div className="flex flex-wrap gap-4">
          <Skeleton className="h-4 w-1/5 bg-gray-200 dark:bg-gray-800" />
          <Skeleton className="h-4 w-1/5 bg-gray-200 dark:bg-gray-800" />
          <Skeleton className="h-4 w-[30%] bg-gray-200 dark:bg-gray-800" />
          {' '}
          {/* Uncommented the tracked followers skeleton */}
        </div>
      </div>
    </div>
  );
}
