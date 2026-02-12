import type { ProfileDetailsData } from '@/app/[locale]/(marketing)/profiles/[username]/types'; // Assuming types moved
import type { Metadata } from 'next';
import ProfileDetailsView from '@/components/profileDetails/ProfileDetailsView'; // Import the new client component
import { fetchApi } from '@/libs/api';
import { Env } from '@/libs/Env';
import React from 'react'; // Import Suspense if needed for streaming/metadata

// --- Fetcher Function for Metadata ONLY ---
// Keep this separate to avoid fetching everything just for metadata
async function fetchProfileMetadata(username: string): Promise<Partial<ProfileDetailsData> | null> {
  try {
    // Consider creating a smaller API endpoint if metadata needs are minimal
    const response = await fetchApi(`${Env.NEXT_PUBLIC_API_HOST}/api/v1/profiles/${username}`); // Example: fetch only needed fields

    if (!response.ok) {
      return null; // Can't generate metadata if profile doesn't exist
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching profile metadata:', error);
    return null;
  }
}

// --- Page Component Props ---
type Props = {
  params: Promise<{ username: string; locale: string }>;
};

// --- generateMetadata (Server Component) ---
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profileMeta = await fetchProfileMetadata(username);
  return {
    title: profileMeta ? `${profileMeta.name} (@${profileMeta.screenName})` : 'Profile Not Found',
    description: profileMeta ? profileMeta.description : 'Detailed user profile.',
  };
}

// --- Page Component (Server Component) ---
export default async function ProfileDetailsPage({ params }: Props) {
  const { username, locale } = await params;

  // Render the client component, passing necessary props
  // Suspense can be added here if ProfileDetailsView uses it internally or for better perceived performance
  return (
    <ProfileDetailsView username={username} locale={locale} />
  );
}
