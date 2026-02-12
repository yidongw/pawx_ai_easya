import { Button } from '@/components/ui/button';
import React from 'react';

type MonitorColumnNavBarProps = {
  columnName: string;
  usernames: string[];
  onRemove: () => void;
};

export const MonitorColumnNavBar: React.FC<MonitorColumnNavBarProps> = ({ columnName, onRemove }) => {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b bg-slate-50 dark:bg-slate-900 backdrop-blur z-10">
      <span className="font-semibold truncate" title={columnName}>{columnName}</span>
      <div className="flex items-center space-x-2">

        <Button size="icon" variant="ghost" onClick={onRemove} aria-label="Remove column">
          <span aria-hidden>×</span>
        </Button>
      </div>
    </div>
  );
};
