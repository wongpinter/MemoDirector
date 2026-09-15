import React from 'react';

export interface TabItem<T extends string = string> {
  id: T;
  label: React.ReactNode;
  title?: string;
  icon?: React.ReactNode;
}

export interface TabGroupProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeId: T;
  onChange: (id: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export const TabGroup = <T extends string = string>({
  tabs,
  activeId,
  onChange,
  size = 'md',
  className = '',
}: TabGroupProps<T>) => {
  const pad = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm';

  return (
    <nav
      role="tablist"
      aria-label="Navigation Tabs"
      className={`inline-flex items-center gap-1 bg-surface-subtle p-1 rounded-xl border border-border ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-label={tab.title || (typeof tab.label === 'string' ? tab.label : undefined)}
            title={tab.title || (typeof tab.label === 'string' ? tab.label : undefined)}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={`
              inline-flex items-center gap-1.5 font-medium rounded-lg transition-all duration-150 select-none
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
              ${pad}
              ${
                isActive
                  ? 'bg-accent text-surface shadow-sm font-semibold'
                  : 'text-steel hover:text-charcoal hover:bg-surface/60'
              }
            `}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
