export type TwitterUser = {
  id: string;
  name: string;
  screenName: string;
  location: string;
  description: string;
  website: string;
  followersCount: number;
  friendsCount: number;
  createdAt: Date;
  foundAt: Date;
  favouritesCount: number;
  verified: boolean;
  statusesCount: number;
  mediaCount: number;
  profileBannerUrl: string;
  profileImageUrlHttps: string;
  updatedAt: Date;
  isKol: boolean;
  kolFollowersCount: number;
  tags: string[];
  kolInfoUpdatedAt: Date | null;
  lastTweetId: string;
  deletedAt: Date | null;
  protectedAt: Date | null;
};

export type TwitterStatusMedia = {
  id_str: string;
  type: string;
  media_url_https: string;
  url: string;
  sizes: Record<string, { w: number; h: number; resize: string }>;
  video_info: {
    aspect_ratio: [number, number];
    duration_millis: number;
    variants: {
      content_type: string;
      url: string;
    }[];
  };
};

export type TwitterStatusEntities = {
  hashtags?: Array<{ indices: number[]; text: string }>;
  symbols?: Array<{ indices: number[]; text: string }>;
  urls?: Array<{
    display_url: string;
    expanded_url: string;
    indices: number[];
    url: string;
  }>;
  user_mentions?: Array<{
    id_str: string;
    indices: number[];
    name: string;
    screen_name: string;
  }>;
};

export type NoteTweetEntities = TwitterStatusEntities & {
  inline_media?: {
    index: number;
    media_id: string;
  }[];
  richtext_tags?: {
    from_index: number;
    to_index: number;
    richtext_types: string[];
  }[];
};

export type Token = {
  ca: string;
  name?: string;
  symbol?: string;
  chainIds?: number[];
};

export type TwitterStatus = {
  id: string;
  userId: string;
  text: string;
  truncated: boolean;
  entities: TwitterStatusEntities;
  medias: TwitterStatusMedia[] | null;
  inReplyToStatusIdStr: string | null;
  inReplyToUserIdStr: string | null;
  inReplyToUserScreenName: string | null;
  quotedStatusIdStr: string | null;
  quotedUserScreenName: string | null;
  retweetedStatusIdStr: string | null;
  retweetedUserIdStr: string | null;
  retweetedUserScreenName: string | null;
  retweetedStatusCreatedAt: Date | null;
  favoriteCount: number;
  retweetCount: number;
  createdAt: Date;
  updatedAt: Date;
  bookmarkCount?: number;
  viewCount?: number;
  quoteCount?: number;
  replyCount?: number;
  fullText?: string;
  notetweetEntities?: NoteTweetEntities;
  user?: TwitterUser;
  replyToStatus?: TwitterStatus;
  quotedStatus?: TwitterStatus;
  mentionedUsers?: TwitterUser[];
  tokens?: Token[];
};

export type UserUpdateMessage = {
  type: 'user-update';
  data: {
    twitterUser: TwitterUser;
    changes: Record<string, { old: any; new: any }>;
    status: TwitterStatus;
  };
};
