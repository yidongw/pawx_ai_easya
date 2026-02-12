'use client';

import type { DiscoverData } from './DiscoverTable';
import { fetchApi } from '@/libs/api';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import DiscoverTable from './DiscoverTable';

// Fetcher function
async function fetchDiscoverData(sortField: SortField): Promise<DiscoverData> {
  const endpoint = sortField === 'time'
    ? '/api/v1/discover'
    : `/api/v1/discover/${sortField}`;

  const response = await fetchApi(endpoint);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  try {
    const data = await response.json();
    return data;
  } catch (e) {
    console.error('Failed to parse discover data JSON:', e);
    throw new Error('Invalid data received from server.');
  }
}

type SortField = 'time' | 'day1' | 'day7' | 'day30';

export default function Discover() {
  const [activeSort, setActiveSort] = useState<SortField>('time');

  const {
    data: discoverData,
    isLoading,
    isError,
    error,
  } = useQuery<DiscoverData, Error>({
    queryKey: ['discover', activeSort], // Add activeSort to queryKey to refetch when it changes
    queryFn: () => fetchDiscoverData(activeSort),
  });

  const handleSortChange = (field: SortField) => {
    if (field === activeSort) {
      return;
    } // Don't do anything if clicking the active sort
    setActiveSort(field);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-[400px] bg-muted rounded" />
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="p-4 text-red-500">
        Error loading discover data:
        {' '}
        {error?.message || 'Unknown error'}
      </div>
    );
  }

  // Success state
  return (
    <div className="p-4">
      {discoverData && (
        <DiscoverTable
          data={discoverData}
          activeSort={activeSort}
          onSortChange={handleSortChange}
        />
      )}
    </div>
  );
}
