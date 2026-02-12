import type { ProfileDetailsData, ProfileHistoryEntry } from '@/app/[locale]/(marketing)/profiles/[username]/types';
import { Calendar } from 'lucide-react';
import { ProfileUpdateContent } from '../common/ProfileUpdateContent';

// Component to display Profile Field History
const ProfileHistorySection: React.FC<{ history: ProfileDetailsData['profileHistory'] }> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="px-4">
        <div className="mb-4 text-gray-500 dark:text-gray-400 text-center">
          No profile history available
        </div>
      </div>
    );
  }

  return (
    <div className="px-4">
      <div className="text-black dark:text-white">
        {history.slice(0, 10).map((entry: ProfileHistoryEntry, index: number) => (
          <div key={`${entry.key}-${entry.createdAt}`}>
            <div className="mb-4 text-sm">
              <ProfileUpdateContent
                profileKey={entry.key}
                oldValue={entry.from}
                newValue={entry.to}
              />
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Calendar size={16} />
                {new Date(entry.createdAt).toLocaleString()}
              </div>
            </div>
            {index < history.length - 1 && (
              <hr className="my-4 border-0 border-t border-gray-700 dark:border-gray-600" />
            )}
          </div>
        ))}
        {history.length > 10 && (
          <div className="mt-4 text-gray-500 dark:text-gray-400">
            ...and
            {' '}
            {history.length - 10}
            {' '}
            more entries
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileHistorySection;
