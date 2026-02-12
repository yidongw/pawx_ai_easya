'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import React, { useState } from 'react';

type MonitorColumnNavBarMultiUserProps = {
  columnName: string;
  usernames: string[];
  onAddUser: (username: string) => Promise<void>;
  onRemoveUser: (username: string) => void;
};

export const MonitorColumnNavBarMultiUser: React.FC<MonitorColumnNavBarMultiUserProps> = ({
  columnName,
  usernames,
  onAddUser,
  onRemoveUser,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  // Remove these unused states for editing
  // const [isEditing, setIsEditing] = useState(false);
  // const [editedName, setEditedName] = useState(columnName);

  const handleAddUser = async () => {
    const username = inputValue.trim();
    if (!username) {
      return;
    }

    setIsAddingUser(true);
    try {
      await onAddUser(username);
      setInputValue('');
    } catch (error) {
      console.error('Failed to add user:', error);
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddUser();
    }
  };

  // Remove handleRename and handleRenameKeyPress functions
  // const handleRename = () => { ... };
  // const handleRenameKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => { ... };

  return (
    <div className="flex flex-col border-b bg-slate-50 dark:bg-slate-900 backdrop-blur z-10">
      {/* Header Row */}
      <div className="flex items-center justify-between px-4 py-2">
        {/* Replace the conditional editing UI with just the span */}
        <span
          className="font-semibold truncate"
          title={columnName}
        >
          {columnName}
        </span>
        <div className="flex items-center space-x-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label="Toggle user list"
            className="h-8 w-8"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Expanded User Management Section */}
      {isExpanded && (
        <div className="px-4 pb-3 space-y-2">
          {/* Add User Input */}
          <div className="flex space-x-2">
            <Input
              placeholder="Add username..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isAddingUser}
              className="h-8 text-sm"
            />
            <Button
              onClick={handleAddUser}
              disabled={!inputValue.trim() || isAddingUser}
              size="sm"
              className="h-8"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* User List */}
          <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            {usernames.length === 0
              ? (
                  <div className="text-sm text-gray-400 dark:text-gray-500 text-center py-2">
                    No users added yet
                  </div>
                )
              : (
                  usernames.map(username => (
                    <div
                      key={username}
                      className="flex items-center justify-between py-1 px-2 rounded bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <span className="text-sm truncate flex-1" title={username}>
                        @
                        {username}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onRemoveUser(username)}
                        aria-label={`Remove ${username}`}
                        className="h-6 w-6 flex-shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
          </div>

          {/* User Count */}
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {usernames.length}
            {' '}
            {usernames.length === 1 ? 'user' : 'users'}
          </div>
        </div>
      )}
    </div>
  );
};
