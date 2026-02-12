import React from 'react';
import { ProfileUpdateContent } from '../common/ProfileUpdateContent';
import { UserInfoHeader } from '../common/UserInfoHeader';

type ProfileChangeProps = {
  change: {
    key: string;
    old: any;
    new: any;
    time: Date;
    username: string;
  };
  user: {
    name?: string;
    screenName?: string;
    profileImageUrlHttps?: string;
    verified?: boolean;
  };
};

export const ProfileChange: React.FC<ProfileChangeProps> = ({ change, user }) => {
  return (
    <div className="p-2 w-full max-w-xl">
      {/* First row: Avatar, user info, and time */}
      <UserInfoHeader
        name={user?.name}
        screenName={user?.screenName || change.username}
        profileImageUrl={user?.profileImageUrlHttps}
        verified={user?.verified}
        time={change.time}
      />

      {/* Second row: Profile update content */}
      <ProfileUpdateContent
        profileKey={change.key}
        oldValue={change.old}
        newValue={change.new}
      />
    </div>
  );
};
