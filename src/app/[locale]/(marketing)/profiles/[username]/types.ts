// Main Profile Details Type extending the basic ProfileData potentially
// Assuming ProfileData is imported from '@/components/ProfileCard' or a shared types file
import type { ProfileData } from '@/components/ProfileCard';

export type StatusHistoryEntry = {
  followersCount: number;
  friendsCount: number;
  statusesCount: number;
  kolFollowersCount?: number; // Optional assuming it might not always be present
  createdAt: string; // Date string
};

export type ProfileHistoryEntry = {
  key: string; // e.g., 'description', 'location', 'name', 'website'
  from: string; // The old value
  to: string; // The new value
  createdAt: string; // Date string
};

export type PastUsernameEntry = {
  screenName: string;
  changedAt: string; // Date string
};

export type UserCaEntry = {
  ca: string; // Contract Address?
  tweetId?: string; // Optional
  chainIds?: number[]; // Optional array of numbers
  name?: string; // Optional
  symbol?: string; // Optional
};

export type FollowingEntry = {
  createdAt: string; // Date string when the following relationship was recorded/started?
  followeeId: string;
  followeeProfileImageUrl?: string;
  followeeScreenName?: string;
  followeeName?: string;
  followeeDescription?: string; // Optional
  followeeFollowers?: number; // Optional
  followeeKeyFollowers?: number; // Optional
}; // Adjust path if necessary

export type FollowerEntry = {
  createdAt: string | null;
  followerId: string;
  followerProfileImageUrl?: string;
  followerScreenName?: string;
  followerName?: string;
  followerDescription?: string;
  followeeFollowers?: number;
  followeeKeyFollowers?: number;
  kolFollowersCount?: number;
};

export type ProfileDetailsData = {
  statusHistory: StatusHistoryEntry[];
  profileHistory: ProfileHistoryEntry[];
  pastUsernames: PastUsernameEntry[];
  userCas: UserCaEntry[];
  followings: FollowingEntry[];
  followers: FollowerEntry[];
} & ProfileData;
