// src/components/profileDetails/ProfileDetailsView.tsx
'use client';

import type { ProfileDetailsData } from '@/app/[locale]/(marketing)/profiles/[username]/types';
import type { ProfileData } from '@/components/ProfileCard';
import ProfileCard, { ProfileCardSkeleton } from '@/components/ProfileCard';
import { fetchApi } from '@/libs/api';
import { Env } from '@/libs/Env';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import CombinedTabs, { CombinedTabsSkeleton } from './CombinedTabs';

// --- Component Props ---
type ProfileDetailsViewProps = {
  username: string;
  locale: string;
};

// --- Fetcher Function ---
async function fetchProfileDetails(username: string): Promise<ProfileDetailsData | null> {
  const response = await fetchApi(`${Env.NEXT_PUBLIC_API_HOST}/api/v1/profiles/${username}`);

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  try {
    const data = await response.json();
    return data;
  } catch (e) {
    console.error('Failed to parse profile details JSON:', e);
    throw new Error('Invalid data received from server.');
  }
}

// --- Client Component ---
export default function ProfileDetailsView({ username, locale }: ProfileDetailsViewProps) {
  // Media query hook for responsive layout

  const {
    data: profileData,
    isLoading,
    isError,
    error,
  } = useQuery<ProfileDetailsData | null, Error>({
    queryKey: ['profileDetails', username],
    queryFn: () => fetchProfileDetails(username),
  });

  // --- Loading State ---
  if (isLoading) {
    return (
      <div>
        <ProfileCardSkeleton />
        <div className="mt-4">
          <CombinedTabsSkeleton />
        </div>
      </div>
    );
  }

  // --- Error State ---
  if (isError) {
    console.error('Error loading profile details:', error);
    return (
      <div className="p-4 text-red-500">
        Error loading profile:
        {' '}
        {error?.message || 'Unknown error'}
      </div>
    );
  }

  // --- Not Found State ---
  if (profileData === null) {
    return <div className="p-4 text-orange-400">Profile cannot be found.</div>;
  }

  // --- Success State ---
  return (
    <>
      <ProfileCard profile={profileData as ProfileData} locale={locale} />

      <div className="mt-4">
        <CombinedTabs
          followings={profileData!.followings}
          followers={profileData!.followers}
          statusHistory={profileData!.statusHistory}
          profileHistory={profileData!.profileHistory}
          pastUsernames={profileData!.pastUsernames}
          userCas={profileData!.userCas}
          locale={locale}
          isKol={profileData!.isKol ?? false}
        />
      </div>
    </>
  );
}
