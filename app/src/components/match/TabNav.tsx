'use client';

import { useDashboardStore, type TabId } from '@/store/dashboardStore';

const TABS: { id: TabId; label: string }[] = [
  { id: 'shots', label: 'Shot Chart' },
  { id: 'impact', label: 'Player Impact' },
  { id: 'stats', label: 'Match Stats' },
];

export default function TabNav() {
  const { activeTab, setActiveTab } = useDashboardStore();

  return (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === tab.id
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
