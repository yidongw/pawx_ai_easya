import { Edit } from 'lucide-react';
import React from 'react';

// Display name mappings
const DISPLAY_KEY_NAMES = new Map<string, string>([
  ['profileImageUrlHttps', 'Profile Pic'],
  ['profileBannerUrl', 'Banner Pic'],
]);

// Set of fields that should display as images
const IMAGE_FIELDS = new Set([
  'profileImageUrlHttps',
  'profileBannerUrl',
]);

type ProfileUpdateContentProps = {
  profileKey: string;
  oldValue?: any;
  newValue?: any;
  className?: string;
};

export const ProfileUpdateContent: React.FC<ProfileUpdateContentProps> = ({
  profileKey,
  oldValue,
  newValue,
  className = '',
}) => {
  const displayKey = DISPLAY_KEY_NAMES.get(profileKey) || profileKey;
  const isImageField = IMAGE_FIELDS.has(profileKey);

  // Determine action type
  let actionType = 'Updated';
  if (!oldValue && newValue) {
    actionType = 'Added';
  } else if (oldValue && !newValue) {
    actionType = 'Removed';
  }

  return (
    <div className={`text-sm ${className}`}>
      {/* Second row: Title with Edit icon */}
      <div className="flex items-center gap-2 mb-2">
        <Edit size={16} />
        <div>
          {actionType}
          {' '}
          {displayKey}
        </div>
      </div>

      {/* Content based on action type */}
      {actionType === 'Updated'
        ? (
            // Show From: and To: for updates
            <>
              <div className="my-2">
                <div className="text-base font-medium mb-2">From:</div>
                {isImageField && oldValue
                  ? (
                      <div
                        className={`w-full h-48 rounded-lg bg-gray-100 dark:bg-gray-800 bg-center bg-cover bg-no-repeat ${
                          profileKey === 'profileImageUrlHttps' ? 'max-w-xs' : 'max-w-2xl'
                        }`}
                        style={{ backgroundImage: `url(${oldValue})` }}
                        role="img"
                        aria-label={`Previous ${displayKey}`}
                      />
                    )
                  : (
                      <div className="text-base font-medium break-words">
                        {oldValue && typeof oldValue === 'string' ? oldValue.replace(/\//g, '/\u200B') : (oldValue || 'N/A')}
                      </div>
                    )}
              </div>
              <div className="my-2">
                <div className="text-base font-medium mb-2">To:</div>
                {isImageField && newValue
                  ? (
                      <div
                        className={`w-full h-48 rounded-lg bg-gray-100 dark:bg-gray-800 bg-center bg-cover bg-no-repeat ${
                          profileKey === 'profileImageUrlHttps' ? 'max-w-xs' : 'max-w-2xl'
                        }`}
                        style={{ backgroundImage: `url(${newValue})` }}
                        role="img"
                        aria-label={`New ${displayKey}`}
                      />
                    )
                  : (
                      <div className="text-base font-medium break-words">
                        {newValue && typeof newValue === 'string' ? newValue.replace(/\//g, '/\u200B') : (newValue || 'N/A')}
                      </div>
                    )}
              </div>
            </>
          )
        : (
            // Show only the value for Added/Removed
            <div className="my-2">
              {isImageField && (actionType === 'Added' ? newValue : oldValue)
                ? (
                    <div
                      className={`w-full h-48 rounded-lg bg-gray-100 dark:bg-gray-800 bg-center bg-cover bg-no-repeat ${
                        profileKey === 'profileImageUrlHttps' ? 'max-w-xs' : 'max-w-2xl'
                      }`}
                      style={{ backgroundImage: `url(${actionType === 'Added' ? newValue : oldValue})` }}
                      role="img"
                      aria-label={`${actionType === 'Added' ? 'New' : 'Previous'} ${displayKey}`}
                    />
                  )
                : (
                    <div className="text-base font-medium break-words">
                      {(() => {
                        const value = actionType === 'Added' ? newValue : oldValue;
                        return value && typeof value === 'string' ? value.replace(/\//g, '/\u200B') : (value || 'N/A');
                      })()}
                    </div>
                  )}
            </div>
          )}
    </div>
  );
};
