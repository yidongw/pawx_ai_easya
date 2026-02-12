import type { ProfileDetailsData } from '@/app/[locale]/(marketing)/profiles/[username]/types';
import { Calendar } from 'lucide-react';

// Component for Past Usernames
const PastUsernamesSection: React.FC<{ usernames: ProfileDetailsData['pastUsernames'] }> = ({ usernames }) => {
  return (
    <div className="px-4">
      <div className="text-black dark:text-white">
        {(!usernames || usernames.length === 0)
          ? (
              <div className="mb-4 text-gray-500 dark:text-gray-400 text-center">
                No previous usernames
              </div>
            )
          : (
              usernames.map((entry, index) => (
                <div key={entry.screenName}>
                  <div className="mb-4 text-sm">
                    <div>
                      @
                      {entry.screenName}
                    </div>
                    {entry.changedAt && (
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mt-2">
                        <Calendar size={16} />
                        <span>
                          until
                          {' '}
                          {new Date(entry.changedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  {index < usernames.length - 1 && (
                    <hr className="my-4 border-0 border-t border-gray-700 dark:border-gray-600" />
                  )}
                </div>
              ))
            )}
      </div>
    </div>
  );
};

export default PastUsernamesSection;
