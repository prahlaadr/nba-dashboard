'use client';

import { useDashboardStore, type TabId } from '@/store/dashboardStore';

const TABS: { id: TabId; label: string }[] = [
  { id: 'shots', label: 'Shot Chart' },
  { id: 'assists', label: 'Assist Network' },
  { id: 'impact', label: 'Player Impact' },
];

export default function TabNav() {
  const { activeTab, setActiveTab } = useDashboardStore();

  return (
    <div className="flex gap-1 bg-white/5 rounded-lg p-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === tab.id
              ? 'bg-white/15 text-white shadow-sm'
              : 'text-white/50 hover:text-white/80 hover:bg-white/5'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
