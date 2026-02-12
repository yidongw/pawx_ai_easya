'use client';

import type { KeyboardEvent, MouseEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export const SearchInput = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (e?: MouseEvent) => {
    const query = searchQuery.trim();
    if (query) {
      // Check if command/ctrl key is pressed
      if (e?.metaKey || e?.ctrlKey) {
        window.open(`/profiles/${query}`, '_blank');
      } else {
        router.push(`/profiles/${query}`);
      }
      setSearchQuery('');
      setOpen(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Check if command/ctrl key is pressed
      if (e.metaKey || e.ctrlKey) {
        window.open(`/profiles/${searchQuery.trim()}`, '_blank');
        setSearchQuery('');
        setOpen(false);
      } else {
        handleSearch();
      }
    }
  };

  // Auto-focus input when popover opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
        >
          <Search className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="flex flex-col gap-3">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search profiles..."
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                       placeholder:text-gray-500 dark:placeholder:text-gray-400 text-sm"
          />
          <Button
            onClick={e => handleSearch(e as MouseEvent)}
            className="w-full"
            size="sm"
          >
            Search
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
