'use client'; // This is the Client Component

import type { ProfileData } from '@/components/ProfileCard';
import ProfileCard, { ProfileCardSkeleton } from '@/components/ProfileCard';
import { fetchApi } from '@/libs/api';
import { Env } from '@/libs/Env';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

// Props for the client component
type ProfileListProps = {
  locale: string;
};

// Define the function to fetch profiles (can be here or in a separate api utils file)
const fetchProfiles = async (): Promise<ProfileData[]> => {
  const response = await fetchApi(`${Env.NEXT_PUBLIC_API_HOST}/api/v1/profiles`);
  if (!response.ok) {
    // Consider more specific error types or logging
    throw new Error(`API request failed with status ${response.status}`);
  }
  try {
    const data = await response.json();
    return data;
  } catch (e) {
    console.error('Failed to parse JSON response:', e);
    throw new Error('Invalid data received from server.');
  }
};

export default function ProfileList({ locale }: ProfileListProps) {
  // Use react-query to fetch data
  const {
    data: profiles,
    isLoading,
    error,
    isError, // Use isError for boolean check
  } = useQuery<ProfileData[], Error>({
    queryKey: ['profiles'], // Unique key for this query
    queryFn: fetchProfiles, // The function to fetch data
    // Optional: Configure staleTime, cacheTime, refetchOnWindowFocus, etc.
    // staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // --- Render Logic ---

  // Handle Loading State
  if (isLoading) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Render multiple skeletons */}
          {[1, 2, 3].map(value => (
            <ProfileCardSkeleton key={value} />
          ))}
        </div>
      </div>
    );
  }

  // Handle Error State
  if (isError) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        Error loading profiles:
        {' '}
        {error?.message || 'Unknown error'}
        {/* Consider using a translation key for error messages */}
        {/* <p>{t('error_fetching_profiles')}</p> */}
      </div>
    );
  }

  // Handle No Data State (after loading and no error)
  if (!profiles || profiles.length === 0) {
    return (
      <div style={{ padding: '20px', color: 'white' }}>
        No profiles found.
        {/* Consider using a translation key */}
        {/* <p>{t('no_profiles_found')}</p> */}
      </div>
    );
  }

  // Handle Success State
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {profiles.map(profile => (
          <ProfileCard key={profile.id} profile={profile} locale={locale} />
        ))}
      </div>
    </div>
  );
}
