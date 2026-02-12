'use client';

import type { ProfileDetailsData } from '@/app/[locale]/(marketing)/profiles/[username]/types';
import { Copy, Twitter, Workflow } from 'lucide-react';
import { Fragment, useState } from 'react';

// Component for User CAs (Assuming 'CA' means Contract Address)
const UserCasSection: React.FC<{ cas: ProfileDetailsData['userCas'] }> = ({ cas }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!cas || cas.length === 0) {
    return (
      <div className="px-4">
        <div className="mb-4 text-gray-500 dark:text-gray-400 text-center">
          No contract addresses found
        </div>
      </div>
    );
  }

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000); // Hide tooltip after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="px-4">
      <ul className="list-none p-0 m-0 text-gray-300 dark:text-gray-200">
        {cas.map((entry, index) => (
          <Fragment key={entry.ca}>
            <li className="mb-4 text-sm">
              <div className="text-lg font-bold mb-2 text-black dark:text-white">
                {entry.symbol}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-black dark:text-white">{truncateAddress(entry.ca)}</span>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(entry.ca, index)}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <Copy size={16} className="text-gray-500 dark:text-gray-400" />
                    {copiedIndex === index && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-gray-800 dark:bg-gray-700 text-white px-2 py-1 rounded text-xs whitespace-nowrap mb-1">
                        Copied!
                      </div>
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-2 text-gray-500 dark:text-gray-400">
                <Workflow size={16} />
                {entry.chainIds?.join(', ')}
              </div>
              {entry.tweetId && (
                <div className="flex items-center gap-2">
                  <Twitter size={16} className="text-gray-500 dark:text-gray-400" />
                  <a
                    href={`https://twitter.com/i/web/status/${entry.tweetId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 dark:text-blue-400 hover:underline"
                  >
                    View Tweet
                  </a>
                </div>
              )}
            </li>
            {index < cas.length - 1 && (
              <div className="h-px bg-gray-700 dark:bg-gray-600 my-4 w-full" />
            )}
          </Fragment>
        ))}
      </ul>
    </div>
  );
};

export default UserCasSection;
