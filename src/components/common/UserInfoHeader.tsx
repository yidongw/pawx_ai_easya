import Link from 'next/link';
import React from 'react';
import { CountdownTimer } from './CountdownTimer';
import { VerifiedBadge } from './VerifiedBadge';

type UserInfoHeaderProps = {
  name?: string;
  screenName?: string;
  profileImageUrl?: string;
  verified?: boolean;
  time: Date | string;
  className?: string;
};

export const UserInfoHeader: React.FC<UserInfoHeaderProps> = ({
  name,
  screenName,
  profileImageUrl,
  verified = false,
  time,
  className = '',
}) => {
  return (
    <div className={`flex items-start gap-3 mb-2 ${className}`}>
      {/* Avatar */}
      <Link href={`/profiles/${screenName}`} className="flex-shrink-0">
        <img
          src={profileImageUrl || '/default-avatar.png'}
          alt={name || ''}
          className="w-10 h-10 rounded-full object-cover hover:opacity-80 transition-opacity"
        />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1">
            <Link
              href={`/profiles/${screenName}`}
              className="font-bold text-sm truncate hover:underline"
            >
              {name}
            </Link>
            {verified && <VerifiedBadge className="w-4 h-4" fill="#3B82F6" />}
          </div>
          <div className="flex items-center gap-1">
            <Link
              href={`/profiles/${screenName}`}
              className="text-gray-500 text-sm truncate hover:underline"
            >
              @
              {screenName}
            </Link>
            <span className="text-gray-400 text-xs">
              ·
              <CountdownTimer date={time} className="text-gray-400" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
