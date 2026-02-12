'use client';

import * as React from 'react';

type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

export const Tabs = ({ ref, value, onValueChange, children, ...props }: React.HTMLAttributes<HTMLDivElement> & {
  value: string;
  onValueChange: (value: string) => void;
} & { ref?: React.RefObject<HTMLDivElement | null> }) => {
  return (
    <TabsContext value={{ value, onValueChange }}>
      <div ref={ref} {...props}>
        {children}
      </div>
    </TabsContext>
  );
};
Tabs.displayName = 'Tabs';

export const TabsList = ({ ref, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { ref?: React.RefObject<HTMLDivElement | null> }) => (
  <div
    ref={ref}
    className={`inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500 dark:bg-slate-800 dark:text-slate-400 ${className}`}
    {...props}
  />
);
TabsList.displayName = 'TabsList';

export const TabsTrigger = ({ ref, className, value, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string } & { ref?: React.RefObject<HTMLButtonElement | null> }) => {
  const context = React.use(TabsContext);
  if (!context) {
    throw new Error('TabsTrigger must be used within Tabs');
  }

  const isActive = context.value === value;

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => context.onValueChange(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isActive
          ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-950 dark:text-slate-50'
          : ''
      } ${className}`}
      {...props}
    />
  );
};
TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = ({ ref, className, value, children, ...props }: React.HTMLAttributes<HTMLDivElement> & { value: string } & { ref?: React.RefObject<HTMLDivElement | null> }) => {
  const context = React.use(TabsContext);
  if (!context) {
    throw new Error('TabsContent must be used within Tabs');
  }

  if (context.value !== value) {
    return null;
  }

  return (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  );
};
TabsContent.displayName = 'TabsContent';
