import type { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { cn } from '~/lib/utils';

export interface AppTab {
  value: string;
  label: string;
  /** Shown as a small counter after the label. */
  count?: number;
  content: ReactNode;
}

interface AppTabsProps {
  tabs: AppTab[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Slot on the right of the tab list (e.g. a primary action). */
  actions?: ReactNode;
  /** `pill` (segmented, default) or `underline` (page-level sections). */
  variant?: 'pill' | 'underline';
}

/** Tabs from a data list, with optional counts and a right-side action slot. */
export function AppTabs({
  tabs,
  value,
  defaultValue,
  onValueChange,
  actions,
  variant = 'pill',
}: Readonly<AppTabsProps>) {
  const underline = variant === 'underline';
  return (
    <Tabs
      value={value}
      defaultValue={defaultValue ?? tabs[0]?.value}
      onValueChange={onValueChange}
    >
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-3',
          underline && 'border-b border-border'
        )}
      >
        <TabsList
          className={cn(
            underline &&
              // Wraps on narrow screens rather than running off the edge.
              'h-auto max-w-full flex-wrap justify-start gap-x-4 gap-y-1 rounded-none border-0 bg-transparent p-0 sm:gap-x-6'
          )}
        >
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                underline &&
                  '-mb-px h-auto flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-2.5 pt-1 text-muted-foreground shadow-none hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none dark:data-[state=active]:bg-transparent'
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1.5 rounded-full bg-muted-foreground/15 px-1.5 text-[11px] tabular-nums">
                  {tab.count}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        {actions}
      </div>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-4">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
