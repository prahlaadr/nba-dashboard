import { create } from 'zustand';

export type TabId = 'shots' | 'assists' | 'impact' | 'stats';

interface DashboardState {
  activeTab: TabId;
  teamFilter: number | null; // null = both teams, teamId = filter
  hoveredPlayer: number | null;
  setActiveTab: (tab: TabId) => void;
  setTeamFilter: (teamId: number | null) => void;
  setHoveredPlayer: (playerId: number | null) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  activeTab: 'shots',
  teamFilter: null,
  hoveredPlayer: null,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setTeamFilter: (teamId) => set({ teamFilter: teamId }),
  setHoveredPlayer: (playerId) => set({ hoveredPlayer: playerId }),
}));
